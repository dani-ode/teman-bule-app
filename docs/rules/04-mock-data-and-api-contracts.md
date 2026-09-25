> HISTORICAL / SUPERSEDED: synthetic prototype fixtures, not production API contracts. Binding rules: [AGENTS.md](../../AGENTS.md) and [engineering-rules.md](../../.blueprint/engineering-rules.md); actual DTOs require backend-approved schemas.

# Rule Spec 04: Mock Data & API Contracts

## 1. Domain Schemas & Specifications

The mock dataset located at `src/data/mock/mockData.json` represents the foundational domains of **TemanBule**:

### 1. UserProfile Domain Schema
Represents the authenticated learner profile, English proficiency level based on CEFR standards (A1, A2, B1, B2, C1, C2), learning goals, streak counter, and current statistics.

```json
{
  "userProfile": {
    "id": "usr_99812",
    "fullName": "Budi Santoso",
    "email": "budi.santoso@example.com",
    "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    "targetLanguage": "English",
    "nativeLanguage": "Indonesian",
    "proficiencyLevel": "B1",
    "dailyGoalMinutes": 20,
    "streakDays": 7,
    "totalXp": 1450,
    "joinedAt": "2026-01-15T08:30:00Z"
  }
}
```

### 2. ChatHistory Domain Schema
Represents interactive conversation history between the learner and "TemanBule" (AI Tutor), including real-time grammar corrections, suggestions, and explanations.

```json
{
  "chatHistory": [
    {
      "id": "msg_001",
      "sessionId": "sess_1001",
      "sender": "user",
      "text": "Yesterday I go to the supermarket for buying some apples.",
      "timestamp": "2026-09-05T10:14:00Z"
    },
    {
      "id": "msg_002",
      "sessionId": "sess_1001",
      "sender": "ai_tutor",
      "text": "Great effort! Here is a natural way to express that sentence in past tense:",
      "timestamp": "2026-09-05T10:14:02Z",
      "correction": {
        "originalText": "Yesterday I go to the supermarket for buying some apples.",
        "correctedText": "Yesterday I went to the supermarket to buy some apples.",
        "explanation": "Use past simple 'went' instead of 'go' for past actions, and 'to buy' instead of 'for buying'.",
        "grammarPoint": "Past Simple Tense & Infinitive of Purpose"
      }
    }
  ]
}
```

### 3. LessonModules Domain Schema
Represents available structured English learning modules categorized by CEFR difficulty, topic domain, duration, and completion status.

```json
{
  "lessonModules": [
    {
      "id": "les_101",
      "title": "Mastering Business Email Greetings",
      "category": "Business English",
      "level": "B1",
      "estimatedMinutes": 15,
      "completed": true,
      "progressPercentage": 100,
      "description": "Learn professional opening and closing phrases for formal workplace emails."
    }
  ]
}
```

---

## 2. Latency & Mock Driver Rules

### Rule 4.1: Simulated Async Delay
- Mock services MUST use `simulateNetworkDelay(ms)` with variable delays (500ms - 1000ms) to mirror realistic network conditions.

### Rule 4.2: Schema Validation
- Mock data parsing in services MUST perform runtime type checking or validation before returning data to prevent runtime type mismatch exceptions.
