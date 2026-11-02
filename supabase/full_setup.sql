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

-- ====================================================================
-- SEED DATA: seed.sql
-- PROJECT: DrawToStory - Child-Safe AI Storyteller
-- ====================================================================

-- 1. CLEANUP PREVIOUS SEED DATA IF PRESENT
delete from public.reading_events;
delete from public.user_badges;
delete from public.badges;
delete from public.moderation_reviews;
delete from public.ai_logs;
delete from public.story_pages;
delete from public.stories;
delete from public.drawings;
delete from public.children;
delete from public.app_settings;
delete from public.safety_rules;
delete from public.system_prompts;
delete from public.profiles;

-- 2. APP SETTINGS
insert into public.app_settings (key, value) values
  ('moderation_mode', 'auto'),
  ('auto_approve_max_risk', '25'),
  ('daily_story_limit', '5'),
  ('monthly_budget_usd', '50.00'),
  ('strict_drawing_check', 'true');

-- 3. PROFILES (1 Admin + 2 Demo Parents)
-- Note: id uuid format
insert into public.profiles (id, full_name, role, is_locked, daily_quota, parental_pin_hash, created_at)
values
  ('a0000000-0000-0000-0000-000000000001', 'Quản Trị Viên An Toàn', 'admin', false, 100, '1234', now() - interval '30 days'),
  ('b0000000-0000-0000-0000-000000000002', 'Mẹ Thu Hà', 'user', false, 5, '1234', now() - interval '30 days'),
  ('c0000000-0000-0000-0000-000000000003', 'Ba Hải Đăng', 'user', false, 5, '1234', now() - interval '25 days');

-- 4. CHILDREN (Data Minimization: only nicknames, age 2-12, colors/emojis)
insert into public.children (id, parent_id, nickname, age, avatar_color, avatar_emoji, created_at)
values
  ('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000002', 'Bé Bơ', 5, '#FF8FA3', '🥑', now() - interval '28 days'),
  ('22222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-000000000002', 'Sóc Nâu', 8, '#7C6CF0', '🐿️', now() - interval '20 days'),
  ('33333333-3333-3333-3333-333333333333', 'c0000000-0000-0000-0000-000000000003', 'Bé Miu', 4, '#FFF1B8', '🐱', now() - interval '15 days');

-- 5. SYSTEM PROMPTS (1 Active version with child psychology instructions)
insert into public.system_prompts (id, name, version, prompt_text, is_active, created_by, created_at)
values (
  'p0000000-0000-0000-0000-000000000001',
  'Kể chuyện tranh thiếu nhi Việt Nam chuẩn mực v1.2',
  1,
  'Bạn là Bác Gấu Kể Chuyện - tác giả truyện tranh thiếu nhi Việt Nam giàu tình yêu thương và am hiểu tâm lý trẻ thơ.
Nhiệm vụ của bạn: Từ bức tranh do bé vẽ, hãy dệt nên một câu chuyện tranh cổ tích ấm áp 4-5 trang.

QUY TẮC BẮT BUỘC:
1. Độ tuổi và từ vựng: Điều chỉnh độ dài câu và từ vựng chính xác theo độ tuổi của bé (2-5 tuổi dùng câu ngắn, lặp âm vui tươi; 6-12 tuổi dùng cốt truyện phiêu lưu giàu trí tưởng tượng).
2. Độ dài mỗi trang: Đúng từ 30 đến 50 từ tiếng Việt. Giọng văn êm dịu, trong sáng.
3. Cảm xúc và vùng nhìn (Focus Region): Mỗi trang chỉ rõ cảm xúc chủ đạo và tọa độ x, y (0-100), zoom (1.2-2.5) trên tranh gốc để tạo hiệu ứng chuyển động Ken Burns.
4. Kết thúc và bài học (Moral): Câu chuyện luôn kết thúc có hậu, tràn đầy hy vọng, gửi gắm bài học yêu thương gia đình, bảo vệ thiên nhiên hoặc lòng dũng cảm.
5. Vẽ tiếp gì nào (Next Drawing Ideas): Đưa ra đúng 3 gợi ý nét vẽ sáng tạo để bé tiếp tục vẽ bức tranh tiếp theo cho câu chuyện.',
  true,
  'a0000000-0000-0000-0000-000000000001',
  now() - interval '30 days'
);

