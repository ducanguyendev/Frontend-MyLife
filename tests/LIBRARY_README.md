# Library regression checks

From `Frontend-MyLife`:

```powershell
npm.cmd run test:library
npm.cmd run test:avatar
npm.cmd run build
npm.cmd run lint
```

Library service tests execute the actual TypeScript service with an apiClient
spy. They cover all existing routes, abort signals, batch files plus common
metadata, and rejection propagation without fallback data.

Optional browser check uses Puppeteer and Microsoft Edge on Windows. The local
workspace already has Puppeteer under `scratch_puppeteer/node_modules`; if absent,
set `PUPPETEER_MODULE` to an existing Puppeteer installation. No runtime dependency
is added to the application. Start a local Vite server in another terminal:

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 7001 --strictPort
node tests/library-ui.browser.cjs
```

Optional overrides: `LIBRARY_UI_TEST_URL`, `BROWSER_EXECUTABLE`,
`PUPPETEER_MODULE`. Browser artifacts go to a newly created temporary directory
printed on completion/failure.

The browser check intercepts every `/api/` request and supplies fixture responses
(including CORS preflight), so it performs no real backend or Drive writes. It
inspects real FormData at the fetch boundary because CDP can omit disk-backed file
parts. It verifies album CRUD, gallery/category/album filters, lightbox metadata,
batch upload, photo editing, failed deletion/retry, error/empty states, mobile
viewport bounds and screenshots in both themes. Fixtures are actual JPEG/PNG/WebP
images from the backend test directory. This is UI regression coverage with a
mocked API; backend HTTP/PostgreSQL integration coverage is in `Backend-MyLife/Tests`.
