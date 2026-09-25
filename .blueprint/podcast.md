# Podcast PDF dan Playback Interaktif

## Data model UI

Pisahkan podcast metadata, source version, generation job, immutable script version, ordered segments, indexing status per profile dan playback session. Satu podcast dapat memiliki lebih dari satu script version dan playback. Judul tidak menjadi identity; edit judul tidak regenerate script.

Metadata/detail DTO final masih FE-03; jangan menggabungkan semua proses ke boolean `isReady`.

## Upload → generation

1. Create podcast metadata dengan idempotency key; retain resource ID untuk retry.
2. Pilih PDF, periksa ukuran/extension sebagai UX awal; backend tetap MIME sniff, checksum/size, scan dan parser authority.
3. Request `POST /media/uploads` dengan purpose/size/checksum. Binary upload menggunakan metode/headers yang diberikan kontrak signed upload, tanpa bearer app.
4. `POST /media/{id}:complete`; status upload acceptance bukan scan/parse success. Attach melalui `POST /podcasts/{id}/sources` dengan media_id sesuai urutan final FE-03.
5. Tampilkan processing document, typed failure dan job. PDF corrupt/encrypted/unsupported atau scanned-without-OCR tidak dipalsukan sebagai teks tersedia.
6. User memilih target duration dalam policy backend, melihat quote dan budget. `:generate` menghasilkan job, bukan script langsung siap.
7. Poll/refetch hingga script valid tersimpan. Langflow memakai canonical chunks/page refs untuk Elean/Willy; UI menampilkan segments/citations hasil tervalidasi.

Generation: `draft → uploaded → processing → generating → ready`; berjalan dapat `failed|cancelled`; deletion `deleting → deleted`. Job failure detail/stage dipisahkan dari metadata resource.

## Readiness yang berbeda

| Dimensi | Makna UX |
|---|---|
| Upload finalized / scan | File diterima dan aman diproses sesuai backend |
| Canonical source ready | Parsing menghasilkan sumber canonical |
| Script ready | Naskah valid dan tersimpan |
| Indexing ready | Kedua profile embedding complete; satu profile saja = partial |
| Playback admissible | Profile yang dikunci playback siap + plan/model/budget/room ready |

Partial indexing tidak otomatis melarang semua playback: profile yang dipilih server wajib ready, profile lain boleh partial dengan status terlihat. UI tidak mengganti profile/provider diam-diam. Jangan disable/enable berdasarkan tebakan provider dari nama model.

Policy backend `astra-collections.md`: Gemini LLM → profile Gemini, OpenAI LLM → profile OpenAI. Backend mengunci resolusi pada snapshot; frontend mengonsumsi readiness yang sudah diotorisasi. Kedua projection tetap wajib per scope aktif, query embedding selalu platform-funded.

## Playback

`POST /podcasts/{id}/playbacks` dengan script_version_id + budget → playback ID. Ambil `POST /podcast-playbacks/{id}:join-token` → direct LiveKit. Director memilih speaker/voice binding dan TTS per segment; frontend subscribe audio dan typed metadata.

State: `created → connecting → playing ↔ interrupted → resuming → playing → closing → completed`; nonterminal dapat `failed|cancelled`.

Interupsi: VAD user menghentikan output → STT → grounded LLM answer dari paper + dialog delivered → bridge/resume segment belum selesai. Base script immutable; branch dialog tidak menimpa naskah reusable. Speaker tidak overlap.

Progress menampilkan base segment/offset, branch dan elapsed sesuai checkpoint. UI timer hanya estimasi display, bukan otoritas hard deadline/billing. Interupsi tidak me-reset hard deadline; durasi tidak di-hardcode delapan menit. Reason penutupan eksplisit: user/budget/duration/idle/failure sesuai schema.

Tidak ada seek arbitrary, pause server atau background continuation yang dianggap tersedia sebelum kontrak command disahkan. Mute mic adalah kontrol lokal track; bukan pause director. Menekan play ulang secara sengaja membuat playback baru, reconnect tidak.

## Regenerate, edit, delete dan retry

- Edit title: PATCH expected version; conflict refetch. Script/source/voice version tidak berubah.
- Regenerate: versi baru + quote/reserve baru, tampilkan existing script sampai versi baru ready sesuai UX; jangan mutate history playback lama.
- Cancel/retry job melalui API job; backend mengecek stage checkpoint, credential dan budget. Unknown outcome tidak diulang dengan key baru.
- Delete: konfirmasi user lalu tampilkan deleting sampai backend complete; active playback/delete behavior diputuskan FE-06. Cache removed resource dibersihkan, signed URL tidak dipakai lagi.
- Audio cache worker private; generation LLM lama tidak ditagih ulang karena replay cache. TTS tetap platform-funded.

## Acceptance

Upload interrupted/expired signed URL, checksum mismatch, parser failure, one embedding branch failure, script ready but profile unavailable, duplicate generate, regeneration concurrent title edit, question barge-in, stale epoch, reconnect mid-branch, worker restart deadline, budget exhausted dan delete during job harus memiliki evidence sebelum release.