-- 6. 10 REALISTIC SAFETY RULES
insert into public.safety_rules (id, category, description, severity, action, is_active, created_at)
values
  ('r0000001-0000-0000-0000-000000000001', 'Bạo lực & Vũ khí', 'Tranh vẽ hoặc văn bản chứa súng đạn, đao kiếm gây thương tích đẫm máu.', 5, 'block', true, now() - interval '30 days'),
  ('r0000002-0000-0000-0000-000000000002', 'Nội dung người lớn', 'Mọi yếu tố không phù hợp với thuần phong mỹ tục lứa tuổi thiếu nhi.', 5, 'block', true, now() - interval '30 days'),
  ('r0000003-0000-0000-0000-000000000003', 'Khuôn mặt người thật', 'Bảo vệ quyền riêng tư trẻ em: phát hiện ảnh chụp mặt thật thay vì tranh vẽ.', 5, 'block', true, now() - interval '30 days'),
  ('r0000004-0000-0000-0000-000000000004', 'Thông tin cá nhân (PII)', 'Số điện thoại, địa chỉ nhà, tên trường học xuất hiện trên giấy vẽ.', 5, 'block', true, now() - interval '30 days'),
  ('r0000005-0000-0000-0000-000000000005', 'Quái vật rùng rợn', 'Hình ảnh ma quỷ dị dạng gây ác mộng hoặc sang chấn tâm lý cho trẻ dưới 6 tuổi.', 4, 'flag', true, now() - interval '30 days'),
  ('r0000006-0000-0000-0000-000000000006', 'Ngôn từ tiêu cực', 'Từ ngữ xúc phạm, chửi bậy, miệt thị bạn bè hoặc bắt nạt học đường.', 4, 'rewrite', true, now() - interval '30 days'),
  ('r0000007-0000-0000-0000-000000000007', 'Hành vi nguy hiểm', 'Hành vi bắt chước nguy hại: nghịch diêm, sờ ổ điện, leo trèo ban công nguy hiểm.', 5, 'block', true, now() - interval '30 days'),
  ('r0000008-0000-0000-0000-000000000008', 'Phân biệt đối xử', 'Phân biệt giàu nghèo, giới tính, màu da hoặc khuyết tật cơ thể.', 3, 'rewrite', true, now() - interval '30 days'),
  ('r0000009-0000-0000-0000-000000000009', 'Bi kịch bế tắc', 'Cốt truyện tuyệt vọng, mất mát không lối thoát hoặc kết thúc đau thương.', 4, 'rewrite', true, now() - interval '30 days'),
  ('r0000010-0000-0000-0000-000000000010', 'Xung đột gia đình gay gắt', 'Bạo lực gia đình, trẻ bỏ nhà ra đi hoặc thù ghét cha mẹ.', 4, 'flag', true, now() - interval '30 days');

-- 7. GAMIFICATION BADGES
insert into public.badges (id, slug, title, description, icon, criteria) values
  ('b1111111-0000-0000-0000-000000000001', 'first_story', 'Họa Sĩ Nhí Khởi Đầu', 'Bé sáng tác câu chuyện tranh đầu tiên!', '🎨', 'Tạo 1 truyện'),
  ('b2222222-0000-0000-0000-000000000002', 'art_explorer', 'Nhà Khám Phá Màu Sắc', 'Bé đã phối hợp hơn 5 gam màu diệu kỳ.', '🌈', 'Tranh có >= 5 màu'),
  ('b3333333-0000-0000-0000-000000000003', 'bedtime_reader', 'Giấc Mơ Cổ Tích', 'Bé nghe đọc truyện ru ngủ trước giờ đi ngủ.', '🌙', 'Nghe chế độ ru ngủ 1 lần'),
  ('b4444444-0000-0000-0000-000000000004', 'streak_3', 'Sáng Tạo Chăm Chỉ', 'Bé vẽ tranh 3 ngày liên tiếp!', '⭐', 'Chuỗi 3 ngày liên tục'),
  ('b5555555-0000-0000-0000-000000000005', 'master_storyteller', 'Đại Sứ Kể Chuyện', 'Bé hoàn thành 10 cuốn sách tranh rực rỡ.', '👑', 'Đạt 10 truyện');

