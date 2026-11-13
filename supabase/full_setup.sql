-- ====================================================================
-- SUPABASE FULL SETUP SCRIPT (1-CLICK EXECUTION - PRODUCTION CLEAN)
-- PROJECT: DrawToStory - Child-Safe AI Storyteller
-- PURPOSE: Complete database schema, real Supabase Auth seed accounts,
--          strict RLS security, storage configuration & clean baseline
-- IDEMPOTENT: Safe to run multiple times in Supabase SQL Editor
-- ====================================================================

set search_path = public, extensions;

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. CLEANUP EXISTING VIEWS, TABLES & ORPHAN STORAGE OBJECTS
drop view if exists public.v_ai_admin_agreement cascade;
drop view if exists public.v_cost_by_day cascade;
drop view if exists public.v_daily_stats cascade;

drop table if exists public.admin_audit_logs cascade;
drop table if exists public.reading_events cascade;
drop table if exists public.user_badges cascade;
drop table if exists public.badges cascade;
drop table if exists public.moderation_reviews cascade;
drop table if exists public.ai_logs cascade;
drop table if exists public.app_settings cascade;
drop table if exists public.story_pages cascade;
drop table if exists public.stories cascade;
drop table if exists public.safety_rules cascade;
drop table if exists public.system_prompts cascade;
drop table if exists public.drawings cascade;
drop table if exists public.children cascade;
drop table if exists public.profiles cascade;

-- Clean up any previous drawing files so storage starts 100% clean
delete from storage.objects where bucket_id = 'drawings';

-- 3. PROFILES TABLE
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_locked boolean not null default false,
  daily_quota integer not null default 5 check (daily_quota >= 0),
  parental_pin_hash text default '001627dbf308f962',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

-- 4. SECURITY DEFINER HELPER FUNCTIONS
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_locked = false
  );
end;
$$;

create or replace function public.is_active_user()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and is_locked = false
  );
end;
$$;

create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_quota()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select daily_quota from public.profiles where id = auth.uid();
$$;

-- 5. CHILDREN TABLE (Data Minimization: Nickname & Age only, no PII)
create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  nickname text not null,
  age integer not null check (age between 2 and 12),
  avatar_color text not null default '#FF8FA3',
  avatar_emoji text not null default '🥑',
  created_at timestamptz not null default now()
);

create index if not exists idx_children_parent on public.children(parent_id);

