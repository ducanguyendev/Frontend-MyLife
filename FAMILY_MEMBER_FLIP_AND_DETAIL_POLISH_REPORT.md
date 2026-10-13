# Family Member Flip Card and Detail Polish Report

## 1. Previous MemberCard

The grid card was a single clickable card showing avatar, generation, gender, role, date, address, and phone together. Its dropdown offered View, Edit, and Delete. Clicking the card opened the existing detail modal.

## 2. New grid flip preview

Only the FamilyTree grid continues to render `MemberCard`; its new two-sided preview uses a namespaced `family-flip-card` CSS system.

- Front: avatar, full name, generation, gender, role, and a Quick Preview control.
- Back: actual birth date, linked spouse name when available, count of linked children, shortened address, Flip Back, and View Profile.
- Desktop pointer hover previews the back. Quick Preview also flips with a button, so use does not rely on hover.
- Touch uses React state through the Quick Preview button; the back has an explicit Flip Back action. View Profile invokes the existing `onView(member)` callback.
- Menu controls remain outside the 3D scene and retain View, Edit, and Delete actions.
- Focusable buttons, visible focus rings, accessible labels, reduced-motion styling, and generation colors from the existing helper are retained. The card uses theme tokens and contains no repeated decorative IDs or generic global selectors.
- Table and Mindmap rendering were not changed.

## 3. Member detail dialog

The shared detail modal now uses the member's name as its heading and accessible dialog label. The generic profile title and large footer are removed. A compact header places an approximately 72–80px avatar, generation/gender/role, available date and address, Edit, and Close together.

The responsive content places family relationships beside biography and contact on wide screens, and stacks those sections on narrow screens. Parents, spouse, children, biological siblings, and cousins remain clickable relation controls. The existing sibling classification helpers are still used. Biography, phone, Facebook, and address are shown compactly; absent values use localized short copy. The existing modal scroll container remains available for long family lists or biography text.

## 4. Localization and visual modes

New profile and preview labels were added in Vietnamese and English. Card and dialog colors use the existing theme tokens, and generation accents come from `getGenerationColors`. The card animation duration is reduced for users who request reduced motion.

## 5. Files added

- `src/features/admin/components/family-tree/MemberCard.css`
- `tests/member-card-flip.test.cjs`
- `tests/member-detail-layout.test.cjs`

## 6. Files modified

- `src/features/admin/components/family-tree/MemberCard.tsx`
- `src/features/admin/components/family-tree/MemberDetailModal.tsx`
- `src/features/admin/components/FamilyTreeManager.tsx` (passes the existing member collection for linked spouse/child summaries)
- `src/shared/locales/vi/admin.json`
- `src/shared/locales/en/admin.json`
- `package.json` (adds two test scripts)

## 7. Verification

Passed requested checks:

- `test:member-avatar` — 8 tests
- `test:family-relation-select` — 4 tests
- `test:family-member-picker` — 3 tests
- `test:mindmap` — 8 tests
- `test:select` — 4 tests
- `test:i18n` — 15 tests
- `test:optimization` — 8 tests
- `test:member-card-flip` — 5 tests
- `test:member-detail-layout` — 6 tests
- `npm run build` — passed (`tsc -b` and production Vite build)
- `npm run lint` — passed
- `git diff --check` — passed

Automated checks were run. Visual browser QA for hover, touch, menu stacking, and long-data modal cases could not be completed: Computer Use denied access to the existing Microsoft Edge window, and the in-app browser surface was unavailable.

## 8. Scope and delivery

Only frontend files in `Frontend-MyLife` were edited. Backend, database, migrations, and the separate mobile application were not changed. No commit was created and nothing was pushed.

