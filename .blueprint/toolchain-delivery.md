# Toolchain, Native Build dan Delivery

## Platform decision

**Decision baseline:** Expo-managed React Native is the frontend platform; production uses Expo Development Build for development/staging and signed EAS (or equivalent controlled native) builds for release. This is a platform decision, while exact SDK/plugin versions remain FE-01 until compatibility evidence exists.

Expo Go is explicitly excluded from production acceptance. It may be used only for UI/prototype flows that do not require native modules. LiveKit, WebRTC, microphone/camera, secure storage, native browser auth and audio session testing require a development/release binary.

## Baseline aktual

`package.json`: Expo ~51.0.0, React Native 0.74.5, React 18.2, TypeScript ~5.3.3; Bun lock tersedia. Script awal start/android/ios/web/type-check. Web script ada tetapi React Native Web/react-dom belum terdaftar sebagai dependency; web build bukan kemampuan terverifikasi.

Jangan memasang SDK terbaru secara buta pada Expo lama. FE-01 menentukan apakah mempertahankan versi teruji atau upgrade Expo/React Native sebagai pekerjaan tersendiri. Lockfile diperbarui bersama package.json setelah compatibility spike.

## Dependency target (belum terpasang)

| Kebutuhan | Kandidat / verifikasi wajib |
|---|---|
| Native LiveKit | `@livekit/react-native`, `@livekit/react-native-webrtc`, `livekit-client`; config plugin yang disyaratkan versi terpilih |
| Expo custom native runtime | `expo-dev-client`, prebuild/CNG dan development build |
| Navigation | React Navigation native/native-stack/bottom-tabs, screens/safe-area dependencies yang kompatibel |
| Server cache | TanStack Query, cancellation dan per-user cache lifecycle |
| Schema validation | Validator runtime seperti Zod atau generated schema validator berdasarkan OpenAPI final |
| Native auth/storage | SecureStore, system-browser/deep-link modules setelah FE-02 |
| PDF/media | DocumentPicker, FileSystem/checksum/upload, audio-recording package yang cocok Expo terpilih |
| SSE | Native-compatible transport dengan headers/replay/cancel, dibuktikan spike |
| UI test | React Native Testing Library + runner Expo-compatible; E2E native sesuai CI device strategy |

`bunx expo install` dipakai untuk dependency Expo yang sesuai SDK setelah pilihan disetujui. Versi LiveKit/plugin harus dicocokkan dengan vendor compatibility dan native build; tidak dikunci dengan angka tebakan di blueprint.

## Expo Go versus development build

Expo Go hanya cukup untuk bagian prototipe yang dependency-nya didukung. LiveKit React Native membutuhkan native WebRTC modules dan tidak divalidasi dengan Expo Go. Development build memerlukan Android/iOS application identifiers, permissions dan plugin config yang benar. EAS/remote macOS build atau Mac lokal diperlukan untuk iOS; Linux tidak membuktikan iOS runtime.

Target binary matrix yang wajib dibuktikan:

| Capability | Expo Go | Development Build | Signed release build |
|---|---:|---:|---:|
| Home/Chat mock tanpa native module | Preview | Yes | No mock path |
| Secure auth/deep link | No production evidence | Required | Required |
| Microphone/camera/audio session | Not accepted | Required | Required |
| LiveKit voice/video | Not supported for acceptance | Required | Required |
| Background/lock-screen media | Not assumed | Only after policy/native evidence | Only after release gate |

Native bootstrap/register globals/audio-session lifecycle mengikuti SDK terpilih, bukan copy contoh versi lain. Verifikasi mic/camera, route audio, mute, track cleanup dan reconnect di perangkat fisik. Changes native/plugin memerlukan rebuild binary, bukan OTA JavaScript saja.

## CI target

1. Install `bun install --frozen-lockfile` dengan versi Bun disepakati dan dipin pada milestone toolchain.
2. `bun run type-check`, `bun run check:env`, validasi JSON/blueprint links dan diff whitespace.
3. Lint/format dan unit/component/contract tests setelah tooling F1 terpasang; jangan mengklaim script belum ada sebagai check lulus.
4. Generate/verify DTO terhadap OpenAPI backend version; fail pada drift/breaking schema tanpa migration.
5. Bundle target platform, inspect no backend secrets/mock production driver, build native preview.
6. Staging integration/e2e: auth, payment sandbox, signed upload, chat replay, call/podcast network fault.
7. Release approval berdasarkan evidence FE decisions; publish store/OTA sesuai native runtime compatibility dan rollback plan.

## Environment/channel dan rollback

Development mock adalah preview UI. Development API memerlukan backend test nyata. Staging menggunakan API/provider/payment sandbox yang ditentukan. Production memakai domain/catalog/rates approved dan mock false.

Runtime version/change policy, update channel dan signing ditentukan FE-08. Rollback frontend hanya ke bundle compatible native runtime dan backend schema; rollback UI tidak menghapus job/payment/session server. Fitur bermasalah dinonaktifkan lewat server admission/readiness sambil reconciliation tetap berjalan.

## Observability target

Correlation request_id, build/native runtime, screen capability, connection transition dan sanitized error. Ukur startup, request latency, stream delay, room join/reconnect, failed permission dan memory leaks. Target SLO/alert threshold dari keputusan produk/operasi, bukan angka arbitrary. Full transcript/body tidak dikirim telemetry.
