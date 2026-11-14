# BÁO CÁO KỸ THUẬT QUẢN TRỊ & HỆ THỐNG KIỂM DUYỆT (04-KY-THUAT-ADMIN.md)
**Dự án: DrawToStory - Hệ thống Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ**  
*Môn học: AI Based Programming - Trường Đại học Phú Xuân*  
*Repository:* [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)

---

## 1. TỔNG QUAN CỔNG QUẢN TRỊ 8 TRANG (LAZY-LOADED & RECHARTS 3)

Toàn bộ phân hệ Quản trị viên (`AdminLayout` và 8 trang chuyên biệt) được tải lười (`React.lazy`) chỉ khi tài khoản có `role = 'admin'` đã xác thực qua `AdminRoute`, đồng bộ 100% theo thiết kế **Modern Storybook** và tích hợp sẵn **Bảng Hướng dẫn Sử dụng Quản trị 4 bước (`UserGuideModal`)** khi vừa đăng nhập cũng như ngay phía trên nút **Đăng xuất**:

1. **Tổng quan & KPI (`/admin`)**: Hiển thị 5 chỉ số KPI thời gian thực và 3 biểu đồ tương tác **Recharts 3** (Lưu lượng truyện Đã duyệt vs Bị chặn, Chi phí USD & Độ trễ TB, Phân bổ nguyên nhân từ chối) với bộ chuyển đổi **7 ngày / 30 ngày**.
2. **Hàng chờ kiểm duyệt (`/admin/queue`)**: Giao diện Split View đối chiếu tranh gốc của bé (`grounded_objects`) với nội dung từng trang truyện, điểm trung thực `faithfulness_score`, điểm rủi ro `risk_score`, hỗ trợ phím tắt duyệt nhanh `A` / `R` và duyệt hàng loạt.
3. **Bộ quy tắc an toàn (`/admin/rules`)**: Quản trị trực tiếp (Thêm/Sửa/Xóa/Bật/Tắt) các quy tắc phòng vệ tâm lý thiếu nhi trong `public.safety_rules`.
4. **System Prompt Studio (`/admin/prompts`)**: Quản lý lịch sử phiên bản System Prompt, kích hoạt phiên bản đang chạy và thử nghiệm trực tiếp trên máy chủ qua Edge Function `admin-test-prompt`.
5. **Chi phí & Hạn mức (`/admin/costs`)**: Giám sát từng lời gọi Gemini từ bảng `public.ai_logs`, cảnh báo ngưỡng ngân sách tháng (`monthly_budget_usd`), điều chỉnh hạn mức ngày toàn cục và xuất báo cáo CSV.
6. **Quản lý người dùng (`/admin/users`)**: Tra cứu gia đình, tùy chỉnh `daily_quota` riêng và Khóa/Mở khóa tài khoản vi phạm (có chốt chặn an toàn không cho phép Admin tự khóa chính mình).
7. **Cài đặt kiểm duyệt & Bảo mật Secrets (`/admin/settings`)**: Điều chỉnh chế độ kiểm duyệt (`auto` / `manual_all`), ngưỡng tự duyệt `auto_approve_max_risk`, công tắc `strict_drawing_check` và bảng hướng dẫn cấu hình khóa bí mật `GEMINI_API_KEY` trên Supabase Secrets.
8. **Nhật ký kiểm toán (`/admin/audit`)**: Lưu vết đầy đủ mọi hành động quản trị từ `public.admin_audit_logs`.

---

## 2. ĐỒNG BỘ SỐ LIỆU THỐNG KÊ NHẤT QUÁN 100% (`adminStore.ts`)

