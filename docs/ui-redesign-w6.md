# MyLife — W5 final patch + W6 Memories

Branch: `feature_minhduc`. Implemented locally in `Frontend-MyLife`. No commit, push or deployment. W7, W8 and Relax/Focus have not started.

## W5 final patch

- **Initial tree fit:** content bounds target 74% of useful width. Modest desktop trees receive a bounded readability floor when a distant generation would otherwise make every name tiny. Content stays horizontally centered, with roots below the toolbar when the taller tree needs vertical panning. Large forests retain the complete-bounds fit. Single members retain the existing enlargement cap.
- **Fit and export:** the explicit Fit control and PNG export still contain the complete tree. Pan, wheel/button zoom, focus, branch expansion/collapse, focus restoration and fullscreen were checked with the existing Family browser suite. The production renderer, node geometry, adapters and layout engine are unchanged.
- **Card grid:** a 250px useful minimum and a maximum of four desktop columns prevent five narrow cards. Smaller viewports reduce columns and avoid horizontal overflow. Table behavior is unchanged.
- Changed only `treeViewportFit.ts`, production `family-view/FamilyTreeView.tsx`, and `FamilyExperience.css` for this Family patch. Renderer flags and alternative renderers were not promoted or redesigned.

## Timeline

Timeline now uses an editorial year hierarchy, a sticky desktop year index and a horizontal mobile index. Year links scroll and focus the corresponding group using the existing grouping/order. Events share a continuous line and date column rather than separate floating cards.

Teal appears in markers, dates, selected filters and the main action. Automatic events have a quiet **Tự động / Automatic** indicator. `BIRTH` and `DEATH` retain their existing non-editable/non-deletable guards. Manual actions use a keyboard-accessible overflow menu and shared deletion confirmation. Existing member IDs support contextual links to the existing member profile route; no relationships are inferred.

The create/edit dialog uses two desktop columns with event, people, time/location and content sections. Exact-date and approximate-year fields, type-specific fields, suggested titles, title limits, marriage-person validation, and all payload fields remain intact. Only the existing four manual types are creatable; legacy types remain governed by the existing rules. Empty data and an empty filtered view have different messages/actions.

Files: `FamilyTimelinePage.tsx`, `TimelineEventModal.tsx`, `timeline/TimelineEventCard.tsx`, `TimelineYearSection.tsx`, and new `TimelineYearRail.tsx` under `src/features/my-life/`.

## Calendar / Anniversary

Calendar uses a cream/charcoal surface and restrained amber/ochre accents. Desktop places it beside the upcoming list; tablet/mobile stack the two. Month/year and navigation controls use separate rows so long month names remain visible. Today, selected dates, outside-month dates, event dots and multiple-event counts have distinct shape/weight/border treatments and accessible labels.

The existing month navigation, month/year picker, Today, date selection, clear filters, search and event-type filters are retained. The grid has row semantics, selected/current-date attributes and arrow/Home/End keyboard navigation. The month picker restores focus to its trigger after applying or dismissing it.

Upcoming entries have date tiles, event type, related member, days-until, lunar/solar information, place, host and notes. Edit/delete actions are contextual; death anniversaries use the same calm amber family as other calendar events.

The dialog has independent desktop columns for event/organization fields and dates. Death-member selection and date prefilling, lunar day/month/year, leap month, original solar date, lunar-to-solar matching, recurrence preview, next occurrence and days-until are preserved. Conversion and recurrence still come from the existing authenticated service endpoints. No lunar calculations were rewritten.

Files: `AnniversaryTab.tsx`, `FamilyAnniversaryModal.tsx`, `AnniversariesPage.tsx`, plus new shared `AnniversaryDateTile.tsx`.

## Library

Library now starts with visual album cards: an existing cover/photograph or an empty cover, name, description, count and updated date. Desktop album widths support three to four useful columns. Selection has an explicit selected-album heading and a return to all albums, plus the existing album filter. Categories remain outside the main workflow.

