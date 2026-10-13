# Shared Select repo-wide migration report

## Summary

- Frontend branch: `feature_minhduc`.
- Shared implementation: `src/shared/components/ui/Select.tsx` using `@radix-ui/react-select`.
- Native single-value `<select>` / `<option>` usage remaining in `src`: **0 / 0**.
- Native `<input type="file">` remains in Library upload for file selection; it is not a value Select.
- Backend, database, Mobile, Google autocomplete, and Finance: unchanged by this task.
- No commit or push.

## Previous architecture and library choice

The old shared Select styled a container around a transparent native `<select>`, while the browser/OS drew the popup. That left popup colors, selected state, spacing, radius, and dark mode outside the design system's control. Radix was selected for accessible single-value listbox behavior, keyboard navigation, controlled state, and popup positioning. The implementation follows the shadcn composition pattern (Root, Trigger, Value, Icon, Portal, Content, Viewport, Item, ItemText, ItemIndicator, scroll buttons) using MyLife design tokens.

## Dependency and API

- Added `@radix-ui/react-select` (`^2.4.1`) to `package.json` and lockfile. No other Select library was added.
- `Select` wraps controlled/uncontrolled Radix Root and accepts `value`, `defaultValue`, `onValueChange`, `disabled`, `required`, `name`, `aria-label`, `label`, `placeholder`, `error`, `helperText`, `options`, class hooks, and `variant="default" | "compact"`.
- `SelectItem` supplies MyLife item styling, disabled/highlight states, and selected Check icon.
- Option values are strings; numeric domain values are converted at call-sites. Empty string maps to no selection and uses Radix's placeholder (Radix items cannot have an empty value).
- Default trigger min-height is 56px; compact is 32px. Popup uses a Portal, collision-aware popper placement, viewport-height limits, scrolling, and z-index 100.
- Labels sit above the trigger. Long values truncate. Helper/error text is linked through `aria-describedby`; errors set `aria-invalid`.
- Old API: `onChange(event)` with native `<option>`. New API: `onValueChange(value)` with `<SelectItem>` children or `options`.

## Inventory before migration

| File | Component / purpose | Previous implementation | Migrate | Reason / outcome |
|---|---|---|---|---|
| `src/shared/components/ui/Select.tsx` | Shared single-value Select | Styled transparent native select | Yes | Replaced with Radix. |
| `src/features/admin/components/FamilyTreeManager.tsx` | Generation filter | Shared native Select | Yes | Single-value filter. |
| `src/features/admin/components/family-tree/MemberFormModal.tsx` | Generation, gender, father, mother, spouse | Shared native Select | Yes | Single-value form fields. |
| same | Add child / cousin / sibling | Shared native Select | Yes | Each interaction selects one value; existing selected chips remain multi-select UI. |
| `src/features/admin/pages/AdminDashboard.tsx` | User role change | Shared native Select | Yes | Single-value role. |
| `src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx` | Event type and related member | Shared native Select | Yes | Single-value form fields. |
| `src/features/admin/components/family-tree/LibraryTab.tsx` | Album filter | Shared native Select | Yes | Single-value filter. |
| `src/features/admin/components/family-tree/LibraryPhotoFormFields.tsx` | Photo category | Shared native Select | Yes | Single-value category; unknown legacy value remains visible and disabled. |
| `src/features/admin/components/family-tree/LibraryUploadModal.tsx` | Upload album | Shared native Select | Yes | Single-value album. |
| `src/features/admin/components/family-tree/MemberMindmapNode.tsx` | Member actions | Custom action menu | No | Actions, not value selection. |
| `src/features/admin/components/family-tree/MemberTable.tsx` | Member actions | Custom action menu | No | Actions, not value selection. |
| `src/features/auth/components/UserMenu.tsx` | Account/navigation actions | Custom action menu | No | Actions, not value selection. |
| `src/shared/components/LanguageSwitcher.tsx` | Language switcher | Custom button/menu | No | Existing menu interaction preserved; not implemented as a Select/listbox. |
| `src/shared/components/SearchBar.tsx` | Search query | Text input | No | Search is not a Select. |
| Google address autocomplete | Address suggestions | No Select use found in source audit | No | Combobox is outside scope; unchanged. |
| `src/features/admin/components/family-tree/MemberFormModal.tsx` | Selected children/siblings chips | Custom multi-selection chips | No (chips) | Existing multi-selection state/UI preserved; one-at-a-time add controls migrated. |
| Library upload `input[type=file]` | File selection | Native file picker | No | File picker, not a value dropdown. |

## Migrated files / dropdowns

- `FamilyTreeManager.tsx`: generation.
- `MemberFormModal.tsx`: generation, gender, father, mother, spouse, add child, add cousin/sibling.
- `AdminDashboard.tsx`: user role.
- `FamilyAnniversaryModal.tsx`: event type, related member.
- `LibraryTab.tsx`: album filter.
- `LibraryPhotoFormFields.tsx`: photo category.
- `LibraryUploadModal.tsx`: target album.
- `Modal.tsx`: focus management recognizes Radix combobox triggers.

## Design, accessibility, themes, and behavior

- Trigger uses MyLife `primary-bg`, `primary-text`, `secondary-text`, `custom-border`, `accent`, and `error` tokens for Light/Dark themes.
- Popup is portaled to `document.body`, collision-aware, viewport bounded, scrollable, and placed above modal content.
- Items have highlighted, disabled, and selected states; selected state uses Check.
- Radix supplies keyboard operation (Tab, Enter/Space, arrows, Escape) and listbox semantics.
- VI/EN option labels continue to use existing translations. Call-sites with specific placeholder copy pass localized strings.
- SearchBar, action menus, LanguageSwitcher, file input, and DateInput remain outside Select migration.

## Static audit and test results

- Before migration: semantic Selects appeared in Admin, FamilyTree, Anniversary, and Library (the pre-change audit found 16 JSX Select/option call-sites plus the shared native implementation).
- After migration: `rg -n '<select|<option' src` returns zero.
- After migration: Select-related `onChange(target.value)` handlers are gone. Remaining matches belong to text inputs, SearchBar, textarea, and file input.
- ChevronDown outside the shared Select is used by accordion arrows, LanguageSwitcher, and account/action menus; no duplicate semantic value Select remains.
- `npm run build`: passed.
- `npm run lint`: passed.
- `npm run test:i18n`: passed.
- `npm run test:optimization`: passed.
- `npm run test:roles`: passed.
- `npm run test:member-avatar`: passed.
- `npm run test:anniversary`: passed; assertion updated from floating native-label internals to Radix placeholder semantics.
- `npm run test:library`: passed.
- `npm run test:library-ui`: passed; assertion updated to inspect `SelectItem` and `onValueChange`.
- `npm run test:family-map`: passed.
- `npm run test:mindmap`: passed.
- `git diff --check`: passed with only Git line-ending normalization warnings.
- Manual browser verification (375px viewport, themes, keyboard, live FamilyTree/member/anniversary/admin forms) was not performed in this terminal session.

## Scope and working tree

- Backend changes: NO. Database changes: NO. Mobile changes: NO.
- Google autocomplete changed: NO. Finance changed: NO.
- Commit: NO. Push: NO.
- Existing uncommitted FamilyTree table/mindmap work, locale/test changes, and other files were present before this migration and were preserved. The combined working tree includes those pre-existing changes.
