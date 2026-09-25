# Implementation Plan dan Backlog

Status awal tiket adalah **planned**, kecuali F0 yang selesai pada penyusunan blueprint/environment ini. Urutan merupakan dependency, bukan janji tanggal. Backend belum implementasi penuh; paralel UI hanya menggunakan fixture eksplisit dengan schema disepakati.

| Milestone | Deliverables | Gate / acceptance |
|---|---|---|
| F0 — blueprint/environment | Index/specs, `.env.example`, ignored local env, static Expo env access + validation, env checker | Type-check/config cases pass; mock local berlabel jelas |
| F1 — app foundation | FE-01 spike, typed navigation 5 tabs/auth stack, DI per-session, query/schema tooling, error boundary, design/accessibility base | Android/iOS development build dan baseline tests; screen tidak call transport |
| F2 — auth + API foundation | FE-02/03 packets, API client, refresh coordinator, secure session, profile/catalog read, deep links | Login/refresh/logout/revocation/ownership/error mapper evidence |
| F3 — plan/billing/provider | VIP/Advance onboarding, BYOK, model selection, wallet/quote, top-up/ledger | FE-07 + payment sandbox; duplicate/unknown checkout tidak double credit |
| F4 — text learning slice | Courses/progress/Learn, chat text/SSE/history, vocabulary, facts/assessment read | FE-04; one vocabulary.save end-to-end dengan tool outcome truthful; replay no new debit |
| F5 — media + TOEFL | Signed voice note/PDF upload, scan/job UI, TOEFL attempt/submit/evaluation | Capability/STT/limits verified, accepted bukan ready/evaluated |
| F6 — call voice lalu video | SDK adapter/controller, permissions, create/join/end, events/reconnect, vision capability UX | FE-05; barge-in, stale epoch, worker restart, budget/network/OS audio tests |
| F7 — podcast full | Library/source/generation/version/index readiness, director playback/interruption/resume | FE-06; two voices one participant, checkpoint/deadline recovery |
| F8 — release hardening | Privacy/deletion, diagnostics, store build, accessibility, performance, rollback | FE-08/09 dan backend production gates ditutup dengan evidence |

## Ticket foundation yang dapat diturunkan

### Dependency backend wajib

Frontend F2 membutuhkan backend Phase 1; F3 Phase 2 sebelum billable slice. F4 text mengikuti urutan Phase 3: sync persisted interaction → ingestion → dual projection → scoped retrieval → facts/assessment → streaming, bukan streaming terlebih dahulu. Bagian Home/Learn F4 dan TOEFL F5 membutuhkan backend Phase 4. Media/voice note/PDF F5 membutuhkan Phase 5; speaking TOEFL bergantung media ini walaupun domain TOEFL dimulai pada Phase 4. F6 membutuhkan Phase 6; F7 membutuhkan Phase 7; F8 membutuhkan seluruh applicable Phase 8 gates. Nomor milestone frontend tidak berarti backend phase yang berbeda boleh dilewati.

- F1-01: compatibility report Expo/LiveKit + minimal device development build. Output versi/paket/plugin/OS support dan reproducible commands.
- F1-02: navigation root/auth/main stack + active session lifetime. Acceptance tab switch tidak remount room controller.
- F1-03: typed DTO validation/error mapper, API origin policy dan query cache isolation; fixture error backend termasuk details array.
- F2-01: native/web auth contract packet dengan backend; implementasi ditunda sampai packet approved.
- F2-02: refresh single-flight/revocation + logout cleanup; test concurrent 401 dan user switch.
- F3-01: catalog/plan onboarding dan credential selection; reject unsupported STT/video tanpa admin fallback.
- F4-01: text session/message adapter, stream reducer, replay persisted recovery dan vocabulary outcome.
- F6-01: create existing session→join→end harness sebelum UI video; success/failure trace aman.

## Definition of Ready

Requirement dan source blueprint jelas; schema/event packet disepakati; keputusan blocker resolved untuk scope; backend capability status diketahui; fixture aman tersedia; failure cases, biaya/rate policy dan device target ditentukan. Jangan memulai adapter dengan response JSON tebakan.

## Definition of Done

Type-check + relevant unit/component/contract/integration tests pass; failure semantics dan cleanup dibuktikan; no secret/log leaks; config/template/docs/contract versions konsisten; accessibility dan loading/empty/error states selesai; actual-vs-mock evidence terpisah; release capability tidak aktif sebelum vendor/backend gate selesai.

## Template ticket/evidence

```text
ID / tujuan / status / pemilik:
Requirement dan blueprint/backend references:
Decisions / schema versions / dependency capability:
Perubahan source/config/dependencies:
Acceptance success + failure + recovery:
Perintah test / versi OS-SDK-backend / hasil / redacted evidence:
Known gaps / rollout / rollback:
```

Scope frontend tetap lima tab lengkap, auth, wallet/BYOK, voice/video, podcast interaktif dan TOEFL di Profile. Text slice adalah checkpoint integrasi, bukan pengurangan scope akhir.
