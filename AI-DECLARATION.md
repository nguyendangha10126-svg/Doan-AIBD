# BẢN TUYÊN BỐ SỬ DỤNG TRÍ TUỆ NHÂN TẠO (AI-DECLARATION.md)
**Dự án: DrawToStory - Nền tảng Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ**  
*Đồ án học phần: AI Based Programming (Lập trình ứng dụng Trí tuệ Nhân tạo)*  
*Đơn vị đào tạo: Trường Đại học Phú Xuân*

---

## 1. NGUYÊN TẮC MINH BẠCH & TRÁCH NHIỆM HỌC THUẬT

Tuân thủ quy chế học thuật của Trường Đại học Phú Xuân và nguyên tắc đạo đức trong kỷ nguyên Trí tuệ Nhân tạo, tài liệu này công khai toàn bộ quá trình sử dụng các mô hình và công cụ AI hỗ trợ trong quá trình phân tích, thiết kế kiến trúc, sinh mã nguồn, kiểm thử và tài liệu hóa dự án **DrawToStory**.

Tôi/Nhóm tác giả cam kết:
- AI được sử dụng với vai trò **Cộng sự Kỹ thuật (Pair Programmer & Technical Partner)** dưới sự định hướng, giám sát, kiểm định và hiệu chỉnh trực tiếp của con người.
- Toàn bộ các quyết định kiến trúc, tiêu chuẩn an toàn thiếu nhi (Child Safety Standards), thiết kế cơ sở dữ liệu và trải nghiệm người dùng (UX) đều được lập trình viên thẩm định, hiểu rõ và chịu trách nhiệm 100%.

---

## 2. NHẬT KÝ TƯƠNG TÁC VÀ CÁC CÔNG CỤ AI SỬ DỤNG

| Thời gian | Công cụ / Nền tảng | Mô hình AI | Mục đích & Lời nhắc tóm tắt | Kết quả đầu ra | Đánh giá & Hiệu chỉnh thủ công |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Giai đoạn 1**<br/>19/10/2026 | Google Antigravity IDE | Gemini 2.5 Pro / Claude 3.5 Sonnet | Khởi tạo Implementation Plan, thiết kế Design System tokens trong Tailwind CSS và từ điển tiếng Việt tập trung. | Bộ khung dự án React + TypeScript Strict, file `src/lib/i18n/vi.ts`, bộ UI Primitives (Button, Modal, Card...). | Tinh chỉnh lại mã màu pastel WCAG AA đảm bảo tương phản văn bản chữ tím than `#4A3F55` trên nền kem `#FFF9F0`. |
| **Giai đoạn 2**<br/>19/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Thiết kế Schema Supabase Postgres 13 bảng, RLS, hàm `is_admin()` Security Definer và bộ Seed Data 30 ngày. | `supabase/migrations/001_init.sql`, `supabase/seed.sql`, TypeScript database types. | Bổ sung ràng buộc CHECK constraint và sửa lỗi type cast trong các hàm Views phân tích doanh thu và độ trễ. |
| **Giai đoạn 3**<br/>19/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Xây dựng 3-Layer Edge Function Pipeline (`generate-story`), Client Service nén Canvas $\le 1.5$MB. | Supabase Edge Functions (`_shared/`, `generate-story/`, `get-shared-story/`, `admin-test-prompt/`). | Kiểm tra định dạng Deno, bọc Timeout 25s, xử lý lỗi Zod Schema retry và viết client offline mock để chấm bài mượt mà. |
| **Giai đoạn 4**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Flash | Hiện thực hóa toàn bộ luồng User: Wizard 3 bước, Trình đọc sách 3D + Swipe, Ken Burns zoom, TTS Web Speech. | `StoryReadingPage`, `CreateStoryPage`, `DashboardPage`, `KidModePage`, `LibraryPage`. | Sửa lỗi `TS6133` (unused variables) trong strict mode; bổ sung CSS `@media print` cho tính năng in sách thật. |
| **Giai đoạn 5**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Xây dựng bộ công cụ Quản trị viên: Hàng đợi Moderation Queue (A/R), Rules CRUD, Prompt Studio, Biểu đồ chi phí. | 6 trang Admin và Dashboard Recharts. | Tối ưu hóa layout chia đôi cột (Split View), bổ sung bộ phím tắt và modal xác nhận lý do từ chối mẫu. |
| **Giai đoạn 6**<br/>20/10/2026 | Puppeteer Headless | Node.js Automation | Chụp ảnh kiểm thử tự động toàn bộ màn hình ở độ phân giải 1440px (Desktop) và 390px (Mobile). | 12 bức ảnh chụp màn hình chất lượng cao trong `docs/screenshots/`. | Xử lý xung đột cổng preview (chuyển sang port 5199), nạp sẵn dữ liệu `localStorage` để chụp trạng thái hoàn hảo. |

