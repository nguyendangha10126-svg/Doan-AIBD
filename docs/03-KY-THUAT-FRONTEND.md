# BÁO CÁO KỸ THUẬT FRONTEND & TRẢI NGHIỆM NGƯỜI DÙNG (03-KY-THUAT-FRONTEND.md)
**Dự án: DrawToStory - Hệ thống Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ**  
*Môn học: AI Based Programming - Trường Đại học Phú Xuân*  
*Repository:* [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)

---

## 1. NGÔN NGỮ THIẾT KẾ "MODERN STORYBOOK" & WCAG 2.1 AA

Giao diện của **DrawToStory** được thiết kế đồng nhất theo phong cách **Modern Storybook** xuyên suốt mọi phân hệ (Xác thực, Phụ huynh, Trẻ em, Chia sẻ công khai và **8 trang Quản trị viên**):
- **Bảng màu & Tokens (`tailwind.config.js`)**:
  - Nền kem ấm áp `bg #FFF9F0` phủ nhiễu giấy nhẹ (`3.5%`), `surface #FFFFFF`, `surface-2 #FFF3E6`.
  - Mực chữ tương phản cao: `ink #2E2540`, `ink-soft #5E5370` ($\ge 6.5:1$), `ink-faint #8A7F99`.
  - Màu thương hiệu & phép thuật: `brand-600 #D13A5E`, `magic-600 #6C5CE7`, dải chuyển sắc ma thuật `#8B7CF6 → #F472B6`.
  - Trạng thái ngữ nghĩa: Success `#166E48` (`5.49:1`), Warning `#8A5A00` (`5.23:1`), Danger `#B42343` (`5.34:1`), Info `#1F5FA8` (`5.05:1`).
- **Kiểm định tương phản tự động**: Kịch bản `scripts/check-contrast.js` chạy tự động trước mỗi lần build (`npm run build`), xác nhận toàn bộ **19/19 cặp màu** đạt chuẩn WCAG 2.1 AA.
- **Vòng tiêu điểm bàn phím chuẩn WCAG 1.4.11**: Quy tắc `:focus-visible` với đường viền tương phản cao (`2px solid #D13A5E`, `outline-offset: 3px`) đảm bảo điều hướng bàn phím rõ ràng trên mọi điều khiển mà không gây nhiễu khi nhấn chuột.

---

## 2. HỆ THỐNG COMPONENT HIỆN ĐẠI: NATIVE `<dialog>` & CAROUSEL HƯỚNG DẪN

### 2.1. Hộp Thoại Chuẩn HTML5 `<dialog>` (`src/components/ui/Modal.tsx`)
- Sử dụng phần tử `<dialog>` nguyên bản mở bằng `dialog.showModal()` (promotion lên Top Layer, tự động `inert` nền phía sau, hỗ trợ phím `Esc` và trả lại tiêu điểm cho nút kích hoạt).
- **Chống tràn chiều dọc trên Desktop & Mobile**: Áp dụng `max-h-[90dvh]` kết hợp bố cục cột linh hoạt (`dialog.dts-modal[open] { display: flex }` với vùng nội dung `overflow-y-auto min-h-0 flex-1`), giúp các biểu mẫu dài như *Thêm hồ sơ bé* hiển thị trọn vẹn và cuộn mượt mà trên mọi độ phân giải.
- **Khóa cuộn nền bằng CSS thuần**: Kết hợp `overscroll-behavior: contain` trên `dialog:modal` và `overflow: hidden; overscroll-behavior: contain` trên `dialog::backdrop` mà không can thiệp `document.body.style.overflow` (tránh giật bố cục thanh cuộn). Hỗ trợ đóng nhanh khi chạm ra ngoài bằng `closedby="any"` kèm fallback tọa độ con trỏ cho trình duyệt chưa hỗ trợ.

### 2.2. Bảng Hướng Dẫn Sử Dụng Vuốt Ngang (`src/features/onboarding/components/UserGuideModal.tsx`)
- **Tự động mở khi đăng nhập**: Ngay khi người dùng đăng nhập vào `UserLayout` hoặc `AdminLayout`, hộp thoại tự động hiển thị bộ **4 slide hướng dẫn chuyên biệt** theo đúng vai trò (*Phụ huynh* hoặc *Quản trị viên*).
- **Carousel CSS Scroll-Snap Chuẩn Tiếp Cận**:
  - Xây dựng trên thanh cuộn ngang tự nhiên (`display: flex; overflow-x: auto; scroll-snap-type: x mandatory; touch-action: manipulation`), cho phép lướt tay mượt mà trên điện thoại hoặc bấm nút Trước/Tiếp và các chấm chỉ mục (`aria-current="true"`).
  - Đồng bộ chấm chỉ mục theo thời gian thực qua `requestAnimationFrame` và công bố slide hiện tại qua vùng `role="status" aria-live="polite"` sau sự kiện `scrollend` (kèm debounce fallback).
