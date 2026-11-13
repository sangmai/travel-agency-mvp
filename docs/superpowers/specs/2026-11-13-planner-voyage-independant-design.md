# Planner « voyage indépendant » — thiết kế

**Ngày:** 2026-11-13
**Trạng thái:** Spec, chờ duyệt. Chưa viết dòng code nào.

---

## 1. Vấn đề

Site có 26 trang, **toàn bộ nhắm người sắp mua tour**. Nhóm khách Pháp đã quyết
định tự tổ chức chuyến đi không có trang nào để vào, và cũng không mang lại gì.

Ý tưởng ban đầu: dựng một planner kiểu [Camino Ninja](https://caminoninja.com),
kiếm hoa hồng affiliate khi khách đặt khách sạn.

## 2. Đây KHÔNG phải một dự án kiếm tiền từ affiliate

Phần này đặt ở đầu vì nó là thứ dễ hiểu sai nhất, và hiểu sai thì mọi quyết định
sau đều lệch.

Số đã kiểm chứng:

| Nền tảng | Hoa hồng | Cookie | Ngưỡng trả |
|---|---|---|---|
| Booking (qua CJ) | ~4% giá trị đặt phòng | ~24 h (nguồn mâu thuẫn) | 110 € |
| Agoda | 4% → 4,5% → 5% theo bậc | ~1 ngày | 50 $ |
| **Klook** (tour + khách sạn) | **6,5%** | — | — |
| **GetYourGuide** (trải nghiệm) | **~8%** | — | — |

Phòng khách sạn Việt Nam ~50 €/đêm. Một chuyến 14 đêm = 700 € = **28 €** hoa hồng,
trả 30–60 ngày **sau khi khách trả phòng**.

Phễu thực tế trên 3 000 lượt truy cập năm đầu:

- ~20% bấm link → ~4% đặt và ở thật → **≈ 670 €/năm**, và con số này còn bị
  cookie 24 giờ ăn mòn thêm, vì người Pháp đặt phòng muộn hơn lúc lên kế hoạch
  hàng tuần.
- ~1% vẫn hỏi báo giá → 2–3 đơn circuit → **600–900 €/năm**

**Một đơn circuit (~300 €) gần bằng cả năm đầu tiền affiliate.**

Vậy lý do làm, xếp theo giá trị thật:

1. **Chiếm vùng từ khoá đang bỏ trống** — traffic mới hoàn toàn
2. **Một phần traffic đó vẫn chảy vào phễu tour**
3. **Có người dẫn link tới công cụ miễn phí, không ai dẫn link tới trang bán tour**
   — backlink và brand mention quyết định việc AI có trích dẫn site

Affiliate là phần thưởng kèm theo. Nếu một quyết định thiết kế nào đó phải chọn
giữa *thêm hoa hồng* và *giữ lòng tin*, chọn lòng tin.

## 3. Định vị: tách ở khâu thu hút, không chỉ ở nút bấm

Rủi ro lớn nhất là tự giành khách của chính mình. Giải bằng cách để hai nhánh
**không gặp nhau ngay từ truy vấn tìm kiếm**:

| Khách gõ | Rơi vào | Thấy |
|---|---|---|
| `circuit vietnam 15 jours` | `/circuit-vietnam-15-jours/` (đã có) | Chào bán tour. **Không có planner** |
| `voyage vietnam sans agence`<br>`organiser son voyage au vietnam soi-même` | Khu DIY mới | Planner + gợi ý đặt chỗ |

Người gõ `circuit vietnam` không bao giờ nhìn thấy planner. Người gõ
`sans agence` đã tự khai họ không mua tour.

## 4. Mô hình: bộ chọn & chỉnh, KHÔNG phải máy sinh tổ hợp

Repo đã có 6 lịch trình **viết tay**, có `program` ngày-theo-ngày, có văn.
Một máy sinh tổ hợp sẽ nhả ra chuỗi étape không có chữ nào — vừa mất giọng của
site, vừa đâm vào án phạt *programmatic thin content*.

**Quyết định:** planner khởi đầu từ một trong các lịch trình biên tập sẵn, khách
**chỉnh** (thêm Hà Giang, bỏ miền Nam, đổi tháng), và công cụ cho thấy **hậu quả**.

Nguyên tử là **étape** — một điểm dừng ở lại 1–5 đêm — khớp với
`stops: [{place}]` và `nights: [...]` đã có trong `content/itineraries/`.

## 5. Ràng buộc: hai thước đo

Camino đo bằng **cây số** vì người hành hương bị chặn bởi sức chân.
Khách Pháp đi Việt Nam **đi hưởng thụ**, bị chặn bởi hai thứ khác:

**Thước 1 — Jours.** Số ngày nghỉ phép. Mỗi étape tốn đêm, mỗi đoạn nối tốn giờ,
có đoạn tốn trọn một ngày. Vượt ngưỡng thì **tràn đỏ**.

**Thước 2 — Rythme.** Một lịch trình có thể *vừa khít* mà vẫn là kỳ nghỉ tệ.
Đo bằng: số lần đổi khách sạn, tổng giờ di chuyển, **số ngày không phải đi đâu**.

Ví dụ hai lịch trình cùng 15 ngày, cùng 14 đêm:

| | Chargé | Reposant |
|---|---|---|
| Étape | 7 | 5 |
| Đổi khách sạn | 6 | 4 |
| Giờ di chuyển | ≈ 22 h | ≈ 11 h |
| **Ngày không bóc vali** | **1** | **4** |

> « Les deux tiennent en 15 jours. Un seul est des vacances. »

**Mặc định là bản reposant.** Mọi configurator khác mặc định bản chargé vì nó
trông hời hơn. Đây là quyết định thương mại, không chỉ thẩm mỹ — *cần anh xác nhận.*

## 6. Giao diện

Không dropdown (đó là Evaneos, Marco Vasco). Không bản đồ (bản đồ trả lời
*« c'est où ? »*, Camille hỏi *« ça rentre dans mes 15 jours ? »*).

**L'enveloppe de jours:** một ngân sách ngày đang vơi đi, cạnh danh sách étape
có thể thêm/bớt. Khi vượt:

```
███████████████████████████▓▓▓▓   18/14 nuits
⚠ Il vous manque 4 jours.

Ha Giang coûte 4 jours : 2 de route, 2 sur place.
Pour l'ajouter, il faut retirer :
  ○ Hué et Hoi An — le Centre          −5 j
  ○ Saïgon et le delta — le Sud        −4 j
  ○ Partir 19 jours au lieu de 15      +4 j
```

**Công cụ không bao giờ tự quyết. Nó nêu hậu quả, khách chọn.**

Đây là điểm khác biệt duy nhất không copy được: configurator của agency khác
**không có lý do gì để nói không**. Công cụ này tự làm hại doanh thu của mình khi
khuyên đi ít chỗ lại — và chính vì vậy mà người ta tin nó.

## 7. Trang kết quả (sau « Créer mon plan »)

Thứ tự: **cho trước, xin sau.**

1. **Le plan, jour par jour** — bản kế hoạch, đầy đủ
2. **Ce qu'il faut réserver maintenant** — chỉ những món *thật sự* khan hiếm
   (đêm trên vịnh Lan Hạ, vé máy bay quốc tế mùa cao điểm, Phong Nha nếu có).
   Thường là **hai món**, không phải mười. Nếu chỉ có hai thì nói hai.
3. **Ce qui peut attendre** — *« Vos hôtels à Hanoï, Hoi An et Saïgon : rien ne
   presse. »* Khối này **tự nguyện bỏ phần lớn hoa hồng khách sạn**. Đó là giá của
   lòng tin, và nó rẻ. Kèm *« Le plan reste à cette adresse »* — cách duy nhất kéo
   khách quay lại đúng lúc họ sắp đặt phòng.
4. **Ce qui est difficile depuis la France** — vé tàu nội địa, tài xế, hướng dẫn
   viên tiếng Pháp. **Nút báo giá nằm ở đây**, tại chỗ ma sát, không phải cuối trang.
   Gửi kèm cả kế hoạch → lead đầy đủ nhất site từng có.
5. **Vos journées libres** — trải nghiệm lấp ngày trống (Klook, GetYourGuide).
   Nguồn hoa hồng chính.

**Không có cổng email.** Không tài khoản, không đăng ký. *« Me l'envoyer par mail »*
là tuỳ chọn, không phải rào chắn.

## 8. Chính sách affiliate

- **Chỉ gắn vào món khan hiếm và trải nghiệm**, không gắn vào từng đêm ngủ.
  Khối này không phình ra khi lịch trình dài thêm — nên hoa hồng không bao giờ
  tạo sức ép lên lời khuyên.
- **Ưu tiên Klook và GetYourGuide** (6,5–8%) hơn Booking/Agoda (4–5%).
- **Công bố rõ ràng** cạnh mỗi link: *« Lien partenaire — nous percevons une
  commission, sans surcoût pour vous. »*
- **Link trơn, không pixel, không script.** Giữ nguyên kiến trúc không-cookie đã
  ghi trong `app/layout.tsx`. *(Diễn giải pháp lý — cần hỏi lại cho chắc.)*

## 9. Kiến trúc kỹ thuật

Site là `output: "export"`, tĩnh hoàn toàn.

- **Trạng thái kế hoạch mã hoá trong URL.** Chia sẻ được, mở lại được, không cần
  backend, không cần D1.
- **Trang kế hoạch cá nhân phải `noindex`.** Mỗi tổ hợp là một URL; để Google ăn
  vào thì thành hàng nghìn trang mỏng. Thứ được index là **trang lịch trình biên
  tập sẵn**.
- **`lib/booking.ts` cô lập sau một interface.** v1 trả về link sâu; sau này thay
  bằng API mà planner không biết gì.
- Tái dùng nguyên: `Photo`, `Bande`, schema, Markdown delivery, `check-links`.

Mức xáo trộn dự kiến — đo bằng lần thêm blog (commit `b9c23db`):

```
10 files changed, 791 insertions(+), 2 deletions(-)
```

**Hai dòng bị xoá.** Kiến trúc này được dựng để nuốt thêm khu mới mà không sửa
cái đang chạy.

## 10. Dữ liệu

Con hào **không phải** kiến thức bản địa. Người làm Camino Ninja chưa đi hành
hương lần nào; họ gom dữ liệu công khai mà chưa ai gom, rồi dựng vòng đính chính
để người dùng nuôi nó. Booking có khách sạn, OSM có đường, đường sắt có lịch
chạy — **chưa ai ghép lại để trả lời câu *« est-ce que ça rentre dans mes 15
jours ? »***. Con hào là việc ghép và câu hỏi.

### Đã có sẵn trong repo

- `content/places.json` — **23 địa danh kèm toạ độ**
- `content/seasons.json` — **ma trận 12 tháng × 3 miền hoàn chỉnh**, có xếp hạng
  (`ideal` / `bon` / `moyen` / `deconseille`) và ghi chú. **Chiều mùa vụ coi như xong.**

### Còn thiếu: `content/legs.json`

Vì Việt Nam là một đường thẳng và khách đi theo một chiều, không cần ma trận đầy
đủ — chỉ cần các chặng liền kề thực tế. Với tập địa danh v1 (Hà Nội, Ninh Bình,
Lan Hạ, Sapa, Hà Giang, Phong Nha, Huế, Đà Nẵng, Hội An, Sài Gòn, Cần Thơ):
**khoảng 15 chặng**, mỗi chặng 2–3 phương tiện cố định. Tổng ~38 dòng.

```json
{ "from": "hanoi", "to": "hue",
  "modes": [
    { "mode": "train-nuit", "hours": 13, "days": 0,
      "note": "Départ 19 h, arrivée 8 h. Économise une nuit d'hôtel.",
      "source": "Horaires officiels des chemins de fer" },
    { "mode": "avion", "hours": 1.25, "days": 0.5,
      "note": "Phu Bai est à 15 km de Hué. Avec les aéroports, comptez une demi-journée.",
      "source": "Horaires compagnies" }
  ] }
```

**Trường `days` là trường quan trọng nhất, và không nguồn công khai nào có nó.**
Giờ không bằng ngày: tàu đêm lâu gấp mười lần máy bay nhưng tốn **ít ngày hơn**,
vì khách ngủ trên tàu và tiết kiệm một đêm khách sạn. Đó là thứ Camille tự tính
không ra, và là thứ thước đo ngày (§5) cần để chạy.

Thêm một trường nữa, sinh ra từ khảo sát: **`journee`**, phân biệt hai thứ mà số
giờ gộp làm một.

- `perdue` — ngồi trong xe trên cao tốc
- `vecue` — đèo Hải Vân, tàu ven biển: *là* chuyến đi, không phải đường tới nó

**Thước đo nhịp độ (§5) chỉ trừ điểm cho `perdue`.** Thiếu phân biệt này thì công
cụ sẽ khuyên khách chui hầm Hải Vân để tiết kiệm 90 phút, và cướp mất con đường
đẹp nhất nước.

### Lấy ở đâu — và hoá ra không cần hỏi ai mấy

Giả định ban đầu ("hỏi Jasmin hoặc một bác tài 15 câu") **sai**: bác tài chạy theo
tuyến, không ai nắm cả 15 chặng. Và Việt Nam không phải điểm đến mới với người
Pháp — dữ liệu này công khai từ lâu, chỉ chưa ai gom.

`content/legs.json` hiện có **16 chặng, 26 phương tiện, 23 cái có nguồn công khai**.

| Trường | Nguồn |
|---|---|
| `hours`, `mode` | Lịch đường sắt (dsvn.vn), lịch bay, 12go.asia, Baolau, atlas thời gian di chuyển 2026 |
| `days` | Suy ra từ **giờ khởi hành và giờ tới** — tra được, không phải đoán |
| `note`, `journee` | Phần lớn suy ra từ nguồn; còn **2 câu** thật sự cần người |

Hai câu còn lại (chi tiết trong `docs/legs-questions.md`): **mùa mưa làm chặng nào
đóng hay lâu hơn hẳn**, và **chỗ nào không nên tới sau khi trời tối** — câu thứ hai
là ràng buộc giờ khởi hành, không bảng giờ nào ghi.

### Vòng đính chính

Mỗi chặng **hiển thị nguồn của con số** (*« 8 h — estimation Google Maps »*) kèm
link **« c'est faux ? »**. Hướng dẫn viên của Jasmin chạy các tuyến đó hằng tuần
và sửa được bằng một cú bấm. Ghi rõ nguồn cũng là một điểm khác biệt: không site
du lịch nào làm, và nó tránh giả vờ có thẩm quyền mình chưa có.

### Phạm vi thật của v1

Trang tĩnh đầu tiên bao **một** lịch trình, tức **5–6 chặng**. Sáu con số, không
phải 38. Bộ `legs.json` đầy đủ là việc của bước 4.

## 11. Thứ tự xây — ngược với trực giác

1. **Một trang tĩnh DIY duy nhất** — viết tay, nhắm một truy vấn `sans agence`.
   Một trang, không phải vài trang: đây đồng thời là phép thử ở §13, và viết năm
   trang trước khi biết vùng từ khoá có thật là đặt cược chứ không phải thử.
2. **Khối "phải đặt trước" + link** — gắn thẳng lên trang đó, **không cần planner**.
   Khả năng kiếm tiền sống trong vài ngày.
3. **Thêm trang tĩnh** — chỉ khi bước 1 cho thấy có người vào.
4. **Planner tương tác** — sau cùng, và **cần spec riêng**. Spec này dừng ở bước 3;
   bước 4 chỉ được mô tả đủ để bước 1–3 không chặn đường nó.

Planner phục vụ khách đã vào site. Site tạo ngày 2026-10-31, Bing index 0 trang.
**Nút thắt là lượng truy cập, không phải tỉ lệ chuyển đổi.** Làm bước 3 trước là
dựng phòng chờ sang trọng cho một nhà ga chưa có đường ray.

## 12. Điều kiện tiên quyết — chặn, không phải khuyến nghị

1. **Ba trang pháp lý**: `mentions-legales`, `politique-de-confidentialite`,
   `conditions-generales-de-vente`. Vốn đã nợ từ trước vì D1 giữ dữ liệu cá nhân
   người EU. Tôi có thể soạn **bản nháp đầu tiên**, nhưng nó phải được người có
   thẩm quyền rà lại trước khi đăng — đây là văn bản ràng buộc một doanh nghiệp
   thật với khách hàng thật.
2. **Đăng ký CJ / Klook / GetYourGuide ngay.** Miễn phí, mất thời gian duyệt, và
   **có thể bị từ chối** vì site quá mới. Nếu bị từ chối thì nhánh affiliate sụp
   và chỉ còn phần SEO. Phải biết trước khi viết code.
3. ~~**Nói chuyện với Jasmin trước.**~~ **Không còn là điều kiện chặn.** Chủ site
   quyết định (13/11/2026) rằng Jasmin không có ý kiến về phần này và sẽ được
   giải thích sau. Ghi lại ở đây để sau này đọc lại biết đó là một **lựa chọn có
   ý thức**, không phải một chỗ bị bỏ sót. Rủi ro còn lại — hai bên vẫn chưa có
   thoả thuận hoa hồng bằng văn bản — không thay đổi.

## 13. Làm sao biết nó thất bại

Phép thử rẻ, chạy trước khi dựng planner: **một trang tĩnh duy nhất** nhắm một
truy vấn DIY, có khối "phải đặt trước" kèm link. Vài ngày công.

| Đo | Trả lời câu hỏi |
|---|---|
| Có ai vào không | Vùng từ khoá DIY có thật không |
| Có ai bấm link không | Affiliate có khả thi không |
| Có ai hỏi báo giá không | Lead có chảy ngược vào phễu không |

Nếu trang đó im lặng sau 8–10 tuần, planner cũng sẽ im lặng. **Dừng lại, đừng xây.**

Chỉ số theo dõi được mà không cần audit lại: số lượt hiển thị trong GSC cho các
truy vấn chứa `sans agence`, `soi-même`, `indépendant`.

## 14. Ngoài phạm vi

- Booking Demand API / thẻ khách sạn có giá và ảnh (v2, nếu v1 chứng minh được)
- Tài khoản người dùng, lưu kế hoạch phía server
- Bản đồ tương tác
- Ứng dụng di động
- Đa ngôn ngữ

---

## Những gì còn chờ anh xác nhận

1. **Mặc định bản *reposant*** (§5) — quyết định thương mại
2. Ba điều kiện tiên quyết ở §12, nhất là **nói chuyện với Jasmin**
3. ~~**Ai trả lời 15 câu**~~ — hết hạn. Khảo sát đã lấp 23/26 phương tiện từ nguồn
   công khai. Còn **3 con số tra nốt trên 12go/Baolau** (tôi làm được) và **2 câu
   cần người ở đó**: mùa mưa đóng chặng nào, và chỗ nào không nên tới sau khi tối.
