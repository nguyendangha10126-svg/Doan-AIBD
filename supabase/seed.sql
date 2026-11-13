-- ====================================================================
-- PRODUCTION CLEAN SEED: REAL AUTH USERS (ADMIN + MOM), SETTINGS, RULES & BADGES
-- PROJECT: DrawToStory - Child-Safe AI Storyteller
-- ====================================================================

set search_path = public, extensions;

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

