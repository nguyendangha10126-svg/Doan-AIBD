# DrawToStory ✨📖
### Nền Tảng Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ
**Đồ án môn học:** Lập trình Ứng dụng Trí tuệ Nhân tạo (*AI Based Programming*) — **Trường Đại học Phú Xuân**  
**Giảng viên hướng dẫn:** Bộ môn Công nghệ Thông tin, Đại học Phú Xuân  
**Repository GitHub:** [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)  
**Công nghệ cốt lõi:** React 18, TypeScript (Strict Mode), Vite, Tailwind CSS, Supabase (Postgres, Auth, Storage, Edge Functions), Google Gemini 2.5 Flash, Web Speech API, Web Audio API.

---

## 🌟 GIỚI THIỆU TỔNG QUAN

**DrawToStory** là một ứng dụng web cao cấp biến những bức tranh vẽ ngây ngô của trẻ em (từ 2 đến 12 tuổi) thành những cuốn **sách tranh cổ tích 4-5 trang sống động, có giọng đọc truyền cảm, lật trang chân thực (react-pageflip) và hiệu ứng lia máy hoạt hình (Ken Burns effect)**.

Ứng dụng được thiết kế theo triết lý **Modern Storybook** và **Responsible AI**:
1. **Thiết kế Modern Storybook**: Nền kem ấm áp có nhiễu giấy siêu nhẹ (`3.5%`), loại bỏ hoàn toàn các tấm đế be dày, tranh của bé luôn là nhân vật chính đặt trong khung polaroid mềm mại, phông chữ `Baloo 2` chuẩn tiếng Việt và hệ thống màu sắc đạt chuẩn WCAG 2.1 AA (19/19 token pairs pass).
2. **AI là trái tim của hệ thống**: Vận hành **Pipeline 3 Lớp chuyên sâu** kết hợp thị giác máy tính, phân loại tranh vẽ nghiêm ngặt (`child_drawing`), bám sát vật thể tranh (`grounded_objects`) và chấm điểm trung thực (`faithfulness_score`).
3. **An toàn thiếu nhi tuyệt đối**: Tự động từ chối ảnh có mặt người thật, ảnh chụp đời thường, logo đồ họa hoặc ảnh chụp màn hình văn bản với mã lỗi thân thiện `NOT_A_DRAWING`.
4. **Chế độ Bé cô lập (Kid Mode)**: Toàn màn hình tự động, bẫy lịch sử duyệt web chống thoát tự ý, nút chạm lớn $\ge 72px$, âm thanh vui nhộn (Web Audio API) và cổng phụ huynh bảo mật (giữ 2 giây, đố toán hoặc mã PIN băm SHA-256).
5. **Trình đọc sách hoàn hảo (Reading View)**: Đọc từng câu với highlight karaoke, tích hợp giọng đọc Tiếng Việt chuẩn tự nhiên (Hoài My, Nam Minh, An, Linh, Google) kèm menu đổi giọng và điều chỉnh tốc độ, sách lật 2 trang trên máy tính và vuốt ngang trên điện thoại, tranh vẽ hiển thị `object-fit: contain` không bao giờ bị cắt mất viền, chế độ ru ngủ dịu mắt.
6. **Quản trị viên có vai trò thực thụ**: Hàng đợi kiểm duyệt (Moderation Queue với Split View và phím tắt `A`/`R`), bật tắt kiểm tra tranh vẽ nghiêm ngặt, quản lý bộ quy tắc an toàn động và giám sát chi phí token thời gian thực.
7. **Kiến trúc Dữ liệu Sạch (Clean Database-First)**: Không sử dụng dữ liệu rác hay truyện mẫu cứng; kết nối trực tiếp với Supabase PostgreSQL (`htvslxbytqoteyimtcxg.supabase.co`). Khởi tạo với Admin và Mẹ Thu Hà, phụ huynh tự tay thêm hồ sơ bé và lưu trữ bền vững.
8. **Phân quyền RBAC Thống nhất & Chia sẻ Công khai**: Chuẩn hóa logic kiểm tra duyệt truyện `isStoryApproved` (`auto_approved`, `approved`, `parent_approved`). Route chia sẻ `/shared/:token` tự động nạp từ Supabase cho người thân xem trên bất kỳ thiết bị nào.
9. **Chống tràn viền 100% (Zero Overflow Guarantee)**: Kiểm thử toàn diện trên dải kích thước từ màn hình siêu hẹp (320px–375px) đến màn hình lớn (1440px), đảm bảo mọi nút bấm, bảng biểu và thanh điều khiển luôn nằm trọn vẹn trong khung nhìn.

