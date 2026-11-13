# BẢN TUYÊN BỐ SỬ DỤNG TRÍ TUỆ NHÂN TẠO (AI-DECLARATION.md)
**Dự án: DrawToStory - Nền tảng Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ**  
*Đồ án học phần: AI Based Programming (Lập trình ứng dụng Trí tuệ Nhân tạo)*  
*Đơn vị đào tạo: Trường Đại học Phú Xuân*  
*Repository:* [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)

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
| **Phase 7**<br/>31/10 - 02/11/2026 | Antigravity Agent | Gemini 2.5 Pro | Khắc phục triệt để các cảnh báo VS Code: giải quyết cảnh báo `baseUrl` deprecated trong TS 5.8+, chuẩn hóa ESLint trên toàn bộ thư mục scripts và đẩy mã nguồn lên GitHub. | `tsconfig.json`, `eslint.config.js`, `scripts/test-pipeline.js`, GitHub repository setup. | Tinh chỉnh `paths` trong tsconfig không cần `baseUrl`, cấu hình Node.js environment globals trong ESLint Flat config, bảo đảm 100% không còn gạch đỏ trong IDE. |
| **Phase 8**<br/>04/11 - 07/11/2026 | Antigravity Agent | Gemini 2.5 Pro | Kết nối Supabase Cloud thực tế (`htvslxbytqoteyimtcxg`), chuyển đổi kiến trúc Dữ liệu Sạch (Clean Database-First Architecture), tích hợp giọng đọc Tiếng Việt tự nhiên & bộ tổng hợp âm thanh Web Audio API. | `supabase/full_setup.sql`, `src/lib/supabase.ts`, `StoryReadingPage.tsx`, `CreateStoryPage.tsx`, `authStore.ts`. | Xóa bỏ toàn bộ mock data cũ, nạp schema idempotent trên Postgres, bổ sung bộ chọn giọng đọc Tiếng Việt (`vi-VN`) và tạo hồ sơ bé tức thì ngay tại Bước 1 tạo truyện. |
| **Phase 9**<br/>08/11/2026 | Antigravity Agent | Gemini 2.5 Pro | Rà soát toàn diện logic tương tác, phân quyền RBAC thống nhất (`auto_approved`, `approved`, `parent_approved`), triệt tiêu tràn viền di động 320px-1440px và sửa lỗi chia sẻ công khai Supabase. | `database.ts`, `adminStore.ts`, `authStore.ts`, `BookCover.tsx`, `SharedStoryPage.tsx`, các trang Admin & User. | Thay thế UUID giả định `'admin-1'` bằng UUID chuẩn Postgres, đồng bộ hóa hàm `isStoryApproved()`, xử lý đăng xuất an toàn trong Cài đặt, thêm empty states cho bảng Admin và truy vấn Supabase cho trang chia sẻ công khai. |
| **Phase 10**<br/>13/11/2026 | Antigravity Agent | Gemini 2.5 Pro | Tổng rà soát & đại tu toàn diện 6 luồng dự án: Xác thực GoTrue thật, gia cố RLS chống đệ quy & cô lập đa gia đình, Pipeline AI 3 lớp Gemini 2.5 Flash thật kép + Prompt Playground, Gamification 5 huy hiệu tự động, nhạc hộp Lullaby, khóa chặt Kid Mode `?mode=kid` và đồng bộ Modern Storybook 100% cho cả 8 trang Admin. | `supabase/full_setup.sql`, `storyGenerationService.ts`, `authStore.ts`, `storyStore.ts`, `adminStore.ts`, `guards.tsx`, `sound.ts`, toàn bộ các trang Auth/User/Admin & 7 file `.md`. | Xóa bỏ hoàn toàn truyện cầu vồng giả trong Live Mode; sửa lỗi Desktop FlipBook hiển thị trùng trang và lỗi `gateType` của Kid Mode; thêm thẻ quản lý Gemini API Key trong `/admin/settings`; dọn tệp Storage tự động khi xóa truyện/bé/tài khoản; đạt 0 lỗi trên cả 5 bước kiểm định (`typecheck`, `lint`, `check:contrast`, `test:pipeline`, `build`). |

---

## 3. CÁC HIỆU CHỈNH KỸ THUẬT QUAN TRỌNG TỪ CON NGƯỜI (HUMAN INTERVENTIONS)

Trong quá trình đồng hành cùng AI Agent, lập trình viên đã phát hiện và can thiệp điều chỉnh các điểm then chốt:

1. **Khắc phục lỗi nhận diện sai tranh vẽ thiếu nhi (Strict Multimodal Classification)**:
   - Trước đây khi tải lên ảnh logo (ví dụ logo "Unipat") hoặc ảnh chụp hoa lá, AI vẫn sinh ra câu chuyện "muông thú trong rừng" hoặc "Chú voi hồng" không liên quan. Lập trình viên đã can thiệp thiết kế Lớp 1 phân loại đa thể thức (`child_drawing` vs `logo_graphic`/`photo`), chỉ cho phép tranh vẽ thật tiến hành sinh truyện và bắt buộc Lớp 2 phải bám sát vật thể trong tranh (`grounded_objects`).
