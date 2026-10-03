# TemanBule App

> AI-powered English learning app — Expo + React Native + TypeScript

TemanBule is a mobile application that helps Indonesian users learn English through AI-powered conversations, interactive lessons, voice/video calls with AI tutors, podcast generation from PDFs, vocabulary building, and TOEFL preparation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 57 + React Native 0.86 |
| Language | TypeScript (strict mode) |
| Package Manager | Bun |
| Navigation | React Navigation (bottom tabs + native stack) |
| Server State | TanStack Query v5 |
| Realtime | LiveKit (voice/video calls) |
| Styling | NativeWind (Tailwind CSS) |
| Validation | Zod |
| Testing | Vitest |
| Build | EAS Build |

---

## Features

- **Home** — Browse courses, units, and lessons with progress tracking. Interactive content: video, reading, grammar, and quizzes with AI learning assistance.
- **Chat** — Practice English with AI agents (Elean/Willy) across categories: daily conversation, grammar, pronunciation, job interview, travel, and free talk. Supports text and voice notes.
- **Call** — Voice and video calls with AI tutors powered by LiveKit realtime infrastructure.
- **Podcast** — Upload PDFs to generate interactive podcast episodes with AI-narrated scripts.
- **Profile** — Manage profile, subscription plans (VIP/Advance), wallet/topup, AI settings (BYOK), vocabulary review, TOEFL preparation, and account security.

---

## Project Structure

```
src/
  config/           # Environment validation and build config
  core/
    di/             # Composition root, service lifecycle
    errors/         # Typed error mapping
    types/          # Client result and DTO references
    navigation/     # Typed routes, auth/main stacks
    auth/           # Session coordinator, token management
    network/        # HTTP transport, SSE
    storage/        # Secure storage adapter, scoped cache
    realtime/       # Room controller, event handling
    observability/  # Redaction, diagnostics
  domain/           # Business entities and interfaces
    user/ chat/ lesson/ auth/ catalog/ billing/
    media/ call/ podcast/ vocabulary/ toefl/ jobs/
  services/
    api/            # HTTP adapters + wire DTO mapping
    realtime/       # LiveKit adapter
    mock/           # Dev/test fixtures
  features/         # Screen-level feature modules
    auth/ lessons/ chat/ call/ podcast/ user/
    billing/ ai-settings/ vocabulary/ toefl/
  ui/               # Shared components, theme, localized copy
```

---

## Prerequisites

