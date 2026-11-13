# TÀI LIỆU CÁC GIẢ ĐỊNH KỸ THUẬT & NGHIỆP VỤ (ASSUMPTIONS)
**Dự án: DrawToStory - Đồ án AI Based Programming**  
*Repository:* [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)

---

## 1. GIẢ ĐỊNH VỀ HẠ TẦNG & MÔI TRƯỜNG CHẠY
1. **Nền tảng Client**: Ứng dụng là Single Page Application (SPA) phát triển bằng React 18, TypeScript (Strict Mode) và Vite. Vận hành chuẩn mực trên các trình duyệt hiện đại (Google Chrome, Microsoft Edge, Safari Mobile, Chrome Mobile).
2. **Kích thước Màn hình Trọng tâm**:
   - Màn hình di động chuẩn: `390px × 844px` (tương đương iPhone 12/13/14/15).
   - Màn hình máy tính chuẩn: `1440px × 900px` (Desktop / Laptop).
   - Tương thích co giãn trọn vẹn cho Tablet (`768px × 1024px`) và màn hình siêu nhỏ xuống tới `320px` mà không phát sinh thanh cuộn ngang (`overflow-x-hidden`).
3. **Môi trường Backend**: Supabase cung cấp GoTrue Auth, PostgreSQL Database, Storage và Deno-based Edge Functions.
4. **Cơ chế Dự phòng (Offline / Demo Mode)**: Khi biến môi trường đặt `VITE_USE_MOCK=true`, hệ thống tự động sử dụng kho dữ liệu mẫu chuẩn hóa (với banner *"DỮ LIỆU DEMO"* cố định) để hội đồng chấm thi vẫn có thể trải nghiệm luồng giao diện ngay cả khi ngắt kết nối mạng.
5. **Kiến trúc Dữ liệu Sạch 1-Click (Clean Database-First)**: Mặc định (`VITE_USE_MOCK=false`), ứng dụng kết nối trực tiếp với dự án Supabase PostgreSQL thực tế (`htvslxbytqoteyimtcxg.supabase.co`). Khi chạy tệp `supabase/full_setup.sql`, cơ sở dữ liệu được làm sạch hoàn toàn (0 hồ sơ bé, 0 bức tranh, 0 cuốn truyện mẫu) và khởi tạo đúng 2 tài khoản GoTrue thật: Quản trị viên (`admin@drawtostory.vn` / `Admin@123`) và Phụ huynh (`me@phuhuynh.vn` / `Parent@123`, mã PIN mặc định `1234`).

---

## 2. GIẢ ĐỊNH VỀ MÔ HÌNH AI & PIPELINE
1. **Mô hình AI & Cấu hình Khóa Linh hoạt**: Sử dụng mô hình đa phương thức **Google Gemini 2.5 Flash** (`gemini-2.5-flash`) để tối ưu tốc độ phản hồi và chi phí. Hệ thống hỗ trợ nạp khóa API linh hoạt theo thứ tự ưu tiên:
   - Supabase Edge Function (`GEMINI_API_KEY` secret trên Deno serverless).
   - Khóa cấu hình trực tiếp bởi Admin tại giao diện `/admin/settings` (lưu trong `public.app_settings` với khóa `gemini_api_key`).
   - Biến môi trường `VITE_GEMINI_API_KEY` trong tệp `.env`.
2. **Định dạng Kết quả Sinh**: Áp dụng tính năng cấu trúc hóa `responseMimeType: "application/json"` kết hợp `responseSchema` của Gemini API và kiểm tra lại trên client để đảm bảo dữ liệu đầu ra tuân thủ 100% cấu trúc trang sách.
3. **Ước tính Chi phí AI (Pricing Matrix)**:
   - Input Tokens: \$0.075 / 1,000,000 tokens.
   - Output Tokens: \$0.300 / 1,000,000 tokens.
   - Chi phí thực tế cho mỗi lần sinh truyện 3 lớp ước tính khoảng \$0.0005 – \$0.0015 USD và được ghi nhận chính xác vào bảng `public.ai_logs`.
4. **Kiểm duyệt 3 Lớp & Visual Grounding**:
   - **Lớp 1 (Input Check)**: Xác định ảnh có phải tranh vẽ trẻ em hay không (`is_drawing`), phân loại thể thức (`child_drawing`, `artwork`, `photo`, `logo_graphic`, `screenshot_text`, `other`), kiểm tra khuôn mặt người thật (`contains_real_person_face`), PII (`pii_detected`) và các quy tắc `block` trong `safety_rules`.
   - **Lớp 2 (Creative Story Generation)**: Sinh 4–5 trang truyện phù hợp độ tuổi theo `SystemPrompt` đang kích hoạt, bắt buộc bám sát `grounded_objects` và xác định tọa độ `focus_region` (`{x, y, zoom}`) kẹp an toàn ($\text{zoom} \le 1.35\times$) cho hiệu ứng Ken Burns không cắt viền (`object-fit: contain`).
   - **Lớp 3 (Output Safety Judge & Faithfulness Retry)**: Chấm điểm `faithfulness_score` (0–100) và `risk_score` (0–100). Nếu `faithfulness_score < 60`, tự động sinh lại ở `temperature = 0.35` và chấm điểm Judge lại trên bản thảo mới. Ngưỡng tự động duyệt mặc định là `risk_score <= 25` (có thể điều chỉnh động tại `/admin/settings`).

