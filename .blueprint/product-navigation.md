# Produk, Navigasi dan UX

## Navigation target

Root: bootstrap konfigurasi → pemulihan session → auth stack atau main stack. Pilihan target adalah typed React Navigation bottom tabs + native stacks (proposal FE-01; belum dipasang). `App.tsx` menjadi composition root/providers ketika implementasi dimulai.

```text
Auth: Login / Register / VerifyEmail / ForgotPassword / ResetPassword / OAuthReturn
Main tabs:
  Home     → Course → Lesson → Exercise/Quiz → LearningAssistant
  Chat     → SessionList → AgentCategoryPicker → Conversation → VocabularyDetail
  Call     → CallSetup → ActiveCall → CallSummary
  Podcast  → Library → Create/Upload → Detail/Generation → LivePlayback
  Profile  → EditProfile / Progress / Assessments / MemoryFacts / Vocabulary
           → TOEFLList / Attempt / Result / History
           → Plan / Wallet / Topup / Ledger / AISettings / AccountSecurity
```

Active call/playback controller hidup di atas screen stack. Pindah tab tidak otomatis membuat session baru atau mengakhiri sesi. Logout/reset account membatalkan request, disconnect media, dan menghapus cache user. Tidak ada token, key atau isi PDF pada route params; kirim resource ID saja.

## Journey dan acceptance per tab

### Home

- Load course/unit/lesson published dan progress backend; render loading, empty, unavailable dan retry secara terpisah.
- Lesson memiliki video/reading/grammar/quiz sesuai published content version. Published version terkunci selama pengerjaan; simpan progress memakai expected version.
- AI assistance mengirim referensi versi konten + pertanyaan; tampilkan citation dan status gagal yang jelas. Membaca materi tidak mensyaratkan saldo positif.
- Streak/XP/daily goal pada mock tidak dianggap field backend final sebelum FE-03 diselesaikan.

### Chat

- Masuk tab langsung ke daftar/halaman chat, bukan landing pemasaran. Memilih agent aktif Elean/Willy dan kategori dari backend sebelum membuat session.
- Daftar kategori seed backend: daily conversation, grammar, pronunciation, job interview, travel, free talk; UI mengambil label/ID katalog, tidak mengunci ID seed dalam kode.
- Pesan: local pending → accepted/streaming → persisted/failed/cancelled. `client_message_id` tetap pada retry pesan yang sama; temporary ID dipetakan ke server ID.
- Respons progressive, koreksi, citation, tool outcome terverifikasi dan history cursor. Jangan tampilkan “tersimpan” hanya berdasarkan teks LLM.
- Voice note: izin mic → rekam lokal sementara → upload/finalize → kirim media ref → transcription/response. Failure STT tidak diam-diam berubah menjadi input teks rekaan.
- Vocabulary save/review dapat diakses dari pesan dan Profile, terikat resource sumber bila tersedia.

### Call

- Setup memilih voice/video, agent, status konfigurasi plan dan batas budget. Tampilan saldo/rate dari backend.
- Mic/camera diminta sesuai mode; kamera tidak diminta untuk voice. Tampilkan preview kamera lokal sebelum publish video.
- Active UI: connecting/listening/thinking/speaking/reconnecting/ending, mute, camera switch/on-off, output audio sesuai platform, end, transcript dan reason penutupan.
- Video AI berupa suara dengan persona indicator; tidak menjanjikan video/avatar AI.
- Tombol end meminta backend mengakhiri sesi dan melepas media lokal. Jika request gagal, tampilkan pending reconciliation; jangan menganggap settlement selesai.

### Podcast

- Library cursor, judul/status, source dan generation progress, retry yang aman, edit judul versioned, delete async bila ditentukan kontrak.
- PDF dipilih privat, pengguna melihat limits/error parser. Generate dengan target duration yang diizinkan dan quote sebelum admission.
- Pisahkan script readiness dari indexing readiness serta kelayakan playback saat ini. `ready` script tidak cukup untuk semua provider/plan.
- Playback menampilkan speaker Elean/Willy, transcript/citation, progress authoritative, mic, status interupsi/resume dan end reason.
- Penjelasan lengkap: [podcast.md](podcast.md).

### Profile

- Edit profil, progres/assessment eventual, vocabulary, facts dengan provenance/confidence dan koreksi/hapus sesuai kontrak.
- TOEFL ada di Profile: pilih tes → attempt → submission versioned → submit → evaluating → evaluated/evaluation_failed. State attempt lengkap: `created → in_progress → submitted → evaluating → evaluated|evaluation_failed`, sesuai schema backend. Label “simulasi, bukan skor TOEFL resmi”.
- Perubahan plan tidak menghapus saldo/progress; tampilkan konflik pekerjaan aktif dan arahkan ke resource terkait.
- Advance: credential write-only, model LLM/STT independen, verifikasi berbiaya provider dengan consent. VIP: token package, checkout, wallet/ledger.
- Account security: metode login/link/unlink, logout, logout-all, deletion job status.

## Shared UX dan accessibility

- Bedakan permission denied, offline, unauthenticated, empty, insufficient funds, capability unavailable dan dependency failure.
- Accessibility label/role/state untuk kontrol; target sentuh, font scaling, screen-reader order, kontras dan safe area diuji. Warna bukan satu-satunya pembeda speaker/error.
- Transcript/caption dapat dibaca tanpa bergantung pada audio, partial dibedakan dari final. Hindari screen reader membacakan setiap token delta.
- Fokus input, keyboard avoidance dan validasi form tidak menghapus input saat error; credential input dibersihkan setelah submit/cancel.
- Indonesia untuk navigasi/instruksi, Inggris/bilingual sesuai konten tutor. Waktu locale-aware, nilai uang/token sesuai scale backend tanpa rounding float finansial.
- Foreground-only call/playback adalah proposal FE-05, belum policy produksi. Sebelum aktivasi, sepakati apakah background mengakhiri sesi atau memakai grace tertentu beserta budget/charging dan pemulihan foreground; UI menjelaskannya dan state akhir direkonsiliasi dari server.
