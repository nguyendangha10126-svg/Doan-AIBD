# TÀI LIỆU CÁC GIẢ ĐỊNH KỸ THUẬT & NGHIỆP VỤ (ASSUMPTIONS)
**Dự án: DrawToStory - Đồ án AI Based Programming**

---

## 1. GIẢ ĐỊNH VỀ HẠ TẦNG & MÔI TRƯỜNG CHẠY
1. **Nền tảng Client**: Ứng dụng là Single Page Application (SPA) phát triển bằng React 18, TypeScript (Strict Mode) và Vite. Hỗ trợ chuẩn mực trên các trình duyệt hiện đại (Google Chrome, Microsoft Edge, Safari Mobile, Chrome Mobile).
2. **Kích thước Màn hình Trọng tâm**:
   - Màn hình di động chuẩn: 390px $\times$ 844px (tương đương iPhone 12/13/14).
   - Màn hình máy tính chuẩn: 1440px $\times$ 900px (Desktop / Laptop).
   - Có kiểm thử tương thích cho Tablet (768px $\times$ 1024px).
3. **Môi trường Backend**: Supabase cung cấp Auth, PostgreSQL Database, Storage và Deno-based Edge Functions.
4. **Cơ chế Dự phòng (Offline / Demo Mode)**: Để tạo điều kiện thuận lợi nhất cho giảng viên và hội đồng chấm đồ án khi chạy mã nguồn mà chưa kịp cấu hình Supabase Cloud Project hoặc Gemini API Key, ứng dụng tích hợp sẵn chế độ Mock/Demo thông minh: nếu phát hiện biến môi trường trống hoặc không kết nối được, hệ thống tự động sử dụng kho dữ liệu mẫu chuẩn hóa để toàn bộ các luồng (đăng nhập, duyệt truyện, đọc sách lật trang, xem biểu đồ admin) vẫn chạy trơn tru 100%.

---

## 2. GIẢ ĐỊNH VỀ MÔ HÌNH AI & PIPELINE
1. **Mô hình AI**: Sử dụng Google Gemini thông qua REST API trong Supabase Edge Functions. Tên mô hình được nạp từ biến môi trường `GEMINI_MODEL`, mặc định là `gemini-2.5-flash` để tối ưu chi phí và độ trễ.
2. **Định dạng Kết quả Sinh**: Áp dụng tính năng cấu trúc hóa `responseMimeType: "application/json"` kết hợp `responseSchema` của Gemini API để đảm bảo câu trả lời luôn tuân thủ 100% schema và không bị vỡ định dạng.
3. **Ước tính Chi phí AI (Pricing Matrix)**:
   - Input Tokens: \$0.075 / 1,000,000 tokens.
   - Output Tokens: \$0.300 / 1,000,000 tokens.
   - Chi phí mỗi lần sinh truyện ước tính trong khoảng \$0.0005 - \$0.0015 USD.
4. **Kiểm duyệt 3 Lớp**:
   - Lớp 1 (Input Check): Xác định ảnh có phải tranh vẽ trẻ em hay không (`is_drawing`), phát hiện khuôn mặt người thật (`contains_real_person_face`) và thông tin cá nhân PII (`pii_detected`).
   - Lớp 2 (Creative Story Generation): Sinh 4-5 trang truyện phù hợp độ tuổi, xác định tọa độ vùng nhìn `focus_region` ({x, y, zoom}) để tạo hiệu ứng Ken Burns từ bức tranh ban đầu.
   - Lớp 3 (Output Safety Judge): Chấm điểm `risk_score` (0-100). Ngưỡng tự động duyệt mặc định là `risk_score <= 25`.

---

## 3. GIẢ ĐỊNH VỀ GIỌNG ĐỌC & ĐA PHƯƠNG TIỆN (TTS & AUDIO)
1. **Web Speech API**: Sử dụng trực tiếp API `window.speechSynthesis` sẵn có trên trình duyệt của người dùng. Không phụ thuộc vào dịch vụ TTS đám mây bên thứ ba có phí để đảm bảo tính sẵn sàng cao, hoàn toàn miễn phí và không có độ trễ truyền tải.
2. **Ưu tiên Giọng Tiếng Việt**: Hệ thống tự động quét danh sách giọng đọc của thiết bị và ưu tiên các mã ngôn ngữ `vi-VN` hoặc `vi`. Nếu thiết bị không có giọng tiếng Việt (ví dụ một số bản Linux hoặc máy ảo đặc thù), ứng dụng sẽ hiển thị thông báo nhẹ nhàng và sử dụng giọng mặc định.
3. **Đồng bộ Câu đọc (Sentence Highlighting)**: Văn bản của trang truyện được tách câu theo dấu câu (`.`, `!`, `?`); khi phát âm thanh đến từng câu, câu tương ứng sẽ được bôi đậm nổi bật trên trang sách.

---

## 4. GIẢ ĐỊNH VỀ AN TOÀN TRẺ EM & QUYỀN RIÊNG TƯ (CHILD SAFETY & PRIVACY)
1. **Dữ liệu Tối thiểu (Data Minimization)**: Hồ sơ trẻ em tuyệt đối KHÔNG lưu họ tên đầy đủ, ngày tháng năm sinh chính xác, địa chỉ nhà hay ảnh chụp chân dung. Chỉ lưu biệt danh (nickname, ví dụ: "Bé Bơ", "Bé Tin"), nhóm tuổi (2-12) và màu sắc/emoji đại diện.
2. **Lưu trữ Ảnh Tranh Vẽ**: Toàn bộ tranh bé vẽ được lưu trong Storage Bucket Private của Supabase tại đường dẫn `{user_id}/{child_id}/{uuid}.jpg` và chỉ truy cập được qua Signed URL ngắn hạn (thời hạn 60 phút) được cấp phép qua RLS.
3. **Cổng Phụ Huynh (Parental Gate)**: Để ngăn trẻ nhỏ vô tình bấm nhầm vào các cài đặt hoặc thoát khỏi Chế độ Trẻ Em (Kid Mode), hệ thống yêu cầu giải một phép tính ngẫu nhiên (ví dụ: $6 \times 7 = ?$) hoặc nhập mã PIN phụ huynh 4 chữ số.

