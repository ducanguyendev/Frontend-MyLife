# Header Control Size Standardization Report

## Scope

Standardized visual sizing and spacing for the shared site header, FamilyTree header, and Admin header. The work is frontend-only and does not change business behavior, API calls, persistence, database, or mobile drawer flows. No commit or push was made.

## Changes

- Shared desktop `ThemeSwitch`: set its track to 84 × 40 px (previously about 99 × 44 px), reduce the thumb and sun/moon art to fit, soften the outer shadow, and preserve its day/night illustration. Its checkbox remains keyboard reachable and now shows a visible focus ring. Reduced motion preferences shorten the animation.
- Shared desktop `LanguageSwitcher` and `UserMenu`: change trigger height from 44 px to 40 px. Keep the flag/avatar at 32 px and the existing dropdown behavior. Add a visible keyboard focus ring; allow more username room (up to 180 px) before truncation.
- Shared Home header: make the centered navigation group 40 px high with balanced 4 px inner padding and 16 px horizontal link padding. Set the right-side controls to a 8 px gap and make the login pill 40 px high without hover scaling.
- FamilyTree header: set Back and Home icon buttons to 40 × 40 px; use a 16 px Home icon, translated accessible label, and consistent 8 px spacing between right-side controls. The 32 px brand mark remains unchanged.
- Admin header: set refresh, Home, and logout icon buttons to 40 × 40 px with 16 px icons and accessible labels. Align the action group to an 8 px gap. User avatars and brand marks remain 32 px.
- Updated the static ThemeSwitch test to assert the new dimensions, keyboard focus behavior, and header sizing rules.

## Verification

- `npm.cmd run test:theme-switch` — passed, 5/5.
- `npm.cmd run build` — passed (`tsc -b` and Vite production build).
- `npm.cmd run lint` — passed.
- `git diff --check` — passed. Git printed line-ending conversion notices for existing working files; no whitespace errors remained.
- Browser visual QA was not performed in this run. The requested manual desktop/mobile and light/dark appearance checks therefore remain unverified.

## Files changed for this task

- `src/shared/components/ThemeSwitch.css`
- `src/shared/components/LanguageSwitcher.tsx`
- `src/shared/layouts/Header.tsx`
- `src/features/auth/components/UserMenu.tsx`
- `src/features/family-tree/pages/FamilyTreePage.tsx`
- `src/features/admin/pages/AdminDashboard.tsx`
- `tests/theme-switch.test.cjs`

Other pre-existing modified and untracked project files were left untouched.
