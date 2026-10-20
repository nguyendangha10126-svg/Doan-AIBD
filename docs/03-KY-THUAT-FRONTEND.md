# BÁO CÁO KỸ THUẬT FRONTEND & TRẢI NGHIỆM NGƯỜI DÙNG (03-KY-THUAT-FRONTEND.md)
**Dự án: DrawToStory - Hệ thống Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ**  
*Môn học: AI Based Programming - Trường Đại học Phú Xuân*

---

## 1. THIẾT KẾ ĐỊNH HƯỚNG: "MODERN STORYBOOK"

Giao diện của **DrawToStory** được tái thiết kế toàn diện theo ngôn ngữ **Modern Storybook**:
- Mang lại cảm giác như bước vào một nhà xuất bản sách tranh đương đại: ấm áp, phân cấp thị giác rõ ràng, không ấu trĩ và không có "tấm đế be dày".
- **Nền kem ấm áp có nhiễu giấy siêu nhẹ** (`opacity: 3.5%`), kết hợp đốm màu blur mềm mại ở khu vực Hero.
- **Bức tranh của bé luôn là nhân vật chính**: đặt trang trọng trong khung polaroid hoặc khung giấy dán băng keo, nghiêng nhẹ 1-2° với bóng đổ mềm nhiều lớp (`shadow-card`, `shadow-pop`).
- **Màu "Ma thuật" (Gradient Tím - Hồng)** chỉ xuất hiện ở các khoảnh khắc AI (nút Thần kỳ hóa, loading sinh truyện, huy hiệu AI), tuyệt đối không dùng bừa bãi cho điều hướng chung.

---

## 2. DESIGN SYSTEM TOKENS & WCAG 2.1 AA ENFORCEMENT

Toàn bộ hệ thống tokens được định nghĩa tập trung trong `tailwind.config.js`:
- **Nền**: `bg #FFF9F0`, `surface #FFFFFF`, `surface-2 #FFF3E6`.
- **Chữ**: `ink #2E2540` (chính), `ink-soft #5E5370` (phụ, tỷ lệ tương phản $\ge 6.5:1$), `ink-faint #8A7F99` (chú thích).
- **Thương hiệu**: `brand-100 #FFE3EA`, `brand-400 #F0607F`, `brand-600 #D13A5E`, `brand-700 #B92F51`.
- **Magic (AI)**: `magic-600 #6C5CE7`, gradient `linear-gradient(135deg, #8B7CF6, #F472B6)`.
- **Pastel trang trí**: `mint #C9F0DD`, `sky #CDE7FF`, `lavender #E3D9FF`, `butter #FFF1B8`, `peach #FFD6BA`.
- **Trạng thái**:
  - Success: `#DDF6E9` / `#166E48` (tỷ lệ 5.49:1 $\ge$ 4.5:1).
  - Warning: `#FFF1B8` / `#8A5A00` (tỷ lệ 5.23:1).
  - Danger: `#FFE3EA` / `#B42343` (tỷ lệ 5.34:1).
  - Info: `#CDE7FF` / `#1F5FA8` (tỷ lệ 5.05:1).
- **Bóng & Bo góc**: Thẻ `28px`, Input `16px`, Nút `9999px`. Bóng mềm `shadow-card` và `shadow-pop`.
- **Typography**: Tiêu đề `Quicksand 700`, Nội dung `Nunito 400/600/700` ($\ge 16px$), **Chữ truyện** dùng `Baloo 2` (`clamp(22px, 2.4vw, 32px)`, line-height 1.7) hiển thị dấu tiếng Việt hoàn hảo.
- **Tự động kiểm tra độ tương phản**: Tích hợp kịch bản `scripts/check-contrast.js` chạy tự động trong `npm run build`, kiểm tra 19 cặp màu token và fail build nếu không đạt chuẩn WCAG 2.1 AA.

---

## 3. THƯ VIỆN COMPONENT ĐỒNG BỘ (UI PRIMITIVES)

1. **Button (`src/components/ui/Button.tsx`)**:
   - Component nút duy nhất của ứng dụng, cấm class rời rạc.
   - Các biến thể: `primary`, `magic`, `secondary`, `soft`, `ghost`, `danger`.
   - Kích thước chuẩn: `sm 40px`, `md 48px`, `lg 56px` (vùng chạm tối thiểu 44px).
   - Phản hồi xúc giác qua Framer Motion: hover nâng 1px, active thu nhẹ `scale(.97)`.
   - Hỗ trợ `loading` spinner và `disabled` với tooltip giải thích lý do bị khóa.
