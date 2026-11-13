# Những gì còn thiếu trong `content/legs.json`

Bản đầu của tài liệu này là một bảng 15 chặng để đi hỏi Jasmin hoặc một bác tài.
**Tiền đề đó sai**, vì hai lý do chủ site chỉ ra:

- Bác tài chạy **theo tuyến**. Người chạy Huế–Đà Nẵng không biết Hà Nội–Hà Giang.
  Không có một người nào nắm được cả 15 chặng.
- Việt Nam không phải điểm đến mới với người Pháp. Họ đã đi mấy chục năm và
  **viết lại rất nhiều** — dữ liệu này công khai, chỉ là chưa ai gom.

Đi tìm thì đúng như vậy. `content/legs.json` hiện có **16 chặng, 26 phương tiện**,
trong đó **23 cái có nguồn công khai**. Còn lại ba.

---

## Ba con số còn trống

Cả ba đều **tra được, không cần hỏi người** — chỉ là tôi chưa tìm thấy nguồn đủ
chắc. Kiểm trên [12go.asia](https://12go.asia), [Baolau](https://baolau.com)
hoặc Google Maps là xong.

| Chặng | Phương tiện | Ước lượng hiện tại |
|---|---|---|
| Ninh Bình → Lan Hạ | ô tô | 3 h |
| Phong Nha → Huế | ô tô | 4 h |
| Huế → Đà Nẵng | tàu hoả | 2 h 30 |

---

## Hai câu mà tìm kiếm *không* trả lời được

Đây mới là phần thật sự cần một người sống ở đó. Chỉ còn hai câu, không phải mười lăm.

### 1. Mùa mưa làm chặng nào **lâu hơn hẳn hoặc đóng**?

`seasons.json` biết tháng nào miền nào mưa. Nó không biết mưa làm **đường nào**
khó đi. Nghi Hà Giang (đường đèo) và Phong Nha (đường vào hang ngập), nhưng đó là
phỏng đoán.

Giá trị: sinh ra cảnh báo chéo giữa mùa và chặng — thứ không ai khác có.

### 2. Chỗ nào **không nên tới sau khi trời tối**?

Đây là ràng buộc **giờ khởi hành**, không phải giờ di chuyển. Một chặng 6 tiếng
mà bắt buộc phải tới trước 17 h thì thực tế ăn mất cả ngày, dù chỉ đi 6 tiếng.
Không bảng giờ nào ghi điều này.

---

## Những gì tìm kiếm đã trả lời thay

Ghi lại để khỏi đi hỏi lại:

- **« Google sai ở đâu »** → vào/ra Hà Nội và Sài Gòn cộng thêm **30–60 phút** so
  với giờ công bố.
- **Một điều không ai nghĩ ra** → trên cùng tuyến cao tốc, **xe giường nằm lâu hơn
  ô tô riêng 30–60%**, vì đón nhiều điểm và nghỉ bắt buộc.
- **« Chặng nào đừng đi trong một ngày »** → Hà Nội–Huế đường bộ 9–10 h, nguồn ghi
  thẳng *« drive impractical »*. Hà Nội–Sài Gòn đường bộ 26–30 h, *« almost no one
  drives »*.
- **« Tàu hơn máy bay ở đâu »** → Hà Nội–Huế, SE3 rời 19 h 20 tới 07 h 55, tốn
  **0 ngày**. Nhưng Hà Nội–Sapa thì **không**: tàu tới Lào Cai còn 35 km đường núi,
  nên không xoá được một ngày như tàu Huế.

## Và một phát hiện làm đổi lược đồ

Du thuyền Lan Hạ bán dưới nhãn **« 1 nuit »**. Thực tế: xe đón khách sạn **8 h**,
tới bến **11 h 30**, lên tàu **12 h**; hôm sau trả tàu **11 h 30**.

**Một đêm trên vịnh ăn mất hai ngày.** Đó chính là loại sự thật mà cột `hours`
giấu đi và cột `days` phải nói ra.

Cùng lúc, Huế → Hội An qua đèo Hải Vân mất 5–7 h — nhưng **ngày đó không mất**,
nó là một ngày tham quan. Nên lược đồ có thêm trường `journee`:

- `perdue` — ngồi trong xe trên cao tốc
- `vecue` — đèo Hải Vân, tàu ven biển

**Thước đo nhịp độ chỉ trừ điểm cho `perdue`.** Không có phân biệt này thì công cụ
sẽ khuyên khách chui hầm để tiết kiệm 90 phút, và cướp mất con đường đẹp nhất nước.
