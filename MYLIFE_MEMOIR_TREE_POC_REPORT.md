# MyLife Memoir Tree POC

## Why this POC

The supplied Family Chart review described broken connectors, long sweeps, and children that could look detached from their couple. The existing `family-chart` path delegates placement and connector routing to its chart layout and builds cards as HTML strings. `@memoir/tree` provides a graph API with explicit partnership groups and parent-child links, so this POC can tell the renderer which couple owns each child group. The stable `FamilyTreeView` remains the default and fallback.

## Package audit

- Installed `@memoir/tree@0.8.0`, the stable version shown by npm and the project README when audited.
- License: MIT. The package ships TypeScript declarations and is an ESM package with a CSS subpath export.
- React compatibility: its declared peer range is `react >=19.0.0 <20.0.0`, matching this app's React 19.2.7.
- Runtime dependencies: none. The React renderer is browser-oriented (`"use client"` and viewport DOM interactions); its documented layout helper can run without rendering React. This Vite app is client-rendered.
- Family API: graph mode accepts `people`, `subject`, `partnershipGroups`, and `parentChildLinks`; supports multiple partnership groups, one-parent groups, custom React cards, keyboard/ARIA card props, `initialViewport`, `centerPerson`, `fitToSubject`, `resetViewport`, pan modes, orthogonal or curved edges, and a `collapsed` prop.
- Zoom: the package has no documented zoom method or wheel-zoom option. This POC adds bounded wrapper zoom buttons and wheel zoom; pointer/touch pan and focus centering use the package viewport.
- Activity/adoption: npm listed 31 versions, 7 weekly downloads, and a publish about three months before this audit; GitHub showed 92 commits and 4 stars. It is actively versioned but has low public adoption, so treat it as an experimental dependency.
- Sources: [npm package page](https://www.npmjs.com/package/@memoir/tree), [package manifest](https://raw.githubusercontent.com/memoirlabs/tree/main/package.json), [README/API](https://github.com/memoirlabs/tree), [MIT license](https://raw.githubusercontent.com/memoirlabs/tree/main/LICENSE).
- `npm install` reported one high-severity advisory in the resolved project dependency graph. `npm audit` could not reach npm's advisory endpoint in this environment, so the advisory could not be attributed or verified. No audit fix or unrelated dependency update was run. The new package itself declares zero runtime dependencies.

## Adapter and family-unit mapping

- `memoirTreeAdapter.ts` maps API-owned `FamilyMember[]` into a `FamilyGraph`; it copies records for the view and never writes normalized relationships back to the API.
- IDs are deterministic: `couple-<lower-id>-<higher-id>`, `single-<parent-id>`, and a deterministic `family-<ids>` fallback for more than two explicit parents.
- Spouse links are deduplicated into one partnership group. One-sided spouse references are normalized in the graph view only. Self and missing references are discarded.
- A child with both `fatherId` and `motherId` receives one link per parent, all using the same couple `groupId`. Existing `childIds` reverse links are also honored when the child's parent fields are absent. Duplicate child links are removed.
- If only one parent is known, the adapter creates a single-parent group and no placeholder person. Parentage without a declared spouse is represented as a `coparent` group, not mislabeled as a spouse relationship.
- Mai Thu + Nguyễn Bửu fixture: their three children share `couple-1-2`.
- Hồng Sơn + Hồng Nhung fixture: Hoàng Minh and Hoàng Anh both use `couple-5-6`; a test also runs Memoir's actual layout builder and verifies both parents and children are in that local family neighborhood with one spouse edge and a parentage trunk sourced from the couple unit.
- Mai Anh fixture: Minh Đức and Quốc Bảo share the same declared single-parent group. Separate sibling subfamilies are tested to keep their child-bearing couple groups distinct.
- The fixtures exercise the relationship patterns and names from the request; they are not a dump of the user's live family records.

## Renderer and UI

- Added `MemoirFamilyTreeView` and `MemoirFamilyPersonCard` as separate components. Cards are React components at 232×178px with 72px avatar, name, role, MyLife generation, compact birth/death metadata, soft focus state, and View/Edit/Delete menu actions.
- Generations displayed on cards and as small pills come from MyLife's `generation` field. Layout uses Memoir graph relationships, `compact-family`, and orthogonal paths.
- Focus starts at the latest MyLife generation, search results change the subject and center it, and “Nhánh trước”/Previous branch retains focus history.
- Existing focused-branch disclosure helpers are reused: small trees can expose the focused descendant branch; medium trees show a nearby level; large trees stay compact. Card controls reveal one relevant child level at a time. “Xem toàn bộ cây” is explicit and does not auto-fit all records.
- Toolbar provides bounded zoom buttons, wheel zoom, focus center, fit-to-subject, explicit whole-tree toggle, PNG export, and generation pills. Memoir handles pointer/touch pan; responsive rules keep cards full-size and let the toolbar wrap on mobile.
- Warm MyLife variables style the canvas, edges, and cards; light/dark token overrides are included. Hover relation highlighting is intentionally omitted from this first POC because the request prioritizes connector behavior and rejects fragile DOM styling.
- PNG capture reuses `html-to-image` on the Memoir canvas. The code path builds successfully but export has not been visually checked in a browser.
- Memoir is loaded only for the development flag `VITE_FAMILY_TREE_RENDERER=memoir`. The renderer-specific error boundary falls back to `FamilyTreeView`; production builds and invalid flags resolve to `family-view`. The existing `family-chart` and `react-flow` options remain available under their current behavior.
- The Memoir renderer is a separate lazy chunk: 52.79 kB raw / 17.12 kB gzip in the production build. It is not part of the default route's synchronous bundle and remains unselected in production.

## Comparison and verification

- No visual success claim is made. This session's browser inventory had no apps or tabs, and no authenticated real-family session was mounted. The requested viewport comparison (1920×1080 through 390px), light/dark review, and real-data PNG check remain for browser review.
- Layout tests verify couple trunk ownership, child placement, spouse compactness, single-parent behavior, duplicate/dangling/self filtering, reverse `childIds`, multiple partner groups, and separate sibling subfamilies. The Hồng Sơn/Nhung test exercises the installed package layout builder; visual checks for broken paths, overlap, and line crossings still require a browser.
- Passed: `test:family-tree` (18), `test:family-chart` (6), `test:memoir-tree` (12), `test:mindmap` (12), `test:my-life-workspace` (8), `test:i18n` (15), `test:theme-switch` (5), `test:roles` (5), and `test:optimization` (8).
- Passed: production `npm run build`, `npm run lint`, and `git diff --check`.
- Stable `FamilyTreeView` remains the production default. Do not migrate from it based on compilation or fixture tests alone; compare the POC visually on the named real branches before deciding.

## Scope and files

Changed only frontend Family Tree integration, its test harness, package metadata, and this report. Backend, API contracts, database schema, Mobile-MyLife, and unrelated frontend features were not changed.

- `package.json`, `package-lock.json`
- `src/features/admin/components/FamilyTreeManager.tsx`
- `src/features/admin/components/family-tree/familyTreeRendererConfig.ts`
- `src/features/admin/components/family-tree/FamilyTreeRendererErrorBoundary.tsx`
- `src/features/admin/components/family-tree/MemoirFamilyTreeView.tsx`
- `src/features/admin/components/family-tree/MemoirFamilyTreeView.css`
- `src/features/admin/components/family-tree/MemoirFamilyPersonCard.tsx`
- `src/features/admin/components/family-tree/memoirTreeAdapter.ts`
- `tests/memoir-tree-adapter.test.cjs`
- `tests/family-tree-view.test.cjs`, `tests/feature-i18n.test.cjs`, `tests/optimization.test.cjs` (renderer integration mocks/assertions)

Implementation commit and push status will be recorded after the code commit is pushed.
