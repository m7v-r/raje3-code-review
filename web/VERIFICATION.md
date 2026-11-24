# Supabase/Auth/private-draft verification — 2026-11-24

## Passed

- `npm test`: 20 unit tests (legacy guest adapter, public configuration, field validation,
  RPC boundary, async hydration, ordered saves, stale revisions, failed requests and account disposal).
- `npm run test:integration`: 9 React StrictMode + real Supabase SDK integration tests in jsdom
  with an in-process HTTP fixture. Covers signed-out guard, Arabic auth errors, confirmation-required
  signup, save/remount, sign-out/sign-in, A/B isolation in UI state, failed save/retry, conflict/reload,
  missing migration and the demo/custom-input boundary.
- `npm run build`: production build passed.
- Static PostgreSQL parse: 32 statements accepted by pgsql-parser. No DDL was executed;
  this does not runtime-validate PL/pgSQL functions, constraints or policies.
- Browser: sign-in and sign-up manually inspected via the in-app browser at widths 320, 375 and 1280.
  documentElement.scrollWidth matched innerWidth (no horizontal page overflow). Existing token colors,
  fonts and RTL were compared with DESIGN.md / approved Code Lab reference. This is not a full a11y audit.
  Account screenshots are saved in design/shots/auth-sign-{in,up}-{375,1280}.jpg.

## Not claimed / pending

- No live Supabase project connection, email delivery, deployed migration, PostgreSQL constraints or RLS
  tests: environment values are deliberately empty and the SQL migration was not run.
- `npm run test:e2e`: suite prepared but could not execute in this sandbox because Chrome launch exited
  with SIGABRT / process permission errors. No Playwright browser case reached application assertions.
  Earlier alternate-port web-server startup also timed out; the final config reuses the local 5173 server.
- The jsdom fixture does not prove PostgreSQL isolation; run the real two-account checks in
  ../supabase/README.md after installation. Remount testing is not an actual browser reload.
- `npm audit --omit=dev`: zero production advisories at verification. Full audit reports the existing
  Vite 5 / esbuild development-toolchain advisories (one high, one moderate). No forced major stack
  upgrade was applied as part of this feature. Keep dev servers local; plan a separate Vite upgrade.

## Commands

From web/: npm test; npm run test:integration; npm run build.
For a browser-capable environment: npm run test:e2e (install Chrome on macOS or Playwright Chromium
on other systems). Test configuration and Supabase HTTP data are fixtures, never real credentials.
See SUPABASE_SETUP.md for setup and manual acceptance checks.
