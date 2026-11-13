# DrawToStory ✨📖
### Nền Tảng Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ
**Đồ án môn học:** Lập trình Ứng dụng Trí tuệ Nhân tạo (*AI Based Programming*) — **Trường Đại học Phú Xuân**  
**Giảng viên hướng dẫn:** Bộ môn Công nghệ Thông tin, Đại học Phú Xuân  
**Repository GitHub:** [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)  
**Công nghệ cốt lõi:** React 18, TypeScript (Strict Mode), Vite, Tailwind CSS, Supabase (Postgres, GoTrue Auth, Storage, Edge Functions), Google Gemini 2.5 Flash, Web Speech API, Web Audio API.

---

## 🌟 GIỚI THIỆU TỔNG QUAN

**DrawToStory** là một ứng dụng web cao cấp biến những bức tranh vẽ ngây ngô của trẻ em (từ 2 đến 12 tuổi) thành những cuốn **sách tranh cổ tích 4–5 trang sống động, có giọng đọc truyền cảm, nhạc hộp ru ngủ êm dịu, lật trang chân thực (`react-pageflip`) và hiệu ứng lia máy hoạt hình (Ken Burns effect)**.

Ứng dụng được thiết kế theo triết lý **Modern Storybook** và **Responsible AI**:
1. **Thiết kế Modern Storybook đồng nhất 100%**: Nền kem ấm áp có nhiễu giấy siêu nhẹ (`3.5%`), thống nhất hoàn toàn hệ thống token màu trên cả trang Phụ huynh, Xác thực và toàn bộ **8 trang Quản trị viên (Admin)**, phông chữ `Baloo 2` chuẩn tiếng Việt và độ tương phản đạt chuẩn WCAG 2.1 AA (19/19 cặp màu pass tự động khi build).
2. **Pipeline AI 3 Lớp Gemini 2.5 Flash Thật Kép (Dual-Path Engine)**: Vận hành **Pipeline 3 Lớp chuyên sâu** (Phân loại tranh vẽ đa thể thức $\rightarrow$ Sáng tác bám sát `grounded_objects` $\rightarrow$ Chấm điểm trung thực `faithfulness_score` & Thẩm định an toàn độc lập) qua Supabase Edge Function hoặc trực tiếp với Gemini 2.5 Flash Structured Output (cấu hình API Key ngay tại `/admin/settings` hoặc `.env`). Tuyệt đối không sinh truyện mẫu giả trong chế độ Live.
3. **An toàn thiếu nhi & Cô lập đa gia đình (Strict Multi-Family RLS)**: Tự động từ chối ảnh có mặt người thật, ảnh chụp đời thường, logo đồ họa hoặc ảnh chụp màn hình văn bản với mã lỗi thân thiện `NOT_A_DRAWING`. Dữ liệu giữa các gia đình và giữa từng bé trong cùng gia đình được cô lập chặt chẽ, kèm cơ chế tự động dọn dẹp tệp ảnh Storage khi xóa truyện, xóa hồ sơ bé hoặc xóa dữ liệu tài khoản.
4. **Chế độ Bé cô lập tuyệt đối (Kid Mode `?mode=kid`)**: Toàn màn hình tự động, bẫy lịch sử duyệt web chống thoát tự ý, khóa luồng đọc `?mode=kid` đưa bé quay về thẳng `/kid` (ẩn sạch các nút Chia sẻ/In ấn/Báo cáo của người lớn), nút chạm lớn $\ge 72\text{px}$ và Cổng phụ huynh bảo mật 3 cơ chế (nhấn giữ 2 giây, đố toán nhân ngẫu nhiên, hoặc mã PIN băm SHA-256).
5. **Trình đọc sách hoàn hảo & Hộp nhạc Ru ngủ (Reading View)**: Đọc từng câu với highlight Karaoke tiếng Việt tự nhiên (*Hoài My*, *Nam Minh*, *Google Tiếng Việt*, *Linh*), sách lật 2 trang độc lập chuẩn xác từng trang trên máy tính và vuốt ngang trên điện thoại, tranh vẽ `object-fit: contain` không bao giờ bị cắt mất viền, chế độ Ru ngủ kèm bộ tổng hợp nhạc hộp `startLullaby()` dịu êm.
6. **Gamification 5 Huy hiệu Tự động & Streak đọc sách**: Tự động xét duyệt và trao 5 huy hiệu (`first_story`, `art_explorer`, `bedtime_reader`, `streak_3`, `master_storyteller`) lưu trực tiếp trên Supabase với thanh tiến độ thời gian thực và chuỗi ngày đọc liên tiếp.
7. **Quản trị viên có vai trò thực thụ**: Hàng đợi kiểm duyệt (Split View, phím tắt `A`/`R`), quản lý Gemini API Key & ngân sách tháng trực tiếp trên giao diện, phòng thí nghiệm System Prompt chạy thử Gemini thật (đo token, độ trễ, chi phí USD), biểu đồ thống kê 7 ngày / 30 ngày thực tế và khóa tài khoản an toàn (chống tự khóa chính mình).
8. **Kiến trúc Dữ liệu Sạch 1-Click (`supabase/full_setup.sql`)**: Kịch bản SQL idempotent duy nhất khởi tạo toàn bộ 14 bảng, hàm bảo mật `SECURITY DEFINER` chống đệ quy RLS, Storage bucket `drawings` và tài khoản GoTrue thật cho Admin & Phụ huynh với **0 hồ sơ bé, 0 bức tranh, 0 cuốn truyện mẫu** để kiểm thử thực tế ngay từ đầu.
9. **Chống tràn viền 100% (Zero Overflow Guarantee)**: Tương thích hoàn hảo từ màn hình di động hẹp (`320px`–`390px`) đến máy tính (`1440px`) kèm cơ chế giữ phiên đăng nhập mượt mà khi nhấn F5 (`AuthInitializingScreen`).

