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

## 10. Dữ liệu phải xây — và đây là con hào

`content/places.json` đã có **23 địa danh kèm toạ độ**. Thiếu: **ma trận di chuyển**
cho ~30 cặp étape liền kề. Mỗi cặp cần:

- số giờ thực tế
- phương tiện (đường bộ / tàu đêm / bay nội địa / thuyền)
- **có ăn mất trọn một ngày không**
- ghi chú thật (*« 8 h đường đèo, không nên đi một mạch »*)

Hiện repo chỉ có ba mẩu rời rạc trong văn xuôi (`6 h de route`, `4 h de route`,
`2 h de route`).

Google Maps cho khoảng cách. Nó không nói tàu đêm hơn 14 giờ ô tô.
**Jasmin chạy những tuyến đó hằng tuần** — đó là thứ không aggregator nào có, và
là lý do công cụ này có quyền tồn tại bên cạnh mọi blog du lịch khác.

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
3. **Nói chuyện với Jasmin.** Mở một khu hướng dẫn người Pháp đi Việt Nam *không
   cần agency*, trên chính kênh giới thiệu khách cho họ, là chuyện phải nói trước.
   Hai bên **vẫn chưa có thoả thuận hoa hồng bằng văn bản**.

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
3. Ai dựng **ma trận di chuyển** (§10) — anh, Jasmin, hay cả hai