The photo grid uses a consistent 4:3 rhythm, lazy-loaded images, compact captions and subtle hover/focus overlays. Contextual edit/delete menus keep photographs prominent. Existing album and photo data mapping/filtering is unchanged.

The lightbox uses the shared accessible Modal, a large uncropped image and readable metadata panel. Portrait tablets and mobile stack the photo above the metadata. It retains edit, delete, original-image opening and Escape, and adds previous/next controls, Left/Right keys and a position counter within the currently filtered photographs. Focus remains inside the dialog. The existing `PhotoLightboxModal` export is retained as a compatibility entry point.

Upload retains normal file selection, multiple previews, preview removal, size/type/count/date validation and the existing multipart service call. A drop zone uses the same file state and validation. Busy feedback reports uploading without inventing a percentage. Album/photo metadata forms retain title, display date, description, author, validation and error handling.

No-albums, empty-album and no-match messaging remain distinct. Main page scrolling replaces nested gallery/page scroll regions; the lightbox metadata panel intentionally scrolls independently.

Files in `src/features/admin/components/family-tree/`: `LibraryTab.tsx`, `LibraryUploadModal.tsx`, `LibraryAlbumModal.tsx`, `LibraryPhotoEditModal.tsx`, `PhotoLightboxModal.tsx`. Also `LibraryPage.tsx` and new `LibraryGallery.tsx` / `LibraryLightbox.tsx`.

## Shared presentation and preservation

New domain components live in `src/features/my-life/components/memories/`: `MemoryActions`, `MemorySkeleton`, `AnniversaryDateTile`, `LibraryGallery` (AlbumCard and PhotoCard), and `LibraryLightbox`. `Memories.css` defines the scoped teal/amber/plum treatments and responsive layouts.

Existing Button, IconButton, Input, Select, DateInput, Textarea, Badge, Chip, Modal, ConfirmDialog, Skeleton, EmptyState and ErrorState are reused. The App Shell and its navigation colors are unchanged. New strings are registered in `src/shared/locales/{vi,en}/memories.json` through the existing i18n configuration.

**31 preservation comparisons passed** against text snapshots taken before W6. They include the entire Timeline, Anniversary and Library service modules, existing load/save/delete handlers, Timeline grouping/filtering, Anniversary date/filter/navigation helpers used in the page, modal submit validation and upload validation. The audit records are linked below.

- No endpoint, DTO property, auth/role guard, date-conversion service or Backend code changed.
- UI state additions are contextual menus, Timeline confirmation, lightbox navigation, drop selection and focus behavior.
- Existing business handlers and validation remain unchanged.
- Backend, Mobile and Expo projects were not edited. Public Landing, App Shell navigation, Map, Profile/Admin and video assets were not redesigned.

## Validation

| Check | Result |
| --- | --- |
| `npm.cmd run build` | Pass, including TypeScript (`tsc -b`) |
| `npm.cmd run lint` | Pass: 0 errors, 1 existing TimelineEventModal dependency warning |
| Targeted Anniversary, Library, Timeline, Family renderer and viewport-fit tests | 62 passed |
| Preservation audit | 31 passed, 0 differences |
| Responsive visual matrix | 80 Memories checks + 3 Family view checks passed |
| Viewports | 1366×768, 1440×900, 1920×1080, 820×1180 and 390×844, light and dark |
| Layout assertions | No page/main/dialog horizontal overflow, no extra body scrollbar, one active primary navigation item |
| Timeline browser smoke | Load, filters, year navigation/focus, derived restrictions, approximate manual creation, related member/location, edit and delete passed |
| Calendar browser smoke | Markers/counts, search/type filters, Today, month navigation/picker, date selection, keyboard movement, death anniversary with conversion/recurrence, family-event creation/edit/delete and organization fields passed |
| Library browser smoke | Album selection/create/edit/delete, normal multi-file selection, drag/drop replacement, preview restoration, multipart upload, lightbox focus/Left/Right/Escape, original URL, metadata edit and photo deletion passed |
| Family regression browser suite | Tree/Card/Table, search/generation, pan/zoom/Fit, branch controls, fullscreen, PNG, profile/relationship and fixture CRUD/avatar checks passed |
| Loading/error/empty/retry | Checked separately for all three Memories modules |
| VI / EN | New copy resolves in both languages; English layout matrix and Vietnamese page captures passed |

