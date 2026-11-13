# 15 chặng — bảng hỏi

Mang theo khi gặp Jasmin, một bác tài, hoặc một hướng dẫn viên. Hỏi vài chặng
một lần cũng được, không cần xong trong một buổi. **Hỏi vài người rồi đối chiếu
tốt hơn hỏi một người.**

Cột **giờ** tôi đã điền ước lượng để người trả lời chỉ cần **gật hoặc sửa** —
sửa một con số dễ hơn nghĩ ra một con số. **Mọi giá trị dưới đây đều là ước lượng
của tôi, chưa tra lịch chính thức, chưa ai xác nhận.**

Cột **mất ngày** là cột quan trọng nhất và là cột không tra được ở đâu cả.
Nó trả lời: *rời đi và tới nơi lúc mấy giờ, và tới nơi còn làm được gì trong
ngày không.*

- `0` — không mất ngày nào (ngủ trên tàu, hoặc đi một loáng)
- `0,5` — mất nửa ngày
- `1` — mất trọn một ngày, tới nơi chỉ còn ăn tối rồi ngủ

---

## Miền Bắc

| # | Chặng | Phương tiện | Giờ (ước lượng) | Mất ngày? | Khách Pháp hay bất ngờ chuyện gì? |
|---|---|---|---|---|---|
| 1 | Hà Nội → Ninh Bình | ô tô | 2 h | | |
| 2 | Hà Nội → Lan Hạ / Hạ Long | ô tô | 3 h | | |
| 3 | Ninh Bình → Lan Hạ | ô tô | 3 h | | |
| 4 | Hà Nội → Sapa | xe khách | 5 h 30 | | |
| 4b| Hà Nội → Sapa | tàu đêm + ô tô | 8 h + 1 h | | |
| 5 | Hà Nội → Hà Giang | xe khách | 6–7 h | | |

## Bắc → Trung

| # | Chặng | Phương tiện | Giờ (ước lượng) | Mất ngày? | Khách Pháp hay bất ngờ chuyện gì? |
|---|---|---|---|---|---|
| 6 | Hà Nội → Huế | **tàu đêm** | 13 h | | |
| 6b| Hà Nội → Huế | máy bay | 1 h 15 | | |
| 7 | Hà Nội → Đà Nẵng | máy bay | 1 h 20 | | |
| 8 | Hà Nội → Phong Nha | tàu đêm (Đồng Hới) | 10 h | | |
| 9 | Phong Nha → Huế | ô tô | 4 h | | |

## Miền Trung

| # | Chặng | Phương tiện | Giờ (ước lượng) | Mất ngày? | Khách Pháp hay bất ngờ chuyện gì? |
|---|---|---|---|---|---|
| 10 | Huế → Đà Nẵng | ô tô, đèo Hải Vân | 2 h | | |
| 10b| Huế → Đà Nẵng | tàu (ven biển) | 2 h 30 | | |
| 11 | Đà Nẵng → Hội An | ô tô | 45 ph | | |
| 12 | Huế → Hội An | ô tô, có dừng | 3 h | | |

## Trung → Nam, và miền Nam

| # | Chặng | Phương tiện | Giờ (ước lượng) | Mất ngày? | Khách Pháp hay bất ngờ chuyện gì? |
|---|---|---|---|---|---|
| 13 | Đà Nẵng → Sài Gòn | máy bay | 1 h 20 | | |
| 14 | Huế → Sài Gòn | máy bay | 1 h 30 | | |
| 15 | Sài Gòn → Cần Thơ | ô tô | 3 h 30 | | |

---

# 5 câu phán đoán

Đây mới là phần đáng tiền. Bảng trên tra được; năm câu này thì không có ở đâu cả,
và chúng là thứ sinh ra những lúc planner **nói không** — thứ duy nhất đối thủ
không sao chép được.

### 1. Chặng nào anh khuyên khách **đừng đi trong một ngày**?

→ Sinh ra cảnh báo *« à ne pas faire d'une traite »*. Nghi Hà Nội → Đồng Văn,
nhưng cần người xác nhận.

### 2. Chặng nào **Google Maps sai nhiều nhất**?

→ Quyết định chỗ nào tin máy, chỗ nào phải ghi đè bằng số thật. Nghi đường đèo
miền núi phía Bắc.

### 3. Chặng nào **tàu hoặc máy bay rõ ràng hơn ô tô, dù chậm hơn**?

→ Đây là câu đẻ ra trường `days`. Tàu đêm Hà Nội–Huế lâu gấp mười lần máy bay
nhưng có thể tốn **ít ngày hơn**, vì ngủ trên tàu và tiết kiệm một đêm khách sạn.
Cần biết chặng nào nữa có tính chất đó.

### 4. **Mùa mưa** có làm chặng nào khác hẳn không?

→ `seasons.json` đã có mưa theo miền, nhưng không biết mưa làm đường nào **lâu
hơn** hay **đóng**. Nghi Hà Giang và Phong Nha.

### 5. Chỗ nào **không nên tới sau khi trời tối**?

→ Ràng buộc giờ khởi hành, chứ không phải giờ di chuyển. Một chặng 6 tiếng mà
phải tới trước 17 h thì thực tế ăn mất cả ngày.

---

# Sau khi điền xong

Bảng này chuyển thành `content/legs.json` theo lược đồ ở §10 của spec. Mỗi con số
mang theo nguồn của nó, và trên trang có link **« c'est faux ? »** để hướng dẫn
viên sửa về sau.

**Trang tĩnh đầu tiên chỉ cần 5–6 chặng**, không cần cả bảng. Điền được chừng nào
dùng chừng đó.
