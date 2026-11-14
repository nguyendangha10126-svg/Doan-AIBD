# BẢN TUYÊN BỐ SỬ DỤNG TRÍ TUỆ NHÂN TẠO (AI-DECLARATION.md)
**Dự án: DrawToStory - Nền tảng Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ**  
*Đồ án học phần: AI Based Programming (Lập trình ứng dụng Trí tuệ Nhân tạo)*  
*Đơn vị đào tạo: Trường Đại học Phú Xuân*  
*Repository:* [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)

---

## 1. NGUYÊN TẮC MINH BẠCH & TRÁCH NHIỆM HỌC THUẬT

Tuân thủ quy chế học thuật của Trường Đại học Phú Xuân và nguyên tắc đạo đức trong kỷ nguyên Trí tuệ Nhân tạo, tài liệu này công khai toàn bộ quá trình sử dụng các mô hình và công cụ AI hỗ trợ trong quá trình phân tích, thiết kế kiến trúc, sinh mã nguồn, kiểm thử bảo mật và tài liệu hóa dự án **DrawToStory**.

Tôi/Nhóm tác giả cam kết:
- AI được sử dụng với vai trò **Cộng sự Kỹ thuật (Pair Programmer & Technical Partner)** dưới sự định hướng, giám sát, kiểm định bảo mật và hiệu chỉnh trực tiếp của con người.
- Toàn bộ các quyết định kiến trúc, bảo mật khóa bí mật phía máy chủ (Server-Side Secrets), tiêu chuẩn an toàn thiếu nhi (Child Safety Standards), thiết kế cơ sở dữ liệu và trải nghiệm người dùng (UX) đều được lập trình viên thẩm định, hiểu rõ và chịu trách nhiệm 100%.

---

## 2. NHẬT KÝ TƯƠNG TÁC VÀ CÁC CÔNG CỤ AI SỬ DỤNG

