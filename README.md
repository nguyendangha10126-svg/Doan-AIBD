# DrawToStory ✨📖
### Nền Tảng Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ
**Đồ án môn học:** Lập trình Ứng dụng Trí tuệ Nhân tạo (*AI Based Programming*) — **Trường Đại học Phú Xuân**  
**Giảng viên hướng dẫn:** Bộ môn Công nghệ Thông tin, Đại học Phú Xuân  
**Repository GitHub:** [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)  
**Công nghệ cốt lõi:** React 18, TypeScript (Strict Mode), Vite 6 (Lazy Code-Splitting), Tailwind CSS, Recharts 3, Supabase (PostgreSQL RLS, GoTrue Auth, Storage, Deno Edge Functions), Google Gemini 2.5 Flash, Web Speech API, Web Audio API.

---

## 🌟 GIỚI THIỆU TỔNG QUAN

**DrawToStory** là ứng dụng web chuyển đổi những bức tranh vẽ tay trên giấy của trẻ em (từ 2 đến 12 tuổi) thành những cuốn **sách tranh cổ tích 4–5 trang sống động, có giọng đọc truyền cảm, nhạc hộp ru ngủ êm dịu, lật trang chân thực (`react-pageflip`) và hiệu ứng lia máy hoạt hình (Ken Burns effect)**.

Ứng dụng được xây dựng theo triết lý **Modern Storybook**, **Zero-Trust Security** và **Responsible AI**:
1. **Thiết kế Modern Storybook & Native `<dialog>` Accessibility**: Nền kem ấm áp có nhiễu giấy siêu nhẹ (`3.5%`), đồng bộ hệ thống token màu trên toàn bộ phân hệ Xác thực, Phụ huynh, Trẻ em và **8 trang Quản trị viên (Admin)**, phông chữ `Baloo 2` chuẩn tiếng Việt và độ tương phản đạt chuẩn WCAG 2.1 AA (19/19 cặp màu được kiểm định tự động khi build). Toàn bộ hộp thoại sử dụng phần tử `<dialog>` chuẩn HTML5 với cơ chế khóa cuộn nền CSS thuần (`overscroll-behavior: contain`).
2. **Kiến trúc AI Server-Only Bảo Mật Tuyệt Đối (Zero Client Secret Exposure)**: Toàn bộ lời gọi **Google Gemini 2.5 Flash** (cả luồng Tạo truyện 3 lớp lẫn Phòng thí nghiệm System Prompt) đều thực thi **100% trên Supabase Edge Functions** (`generate-story`, `admin-test-prompt`), đọc khóa từ `Deno.env.get('GEMINI_API_KEY')` qua header `x-goog-api-key`. Tuyệt đối không lưu API Key trong cơ sở dữ liệu client-readable, không xuất hiện trong mã nguồn trình duyệt và không sinh truyện mẫu giả trên môi trường Production.
3. **An toàn Thiếu nhi, Quyền Được Lãng Quên (GDPR) & Cô lập Đa gia đình**: Tự động từ chối ảnh có mặt người thật, ảnh chụp đời thường, logo đồ họa hoặc ảnh chụp màn hình văn bản với mã lỗi thân thiện `NOT_A_DRAWING`. Tích hợp Edge Function `delete-account` thực thi xóa vĩnh viễn toàn bộ tệp Storage, dữ liệu gia đình và tài khoản `auth.users` sau khi xác thực lại mật khẩu chính chủ.
4. **Hướng dẫn Sử dụng Tương tác Vuốt Ngang (`UserGuideModal`)**: Tự động hiển thị bảng hướng dẫn 4 bước trực quan ngay sau khi đăng nhập (tùy biến riêng cho Phụ huynh và Quản trị viên), hỗ trợ lướt/vuốt ngang mượt mà (`scroll-snap-type: x mandatory`), nút **"Tắt & Không hiện lại"** lưu riêng theo từng tài khoản, và có thể mở lại bất cứ lúc nào từ mục **"Hướng dẫn sử dụng"** nằm ngay phía trên nút **Đăng xuất** trong menu tài khoản.
5. **Chế độ Bé Cô lập Tuyệt đối & Mã PIN Băm Có Salt Riêng**: Toàn màn hình tự động, bẫy lịch sử duyệt web chống thoát tự ý, khóa luồng đọc `?mode=kid` đưa bé quay về thẳng `/kid` (ẩn sạch các nút Chia sẻ/In ấn/Báo cáo của người lớn). Cổng phụ huynh yêu cầu **Mã PIN 4 số riêng được băm kèm Salt theo User ID** (không tồn tại mã PIN mặc định công khai) hoặc giải phép nhân hai chữ số dành cho người lớn (`12..19 × 6..9`).
6. **Trình đọc sách Chống Tràn Chữ & Hộp nhạc Ru ngủ (Reading View)**: Đọc từng câu với highlight Karaoke tiếng Việt tự nhiên (*Hoài My*, *Nam Minh*, *Google Tiếng Việt*, *Linh*), sách lật 2 trang độc lập chống tràn/cắt chữ ở mọi cỡ chữ (`A`, `A+`, `A++`), tranh vẽ `object-fit: contain` giữ nguyên vẹn nét vẽ của bé, kèm hộp nhạc ru ngủ `startLullaby()`.
7. **Tối ưu Hiệu năng & Phân tách Gói Tải (`React.lazy` Code-Splitting)**: Toàn bộ phân hệ Quản trị viên (`AdminLayout`, 8 trang Admin và thư viện biểu đồ `Recharts 3`), trình đọc lật trang và màn hình tạo truyện được tách chunk tải lười (`React.lazy` + `<Suspense>`), giúp người dùng Phụ huynh tải trang ban đầu siêu nhẹ và cập nhật tiêu đề/OpenGraph động theo từng đường dẫn.

