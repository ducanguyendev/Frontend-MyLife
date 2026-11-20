# Family Tree W5.2 implementation and validation

Implemented on `feature_minhduc`. Existing unrelated workspace edits were preserved. No commit or push was made.

## Audit and root cause

`/familytree` uses `ShadcnFamilyTreeView` with the existing local development renderer flag. Normal production builds use `FamilyTreeView`. Both rendering engines and household placement algorithms remain in place.

The development renderer previously reused `getFamilyBranchMemberIds` for hover/selection, recursively including ancestry and descendants while omitting siblings. Its edge resolver could mark a complete shared rail active when only one child drop belonged to the branch. The stable renderer used `link.memberIds.some(...)`; touching any highlighted parent or child could brighten an entire multi-child connector.

Selected state now drives the same pure direct-family selector for card selection, search, and the existing center control. Hover previews use that selector when no selection is pinned. Explicit branch actions retain their separate membership/filtering behavior. Ordinary selection and clearing leave expansion state and the camera unchanged. Escape or a click on unused canvas clears selection. Clearing search clears its selection. Resize/fullscreen retains zoom and adjusts the camera center.

## Relationship evidence and exact drawable paths

`buildFamilyRelationshipGraph` reads only `fatherId`, `motherId`, reverse `childIds`, and undirected recorded `spouseId` links. It rejects self and missing-member links. It uses the complete member collection so generation filtering does not erase sibling evidence.

`getDirectFamilyHighlight` includes the selected member, recorded parents, recorded siblings, spouse(s), and direct children. Sibling routes use only shared recorded parents. It never recursively includes grandparents, a sibling's children, grandchildren, cousins, or a spouse's extended family.

Semantic edges have stable IDs such as `parent:3:6` and `spouse:6:10`. `buildParentChildLinks` splits drawing geometry into parent ports, parent rail intervals, a trunk, child rail intervals, and individual child drops. Each segment records precisely which semantic edges use it. A segment becomes active only when at least one of those verified edges is included by the selector. The rail therefore stops at the last relevant junction, and unrelated ports/drops/extensions stay subdued even when endpoints share a layout group.

Parent routes start at each parent's own card bottom. This avoids accidentally highlighting the parents' marriage line when selecting their child. Marriage markers retain their existing design. Parent drops terminate at actual child cards, not at a child's spouse/household midpoint. A recorded parent's spouse is no longer silently manufactured into a second parent by the development layout.

## Siblings, half siblings, and incomplete data

The current `FamilyMember` API model has no biological/adoptive/step parentage metadata. The existing sibling utility also relies on shared parent IDs. The new tree UI therefore uses neutral recorded-parent wording rather than asserting biological certainty.

- Two identical recorded parent sets: same two recorded parents.
- Two complete recorded parent sets sharing one parent: one shared parent with different recorded second parents (the recorded half-sibling distinction).
- Only one known parent, or incomplete parent sets: shared recorded parent, other parent unknown.

No older/younger ordering or gender is inferred. No sibling placeholders or name/generation/address heuristics are used. The selected-member status shows the recorded sibling count, with individual classifications available in its title and accessible text. Existing collapse/branch state is preserved; highlighting does not expand hidden relatives.

## Background, framing, and PNG

`FamilyTreeBackdrop` adds two restrained inline SVG leaf branches and a low-opacity, locally embedded SVG paper grain. Existing canvas and sage/forest theme tokens supply the colors. Dark mode reduces grain and ornament intensity. There are no remote decorative assets or animations.

The background is a fixed, clipped, noninteractive layer outside the transformed scene. It does not enter graph measurements, hit testing, or scroll bounds. Member cards and connectors render above it. Initial fitting now uses 88% of available width instead of 74%; existing vertical containment, readable-view behavior, and manual pan/zoom remain available.

PNG intentionally includes the paper and botanical background and omits controls/status. Both renderers temporarily fit the graph for export and then restore the camera. Visual inspection found that `html-to-image` deep-clones SVG children without their stylesheet rules, causing missing connectors and black marriage markers. `withTreeSvgStyles` resolves the relevant SVG presentation styles during capture and restores the original inline attributes in `finally`.

## Files created

- `src/features/admin/components/family-tree/familyTreeHighlight.ts`
- `src/features/admin/components/family-tree/familyTreeConnectors.ts`
- `src/features/admin/components/family-tree/FamilyTreeBackdrop.tsx`
- `src/features/admin/components/family-tree/FamilyTreeBackdrop.css`
- `src/features/admin/components/family-tree/FamilyTreeSelectionSummary.tsx`
- `src/features/admin/components/family-tree/treeSvgExport.ts`
- `tests/helpers/load-tree-module.cjs`
- `tests/family-tree-highlight.test.cjs`
- `tests/family-tree-w52.browser.cjs`
- This report, browser screenshots, `results.json`, and two PNG exports in this directory.

