# MyLife — Navigation cleanup + W5 Family

Branch: `feature_minhduc`. Scope ends at W5; ready for visual review. Existing W0–W4 work remains in the working tree. No commit or push was made.

## Navigation

- Removed automatic breadcrumbs from `/mylife`, `/familytree`, `/timeline`, `/anniversaries`, `/library`, and `/map`.
- Member profiles show clickable Family > Members > member name context. Both contextual parents return deterministically to `/familytree`.
- Authenticated MyLife logos and Home point to `/mylife`. Removed the profile's history-based Back control and moved editing into its hero.
- The account menu links to `/` with **Trang giới thiệu MyLife** / **About MyLife**. The public landing remains unchanged.
- Family stays active on member profiles. Memories is the one active primary item for Timeline, Calendar, and Library; the current child has a quieter underline.
- Navigation was checked across all six top-level routes, including the public menu link. Auth guards and exclusive ADMIN/USER role behavior are unchanged.

## Family experience

The header uses “Cùng một gốc rễ” / “From the same roots,” with one primary Add action. One toolbar contains search, dynamic generation selection, and Tree / Cards / List. Search has an explicit clear control and restores input focus. The search algorithm is unchanged.

The production renderer remains `family-view` (`FamilyTreeView`). No experimental renderer was promoted. Layout calculations, relation adapters, memoization, fixed **196 × 94** node geometry, and PNG implementation remain in place. The existing content-bounds fit targets 72% of useful width, with height and maximum-scale limits; the larger, unwrapped canvas gives that fit more space. Tall or large trees remain height-constrained and can be zoomed manually.

Tree styling uses a quiet cream/charcoal canvas, forest connection lines, muted teal/rose gender borders plus gender text, readable life ranges, and restrained hover controls. Fullscreen keeps the same scale and centre point and provides a labeled exit action. Expansion controls appear where immediate children can actually be revealed; an expanded node retains its collapse action. The underlying visibility/layout algorithms are unchanged.

Cards use shared buttons/badges, warm surfaces, avatar, role, generation, gender, life status/range, address summary, View, Edit, and overflow deletion. The list keeps all useful desktop columns and a controlled horizontal scroll area on tablet. Mobile uses stacked rows containing the same fields.

The large member form has two independent desktop columns: personal information and avatar/biography; family relationships and contact/address. Sections are initially open and remain collapsible. Mobile stacks the columns. Relationship selections show avatars and wrap long names, including spouse names. Existing father/mother/spouse toggle semantics, children, biological siblings, cousins, and horizontal relations remain intact.

Avatar selection, preview, removal, managed-image URLs/revisions, and save/upload/remove sequencing are preserved. Removal is a labeled contextual action. AddressInput is retained.

Quick detail remains an overview of relationships, contact, Facebook and biography, with Edit and Full profile. Its mobile header gives actions a separate row so names and dates remain readable.

The full profile now has a hero and balanced main/sidebar layout. It retains relatives, Relationship Explorer, personal timeline, related anniversaries, compact coordinate-based map, address, library link status, and biography. It adds direct navigation to the existing Timeline, Map and Library pages and a contact summary. Relative mini-cards have clickable avatars/names.

Relationship Explorer still calls `GET /api/family-tree/relationship` with `fromMemberId` and `toMemberId`. It displays only the returned summary/path. Changing a selection clears the displayed result; selectors are disabled during calculation. Result names are tied to the response IDs. Path steps retain member navigation and now include avatars.

Loading placeholders follow tree, gallery, table and profile shapes. The first-member empty state has a single Add action; load failures retain retry and localized messages. New copy is registered in Vietnamese and English.

## Preservation checks

Before W5 edits, local snapshots were captured. Exact comparisons passed for `handleFormSubmit`, `handleSaveMember` (including deletion handling in the compared block), and `handleOpenModal` before final presentation-only adjustments. No validation or payload handler was rewritten.

Preserved rules include Unicode name/length validation, required role/length, positive integer generation, Vietnamese phone validation, birth date validity/future restrictions, life status and required death date, death date ordering/future checks, Facebook validation, and avatar file validation. No Instagram field was added.

No API endpoint, DTO, auth provider, role guard, relation/search algorithm, geocoding service, or backend code changed for W5. All changes were made inside `Frontend-MyLife`; Backend and Mobile projects were not edited. UI viewport, expansion-affordance, and relationship-result presentation state changed as described above.

## Files and components

