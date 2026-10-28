# Jasmine Travel — landing page

Landing page tiếng Pháp cho thị trường Pháp, từ khoá mục tiêu **"voyage vietnam"**.
Next.js 15 (App Router), TypeScript, CSS thuần. Toàn bộ trang render tĩnh — không
có component client nào.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # kiểm tra trước khi deploy
```

## Déploiement — Cloudflare Workers + Sveltia CMS

Site **tĩnh hoàn toàn**, chi phí **0 đ/tháng**. Tiền duy nhất là tên miền.

```
GitHub ──push──▶ Workers Builds ──▶ edge
   ▲                   │
   │                   ├─ out/           ← file tĩnh, phục vụ thẳng
   │                   └─ worker/index.ts ← chỉ chạy cho /api/devis và 404
Sveltia CMS /admin ────┘
```

Dùng Workers chứ không Pages: Pages chỉ còn được bảo trì, Cloudflare hướng dự án
mới sang Workers. Hai bên cùng miễn phí, nhưng file tĩnh trên Workers được phục
vụ **không qua** worker nên không tính vào hạn mức 100k request/ngày — worker
chỉ thức dậy khi có người gửi form hoặc gõ sai địa chỉ.

### Cấu hình Workers Builds

| | |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Biến môi trường | `NODE_VERSION=22` |

Phần còn lại nằm trong `wrangler.jsonc`, không phải trong giao diện Cloudflare —
thư mục tĩnh, cách xử lý barre finale và trang 404 đều khai báo ở đó, nên review
được trong pull request.

`prebuild` tự chạy `scripts/make-images.mjs` nên các biến thể ảnh được sinh lại
trên Cloudflare — chúng **không** nằm trong git (xem `.gitignore`), chỉ manifest
được versioned vì TypeScript import nó.

### Trước lần deploy đầu

1. Đổi `url` trong `content/site.json` sang tên miền thật — nó là gốc của canonical, OG và sitemap.
2. Mở `https://<domain>/admin/`, đăng nhập bằng GitHub.

Chạy thử đúng như trên edge, trước khi push:

```bash
npm run build && npx wrangler dev   # http://localhost:8787
npm run deploy                      # build + deploy thủ công
```

### Form devis → email

Form post sang `/api/devis`, Worker gửi mail qua **Resend** (3 000 mail/tháng
miễn phí) về `email` trong `content/site.json`. `Reply-To` là địa chỉ của khách,
nên người bán chỉ cần bấm **Reply** là trả lời thẳng cho khách.

```bash
# 1. Tạo tài khoản resend.com, lấy API key
npx wrangler secret put RESEND_API_KEY     # production
cp .dev.vars.example .dev.vars             # local, rồi điền key vào
```

**2. Xác thực domain ở Resend** (Domains → Add Domain → thêm bản ghi DNS vào
Cloudflare). Xong thì đổi `DEVIS_FROM` trong `wrangler.jsonc` thành
`Jasmine Travel <devis@domain-thật.fr>`.

Bước này **bắt buộc**. Khi chưa xác thực, `onboarding@resend.dev` chỉ gửi được
về đúng email đã đăng ký Resend — đủ để test, không đủ để chạy thật.

Chống spam: honeypot (`societe`) + rate limit 5 lần/phút theo IP, khai báo
trong `wrangler.jsonc`. Chưa dùng Turnstile vì nó cần JS phía client, mà trang
hiện không có dòng JS nào — nếu sau này bị spam thật thì mới cân nhắc đánh đổi.

Nếu Resend lỗi, khách thấy trang báo lỗi kèm số điện thoại chứ **không** thấy
trang cảm ơn, và toàn bộ nội dung demande được `console.error` để vớt lại bằng
`npx wrangler tail`. Đây là lưới an toàn, không phải chỗ lưu trữ — không ai
ngồi canh log.