---

## 📚 HỆ THỐNG TÀI LIỆU DỰ ÁN (DOCUMENTATION INDEX)

- [01-NGHIEP-VU.md](docs/01-NGHIEP-VU.md): Nghiệp vụ sản phẩm, chân dung người dùng, ma trận phân quyền RBAC, luồng tạo truyện Server-Side Edge Functions, hướng dẫn sử dụng tương tác, bộ 10 quy tắc an toàn và 5 huy hiệu Gamification.
- [02-GIAO-DIEN-AI.md](docs/02-GIAO-DIEN-AI.md): Kiến trúc bảo mật Pipeline AI 3 lớp Gemini 2.5 Flash trên Supabase Edge Functions, chuẩn hóa biệt danh chống lặp từ (`formatChildName`), Prompt Playground thật, kiểm thử trực tiếp mã nguồn thật (`pipelineRules.js`) và bộ tổng hợp âm thanh Web Audio API.
- [03-KY-THUAT-FRONTEND.md](docs/03-KY-THUAT-FRONTEND.md): Ngôn ngữ thiết kế Modern Storybook, native `<dialog>`, carousel vuốt ngang `UserGuideModal`, phân tách bundle `React.lazy`, chống cắt chữ trang đọc sách và cô lập Kid Mode.
- [04-KY-THUAT-ADMIN.md](docs/04-KY-THUAT-ADMIN.md): Cổng điều hành 8 trang Quản trị viên, đồng bộ số liệu KPI & biểu đồ `Recharts 3` theo múi giờ địa phương, hàm nâng quyền chủ sở hữu `promote_to_admin(email)` và kiến trúc RLS chống đệ quy trên 14 bảng.
- [ASSUMPTIONS.md](docs/ASSUMPTIONS.md): Giả định kỹ thuật, cô lập chế độ phát triển cục bộ (`import.meta.env.DEV`), cơ chế xóa tài khoản GDPR `delete-account`, bảng giá token Gemini 2.5 Flash và bảo mật dữ liệu thiếu nhi.
- [AI-DECLARATION.md](AI-DECLARATION.md): Bản tuyên bố sử dụng Trí Tuệ Nhân Tạo theo quy chuẩn học thuật của Trường Đại học Phú Xuân, nhật ký tương tác qua 11 Phase và các can thiệp bảo mật – kỹ thuật từ con người.

---

## 🗂️ CẤU TRÚC THƯ MỤC DỰ ÁN

