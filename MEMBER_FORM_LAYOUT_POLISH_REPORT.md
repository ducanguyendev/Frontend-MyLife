# Member form layout polish report

## UI changes

- The previous form displayed a large create/edit title in the shared modal header and placed Avatar/Biography after Basic, Relations, and Contact.
- `Modal` now supports `showTitle` (default `true`) and `ariaLabel`. Only `MemberFormModal` opts out of the visible title; it supplies a localized accessible dialog name. Other modal consumers keep their current title behavior.
- With the title hidden, the shared modal renders a compact right-aligned header containing its existing keyboard-accessible X button and translated `aria-label`. Body padding, max height, scroll behavior, and footer remain in place.
- Accordion order is now Avatar/Biography, Basic, Family Relations & Children, Contact & Address. Avatar/Biography opens by default. Validation still opens `basic` for name/role/generation/DOB errors and `contact` for phone/Facebook errors. Invalid avatar file feedback opens `bio` so the error is visible.
- The avatar preview/upload/remove and biography controls were moved without changing their data handling. Create/edit form state and Cancel/Create/Save footer actions remain as before.
- Sibling chips now show only the member name and generation badge, with an X only for explicit cousin relations. Inferred biological siblings remain non-removable. Sibling relationship classification helpers are unchanged and remain used by MemberDetailModal; detail labels still show brother/sister/cousin wording.

## Files changed for this task

- Updated `src/shared/components/ui/Modal.tsx`
- Updated `src/features/admin/components/family-tree/MemberFormModal.tsx`
- Added `tests/member-form-layout.test.cjs`; existing FamilyTree, picker, and i18n tests remain in place.
- Added `test:member-form-layout` to `package.json`.

## Verification

- `test:member-form-layout`, `test:family-member-picker`, `test:family-relation-select`, `test:select`, and `test:i18n`: passed.
- Build and lint were rerun successfully after the layout edits. The remaining required suite (`test:optimization`, `test:roles`, `test:anniversary`, `test:library`, `test:library-ui`, `test:mindmap`) was run in the same task and passed.
- `git diff --check`: passed.
- The layout follows responsive modal sizing and theme tokens; interactive 375px, light/dark browser QA was not completed because Edge computer-use authorization was denied earlier.

## Scope

- Shared Modal behavior remains titled by default. FamilyRelationSelect, child picker, Generation/Gender, sibling classification logic, detail labels, footer behavior, and mindmap graph logic remain intact.
- Backend, database, and mobile projects were not changed. No commit or push was made.