## Files updated

- `src/features/admin/components/family-tree/ShadcnFamilyTreeView.tsx`
- `src/features/admin/components/family-tree/ShadcnFamilyTreeView.css`
- `src/features/admin/components/family-tree/ShadcnFamilyTreePersonCard.tsx`
- `src/features/admin/components/family-tree/shadcnFamilyTreeLayout.ts`
- `src/features/admin/components/family-tree/treeViewportFit.ts`
- `src/features/admin/components/family-tree/family-view/FamilyTreeView.tsx`
- `src/features/admin/components/family-tree/family-view/FamilyTreeView.css`
- `src/features/admin/components/family-tree/family-view/FamilyPersonCard.tsx`
- `src/features/admin/components/family-tree/family-view/FamilyBranch.tsx`
- `src/features/admin/components/family-tree/family-view/familyTreeLayout.ts`
- `src/features/admin/components/family-tree/family-view/familyTreeTypes.ts`
- `src/shared/locales/en/family.json`
- `src/shared/locales/vi/family.json`
- `tests/family-tree-view.test.cjs`
- `tests/shadcn-family-tree-adapter.test.cjs`
- `tests/shadcn-family-tree-layout.test.cjs`
- `tests/shadcn-family-tree-branch.test.cjs`
- `tests/tree-viewport-fit.test.cjs`

Existing tests that assumed whole-rail paths, inferred spouse parentage, or child-household midpoint drops were updated to assert the corrected semantics and segment geometry.

## Validation results

| Check | Result |
| --- | --- |
| Build and TypeScript (`npm.cmd run build`, includes `tsc -b`) | Passed |
| Lint (`npm.cmd run lint`) | 0 errors; one existing `TimelineEventModal.tsx:44` hook dependency warning |
| Focused tree, adapter, layout, branch, highlight, and fit tests | 74 passed |
| Parents, siblings, recorded half siblings, incomplete parentage, spouse(s), children | Passed |
| Shared rails, unrelated co-parent ports/drops, connected route endpoints, no extraneous route branches | Passed in both renderers |
| Missing data, self/dangling IDs, disconnected members, no selection, repeated switching, generation filtering | Passed |
| Layout lanes, spouse adjacency, deterministic layout, forests, up to 200 members | Passed |
| Headless Edge on the actual `/familytree` route with isolated synthetic API responses | Passed |
| Light/Dark at 1920×1080, 1440×900, 1366×768, 820×1180, 390×844 | 20 renderer/theme/viewport cases passed |
| Card/search selection, clearing, precise rendered edge classes | Passed |
| Pan, zoom in/out, fullscreen enter/exit, branch focus/overview | Passed |
| Mobile touch drag | Passed in both themes and both renderers |
| Horizontal page overflow and background pointer behavior | Passed |
| PNG downloads, dimensions, actual connector pixels, temporary SVG-style cleanup, camera restoration | Passed in both renderers |
| PNG visual inspection | Connectors, marriage markers, cards, and atmospheric background present |
| Browser page errors / API writes | None |

The existing Vite warning about a large map bundle remains. No dedicated typecheck script exists; build performs the TypeScript check. No Backend, Mobile, map, profile, timeline, anniversary, library, or unrelated admin code was changed by this patch.

## Screenshots and exports

- Development tree: [Light](shadcn-light-1440-selected.png), [Dark](shadcn-dark-1440-selected.png).
- Production tree: [Light](stable-light-1440-selected.png), [Dark](stable-dark-1440-selected.png).
- Mobile: [Light](shadcn-light-390-selected.png), [Dark](shadcn-dark-390-selected.png).
- Fullscreen: [Development](shadcn-fullscreen.png), [Production](stable-fullscreen.png).
- Exports: [Development PNG](downloads/shadcn/mylife-family-tree-shadcn-poc.png), [Production PNG](downloads/stable/mylife-family-tree.png).
- Machine-readable browser results: [results.json](results.json).

## Limits

Browser checks used synthetic family data on the real route, not the user's live family records. Real parentage types cannot be confirmed with the current frontend data model. Responsive checks used browser device emulation rather than physical mobile hardware. Full names retain native hover titles and accessible button names; no custom tooltip engine was introduced. Very wide trees still require zoom/pan to read individual cards on mobile. No before-change browser screenshots were captured.
