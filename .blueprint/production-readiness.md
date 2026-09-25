# Production Release Gates

Current release status: **BLOCKED — not production-ready**. Production-grade requirements are binding now; deployed readiness cannot be inferred from complete documentation, type-check or environment validation.

| Gate | Required evidence | Owner | Current status |
|---|---|---|---|
| P01 Contract | Approved OpenAPI/event schemas, DTO generation/validation, backward compatibility and auth/idempotency exceptions resolved | Backend + frontend | Blocked FE-02/03/04/05 |
| P02 Native toolchain | Supported Expo/LiveKit/plugin versions, Development Build and signed EAS/internal production build, physical iOS/Android media tests, identifiers/schemes/permissions/signing | Frontend + realtime | Blocked FE-01 |
| P03 Auth/security | Verified login/refresh rotation/reuse/revocation/OAuth links, IDOR, scoped cache purge, secret redaction and deletion | Backend + frontend | Not implemented |
| P04 Billing | Approved prices/scale, sandbox and production deployment verification, duplicate/late payment, unknown usage, wallet race and reconciliation | Billing + backend | Blocked DEC-06/07/08, FE-07 |
| P05 AI/data | Chat sync → persisted memory → dual projections → scoped retrieval, truthful tool outcomes, injection/empty context evaluation, then stream recovery | AI + backend + frontend | Not verified |
| P06 Realtime | Barge-in/stale epoch, reconnect/worker restart/fencing, durable delivered checkpoint, budget limit, camera consent, load/soak evidence | Realtime + frontend | Not implemented |
| P07 Podcast/media | Real upload/scan/parser, selected profile readiness, two distinct voices, branch/resume/deadline, regeneration/dedupe and private cache | Backend + frontend | Not implemented |
| P08 Build integrity | No executable mock path in release, no secrets, lock/pinned tools, native runtime/OTA compatibility, correct domain/signing | Frontend + release | Blocked: static mock imports exist |
| P09 Product/accessibility | Five tabs, TOEFL under Profile, full VIP/Advance journeys, approved copy/personas, a11y device evidence | Product + frontend | Prototype only |
| P10 Operations | Approved numeric SLO/retention/capacity, telemetry redaction, incident runbooks, release monitoring, rollout/rollback drill | Operations + release | Blocked FE-08 / DEC-16 |

## Minimum frontend operational runbooks

Each runbook must name owner/on-call, symptom/metric, safe diagnostics, containment, server reconciliation, recovery verification and rollback conditions. No secrets in incident attachments.

1. Login/refresh/OAuth failure: stop retry storm, preserve safe correlation, revoke/clear session as appropriate; no fallback auth bypass.
2. API/schema incompatible rollout: block affected capability visibly, route to compatible native/runtime build, coordinate backend compatibility; never substitute mock.
3. LiveKit outage/reconnect/worker crash: stop local capture when required, reconcile existing session and held budget; no new session on automatic retry.
4. Paid checkout pending/unknown usage: show pending state and order/session reference, coordinate server reconciliation, no local credit/release guess.
5. Upload/generation/index partial failure: retain resource/job identity, request authorized checkpoint retry; do not repeat successful embedding branches.
6. Credential revocation or exposure: halt affected requests/media, clear transient client state, server revoke/rotate, redact evidence; never switch to admin key.
7. Deletion stuck/stale private cache: revoke local access and remove cache, follow backend per-store deletion evidence and legal retention status.
8. OTA/native SDK regression: rollback only compatible runtime; verify session/payment/job continuity and track cleanup on old/new client.

## Evidence record and release decision

Record gate ID, named reviewer, date, commit/build/native runtime/backend schema/vendor version, actual test command, result, sanitized evidence link, unresolved issue and rollback. All applicable gates must pass; release owner approval required. A deliberate narrower release requires explicit product scope/blueprint change, not silently marking missing features done.

Required local checks are necessary but insufficient: `bun run type-check`, `bun run check:env`, `bun run check:blueprint`, `git diff --check`, plus implemented feature test suites. Existing prototype failures are documented and corrected before activation; unknown results are not treated as passing.
