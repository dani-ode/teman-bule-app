# TemanBule Frontend Blueprint

> Versi 1.1.0 · 25 September 2026 · Bahasa Indonesia.
> Spesifikasi target implementasi, bukan pernyataan seluruh fitur sudah tersedia.
> Repository: `/home/dani/Projects/teman-bule-app`.
> Acuan backend: `/home/dani/Projects/teman-bule/.blueprint` versi indeks 3.2.0.

## Platform frontend yang mengikat

Frontend production menggunakan **Expo + React Native + TypeScript** sebagai platform utama. Target runtime adalah Android dan iOS melalui Expo Development Build/EAS Build. Expo Go hanya untuk prototipe UI yang tidak membutuhkan native module; Expo Go bukan acceptance environment dan bukan artefak production. Web adalah target tambahan yang belum menjadi release target sampai dependency dan acceptance web disahkan.

Baseline repository saat ini adalah Expo SDK 51. Versi Expo/React Native/LiveKit yang production-supported harus dikunci setelah FE-01 compatibility spike; tidak boleh di-upgrade atau dipin hanya berdasarkan versi terbaru.

## Status aktual

- Expo SDK 51, React Native 0.74.5, React 18.2, TypeScript strict, Bun dan `bun.lock` sudah tersedia. Ini baseline kode, bukan bukti compatibility production.
- `App.tsx` menggunakan dua tab lokal Home/Chat; domain user/chat/lesson, hooks, UI theme dan mock services sudah ada.
- Auth, API services, navigation stack, LiveKit, upload, pembayaran, Podcast, Profile lengkap dan TOEFL belum diimplementasikan.
- Backend masih target desain dengan draft kontrak dan adapter Python persiapan; OpenAPI aplikasi, executable flows dan runtime gateway belum tersedia menurut blueprint backend.
- Pekerjaan blueprint ini menambahkan konfigurasi environment tervalidasi. Mode mock lokal tetap eksplisit untuk menjalankan prototipe. Memilih mode API saat ini menghasilkan error karena driver belum tersedia.

## Indeks / urutan baca

| Dokumen | Isi |
|---|---|
| [engineering-rules.md](engineering-rules.md) | Rules production mengikat; discovery melalui root AGENTS.md |
| [backend-alignment.md](backend-alignment.md) | Audit korelasi sumber backend, temuan, state semantics dan drift validation |
| [production-readiness.md](production-readiness.md) | Release gates, bukti wajib, operational runbooks dan status blocked |
| [governance.md](governance.md) | Rules mengikat, prioritas acuan, audit gap dan pengelolaan perubahan |
| [product-navigation.md](product-navigation.md) | Lima tab, journey, screen inventory, aksesibilitas dan acceptance produk |
| [architecture.md](architecture.md) | Layer, ownership state, directory target, lifecycle dan dependency |
| [api-contracts.md](api-contracts.md) | Endpoint map, auth transport, DTO, idempotency, error, SSE dan jobs |
| [auth-security.md](auth-security.md) | Session, native/web auth, BYOK, media privat, storage dan redaction |
| [livekit-realtime.md](livekit-realtime.md) | Alur direct client, agent worker, RAG/memory, reconnect, permissions dan video |
| [podcast.md](podcast.md) | PDF → naskah → indexing → playback interaktif |
| [billing-provider.md](billing-provider.md) | VIP/Advance, wallet, quote, Xendit, katalog dan plan switch |
| [environment.md](environment.md) | `.env`, `.env.example`, validasi, device networking dan environment deployment |
| [toolchain-delivery.md](toolchain-delivery.md) | Expo native development build, paket target, CI/CD dan release |
| [mcp-boundaries.md](mcp-boundaries.md) | MCP yang ditemukan, batas frontend/backend dan gap konfigurasi |
| [implementation-plan.md](implementation-plan.md) | Milestone, backlog dan Definition of Done |
| [implementation-status.md](implementation-status.md) | Status aktual integrasi backend, evidence dan blocker |
| [testing-acceptance.md](testing-acceptance.md) | Verifikasi per fitur, failure matrix dan evidence |
| [decision-register.md](decision-register.md) | Kontrak terbuka dan blocker aktivasi |

## Batas otoritas

Frontend mengelola tampilan, input, permissions perangkat, koneksi media dan cache UI. Backend memegang autentikasi, ownership, state sesi/job, admission, harga, saldo, usage, provider resolution dan persistence. LiveKit mengangkut audio/video/data; realtime worker adalah AI participant yang memakai backend context dan provider secara server-side.

```text
Frontend ── HTTPS ──> API backend ──> SQL / outbox / durable workers
    │                        │                          │
    │ join token             │                     Langflow
    ▼                        │                 ingestion / memory
 LiveKit <────────> realtime worker ──> STT / LLM / ElevenLabs
                            │
                            ├─> authorized RAG/context backend
                            └─> CallCraft ──> internal domain API
```

## Cara memakai blueprint

Rules utama: root `AGENTS.md` → `engineering-rules.md`. `docs/rules/` merupakan arsip prototipe yang telah digantikan. Jalankan `bun run check:blueprint` dengan repository backend tersedia untuk mendeteksi drift sumber kontrak; lihat `backend-alignment.md` dan `backend-contract-evidence.json`.

1. Mulai dari status aktual; jangan memperlakukan target layout atau endpoint sebagai implementasi aktif.
2. Pilih ticket di implementation plan, cek decision terkait, sepakati schema dengan backend sebelum API adapter.
3. UI/mock fixture harus berlabel development/test; kegagalan API tidak boleh berubah menjadi jawaban mock.
4. Simpan semua spesifikasi baru dalam `.blueprint/` dan tautkan di indeks ini.
5. Perubahan wire contract, biaya atau lifecycle diperbarui bersama acuan backend dan fixture terverifikasi.

Untuk menjalankan prototipe: ikuti [environment.md](environment.md). Untuk penjelasan rinci konfirmasi LiveKit: [livekit-realtime.md](livekit-realtime.md).
