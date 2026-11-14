# TÀI LIỆU CÁC GIẢ ĐỊNH KỸ THUẬT & BẢO MẬT (ASSUMPTIONS.md)
**Dự án: DrawToStory - Đồ án AI Based Programming**  
*Repository:* [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)

---

## 1. GIẢ ĐỊNH VỀ HẠ TẦNG, MÔI TRƯỜNG & CÔ LẬP DEMO
1. **Nền tảng Client**: Ứng dụng là Single Page Application (SPA) xây dựng bằng React 18, TypeScript (Strict Mode), Vite 6 và Recharts 3, chia tách gói tải tự động bằng `React.lazy` để tối ưu tốc độ tải trang cho phụ huynh trên mạng di động.
2. **Độ phân giải Màn hình Hỗ trợ**:
   - Di động: `320px` – `430px` (chuẩn kiểm thử `390px × 844px`).
   - Máy tính bảng & Máy tính để bàn: `768px` – `1920px` (chuẩn kiểm thử `1440px × 900px`).
   - Hộp thoại chuẩn HTML5 `<dialog>` tự co giãn `max-h-[90dvh]` và trình đọc lật trang Desktop có vùng cuộn văn bản độc lập chống tràn/cắt chữ.
3. **Cô lập Chế độ Demo Khỏi Production**:
   - Cờ `isDemoMode` được định nghĩa nghiêm ngặt là `Boolean(import.meta.env.DEV) && import.meta.env.VITE_USE_MOCK === 'true'`.
   - Khi đóng gói Production (`npm run build`), `import.meta.env.DEV` luôn bằng `false`: mọi cơ chế đăng nhập giả lập, dữ liệu mẫu cứng và route nội bộ `/dev/styleguide` đều bị loại bỏ hoàn toàn.
4. **Cơ sở Dữ liệu Khởi Tạo Không Mật Khẩu Cứng (`supabase/full_setup.sql`)**:
   - Kịch bản SQL khởi tạo sạch 14 bảng, 3 view thống kê, bucket `drawings`, 10 quy tắc an toàn, 5 danh mục huy hiệu và System Prompt v1.2 mà **không chứa bất kỳ mật khẩu tài khoản mặc định nào**.
   - Chủ dự án tự đăng ký tài khoản thật qua Supabase GoTrue Auth và nâng quyền quản trị bằng hàm nội bộ `select public.promote_to_admin('email@domain.com');` trong SQL Editor.

---

## 2. GIẢ ĐỊNH VỀ MÔ HÌNH AI, BẢO MẬT SECRETS & CHI PHÍ
1. **Mô hình AI & Thực thi Server-Only**:
   - Sử dụng mô hình đa phương thức **Google Gemini 2.5 Flash** (`gemini-2.5-flash`, có thể cấu hình qua biến `GEMINI_MODEL` trên máy chủ).
   - Khóa `GEMINI_API_KEY` chỉ tồn tại trong **Supabase Edge Functions Secrets** (`Deno.env.get('GEMINI_API_KEY')`), tuyệt đối không lưu trong bảng `app_settings` và không gửi xuống trình duyệt.
   - Để tính năng Tạo truyện và AI Playground hoạt động trên môi trường thật, quản trị viên cần cấu hình `GEMINI_API_KEY` và triển khai các Edge Functions (`generate-story`, `admin-test-prompt`, `get-shared-story`, `delete-account`).
2. **Bảng Giá Ước Tính Token (`gemini-2.5-flash`)**:
   - Input Tokens: \$0.075 / 1,000,000 tokens.
   - Output Tokens: \$0.300 / 1,000,000 tokens.
   - Số lượng token và chi phí USD được lấy trực tiếp từ `usageMetadata` của phản hồi Gemini API và lưu vào bảng `public.ai_logs`.
3. **Khôi Phục Mật Khẩu Email**:
   - Chức năng Quên mật khẩu (`/forgot-password`) sử dụng `supabase.auth.resetPasswordForEmail()`. Trong môi trường mặc định của Supabase, tần suất gửi email tuân theo giới hạn SMTP của dự án (khuyến nghị cấu hình Custom SMTP trên Supabase Dashboard khi vận hành quy mô lớn).

---

## 3. GIẢ ĐỊNH VỀ GIỌNG ĐỌC & ÂM THANH (WEB SPEECH & WEB AUDIO)
1. **Web Speech API (`window.speechSynthesis`)**: Tận dụng bộ đọc giọng nói sẵn có trên hệ điều hành/trình duyệt của người dùng (ưu tiên các giọng `vi-VN` như *Hoài My*, *Nam Minh*, *Google Tiếng Việt*, *Linh*), hoàn toàn miễn phí và không gửi âm thanh giọng nói của trẻ lên đám mây.
2. **Web Audio API (`src/lib/sound.ts`)**: Toàn bộ âm thanh lật giấy, chuông phép thuật và hộp nhạc ru ngủ `startLullaby()` được tổng hợp toán học trực tiếp trên trình duyệt, không phụ thuộc tệp âm thanh bên ngoài.

---

## 4. GIẢ ĐỊNH VỀ AN TOÀN TRẺ EM & QUYỀN RIÊNG TƯ GDPR
1. **Giảm Thiểu Dữ Liệu (Data Minimization)**: Chỉ lưu biệt danh đã chuẩn hóa (không lưu họ tên thật, ngày sinh đầy đủ, địa chỉ hay ảnh mặt thật) và độ tuổi (`2–12`) để điều chỉnh ngôn từ sư phạm.
2. **Bảo Mật Mã PIN Phụ Huynh**:
   - `parental_pin_hash` mặc định là `null` khi mới tạo tài khoản (không tồn tại PIN mặc định `1234`).
   - Khi phụ huynh thiết lập PIN, mã PIN được băm một chiều kèm Salt riêng theo định danh tài khoản (`saltedHashPinSync(pin, userId)`). Nếu gia đình chưa đặt PIN, Cổng phụ huynh trong Chế độ Bé tự động yêu cầu giải phép nhân hai chữ số của người lớn.
3. **Quyền Được Lãng Quên Thực Thụ (`delete-account` Edge Function)**:
   - Khi phụ huynh xác nhận xóa tài khoản bằng mật khẩu hiện tại và từ khóa `XOA`, Edge Function `delete-account` sử dụng quyền quản trị máy chủ để xóa toàn bộ tệp tranh vẽ trong Storage bucket `drawings`, xóa bản ghi `public.profiles` (kéo theo xóa cascade toàn bộ `children`, `drawings`, `stories`, `story_pages`, `user_badges`, `reading_events`) và gọi `supabase.auth.admin.deleteUser(user.id)` để xóa hoàn toàn tài khoản đăng nhập.
