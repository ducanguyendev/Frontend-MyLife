# MyLife Family Tree 3.0 — Video Style Family View

## Previous view and renderer decision

The previous React Flow view represented people as graph nodes with synthetic union/anchor/branch nodes. Its layout, spouse links and child rails were custom layered over a general graph canvas. That made the first screen feel like an editor and made larger trees shrink into an overview. CSS-only adjustments could soften its appearance but could not make household units the layout primitive.

| Capability | `family-chart` evaluation | Current React Flow | New MyLife renderer |
|---|---|---|---|
| Spouse, parent, child data | Native `spouses`, `parents`, `children` relation fields | Supported through custom nodes/edges | Household and parent-pair units derived from existing `FamilyMember[]` |
| Custom cards | HTML and SVG card APIs | Custom React nodes | Native React cards using `MemberAvatarImage` and existing CRUD callbacks |
| Pan/zoom | Documented | Built in | Custom pointer pan, wheel/button zoom, fit and keyboard pan/zoom |
| TypeScript / React | Types included; React integration uses a ref and imperative chart lifecycle | Native React integration | Native React components and typed engine-neutral layout |
| Progressive disclosure / focus | Core docs do not establish the exact branch-first behavior needed; filtering and performance features are promoted in the Premium project | Possible but requires custom graph construction | Focus context is the default; descendants reveal per card; full tree is an explicit action |
| Responsive styling / export | Styling is configurable; app-specific export would still need integration | `html-to-image` already used | Responsive HTML/SVG composition; existing `html-to-image` dependency |
| License / dependencies | Official repo README and `LICENSE.txt` say MIT; package metadata points to the same license file. Requires D3. | Already installed | No new dependency |

`family-chart` was not selected because the view needs React-owned MyLife cards and CRUD, focus context, incremental descendant expansion, and the existing export flow as first-class behaviors. The new renderer is custom SVG/HTML. The old React Flow component remains behind `USE_FAMILY_TREE_VIEW_V3` as a rollback path. No React Flow graph hacks were carried forward.

References: [Family Chart React quick start and data format](https://github.com/donatso/family-chart/blob/master/docs/installation-and-quickstart.md), [API/features and license](https://github.com/donatso/family-chart), [MIT license text](https://github.com/donatso/family-chart/blob/master/LICENSE.txt).

## Architecture and behavior

1. **Previous shortcomings:** generic node/edge canvas, zoom-to-fit cards, and layout rules spread across synthetic graph nodes and CSS.
2. **Why CSS alone was insufficient:** card styling cannot determine which family context to show or place couple and descendant units as a hierarchy.
3. **Renderer decision:** custom SVG/HTML; `family-chart` comparison above. React Flow remains a fallback.
4. **Adapter:** refined `familyTreeAdapter.ts` remains the boundary from `FamilyMember[]`; it now also carries birth date into the neutral `TreePerson` and provides focus/visibility/related-member helpers.
5. **Family unit:** spouse pairs become adjacent household units; sibling clusters are grouped by parent IDs; a child group uses a shared parent midpoint, one trunk, one local rail and child drops. Single-parent groups use the same rule with one parent.
6. **Default focus:** latest-generation member, then lowest numeric ID as a deterministic tie-break. The current frontend has no current-user-to-member mapping, so no server mapping was added.
7. **Progressive disclosure:** focus context is the default for small and large trees. It includes the focused person, spouse/parents, siblings and their spouses, children, and grandparents where present. Full tree is opt-in.
8. **Expand/collapse:** per-person count pill reveals the next descendant level and toggles it closed. Hidden descendant counts are retained.
9. **Focus/history:** “Xem nhánh người này” moves to that person’s context; previous branch restores the prior focus. Search continues to pass the selected member ID; generation filtering still narrows the source list.
10. **Connectors:** family rails are generated as one SVG path per parent group; spouse connector is a short heart-marked link; optional extended links are dashed and deduplicated. Hover highlights immediate relatives, grandparents and adjacent spouses, dimming unrelated cards and links.
11. **Cards:** 218×166 desktop portrait cards with 64px avatar, name, role, generation, gender, birth year, subtle memorial state, actions and expand pill. Long names clamp to two lines.
12. **Canvas and toolbar:** warm dot surface, light/dark token support, pan/zoom/fit, full-tree toggle, extended relations, fullscreen and PNG export. Mobile toolbar becomes icon-first.
13. **Details / CRUD:** card view, edit and delete actions remain wired to the existing manager callbacks; no business logic or endpoint changed.
14. **PNG:** exports the current focused or explicitly selected full-tree view with toolbar/status controls hidden.
15. **Performance:** only visible context is rendered by default; layout is memoized and hover does not recompute it. The layout fixture covers 200 members with finite positions and no same-row card overlap.
16. **Responsive:** browser preview checked at 1920×1080, 1536×864, 1440×900, 1366×768, 1024×768, 768px and 390px. At 390px the focused sibling row remains centered and cards stay about 148px wide; users can pan for additional branches.
17. **Light/dark:** preview checked in both themes. Dark uses charcoal cards and a muted green connector/focus accent rather than black-on-black lines.
18. **Accessibility:** toolbar and card actions have labels, menus expose menu roles and Escape handling, controls keep visible focus styles, and the viewport supports arrow-key pan plus +/- zoom.
19. **Old vs new:** the first view now shows a focused multi-generation family context with portraits and household connectors; the previous view remains available by flipping the internal V3 constant.

## Files changed

- `src/features/admin/components/FamilyTreeManager.tsx` — selects V3 and retains the React Flow rollback path.
- `src/features/admin/components/family-tree/familyTreeAdapter.ts` — focused visibility, date mapping and kin-highlight context.
- `src/features/admin/components/family-tree/family-view/FamilyTreeView.tsx`, `FamilyTreeView.css`, `FamilyPersonCard.tsx`, `FamilyBranch.tsx`, `familyTreeLayout.ts`, `familyTreeTypes.ts` — new renderer, household layout, cards, canvas and interactions.
- `src/shared/locales/vi/admin.json`, `src/shared/locales/en/admin.json` — view label now reads “Cây gia phả” / “Family tree”.
- `tests/family-tree-adapter.test.cjs`, `tests/family-tree-view.test.cjs` — focus, household geometry, single-parent, sibling branches, numeric ordering and 200-person layout coverage.
- No dependency files changed. Backend and database files were not touched.

## Validation

- Family-related Node tests: **44 passed**.
- `npm run test:my-life-workspace`: **8 passed**.
- `npm run test:i18n`: **15 passed**.
- `npm run test:theme-switch`: **5 passed**.
- `npm run test:roles`: **5 passed**.
- `npm run test:optimization`: **8 passed**.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- Browser preview: focused default, full tree toggle, expand/collapse, focus history, PNG download, light/dark, and requested viewport widths passed without page runtime errors. The preview used synthetic local data; review a dense real family dataset before removing the fallback.

## Git

- Branch: `feature_minhduc`.
- Commit SHA: to be recorded after commit; this report will include the implementation commit SHA in the follow-up report update.
- Push: requested to `origin/feature_minhduc`; result will be recorded after push.
