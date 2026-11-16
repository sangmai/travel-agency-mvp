# Aperçu du planificateur sur la page d'accueil — thiết kế

**Ngày:** 2026-11-16
**Trạng thái:** Spec, đã duyệt thiết kế. Chưa viết dòng code nào.
**Liên quan:** [`2026-11-13-planner-voyage-independant-design.md`](./2026-11-13-planner-voyage-independant-design.md)

---

## 1. Vấn đề

Planner đã lên production ở `/organiser-son-voyage-au-vietnam/`, nhưng nó được
dẫn link từ **đúng một chỗ**: cột « Préparer » ở footer. Không có trong thanh
nav, không có trong thân trang chủ.

Một công cụ không ai tìm thấy thì không ai dẫn link tới. Và theo §2 của spec
planner, **backlink và brand mention chính là lý do số một để làm nó** — hơn cả
tiền affiliate:

> « Có người dẫn link tới công cụ miễn phí, không ai dẫn link tới trang bán tour
> — backlink và brand mention quyết định việc AI có trích dẫn site. »

Nên planner đang không làm được việc chính nó sinh ra để làm.

## 2. Căng thẳng với §3 của spec planner, và vì sao vẫn làm

§3 cố ý tách hai nhóm khách **ngay từ truy vấn tìm kiếm**: người gõ
`circuit vietnam` không bao giờ thấy planner. Đưa planner lên trang chủ là phá
ranh giới đó, và rủi ro tự giành khách của chính mình là thật — một đơn circuit
(~300 €) gần bằng cả năm đầu tiền affiliate (~670 €).

Ba lý do vẫn làm:

1. **Trang chủ là cửa thương hiệu, không phải trang đích của truy vấn DIY.**
   §3 nói về việc các truy vấn rơi vào các trang khác nhau. Trang chủ phục vụ
   mọi ý định, và khách tới đây qua `voyage vietnam` hoặc qua tên thương hiệu.
2. **Mục tiêu số một của planner cần đúng điều này.** Xem §1.
3. **Trang planner đã có đường về phễu tour** — khối « Ce qui ne se réserve pas
   depuis la France » kèm nút báo giá. Khách đi sang đó không mất hẳn.

Đổi lại, thiết kế phải **lọc** khách chứ không **đẩy** khách: xem §5, dòng cuối.

## 3. Vị trí và nhịp nền

Chèn giữa `<Circuits />` và `<Story />` trong `app/page.tsx`, nền `sec--sand`.

```
Circuits   sec        (sáng)
Aperçu     sec--sand  ← MỚI
Story      sec--jade  (tối)
```

README quy định **không bao giờ hai nền giống nhau đứng cạnh nhau** — hai mục
cùng màu đọc thành một mục. `sec → sand → jade` giữ đúng.

Vị trí này cũng đúng chỗ trong phễu: khách vừa đọc xong sáu circuit. Ai nghĩ
« tôi tự đi được » thì lộ diện đúng lúc đó, không sớm hơn.

## 4. Con số phải là con số thật

Đây là ràng buộc cứng của thiết kế này, không phải chi tiết triển khai.

Trang chủ sẽ in một jauge và một câu kiểu *« Il vous manque 2 jours »*. Con số
đó **không được hardcode**. Nó được tính lúc build bằng chính `bilan()` mà
planner dùng, trên dữ liệu thật trong `content/`.

Lý do: cả lập luận của site là mọi con số đều nói được nó từ đâu ra. Một jauge
minh hoạ bịa đặt trên trang chủ sẽ là lời nói dối đầu tiên khách đọc thấy — và
nó nằm ngay phía trên câu quảng cáo rằng công cụ này nói thật.

### Ví dụ được chọn: Sapa

Chèn Sapa vào circuit *Vietnam du Nord au Sud* (15 ngày) đúng vị trí vĩ độ:

```
sapa(2) → hanoi(2) → ninh-binh(1) → lan-ha(1)
        → hue(1) → hoi-an(3) → hcmc(3) → can-tho(2)

nuitsPlacees 16 · nuitsDisponibles 14 · reste −2 · inconnus []
```

Đã kiểm bằng cách chạy engine trên dữ liệu thật. So với các ứng viên khác:

| ajout | reste | inconnus | ghi chú |
|---|---|---|---|
| **sapa** | **−2** | **0** | chọn cái này |
| ha-giang | −1 | 0 | đúng nhưng yếu |
| phong-nha | −1 | 1 | yếu, và có chặng không dữ liệu |
| con-dao | −2 | 1 | con số lạc quan giả |
| phu-quoc | −2 | 2 | con số lạc quan giả |

`inconnus: []` là tiêu chí quyết định: mọi chặng trong ví dụ đều có dữ liệu, nên
con số bảo vệ được nếu có người hỏi. Một ví dụ thiếu 2 ngày nhưng bỏ qua hai
chặng không ai biết dài bao lâu thì thực ra thiếu nhiều hơn 2, và nói « 2 » là
nói sai.

Sapa cũng là cái tên khách Pháp nhận ra, khác Ba Be hay Cao Bang.

## 5. Nội dung

Phần chữ vào `content/home.json` key `planificateur`, theo quy ước
« cái gì già đi thì vào CMS ». Chỉ con số là do máy tính.

> **VOUS ORGANISEZ VOUS-MÊME ?**
>
> **Est-ce que votre voyage *tient vraiment* dans vos quinze jours ?**
>
> Ajoutez Sapa à notre circuit de quinze jours, et il n'y tient plus.
>
> ```
> ████████████████████████▓▓   16 / 14 nuits
> Il vous manque 2 jours.
> ```
>
> Notre planificateur vous le dit maintenant, pas sur place — et vous dit ce
> qu'il faut retirer. Gratuit, sans inscription, sans adresse e-mail.
>
> **C'est le seul outil de ce site qui vous dira non.**
>
> `[ Organiser mon voyage → ]`
>
> *Et si vous préférez qu'on s'en occupe, nos circuits sont juste au-dessus.*

