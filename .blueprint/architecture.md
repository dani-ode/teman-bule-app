# Arsitektur Frontend

## Platform runtime

Expo adalah platform frontend resmi. JavaScript/TypeScript berjalan dalam aplikasi React Native Expo; native capabilities dikemas melalui Expo Development Build/EAS Build. `App.tsx` adalah composition root JavaScript, sedangkan konfigurasi native berasal dari Expo app config/config plugins dan build profile yang akan ditambahkan setelah FE-01.

- **Expo Go:** hanya preview UI/prototype untuk dependency yang tersedia di Expo Go.
- **Development Build:** environment wajib untuk development fitur native seperti LiveKit, WebRTC, audio session, camera, secure storage dan deep links.
- **EAS/internal signed build:** jalur staging/production target, dengan identifiers, permissions, signing, runtime version dan update channel yang disahkan.
- **Web:** bukan target production default; membutuhkan dependency/acceptance terpisah dan tidak boleh dianggap setara dengan iOS/Android.

Native modules tidak boleh diakses langsung dari screen. Bungkus melalui infrastructure port dan lifecycle adapter agar cleanup, permission, OS interruption dan test doubles terkontrol.

## Struktur target dan dependency

Pertahankan struktur existing; tambahkan modul bertahap. Daftar ini adalah target, bukan daftar file yang sudah ada.

```text
src/
  config/                 env validation, build/runtime config terpisah
  core/
    di/                   composition root, service lifecycle per session
    errors/               typed config/transport/domain error mapping
    types/                client result dan generated DTO references
    navigation/           typed routes, auth/main stacks, deep-link routing
    auth/                 access-token memory, session coordinator
    network/              request transport, refresh single-flight, SSE
    storage/              native secure storage adapter, scoped cache
    realtime/             room controller, event decoder/reducer
    observability/        redaction, correlation dan diagnostics opt-in
  domain/
    user/ chat/ lesson/   existing entities/interfaces
    auth/ catalog/ billing/ media/ call/ podcast/ vocabulary/ toefl/ jobs/
  services/
    api/                  HTTP adapters + wire DTO mapping
    realtime/             LiveKit adapter implementing domain port
    mock/                 explicit dev/test fixtures only
  features/
    auth/ lessons/ chat/ call/ podcast/ user/
    billing/ ai-settings/ vocabulary/ toefl/
  ui/                     shared components, theme, localized copy
  data/mock/              prototype fixtures; bukan production truth
```

Source dependency: presentation/application → domain; services/infrastructure → domain. Composition root mengetahui implementasi keduanya. Interface media/realtime tidak mengekspos SDK `Room` ke screen/domain; expose command, snapshot dan typed subscriptions yang dapat di-dispose.

## State ownership

| State | Pemilik / persistence |
|---|---|
| User profile/catalog/history/wallet/jobs | Backend; query cache per authenticated user, invalidation setelah mutasi/event |
| Input form dan selected tab | Screen/local UI state |
| Session auth | Coordinator; access token memory, refresh native secure storage hanya setelah kontrak FE-02 |
| Room connection, local track, audio session | Satu realtime controller per active session; cleanup idempoten |
| Delivered transcript/checkpoint | Backend; transient event memperbarui UI sampai refetch |
| Chat deltas | Bounded stream buffer; final reconcile ke persisted message |
| Quote/budget/rate | Backend snapshot; UI hanya menampilkan dan mengirim batas yang disetujui |
| BYOK plain key | Input transient; tidak masuk global store/cache/disk |
| Facts, summaries, assessment | Backend eventual; tidak diproduksi dari heuristik client |

Server cache target: TanStack Query (proposal FE-01); existing hooks dimigrasikan bertahap. UI state memakai React state/reducer sampai kebutuhan lebih luas terbukti. Jangan menyimpan seluruh server cache di global state kedua.

## Ports minimum

- `IAuthService`: register/login/refresh/logout dan flow account actions.
- `IUserService`, `ILessonService`, `IChatService`: evolve existing interfaces berdasarkan domain use case dan schema final.
- `ICatalogService`: agents, plans, provider/model capabilities, rates/packages.
- `IBillingService`: wallet, quote, topup/status/ledger, plan revision.
- `IMediaService`: upload admission, binary upload, finalize, scoped download.
- `ICallService` / `IPodcastService`: resource lifecycle melalui HTTP.
- `IRealtimeService`: connect/disconnect, local tracks, typed event subscription; tidak mint token.
- `IJobService`: poll/cancel/retry dengan checkpoint/status URL terotorisasi.
- Vocabulary/TOEFL ports memisahkan read/write deterministik dari AI job.

HTTP services memakai boundary DTO decoder, mapper dan client error envelope. Stream/subscription memerlukan port tersendiri dengan cancellation; aturan legacy semua return `Promise<ApiResponse<T>>` tidak dipaksakan ke infinite stream.

## Lifecycle dan concurrency

- Single-flight refresh mencegah dua refresh memakai token rotasi yang sama. Stale response dari session sebelumnya ditolak dengan session generation.
- Query key mencakup user scope dan resource version jika perlu. Logout/account switch membersihkan cache, stream, media temp, pending private requests.
- Mutation retry mempertahankan operation identity. Unknown outcome direkonsiliasi lewat resource/status, bukan membuat operation baru.
- Chat stream, polling jobs dan room subscriptions memakai abort/dispose; unmount tidak boleh meninggalkan listener atau membuat invocation ulang.
- Auth failure menghentikan private subscriptions. SDK auto-reconnect bekerja dalam grace; terminal HTTP session melarang reconnect baru.
- Tidak ada offline queue untuk paid AI, checkout, join-token atau BYOK. Draft offline hanya setelah retensi/privacy disepakati.

## API versus mock composition

`EXPO_PUBLIC_USE_MOCK_DATA=true` hanya development. Mock services existing tetap sarana prototipe Home/Chat. API mode wajib memiliki semua adapter yang dibutuhkan feature; dependency missing menghasilkan unavailable eksplisit. Jangan mencampur wallet asli dengan percakapan mock dalam satu journey yang terlihat live.

Feature gates kelak berasal readiness/capabilities backend dengan schema FE-03; env client bukan otoritas entitlement. Build yang belum memiliki adapter tidak mengiklankan fitur tersebut sebagai aktif.
