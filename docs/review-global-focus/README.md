# Global input and search focus cleanup

Implemented in `Frontend-MyLife` on `feature_minhduc`. Existing unrelated edits were preserved. No commit or push was made.

## Root causes

1. The global fallback in `src/index.css` applies an inset shadow to unmarked focused controls. The map search's internal native input was unmarked, so it received that rectangular shadow inside an already rounded, independently focused wrapper.
2. App Shell's broad `:focus-visible` selector added a second native-input outline. The map input's local base `outline: 0` selector did not reliably win that cascade.
3. Memories adds its own module focus outline, overlapping shared form controls. Shared fields had used `!important` outline/shadow resets to resist these broad rules.
4. Portalled custom listboxes and option rows could also receive the generic fallback shadow rather than their own popup/active-option treatment.
5. The standalone theme-preview native select did not have a reliable visible keyboard cue in Dark mode when relying only on a border-color change.

No third-party search-input stylesheet was identified as the cause. Current Radix selectors use the project's own trigger, popup and option classes. Member relation/action pickers are local components. AddressInput is a shared free-form Input; it has no third-party autocomplete textbox.

## Canonical focus ownership

`FloatingField` now marks its wrapper with `data-field-shell`. Map search uses the same ownership marker and marks its internal input with `data-ui-control`.

The shared form CSS gives marked shells the existing sage border and 2 px soft focus ring for `:focus-within` or an expanded control. Direct owned controls are borderless, with no outline or shadow. These resets are scoped to a marked containing shell and use no `!important`.

Global, App Shell and Memories fallback focus selectors exclude owned controls. The former global `[data-ui-control]:focus-visible { outline: none }` reset was removed; the reset now requires an actual containing field shell. Standalone native text inputs/selects/textareas retain an explicit keyboard outline. Checkbox/radio/file controls retain their existing treatment. No blanket outline suppression was added.

Error fields keep their error border while focused or expanded, with feedback and validation unchanged. Disabled fields cannot acquire the shell focus ring. Existing 170 ms transitions and reduced-motion behavior are preserved. Forced-colors mode has an outer-shell outline fallback. Clear/password action buttons retain their own keyboard indicator without an extra inherited inset shadow.

Map search keeps its dimensions, rounded shape, value, placeholder, query handler and accessible label. The search icon is prevented from shrinking. VietMap integration, coordinates, markers, overlays and API contracts were not changed.

Relationship Explorer's redundant local focus/`!important` resets were removed. It now inherits the shared treatment while retaining its existing floating-label, selection, deselection, result invalidation and request behavior.

During keyboard verification, Escape from the local member pickers also reached the surrounding modal. The handled Escape event now stops propagation in `FamilyMemberPicker` and `FamilyRelationSelect`, so the popup closes, focus returns to its trigger, and the member form remains open. Selection and Tab behavior are unchanged.

## Files changed

| File | Change |
| --- | --- |
| `src/shared/components/ui/FloatingField.tsx` | Explicit focus-owner marker |
| `src/design-system/forms.css` | Shared shell focus, scoped inner reset, error/disabled/reduced-motion/forced-colors treatment |
| `src/index.css` | Exclude owned fields/popups/options from generic fallback; preserve standalone native keyboard focus |
| `src/shared/layouts/app-shell/AppShell.css` | Exclude owned controls from the broad App Shell outline |
| `src/features/my-life/components/memories/Memories.css` | Exclude owned controls from module outlines |
| `src/features/admin/components/family-tree/FamilyMapTab.tsx` | Focus ownership attributes on search wrapper/input only |
| `src/features/admin/components/family-tree/FamilyMapTab.css` | Remove duplicate local focus/reset; preserve icon width |
| `src/features/admin/components/family-tree/FamilyExperience.css` | Remove redundant Relationship Explorer focus overrides |
| `src/features/admin/components/family-tree/FamilyMemberPicker.tsx` | Scope handled Escape to the popup |
| `src/features/admin/components/family-tree/FamilyRelationSelect.tsx` | Scope handled Escape to the popup |
| `tests/global-field-focus.browser.cjs` | Real-route browser regression suite with isolated synthetic API data |
| `docs/review-global-focus/` | Report, initial/focused screenshots and `results.json` |

Input, SearchInput, SearchBar, PasswordInput, AddressInput, DateInput, Textarea and shared Select inherit this fix through FloatingField; their business behavior was not rewritten.