---

## 📚 HỆ THỐNG TÀI LIỆU DỰ ÁN (DOCUMENTATION INDEX)

Mọi khía cạnh kỹ thuật, nghiệp vụ và kiểm thử của đồ án được biên soạn chi tiết trong các tệp tài liệu:
- [01-NGHIEP-VU.md](docs/01-NGHIEP-VU.md): Nghiệp vụ sản phẩm, chân dung người dùng (Personas), ma trận phân quyền RBAC chuẩn xác, biểu đồ tuần tự tạo truyện, bộ 10 quy tắc an toàn và hệ thống 5 huy hiệu Gamification.
- [02-GIAO-DIEN-AI.md](docs/02-GIAO-DIEN-AI.md): Kiến trúc chuyên sâu Pipeline AI 3 lớp Gemini 2.5 Flash (Dual-Path Execution, Visual Grounding, Faithfulness Retry & Judge), Prompt Playground thật, bộ tổng hợp âm thanh & nhạc ru ngủ Web Audio API, và 6 test fixtures.
- [03-KY-THUAT-FRONTEND.md](docs/03-KY-THUAT-FRONTEND.md): Ngôn ngữ thiết kế Modern Storybook, tokens màu đạt chuẩn WCAG 2.1 AA, UI Primitives, bảo toàn phiên F5, kiểm tra ảnh Canvas (Laplacian & Luminance), trình đọc sách 2 trang và cô lập Kid Mode `?mode=kid`.
- [04-KY-THUAT-ADMIN.md](docs/04-KY-THUAT-ADMIN.md): Cổng điều hành 8 trang Quản trị viên chuẩn Modern Storybook, cấu hình Gemini API Key động, hàng đợi kiểm duyệt Split View, System Prompt Playground, bộ hàm `SECURITY DEFINER` chống đệ quy RLS trên 14 bảng.
- [ASSUMPTIONS.md](docs/ASSUMPTIONS.md): Toàn bộ giả định kỹ thuật, cơ chế lưu trữ và dọn dẹp ảnh Storage, bảng giá token Gemini 2.5 Flash, Web Speech API và quyền riêng tư thiếu nhi.
- [AI-DECLARATION.md](AI-DECLARATION.md): Bản tuyên bố sử dụng Trí Tuệ Nhân Tạo theo quy chuẩn học thuật của Trường Đại học Phú Xuân, nhật ký tương tác đầy đủ qua 10 Phase và các can thiệp kỹ thuật cốt lõi từ con người.

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
[Ảnh tải lên từ phụ huynh + Kiểm tra Quota ngày & Quy tắc an toàn]
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
│ • Sáng tác truyện 4-5 trang với Active System Prompt   │
│ • Bắt buộc bám sát grounded_objects từ tranh của bé    │
│ • Kẹp an toàn Ken Burns focus_region (zoom <= 1.35x)   │
│ • Định dạng Gemini Structured Output + Zod Schema      │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ LỚP 3: FAITHFULNESS SCORING & OUTPUT SAFETY JUDGE      │
│ • Chấm điểm độ trung thực tranh vẽ (faithfulness_score)│
│ • Tự động tạo lại & chấm lại nếu điểm trung thực < 60  │
│ • Chấm điểm rủi ro an toàn tâm lý thiếu nhi (0 - 100)  │
│ • Định tuyến: auto_approved | pending_review | rejected│
└────────────────────────────────────────────────────────┘
       │
       ▼