| Giai đoạn | Công cụ / Nền tảng | Mô hình AI | Mục đích & Lời nhắc tóm tắt | Kết quả đầu ra | Đánh giá & Hiệu chỉnh thủ công |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 0**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Rà soát data layer, loại bỏ mock data ẩn, cố định banner demo khi bật `VITE_USE_MOCK=true`, mã hóa PIN phụ huynh. | `SystemBanner.tsx`, `OtpPinInput.tsx`, chụp 18 ảnh "TRƯỚC". | Khắc phục hiển thị mã PIN dạng plaintext, chuyển đổi mock ID sang định dạng UUID hợp lệ. |
| **Phase 1**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Tái thiết kế Design System theo định hướng "Modern Storybook", thêm font Baloo 2, viết script kiểm tra độ tương phản WCAG 2.1 AA. | `tailwind.config.js`, `scripts/check-contrast.js`, bộ UI Primitives (`Button`, `Card`, `Modal`...). | Tinh chỉnh mã màu xanh `success` từ `#1F8A5B` (3.8:1) thành `#166E48` (5.49:1) để đạt chuẩn WCAG AA cho mọi cỡ chữ. |
| **Phase 2**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Chuẩn hóa thanh điều hướng Desktop và Mobile, bổ sung cơ chế Focus Routes ẩn sạch thanh điều hướng cho các màn hình tập trung. | `UserLayout.tsx` với sliding indicator `layoutId`, bộ chọn bé toàn cục, thanh tab mobile. | Ẩn hoàn toàn header/footer trên `/create`, `/story/:id`, `/kid`, `/shared/:token` để trẻ và cha mẹ không bị phân tâm. |
| **Phase 3**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Tạo component Thẻ bìa sách (`BookCover.tsx`), thiết kế lại Dashboard, Tủ sách, An toàn AI và Quản lý bé trong Cài đặt. | `BookCover.tsx`, `DashboardPage.tsx`, `LibraryPage.tsx`, `TrustPage.tsx`, `SettingsPage.tsx`. | Thay thế danh sách phẳng bằng kệ sách responsive 2/3/4 cột có đường chỉ gỗ mảnh, hero chia đôi sân khấu tranh vẽ polaroid. |
| **Phase 4**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Xây dựng pipeline AI 3 lớp (phân loại tranh vẽ, visual grounding, faithfulness score), bộ 6 fixtures kiểm thử, kiểm tra ảnh phía client. | `safety.ts`, `generate-story/index.ts`, `tests/fixtures/`, `CreateStoryPage.tsx`. | Cài đặt thuật toán Laplacian variance ($>45$) và Mean luminance ($\ge 65$) trực tiếp trên Canvas client; trả về lỗi thân thiện `NOT_A_DRAWING`. |
| **Phase 5**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Trình đọc sách lật 2 trang `react-pageflip` (desktop) và swipe (mobile), chống cắt tranh (`object-fit: contain`), TTS karaoke, chế độ bé cô lập. | `StoryReadingPage.tsx`, `KidModePage.tsx`, `soundEffects` (Web Audio API). | Giới hạn Ken Burns zoom tối đa 1.35x và kẹp an toàn tọa độ tâm; bẫy lịch sử duyệt web `popstate`. |
| **Phase 6**<br/>20/10/2026 | Puppeteer Headless | Node.js Automation | Nâng cấp trang Quản trị kiểm duyệt (Split View, phím tắt A/R, toggle strict drawing check), chụp 18 ảnh "SAU". | `ModerationQueuePage.tsx`, `ModerationSettingsPage.tsx`, 18 ảnh trong `docs/screenshots/after/`. | Kiểm tra toàn bộ quy trình build (`check-contrast` + `typecheck` + `vite build`). |
| **Phase 7–9**<br/>31/10 - 08/11/2026 | Antigravity Agent | Gemini 2.5 Pro | Kết nối Supabase Cloud, chuẩn hóa ESLint/TSConfig, thêm giọng đọc tiếng Việt tự nhiên (`vi-VN`), đồng bộ RBAC và giao diện 320px–1440px. | `supabase/full_setup.sql`, `src/lib/supabase.ts`, `SharedStoryPage.tsx`, `adminStore.ts`. | Bổ sung Edge Function `get-shared-story` ký URL ảnh an toàn cho liên kết chia sẻ công khai. |
| **Phase 10**<br/>13/11/2026 | Antigravity Agent | Gemini 2.5 Pro | Hoàn thiện Gamification 5 huy hiệu tự động, nhạc hộp Lullaby, khóa luồng `?mode=kid` và đồng bộ Modern Storybook cho 8 trang Admin. | `storyStore.ts`, `guards.tsx`, `sound.ts`, các trang Admin. | Khắc phục lỗi `HTMLFlipBook` hiển thị trùng trang bằng cách tính `pgSentences` và `pgFocus` độc lập theo từng trang. |
| **Phase 11**<br/>14/11/2026 | Antigravity Agent | Claude Opus 4.6 | Tổng kiểm toán bảo mật Production (Zero-Trust Security Audit), xóa bỏ demo bypass & mật khẩu cứng trong SQL, cô lập `GEMINI_API_KEY` 100% lên Edge Functions, thêm xóa tài khoản thật `delete-account`, nâng cấp `Recharts 3`, `React.lazy`, native `<dialog>` và tạo `UserGuideModal` vuốt ngang. | `001_init.sql`, `seed.sql`, `full_setup.sql`, `delete-account/index.ts`, `pipelineRules.js`, `UserGuideModal.tsx`, `Modal.tsx`, `router.tsx`, toàn bộ stores/pages & 7 file `.md`. | Loại bỏ triệt để mọi lộ lọt khóa Gemini và mật khẩu mẫu khỏi repo công khai; thêm hàm `promote_to_admin(email)` chỉ dành cho chủ DB; băm PIN có salt riêng theo User ID; sửa cắt chữ FlipBook desktop và đồng bộ ngày địa phương cho biểu đồ Admin. |

---

## 3. CÁC HIỆU CHỈNH BẢO MẬT & KỸ THUẬT QUAN TRỌNG TỪ CON NGƯỜI (HUMAN INTERVENTIONS)

