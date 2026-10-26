-- LoveMate cloud database. Run this once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to run again: it only creates what is missing and replaces the functions.
--
-- Data model
--   user_state    one row per (user, localStorage key): each person's private data
--   couples       a partner link, joined with a one-time invite code
--   couple_members the (max two) people in a couple
--   couple_state  one row per (couple, key): data both partners share
-- Row Level Security makes sure people only ever see their own rows and their own couple's rows.

-- ---------------------------------------------------------------- tables

create table if not exists public.user_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value text,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique,
  invite_expires_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create table if not exists public.couple_state (
  couple_id uuid not null references public.couples (id) on delete cascade,
  key text not null,
  value text,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (couple_id, key)
);

-- ---------------------------------------------------------------- security

alter table public.user_state enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_state enable row level security;

-- Runs with owner rights so policies on couple_members can use it without recursion.
create or replace function public.is_couple_member(c uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.couple_members where couple_id = c and user_id = auth.uid());
$$;

drop policy if exists "own rows" on public.user_state;
create policy "own rows" on public.user_state
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "members read couple" on public.couples;
create policy "members read couple" on public.couples
  for select to authenticated
  using (public.is_couple_member(id));

drop policy if exists "members read members" on public.couple_members;
create policy "members read members" on public.couple_members
  for select to authenticated
  using (public.is_couple_member(couple_id));

drop policy if exists "members use shared state" on public.couple_state;
create policy "members use shared state" on public.couple_state
  for all to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id) and updated_by = auth.uid());

-- ---------------------------------------------------------------- partner linking
-- Couples and memberships are only changed through these functions, never directly.

-- Start a couple (or refresh the invite code while still waiting for the partner).
create or replace function public.create_couple(p_name text)
returns table (couple_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple uuid;
  v_members int;
  v_code text := 'LOVE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;

  select m.couple_id into v_couple from public.couple_members m where m.user_id = auth.uid();
  if v_couple is not null then
    select count(*) into v_members from public.couple_members m where m.couple_id = v_couple;
    if v_members >= 2 then raise exception 'already_connected'; end if;
    update public.couples c set invite_code = v_code, invite_expires_at = now() + interval '7 days' where c.id = v_couple;
  else
    insert into public.couples (invite_code, invite_expires_at, created_by)
      values (v_code, now() + interval '7 days', auth.uid())
      returning id into v_couple;
    insert into public.couple_members (couple_id, user_id, display_name) values (v_couple, auth.uid(), left(p_name, 60));
  end if;

  return query select v_couple, v_code;
end;
$$;

-- Join a partner with their invite code. Codes work once and expire after 7 days; a couple has at most two people.
create or replace function public.join_couple(p_code text, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid;
  v_own uuid;
  v_members int;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;

  select c.id into v_target from public.couples c
    where c.invite_code = upper(trim(p_code)) and c.invite_expires_at > now();
  if v_target is null then raise exception 'invalid_code'; end if;

  select m.couple_id into v_own from public.couple_members m where m.user_id = auth.uid();
  if v_own = v_target then raise exception 'own_code'; end if;
  if v_own is not null then
    select count(*) into v_members from public.couple_members m where m.couple_id = v_own;
    if v_members >= 2 then raise exception 'already_connected'; end if;
    -- Drop the caller's own unused invite before joining the partner.
    delete from public.couples c where c.id = v_own;
  end if;

  select count(*) into v_members from public.couple_members m where m.couple_id = v_target;
  if v_members >= 2 then raise exception 'couple_full'; end if;

  insert into public.couple_members (couple_id, user_id, display_name) values (v_target, auth.uid(), left(p_name, 60));
  update public.couples c set invite_code = null, invite_expires_at = null where c.id = v_target;
  return v_target;
end;
$$;

-- Leave the couple. The shared space is deleted once nobody is left in it.
create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple uuid;
begin
  delete from public.couple_members m where m.user_id = auth.uid() returning m.couple_id into v_couple;
  if v_couple is not null and not exists (select 1 from public.couple_members m where m.couple_id = v_couple) then
    delete from public.couples c where c.id = v_couple;
  end if;
end;
$$;

-- Permanently delete the signed-in account and all of its data.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  perform public.leave_couple();
  delete from auth.users u where u.id = auth.uid();
end;
$$;

revoke all on function public.create_couple(text) from public, anon;
revoke all on function public.join_couple(text, text) from public, anon;
revoke all on function public.leave_couple() from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.create_couple(text) to authenticated;
grant execute on function public.join_couple(text, text) to authenticated;
grant execute on function public.leave_couple() to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------- live updates between partners

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'couple_state') then
    alter publication supabase_realtime add table public.couple_state;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'couple_members') then
    alter publication supabase_realtime add table public.couple_members;
  end if;
end;
$$;

-- ---------------------------------------------------------------- paid plans (Razorpay)
-- Written only by the server after a verified payment (with the secret key). Users can read their own
-- plan and their partner's (a Couple plan paid by one partner covers both), but never change it.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null check (plan in ('plus', 'couple')),
  cycle text check (cycle in ('monthly', 'yearly')),
  status text not null,
  current_end timestamptz,
  razorpay_subscription_id text unique,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "read own or partner plan" on public.subscriptions;
create policy "read own or partner plan" on public.subscriptions
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.couple_members me
      join public.couple_members partner on partner.couple_id = me.couple_id
      where me.user_id = auth.uid() and partner.user_id = subscriptions.user_id
    )
  );
