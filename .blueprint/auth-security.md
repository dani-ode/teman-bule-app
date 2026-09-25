# Auth, Storage dan Keamanan Client

## Email dan session

- Register → generic acceptance → email verification → login. Reset/resend tidak mengungkap apakah email terdaftar.
- Backend menerbitkan access JWT pendek dan refresh opaque single-use rotated, revocation family dan auth epoch. Client tidak menganggap decode JWT sebagai otorisasi; backend memvalidasi setiap request.
- Access token di memory. Satu refresh promise untuk semua concurrent 401; setelah refresh, replay hanya jika request aman dan idempotency identity tetap sama.
- Logout mengirim permintaan revoke, menghapus local auth state serta cache privat dan disconnect media. Jika jaringan gagal, bedakan “keluar dari perangkat” dari konfirmasi revoke server.
- Logout-all/password reset invalidates sesi lain sesuai backend; client aktif menangani 401/revocation dengan cleanup.

## Native versus web: gate kontrak

Backend saat ini menentukan refresh cookie HttpOnly/Secure/SameSite untuk **web**, tetapi belum menetapkan native refresh exchange/storage atau Google return protocol.

| Platform | Target | Status |
|---|---|---|
| Web | Access memory, refresh cookie HttpOnly, CSRF/Origin validation, credentials policy eksplisit | Blueprint backend; implementasi belum ada |
| iOS/Android | Access memory; opaque refresh via secure storage adapter seperti Expo SecureStore jika transport native disetujui | Proposal FE-02, tidak diasumsikan backend sudah mengembalikan refresh JSON |
| Google native | System browser ke backend auth; exact allowlisted verified link/app scheme; authenticated one-time handoff jika disetujui | Proposal FE-02; route/payload belum ditetapkan |

Jangan memindahkan web refresh cookie ke JavaScript atau menaruh app/Google token di query URL. Google client secret tetap server-side. Deep link tidak dianggap auth success sampai backend menyelesaikan transaksi; state, nonce, PKCE, expiry/replay dan browser binding milik protokol backend. Email sama tidak auto-link akun. Link memerlukan reauth; unlink tidak boleh menghapus metode terakhir.

## BYOK

Input API key dikirim sekali melalui TLS ke backend dalam create credential request, dengan logging body dinonaktifkan. Field tidak masuk analytics, clipboard otomatis, disk drafts, persisted store atau replay queue. Clear pada sukses/cancel/unmount; client tidak bisa menjamin zeroization memory JavaScript, maka minimalkan lifetime dan copies.

UI hanya menyimpan metadata aman: credential ID, provider, fingerprint, sanitized base URL, status dan capability selection. Verifikasi menampilkan consent kemungkinan biaya provider. Base URL user tetap divalidasi backend terhadap SSRF policy; validasi frontend hanya bantuan UX.

## Media dan privasi

- Mic/camera permission just-in-time; sebelum publish perlu tindakan user dan indikator jelas. Stop tracks saat end/logout/background sesuai policy.
- Raw call audio/video tidak direkam default. Sampling frame vision dan pembuangan frame dilakukan worker, bukan upload background sembunyi dari client.
- PDF/voice note memakai signed scoped upload; jangan menyertakan bearer app ke host storage. Temporary file dihapus setelah selesai/cancel sesuai policy, cleanup recovery saat startup bila diperlukan.
- Signed URL, LiveKit token dan transcript tidak dicatat logs/crash breadcrumbs. Download URL tidak disimpan sebagai permanent identity; refresh berdasarkan media ID setelah expired.
- Render text/markdown tutor dengan link policy yang aman, bukan HTML/script arbitrary. Citation dan tool result tetap untrusted input tervalidasi.

## Cache, deletion dan telemetry

Cache private scoped user/session; account switch wajib menghapusnya. Persist chat/PDF/offline history tidak aktif sampai retensi/consent FE-08 diputuskan. Deletion request menampilkan job progress; acceptance tidak sama dengan semua store sudah terhapus.

Diagnostics minimum: build version, platform, capability, safe error code, request correlation, connection transition dan elapsed metric. Tidak memuat pesan, key, cookie, JWT, signed URL, paper body atau private fact value. DSN/telemetry environment baru hanya ditambahkan bersamaan implementasi/redaction dan policy, bukan secret placeholder di env public.

## Release evidence

Uji refresh concurrency/reuse/revocation, cross-account cache, OAuth replay/deep-link cancellation, no-token URL, permission denial, BYOK redaction, signed upload origin separation serta account deletion recovery. Client-side checks tidak menggantikan IDOR/ownership tests backend.
