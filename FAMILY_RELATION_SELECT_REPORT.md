# Family Relation Select report

## Changes

- The previous father, mother, and spouse controls used the shared Select and placed a “Không chọn…” / “No …” sentinel at the top of each menu. Clearing required choosing that extra row.
- Added one domain component, `FamilyRelationSelect`, in `src/features/admin/components/family-tree/FamilyRelationSelect.tsx`. It uses an accessible listbox popup rendered with a React portal. No dependency was added.
- The shared Radix Select remains unchanged. Its standard `onValueChange` does not reliably signal choosing the already selected value; toggle-off therefore belongs in this family-specific component.
- Father, mother, and spouse each pass numeric IDs and their existing candidate lists. Clicking a different option replaces the value; clicking the checked option returns `undefined`. The component displays the selected member or its translated placeholder and shows a check mark for the current option. It has no clear button or empty option.
- Existing edit values are supplied directly to each control. New member state remains empty as before. Self-exclusion, gender candidate filters, form update callbacks, payload shape, spouse handling, and existing validation paths remain in place.
- The listbox supports Tab focus, Enter/Space activation, Up/Down and Home/End navigation, Escape close with focus return, selected state semantics, portal rendering, scroll/resize repositioning, and viewport collision placement. Existing grid layout keeps father/mother in two columns on desktop and stacks all three on narrow screens.
- Styling uses MyLife theme tokens for light and dark modes. Placeholder, labels, and generation suffix are localized in Vietnamese and English. Anniversary and child/sibling/cousin selectors remain generic.

## Files changed for this task

- Added `src/features/admin/components/family-tree/FamilyRelationSelect.tsx`
- Updated `src/features/admin/components/family-tree/MemberFormModal.tsx`
- Updated `src/shared/locales/vi/admin.json` and `src/shared/locales/en/admin.json` to remove obsolete empty-relation labels and add the generation suffix label.
- Updated `tests/shared-select.test.cjs`, `tests/feature-i18n.test.cjs`, and added `tests/family-relation-select.test.cjs`.
- Added `test:family-relation-select` to `package.json`.

## Verification

- `test:select`, `test:family-relation-select`, `test:i18n`, `test:optimization`, `test:roles`, `test:anniversary`, `test:library`, `test:library-ui`, and `test:mindmap`: passed.
- `npm run build`: passed.
- `npm run lint`: passed without warnings.
- `git diff --check`: passed (Git printed line-ending normalization notices for existing modified files).
- Browser visual/manual QA was not completed because the earlier Edge computer-use authorization was denied. Light/dark styling and responsive behavior were reviewed from the implementation, not interactively verified.

## Scope

- Backend, database, and mobile projects were not edited for this task.
- No commit or push was made.
