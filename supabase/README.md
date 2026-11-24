# Raje3 private draft schema

Approved scope: one current draft per Supabase Auth account. This is not a complete code-analysis backend.
Source nouns: review name/date, selected filenames and user requirements in design/CODEX-HANDOFF.md / PRD.md.
The report and illustrative evidence remain web/src/data/mock.json and are not written to PostgreSQL.

## Migration

`migrations/001_init.sql` is one transactional migration for a **fresh Supabase database**.
It contains no fixtures. It has **not been run** as part of implementation. Do not run it on an existing
schema blindly: inspect existing tables/functions and take a backup first. A name collision deliberately
fails and rolls back instead of dropping or replacing data. Do not rerun it after successful installation.

1. Open your Supabase project → SQL Editor → New query.
2. Paste the entire 001_init.sql file, then Run.
3. In Table Editor inspect public.review_drafts: it should be empty with RLS enabled.
4. In Database / Policies verify all four ownership policies below.
5. Test with separate authenticated users from the app. SQL Editor's elevated role does not prove RLS.

## Columns

| Column | Type | Required | Default / constraint |
|---|---|---|---|
| id | uuid | yes | generated UUID, primary key; immutable |
| user_id | uuid | yes | auth.uid(), unique, auth.users(id) FK ON DELETE CASCADE; immutable |
| created_at | timestamptz | yes | server time; immutable |
| updated_at | timestamptz | yes | server time on insert/update |
| revision | bigint | yes | 1, positive, incremented by server on update |
| name | text | yes | empty string, up to 120 characters; optional to user |
| requirements | text | yes | empty string; 20,000 characters, 100 nonempty lines, 1,000 per nonempty line |
| files | jsonb | yes | []; up to 20 exact {name, demo} objects; distinct nonblank names up to 255 characters, boolean demo |

One auth user has zero or one draft. Files/requirements are embedded in that draft. Auth users/passwords
are managed by Supabase, not created by this migration. The primary key and user_id unique constraint
create the only needed indexes. Drafts remain until replaced/deleted or their auth account is deleted.

## Policies and enforcement

- SELECT: authenticated users read only rows whose user_id matches auth.uid().
- INSERT: authenticated users create only rows owned by themselves.
- UPDATE: authenticated users update only their row, and the resulting owner must remain themselves.
- DELETE: authenticated users delete only their row.
- Anonymous users have neither table access nor RPC execution permission.
- All RPCs use SECURITY INVOKER, an empty search_path, auth.uid() and the same RLS boundary.
- CHECK constraints validate content even through direct Data API writes; a trigger protects metadata.
- RPC save/delete lock the row and compare revision, returning PT409 on a stale version.
- Two simultaneous first creates cannot duplicate a draft (unique user_id); the loser gets PT409.
- Direct owner Data API writes still obey RLS/constraints and increment revision; optimistic expected-revision
  matching is an RPC contract, not an additional restriction on an owner using the raw Data API.
- Helpers validate JSON and format the response only; no helper grants access to another user's rows.

## RPC contract

All methods are POST under `/rest/v1/rpc/`, called by the official SDK with the user's session.

- get_review_draft({}) → {draft:null} or {id,revision,createdAt,updatedAt,draft:{name,requirements,files}}.
- save_review_draft({p_name,p_requirements,p_files,p_expected_revision}) → same envelope.
  Expected revision is null only for first creation, otherwise the last loaded/saved positive integer.
- delete_review_draft({p_expected_revision}) → {deleted:true}; already absent → {deleted:false}.

Failures: invalid input PT400 / HTTP 400; no session PT401 / 401; denied permission 403;
conflict PT409 / 409; missing RPC PGRST202 / 404 is a setup error, never an empty draft.
Network, rate-limit and service errors are shown in Arabic without exposing raw backend strings.

## Screens

| Screen | Read | Write |
|---|---|---|
| Start review | own review_drafts | own name/requirements/filename metadata |
| Scope check | current loaded draft | none |
| Results | explicit demo fixture | none |
| Sign-in / sign-up | Supabase Auth | provider-managed account/session |

Incomplete drafts can be saved; continuing requires at least one file and requirement. Input changes
invalidate previous report navigation. No custom input receives the canned demo report. Findings,
unknown evidence, counts, RTL, keyboard behavior and read-only limits retain DESIGN.md rules.

## Real isolation checks after installation

1. Sign in as A; save a draft. Sign in as B in a separate browser profile; B starts empty.
2. Using B's authenticated Data API request with A's row id must return no A rows; updates/deletes
   must affect zero A rows (RLS filtering may return an empty success response, not always HTTP 403).
3. Inserting a row with A's user_id while authenticated as B must fail. Reassigning B's row owner must fail.
4. Blank drafts are valid. Overlong fields, duplicate names, extra file keys or more than 20 files must fail.
5. A stale expected revision must produce a 409 and preserve the latest saved data.
6. A signed-out request must have no access. Deleting an auth account should remove its draft.

Not added: source uploads/storage buckets, analysis providers/jobs/results, past reviews, teams, execution,
autofix, profiles or custom password/token tables. The PRD's real analysis/report is separate remaining MVP work.
