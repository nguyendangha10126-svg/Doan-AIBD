# TÀI LIỆU CÁC GIẢ ĐỊNH KỸ THUẬT & NGHIỆP VỤ (ASSUMPTIONS)
**Dự án: DrawToStory - Đồ án AI Based Programming**  
*Repository:* [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)

---

## 1. GIẢ ĐỊNH VỀ HẠ TẦNG & MÔI TRƯỜNG CHẠY
1. **Nền tảng Client**: Ứng dụng là Single Page Application (SPA) phát triển bằng React 18, TypeScript (Strict Mode) và Vite. Hỗ trợ chuẩn mực trên các trình duyệt hiện đại (Google Chrome, Microsoft Edge, Safari Mobile, Chrome Mobile).
2. **Kích thước Màn hình Trọng tâm**:
   - Màn hình di động chuẩn: 390px $\times$ 844px (tương đương iPhone 12/13/14).
   - Màn hình máy tính chuẩn: 1440px $\times$ 900px (Desktop / Laptop).
   - Có kiểm thử tương thích cho Tablet (768px $\times$ 1024px) và màn hình nhỏ xuống tới 360px không bị tràn thanh cuộn ngang.
3. **Môi trường Backend**: Supabase cung cấp Auth, PostgreSQL Database, Storage và Deno-based Edge Functions.
4. **Cơ chế Dự phòng (Offline / Demo Mode)**: Để tạo điều kiện thuận lợi nhất cho giảng viên và hội đồng chấm đồ án khi chạy mã nguồn mà chưa kịp cấu hình Supabase Cloud Project hoặc Gemini API Key, ứng dụng tích hợp sẵn chế độ Mock/Demo thông minh: nếu phát hiện biến môi trường trống hoặc đặt `VITE_USE_MOCK=true`, hệ thống tự động sử dụng kho dữ liệu mẫu chuẩn hóa (với banner "DỮ LIỆU DEMO" cố định) để toàn bộ các luồng (đăng nhập, duyệt truyện, đọc sách lật trang, xem biểu đồ admin) vẫn chạy trơn tru 100%.
5. **Kiến trúc Dữ liệu Sạch (Clean Database-First)**: Mặc định ứng dụng kết nối trực tiếp với dự án Supabase PostgreSQL đang chạy thực tế (`htvslxbytqoteyimtcxg.supabase.co`). Cơ sở dữ liệu khởi đầu sạch với 2 tài khoản chính (Admin và Mẹ Thu Hà), không có dữ liệu rác hay truyện mẫu cứng. Mọi hồ sơ bé và ấn bản sách tranh do người dùng tự tay tạo lập và lưu trữ bền vững.

---

## 2. GIẢ ĐỊNH VỀ MÔ HÌNH AI & PIPELINE
1. **Mô hình AI**: Sử dụng Google Gemini thông qua REST API trong Supabase Edge Functions. Tên mô hình được nạp từ biến môi trường `GEMINI_MODEL`, mặc định là `gemini-2.5-flash` để tối ưu chi phí và độ trễ.
2. **Định dạng Kết quả Sinh**: Áp dụng tính năng cấu trúc hóa `responseMimeType: "application/json"` kết hợp `responseSchema` của Gemini API để đảm bảo câu trả lời luôn tuân thủ 100% schema và không bị vỡ định dạng.
3. **Ước tính Chi phí AI (Pricing Matrix)**:
   - Input Tokens: \$0.075 / 1,000,000 tokens.
   - Output Tokens: \$0.300 / 1,000,000 tokens.
   - Chi phí mỗi lần sinh truyện ước tính trong khoảng \$0.0005 - \$0.0015 USD.
4. **Kiểm duyệt 3 Lớp & Visual Grounding**:
   - Lớp 1 (Input Check): Xác định ảnh có phải tranh vẽ trẻ em hay không (`is_drawing`), loại ảnh (`child_drawing`, `artwork`, `photo`, `logo_graphic`, `screenshot_text`), độ tin cậy `confidence`, phát hiện khuôn mặt người thật (`contains_real_person_face`) và thông tin cá nhân PII (`pii_detected`). Nếu không phải tranh vẽ trẻ em, trả về mã lỗi `NOT_A_DRAWING`.
   - Lớp 2 (Creative Story Generation): Sinh 4-5 trang truyện phù hợp độ tuổi, bắt buộc bám sát các vật thể thực tế trong tranh (`grounded_objects`), xác định tọa độ vùng nhìn `focus_region` ({x, y, zoom}) kẹp an toàn (zoom $\le 1.35x$) để tạo hiệu ứng Ken Burns từ bức tranh ban đầu mà không bị cắt mất viền (`object-fit: contain`).
   - Lớp 3 (Output Safety Judge & Faithfulness): Chấm điểm `faithfulness_score` (0-100) và `risk_score` (0-100). Ngưỡng tự động duyệt mặc định là `risk_score <= 25`. Nếu `faithfulness_score < 60`, tự động thử lại 1 lần với temperature thấp hơn.

