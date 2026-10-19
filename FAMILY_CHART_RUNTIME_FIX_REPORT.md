# Family Chart POC Runtime Safety

- Renderer selection now defaults to `family-view`. `family-chart` requires `VITE_FAMILY_TREE_RENDERER=family-chart` in a development build; production and invalid values fall back safely. `react-flow` remains opt-in.
- Hardened custom card HTML against missing records and package-generated `unknown`, `to_add`, and `_new_rel_data` nodes. Placeholder cards expose no member actions; escaped text and validated image URLs remain in use.
- Disabled family-chart's synthetic single-parent card. Parent, spouse, and child links are filtered against the current chart members, so a filtered or missing parent is not invented by the adapter.
- Guarded chart creation, updates, focus changes, zoom, and card actions. A family-chart-only error boundary and runtime error callback switch to the stable `FamilyTreeView` renderer.
- Added regression coverage in `tests/family-chart-adapter.test.cjs` and updated the existing manager test harnesses. `FamilyTreeView.css` and `FamilyPersonCard.css` were not changed.

## Verification

Passed: `npm run test:family-chart` (6), `npm run test:i18n` (15), `npm run test:optimization` (8), `npm run test:mindmap` (12), `npm run build`, `npm run lint`, and `git diff --check`.

The browser surface was unavailable for a live `/familytree` console and React Strict Mode check. To manually exercise the POC, set `VITE_FAMILY_TREE_RENDERER=family-chart` in an ignored local env file and restart Vite; without that flag the stable renderer remains active.
