# Reproducing W10

Prerequisites: Node.js 24 (tested with 24.17.0), npm, .NET 10 SDK, PostgreSQL binaries (tested with 18), and network access for dependency/browser installation. Run Frontend commands from `Frontend-MyLife`.

```powershell
npm.cmd ci
npx.cmd puppeteer browsers install chrome
npm.cmd run build
npm.cmd run lint
npm.cmd run test:regression
npm.cmd run test:browser:smoke
npm.cmd run test:browser:qa
```

Puppeteer is pinned to `25.11.0` in devDependencies and package-lock. The W10 suites use `require('puppeteer')`, not `scratch_puppeteer`. Browser installation can be omitted when the matching Chromium is already cached; it is explicit here for clean machines. Legacy optional browser scripts outside this critical QA runner still retain their historical setup.

Regression includes checks of the built production manifest, so build first. The browser runner starts/stops Vite automatically, runs suites sequentially, records each exit code, and exits nonzero if any suite fails. It uses intercepted local fixtures; it does not test a real Backend. Default port is 7009; set `MYLIFE_QA_PORT` to select another. `MYLIFE_UI_URL` uses an already-running test server instead. Results default to this review directory; `MYLIFE_QA_DIR` can select a new output folder.

## Backend build and tests

```powershell
Set-Location ..\Backend-MyLife
dotnet restore Tests/Backend-MyLife.Tests.csproj
dotnet build Tests/Backend-MyLife.Tests.csproj -c Release --no-restore
node --test Tests/apps-script-avatar.test.cjs Tests/apps-script-member-avatar.test.cjs Tests/apps-script-library.test.cjs
```

For the DB-backed tests, prefer the isolated runner below. Do not run `dotnet test` with an application database connection. The runner sets its own disposable database for the C# tests.

## Isolated real integration

After restoring the Backend project, from `Frontend-MyLife`:

```powershell
# Only needed when PostgreSQL bin is not on PATH:
$env:PG_BIN = 'E:\PostgreSQL\18\bin'
npm.cmd run test:integration
```

`PG_BIN` may point to another compatible PostgreSQL installation. On Windows, process restrictions can prevent PostgreSQL/Chromium from starting; run in a local terminal with permission to launch them. Do not disable application security controls to work around test-environment restrictions.

The integration runner creates a new cluster under workspace `.tmp/w10-integration-*` and a random database `mylife_w10_*`, bound to loopback on a free port. It overrides DB/auth/provider settings with test-only values, runs the real migrations and DB-backed tests, then starts real Kestrel and Vite for HTTP/browser checks. Google/Drive/VietMap live services are deliberately not invoked. The browser passes requests through to Kestrel; no API fixture responses are used in that stage.

The `finally` block stops the servers, drops only the database created by that run and stops its cluster. Lifecycle evidence records both cleanup steps. Cluster files are retained under `.tmp` for inspection; no application data is accessed or deleted. Local trust authentication is limited to this temporary loopback cluster. No production credentials are required or logged.

A deliberately short, five-second access lifetime makes expiry/refresh checks reproducible without long waits. The CSRF/Origin/RBAC middleware remains enabled. Rate-limit tests use small configured limits in the ASP.NET test host; the live browser stage uses higher test-only permits to avoid masking other checks.

Historical TRX files are gzip-compressed in this delivered evidence to reduce size. Reruns produce ordinary TRX files; both are readable by standard XML/test-result tools after decompression. Only representative PNGs are retained; all matrix JSON metrics are kept. Reruns can generate the complete screenshot set.
