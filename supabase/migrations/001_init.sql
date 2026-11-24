-- Raje3 MVP: one private current draft per Supabase Auth user.
-- Run once on a fresh Supabase database. No fixtures, source files, or secrets.
-- Deliberately fail on an existing schema instead of silently replacing user data.
begin;

create function public.draft_requirements_valid(p_text text)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare
  v_line text;
  v_count integer := 0;
begin
  if p_text is null or char_length(p_text) > 20000 then return false; end if;
  foreach v_line in array regexp_split_to_array(p_text, E'\r\n|\r|\n') loop
    if v_line !~ '^[[:space:]]*$' then
      v_count := v_count + 1;
      if v_count > 100 or char_length(v_line) > 1000 then return false; end if;
    end if;
  end loop;
  return true;
end;
$$;

create function public.draft_files_valid(p_files jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare
  v_file jsonb;
  v_name text;
  v_names text[] := array[]::text[];
begin
  if p_files is null or jsonb_typeof(p_files) <> 'array' then return false; end if;
  if jsonb_array_length(p_files) > 20 then return false; end if;
  for v_file in select value from jsonb_array_elements(p_files) loop
    if jsonb_typeof(v_file) <> 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(v_file)) <> 2
      or not (v_file ? 'name' and v_file ? 'demo')
      or jsonb_typeof(v_file -> 'name') <> 'string'
      or jsonb_typeof(v_file -> 'demo') <> 'boolean' then return false; end if;
    v_name := v_file ->> 'name';
    if v_name ~ '^[[:space:]]*$' or char_length(v_name) > 255
      or v_name = any(v_names) then return false; end if;
    v_names := array_append(v_names, v_name);
  end loop;
  return true;
end;
$$;

create table public.review_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision bigint not null default 1 check (revision >= 1),
  name text not null default '' check (char_length(name) <= 120),
  requirements text not null default '' check (public.draft_requirements_valid(requirements)),
  files jsonb not null default '[]'::jsonb check (public.draft_files_valid(files))
);
-- PRIMARY KEY and UNIQUE(user_id) already create the only necessary indexes.

create function public.guard_review_draft_metadata()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.id := gen_random_uuid();
    new.created_at := statement_timestamp();
    new.updated_at := new.created_at;
    new.revision := 1;
  else
    if new.id is distinct from old.id or new.user_id is distinct from old.user_id
      or new.created_at is distinct from old.created_at then
      raise sqlstate 'PT400' using message = 'Draft identity and ownership are immutable';
    end if;
    new.updated_at := statement_timestamp();
    new.revision := old.revision + 1;
  end if;
  return new;
end;
$$;

create trigger review_drafts_metadata
before insert or update on public.review_drafts
for each row execute function public.guard_review_draft_metadata();

alter table public.review_drafts enable row level security;

-- SELECT: a signed-in user can read only their own draft.
create policy review_drafts_select_own on public.review_drafts
for select to authenticated using ((select auth.uid()) = user_id);
-- INSERT: a signed-in user can create a draft owned only by themselves.
create policy review_drafts_insert_own on public.review_drafts
for insert to authenticated with check ((select auth.uid()) = user_id);
-- UPDATE: only the owner can update a row, and the updated row must stay theirs.
create policy review_drafts_update_own on public.review_drafts
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
-- DELETE: a signed-in user can delete only their own draft.
create policy review_drafts_delete_own on public.review_drafts
for delete to authenticated using ((select auth.uid()) = user_id);

create function public.review_draft_payload(p_row public.review_drafts)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'id', p_row.id, 'revision', p_row.revision,
    'createdAt', p_row.created_at, 'updatedAt', p_row.updated_at,
    'draft', jsonb_build_object('name', p_row.name, 'requirements', p_row.requirements, 'files', p_row.files)
  );
$$;

create function public.get_review_draft()
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare v_row public.review_drafts;
begin
  if auth.uid() is null then raise sqlstate 'PT401' using message = 'Sign in required'; end if;
  select * into v_row from public.review_drafts where user_id = auth.uid();
  if not found then return jsonb_build_object('draft', null); end if;
  return public.review_draft_payload(v_row);
end;
$$;

create function public.save_review_draft(
  p_name text, p_requirements text, p_files jsonb, p_expected_revision bigint
)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_row public.review_drafts;
begin
  if auth.uid() is null then raise sqlstate 'PT401' using message = 'Sign in required'; end if;
  if p_name is null or char_length(p_name) > 120
    or not public.draft_requirements_valid(p_requirements)
    or not public.draft_files_valid(p_files)
    or (p_expected_revision is not null and p_expected_revision < 1) then
    raise sqlstate 'PT400' using message = 'Invalid draft fields';
  end if;

  select * into v_row from public.review_drafts where user_id = auth.uid() for update;
  if found then
    if p_expected_revision is null or p_expected_revision <> v_row.revision then
      raise sqlstate 'PT409' using message = 'A newer draft exists; reload before saving';
    end if;
    update public.review_drafts set name = p_name, requirements = p_requirements, files = p_files
    where id = v_row.id returning * into v_row;
  else
    if p_expected_revision is not null then
      raise sqlstate 'PT409' using message = 'Draft was removed; reload before saving';
    end if;
    begin
      insert into public.review_drafts (name, requirements, files)
      values (p_name, p_requirements, p_files) returning * into v_row;
    exception when unique_violation then
      raise sqlstate 'PT409' using message = 'A draft was created concurrently; reload before saving';
    end;
  end if;
  return public.review_draft_payload(v_row);
end;
$$;

create function public.delete_review_draft(p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_row public.review_drafts;
begin
  if auth.uid() is null then raise sqlstate 'PT401' using message = 'Sign in required'; end if;
  if p_expected_revision is null or p_expected_revision < 1 then
    raise sqlstate 'PT400' using message = 'Expected revision is required';
  end if;
  select * into v_row from public.review_drafts where user_id = auth.uid() for update;
  if not found then return jsonb_build_object('deleted', false); end if;
  if p_expected_revision <> v_row.revision then
    raise sqlstate 'PT409' using message = 'A newer draft exists; reload before deleting';
  end if;
  delete from public.review_drafts where id = v_row.id;
  return jsonb_build_object('deleted', true);
end;
$$;

revoke all on table public.review_drafts from public, anon;
-- Direct Data API calls still obey all CHECK constraints, metadata triggers and RLS.
grant select, insert, update, delete on table public.review_drafts to authenticated;

revoke all on function public.draft_requirements_valid(text) from public, anon;
revoke all on function public.draft_files_valid(jsonb) from public, anon;
revoke all on function public.guard_review_draft_metadata() from public, anon;
revoke all on function public.review_draft_payload(public.review_drafts) from public, anon;
revoke all on function public.get_review_draft() from public, anon;
revoke all on function public.save_review_draft(text, text, jsonb, bigint) from public, anon;
revoke all on function public.delete_review_draft(bigint) from public, anon;

grant execute on function public.draft_requirements_valid(text) to authenticated;
grant execute on function public.draft_files_valid(jsonb) to authenticated;
grant execute on function public.review_draft_payload(public.review_drafts) to authenticated;
grant execute on function public.get_review_draft() to authenticated;
grant execute on function public.save_review_draft(text, text, jsonb, bigint) to authenticated;
grant execute on function public.delete_review_draft(bigint) to authenticated;

notify pgrst, 'reload schema';
commit;
