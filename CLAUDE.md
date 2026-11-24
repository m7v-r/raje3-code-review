# Raje3 — current implementation decisions

Read PRD.md, DESIGN.md, design/CODEX-HANDOFF.md and web/src/data/mock.json first.
The owner approved the Supabase/auth/private-draft plan on 24 November 2026.
This file records that approval and supersedes the Day 2 “mock only / no backend”
restriction in CLAUDE.snippet.md for this one feature. The report remains a demo.

## Stack and data boundary
- Keep Vite + React 18, JavaScript ES modules, npm and the existing formatting library.
- Supabase PostgreSQL, Supabase Auth (email/password only) and the official
  @supabase/supabase-js client. No extra backend server, ORM, custom JWT or passwords table.
- Only web/src/lib/supabaseClient.js initializes the singleton client.
- Only web/src/lib/reviewDraftRepository.js calls draft RPCs. Screens use the hook/controller;
  do not call .from(), rpc() or localStorage from review screens.
- Public frontend configuration: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
  in ignored web/.env.local. Never print values. Never use server/secret/service-role keys
  in the frontend. web/.env.example has empty values only.
- A missing/invalid configuration produces one safe console error and disabled auth.
- Supabase owns session persistence and refresh. RLS is the authorization boundary.
- All three review screens require an account; sign-in and sign-up are public.
- Confirm email and set a minimum password length of 8 in the Supabase dashboard.

## Approved first feature
- One current private review_drafts row per auth user. Schema and policies are documented
  in supabase/README.md and defined by supabase/migrations/001_init.sql.
- Preserve UI data: { name, requirements, files: [{ name, demo }] }.
- Store filenames only, never raw file contents, absolute paths, File handles or report findings.
- Limits: name 120 characters; requirements 20,000 characters, 100 nonempty lines,
  1,000 characters per nonempty line; up to 20 distinct filenames, 1–255 characters each.
- Save incomplete/empty drafts. Require files + requirements only when continuing the review.
- Use revision checks, atomic RPCs and serialized saves. Never overwrite a newer draft silently.
- Load cloud data before allowing edits. Never autosave sample/default values during hydration.
- Keep the legacy guest localStorage draft untouched; do not import it automatically.
- Abort old account requests and unmount private state on sign-out/account changes.
- Keep custom input separate from canned report data. Analysis, history, uploads, execution,
  whole-repository access, teams and automatic fixes are not part of this feature.
- Do not execute the SQL migration. Deliver it for the owner to run manually in SQL Editor.
- Do not claim real Supabase tests passed without real configuration and a deployed migration.

## UI conventions
- Preserve DESIGN.md; use existing components and tokens in web/src/tokens.css only.
- No invented color, font, font size or unrelated redesign. No gradients or fake quality scores.
- Arabic RTL once on html; logical CSS properties. User text dir=auto; filenames/code LTR.
- Numbers/dates go through web/src/lib/format.js; Arabic-Indic UI digits.
- Implement sign-in and sign-up as separate screens. Existing review screens retain their design;
  only the account boundary, save status and accurate persistence wording are added.
- Keep validation errors specific, Arabic and linked to the relevant form; retain entered text.
- Never pass backend error strings, secrets, passwords or tokens to console/UI logs.
- Verify 375px and 1280px viewport screenshots in design/shots/, also check 320px overflow.
- Read DESIGN.md keyboard/focus/reduced-motion conventions before UI changes.

## Checks
- In web/: npm test; npm run test:integration; npm run build; npm run test:e2e.
- Browser tests intercept fixture HTTP requests; they are not a live database/RLS audit.
- For Playwright install Chromium (npx playwright install chromium); macOS tests use Chrome.
- See web/SUPABASE_SETUP.md for real setup and manual acceptance checks.