2. **Kỷ luật WCAG 2.1 AA Bắt Buộc Trong CI/CD**:
   - Tự động hóa kiểm tra độ tương phản 19 cặp token màu ngay trong lệnh `npm run build`. Khi màu xanh lá `#1F8A5B` trên nền `#DDF6E9` cho tỷ lệ 3.80:1 (chưa đạt 4.5:1), kịch bản tự động dừng build. Lập trình viên đã tinh chỉnh sang `#166E48` (5.49:1) để bảo đảm khả năng tiếp cận hoàn hảo.
3. **Bảo Mật Mã PIN Phụ Huynh Bằng Băm SHA-256**:
   - Phát hiện mã PIN phụ huynh ban đầu được lưu và hiển thị dưới dạng văn bản rõ `••••`, lập trình viên đã thay thế bằng hàm băm mật mã SHA-256 đồng bộ và thiết kế modal nhập 4 ô số OTP riêng biệt.
4. **Kiến Trúc Dữ Liệu Sạch 1-Click & Xác Thực Supabase GoTrue Thực Tế**:
   - Thiết kế kịch bản `supabase/full_setup.sql` chạy 1 lần duy nhất không lỗi thứ tự bảng hay mã hex UUID, tạo tài khoản GoTrue thật (`auth.users` + `auth.identities` mã hóa `bcrypt`) cho Admin (`admin@drawtostory.vn` / `Admin@123`) và Phụ huynh (`me@phuhuynh.vn` / `Parent@123`), đồng thời làm sạch toàn bộ dữ liệu test (0 bé, 0 truyện, làm rỗng bucket `drawings`).
5. **Gia Cố RLS Chống Đệ Quy, Cô Lập Đa Gia Đình & Dọn Dẹp Storage**:
   - Loại bỏ hoàn toàn điều kiện lỏng lẻo `or auth.uid() is null` và nguy cơ tự nâng quyền qua email chứa chữ `admin`. Thiết kế bộ hàm `plpgsql SECURITY DEFINER` (`is_admin()`, `is_active_user()`, `get_my_role()`, `get_my_quota()`) ngăn chặn lỗi đệ quy vô hạn trên `public.profiles`, cô lập dữ liệu từng gia đình/từng bé và tự động xóa tệp ảnh vật lý trên Storage khi xóa truyện, xóa bé hoặc xóa dữ liệu gia đình.
6. **Pipeline AI 3 Lớp Gemini 2.5 Flash Thật Kép & Chấm Lại Sau Retry**:
   - Loại bỏ hoàn toàn cơ chế fallback sinh truyện cầu vồng giả trong Live Mode; bổ sung cơ chế chạy trực tiếp Gemini 2.5 Flash Structured Output thông qua API Key cấu hình ngay tại `/admin/settings` (song song với Supabase Edge Functions), đồng thời sửa lỗi Lớp 3 phải chấm điểm lại bản nháp mới sau khi retry (`buildJudgePrompt`) và tích hợp Prompt Playground đo token/chi phí thật.
7. **Sửa Lỗi Lật Trang Đôi Desktop, Hộp Nhạc Ru Ngủ & Cô Lập Tuyệt Đối Kid Mode**:
   - Khắc phục lỗi `HTMLFlipBook` trên Desktop hiển thị cùng một nội dung `currentPage` cho mọi trang chẵn/lẻ bằng cách tính `pgSentences` và `pgFocus` độc lập theo từng trang; bổ sung bộ tổng hợp nhạc hộp `startLullaby()` và khóa chặt luồng `?mode=kid` để trẻ không thể thoát sang `/library` từ màn hình đọc truyện.

---

## 4. BÀI HỌC KINH NGHIỆM VỀ LẬP TRÌNH ỨNG DỤNG AI (LESSONS LEARNED)

1. **AI là Trợ lý, Kiến trúc sư là Con người**: AI có khả năng viết mã nhanh chóng với tốc độ vượt bậc, nhưng nếu không có một kiến trúc phân tầng rõ ràng (Phases 0–10) và các quy chuẩn bảo mật cơ sở dữ liệu khắt khe ngay từ đầu, mã nguồn sẽ rất dễ phát sinh lỗ hổng phân quyền hoặc lệch trạng thái giữa Frontend và Backend.
2. **Cần Coi Trọng Responsible AI Ngay Từ Dòng Code Đầu Tiên**: Đối với các ứng dụng cho trẻ em, "Safety" không thể là một tính năng phụ thêm vào sau cùng, mà phải được định hình thành một lớp độc lập (Layer 3 Safety Judge) kết hợp kiểm soát hạn mức, bộ lọc quy tắc động và cơ chế kiểm duyệt có con người can thiệp (Human-in-the-loop).
3. **Kiểm Định Tự Động Toàn Diện Trước Khi Bàn Giao**: Kết hợp kiểm tra kiểu tĩnh (`tsc --noEmit`), quy chuẩn mã (`eslint`), độ tương phản thị giác (`check:contrast`) và bộ fixtures phân loại AI (`test:pipeline`) giúp đảm bảo sản phẩm vận hành ổn định, chuyên nghiệp và sẵn sàng triển khai thực tế.
