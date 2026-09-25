# FE-01 Proposal: Application Identifiers, Schemes, dan Native Build Setup

> Status: **proposed** (menunggu approval bernama; lifecycle `open → investigating → proposed → approved`).
> Proposal ini **bukan** approval produksi. Identifier di bawah adalah
> **development placeholder** yang diajukan agar build/run dapat berjalan;
> identifier produksi final wajib direview ulang sebelum release
> (`environment.md` baris 69, `toolchain-delivery.md` baris 33).

Tanggal: 25 September 2026 · Penyusun: engineering (peran: Frontend) · Backend terkait: DEC-14.

## Konteks dan requirement sumber

`bun run android` gagal dengan dua error berantai:

1. `Development build: Unable to get the default URI scheme ... make sure the
   expo-dev-client package is installed` — dependency native (SecureStore,
   React Navigation screens/gesture-handler, dan LiveKit nanti) membuat Expo
   CLI beralih dari Expo Go ke development build, tetapi `expo-dev-client`
   belum terpasang.
2. `CommandError: Required property 'android.package' is not found in the
   project app.json` — membuka app di Android (Expo Go maupun development
   build) memerlukan package name.

Rules terkait: R01 (tidak boleh inventing identifier tanpa mencatatnya sebagai
proposal), R03 (konfigurasi eksplisit), `toolchain-delivery.md` baris 20
(`expo-dev-client`, prebuild/CNG), baris 33 (development build memerlukan app
IDs/permissions yang benar), dan `environment.md` baris 69 (identifier wajib
direview sebelum release; jangan mengisi asal agar build terlihat lengkap).

## Pilihan yang dinilai serta konsekuensi

| Opsi | Konsekuensi |
|---|---|
| A. Hanya tambah `android.package` dan tetap Expo Go | Cepat; tetapi auth deep-link, LiveKit, dan fitur native kustom tetap tidak dapat divalidasi (toolchain baris 37–43). Menunda masalah, bukan menyelesaikan. |
| B. Development build: pasang `expo-dev-client` + app IDs + scheme (dipilih) | Membuka jalan validasi auth/deep-link dan LiveKit F6; sesuai target binary matrix. Memerlukan prebuild native sekali (bukan OTA). |
| C. EAS Build cloud penuh sekarang | Overkill untuk iterasi lokal; signing/credentials belum direview (FE-08). Ditunda. |

## Keputusan yang diajukan

Mengadopsi **Opsi B** dengan nilai placeholder development berikut:

| Properti | Nilai diajukan (development) | Catatan produksi |
|---|---|---|
| `android.package` | `id.flyup.temanbule.dev` | Ganti ke `id.flyup.temanbule` (atau domain milik produk) setelah kepemilikan namespace disahkan. |
| `ios.bundleIdentifier` | `id.flyup.temanbule.dev` | Sama; iOS build memerlukan Mac/EAS, tidak dibuktikan dari Linux. |
| `scheme` (deep link) | `temanbule` (sudah ada) | Universal/app links terverifikasi adalah bagian FE-02. |
| `expo-dev-client` | dipasang sebagai dependency | Wajib untuk development build & custom scheme. |
| Namespace `id.flyup.*` | mengikuti domain backend `flyup.id` yang sudah dipakai (`callcraft-api.flyup.id`, MAIL_HOST) | Konsisten dengan aset milik produk; bukan klaim kepemilikan store. |

Alasan: nilai ini konsisten dengan domain milik produk (bukan `com.example`
rekaan), eksplisit ber-akhiran `.dev` agar tidak disalahartikan sebagai
identifier produksi, dan dapat diganti satu kali saat release tanpa migrasi
pengguna karena belum ada build yang dirilis.

## Scope dan ticket terdampak

- F1 (app foundation): membuka `bun run android` / development build lokal.
- F2 (auth): scheme menyiapkan deep-link OAuth/reset/verify (payload FE-02).
- F6 (call): prasyarat native LiveKit build.
- Di luar scope proposal ini: signing credentials, EAS profiles, app links
  terverifikasi, permissions copy, background audio (FE-02/FE-08).

## Bukti reproduksi teredaksi

Perintah gagal (25 Sep 2026): `bun run android` → error #1 lalu #2 di atas.
Setelah perubahan: `bun run type-check`, `check:env`, `check:blueprint` harus
tetap lulus; `bunx expo export --platform android` harus tetap berhasil;
`bunx expo run:android` membutuhkan Android SDK/emulator lokal (dicatat
terpisah, tidak diklaim di sini).

## Perubahan kontrak/config yang diperlukan

- `app.json`: tambah `android.package`, `ios.bundleIdentifier` (placeholder `.dev`).
- `package.json`: tambah dependency `expo-dev-client` via `bunx expo install`.
- Tidak ada perubahan wire contract backend; tidak ada secret di `app.json`.

## Risiko, rollback, dan kondisi peninjauan ulang

- Risiko: identifier `.dev` terlanjur dipakai di build yang dibagikan. Mitigasi:
  akhiran `.dev` eksplisit; review FE-08 wajib mengganti sebelum release.
- Rollback: hapus `android.package`/`ios.bundleIdentifier` dan uninstall
  `expo-dev-client`; navigasi/auth tetap jalan di Expo Go untuk slice non-native.
- Peninjauan ulang wajib: saat FE-02 (deep-link terverifikasi), FE-06
  (LiveKit plugin matrix), dan FE-08 (signing/release) ditutup.

## Persetujuan

| Peran | Nama | Keputusan | Tanggal |
|---|---|---|---|
| Frontend lead | _belum ditunjuk_ | pending | — |
| Realtime/operasi | _belum ditunjuk_ | pending | — |
| Produk (namespace final) | _belum ditunjuk_ | pending | — |

## Addendum A: Pin versi React Navigation (kompatibilitas terbukti)

Temuan lapangan (25 Sep 2026): `@react-navigation/*@7.x` memerlukan
`react-native-screens >= 4.0.0`, sedangkan Expo SDK 51 (RN 0.74.5) menguji
`react-native-screens@3.31.1`. Kombinasi v7 + screens 3.31 menimbulkan
runtime error `TypeError: right operand of 'in' is not an object` di
`SceneView`/`NativeStackView` (Hermes) dan, setelah downgrade, `Invariant
Violation: Tried to register two views with the same name RNSScreenStack`
akibat native/JS mismatch.

Keputusan kompatibilitas (bagian dari FE-01 spike, evidence perangkat):

| Paket | Versi dipin | Alasan |
|---|---|---|
| `@react-navigation/native` | `^6.1.18` | Pasangan terverifikasi screens 3.x / RN 0.74 / Expo SDK 51 |
| `@react-navigation/native-stack` | `^6.11.0` | peer `react-native-screens >= 3.0.0` |
| `@react-navigation/bottom-tabs` | `^6.6.1` | selaras v6 |
| `react-native-screens` | `3.31.1` | versi Expo SDK 51 (`expo install`) |

Evidence: setelah pin v6 + clean rebuild + uninstall app lama + `--clear`
Metro, app `id.flyup.temanbule.dev` berjalan di emulator `Pixel-10-Pro`
dengan log `ReactNativeJS: Running "main"` dan **tanpa** error render.
Upgrade ke React Navigation v7 (atau screens v4) adalah pekerjaan tersendiri
yang harus dibuktikan pada FE-01 lanjutan bersama keputusan upgrade Expo SDK.

Catatan proses: error build pertama `checkDebugAarMetadata` adalah network
read timeout saat Gradle mengunduh AAR — diselesaikan dengan retry (cache
Gradle melanjutkan). Bukan masalah kode.
