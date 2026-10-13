# MyLife Anniversary Calendar Workspace Report

## Summary

Redesigned `/anniversaries` as a compact calendar and upcoming events workspace. The solar calendar is populated only from loaded anniversary records; date navigation and filtering are client-side. Existing CRUD, lunar conversion, and event data contracts remain unchanged.

## Previous layout and identified problems

The page repeated its title above a large amber banner, then showed separate total/nearest KPI cards and a tall two-column event-card grid. The tab itself owned a page-length scroll area, so a long list pushed the calendar concept out of focus and required substantial scrolling.

## New workspace architecture

- `AnniversariesPage` keeps `MyLifeWorkspaceLayout`, `contentScroll="hidden"`, member loading/error/retry behavior, and the MyLife Dock.
- The duplicate outer title was removed. `AnniversaryTab` now owns one compact title/description and a toolbar with the shared `SearchBar` and existing Add action.
- On desktop (`xl`), a roughly 40/60 calendar and upcoming events split fills the available content height. The event list owns the internal scroll. Smaller layouts stack calendar and list and allow workspace scrolling.
- Removed the large amber banner and separate summary cards. Event count now appears as a compact calendar-header chip; the API's first event still represents the nearest/upcoming event ordering already used by this feature.

## Calendar behavior

- No calendar/date library was installed or already available, so the calendar uses a small custom React/Date grid and existing Lucide icons.
- The initial month is the month of `items[0].nextSolarDate`; with no usable event date, it is the current month in `Asia/Ho_Chi_Minh`.
- `nextSolarDate` is parsed as a date-only value using UTC calendar fields, avoiding local timezone day shifts. The grid is solar; event rows continue to show `lunarDay`, `lunarMonth`, and the leap-month marker.
- The grid starts Monday. Current day has a subtle outline, independent from event styling. Real event dates receive a dot, with a compact count when multiple events share a date.
- Month navigation wraps across years. A Today action returns to the Vietnam current month and clears the date filter. Navigation and date selection make no API requests.
- Selecting a date intersects with the existing accent-insensitive search across title, related member, place, host, and notes. The selected date can be toggled off or cleared with the visible clear actions. Selecting an empty date shows an empty-date state.
- Date grid buttons have localized full-date labels, selected state, and standard Tab/Enter/Space interaction. No arrow-key grid behavior was added. Motion is limited to transitions; there are no decorative animations.

## Event list and states

- The API list order is preserved. Event rows are more compact and retain `daysUntil`, event type, title, related member name/generation/role, lunar date, timezone-safe solar date, optional place/host/notes, edit, and delete actions.
- Death anniversaries and family events use muted, distinct accents. Surfaces use theme tokens for light and dark mode.
- Existing loading, load-error/retry, empty, no-search-results, and delete-confirmation states remain. Empty state offers the existing add flow.
- Add opens the existing `FamilyAnniversaryModal` with `editing` set to null. Edit opens that same modal with the chosen record. Delete still uses the existing confirmation modal and service call.
- Search continues to use the shared `SearchBar`; its searchable fields and Vietnamese tone removal remain unchanged.

## API, data, and scope

- Unchanged endpoints: anniversary GET/POST/PUT/DELETE and lunar-to-solar conversion. No new API calls were added for calendar navigation or date selection.
- Lunar conversion remains backend/API source-of-truth. Event type values and all `FamilyAnniversary` fields retain their meanings.
- The separate family-member fetch and anniversary fetch remain as before; Task 6 performance work was not included.
- No backend, database, or mobile-app files were changed. The route and MyLife Dock were preserved.

## Responsive and visual QA

- Calendar and list stack below desktop widths; toolbar wraps on small screens. The event list remains independently scrollable inside the desktop workspace.
- Light/dark colors use shared theme tokens. Buttons and clear actions retain visible focus styling.
- Automated source checks and build/lint passed. Manual browser QA at desktop/mobile widths and theme checks could not be performed because this session had no available browser or app surfaces (`cua.getState()` returned none). The local dev server started successfully but could not be opened in a browser.

## Files

Created:

- `src/features/admin/components/family-tree/anniversaryCalendarUtils.ts`
- `MYLIFE_ANNIVERSARY_CALENDAR_REPORT.md`

Modified:

- `src/features/admin/components/family-tree/AnniversaryTab.tsx`
- `src/features/my-life/pages/AnniversariesPage.tsx`
- `src/shared/locales/vi/admin.json`
- `src/shared/locales/en/admin.json`
- `tests/anniversary.test.cjs`
- `tests/my-life-workspace.test.cjs`

## Verification

All passed:

- `npm run test:anniversary` (5 tests, including December/January boundaries, leap February, invalid date and UTC-safe date parts)
- `npm run test:my-life-workspace`
- `npm run test:my-life-hub`
- `npm run test:i18n`
- `npm run test:roles`
- `npm run test:theme-switch`
- `npm run test:optimization`
- `node --test tests/search-bar.test.cjs`
- `node --test tests/shared-select.test.cjs`
- `npm run build`
- `npm run lint`
- `git diff --check`

The repository does not define a `test:search-bar` npm script; its test file was run directly with Node.

## Commit and push

- Implementation commit: `7475493969c0702408cc2668310dd382685fcba2` (`feat: redesign anniversaries as calendar workspace`)
- Reduced-motion follow-up: `82f1cef584638b72c9ca92356872e75d96fc4c6c` (`fix: respect reduced motion in anniversary workspace`)
- Push: both implementation commits pushed successfully to `origin/feature_minhduc` (`bfa7f4d..82f1cef`).
- Report commit: `docs: record anniversary calendar verification`.
