# BÁO CÁO KỸ THUẬT QUẢN TRỊ & HỆ THỐNG KIỂM DUYỆT (04-KY-THUAT-ADMIN.md)
**Dự án: DrawToStory - Hệ thống Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ**  
*Môn học: AI Based Programming - Trường Đại học Phú Xuân*  
*Repository:* [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)

---

## 1. TRIẾT LÝ THIẾT KẾ: "ADMIN CÓ VAI TRÒ THỰC THỤ" & GIAO DIỆN ĐỒNG NHẤT

Trong một ứng dụng Trí Tuệ Nhân Tạo phục vụ trẻ nhỏ, **Quản trị viên là mắt xích sống còn trong chu trình Responsible AI (Human-in-the-loop Governance)**. Toàn bộ **8 trang Quản trị viên** trong `AdminLayout` được thiết kế đồng bộ 100% theo hệ thống token **Modern Storybook** (`bg`, `surface`, `ink`, `brand`, `magic`, `shadow-card`), loại bỏ hoàn toàn các lớp màu cũ và đảm bảo kiểm tra phản hồi lỗi trên mọi thao tác ghi cơ sở dữ liệu:
1. **Tổng quan vận hành thời gian thực (`/admin`)**: Biểu đồ lưu lượng tạo truyện chuyển đổi linh hoạt **7 ngày / 30 ngày**, tỷ lệ đồng thuận AI – Admin trung thực và thống kê phân loại lý do từ chối động từ dữ liệu thật.
2. **Kiểm duyệt nội dung trực quan (`/admin/moderation`)**: Thẩm định các câu chuyện chờ duyệt hoặc bị báo cáo qua giao diện Split View và phím tắt tốc độ cao `A` / `R`.
3. **Cấu hình Kiểm duyệt & Khóa Gemini API (`/admin/settings`)**: Bật/tắt kiểm tra tranh vẽ nghiêm ngặt, chỉnh ngưỡng tự động duyệt và **lưu trực tiếp khóa Google Gemini 2.5 Flash API Key** để vận hành AI thật ngay lập tức.
4. **Quản trị quy tắc an toàn động (`/admin/safety-rules`)**: Thêm, sửa, xóa hoặc bật/tắt tức thì 10+ quy tắc phòng hộ tâm lý trẻ em mà không cần sửa mã nguồn.
5. **Phòng thí nghiệm System Prompt (`/admin/prompts`)**: Quản lý phiên bản prompt, kích hoạt phiên bản đang chạy và **chạy thử nghiệm trực tiếp với Gemini 2.5 Flash** kèm đo lường token, độ trễ, chi phí USD.
6. **Giám sát tài chính & Ngân sách (`/admin/costs`)**: Theo dõi chi phí từng lệnh gọi AI từ `ai_logs`, cập nhật hạn mức ngân sách tháng (`monthly_budget_usd`) và xuất báo cáo CSV.
7. **Quản lý người dùng & Hạn mức (`/admin/users`)**: Tìm kiếm theo tên/email, điều chỉnh `daily_quota` từng gia đình và khóa/mở khóa tài khoản (có cơ chế bảo vệ chống Admin tự khóa chính mình).
8. **Nhật ký kiểm toán (`/admin/audit`)**: Hậu kiểm toàn bộ thao tác quản trị, tự động ánh xạ tên hiển thị của Admin thực hiện và bộ lọc tìm kiếm nhanh.

---

## 2. HÀNG CHỜ KIỂM DUYỆT TRỰC QUAN (`ModerationQueuePage.tsx`)

### 2.1. Đồng Bộ Dữ Liệu Thật & Giao Diện Chia Đôi (Split View)
- Tự động gọi đồng thời `fetchStories()` và `fetchAdminData()` ngay khi mở trang để luôn hiển thị danh sách truyện mới nhất từ Supabase.
- **Cột trái**: Tranh vẽ gốc của bé đặt trong khung giấy chuẩn (`object-contain`), hiển thị danh sách vật thể AI trích xuất được (`grounded_objects`).
- **Cột phải**: Điểm rủi ro (`risk_score`), độ trung thực (`faithfulness_score`), các cờ cảnh báo từ Lớp 3, bài học đạo đức (Moral) và nội dung chi tiết từng trang truyện.

