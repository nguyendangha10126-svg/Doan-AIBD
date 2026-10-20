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

| Giai đoạn | Công cụ / Nền tảng | Mô hình AI | Mục đích & Lời nhắc tóm tắt | Kết quả đầu ra | Đánh giá & Hiệu chỉnh thủ công |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 0**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Rà soát data layer, loại bỏ mock data ẩn, cố định banner demo khi bật `VITE_USE_MOCK=true`, mã hóa PIN phụ huynh bằng SHA-256. | `SystemBanner.tsx`, `OtpPinInput.tsx`, băm mật mã SHA-256, chụp 18 ảnh "TRƯỚC". | Khắc phục lỗ hổng hiển thị mã PIN dạng plaintext `••••`, chuyển đổi toàn bộ mock story ID sang định dạng UUID hợp lệ. |
| **Phase 1**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Tái thiết kế Design System theo định hướng "Modern Storybook", thêm font Baloo 2, viết script kiểm tra độ tương phản WCAG 2.1 AA. | `tailwind.config.js`, `scripts/check-contrast.js`, bộ UI Primitives (`Button`, `Card`, `Modal`...). | Tinh chỉnh mã màu xanh `success` từ `#1F8A5B` (3.8:1) thành `#166E48` (5.49:1) để đạt chuẩn WCAG AA cho mọi cỡ chữ. |
| **Phase 2**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Chuẩn hóa thanh điều hướng Desktop và Mobile, bổ sung cơ chế Focus Routes ẩn sạch thanh điều hướng cho các màn hình tập trung. | `UserLayout.tsx` với sliding indicator `layoutId`, bộ chọn bé toàn cục, thanh tab mobile. | Ẩn hoàn toàn header/footer trên `/create`, `/story/:id`, `/kid`, `/shared/:token` để trẻ và cha mẹ không bị phân tâm. |
| **Phase 3**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Tạo component Thẻ bìa sách (`BookCover.tsx`), thiết kế lại Dashboard, Tủ sách, An toàn AI và Quản lý bé trong Cài đặt. | `BookCover.tsx`, `DashboardPage.tsx`, `LibraryPage.tsx`, `TrustPage.tsx`, `SettingsPage.tsx`. | Thay thế danh sách phẳng bằng kệ sách responsive 2/3/4 cột có đường chỉ gỗ mảnh, hero chia đôi sân khấu tranh vẽ polaroid. |
| **Phase 4**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Sửa triệt để pipeline AI (phân loại tranh vẽ, visual grounding, faithfulness score), tạo bộ 6 fixtures kiểm thử, kiểm tra ảnh phía client. | `safety.ts`, `generate-story/index.ts`, `tests/fixtures/`, `scripts/test-pipeline.js`, `CreateStoryPage.tsx`. | Cài đặt thuật toán Laplacian variance ($>45$) và Mean luminance ($\ge 65$) trực tiếp trên Canvas client; trả về lỗi thân thiện `NOT_A_DRAWING`. |
| **Phase 5**<br/>20/10/2026 | Antigravity Agent | Gemini 2.5 Pro | Trình đọc sách lật 2 trang `react-pageflip` (desktop) và swipe (mobile), chống cắt tranh (`object-fit: contain`), TTS karaoke, chế độ bé cô lập. | `StoryReadingPage.tsx`, `KidModePage.tsx`, `soundEffects` (Web Audio API). | Giới hạn Ken Burns zoom tối đa 1.35x và kẹp an toàn tọa độ tâm; bẫy lịch sử duyệt web `popstate` và khóa cổng phụ huynh 2 giây. |
| **Phase 6**<br/>20/10/2026 | Puppeteer Headless | Node.js Automation | Nâng cấp trang Quản trị kiểm duyệt (Split View, phím tắt A/R, toggle strict drawing check), chụp 18 ảnh "SAU", cập nhật toàn bộ tài liệu. | `ModerationQueuePage.tsx`, `ModerationSettingsPage.tsx`, 18 ảnh trong `docs/screenshots/after/`, bộ docs. | Kiểm tra toàn bộ quy trình build (`check-contrast` + `typecheck` + `vite build`), đảm bảo 0 lỗi TypeScript và 0 `any`. |

