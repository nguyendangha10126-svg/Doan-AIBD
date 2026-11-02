# BÁO CÁO KỸ THUẬT QUẢN TRỊ & HỆ THỐNG KIỂM DUYỆT (04-KY-THUAT-ADMIN.md)
**Dự án: DrawToStory - Hệ thống Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ**  
*Môn học: AI Based Programming - Trường Đại học Phú Xuân*  
*Repository:* [https://github.com/nguyendangha10126-svg/Doan-AIBD.git](https://github.com/nguyendangha10126-svg/Doan-AIBD.git)

---

## 1. TRIẾT LÝ THIẾT KẾ: "ADMIN CÓ VAI TRÒ THỰC THỤ"

Trong một sản phẩm ứng dụng Trí Tuệ Nhân Tạo phục vụ trẻ nhỏ, **vai trò của Admin là mắt xích sống còn trong chu trình Responsible AI (Human-in-the-loop Governance)**:
1. **Kiểm duyệt nội dung trực quan (Moderation Queue)**: Thẩm định các câu chuyện AI có điểm rủi ro cao hoặc hệ thống chạy ở chế độ kiểm duyệt thủ công toàn phần trước khi trẻ em tiếp cận.
2. **Cấu hình tranh vẽ nghiêm ngặt (Strict Drawing Check Toggle)**: Cho phép chuyển đổi linh hoạt giữa chế độ kiểm duyệt ngặt nghèo (từ chối ảnh đời thực/logo) và chế độ demo linh hoạt.
3. **Quản trị quy tắc an toàn động (Safety Rules Engine)**: Bật/tắt, thêm mới hoặc điều chỉnh mức độ nghiêm ngặt của các bộ quy tắc mà không cần sửa code hay triển khai lại server.
4. **Phòng thí nghiệm Prompt (System Prompt Studio)**: Thử nghiệm, so sánh phiên bản (diff) và đo lường độ trễ của các biến thể prompt sáng tác trên tranh mẫu.
5. **Giám sát tài chính & Vận hành (Cost & Quota Observability)**: Theo dõi từng xu chi phí token của Google Gemini, phát hiện bất thường và điều tiết hạn mức sử dụng.

---

## 2. HÀNG CHỜ KIỂM DUYỆT TRỰC QUAN (MODERATION QUEUE)

### 2.1. Giao Diện Chia Đôi Song Song (Split View)
- **Cột trái**: Tranh vẽ gốc của bé trong khung giấy chuẩn, danh sách các vật thể AI nhận diện được trong tranh (`grounded_objects`).
- **Cột phải**:
  - Điểm rủi ro AI (`risk_score`) và Độ trung thực tranh vẽ (`faithfulness_score`).
  - Danh mục các rủi ro phát hiện bởi Lớp 3 (ví dụ: chi tiết kỳ bí, sắc nhọn...).
  - Bài học đạo đức (Moral) và nội dung toàn bộ 4-5 trang truyện.

### 2.2. Phím Tắt Phê Duyệt Nhanh (Keyboard Shortcuts)
Quản trị viên có thể kiểm duyệt tốc độ cao:
- Bấm phím <kbd>A</kbd>: Phê duyệt tức thì (`approved`).
- Bấm phím <kbd>R</kbd>: Mở modal từ chối (`rejected`), cung cấp 4 lý do mẫu mang tính sư phạm tích cực hoặc nhập lý do tùy chỉnh để gửi phản hồi nhẹ nhàng cho cha mẹ.
- Hỗ trợ chọn nhiều checkbox để duyệt hàng loạt (Batch Approve).

---

## 3. CÀI ĐẶT KIỂM DUYỆT & STRICT DRAWING CHECK

Trong trang Cài đặt kiểm duyệt (`/admin/settings`):
- **Công tắc Kiểm tra tranh vẽ nghiêm ngặt (Strict Drawing Check)**:
  - Bật: Lớp 1 phân loại ảnh nghiêm ngặt, tự động từ chối logo (`logo_graphic`), ảnh chụp người thật (`photo`), ảnh văn bản chụp màn hình (`screenshot_text`), trả về mã lỗi `NOT_A_DRAWING`.
  - Tắt: Cho phép tạo truyện ở chế độ demo linh hoạt.
- **Chế độ kiểm duyệt**:
  - Tự động duyệt (Auto): Truyện có `risk_score` $\le$ ngưỡng sẽ sẵn sàng ngay cho bé đọc.
  - Thủ công toàn phần (Manual All): Tất cả câu chuyện đều phải qua Admin duyệt.
- **Thanh trượt ngưỡng rủi ro**: Điều chỉnh linh hoạt từ 5 (Rất khắt khe) đến 60 (Thoáng hơn). Tiêu chuẩn đồ án là 25.

---

## 4. KIẾN TRÚC BẢO MẬT PHÂN QUYỀN TRÊN SUPABASE DATABASE

### 4.1. Hàm `is_admin()` Security Definer
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
```

### 4.2. Cơ Chế Row Level Security (RLS) Toàn Diện
Tất cả 13 bảng trong hệ thống đều kích hoạt RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Người dùng thông thường chỉ thao tác trên dữ liệu của chính mình, hoàn toàn không thể tự ý nâng quyền hay duyệt truyện khi chưa qua Admin.

---

## 5. CÁC TÍNH NĂNG ADMIN MỞ RỘNG
- **Quy Tắc An Toàn (Safety Rules CRUD)**: 10 quy tắc thực tế (Mức độ 1-5, hành vi block/flag/rewrite) với công tắc bật/tắt tức thì.
- **System Prompt Studio**: Quản lý phiên bản prompt, so sánh diff trực quan và thử nghiệm trên tranh mẫu.
- **Chi Phí & Nhật Ký AI (Ai Logs)**: Tra cứu chi tiết từng token, độ trễ và xuất báo cáo CSV.
- **Quản Lý Người Dùng**: Khóa/mở khóa tài khoản, điều chỉnh hạn mức quota theo ngày của từng tài khoản.
- **Nhật Ký Kiểm Toán (Audit Logs)**: Ghi nhận mọi thay đổi của Admin để phục vụ hậu kiểm.