| Area | W5 files |
| --- | --- |
| Navigation | `src/shared/layouts/app-shell/AppShell.tsx`, `AppShell.css`; `src/shared/layouts/MyLifeWorkspaceLayout.tsx`; `src/features/auth/components/UserMenu.tsx` |
| Family page | `src/features/family-tree/pages/FamilyTreePage.tsx`; `src/features/admin/components/FamilyTreeManager.tsx` |
| New domain presentation | `src/features/admin/components/family-tree/FamilyExperience.css`; `FamilyViewSkeleton.tsx` |
| Member views/form/detail | `MemberCard.tsx`, `MemberTable.tsx`, `MemberFormModal.tsx`, `MemberDetailModal.tsx`, `FamilyRelationSelect.tsx` in `src/features/admin/components/family-tree/` |
| Production tree | `family-view/FamilyTreeView.tsx`, `FamilyTreeView.css`, `FamilyPersonCard.tsx` |
| Profile/explorer | `src/features/my-life/pages/FamilyMemberProfilePage.tsx`; `src/features/admin/components/family-tree/RelationshipExplorer.tsx` |
| Shared controls | `src/shared/components/SearchBar.tsx`; `src/design-system/components/Controls.tsx` (search input ref forwarding) |
| Localization | `src/shared/i18n/index.ts`; new `src/shared/locales/{vi,en}/family.json`; supplementary keys in `{vi,en}/admin.json` |
| Verification | `tests/family-w5.browser.cjs`; updated Family tree, form, detail and gallery test expectations |

Shared Button, IconButton, Badge, Select, Input, DateInput, Textarea, Modal, ConfirmDialog, Skeleton, EmptyState, ErrorState, TableShell and SegmentedControl are reused.

## Validation and smoke results

| Check | Result |
| --- | --- |
| `npm.cmd run build` | Pass, including TypeScript (`tsc -b`) |
| `npm.cmd run lint` | Pass: zero errors, one existing TimelineEventModal hook-dependency warning |
| Family tree/adapters/relations/picker/avatar/form/detail/roles/gallery tests | 59 passed |
| Focused relationship/profile tests | 3 passed |
| `git diff --check` | Pass; Git prints existing line-ending normalization notices |
| Browser visual matrix | 54 checks passed: no page/main/dialog horizontal overflow and exactly one active primary item |
| Themes and widths | Light + dark at 1366×768, 1440×900, 1920×1080, 820×1180, 390×844 |
| Browser interactions | Navigation, search/clear, generation 7 selection, three views, pan/drag, wheel/button zoom, Fit, related highlight, branch focus, expansion/collapse, focus restoration, extended relations, fullscreen scale retention, PNG download, quick detail/full profile, relative/path navigation, relationship request, invalid create rejection, create/edit/delete, avatar preview/upload/remove, empty/error/retry/loading and Vietnamese rendering passed |

All browser `/api/` traffic was intercepted with synthetic data, including five fixture-only mutation requests. No real member was created, edited, uploaded or deleted. Actual backend constraints, third-party geocoding, managed storage and live map tiles were not exercised against production services.

The browser runner requires the local `scratch_puppeteer` Puppeteer installation and Edge. QA uses the production renderer explicitly:

```powershell
$env:VITE_FAMILY_TREE_RENDERER='family-view'
npm.cmd run dev -- --host 127.0.0.1 --port 7001
# In another terminal:
node tests/family-w5.browser.cjs
```

`MYLIFE_INTERACTIONS_ONLY=1` runs the focused smoke checks; `MYLIFE_VISUAL_WIDTH=390` limits image capture to mobile. The test APIs are isolated to the browser test session.

## Review artifacts

- [Visual matrix results](review-w5/visual-results.json), [interaction requests/results](review-w5/results.json)
- [Desktop tree — light](review-w5/light-1920-Tree.png), [desktop tree — dark](review-w5/dark-1440-Tree.png)
- [Gallery — dark](review-w5/dark-1440-Cards.png), [desktop list](review-w5/light-1440-List.png), [mobile list](review-w5/dark-390-List.png)
- [Desktop form — dark](review-w5/dark-1440-form.png), [mobile form](review-w5/light-390-form.png)
- [Desktop profile](review-w5/light-1440-profile.png), [mobile profile](review-w5/dark-390-profile.png)
- [Mobile quick detail](review-w5/dark-390-quick-detail.png), [restored branch](review-w5/restored-branch.png), [exported PNG](review-w5/downloads/mylife-family-tree.png)
- [Empty](review-w5/state-empty.png), [error](review-w5/state-error.png), [loading](review-w5/state-slow.png), [Vietnamese](review-w5/vi-family.png)

## Known limitations and existing issues

- Large/tall trees necessarily fit at smaller scales, especially on mobile; zoom and branch focus remain available. Renderer calculations were preserved.
- The build retains its existing large map-bundle warning. The existing lint warning is at `TimelineEventModal.tsx:43`.
- Additional legacy full-suite attempts encounter stale Timeline/map assertions and an i18n mock missing `generationCardThemes`. Those unrelated source/test files were not changed to force the wider suite green. The targeted W5 suites above pass.
- Automatic approval review rejected bulk deletion of temporary W5 snapshots/scripts and diagnostic screenshots, citing the possibility of destroying untracked work or review evidence. They were retained; implementation and validation are unaffected. Files named `scripts/w5-*.cjs` are one-shot migration/audit drafts, not application entry points or repeatable commands. The reusable runner is `tests/family-w5.browser.cjs`.

W6, W7, W8 and Relax/Focus work have not started. Awaiting visual approval.
