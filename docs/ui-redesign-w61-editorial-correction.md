# W6.1 correction — preserve the approved editorial typography

The approved typography is restored. Georgia remains the editorial family; the existing Inter contexts remain Inter. No heading hierarchy or module layout was redesigned. The shared floating fields, dropdown system, generation-free relation labels/chips, and all business logic remain intact.

## Diagnosis

| Audit | Finding and action |
| --- | --- |
| Actual font files | Installed Georgia 5.59 regular, bold, italic and bold italic lack 88 letters in the Vietnamese U+1EA0–1EF9 block. The supported Ỳ/ỳ are retained in Georgia. |
| Fallback/shaping | Chromium decomposes some missing letters and renders tone marks with another face. The isolated Georgia sample reproduces the artificial spacing without any application CSS. Adding a normal fallback stack still leaves detached marks. |
| Unicode | All 1,200 strings in the 15 Vietnamese locale files are NFC. Intercepted API fixtures deliberately supply NFD names and album titles; rendering normalizes them while those raw values remain NFD. Live stored records were not inspected. |
| Letter spacing | Original styles are retained. Isolated `letter-spacing:normal` does not fix the missing glyphs. |
| Kerning/features/variant | Existing values are retained. Explicit normal kerning, normal variants, and enabled `kern`, `ccmp`, `mark`, `mkmk` do not repair the missing coverage. |
| Line height | Original values are retained. The issue reproduces with generous 1.6 line height and no clipping. |
| Weights | Native Georgia 400/700 and corresponding italics are retained. Existing 500/600 requests use the same regular/bold matching as before. The fallback has the corresponding weights/styles. |
| Transforms/scaling | The issue reproduces with `transform:none`, independently of tree zoom. No transform or scale workaround was added. |
| Browser | Verified in Windows Edge and Chrome. Both use Chromium; Firefox/Safari were not tested. |

The Family, Memories and Landing stylesheets match their pre-W6.1 snapshots exactly, ignoring only line endings and trailing whitespace. This preserves their font-family declarations, size, weight, line height, tracking and heading character. See [identity preservation](review-w61/editorial-correction/identity-preservation.json).

## Narrow rendering fix

`src/design-system/editorial-fonts.css` defines a **composite Georgia face**:

- Supported characters use the installed Georgia file, including Ỳ/ỳ.
- Only U+1EA0–1EF1 and U+1EF4–1EF9 use self-hosted Gelasio for the complete accented letter, rather than borrowing a disconnected combining mark.
- Regular, bold, italic and bold italic are defined separately. No synthetic variable Georgia range or arbitrary size adjustment is introduced.
- Devices without Georgia can use Gelasio as the matching serif substitute.

Gelasio was chosen because its author and Google Fonts document compatibility with Georgia's regular/bold/italic metrics, and the distributed files include Vietnamese support. Sources: [Google Fonts description](https://github.com/google/fonts/blob/main/ofl/gelasio/DESCRIPTION.en_us.html), [font metadata](https://github.com/google/fonts/blob/main/ofl/gelasio/METADATA.pb). Composite character ranges follow the [CSS Fonts specification](https://www.w3.org/TR/css-fonts-3/#composite-fonts).

The normal/italic files are approximately 169kB/174kB, with their OFL license in `public/assets/fonts`. The normal file is preloaded. External Google Fonts requests are not needed for this fix. No proprietary Georgia font file is copied or redistributed.

Display-only NFC normalization covers the restored editorial boundaries, including Member quick detail, the selected album title, and the Profile heading that interpolates a member name. Stored records, input state, API payloads and IDs are not rewritten.

The broad sans replacement and the added Noto Serif landing override were removed. The obsolete Noto Serif assets were removed. Historical sans/Noto diagnostic screenshots remain as audit history, not the final design.

## Verification

- Build and `tsc -b`: pass.
- Lint: zero errors; the existing Timeline effect dependency warning remains.
- 90 targeted Node tests: pass.
- 55 API/DTO/business/date/save-handler preservation checks: pass.
- 20 typography combinations: Edge and Chrome × light/dark × 1366×768, 1440×900, 1920×1080, 820×1180, 390×844. All four reported examples render through NFC display boundaries at 400/500/600/700, normal and italic. Glyph-level inspection proves only the missing letters use Gelasio; supported glyphs use Georgia. Supported-text widths match native Georgia within 0.01px. External Google Fonts requests were blocked.
- 80 actual product-page checks cover Family cards, quick detail, profile sections, Timeline, Anniversary headings, Albums, selected album and photo lightbox. Assertions check the requested theme, original Georgia family, normalized display strings, expected font sources and horizontal overflow. Raw member/album fixture values remain decomposed; there are no writes in this review.
- Family and Memories interaction suites pass again: Member CRUD/avatar/relationships/generation filtering, Timeline, lunar/solar Anniversary, Album and photo workflows. API writes are served by fixtures.

Evidence: [font coverage](review-w61/editorial-correction/font-cmap-audit.json), [spacing/fallback diagnosis](review-w61/editorial-correction/fallback-diagnostics.png), [Unicode audit](review-w61/editorial-correction/locale-unicode-audit.json), [browser typography results](review-w61/editorial-correction/editorial-results.json), [real-page results](review-w61/editorial-correction/pages/typography-results.json), [Family example](review-w61/editorial-correction/pages/light-1440-family-cards.png).

Reproduction: start the temporary test Vite config on port 7003 and the production preview on 7004; run `tests/typography-w61.browser.cjs` and `tests/editorial-pages-w61.browser.cjs`. The latter uses `MYLIFE_UI_URL` for the preview. Both use the existing local Puppeteer installation and installed browsers. Font-source/identity/Unicode audit scripts are in `scratch/w61-editorial-*` and `scratch/w61-unicode-scan.cjs`.

No new functional failures were found. The pre-existing Map bundle-size warning and Timeline lint warning remain. W7 was not started.
