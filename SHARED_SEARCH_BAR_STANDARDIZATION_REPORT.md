# Shared SearchBar Standardization Report

## Result

- The existing FamilyTree member search supplied the visual reference.
- Added one controlled shared component at `src/shared/components/SearchBar.tsx`.
- Migrated FamilyTree, Anniversary, and the Admin Dashboard header search control.
- Library has album/category filters, but no keyword search field, so none was added.

## Component and visual contract

**Path:** `src/shared/components/SearchBar.tsx`

**API:** `value`, `onChange(value)`, `placeholder`, `disabled`, `className`, `ariaLabel`, `id`, `name`, and `autoFocus`. The input is controlled; the component only renders the icon/input and forwards the text. A parent controls width and placement.

The component keeps the FamilyTree reference classes: full width, `py-2` (16 px vertical padding), `text-sm` (20 px line height), 1 px border, `rounded-xl` (12 px radius), 12 px left inset, 16 px Search icon, and 8 px icon-to-text gap. With the standard 20 px line height, the resulting field height is 38 px. It uses semantic theme tokens for background, text, border, and icon color. Focus-visible uses a subtle accent border and ring without changing layout size. Disabled fields use disabled cursor/opacity behavior.

## Search-field inventory

| Location | Existing implementation | Result |
|---|---|---|
| `src/features/admin/components/FamilyTreeManager.tsx` — FamilyTree members | Search icon and native text input; controlled by `searchQuery`; parent width `w-full lg:w-80` | Migrated. `filterFamilyMembers` and its matching fields are unchanged. The same height, radius, background, border, icon placement, typography, and spacing are retained. Keyboard focus now has a visible subtle ring. |
| `src/features/admin/components/family-tree/AnniversaryTab.tsx` — Anniversary | Shared `Input` with compact density and Search icon; controlled by `search` | Migrated. Parent retains responsive full-width/flex/max-width rules. Existing normalized keyword filtering across title, related member, place, host, and notes is unchanged. Vietnamese and English placeholders remain in `admin.json`. |
| `src/features/admin/pages/AdminDashboard.tsx` — Admin header | Search icon plus decorative text input; had no filtering/search handler | Migrated. Kept its hidden-on-small-screen and 48-width layout. Added controlled local text state so it can use the shared controlled component; it remains without filtering, matching its previous behavior. Placeholder/accessible label use `common.search` translations. |
| `src/features/admin/components/family-tree/LibraryTab.tsx` — Library | Album and category `Select` controls; no keyword input/icon/query filter | Not migrated; there is no Library keyword-search field to reuse. Album/category filter behavior is unchanged. |
| Portfolio project screens | A project screenshot alt text mentions a “Catalog search screen”; it is not a live search control | Not migrated; this is illustrative content, not a MyLife keyword field. |
| `src/features/admin/components/family-tree/memberSearch.ts` | Keyword normalization/filter function used by FamilyTree | Not a UI field; retained unchanged and remains owned by FamilyTree. |
| Query strings and `URLSearchParams` in auth/API code | OAuth callback parsing and API request parameter construction | Not UI search fields; left unchanged. |
| Other inputs/selects/placeholders | Form fields, date inputs, modal selectors, and ordinary data-entry controls | Not migrated; they do not search/filter lists by keyword. |

The source audit searched for Search/SearchIcon, `type="search"`, search/query/keyword names, and placeholder text across frontend TypeScript/JavaScript. It found no additional live keyword search bars. No search bar existed in Library or other portfolio/list screens in the audited frontend source.

## Requirements checklist

1. **Source of truth:** FamilyTree member search.
2. **Shared component:** `src/shared/components/SearchBar.tsx`.
3. **API:** Controlled text value and callback, optional visual/accessibility props.
4. **Dimensions/style:** FamilyTree sizing and rounded surface retained; field height is 38 px with current Tailwind defaults.
5. **Files added:** shared component, `tests/search-bar.test.cjs`, this report.
6. **Files modified for this task:** FamilyTree manager, Anniversary tab, Admin Dashboard, anniversary regression test.
7. **Inventory:** Listed above, including matching source-only items.
8. **Migrated:** FamilyTree, Anniversary, Admin Dashboard search UI.
9. **Not migrated:** Library (no keyword search); screenshot alt text, query-string code, filter helper, forms/selects (not UI search fields).
10. **FamilyTree behavior:** member matching and generation filtering unchanged; width remains parent-controlled.
11. **Anniversary:** shared component; filtering and CRUD unchanged.
12. **Library:** no search field exists; category/album filters unchanged.
13. **Other modules:** Admin Dashboard header migrated; no other live search bars found.
14. **Theme:** semantic theme classes support light and dark tokens.
15. **Responsive:** parent layout classes remain responsible for width and visibility.
16. **Accessibility:** native input, caller-provided `ariaLabel` (falls back to placeholder), decorative icon hidden from assistive technology, visible keyboard focus.
17. **i18n:** module placeholders continue using existing Vietnamese/English translations; no localized text is embedded in the shared component.
18. **Tests:** shared-component source regressions plus Anniversary and Library UI regression tests pass (20 total).
19. **Build:** `npm run build` passed.
20. **Lint:** `npm run lint` passed.
21. **Diff check:** `git diff --check` passed (Git printed only line-ending normalization notices).
22. **Backend changes for this task:** none. The backend repository already had pending unrelated Anniversary/map changes before this task.
23. **Database changes for this task:** none.
24. **Map logic:** unchanged by this task.
25. **Anniversary business logic:** unchanged; only search control UI was migrated.
26. **Library business logic:** unchanged.
27. **Google Address Autocomplete:** not implemented.
28. **Git status:** branch `feature_minhduc`; frontend working tree contains this work plus pre-existing Anniversary/map changes listed below.
29. **Commit:** none.
30. **Push:** none.
31. **Mobile changes:** none.

## Verification

- `npm run build` — passed.
- `npm run lint` — passed.
- `node --test tests/search-bar.test.cjs tests/anniversary.test.cjs tests/library-ui.test.cjs` — 20 passed, 0 failed.
- `git diff --check` — passed.

## Working-tree notes

Existing frontend changes at the start of this task included dependency files and Anniversary/map files. They were preserved. The current frontend working tree also contains those pre-existing changes; this task did not commit or push them. The backend repository contains pending unrelated Anniversary/map changes and was not edited for this task. Mobile was not edited.
