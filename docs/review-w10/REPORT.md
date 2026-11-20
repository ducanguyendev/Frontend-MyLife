# MyLife W10 — Final regression, integration and release readiness

Date: 10 November 2026, Asia/Saigon.

## 1. Executive summary

Final verdict: **PARTIAL PASS**.

All 29 reproduced Frontend baseline failures are resolved with documented causes. Final Frontend regression is 360/360, with zero failures/skips; build passes and lint has zero errors/warnings. Backend testing exposed four functional defects and a historical-schema fixture problem. After repairs, 182/182 DB-backed tests and 45/45 Node storage-contract tests pass. A separate real Kestrel/PostgreSQL/browser run passes nine groups without API interception.

The tested local paths are stable. Public release is not yet recommended without live Google/Drive/VietMap and production HTTPS configuration checks. Physical-device/Safari coverage is also missing. These limitations are not counted as provider integration successes.

## 2. Starting state and scope

| Repository | Branch | Starting HEAD | Initial worktree |
|---|---|---|---|
| Frontend | `feature_minhduc` | `eab60ae94c75db974b2830f7d64de46d034a50a7` | Clean; matches reviewed W9. |
| Backend | `feature_minhduc` | `19e192a774554741acb47529063773f8c6be87fd` | Five modified and two untracked files, listed in [initial audit](initial-audit.md). |

W8/W8.1/W9 reports and the requested code/contracts/test architecture were read before implementation. A short audit summary was presented before code changes. Existing Backend edits were preserved; W10 changes to Program, AccountController and SystemFlowsTests are incremental additions to those edits. FamilyRelationshipService, FamilyIsolationTests and the pre-existing AuthTransportPolicy files were not edited by W10.

No Mobile source, old migration, UI theme/spacing/color, deployment or Git commit/push/merge/PR was changed or performed. Backend changes are limited to defects confirmed by required integration/security tests. See the [independent Backend record](../../../Backend-MyLife/docs/W10_STABILIZATION.md).

## 3. Fresh baseline

| Check | Initial result |
|---|---|
| Frontend `node --test --test-reporter=tap 'tests/*.test.cjs'` | 339 total; 310 pass, 29 fail, zero skips. |
| Frontend build | Exit 0; existing map chunk warning. |
| Frontend lint | Exit 0; one existing effect-dependency warning. |
| Backend/test project Release build | Exit 0; zero warnings/errors. |
| Backend tests with newly provisioned PostgreSQL 18 | 181 total; 176 pass, 5 fail, zero skips. |

W9 results were not reused as the current baseline. Raw TAP, build/lint logs and compressed TRX are in `test-results/`.

## 4. Frontend failure investigations

Six failures were VM loader/mock problems and 23 were obsolete implementation/design expectations. Neither production VietMap nor correct Radix Select/AppShell behavior was changed to satisfy old tests. Explicit presentation mocks were added where necessary; actual callbacks/data behavior, errors, cancellation, semantics and authorization remain asserted. Browser checks independently verify rendering and interaction.

