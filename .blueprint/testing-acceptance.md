# Verification dan Acceptance Matrix

## Bukti yang tersedia pada F0

`bun run type-check` memeriksa source existing dan env loader. `bun run check:env` memeriksa parsing/missing values, policy mock/non-development, URL/integer invalid dan static Expo variable access melalui fixture terisolasi. Script config tidak memanggil backend/vendor dan tidak mencetak env values.

Config checker bukan test native bundling/SDK. Dependency LiveKit/auth/payment belum dipasang/diuji. Pemeriksaan dokumen dan type-check bukan bukti API, MCP atau provider tersedia.

## Matrix target

| Area | Unit/component | Integration / device / failure |
|---|---|---|
| Config | Missing/empty/typo enums, invalid URL/number, production mock rejected | Bundle uses intended build env; no secrets; metadata version parity |
| HTTP | Wire decoder/details array, 204, correlation, version conflict | Real backend schema; cross-owner denied; timeout outcome unknown; duplicate key replay |
| Auth | Refresh single-flight, session generation, route guards | Rotation/reuse/revocation, OAuth cancel/replay/link, logout cache purge |
| Chat | Delta reducer/dedupe/terminal, pending→persisted reconciliation | Native SSE/auth headers, replay gap/expired cursor, no new invocation on reconnect |
| Learn/vocabulary | Content version, form/review state, correction rendering | Unpublished content denied, version conflict, tool commit visible and truthful |
| Billing | Exact integer formatting, quote versus actual, checkout state | Duplicate taps/webhook, timeout/late paid, server ledger sync; no credit from redirect |
| BYOK | Write-only form, filtered capabilities, cleared secret | Invalid/revoked key, custom URL rejection, no fallback/no credential traces |
| Upload | Progress/cancel/expired URL, checksum validation UX | Real signed upload/scan, PDF corrupt/encrypted/limits, bearer not sent to storage |
| TOEFL | Submission versions, evaluated versus accepted | Retry evaluation no duplicate score/debit, objective/subjective distinction |
| Call | Session/event reducer, epoch stale, cleanup idempotent | Mic/camera denial, device audio, VAD barge-in, network/worker restart, budget exhaustion |
| Podcast | Script/index readiness, two speakers one participant, progress checkpoint | Partial embedding, branch/resume, no reset deadline, regenerate/deletion concurrency |
| Privacy | Redaction and per-user cache reset | Account deletion status, signed URL expiry, app resume after session revoked |
| Accessibility | Label/role/state, text scale, screen reader focus | Real device assistive tech, captions, contrast, keyboard/safe area |

## Evidence policy

- Pure reducer/parser unit tests tidak membutuhkan vendor. Contract fixtures harus menyebut sumber/schema version dan synthetic versus deployment capture.
- Client/server integration memakai backend staging nyata; backend database/ledger tests tetap milik backend sesuai rules, tidak ditiru dengan SQLite frontend.
- Vendor/live/billable scenarios memakai opt-in dan budget. Payment sandbox pass bukan production acceptance.
- Report command, exit status, platform/device, SDK/native runtime/backend schema versions, timestamp dan sanitized trace ID. Jangan mengunggah .env/token/transcript/PDF ke test report.
- Financial/auth critical transition coverage mengikuti rules backend; frontend menguji semua state yang dikelolanya dan menghindari klaim 100% tanpa measurement.

## Minimal release journey

Verified login → pilih VIP/Advance → successful AI text + persisted history/tool result → voice call interrupt/reconnect/end → video frame response dengan consent → PDF generate/index readiness → podcast dua persona interrupt/resume → TOEFL evaluated → ledger/progress/facts read → logout dan account isolation. Semua step harus menggunakan backend/vendor terverifikasi untuk capability live yang dirilis.