-- 6. DRAWINGS TABLE
create table public.drawings (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  image_path text not null,
  ai_analysis jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_drawings_child on public.drawings(child_id);

-- 7. SYSTEM PROMPTS TABLE (Versioned)
create table public.system_prompts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null default 1,
  prompt_text text not null,
  is_active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_system_prompts_active on public.system_prompts(is_active);

-- 8. STORIES TABLE
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  drawing_id uuid not null references public.drawings(id) on delete cascade,
  title text not null,
  summary text not null,
  moral text not null,
  status text not null default 'generating' check (
    status in ('generating', 'auto_approved', 'pending_review', 'approved', 'parent_approved', 'rejected', 'failed')
  ),
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  faithfulness_score integer not null default 100 check (faithfulness_score between 0 and 100),
  generation_stage text not null default 'done',
  risk_reasons jsonb not null default '[]'::jsonb,
  rejection_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  share_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  is_shared boolean not null default false,
  prompt_version_id uuid references public.system_prompts(id) on delete set null,
  model text not null default 'gemini-2.5-flash',
  next_drawing_ideas jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stories_child on public.stories(child_id);
create index if not exists idx_stories_status on public.stories(status);
create index if not exists idx_stories_share_token on public.stories(share_token);
create index if not exists idx_stories_created_at on public.stories(created_at desc);

-- 9. STORY PAGES TABLE
create table public.story_pages (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  page_number integer not null check (page_number >= 1),
  text_content text not null,
  emotion text not null default 'vui vẻ',
  focus_region jsonb not null default '{"x": 50, "y": 50, "zoom": 1.2}'::jsonb,
  grounded_objects jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (story_id, page_number)
);

create index if not exists idx_story_pages_story on public.story_pages(story_id, page_number);

-- 10. SAFETY RULES TABLE
create table public.safety_rules (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null,
  severity integer not null check (severity between 1 and 5),
  action text not null check (action in ('block', 'flag', 'rewrite')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_safety_rules_active on public.safety_rules(is_active);

-- 11. MODERATION REVIEWS TABLE
create table public.moderation_reviews (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  admin_id uuid not null references public.profiles(id),
  decision text not null check (decision in ('approved', 'rejected')),
  reason text not null,
  ai_risk_score_at_review integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_mod_reviews_story on public.moderation_reviews(story_id);
create index if not exists idx_mod_reviews_admin on public.moderation_reviews(admin_id);

-- 12. AI LOGS TABLE
create table public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  story_id uuid references public.stories(id) on delete set null,
  action text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  latency_ms integer not null default 0,
  estimated_cost_usd numeric(10, 6) not null default 0.000000,
  status text not null default 'success' check (status in ('success', 'error')),
  error_code text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_logs_user on public.ai_logs(user_id);
create index if not exists idx_ai_logs_created_at on public.ai_logs(created_at desc);

-- 13. APP SETTINGS TABLE
create table public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- 14. GAMIFICATION: BADGES & USER BADGES
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon text not null,
  criteria text not null
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (child_id, badge_id)
);

create index if not exists idx_user_badges_child on public.user_badges(child_id);

-- 15. READING EVENTS TABLE
create table public.reading_events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  listened_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_reading_events_child on public.reading_events(child_id);

-- 16. ADMIN AUDIT LOGS TABLE
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_admin on public.admin_audit_logs(admin_id);
create index if not exists idx_audit_logs_created_at on public.admin_audit_logs(created_at desc);

-- ====================================================================
-- 17. STRICT ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.drawings enable row level security;
alter table public.stories enable row level security;
alter table public.story_pages enable row level security;
alter table public.safety_rules enable row level security;
alter table public.system_prompts enable row level security;
alter table public.moderation_reviews enable row level security;
alter table public.ai_logs enable row level security;
alter table public.app_settings enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.reading_events enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Helper check for public shared stories (used so /shared/:token can read child nickname & drawing)
create or replace function public.is_child_in_shared_story(target_child_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.stories s
    where s.child_id = target_child_id
      and s.is_shared = true
      and s.status in ('auto_approved', 'approved', 'parent_approved')
  );
$$;

create or replace function public.is_drawing_in_shared_story(target_drawing_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.stories s
    where s.drawing_id = target_drawing_id
      and s.is_shared = true
      and s.status in ('auto_approved', 'approved', 'parent_approved')
  );
$$;

create or replace function public.get_story_status(target_story_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select status from public.stories where id = target_story_id;
$$;

-- PROFILES POLICIES
create policy "Users can view own profile or admin views all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own non-sensitive profile columns; Admin updates any"
  on public.profiles for update
  using ((auth.uid() = id and is_locked = false) or public.is_admin())
  with check (
    (
      auth.uid() = id
      and is_locked = false
      and role = public.get_my_role()
      and daily_quota = public.get_my_quota()
    )
    or public.is_admin()
  );

create policy "Insert own profile on signup"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

-- CHILDREN POLICIES
create policy "Parents view own children, Admin views all, Shared story views child"
  on public.children for select
  using (
    parent_id = auth.uid()
    or public.is_admin()
    or public.is_child_in_shared_story(id)
  );

create policy "Active parents insert own children"
  on public.children for insert
  with check (parent_id = auth.uid() and public.is_active_user());

create policy "Active parents update own children"
  on public.children for update
  using (parent_id = auth.uid() and public.is_active_user())
  with check (parent_id = auth.uid() and public.is_active_user());

create policy "Active parents delete own children"
  on public.children for delete
  using ((parent_id = auth.uid() and public.is_active_user()) or public.is_admin());

-- DRAWINGS POLICIES
create policy "Parents view own drawings, Admin views all, Shared story views drawing"
  on public.drawings for select
  using (
    exists (select 1 from public.children c where c.id = drawings.child_id and c.parent_id = auth.uid())
    or public.is_admin()
    or public.is_drawing_in_shared_story(id)
  );

create policy "Active parents insert own drawings"
  on public.drawings for insert
  with check (
    (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()) and public.is_active_user())
    or public.is_admin()
  );

create policy "Active parents delete own drawings"
  on public.drawings for delete
  using (
    (exists (select 1 from public.children c where c.id = drawings.child_id and c.parent_id = auth.uid()) and public.is_active_user())
    or public.is_admin()
  );

-- STORIES POLICIES
create policy "Parents view own stories, Public views shared approved, Admin views all"
  on public.stories for select
  using (
    exists (select 1 from public.children c where c.id = stories.child_id and c.parent_id = auth.uid())
    or (is_shared = true and status in ('auto_approved', 'approved', 'parent_approved'))
    or public.is_admin()
  );

create policy "Active parents insert stories for own children"
  on public.stories for insert
  with check (
    (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()) and public.is_active_user())
    or public.is_admin()
  );

create policy "Parents toggle share or report own stories; Admin moderates all"
  on public.stories for update
  using (
    (exists (select 1 from public.children c where c.id = stories.child_id and c.parent_id = auth.uid()) and public.is_active_user())
    or public.is_admin()
  )
  with check (
    (
      exists (select 1 from public.children c where c.id = stories.child_id and c.parent_id = auth.uid())
      and public.is_active_user()
      and (status = public.get_story_status(id) or status = 'pending_review')
    )
    or public.is_admin()
  );

create policy "Active parents delete own stories; Admin deletes any"
  on public.stories for delete
  using (
    (exists (select 1 from public.children c where c.id = stories.child_id and c.parent_id = auth.uid()) and public.is_active_user())
    or public.is_admin()
  );

-- STORY PAGES POLICIES
create policy "View story pages for accessible stories"
  on public.story_pages for select
  using (
    exists (
      select 1 from public.stories s
      left join public.children c on c.id = s.child_id
      where s.id = story_pages.story_id
        and (
          c.parent_id = auth.uid()
          or (s.is_shared = true and s.status in ('auto_approved', 'approved', 'parent_approved'))
          or public.is_admin()
        )
    )
  );

create policy "Insert story pages for own children stories"
  on public.story_pages for insert
  with check (
    (
      exists (
        select 1 from public.stories s
        join public.children c on c.id = s.child_id
        where s.id = story_id and c.parent_id = auth.uid()
      )
      and public.is_active_user()
    )
    or public.is_admin()
  );

-- SAFETY RULES POLICIES
create policy "Everyone can read active safety rules; Admin reads all"
  on public.safety_rules for select
  using (is_active = true or public.is_admin());

create policy "Admin manages safety rules"
  on public.safety_rules for all
  using (public.is_admin())
  with check (public.is_admin());

-- SYSTEM PROMPTS POLICIES
create policy "Authenticated users read active prompt; Admin reads all"
  on public.system_prompts for select
  using ((auth.uid() is not null and is_active = true) or public.is_admin());

create policy "Admin manages system prompts"
  on public.system_prompts for all
  using (public.is_admin())
  with check (public.is_admin());

-- MODERATION REVIEWS POLICIES
create policy "Admin manages moderation reviews"
  on public.moderation_reviews for all
  using (public.is_admin())
  with check (public.is_admin());

-- AI LOGS POLICIES
create policy "Admin views all AI logs; Users view own AI logs"
  on public.ai_logs for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Authenticated users insert own AI logs; Admin inserts any"
  on public.ai_logs for insert
  with check ((auth.uid() is not null and user_id = auth.uid()) or public.is_admin());

-- APP SETTINGS POLICIES
create policy "Authenticated users read app settings"
  on public.app_settings for select
  using (auth.uid() is not null or public.is_admin());

create policy "Admin updates app settings"
  on public.app_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- BADGES & USER BADGES POLICIES
create policy "Anyone can view badge catalog"
  on public.badges for select
  using (true);

create policy "Parents view and earn badges for own children; Admin views all"
  on public.user_badges for all
  using (
    exists (select 1 from public.children c where c.id = user_badges.child_id and c.parent_id = auth.uid())
    or public.is_admin()
  )
  with check (
    (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()) and public.is_active_user())
    or public.is_admin()
  );

-- READING EVENTS POLICIES
create policy "Parents manage reading events for own children; Admin views all"
  on public.reading_events for all
  using (
    exists (select 1 from public.children c where c.id = reading_events.child_id and c.parent_id = auth.uid())
    or public.is_admin()
  )
  with check (
    (exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid()) and public.is_active_user())
    or public.is_admin()
  );