| # | Baseline test | Classification and evidence | Action | Before / after |
|---|---|---|---|---|
| 1 | family map still uses Leaflet and OpenStreetMap tiles | Outdated test expectation: W7/W9 use VietMapBaseLayer, not OSM tiles. | Assert adopted Leaflet/VietMap integration, configured key and layer cleanup. | FAIL / PASS |
| 2 | Anniversary Add/Edit share one abortable member request and subsequent opens reuse cache | Outdated test expectation: Edit is a MemoryActions callback; delete uses ConfirmDialog.onConfirm. | Retain cache/abort checks and follow actual action callbacks. | FAIL / PASS |
| 3 | children add/remove and siblings use action pickers while keeping collection state in the form | Outdated test expectation: Explicit horizontal relations include sibling and cousin; biological siblings remain inferred. | Assert removal of both explicit types, preserving inferred siblings. | FAIL / PASS |
| 4 | ADMIN: actual guard blocks before mounting and MyLife navigation is USER-only | Test fixture/mock problem: UserMenu/Header import new preference components omitted from VM mocks. | Add explicit presentation mocks; preserve role guard and navigation assertions. | FAIL / PASS |
| 5 | USER: actual guard blocks before mounting and MyLife navigation is USER-only | Test fixture/mock problem: Same missing preference mocks in the USER case. | Same fixture repair; exercise both exclusive business roles. | FAIL / PASS |
| 6 | tests\\feature-i18n.test.cjs | Test fixture/mock problem: types.ts imports generationCardThemes; file aborted before test registration. | Load real generation themes/normalizer; add explicit leaf mocks and follow current grid/actions callbacks; run all locale/CRUD/validation tests. | FAIL / PASS |
| 7 | global focus tokens stay neutral across light and dark themes | Outdated test expectation: Neutral hex focus colors were replaced by accepted W9 semantic tokens. | Verify theme token delegation and focus-visible styling. | FAIL / PASS |
| 8 | shared fields and FamilyRelationSelect avoid hard focus rings | Outdated test expectation: Focus belongs to data-field-shell instead of native control utility classes. | Verify shell owns focus and native control has no second outline. | FAIL / PASS |
| 9 | shared field shells use the focus token while preserving error borders | Outdated test expectation: FloatingField now owns error and focus borders. | Verify error forwarding, aria-invalid and error border CSS. | FAIL / PASS |
| 10 | form sibling chips contain an avatar and name with the original remove permissions | Outdated test expectation: Explicit sibling and unknown relations are removable; biological inferred relations are not. | Assert avatar/name and non-biological removal callback. | FAIL / PASS |
| 11 | MemberTable renders semantic columns, family data, and shared avatar | Test fixture/mock problem: MemberTable imports normalizeDisplayText, Button and TableShell. | Add explicit leaf boundaries and keep semantic columns/data/avatar checks. | FAIL / PASS |
| 12 | MemberTable uses em dash for missing values and calls the existing detail handler | Test fixture/mock problem: Same imports prevented the missing-value/detail callback test from executing. | Preserve missing-value counts and actual onView callback assertion. | FAIL / PASS |
| 13 | hub renders five configured real modules with semantic route links | Outdated test expectation: Hub motion duration now delegates to shared tokens. | Assert --motion-normal delegation while retaining canonical semantic links. | FAIL / PASS |
| 14 | all workspace pages share a single ArrowLeft-only header with explicit parents | Outdated test expectation: W4+ adopted AppShell instead of mounting UserWorkspaceHeader. | Verify AppShell delegation and canonical parent routes. | FAIL / PASS |
| 15 | module and page translations exist in Vietnamese and English; shared controls remain reused | Outdated test expectation: Preferences moved into AppearanceLanguageModal and shared controls. | Check modal/shared preference path and existing VI/EN module strings. | FAIL / PASS |
| 16 | shared workspace layout owns the viewport and routes optional module navigation to header and dock | Outdated test expectation: Viewport/scroll ownership moved to AppShell CSS. | Verify AppShell contentScroll forwarding, focusable main and scrolling CSS. | FAIL / PASS |
| 17 | desktop header navigation and mobile dock are mutually exclusive at the xl breakpoint | Outdated test expectation: Sidebar/drawer responsive navigation replaced desktop-nav/mobile-dock mounting. | Assert current 767px breakpoint, drawer trigger and role-aware navigation. | FAIL / PASS |
| 18 | module content has internal scroll sizing and existing API contracts remain present | Outdated test expectation: Calendar/library use normal shell scrolling; tree canvas chooses hidden/auto. | Verify current scroll owners and retain real module endpoint checks. | FAIL / PASS |
| 19 | tests\\optimization.test.cjs | Test fixture/mock problem: generationCardThemes import aborted optimization file before tests registered. | Load themes; add router/leaf mocks, follow default tree/segments and current ErrorState/EmptyState; retain abort/image/manifest checks. | FAIL / PASS |
| 20 | modal and custom overlays share scroll locks; Select and action picker portal and reposition | Outdated test expectation: PhotoLightboxModal is an alias of LibraryLightbox using shared Modal. | Follow alias to shared Modal and preserve lock/portal/position checks. | FAIL / PASS |
| 21 | SearchBar exposes controlled, accessible UI and FamilyTree reference styling | Outdated test expectation: SearchBar delegates its field frame to SearchInput. | Verify search Input delegation, controlled props and clear/focus callback. | FAIL / PASS |
| 22 | shared Select uses an interactive full-field native select with label and ref | Outdated test expectation: Shared Select is Radix, not a transparent native select. | Behavior-test ref/id/label/required/disabled/name forwarding. | FAIL / PASS |
| 23 | native Select keeps controlled and uncontrolled values, defaultValue and onChange | Outdated test expectation: Radix exposes onValueChange rather than native onChange. | Behavior-test controlled/uncontrolled state and callback values. | FAIL / PASS |
| 24 | native Select renders options prop, option children, empty option and placeholder | Outdated test expectation: Radix renders SelectItem/options and primitive placeholder. | Behavior-test custom children, disabled options, null value and placeholder. | FAIL / PASS |
| 25 | native Select retains rounded focus and error presentation with pointer-transparent visuals | Outdated test expectation: FloatingField owns Select focus/error visuals. | Behavior-test focus, aria-invalid/describedby, error and value state. | FAIL / PASS |
| 26 | FamilyTree gender and relationship fields remain wired to shared native Select options | Outdated test expectation: Member gender uses SelectItem; relations use separate pickers. | Verify adopted gender options and distinct relationship picker contracts. | FAIL / PASS |
| 27 | standard forms use shared selects; compact appearance utilities and the design-system demo remain native | Outdated test expectation: AppearanceControls now delegates to shared Radix preferences. | Keep native-select allowlist limited to dev preview; verify preference primitives. | FAIL / PASS |
| 28 | shared header controls, FamilyTree controls, and centered Home navigation use 40px sizing | Outdated test expectation: W9 enlarged shared icon targets and replaced legacy direct controls. | Verify current shared sizing and public control composition. | FAIL / PASS |
| 29 | Header, Admin, FamilyTree and mobile drawer share ThemeSwitch | Outdated test expectation: Authenticated preferences live in UserMenu, not duplicate ThemeSwitch mounts. | Verify shared ThemeContext/preferences and shell integration. | FAIL / PASS |