```text
DoanAIBP/
├── docs/                                # Bộ tài liệu nghiệp vụ, AI, Frontend, Admin & Screenshots
├── scripts/
│   ├── check-contrast.js                # Kiểm định tự động 19/19 cặp màu đạt WCAG 2.1 AA
│   └── test-pipeline.js                 # Unit/Integration test import trực tiếp pipelineRules.js
├── src/
│   ├── app/
│   │   ├── guards.tsx                   # ProtectedRoute, AdminRoute, GuestRoute (giữ phiên F5)
│   │   └── router.tsx                   # React Router v6 + React.lazy code-splitting + Dynamic Title/OG
│   ├── components/
│   │   ├── layout/                      # AuthLayout, UserLayout, AdminLayout (tích hợp UserGuideModal)
│   │   └── ui/                          # Button, Input, Card, Native <dialog> Modal, BookCover, OtpPinInput...
│   ├── features/
│   │   ├── ai/
│   │   │   ├── services/storyGenerationService.ts  # Gọi Edge Functions generate-story & admin-test-prompt
│   │   │   └── utils/pipelineRules.js              # Logic phân loại ảnh, kiểm duyệt & chuẩn hóa tên bé
│   │   └── onboarding/components/
│   │       ├── UserGuideModal.tsx       # Carousel hướng dẫn sử dụng vuốt ngang 4 bước cho User & Admin
│   │       └── OnboardingModal.tsx      # Wrapper tương thích cho UserGuideModal
│   ├── lib/                             # supabase.ts, utils.ts (saltedHashPinSync, formatChildName), sound.ts, i18n/vi.ts
│   ├── pages/                           # auth/, dashboard/, create/, reader/, library/, kid/, settings/, trust/, admin/
│   ├── store/                           # authStore.ts, storyStore.ts, adminStore.ts (Zustand, cô lập tài khoản)
│   └── types/                           # database.ts (TypeScript interfaces cho 14 bảng Postgres)
├── supabase/
│   ├── migrations/001_init.sql          # Schema 14 bảng, 3 views, hàm RLS SECURITY DEFINER & promote_to_admin()
│   ├── seed.sql                         # Seed sạch (System Prompt v1.2, 10 Safety Rules, 5 Badges — KHÔNG chứa mật khẩu)
│   ├── full_setup.sql                   # Bản gộp idempotent 001_init.sql + seed.sql chạy 1-click trên SQL Editor
│   └── functions/
│       ├── _shared/                     # cors.ts, gemini.ts (x-goog-api-key server-only), safety.ts
│       ├── generate-story/index.ts      # Edge Function Pipeline AI 3 lớp Gemini 2.5 Flash
│       ├── admin-test-prompt/index.ts   # Edge Function chạy thử System Prompt Studio
│       ├── get-shared-story/index.ts    # Edge Function đọc truyện chia sẻ công khai kèm Signed URL
│       └── delete-account/index.ts      # Edge Function xóa vĩnh viễn Storage + Profiles + Auth User (GDPR)
└── tests/fixtures/                      # 6 bộ dữ liệu kiểm thử phân loại tranh vẽ & an toàn đầu vào
```

---

## 🧠 KIẾN TRÚC PIPELINE AI 3 LỚP TRÊN EDGE FUNCTIONS (RESPONSIBLE AI)

