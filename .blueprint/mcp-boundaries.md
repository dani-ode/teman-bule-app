# MCP dan Integrasi Internal

## Konfigurasi yang ditemukan

| Entry backend `.agents/mcp_config.json` | Transport / fungsi |
|---|---|
| `callcraft` | `serverUrl: https://callcraft-api.flyup.id/mcp/v1/sse`; SSE MCP untuk discovery/routing/control sesuai deployment |
| `langflow` | `uv run --no-project --with python-dotenv python .agents/langflow_mcp.py` |

Launcher Langflow membaca `.env` **backend** melalui path file launcher, dengan environment proses mengoverride. `LANGFLOW_MCP_STREAMABLE_URL` wajib; `LANGFLOW_API_KEY` jika ada diteruskan sebagai header `x-api-key`. Ia menjalankan `uvx --with mcp<2 mcp-proxy --transport streamablehttp`. Secret tidak berada dalam JSON config.

Endpoint project Langflow mengekspos published flows. Tidak diasumsikan dapat membuat/edit canvas; itu memerlukan API atau management MCP berbeda. Backend chat/background rutin memakai Langflow HTTP adapter; MCP bukan message queue atau browser realtime transport.

## Batas frontend

- App hanya API public backend, LiveKit media, scoped object storage dan browser OAuth/checkout yang disetujui.
- Tidak ada dependency MCP client, CallCraft endpoint, Langflow API key, execution grant atau credential broker di bundle.
- AI tool flow: realtime worker/Langflow → CallCraft → internal domain API. User action deterministik seperti save vocabulary melalui API public tidak harus menjadi tool AI.
- Semua `/internal/v1/*` tetap server-to-server. Frontend tidak pernah memanggil credentials:resolve atau runtime context:resolve.
- Dokumentasi MCP boleh dirujuk dari frontend, tetapi salinan credentials/backend `.env` tidak diperlukan.

## Tooling developer

Konfigurasi relatif launcher ditujukan dijalankan dari root backend. Menyalin JSON apa adanya ke frontend akan mencari `.agents/langflow_mcp.py` di lokasi yang salah. Jika developer memerlukan MCP lintas repo, buat launcher/path/CWD eksplisit di konfigurasi harness yang dipakai dengan tetap mengambil environment backend; jangan menggabungkannya ke Expo config.

## Gap yang harus diketahui

1. Backend `callcraft-tools.md` menyebut konfigurasi agent menyertakan `user_id`, tetapi JSON aktual hanya `serverUrl`. Auth/identity format nyata perlu DEC-11; jangan menambahkan parameter user_id tebakan.
2. API Langflow v2 adalah target sesudah DEC-10; config runtime backend masih v1. Frontend tidak mengganti URL Langflow atau memanggilnya sendiri untuk mengatasi gap.
3. Draft tools/flow catalogs bukan executable exports atau bukti runtime gateway aktif.
4. Pemeriksaan ini membaca config/source lokal; tidak menjalankan MCP initialize/tools/list, remote flow, provisioning atau request billable. Konektivitas/auth server belum dibuktikan.

Evidence integrasi berikutnya: redacted initialize/tools/list sesuai transport, versi server/SDK, scope/auth negatif, schema tool, CallCraft endpoint binding dan Langflow import/run/cancel. Dilaksanakan pada pekerjaan backend terkait; hasil disimpan di blueprint backend dan ditautkan dari sini.