---

## 📚 HỆ THỐNG TÀI LIỆU DỰ ÁN (DOCUMENTATION INDEX)

Mọi khía cạnh kỹ thuật, nghiệp vụ và kiểm thử của đồ án được biên soạn chi tiết trong các tệp tài liệu:
- [01-NGHIEP-VU.md](docs/01-NGHIEP-VU.md): Nghiệp vụ sản phẩm, chân dung người dùng (Personas), ma trận phân quyền RBAC, biểu đồ tuần tự tạo truyện và bộ 10 quy tắc an toàn thiếu nhi.
- [02-GIAO-DIEN-AI.md](docs/02-GIAO-DIEN-AI.md): Kiến trúc chuyên sâu Pipeline AI 3 lớp (Phân loại ảnh, Visual Grounding, Faithfulness scoring & Judge), danh mục 6 test fixtures.
- [03-KY-THUAT-FRONTEND.md](docs/03-KY-THUAT-FRONTEND.md): Ngôn ngữ thiết kế Modern Storybook, tokens màu đạt chuẩn WCAG 2.1 AA, thư viện UI Primitives, Focus Routes, thuật toán Canvas kiểm tra ảnh (Laplacian & Luminance), trình đọc sách và Kid Mode.
- [04-KY-THUAT-ADMIN.md](docs/04-KY-THUAT-ADMIN.md): Cổng điều hành Quản trị viên, hàng đợi kiểm duyệt trực quan (Split View, phím tắt A/R), công tắc Strict Drawing Check, hàm bảo mật Postgres `is_admin()` và RLS.
- [ASSUMPTIONS.md](docs/ASSUMPTIONS.md): Toàn bộ giả định kỹ thuật, kích thước màn hình mục tiêu (1440px Desktop & 390px Mobile), bảng giá token Gemini, Web Speech API và quyền riêng tư thiếu nhi.
- [AI-DECLARATION.md](AI-DECLARATION.md): Bản tuyên ngôn sử dụng Trí Tuệ Nhân Tạo theo quy chuẩn học thuật của Trường Đại học Phú Xuân, nhật ký tương tác qua 7 Phase và các can thiệp kỹ thuật then chốt từ con người.

---

## 📸 SO SÁNH GIAO DIỆN TRƯỚC VÀ SAU CẢI TIẾN (BEFORE & AFTER)

> Toàn bộ ảnh chụp được tự động hóa qua Headless Chrome ở 2 độ phân giải: **Desktop (1440px)** và **Mobile (390px)** được lưu trữ trong `docs/screenshots/before/` và `docs/screenshots/after/`.

### 1. Bảng Điều Khiển Phụ Huynh (Dashboard)
| Giao diện TRƯỚC (Before) | Giao diện SAU (Modern Storybook After) |
| :---: | :---: |
| ![Dashboard Before](docs/screenshots/before/dashboard_desktop_1440.png) | ![Dashboard After](docs/screenshots/after/dashboard_desktop_1440.png) |

### 2. Tủ Sách Kệ Gỗ & Thẻ Bìa Sách 3:4 (Library)
| Giao diện TRƯỚC (Before) | Giao diện SAU (Modern Storybook After) |
| :---: | :---: |
| ![Library Before](docs/screenshots/before/library_desktop_1440.png) | ![Library After](docs/screenshots/after/library_desktop_1440.png) |

### 3. Wizard Tạo Truyện Thần Kỳ (Create Story)
| Giao diện TRƯỚC (Before) | Giao diện SAU (Modern Storybook After) |
| :---: | :---: |
| ![Create Before](docs/screenshots/before/create_desktop_1440.png) | ![Create After](docs/screenshots/after/create_desktop_1440.png) |

### 4. Trình Đọc Sách Lật Trang & Karaoke TTS (Reading View)
| Giao diện TRƯỚC (Before) | Giao diện SAU (Modern Storybook After) |
| :---: | :---: |
| ![Reader Before](docs/screenshots/before/reader_desktop_1440.png) | ![Reader After](docs/screenshots/after/reader_desktop_1440.png) |

