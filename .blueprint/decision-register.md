# Keputusan Frontend dan Contract Gates

Semua keputusan di bawah **open**. Pemilik berbasis peran perlu ditunjuk; proposal dokumen bukan approval. Backend DEC references mengacu `../teman-bule/.blueprint/decision-register.md` dari root frontend.

| ID | Keputusan / output | Pemilik | Memblokir | Backend terkait |
|---|---|---|---|---|
| FE-01 | Supported iOS/Android/web, Expo SDK/React Native pin or upgrade, Development Build/EAS profiles, LiveKit/plugin matrix, navigation/query/validation/test libs, Bun pin, app IDs, schemes, signing and native permissions | Frontend + realtime + operasi | F1 dan native media | DEC-14 |
| FE-02 | Native refresh transport, secure storage lifecycle, Google browser→app handoff, verified links, CSRF web, email reset/verify links | Backend + frontend + auth | F2 auth native/web | DEC-02, DEC-05 |
| FE-03 | OpenAPI/DTO, integer wallet encoding, list pagination/history, credential metadata listing, active-session lookup, feature readiness/policy shape, idempotency exceptions/retention, upload/status URL, polling limits | Backend + frontend | API adapter fitur terkait | DEC-03, DEC-12 |
| FE-04 | Chat stream endpoint/transport, auth headers, event ID/replay retention, cancel semantics dan native SSE parser | Backend + frontend | F4 chat streaming | DEC-10, DEC-12 |
| FE-05 | Join-token DTO/URL/expiry binding, room dispatch, SDK events, sender validation, sequence/epoch scope, versioning, transcript checkpoint API, reconnect grace, background/OS audio behavior | Realtime + frontend | F6 call/podcast realtime | DEC-14, DEC-15 |
| FE-06 | PDF size/scan/OCR, podcast target/max/extension, job stage UX, active playback/delete, controls yang tersedia, version conflict policy | Produk + backend + frontend | F5/F7 podcast | DEC-12, DEC-15 |
| FE-07 | Harga/token scale, quote display, Xendit product/checkout return, mobile-store distribution policy dan sandbox evidence | Produk + billing + release | F3 top-up live | DEC-06, DEC-07 |
| FE-08 | Privacy/cache retention, deletion UX, telemetry provider/redaction, accessibility/performance budgets, build/update channels/signing/runtime rollback | Produk + frontend + operasi | Production release | DEC-16 |
| FE-09 | Elean/Willy profile copy/avatar assets, curriculum/TOEFL DTO/rubric, facts correction/consent, bilingual copy | Produk + AI + frontend | Published content/persona UI | DEC-12, DEC-13, DEC-17 |

## Contract packets sebelum coding adapter

Untuk setiap endpoint/event: method/path, request/response JSON Schema, schema version, examples teredaksi, error codes/status, ownership, auth/CSRF, idempotency/version semantics, limits, pagination, cancellation/replay dan compatibility window. Catat status implemented/deployed terpisah dari approved schema.

Spesifik join-token: backend origin/LiveKit URL policy, room/participant binding, expiry, grants, response cache headers, rate limit, expired token recovery dan existing-session rejoin. Spesifik auth: native exchange tidak boleh ditebak dari web cookie design.

## Cara menutup keputusan

`open → investigating → proposed → approved`, kemudian superseded bila berubah. Sertakan reviewer bernama, tanggal, versi SDK/backend/vendor, alternatif, bukti reproduksi teredaksi, tiket terdampak dan rollback. Vendor double/mock tidak menutup compatibility gate. Live/billable test memerlukan opt-in dan budget eksplisit.
