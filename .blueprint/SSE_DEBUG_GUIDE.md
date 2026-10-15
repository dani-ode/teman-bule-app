# SSE Streaming Debug Guide

## Comprehensive Logging

Sekarang semua SSE operations memiliki logging yang detail. Berikut adalah log flow yang seharusnya muncul:

### 1. Create Session Stream (Greeting)

```
[ConversationScreen] Creating new session: { agentCode: 'elean', categoryId: 'xxx' }
[useCreateSessionStream] Starting session creation: { agentCode: 'elean', categoryId: 'xxx' }
[ApiPracticeService] Creating session stream: { path: '/practice/sessions:stream', agentCode: 'elean', categoryId: 'xxx', hasToken: true }
[SSE] Starting stream: { url: 'https://...', method: 'POST', headers: {...}, body: {...} }
[SSE] Connection opened
[SSE] Started event received: {"request_id":"...","session_id":"...","schema_version":"..."}
[SSE] Parsed started data: { request_id: '...', session_id: '...', schema_version: '...' }
[useCreateSessionStream] Started: { request_id: '...', session_id: '...', schema_version: '...' }
[SSE] Text delta event received: {"text":"Hello! Welcome..."}
[SSE] Parsed text_delta data: { text: 'Hello! Welcome...' }
[useCreateSessionStream] Text delta: { text: 'Hello! Welcome...' }
[SSE] Usage updated event received: {"usage":{"input_tokens":100,"output_tokens":50}}
[SSE] Parsed usage data: { usage: { input_tokens: 100, output_tokens: 50 } }
[useCreateSessionStream] Usage: { input_tokens: 100, output_tokens: 50 }
[SSE] Completed event received: {"session_id":"...","first_message":{...}}
[SSE] Parsed completed data: { message_id: '...', session_id: '...', has_audio_url: true, audio_duration_ms: 5000, keys: [...] }
[useCreateSessionStream] Completed: { session_id: '...', has_first_message: true, keys: [...] }
[useCreateSessionStream] First message data: { message_id: '...', text: '...', audio_url: '...', ... }
[useCreateSessionStream] Built first message: { messageId: '...', hasText: true, hasAudio: true }
[useCreateSessionStream] Cache updated for session: xxx
[useCreateSessionStream] Resolving with: { sessionId: 'xxx', hasFirstMessage: true }
[ConversationScreen] Session created: { sessionId: 'xxx', hasFirstMessage: true, firstMessageId: '...' }
[ConversationScreen] Navigation params updated
[SSE] Closing stream
[SSE] Connection closed
```

### 2. Send Text Message Stream

```
[useSendMessageStream] Sending text message: { sessionId: 'xxx', textLength: 50 }
[ApiPracticeService] Creating message stream: { path: '/practice/sessions/xxx/messages:stream', ... }
[SSE] Starting stream: { url: 'https://...', method: 'POST', ... }
[SSE] Connection opened
[SSE] Started event received: {"request_id":"...","session_id":"...","user_message_id":"..."}
[useSendMessageStream] Started: { ... }
[SSE] Text delta event received: {"text":"AI response..."}
[useSendMessageStream] Text delta: { text: 'AI response...' }
[SSE] Completed event received: {"message_id":"...","audio_url":"...","user_message_id":"..."}
[useSendMessageStream] Completed: { message_id: '...', session_id: '...', has_audio: true, user_message_id: '...' }
[useSendMessageStream] Built messages: { hasUserMessage: true, hasAiMessage: true, aiText: 'AI response...' }
[useSendMessageStream] Adding user message to cache
[useSendMessageStream] Adding AI message to cache
[SSE] Closing stream
```

### 3. Send Voice Message Stream

```
[ConversationScreen] Sending voice message stream
[useSendVoiceStream] Sending voice message: { sessionId: 'xxx', mediaId: 'xxx', clientMessageId: 'xxx' }
[ApiPracticeService] Creating voice message stream: { path: '/practice/sessions/xxx/voice-messages:stream', ... }
[SSE] Starting stream: { url: 'https://...', method: 'POST', ... }
[SSE] Connection opened
[SSE] Started event received: {"request_id":"...","session_id":"...","user_message_id":"..."}
[useSendVoiceStream] Started: { ... }
[SSE] Transcript event received: {"text":"User said..."}
[useSendVoiceStream] Transcript: { text: 'User said...' }
[SSE] Text delta event received: {"text":"AI response..."}
[useSendVoiceStream] Text delta: { text: 'AI response...' }
[SSE] Completed event received: {"message_id":"...","audio_url":"...","user_message_id":"..."}
[useSendVoiceStream] Completed: { ... }
[SSE] Closing stream
[ConversationScreen] Voice message sent successfully
```

## Common Issues & Solutions

### Issue 1: "Greeting session baru belum dapat dikonfirmasi"

**Penyebab:** Event `completed` tidak pernah diterima atau `session_id` kosong.

**Debug:**
1. Cek apakah `[SSE] Completed event received` muncul di log
2. Cek apakah `[useCreateSessionStream] Resolving with` menunjukkan `sessionId` yang valid
3. Cek apakah ada error di `[SSE] Error event received`

**Solusi:**
- Pastikan backend mengirim event `completed` dengan `session_id`
- Cek network connection
- Verifikasi access token valid

### Issue 2: Message bubble tidak tampil

**Penyebab:** Cache tidak ter-update dengan benar.

**Debug:**
1. Cek apakah `[useSendMessageStream] Adding AI message to cache` muncul
2. Cek apakah `[useCreateSessionStream] Cache updated for session` muncul
3. Verify `messages.data` di ConversationScreen

**Solusi:**
- Pastikan `queryClient.setQueryData` dipanggil dengan benar
- Cek query key: `['practice', 'messages', sessionId]`
- Verify message structure sesuai dengan `ConversationMessage` type

### Issue 3: Stream tidak start

**Penyebab:** Access token tidak tersedia atau SSE connection gagal.

**Debug:**
1. Cek `[ApiPracticeService] Creating session stream` → `hasToken: true`
2. Cek `[SSE] Starting stream` → URL dan headers benar
3. Cek `[SSE] Connection opened` muncul

**Solusi:**
- Pastikan user sudah login dan access token tersedia
- Cek CORS configuration di backend
- Verify SSE endpoint URL benar

### Issue 4: Events tidak ter-parse

**Penyebab:** Format data dari backend tidak sesuai.

**Debug:**
1. Cek `[SSE] Failed to parse ... event` errors
2. Lihat raw data di log
3. Verify JSON structure

**Solusi:**
- Pastikan backend mengirim JSON yang valid
- Cek field names sesuai dengan interface (snake_case)
- Verify `data` field tidak kosong

## Testing Checklist

- [ ] Create new session (greeting) works
- [ ] Send text message works
- [ ] Send voice message works
- [ ] Message bubbles appear correctly
- [ ] Streaming indicator shows real-time status
- [ ] Audio plays automatically for new messages
- [ ] Error handling works (network loss, timeout)
- [ ] Stream cleanup on unmount
- [ ] Token refresh during long streams

## Backend Requirements

Pastikan backend mengirim events dengan format:

```
id: 1
event: started
data: {"request_id":"...","session_id":"...","schema_version":"..."}

id: 2
event: text_delta
data: {"text":"Hello!..."}

id: 3
event: completed
data: {"message_id":"...","session_id":"...","audio_url":"...",...}
```

Setiap frame dipisahkan dengan `\n\n`.
