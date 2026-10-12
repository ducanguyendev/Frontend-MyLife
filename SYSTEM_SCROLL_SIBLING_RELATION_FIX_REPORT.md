# System scroll and sibling relation fix report

## Root cause: scroll regressions

Several overlays independently saved and restored `body`/`html` overflow. With overlapping dialogs, each cleanup could restore a stale value and unlock the page while another dialog remained open, or leave `overflow: hidden` after close/unmount. This existed in the shared `Modal`, the photo lightbox and the portfolio project detail overlay. Other custom dialog surfaces did not share a coordinated lock.

## Overflow audit and architecture

All direct body/html overflow writes are now centralized in `src/shared/utils/bodyScrollLock.ts`. The `useBodyScrollLock` hook acquires one reference-counted lock per open overlay. The first lock snapshots inline body/html overflow and body padding, locks scrolling and compensates for a disappearing scrollbar. Each cleanup releases only its own lock; the final release restores the original inline styles. Repeated cleanup is safe.

The shared `Modal`, photo lightbox, project detail modal, login, session-expired, profile, admin delete confirmation and notification alert dialog all use the shared hook. Route changes and unmounts release locks through effect cleanup.

The shared Modal retains its fixed header/footer and `flex-1 min-h-0 overflow-y-auto` body. Modal body and other scrollable dialog content use touch-friendly vertical scrolling and overscroll containment. No global wheel/touchmove prevention was added.

## Select portal and scrolling

`Select` portals its menu into `document.body`, positions it from the trigger rectangle, matches trigger width, flips upward when the lower viewport has less room, and updates on window resize or captured scroll. It closes when the trigger leaves the viewport. The menu keeps its own bounded vertical scroll and touch scrolling. Outside-click checks both trigger and menu refs; choosing a portal option remains an inside action. The Select does not acquire a body lock.

## Sibling logic before and after

Sibling rules were spread between the form and detail modal. The old detail logic treated a shared father OR mother as a full sibling and guessed roles with a Vietnamese-only inline check.

The new `siblingRelations.ts` helper centralizes classification and display seniority:

- Full sibling requires two present, valid parent IDs and equality for both father and mother. Two missing IDs never count as equal parents.
- Cousin-like family sibling requires an explicit `sibling` horizontal relation (in either direction). Different parents alone never create a cousin.
- Explicit relation types are matched with trim/lowercase; save payloads canonicalize `sibling`.
- DOB determines older/younger only when dates are valid and differ by calendar day. Missing, invalid or same-day DOB remains neutral. Gender determines brother/sister only for recognized male/female values; other values remain neutral.
- Legacy explicit links for full siblings render only in the full-sibling group, never again as cousins.

The form derives full siblings live from the current father/mother selections and displays them as read-only chips. Cousins remain explicit, selectable/removable links. Candidates exclude self, parents, spouse, full siblings and already selected cousins; the list uses the complete current user's `members` prop with no generation filter. New member initialization includes `horizontalRelations: []`. No schema or backend changes were needed.

## UI grouping and localization

Form and detail views now separate **Full siblings** from **Cousins**, show relationship labels derived from DOB/gender, and show localized empty states. Vietnamese and English keys cover group names, empty states, picker label, neutral labels and older/younger gendered labels.

## Tests and validation

- `npm run build`: PASS
- `npm run lint`: PASS
- `npm run test:i18n`: PASS (11)
- `npm run test:library`: PASS (4)
- `npm run test:library-ui`: PASS (11)
- `npm run test:roles`: PASS (5)
- `npm run test:avatar`: PASS (12)
- `npm run test:optimization`: PASS (8)
- `node --test tests/scroll-sibling.test.cjs`: PASS (5), covering reference-counted nested locks, exact style restoration, parent/DOB/gender classification, portal wiring/scroll lifecycle and form/detail grouping.
- `git diff --check`: PASS
- Manual browser checks across Home, FamilyTree and Admin, including mobile/light-dark modal sequences: NOT RUN. The available browser harness covers Library flows, not FamilyTree modal interactions.

Backend modified? NO  
Mobile modified? NO  
Apps Script modified? NO  
Database schema/migration? NO  
Commit/push? NO