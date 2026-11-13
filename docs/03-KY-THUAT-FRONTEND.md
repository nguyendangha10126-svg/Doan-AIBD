# BÁO CÁO KỸ THUẬT FRONTEND & TRẢI NGHIỆM NGƯỜI DÙNG (03-KY-THUAT-FRONTEND.md)
**Dự án: DrawToStory - Hệ thống Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ**  
*Môn học: AI Based Programming - Trường Đại học Phú Xuân*  
*Repository:* [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)

---

## 1. THIẾT KẾ ĐỊNH HƯỚNG: "MODERN STORYBOOK" ĐỒNG BỘ 100%

Giao diện của **DrawToStory** được thiết kế và đồng bộ hóa toàn diện theo ngôn ngữ **Modern Storybook** xuyên suốt mọi phân hệ (Xác thực, Phụ huynh, Trẻ em, Chia sẻ công khai và cả **8 trang Quản trị viên**):
- Mang lại cảm giác như bước vào một nhà xuất bản sách tranh đương đại: ấm áp, phân cấp thị giác rõ ràng, loại bỏ triệt để các biến màu cũ rời rạc (`cream`, `text-main`...).
- **Nền kem ấm áp có nhiễu giấy siêu nhẹ** (`opacity: 3.5%`), kết hợp đốm màu blur mềm mại ở khu vực Hero.
- **Bức tranh của bé luôn là nhân vật chính**: đặt trang trọng trong khung polaroid hoặc khung giấy dán băng keo, nghiêng nhẹ `1°–2°` với bóng đổ mềm nhiều lớp (`shadow-card`, `shadow-pop`).
- **Màu "Ma thuật" (Gradient Tím – Hồng)** chỉ xuất hiện có chủ đích ở các khoảnh khắc AI (nút Thần kỳ hóa, trạng thái sinh truyện, huy hiệu AI), không lạm dụng cho điều hướng thông thường.

---

## 2. DESIGN SYSTEM TOKENS & WCAG 2.1 AA ENFORCEMENT

Toàn bộ hệ thống tokens được định nghĩa tập trung trong `tailwind.config.js`:
- **Nền**: `bg #FFF9F0`, `surface #FFFFFF`, `surface-2 #FFF3E6`.
- **Chữ**: `ink #2E2540` (chính), `ink-soft #5E5370` (phụ, tỷ lệ tương phản $\ge 6.5:1$), `ink-faint #8A7F99` (chú thích).
- **Thương hiệu**: `brand-100 #FFE3EA`, `brand-400 #F0607F`, `brand-600 #D13A5E`, `brand-700 #B92F51`.
- **Magic (AI)**: `magic-600 #6C5CE7`, gradient `linear-gradient(135deg, #8B7CF6, #F472B6)`.
- **Pastel trang trí**: `mint #C9F0DD`, `sky #CDE7FF`, `lavender #E3D9FF`, `butter #FFF1B8`, `peach #FFD6BA`.
- **Trạng thái đạt chuẩn tương phản cao**:
  - Success: `#DDF6E9` / `#166E48` (tỷ lệ `5.49:1` $\ge$ `4.5:1`).
  - Warning: `#FFF1B8` / `#8A5A00` (tỷ lệ `5.23:1`).
  - Danger: `#FFE3EA` / `#B42343` (tỷ lệ `5.34:1`).
  - Info: `#CDE7FF` / `#1F5FA8` (tỷ lệ `5.05:1`).
- **Bóng & Bo góc**: Thẻ `28px`, Input `16px`, Nút `9999px`. Bóng mềm `shadow-card` và `shadow-pop`.
- **Typography**: Tiêu đề `Quicksand 700`, Nội dung `Nunito 400/600/700` ($\ge 16\text{px}$), **Chữ truyện** dùng `Baloo 2` (`clamp(22px, 2.4vw, 32px)`, `line-height: 1.7`) hiển thị dấu tiếng Việt tròn trịa, dễ đọc.
- **Tự động kiểm tra độ tương phản**: Kịch bản `scripts/check-contrast.js` chạy tự động trong `npm run build`, kiểm tra 19 cặp màu token và dừng build ngay nếu có bất kỳ cặp nào không đạt chuẩn WCAG 2.1 AA.

---

## 3. THƯ VIỆN COMPONENT ĐỒNG BỘ (UI PRIMITIVES)

