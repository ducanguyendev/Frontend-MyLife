# Form focus and custom cursor UI fix report

## Root cause

`src/index.css` applied a global rectangular `:focus-visible` outline to every native input, select, and textarea. Shared `Input` and `Textarea` already draw their focus state on rounded outer shells, so their inner native elements could show an extra outline. `DateInput` reuses `Input`; its visible DD/MM/YYYY input and visually hidden native date picker therefore follow the shared focus styling without changing date formatting or picker behavior.

## Files changed

- `src/index.css`: keep global keyboard focus for buttons, links, tabindex elements, and standalone form controls; exclude inner shared controls marked `data-ui-control`.
- `src/shared/components/ui/Input.tsx`, `Textarea.tsx`, `Select.tsx`: mark native inner controls. Select's rounded shell is now the keyboard focus target and opens with Space, Enter, or ArrowDown; Escape closes the menu. Options expose listbox semantics and the existing error state remains on the shell.
- `src/App.tsx`: remove the custom cursor import and mount.
- `src/shared/components/CustomCursor.tsx`: delete the unused component.
- `tests/optimization.test.cjs`: replace the old mount test with a native cursor assertion.
- `tests/library-ui.browser.cjs`: remove obsolete custom-cursor browser assertion.
- `tests/library-ui.test.cjs`: update stale test wording; LibrarySelectField is a wrapper around shared Select, not a literal `<select>` tree node.

## Focus behavior before and after

Before, focused native inputs could receive the global rectangular outline in addition to the rounded shell border/ring. Now shared controls use their outer rounded shell for visible focus; inner native controls do not receive the duplicate global outline. Error borders/rings are retained. Standalone controls still get the global focus-visible outline. DateInput still displays DD/MM/YYYY and retains its hidden date picker and calendar button.

## Custom cursor removal

Removed the CustomCursor mount from App and deleted its component. No custom cursor is rendered; the browser/OS cursor is used.

## Accessibility

Keyboard-visible focus remains globally enabled for buttons, links, standalone form controls, and focusable elements. Shared controls have visible focus on their shells. Select's shell supports keyboard opening and exposes combobox/listbox/option semantics.

## Validation

- `npm run build`: PASS
- `npm run lint`: PASS
- `npm run test:i18n`: PASS (11)
- `npm run test:library`: PASS (4)
- `npm run test:library-ui`: PASS (11)
- `npm run test:roles`: PASS (5)
- `npm run test:avatar`: PASS (12)
- `npm run test:optimization`: PASS (8)
- `git diff --check`: PASS

Backend modified? NO  
Mobile modified? NO  
Apps Script modified? NO  
Commit/push? NO