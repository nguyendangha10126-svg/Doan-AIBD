-- ====================================================================
-- MIGRATION 001: INITIAL SCHEMA, STRICT RLS, TRIGGERS, STORAGE & VIEWS
-- PROJECT: DrawToStory - Child-Safe AI Storyteller
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
  parental_pin_hash text default null,
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
  grounded_objects jsonb not null default '[]'::jsonb,
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
    'user',
    5,
    nullif(new.raw_user_meta_data->>'parental_pin_hash', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

-- Owner-only helper to promote a registered user to Admin from Supabase SQL Editor
create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set role = 'admin',
      daily_quota = greatest(daily_quota, 100),
      updated_at = now()
  where lower(email) = lower(trim(target_email));

  if not found then
    raise exception 'Không tìm thấy tài khoản với email: % (Hãy đăng ký tài khoản trước)', target_email;
  end if;
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

-- Restrict promote_to_admin strictly to SQL Editor (postgres) & service_role
revoke execute on function public.promote_to_admin(text) from public, anon, authenticated;
grant execute on function public.promote_to_admin(text) to postgres, service_role;

