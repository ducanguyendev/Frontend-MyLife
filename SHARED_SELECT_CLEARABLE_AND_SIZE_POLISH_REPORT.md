# Shared Select clearable and size polish report

## Behavior changes

1. **Previous generation UX:** create member initialized `generation: 1`, so “Đời 1” appeared selected without user input.
2. **New UX:** create member initializes `generation: undefined`; Select shows the localized “Chọn thế hệ” / “Select generation” placeholder. Existing member generation is passed through, so edit forms prepopulate the saved generation.
3. Generation options continue to come from the existing API-loaded generation list (with its existing fallback list). Labels are localized as “Đời N (Thế hệ thứ N)” / “Generation N (Generation No. N)”; no three-generation cap was added.
4. Selecting an option stores a number in form state. Form validation requires a positive integer and displays “Vui lòng chọn thế hệ.” / “Please select a generation.” before submit. The API handler also refuses invalid generation state and sends the selected number without `NaN`, `0`, `null`, or `undefined`.

## Shared Select API and clear strategy

- Added `clearable`, `onClear`, and `clearLabel` to the shared Radix Select.
- `clearable` shows an accessible X button when a value exists. It is a real button, prevents pointer focus loss and click propagation, and does not open the popup. Clear uses the empty Select state and calls `onClear`.
- Clicking an already selected Radix item does not cleanly clear selection; no internal Radix behavior was changed. The trigger clear button is the explicit alternative.
- Placeholder accepts `undefined`, `null`, or empty string state; no sentinel value is used.
- Default trigger stays 56px minimum height. Compact trigger is now 40px (`h-10`) to align with SearchBar/filter toolbar controls.
- Shared trigger owns its padding, typography, radius, caret placement, focus ring, and placeholder/selected colors. FamilyTree, Admin, and Library compact call-sites no longer force small height overrides.
- Portal, collision handling, scroll buttons, keyboard behavior, selected check, and disabled items remain.

## Clear behavior by use case

- Generation: clearable despite required-on-submit; clearing restores placeholder and validation catches submit.
- Father, mother, spouse: clearable; state becomes `undefined`, and each field returns to its localized placeholder.
- FamilyTree generation filter: defaults to `all` (“Tất cả các đời”). Clear button appears only after a specific generation is chosen and resets back to `all`.
- Anniversary related member: clearable because it is optional.
- Gender, event type, Library album/category, and Admin role are not clearable by default.

## Files changed for this task

- `src/shared/components/ui/Select.tsx`
- `src/features/admin/components/FamilyTreeManager.tsx`
- `src/features/admin/components/family-tree/MemberFormModal.tsx`
- `src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx`
- `src/features/admin/pages/AdminDashboard.tsx`
- `src/features/admin/components/family-tree/LibraryTab.tsx`
- `src/shared/locales/vi/admin.json`, `src/shared/locales/en/admin.json`
- `src/shared/locales/vi/common.json`, `src/shared/locales/en/common.json`
- `tests/shared-select.test.cjs`, `tests/feature-i18n.test.cjs`, `package.json`
- Added npm script `test:select`.

## Verification

- `npm run test:select`: passed (4 focused contract/static audit tests).
- `npm run test:i18n`: passed.
- `npm run test:optimization`: passed.
- `npm run test:roles`: passed.
- `npm run test:anniversary`: passed.
- `npm run test:library`: passed.
- `npm run test:library-ui`: passed.
- `npm run test:mindmap`: passed.
- `npm run build`: passed.
- `npm run lint`: passed.
- `rg -n '<select|<option' src`: zero matches.
- `git diff --check`: passed (only Git line-ending normalization warnings).
- Interactive browser QA for live add/edit flows, themes, and 375px viewport was not performed in this terminal session.

## Scope

- Backend: unchanged.
- Database: unchanged.
- Mobile: unchanged.
- Finance: unchanged.
- Google autocomplete: unchanged.
- Commit: no. Push: no.
- Existing unrelated working tree changes were preserved.
