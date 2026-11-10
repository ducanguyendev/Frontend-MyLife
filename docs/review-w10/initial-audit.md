# W10 initial audit — 10/11/2026

Before implementation, Frontend branch `feature_minhduc`, HEAD `eab60ae94c75db974b2830f7d64de46d034a50a7`, clean worktree. Backend branch `feature_minhduc`, HEAD `19e192a774554741acb47529063773f8c6be87fd`.

Pre-existing Backend edits, preserved: `Features/Auth/Controllers/AccountController.cs`, `Features/FamilyTree/Services/FamilyRelationshipService.cs`, `Program.cs`, `Tests/FamilyIsolationTests.cs`, `Tests/SystemFlowsTests.cs`; untracked `Shared/Security/AuthTransportPolicy.cs`, `Tests/AuthTransportPolicyTests.cs`. Mobile worktrees are outside scope.

Read W8/W8.1/W9 reports, W9 comparisons/preservation, router, auth context/service/client, shared Modal, Backend README/API contract/Program/DatabaseStartup, security transport policy, test fixture and project structure. Frontend uses protected USER/ADMIN routes and cookie-only fetch with coalesced refresh. Backend validates current database role/account status, Origin/CSRF transport, JWT and rate limits. Existing Backend test factory uses PostgreSQL and substitutes only remote storage/Google/geocoding boundaries; those substitutions must not be described as live provider verification.

Fresh baseline: `node --test --test-reporter=tap 'tests/*.test.cjs'` returns 339 tests, 310 pass, 29 fail, zero skips. Raw evidence: `test-results/frontend-baseline.tap`. Build Backend including test project succeeds with zero warnings/errors. Frontend lint succeeds with one existing dependency warning at `TimelineEventModal.tsx:44`. Frontend build started separately; final result is recorded with its completed log.

Initial failure diagnostics identify stale OSM/native-select/old-layout assertions and missing module mocks. Each must be investigated before changing assertions. No production code has yet been changed for W10.

PostgreSQL 18 binaries are available. W10 creates a separate cluster under workspace `.tmp/w10-postgres`, restricted to loopback port 55448, role `mylife_w10`, database `mylife_w10_validation`. It does not reuse application database settings. Migration and destructive tests may target only this cluster. No deployment/commit/push/merge/PR is authorized.
