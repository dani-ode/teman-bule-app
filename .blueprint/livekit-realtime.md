# LiveKit: Call, Video, RAG dan Memory

## Jawaban arsitektur

**Ya: frontend memperoleh akses room dari backend lalu langsung terhubung ke LiveKit. Namun yang menjalankan AI/RAG/memory adalah realtime worker backend yang juga terhubung ke room, bukan LiveKit server sendiri.** Frontend masih memakai API untuk create/read/end session, budget, reconnect reconciliation dan histori; jadi interaksi dengan backend tidak hanya satu permintaan token.

```text
CONTROL PLANE
Frontend ── app access token ──> API backend
  create call/playback → authorize plan/capability/budget/context → session ID
  join-token           → scoped short-lived participant token + connection metadata
  get/end              → authoritative lifecycle/checkpoint/settlement status

MEDIA PLANE
Frontend mic/camera ── WebRTC ──> LiveKit room <──> realtime worker / AI participant
Frontend speaker   <── audio ── LiveKit room <── ElevenLabs output from worker
                                                   │
                                   VAD → selected STT → selected LLM
                                                   │
                            authorized context/RAG/backend ports
                            AI-selected tools → CallCraft → domain API

MEMORY PIPELINE
Worker → persisted transcript/delivered spans/usage + SQL outbox
       → durable worker → Langflow ingestion → summary / facts / assessment
       → canonical SQL → platform Gemini + OpenAI embeddings → Astra projections
```

LiveKit webhooks mengirim lifecycle events ke backend untuk dedupe/reconciliation; bukan jalur utama retrieval. Realtime worker adalah bagian backend secara logis walaupun proses/deployment terpisah dari FastAPI.

## Call admission sequence

1. Load agents/plan/model capability/balance dari API. Validasi readiness ditentukan server.
2. Minta permission, pilih agent + voice/video + budget; user mengonfirmasi spend policy.
3. `POST /v1/calls` dengan idempotency key. Backend memvalidasi owner, plan snapshot, agent version, model/STT/vision, capacity, context dan reserve VIP.
4. Simpan call ID. `POST /v1/calls/{id}:join-token` meminta participant grant terbatas. Backend memilih room/identity; client tidak memilih arbitrary room atau admin grant.
5. Target join response mencakup URL LiveKit, token dan binding session/expiry/participant yang dibutuhkan SDK; **nama field/schema final masih FE-03/05**, bukan response yang sudah tersedia.
6. Connect SDK langsung ke URL LiveKit yang divalidasi (`wss` di staging/production), subscribe AI audio, publish mic dan kamera hanya bila diizinkan.
7. Backend mengatur agent dispatch dan lease/session ownership. Nama worker, service token dan credential provider tidak dikirim ke app.
8. End → HTTP `:end` idempoten + stop tracks/disconnect lokal. Fetch state final sampai terminal/settlement tersedia sesuai kontrak.

Token LiveKit berbeda dari app JWT. Ia disimpan sementara di memory, tidak env/route params/cache. Token renewal meminta backend memeriksa ulang izin; expiry JWT tidak otomatis diasumsikan memutus media yang sudah connected. Logout/revoke/limit menggunakan kontrol session server.

## RAG dan memory saat panggilan

- Langflow `session_context_preparation` dapat menyiapkan bounded authorized context sebelum admission. Refresh konteks bisa asynchronous.
- Jika retrieval langsung dibutuhkan worker, gunakan bounded shared retrieval adapter dengan scope Astra yang sama dan admin-funded query embedding. Tidak ada akses Astra dari frontend.
- Function call yang **dipilih AI** selalu melalui CallCraft, termasuk source context podcast bila tool digunakan. Trusted fetch context/persist checkpoint melalui narrow backend port bukan tool LLM.
- Audio turn menggunakan STT → LLM streaming → ElevenLabs secara langsung di worker, **tanpa Langflow per utterance**.
- Transcript sumber disimpan sebelum ingestion. Facts/summary/assessment/embedding eventual dan dedupe range; tidak perlu menunggu memory indexing pada setiap turn.
- Ingatan baru mungkin belum muncul segera; UI tidak menjanjikan “memory updated” sebelum status authoritative. Paper podcast tidak otomatis menjadi fakta personal.

## State dan data channel

Call server: `created → connecting → active → ending → completed`; nonterminal dapat `failed|cancelled`.

Turn: `listening → transcribing → thinking → speaking → completed`; alternatif terminal `interrupted|failed|cancelled`.

Client connection: disconnected/connecting/connected/reconnecting/failed adalah state SDK, terpisah dari state call server. “Connected room” tidak selalu berarti agent siap atau call active.

Event backend: `session.state`, `turn.state`, `transcript.partial`, `transcript.final`, `speaker.changed`, `playback.position`, `interruption.accepted`, `balance.low`, `balance.exhausted`, `session.closing`, `session.ended`, `error`. Envelope: session_id, sequence, epoch, timestamp, typed payload. Schema version negotiation dan ordering scope ditetapkan FE-05.

Reducer memvalidasi session/schema/sender binding dan dedupe sequence sesuai scope. Event stale epoch tidak menghidupkan turn lama. Gap/unknown event yang memengaruhi state memicu HTTP reconciliation. Partial transcript sementara; final/checkpoint persisted adalah sumber history. Client tidak mengirim harga/usage/transcript sebagai financial truth.

## Barge-in dan podcast speaker

Worker VAD mendeteksi speech-start, menaikkan epoch, membatalkan LLM/TTS, flush queue dan menolak packet lama. UI memberi indikasi interruption sesuai event, bukan sekadar men-toggle state dan menganggap provider berhenti. Tool yang sudah commit tidak di-rollback karena interupsi.

Podcast memakai satu director dan dapat satu AI participant untuk dua persona. Speaker ditentukan metadata speaker/segment, **bukan jumlah participant**. Dua suara berbeda berasal voice version worker, bukan TTS dalam frontend.

## Reconnect / app lifecycle

- Network drop → SDK reconnect dalam grace yang disahkan, tampilkan indicator dan disable aksi yang memerlukan state fresh.
- Setelah reconnect fetch call/playback HTTP state + delivered transcript/progress checkpoint. API checkpoint shape masih FE-05.
- Jangan `POST /calls` atau membuat playback baru saat reconnect. Rejoin existing session hanya bila server mengizinkan; terminal session tidak dihidupkan ulang.
- Jika user menekan end offline, lepaskan media lokal, simpan status UI end belum terkonfirmasi dan reconcile saat koneksi pulih. Backend grace/idle policy membatasi orphan session.
- Foreground-only adalah proposal FE-05, bukan policy yang sudah disahkan. Putuskan end/grace/budget saat app background sebelum aktivasi; background/lock-screen/cellular handoff dan audio interruptions memerlukan FE-01/05, native permission/build config serta uji perangkat.

## Video dan perangkat

Video = user camera input + AI audio output. Worker melakukan sampling bounded dengan resolution/size/freshness/max-in-flight yang disepakati backend; client camera off menghentikan publish, bukan hanya menyembunyikan preview. Tidak ada raw recording default atau avatar video AI.

Test mic denied, camera denied, permission revoked, headphone/Bluetooth change, incoming OS call, low bandwidth, interrupted audio session, reconnect dan worker restart. React Native LiveKit memerlukan native modules/development build; Expo Go tidak menjadi acceptance environment.