---

## 3. CÁC HIỆU CHỈNH KỸ THUẬT QUAN TRỌNG TỪ CON NGƯỜI (HUMAN INTERVENTIONS)

Trong quá trình đồng hành cùng AI Agent, lập trình viên đã phát hiện và can thiệp điều chỉnh các điểm then chốt:

1. **Khắc phục lỗi nhận diện sai tranh vẽ thiếu nhi (Strict Multimodal Classification)**:
   - Trước đây khi tải lên ảnh logo (ví dụ logo "Unipat") hoặc ảnh chụp hoa lá, AI vẫn sinh ra câu chuyện "muông thú trong rừng" hoặc "Chú voi hồng" không liên quan. Lập trình viên đã can thiệp thiết kế Lớp 1 phân loại đa thể thức (`child_drawing` vs `logo_graphic`/`photo`), chỉ cho phép tranh vẽ thật tiến hành sinh truyện và bắt buộc Lớp 2 phải bám sát vật thể trong tranh (`grounded_objects`).
2. **Kỷ luật WCAG 2.1 AA Bắt Buộc Trong CI/CD**:
   - Tự động hóa kiểm tra độ tương phản 19 cặp token màu ngay trong lệnh `npm run build`. Khi màu xanh lá `#1F8A5B` trên nền `#DDF6E9` cho tỷ lệ 3.80:1 (chưa đạt 4.5:1), kịch bản tự động dừng build. Lập trình viên đã tinh chỉnh sang `#166E48` (5.49:1) để bảo đảm khả năng tiếp cận hoàn hảo.
3. **Bảo Mật Mã PIN Phụ Huynh Bằng Băm SHA-256**:
   - Phát hiện mã PIN phụ huynh ban đầu được lưu và hiển thị dưới dạng văn bản rõ `••••`, lập trình viên đã thay thế bằng hàm băm mật mã SHA-256 đồng bộ và thiết kế modal nhập 4 ô số OTP riêng biệt.
4. **Trải Nghiệm Đọc Sách Không Cắt Hình & Chế Độ Bé An Toàn**:
   - Sử dụng thuộc tính `object-fit: contain` trong khung giấy polaroid, kẹp tọa độ tâm và giới hạn Ken Burns zoom ở mức tối đa 1.35x để giữ trọn vẹn từng nét vẽ của trẻ. Thiết lập bẫy lịch sử duyệt web để trẻ không thể tự ý thoát ra ngoài màn hình quản trị của phụ huynh.

---

## 4. BÀI HỌC KINH NGHIỆM VỀ LẬP TRÌNH ỨNG DỤNG AI (LESSONS LEARNED)

1. **AI là Trợ lý, Kiến trúc sư là Con người**: AI có khả năng viết mã nhanh chóng với tốc độ vượt bậc, nhưng nếu không có một kiến trúc phân tầng rõ ràng (Phases 1-6) và các quy chuẩn thiết kế khắt khe ngay từ đầu, mã nguồn sẽ rất dễ bị rời rạc hoặc phát sinh lỗi tiềm ẩn.
2. **Cần Coi Trọng Responsible AI Ngay Từ Dòng Code Đầu Tiên**: Đối với các ứng dụng cho trẻ em, "Safety" không thể là một tính năng phụ thêm vào sau cùng, mà phải được định hình thành một lớp độc lập (Layer 3 Safety Judge) kết hợp cơ chế kiểm duyệt có con người can thiệp (Human-in-the-loop).
3. **Kỹ nghệ Kiểm thử Bằng Chứng Thị Giác (Visual Evidence Testing)**: Việc tự động hóa kiểm thử bằng ảnh chụp headless ở cả kích thước Desktop (1440px) và Mobile (390px) giúp phát hiện tức thì các lỗi tràn giao diện hoặc độ tương phản không đạt chuẩn, mang lại sự tin cậy tối đa cho sản phẩm.
