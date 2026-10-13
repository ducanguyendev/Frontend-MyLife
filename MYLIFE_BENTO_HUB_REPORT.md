# MyLife Bento Hub Report

## Previous Hub and identified issues

The Hub used a left-aligned intro followed by four identical cards in a four-column row. The cards shared the same size, were capped at 320px, and left much of a desktop viewport unused. The page felt like a module menu rather than a personal space.

## New composition

- Reworked `/mylife` into a CSS Grid bento while preserving `MyLifeWorkspaceLayout`, the `/Home` back destination, USER-only route behavior, shared header controls, and the absence of the dock.
- `myLifeModules` remains the source for the four module cards and their routes. It now carries a small serializable `visualVariant` value for each module.
- At desktop widths (`xl`), the Family Tree card occupies six of twelve columns across two rows. Anniversaries fills the other six columns on the first row; Library and Map share the second row.
- Tablet uses two columns, with Family Tree spanning both. Mobile uses one column without horizontal scrolling classes.
- Family Tree is the primary card with a connected-node illustration. Anniversaries uses a calendar grid and warm accent; Library uses abstract stacked frames and a book icon; Map uses contour rings and a map pin. All are decorative CSS/SVG/icon shapes and contain no fake events, counts, photos, or locations.
- The compact intro keeps the existing title, greeting, and subtitle concept. New eyebrow and section accessibility labels are translated in Vietnamese and English. The subtitle now emphasizes family connection and meaningful moments.

## Visuals, themes, and accessibility

- Added a low contrast radial glow and dot pattern in CSS. No external image or new dependency is used; there is no image source or license to document.
- Cards use the current theme surface and border tokens with restrained accent-tinted gradients and shadows. Accent families distinguish family, calendar, library, and map while keeping the same card structure.
- Card hover uses a 240ms transition and a subtle 2px lift. The CSS respects `prefers-reduced-motion`; the global reduced-motion rule also remains active.
- Each entire card is a semantic React Router `Link`, with visible focus styling and Enter activation. Decorative artwork is hidden from assistive technology.
- The existing theme-aware shell is retained. Automated checks passed, but Light/Dark appearance was not visually inspected in a browser.

## Scope and files

Created:

- `src/features/my-life/pages/MyLifeHubPage.css`
- `MYLIFE_BENTO_HUB_REPORT.md`

Modified:

- `src/features/my-life/pages/MyLifeHubPage.tsx`
- `src/features/my-life/components/MyLifeModuleCard.tsx`
- `src/features/my-life/config/myLifeModules.ts`
- `src/shared/locales/vi/myLife.json`
- `src/shared/locales/en/myLife.json`
- `tests/my-life-hub.test.cjs`

No API, service, backend, database, migration, or mobile app files were changed. FamilyTree, Anniversaries, Library, Map, Dock, workspace layout, and shared header implementations were not redesigned or modified.

## Verification

- PASS: `npm run test:my-life-hub`
- PASS: `npm run test:my-life-workspace`
- PASS: `npm run test:i18n`
- PASS: `npm run test:roles`
- PASS: `npm run test:theme-switch`
- PASS: `npm run test:optimization`
- PASS: `npm run build`
- PASS: `npm run lint`
- PASS: `git diff --check`
- Browser QA not completed: the CUA session exposed no browser (`createBrowserTab("iab", ...)` returned “Browser is not available: iab”). Viewport, zoom, theme appearance, and click-through checks at the requested sizes therefore remain unverified.

## Delivery

- Branch: `feature_minhduc`
- Feature commit SHA: `8f01cad` (`feat: redesign MyLife personal hub with bento layout`)
- Push to `origin/feature_minhduc`: PASS