- **Tùy chọn ẩn thông minh & Mở lại mọi lúc**:
  - Nút **"Đóng"**: Ẩn trong phiên làm việc hiện tại (`sessionStorage`), sẽ hiển thị lại ở lần đăng nhập kế tiếp.
  - Nút **"Tắt & Không hiện lại"**: Lưu cờ ẩn lâu dài theo `userId` trong `localStorage` (có nút bật lại ngay trong hộp thoại khi mở thủ công).
  - Mục **"Hướng dẫn sử dụng"** được đặt cố định **ngay phía trên nút "Đăng xuất"** trong menu thả xuống tài khoản ở cả giao diện Phụ huynh và Quản trị viên.

---

## 3. KIẾN TRÚC ROUTER TẢI LƯỜI (`React.lazy`), CÔ LẬP DỮ LIỆU & TIÊU ĐỀ ĐỘNG

### 3.1. Phân Tách Bundle Bằng `React.lazy` (`src/app/router.tsx`)
- Tách riêng toàn bộ gói Quản trị (`AdminLayout`, 8 trang Admin và thư viện biểu đồ `Recharts 3`), `StoryReadingPage` (`react-pageflip`), `SharedStoryPage`, `CreateStoryPage` và `KidModePage` thành các dynamic chunks tải theo nhu cầu với `<Suspense>`.
- Nhờ đó, phụ huynh truy cập trang Đăng nhập hoặc Tủ sách không phải tải mã nguồn quản trị hay thư viện biểu đồ nặng.
- **Chuẩn hóa đường dẫn & Khóa Route Dev**:
  - Chuyển hướng sạch các đường dẫn trùng lặp bằng `<Navigate replace />`: `/kid-mode` → `/kid`, `/admin/overview` → `/admin`, `/admin/moderation` → `/admin/queue`.
  - Đường dẫn `/dev/styleguide` được bao bọc bởi `import.meta.env.DEV`, tự động loại bỏ hoàn toàn khỏi bản build Production.
- **Tiêu đề & Thẻ OpenGraph Động (`RootDocumentMetaLayout`)**: Tự động cập nhật `document.title`, `og:title` và `twitter:title` tương ứng với từng trang đang mở.

### 3.2. Cô Lập Dữ Liệu Theo Tài Khoản & Từng Hồ Sơ Bé
- Trong môi trường Production (`isDemoMode === false`), các Zustand stores (`authStore`, `storyStore`, `adminStore`) không lưu trữ danh sách truyện hay số liệu KPI cũ trong `localStorage` và tự động dọn sạch bộ nhớ đệm ngay khi phát sự kiện `drawtostory:logged-out`, triệt tiêu hoàn toàn hiện tượng rò rỉ dữ liệu giữa các tài khoản hoặc "biến mất truyện" khi chuyển đổi hồ sơ bé.

---

## 4. TRÌNH ĐỌC SÁCH CHỐNG CẮT CHỮ, KID MODE & QUYỀN RIÊNG TƯ GDPR

1. **Trình Đọc Sách 2 Trang Chống Cắt Chữ (`StoryReadingPage.tsx`)**:
   - Cân chỉnh thang cỡ chữ truyện (`sm`, `md`, `lg`) hài hòa với khung sách `500×620` của `HTMLFlipBook`, đồng thời bọc vùng văn bản trong khung cuộn độc lập (`flex-1 min-h-0 overflow-y-auto` + chặn lan truyền `onWheel`) và tắt lật trang ngẫu nhiên khi bấm chọn văn bản (`disableFlipByClick={true}`), đảm bảo trang sách không bao giờ bị tràn hoặc cắt mất dòng cuối trên Desktop.
   - Giữ nguyên tỷ lệ bức tranh gốc của bé bằng `object-fit: contain` và giới hạn phóng đại Ken Burns $\le 1.35\times$.
2. **Chế Độ Bé & Cổng Phụ Huynh Không Mật Mã Mặc Định (`KidModePage.tsx`)**:
   - Xóa bỏ hoàn toàn gợi ý mã PIN `1234` công khai và bỏ cơ chế nhấn giữ 2 giây thoát tự do.
   - Để rời khỏi `/kid`, phụ huynh bắt buộc nhập đúng **Mã PIN 4 số riêng của gia đình** (được băm kèm Salt riêng theo User ID qua `saltedHashPinSync`) hoặc giải đúng phép nhân hai chữ số dành cho người lớn (`12..19 × 6..9`).
3. **Thực Thi Quyền Được Lãng Quên Thật (`SettingsPage.tsx`)**:
   - Khi phụ huynh chọn **Xóa vĩnh viễn tài khoản**, hệ thống yêu cầu nhập lại **Mật khẩu tài khoản hiện tại** + gõ từ khóa xác nhận **`XOA`**, sau đó gọi Edge Function `delete-account` để xóa toàn bộ tệp ảnh trên Storage, xóa hồ sơ gia đình (cascade toàn bộ bé/truyện/huy hiệu) và xóa vĩnh viễn tài khoản khỏi `auth.users`.
