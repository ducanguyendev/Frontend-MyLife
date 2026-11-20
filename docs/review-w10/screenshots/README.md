# W10 screenshot evidence

All images contain synthetic test data. `real-backend/` is captured from actual Kestrel/PostgreSQL; the other folders use intercepted API fixtures.

The full browser matrix executed successfully. Representative screenshots are retained for review; redundant Admin/profile PNGs were omitted while preserving all JSON metrics. Running `npm run test:browser:qa` recreates the complete generated set.

Reviewed directly: `real-backend/real-family-cards-1440.png`, `global-polish-touch/dark-390-login-validation.png`, and `admin-console/vi-light-1440-overview.png`. Their layout remains consistent with W9. Automated bounds/focus/overflow/contrast assertions cover the rest of the matrix.