### 2.2. Phím Tắt Phê Duyệt Nhanh & Ghi Nhận Khóa Ngoại Chuẩn
- Bấm phím <kbd>A</kbd>: Phê duyệt tức thì (`approved`), gắn đúng `profile.id` thực tế của Quản trị viên đang đăng nhập, cập nhật trạng thái truyện nguyên tử (không ghi trùng lặp) và lưu lịch sử vào `moderation_reviews` + `admin_audit_logs`.
- Bấm phím <kbd>R</kbd>: Mở hộp thoại từ chối (`rejected`), chọn nhanh 4 lý do sư phạm tích cực hoặc nhập phản hồi riêng cho phụ huynh.
- Hỗ trợ chọn nhiều mục để phê duyệt hàng loạt (**Batch Approve**) với thanh bộ lọc `flex-wrap` không tràn viền trên màn hình nhỏ.

---

## 3. CẤU HÌNH KHÓA GEMINI AI & CÀI ĐẶT KIỂM DUYỆT (`ModerationSettingsPage.tsx`)

Tại `/admin/settings`, Quản trị viên kiểm soát trực tiếp trái tim của Pipeline AI thông qua bảng `public.app_settings`:
- **Thẻ Cấu hình Google Gemini 2.5 Flash API Key**:
  - Cho phép nhập, ẩn/hiện (`rightIcon`) và lưu khóa API Gemini trực tiếp vào `app_settings.gemini_api_key`.
  - Giúp hệ thống kích hoạt ngay Pipeline AI 3 lớp thật và Phòng thí nghiệm Prompt mà không bắt buộc phải cấu hình lại biến môi trường hay redeploy Edge Functions.
- **Công tắc Kiểm tra tranh vẽ nghiêm ngặt (`strict_drawing_check`)**:
  - Khi bật: Lớp 1 kiên quyết từ chối logo (`logo_graphic`), ảnh chụp người/vật thật (`photo`), ảnh chụp màn hình (`screenshot_text`) với mã lỗi `NOT_A_DRAWING`.
- **Chế độ kiểm duyệt (`moderation_mode`) & Ngưỡng rủi ro (`auto_approve_max_risk`)**:
  - Chuyển đổi giữa Tự động duyệt thông minh (`auto`, duyệt ngay khi `risk_score <= auto_approve_max_risk`) và Kiểm duyệt thủ công toàn phần (`manual_all`).

---

## 4. KIẾN TRÚC BẢO MẬT RLS CHỐNG ĐỆ QUY TRÊN SUPABASE POSTGRESQL

Trong `supabase/full_setup.sql`, toàn bộ **14 bảng dữ liệu** và `storage.objects` đều kích hoạt **Row Level Security (RLS)** chặt chẽ, loại bỏ triệt để mọi điều kiện `or auth.uid() is null` hoặc nhận diện quyền qua chuỗi email.

Để ngăn chặn lỗi đệ quy vô hạn (*infinite recursion*) khi chính sách RLS trên bảng `profiles` tự truy vấn lại `profiles`, hệ thống xây dựng bộ hàm `plpgsql SECURITY DEFINER` tối ưu:

```sql
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_is_admin boolean;
begin
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_locked = false
  ) into v_is_admin;
  return coalesce(v_is_admin, false);
end;
$$;
```

Cùng các hàm bổ trợ bảo mật đồng bộ:
- `public.is_active_user()`: Đảm bảo người dùng đã xác thực và **chưa bị khóa (`is_locked = false`)** trước khi cho phép đọc/ghi dữ liệu gia đình.
- `public.get_my_role()` & `public.get_my_quota()`: Khóa chặt cột `role`, `is_locked` và `daily_quota` trong chính sách `profiles_update_own`, ngăn chặn tuyệt đối việc người dùng thường tự nâng quyền lên `admin` hoặc tự tăng hạn mức qua API client.
- `public.is_drawing_in_shared_story(uuid)` & `public.is_child_in_shared_story(uuid)`: Chỉ cho phép khách vãng lai tại `/shared/:token` đọc đúng thông tin bức tranh và biệt danh bé của những cuốn truyện đã duyệt và đang bật `is_shared = true`.

---

## 5. PHÒNG THÍ NGHIỆM PROMPT & QUẢN TRỊ CHI PHÍ THỰC TẾ
- **System Prompt Studio (`/admin/prompts`)**: Tích hợp `StoryGenerationService.runPromptPlayground()` gửi trực tiếp prompt thử nghiệm lên Gemini 2.5 Flash, trả về bản xem trước câu chuyện hoàn chỉnh cùng số liệu đo đạc thực tế (`tokens_input`, `tokens_output`, `latency_ms`, `cost_usd`).
- **Chi phí & Hạn mức (`/admin/costs`)**: Tổng hợp chi phí thời gian thực từ `public.ai_logs` và view `v_cost_by_day`, cho phép Admin điều chỉnh ngân sách mục tiêu hàng tháng (`updateMonthlyBudget`) và xuất toàn bộ nhật ký ra tệp CSV chuẩn UTF-8.
