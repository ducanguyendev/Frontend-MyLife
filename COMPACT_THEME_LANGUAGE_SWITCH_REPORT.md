# Compact Theme and Language Switch Report

## 1. Previous and new ThemeSwitch

The previous ThemeSwitch used a Uiverse illustration with a 84 × 40 px track after the prior header sizing pass, an oversized multi-layer thumb, and legacy cloud/star CSS. It is now a component-scoped compact Sun/Moon switch. The existing shared `useTheme()` context remains the only state source; the input stays controlled by `theme === 'dark'` and `toggleTheme`.

## 2. Exact ThemeSwitch dimensions and behavior

- Track and control: **64 × 40 px**.
- Thumb: **32 × 32 px**, inset **4 px** from each track edge (CSS top/left 3 px plus 1 px track border).
- Checked travel: **24 px**, calculated as `64 - 32 - (4 × 2)`.
- Light mode: blue sky, yellow sun, subtle rays and softly drifting clouds.
- Dark mode: near-black/navy sky, pale moon, subtle craters and gently twinkling stars.
- Animation uses 0.35s transitions and restrained 7s cloud drift / 2.8s star twinkle. `prefers-reduced-motion: reduce` disables animation and reduces transitions to 0.01ms.
- Input uses a visually hidden technique (not `display:none`); localized existing theme labels and a visible focus ring remain available to keyboard users.
- Theme styling is all under `theme-switch__*` classes; no generic or duplicate DOM IDs are used. The obsolete Uiverse CSS was replaced.

## 3. LanguageSwitcher

- Previous desktop trigger: 40 px high, variable width, with a 32 px circular flag and ChevronDown.
- New desktop trigger: **40 × 40 px**, centered 28 px wide flag art with preserved SVG aspect ratio and internal padding/border. The closed trigger contains only the current flag; no VI/EN text or chevron.
- Trigger has `aria-haspopup`, `aria-expanded`, a localized `navigation.changeLanguage` accessible label, and keyboard focus styling.
- Dropdown remains 176 px wide and shows each flag plus localized language name, with selected background and check icon. Native buttons keep keyboard selection available.
- Mobile expanded language buttons are unchanged.

## 4. Header alignment

- Home navigation group remains 40 px tall. The right group uses `items-center` and 8 px gaps; ThemeSwitch is 64 × 40, language is 40 × 40, and UserMenu is 40 px high with its 32 × 32 avatar.
- FamilyTree right controls use 8 px gaps: ThemeSwitch 64 × 40, language/Home 40 × 40, UserMenu 40 px high. Back button is 40 × 40.
- Admin refresh, Home, and logout actions are 40 × 40; ThemeSwitch is 64 × 40 and language is 40 × 40. The action group uses 8 px gaps.
- Shared ThemeSwitch and LanguageSwitcher remain reused across Home, FamilyTree, Admin, and other existing call sites; no page-specific duplicate components were created.

## 5. Files modified for this task

- `src/shared/components/ThemeSwitch.tsx`
- `src/shared/components/ThemeSwitch.css`
- `src/shared/components/LanguageSwitcher.tsx`
- `src/shared/layouts/Header.tsx`
- `src/features/auth/components/UserMenu.tsx`
- `src/features/family-tree/pages/FamilyTreePage.tsx`
- `src/features/admin/pages/AdminDashboard.tsx`
- `src/shared/locales/en/navigation.json`
- `src/shared/locales/vi/navigation.json`
- `tests/theme-switch.test.cjs`

## 6. Verification

- `npm.cmd run test:theme-switch` — passed, 5/5.
- `npm.cmd run test:i18n` — passed, 15/15.
- `npm.cmd run test:optimization` — passed, 8/8.
- `npm.cmd run build` — passed (`tsc -b` and Vite production build).
- `npm.cmd run lint` — passed.
- `git diff --check` — passed; Git emitted line-ending conversion notices only.
- Browser visual QA across Home, FamilyTree, Admin, light/dark, and language changes was not performed in this run.

Backend and database were not changed. Mobile layout/selection flow was not changed. No commit or push was made.