---

## 3. CÁC HIỆU CHỈNH KỸ THUẬT QUAN TRỌNG TỪ CON NGƯỜI (HUMAN INTERVENTIONS)

Trong quá trình đồng hành cùng AI Agent, lập trình viên đã phát hiện và can thiệp điều chỉnh các điểm then chốt:

1. **Khắc phục Xung đột Cổng và Quản lý Tiến trình Nền**:
   - Khi chạy `vite preview` mặc định trên cổng `5173`, hệ thống gặp xung đột với tiến trình có sẵn trên máy cục bộ. Lập trình viên đã chỉ đạo cấu hình cổng cố định `5199` với cờ `--strictPort` và lưu vào kịch bản kiểm thử.
2. **Kỷ luật TypeScript Tuyệt Đối (Zero Unused Locals & Zero `any`)**:
   - Do bật cấu hình nghiêm ngặt `noUnusedLocals: true`, một số đoạn code AI sinh ra có các biến thừa (như `_index`, `storyId` không dùng). Lập trình viên đã rà soát và loại bỏ 100% cảnh báo `TS6133`, bảo đảm lệnh `npm run typecheck` chạy hoàn toàn không có lỗi.
3. **Cơ chế Dự phòng Trực quan (Graceful Offline/Reviewer Mode)**:
   - Nhận thấy người chấm bài (Giảng viên) có thể không có sẵn tài khoản Supabase Cloud với đầy đủ API keys lúc chạy thử nghiệm đồ án tại chỗ, lập trình viên đã thiết kế cơ chế Fallback Store trực tiếp trong Zustand (`useAuthStore`, `useStoryStore`, `useAdminStore`). Nhờ vậy, giảng viên có thể đăng nhập với các tài khoản Demo (`me@phuhuynh.vn`, `admin@drawtostory.vn`) và trải nghiệm toàn bộ tính năng mượt mà.
4. **Bảo Vệ Quyền Riêng Tư Thiếu Nhi (Child Privacy Enforcement)**:
   - Ban đầu mô hình AI gợi ý lưu tên đầy đủ của trẻ. Lập trình viên đã chủ động tái cấu trúc bảng `children` để **chỉ lưu biệt danh (nickname) và độ tuổi**, tuyệt đối không lưu họ tên thật, ngày sinh chi tiết hay địa chỉ trường học.

---

## 4. BÀI HỌC KINH NGHIỆM VỀ LẬP TRÌNH ỨNG DỤNG AI (LESSONS LEARNED)

1. **AI là Trợ lý, Kiến trúc sư là Con người**: AI có khả năng viết mã nhanh chóng với tốc độ vượt bậc, nhưng nếu không có một kiến trúc phân tầng rõ ràng (Phases 1-6) và các quy chuẩn thiết kế khắt khe ngay từ đầu, mã nguồn sẽ rất dễ bị rời rạc hoặc phát sinh lỗi tiềm ẩn.
2. **Cần Coi Trọng Responsible AI Ngay Từ Dòng Code Đầu Tiên**: Đối với các ứng dụng cho trẻ em, "Safety" không thể là một tính năng phụ thêm vào sau cùng, mà phải được định hình thành một lớp độc lập (Layer 3 Safety Judge) kết hợp cơ chế kiểm duyệt có con người can thiệp (Human-in-the-loop).
3. **Kỹ nghệ Kiểm thử Bằng Chứng Thị Giác (Visual Evidence Testing)**: Việc tự động hóa kiểm thử bằng ảnh chụp headless ở cả kích thước Desktop (1440px) và Mobile (390px) giúp phát hiện tức thì các lỗi tràn giao diện hoặc độ tương phản không đạt chuẩn, mang lại sự tin cậy tối đa cho sản phẩm.

