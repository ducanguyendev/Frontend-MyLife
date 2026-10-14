# Family Tree Video Style Mindmap — Implementation Report

## Scope

Redesigned only the Frontend Family Tree Mindmap. Existing member data, FamilyTree callbacks, API contracts, backend, database, and mobile app were left outside this change. React Flow remains the rendering and interaction layer.

## Design and layout

The previous mindmap connected people with individual parent-child and spouse links in a generic graph layout. The new display is a portrait-oriented genealogy diagram, with generations arranged from top to bottom by default and an optional left-to-right direction.

The renderer is still React Flow. Graph construction and placement now use a small family-aware layout in `familyMindmapGraph.ts`. I chose this custom layout over Dagre or ELK because a family diagram needs explicit shared-parent hubs and sibling branches: a couple connects once to a family hub, and that hub branches to the children. This keeps siblings grouped and lets the child group align under the parents. One-child and single-parent families use the same hub model without inventing a spouse. Spouse records and parent records are deduplicated. The layout was exercised with 200 members and checks card collisions within generations.

Portrait member cards show the avatar, member name, role, generation, and a subtle deceased marker when relevant. Spouses sit close together. Family connector paths use orthogonal routes; spouse links have a small heart marker. Extended horizontal relationships are hidden by default and can be toggled on.

## Controls and interaction

- Zoom in/out and fit-to-view controls.
- Top-to-bottom / left-to-right layout switch.
- Extended relationship toggle and collapsible legend.
- Fullscreen and PNG export.
- Hovering a member highlights immediate family connections; unrelated cards and links dim.
- Member View/Edit/Delete actions remain hidden until hover or keyboard focus; touch devices keep them visible. Escape closes the action menu.
- MiniMap appears only for larger trees.
- Responsive sizing, light/dark theme tokens, focus-visible controls, and reduced-motion support are included.

PNG export hides the toolbar and forces connectors fully opaque while capturing. It also converts computed modern `color(srgb …)` SVG stroke values to `rgba(...)` temporarily, because the PNG rasterizer did not include SVG connectors with the newer color syntax. Original inline styles are restored after capture.

## Changed files

- `src/features/admin/components/family-tree/FamilyMindmap.tsx` — React Flow nodes/edges, toolbar, layout direction, family highlighting, fullscreen, export.
- `src/features/admin/components/family-tree/FamilyMindmap.css` — portrait cards, relationship diagram, theme/responsive states.
- `src/features/admin/components/family-tree/MemberMindmapNode.tsx` — portrait member cards and accessible action menu.
- `src/features/admin/components/family-tree/familyMindmapGraph.ts` — relationship graph and family-aware layout.
- `src/shared/locales/{en,vi}/admin.json` — Mindmap labels in English and Vietnamese.
- `tests/family-mindmap-graph.test.cjs` — graph/layout behavior coverage.
- `tests/family-mindmap-node.test.cjs` — card and keyboard-access behavior coverage.

No API, backend, database, or migration changes were made.

## Verification

- `npm run build` — passed (`tsc -b` and Vite production build).
- `npm run lint` — passed.
- `npm run test:mindmap` — 9/9 passed, including spouse grouping, shared sibling branches, single-parent layout, both directions, no dangling edges, and 200-member collision checks.
- `node --test tests/family-mindmap-node.test.cjs tests/member-detail-relations.test.cjs tests/family-member-picker.test.cjs tests/family-relation-select.test.cjs tests/member-avatar-display.test.cjs tests/member-card-flip.test.cjs tests/member-detail-layout.test.cjs tests/member-form-layout.test.cjs tests/member-life-status.test.cjs tests/member-table.test.cjs` — 39/39 passed.
- `npm run test:my-life-workspace` — 8/8 passed.
- `npm run test:i18n` — 15/15 passed.
- `npm run test:theme-switch` — 5/5 passed.
- `npm run test:optimization` — 8/8 passed.
- `npm run test:roles` — 5/5 passed.
- `git diff --check` — passed before commits.
- Manual browser QA with mocked three-generation FamilyTree data: 7 member cards and 3 generation labels rendered; hover dimming, extended relations, legend, and PNG download generation worked. Light/dark screenshots were reviewed. The exported PNG was opened and visually checked after the connector capture fix.

The browser harness reported one denied remote resource request from the network-restricted environment; the page had no application alerts or runtime errors, and the local app UI and export completed.

## Commits and push

- `95c659576de2150069f77513cb0c91e7bf5c6251` — `feat: redesign family tree mindmap as portrait genealogy`
- `7a61d20ed7407cf6d41c32fae5218b8f6313f9f4` — `fix: preserve family connectors in mindmap PNG export`
- Both commits were pushed successfully to `origin/feature_minhduc`.
