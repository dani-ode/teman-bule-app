# Backend ↔ Frontend Alignment Audit

Audit date: 25 September 2026. Scope: repository documents/config/source, not remote runtime validation. Backend remains preparation-stage according to its implementation plan. Frontend remains prototype plus blueprint/environment foundation. Result: architecture is aligned at design level with the corrections/gates below; production integration remains unverified.

## Traceability matrix

| Domain | Backend authoritative documents | Frontend documents | Result / outstanding gate |
|---|---|---|---|
| Five tabs, personas, TOEFL scope | product-requirements.md | product-navigation.md | Aligned; persona/curriculum DTO FE-09 |
| Ports, API/worker authority | architecture.md, backend-layout.md | architecture.md, livekit-realtime.md | Aligned; implementation absent |
| Routes/errors/idempotency | api-events.md; api-design rule | api-contracts.md | Resource map aligned; auth POST exception conflict FE-03 |
| SQL state semantics | postgresql-schema.md | api-contracts.md, product-navigation.md | Explicit enum corrections below; DTO still FE-03 |
| Email/Google/native auth | auth-provider-policy.md | auth-security.md | Web design aligned; native exchange not defined FE-02 |
| VIP/Advance/provider | billing-plans.md, auth-provider-policy.md | billing-provider.md | Aligned; commercial/catalog gates open |
| LiveKit/video/interruption | realtime-podcast.md, architecture.md | livekit-realtime.md | Aligned; join/event/checkpoint FE-05 |
| Podcast/index readiness | realtime-podcast.md, astra-collections.md | podcast.md | Aligned; selected-profile mapping now explicit |
| Ingestion/RAG/memory | langflow-flows.md, astra-collections.md | livekit-realtime.md, architecture.md | Aligned; eventual facts/provenance and no per-turn Langflow |
| MCP/CallCraft/internal APIs | callcraft-tools.md, runtime-components.md, .agents/mcp_config.json | mcp-boundaries.md | Ownership aligned; user_id doc/config discrepancy DEC-11 |
| Secrets/environment | environment.md, security-operations.md | environment.md, auth-security.md | Public-only keys aligned; native build settings pending |
| Release/operations | implementation-plan.md, security-operations.md, execution-readiness.md | implementation-plan.md, production-readiness.md | Frontend milestone dependencies clarified; full release blocked |

## Findings and disposition

| ID | Finding | Disposition |
|---|---|---|
| AUD-01 | Legacy docs called mock JSON foundational schemas and suggested flag-only production swap; they also prescribed incompatible universal response envelope | Marked historical/superseded; binding AGENTS + centralized engineering rules added |
| AUD-02 | TOEFL UI described generic failed; SQL specifies `evaluation_failed` | Explicit wire/domain state mapping added; no invented enum `failed` for attempt |
| AUD-03 | Jobs lacked complete SQL state list and unknown-usage state emphasis | Added canonical enum and required reconciliation behavior |
| AUD-04 | Gemini/OpenAI selected embedding profile product mapping was implicit | Added backend policy with server authority; dual readiness retained |
| AUD-05 | Frontend F4 grouped Home with text slice, F5 TOEFL with media, obscuring backend phase dependencies | Added dependency mapping; sync→memory→retrieval precedes streaming activation |
| AUD-06 | “Development mock only” config validation does not remove static mock imports from release bundle | Recorded as source-level release blocker, R03; not claimed fixed by env check |
| AUD-07 | Foreground-only call behavior described as baseline without approved product/session charging policy | Explicit proposal/gate FE-05; no hidden background billing behavior |
| AUD-08 | No automatically discoverable repository-wide agent rules | Added root AGENTS.md and `.agents/rules/production.md` pointer |
| AUD-09 | Production evidence/runbook gates too general | Added release matrix with owners, evidence and current status |
| AUD-10 | Some auth POST exceptions and CallCraft user_id disagree within backend sources | Kept visible source conflicts, FE-03/DEC-11; no unilateral backend policy rewrite |

## Authoritative state semantics

- Jobs: `pending`, `running`, `succeeded`, `retry_scheduled`, `reconciliation_required`, `failed`, `cancelled`.
- TOEFL attempts: `created`, `in_progress`, `submitted`, `evaluating`, `evaluated`, `evaluation_failed`.
- Wallet reservation: `active`, `settling`, `settled`, `released`, `reconciliation_required`.
- User facts: `proposed`, `confirmed`, `superseded`, `rejected`.
- Vocabulary: `new → learning → review → mastered` (product contract).
- Indexing: `pending`, `partial`, `ready`, `failed`, `deleted`; per-projection states differ and must not be conflated.

These enums are design semantics from SQL/product blueprints, not generated public API DTOs. Adapters require approved exposed subset/schema and explicit UI mapping. Unknown version/state surfaces contract error, never a fabricated successful state.

## Repeatable checks and limitations

`bun run check:blueprint` checks document links/index coverage, rules entrypoints and pinned backend contract evidence from `backend-contract-evidence.json`. Evidence uses exact source excerpts and SHA-256 hashes of referenced backend documents. Source changes fail the check for review; updating hashes alone is not an acceptable review.

This is a documentation drift check, not a semantic proof of all endpoint payloads. Full wire validation waits for backend OpenAPI/JSON Schemas and deployment fixtures; current release must remain blocked. Backend repo path can be supplied via `TEMAN_BULE_BACKEND_ROOT` for CI, otherwise the sibling repo is required. Missing backend source fails rather than skipping validation.
