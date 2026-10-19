# MyLife shadcn Family Tree POC

## Decision and upstream audit

The user feedback on family-chart focused on stretched or broken family connectors. Memoir was also rejected after local review because its composition gathered around the center and did not preserve the desired generation-row feel. `family-view` remains the production and default renderer.

The [`ryck/shadcn-family-tree` README](https://github.com/ryck/shadcn-family-tree) describes a shadcn registry install, flat `id`/`parentIds`/`partnerIds` data, unions derived from parent pairs, generation rows, relationship labels, highlight/isolate focus, pan/zoom, fit and center. It says registry installation copies editable source and claims zero runtime dependencies. Its example expects `@/components/ui/card` and `@/lib/utils`; MyLife has no `components.json` or matching shadcn component setup. The README describes a React/Tailwind v4 stack, but does not publish a React peer range or detailed keyboard/responsive contract.

The repository file listing has no LICENSE file or license metadata, and shows 12 commits, no releases, and no stars or forks at audit time. Since reuse terms could not be verified, this POC does not install the registry item or copy its source. It is an independent, editable MyLife implementation inspired by the documented flat graph and generation-row behavior. No new dependency or shadcn configuration was added.

## Implementation

- Added `shadcnFamilyTreeAdapter.ts`: maps `FamilyMember` records into flat person IDs and deterministic parent-pair union IDs. It copies data, filters self/dangling links, deduplicates children, and normalizes one-sided spouse links in the view model only. `generation` stays authoritative. Known `childIds` can establish a known parent link; missing parents and partners are never invented.
- Added `shadcnFamilyTreeLayout.ts`: places members in horizontal generation lanes, groups siblings by their known parent pair, packs households without overlapping cards, and aligns the average child-card center with the parent-unit midpoint. It draws one spouse connector and a midpoint trunk with a local sibling rail and orthogonal child drops. A centered single child uses a straight drop; an offset single child uses a short elbow.
- Added `ShadcnFamilyTreeView.tsx`, `ShadcnFamilyTreePersonCard.tsx`, and `ShadcnFamilyTreeView.css`: 232×178 cards, 68px avatar, readable name, role, generation and lifespan, soft focus/hover states, light/dark theme tokens, and View/Edit/Delete actions.
- Preserved search focus, focus history, progressive branch expansion, hidden descendant counts, generation filtering, whole-tree view, pan, wheel zoom, fit/center controls, fullscreen, extended relations, PNG export and a renderer-scoped fallback to `FamilyTreeView`.
- Added `VITE_FAMILY_TREE_RENDERER=shadcn-family-tree` as an explicit development-only option. No flag and every production build resolve to `family-view`. Memoir, family-chart, React Flow, and the stable view remain in place.

The POC uses local MyLife components and source files; no upstream source files were imported. `@memoir/tree`, `family-chart` and `@xyflow/react` were not removed or changed.

## Relationship and layout checks

- Mai Thu + Nguyễn Bửu: the fixture maps Mai Anh, Mai Sơn and Hồng Sơn to one `union-1-2` parent pair.
- Hồng Sơn + Hồng Nhung: both spouses normalize as partners; Hoàng Minh and Hoàng Anh share `union-5-6`. Layout checks verify their sibling centers align with the couple midpoint and each child has a local drop.
- Mai Anh: the fixture uses the two known `childIds` links for Minh Đức and Quốc Bảo and creates a single-known-parent branch without adding an unknown spouse.
- Half-siblings receive separate parent-pair unions. Single parent, missing/dangling/self references, reciprocal spouses, and deterministic ordering are covered.
- Members with the same generation share a Y lane. Layout tests exercise 13, 30, 50, 100 and 200 people and check finite, non-overlapping cards.

## Visual and browser QA

Chromium previewed a fixture containing the requested names at 1440×1000 and 390×844 in dark mode. The whole-tree state showed all 10 fixture cards in three generation lanes; desktop and mobile preview had no console errors. A screenshot comparison showed the POC kept the spouse pair compact and the two parent/child groups centered with short orthogonal trunks. This comparison used the task fixture, not live backend records.

The actual `/familytree` route redirected to the public home/login view without an authenticated browser session, and the local API was unavailable during the earlier environment check. Live member data, authenticated View/Edit/Delete actions, and live API behavior therefore remain for the user to review in their own session. No family data was changed.

## Bundle and checks

- No runtime dependency was added. The POC is emitted as its own lazy chunk: 19.30 kB raw / 6.72 kB gzip JavaScript and 9.27 kB raw / 2.29 kB gzip CSS. It is not part of the initial tree renderer import path.
- Tests passed: `test:family-tree` (18), `test:my-life-workspace` (8), `test:i18n` (15), `test:theme-switch` (5), `test:roles` (5), `test:optimization` (8), and `test:shadcn-family-tree` (10).
- `npm run build`, `npm run lint`, and `git diff --check` passed.
- Backend, database schema, mobile repository and unrelated frontend modules were untouched.

## Git and local review

- Branch: `feature_minhduc`
- Implementation commit: `ff5dee8` — `feat: add generation layered shadcn family tree poc`
- Push: successfully pushed to `origin/feature_minhduc`.
- Local `.env.local` is gitignored and currently selects `VITE_FAMILY_TREE_RENDERER=shadcn-family-tree` for review. It was not committed.
- Recommendation: keep `family-view` as the default; compare the POC with the authenticated live family dataset before considering promotion.
