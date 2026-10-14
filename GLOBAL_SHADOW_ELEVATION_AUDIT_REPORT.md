# Global shadow and elevation audit

Date: 2026-10-14  
Branch: `feature_minhduc`

## Scope and method

Searched `src/` for Tailwind shadow utilities, `box-shadow`, `filter`/`drop-shadow`, pseudo-elements, overflow clipping, rounded borders, backdrop filters, gradients, and layered surfaces. Reviewed the MyLife workspace header, root glass utility, FamilyTree workspace, shared Modal and Select, and module navigation/card surfaces. The Leaflet map tiles and third-party map rendering were left untouched.

The available computer-use surface reported no apps or browsers. Therefore the `/mylife` corner artifact could not be reproduced in a browser or inspected with DevTools. The source shows the MyLife header combines a translucent fill (`bg-secondary-bg/90`), `backdrop-blur-md`, a border, and `shadow-sm`; its immediate wrapper has no overflow clipping. This combination is the strongest source-level candidate for an edge seam, but it is not a verified rendered root cause. No exact computed-style claim is made.

## Findings and changes

| Surface | Source finding | Change |
| --- | --- | --- |
| MyLife workspace header | Rounded, translucent blurred surface with an extra shadow; wrapper does not clip it | Use an opaque theme surface and subtle border only, removing the blur and shadow layer |
| `.glass-pill` utility | Fixed white/dark translucent fills and heavy dark-mode shadow; can be stacked with element-level elevation | Use theme-aware fill/border and a theme-aware soft shadow |
| FamilyTree main panel | `.glass-pill` shadow was combined with `shadow-xl` on the same rounded panel | Remove the duplicate `shadow-xl`; retain the utility's soft elevation |
| Shared Modal | `shadow-2xl` on a bordered, rounded dialog can dominate the edge | Reduce to `shadow-xl`; preserve the dialog backdrop and surface |
| Shared Select popup | Standard appearance used `shadow-xl`; simple appearance used a separate dark shadow | Use `shadow-lg` for standard appearance and a softer custom shadow for simple appearance |
| MyLife module navigation/cards, DatePicker, map overlays, notification/menu popovers, avatars, FAB | Existing shadows are mostly modest, separated by purpose, or belong to third-party/map/media rendering | Audited; left unchanged without visual evidence of clipping or a doubled shadow |

The focus cue change from the earlier UI task remains intact. The hub source assertion now verifies the shared inner focus cue instead of the former outline utility. The Select source assertion now follows the revised soft shadow.

## QA

- `npm.cmd run test:select` — passed (5)
- `npm.cmd run test:date-input` — passed (7)
- `npm.cmd run test:family-relation-select` — passed (4)
- `npm.cmd run test:member-card-flip` — passed (5)
- `npm.cmd run test:member-form-layout` — passed (3)
- `npm.cmd run test:library` — passed (5)
- `npm.cmd run test:library-ui` — passed (14)
- `npm.cmd run test:anniversary` — passed (5)
- `npm.cmd run test:family-map` — passed (5)
- `npm.cmd run test:my-life-hub` — passed (11)
- `npm.cmd run test:my-life-workspace` — passed (8)
- `npm.cmd run test:theme-switch` — passed (5)
- `npm.cmd run test:i18n` — passed (15)
- `npm.cmd run test:roles` — passed (5)
- `npm.cmd run test:optimization` — passed (8)
- `npm.cmd run build` — passed
- `npm.cmd run lint` — passed
- `git diff --check` — passed (only line-ending notices for existing working-tree files)

Browser screenshot/computed-style QA across light/dark, responsive widths, and zoom could not be performed because no browser was available in the computer-use environment. Thus the Header corner fix is source-based and still needs visual confirmation in a browser.

## Git

Commit: `ad97a06` (`style: refine shadows and remove dark edge artifacts`).  
Push: not pushed. The prior push attempt to `origin/feature_minhduc` was rejected by automatic approval review because it would export private Frontend source to an unverified GitHub remote; that rejection remains in effect, so this commit was not sent to the remote.

The working tree already contained unrelated modified files and deleted reports before this audit. They were preserved and not staged wholesale; the repository is consequently not clean.