-- Award badges to demo children
insert into public.user_badges (child_id, badge_id, awarded_at) values
  ('11111111-1111-1111-1111-111111111111', 'b1111111-0000-0000-0000-000000000001', now() - interval '20 days'),
  ('11111111-1111-1111-1111-111111111111', 'b2222222-0000-0000-0000-000000000002', now() - interval '10 days'),
  ('22222222-2222-2222-2222-222222222222', 'b1111111-0000-0000-0000-000000000001', now() - interval '18 days');

-- 8. CORE DEMO STORIES & DRAWINGS
-- Story 1: Chú Voi Con và Cầu Vồng Trên Đồi Mây (Bé Bơ - 5 tuổi)
insert into public.drawings (id, child_id, image_path, ai_analysis, created_at)
values (
  'd0000001-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'b0000000-0000-0000-0000-000000000002/11111111-1111-1111-1111-111111111111/elephant_rainbow.jpg',
  '{"is_drawing": true, "contains_real_person_face": false, "pii_detected": false, "mood": "hân hoan", "colors": ["hồng", "xanh da trời", "vàng"], "objects": ["chú voi", "cầu vồng", "đám mây", "bông hoa"], "characters": ["Voi Bông"], "risk_categories": []}'::jsonb,
  now() - interval '5 days'
);

insert into public.stories (
  id, child_id, drawing_id, title, summary, moral, status, risk_score, risk_reasons,
  share_token, is_shared, model, next_drawing_ideas, created_at
) values (
  's0000001-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'd0000001-0000-0000-0000-000000000001',
  'Chú Voi Hồng và Chiếc Cầu Vồng Biết Cười',
  'Chú voi con mang đôi tai hồng đáng yêu tìm thấy chiếc cầu vồng lấp lánh sau cơn mưa rào mùa hạ.',
  'Niềm vui sẽ nhân đôi khi con biết sẻ chia những điều rực rỡ cùng bạn bè xung quanh.',
  'auto_approved',
  8,
  '[]'::jsonb,
  'voi-hong-cau-vong-share',
  true,
  'gemini-2.5-flash',
  '["Vẽ thêm bạn bướm vàng bay quanh tai voi", "Vẽ một cái ao nhỏ có giọt nước bắn tung tóe", "Vẽ mặt trời đeo kính râm mỉm cười"]'::jsonb,
  now() - interval '5 days'
);

insert into public.story_pages (story_id, page_number, text_content, emotion, focus_region, created_at)
values
  ('s0000001-0000-0000-0000-000000000001', 1, 'Trên ngọn đồi cỏ xanh ngắt, có một chú voi con tên là Bông. Bông có đôi tai màu hồng phấn rất đặc biệt và chiếc vòi nhỏ lúc nào cũng lắc lư theo điệu nhạc của gió.', 'hân hoan', '{"x": 35, "y": 60, "zoom": 1.4}'::jsonb, now() - interval '5 days'),
  ('s0000001-0000-0000-0000-000000000001', 2, 'Một buổi chiều sau cơn mưa rào, bầu trời bỗng sáng bừng lên. Một dải cầu vồng bảy sắc lung linh vắt ngang qua sườn đồi, cong cong như nụ cười ngọt ngào của mẹ thiên nhiên.', 'ngạc nhiên', '{"x": 70, "y": 25, "zoom": 1.6}'::jsonb, now() - interval '5 days'),
  ('s0000001-0000-0000-0000-000000000001', 3, 'Voi Bông thích thú giơ cao chiếc vòi nhỏ, thổi những bong bóng nước lấp lánh bay lên. Từng hạt nước chạm vào cầu vồng liền hóa thành những nốt nhạc vui nhộn reo vang.', 'thích thú', '{"x": 50, "y": 50, "zoom": 1.8}'::jsonb, now() - interval '5 days'),
  ('s0000001-0000-0000-0000-000000000001', 4, 'Các bạn sóc nâu, thỏ trắng từ trong rừng cùng ùa ra nhảy múa. Bông nhận ra rằng, cảnh đẹp nhất không phải là ngắm nhìn một mình, mà là được cùng bạn bè cười thật giòn.', 'ấm áp', '{"x": 45, "y": 70, "zoom": 1.3}'::jsonb, now() - interval '5 days');