[Lưu Stories, Story Pages, AI Logs & Tự động trao Huy hiệu]
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

### 3. Cấu Hình Biến Môi Trường (`.env`) & Khóa Gemini AI
Tạo file `.env` từ `.env.example`:
```env
# Đặt VITE_USE_MOCK=false để chạy trực tiếp với Cơ Sở Dữ Liệu Supabase thực tế
VITE_USE_MOCK=false
VITE_SUPABASE_URL=https://htvslxbytqoteyimtcxg.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_0M7XpzEBfVsKECDTkRVpKA_PgCpJiGc

# (Tùy chọn) Khóa Google Gemini 2.5 Flash — hoặc có thể nhập trực tiếp trên giao diện Admin (/admin/settings)
VITE_GEMINI_API_KEY=
```
> **Hai cách kích hoạt AI Gemini 2.5 Flash linh hoạt**:
> 1. **Ngay trên giao diện Admin (Khuyên dùng khi test nhanh)**: Đăng nhập tài khoản Admin $\rightarrow$ vào mục **Cài đặt kiểm duyệt (`/admin/settings`)** $\rightarrow$ dán Google Gemini API Key vào ô cấu hình và bấm Lưu. Khóa được lưu bảo mật trong `app_settings` và kích hoạt tức thì cho cả luồng Tạo truyện lẫn Phòng thí nghiệm Prompt mà không cần deploy lại Edge Functions.
> 2. **Qua Biến môi trường / Supabase Edge Functions**: Đặt `VITE_GEMINI_API_KEY` trong `.env` (hoặc `GEMINI_API_KEY` trong Supabase Secrets khi chạy serverless Deno).

### 4. Tính Năng Giọng Đọc Tiếng Việt & Bộ Tổng Hợp Âm Thanh Web Audio API
- **Giọng đọc Tiếng Việt chuẩn tự nhiên (Neural Vietnamese TTS)**: Nhận diện và ưu tiên giọng đọc chất lượng cao (`vi-VN`) như *Microsoft Hoài My (Nữ)*, *Microsoft Nam Minh (Nam)*, *Google Tiếng Việt*, và *Apple Linh*. Hỗ trợ đổi giọng trực tiếp và tùy chỉnh tốc độ kể chuyện (`0.8x`, `1.0x`, `1.2x`).
- **Bộ tổng hợp hiệu ứng âm thanh & Nhạc ru ngủ thời gian thực (`src/lib/sound.ts`)**:
  - `playPageTurn()`: Mô phỏng tiếng lật trang giấy sách chân thực bằng bộ lọc Bandpass Noise.
  - `playSparkle()` / `playMagic()` / `playSuccess()`: Hợp âm chuông thần tiên ngũ cung khi hóa phép và hoàn thành đọc sách.
  - `startLullaby()` / `stopLullaby()`: Hộp nhạc ru ngủ êm dịu (giai điệu ngũ cung sóng Sine hài hòa) tích hợp ngay trên thanh công cụ đọc truyện và Chế độ Ru ngủ.
  - `playTap()` / `playLock()`: Phản hồi xúc giác âm thanh trong Kid Mode và Cổng phụ huynh.

### 5. Các Lệnh Kiểm Thử & Chạy Ứng Dụng