```text
[Trình duyệt Phụ huynh] ──(JWT + Ảnh tranh vẽ)──▶ [Supabase Edge Function: generate-story]
                                                         │ (Đọc GEMINI_API_KEY từ Supabase Secrets)
                                                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ LỚP 1: STRICT DRAWING CLASSIFICATION & INPUT SAFETY                      │
│ • Nhận diện thể thức: child_drawing vs photo / logo_graphic / screenshot │
│ • Kiểm tra khuôn mặt người thật & thông tin cá nhân PII                  │
│ • Từ chối ảnh không phải tranh vẽ: NOT_A_DRAWING                         │
│ • Trích xuất đặc trưng thị giác & danh sách vật thể grounded_objects     │
└──────────────────────────────────────────────────────────────────────────┘
                                                         │
                                                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ LỚP 2: VISUAL GROUNDING CREATIVE ENGINE                                  │
│ • Nạp Active System Prompt + chuẩn hóa biệt danh bé (chống lặp "Bé Bé")  │
│ • Sáng tác truyện 4–5 trang bám sát grounded_objects từ tranh của bé     │
│ • Kẹp an toàn Ken Burns focus_region (zoom <= 1.35x)                     │
└──────────────────────────────────────────────────────────────────────────┘
                                                         │
                                                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ LỚP 3: FAITHFULNESS SCORING & OUTPUT SAFETY JUDGE                        │
│ • Chấm điểm độ trung thực tranh vẽ (faithfulness_score 0–100)            │
│ • Tự động sinh lại ở temperature 0.35 & chấm lại nếu điểm < 60           │
│ • Chấm điểm rủi ro tâm lý thiếu nhi (risk_score 0–100)                   │
│ • Định tuyến: auto_approved | pending_review | rejected                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ HƯỚNG DẪN CÀI ĐẶT, BẢO MẬT & CHẠY DỰ ÁN

### 1. Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 18 trở lên (khuyên dùng Node.js 20 LTS).
- **Supabase CLI**: Dùng khi triển khai 4 Edge Functions lên đám mây.

### 2. Cài Đặt Dependencies
```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường Frontend (`.env`)
Tạo file `.env` từ `.env.example` (chỉ chứa URL và Public Anon Key của Supabase — **tuyệt đối không đặt `GEMINI_API_KEY` ở phía trình duyệt**):
```env
VITE_USE_MOCK=false
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_public_anon_key
```
> **Lưu ý bảo mật**: Cờ `VITE_USE_MOCK=true` chỉ có hiệu lực khi chạy máy chủ phát triển cục bộ (`import.meta.env.DEV === true`). Khi build Production (`npm run build`), mọi chế độ giả lập và đường dẫn `/dev/styleguide` đều bị vô hiệu hóa hoàn toàn.

### 4. Khởi Tạo Cơ Sở Dữ Liệu & Cấp Quyền Quản Trị Viên An Toàn
1. Mở **Supabase Dashboard** → **SQL Editor** → dán toàn bộ nội dung file `supabase/full_setup.sql` và nhấn **Run**.
2. Để đảm bảo an toàn tuyệt đối cho mã nguồn công khai trên GitHub, `full_setup.sql` và `seed.sql` **không tạo sẵn bất kỳ tài khoản hay mật khẩu mặc định nào**.
3. Bạn tự đăng ký tài khoản bằng email và mật khẩu riêng trên giao diện `/register`, sau đó mở **Supabase SQL Editor** chạy lệnh nâng quyền chủ sở hữu duy nhất:
   ```sql
   select public.promote_to_admin('email_cua_ban@domain.com');
   ```
   *(Hàm `promote_to_admin` đã thu hồi quyền `EXECUTE` của `public`, `anon` và `authenticated`, chỉ thực thi được bởi chủ sở hữu dự án trong SQL Editor).*

### 5. Triển Khai Supabase Secrets & 4 Edge Functions
```bash
supabase secrets set GEMINI_API_KEY=AIzaSy_YOUR_SECRET_KEY GEMINI_MODEL=gemini-2.5-flash
supabase functions deploy generate-story
supabase functions deploy admin-test-prompt
supabase functions deploy get-shared-story
supabase functions deploy delete-account
```

### 6. Các Lệnh Kiểm Thử & Đóng Gói

| Lệnh | Mục đích |
| :--- | :--- |
| `npm run typecheck` | Kiểm tra kiểu tĩnh TypeScript Strict cho cả Frontend và Supabase Edge Functions (`0` lỗi) |
| `npm run lint` | Kiểm tra quy chuẩn mã nguồn ESLint toàn bộ dự án (`0` lỗi, `0` cảnh báo) |
| `npm run check:contrast` | Kiểm tra tự động 19/19 cặp màu token đạt chuẩn tương phản WCAG 2.1 AA |
| `npm run test:pipeline` | Kiểm thử trực tiếp module nghiệp vụ thật `src/features/ai/utils/pipelineRules.js` (6 fixtures + Layer 3 + chuẩn hóa tên bé) |
| `npm run build` | Chạy tuần tự `check:contrast` + `typecheck` + đóng gói sản phẩm tối ưu chia tách chunk vào `dist/` |
| `npm run dev` | Khởi chạy máy chủ phát triển tại `http://localhost:5173` |