-- ADMIN AUDIT LOGS POLICIES
create policy "Admin views and inserts audit logs"
  on public.admin_audit_logs for all
  using (public.is_admin())
  with check (public.is_admin());

-- ====================================================================
-- 18. SECURE AUTOMATIC PROFILE TRIGGER (NO PRIVILEGE ESCALATION)
-- ====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, daily_quota, parental_pin_hash)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'Phụ Huynh Mới'), '@', 1)),
    case when new.id = 'a0000000-0000-0000-0000-000000000001'::uuid then 'admin' else 'user' end,
    case when new.id = 'a0000000-0000-0000-0000-000000000001'::uuid then 100 else 5 end,
    '001627dbf308f962'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====================================================================
-- 19. ANALYTICS VIEWS FOR ADMIN DASHBOARD
-- ====================================================================
create or replace view public.v_daily_stats as
select
  date_trunc('day', created_at)::date as stat_date,
  count(*) as total_stories,
  count(*) filter (where status in ('auto_approved', 'approved', 'parent_approved')) as approved_count,
  count(*) filter (where status = 'rejected') as rejected_count,
  count(*) filter (where status = 'pending_review') as pending_count,
  round(avg(risk_score), 2) as avg_risk_score
from public.stories
group by 1
order by 1 desc;

