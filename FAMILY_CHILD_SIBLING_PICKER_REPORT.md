# Family child and sibling picker report

## Behavior and implementation

- The old child control was a value Select used as an add action, with `value={undefined}`. Radix retained transient selection/display behavior, which could leave its trigger blank or showing the last picked member after child add/remove.
- Added `FamilyMemberPicker.tsx`, a reusable action picker for children and siblings. Its trigger is not bound to a member value; each activation calls `onSelect(id)`, closes, and keeps rendering the placeholder. The portal popup has listbox semantics, active descendant, keyboard navigation (arrows, Home/End, Enter/Space, Escape), outside close, and viewport repositioning.
- Child picker now displays “Chọn con cái” / “Select children”. Existing child chips and count remain driven by `childIds`; add appends an ID, remove filters it out. Existing candidate filters still exclude self, parents, spouse, and selected children, so removing a child makes them available again. Empty options disable the trigger and show a translated explanation.
- Replaced the two form sections for full siblings and cousins with one “Anh / Chị / Em” / “Siblings” group and one “Chọn anh / chị / em” / “Select sibling” picker.
- Biological siblings are inferred from known shared `fatherId` or `motherId`. Explicit sibling IDs on the member being edited are combined with inferred siblings and deduplicated by member ID. Selecting an already biological sibling is blocked; a non-biological selection keeps the existing `{ memberId, relationType: "sibling" }` representation. Explicit cousins can be removed; inferred biological siblings have no remove control. Counts use the unique combined list.
- Labels and seniority reuse `getSiblingKind`, `getSiblingDisplayLabelKey`, and `getSiblingSeniority` from `siblingRelations.ts`. Unknown DOB remains neutral; DOB/gender only determine older/younger wording. Detail UI and those helpers were left intact.
- Old `+ Add child from list...` and `+ Add cousin...` locale keys were removed after their form use was replaced. New picker labels and empty messages are localized in VI/EN. Styling uses MyLife theme tokens, responsive form grid behavior, truncation, portal collision handling, and light/dark theme variables.

## Files changed for this task

- Added `src/features/admin/components/family-tree/FamilyMemberPicker.tsx`
- Updated `src/features/admin/components/family-tree/MemberFormModal.tsx`
- Updated `src/shared/locales/vi/admin.json` and `src/shared/locales/en/admin.json`
- Added `tests/family-member-picker.test.cjs`; updated `tests/scroll-sibling.test.cjs` and `tests/feature-i18n.test.cjs`
- Added `test:family-member-picker` to `package.json`

## Verification

- Passed: `test:select`, `test:family-relation-select`, `test:family-member-picker`, `test:i18n`, `test:optimization`, `test:roles`, `test:anniversary`, `test:library`, `test:library-ui`, `test:mindmap`, and `node --test tests/scroll-sibling.test.cjs`.
- `npm run build`: passed.
- `npm run lint`: passed without warnings.
- `git diff --check`: passed (Git emitted line-ending normalization notices).
- Static searches found no old add-child/cousin prompt keys/usages, no separate sibling groups in `MemberFormModal`, and no native `<select>` / `<option>` in application source.
- Interactive desktop/tablet/375px and light/dark browser QA was not completed because Edge computer-use authorization was denied earlier. Responsive, portal, and theme behavior were checked from implementation and automated source tests.

## Scope

- Father/mother/spouse `FamilyRelationSelect`, shared generic Select, Generation/Gender controls, detail sibling classification, and mindmap graph logic remain unchanged.
- Backend, database, and mobile projects were not edited. No commit or push was made.
