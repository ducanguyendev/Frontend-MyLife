# Family Member Back Action Menu Verification

## Behavior

- Previously, the three-dot action menu was always visible, including on the front face and throughout the rotation.
- It is now available only after the back-face transform finishes, then fades in over 200ms. It stays outside the 3D scene, in its existing top-right position, so the menu and dropdown do not rotate.
- The inner card listens for `transitionend` and accepts only its own `transform` event. The resulting `isBackSettled` state records that the back rotation completed. No duplicate 700ms timer was added, so the menu timing follows the actual CSS transition and the reduced-motion duration.
- When reverse rotation begins, settled state clears immediately and the menu becomes hidden and non-interactive. The menu uses `visibility`, `pointer-events`, `inert`, `aria-hidden`, and a disabled button while hidden, so it cannot receive clicks or keyboard focus.
- Opening the dropdown includes `isDropdownOpen` in preview visibility, which holds the card on its back. Pointer enter/leave handling is on the outer card, so moving from the card into its menu does not count as leaving the card. If a hover-only preview loses its pointer while the dropdown is open, closing the dropdown lets it return to the front. A manually flipped card stays on the back.
- Existing View, Edit, Delete callbacks and dropdown close handling are unchanged. “Xem nhanh” remains immediate; “Lật lại” hides the menu and returns to the front.
- Touch does not rely on hover: tapping “Xem nhanh” flips immediately, and the menu becomes available after the rotation completes. Hidden menu controls are removed from keyboard navigation; existing focus handling and face accessibility attributes remain intact.
- Reduced-motion CSS now also reduces the menu fade/scale transition to 0.01ms. The 700ms flip, 200ms hover-enter delay, 100ms hover-leave delay, and 450ms glow remain unchanged for standard motion.

## Verification

Passed:

- `npm.cmd run test:member-card-flip`
- `npm.cmd run test:member-avatar`
- `npm.cmd run test:optimization`
- `npm.cmd run test:mindmap`
- `npm.cmd run build`
- `npm.cmd run lint`
- `git diff --check`
- `git diff --cached --check`

Manual browser QA was unavailable in this environment because no browser/app surfaces were available. The visual timing, dropdown pointer traversal, and touch behavior were not manually exercised here.

## Scope and delivery

Files changed for this task:

- `src/features/admin/components/family-tree/MemberCard.tsx`
- `src/features/admin/components/family-tree/MemberCard.css`
- `tests/member-card-flip.test.cjs`
- `FAMILY_MEMBER_BACK_ACTION_MENU_REPORT.md`

No API, Backend, database, or Mobile files were changed.

- Implementation commit: `daffa8e940944d0edd5f13e3a0d37d839b0eef53` (`style: reveal member actions after card flip`)
- Push: successful to `origin/feature_minhduc`.