-- 9. 30-DAY HISTORICAL DATA FOR CHARTS (generate_series)
-- Generate daily ai_logs and stories for past 30 days
do $$
declare
  d int;
  curr_date timestamptz;
  st_id uuid;
  risk int;
  st_status text;
  decision text;
begin
  for d in reverse 30..1 loop
    curr_date := now() - (d || ' days')::interval + (random() * interval '8 hours');
    
    -- Simulate 2 to 6 stories per day
    for i in 1..(2 + floor(random() * 5)::int) loop
      st_id := gen_random_uuid();
      risk := floor(random() * 60)::int;
      
      if risk > 45 then
        st_status := 'rejected';
      elsif risk > 25 then
        st_status := 'pending_review';
      else
        st_status := 'auto_approved';
      end if;

      -- Insert story
      insert into public.stories (
        id, child_id, drawing_id, title, summary, moral, status, risk_score, risk_reasons,
        share_token, is_shared, model, next_drawing_ideas, created_at
      ) values (
        st_id,
        '11111111-1111-1111-1111-111111111111',
        'd0000001-0000-0000-0000-000000000001',
        'Chuyến phiêu lưu ngày ' || to_char(curr_date, 'DD/MM'),
        'Câu chuyện diệu kỳ về thiên nhiên và tình bạn thương mến.',
        'Hãy luôn yêu thương gia đình và bạn bè quanh con.',
        st_status,
        risk,
        case when risk > 25 then '[{"category": "Ngôn từ hoặc hình ảnh", "description": "Cần kiểm tra sắc thái từ vựng", "severity": 3}]'::jsonb else '[]'::jsonb end,
        encode(gen_random_bytes(12), 'hex'),
        false,
        'gemini-2.5-flash',
        '["Vẽ thêm một bông hoa to", "Vẽ bạn ong chăm chỉ", "Vẽ bầu trời sao đêm"]'::jsonb,
        curr_date
      );

      -- Insert corresponding AI Log
      insert into public.ai_logs (
        id, user_id, story_id, action, model, input_tokens, output_tokens, latency_ms,
        estimated_cost_usd, status, error_code, created_at
      ) values (
        gen_random_uuid(),
        'b0000000-0000-0000-0000-000000000002',
        st_id,
        'generate_story',
        'gemini-2.5-flash',
        850 + floor(random() * 350)::int,
        450 + floor(random() * 250)::int,
        1800 + floor(random() * 1200)::int,
        0.000850 + (random() * 0.000600)::numeric(10, 6),
        'success',
        null,
        curr_date
      );

      -- If pending or rejected, add a moderation review with 85% agreement
      if risk > 25 then
        decision := case when risk > 40 then 'rejected' else 'approved' end;
        insert into public.moderation_reviews (
          id, story_id, admin_id, decision, reason, ai_risk_score_at_review, created_at
        ) values (
          gen_random_uuid(),
          st_id,
          'a0000000-0000-0000-0000-000000000001',
          decision,
          case when decision = 'rejected' then 'Hình ảnh có chi tiết hơi sắc nhọn cần bé vẽ mềm mại hơn.' else 'Nội dung phù hợp sau khi xem xét ngữ cảnh.' end,
          risk,
          curr_date + interval '15 minutes'
        );
      end if;
    end loop;
  end loop;
