# MyLife Map First Workspace Report

## Previous layout and issues

The page placed a title and description above a second title/description in `FamilyMapTab`, followed by four statistic cards, a map with fixed 420/520px heights, a full distribution card below the map, and a polling status line. This pushed the map down and made the page behave like a report.

## New workspace

- `FamilyMapPage` now provides only `MyLifeWorkspaceLayout` with `contentScroll="hidden"`, the existing back route, and the dock. The page-level title/description is removed.
- `FamilyMapTab` owns one compact toolbar title (“Family Map” / “Bản đồ gia đình”) and the map workspace. The title is no longer duplicated.
- The map surface fills the available height between the toolbar and the existing dock. Leaflet fills its flex parent; the old fixed 420/520px sizing is removed. A `min(360px, 58dvh)` fallback keeps the map usable on small screens.
- The four real API statistics remain available to assistive technology and display as compact, theme-aware map overlay chips. On small screens they wrap into two columns; wider screens use one row.
- Geocoding and stale-data retry status are compact chips above the bottom map controls area. The dock remains in its dedicated layout row, and the Map Dock link remains active on `/map`.

## Distribution panel

- The previous below-map distribution card is removed from normal page flow.
- The Areas/Khu vực toolbar button opens the existing shared Modal, styled as a right-side panel on wider screens and a bottom sheet on mobile.
- The panel renders existing `locations` data and calculates each percentage from `locatedMembers`; opening it does not create an API request. The map stays mounted beneath the panel.
- Modal focus handling, Escape/backdrop close, body scroll lock, and close control are reused. `useReducedMotion` passes a reduced-motion option for panel/backdrop motion.

## Map behavior preserved

- `familyMapService.ts` and `GET /api/family-tree/map` response contract are unchanged.
- The single fetch owner remains `FamilyMapTab`; pending geocoding still polls every 5 seconds.
- React Leaflet, `MapContainer`, OpenStreetMap `TileLayer` and attribution, `CircleMarker`, `Tooltip`, `Popup`, marker radii, and the first six actual member names in each popup are retained.
- `MapViewport` behavior is unchanged: Vietnam center for zero locations, center/zoom for one location, and `fitBounds` for multiple locations.
- Loading, retryable error, zero-member empty, and no-locations guidance states remain. No fake data or browser geolocation is added.
- Popup surfaces and text use theme-aware colors, and names wrap within a reasonable width. OSM tiles are not filtered or recolored.

## Responsive, theme, and accessibility

- Desktop/tablet use the flex workspace; the distribution panel becomes a right-side sheet at wider widths. Mobile uses a bottom sheet and wraps stat chips into a compact 2×2 group.
- Surface, chips, panel, popup, loading, and empty/error states use theme tokens. Light/Dark visual appearance was not manually inspected in a browser.
- Statistics remain semantic list content with localized accessible labeling. Decorative icons are `aria-hidden`; panel trigger exposes dialog/expanded state. Modal retains focus management and keyboard close behavior.
- New workspace and compact-stat labels are translated in Vietnamese and English.
- Browser QA was attempted at `http://127.0.0.1:7000/map`, but CUA reported “Browser is not available: chrome”. Requested screen sizes, zoom, visual theme states, Leaflet clicks, API-call observation, and live pending-geocoding behavior therefore remain unverified.

## Scope and files

Modified:

- `src/features/my-life/pages/FamilyMapPage.tsx`
- `src/features/admin/components/family-tree/FamilyMapTab.tsx`
- `src/features/admin/components/family-tree/FamilyMapTab.css`
- `src/shared/components/ui/Modal.tsx` (optional reduced-motion support)
- `src/shared/locales/vi/admin.json`
- `src/shared/locales/en/admin.json`
- `tests/family-map.test.cjs`
- `tests/my-life-workspace.test.cjs`
- `tests/my-life-hub.test.cjs` (whitespace-tolerant layout assertion)

Created:

- `MYLIFE_MAP_FIRST_REPORT.md`

No API service, backend, database, migration, or mobile app files were changed.

## Verification

- PASS: `npm run test:family-map`
- PASS: `npm run test:my-life-workspace`
- PASS: `npm run test:my-life-hub`
- PASS: `npm run test:i18n`
- PASS: `npm run test:roles`
- PASS: `npm run test:theme-switch`
- PASS: `npm run test:optimization`
- PASS: 47 related Modal/UI tests across member-form-layout, member-detail-layout, scroll-sibling, library-ui, anniversary, avatar, and family-member-picker.
- PASS: `npm run build`
- PASS: `npm run lint`
- PASS: `git diff --check`

## Delivery

- Branch: `feature_minhduc`
- Feature commit SHA: pending
- Push to `origin/feature_minhduc`: pending
