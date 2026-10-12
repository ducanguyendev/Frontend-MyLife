# FamilyTree, Library image and Register localization audit

## 1. Starting state and scope

- Frontend branch: `feature_minhduc`; the working tree already contained multiple uncommitted UI, FamilyTree, Library and modal changes from earlier work. Those changes were preserved.
- Backend branch: `feature_minhduc`; the Backend working tree was clean before this task.
- Changes in this task are limited to sibling classification, Register API error codes/localization, the API contract, and the existing live Library verification script. No migration or runtime Library image code was changed.

## 2. FamilyTree sibling classification

The previous `isFullSibling` rule required both father and mother IDs to match. The confirmed rule is now `sameKnownFather || sameKnownMother`, implemented as `isBiologicalSibling`. A parent counts only when both members have a known positive ID; two missing IDs do not match.

`getSiblingKind` checks biological sibling status first. Therefore a legacy explicit `sibling` horizontal relation between half siblings remains in the biological group and is not duplicated as a cousin. Non-biological cousin classification still requires an explicit horizontal relation. Relation types are read case-insensitively and trimmed. Existing per-user filtering is preserved.

Focused tests cover shared father, shared mother, both parents, null parents, explicit cousin, legacy cousin relation on a biological sibling, and the named Đức/Bảo, Sơn Tùng, and Hoàng Minh scenarios. Results:

- Đức (2005, male) and Bảo (2009, male), sharing mother ID: biological siblings; labels resolve to younger brother / older brother from the two perspectives.
- Sơn Tùng (1998, male), explicit relation and no shared parent: older male cousin from Đức’s perspective.
- Hoàng Minh with no DOB in the test fixture: neutral cousin label; age is not guessed.
- The actual Hoàng Minh record was not available to this pass. Backend `FamilyMemberDto` contains `DateOfBirth`, the backend mapper copies the entity field directly, and the frontend mapping preserves the returned date (removing only a trailing time component). This shows no evident mapping loss, but does not establish whether that real record’s DOB is null.
- Cross-user isolation is enforced by resolving the authenticated owner’s tree and querying members by that tree ID; relationship references are also checked against the same tree. No isolation code was changed.

## 3. Library image flow and live evidence

Audit findings:

- Frontend upload consumes persisted photo DTOs; gallery mapping retains both `url` and `driveFileId`, and `LibraryImage` uses a finite, deduplicated primary/fallback list.
- Backend `PhotoDto` returns `DriveFileId` and `Url`; upload stores the stable Drive ID and returns a `lh3.googleusercontent.com/d/{id}` URL. Apps Script storage source and permissions were not changed.
- The existing live harness intercepts application `/api` calls, so its reload is a UI refresh simulation and does **not** prove the real database GET response. No authenticated application API/database was available for this pass.

The live harness initially used an `ADMIN` fixture, which cannot access the USER-only FamilyTree route. The fixture was corrected to `USER`, and the harness was extended to log image response URLs/status/redirect chains. It uploads disposable WebP/JPG/PNG/GIF fixtures directly to the configured Apps Script Drive storage, verifies original bytes/checksums, exercises the gallery, reload and lightbox, then trashes the temporary album in `finally`.

Live results from the successful run:

- Upload response returned a Drive file ID, content type, byte count, checksum and stable `lh3` URL for each fixture. Example JPG: `https://lh3.googleusercontent.com/d/1kqtsk-9527Mjcx1HA9xbFejqdS5fMO4Z`.
- The harness supplied DTO-like records with the same Drive IDs/URLs to the UI again after reload. This part was mocked; it is not a real backend GET response.
- Image requests for JPG/PNG/WebP/GIF used `lh3.googleusercontent.com/d/{id}=w640`, returned HTTP 200, and had no redirects. The post-reload requests also returned HTTP 200.
- Gallery, reload simulation, lightbox and original Drive links passed for all four fixtures. No 429/403/404 occurred; no retry loop was observed. Each image made one thumbnail request per gallery load; lightbox requests only occurred when opened.
- No production persisted-image failure was reproduced in this isolated live fixture, so there is no evidence-backed Library runtime change to make. Actual POST through the Backend API, real album GET after F5, and the affected user’s photo remain unverified.
- Google Apps Script source was not modified; redeploy is not required for these changes.

## 4. Register error localization and codes

Root cause: the Register page previously passed `getApiErrorMessage(err)` to UI state, which exposes `ApiError.message` and therefore showed English backend diagnostics in a Vietnamese locale.

Register now maps known payload codes to VI/EN keys and uses localized rate-limit or generic fallbacks for unknown errors. It does not show raw backend messages. Local field validation and localized success text remain unchanged.

Backend Register responses now include machine-readable codes with semantic HTTP statuses:

| Code | Status | Meaning |
| --- | ---: | --- |
| `AUTH_PASSWORD_MISMATCH` | 400 | Passwords do not match |
| `AUTH_PASSWORD_TOO_LONG` | 400 | Password exceeds 72 UTF-8 bytes |
| `AUTH_GMAIL_REQUIRED` | 400 | Email is not a Gmail address |
| `AUTH_EMAIL_ALREADY_REGISTERED` | 409 | Duplicate email |
| `AUTH_DOB_INVALID` | 400 | Missing, invalid, future or out-of-range DOB |
| `AUTH_SERVICE_NOT_INITIALIZED` | 503 | Required role/service is unavailable |
| `RATE_LIMITED` | 429 | Existing rate limit behavior retained |

The existing model-state response factory maps known Register model validation cases to those codes only on `/api/auth/register`; other endpoints keep their existing validation response. `API_CONTRACT.md` documents the Register codes. Frontend tests cover every code in both locales, rate limiting, and unknown-error generic fallback. Backend integration tests were added for the codes/statuses, but could not execute because the isolated test PostgreSQL at `127.0.0.1:55439` was unavailable.

## 5. Validation and remaining live checks

Frontend: PASS — build, lint, `test:i18n`, `test:library`, `test:library-ui`, `test:roles`, `test:avatar`, `test:optimization`, sibling tests (6), Register mapping tests (2), native Select tests (6), MemberDetail relation-chip test (1), and `git diff --check`.

Backend:

- `dotnet build Tests/Backend-MyLife.Tests.csproj -c Release --no-restore`: PASS, 0 warnings/errors.
- `dotnet test Tests/Backend-MyLife.Tests.csproj -c Release --no-build --no-restore`: 61 passed, 34 failed because the test database endpoint refused connections at `127.0.0.1:55439`. No database was started, reset or migrated.
- `node Tests/verify-live-library-images.cjs`: PASS against live Apps Script storage and Google image URLs; test album was trashed. Backend API responses were mocked as described above.
- Backend `git diff --check`: PASS.

Required manual checks still outstanding:

1. With the real app/database and an authenticated USER session, verify the POST upload response includes photo ID, Drive ID, URL, filename and content type.
2. Verify a real album GET after F5 returns the same Drive ID and URL, then inspect the actual browser image request/redirect chain for the affected photo.
3. Check the real Hoàng Minh record’s DOB and confirm neutral or DOB-derived label as appropriate.
4. Submit a duplicate registration in VI and EN against the running Backend, and confirm HTTP 409/code plus localized UI text.

No mobile code changed. No database migration was created. No Apps Script deployment is required. No commit or push was made.