end $$;

-- 10. CURRENT PENDING REVIEW QUEUE ITEMS (For Admin Moderation Queue testing)
insert into public.drawings (id, child_id, image_path, ai_analysis, created_at)
values (
  'd0000002-0000-0000-0000-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'b0000000-0000-0000-0000-000000000002/22222222-2222-2222-2222-222222222222/monster_forest.jpg',
  '{"is_drawing": true, "contains_real_person_face": false, "pii_detected": false, "mood": "hơi hồi hộp", "colors": ["tím đậm", "xanh lá", "đen"], "objects": ["rừng cây", "bóng dáng to lớn", "ánh mắt sáng"], "characters": ["Bóng Khổng Lồ"], "risk_categories": ["Quái vật rùng rợn"]}'::jsonb,
  now() - interval '2 hours'
);

insert into public.stories (
  id, child_id, drawing_id, title, summary, moral, status, risk_score, risk_reasons,
  share_token, is_shared, model, next_drawing_ideas, created_at
) values (
  's0000002-0000-0000-0000-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'd0000002-0000-0000-0000-000000000002',
  'Bí Mật Dưới Bóng Rừng Già',
  'Sóc Nâu tình cờ gặp một bóng đen to lớn trong rừng sâu, nhưng hóa ra đó là một người bạn khổng lồ rất hiền lành.',
  'Đừng vội sợ hãi những điều mới lạ trước khi con kịp tìm hiểu với tấm lòng rộng mở.',
  'pending_review',
  35,
  '[{"category": "Quái vật rùng rợn", "description": "Hình vẽ bóng đen to lớn có thể gây bất an nhẹ cho trẻ nhỏ, cần duyệt văn phong tích cực.", "severity": 3}]'::jsonb,
  'soc-nau-bong-rung-share',
  false,
  'gemini-2.5-flash',
  '["Vẽ thêm chiếc đèn pin tỏa ánh sáng vàng", "Vẽ bạn khổng lồ đang chia táo cho muông thú", "Vẽ nụ cười thân thiện"]'::jsonb,
  now() - interval '2 hours'
);

insert into public.story_pages (story_id, page_number, text_content, emotion, focus_region, created_at)
values
  ('s0000002-0000-0000-0000-000000000002', 1, 'Hôm ấy, bạn Sóc Nâu mải mê nhặt những hạt dẻ vàng óng trong khu rừng già. Càng đi sâu, ánh mặt trời càng mờ dần sau những tán lá rậm rạp.', 'hồi hộp', '{"x": 20, "y": 30, "zoom": 1.3}'::jsonb, now() - interval '2 hours'),
  ('s0000002-0000-0000-0000-000000000002', 2, 'Bỗng nhiên, một cái bóng to sừng sững xuất hiện phía sau gốc cây cổ thụ. Đôi mắt to tròn chớp chớp trong màn đêm yên tĩnh khiến Sóc Nâu giật mình nép vào bụi cỏ.', 'lo lắng', '{"x": 60, "y": 45, "zoom": 1.7}'::jsonb, now() - interval '2 hours'),
  ('s0000002-0000-0000-0000-000000000002', 3, 'Nhưng kìa! Bàn tay to lớn chìa ra, không phải để dọa nạt, mà là nâng niu một chú chim non bị rơi khỏi tổ. Đó là Bác Khổng Lồ Rừng Xanh tốt bụng!', 'ngạc nhiên', '{"x": 50, "y": 70, "zoom": 1.5}'::jsonb, now() - interval '2 hours'),
  ('s0000002-0000-0000-0000-000000000002', 4, 'Sóc Nâu thở phào mỉm cười. Cả hai cùng đưa chú chim về tổ ấm. Khu rừng bỗng chốc trở nên ấm áp và ngập tràn tình yêu thương.', 'vui sướng', '{"x": 40, "y": 50, "zoom": 1.2}'::jsonb, now() - interval '2 hours');