The detailed evidence/action inventory is also available in [regression-matrix.md](regression-matrix.md) and [regression-summary.json](test-results/regression-summary.json). The final total rises by 21 because two files that previously aborted during import now execute their internal tests. No test is skipped.

## 5. Functional fixes

### Frontend

`TimelineEventModal.tsx` now memoizes its update callback with current form/onChange values, and the suggested-title effect declares the current title/update dependencies. This removes the stale-closure warning while preserving the title-touched guard and existing form behavior. No visual redesign was made.

### Backend baseline failures

| Exact baseline test | Root cause | Fix | Final |
|---|---|---|---|
| `LibraryCategoryMigrationTests.Upgrade_from_photo_metadata_schema_preserves_existing_albums_photos_and_category_values` | Test fixture used today's User model against a schema before `display_name`. | Insert fixture user using historical SQL before upgrade; preserve album/photo/category assertions. | PASS |
| `FamilyIsolationTests.Timeline_derives_life_events_and_supports_scoped_custom_event_crud_and_profile` | Functional defect: year-only events sorted after every fully dated event. | Compare calendar year/day consistently. | PASS |
| `SystemFlowsTests.Legacy_schema_is_baselined_only_by_opt_in_and_preserves_data` | Functional defect: legacy validator compared old schema to today's model. | Validate the frozen migration target model; retain opt-in/types/keys/FKs. | PASS |
| `SystemFlowsTests.Native_session_uses_body_tokens_and_never_uses_browser_cookies` | Security defect: access JWT remained valid after logout revoked its refresh record. | Bind access JWT `sid` to existing refresh record; check active session during current-user authorization query. | PASS |
| `SystemFlowsTests.Register_returns_machine_codes_for_conflicts_and_known_validation_errors` | Functional defect: JSON formatter does not populate ModelState.AttemptedValue; invalid DOB key is JSON-path qualified. | Read bound model and recognize DOB JSON path; return documented codes without secrets. | PASS |

An additional repeated-run fixture problem used a fixed Google subject despite generating a new email. That test now uses a unique synthetic subject. This does not verify Google's actual OAuth service. Role tests now assert immediate rejection of revoked sessions, reauthenticate, then assert the resulting role permissions. New `W10SessionRegressionTests` verifies independent sessions, logout, rotation and replay.

The session change adds no schema or new auth subsystem. Existing cookies/endpoint payloads are unchanged. Pre-W10 access JWTs require normal refresh; valid refresh cookies can restore them. Other active sessions stay independent. The added session predicate is part of the existing DB-backed user query.

## 6. Before/after test results

