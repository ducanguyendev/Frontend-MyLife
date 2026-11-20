# W6.1 — Vietnamese typography and unified forms

Completed on `feature_minhduc`, within Frontend-MyLife only. W7 was not started.

## Typography diagnosis — corrected editorial-preserving implementation

The approved Georgia/editorial identity is restored. Family, Memories, and Landing styles match the pre-W6.1 snapshots exactly (apart from line endings/trailing whitespace). Font families, heading sizes, weights, line heights, and spacing are retained. The earlier broad sans migration and added Noto Serif landing override were removed.

The installed Georgia 5.59 files lack 88 Vietnamese precomposed letters. Chromium decomposes some unsupported letters and uses a different font for their marks, producing the apparent extra spacing. NFC alone and kerning/feature changes do not fix that missing glyph coverage.

A composite Georgia face retains the installed regular/bold/italic/bold-italic glyphs. Only the 88 unsupported letters use the self-hosted, Georgia-metric-compatible Gelasio serif. Georgia's supported Ỳ/ỳ remain native too. Display-only NFC normalization ensures complete Vietnamese letters are selected, without changing input state, backend objects, or payloads. The original Inter primary UI family remains in place for contexts that already used it.

See the [editorial correction report](ui-redesign-w61-editorial-correction.md) for the full audit, precise glyph ranges, primary sources, browser evidence, and verification. The earlier sans/Noto screenshots are historical diagnostics, not the final implementation.

## Shared form system

`FloatingField` extracts the approved Member form's rounded 58px shell, label inset, warm border, sage focus, error/disabled states, and 170ms transition. Empty unfocused labels sit in the field; focus, open menus, values, and errors float them. Leading icons offset both label and value. Textareas adapt the same pattern. Compact controls retain a 42px shell.

`FormSectionHeader` reuses the Member icon/title/divider and optional collapse affordance. The Member section state and validation-driven expansion remain intact. Timeline, Anniversary, Album, and Photo groups reuse this header without adding nested cards.

| Controls/forms | Migration |
| --- | --- |
| Input, PasswordInput, Textarea | Shared floating frame; feedback, refs, native events, required/error semantics retained |
| Select | Same frame/menu; Radix portal, keyboard and value behavior retained |
| DateInput | Same frame and menu surface; label stays floated while calendar is open; parser/date rules retained |
| Relation and member pickers | Same frame/menu/chevron; avatars and names; portal positioning and keyboard behavior retained |
| Member | Canonical geometry retained; shared section headers; name/avatar chips |
| Timeline | Dynamic floating labels replace permanently floated fields; shared section headers |
| Anniversary | Shared fields/sections including member and lunar/solar date controls |
| Album and photo metadata | Shared Input/Textarea/Select/DateInput; obsolete Library field geometry removed |
| Profile and Security | Inherit shared fields, including leading-icon password fields and read-only account name |
| Admin | Existing role/filter controls remain compact |
| Appearance/language preferences | Modal fields use shared Select; toolbar utilities retain compact native controls |

## Relationship display and preservation

Options, selected relation values, children chips, and sibling chips display avatars/initials and member names, without generation suffixes or badges. Removal permissions and toggle-to-clear behavior are unchanged. Portal Tab navigation returns to the next or previous control.

Generation fields, data, numeric IDs, filtering, sorting, relation calculations, validation, and save handlers remain present. **55 source preservation checks pass**, covering API/service/DTO modules, Member relation filters and handlers, date handlers, Timeline/Anniversary/Library save logic, and Profile/Security handlers. See [preservation audit](review-w61/preservation-audit.json).

No backend, API, DTO, authentication, role, lunar-calculation, or storage behavior was changed. Browser writes were intercepted by local fixtures; no real account or family data was written.

## Verification

- `npm.cmd run build`: passes, including `tsc -b`. There is no separate typecheck script.
- `npm.cmd run lint`: zero errors; one existing Timeline effect dependency warning (`form.title`, `update`).
- 90 targeted Node tests pass: shared fields, date parsing/calendar, relation/member pickers, Member layout, timeline/profile/relationship, anniversaries, Library, tree layout and fit.
- Shared controls: 10 light/dark viewport combinations. Empty, focused, filled, error, disabled and read-only states; password visibility; arrows/Enter/Escape/Tab; relation IDs and clearing; calendar opening/dismissal; portal bounds. No browser exceptions or horizontal overflow.
- Real feature layouts: 80 Memories checks, 54 Family checks, 20 Profile/Security checks. All five sizes in both themes: 1366×768, 1440×900, 1920×1080, 820×1180, 390×844. No measured page/main/dialog horizontal overflow.
- Existing Family and Memories interaction suites pass: Member CRUD/avatar/relations/generation filtering, manual timeline create/edit and approximate/exact date paths, lunar/solar anniversaries, Album CRUD and photo metadata/upload/lightbox flows.
- Final typography correction: 20 Edge/Chrome light/dark viewport combinations verify native Georgia metrics, all four named examples, normal/italic 400/500/600/700 matching, NFC/NFD display inputs, and exact per-glyph fallback. Real-page editorial checks and raw-data preservation evidence are documented in the [correction report](ui-redesign-w61-editorial-correction.md). Shared control evidence remains in [field results](review-w61/controls-results.json).

Screenshots and machine-readable results are in `docs/review-w61`. Browser runners are `tests/*-w61.browser.cjs`; field fixtures and preservation tooling are in `scratch/w61-*`. These use the existing local Puppeteer installation and Edge. Use production preview for feature suites to avoid development-only tree POCs; the controls fixture uses the temporary Vite config in `scratch/w61-vite.config.ts`.

## Known issues and limits

No new functional or layout failures were found. Existing build warning: the Map chunk exceeds 500kB. Existing lint warning: Timeline effect dependencies. Gelasio normal/italic files are about 169kB/174kB; the obsolete Noto Serif assets have been removed. Verification used local API fixtures rather than live backend writes.