## Audit coverage

The source audit covered raw native inputs/textareas and shared Input/SearchBar/SearchInput/combobox wrappers, generic focus rules, module CSS and third-party wrappers.

| Area | Representative browser check |
| --- | --- |
| Family Tree / Cards / Table | Shared keyword search in all three views; text filtering and Tab focus |
| Member creation/edit controls | Name, address, father, mother, spouse, children and sibling pickers |
| Relationship Explorer | Empty/focused field, search, selection, calculation and deselection clearing the path |
| Family Map | Name/address search, typed filtering and restoring results |
| Anniversary | Upcoming-event keyword search |
| Timeline | Event dialog title input; there is no current keyword search textbox |
| Library | Album filter and create-album name field; there is no current keyword search textbox |
| Profile | Editable display-name field in the account dialog |
| Admin | Administration keyword search |
| Shared gallery / ordinary controls | Filled error input, disabled input, password input and standalone native select |
| Other audited source paths | Login/Register/Contact shared fields, date inputs and calendar dropdowns, upload/file fields, standalone checkboxes and the theme switch |

Existing member parent/spouse/children/sibling controls are list selectors rather than separate searchable textboxes. Their popup, checkmark/action behavior, arrow/Enter navigation and keyboard focus were verified. No new search feature was added to those controls. Vietnamese accent-insensitive Relationship Explorer filtering remains in its existing component.

## Validation

- **Build:** `npm.cmd run build` passed. Its `tsc -b` step passed; there is no separate typecheck script.
- **Lint:** `npm.cmd run lint` passed with zero errors. The existing `TimelineEventModal.tsx:44` missing hook dependency warning remains.
- **Focused unit tests:** 24 form/date/member-picker/relation/map tests and 2 relationship tests passed (26 total).
- **Broader initial test run:** 31 of 33 passed. Two existing working-tree expectation mismatches remain unchanged:
  - `tests/address-input.test.cjs` expects OpenStreetMap tile text, while the existing implementation already uses VietMap.
  - `tests/shared-select.test.cjs` expects a native select in AppearanceControls, while the existing component already uses the preference popovers.
- **Browser:** `node tests/global-field-focus.browser.cjs` passed **120 field cases**, plus disabled/error/standalone checks, on actual app routes with synthetic API responses.
- **Matrix:** Light and Dark at 1440×900, 820×1180 and 390×844.
- **Computed styles:** owned inputs/triggers have zero border width, no outline and no box shadow; the containing rounded shell has a visible non-inset focus ring. Focused/resting field dimensions match, and inputs remain within their shell widths.
- **Keyboard:** actual Tab focus, popup arrows/Enter, Escape dismissal/focus return and standalone select focus passed. Error borders and accessible error messages remain visible. Disabled fields remain disabled and have no focus ring.
- **Functionality:** typed query values, family view filtering, map search empty/restored results, member selection and Relationship Explorer result/path invalidation passed. No API writes or browser page exceptions were observed.
- **Visual review:** inspected map search, member popups, Memories dialog fields and error fields in Light/Dark; no nested rectangular input focus frame remained.
- **Diff whitespace check:** passed for changed tracked source files.

The existing Vite map-chunk size warning remains. No unrelated warnings or test assertions were changed to silence them.

## Screenshots

- Map search: [Light](light-1440-map-search-focus.png), [Dark](dark-1440-map-search-focus.png).
- Member popup: [Light](light-1440-member-father-focus.png), [Dark](dark-1440-member-father-focus.png).
- Relationship Explorer: [Light](light-1440-relationship-search-focus.png), [Dark mobile](dark-390-relationship-search-focus.png).
- Timeline dialog: [Dark](dark-1440-timeline-dialog-title-focus.png).
- Error/disabled controls: [Dark](dark-1440-error-field-focus.png).
- Machine-readable measurements: [results.json](results.json).

Each representative field also has a matching `*-rest.png` screenshot in this directory.

## Remaining limits

Browser verification used synthetic data and responsive device emulation, not live records or physical mobile hardware. VietMap provider requests were intentionally blocked in this UI suite; the map-provider error message visible in map screenshots is expected, and live tile networking was not tested. Map search itself was exercised on the real route. Buttons inside fields retain a separate action focus cue where needed; that cue is distinct from the removed native text-input rectangle. The two stale unit assertions and existing lint/build warnings above remain.
