# MyLife Personal Hub Report

## Architecture and access

Previously, the authenticated USER reached FamilyTree directly from the desktop UserMenu and mobile drawer. This mixed a product module with account actions. The new `/MyLife` Personal Hub separates module navigation from the account menu. `/mylife` is also registered as an alias. Both routes reuse `ProtectedRoute requiredRole="USER"`: anonymous users keep the existing login flow, USER can enter, and ADMIN is redirected by the existing guard. This frontend gate does not replace backend authorization.

The public Home header shows a dedicated `LayoutGrid` launcher only when `isUser` is true. It is a 40 × 40 button with a localized accessible label/title and navigates to `/MyLife`. Anonymous users retain the existing Login action; ADMIN does not see the USER launcher.

## Hub UI and modules

The new page is a calm, responsive personal workspace, using existing theme tokens. It has MyLife branding, Back/Home navigation, ThemeSwitch, flag-only LanguageSwitcher, and UserMenu. The page heading is translated as “Không gian của tôi” / “My Space”; it may show the authenticated user's existing name and does not fetch extra data.

Modules are defined centrally in `src/features/my-life/config/myLifeModules.ts` and rendered through the reusable `MyLifeModuleCard`. Only the implemented FamilyTree module appears. The card uses a semantic React Router `Link`, visible keyboard focus, an icon, translated description, and action. No placeholder cards, mock activity, search, or fake counts were added. Future modules can be added through the config and their translations.

## Navigation and account menu

- Desktop USER header: Theme, Language, 40 × 40 MyLife launcher, UserMenu.
- Mobile USER drawer: replaces the direct FamilyTree entry with “Không gian của tôi” / “My Space”, using LayoutGrid and navigating to `/MyLife`.
- UserMenu no longer contains FamilyTree navigation. Profile, switch account, and logout remain; the existing admin dashboard action is preserved for ADMIN.
- FamilyTree Back now returns to `/MyLife`; its separate Home icon still returns to `/Home`.
- FamilyTree breadcrumb is now Home / My Space / Family Tree, with links to Home and the hub.
- ThemeSwitch remains 64 × 40 px and LanguageSwitcher remains 40 × 40 px with a flag-only desktop trigger. Both shared components are reused; neither was moved into UserMenu.

## Internationalization, appearance, and accessibility

Added `myLife` translations for Vietnamese and English. The hub uses the existing light/dark theme tokens and responsive card grid: one column on mobile, two on tablet, and three on larger screens. The MyLife header keeps its Home icon hidden at the narrowest widths to prevent control overflow; Back remains available there. The module card is a keyboard-accessible link with visible focus. Launcher buttons have localized labels, and the FamilyTree breadcrumb uses semantic navigation links.

## Files added

- `src/features/my-life/config/myLifeModules.ts`
- `src/features/my-life/components/MyLifeModuleCard.tsx`
- `src/features/my-life/pages/MyLifeHubPage.tsx`
- `src/shared/locales/en/myLife.json`
- `src/shared/locales/vi/myLife.json`
- `tests/my-life-hub.test.cjs`

## Files modified

- `src/App.tsx`
- `src/shared/layouts/Header.tsx`
- `src/features/auth/components/UserMenu.tsx`
- `src/features/family-tree/pages/FamilyTreePage.tsx`
- `src/shared/i18n/index.ts`
- `package.json` (added `test:my-life-hub` script)
- `tests/family-role.test.cjs` (updated for the new USER navigation)

## Verification

- `npm.cmd run test:my-life-hub` — passed, 6/6.
- `npm.cmd run test:i18n` — passed, 15/15.
- `npm.cmd run test:roles` — passed, 5/5.
- `npm.cmd run test:theme-switch` — passed, 5/5.
- `npm.cmd run test:optimization` — passed, 8/8.
- `npm.cmd run test:family-map` — passed, 3/3.
- `npm.cmd run test:mindmap` — passed, 8/8.
- `npm.cmd run test:select` — passed, 4/4.
- `npm.cmd run test:family-relation-select` — passed, 4/4.
- `npm.cmd run build` — passed (`tsc -b` and Vite production build).
- `npm.cmd run lint` — passed.
- `git diff --check` — passed; Git may report line-ending conversion notices.
- Manual browser QA was not performed in this run, so visual review across roles, breakpoints, and light/dark modes remains outstanding.

Backend, database, and the separate mobile app were not changed. FamilyTree relationship logic, MemberForm, Mindmap, maps, autocomplete, and Finance were not changed. No mock backend data was added. No commit or push was made.
