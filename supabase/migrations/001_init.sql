-- ====================================================================
-- MIGRATION: 001_init.sql
-- PROJECT: DrawToStory - Child-Safe AI Storyteller
-- AUTHOR: Principal AI Architect & Full-stack Engineer
-- ====================================================================

-- 1. EXTENSIONS & TYPES
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. SECURITY DEFINER HELPER FUNCTIONS
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_locked = false
  );
$$;

-- 3. PROFILES TABLE
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_locked boolean not null default false,
  daily_quota integer not null default 5,
  parental_pin_hash text default '1234',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index
create index idx_profiles_role on public.profiles(role);

-- 4. CHILDREN TABLE (Minimization: No full names, no photos, no PII)
create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  nickname text not null,
  age integer not null check (age between 2 and 12),
  avatar_color text not null default '#FF8FA3',
  avatar_emoji text not null default '🥑',
  created_at timestamptz not null default now()
);

create index idx_children_parent on public.children(parent_id);

-- 5. DRAWINGS TABLE
create table public.drawings (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  image_path text not null,
  ai_analysis jsonb,
  created_at timestamptz not null default now()
);

create index idx_drawings_child on public.drawings(child_id);

-- 6. SYSTEM PROMPTS TABLE (Versioned)
create table public.system_prompts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null default 1,
  prompt_text text not null,
  is_active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_system_prompts_active on public.system_prompts(is_active);

