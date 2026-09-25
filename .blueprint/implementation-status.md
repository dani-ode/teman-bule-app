# Status Implementasi Frontend

> Dokumen hidup; mencatat apa yang sudah terhubung ke backend nyata versus
> yang masih menunggu keputusan/kontrak. Bukan klaim production readiness —
> seluruh gate di `production-readiness.md` tetap berlaku.

Tanggal pembaruan: 25 September 2026.

## Yang sudah terimplementasi (F1, F2, sebagian F4)

- **Foundation (F1):** React Navigation (native-stack + bottom-tabs), typed
  routes (`src/core/navigation/types.ts`), deep-link config, DI composition
  root, TanStack Query per-session cache, typed `ClientError`, HTTP transport
  dengan decoder error envelope backend + pemetaan status → kind, idempotency
  key scope, access-token memory store, refresh single-flight coordinator,
  refresh token di `expo-secure-store`.
- **Wire DTO:** skema Zod untuk setiap response backend yang dipakai
  (`src/services/api/dto/`), didekode dari `unknown` di boundary (R02).
- **API adapters:** auth, account (profile/plan/wallet/BYOK/deletion),
  practice (chat), vocabulary, learning, TOEFL, calls, podcasts
  (`src/services/api/`). Adapter memetakan wire DTO → domain.
- **Auth (F2):** Login/Register/VerifyEmail/ForgotPassword/ResetPassword/
  OAuthReturn screens; bootstrap session; logout/logout-all dengan pembersihan
  cache per-user.
- **Lima tab (F4 parsial):** Home (daftar kursus + detail materi + progres),
  Chat (buat sesi + percakapan dengan status pesan pending/persisted/gagal +
  kirim ulang), Call (setup dengan state unavailable saat realtime tertutup),
  Podcast (buat + detail dengan state unavailable), Profile (hub + edit
  profil read-only, pilihan plan, wallet, pengaturan AI BYOK write-only,
  vocabulary + review, TOEFL, keamanan akun).

## Terverifikasi terhadap backend lokal (evidence)

Backend dijalankan via Docker Compose (Postgres/Redis/API), migrasi `alembic
upgrade head`, katalog development di-seed idempoten (plans vip/advance +
policy published, agent Elean/Willy + version published, 6 practice
categories), user dev diverifikasi manual.

Perintah dan hasil (25 Sep 2026):

- `bun run type-check` → lulus.
- `bun run check:env` → lulus.
- `bun run check:blueprint` → lulus (18 dok, 13 sumber backend pinned).
- `bunx expo export --platform android` → bundle 984 modul sukses.
- Alur HTTP live: register 202 → login 200 (access+refresh) → GET
  `/me/profile` 200 → GET `/me/plan` 200 → POST `/practice/sessions` 201 →
  POST message 201 → GET messages 200 → `:complete` 200 → POST `/vocabulary`
  201 → GET `/vocabulary` 200 → GET `/courses` 200 → GET `/me/progress` 200 →
  POST `/calls` 201 → `:end` (`user_hangup`) 200 → POST `/podcasts` 201.
- Refresh rotation: reuse refresh token lama → `UNAUTHENTICATED` (family
  dicabut), membuktikan single-flight frontend adalah satu-satunya pola yang
  benar.
- `POST /calls/{id}:join-token` → **503 FEATURE_UNAVAILABLE** (menunggu
  DEC-14), ditampilkan UI sebagai state unavailable eksplisit.

## Blocker / gap yang tercatat (bukan diakali)

| Gap | Dampak | Gate |
|---|---|---|
| `GET /practice/categories`, `/agents` belum diekspos backend | ChatHome meminta ID kategori manual; tidak ada hardcode seed ID sebagai kebenaran | FE-03 |
| `GET /courses` tidak mengembalikan struktur unit→lesson; hanya ada `GET /lessons/{id}` | CourseDetail menampilkan state kontrak-daftar-belum-ada | FE-03 |
| `PATCH /me/profile` belum diekspos | EditProfile read-only + state eksplisit | FE-03 |
| Daftar podcast (`GET /podcasts`) belum diekspos | Library menampilkan state eksplisit, bukan daftar rekaan | FE-03 |
| Katalog tes TOEFL (`GET /toefl/tests`) belum diekspos; perlu seed `toefl_test_versions` | Attempt dimulai dari ID versi tes manual | FE-03 + seed |
| LiveKit join-token | Call/Podcast realtime unavailable | DEC-14/FE-05 |
| Xendit checkout adapter | Top-up tidak aktif; wallet 404 sampai top-up pertama | DEC-07/FE-07 |
| Media storage signed URL | Unggah PDF/voice note tidak aktif | DEC-15 |
| AI reply (Langflow/CallCraft) | Pesan user tersimpan durable; tidak ada balasan AI palsu di UI | DEC-10/11 |
| Google native handoff | OAuthReturn mengarah ke system browser + restore; native exchange belum final | FE-02 |

## Keputusan implementasi yang diambil

- **Navigasi:** React Navigation dipakai (proposal FE-01), menggantikan dua
  tab manual. Struktur: Root → Auth stack / Main 5 tab, masing-masing tab
  native-stack sendiri.
- **Server cache:** TanStack Query (proposal FE-01) dengan `QueryClient` per
  sesi yang dibersihkan saat logout/account switch.
- **Mock prototype lama dihapus:** mock Home/Chat (HomeScreen/ChatScreen +
  Mock*Service + mockData.json) digantikan integrasi API nyata. DI tidak
  mengimpor mock secara statis, sehingga mock tidak masuk release bundle
  (menutup temuan AUD-06 untuk kode baru). Mode `EXPO_PUBLIC_USE_MOCK_DATA`
  saat ini melempar error eksplisit karena seluruh slice yang di-scope
  memakai API.
- **Call end_reason:** frontend memakai enum backend otoritatif
  (`user_hangup`, `agent_completed`, `low_balance`, `balance_exhausted`,
  `error`, `timeout`, `admin`), bukan literal rekaan.
