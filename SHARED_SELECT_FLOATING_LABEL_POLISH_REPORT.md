# Shared Select floating label polish report

## UX changes

- Before this task, generation and gender used a Select label above the control. Generation displayed a separate “Chọn thế hệ” placeholder, and Gender was forced to “Nam” on create.
- Generation and Gender now use the shared `floatingLabel` mode. Empty and unfocused shows the label centered inside the 56px field; focus/open floats the label to the top; a selected value stays below it. The placement, 11px floating font, left padding, border, radius, background, and focus ring follow the shared Input treatment.
- Generation create state remains `undefined`; existing generation values remain selected on edit. All API-loaded generations are rendered. Selection remains numeric, validation shows localized required error, and the save handler refuses invalid/non-positive generation values.
- Gender create state is now undefined. The form had no gender required validation and the FamilyMember type marks it optional, so no artificial required rule was added. Existing gender values still prepopulate on edit.
- The Generation label translation no longer includes `*`; required Select renders a single star. Gender is not required.

## Shared Select API

- Added `floatingLabel?: boolean` for form-style Select controls.
- Removed `clearable`, `onClear`, and `clearLabel` from the shared API and all source usages. There is no X clear button in the trigger.
- Normal/static and compact modes remain for filters and toolbars. Default/form Select stays at a 56px minimum; compact stays 40px.
- Radix Root, Trigger, Portal, collision-aware Content, Viewport, item Check, scroll controls, keyboard behavior, and disabled state remain in place.

## Reset behavior

- FamilyTree filter keeps its default value `all` and reset option “Tất cả các đời”; selecting it restores all generations. No clear button remains.
- Father, mother, and spouse menus now have localized “Không chọn…” / “No …” items. They map to `undefined` in form state; the internal menu sentinel never enters the domain or request payload. Initial empty values continue to show “Chọn cha/mẹ/vợ-chồng”.
- Anniversary related-member menu now includes its existing localized “Không liên kết thành viên” / “No linked member” option. Choosing it resets the form state to empty. No clear button remains.
- Required Generation has no clear button and must be selected before submit.

## Files changed

- `src/shared/components/ui/Select.tsx`
- `src/features/admin/components/FamilyTreeManager.tsx`
- `src/features/admin/components/family-tree/MemberFormModal.tsx`
- `src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx`
- `src/shared/locales/vi/admin.json`, `src/shared/locales/en/admin.json`
- `tests/shared-select.test.cjs`, `tests/anniversary.test.cjs`

## Verification

- `npm run test:select`: passed.
- `npm run test:i18n`: passed.
- `npm run test:optimization`: passed.
- `npm run test:roles`: passed.
- `npm run test:anniversary`: passed.
- `npm run test:library`: passed.
- `npm run test:library-ui`: passed.
- `npm run test:mindmap`: passed.
- `npm run build`: passed.
- `npm run lint`: passed.
- `rg -n 'clearable|onClear|clearLabel' src`: zero results.
- `rg -n '<select|<option' src`: zero results.
- `git diff --check`: passed; Git may report line-ending normalization warnings.
- Browser interaction QA for focus/escape, VI/EN theme presentation, and 375px viewport was not performed. The local dev server started, but Computer Use access to the existing Microsoft Edge window was denied by the tool's approval gate, so I stopped browser QA and shut down the dev server.

## Scope

- Backend unchanged; Database unchanged; Mobile unchanged.
- Finance unchanged; Google Address Autocomplete unchanged; Family Map and Nominatim unchanged.
- No commit and no push.
- Pre-existing uncommitted FamilyTree and other working-tree changes were preserved.