-- 7. STORIES TABLE
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  drawing_id uuid not null references public.drawings(id) on delete cascade,
  title text not null,
  summary text not null,
  moral text not null,
  status text not null default 'generating' check (
    status in ('generating', 'auto_approved', 'pending_review', 'approved', 'rejected', 'failed')
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

create index idx_stories_child on public.stories(child_id);
create index idx_stories_status on public.stories(status);
create index idx_stories_share_token on public.stories(share_token);
create index idx_stories_created_at on public.stories(created_at desc);

-- 8. STORY PAGES TABLE
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

create index idx_story_pages_story on public.story_pages(story_id, page_number);

-- 9. SAFETY RULES TABLE
create table public.safety_rules (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null,
  severity integer not null check (severity between 1 and 5),
  action text not null check (action in ('block', 'flag', 'rewrite')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_safety_rules_active on public.safety_rules(is_active);

-- 10. MODERATION REVIEWS TABLE
create table public.moderation_reviews (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  admin_id uuid not null references public.profiles(id),
  decision text not null check (decision in ('approved', 'rejected')),
  reason text not null,
  ai_risk_score_at_review integer not null,
  created_at timestamptz not null default now()
);

create index idx_mod_reviews_story on public.moderation_reviews(story_id);
create index idx_mod_reviews_admin on public.moderation_reviews(admin_id);

-- 11. AI LOGS TABLE
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

create index idx_ai_logs_user on public.ai_logs(user_id);
create index idx_ai_logs_created_at on public.ai_logs(created_at desc);

-- 12. APP SETTINGS TABLE
create table public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- 13. GAMIFICATION: BADGES & USER BADGES
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

create index idx_user_badges_child on public.user_badges(child_id);

-- 14. READING EVENTS TABLE (Reading history & analytics)
create table public.reading_events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  listened_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_reading_events_child on public.reading_events(child_id);

-- 15. ADMIN AUDIT LOGS TABLE
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_admin on public.admin_audit_logs(admin_id);
create index idx_audit_logs_created_at on public.admin_audit_logs(created_at desc);

-- ====================================================================
-- 16. ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
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

-- PROFILES POLICIES
create policy "Users can view own profile or admin views all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own non-sensitive profile columns"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (
    -- User cannot escalate their own role or unlock themselves if locked
    (auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid()) and is_locked = false)
    or public.is_admin()
  );

-- CHILDREN POLICIES
create policy "Parents can CRUD own children, Admin can read"
  on public.children for all
  using (parent_id = auth.uid() or public.is_admin())
  with check (parent_id = auth.uid() or public.is_admin());

-- DRAWINGS POLICIES
create policy "Parents can CRUD drawings of their children, Admin read"
  on public.drawings for all
  using (
    exists (select 1 from public.children c where c.id = drawings.child_id and c.parent_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.children c where c.id = drawings.child_id and c.parent_id = auth.uid())
    or public.is_admin()
  );

-- STORIES POLICIES
create policy "Parents can view their children stories or shared stories"
  on public.stories for select
  using (
    exists (select 1 from public.children c where c.id = stories.child_id and c.parent_id = auth.uid())
    or (is_shared = true and status in ('auto_approved', 'approved'))
    or public.is_admin()
  );

create policy "Parents can insert stories for their children"
  on public.stories for insert
  with check (
    exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
    or public.is_admin()
  );

create policy "Parents can delete own stories; Admin can update status"
  on public.stories for delete
  using (
    exists (select 1 from public.children c where c.id = stories.child_id and c.parent_id = auth.uid())
    or public.is_admin()
  );

create policy "Admin or system edge functions can update stories"
  on public.stories for update
  using (public.is_admin() or exists (select 1 from public.children c where c.id = stories.child_id and c.parent_id = auth.uid()))
  with check (
    -- Regular parents can only update is_shared flag, not status or risk_score
    (
      exists (select 1 from public.children c where c.id = stories.child_id and c.parent_id = auth.uid())
      and status = (select s.status from public.stories s where s.id = stories.id)
      and risk_score = (select s.risk_score from public.stories s where s.id = stories.id)
    )
    or public.is_admin()
  );

-- STORY PAGES POLICIES
create policy "Access pages if parent or public shared or admin"
  on public.story_pages for select
  using (
    exists (
      select 1 from public.stories s
      join public.children c on c.id = s.child_id
      where s.id = story_pages.story_id
      and (c.parent_id = auth.uid() or (s.is_shared = true and s.status in ('auto_approved', 'approved')) or public.is_admin())
    )
  );

create policy "Admin or system insert story pages"
  on public.story_pages for insert
  with check (
    exists (
      select 1 from public.stories s
      join public.children c on c.id = s.child_id
      where s.id = story_id and (c.parent_id = auth.uid() or public.is_admin())
    )
  );

-- SAFETY RULES POLICIES (Everyone reads active rules; Admin full CRUD)
create policy "Active rules readable by all, Admin full access"
  on public.safety_rules for select
  using (is_active = true or public.is_admin());

create policy "Admin manage safety rules"
  on public.safety_rules for all
  using (public.is_admin())
  with check (public.is_admin());

-- SYSTEM PROMPTS POLICIES
create policy "Active prompt readable by system/admin"
  on public.system_prompts for select
  using (is_active = true or public.is_admin());

create policy "Admin manage system prompts"
  on public.system_prompts for all
  using (public.is_admin())
  with check (public.is_admin());

-- MODERATION REVIEWS POLICIES
create policy "Admin manage moderation reviews"
  on public.moderation_reviews for all
  using (public.is_admin())
  with check (public.is_admin());

-- AI LOGS POLICIES
create policy "User view own logs, Admin view all"
  on public.ai_logs for select
  using (user_id = auth.uid() or public.is_admin());

create policy "System or Admin insert logs"
  on public.ai_logs for insert
  with check (user_id = auth.uid() or public.is_admin() or user_id is null);

-- APP SETTINGS POLICIES
create policy "Anyone can read app settings"
  on public.app_settings for select
  using (true);

create policy "Admin can update app settings"
  on public.app_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- BADGES & USER BADGES POLICIES
create policy "Anyone can read badges"
  on public.badges for select
  using (true);

create policy "User can view own children badges, Admin view all"
  on public.user_badges for select
  using (
    exists (select 1 from public.children c where c.id = user_badges.child_id and c.parent_id = auth.uid())
    or public.is_admin()
  );

create policy "Insert user badges"
  on public.user_badges for insert
  with check (
    exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
    or public.is_admin()
  );

-- READING EVENTS POLICIES
create policy "User manage own children reading events"
  on public.reading_events for all
  using (
    exists (select 1 from public.children c where c.id = reading_events.child_id and c.parent_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
    or public.is_admin()
  );

-- AUDIT LOGS POLICIES
create policy "Admin view and insert audit logs"
  on public.admin_audit_logs for all
  using (public.is_admin())
  with check (public.is_admin());

-- ====================================================================
-- 17. AUTOMATIC PROFILE TRIGGER (ON SIGNUP)
-- ====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, daily_quota, parental_pin_hash)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Phụ Huynh Mới'),
    case when new.email like '%admin%' then 'admin' else 'user' end,
    case when new.email like '%admin%' then 100 else 5 end,
    '1234'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====================================================================
-- 18. ANALYTICS VIEWS FOR ADMIN DASHBOARD
-- ====================================================================

-- View 1: Daily Stats (stories generated, approved, rejected, blocked)
create or replace view public.v_daily_stats as
select
  date_trunc('day', created_at)::date as stat_date,
  count(*) as total_stories,
  count(*) filter (where status in ('auto_approved', 'approved')) as approved_count,
  count(*) filter (where status = 'rejected') as rejected_count,
  count(*) filter (where status = 'pending_review') as pending_count,
  round(avg(risk_score), 2) as avg_risk_score
from public.stories
group by 1
order by 1 desc;

-- View 2: Daily AI Costs & Token Usage
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

-- View 3: AI-Admin Agreement Rate (Measures how closely Admin decisions match AI Risk classification)
create or replace view public.v_ai_admin_agreement as
select
  count(*) as total_reviews,
  count(*) filter (
    where (r.decision = 'rejected' and r.ai_risk_score_at_review >= 40)
       or (r.decision = 'approved' and r.ai_risk_score_at_review < 40)
  ) as agreed_reviews,
  case 
    when count(*) = 0 then 100.0
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
-- 19. STORAGE BUCKET CONFIGURATION (Private Drawings)
-- ====================================================================
insert into storage.buckets (id, name, public)
values ('drawings', 'drawings', false)
on conflict (id) do nothing;

create policy "Users can upload their own drawing files"
  on storage.objects for insert
  with check (
    bucket_id = 'drawings'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "Users can read own drawing files; Admin can read all"
  on storage.objects for select
  using (
    bucket_id = 'drawings'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "Users can delete own drawing files"
  on storage.objects for delete
  using (
    bucket_id = 'drawings'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