| Suite | Before | Final | Evidence |
|---|---|---|---|
| Frontend regression | 310 pass / 29 fail / 339 | 360 pass / 0 fail / 360 | [Baseline](test-results/frontend-baseline.tap), [final](test-results/frontend-final.tap) |
| Backend PostgreSQL suite | 176 pass / 5 fail / 181 | 182 pass / 0 fail / 182 | `backend-baseline.trx.gz`, `backend-final.trx.gz`, `isolated-backend.trx.gz` |
| Backend Apps Script Node | Not run in initial baseline | 45 pass / 0 fail | [TAP](test-results/backend-node.tap) |
| Frontend build | PASS, map warning | PASS, map warning | `frontend-final-build.log` |
| Frontend lint | 0 errors / 1 warning | 0 errors / 0 warnings | `frontend-final-lint.log` |
| Backend Release build | 0 warnings/errors | 0 warnings/errors in final test build | `backend-final.log` |
| Real HTTP/browser groups | Previously unverified | 9 pass | [Results](test-results/real-http-browser.json) |
| Browser fixture suites | Fresh W10 run | 7 suites, all exit 0 | [Suite exits](test-results/browser-results.json) |
| Mobile drawer/touch smoke | Fresh W10 run after extra drawer assertion | Both themes pass | [Smoke exits](test-results/browser-smoke-results.json) |
| Lockfile consistency | Scratch dependency not reproducible | Pinned Puppeteer; offline `npm ci --dry-run` passes | `npm-ci-dry-run.log` |

All executed final tests have zero skips. Intermediate logs remain for failed harness iterations; final evidence is explicitly named above. The isolated pipeline was rerun on fresh clusters after two harness repairs: the correct Frontend setting is `VITE_API_URL`; refresh counts must exclude CORS OPTIONS and count POST requests only. Both failed attempts also cleaned up their databases/clusters. They were not application regressions.

## 7. Real Backend/database integration

Two distinct kinds of Backend evidence are recorded:

- ASP.NET application test host with **real EF Core/PostgreSQL/migrations/middleware**. Remote Drive, Google verifier and geocoder are substituted at service boundaries. Tests cover schema upgrades/constraints, account/role policy, refresh races, relationships, timeline, anniversary/lunar behavior, library upload/ownership/failure handling, HTTP caching, rate limits, health and compression.
- **Real Kestrel + real network HTTP + real Chromium + real PostgreSQL**, with no API response interception. Live providers are disabled, not simulated as successes. This stage passes registration/login, HttpOnly web cookies, RBAC/CSRF/Origin, member create/update/delete/refetch, parent association, cross-account direct-ID rejection, manual/invalid coordinates, timeline and anniversary CRUD/lunar preview, library reads/missing-image path, account lock/unlock, Admin metrics/logs, copied-session rejection after logout, browser reload, expired-token restore and six concurrent requests sharing one refresh POST. It also renders actual member records and blocks localStorage role spoofing/direct Admin navigation.

The runner creates its own loopback PostgreSQL cluster and a random `mylife_w10_*` database. No normal application connection string or real user account was used. Only these disposable databases were migrated/written/dropped. The [final lifecycle](test-results/isolated-lifecycle.json) records successful database deletion and cluster shutdown; [initial baseline cleanup](test-results/baseline-database-cleanup.json) records cleanup of the first cluster. Cluster files remain under workspace `.tmp` for inspection.

## 8. Security findings

| Concern | Verified scope |
|---|---|
| Registration/server errors | Real HTTP machine-code/validation cases; no tokens in web login body. |
| HttpOnly/storage | Actual Chromium cookie flags and absence of access/refresh tokens in localStorage/sessionStorage. |
| Login/reload/expiry | Actual browser login/reload and five-second access expiry with coalesced refresh. |
| Refresh rotation/concurrency | PostgreSQL-backed tests plus actual browser POST count; replay rejected. |
| Logout/session invalidation | Old copied access and refresh cookies fail immediately; independent sessions remain valid. |
| USER/ADMIN/anonymous | Server authorization tests and direct HTTP/browser denial; UI role spoof has no authority. |
| Disabled accounts | Real lock rejects `/me`, refresh and login; unlock permits new login. |
| CSRF/Origin | Enabled throughout; actual missing header/untrusted origin/mobile-cookie spoof rejected. |
| Rate limits | Actual ASP.NET middleware tests with isolated PostgreSQL, test-only low permits and Retry-After assertions. |
| Health/errors | Real live/ready; unavailable PostgreSQL and safe error response tested in application host. |
| External Google/production TLS | NOT TESTED; do not infer from substituted verifier or HTTP development cookies. |

