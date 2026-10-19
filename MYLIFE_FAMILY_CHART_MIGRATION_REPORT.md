# Family Chart 0.9.0 POC

## Evaluation and decision

- The existing React Flow view used a generic graph model; the newer custom Family View handles household layout and progressive disclosure directly. This task added an isolated `family-chart` POC for a like-for-like comparison.
- Evaluated `family-chart@0.9.0`, latest stable listed on npm at the time of review. It includes TypeScript declarations, documents a React `useEffect`/ref integration, renders custom HTML or SVG cards, and uses D3 7.9.0 for pan/zoom. Chart methods expose `updateMainId`, `updateData`, spacing, generation depth, card callbacks, and tree positioning.
- License metadata is inconsistent: the published package `package.json` says `ISC`, while the shipped `LICENSE.txt` and project README say `MIT`. Do not promote it to production before resolving that discrepancy.
- The package documents reciprocal `parents`, `spouses`, and `children`; its current data format requires gender `M` or `F`. There is no native MyLife horizontal relation mapping. Custom card content is returned as HTML, so every user-provided string and avatar URL is escaped/validated before insertion.
- Multi-spouse layout, initial scale/centering, and large-tree behavior need visual confirmation. The upstream issue tracker includes reports about multi-spouse child placement and initial sizing; see [issue 104](https://github.com/donatso/family-chart/issues/104) and [issue 88](https://github.com/donatso/family-chart/issues/88).
- **Renderer choice:** keep the validated custom Family View as production default. Dev mode selects Family Chart for POC review. React Flow remains available via the internal renderer constant as a fallback. The POC adds a lazy chunk of about 116.7 kB (33.6 kB gzip); the production Family Tree page does not load it in its runtime import closure.

References: [npm package and versions](https://www.npmjs.com/package/family-chart), [React quick start and API](https://github.com/donatso/family-chart/blob/master/docs/installation-and-quickstart.md), [data format](https://github.com/donatso/family-chart/blob/master/docs/data-format.md), [shipped license](https://github.com/donatso/family-chart/blob/master/LICENSE.txt).

## Integration

- `familyChartAdapter.ts` maps `FamilyMember[]` into family-chart `id/data/rels` objects. It maps identity, name, avatar, role, generation, gender, birth/death display data, and expand state. It removes self/dangling IDs, deduplicates links, makes spouse links reciprocal, and synchronizes parent/child links without changing the API records.
- `FamilyChartView.tsx` owns chart lifecycle and custom cards. It preserves search-to-focus, focus history, focused context, per-branch expansion, explicit whole-tree view, detail/edit/delete actions, zoom controls, fit, and PNG export. Unknown MyLife gender values are mapped to the library-required `M` fallback in the view model only.
- `FamilyChartView.css` adds warm surfaces, larger portrait cards, generation chips, soft connectors, hover states, and light/dark tokens. The family-chart tree itself renders parent, spouse, and child relationships; horizontal relations are surfaced as unsupported in this POC.
- `FamilyTreeManager.tsx` uses Family Chart in development and the custom Family View in production. The React Flow renderer is retained behind the internal `react-flow` choice.
- PNG export uses the existing `html-to-image` dependency on the chart container, excluding the toolbar by capturing only the chart host.

## Files

- Added: `src/features/admin/components/family-tree/familyChartAdapter.ts`
- Added: `src/features/admin/components/family-tree/FamilyChartView.tsx`
- Added: `src/features/admin/components/family-tree/FamilyChartView.css`
- Added: `src/features/admin/components/family-tree/familyTreeRendererConfig.ts`
- Added: `tests/family-chart-adapter.test.cjs`
- Modified: `src/features/admin/components/FamilyTreeManager.tsx`, `package.json`, `package-lock.json`, `tests/family-tree-view.test.cjs`, `tests/feature-i18n.test.cjs`, `tests/optimization.test.cjs`
- No backend, API contract, or database files changed. No unrelated frontend modules were edited.

## Validation

- Family-related tests: **48 passed** (adapter, layout/view, Family Chart adapter/security, relations, form and role checks).
- `npm run test:my-life-workspace`: **8 passed**.
- `npm run test:i18n`: **15 passed**.
- `npm run test:theme-switch`: **5 passed**.
- `npm run test:roles`: **5 passed**.
- `npm run test:optimization`: **8 passed**.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- `npm audit` reports one high severity `source-map-js` advisory under the existing Vite/Tailwind toolchain; the lockfile already contained affected `source-map-js@1.2.1` before this change. No fix was applied as part of this task.
- Manual browser QA could not run: no browser surface was available in the session and the configured dev port 7000 was already occupied. Review the POC on `/familytree` for spouse/child placement, card scale, focus, expansion, light/dark appearance, mobile pan/zoom, and PNG output before deciding whether the library is suitable beyond development.

## Git

- Branch: `feature_minhduc`.
- Implementation commit SHA and push result: fill in after commit and push.