Để đảm bảo số liệu giữa các thẻ KPI và biểu đồ 7 ngày / 30 ngày luôn khớp tuyệt đối:
- **Loại bỏ lưu trữ đệm KPI cũ trong `localStorage`**: Mọi chỉ số KPI (`storiesToday`, `blockedRatePercent`, `pendingQueueCount`, `monthlyCostUsd`, `aiAdminAgreementPercent`) và mảng dữ liệu biểu đồ (`chartData`, `chartData30d`) đều được tính toán đồng thời trong cùng một chu kỳ `computeMetricsFromCollections(stories, aiLogs, reviews)` trực tiếp từ cơ sở dữ liệu Supabase.
- **Chuẩn hóa khóa ngày theo múi giờ địa phương (`toLocalDateKey`)**: Thay vì cắt chuỗi UTC `toISOString().slice(0, 10)` (dễ làm truyện tạo buổi sáng theo giờ Việt Nam `UTC+7` bị lệch ngày với biểu đồ), hệ thống đồng nhất quy đổi mọi mốc thời gian sang `YYYY-MM-DD` theo giờ địa phương trên cả thẻ KPI lẫn trục thời gian biểu đồ.

---

## 3. BẢO MẬT KHÓA AI SERVER-ONLY & NÂNG QUYỀN QUẢN TRỊ AN TOÀN

### 3.1. Loại Bỏ Hoàn Toàn Khóa Gemini Khỏi Trình Duyệt & Bảng `app_settings`
- Khóa `gemini_api_key` đã được loại bỏ triệt để khỏi `public.app_settings`, khỏi giao diện nhập liệu client và khỏi mọi biến môi trường `VITE_*`.
- Cả luồng sinh truyện của phụ huynh (`generate-story`) lẫn luồng thử nghiệm của Admin (`admin-test-prompt`) đều chạy độc quyền trên Supabase Edge Functions, sử dụng `Deno.env.get('GEMINI_API_KEY')` ở phía máy chủ. Nhờ đó, người dùng thông thường mở DevTools/Network không bao giờ đọc được khóa API của hệ thống.

### 3.2. Cơ Chế Cấp Quyền Quản Trị Viên Không Mật Khẩu Mẫu (`promote_to_admin`)
- Các tệp `supabase/seed.sql` và `supabase/full_setup.sql` tuyệt đối **không chèn tài khoản hay mật khẩu mặc định** vào `auth.users` để loại bỏ nguy cơ lộ thông tin đăng nhập trên kho mã nguồn công khai.
- Thay vào đó, schema cung cấp hàm bảo mật dành riêng cho chủ sở hữu cơ sở dữ liệu:
  ```sql
  select public.promote_to_admin('admin_cua_ban@domain.com');
  ```
- Hàm này được thu hồi quyền thực thi từ mọi role phía ứng dụng (`revoke execute on function public.promote_to_admin(text) from public, anon, authenticated;`), đảm bảo chỉ quản trị viên nắm quyền truy cập Supabase SQL Editor / `service_role` mới có thể thăng cấp tài khoản.

---

## 4. KIẾN TRÚC RLS CHỐNG ĐỆ QUY TRÊN 14 BẢNG POSTGRESQL

Toàn bộ **14 bảng dữ liệu** và bucket `storage.objects` đều bật **Row Level Security (RLS)** nghiêm ngặt với bộ hàm `plpgsql SECURITY DEFINER`:
- `public.is_admin()`: Kiểm tra người dùng hiện tại có `role = 'admin'` và `is_locked = false` mà không gây đệ quy vô hạn trên `public.profiles`.
- `public.is_active_user()`: Chặn tức thì mọi truy vấn đọc/ghi của tài khoản đã bị Admin khóa (`is_locked = true`).
- `public.get_my_role()` & `public.get_my_quota()`: Ngăn chặn tuyệt đối người dùng tự sửa cột `role`, `is_locked` hoặc `daily_quota` thông qua chính sách `profiles_update_own`.
- `public.is_drawing_in_shared_story(uuid)` & `public.is_child_in_shared_story(uuid)`: Chỉ cho phép trang chia sẻ công khai `/shared/:token` truy xuất đúng bức tranh và biệt danh bé của những cuốn truyện đã được duyệt và đang bật `is_shared = true`.