- [Bun](https://bun.sh/) (latest)
- [Node.js](https://nodejs.org/) (for some tooling)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android Studio / Xcode (for development builds)
- Backend server running locally (see `../teman-bule/` repository)

---

## Getting Started

### 1. Clone and install dependencies

```bash
bun install --frozen-lockfile
```

### 2. Set up environment

Copy the example environment file and adjust values:

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_USE_MOCK_DATA=false
EXPO_PUBLIC_MOCK_LATENCY_MS=750
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/v1
EXPO_PUBLIC_API_TIMEOUT_MS=15000
EXPO_PUBLIC_LIVEKIT_URL=ws://localhost:7880
EXPO_PUBLIC_APP_NAME=TemanBule
EXPO_PUBLIC_APP_VERSION=1.0.0
```

> **Note:** For Android emulator, use `http://10.0.2.2:8000/v1` as the API base URL. For physical devices, use your machine's LAN IP.

### 3. Verify setup

```bash
bun run type-check
bun run check:env
```

### 4. Run the app

```bash
# Start Expo dev server
bun run start

# Run on Android
bun run android

# Run on iOS
bun run ios

# Run on web (limited support)
bun run web
```

---

## Scripts

| Command | Description |
|---|---|
| `bun run start` | Start Expo development server |
| `bun run android` | Build and run on Android |
| `bun run ios` | Build and run on iOS |
| `bun run web` | Start web development server |
| `bun run type-check` | TypeScript type checking |
| `bun run test` | Run tests with Vitest |
| `bun run test:watch` | Run tests in watch mode |
| `bun run check:env` | Validate environment configuration |
| `bun run check:blueprint` | Check blueprint drift against backend |

---

## Environment Configuration

All `EXPO_PUBLIC_*` variables are embedded in the client bundle and are readable by users. Never put secrets in these variables.

| Key | Validation | Purpose |
|---|---|---|
| `EXPO_PUBLIC_APP_ENV` | `development` / `staging` / `production` | Application environment policy |
| `EXPO_PUBLIC_USE_MOCK_DATA` | `true` / `false` | Select mock drivers (dev only) |
| `EXPO_PUBLIC_MOCK_LATENCY_MS` | Non-negative integer | Mock latency for local fixtures |
| `EXPO_PUBLIC_API_BASE_URL` | Absolute HTTP(S) URL, path `/v1` | Backend API base URL |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | Positive integer | HTTP request timeout |
| `EXPO_PUBLIC_LIVEKIT_URL` | WebSocket URL | LiveKit server URL |
| `EXPO_PUBLIC_APP_NAME` | Non-blank string | Runtime app label |
| `EXPO_PUBLIC_APP_VERSION` | Non-blank string | Runtime version |

### Device Networking

| Target | API Base URL Example |
|---|---|
| Web/browser | `http://localhost:8000/v1` |
| Android emulator | `http://10.0.2.2:8000/v1` |
| iOS simulator | `http://localhost:8000/v1` |
| Physical device | `http://<LAN-IP>:8000/v1` |

---

## Architecture

```
Frontend -- HTTPS --> API Backend --> SQL / Workers
    |                      |
    | join token           |
    v                      v
 LiveKit <------> Realtime Worker --> STT / LLM / TTS
                          |
                          +--> RAG / Context
                          +--> Internal APIs
```

**Frontend responsibilities:** UI, input handling, device permissions, media connections, UI cache.

**Backend responsibilities:** Authentication, ownership, session/job state, pricing, balance, usage tracking, provider resolution, persistence.

---

## Build Channels

| Channel | Binary Type | Mock Data | Native Features |
|---|---|---|---|
| Development | Expo Go or Dev Build | Allowed (explicit) | Dev Build only |
| Staging | Signed internal build | Forbidden | Required |
| Production | Signed store build | Forbidden | Required |

---

## Development Status

This project is under active development. See `.blueprint/implementation-status.md` for the current state of backend integration and `.blueprint/implementation-plan.md` for the roadmap.

### Currently Implemented

- Authentication flows (login, register, email verification, password reset)
- Five main tabs: Home, Chat, Call, Podcast, Profile
- API adapters for auth, account, practice, vocabulary, learning, TOEFL, calls, podcasts
- LiveKit integration for realtime calls
- Offline-aware TanStack Query cache

### In Progress

- Full LiveKit realtime features (pending backend decisions)
- Podcast generation pipeline
- TOEFL assessment flows

---

## Documentation

Detailed specifications are in the `.blueprint/` directory:

| Document | Description |
|---|---|
| `engineering-rules.md` | Production engineering rules |
| `architecture.md` | Layer architecture and state ownership |
| `api-contracts.md` | Endpoint map, DTOs, error handling |
| `auth-security.md` | Session, BYOK, media privacy |
| `livekit-realtime.md` | Realtime architecture |
| `environment.md` | Environment setup and validation |
| `testing-acceptance.md` | Testing requirements |
| `implementation-plan.md` | Milestones and backlog |
| `implementation-status.md` | Current implementation status |

---

## Backend Repository

The backend source of truth is in the sibling repository: `../teman-bule/.blueprint/`

Key backend contracts:
- `api-events.md` — API endpoints and events
- `realtime-podcast.md` — LiveKit and podcast specs
- `billing-plans.md` — Subscription and wallet
- `postgresql-schema.md` — Database schema

---

## License

Private — All rights reserved.
