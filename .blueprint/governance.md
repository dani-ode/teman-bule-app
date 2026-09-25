# Rules, Acuan dan Audit Awal

## Sumber yang dipelajari

Backend `.agents/rules/`: `public`, `api-design`, `database`, `security`, `testing`, `callcraft`, `langflow`, `frontend`, `skills`. Backend blueprint utama: README, architecture, product-requirements, api-events, auth-provider-policy, billing-plans, realtime-podcast, environment, langflow-flows, callcraft-tools, runtime-components, contract-artifacts dan decision-register. Konfigurasi `.agents/mcp_config.json` serta launcher `langflow_mcp.py` juga ditinjau.

Frontend existing: `docs/rules/01-architecture-and-structure.md` sampai `04-mock-data-and-api-contracts.md`, package/lock, App, config, DI dan struktur source.

## Prioritas dan rekonsiliasi

1. Backend adalah acuan domain/wire: endpoint, state, biaya, permission dan ownership tidak diubah sepihak oleh frontend.
2. Blueprint frontend ini menetapkan target integrasi dan menandai proposal yang belum memiliki schema backend final.
3. `docs/rules/` adalah arsip prototipe superseded, bukan rules aktif; detail mock/example di sana bukan DTO backend produksi. Rules aktif melalui root `AGENTS.md` dan `.blueprint/engineering-rules.md`; spesifikasi dipusatkan di `.blueprint/`.
4. Interface domain yang sudah ada dipertahankan sampai ada migration terencana; adapter memetakan DTO, bukan memaksa server mengikuti mock JSON.
5. Klaim SDK/vendor hanya boleh berdasarkan versi terpilih dan bukti integrasi. Konfigurasi MCP terbaca bukan bukti konektivitas server.

## Aturan engineering

- TypeScript strict; input eksternal bertipe `unknown` sampai tervalidasi. Hindari `any`, cast untuk menutupi mismatch dan empty catch.
- Screen → hook/application → domain port. Infrastructure mengimplementasikan domain port; domain tidak mengimpor service, React atau SDK vendor.
- Config wajib eksplisit. Invalid/missing config menimbulkan typed error, tanpa URL/default provider/harga/mock fallback tersembunyi.
- Dynamic content, model, agent ID, plan, harga dan limits berasal backend. Design tokens berasal theme; copy terpusat pada resource UI saat implementasi.
- Error HTTP memakai envelope backend; internal `ApiResponse<T>` existing merupakan abstraction frontend, bukan bentuk response server yang diasumsikan.
- POST domain mutation memakai idempotency key; PUT/PATCH memakai version sesuai schema. Untuk auth/protocol exception, sepakati kontrak terlebih dahulu.
- Async accepted bukan completed. Cache/event realtime bukan sumber saldo, progress tersimpan atau job completion.
- Secret tidak masuk env public, bundle, telemetry, navigation params, URL atau fixture. BYOK hanya input transient ke API backend.
- Test doubles untuk UI/contract lokal diperbolehkan dengan label eksplisit; bukan bukti fitur live.

## Gap existing → target

| Temuan | Dampak / tindak lanjut |
|---|---|
| Dua tab manual, belum lima tab/auth stack | Navigation milestone F1, tanpa migrasi massal screen saat dokumentasi |
| Hanya mock drivers di DI | API mode belum bisa digunakan; adapter milestone F2 |
| Env awal memakai `process.env[key]` dan fallback | Diganti static dot notation agar Expo dapat inline, validation dan konfigurasi lokal eksplisit |
| Mock envelope camelCase, backend error snake_case dengan `details: []` | Mapping transport terpisah, jangan casting response menjadi model UI |
| Diagram legacy mengesankan domain bergantung infrastructure | Dependency source yang benar: infrastructure → domain; orchestration lewat port |
| Rules mock memiliki dua rentang latency berbeda | Satu `EXPO_PUBLIC_MOCK_LATENCY_MS` eksplisit; tidak mengklaim random latency |
| AppError existing menggunakan request ID buatan client | Pertahankan server `request_id`; client correlation dibedakan saat API adapter dibuat |
| Native refresh/Google handoff belum ditentukan backend | FE-02 menghambat auth native production |
| Event names tersedia, transport replay/DTO belum rinci | FE-03/04 menghambat stream dan realtime production |
| Native LiveKit dependencies belum terpasang | Compatibility spike FE-01 sebelum development build |

## Tata kelola perubahan

Setiap perubahan: requirement → decision → kontrak/schema → adapter/UI → evidence. Ticket menyatakan affected backend docs, environment keys, data migration/cache version, rollback dan status implementasi. Breaking wire change memerlukan versi schema baru. Jangan menyalin backend secret/config ke frontend untuk menyelesaikan blocker.
