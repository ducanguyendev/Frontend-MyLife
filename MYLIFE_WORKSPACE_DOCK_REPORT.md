# MyLife Workspace Dock Report

## Problem and implementation

Before this change, each USER page rendered its own `min-h-screen` shell with a separate `UserWorkspaceHeader`. To move between sibling modules, users had to return to `/mylife` first, and page content could extend the browser viewport.

`MyLifeWorkspaceLayout` now provides one `h-dvh` shell with the shared ArrowLeft header, a bounded main content pane, and an optional dedicated Dock row. The shell uses `min-h-0` and `overflow-hidden`; content can scroll within the main pane or its existing feature pane. The Hub opts out of Dock. FamilyTree, Anniversaries, Library, and Map opt in.

## Dock

`MyLifeDock` renders `NavLink`s directly from `myLifeModules`, using each module's existing id, route, title key, and icon. The active route receives an accent treatment; React Router supplies `aria-current="page"` for the active NavLink. Links have localized accessible names and native titles, visible keyboard focus, Space activation in addition to Enter, and hover/focus tooltips. Reduced-motion preferences are respected.

The Dock is a compact, centered row with a reserved layout slot so it does not cover module content. The row accounts for `safe-area-inset-bottom` on mobile. The existing header still owns parent navigation to `/Home` or `/mylife`; the Dock handles sibling-module navigation. UserMenu, ThemeSwitch, and LanguageSwitcher remain unchanged.

## Viewport and module scroll

- FamilyTree fills the available panel. Its manager and flex chain use `min-h-0`; the member list/grid/table/mindmap region owns vertical scrolling.
- Anniversaries keeps the existing scrollable `AnniversaryTab` in a bounded panel.
- Library keeps the existing scrollable `LibraryTab` in a bounded panel, removing the old 600px page minimum.
- Map content scrolls within the shell's main pane when it exceeds the available height; the map component and map behavior were not redesigned.
- Hub content uses the shell's main pane for scrolling and has no Dock.

## Routes, APIs, and scope

Canonical routes and legacy redirects remain unchanged. Existing family, anniversary, library, and map services/endpoints were not modified; Dock navigation is client-side and does not itself call APIs. No backend, database, migrations, or separate mobile-app files were changed.

## Files created

- `src/shared/layouts/MyLifeWorkspaceLayout.tsx`
- `src/features/my-life/components/MyLifeDock.tsx`
- `src/features/my-life/components/MyLifeDock.css`
- `tests/my-life-workspace.test.cjs`
- `MYLIFE_WORKSPACE_DOCK_REPORT.md`

## Files modified

- `src/shared/layouts/UserWorkspaceHeader.tsx`
- `src/features/my-life/pages/MyLifeHubPage.tsx`
- `src/features/family-tree/pages/FamilyTreePage.tsx`
- `src/features/my-life/pages/AnniversariesPage.tsx`
- `src/features/my-life/pages/LibraryPage.tsx`
- `src/features/my-life/pages/FamilyMapPage.tsx`
- `src/features/admin/components/FamilyTreeManager.tsx`
- `src/features/admin/components/family-tree/AnniversaryTab.tsx`
- `src/features/admin/components/family-tree/LibraryTab.tsx`
- `src/shared/locales/en/myLife.json`
- `src/shared/locales/vi/myLife.json`
- `tests/my-life-hub.test.cjs`
- `tests/theme-switch.test.cjs`
- `package.json`

## Verification

Passed: `test:my-life-hub`, `test:my-life-workspace`, `test:i18n`, `test:roles`, `test:theme-switch`, `test:family-map`, `test:library`, `test:library-ui`, `test:anniversary`, `test:mindmap`, `test:optimization`, `test:select`, and `test:family-relation-select`.

- `npm run build` — passed.
- `npm run lint` — passed.
- `git diff --check` — passed.

Manual browser checks at the requested desktop, mobile, and zoom sizes could not be run: Computer Use was denied access to the existing Edge window, and the in-app browser surface was unavailable.

## Delivery

- Branch: `feature_minhduc`.
- Implementation commit: `f181d4e` (`feat: add MyLife workspace dock and viewport shell`).
- Push: successful to `origin/feature_minhduc` (`c0af51a..f181d4e`).
