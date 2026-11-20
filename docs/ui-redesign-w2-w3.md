# MyLife Web — W2 / W3 review

Branch: `feature_minhduc`. Work is limited to `Frontend-MyLife`. The existing uncommitted W1 foundation is retained and extended. No commit or push was made.

## Shared component migration

The W1 semantic palette is centralized in `src/design-system/tokens/tokens.css`; `index.css` imports it and preserves legacy aliases for existing features. The same components remain exported through `shared/components/ui`, with new foundations available from `design-system`.

- Button retains the existing variants and adds tertiary/destructive names. Focus, loading, action text contrast, and icon alignment are shared.
- SearchBar delegates to the shared SearchInput/Input. Family, Anniversary, and Admin keep their existing search state and handlers.
- Input, Textarea, Select, PasswordInput, and DateInput share semantic field colors and accessible states. Compact Input sizing is corrected. Password visibility is keyboard reachable and translated. Date parsing, validation, lunar handling, and payload conversion are unchanged.
- Library metadata fields now wrap Input/Textarea/Select rather than duplicate their visual shell.
- PageHeader supports title, description, eyebrow, actions, and context badge. Family, Timeline, Anniversary, Library, Map, Admin, and member profile use it.
- SegmentedControl is used for family views, Profile sections, and Admin tabs. Chip is used for Timeline/Anniversary filtering. Arrow, Home, and End keys move selection in segmented controls.
- TableShell provides shared spacing, surfaces, separators, hover, and horizontal access. Member table uses it. Admin users/logs now use native tables with their existing handlers and restrictions.
- ConfirmDialog is shared by member deletion, Anniversary, Library photo/album deletion, and Admin deletion. Existing target state, errors, and API calls stay in feature components.
- Shared Modal supports center/drawer placement, focus containment/restoration, Escape, body scroll lock, and reduced motion. Profile now uses the shared modal. Dialog content scrolls within the viewport.
- NotificationContext retains `showNotification` and its event calls, presenting semantic dismissible toasts with live regions. It no longer locks page scrolling; replacing a toast clears its prior timer.
- Loading/ErrorState/EmptyState are used in the migrated async shells. Existing specialized map feedback, photo/lightbox, and form behavior remains feature-owned.

## Authenticated shell

`src/shared/layouts/app-shell/AppShell.tsx` is composed through the existing `MyLifeWorkspaceLayout`. Its CSS owns page gutters, width, header sizing, and scrolling.

Desktop has a warm sidebar, grouped Memories links, a compact utility header, and a main content region. Laptop/tablet uses a compact rail with localized title tooltips. Mobile Web uses the shared accessible drawer. Primary navigation is not repeated in the header.

The header contains page context, a light/dark/system selector, readable VI/EN choices, and the existing account menu. Me opens the existing Profile modal; account actions preserve logout/switch-account handlers. Appearance/language preferences are available from the account menu. Active route styling includes member profiles under Family.

The app's existing roles are exclusive: `ADMIN` does not imply `USER`. ProtectedRoute and AuthContext are unchanged. USER navigation shows the existing MyLife routes; ADMIN navigation shows Administration and Me, avoiding links forbidden to that role. The brand points to the appropriate existing entry route.

Routes using this shell:

| Route | Existing role |
| --- | --- |
| `/mylife` | USER |
| `/familytree` | USER |
| `/timeline` | USER |
| `/anniversaries` | USER |
| `/library` | USER |
| `/map` | USER |
| `/mylife/family/member/:id` | USER |
| `/Home/Admin`, `/home/admin` | ADMIN |

Legacy routes and redirects remain intact. The public portfolio, video source, and routing contracts were not redesigned. `/dev/design-system` remains development-only and now demonstrates real shared segments, a working drawer, and the shared toast. Its theme selector changes the central provider, so portaled controls use the same theme.

## Approved refinements

- **Dark layers:** app `#202823`, page `#27322b`, feature/card surfaces `#2c3730` / `#344139`, canvas `#303e34`, tree cards `#3a483e`, overlays `#414f45`. Warm text, sage, and warm borders remain consistent.
- **Tree fitting:** `treeViewportFit.ts` calculates visible node bounds rather than padded layout bounds, targets 72% of canvas width, reserves measured toolbar height, and respects available height. Small trees may be enlarged to 1.35×; tall trees may occupy less than 60% width to keep generations visible. Production FamilyTreeView and the configured development Shadcn renderer use the same fit helper. Tree data/layout engines, relations, pan/zoom/focus, fullscreen, and export handlers remain intact.
- **Gender:** male uses muted blue-sage (`#668b91` / `#94b7b8`); female uses dusty rose (`#ad7d88` / `#cda2ac`). These replace saturated cyan/pink borders and relationship colors in the applicable renderer CSS.
- **Navigation density:** one sidebar/rail and a utility row replace the workspace capsule navigation/dock. Tree controls share a compact floating toolbar with localized titles.

## Validation and limits

