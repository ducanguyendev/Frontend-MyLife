# MyLife Route Architecture Report

## Summary

The USER Personal Hub now has independent routes for its four existing features. The work is limited to the frontend under `Frontend-MyLife`; it reuses the current feature components and API services.

## Previous architecture

`FamilyTreeManager` previously combined member management, anniversaries, the family library, and the family map behind a four-tab navigation. This coupled navigation for separate features to the family-tree page.

## Routes and access

| Route | Page | Access |
| --- | --- | --- |
| `/mylife` | MyLife Hub | `ProtectedRoute requiredRole="USER"` |
| `/familytree` | Family member management | `ProtectedRoute requiredRole="USER"` |
| `/anniversaries` | Existing `AnniversaryTab` | `ProtectedRoute requiredRole="USER"` |
| `/library` | Existing `LibraryTab` | `ProtectedRoute requiredRole="USER"` |
| `/map` | Existing `FamilyMapTab` | `ProtectedRoute requiredRole="USER"` |

Routes are canonical lowercase paths. Existing FamilyTree and MyLife URL variants redirect to their canonical routes with replacement navigation.

## Hub and feature reuse

`myLifeModules.ts` centralizes the four actual module cards and their labels, descriptions, icons, and destinations. The Hub links to `/familytree`, `/anniversaries`, `/library`, and `/map`; no placeholder modules were added.

`FamilyTreeManager` now handles member management only and retains grid, table, mindmap, search/filter, detail, relationship, avatar, and CRUD functionality. Its former module tabs are removed. Anniversary, Library, and Map pages are thin wrappers around their existing feature components. `useFamilyMembers` shares the member-loading behavior between FamilyTree and Anniversaries without changing the API contract.

## Shared workspace shell and navigation

All five pages use `UserWorkspaceHeader`, which preserves ThemeSwitch, LanguageSwitcher, UserMenu, and profile access. Its sole navigation control is ArrowLeft; it contains no Home icon. Back destinations are explicit: `/mylife` returns to `/Home`, and each module returns to `/mylife`.

The Home desktop and mobile launchers point USERs to lowercase `/mylife`. UserMenu retains account actions and no longer lists personal modules. Existing role protection remains in `ProtectedRoute`; no new authentication mechanism was introduced.

## Localization, layout, themes, and accessibility

New Hub and module copy is provided in Vietnamese and English through the shared i18n setup. The Hub uses responsive card columns (one on small screens, two at medium widths, and four at wide widths). Existing theme tokens and ThemeContext continue to control Light and Dark modes. Controls retain accessible labels and the shared components’ keyboard/focus behavior.

Automated checks cover route guards and redirects, Hub modules, back targets, ArrowLeft-only navigation, preserved member views, shared loading, language dictionaries, and shared controls. Manual browser checks for visual overflow and every route in both themes were not performed in this run.

## Files created

- `src/shared/layouts/UserWorkspaceHeader.tsx`
- `src/shared/hooks/useWorkspaceToast.ts`
- `src/features/admin/components/family-tree/useFamilyMembers.ts`
- `src/features/my-life/config/myLifeModules.ts`
- `src/features/my-life/pages/MyLifeHubPage.tsx`
- `src/features/my-life/pages/AnniversariesPage.tsx`
- `src/features/my-life/pages/LibraryPage.tsx`
- `src/features/my-life/pages/FamilyMapPage.tsx`
- `src/shared/locales/en/myLife.json`
- `src/shared/locales/vi/myLife.json`
- `tests/my-life-hub.test.cjs`

## Files modified

- `src/App.tsx`
- `src/features/admin/components/FamilyTreeManager.tsx`
- `src/features/auth/components/UserMenu.tsx`
- `src/features/family-tree/pages/FamilyTreePage.tsx`
- `src/shared/i18n/index.ts`
- `src/shared/layouts/Header.tsx`
- `package.json`
- `tests/family-role.test.cjs`
- `tests/feature-i18n.test.cjs`
- `tests/optimization.test.cjs`
- `tests/theme-switch.test.cjs`

## Verification

All requested test scripts passed: `test:i18n`, `test:roles`, `test:theme-switch`, `test:family-map`, `test:mindmap`, `test:library`, `test:library-ui`, `test:anniversary`, `test:optimization`, `test:select`, and `test:family-relation-select`. The added `test:my-life-hub` also passed.

- `npm run build` — passed (`tsc -b` and Vite production build).
- `npm run lint` — passed.
- `git diff --check` — passed.

## Scope and delivery

No backend, database, or separate mobile application files were changed. No commit was created and nothing was pushed.
