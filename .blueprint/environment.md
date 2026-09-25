# Environment Frontend

## Expo build channels

Konfigurasi environment dipasangkan dengan jenis binary, bukan hanya mode JavaScript:

| Channel | Binary | Mock | LiveKit/native |
|---|---|---|---|
| `development` | Expo Go untuk UI terbatas atau Development Build untuk fitur native | Boleh jika eksplisit | Hanya Development Build |
| `staging` | Signed internal/development build dari EAS atau pipeline setara | Dilarang | Wajib melalui native binary |
| `production` | Signed store/release build | Dilarang | Wajib melalui native binary |

`EXPO_PUBLIC_APP_ENV` tidak boleh dipakai untuk mengubah entitlement atau menggantikan build profile. Backend tetap menentukan readiness. Ketidaksesuaian environment dengan binary harus terlihat pada diagnostics dan memblokir feature native, bukan diam-diam jatuh ke Expo Go/mock.

## Prinsip

Semua `EXPO_PUBLIC_*` dapat dibaca pengguna dari bundle. Prefix public bukan secret store, termasuk pada EAS environment yang diberi label secret. Frontend hanya memerlukan konfigurasi aplikasi/API publik; credential vendor tetap backend.

`.env` lokal ignored, `.env.example` template tracked. Loader membaca setiap variable menggunakan static `process.env.EXPO_PUBLIC_*` agar Expo CLI dapat inline. Tidak memakai dynamic `process.env[key]`, destructuring atau default tersembunyi. Nilai invalid menghasilkan `EnvironmentConfigError` dengan code `ERR_ENV_CONFIG` dan nama variable tanpa mencetak nilainya.

## Key yang diimplementasikan

| Key | Validasi | Kegunaan |
|---|---|---|
| `EXPO_PUBLIC_APP_ENV` | development / staging / production persis | Policy environment aplikasi, terpisah dari NODE_ENV |
| `EXPO_PUBLIC_USE_MOCK_DATA` | true / false persis; true hanya development | Memilih driver, bukan fallback network |
| `EXPO_PUBLIC_MOCK_LATENCY_MS` | Integer safe nonnegatif | Latency fixture lokal eksplisit |
| `EXPO_PUBLIC_API_BASE_URL` | Absolute http(s), tanpa userinfo/query/fragment, path `/v1`, tanpa trailing slash; HTTPS di staging/production | Public API versioned base |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | Integer safe positif | Timeout HTTP biasa; bukan deadline call atau stream |
| `EXPO_PUBLIC_APP_NAME` | String nonblank, tanpa surrounding whitespace | Label runtime |
| `EXPO_PUBLIC_APP_VERSION` | String nonblank, tanpa surrounding whitespace | Versi runtime; CI harus cocok dengan Expo/package metadata |

Semua key wajib bahkan saat mock agar konfigurasi lengkap dan salah ketik terdeteksi. Contoh `750` ms mock dan `15000` ms HTTP adalah nilai prototipe lokal eksplisit, bukan SLO produksi. `.env.example` memakai `http://localhost:8000/v1` sebagai alamat backend development, bukan klaim API sudah berjalan. Mock true membuat Home/Chat prototipe tidak bergantung backend.

## Setup lokal

1. Salin `.env.example` menjadi `.env` jika belum ada; pertahankan nilai lokal yang sudah diisi.
2. Gunakan lockfile: `bun install --frozen-lockfile` jika dependency belum terpasang.
3. `bun run type-check` dan `bun run check:env`.
4. `bun run start`; pilih device/platform yang didukung prototipe. Mode mock tidak membuktikan auth/LiveKit/API live.
5. Setelah adapter/backend tersedia, ubah `EXPO_PUBLIC_USE_MOCK_DATA=false` dan isi API URL reachable dari perangkat. Saat ini DI akan menolak karena API drivers belum dibuat.

Perubahan EXPO_PUBLIC memerlukan reload penuh/rebundle; variabel bukan remote runtime secret. Untuk cache bundler stale: `bunx expo start --clear`. Jangan memakai NODE_ENV untuk memilih development/staging/production aplikasi; Expo export dapat mengatur mode build sendiri.

## Device networking

| Target | API base development contoh | Catatan |
|---|---|---|
| Web/browser pada host backend | `http://localhost:8000/v1` | Origin/CORS/cookie backend harus sesuai |
| Android emulator standar | `http://10.0.2.2:8000/v1` | localhost emulator adalah emulator sendiri |
| iOS simulator pada Mac backend | `http://localhost:8000/v1` | Host backend harus benar-benar Mac tersebut |
| Device fisik | `http://<IP-LAN-host>:8000/v1` atau HTTPS dev domain | Backend bind/interface/firewall dan OS network policy harus cocok |
| Staging/production | HTTPS domain deployment nyata + `/v1` | Jangan memakai URL produksi tebakan |

HTTP development bisa memerlukan cleartext/ATS exception yang hanya berlaku build development; konfigurasi native diputuskan FE-01. Tunnel Expo bundler tidak otomatis membuka API atau UDP/TURN LiveKit. Reachability LiveKit/WSS/ICE/TURN diuji terpisah.

## Konfigurasi yang bukan frontend env

- Tidak ada `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, long-lived room token, `LANGFLOW_API_KEY`, `CALLCRAFT_*`, `TTS_API_KEY`, Gemini/OpenAI admin key, Xendit secret, Google client secret, SQL/Redis/Astra/S3 credential.
- LiveKit public URL ditargetkan berasal join-token response backend, sehingga room/deployment binding tunggal. Jangan menambahkan `EXPO_PUBLIC_LIVEKIT_TOKEN` atau mint JWT di app. Wire response URL masih perlu FE-05.
- Provider/model/voice IDs, plan/pricing, duration/quota/limits berasal registry/policy backend, bukan env client.
- User BYOK dikirim ke backend sebagai input write-only; tidak disimpan ke `.env` atau EAS.
- Signing keystore/provisioning, EAS credentials dan service-account build disimpan sistem build; tidak menjadi EXPO_PUBLIC.

## Staging / production

Inject tujuh key yang sama melalui build environment, dengan mock false dan API HTTPS. Loader memvalidasi syntax/policy dasar; deployment gate terpisah harus memverifikasi allowlisted origin, health, auth, DTO compatibility dan runtime version. HTTPS saja bukan bukti endpoint production benar.

Production build tidak boleh dibuat dengan `expo start`, Expo Go, atau development client yang tidak signed sesuai release policy. EAS profile/build command, bundle identifier/package name, signing credentials, permissions, app links/schemes dan runtime/update channel wajib direview sebelum release.

Belum ada `eas.json`, app.config dynamic atau profile signing yang disahkan. Bundle ID, Android package, scheme/universal links, project ID, runtime/update channel, permissions copy dan background audio ditetapkan FE-01/02/08 lalu diimplementasikan bersama build. Jangan mengisi identifier/domain asal agar build terlihat lengkap.

`app.json` saat ini tetap metadata Expo build, env name/version untuk runtime. CI release wajib memeriksa keduanya selaras. Build env baru hanya boleh ditambahkan bersamaan consumer, validation, template dan dokumentasi; template tidak boleh mengiklankan flag yang belum digunakan.