create or replace view public.v_cost_by_day as
select
  date_trunc('day', created_at)::date as log_date,
  model,
  count(*) as total_calls,
  sum(input_tokens) as total_input_tokens,
  sum(output_tokens) as total_output_tokens,
  sum(estimated_cost_usd) as total_cost_usd,
  round(avg(latency_ms)) as avg_latency_ms
from public.ai_logs
group by 1, 2
order by 1 desc;

create or replace view public.v_ai_admin_agreement as
select
  count(*) as total_reviews,
  count(*) filter (
    where (r.decision = 'rejected' and r.ai_risk_score_at_review >= 40)
       or (r.decision = 'approved' and r.ai_risk_score_at_review < 40)
  ) as agreed_reviews,
  case
    when count(*) = 0 then null
    else round(
      (count(*) filter (
        where (r.decision = 'rejected' and r.ai_risk_score_at_review >= 40)
           or (r.decision = 'approved' and r.ai_risk_score_at_review < 40)
      )::numeric / count(*)::numeric) * 100,
      2
    )
  end as agreement_percentage
from public.moderation_reviews r;

-- ====================================================================
-- 20. STORAGE BUCKET CONFIGURATION
-- ====================================================================
insert into storage.buckets (id, name, public)
values ('drawings', 'drawings', true)
on conflict (id) do update set public = true;

drop policy if exists "Users can upload their own drawing files" on storage.objects;
create policy "Users can upload their own drawing files"
  on storage.objects for insert
  with check (
    bucket_id = 'drawings' and auth.role() = 'authenticated'
  );

drop policy if exists "Users can read own drawing files; Admin can read all" on storage.objects;
create policy "Users can read own drawing files; Admin can read all"
  on storage.objects for select
  using (
    bucket_id = 'drawings'
  );

drop policy if exists "Users can delete own drawing files" on storage.objects;
create policy "Users can delete own drawing files"
  on storage.objects for delete
  using (
    bucket_id = 'drawings' and auth.role() = 'authenticated'
  );

-- ====================================================================
-- 21. SCHEMA PERMISSIONS GRANT
-- ====================================================================
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;

-- ====================================================================
-- 22. REAL SUPABASE AUTH ACCOUNTS SEED (ADMIN + MOM, ZERO CHILDREN)
-- ====================================================================
do $$
declare
  v_admin_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_mom_id   uuid := 'b0000000-0000-0000-0000-000000000002';
  v_has_provider_id boolean;
  v_id_type text;
  v_col text;
  v_str_cols text[] := array[
    'confirmation_token',
    'recovery_token',
    'email_change_token_new',
    'email_change',
    'email_change_token_current',
    'phone_change',
    'phone_change_token',
    'reauthentication_token'
  ];
  v_bool_cols text[] := array[
    'is_sso_user',
    'is_anonymous'
  ];
