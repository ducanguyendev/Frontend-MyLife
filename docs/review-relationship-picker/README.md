# Relationship picker interaction patch

Branch: `feature_minhduc`.

## Files

- Updated `src/features/admin/components/family-tree/RelationshipExplorer.tsx`.
- Updated only the relationship popup rule in `src/features/admin/components/family-tree/FamilyExperience.css`.
- Added `tests/relationship-picker.browser.cjs` and this review directory's screenshots/results.

## Behavior

The target field now uses the canonical `FloatingField` without `alwaysFloating`. Its explicit float condition is `pickerFocused || pickerOpen || toId !== null`. Empty and unfocused, it displays just the centered question and has no search placeholder. Focus/open uses the existing 170 ms Member Form transition and shows the search placeholder. The shared reduced-motion rules disable this transition.

The fixed reference field stays read-only. Both fields retain the same shared shell geometry and padding system. Focus uses the existing sage border/ring, and the input has no separate border or shadow.

Selection is a numeric member ID or `null`, independent of the search query and displayed name. Choosing a different ID selects it and closes the list. Choosing the already selected ID sets it to `null`, resets the query, removes the checkmark, and keeps the dropdown/input open and focused. A selected value remains floated after blur; an empty blurred field returns to the centered label. Escape closes the list while retaining input focus; blur then restores the empty resting appearance. The selected ID is preserved while typing a search query until an explicit selection or deselection.

Every selection change aborts the active relationship request and clears loading, error, result and path. Result assignment also requires the current AbortController identity, so a superseded response cannot restore stale data. A reference-profile ID change clears target/query/result state. The existing keyed profile component also remounts the explorer when navigating to another profile. Relationship API calls retain `fromMemberId = current profile` and `toMemberId = selected numeric target`.

The list is portalled to `document.body` and positioned against the field. It opens above or below according to available space, updates on resize/scroll, and uses the existing popup tokens at z-index 1000. Outside click, blur, Tab, Escape, arrow navigation, Enter selection/toggling and active-option scrolling remain supported. Vietnamese matching now also normalizes `đ`/`Đ` to `d`. All eligible members from the full member API remain available across generations; the current reference member is excluded. Names have no appended generation suffix.

## Verification

- `npm.cmd run build`: passed, including TypeScript. Existing Vite warning about the large map chunk remains.
- `npm.cmd run lint`: zero errors; existing `TimelineEventModal.tsx:44` hook dependency warning remains.
- `npm.cmd run test:relationship`: 2 tests passed.
- `node tests/relationship-picker.browser.cjs`: passed using headless Edge on the actual member profile route, with isolated synthetic API responses.
- Six combinations: Light/Dark at 1440×900, 820×1180 and 390×844. Light exercised normal motion; Dark exercised reduced motion.
- Verified initial/focused/selected/deselected labels and placeholder, equal field dimensions, no nested input border, popup positioning, all-generation options, current-member exclusion, accent-insensitive search and duplicate-name identity.
- Verified result/path invalidation, mouse/touch/keyboard deselection, native touch scrolling, keyboard scrolling to options beyond the initial popup area, selection after reopening, Escape/outside click/Tab, and blur behavior.
- Verified delayed response after deselection cannot restore a result and route navigation updates the reference while clearing target/result.
- No browser page errors, API writes or horizontal page overflow.

Browser fixtures contain two members with exactly the same displayed name but different IDs/generations. Relationship requests independently confirmed selection of ID 2 and ID 3.

## Review artifacts

- [Light initial](light-1440-initial.png) / [focused](light-1440-focused.png).
- [Dark initial](dark-1440-initial.png) / [selected](dark-1440-selected.png).
- [Mobile initial](dark-390-initial.png) / [deselected with list open](dark-390-deselected.png).
- [Machine-readable results](results.json).

## Limits

Browser verification used synthetic records and device emulation rather than live family data or physical mobile hardware. Long resting labels retain the canonical field's ellipsis when available width is narrow; their full text remains the input's accessible label.

No Map, Family Tree canvas, Backend or unrelated component changes were made in this patch. Existing workspace changes were preserved. No commit or push was made.
