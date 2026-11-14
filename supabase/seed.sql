-- ====================================================================
-- PRODUCTION CLEAN SEED: SYSTEM SETTINGS, PROMPTS, SAFETY RULES & BADGES
-- PROJECT: DrawToStory - Child-Safe AI Storyteller
-- ====================================================================
-- SECURITY NOTE:
-- Tuyệt đối KHÔNG lưu mật khẩu tài khoản hay API Key công khai trong file SQL!
-- Cách khởi tạo tài khoản Phụ huynh & Quản trị viên an toàn:
--   1. Đăng ký tài khoản qua trang /register của ứng dụng (hoặc Supabase Auth -> Users -> Add user)
--      với mật khẩu mạnh riêng tư của bạn.
--   2. Để nâng cấp một tài khoản thành Quản trị viên (Admin), chạy lệnh sau trong Supabase SQL Editor:
--        select public.promote_to_admin('dia-chi-email-admin-cua-ban@domain.com');
--   3. Cấu hình GEMINI_API_KEY trong Supabase Edge Function Secrets (KHÔNG lưu ở bảng app_settings):
--        supabase secrets set GEMINI_API_KEY=AIzaSy...
-- ====================================================================

set search_path = public, extensions;

-- Xóa mọi key nhạy cảm cũ nếu từng tồn tại trong app_settings
delete from public.app_settings where key = 'gemini_api_key';

-- APP SETTINGS (Chỉ chứa tham số vận hành không nhạy cảm)
insert into public.app_settings (key, value) values
  ('moderation_mode', 'auto'),
  ('auto_approve_max_risk', '25'),
  ('daily_story_limit', '5'),
  ('monthly_budget_usd', '50.00'),
  ('strict_drawing_check', 'true')
on conflict (key) do update set value = excluded.value;

-- SYSTEM PROMPTS (v1.2 Active — created_by = null để độc lập với danh sách user ban đầu)
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
  null,
  now() - interval '30 days'
)
on conflict (id) do update set
  name = excluded.name,
  prompt_text = excluded.prompt_text,
  is_active = excluded.is_active;

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