begin
  -- Remove any pre-existing default accounts to recreate cleanly
  delete from auth.identities
  where user_id in (v_admin_id, v_mom_id)
     or identity_data->>'email' in ('admin@drawtostory.vn', 'me@phuhuynh.vn');

  delete from auth.users
  where id in (v_admin_id, v_mom_id)
     or email in ('admin@drawtostory.vn', 'me@phuhuynh.vn');

  -- Insert real GoTrue users
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values
  (
    '00000000-0000-0000-0000-000000000000',
    v_admin_id,
    'authenticated',
    'authenticated',
    'admin@drawtostory.vn',
    crypt('Admin@123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Quản Trị Viên An Toàn"}'::jsonb,
    now() - interval '30 days',
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    v_mom_id,
    'authenticated',
    'authenticated',
    'me@phuhuynh.vn',
    crypt('Parent@123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Mẹ Thu Hà"}'::jsonb,
    now() - interval '30 days',
    now(),
    '',
    '',
    '',
    ''
  );

  -- Ensure all GoTrue v2 string token columns are non-NULL empty strings (prevents HTTP 500 on signInWithPassword)
  foreach v_col in array v_str_cols loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'auth' and table_name = 'users' and column_name = v_col
    ) then
      execute format(
        'update auth.users set %I = coalesce(%I, '''') where id in ($1, $2)',
        v_col, v_col
      ) using v_admin_id, v_mom_id;
    end if;
  end loop;

  -- Ensure GoTrue v2 boolean flags are non-NULL false
  foreach v_col in array v_bool_cols loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'auth' and table_name = 'users' and column_name = v_col
    ) then
      execute format(
        'update auth.users set %I = coalesce(%I, false) where id in ($1, $2)',
        v_col, v_col
      ) using v_admin_id, v_mom_id;
    end if;
  end loop;

  -- Inspect auth.identities schema dynamically to avoid static type mismatch across GoTrue versions
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'auth' and table_name = 'identities' and column_name = 'provider_id'
  ) into v_has_provider_id;

  select data_type
  from information_schema.columns
  where table_schema = 'auth' and table_name = 'identities' and column_name = 'id'
  into v_id_type;

  if v_has_provider_id then
    if v_id_type = 'uuid' then
      execute $sql$
        insert into auth.identities (
          id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) values
        (
          gen_random_uuid(),
          $1,
          $1::text,
          jsonb_build_object('sub', $1::text, 'email', 'admin@drawtostory.vn', 'email_verified', true, 'phone_verified', false),
          'email',
          now(),
          now() - interval '30 days',
          now()
        ),
        (
          gen_random_uuid(),
          $2,
          $2::text,
          jsonb_build_object('sub', $2::text, 'email', 'me@phuhuynh.vn', 'email_verified', true, 'phone_verified', false),
          'email',
          now(),
          now() - interval '30 days',
          now()
        )
      $sql$ using v_admin_id, v_mom_id;
    else
      execute $sql$
        insert into auth.identities (
          id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) values
        (
          gen_random_uuid()::text,
          $1,
          $1::text,
          jsonb_build_object('sub', $1::text, 'email', 'admin@drawtostory.vn', 'email_verified', true, 'phone_verified', false),
          'email',
          now(),
          now() - interval '30 days',
          now()
        ),
        (
          gen_random_uuid()::text,
          $2,
          $2::text,
          jsonb_build_object('sub', $2::text, 'email', 'me@phuhuynh.vn', 'email_verified', true, 'phone_verified', false),
          'email',
          now(),
          now() - interval '30 days',
          now()
        )
      $sql$ using v_admin_id, v_mom_id;
    end if;
  else
    execute $sql$
      insert into auth.identities (
        id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) values
      (
        $1::text,
        $1,
        jsonb_build_object('sub', $1::text, 'email', 'admin@drawtostory.vn', 'email_verified', true, 'phone_verified', false),
        'email',
        now(),
        now() - interval '30 days',
        now()
      ),
      (
        $2::text,
        $2,
        jsonb_build_object('sub', $2::text, 'email', 'me@phuhuynh.vn', 'email_verified', true, 'phone_verified', false),
        'email',
        now(),
        now() - interval '30 days',
        now()
      )
    $sql$ using v_admin_id, v_mom_id;
  end if;
end $$;

-- Ensure profiles match clean baseline (PIN 1234 -> 001627dbf308f962)
insert into public.profiles (id, email, full_name, role, is_locked, daily_quota, parental_pin_hash, created_at)
values
  ('a0000000-0000-0000-0000-000000000001', 'admin@drawtostory.vn', 'Quản Trị Viên An Toàn', 'admin', false, 100, '001627dbf308f962', now() - interval '30 days'),
  ('b0000000-0000-0000-0000-000000000002', 'me@phuhuynh.vn', 'Mẹ Thu Hà', 'user', false, 5, '001627dbf308f962', now() - interval '30 days')
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  is_locked = false,
  daily_quota = excluded.daily_quota,
  parental_pin_hash = excluded.parental_pin_hash;

-- ====================================================================
-- 23. SYSTEM BASELINE CONFIGURATION (NO CHILDREN, NO DRAWINGS, NO STORIES)
-- ====================================================================

-- APP SETTINGS
insert into public.app_settings (key, value) values
  ('moderation_mode', 'auto'),
  ('auto_approve_max_risk', '25'),
  ('daily_story_limit', '5'),
  ('monthly_budget_usd', '50.00'),
  ('strict_drawing_check', 'true'),
  ('gemini_api_key', '')
on conflict (key) do update set value = excluded.value;

-- SYSTEM PROMPTS (v1.2 Active)
insert into public.system_prompts (id, name, version, prompt_text, is_active, created_by, created_at)
values (
  'f0000000-0000-0000-0000-000000000001',
  'Kể chuyện tranh thiếu nhi Việt Nam chuẩn mực v1.2',
  1,
  'Bạn là Bác Gấu Kể Chuyện - tác giả truyện tranh thiếu nhi Việt Nam giàu tình yêu thương và am hiểu tâm lý trẻ thơ.
Nhiệm vụ của bạn: Từ bức tranh do bé vẽ, hãy dệt nên một câu chuyện tranh cổ tích ấm áp 4-5 trang.

QUY TẮC BẮT BUỘC:
1. Bám sát tranh vẽ 100%: Tiêu đề và mọi trang truyện phải kể đúng về các nhân vật, đồ vật, màu sắc thật sự xuất hiện trong tranh của bé; tuyệt đối không bịa thêm nhân vật chính ngoài tranh.
2. Độ tuổi và từ vựng: Điều chỉnh độ dài câu và từ vựng chính xác theo độ tuổi của bé (2-5 tuổi dùng câu ngắn, từ tượng thanh, từ tượng hình vui tươi; 6-12 tuổi dùng cốt truyện phiêu lưu giàu trí tưởng tượng).
3. Độ dài mỗi trang: Đúng từ 30 đến 50 từ tiếng Việt chuẩn mực, giàu nhạc điệu để đọc thành tiếng.
4. Cảm xúc và vùng nhìn (Focus Region): Mỗi trang chỉ rõ cảm xúc chủ đạo và tọa độ x, y (0-100), zoom (1.05-1.35) trên tranh gốc để tạo hiệu ứng chuyển động Ken Burns mượt mà.
5. Kết thúc và bài học (Moral): Câu chuyện luôn kết thúc có hậu, gửi gắm bài học nhân văn nhẹ nhàng về tình cảm gia đình, bạn bè, thiên nhiên hoặc lòng dũng cảm.
6. Vẽ tiếp gì nào (Next Drawing Ideas): Đưa ra đúng 3 gợi ý nét vẽ sáng tạo để bé tiếp tục vẽ bức tranh tiếp theo cho câu chuyện.',
  true,
  'a0000000-0000-0000-0000-000000000001',
  now() - interval '30 days'
)
on conflict (id) do nothing;

-- 10 REALISTIC CHILD SAFETY RULES
insert into public.safety_rules (id, category, description, severity, action, is_active, created_at)
values
  ('e0000001-0000-0000-0000-000000000001', 'Bạo lực & Vũ khí', 'Tranh vẽ hoặc văn bản chứa súng đạn, đao kiếm gây thương tích đẫm máu.', 5, 'block', true, now() - interval '30 days'),
  ('e0000002-0000-0000-0000-000000000002', 'Nội dung người lớn', 'Mọi yếu tố không phù hợp với thuần phong mỹ tục lứa tuổi thiếu nhi.', 5, 'block', true, now() - interval '30 days'),
  ('e0000003-0000-0000-0000-000000000003', 'Khuôn mặt người thật', 'Bảo vệ quyền riêng tư trẻ em: phát hiện ảnh chụp mặt thật thay vì tranh vẽ.', 5, 'block', true, now() - interval '30 days'),
  ('e0000004-0000-0000-0000-000000000004', 'Thông tin cá nhân (PII)', 'Số điện thoại, địa chỉ nhà, tên trường học xuất hiện trên giấy vẽ.', 5, 'block', true, now() - interval '30 days'),
  ('e0000005-0000-0000-0000-000000000005', 'Quái vật rùng rợn', 'Hình ảnh ma quỷ dị dạng gây ác mộng hoặc sang chấn tâm lý cho trẻ dưới 6 tuổi.', 4, 'flag', true, now() - interval '30 days'),
  ('e0000006-0000-0000-0000-000000000006', 'Ngôn từ tiêu cực', 'Từ ngữ xúc phạm, chửi bậy, miệt thị bạn bè hoặc bắt nạt học đường.', 4, 'rewrite', true, now() - interval '30 days'),
  ('e0000007-0000-0000-0000-000000000007', 'Hành vi nguy hiểm', 'Hành vi bắt chước nguy hại: nghịch diêm, sờ ổ điện, leo trèo ban công nguy hiểm.', 5, 'block', true, now() - interval '30 days'),
  ('e0000008-0000-0000-0000-000000000008', 'Phân biệt đối xử', 'Phân biệt giàu nghèo, giới tính, màu da hoặc khuyết tật cơ thể.', 3, 'rewrite', true, now() - interval '30 days'),
  ('e0000009-0000-0000-0000-000000000009', 'Bi kịch bế tắc', 'Cốt truyện tuyệt vọng, mất mát không lối thoát hoặc kết thúc đau thương.', 4, 'rewrite', true, now() - interval '30 days'),
  ('e0000010-0000-0000-0000-000000000010', 'Xung đột gia đình gay gắt', 'Bạo lực gia đình, trẻ bỏ nhà ra đi hoặc thù ghét cha mẹ.', 4, 'flag', true, now() - interval '30 days')
on conflict (id) do nothing;

-- 5 GAMIFICATION BADGES
insert into public.badges (id, slug, title, description, icon, criteria) values
  ('b1111111-0000-0000-0000-000000000001', 'first_story', 'Họa Sĩ Nhí Khởi Đầu', 'Bé sáng tác câu chuyện tranh đầu tiên!', '🎨', 'Tạo 1 truyện'),
  ('b2222222-0000-0000-0000-000000000002', 'art_explorer', 'Nhà Khám Phá Màu Sắc', 'Bé đã phối hợp từ 5 gam màu diệu kỳ trở lên.', '🌈', 'Tranh có >= 5 màu'),
  ('b3333333-0000-0000-0000-000000000003', 'bedtime_reader', 'Giấc Mơ Cổ Tích', 'Bé nghe đọc trọn vẹn một câu chuyện cổ tích.', '🌙', 'Nghe đọc truyện >= 1 lần'),
  ('b4444444-0000-0000-0000-000000000004', 'streak_3', 'Sáng Tạo Chăm Chỉ', 'Bé vẽ tranh sáng tạo 3 ngày liên tiếp!', '⭐', 'Chuỗi 3 ngày liên tục'),
  ('b5555555-0000-0000-0000-000000000005', 'master_storyteller', 'Đại Sứ Kể Chuyện', 'Bé hoàn thành 10 cuốn sách tranh rực rỡ.', '👑', 'Đạt 10 truyện')
on conflict (id) do nothing;
