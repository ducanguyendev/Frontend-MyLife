# Global Focus Visual Audit Report

## 1. Root cause

The global keyboard rule used `--color-accent` with a 2px outline and 3px offset. Light Mode defines the accent as `#18181b`, so the global rule drew a dark outer frame. Shared field shells and several local controls also added accent `ring-2` shadows, while React Day Picker used outlines on its dropdowns and buttons.

## 2. Global focus rule before

```css
:where(button, a, [tabindex]):not([data-ui-control]):focus-visible,
:where(input, select, textarea):not([data-ui-control]):focus-visible {
  outline: 2px solid var(--color-accent, #0f62fe);
  outline-offset: 3px;
}
```

## 3. Global focus rule after

Focus colors are semantic tokens, independent from the intentionally dark Light Mode accent. Border controls get one neutral border cue; borderless controls get a 1px inset cue. Links get an underline. `[data-ui-control]` inputs keep their focus cue on the field shell.

## 4. Files audited

Audited focus and ring patterns across all `src/`, including:

- `src/index.css`
- `src/shared/components/ui/{Input,Textarea,Select,DateInput,Button,PasswordInput,Badge}.tsx`
- `src/shared/components/{SearchBar,LanguageSwitcher,ThemeSwitch.css}`
- `src/shared/layouts/{Header,UserWorkspaceHeader}.tsx`
- `src/features/admin/components/family-tree/{AnniversaryTab,FamilyMemberPicker,FamilyRelationSelect,LibraryPhotoFormFields,LibraryTab,MemberCard,MemberDetailModal,MemberMindmapNode,MemberTable}.tsx` and `LibraryTab.css`
- `src/features/admin/pages/AdminDashboard.tsx`
- `src/features/auth/components/{LoginModal,UserMenu}.tsx`
- `src/features/my-life/components/MyLifeModuleCard.tsx` and `MyLifeModuleNav.css`

## 5. Focus and ring categories found

Found global outline/offset rules; Tailwind `focus:ring-*`, `focus-visible:ring-*`, `ring-offset-*`, and `focus-visible:outline-*`; local CSS focus outlines in ThemeSwitch and MyLife module navigation; field shell rings; DatePicker month/year and navigation/day rings; and the Anniversary calendar's today ring. Also reviewed selected/highlighted Radix items, generic `outline-none`, popup `ring-0`, borders, and shadows.

## 6. Input

Removed the accent outer ring from the floating field shell. Focus now uses `--focus-border` and `--focus-surface`; validation errors retain their error border.

## 7. Button

Shared Button has no local focus ring. Its variants inherit the global neutral focus cue, preserving existing fills and active colors.

## 8. Select

Removed the trigger's accent ring and open-state ring. Trigger focus uses a single neutral border. Radix item selection/highlight remains a soft background and check mark, without a selected border.

## 9. FamilyRelationSelect

Removed its `focus:ring-2` and switched its trigger to the neutral focus border. Relationship state and selection logic were not changed.

## 10. DatePicker

Removed external focus outlines from the calendar button, month navigation, day buttons, Today, and Clear. The portal and calendar behavior remain in place in the working tree.

## 11. React Day Picker month/year controls

Month and year dropdowns use the existing neutral single border on focus. The selected day stays filled; today uses text emphasis and a soft surface instead of an outer ring.

## 12. Header module navigation

The active module appearance is unchanged. Keyboard focus uses a neutral border/underline cue rather than a dark outer outline.

## 13. Library

Album controls, photo cards, upload/edit fields, and lightbox buttons were audited. Focus utilities were removed from the working tree; generic controls use the global neutral cue. Album-only behavior remains untouched by this focus pass.

## 14. Anniversary

Calendar navigation, day cells, clear actions, search, and modal controls were audited. Focus rings were removed; today keeps emphasis without a black outer circle.

## 15. FamilyTree

Member relation/generation/gender controls, member cards, table rows, mindmap nodes, detail controls, and modal buttons were audited. Focus rings were removed without changing relationship logic.

