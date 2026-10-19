# BÁO CÁO NGHIỆP VỤ & BÀI TOÁN SẢN PHẨM (01-NGHIEP-VU.md)
**Dự án: DrawToStory - Hệ thống Kể Chuyện Thiếu Nhi Thông Minh từ Tranh Bé Vẽ**  
*Môn học: AI Based Programming - Trường Đại học Phú Xuân*

---

## 1. BÀI TOÁN & BỐI CẢNH THỰC TẾ
Trẻ em trong độ tuổi từ 2 đến 12 tuổi có trí tưởng tượng phong phú và thường thể hiện thế giới nội tâm qua các bức tranh vẽ nguệch ngoạc. Tuy nhiên:
- Phụ huynh hiện đại thường bận rộn, gặp khó khăn trong việc thấu hiểu trọn vẹn câu chuyện đằng sau nét vẽ của con hoặc thiếu thời gian để sáng tác những câu chuyện cổ tích mang tính giáo dục phù hợp với bức tranh.
- Các ứng dụng AI hiện nay trên thị trường phần lớn là chatbot văn bản thuần túy dành cho người lớn, thiếu giao diện trực quan dành riêng cho trẻ em, và quan trọng nhất là **chưa có cơ chế kiểm soát an toàn nghiêm ngặt đối với nội dung tâm lý trẻ nhỏ**.

**DrawToStory** ra đời như một cầu nối kỳ diệu: Phụ huynh chỉ cần chụp ảnh bức tranh của bé; hệ thống AI đa phương thức sẽ "ngắm nhìn" bức tranh, thấu cảm nét vẽ, bảo đảm các tiêu chuẩn Responsible AI và dệt nên một câu chuyện tranh cổ tích 4-5 trang có giọng đọc truyền cảm, lật trang sách 3D sống động và gợi ý các nét vẽ tiếp theo.

---

## 2. CHÂN DUNG NGƯỜI DÙNG (USER PERSONAS)
1. **Phụ huynh (Primary Persona)**:
   - Mong muốn khuyến khích con sáng tạo, giảm thời gian xem video thụ động (YouTube/TikTok).
   - Cần một công cụ gắn kết gia đình vào mỗi buổi tối trước giờ đi ngủ (Bedtime Storytelling).
   - Quan tâm sâu sắc đến quyền riêng tư và an toàn hình ảnh của con.
2. **Trẻ em 2 - 12 tuổi (End Beneficiary)**:
   - Thích thú khi thấy bức tranh mình tự vẽ được "hóa phép" thành một cuốn sách thật có tên mình.
   - Thưởng thức giọng đọc ấm áp, nhìn tranh phóng to di chuyển theo từng phân cảnh (Ken Burns effect).
   - Tự hào nhận huy hiệu và háo hức vẽ tiếp các phần tiếp theo của câu chuyện.
3. **Quản trị viên & Kiểm duyệt viên (Admin Persona)**:
   - Có vai trò thực thụ: Giám sát toàn bộ các câu chuyện bị gắn cờ hoặc có điểm rủi ro AI vượt ngưỡng.
   - Quản lý bộ quy tắc an toàn (Safety Rules), tinh chỉnh System Prompt và giám sát chi phí vận hành token của mô hình AI.

---

## 3. MA TRẬN PHÂN QUYỀN (ROLE-BASED ACCESS CONTROL - RBAC)

| Chức năng / Dữ liệu | Khách vãng lai (Guest) | Phụ huynh (User) | Quản trị viên (Admin) |
| :--- | :---: | :---: | :---: |
| Xem trang giới thiệu & An toàn AI (`/trust`) | ✅ | ✅ | ✅ |
| Đọc truyện được chia sẻ công khai (`/shared/:token`) | ✅ | ✅ | ✅ |
| Đăng ký, đăng nhập tài khoản | ✅ | ✅ | ✅ |
| Tạo và quản lý hồ sơ bé (Nickname, Tuổi) | ❌ | ✅ (Chỉ bé của mình) | ✅ (Xem thống kê) |
| Tải ảnh tranh vẽ & Tạo truyện thần kỳ | ❌ | ✅ (Theo quota ngày) | ✅ (Không giới hạn) |
| Đọc truyện, nghe TTS, Chế độ Ru ngủ | ❌ | ✅ (Truyện của bé) | ✅ (Toàn bộ thư viện) |
| Sử dụng Chế độ Trẻ Em (Kid Mode) | ❌ | ✅ (Có cổng phụ huynh) | ✅ |
| Chia sẻ truyện, Xuất PDF / In ấn | ❌ | ✅ (Truyện đã duyệt) | ✅ |
| Báo cáo truyện vi phạm | ❌ | ✅ | ✅ |
| Xuất toàn bộ dữ liệu cá nhân (GDPR JSON) | ❌ | ✅ (Chỉ dữ liệu mình) | ❌ |
| Xem hàng chờ kiểm duyệt & Phê duyệt truyện | ❌ | ❌ | ✅ |
| Quản lý Bộ quy tắc an toàn (CRUD Safety Rules) | ❌ | ❌ | ✅ |
| Chỉnh sửa và thử nghiệm System Prompt Studio | ❌ | ❌ | ✅ |
| Giám sát chi phí AI & Quản lý Hạn mức người dùng | ❌ | ❌ | ✅ |
| Khóa / Mở khóa tài khoản phụ huynh | ❌ | ❌ | ✅ |
| Xem Nhật ký kiểm toán (Audit Logs) | ❌ | ❌ | ✅ |

