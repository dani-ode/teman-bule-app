# Mandatory Production Engineering Rules

Status: binding engineering policy. Production readiness is a verified release state, not a naming convention. Existing prototype code must be migrated against these rules before activation; its presence is not an exemption for new code.

## R01 — Authority and contract-first implementation

- Read backend source contracts for the affected capability, then frontend specifications and open decisions. Backend owns identity, authorization, business invariants, prices, usage, canonical data and job/session lifecycle.
- No invented endpoint, DTO, enum, provider/model, price, timeout, quota or permission. A proposal is labelled proposed, recorded in decision-register and blocked from live activation until approved.
- Database rows are not public DTOs. SQL state enums inform domain semantics but response fields must come from an approved API schema.
- Resolve source contradictions with an explicit decision and update affected documents/artifacts together. Never silently choose whichever rule makes implementation easier.
- Breaking wire/event changes require schema versioning, migration/compatibility policy and reviewed fixtures. Do not edit backend contracts merely to make frontend checks pass.

## R02 — Architecture and types

- Expo is the official frontend platform. Production native capability must run in a Development Build or signed release binary; Expo Go is never production evidence.

- Screens call hooks/application operations; domain ports contain no React/SDK/network dependency; infrastructure implements ports. DI/composition root selects concrete adapters.
- Use existing TypeScript strict settings; no `any`, unchecked casts of external data, suppressed type errors or empty catches. Decode `unknown` at HTTP/SSE/LiveKit/storage boundaries.
- Use `@/` aliases across modules. Keep shared UI/theme separate from feature internals. One owner per resource lifecycle, abort controller, subscription and audio session.
- Keep server DTO, client domain model and UI result envelope distinct. Preserve server `request_id`; a generated client ID must not masquerade as server correlation.

## R03 — Configuration and mock isolation

- Public environment is embedded client data. No backend/provider/service secrets, static LiveKit tokens or BYOK in env/bundle/logs.
- Static Expo environment access with validation is mandatory. No hidden config, provider, model, pricing or mock fallback.
- Mock is permitted only as explicitly labelled development/test fixture. Staging/production must reject mock configuration and must not ship an executable mock service path; verify bundle isolation during implementation/release.
- Existing DI imports mocks statically: current source has NOT yet met production bundle isolation. Separate development composition from release composition before release.
- Feature readiness/admission comes from backend. Client feature flag cannot grant entitlement or conceal an enabled capability failing readiness.

## R04 — Transport and recovery

- POST domain mutations require stable `Idempotency-Key` per logical action; identical retry keeps identity/payload. PUT/PATCH carry resource-specific expected version/revision.
- Backend general rule says all POST mutations; `api-events.md` describes protocol exceptions for OAuth/webhooks/token-consuming auth. Endpoint-specific auth semantics must be approved before implementation; this discrepancy is not permission to omit keys arbitrarily.
- Never automatic-retry validation, ownership, schema or state conflicts. One coordinated token refresh is session recovery, not an unbounded auth retry loop. Transient retry uses approved backoff/jitter/attempt cap/deadline.
- Timeout does not prove no side effect occurred. Reconcile unknown outcomes before a new paid invocation, checkout or generation.
- 202 is accepted, not succeeded. Do not infer completion from redirect, connection success, stream close or optimistic UI.
- Cursor pagination bounded by approved contract. No fabricated list/history/status endpoint.

## R05 — Authentication, security and data

- Backend validates ownership; client route guards are UX only. Native refresh and OAuth handoff remain blocked until FE-02 approved.
- Access token in memory, web refresh HttpOnly cookie, native refresh storage only according to approved transport. No tokens in navigation URLs, analytics or general persisted stores.
- Clear user-scoped cache, private pending requests and media on logout/account switch. Handle revocation while streams/rooms are active.
- BYOK write-only, transient input; no response echo/persistence/logging. Signed upload uses scoped URL without forwarding app bearer credentials.
- Treat model output, PDFs, citations and tool results as untrusted. Tool success UI requires authoritative outcome.
- Account deletion UX distinguishes immediate access revocation/tombstone from asynchronous multi-store cleanup and legally retained minimized financial records.

## R06 — Realtime and AI boundary

- Frontend connects directly to LiveKit using backend-issued participant token; no client minting. Realtime worker runs STT/LLM/ElevenLabs and server-side RAG, not the frontend or LiveKit SFU.
- No Langflow per-turn dependency. Transcript persistence precedes background ingestion. AI-selected function calls go through CallCraft; deterministic public client CRUD uses backend HTTP.
- Reconnect reuses authorized session and fetches authoritative state/checkpoint; it never creates a new paid session implicitly. Validate event binding, epoch and sequence according to approved schema.
- Camera/mic require consent/indicators and track cleanup. No raw recording by default. Foreground-only is a proposal until background/disconnect UX is approved; do not silently charge a user while hidden-session behavior is unspecified.
- Podcast one director/two personas; immutable script plus branch checkpoint, no reset of hard deadline on interruption/restart.

## R07 — Finance, providers and memory

- Wallet/rates/usage authoritative server-side; exact integer handling, no floating-point settlement. No credit from checkout redirect or client transcript/usage.
- VIP/Advance exclusive for new work; no provider/payer fallback. TTS/embedding/background maintenance platform funded. Prices and commercial Advance policy must be approved.
- Model and credential capabilities from active catalog. Missing STT stream/vision blocks admission, not a hidden model switch.
- Both embedding projections required per active scope; selected profile must be ready. Gemini LLM uses Gemini profile, OpenAI LLM uses OpenAI profile by current backend product policy. UI consumes resolved backend readiness, not model-name heuristics.
- Facts are proposed/confirmed/superseded/rejected with provenance; assessment suggested level does not silently replace confirmed profile. Eventual memory update must not be advertised as committed before evidence.

## R08 — Verification and release

- Every feature needs meaningful unit/component, contract/integration and failure-recovery evidence appropriate to its owned logic; tests mirroring implementation alone are insufficient.
- Critical auth/billing transitions need full transition coverage with measured evidence. Backend 100% branch requirement on its critical state transitions remains mandatory; frontend tests do not substitute backend ledger/security tests.
- Vendor fixtures identify actual deployment versus synthetic. Billable/live tests require explicit opt-in/budget. No mock-only compatibility claims.
- Run required local checks plus feature tests. Do not suppress failing checks, loosen validation or fabricate success to pass CI.
- Production requires all applicable gates in `production-readiness.md`, approved decisions, native-device evidence, operational owner and rollback. Incomplete work is reported blocked/partial, never certified production-ready.