- Build: `npm.cmd run build` passes, including TypeScript.
- Lint: no errors; one existing `react-hooks/exhaustive-deps` warning in `TimelineEventModal.tsx:43`. Vite retains the existing large map bundle warning.
- DateInput: 7 tests pass. Anniversary: 13 tests pass. Exclusive-role guards: 5 tests pass. Obsolete presentation assertions were updated for shared controls and semantic calendar tokens; business assertions remain.
- Isolated browser matrix: six routes × five viewport sizes × two themes = 60 cases. Sizes: 1366×768, 1440×900, 1920×1080, 820×1180, and 390×844. Checks cover one shell, viewport bounds, body/main horizontal overflow, unintended body scrolling, and usable tree canvas height.
- Fixture interaction smoke covers tree zoom/pan/fit, generation filtering, search, member-form opening, table selection, Profile opening/Escape, VI/EN, persisted system preference, drawer focus/Escape, USER/ADMIN guards, Admin tabs, and empty/error states. Both the production FamilyTreeView and configured development renderer were exercised.
- Browser requests are intercepted with synthetic fixtures; feature mutations are not submitted. Screenshots contain synthetic names and `example.test` account data. `qa-results.json` records the matrix; `tests/app-shell.browser.cjs` is the reproducible browser harness.
- **Live backend auth/data smoke remains pending:** no backend was listening on port 5274 and no authorized test session was supplied. Fixture checks do not prove live HttpOnly cookie, Google login, geocoding, or backend CRUD behavior.
- The pre-existing Admin search state was not connected to list filtering; this phase preserves its handler instead of changing search behavior. Some specialized feature styling remains for later module redesign.
- Existing duplicate Timeline/member-profile route declarations were retained from W0/W1 to avoid unrelated routing changes.

## Review

Start Vite with `npm.cmd run dev` and open these routes with a USER session: `/mylife`, `/familytree`, `/timeline`, `/anniversaries`, `/library`, `/map`. Use an ADMIN session for `/Home/Admin`. Open `/dev/design-system` for shared foundations.

Use the utility selector to compare Light, Dark, and System; use the language selector for VI/EN. Check desktop, compact rail, and mobile drawer. Review screenshots in `docs/review-w2-w3` as fixture-backed visual evidence, not approval.

Recommended next step is visual review of W2/W3, followed by W4 public Landing/Home only after approval. No W4–W8 or Relax/Focus implementation is included.

## File inventory

Created for W2/W3:

- `src/shared/layouts/app-shell/AppShell.tsx`, `AppShell.css`
- `src/design-system/tokens/tokens.css`, `foundations.css`, `index.ts`
- `src/design-system/components/Controls.tsx`, `Feedback.tsx`, `TableShell.tsx`, `ConfirmDialog.tsx`
- `src/features/admin/components/family-tree/treeViewportFit.ts`
- `src/shared/locales/en/appShell.json`, `vi/appShell.json`
- `tests/app-shell.browser.cjs`, this report, and fixture review artifacts

Changed groups:

- Workspace layout, theme provider, notification provider, i18n registration, and global CSS.
- W1 Foundations/showcase; shared Button, Card, Badge, Input, Textarea, PasswordInput, Select, DateInput, Modal, SearchBar, and UI exports.
- Auth UserMenu and Profile modal presentation.
- Family manager/page, member table/confirmation, production and development renderer fitting/CSS.
- MyLife module accent CSS; Timeline page/filters/cards; Anniversary, Library, Map and member-profile shells/feedback.
- Admin dashboard presentation and existing Anniversary/role presentation assertions.

API clients, auth services/context/guards, domain services, family adapters/layout algorithms, calendar calculations, and backend/mobile repositories are unchanged.

### Exact tracked-file working diff

Includes the W1 changes already present at the start of this phase. New W2/W3 files are listed above.

```text
src/App.tsx
src/features/admin/components/FamilyTreeManager.tsx
src/features/admin/components/family-tree/AnniversaryTab.tsx
src/features/admin/components/family-tree/DeleteConfirmModal.tsx
src/features/admin/components/family-tree/FamilyMapTab.tsx
src/features/admin/components/family-tree/LibraryPhotoFormFields.tsx
src/features/admin/components/family-tree/LibraryTab.tsx
src/features/admin/components/family-tree/MemberTable.tsx
src/features/admin/components/family-tree/ShadcnFamilyTreeView.css
src/features/admin/components/family-tree/ShadcnFamilyTreeView.tsx
src/features/admin/components/family-tree/family-view/FamilyTreeView.css
src/features/admin/components/family-tree/family-view/FamilyTreeView.tsx
src/features/admin/pages/AdminDashboard.tsx
src/features/auth/components/UserMenu.tsx
src/features/family-tree/pages/FamilyTreePage.tsx
src/features/my-life/components/timeline/TimelineEventCard.tsx
src/features/my-life/components/timeline/TimelineFilterBar.tsx
src/features/my-life/pages/AnniversariesPage.tsx
src/features/my-life/pages/FamilyMapPage.tsx
src/features/my-life/pages/FamilyMemberProfilePage.tsx
src/features/my-life/pages/FamilyTimelinePage.tsx
src/features/my-life/pages/LibraryPage.tsx
src/features/my-life/pages/MyLifeHubPage.css
src/features/my-life/pages/MyLifeHubPage.tsx
src/features/profile/components/UserProfileModal.tsx
src/index.css
src/shared/components/SearchBar.tsx
src/shared/components/ui/Badge.tsx
src/shared/components/ui/Button.tsx
src/shared/components/ui/Card.tsx
src/shared/components/ui/DateInput.tsx
src/shared/components/ui/Input.tsx
src/shared/components/ui/Modal.tsx
src/shared/components/ui/PasswordInput.tsx
src/shared/components/ui/Select.tsx
src/shared/components/ui/Textarea.tsx
src/shared/components/ui/index.ts
src/shared/context/ThemeContext.tsx
src/shared/contexts/NotificationContext.tsx
src/shared/i18n/index.ts
src/shared/layouts/MyLifeWorkspaceLayout.tsx
tests/anniversary.test.cjs
tests/family-role.test.cjs
```