**Dòng cuối là cái van chống tự giành khách.** Nó trả người lưỡng lự về phễu
tour thay vì đẩy họ đi hẳn. Không được bỏ khi sửa chữ.

Tiêu đề dùng `*chữ*` cho phần in nghiêng màu ambre, theo quy ước `<Accent>`.

## 6. Kiến trúc

`components/Apercu.tsx` — server component async, **không một dòng JS phía
client**, theo đúng khuôn `components/Circuits.tsx`:

- tự gọi `getHome()`, `getTrips()`, `getPlaces()`, `getLegs()`
- render bằng `<SectionHead kicker title lede />` và `<Accent>`
- tính jauge bằng `bilan()` từ `lib/planner.ts`

Trang chủ hiện **không có client component nào**. Thiết kế này giữ nguyên điều
đó: LCP mobile đang 3,1 s trong lab và audit đã dặn chưa tối ưu hero khi chưa có
dữ liệu CrUX — nên ít nhất đừng làm nó tệ thêm.

Jauge mang `aria-hidden`: câu bên dưới nói đúng cùng thông tin bằng chữ, và để
cả hai cùng đọc được thì screen reader nghe hai lần. Cùng cách `TripMap` làm.

## 7. Chốt chặn lúc build

Thêm vào `scripts/check-planner.mjs` một khẳng định: ví dụ Sapa vẫn phải
**thiếu ngày** (`reste < 0`) và **không có chặng lạ** (`inconnus` rỗng).

Nếu ai sửa `legs.json`, `places.json` hay itinerary làm Sapa bỗng vừa khít,
build đỏ và người ta chọn ví dụ khác — thay vì trang chủ lặng lẽ in
*« Il vous manque 0 jours »*.

Đây đúng loại lỗi dự án này đã dính bảy lần trong quá trình làm planner: số học
đúng, câu đọc lên thì sai. Không lần nào test bắt được, vì không lần nào là lỗi
lập trình. Chốt chặn phải nằm ở chỗ kiểm dữ liệu thật, tức
`scripts/check-planner.mjs`, không phải `lib/planner.test.ts` — file test cố ý
chỉ dùng fixture, không đụng `content/`.

## 8. File đụng tới

| File | Việc |
|---|---|
| `components/Apercu.tsx` | mới |
| `app/page.tsx` | chèn một dòng giữa `<Circuits />` và `<Story />` |
| `content/home.json` | thêm key `planificateur` |
| `app/globals.css` | `.apercu__*`, dùng lại token jauge sẵn có |
| `scripts/check-planner.mjs` | chốt chặn §7 |
| `.pages.yml` | sinh lại bằng `npm run cms` |

**`.pages.yml` không sửa tay.** Nó do `scripts/make-cms-config.mjs` sinh ra, và
nếu quên chạy lại thì `scripts/check-cms.mjs` làm build đỏ — đúng như nó được
dựng để làm. Một trường có trong JSON mà thiếu trong config sẽ **bị xoá** lần
đầu người biên tập bấm Publish.

Không thêm dependency. Runtime deps vẫn đúng bốn: `next`, `react`, `react-dom`,
`sharp`.

## 9. Làm sao biết nó thất bại

| Đo | Trả lời câu hỏi |
|---|---|
| Số lượt vào `/organiser-son-voyage-au-vietnam/` từ trang chủ | Section có được nhìn thấy không |
| Tỉ lệ gửi devis trên trang chủ trước/sau | Nó có ăn mất khách mua tour không |
| Backlink trỏ tới trang planner, sau 3–6 tháng | Mục tiêu số một có đạt không |

**Ngưỡng rút lui:** nếu tỉ lệ gửi devis trên trang chủ tụt rõ rệt sau 8 tuần,
đổi section thành một dòng trong mục Circuits (phương án C đã cân nhắc và loại),
hoặc bỏ hẳn. Section này không phải thứ phải giữ bằng mọi giá — nó phục vụ việc
được dẫn link, và nếu nó lấy mất khách thật thì cái giá đó quá đắt.

**Hôm nay chưa đo được chỉ số nào trong ba cái trên.** Search Console chưa xác
minh, `mesure.cloudflare` và `mesure.ga4` đều trống, nên không có thống kê nào
chạy.

Điều này **không chặn việc ship section** — nó chặn việc biết section có tác
dụng hay không, kể cả ngưỡng rút lui ở trên. Bật Cloudflare Web Analytics là
việc riêng, **không nằm trong plan này và không nằm trong danh sách file §8**:
nó chỉ cần điền một trường trong `content/site.json`, không cần code, và nó
không tốn banner đồng ý vì không đặt cookie.

Nói thẳng hệ quả: nếu ship section này mà chưa bật thống kê, §9 trở thành giấy
trắng — không ai biết nó mang lại gì hay lấy mất gì, và ngưỡng rút lui không bao
giờ kích hoạt được.

## 10. Ngoài phạm vi

- Nhúng planner chạy được ngay trên trang chủ (đã cân nhắc và loại ở §6)
- Thêm mục vào thanh nav header — nó đặt link DIY cạnh « Circuits » trên **mọi**
  trang, kể cả trang bán tour, đúng thứ §3 cấm
- Sửa bug `hashchange` của planner — việc riêng, đã ghi nhận
- Trang facette cho `/circuit-vietnam` — việc lớn hơn, vẫn là nguồn longue
  traîne đáng giá nhất theo README
