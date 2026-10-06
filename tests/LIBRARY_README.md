# Library regression checks

From `Frontend-MyLife`:

```powershell
npm.cmd run test:library
npm.cmd run test:library-ui
npm.cmd run test:i18n
npm.cmd run test:avatar
npm.cmd run build
npm.cmd run lint
```

Library service tests execute the actual TypeScript service with an apiClient
spy. They cover all existing routes, abort signals, batch files plus common
metadata, and rejection propagation without fallback data.

`test:i18n` executes actual FamilyTreeManager/LibraryTab mutation callbacks with
mocked React hooks/API boundaries and the real i18next VI/EN catalogs. It covers
backend-English member-delete success, action-specific Library toasts, error
code/status fallbacks, and live locale changes for album/member validation errors.
Category create/delete callbacks are also exercised in both languages.

`test:library-ui` executes the actual modal/image components with controlled
hooks and real VI/EN catalogs. It checks blank names, unchanged open modals,
live locale switches, object URL cleanup, remove/replace, all file boundaries,
dynamic category defaults/labels, matching input/select classes, image fallback,
stale error events, exhausted placeholders and original Drive links.

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
batch upload, object URL previews/removal/cleanup, equal computed field sizing,
dynamic category creation/preselection/deletion/in-use errors, actual image
fallback error events, placeholders, reload and original links,
photo editing, failed deletion/retry, error/empty states, mobile
viewport bounds and screenshots in both themes. Fixtures are actual JPEG/PNG/WebP
images from the backend test directory plus a GIF fixture. This is UI regression coverage with a
mocked API; backend HTTP/PostgreSQL integration coverage is in `Backend-MyLife/Tests`.

Optional real Drive check (starts from the same running Vite server):

```powershell
cd ../Backend-MyLife
node Tests/verify-live-library-images.cjs
```

This reads the configured Apps Script endpoint without printing it, creates a
unique disposable Drive album, uploads WebP/JPG/PNG/GIF fixtures, verifies
MD5/MIME/size and downloaded original bytes, renders the actual Library UI using
those Drive IDs, checks gallery/reload/lightbox/original links, and trashes the
test album in finally. It intercepts application API responses and does not
write the application DB. Run only when authorized to create test files in Drive.
`Dog.webp` in this check is a small test fixture, not the user's original asset.