1. **Button (`src/components/ui/Button.tsx`)**:
   - Component nút chuẩn duy nhất toàn ứng dụng với các biến thể: `primary`, `magic`, `secondary`, `soft`, `ghost`, `danger`.
   - Kích thước chuẩn: `sm 40px`, `md 48px`, `lg 56px` (đảm bảo vùng chạm tối thiểu `44px`).
   - Phản hồi xúc giác qua Framer Motion (`scale(0.97)` khi nhấn), hỗ trợ `loading` spinner và `disabled`.
2. **Input (`src/components/ui/Input.tsx`)**:
   - Hỗ trợ đồng thời cả `leftIcon` và `rightIcon` (nút ẩn/hiện mật khẩu hoặc khóa Gemini API Key) với căn lề `pl-11` / `pr-11` chuẩn xác và viền `focus:ring-2` rõ nét.
3. **Thẻ Bìa Sách (`src/components/ui/BookCover.tsx`)**:
   - Tỷ lệ chuẩn `3:4` với gáy sách chuyển sắc dọc bên trái.
   - Chỉ hiển thị hành động **Chia sẻ** khi truyện đã được phê duyệt (`isStoryApproved`), đồng thời tự động bật `is_shared = true` trên cơ sở dữ liệu ngay khi phụ huynh sao chép liên kết chia sẻ.
   - Nút `Đọc` nổi bật cho truyện đã duyệt; nhãn chờ thẩm định cho `pending_review`; lý do sư phạm cho truyện `rejected`; menu `⋯` tích hợp hộp thoại xác nhận xóa an toàn.
4. **Bảo Mật Mã PIN Phụ Huynh (`src/components/ui/OtpPinInput.tsx`)**:
   - Băm mật mã bằng SHA-256 (`fastHashPin`), tuyệt đối không hiển thị PIN dạng văn bản rõ.
   - Giao diện 4 ô số OTP mượt mà, tự động chuyển ô và xác minh khi thiết lập hoặc mở khóa.
5. **Styleguide Route (`/dev/styleguide`)**:
   - Màn hình trực quan hóa toàn bộ hệ thống bảng màu, biến thể nút, thẻ card, badges, modals, inputs và empty states để đối chiếu thiết kế.

---

## 4. BẢO VỆ PHIÊN ĐĂNG NHẬP (SESSION GUARDS) & FOCUS ROUTES

- **Khôi phục phiên mượt mà khi nhấn F5 (`src/app/guards.tsx`)**:
  - Sử dụng cờ `isInitialized` kết hợp màn hình chờ `AuthInitializingScreen` trong `ProtectedRoute`, `AdminRoute` và `PublicAuthRoute`. Khi người dùng tải lại trang trực tiếp tại `/admin/*` hoặc `/story/:id`, hệ thống chờ khôi phục phiên Supabase GoTrue và hồ sơ `profiles` hoàn tất trước khi định tuyến, triệt tiêu hoàn toàn lỗi văng nhầm về `/login` hoặc `/`.
  - Kiểm tra tức thì cờ `profile.is_locked`: nếu tài khoản bị khóa, hệ thống tự động đăng xuất và hiển thị thông báo khóa tài khoản.
- **Desktop Topbar & Mobile Bottom Nav (`UserLayout.tsx`)**:
  - Topbar mảnh cố định với gạch chân trượt `layoutId` (*Trang chủ*, *Tủ sách*, *An toàn AI*), bộ chọn bé toàn cục đồng bộ `activeChildId`, nút *Tạo truyện* và *Chế độ bé*.
  - Thanh điều hướng di động dưới chân với nút nổi trung tâm *Tạo*.
- **Focus Routes**: Các đường dẫn `/create`, `/story/:id`, `/kid`, `/shared/:token` tự động ẩn toàn bộ thanh điều hướng ngoài để cha mẹ và bé tập trung trọn vẹn vào trải nghiệm sáng tác và đọc sách.

---

## 5. CÔNG NGHỆ CLIENT-SIDE ĐẶC THÙ

### 5.1. Kiểm Tra Chất Lượng Ảnh & Hạn Mức Ngày (`CreateStoryPage.tsx`)
- **Phân tích ảnh trên Canvas trước khi tải lên**:
  - **Độ mờ**: Tính phương sai ma trận Laplacian trên ảnh xám (ngưỡng $> 45$ là rõ nét).
  - **Độ sáng**: Tính độ chói trung bình Mean Luminance (ngưỡng $\ge 65$ là đủ sáng).
  - Hỗ trợ chụp ảnh trực tiếp qua `navigator.mediaDevices.getUserMedia` và tạo hồ sơ bé ngay trong Bước 1 với kiểm tra lỗi đầy đủ.
