# Rule Spec 01: Architecture & Directory Structure

## 1. Architectural Blueprint
**TemanBule** is built adhering strictly to **Clean Architecture** and **Domain-Driven Design (DDD)** principles within a React Native & Expo Managed Workflow ecosystem using TypeScript (Strict Mode) and Bun.

The application is segregated into distinct architectural layers with unidirectional dependency flow:

```
[ Presentation Layer: UI Components & Screens ]
                     |
                     v
 [ Application Layer: Custom Hooks & State ]
                     |
                     v
 [ Domain Layer: Entities & Service Contracts ]
                     |
                     v
[ Infrastructure / Service Layer: Repositories & API Clients ]
```

---

## 2. Directory Taxonomy (`/src`)

```
src/
├── config/                         # Application & Environment configuration
│   ├── env.config.ts               # Validated environment variables (No magic strings)
│   └── service.config.ts           # Service Provider configuration (Mock vs Real)
│
├── core/                           # Shared Cross-Cutting Concerns & Framework Core
│   ├── di/                         # Dependency Injection Container
│   │   └── ServiceContainer.ts     # Service Registry and DI resolution
│   ├── errors/                     # Standardized Enterprise Error Hierarchy
│   │   └── AppError.ts             # Domain & Infrastructure Exception definitions
│   └── types/                      # Universal API Envelopes & Utility Types
│       └── api.types.ts            # ApiResponse<T>, ApiErrorResponse, Pagination
│
├── data/                           # Data Sources & Local Mocks
│   └── mock/
│       └── mockData.json           # Validated Mock JSON dataset
│
├── domain/                         # Pure Business Logic & Service Interfaces (No UI/React imports)
│   ├── user/
│   │   ├── user.types.ts           # User Profile & CEFR level domain models
│   │   └── IUserService.ts         # User Service contract
│   ├── chat/
│   │   ├── chat.types.ts           # Chat Message, Correction, Session domain models
│   │   └── IChatService.ts         # AI Chat Tutor Service contract
│   └── lesson/
│       ├── lesson.types.ts         # Lesson Topic & Module domain models
│       └── ILessonService.ts       # Lesson Service contract
│
├── services/                       # Concrete Implementations of Domain Interfaces
│   ├── mock/                       # Mock API Implementations (JSON + Latency)
│   │   ├── delay.ts                # Latency simulator helper
│   │   ├── MockUserService.ts     # IUserService Mock implementation
│   │   ├── MockChatService.ts     # IChatService Mock implementation
│   │   └── MockLessonService.ts   # ILessonService Mock implementation
│   └── api/                        # Production API Implementations (Future Backend)
│       ├── ApiClient.ts            # Axios/Fetch HTTP Client wrapper
│       ├── RealUserService.ts     # Production User Service
│       ├── RealChatService.ts     # Production Chat Service
│       └── RealLessonService.ts   # Production Lesson Service
│
├── features/                       # Vertical Domain Feature Modules (UI + Custom Hooks)
│   ├── user/                       # User Profile feature
│   │   ├── components/             # Feature-specific UI components
│   │   ├── hooks/                  # Feature custom hooks (e.g. useUserProfile)
│   │   └── screens/                # Feature screens (ProfileScreen)
│   ├── chat/                       # AI Chat Tutor feature
│   │   ├── components/             # ChatBubble, CorrectionCard, ChatInput
│   │   ├── hooks/                  # Feature custom hooks (e.g. useChat)
│   │   └── screens/                # Feature screens (ChatScreen)
│   └── lessons/                    # English Lessons feature
│       ├── components/             # LessonCard, TopicBadge
│       ├── hooks/                  # Feature custom hooks (e.g. useLessons)
│       └── screens/                # Feature screens (HomeScreen)
│
└── ui/                             # Global Design System & Shared UI Components
    ├── components/                 # Reusable Atomic Components (Button, Card, Text, Badge)
    └── theme/                      # Design Tokens (Colors, Typography, Spacing)
```

---

## 3. Strict Boundary Rules

### Rule 1.1: Zero UI Leakage into Domain Layer
- Files inside `src/domain/` MUST NOT import React, React Native components, or UI styling modules.
- Domain entities must be pure TypeScript types, interfaces, and pure business functions.

### Rule 1.2: Strict Feature Isolation
- Features inside `src/features/` must be self-contained modules.
- A feature MUST NOT import internal components from another feature directly. Shared components MUST be lifted to `src/ui/components/` or exposed via domain hooks.

### Rule 1.3: Abstraction via Custom Hooks
- Screens inside `src/features/*/screens/` MUST NOT call service instances directly or execute network logic.
- Screens MUST delegate all state fetching, mutation, loading states, and error handling to Feature Custom Hooks (`useChat`, `useUserProfile`, `useLessons`).

### Rule 1.4: Import Aliases
All imports MUST use strict root-relative path aliases defined in `tsconfig.json`:
- `@/config/*`
- `@/core/*`
- `@/domain/*`
- `@/services/*`
- `@/features/*`
- `@/ui/*`
- `@/data/*`

Relative parent directory imports (`../../`) spanning across top-level modules are STRICTLY PROHIBITED.
