> HISTORICAL / SUPERSEDED: prototype reference only. Binding rules: [AGENTS.md](../../AGENTS.md) and [engineering-rules.md](../../.blueprint/engineering-rules.md). Mock flag alone does not enable production drivers; this client envelope is not the backend wire format.

# Rule Spec 02: Service Layer & Repository Pattern

## 1. Architectural Purpose
The Service Layer decouples the presentation layer (React components & custom hooks) from data source implementations. Whether data originates from local JSON files, SQLite, GraphQL, or REST API endpoints, the application components consume identical service interfaces.

---

## 2. Dependency Injection & Service Registry

### Service Container Pattern
The application uses a thread-safe singleton `ServiceContainer` located at `src/core/di/ServiceContainer.ts`.

```
                        +----------------------+
                        |   ServiceContainer   |
                        +----------------------+
                                   |
              +--------------------+--------------------+
              | (USE_MOCK_DATA=true)                    | (USE_MOCK_DATA=false)
              v                                         v
    +-------------------+                     +-------------------+
    | Mock Services     |                     | Real API Services |
    | - MockUserService |                     | - RealUserService |
    | - MockChatService |                     | - RealChatService |
    | - MockLesson...   |                     | - RealLesson...   |
    +-------------------+                     +-------------------+
```

### Hot Swapping Mechanism
Switching between Mock API and Real Backend requires modifying ONLY ONE environment flag: `USE_MOCK_DATA` in `src/config/env.config.ts`.
**Zero React components or hooks require modification when swapping data source implementations.**

---

## 3. Mandatory Service Contracts

Every domain entity MUST define an interface prefixed with `I` in `src/domain/<domain>/I<Domain>Service.ts`.

### Service Response Envelope Contract
All service methods MUST return asynchronous Promises wrapped in the standardized enterprise `ApiResponse<T>` envelope:

```typescript
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiErrorResponse;
  readonly timestamp: string;
}

export interface ApiErrorResponse {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly requestId: string;
}
```

---

## 4. Service Layer Execution Rules

### Rule 2.1: Asynchronous Promises
- ALL service methods must return `Promise<ApiResponse<T>>`, even when returning synchronous local mock data.
- Promises ensure non-blocking execution and consistent exception handling across Mock and Real API drivers.

### Rule 2.2: Mock Latency Simulation
- All mock service implementations MUST invoke the latency simulator `simulateNetworkDelay(ms?: number)` before returning data.
- Default latency range: `500ms` to `1200ms` to accurately test loading UI states and shimmer effects.

### Rule 2.3: Structured Error Propagation
- Services MUST NEVER swallow exceptions or return raw `undefined` / `null` without an `ApiResponse` envelope.
- Catch blocks in services must translate low-level driver exceptions into structured `AppError` objects and populate `ApiErrorResponse`.

### Rule 2.4: Immutability of Returned Data
- Mock services MUST return deeply cloned snapshots of local mock data (e.g. `structuredClone` or `JSON.parse(JSON.stringify(data))`) to prevent in-memory state contamination across queries.