---

## 4. LUỒNG NGHIỆP VỤ TẠO TRUYỆN (BUSINESS WORKFLOW)

```mermaid
sequenceDiagram
    autonumber
    actor Parent as Phụ Huynh
    participant Client as DrawToStory App
    participant Edge as Supabase Edge Function
    participant Gemini as Google Gemini AI
    participant DB as Postgres & Storage
    actor Admin as Admin Kiểm Duyệt

    Parent->>Client: Chụp ảnh tranh vẽ của bé & chọn độ tuổi
    Client->>Client: Nén ảnh tại client <= 1.5MB & kiểm tra độ sáng/mờ
    Client->>DB: Tải ảnh lên Storage bucket 'drawings' (Private)
    Client->>Edge: Gọi API generate-story (JWT, drawingPath, childId)
    
    rect rgb(255, 245, 230)
        Note over Edge,Gemini: LỚP 1: Input Safety & Thấu Cảm Tranh
        Edge->>Gemini: Gửi ảnh + JSON Schema phân tích nét vẽ & rủi ro
        Gemini-->>Edge: Trả về {is_drawing, contains_face, pii, mood, objects...}
        alt Có mặt người thật HOẶC không phải tranh HOẶC có PII
            Edge-->>Client: Từ chối sinh truyện, trả thông báo ân cần
        end
    end

    rect rgb(230, 245, 255)
        Note over Edge,Gemini: LỚP 2: Sáng Tác Sư Phạm Theo Độ Tuổi
        Edge->>Gemini: Active Prompt + Safety Rules + Tuổi bé + Chi tiết tranh
        Gemini-->>Edge: Trả về Truyện 4-5 trang, Focus Region, Moral, Ý tưởng vẽ tiếp
    end

    rect rgb(245, 230, 255)
        Note over Edge,Gemini: LỚP 3: Output Safety Judge
        Edge->>Gemini: Chấm điểm rủi ro risk_score (0-100) & đối chiếu Rules
        Gemini-->>Edge: Trả về risk_score & violation_reasons
    end

    alt Điểm rủi ro <= 25 và Chế độ Auto
        Edge->>DB: Lưu truyện trạng thái 'auto_approved'
        Edge-->>Client: Trả về truyện hoàn chỉnh -> Lật sách đọc ngay
    else Điểm rủi ro > 25 HOẶC Chế độ Manual All
        Edge->>DB: Lưu truyện trạng thái 'pending_review'
        Edge-->>Client: Thông báo truyện đang chờ Ban Kiểm Duyệt xem xét
        Admin->>DB: Kiểm tra tranh gốc & chấm duyệt (Approve/Reject)
        Admin->>DB: Ghi log vào moderation_reviews
    end
```

---

## 5. BỘ QUY TẮC AN TOÀN TRẺ EM (SAFETY RULES SPECIFICATION)
Hệ thống thiết lập 10 quy tắc phòng hộ thực tế được quản trị trực tiếp trên Database:
1. **Bạo lực & Vũ khí (Mức 5 - Block)**: Tuyệt đối không cho phép vũ khí sát thương, hành vi bạo lực đẫm máu.
2. **Nội dung người lớn (Mức 5 - Block)**: Chặn mọi yếu tố lệch chuẩn với tâm lý trẻ thơ.
3. **Khuôn mặt người thật (Mức 5 - Block)**: Bảo vệ quyền riêng tư trẻ em, ngăn chặn chụp ảnh chân dung trẻ đưa lên mạng.
4. **Thông tin cá nhân PII (Mức 5 - Block)**: Quét và chặn số điện thoại, địa chỉ nhà, tên trường học trên giấy.
5. **Quái vật rùng rợn (Mức 4 - Flag)**: Gắn cờ đưa vào hàng chờ kiểm duyệt để đảm bảo cốt truyện biến bóng ma thành chi tiết tích cực, không gây ám ảnh tâm lý.
6. **Ngôn từ tiêu cực (Mức 4 - Rewrite)**: Yêu cầu AI chuyển hóa thành ngôn ngữ trong sáng, hòa đồng.
7. **Hành vi nguy hiểm bắt chước được (Mức 5 - Block)**: Cấm các hành vi nghịch lửa, leo trèo ban công, sờ ổ điện.
8. **Phân biệt đối xử (Mức 3 - Rewrite)**: Loại bỏ các định kiến ngoại hình, màu da, giới tính.
9. **Bi kịch bế tắc (Mức 4 - Rewrite)**: Đảm bảo câu chuyện luôn có lối thoát tươi sáng và hy vọng.
10. **Xung đột gia đình gay gắt (Mức 4 - Flag)**: Đưa vào hàng chờ để kiểm duyệt viên kiểm tra yếu tố tình cảm gia đình ấm áp.

