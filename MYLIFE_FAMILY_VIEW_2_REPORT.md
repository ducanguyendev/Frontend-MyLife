# MyLife Family View 2.0 Report

## Result

The existing React Flow view now opens on a focused family context for larger trees. A MyLife adapter keeps API relationships as the source of truth; descendants beyond the visible family are disclosed branch by branch. The existing graph renderer remains in place and is still production-backed.

## Audit and library decision

1. **Current pain points:** `FamilyMindmap.tsx` ran `fitView` over every node on mount, creating a tiny overview on large trees. The toolbar, graph canvas and MiniMap reinforced a graph-editor feel. The custom layout already grouped spouses and shared children but rendered every member.
2. **React Flow vs family-chart:** React Flow is generic, while `family-chart` is D3 based and accepts spouse, parent and child relations with customizable HTML cards. Its current package metadata reports version 0.9.0 and `SEE LICENSE IN LICENSE.txt`; the repository license file states MIT. The official quick start documents custom cards and family relation mapping. The public guide/API material checked for this task did not establish a documented, controlled branch-collapse/focus lifecycle that fits this React view without a second layer of adapter state.
3. **Chosen library:** Keep `@xyflow/react`. Existing custom spouse units, parent-child trunks, callbacks, PNG export, hover states, and tests are proven in this codebase. Switching would replace a working layout engine without removing the need for MyLife-specific focus, collapse, CRUD callbacks, and export integration. No genealogy package was installed.
4. **License:** `family-chart` repository `LICENSE.txt` is MIT; its package metadata points to that file. No license block was found. The unresolved fit is interaction/API integration, not license.

## Data and interaction

5. **Adapter architecture:** `familyTreeAdapter.ts` exports engine-neutral `TreePerson` records plus deterministic root selection, visible-branch selection, and hidden-descendant counting. Relationship interpretation stays outside view components.
6. **Data mapping:** ID, full name, avatar, father, mother, spouse, children, generation, role, gender, life status, death date and horizontal relations are copied from `FamilyMember`. Self and dangling references are excluded from the adapter; existing graph rules still deduplicate spouse edges and keep extended relations off by default.
7. **Family unit:** Existing layout continues to place spouse pairs together and route shared children from the union midpoint. Single-parent groups use only the supplied parent.
8. **Focus/root:** The frontend has no direct `FamilyMember` to authenticated account mapping (`FamilyMember` has no account/user ID). For larger trees the fallback deterministically selects the lowest ID in the latest generation. Focus is presentation state only; it performs no API writes.
9. **Branch collapse:** Large trees open with focus, parents, spouse, children and siblings visible. Deeper descendants are omitted from the rendered graph. A card control shows the hidden descendant count; activating it reveals one more generation. Focus actions preserve a lightweight prior-branch history.
10. **Initial viewport:** Mount and branch changes fit only the graph currently rendered. Small trees (12 or fewer members) retain the full overview. “View entire tree” is an explicit toolbar action; MiniMap appears only in that mode for large trees.
11. **Cards:** Existing portrait card remains at 196×136 px with 54 px avatar, name, role, generation and subtle deceased marker. Selected focus receives an accent ring; branch controls are real buttons.
12. **Connectors:** Existing custom layout uses spouse edges and parent-family union/trunk/child bar geometry. No relationship is inferred by the adapter.
13. **Search:** FamilyTreeManager sends the first matching result as the tree focus while supplying the full member collection so nearby relationships remain available.
14. **Generation filter:** The selected generation is applied to the tree scope. If it removes the focused member, deterministic selection chooses a member inside the visible scope.
15. **Hover:** Existing 280 ms relation highlight/dim behavior remains for parents, spouse and children. It is memoized separately from graph construction.
16. **Details:** Existing `MemberDetailModal` and View/Edit/Delete callbacks are reused. No separate detail business logic was added.
17. **PNG export:** Existing export is preserved and captures the currently rendered branch; full-tree mode is user initiated. Export implementation still uses `html-to-image`.
18. **Performance:** The graph and adapter outputs are memoized. Collapsed descendants do not become React Flow nodes. Existing layout test covers a synthetic 200-member dataset.
19. **Responsive:** Existing pan/zoom canvas and mobile toolbar/card styles remain. Manual viewport screenshots were not available in this session.
20. **Light mode:** Uses MyLife theme surfaces and accent variables; no external product assets or branding copied.
21. **Dark mode:** Existing theme variables remain in use; cards and connectors use semantic surface and contrast-mixed colors.
22. **Accessibility:** Member cards remain keyboard buttons, focus branch and expand controls are accessible buttons, expand state exposes `aria-expanded`, and reduced motion remains respected.
23. **Pedigree readiness:** The adapter is independent of React Flow node types and exposes parent references, so an ancestor-only projection can reuse it later.
24. **Fan readiness:** The same focus and parent data can support a future radial projection; no Fan view or visible placeholder was added.

## Changes and verification

25. **Files added:** `src/features/admin/components/family-tree/familyTreeAdapter.ts`, `tests/family-tree-adapter.test.cjs`, this report.
26. **Files removed:** None by this task.
27. **Dependencies:** No dependency changes by this task. The pre-existing worktree already removes dagre from package files; React Flow is still used by the production family view.
28. **Tests:** Family Tree suite plus adapter tests: 35 passed. Requested `test:my-life-workspace`, `test:i18n`, `test:theme-switch`, `test:roles`, and `test:optimization` all passed.
29. **Build:** `npm run build` passed on the final implementation.
30. **Lint:** `npm run lint` passed after fixes.
31. **Diff check:** `git diff --check` passed.
32. **Git diff:** Implementation touches FamilyMindmap, its member card and CSS, FamilyTreeManager’s tree props, adapter, locale additions, adapter tests and report. Pre-existing unrelated worktree modifications are left untouched.
33. **Backend:** unchanged.
34. **Database:** unchanged; no migrations.
35. **API:** unchanged; uses the existing family member collection.
36. **Other modules:** Anniversary, Library, Map, Profile and Home Header were not changed by this task.
37. **Commit SHA:** Pending final commit.
38. **Push:** Pending final push to `origin/feature_minhduc`; no force push.

## QA limits

The requested viewport matrix (1920×1080 through 390 px) and live-data visual review were not completed because no browser surfaces were available to the computer-use session. Build, lint and automated tests pass, but those checks do not replace visual QA. The working branch also contains pre-existing uncommitted changes and report deletions; those are not included in the Family View commit.
