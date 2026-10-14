# MyLife Header Module Navigation Report

1. **Previous navigation layout:** Four module links were rendered only in the bottom `MyLifeDock` row on every module page.
2. **Issue:** The desktop dock occupied a separate row below the workspace, reducing the height available to module content.
3. **Desktop Header design:** A compact four-icon pill is centered between the back/MyLife controls and the theme/language/user controls.
4. **Mobile strategy:** The existing bottom dock remains below the desktop breakpoint and retains its safe-area padding.
5. **Breakpoint:** `xl` / 1280px. Header controls and a 4-link pill fit without requiring the cramped 768–1024px tablet widths to host the nav.
6. **Reusable architecture:** `MyLifeModuleNav` owns all link rendering; Header and Dock select `header` or `bottom` presentation variants.
7. **Module source:** Both variants map the existing `myLifeModules` configuration; no second route or icon list was added.
8. **Active state:** React Router `NavLink` supplies the active class and `aria-current="page"`; active links use the existing accent theme token.
9. **Hover timing:** Module links transition over 320ms with a restrained 1px lift and 1.03 scale.
10. **Tooltip:** Existing translated module titles are used for the `title` and decorative tooltip; no label translations were duplicated.
11. **Accessibility:** Each variant renders a localized `<nav>` label, and every link has its localized module name as `aria-label`.
12. **Keyboard:** Links remain tab reachable and Enter activated; the existing Space-to-activate behavior is preserved. Focus-visible styling remains present.
13. **Header layout:** At `xl`, the Header uses three grid columns (`minmax(0, 1fr) auto minmax(0, 1fr)`) so the nav stays centered independent of the side widths.
14. **Long user name:** UserMenu retains its existing 180px maximum width and truncation; the Header controls remain in a non-shrinking right grid area.
15. **Content height:** At 1280px and above the dock row uses `display: none`, so it contributes no flex height and module content receives that space.
16. **FamilyTree:** The shared workspace parent now provides the freed height; FamilyTree scrolling and route behavior were not changed. Runtime viewport comparison was not performed.
17. **Map:** Its existing hidden-scroll workspace remains unchanged; removal of the desktop dock gives its flex content the available height. Leaflet behavior was not changed.
18. **Library:** Gallery and API behavior were not changed; the shared layout provides the extra desktop height.
19. **Anniversaries:** Calendar/event behavior was not changed; the shared layout provides the extra desktop height.
20. **Mobile:** The source and tests preserve bottom Dock rendering below 1280px. Interactive device/browser QA was not performed.
21. **Light Mode:** Surfaces, border, text, hover, and active colors use existing CSS theme variables; runtime visual QA was not performed.
22. **Dark Mode:** The same theme variables are used for the nav and active state; runtime visual QA was not performed.
23. **Reduced motion:** Nav and tooltip transitions are reduced to near-instant under `prefers-reduced-motion: reduce`.
24. **Files created:** `src/features/my-life/components/MyLifeModuleNav.tsx`, `src/features/my-life/components/MyLifeModuleNav.css`, and this report.
25. **Files modified:** `MyLifeDock.tsx/.css`, `MyLifeWorkspaceLayout.tsx`, `UserWorkspaceHeader.tsx`, `tests/my-life-workspace.test.cjs`, and one Header prop assertion in `tests/my-life-hub.test.cjs`.
26. **Tests:** Workspace, hub, i18n, roles, theme-switch, and optimization suites passed together: 52 passed, 0 failed.
27. **Build:** `npm.cmd run build` passed.
28. **Lint:** `npm.cmd run lint` passed.
29. **Diff check:** `git diff --check` passed before commit; the staged diff check also passed.
30. **API:** This navigation change does not alter APIs or service contracts. Existing unrelated API performance work remains uncommitted in the worktree.
31. **Backend:** No Backend files were changed for this task.
32. **Database:** No database or migration files were changed.
33. **Mobile repository:** No Mobile repository files were changed.
34. **Implementation commit:** `821ddeb0a5e04fb34b658773f978f6f4125bd4ba` (`style: move MyLife navigation into desktop header`).
35. **Push result:** `821ddeb` was pushed successfully to `origin/feature_minhduc` after an approved network-authorized retry.

## Scope notes

The responsive behavior was checked through source-level assertions and production build. Manual screenshots at the requested viewport sizes, browser zoom levels, and authenticated module routes were not captured in this environment. The commit intentionally excludes pre-existing report deletions and unrelated API performance changes.
