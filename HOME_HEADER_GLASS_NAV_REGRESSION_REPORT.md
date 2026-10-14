# Home Header Glass Navigation Regression Fix

## Symptom and audit
The desktop Home navigation looked like a near-solid white pill in light mode over the Hero, while its inactive labels remained white. The Hero became hard to see through the nav and label contrast suffered.

The previous `glass-pill` style used a translucent white background (`rgba(255, 255, 255, 0.1)`), 12px backdrop blur, a faint white border, and a modest shadow. Commit `ad97a062e14b9260758cf431adcf8e61cb7b0c51` (`style: refine shadows and remove dark edge artifacts`) changed the shared surface to 88% `--secondary-bg`, a theme border, and a subtle shadow. In light mode `--secondary-bg` is white, so the pill became nearly opaque. Header's unscrolled inactive labels intentionally remain `text-white/70`, compounding the contrast issue. The scrolled Header has a separate class branch and is unchanged.

## Change
Added a dedicated `hero-nav-glass` utility and applied it only to the unscrolled desktop Home nav. Light mode uses 10% white, the existing 12px blur, a 20% white border, and a softer `0 2px 12px rgba(0, 0, 0, 0.06)` shadow. Dark mode uses a low-opacity dark surface, a subtle translucent border, and a restrained shadow. Existing `glass-pill` stays unchanged for its other consumers: FamilyTree page and Admin Dashboard panels. Header text colors, active item, hover, dimensions, scrolled style, mobile drawer, logo, and user controls are unchanged.

## Files
- `src/index.css`: new Hero-only light/dark glass styles.
- `src/shared/layouts/Header.tsx`: use the dedicated class for unscrolled desktop nav.
- `tests/home-header-glass.test.cjs`: regression coverage for the unscrolled class, transparency/blur, dark style, inactive label, and unchanged shared `.glass-pill`.

## Verification
- Header glass regression test: 2/2 passed.
- `npm run test:theme-switch`: 5/5 passed.
- `npm run test:i18n`: 15/15 passed.
- `npm run test:roles`: 5/5 passed.
- `npm run test:optimization`: 8/8 passed.
- `npm run test:my-life-workspace`: 8/8 passed.
- `npm run build`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Browser visual QA at `http://localhost:7000/` and requested widths/zoom was unavailable; local server did not respond. No Backend, database, or Mobile repository files were changed.

## Git
- Branch: `feature_minhduc`.
- Commit and push status will be recorded after publication.