## 16. Map

Map toolbar and panel focusables inherit the global cue. Existing decorative map rings are not focus styles and remain unchanged.

## 17. Auth

Login, register, password visibility, account menu, and checkbox focus were reviewed. Password eye and other icon controls retain keyboard focus indication through the shared cue.

## 18. Profile

Profile/menu controls use the global cue; regular avatar, border, and elevation shadows are not focus rings.

## 19. Portfolio

Portfolio route controls use the same global behavior. No feature-specific focus outline or ring was found in its source.

## 20. Keyboard accessibility

No blanket `*:focus { outline: none !important; }` rule was added. Keyboard focus stays visible through a neutral border, inset highlight, shell border/surface, or link underline. Radix highlighted items keep their background cue.

## 21. Light Mode

`--focus-border: #a1a1aa`; `--focus-surface: rgba(113, 113, 122, 0.08)`. Focus no longer inherits the near-black accent.

## 22. Dark Mode

`--focus-border: #71717a`; `--focus-surface: rgba(161, 161, 170, 0.12)`. Focus stays visible against dark surfaces without a bright outer halo.

## 23. Remaining outlines/rings and justification

The audited source has no `focus:ring-*`, `focus-visible:ring-*`, `outline-offset`, `border-black`, `ring-black`, or 2px focus outline. Remaining `outline: none`/`outline-none` suppress native frames while a shell, global rule, or Radix highlight supplies the focus cue. Radix popup `ring-0` entries explicitly suppress decoration on the popup surface. `ring-*` map illustration classes are decorative artwork, not control focus. Normal shadows remain for component elevation.

## 24. Files changed for this pass

Changed global tokens/rule, shared Input/Textarea, DateInput, Select, FamilyRelationSelect, ThemeSwitch, MyLife module navigation, Header and shared controls, FamilyTree buttons/cards/table/mindmap, Library and Anniversary controls, Admin and Auth controls, plus focus and Select source tests. The full working-tree file list is available in `git status --short`.

The focus-style commit contains 20 files: the global tokens/rule, shared Input/Textarea, ThemeSwitch, module navigation, Header/shared controls, FamilyTree/ Admin/Auth focus treatments, and `tests/focus-visual.test.cjs`. Previously uncommitted feature changes in DateInput, Select, Library, Anniversary, and other files were left unstaged to avoid bundling their unrelated behavior changes into this focus commit. Their focus cleanup remains in the working tree.

## 25. Tests

Passed: `test:select` (5), `test:date-input` (7), `test:family-relation-select` (4), `test:member-form-layout` (3), `test:library` (5), `test:library-ui` (14), `test:anniversary` (5), `test:my-life-workspace` (8), `test:theme-switch` (5), `test:i18n` (15), `test:optimization` (8), `test:roles` (5), and the new focus visual test (4).

## 26. Build

`npm.cmd run build` passed.

## 27. Lint

`npm.cmd run lint` passed.

## 28. `git diff --check`

Passed. Git emitted only LF/CRLF normalization notices for working-tree files.

## 29. API unchanged

This focus pass did not change API contracts or request behavior.

## 30. Backend unchanged

No Backend files were touched.

## 31. Database unchanged

No schema or migration files were touched.

## 32. Mobile unchanged

No Mobile files were touched.

## 33. Commit SHA

`c9ba9b0` — `style: remove harsh focus rings across frontend` (branch `feature_minhduc`).

## 34. Push result

Push to `origin/feature_minhduc` was rejected by automatic approval review. The review classified the remote as unverified and the action as exporting private Frontend source. No push workaround was attempted. The commit and this report are local; remote publication needs approval for that destination.

## Manual visual checks

The browser surface is unavailable in this session, so keyboard Tab walkthroughs and visual checks at 1440px, 1024px, 768px, and 390px could not be performed. Automated tests, build, lint, and source audit passed. Please visually review Light/Dark Mode, calendar month/year controls, and responsive layouts in the running app.