Chưa có mail tự động xác nhận cho khách: chỉ làm được sau khi xác thực domain,
và trang `/merci/` đã đủ báo đã nhận.

### Người biên tập dùng ra sao

Vào `/admin/`, sửa tour hoặc giá, bấm **Publish** → commit vào GitHub →
Cloudflare build lại. **Lên web sau ~1 phút** — nói trước với người dùng, nếu
không họ sẽ bấm publish nhiều lần vì tưởng hỏng.

Collections có sẵn: **Circuits** (tour + giá), **Avis**, **Agence** (NAP, note),
**FAQ**, **Régions**, **Par envie**. Thêm collection khác chỉ là ~10 dòng YAML.

### Vì sao Sveltia chứ không phải Strapi

Cloudflare Workers **không chạy được Strapi** — nó cần tiến trình Node sống
lâu. Dùng Strapi tức là dựng thêm một VPS bên cạnh Cloudflare: hai hạ tầng phải
trông coi, 10–25 USD/tháng ngay từ ngày đầu, cho một landing page sửa vài lần
mỗi tháng. Licence Strapi miễn phí thật, nhưng vận hành thì không.

Sveltia sửa thẳng các file JSON trong repo rồi commit. Không server mới, không
database, nội dung versioned trong git, rollback bằng `git revert`. Và
`lib/content/source.ts` **không đổi một dòng** — đó chính là điều lớp nội dung
được dựng để làm.

**Sveltia đang ở beta** — rủi ro thật. Nhưng nó đọc **đúng định dạng config của
Decap**, nên nếu thất vọng thì đổi sang Decap chỉ là thay thẻ `<script>` trong
`public/admin/index.html` và dựng thêm một Worker OAuth. Hàng rào bảo hiểm rẻ.

### Ảnh — vì sao bỏ `next/image`

Cloudflare không có bộ tối ưu ảnh của Next. Ba lối: `unoptimized` (phục vụ JPEG
2000px), Cloudflare Images (trả phí), hoặc sinh sẵn lúc build. Chọn cách ba.

`scripts/make-images.mjs` sinh 6 biến thể WebP cho mỗi ảnh (256→1920, không
phóng to quá kích thước gốc) cộng một vignette 16px base64 làm placeholder.
`components/Photo.tsx` xuất `<img srcset>` thuần.

Đo thật trên build tĩnh, trang chủ cuộn hết ở viewport 1440: **983 KB ảnh,
44 KB JS, 33 KB HTML**. Vignette 190px nay là **6,5 KB** thay vì ảnh gốc
590 KB. Và vì không còn đi qua `next/image`, mẹo `(max-width: 560px) 560px,
190px` — vốn để lách heuristic của Next — đã bỏ được, trả lại `100vw` đúng nghĩa.

Một WebP duy nhất, không AVIF: AVIF nhẹ hơn nữa nhưng buộc phải dùng
`<picture>` với thương lượng kiểu cho các trình duyệt không đọc được — thêm bộ
phận chuyển động cho một khoản lời nhỏ ở quy mô này.

### Ảnh gốc nằm ngoài `public/`

`assets/photos/` chứ không phải `public/photos/`. Next copy nguyên `public/`
vào build, nên để ảnh gốc ở đó sẽ deploy 8,7 MB JPEG mà không trang nào dùng.
`out/` giảm từ 21 MB xuống 11 MB.

## Tham khảo từ đâu