Generated text logs were scanned for JWT-shaped credentials; none were found. Test accounts/keys are synthetic. The runner does not print connection credentials, JWTs or cookies.

## 9. Feature regression

Family member cards/list/details, create/edit/delete, relationships, search/filter, missing avatars and navigation are covered by current regression/browser tests and DB-backed flows. Parent creation and ownership/persistence also pass live HTTP. Live managed-avatar upload remains dependent on dedicated Drive configuration.

Timeline, member association, chronology and CRUD pass DB-backed/live HTTP tests; loading/empty/error/form behavior passes actual-browser fixture checks. Anniversaries include CRUD, historical/recurring lunar validation and the live next-occurrence endpoint. Library metadata/ownership/upload/deletion/error paths pass DB-backed tests with a substituted storage boundary; actual deployed Drive bytes/permissions and successful cloud album lifecycle are NOT TESTED.

Map location projection, invalid/missing coordinates, address/geocoding orchestration and manual persistence pass the relevant DB/service tests; the live map endpoint/manual update pass Kestrel tests. VietMap remains unchanged. Live provider tile/geocode responses are NOT TESTED.

Admin metrics, loaded-record search/filter/sort, role/status/delete, pending/duplicate guards, stale refetch and errors pass the fixture behavior suite; server authorization/role mutations pass DB-backed tests. Kestrel verifies metrics/logs/lock/unlock. Pagination is an existing contract gap: users return loaded records, logs are capped at 50, and no pagination metadata exists. No fake pagination was introduced.

## 10. Responsive/accessibility and visual regression

Executed 1920×1080, 1440×900, 820×1180, 390×844 × VI/EN × light/dark: 240 rendered views; no asserted page/content overflow, clipped page heading or out-of-viewport dialog. Thirty token contrast pairs retain their W9 thresholds. Seventy-eight field/dialog/validation/state checks pass, including Tab/Shift+Tab containment, Escape, restored focus, disabled controls and reduced motion.

Chromium coarse-pointer tests verify common button/icon sizing, mobile drawer navigation and login validation/close. Admin adds 16 matrix cases, 11 behavior/access groups and loading/error/empty plus mobile table semantics. Profile adds ten viewport/theme cases and security/account interactions.

Representative [screenshots](screenshots/README.md) were inspected directly, including [real Backend member cards](screenshots/real-backend/real-family-cards-1440.png), [mobile validation](screenshots/global-polish-touch/dark-390-login-validation.png), and [Admin overview](screenshots/admin-console/vi-light-1440-overview.png). No W9 spacing, colors or typography were changed. Physical mobile/Safari was not tested.

## 11. Runtime and performance

Browser suites assert no unexpected page errors and exercise request cancellation, stale response suppression, cleanup and duplicate mutation/refresh guards. Test fixtures reject real record mutations and outside-network calls. Expected injected API failures/401s are not treated as unhandled application errors.

The Vite warning is attributable to the map-related chunk: about 1.15 MB raw / 309 KB gzip. The manifest confirms it is outside the initial entry import closure. Baseline/final bundle measurements are in [baseline](test-results/bundle-baseline.json) and [final](test-results/bundle-final.json). No threshold increase, provider replacement, extra framework or architecture rewrite was used to hide it. A device performance benchmark/memory soak was not performed; this remains a known performance risk, not a measured production SLA.

## 12. Reproducibility and changed files

Puppeteer `25.11.0` is pinned in the main devDependencies/lockfile. Critical W10 browser suites no longer require scratch installation. New runners preserve exit codes, start/stop test servers and isolate DB lifecycle. See [commands and prerequisites](README.md).

The exhaustive authored file list, including evidence artifacts, is in [modified-files.md](modified-files.md). Backend changes are independently documented above. The pre-existing Backend edits are identified separately so reviewers do not attribute them to W10.

## 13. Limits, remaining work and recommendation

No unexplained failure remains in the executed final suites. Outstanding release gates are live OAuth/Drive/VietMap test credentials and isolated provider checks, intended HTTPS/CORS/cookie staging configuration, real devices/Safari and review of the access-session transition for external clients. Multi-tab refresh stress, long-duration memory testing and a fully fresh OS/browser download were not performed.

The application is suitable for review and controlled staging validation. It is **not yet approved for unrestricted public release**. The exact open gates and required follow-up are in [release-readiness.md](release-readiness.md). Work stops for review without committing, pushing or deploying.
