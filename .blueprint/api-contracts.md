# API, DTO, Streaming dan Jobs

## Status kontrak

Acuan: backend `api-events.md`. Ini resource/behavior contract desain, belum OpenAPI implementasi. Method/path di bawah bersumber dari blueprint backend; response DTO lengkap, endpoint stream/cancel chat dan native auth harus disepakati dalam FE-02/03/04. Frontend tidak membuat route baru hanya karena UI memerlukannya.

`EXPO_PUBLIC_API_BASE_URL` berakhir `/v1`. Adapter menggunakan resource path relatif seperti `/calls`; jangan menggandakan `/v1`. Health berada di origin `/health/live` dan `/health/ready`, bukan `/v1/health/*`; bukan endpoint entitlement pengguna.

## Resource map

| Capability | Kontrak relatif terhadap `/v1` | Kewajiban client |
|---|---|---|
| Email auth | `POST /auth/register`, `/auth/login`, `/auth/email:verify`, `/auth/email:resend`, `/auth/password:forgot`, `/auth/password:reset`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all` | Generic accepted response tidak mengungkap keberadaan akun |
| Google | `GET /auth/google/start`, `/auth/google/callback`; `POST /me/identities/google:link`, `DELETE /me/identities/google` | Browser/backend protocol, bukan token Google sebagai app JWT |
| Profile | `GET/PATCH /me/profile`; `GET /me/progress`, `/me/assessments`, `/me/facts`; `PATCH/DELETE /me/facts/{id}`; `DELETE /me` | Version, owner scope, deletion job |
| Plan/catalog | `GET /plans`, `GET/PUT /me/plan`, `GET /agents`, `/agents/{id}` | Plan `expected_revision`; IDs katalog aktif |
| Billing | `GET /token-packages`, `/rate-cards/current`, `/me/wallet`, `/me/wallet/ledger`; `POST /billing/topups`, `GET /billing/topups/{id}`; `POST /ai/quotes` | Package version, quote/max spend, saldo final dari server |
| AI config | `GET /ai/providers`, `/ai/models?capability=...`; `POST /me/ai-credentials`, `POST /me/ai-credentials/{id}:verify`, `GET/DELETE /me/ai-credentials/{id}`; `PUT /me/ai-selections/{llm|stt}` | Write-only key, filtered model, provider/owner match |
| Practice | `GET /practice/categories`; `POST/GET /practice/sessions`; `GET /practice/sessions/{id}`; `POST /practice/sessions/{id}/messages`, `POST /practice/sessions/{id}:complete` | agent/category ID, text/media ref, client_message_id |
| Vocabulary | `GET/POST /vocabulary`, `GET/PATCH/DELETE /vocabulary/{id}`, `POST /vocabulary/{id}/reviews` | Cursor, normalized lemma, version/review state |
| Learn | `GET /courses`, `/lessons/{id}`; `PUT /learning-progress/{contentVersionId}`; `POST /learn/assist` | Published content version, expected version |
| Media | `POST /media/uploads`, `POST /media/{id}:complete`, `GET /media/{id}/download-url` | Purpose/size/checksum, signed URL expiry |
| TOEFL | `GET /toefl/tests`; `POST/GET /toefl/attempts`; `PUT /toefl/attempts/{id}/submissions/{questionRef}`; `POST /toefl/attempts/{id}:submit`; `GET /toefl/attempts/{id}` | Rubric/version, evaluated bukan accepted |
| Call | `POST /calls`, `GET /calls/{id}`, `POST /calls/{id}:join-token`, `POST /calls/{id}:end` | mode voice/video, agent_id, budget |
| Podcast | `POST/GET /podcasts`; `GET/PATCH/DELETE /podcasts/{id}`; `POST /podcasts/{id}/sources`, `POST /podcasts/{id}:generate`, `POST /podcasts/{id}:regenerate`; `GET /podcasts/{id}/segments` | Media ID, target duration/budget, immutable script version |
| Playback | `POST /podcasts/{id}/playbacks`; `GET /podcast-playbacks/{id}`; `POST /podcast-playbacks/{id}:join-token`, `POST /podcast-playbacks/{id}:end` | New explicit playback, reconnect memakai existing ID |
| Job | `GET /jobs/{id}`, `POST /jobs/{id}:cancel`, `POST /jobs/{id}:retry` | Status/checkpoint, retry admission backend |

Listing credential metadata untuk AI settings belum memiliki collection GET yang eksplisit pada blueprint backend; FE-03 harus menetapkan response/profile projection atau endpoint sebelum UI mengandalkannya. Hal serupa berlaku pagination message history, active-session discovery dan transcript checkpoint retrieval.

## HTTP behavior

- Authenticated requests menggunakan app access token; cookie/CSRF web mengikuti kontrak backend. Redirect response API tidak diikuti sebagai alternate API origin tanpa policy.
- POST domain mutation: satu `Idempotency-Key` per aksi logis. Key + payload sama mereplay hasil; key sama + payload berbeda menghasilkan `409 IDEMPOTENCY_CONFLICT`.
- Retry karena timeout mempertahankan key. Jangan retry otomatis side effect dengan key baru. Auth token-consuming routes/OAuth/vendor webhook memakai protocol replay protection, bukan aturan domain mutation secara buta; FE-03 menyelaraskan pengecualian dengan rules backend yang lebih umum.
- PUT/PATCH menyertakan `expected_version`, kecuali field resource khusus seperti `expected_revision` plan. Conflict → refetch, jelaskan perubahan, konfirmasi aksi baru; tidak overwrite otomatis.
- Create 201; mutation sukses 200/204; pekerjaan panjang 202 dengan job ID/status URL. Decoder menangani 204 tanpa JSON.
- Cursor opaque, `next_cursor`, page size bounded dari kontrak. Jangan mengartikan cursor sebagai offset atau menebak akhir list dari array yang kosong saja.
- Entity ID backend ULID; jangan memakai ID fixture seperti `usr_99812` sebagai request produksi.
- URL download/checkout/status dari response tetap divalidasi. Auth headers tidak ikut ke object storage atau external checkout.

## Error mapping

Wire canonical:

```json
{"error":{"code":"INSUFFICIENT_TOKENS","message":"Saldo token tidak cukup.","request_id":"<server-correlation>","details":[]}}
```

| HTTP | UX / recovery |
|---|---|
| 401 | Refresh satu kali lewat coordinator; revoked/failed refresh → login, clear session |
| 403 / 404 | Permission atau private resource unavailable; jangan bocorkan resource owner lain |
| 402 | Tampilkan saldo/budget dan top-up; tidak beralih ke provider lain |
| 409 | Refetch version atau tampilkan busy/unknown-outcome conflict |
| 413 / 422 | Validasi media/input/capability; koreksi input tanpa replay operation baru otomatis |
| 429 | Respect server retry guidance; bounded retry untuk read, tanpa auto-resubmit paid work |
| 502 / 503 | Dependency invalid/unavailable; pesan aman + request_id |
| Offline / timeout | Bedakan request belum terkirim dengan outcome unknown jika transport dapat membuktikannya; selain itu reconcile |

`details` wire adalah array; client existing memakai optional record. Buat mapper/typed detail schema, jangan cast. Pertahankan `request_id` server untuk support. Telemetry tidak merekam body/header/credential atau signed URL. Local config error memakai kode tersendiri dan nama variable saja.

## SSE chat

Event semantik backend: `started`, `text_delta`, `tool_started`, `tool_completed`, `usage_updated`, satu terminal `completed|cancelled|failed`. Envelope menyertakan request/message/session, sequence dan schema_version.

Transport subscription, event ID encoding, cancellation route dan replay retention masih FE-04. Tidak diasumsikan browser EventSource bekerja di React Native atau mendukung Authorization headers. Spike memilih library/parser yang kompatibel Expo development build serta streaming proxy backend.

Client menyimpan latest processed event ID, dedupe sequence, memverifikasi session dan version, menggabungkan delta secara bounded. Reconnect dengan Last-Event-ID hanya melanjutkan stream operation yang sama. Replay expired → fetch persisted messages/status; tidak POST ulang pesan. Terminal duplicate diabaikan berdasarkan identity; terminal conflict memicu refetch dan diagnostics.

## Job polling

State desain backend: `pending`, `running`, `succeeded`, `retry_scheduled`, `reconciliation_required`, `failed`, `cancelled`. `reconciliation_required` bukan failed dan bukan izin memulai ulang invocation. Mapper mengikuti schema publik approved; jangan mengekspos kolom SQL langsung atau menyamakan state job dengan TOEFL attempt (`evaluation_failed`).

Simpan job ID/resource ID, bukan vendor job secret. Interval/backoff/max elapsed ditetapkan FE-03, bukan angka tersembunyi. Pause polling saat app background; refetch saat foreground. Failed/cancelled berbeda dari succeeded. HTTP 202 saat retry/cancel bukan bukti aksi selesai. Stop pada terminal dan invalidate resource terkait; unknown schema/state menjadi contract error yang terlihat.