| Lệnh | Mục đích |
| :--- | :--- |
| `npm run test:pipeline` | Chạy bộ kiểm thử tự động 6 fixtures phân loại tranh vẽ và kiểm tra toggle `strict_drawing_check` |
| `npm run check:contrast` | Kiểm tra tự động độ tương phản WCAG 2.1 AA trên toàn bộ 19 cặp màu token |
| `npm run typecheck` | Kiểm tra toàn bộ mã nguồn TypeScript Strict (`tsc --noEmit`, 0 lỗi) |
| `npm run lint` | Chạy ESLint kiểm tra cú pháp và quy chuẩn mã nguồn toàn bộ repo (0 lỗi, 0 cảnh báo) |
| `npm run build` | Chạy tuần tự `check:contrast` + `tsc` + đóng gói sản phẩm Vite vào `dist/` |
| `npm run dev` | Khởi chạy máy chủ phát triển tại `http://localhost:5173` |

### 6. Tài Khoản Khởi Tạo & Lối Tắt Kiểm Thử (Reviewer Credentials)
Sau khi chạy `supabase/full_setup.sql`, hệ thống tạo sẵn 2 tài khoản xác thực GoTrue thật trên cơ sở dữ liệu sạch (0 hồ sơ bé, 0 bức tranh, 0 cuốn truyện):
- **Tài khoản Quản trị viên (Admin)**:
  - Email: `admin@drawtostory.vn` | Mật khẩu: `Admin@123`
  - Quyền hạn: Truy cập toàn bộ 8 trang quản trị tại `/admin`, cấu hình Gemini API Key tại `/admin/settings`, thử nghiệm Prompt Studio và kiểm duyệt truyện.
- **Tài khoản Phụ huynh (Mẹ của bé)**:
  - Email: `me@phuhuynh.vn` | Mật khẩu: `Parent@123` | Mã PIN phụ huynh mặc định: `1234`
  - Trạng thái ban đầu: Chưa có hồ sơ bé và chưa có truyện — phụ huynh tự tay thêm bé, tải tranh vẽ tay, tạo truyện thật, chia sẻ link công khai và mở khóa huy hiệu.
- **Styleguide Tokens & Components**: Truy cập `/dev/styleguide` để kiểm tra trực quan hệ thống thiết kế Modern Storybook.

---

## 🚀 HƯỚNG DẪN TRIỂN KHAI CLOUD (VERCEL & SUPABASE)

### 1. Khởi tạo Cơ sở dữ liệu Supabase (Chỉ 1 bước duy nhất)
1. Mở Project trên [Supabase Dashboard](https://supabase.com) $\rightarrow$ vào **SQL Editor** $\rightarrow$ chọn **New Query**.
2. Sao chép toàn bộ nội dung file `supabase/full_setup.sql`, dán vào trình soạn thảo và bấm **Run**.
3. Kịch bản idempotent này sẽ tự động làm sạch dữ liệu test cũ (bao gồm cả tệp tồn đọng trong bucket `drawings`), khởi tạo 14 bảng chuẩn khóa ngoại, 3 view thống kê, các hàm `SECURITY DEFINER` chống đệ quy RLS, 10 quy tắc an toàn, 5 danh mục huy hiệu, System Prompt v1.2 và 2 tài khoản GoTrue (`admin@drawtostory.vn` & `me@phuhuynh.vn`).
4. *(Tùy chọn)* Nếu muốn chạy AI thông qua Supabase Edge Functions thay vì Direct Gemini Mode:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
   supabase functions deploy generate-story
   supabase functions deploy admin-test-prompt
   supabase functions deploy get-shared-story
   ```

### 2. Triển khai Frontend lên Vercel
1. Đẩy mã nguồn lên GitHub repository: `https://github.com/nguyendangha10126-svg/Doan-AIBD.git`.
2. Truy cập [Vercel Dashboard](https://vercel.com) $\rightarrow$ chọn **Add New Project** $\rightarrow$ chọn repo `Doan-AIBD`.
3. Cấu hình Build:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Cấu hình Environment Variables trên Vercel:
   - `VITE_SUPABASE_URL`: URL project Supabase của bạn.
   - `VITE_SUPABASE_ANON_KEY`: Anon Public Key Supabase của bạn.
   - `VITE_USE_MOCK`: `false`
   - `VITE_GEMINI_API_KEY`: *(Tùy chọn nếu đã lưu khóa trong `/admin/settings`)*.
