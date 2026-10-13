# Family Member Flip Timing Verification

## Changes

- Previous flip transition: 360ms with `cubic-bezier(0.2, 0.75, 0.25, 1)`.
- New flip transition: 700ms with `cubic-bezier(0.22, 0.61, 0.36, 1)`.
- Previous glow transition: 250ms; new glow transition: 450ms.
- Mouse hover now waits 200ms before previewing. Leaving waits 100ms before reversing.
- Enter and leave timers cancel each other and repeated timers; an effect clears both timers when the card unmounts.
- Quick preview still flips immediately on click or keyboard activation. The mouse-only delay is guarded by `pointerType === "mouse"`; touch and pen do not trigger hover preview.
- “Lật lại” clears hover preview and pending timers, so the card returns to its front while the pointer remains over it without starting another timer.
- Reduced-motion CSS remains in place and reduces flip/glow transitions to 0.01ms. Card entrance animation, menu animation, accessibility attributes, focus handling, and View/Edit/Delete actions remain unchanged.

## Verification

Passed:

- `npm.cmd run test:member-card-flip`
- `npm.cmd run test:member-avatar`
- `npm.cmd run test:member-detail-layout`
- `npm.cmd run test:mindmap`
- `npm.cmd run test:family-relation-select`
- `npm.cmd run test:my-life-workspace`
- `npm.cmd run test:optimization`
- `npm.cmd run build`
- `npm.cmd run lint`
- `git diff --check`
- `git diff --cached --check`

Manual browser checks on `/familytree` were unavailable in this environment: the browser/app inventory returned no available apps or browsers. Consequently the brief-hover, stable-hover, rapid traversal, mobile, and reduced-motion visual cases were not manually exercised here.

## Scope and delivery

Files changed for the interaction:

- `src/features/admin/components/family-tree/MemberCard.tsx`
- `src/features/admin/components/family-tree/MemberCard.css`
- `tests/member-card-flip.test.cjs`

This task made no changes to the Backend, database, or Mobile repository.

- Implementation commit: `314ed7b3fdf553523f539fef9964470ef918dfce` (`style: slow family member flip interaction`)
- Push: successful to `origin/feature_minhduc`.
