# Plan, Provider, Wallet dan Checkout

## Model produk

VIP dan Advance adalah mode aktif eksklusif untuk pekerjaan baru, bukan subscription. User wajib memilih plan sebelum AI; tidak ada trial token otomatis. Non-AI lessons, histori dan profil tidak mensyaratkan saldo positif.

| Pekerjaan | VIP | Advance |
|---|---|---|
| LLM chat/Learn/call/podcast, vision, TOEFL subjektif | Wallet sesuai usage/rate card | BYOK LLM |
| STT voice note/call/interupsi | Wallet sesuai meter STT | BYOK STT |
| Generate/regenerate naskah podcast | Quote/reserve, platform LLM key | User LLM key |
| ElevenLabs TTS, embedding/query embedding | Platform, tanpa debit wallet | Platform, tanpa BYOK |
| Background facts/memory/assessment longitudinal/indexing | Platform | Platform |

Baseline Advance tanpa debit wallet; biaya komersial tambahan belum disahkan. UI tidak menciptakan biaya/subscription baru.

## Provider settings

Katalog provider aktif awal hanya Gemini/OpenAI, tetapi UI membaca backend, bukan hardcode opsi model. LLM dan STT dipilih independen dengan credential_id + model_id. Filter capability: `llm_text`, `stt_batch`, `stt_stream`, `vision_input`, `tool_calling` sesuai kebutuhan. Embedding bukan pilihan BYOK user.

Credential create → pending verification → active/invalid; revoke membuat future invocation unavailable. Transient verify timeout tidak otomatis berarti key invalid permanen. Satu key dapat dipakai LLM/STT bila cocok; no fallback Advance→VIP/admin saat gagal. Base URL kosong memakai canonical backend catalog, custom URL hanya jika lolos backend policy.

## Wallet dan quote UI

- Tampilkan available, held dan settlement/reconciliation state sesuai DTO, bukan satu saldo estimasi yang dianggap final.
- Token aplikasi berbeda dari provider token. Metadata display scale/rate version/currency dari backend; jangan memakai float untuk uang atau `Number` untuk bigint di luar safe range.
- FE-03 harus menetapkan representasi integer wire (misalnya decimal string) sebelum parser wallet. Tidak mengklaim server sudah memilih string.
- Quote menjelaskan estimate/max reserve dan max spend; bukan harga final. Backend mengunci rate/version/policy dan menghitung usage.
- `usage_updated`/balance events memicu refresh; client meter hanya display, tidak menulis ledger/debit.
- Pada balance.low/exhausted, tampilkan keadaan dan penutupan terkontrol. Top-up sukses tidak otomatis menghidupkan session yang sudah terminal.

## Top-up Xendit

1. GET token packages/current rate; user memilih immutable package version, nominal dari backend.
2. POST `/billing/topups` dengan package_version_id + idempotency key; disable duplicate tap untuk operasi yang sama.
3. Buka checkout URL yang lolos policy vendor/backend menggunakan system browser sesuai keputusan FE-07. Jangan menaruh secret Xendit di app.
4. Return/deep link hanya navigasi UX. Refetch `/billing/topups/{id}` dan wallet; **redirect success tidak menambah saldo lokal**.
5. Poll dengan bounded policy sampai paid/expired/failed/cancelled; network timeout unknown tetap memakai order sama, bukan create baru.
6. Refund/dispute ditampilkan berdasarkan server status/journal; UI tidak menghitung compensating ledger sendiri.

State order: `created → pending → paid|expired|failed|cancelled`; paid dapat partially_refunded/refunded/disputed sesuai backend. Webhook/confirmation dan dedupe milik backend.

Produk Xendit dan aturan distribusi pembelian kredit pada iOS/Android harus dikonfirmasi FE-07 sebelum mengaktifkan checkout pada channel release terkait; ini dependency delivery, bukan approval produk pembayaran yang sudah selesai.

## Plan switching

GET plan revision → PUT `/me/plan` dengan expected_revision. Backend menolak 409 bila ada call/playback aktif, user-plan invocation belum terminal/settled/reconciled atau generation/evaluation user nonterminal. Platform ingestion/embedding tidak memblokir switch. Jangan menghapus saldo VIP atau key Advance saat switch.

UI menjelaskan resource blocker bila backend menyediakan detail aman, refetch setelah selesai, dan tidak membatalkan pekerjaan berbayar otomatis demi mengganti plan. Emergency model disable/revocation dapat menghentikan invocation baru bahkan jika session snapshot terkunci.