Khảo sát trực tiếp các agency sur-mesure có thiết kế được đánh giá cao:
[Voyageurs du Monde](https://www.voyageursdumonde.fr/voyage-sur-mesure) ·
[Original Travel](https://www.originaltravel.co.uk/) ·
[Jacada Travel](https://www.jacadatravel.com/) ·
[Comptoir des Voyages](https://www.comptoirdesvoyages.fr/)
(Black Tomato và Audley chặn crawler, không đọc được).

Bốn triết lý rút ra và đã áp dụng:

**1. Vào bằng "envie", không phải bằng catalogue.** Cả bốn site đều mở bằng lối
vào theo mong muốn — Voyageurs có "Le monde selon vos envies", Original Travel
có 13 "collections", Jacada phân theo family / honeymoon / adventure. Không ai
đến một site du lịch mà nghĩ "15 ngày, hạng charme"; người ta nghĩ "đi với lũ
trẻ", "tuần trăng mật", "ghét chỗ đông". Đây là khe hở lớn nhất của bản trước →
thêm mục **"Dites-nous ce que vous cherchez"** ngay sau hero, 6 cửa vào. Tiện
thể mỗi cửa trỏ vào một truy vấn tiếng Pháp có volume thật.

**2. Récit, không chỉ note sao.** Jacada có "Your trip, your story", Voyageurs
có Journal, Comptoir có magazine "Ailleurs". Một bài kể của người có tên làm
người đọc *tưởng tượng ra chuyến đi*; một điểm 5/5 chỉ làm họ *yên tâm*. Cả hai
đều cần, nhưng ở hai thời điểm khác nhau → thêm mục **"Carnet de route"**.

**3. Copy phải gợi, không phải tóm tắt.** Ton của họ ngắn và cụ thể:
*"Qu'est-ce que le nouveau voyageur ? Instinctif. Curieux. Libre."* (Voyageurs),
*"L'immersion, la plus belle façon de voyager"* (Comptoir). Hero cũ của tôi là
một đoạn giới thiệu công ty → viết lại thành hai địa danh cụ thể. Mỗi miền thêm
một câu cảm giác ("mùi than củi trong ngõ Hà Nội") thay vì tính từ.

**4. Giá: thị trường Pháp khác thị trường Anh.** Original Travel, Jacada,
Voyageurs đều **giấu giá** (định vị premium, sur devis). Nhưng Comptoir des
Voyages — và các chuyên gia Việt Nam tôi khảo sát từ đầu — đều **hiện
"à partir de"**. Giữ hiện giá: đúng với thị trường này, và là điều kiện để được
AI trích khi có người hỏi "giá một chuyến Việt Nam".

**Nhịp nền.** Nền tối = cảm xúc (carnet ảnh, récit, conseillère, form devis).
Nền sáng = dữ kiện (circuits, ba bảng dữ liệu, FAQ). Và không bao giờ hai nền
giống nhau đứng cạnh nhau — hai mục cùng màu đọc thành một mục.

## Hướng thiết kế

**Nguyên tắc:** một agency du lịch bán bằng ảnh. Mọi thứ còn lại — nền, chữ,
aplat — chỉ để đỡ ảnh, không tranh sự chú ý với ảnh.

**Ảnh.** Hero full-bleed, ảnh tràn ra ngoài cột chữ, bố cục ba miền so le
trái–phải (không phải ba thẻ xếp hàng — thẻ xếp hàng đọc như catalogue). Mỗi
ảnh mang nhãn địa danh kèm vĩ độ, nên vẫn đọc được dải Bắc–Nam (23°N Hà Giang
→ 10°N Mekong) mà không cần thanh đo trên màn hình.

**Carnet.** Một dải ảnh cuộn ngang trên nền xanh đậm, chiều cao so le, không
lý lẽ gì cả — chỉ ảnh và tên nơi chốn. Một trang du lịch cần một khoảnh khắc
thôi giải thích và để người ta nhìn. Dùng scroll-snap native, không carousel:
carousel cần JS, giấu ảnh khỏi crawler, và áp nhịp của nó lên người đọc.

**Màu.** Giấy ấm `#F7F4EF` · xanh sơn mài `#1B4238` · hổ phách đèn lồng
`#B85C12`. Ảnh lo phần bão hoà, giao diện giữ im lặng. Nền tối có bộ token
riêng (`--on-dark*`, `--amber-light`) vì các tông nền sáng rơi dưới 3:1 khi
đặt lên xanh đậm.

**Chữ.** Display = **Fraunces** (serif "mềm", tương phản thấp, chất tạp chí du
lịch — khác hẳn các didone tương phản cao như Playfair/Cormorant đang đầy rẫy).
Body = **Plus Jakarta Sans**. Bỏ hẳn mono: trình bày các con số như số liệu đo
đạc chính là thứ làm trang lạnh đi.

**Bố cục giữ lại từ bản trước:** danh sách circuits kiểu bảng giờ tàu — sáu
itinerary so sánh được bằng cách đọc một cột, nay thêm ảnh thumbnail. Ba bảng
dữ liệu (so sánh, mùa, ngân sách) giữ nguyên vì đó là phần ăn GEO.

**Chuyển động.** Đúng một khoảnh khắc lúc tải hero. Thuần CSS, tôn trọng
`prefers-reduced-motion`.

## Ảnh

13 ảnh trong `assets/photos/`, lấy từ Wikimedia Commons, **toàn bộ giấy phép tự
do** (CC0, CC BY, CC BY-SA, public domain). Script tải nằm ở
`scripts/fetch-photos.py`, nó lọc bỏ mọi thứ không phải licence tự do và ghi
lại credit vào `public/photos/CREDITS.json`.

Hai ràng buộc khi các ảnh này còn trên site:

1. **Phải ghi công.** CC BY và CC BY-SA bắt buộc. Trang `/credits-photos` làm
   việc đó và được link từ footer — đừng xoá.
2. **Không được trình bày người trong ảnh như nhân viên hay khách hàng.** Họ là
   người qua đường được chụp nơi công cộng. Vì lý do này, chân dung "fondatrice"
   cố tình để là hình vẽ chứ không phải ảnh — gán một khuôn mặt thật cho một cái
   tên hư cấu là chuyện khác hẳn.

Đây vẫn là ảnh tạm. Thứ bán được tour là ảnh của chính agency: guide của bạn,
khách của bạn, khách sạn bạn chọn. Đó cũng là thứ phân biệt bạn với các site
mua cùng một kho ảnh.

## Fiches voyage (modèle Terres d'Aventure)

Khảo sát trực tiếp [terdav.com/ps-vietnam](https://www.terdav.com/ps-vietnam) và
một [fiche voyage chi tiết](https://www.terdav.com/ps-vietnam/rn-centre-vietnam/tp-voyage-sur-mesure/at-velo/vielv01--incontournables-vietnam-velo).
Terres d'Aventure là chuẩn mực Pháp về fiche circuit. Cấu trúc họ dùng, và tôi
đã dựng lại:

```
/circuit-vietnam            danh sách 6 voyage
/circuit-vietnam/[slug]     fiche chi tiết × 6, prerender tĩnh
```

**Fiche chi tiết** — thứ tự đúng như Terdav:

| Phần | Nội dung |
|---|---|
| En-tête | Fil d'Ariane, type, H1, tagline, **bandeau 6 tiêu chí** (durée · niveau · hébergement · saison · groupe · note), prix "à partir de", CTA devis, **code voyage** |
| Barre d'ancres | Les plus · Jour par jour · Budget · Hébergement · Fiche technique · Avis — sticky dưới header |
| Les plus | 3–4 điểm mà tour này có mà tour khác không |
| Fil du parcours | Chuỗi étape đánh số |
| **Jour par jour** | Mỗi ngày: số ngày lớn, tiêu đề, mô tả, và **dòng dữ liệu chiếu lệ không được**: Trajet (giờ + km), Marche (giờ, km, ±dénivelé), Vélo, Nuit, Repas |
| Budget | Prix + **Le prix comprend / ne comprend pas**, hai cột |
| Hébergement | Từng đêm, nêu rõ loại và địa điểm |
| Fiche technique | Bảng: code, durée, niveau, encadrement, formalités, dates de départ |
| Avis | Có **ngày khởi hành**, không chỉ ngày viết |

**Điểm cốt lõi của format này:** mỗi ngày đều có số liệu. *"Une journée
inoubliable au cœur des rizières"* không ràng buộc agency vào gì cả; *"5 h de
marche, 12 km, +400 m"* thì có, và cho phép khách nói không. Đây cũng là lý do
các trang kiểu này được AI trích khi có người hỏi một lịch trình cụ thể.

**Một khác biệt cố ý với Terdav:** không có lịch départs. Jasmine Travel chỉ bán
privé theo ngày tự chọn — giống đúng phần "voyage sur mesure" của chính Terdav,
nên mục Budget kết thúc bằng demande de devis chứ không phải bảng ngày.

**Chưa làm — đây là bước tiếp theo có giá trị nhất:** Terdav có **facettes là URL
thật** (`/ps-vietnam/rn-centre-vietnam/tp-voyage-sur-mesure/at-velo`), mỗi tổ hợp
là một trang index được. Trang danh sách của tôi hiện chỉ *mô tả* tiêu chí chứ
không lọc. Dựng các trang facette (theo niveau, theo vùng, theo durée, theo envie)
chính là thứ mang về trafic longue traîne. Và họ còn có **fiche technique PDF tải
được** — một yếu tố chuyển đổi thật, vì file đó được gửi qua email trong gia đình
suốt lúc cân nhắc.

**Một nguồn sự thật duy nhất.** `CIRCUITS` ở trang chủ được **dẫn xuất** từ
`ITINERARIES`, không nhập lại. Giá hiển thị và giá trong JSON-LD `Offer` vì thế
không thể lệch nhau — đã kiểm bằng máy cho cả 6 tour.

## Bản đồ lịch trình

Thay chuỗi mũi tên bằng **bản đồ SVG toạ độ thật**, dựng ngay trong fiche voyage.

**Không thêm thư viện bản đồ, không tile server, không JS.** Lý do: Leaflet hay
Mapbox kéo theo ~40 KB JS + hàng chục request tile + một nhà cung cấp bên thứ ba
thấy được IP khách của bạn. Với một bản đồ tĩnh chỉ hiện 5–9 điểm, cái giá đó
không đáng. SVG nằm thẳng trong HTML được phục vụ — hiện cả khi JS hỏng, và
crawler đọc được.

```
scripts/make-map.py   sinh lib/map-shapes.ts từ Natural Earth 50m
lib/map-shapes.ts     đường viền quốc gia đã chiếu sẵn (11,5 KB)
lib/places.ts         toạ độ 22 étape + hàm chiếu
components/TripMap.tsx  vẽ tuyến + điểm đánh số
```

**Cách làm.** Tải biên giới Natural Earth 50m (public domain), đơn giản hoá bằng
Douglas-Peucker **trong không gian pixel** chứ không phải theo độ — nhờ vậy nét
mảnh đều nhau ở mọi vĩ độ. Phần địa hình xa (Trung Quốc, Thái Lan) bị dồn về mép
khung vì dù sao cũng bị viewBox cắt; giữ nguyên tốn 16 KB vô ích. Rồi chiếu
Mercator. Việt Nam còn 429 điểm, đủ để nhận ra hình chữ S.

**Khung tự cắt theo tour.** Mỗi fiche tính bbox từ `etapes` của chính nó rồi đặt
viewBox tương ứng — tour chỉ miền Bắc thì phóng vào miền Bắc, tour Việt–Cam thì
mở rộng sang Angkor. Nền đã chiếu sẵn trong cùng không gian nên chỉ cần đổi
viewBox, không chiếu lại.

Lỗi tôi mắc lúc đầu: **ép đúng một tỉ lệ 2:3**. Với tour gọn như Pu Luong–Mai
Chau, việc đó nhân đôi chiều cao khung và dìm cả tuyến vào giữa một tấm bản đồ
trống. Sửa thành **khoảng cho phép** (0,55–1,6): bản đồ rộng và thấp đọc rất tốt,
chỉ các cực đoan mới cần nắn.

**Tên địa danh trên bản đồ: dùng toponyme Việt, không dùng dạng Pháp.**
Bản đồ ghi `Hanoi`, `Hue`, `Saigon`, `Lan Ha`, `Mekong` — trong khi danh sách
étape bên cạnh vẫn giữ `Hanoï`, `Hué`, `Saïgon`, `Baie de Lan Ha`. Hai lý do:

1. Đó là thứ khách sẽ đọc trên thực địa — biển đường, bảng sân bay, vé tàu,
   trang đặt phòng đều ghi "Da Nang" và "Hue", không ghi "Hué". Bản đồ là công
   cụ định vị, nên phải dùng đúng graphie mà người ta gặp lại ngoài đời.
2. Ngắn hơn nhiều. "Hô Chi Minh-Ville" 17 ký tự, "Saigon" 6 ký tự — trên bản đồ
   rộng 360 px, đó là khác biệt giữa đọc được và không đọc được.

Bản đồ viết tắt, văn bản gọi tên đầy đủ — hai quy ước này cùng tồn tại không
mâu thuẫn. Khai báo ở trường `label` trong `lib/places.ts`.

**Đặt nhãn bằng thuật toán, không đặt tay.** Mỗi tên thử 8 vị trí quanh điểm
(phải, trái, trên, dưới, 4 đường chéo) và lấy vị trí đầu tiên không chồng lên
thứ gì và không tràn khung; nhãn đã đặt trở thành vật cản cho nhãn sau. Thuật
toán tham lam, duyệt theo thứ tự chương trình — **tất định**, nên cùng một tour
luôn cho ra đúng một bản đồ qua mọi lần build. Chiều rộng chữ được ước lượng
0,52 em/ký tự vì lúc build không có font metrics; sai vài phần trăm không ảnh
hưởng, vì con số chỉ dùng để tránh chồng.

Nhãn có **halo màu giấy vẽ dưới phần tô** (`paint-order: stroke fill`), nên đọc
được dù rơi trên đất liền, trên biển hay trên đường nét đứt của tuyến. Tương
phản đo được: **10,2:1** trên nền đất, **8,5:1** trên biển.

**Tiếp cận.** SVG mang `aria-hidden`. Danh sách étape có đánh số bên cạnh nói
đúng cùng một thông tin, bằng text — tốt hơn cho screen reader và cho SEO (tên
địa danh ở dạng chữ). Nếu để cả hai cùng đọc được thì lộ trình sẽ bị đọc hai lần.

**Một chi phí đã đo, chấp nhận có ý thức.** Next serialize output của server
component hai lần — một trong HTML, một trong RSC payload. Dữ liệu tracé vì thế
xuất hiện 2 lần: 15,6 KB trên trang 144 KB, tức ~7 KB sau gzip. Trang fiche tổng
cộng 36 KB gzip, nhỏ hơn một tấm ảnh. Nếu sau này thêm nhiều trang có bản đồ, đòn
bẩy là tách nền ra `public/basemap.svg` rồi nhúng bằng `<image>` — khi đó nền
được cache dùng chung, đổi lại mất khả năng tô màu bằng CSS.

**Lưu ý khi sửa:** `scripts/make-map.py` và `lib/places.ts` dùng **chung một công
thức chiếu**. Sửa emprise ở một bên mà quên bên kia thì các điểm sẽ lệch khỏi nền
bản đồ. Đó là lý do `BOUNDS` và `VIEW` được export rồi import, không chép lại.
Thêm étape mới mà quên toạ độ thì `place()` **ném lỗi làm hỏng build** — cố ý:
một bản đồ thiếu điểm trong im lặng còn tệ hơn.

## Những gì đã làm cho SEO

Tham khảo từ các site đang top Google.fr cho "voyage vietnam"
([voyage-sur-mesure-vietnam.com](https://www.voyage-sur-mesure-vietnam.com/),
[vietnamevasion.com](https://vietnamevasion.com/), [vietnamdecouverte.com](https://vietnamdecouverte.com),
[agendatour.com](https://agendatour.com/)):

| | Đã triển khai |
|---|---|
| Title | `Voyage Vietnam sur mesure — Agence locale francophone \| Jasmine Travel` (58 ký tự, không bị cắt trong SERP) |
| H1 | Chứa từ khoá ở dạng câu tự nhiên, không nhồi |
| Trust signals | 4,9/5 · 384 avis · licence · 48h — ngay trong hero, lặp ở trust bar và footer |
| Giá | `à partir de X €/pers` dạng text thuần trên từng circuit |
| Dữ liệu có cấu trúc | `TravelAgency`+`LocalBusiness`, `AggregateRating`, 6×`Review`, `Person`, `WebSite`, `WebPage`, `BreadcrumbList`, `ItemList`+6×`TouristTrip`+`Offer`, `FAQPage` |
| NAP | Khai một nơi trong `lib/site.ts`, dùng lại ở footer và JSON-LD → không lệch |
| E-E-A-T | Block người sáng lập có tên, tiểu sử, ngôn ngữ; khai `Person` là `employee` |
| Maillage interne | 24 link trong footer, dựng sẵn kiến trúc site |
| Kỹ thuật | hreflang `fr-FR` + `x-default`, canonical, OG/Twitter, font self-host (không gọi Google Fonts → không có request chặn render, không chuyển dữ liệu sang bên thứ ba) |

## Những gì đã làm cho GEO

GEO = tối ưu để được ChatGPT, Perplexity, AI Overviews **trích dẫn**. Khác SEO ở chỗ:
không phải xếp hạng, mà là được trích. Ba điều kiện: nội dung trích được, bot vào được,
và thực thể rõ ràng.

**Nội dung trích được.** Ba bảng dữ liệu bằng `<table>` thật (không phải `<div>` giả bảng):
so sánh agence locale vs tour-opérateur, lịch 12 tháng × 3 miền, dải ngân sách theo gamme.
Mỗi `<h2>` được theo ngay bởi một đoạn trả lời thẳng câu hỏi trong tiêu đề — đây là đoạn
mà mô hình cắt ra để trích. Mọi con số (giá, ngày, nhiệt độ, %) nằm trong text, không nằm trong ảnh.

**Bot vào được.** FAQ dùng `<details>` native nên câu trả lời có sẵn trong HTML kể cả khi
đang gập — accordion chạy bằng JS sẽ giấu mất nội dung này. Toàn trang render server-side,
không một component client nào. `robots.ts` mở cho `OAI-SearchBot`, `PerplexityBot`,
`ClaudeBot`, `Google-Extended` — lý do nằm trong comment của file.

**Thực thể rõ ràng.** Một `@graph` duy nhất với `@id` tham chiếu chéo nhau, thay vì nhiều
block JSON-LD rời. `public/llms.txt` tóm tắt doanh nghiệp, bảng giá và các dữ kiện về Việt Nam.

Một điểm đáng chú ý: **mục so sánh nêu cả nhược điểm của agence locale** (không có bảo lãnh
APST, không gồm vé máy bay). Đây là chủ đích, không phải sơ suất — một bảng so sánh có
nêu giới hạn được mô hình trích dẫn nhiều hơn hẳn một bài quảng cáo một chiều.

Lưu ý thẳng thắn: `llms.txt` là convention đang được đề xuất, chưa có công cụ tìm kiếm lớn
nào xác nhận đọc nó. Chi phí bằng 0 nên vẫn làm, nhưng đừng coi là đòn bẩy chính.

## Việc còn lại trước khi lên production

Theo thứ tự ưu tiên:

1. **Xác thực domain ở Resend** (xem mục *Form devis* bên trên). Chưa làm thì form
   chỉ gửi được về đúng email đã đăng ký Resend — khách thật vẫn bị từ chối.
2. **Thay 13 ảnh Commons bằng ảnh của agency.** Bỏ file mới vào `assets/photos/`,
   mô tả trong `content/photos.json` (alt tiếng Pháp có tên địa danh — bắt buộc,
   thiếu là **hỏng build**), rồi `npm run images`. Giữ `priority` **chỉ** trên
   role `hero`: đó là LCP. Chân dung conseillère trong `components/Art.tsx` vẫn
   là hình vẽ, cần ảnh thật của người thật.
3. **Điền mọi chỗ `[À REMPLIR]`** trong `lib/site.ts`: số licence, SĐT, địa chỉ, tên người sáng lập.
   `grep -rn "À REMPLIR" .` để soát.
4. **Thay `REVIEWS`, `RECIT` và toàn bộ `ITINERARIES` bằng nội dung thật.** Các
   lịch trình trong `lib/itineraries.ts` là demo — đúng về địa lý nhưng không phải
   chương trình của bạn. Giá ở đó chạy thẳng vào JSON-LD `Offer`. `RECIT`
   là carnet demo — cần một bài kể của khách thật, có văn bản đồng ý. Avis hiện tại là demo và đang được
   đẩy thẳng vào JSON-LD. `AggregateRating` bịa là vi phạm quy định Google → nguy cơ bị phạt thủ công.
5. **Soát lại giá** trong `CIRCUITS` cho khớp bảng giá thật. Giá hiển thị và giá trong
   `Offer` phải trùng nhau.
6. **Tạo nốt các trang trong footer.** 6 fiche voyage + trang danh sách đã có thật
   và đã nằm trong `sitemap.ts`. Còn lại ~18 link (guides, comparatifs, pages par
   envie) vẫn 404 — tạo hoặc tạm gỡ. Ưu tiên: các **trang facette** cho
   `/circuit-vietnam` (theo niveau, vùng, durée), đó là nguồn longue traîne.
7. **Viết các trang pháp lý**: mentions légales, CGV, politique de confidentialité — bắt buộc
   với khách Pháp.
8. **Thêm rate limit theo IP** cho `/api/devis`. Honeypot một mình không đủ.
9. **Đổi `SITE.url`** sang domain thật, sau đó khai Google Search Console và Google Business Profile
   với NAP **y hệt** `lib/site.ts`.

Sau khi deploy, kiểm tra bằng [Rich Results Test](https://search.google.com/test/rich-results)
và [PageSpeed Insights](https://pagespeed.web.dev/).

## Tiếp cận (accessibility)

Đã kiểm bằng máy, không phải bằng mắt: một script duyệt mọi phần tử có text hiển
thị, tìm màu nền đục gần nhất, rồi so với ngưỡng WCAG AA (3:1 cho chữ lớn, 4,5:1
cho phần còn lại). Các sub-tree `aria-hidden` được loại trừ vì chúng không nằm
trong cây accessibility.

Lần chạy đầu: **143 phần tử dưới ngưỡng** ở 1440px. Nguyên nhân là bảng màu phụ
quá nhạt so với nền sương sáng, cộng với việc các tông dành cho nền sáng bị dùng
lại trên nền chàm. Sửa ở gốc token chứ không vá từng chỗ. Hiện tại: **0 phần tử**
ở cả 1440px và 390px, trên cả `/` lẫn `/merci`.

Nếu bạn đổi màu, hãy chạy lại kiểm tra này thay vì ước lượng bằng mắt — trên nền
`--mist-2` (#F4F6F5) khoảng an toàn hẹp hơn nhiều so với trên nền trắng.

Ngoài ra: `:focus-visible` hiện rõ, skip link, `<table>` có `scope`, bảng mùa đọc
được không cần phân biệt màu (độ dài thanh + chữ), form có `<label>` thật cho mọi
trường.
