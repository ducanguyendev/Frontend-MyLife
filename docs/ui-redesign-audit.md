# MyLife Web UI audit — W0

Scope: `Frontend-MyLife`, branch `feature_minhduc`. This is an implementation audit for the W0/W1 design-system foundation. Feature APIs and business rules are outside scope.

## Route inventory

Routes are declared in `src/App.tsx` using React Router v7. Public routes `/`, `/home`, `/Home`, and the wildcard fallback render the portfolio. `/Register` and `/register` render registration. Authenticated USER routes are `/mylife`, `/familytree`, `/anniversaries`, `/library`, `/map`, `/timeline`, and `/mylife/family/member/:id`. ADMIN routes `/Home/Admin` and `/home/admin` render the admin dashboard. `/403` renders forbidden. Legacy aliases redirect to canonical MyLife and family-tree routes. `/dev/design-system` is now a development-only review route.

The route file contains repeated `/timeline` and member-profile declarations. These currently resolve to the same elements and were left untouched to avoid routing changes.

## Current UI architecture

- Global providers: `ThemeProvider`, `AuthProvider`, `MotionConfig`, notification context, and i18next initialization in `src/main.tsx` / `src/App.tsx`.
- Layouts: `Header`, `Footer`, `MyLifeWorkspaceLayout`, and `UserWorkspaceHeader`; the workspace header can show module navigation and a dock.
- Shared controls: `src/shared/components/ui` includes Button, Card, Badge, Input, PasswordInput, Textarea, Select, DateInput, Modal, and a floating add button.
- Other shared patterns include LoadingScreen, Skeleton, ErrorBoundary, SearchBar, LanguageSwitcher, ThemeSwitch, body-scroll lock, and notification dialog.
- Routing lazy-loads authenticated feature pages; portfolio sections are eagerly imported.
- Styling is Tailwind CSS v4 via `@tailwindcss/vite`, global CSS in `index.css` / `App.css`, and numerous feature CSS files. Framer Motion is already installed and configured for reduced motion; Lucide is the dominant icon family.
- i18n uses `react-i18next` and separate English/Vietnamese locale JSON under `src/shared/locales`.

## Findings

- Theme state was only `light` or `dark`; first visit followed OS preference but the preference itself was not represented or persisted as `system`.
- The legacy global palette had cool gray and near-black dark mode values. Many existing components consume aliases such as `primary-bg`, `secondary-bg`, `accent`, `custom-border`, and field variables, so alias remapping is a low-impact way to introduce the product palette incrementally.
- Form controls have a stronger base architecture than most other UI: shared field label/feedback shell, ARIA descriptions, validation states, date picker, and Radix Select.
- Modal has focus containment/restoration, Escape handling, portal rendering, and body scroll locking. Notification feedback currently renders as a blocking centered alert dialog rather than a transient snackbar.
- Button has overlapping legacy names (`outline`, `danger`) and was missing explicit `tertiary` and `destructive` names. Card had a single surface style. Neither is used uniformly across all feature CSS.
- Loading, empty, and error states are implemented independently in features. Skeleton exists globally, but there is no shared semantic empty/error presentation used consistently.
- Tables are feature-owned (family member list and admin data); no shared table shell exists yet.
- A repository-wide scan finds literal colors throughout page CSS/TSX, particularly portfolio visuals, family tree renderers, map overlays, admin dashboard, and calendar/timeline styling. Numerous spacing and typography values are also local. W1 establishes tokens; full replacement is a later migration.
- Icon usage is primarily Lucide, with library-generated / map-specific visuals and a few custom illustrations. Keep Lucide as the default shared icon family.
- Responsive rules are feature-specific; workspace layout caps content around 1400px while many controls and tables set their own breakpoints. Audit representative desktop widths (1366, 1440, 1920) and tablet during feature migration.

## Duplicated patterns and likely hotspots

- Buttons: shared Tailwind primitive plus many bespoke feature action buttons and CSS selectors.
- Inputs/selects/date controls: shared primitives exist, while some forms still create custom wrappers and validation presentation.
- Cards/surfaces: shared Card is mostly used selectively; feature pages define many custom cards, especially admin, MyLife hub, family tree, timeline, and library.
- Modals: shared Modal plus dedicated feature dialogs for profile, auth, family/member CRUD, albums/photos, anniversaries, and lightbox. Do not consolidate their logic during visual migration.
- Tabs/chips: family tree, anniversary, library, and timeline each have module-specific controls.
- Loading/empty/error: repeated feature-specific JSX and CSS, with reusable LoadingScreen/Skeleton/ErrorBoundary available.
- Hardcoded style hotspots include `src/index.css`, `src/App.css`, `src/features/portfolio/**`, `src/features/admin/components/family-tree/**`, `src/features/my-life/**`, `src/features/admin/pages/AdminDashboard.tsx`, and map/calendar components.

## Safe reuse and protected behavior

- Reuse the shared form controls, `FormFieldShell`, `Modal`, `Card`, `Badge`, `Skeleton`, `LoadingScreen`, `ErrorBoundary`, notification context, existing theme switch, and Lucide icons.
- Preserve auth services/context, ProtectedRoute, cookie-based API client behavior, session expiration / 403 flows, profile/avatar behavior, and role/provider display.
- Preserve family tree adapters/renderers and all view, relation, CRUD, pan/zoom, focus, export, and profile behaviors. Preserve timeline, anniversary/lunar conversion, library upload/lightbox, map/geocoding, and admin contracts.
- Do not edit route behavior or content for the public `/` / `/Home` portfolio during W0/W1.

## Assets to preserve

- `public/assets/cofounder/cofounder-2-hero.webm` is the current public hero video. Its source and references remain intact.
- Keep related public logo assets, `public/hud_background.png`, and portfolio project media under `src/shared/assets` for possible future reuse.
- No video/background asset was removed or renamed.

## Files introduced / foundations

- Semantic CSS tokens in `src/index.css`: light/dark surfaces, text, borders, actions, states, module accents, spacing, radius, shadow, motion, z-index, and breakpoint reference values.
- Theme preference now retains `light`, `dark`, or `system`, while `theme` remains the resolved light/dark value for existing consumers.
- Shared foundations in `src/design-system/components/Foundations.tsx`: PageContainer, PageHeader, SectionHeader, Surface, Avatar, StatusPill, EmptyState, and feedback sample.
- Existing Button and Card gained semantic variants while retaining legacy variants and props.
- Review route: `/dev/design-system` (development only). Use its theme preview selector to inspect both light and dark mode without changing global preference. It demonstrates color, typography, spacing, controls, tabs, chips, badges, avatars, cards/stats, a table, modal, loading, skeleton, empty, error, and success feedback.

## Recommended migration order

1. Review W1 tokens and showcase, compare against approved Mobile V3 screenshots, and tune values.
2. Migrate the authenticated shell and shared workspace navigation in a dedicated phase.
3. Migrate profile/auth and reusable table/form/modal presentation, validating behavior at each step.
4. Migrate MyLife home/hub, then family, memories (timeline/anniversary/library), map, and admin as separate reviewable slices.
5. Redesign public `/` and `/Home` in W4; preserve/re-purpose hero media only after product direction review.

This report records existing routes and structure and does not claim full visual approval. Business behavior and APIs remain outside the design-system migration.

## Validation snapshot

npm run build passes (TypeScript and Vite). Vite retains the existing large family map chunk warning (~1 MB minified). 
npm run lint has no errors; it reports three existing React hook warnings in ShadcnFamilyTreeView.tsx, FamilyTreeView.tsx, and TimelineEventModal.tsx. 
npm run test:theme-switch passes (5 tests). 

