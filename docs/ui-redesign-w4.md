# MyLife Web — W3 navigation patch / W4 public landing

Branch: `feature_minhduc`. Work is local to `Frontend-MyLife`; existing W0–W3 working changes are retained. No commit, push, hosted Site registration, or deployment was performed.

## Navigation patch

- The first authenticated navigation item is **Trang chủ / Home** and targets `/mylife`.
- Desktop and drawer MyLife brand links explicitly target `/mylife`.
- The existing account menu now includes **Trang chủ MyLife / MyLife home page**, targeting `/` as a secondary action.
- Important top-level links use deterministic routes. No history-back behavior was introduced.
- Existing exclusive USER/ADMIN guards are unchanged. A USER opens `/mylife`; an ADMIN following that link is still redirected by the existing guard to `/Home/Admin`. Public authenticated CTAs reflect this by offering the appropriate MyLife or Administration entry.

## Public landing

`MyLifeLandingPage` is one lazy-loaded component used by `/`, `/home`, `/Home`, and the existing public fallback. It replaces the active portfolio wrapper, not the portfolio source files.

The developer hero, skills, stats, projects, experience, portfolio Contact section, and old footer are no longer part of the public landing. Old portfolio code and assets remain available for later reuse.

The page introduces MyLife as a Living Family Archive through:

1. A sticky desktop header and accessible mobile drawer.
2. A two-column editorial hero with illustrative family photography, a memory caption, family preview, and amber anniversary tile.
3. A family story and a small static tree preview.
4. Timeline and anniversary storytelling with subtle teal/amber accents.
5. An image-first album section with muted plum accents.
6. A lightweight static places/connection illustration, with no map API or VietMap embed.
7. A short product philosophy, account CTA, and minimal footer.

All preview photos, people, dates, and events are illustrative; captions identify sample content. The landing fetches no family data and introduces no API endpoints, statistics, testimonials, pricing, or new product capabilities.

## Shared foundations, theme, and language

- Existing Button, Card, Badge, Avatar, IconButton, Modal/drawer, semantic tokens, and theme provider are reused.
- `AppearanceControls` extracts the existing compact light/dark/system and VI/EN selectors for both the App Shell and public header.
- Warm cream/sage light mode and layered green-charcoal dark mode use the approved tokens. No parallel landing palette or new UI framework was added.
- Desktop uses horizontal navigation, a wide hero, paired story sections, and editorial image composition. Tablet/mobile naturally stack the content and use a drawer. Decorative card overlap is limited to illustrative previews.
- The landing has no continuous animation. Hover/focus transitions and anchor scrolling respect reduced motion.
- New content lives in `landing.json` for VI/EN. Existing `common.seo` title/description/Open Graph text now describe MyLife; the existing App effect still updates document title, description, and HTML language. Initial HTML metadata and a sage leaf favicon identify MyLife before React mounts.

## Authentication integration

The existing login modal, registration route, Google popup flow, session restore, session-expired dialog, logout service, role logic, and HttpOnly cookie architecture remain intact.

The login event listener moved from the retired public portfolio header into App. Its public-page scope is preserved: an intentional logout's transient protected-route render must not reopen a login overlay. Registration and public entry buttons can still open the existing modal. Session-expired confirmation retains its explicit `/Home` navigation and login opening.

This is presentation integration; API clients, auth services/context/guards, request/response payloads, and business validation were not edited.

## Files created in this phase

| File | Purpose |
| --- | --- |
| `src/features/landing/pages/MyLifeLandingPage.tsx` | Shared public page |
| `src/features/landing/pages/MyLifeLandingPage.css` | Scoped responsive editorial layout |
| `src/features/landing/components/LandingHeader.tsx` | Public navigation and auth entry utilities |
| `src/features/landing/components/ArchivePreviews.tsx` | Static family, memory, album, date, and places compositions |
| `src/shared/components/AppearanceControls.tsx` | Reused compact theme/language controls |
| `src/shared/locales/vi/landing.json` | Vietnamese copy |
| `src/shared/locales/en/landing.json` | English copy |
| `public/assets/landing/family-archive.jpg` | Generated illustrative family photo, about 302 KB |
| `public/assets/landing/garden-memory.jpg` | Generated illustrative album photo, about 394 KB |
| `public/assets/mylife-mark.svg` | Sage leaf favicon consistent with the existing brand icon |
| `tests/landing.browser.cjs` | Isolated responsive/navigation/auth-entry QA |
| `docs/review-w4/` | Fixture screenshots and validation records |
| `docs/landing-image-prompts.md` | Image provenance and final prompts |
| `docs/ui-redesign-w4.md` | This report |

## Existing files changed in this phase

- `src/App.tsx`: shared landing routes, retirement of eager portfolio imports/wrapper, public login event bridge.
- `src/shared/layouts/app-shell/AppShell.tsx`: deterministic Home/brand links and shared appearance utilities.
- `src/features/auth/components/UserMenu.tsx`: secondary public landing link.
- `src/shared/i18n/index.ts`: landing locale registration.
- `src/shared/locales/en/common.json`, `vi/common.json`: MyLife loading brand and SEO copy.
- `index.html`: initial MyLife metadata, language, and favicon.
- `tests/app-shell.browser.cjs`: existing fixture smoke recognizes the new public “Log in” wording.

## Preserved assets and boundaries

`public/assets/cofounder/cofounder-2-hero.webm` remains unchanged, along with its original Hero component reference, landscape/background imagery, project media, and old logo assets. The video is not rendered or requested by the new landing. No Relax/Focus, W5 Family, W6 Memories, W7 Map, or W8 Profile/Admin redesign was implemented.

Backend and both mobile repositories were not modified.

## Validation and limits

- `npm.cmd run build`: passes, including TypeScript. The existing large map chunk warning remains.
- `npm.cmd run lint`: no errors; one pre-existing hook dependency warning in `TimelineEventModal.tsx:43` remains.
- Existing role, registration-error, and account-identity tests: 13 tests pass.
- Isolated browser matrix: `/` and `/Home` × VI/EN × light/dark × 1366×768, 1440×900, 1920×1080, 820×1180, and 390×844 = 40 cases.
- Browser checks compare both landing routes, headings and metadata, loaded imagery, theme/language, story sections, horizontal overflow, and absence of portfolio/video content.
- Interaction smoke checks registration navigation, existing login/logout, `/api/me` fixture restore, Google authorization entry, shell Home/brand links, public account-menu link, mobile drawer focus/Escape, system theme, exclusive roles, and the six existing authenticated routes.
- Fixtures intercept API calls; no live account or family data is used. Real backend cookie persistence and completed Google authorization remain outside this verification. The Google check verifies the existing entry path without transmitting credentials to Google.

## Review

Run `npm.cmd run dev`, then open:

- `/` — public MyLife landing.
- `/Home` — the same public landing.
- `/mylife` — authenticated Home (USER session).
- `/dev/design-system` — existing development-only foundations.

Use the header selectors to compare light/dark/system and VI/EN. Check desktop navigation, tablet stacking, and the mobile drawer. Fixture-backed screenshots are saved under `docs/review-w4`; they are review evidence, not visual approval.

Stop after W4. The next step is visual review, then W5 Family only after approval.
