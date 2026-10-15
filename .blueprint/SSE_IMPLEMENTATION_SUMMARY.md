# SSE Streaming Implementation - Fixed & Debugged

## 🔧 Perbaikan yang Dilakukan

### 1. **Comprehensive Logging**
Menambahkan logging detail di semua layer untuk debugging:

- **SSE Client** (`sseClient.ts`):
  - Log saat stream dimulai (URL, method, headers, body)
  - Log saat connection opened/closed
  - Log setiap event yang diterima (raw data)
  - Log parsed data untuk setiap event
  - Log error dengan detail lengkap

- **API Service** (`ApiPracticeService.ts`):
  - Log saat membuat stream (path, params, token availability)
  - Log callback registration

- **Streaming Hooks** (`usePracticeStream.ts`):
  - Log saat memulai operasi (send message, create session, etc)
  - Log setiap callback yang dipanggil (started, text_delta, completed, etc)
  - Log data yang diterima dan di-parse
  - Log saat cache di-update
  - Log error dengan context lengkap

- **Conversation Screen** (`ConversationScreen.tsx`):
  - Log saat membuat session baru
  - Log hasil session creation
  - Log voice message sending

### 2. **Bug Fixes**

#### Fix 1: Callback Registration
**Masalah:** Callback tidak ter-register dengan benar karena menggunakan operator `??` yang salah.

**Sebelum:**
```typescript
stream
  .on('onStarted', callbacks.onStarted ?? (() => {}))
  .on('onTextDelta', callbacks.onTextDelta ?? (() => {}))
```

**Sesudah:**
```typescript
if (callbacks.onStarted) stream.on('onStarted', callbacks.onStarted);
if (callbacks.onTextDelta) stream.on('onTextDelta', callbacks.onTextDelta);
```

#### Fix 2: Error Handling
**Masalah:** Promise reject dipanggil dua kali saat error terjadi setelah completed.

**Solusi:** Menambahkan flag `completedReceived` untuk mencegah double reject:
```typescript
let completedReceived = false;

onCompleted: (data) => {
  completedReceived = true;
  // ... resolve promise
},

onError: (error) => {
  if (!completedReceived) {
    reject(error); // Only reject if completed was never received
  }
}
```

#### Fix 3: Session ID Validation
**Masalah:** Error "Greeting session baru belum dapat dikonfirmasi" tidak jelas penyebabnya.

**Solusi:** Menambahkan validasi dan logging:
```typescript
if (!sessionId) {
  console.error('[useCreateSessionStream] No session_id received!');
  reject(new Error('Greeting session baru belum dapat dikonfirmasi.'));
  return;
}
```

### 3. **File Structure**

```
src/
├── core/
│   └── network/
│       └── sseClient.ts                 ✅ Enhanced with logging
├── domain/
│   └── practice/
│       └── IPracticeService.ts          ✅ Added streaming methods
├── services/
│   └── api/
│       └── ApiPracticeService.ts        ✅ Implemented streaming + logging
└── features/
    └── practice/
        ├── hooks/
        │   └── usePracticeStream.ts     ✅ New streaming hooks + logging
        ├── components/
        │   └── StreamingIndicator.tsx   ✅ Real-time status indicator
        └── screens/
            └── ConversationScreen.tsx   ✅ Integrated streaming + logging
```

## 📊 Log Flow Examples

### Successful Greeting Creation
```
[ConversationScreen] Creating new session: { agentCode: 'elean', categoryId: 'xxx' }
[useCreateSessionStream] Starting session creation: { agentCode: 'elean', categoryId: 'xxx' }
[ApiPracticeService] Creating session stream: { path: '/practice/sessions:stream', hasToken: true }
[SSE] Starting stream: { url: 'https://...', method: 'POST', body: {...} }
[SSE] Connection opened
[SSE] Started event received: {"request_id":"...","session_id":"..."}
[useCreateSessionStream] Started: { session_id: 'xxx' }
[SSE] Text delta event received: {"text":"Hello!..."}
[useCreateSessionStream] Text delta: { text: 'Hello!...' }
[SSE] Completed event received: {"session_id":"...","first_message":{...}}
[useCreateSessionStream] Completed: { has_first_message: true }
[useCreateSessionStream] Built first message: { hasText: true, hasAudio: true }
[useCreateSessionStream] Cache updated for session: xxx
[useCreateSessionStream] Resolving with: { sessionId: 'xxx', hasFirstMessage: true }
[ConversationScreen] Session created: { sessionId: 'xxx', hasFirstMessage: true }
[ConversationScreen] Navigation params updated
```