Browser tests intercepted every `/api/` request. The Memories runner recorded **13 synthetic mutation requests**; no real records or stored photographs were changed. Sample photographs in QA are existing landing assets returned only by the test fixture. Production UI has no seeded sample albums or events. Live storage, Backend constraints and real lunar conversion accuracy were not retested against production services; their code/contracts were preserved and requests were exercised with fixtures.

Tests updated for the redesigned UI: `tests/anniversary.test.cjs`, `library-ui.test.cjs`, `family-v2.test.cjs`. New reusable tests: `tests/tree-viewport-fit.test.cjs`, `tests/memories-w6.browser.cjs`. Unrelated legacy suites were not claimed as a full-project pass.

## Review artifacts

- [Preservation audit](review-w6/preservation-audit.json), [visual matrix](review-w6/visual-results.json), [Memories interaction requests/results](review-w6/results.json), [Family regression results](review-w6/family-regression-results.json)
- [Timeline — desktop light](review-w6/light-1440-timeline.png), [desktop dark](review-w6/dark-1440-timeline.png), [mobile](review-w6/dark-390-timeline.png), [form](review-w6/light-1440-timeline-form.png)
- [Calendar — desktop](review-w6/light-1440-anniversaries.png), [mobile](review-w6/light-390-anniversaries.png), [form](review-w6/light-1440-anniversary-form.png), [lunar workflow](review-w6/lunar-workflow.png)
- [Library — desktop](review-w6/light-1440-library.png), [mobile](review-w6/dark-390-library.png), [selected album](review-w6/light-1440-selected-album.png), [upload](review-w6/light-1440-upload-form.png)
- [Lightbox — desktop dark](review-w6/dark-1440-lightbox.png), [mobile](review-w6/light-390-lightbox.png)
- [Family initial tree](review-w6/family-patch-Tree.png), [Cards](review-w6/family-patch-Cards.png), [List](review-w6/family-patch-List.png)
- [Vietnamese Timeline](review-w6/vi-timeline.png), [Calendar](review-w6/vi-anniversaries.png), [Library](review-w6/vi-library.png)

All other widths/themes and loading/error/empty screenshots are in `docs/review-w6/`.

## Reproduce locally

```powershell
$env:VITE_FAMILY_TREE_RENDERER='family-view'
npm.cmd run dev -- --host 127.0.0.1 --port 7002
# In another terminal:
node tests/memories-w6.browser.cjs
```

The browser runner uses the existing local Puppeteer installation in `scratch_puppeteer` and Edge. `W6_INTERACTIONS_ONLY=1` skips the visual matrix; `W6_VISUAL_ONLY=1` skips mutations; `W6_VISUAL_WIDTH=390` limits captures to mobile. `MYLIFE_UI_URL` overrides the preview URL. Fixtures are confined to that isolated browser session.

## Known issues / review notes

- Tall modest trees now open at a readable scale and may require vertical panning. The explicit Fit action and export still show the full bounds. Large forests and small mobile canvases keep conservative fitting.
- The existing lint warning remains at `TimelineEventModal.tsx:43` for effect dependencies. The existing large map-bundle warning remains; Map is outside W6.
- Audit snapshots and one-shot editing helpers remain in `scratch/w6-*` as review evidence. Reusable QA entry points are under `tests/`.
- The temporary W6 preview server is stopped after QA. No publication was performed.

Stopped after W6 for visual approval.