### 5. Góc Đọc Của Bé Cô Lập & Khóa Phụ Huynh (Kid Mode)
| Giao diện TRƯỚC (Before) | Giao diện SAU (Modern Storybook After) |
| :---: | :---: |
| ![Kid Before](docs/screenshots/before/kid_desktop_1440.png) | ![Kid After](docs/screenshots/after/kid_desktop_1440.png) |

### 6. Hàng Chờ Kiểm Duyệt Quản Trị Viên (Admin Moderation Queue)
| Giao diện TRƯỚC (Before) | Giao diện SAU (Modern Storybook After) |
| :---: | :---: |
| ![Moderation Before](docs/screenshots/before/admin_moderation_desktop_1440.png) | ![Moderation After](docs/screenshots/after/admin_moderation_desktop_1440.png) |

---

## 🧠 KIẾN TRÚC PIPELINE AI 3 LỚP (RESPONSIBLE AI)

```
[Ảnh tải lên từ phụ huynh]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ LỚP 1: STRICT DRAWING CLASSIFICATION & INPUT SAFETY    │
│ • Nhận diện thể thức: child_drawing vs photo/logo/text │
│ • Kiểm tra khuôn mặt người lớn & thông tin cá nhân PII │
│ • Từ chối ảnh không phải tranh vẽ: NOT_A_DRAWING       │
│ • Trích xuất đặc trưng thị giác & grounded_objects     │
└────────────────────────────────────────────────────────┘
       │ (Hợp lệ: child_drawing)
       ▼
┌────────────────────────────────────────────────────────┐
│ LỚP 2: VISUAL GROUNDING CREATIVE ENGINE                │
│ • Sáng tác truyện 4-5 trang với font Baloo 2           │
│ • Bắt buộc bám sát grounded_objects từ tranh của bé    │
│ • Kẹp an toàn Ken Burns focus_region (zoom <= 1.35x)   │
│ • Định dạng Zod Schema JSON có cấu trúc                │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ LỚP 3: FAITHFULNESS SCORING & OUTPUT SAFETY JUDGE      │
│ • Chấm điểm độ trung thực tranh vẽ (faithfulness_score)│
│ • Tự động thử lại (retry) nếu điểm trung thực < 60     │
│ • Chấm điểm rủi ro an toàn tâm lý thiếu nhi (0 - 100)  │
│ • Định tuyến: auto_approved | pending_review | rejected│
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN

### 1. Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 18 trở lên (khuyên dùng Node.js 20 LTS).
- **Trình duyệt**: Google Chrome hoặc Microsoft Edge hiện đại.

### 2. Cài Đặt Dependencies
```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường (`.env`)
Tạo file `.env` từ `.env.example`:
```env
# Đặt VITE_USE_MOCK=false để chạy trực tiếp với Cơ Sở Dữ Liệu Supabase đã triển khai
VITE_USE_MOCK=false
VITE_SUPABASE_URL=https://htvslxbytqoteyimtcxg.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_0M7XpzEBfVsKECDTkRVpKA_PgCpJiGc
```
> **Kiến trúc Dữ liệu Sạch (Clean Data Architecture)**: Hệ thống được thiết lập cơ sở dữ liệu PostgreSQL chuẩn mực 100%, không sử dụng dữ liệu rác hay truyện mẫu cứng. Khởi đầu với 2 tài khoản chính (Admin và Mẹ Thu Hà), 0 hồ sơ bé và 0 cuốn truyện. Phụ huynh trực tiếp tạo hồ sơ bé, chụp tranh vẽ tay và toàn bộ dữ liệu (tranh vẽ, câu chuyện, trang sách, nhật ký AI) được lưu trữ bền vững vào Supabase.

### 4. Tính Năng Giọng Đọc Tiếng Việt & Hiệu Ứng Âm Thanh Độc Quyền
- **Giọng đọc Tiếng Việt chuẩn tự nhiên (Neural Vietnamese TTS)**: Nhận diện và ưu tiên giọng đọc chất lượng cao (`vi-VN`) như *Microsoft Hoài My (Nữ)*, *Microsoft Nam Minh (Nam)*, *Google Tiếng Việt*, và *Apple Linh*. Có menu cho phép phụ huynh linh hoạt đổi giọng và điều chỉnh tốc độ kể chuyện (0.8x, 1.0x, 1.2x).
- **Bộ tổng hợp hiệu ứng âm thanh thời gian thực (Web Audio API Synthesizers)**:
  - `playPageTurn()`: Mô phỏng tiếng lật trang giấy sách chân thực bằng bộ lọc Bandpass Noise dải tần 1000Hz $\rightarrow$ 320Hz.
  - `playSparkle()`: Hợp âm chuông thần tiên ngũ cung lung linh.
  - `playConfetti()`: Âm thanh chúc mừng hân hoan khi bé đọc xong truyện.
  - `playTap()` / `playLock()`: Tương tác chạm nút lớn trong Kid Mode và khóa cổng an toàn phụ huynh.