### Failed Stream (Network Error)
```
[ConversationScreen] Creating new session: { agentCode: 'elean', categoryId: 'xxx' }
[useCreateSessionStream] Starting session creation: { agentCode: 'elean', categoryId: 'xxx' }
[ApiPracticeService] Creating session stream: { path: '/practice/sessions:stream', hasToken: true }
[SSE] Starting stream: { url: 'https://...', method: 'POST', body: {...} }
[SSE] Error event received: { type: 'error', message: 'Network request failed', xhrState: 4, xhrStatus: 0 }
[SSE] Calling onError callback: SSE connection error: Network request failed
[useCreateSessionStream] Error: Error: SSE connection error: Network request failed
[ConversationScreen] Failed to create session: Error: SSE connection error: Network request failed
```

## 🐛 Debugging Steps

### 1. Check if stream is starting
Look for:
```
[SSE] Starting stream: { url: '...', method: 'POST', ... }
```

### 2. Check if connection is established
Look for:
```
[SSE] Connection opened
```

### 3. Check if events are being received
Look for:
```
[SSE] Started event received: ...
[SSE] Text delta event received: ...
[SSE] Completed event received: ...
```

### 4. Check if events are being parsed correctly
Look for:
```
[SSE] Parsed started data: ...
[SSE] Parsed text_delta data: ...
[SSE] Parsed completed data: ...
```

### 5. Check if callbacks are being called
Look for:
```
[useCreateSessionStream] Started: ...
[useCreateSessionStream] Text delta: ...
[useCreateSessionStream] Completed: ...
```

### 6. Check if cache is being updated
Look for:
```
[useCreateSessionStream] Cache updated for session: xxx
[useSendMessageStream] Adding AI message to cache
```

### 7. Check for errors
Look for:
```
[SSE] Error event received: ...
[SSE] Failed to parse ... event: ...
[useCreateSessionStream] Error: ...
[ConversationScreen] Failed to create session: ...
```

## 🔍 Common Issues & Solutions

### Issue: No logs appearing
**Cause:** Stream not starting or callbacks not registered.

**Check:**
1. Is `[ApiPracticeService] Creating session stream` appearing?
2. Is `hasToken: true` in the log?
3. Is `[SSE] Starting stream` appearing?

**Solution:**
- Verify access token is available
- Check if `createSseStream` is being called
- Verify callbacks are registered

### Issue: Connection opened but no events
**Cause:** Backend not sending events or wrong event names.

**Check:**
1. Is `[SSE] Connection opened` appearing?
2. Are there any `[SSE] Error event received` logs?
3. Check backend logs for SSE connection

**Solution:**
- Verify backend is sending events with correct names (started, text_delta, completed, failed)
- Check backend SSE format (id, event, data)
- Verify network connection

### Issue: Events received but not parsed
**Cause:** JSON parse error or wrong data structure.

**Check:**
1. Look for `[SSE] Failed to parse ... event` errors
2. Check raw data in the log
3. Verify JSON structure matches interface

**Solution:**
- Ensure backend sends valid JSON
- Check field names (snake_case vs camelCase)
- Verify data types match interface

### Issue: Completed event but no message bubble
**Cause:** Cache not updated or message structure wrong.

**Check:**
1. Is `[useCreateSessionStream] Built first message` appearing?
2. Is `[useCreateSessionStream] Cache updated for session` appearing?
3. Check message structure in the log

**Solution:**
- Verify `queryClient.setQueryData` is called
- Check query key matches: `['practice', 'messages', sessionId]`
- Verify message has required fields (messageId, text, audioUrl, etc)

## 📝 Next Steps

1. **Test the implementation:**
   ```bash
   bun run start
   ```

2. **Open React Native Debugger** to see console logs

3. **Try creating a new chat** and watch the logs

4. **Send a text message** and verify streaming works

5. **Send a voice message** and check transcript appears

6. **Check for any error patterns** in the logs

7. **Report back** with the complete log output if issues persist

## 🎯 Expected Behavior

### Timeline for Text Message:
```
t=0s    : User sends message
t=0s    : [SSE] Starting stream
t=0s    : [SSE] Connection opened
t=0s    : [SSE] Started event received
t=39s   : [SSE] Text delta event received → Show text preview
t=45s   : [SSE] Completed event received → Add to chat, enable audio
```

### Timeline for Voice Message:
```
t=0s    : User sends voice
t=0s    : [SSE] Starting stream
t=0s    : [SSE] Connection opened
t=0s    : [SSE] Started event received
t=14s   : [SSE] Transcript event received → Update optimistic bubble
t=39s   : [SSE] Text delta event received → Show AI response
t=45s   : [SSE] Completed event received → Add to chat, enable audio
```

## 🔗 Related Files

- `src/core/network/sseClient.ts` - SSE client implementation
- `src/services/api/ApiPracticeService.ts` - API service with streaming methods
- `src/features/practice/hooks/usePracticeStream.ts` - React hooks for streaming
- `src/features/practice/components/StreamingIndicator.tsx` - UI component for streaming status
- `src/features/practice/screens/ConversationScreen.tsx` - Main chat screen

## 📚 Additional Resources

- [react-native-sse documentation](https://github.com/binaryminds/react-native-sse)
- [Server-Sent Events specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [React Query documentation](https://tanstack.com/query/latest)