---

## 3. GIẢ ĐỊNH VỀ GIỌNG ĐỌC & ĐA PHƯƠNG TIỆN (TTS & WEB AUDIO)
1. **Web Speech API**: Sử dụng trực tiếp `window.speechSynthesis` sẵn có trên trình duyệt của người dùng, hoàn toàn miễn phí, không phát sinh độ trễ mạng và hoạt động ổn định trên cả trang đọc chính lẫn trang chia sẻ công khai.
2. **Bộ Giọng Tiếng Việt Tự Nhiên Đa Dạng**: Hệ thống tự động quét danh sách giọng đọc `vi-VN` của thiết bị và ưu tiên các giọng tự nhiên (*Microsoft Hoài My*, *Microsoft Nam Minh*, *Google Tiếng Việt*, *Apple Linh*), hỗ trợ tùy chỉnh tốc độ kể chuyện `0.8x`, `1.0x`, `1.2x`.
3. **Đồng bộ Câu đọc (Sentence Highlighting)**: Văn bản từng trang truyện được tách câu thông minh và bôi sáng Karaoke đồng bộ theo câu đang phát âm.
4. **Hiệu ứng Âm thanh & Nhạc hộp Ru ngủ (`src/lib/sound.ts`)**: Tổng hợp 100% bằng Web Audio API mà không cần tệp `.mp3` tĩnh: tiếng lật trang sách `playPageTurn()`, chuông phép thuật `playSparkle()` / `playMagic()`, pháo hoa hoàn thành `playSuccess()`, nhạc hộp ru ngủ lặp êm dịu `startLullaby()` / `stopLullaby()`, cùng âm thanh tương tác `playTap()` và `playLock()`.

---

## 4. GIẢ ĐỊNH VỀ AN TOÀN TRẺ EM & QUYỀN RIÊNG TƯ (CHILD SAFETY & PRIVACY)
1. **Dữ liệu Tối thiểu (Data Minimization)**: Hồ sơ trẻ em tuyệt đối **KHÔNG** lưu họ tên đầy đủ, ngày tháng năm sinh chính xác, địa chỉ nhà hay ảnh chụp chân dung. Chỉ lưu biệt danh (*Bé Bơ*, *Sóc Nâu*...), độ tuổi (`2–12`), sở thích khái quát và màu sắc/emoji đại diện.
2. **Lưu trữ & Dọn dẹp Ảnh Tranh Vẽ (`drawings` Bucket)**:
   - Tệp ảnh tranh vẽ được lưu tại đường dẫn phân tách theo từng gia đình `{user_id}/{child_id}_{timestamp}.{ext}` trong Supabase Storage bucket `drawings`. Đường dẫn ảnh sử dụng URL đọc tĩnh không hết hạn để cả gia đình và ông bà/người thân mở liên kết chia sẻ `/shared/:token` đều xem được tranh mượt mà mà không gặp lỗi gãy ảnh sau 60 phút.
   - Quyền ghi/xóa tệp trên Storage và quyền truy vấn bảng metadata `public.drawings` được khóa chặt bằng RLS theo đúng `user_id` (chỉ mở đọc cho khách khi cuốn truyện chứa bức tranh đó đã duyệt và bật `is_shared = true`).
   - Khi phụ huynh xóa truyện, xóa hồ sơ bé hoặc xóa dữ liệu tài khoản, hệ thống tự động xóa đồng bộ cả tệp vật lý trên Storage lẫn bản ghi cơ sở dữ liệu.
3. **Bảo Mật Mã PIN Phụ Huynh**: Mã PIN phụ huynh được băm một chiều bằng SHA-256 (`fastHashPin`) trước khi lưu trữ vào `profiles.parent_pin_hash`.
4. **Cô lập Chế độ Trẻ Em & Cổng Phụ Huynh (Kid Mode & Parental Gate)**: Trẻ đọc sách trong `/kid` và `/story/:id?mode=kid` được cô lập hoàn toàn khỏi các nút chia sẻ/in ấn/cài đặt của người lớn; để thoát ra ngoài, phụ huynh phải nhấn giữ nút khóa 2 giây, giải phép toán nhân ngẫu nhiên hoặc nhập đúng mã PIN 4 chữ số.