### 4. Các Lệnh Kiểm Thử & Chạy Ứng Dụng

| Lệnh | Mục đích |
| :--- | :--- |
| `npm run test:pipeline` | Chạy bộ kiểm thử tự động 6 fixtures phân loại tranh vẽ và kiểm tra toggle cài đặt |
| `npm run typecheck` | Kiểm tra toàn bộ mã nguồn TypeScript Strict (`tsc --noEmit`, 0 lỗi) |
| `npm run lint` | Chạy ESLint kiểm tra cú pháp và quy chuẩn mã nguồn toàn bộ repo (0 warnings) |
| `npm run build` | Tự động kiểm tra độ tương phản WCAG 2.1 AA (19 cặp màu), typecheck và đóng gói Vite |
| `npm run dev` | Khởi chạy máy chủ phát triển tại `http://localhost:5173` |

### 5. Lối Tắt Kiểm Thử Dành Cho Người Đánh Giá (Reviewer Shortcuts)
- **Styleguide Tokens & Components**: Truy cập route `/dev/styleguide` để xem toàn bộ tokens màu, nút, thẻ, badge, modal, input, bottom sheet và empty states.
- **Tài khoản Phụ huynh Demo**: `me@phuhuynh.vn` (Mật khẩu: bất kỳ $\ge 6$ ký tự, PIN mặc định: `1234`).
- **Tài khoản Quản trị viên (Admin)**: `admin@drawtostory.vn` (Toàn quyền truy cập Cổng Admin `/admin`).

---

## 🚀 HƯỚNG DẪN TRIỂN KHAI CLOUD (VERCEL & SUPABASE)

### 1. Triển khai Frontend lên Vercel
1. Đẩy mã nguồn lên GitHub repository: `https://github.com/nguyendangha10126-svg/Doan-AIBD.git`.
2. Truy cập [Vercel Dashboard](https://vercel.com) $\rightarrow$ chọn **Add New Project** $\rightarrow$ chọn repo `Doan-AIBD`.
3. Cấu hình Build:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Cấu hình Environment Variables trên Vercel:
   - `VITE_SUPABASE_URL`: URL project Supabase của bạn.
   - `VITE_SUPABASE_ANON_KEY`: Anon Public Key Supabase của bạn.
   - `VITE_USE_MOCK`: `false` (hoặc `true` nếu muốn chạy chế độ demo).

### 2. Triển khai Backend lên Supabase
1. Mở Project trên [Supabase Dashboard](https://supabase.com).
2. Vào mục **SQL Editor** $\rightarrow$ chọn **New Query** và dán toàn bộ nội dung file tiện ích gom sẵn:
   - `supabase/full_setup.sql`: Chứa trọn gói cấu trúc bảng, enum, hàm `is_admin()`, chính sách RLS, storage bucket `drawings`, các chỉ số Lớp 1-2-3 và toàn bộ dữ liệu mẫu (10 quy tắc an toàn, badge, prompt hệ thống v1.2, tài khoản demo).
   - *(Hoặc có thể chạy riêng lẻ theo thứ tự: `supabase/migrations/001_init.sql` $\rightarrow$ `supabase/migrations/002_pipeline_ai_fixes.sql` $\rightarrow$ `supabase/seed.sql`)*.
3. Bấm **Run** để khởi tạo database và dữ liệu mẫu trong 1 thao tác.
4. Triển khai Supabase Edge Functions (nếu cần xử lý Gemini trên serverless Deno):
   ```bash
   # Cấu hình Secret Gemini API Key trên Supabase
   supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here

   # Triển khai các hàm xử lý
   supabase functions deploy generate-story
   supabase functions deploy admin-test-prompt
   supabase functions deploy get-shared-story
   ```