---

## 3. GIẢ ĐỊNH VỀ GIỌNG ĐỌC & ĐA PHƯƠNG TIỆN (TTS & AUDIO)
1. **Web Speech API**: Sử dụng trực tiếp API `window.speechSynthesis` sẵn có trên trình duyệt của người dùng. Không phụ thuộc vào dịch vụ TTS đám mây bên thứ ba có phí để đảm bảo tính sẵn sàng cao, hoàn toàn miễn phí và không có độ trễ truyền tải.
2. **Bộ Giọng Tiếng Việt Tự Nhiên Đa Dạng**: Hệ thống tự động quét danh sách giọng đọc của thiết bị và cung cấp menu trực quan chọn giọng đọc chuẩn (*Hoài My (Nữ)*, *Nam Minh (Nam)*, *Google Tiếng Việt*, *An (Thiếu nhi)*, *Linh*). Hỗ trợ điều chỉnh tốc độ kể chuyện 0.8x, 1.0x, 1.2x phù hợp với từng tâm trạng của bé.
3. **Đồng bộ Câu đọc (Sentence Highlighting)**: Văn bản của trang truyện được tách câu theo dấu câu (`.`, `!`, `?`); khi phát âm thanh đến từng câu, câu tương ứng sẽ được bôi đậm nổi bật trên trang sách theo phong cách Karaoke.
4. **Hiệu ứng Âm thanh Chế độ Trẻ Em & Lật Sách (Web Audio API Synthesizers)**: Chạy trên Web Audio API thuần túy trong `src/lib/sound.ts`, không cần file mp3 tĩnh: tạo tiếng lật giấy sách `playPageFlip()` bằng bộ lọc quét dải tần tiếng ồn hồng (Bandpass sweep), âm thanh thần tiên `playSparkle()`, âm thanh chạm `playTap()`, và âm thanh khóa cổng an toàn `playLock()`.

---

## 4. GIẢ ĐỊNH VỀ AN TOÀN TRẺ EM & QUYỀN RIÊNG TƯ (CHILD SAFETY & PRIVACY)
1. **Dữ liệu Tối thiểu (Data Minimization)**: Hồ sơ trẻ em tuyệt đối KHÔNG lưu họ tên đầy đủ, ngày tháng năm sinh chính xác, địa chỉ nhà hay ảnh chụp chân dung. Chỉ lưu biệt danh (nickname, ví dụ: "Bé Bơ", "Sóc Nâu"), nhóm tuổi (2-12) và màu sắc/emoji đại diện.
2. **Lưu trữ Ảnh Tranh Vẽ**: Toàn bộ tranh bé vẽ được lưu trong Storage Bucket Private của Supabase tại đường dẫn `{user_id}/{child_id}/{uuid}.jpg` và chỉ truy cập được qua Signed URL ngắn hạn (thời hạn 60 phút) được cấp phép qua RLS.
3. **Bảo Mật Mã PIN Phụ Huynh**: Mã PIN phụ huynh được băm bằng SHA-256 (`fastHashPin`) trước khi lưu trữ, bảo đảm không bao giờ lưu trữ hoặc hiển thị văn bản rõ trên giao diện.
4. **Cổng Phụ Huynh (Parental Gate)**: Để ngăn trẻ nhỏ vô tình bấm nhầm vào các cài đặt hoặc thoát khỏi Chế độ Trẻ Em (Kid Mode), hệ thống yêu cầu nhấn giữ nút khóa 2 giây (với thanh tiến độ tròn), hoặc giải một phép tính ngẫu nhiên (ví dụ: $6 \times 7 = ?$), hoặc nhập mã PIN phụ huynh 4 chữ số.