2. **Thẻ Bìa Sách (`src/components/ui/BookCover.tsx`)**:
   - Tỷ lệ chuẩn 3:4 với gáy sách chuyển sắc (gradient dọc bên trái).
   - Tiêu đề đặt trên dải mờ dưới bìa, `line-clamp` mượt mà.
   - Nút `Đọc` primary cho truyện đã duyệt; thanh tiến độ cho truyện chờ duyệt; lý do cho truyện bị từ chối; menu `⋯` với ConfirmDialog xóa an toàn.
3. **Bảo Mật Mã PIN Phụ Huynh (`src/components/ui/OtpPinInput.tsx`)**:
   - Không lưu trữ hoặc hiển thị PIN dạng văn bản rõ `••••`.
   - Băm mật mã bằng SHA-256 (`fastHashPin`).
   - Giao diện 4 ô số OTP mượt mà, tự động chuyển ô và xác minh khi đổi mã.

---

## 4. KHUNG ĐIỀU HƯỚNG & CÁC FOCUS ROUTES

- **Desktop Topbar**: Thanh mảnh cố định. Tab giữa với gạch chân trượt `layoutId` (Trang chủ, Tủ sách, An toàn AI). Góc phải gồm: Bộ chọn bé toàn cục ("Đang xem: Bé Bơ"), nút `Tạo truyện` (primary CTA), nút `Chế độ bé` (secondary), và menu tài khoản.
- **Mobile Bottom Navigation**: Thanh tab dưới chân với nút nổi tròn ở giữa "Tạo" (magic).
- **Focus Routes (Ẩn toàn bộ thanh điều hướng)**: Các route `/create`, `/story/:id`, `/kid`, `/shared/:token` tự động ẩn toàn bộ khung chrome để người dùng tập trung hoàn toàn vào nội dung sáng tạo và đọc sách.

---

## 5. CÔNG NGHỆ CLIENT-SIDE ĐẶC THÙ

### 5.1. Kiểm Tra Chất Lượng Ảnh Phía Client (Laplacian & Luminance)
Trong Wizard Tạo truyện (`CreateStoryPage.tsx`), trước khi tải ảnh lên, thuật toán Canvas phân tích trực tiếp:
- **Độ mờ**: Tính phương sai ma trận Laplacian trên ảnh xám (Grayscale). Ngưỡng $> 45$ được công nhận rõ nét.
- **Độ sáng**: Tính giá trị độ chói trung bình (Mean Luminance). Ngưỡng $\ge 65$ được công nhận đủ sáng.
- Hiển thị chip trực quan: `Đủ sáng ✓ Rõ nét ✓`.
- Hỗ trợ camera trực tiếp qua `navigator.mediaDevices.getUserMedia` với khung căn lề.

### 5.2. Trình Đọc Sách Hiện Đại & TTS Karaoke
Trong Reading View (`StoryReadingPage.tsx`):
- **Desktop/Tablet**: Sách lật hai trang chân thực dùng `react-pageflip`. Trang trái là tranh vẽ trong khung polaroid; trang phải là cốt truyện với font Baloo 2.
- **Mobile**: Vuốt trang ngang, tranh 55% ở trên và văn bản 45% ở dưới.
- **Chống cắt ảnh (No-Crop Guarantee)**: Tranh vẽ được hiển thị bằng `object-fit: contain`, chuyển động Ken Burns được kẹp (clamp) mức phóng tối đa 1.35 và tôn trọng `prefers-reduced-motion`.
- **TTS Karaoke từng câu**: Web Speech API đọc từng câu văn, đồng bộ highlight vàng sáng trên chữ đang đọc, tự động lật trang khi đọc hết.
- **Chế độ Ru ngủ (Bedtime Mode)**: Dịu nền sang màu tối thư thái, giảm tốc độ đọc và âm sắc, tích hợp hẹn giờ tắt âm 15/30/45 phút.

### 5.3. Chế Độ Bé Cô Lập Hoàn Toàn (Kid Mode)
Tại route `/kid`:
- Tự động yêu cầu kích hoạt Toàn màn hình (Fullscreen API).
- Bẫy nút Back của trình duyệt bằng vòng lặp `window.history.pushState` và sự kiện `popstate`.
- Hiệu ứng âm thanh vui nhộn chạy qua Web Audio API không phụ thuộc file mp3 ngoài (`src/lib/sound.ts`).
- Bìa sách cỡ lớn lướt ngang với nút bấm chạm $\ge 72px$.
- Cổng phụ huynh 3 cơ chế mở khóa: giữ nút góc 2 giây (có thanh tiến độ trực quan), giải phép nhân ngẫu nhiên, hoặc nhập mã PIN.