1. **Cô lập Hoàn toàn Khóa Gemini API Ở Phía Máy Chủ (Server-Only Secrets)**:
   - Loại bỏ hoàn toàn việc lưu `gemini_api_key` trong bảng `app_settings` hoặc biến `VITE_GEMINI_API_KEY` phía trình duyệt. Mọi yêu cầu sinh truyện và thử nghiệm System Prompt đều đi qua Supabase Edge Functions (`generate-story`, `admin-test-prompt`) sử dụng `Deno.env.get('GEMINI_API_KEY')` truyền qua header `x-goog-api-key`.
2. **Xóa Bỏ Mật Khẩu Mẫu Trong Repo Công Khai & Cổng Đăng Nhập Giả Lập Trên Production**:
   - Xóa toàn bộ câu lệnh chèn mật khẩu cố định khỏi `seed.sql` / `full_setup.sql` và bổ sung hàm `public.promote_to_admin(text)` (đã thu hồi quyền thực thi từ `public`, `anon`, `authenticated`) để chủ hệ thống tự cấp quyền Admin an toàn trong SQL Editor. Khóa chặt `isDemoMode` chỉ hoạt động khi `import.meta.env.DEV && VITE_USE_MOCK === 'true'`.
3. **Bảo Vệ Cổng Phụ Huynh Thực Thụ & Quyền Được Lãng Quên (GDPR Right-to-Erasure)**:
   - Xóa bỏ mọi gợi ý mã PIN mặc định `1234` và cơ chế nhấn giữ 2 giây thoát tự do ở Chế độ Bé; nâng cấp băm PIN kèm Salt riêng theo User ID (`saltedHashPinSync`) kết hợp phép nhân người lớn (`12..19 × 6..9`). Xây dựng Edge Function `delete-account` xóa sạch tệp ảnh Storage, dữ liệu gia đình và tài khoản `auth.users` thực sự.
4. **Chuẩn Hóa Biệt Danh Bé (`formatChildName`) & Kiểm Thử Mã Nguồn Thật (`pipelineRules.js`)**:
   - Khắc phục triệt để lỗi ghép trùng tiền tố `"Bé Bé Hà"` ở cả dữ liệu đầu vào lẫn hiển thị và AI Prompt. Tách logic phân loại an toàn vào `src/features/ai/utils/pipelineRules.js` để cả ứng dụng lẫn kịch bản `scripts/test-pipeline.js` cùng kiểm định trên một nguồn mã duy nhất.
5. **Tối Ưu Trải Nghiệm Native `<dialog>`, Carousel Hướng Dẫn Vuốt Ngang & Tách Gói `React.lazy`**:
   - Chuyển đổi hộp thoại sang phần tử `<dialog>` chuẩn HTML5 với cuộn nội bộ `max-h-[90dvh]`, khắc phục tràn chữ trên trang đọc lật sách Desktop, tách gói tải lười toàn bộ trang Admin (`Recharts 3`) và bổ sung `UserGuideModal` vuốt ngang tự động khi đăng nhập kèm lối mở nhanh ngay phía trên nút Đăng xuất.

---

## 4. BÀI HỌC KINH NGHIỆM VỀ LẬP TRÌNH ỨNG DỤNG AI (LESSONS LEARNED)

1. **Không Bao Giờ Đặt Khóa AI Hoặc Bypass Tiện Lợi Lên Môi Trường Production**: Mọi lối tắt phục vụ demo cục bộ nếu không được khóa chặt ở tầng build-time (`import.meta.env.DEV`) và tách biệt ở tầng máy chủ (Edge Functions) đều trở thành lỗ hổng nghiêm trọng khi đưa lên Internet.
2. **Responsible AI Phải Gắn Liền Với Bảo Vệ Dữ Liệu Thực Chất**: Kiểm duyệt nội dung 3 lớp chỉ trọn vẹn khi đi cùng Row Level Security chặt chẽ, cô lập dữ liệu từng tài khoản/từng bé trên trình duyệt và khả năng xóa sạch dấu vết dữ liệu khi gia đình yêu cầu.
3. **Kiểm Thử Phải Gắn Trực Tiếp Vào Mã Nguồn Vận Hành**: Các tệp kiểm thử tự động chỉ có giá trị bảo vệ chất lượng khi import và chạy trực tiếp trên hàm nghiệp vụ thật của dự án kết hợp kiểm tra tĩnh (`typecheck`, `lint`, `check:contrast`, `build`).
