# Native Select final fix report

## Why the Portal approach was removed

The React Portal and fixed-position menu passed component tests, but the reported real-browser FamilyTree Gender popup remained invisible. The implementation was replaced with the browser's native `<select>` popup so the browser and operating system own option display, scrolling and touch interaction.

## Select architecture before and after

Before, a visually custom trigger opened a custom listbox through a Portal. The native select was `sr-only`, `aria-hidden` and removed from keyboard navigation. After, a full-size, transparent native `<select>` overlays the rounded field. It receives pointer, keyboard, touch, focus, form and change interactions. The visual label/value/chevron layer is pointer-transparent and displays the current label.

Portal imports, popup DOM, listbox/options roles, manual positioning state, scroll/resize listeners, auto-flip logic, click-outside handling and popup animation are removed from shared Select.

## Compatibility and styling

The component keeps `value`, `defaultValue`, `onChange`, `disabled`, `required`, `name`, `id`, forwarded `ref`, `options`, `<option>` children, `includeEmptyOption`, `placeholder`, `label`, `error`, `helperText`, `className` and `containerClassName`. Controlled values remain caller-owned; uncontrolled values update the visual label when native `onChange` fires. The native control is not hidden from assistive technology or removed from tab order.

Rounded `rounded-2xl` shell, floating label, chevron, error state, and focus ring are retained. Focus is reflected on the shell from native focus/blur events, and no rectangular native outline is visible. FamilyTree Gender keeps Nam, Nữ and Khác; generation, father, mother, spouse, child and sibling selectors remain in the member form and use the shared component where applicable. Native picker behavior is expected on mobile; this still needs a direct browser/device check.

## Validation

- `npm run build`: PASS
- `npm run lint`: PASS
- `npm run test:i18n`: PASS (11)
- `npm run test:library`: PASS (4)
- `npm run test:library-ui`: PASS (11)
- `npm run test:roles`: PASS (5)
- `npm run test:avatar`: PASS (12)
- `npm run test:optimization`: PASS (8)
- `node --test tests/select-native.test.cjs`: PASS (6), covering native interactive structure, ref/label/disabled/required, controlled/uncontrolled/default value and change path, options/children/placeholder, focus/error styling, no Portal popup, and FamilyTree selector wiring.
- `node --test tests/scroll-sibling.test.cjs`: PASS (5)
- `git diff --check`: PASS

**MANUAL BROWSER VERIFICATION REQUIRED.** The requested real-browser FamilyTree checks (Generation, Gender Nam/Nữ/Khác, parents, spouse, children, sibling picker, modal scrolling, mobile and theme modes) have not been performed in this pass. Automated checks cannot confirm that OS/browser popups are visible and selectable in the actual modal. Please verify directly in the browser before treating the UI acceptance criteria as complete.

Backend modified? NO  
Mobile modified? NO  
Apps Script modified? NO  
Database modified? NO  
Commit/push/deploy? NO
