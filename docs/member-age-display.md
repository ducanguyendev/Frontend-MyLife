# Member age and life-status presentation

Implemented in Frontend-MyLife on `feature_minhduc`. This patch stops at derived age presentation.

## Result

Living summaries show the current completed age with the existing Lucide Cake icon, for example `41 tuổi` / `41 years old`.

Deceased summaries use a small reusable SVG tombstone and respectful text: `Mất lúc 75 tuổi · nếu còn sống: 90 tuổi` / `Passed away at 75 · if living today: 90`. The full profile separates age at death and the current equivalent age into two lines. Icons use the existing neutral text token and are decorative (`aria-hidden`); the text provides the meaning.

| Surface | Change |
| --- | --- |
| Family Cards | Replace the plain living/deceased status line. Gender, birth/life range, role, generation badge, address, avatar and actions remain. Age text wraps naturally and stays within two lines in the reviewed layouts. |
| Quick Detail | Replace the status label with the same inline age display. Birth/death dates and other details remain. |
| Full Profile | Replace the plain status badge with richer age metadata. Generation/gender/role badges remain. |
| Table/List | Unchanged: there was no dedicated life-status column, so no age column was added. |
| Tree | Unchanged: nodes already use a compact birth/death life range, not a plain living/deceased status. No node size or full deceased sentence was added. |

Responsive QA found an outdated `.ds-button` selector on the mobile profile header. It now targets the shared button's actual `[data-ui-button]` attribute so the edit action wraps to its intended full-width row instead of squeezing the name and age metadata. This is the only change in `FamilyExperience.css`; font declarations and hierarchy are preserved.

## Calculation and fallbacks

`src/shared/utils/memberAge.ts` centralizes `calculateAgeAtDate`, `getCurrentAge`, `getAgeAtDeath`, and `getMemberAgeDisplay`.

- Ages are completed years, subtracting one when the month/day birthday has not occurred.
- API date-only strings and ISO date-times are parsed into literal year/month/day parts. A timezone suffix does not shift the represented birthday or death date.
- The default reference is the current **local** calendar date from `new Date()`. Ages recalculate on render/page load; no timer or persisted age is introduced.
- February 29 birthdays advance on March 1 in non-leap years, following the standard completed month/day comparison.
- Missing, malformed, impossible or future birth dates produce an unavailable age rather than a negative or invented value.
- Missing/invalid death dates, death before birth, and future death dates do not produce a displayed age at death. A valid birth date can still provide the current equivalent age.

| Available information | Display |
| --- | --- |
| Living, valid DOB | `41 tuổi` / `41 years old` |
| Living, unavailable DOB | `Chưa rõ tuổi` / `Age unknown` |
| Deceased, valid DOB and death date | Age at death plus current equivalent age |
| Deceased, valid DOB but unavailable death age | `Đã mất · nếu còn sống: 90 tuổi` / `Deceased · if living today: 90` |
| Deceased, unavailable DOB | `Đã mất` / `Deceased` |

## Files

Created:

- `src/shared/utils/memberAge.ts`
- `src/shared/components/MemberAgeStatus.tsx` — includes `MemberAgeStatus` and the reusable `TombstoneIcon`
- `src/shared/components/MemberAgeStatus.css`
- `tests/member-age.test.cjs`
- `tests/member-age-status.test.cjs`
- `tests/member-age.browser.cjs`
- This report; QA artifacts in `docs/review-member-age` and snapshot/audit tooling in `scratch/member-age-*`.

Changed:

- `src/features/admin/components/family-tree/MemberCard.tsx`
- `src/features/admin/components/family-tree/MemberDetailModal.tsx`
- `src/features/my-life/pages/FamilyMemberProfilePage.tsx`
- `src/features/admin/components/family-tree/FamilyExperience.css` — mobile button selector only
- `src/shared/locales/vi/family.json` and `src/shared/locales/en/family.json` — new `family.age` translations; existing translations retained, including singular English `1 year old`
- `tests/member-card-flip.test.cjs` — shared-display/normalization adapters and original-member boundary assertion
- `tests/member-life-status.test.cjs` — align a stale Anniversary test expectation with the existing `undefined` selection state; no Anniversary implementation changed

## Preserved behavior

**Member Form changed? No.** The source is unchanged. Its `LIVING`/`DECEASED` values, localized `Còn sống`/`Đã mất` choices, conditional death date, required validation, date picker and future-date rules remain intact.

**API/DTO/Backend changed? No.** Member types, save payload construction, services, relationship logic and backend files are unchanged. No `age`, `ageAtDeath`, `currentAge` or `currentEquivalentAge` is added to member records or API payloads. Calculated values exist only in the presentation result.

Approved typography and font files are unchanged. Card generation badges remain; relation-picker labels/chips still omit generation suffixes. The existing shared floating fields and dropdown interactions remain intact.

## Validation

- 72 focused and existing regression tests pass. The 11 new utility/presentation tests cover birthday yesterday/today/tomorrow, age at death before/on/after a birthday, leap years, missing/invalid dates, chronology, future dates, ISO suffixes, UTC-positive/negative local dates, localization, singular English, fallbacks and no mutation.
- 20 browser combinations: VI/EN × light/dark × 1366×768, 1440×900, 1920×1080, 820×1180, 390×844. Cards, Quick Detail, Full Profile and List were reviewed; Tree remains compact. Assertions check exact age text, two-line card wrapping, actions staying inside cards, readable profile metadata, generation badges, decorative icons, original editorial family, and no measured horizontal overflow.
- Browser reference date is fixed to local 2026-11-03. The suite checks before/after birthday examples, then advances to 2026-11-04 and re-renders the card to verify age changes from 25 to 26 without saving age.
- Browser form regression verifies `LIVING → DECEASED` reveals the death date, an empty death date blocks saving, a valid date saves the existing enum/date fields, and `DECEASED → LIVING` clears the death date as before. Payloads contain no calculated age fields.
- 21 preservation checks pass, including unchanged form, date controls, services/types, relations, table/tree, font CSS, and existing translations; the intended mobile profile selector correction is explicitly allowed.
- `npm.cmd run build`: passes, including `tsc -b`. There is no separate typecheck script.
- `npm.cmd run lint`: zero errors; one pre-existing Timeline effect dependency warning remains.

Browser API traffic and writes are intercepted by local fixtures; no real member data was changed. Results: [age and form checks](review-member-age/age-results.json), [preservation audit](review-member-age/preservation-audit.json), [screenshots/metrics](review-member-age/visual-results.json).

Run the production preview on port 7004, then `node tests/member-age.browser.cjs` (or set `MYLIFE_UI_URL`). The runner uses the existing local Puppeteer installation and Edge. Unit tests run with `node --test tests/member-age.test.cjs tests/member-age-status.test.cjs`.

Known issues: no new failures found. The existing Timeline lint warning and Map chunk-size build warning remain. Live backend writes were not used for verification.
