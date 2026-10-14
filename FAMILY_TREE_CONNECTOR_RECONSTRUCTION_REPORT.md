# Family Tree Mindmap Connector Reconstruction Report

## Scope

Frontend mindmap connector rendering only. No backend, database, or other FamilyTree screens were changed for this feature.

## Issue and cause

The previous family branch used a pseudo-element filling the entire invisible branch node, making the sibling connector appear as a rectangular rail. Child connectors were assigned by child array index, so uneven spouse/card spacing could miss card centers. Parent-child edges used generic smooth-step routes, obscuring the shared family-unit trunk and junction. Generation labels also drew long separator rails that could be mistaken for connectors.

## Implementation

- Added a shared family anchor at the couple midpoint; for a single parent it sits at the parent card's bottom center.
- Grouped visible children by their actual parent set, independent of generation metadata.
- Added a trunk from the parent anchor to the family junction and a sibling bar only for groups with at least two children.
- Sized each sibling bar from the first to last measured child-card center. Per-child handle offsets use each actual card center, including when a child has a spouse.
- Routed each child drop directly from its sibling-bar anchor to the top/left center of the child card. Single-child groups omit the sibling bar.
- Rotated the same family geometry for top-to-bottom and left-to-right orientations.
- Retained spouse connectors, optional horizontal relations, hover highlighting, generation labels, toolbar, fullscreen, and PNG export. Generation labels now render as pills without separator rails. PNG export also normalizes SVG sibling-line colors.

## Changed files

- `src/features/admin/components/family-tree/familyMindmapGraph.ts`
- `src/features/admin/components/family-tree/FamilyMindmap.tsx`
- `src/features/admin/components/family-tree/FamilyMindmap.css`
- `tests/family-mindmap-graph.test.cjs`

## Verification

- `node --test tests/family-mindmap-*.test.cjs` — 14/14 passed.
- `npm run test:my-life-workspace` — 8/8 passed.
- `npm run test:i18n` — 15/15 passed.
- `npm run test:theme-switch` — 5/5 passed.
- `npm run test:optimization` — 8/8 passed.
- `npm run test:roles` — 5/5 passed.
- `npm run build` — passed.
- `npm run lint` — passed.
- `git diff --check` — passed (Git reported expected LF-to-CRLF conversion notices).
- Browser harness checked seven member cards, three generation labels, hover dimming, optional relation toggle, legend, PNG export, connector/card center alignment at four zoom levels, and both orientations. The harness reported a blocked external resource request (`ERR_NETWORK_ACCESS_DENIED`) but no app alert; the feature checks and PNG generation completed.
- Automated graph tests verify the midpoint geometry, exact sibling-bar span and child offsets, one-child and single-parent behavior, multiple independent sibling groups, LR rotation, deduplicated references, and a 200-member layout.

## Commit and push

- Feature commit: `250e3cf` (`fix: rebuild family tree connectors around family units`).
- Push to `origin/feature_minhduc` was attempted but not completed: automatic approval review rejected publishing repository contents to the external GitHub destination. The feature commit remains local and ready to push after approval.