- **Hiển thị Hạn mức thông minh**: Hiển thị huy hiệu số lượt tạo truyện còn lại trong ngày (`Còn X/Y lượt hôm nay`) và điều hướng trực tiếp tới `/admin/settings` nếu Quản trị viên chưa cấu hình khóa Gemini API Key.

### 5.2. Trình Đọc Sách 2 Trang, Hộp Nhạc Ru Ngủ & Chia Sẻ Công Khai
Trong `StoryReadingPage.tsx` và `SharedStoryPage.tsx`:
- **Tải trực tiếp khi F5 (`fetchStoryById`)**: Hỗ trợ truy cập thẳng đường dẫn `/story/:id` mà không cần đi qua Tủ sách, không bao giờ fallback nhầm sang `stories[0]`.
- **Sách lật hai trang chuẩn xác trên Desktop (`HTMLFlipBook`)**: Tính toán `pgSentences` và tọa độ `pgFocus` độc lập cho từng trang `pg` trong vòng lặp spread, đảm bảo mọi trang chẵn/lẻ hiển thị đúng nội dung và hiệu ứng lia máy của riêng trang đó.
- **Chống cắt ảnh (No-Crop Guarantee)**: Tranh vẽ hiển thị bằng `object-fit: contain`, chuyển động Ken Burns kẹp mức phóng tối đa `1.35x` và tôn trọng `prefers-reduced-motion`.
- **TTS Karaoke Tiếng Việt & Hộp Nhạc Ru Ngủ**: Đọc từng câu kèm highlight vàng sáng, nút bật/tắt nhạc hộp ru ngủ (`startLullaby` / `stopLullaby`), hẹn giờ tắt âm 15/30/45 phút và tự động trao huy hiệu `bedtime_reader` khi đọc xong ở Chế độ Ru ngủ.
- **Trang Chia sẻ Công khai (`/shared/:token`)**: Xác thực chặt chẽ cả 3 điều kiện (`share_token` khớp + `is_shared = true` + `isStoryApproved`), sắp xếp trang đúng thứ tự, hiển thị bài học đạo đức và tích hợp bộ chọn giọng đọc `vi-VN`.

### 5.3. Chế Độ Bé Cô Lập Hoàn Toàn (`KidModePage.tsx` & `?mode=kid`)
- Tự động kích hoạt Toàn màn hình (Fullscreen API) và bẫy sự kiện Back trình duyệt (`history.pushState` + `popstate`).
- Chỉ hiển thị những cuốn truyện đã duyệt thuộc đúng hồ sơ bé đang chọn (`activeChildId`) với nút chạm lớn $\ge 72\text{px}$.
- **Khóa chặt luồng đọc `?mode=kid`**: Khi bé mở truyện từ `/kid`, đường dẫn chuyển sang `/story/:id?mode=kid` — tự động ẩn toàn bộ nút Chia sẻ, Xuất PDF/In ấn và Báo cáo vi phạm, đồng thời mọi nút *Quay lại / Đọc xong* đều đưa bé trở về thẳng `/kid` (không bao giờ thoát ra `/library` của phụ huynh).
- **Cổng phụ huynh 3 cơ chế chuẩn xác**: Nhấn giữ nút góc 2 giây (có vòng tiến độ trực quan), hoặc mở hộp thoại xác thực chuyển đổi mượt mà giữa **Đố phép nhân ngẫu nhiên (`math`)** và **Mã PIN 4 số (`pin`)**.

### 5.4. Quản Lý Tài Khoản, Cô Lập Từng Bé & Chống Tràn Viền (`320px`–`1440px`)
- **Cài đặt Gia đình toàn diện (`SettingsPage.tsx`)**: Cho phép phụ huynh cập nhật Họ tên hiển thị, xem Email & hạn mức ngày, đổi mật khẩu Supabase GoTrue, đổi mã PIN SHA-256, thêm/sửa/xóa bất kỳ hồ sơ bé nào (kể cả xóa về 0 bé với trạng thái rỗng rõ ràng), xuất dữ liệu JSON và xóa sạch toàn bộ dữ liệu gia đình + tệp ảnh Storage.
- **Zero Overflow Guarantee**: Bố cục `overflow-x-hidden` trên toàn bộ Layout kết hợp lưới kệ sách linh hoạt (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`), `flex-wrap` và `overflow-x-auto` cho bảng biểu giúp giao diện hiển thị gọn gàng 100% từ màn hình `320px` đến `1440px`.
