# TemanBule Frontend — Mandatory Engineering Instructions

Read `.blueprint/README.md`, `.blueprint/engineering-rules.md` and `.blueprint/backend-alignment.md` before changing this repository. These rules apply to all source, configuration, tests and documentation beneath this directory.

All architectural specifications and detailed rules live in `.blueprint/`. `.agents/rules/` contains discovery pointers only. `docs/rules/` is historical prototype documentation and MUST NOT override the current blueprint or backend contracts.

Backend source of truth: sibling repository `../teman-bule/.blueprint/`, especially `api-events.md`, `architecture.md`, `auth-provider-policy.md`, `billing-plans.md`, `realtime-podcast.md`, `postgresql-schema.md` and `decision-register.md`. Read the affected source contracts before implementing a feature. If unavailable or conflicting, record the blocker; do not invent wire contracts or report production readiness.

Before completion, run `bun run type-check`, `bun run check:env`, `bun run check:blueprint` and relevant feature tests. Report actual commands/results and unresolved gates. Checks passing do not certify backend/vendor integration or production release.
