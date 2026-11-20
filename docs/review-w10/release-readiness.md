# W10 release readiness

Final verdict: **PARTIAL PASS**.

Public release recommendation: **not ready for unconditional public release**. The tested local application is stable after the fixes; live provider and production transport checks remain open. No deployment, commit, push, merge or PR was performed.

| Release gate | Result | Evidence / remaining work |
|---|---|---|
| Frontend regression | PASS | 360/360, no skips; all 29 original failures resolved with documented classifications. |
| Frontend build/lint | PASS | Build exit 0; lint 0 errors/0 warnings. Map chunk warning remains understood. |
| Backend build and DB-backed tests | PASS with real Backend/PostgreSQL | 182/182; external providers substituted only in ASP.NET test host. |
| Apps Script contracts | PASS with mock/fixture only | 45/45 Node tests; does not verify deployed Apps Script/Drive. |
| Real Kestrel HTTP/browser | PASS with real Backend/PostgreSQL | Nine groups; actual cookie auth, CSRF/RBAC, CRUD, isolation, refresh and logout; no API interception. |
| Registration/login/logout/session | PASS with real Backend/PostgreSQL | Browser reload and expired access token restore, six requests share one refresh POST, copied logged-out cookies rejected. |
| Security middleware/rate limits | PASS | Real HTTP Origin/CSRF and role checks; PostgreSQL-backed ASP.NET tests exercise rotation concurrency, configured rate limits, Retry-After, DB constraints and unavailable-readiness path. |
| Responsive/accessibility | PASS with mock/fixture only | 1920/1440/820/390 × light/dark × VI/EN; 240 views, 78 interaction checks, touch drawer/login, Admin and profile tests. Local real-browser member rendering also passes. |
| Google OAuth | NOT TESTED | Requires a dedicated OAuth test project/account and authorized callback origins. Google verifier is substituted in automated Backend tests. |
| Google Drive / deployed Apps Script | NOT TESTED | Real album storage, image upload/read/delete and permissions require dedicated non-production Drive roots/deployment. Core metadata/ownership/storage-failure behavior passes against DB with a substituted storage boundary. |
| Live VietMap tiles/geocoding | NOT TESTED | Requires restricted test keys/provider availability. Provider is unchanged; local map projection/manual coordinates pass. Network provider calls are disabled/aborted in W10. |
| Production HTTPS cookies/origins | NOT TESTED | Local Kestrel uses Development HTTP and HttpOnly SameSite=Lax cookies. Confirm Secure/SameSite/CORS configuration over the intended HTTPS origins in isolated staging. Production branch is inspected, not exercised over TLS. |
| Physical mobile / Safari | NOT TESTED | Chromium touch emulation only; verify a real iOS/Android device before claiming that coverage. |
| Server pagination | NOT TESTED / contract gap | Existing users API has no pagination metadata; logs return latest 50 records. Frontend search/filter/sort operate on loaded records. No invented pagination added in stabilization. |

## Remaining defects and risks

No unexplained failures remain in executed final suites. No known material defect remains in the tested local paths. This is not a claim that every deployment/provider path has passed.

- Largest map-related chunk is about 1.15 MB uncompressed / 309 KB gzip. It is outside the initial entry import closure. No artificial chunk-limit increase or provider replacement was used to silence the warning.
- Access JWTs now require an active existing refresh session. Old access tokens fall through the normal refresh path; clients with an invalid/revoked refresh session must sign in again. Verify this transition with any external native client before rollout; Mobile source was not modified or tested here.
- Concurrent refresh is tested within one real browser page and at the Backend rotation boundary. A multi-tab browser stress test was not performed.
- A clean install was assessed using pinned Puppeteer plus lockfile and an offline `npm ci --dry-run`. A fully fresh OS/browser download was not performed.

## Conditions before public release

1. Run Google OAuth, Drive upload/album lifecycle and VietMap smoke checks with isolated test credentials and data.
2. Run cookie/session/CSRF checks through the intended HTTPS staging origins, including an upgrade from pre-W10 cookies.
3. Verify real mobile navigation, dialogs and uploads; confirm the current loaded-record Admin limits are acceptable.
4. Review the exact changes and evidence, including the session-revocation change. Apply reviewed migrations separately in production; W10 never migrated a production/development user database.
