# Family Tree Premium Polish

## Changes

- Kept the existing `FamilyTreeView` renderer and its current pan, zoom, search-focus, generation-filter, full-tree, and PNG workflows. No genealogy library or renderer switch was introduced.
- Tightened spouse cards to an 18px gap and centered the short heart connector between them. Family trunks now start at the midpoint of the recorded parent unit.
- Split each multi-child family connector into one shared parent trunk/local sibling rail plus individual child drops. This removes repeated overlapping segments and lets a hovered child brighten its own drop while other sibling drops remain dim. `childIds` can anchor a declared parent link where the child record omits the reverse pointer; no missing parent is inferred.
- Added shared connector tokens: 1.5px neutral default, 1.9px soft focus, round caps/joins, and 0.3 opacity for unrelated edges. Dark mode receives its own readable neutral line mix.
- Polished cards without changing their structure: 72px circular avatar, 14px two-line name, quieter role, compact `Đời · giới tính · năm sinh · † năm mất` metadata, soft focus border/shadow, and `+N`/`−` branch controls with tooltips.
- Reduced background dot emphasis by about 36%; retained the warm canvas and generation pills. Card position, focus, hover, expand, and collapse transitions run around 320ms and respect reduced-motion preferences.
- Preserved the focused-branch default. Up to 15 records can reveal the focused descendant branch; 16–30 show one nearby descendant level; above 30 the initial sibling/child neighborhood is capped at 12, with remaining members available from the parent branch control. Whole-tree mode remains user-triggered.
- Hover/focus now emphasizes actual parents, spouse, and children without highlighting sibling branches. Unrelated cards stay at 0.6 opacity. Mobile fit keeps cards larger and relies on pan/zoom; PNG hides toolbar and temporary card controls and waits for hover transitions to settle.

## Files

- `src/features/admin/components/family-tree/familyTreeAdapter.ts`
- `src/features/admin/components/family-tree/family-view/FamilyTreeView.tsx`
- `src/features/admin/components/family-tree/family-view/FamilyTreeView.css`
- `src/features/admin/components/family-tree/family-view/FamilyPersonCard.tsx`
- `src/features/admin/components/family-tree/family-view/familyTreeLayout.ts`
- `src/features/admin/components/family-tree/family-view/familyTreeTypes.ts`
- `tests/family-tree-adapter.test.cjs`
- `tests/family-tree-view.test.cjs`
- `package.json` (adds `test:family-tree`)

## Verification and scope

- Passed: Family Tree tests (18), MyLife workspace (8), i18n (15), theme switch (5), roles (5), optimization (8), production build, lint, and `git diff --check`.
- Layout tests cover separate couple-owned trunks, midpoint alignment, child-specific drops, single-parent data, progressive disclosure, and large sibling groups.
- Manual browser review of the named real family at 1920, 1536, 1440, 1366, 1024, 768, and 390px could not be run because this workspace has no browser surface or mounted real-family session. Review the Hồng Sơn/Nhung and Mai Anh branches, focus on Minh Đức, light/dark mode, and PNG at those sizes when a browser session is available.
- Backend, database schema, mobile repository, and unrelated frontend modules were not changed. `FamilyChartView` and renderer configuration were left untouched.
- Implementation commit: to be recorded after commit. Push status: to be recorded after push.
