# Tích hợp POS365

> **Trạng thái: THIẾT KẾ — chưa triển khai.**
> Tài liệu này chốt kiến trúc trước khi mua POS365. Phần "API POS365" đã được
> kiểm chứng qua metadata công khai của họ; phần "Cần xác minh trên tài khoản
> trial" thì chưa. Không code gì trước khi chạy hết checklist ở cuối.

## Quyết định thiết kế

Ranh giới trách nhiệm giữa hai hệ thống:

| Dữ liệu                                        | Nguồn sự thật     |
| ---------------------------------------------- | ----------------- |
| Người chơi: hồ sơ, BP, badge, thống kê, giải    | **Bluffing**      |
| Hoá đơn, thanh toán, in bill, hoá đơn điện tử   | **POS365**        |
| Doanh thu tổng (F&B + buy-in)                   | **POS365**        |

Hai hệ quả quan trọng:

**Mọi khoản tiền đều đi qua POS365, kể cả buy-in.** Buy-in được khai báo trong
danh mục hàng hoá của POS365 như một sản phẩm bình thường. Thu ngân bán buy-in
y hệt bán một ly cà phê, nên bill in ra bằng đường chính thống của POS365 và
hoá đơn điện tử xuất đúng quy định.

**Không dùng `OrderSave` để tạo đơn từ Bluffing.** API tạo đơn có tồn tại
(`POST /api/orders`, có trong spec chính thức), nhưng DTO `Order` **không có bất
kỳ trường nào liên quan tới in** — không `Print`, không `IsPrint`, không
`PrintTemplate`. Nghĩa là lệnh in bill do app tại quầy phát ra máy in nhiệt, chứ
không phải server sinh khi nhận đơn qua API. Tạo đơn qua API gần như chắc chắn
là đơn *câm*: có trong doanh thu, không có bill giấy. Đổi lại, toàn bộ tiền phải
thu tại quầy — nếu sau này muốn cho thanh toán trong app thì phải thiết kế lại
phần này.

## Luồng dữ liệu

```
   ┌──────────────────────────────────────────────────────────────┐
   │                         Bluffing                             │
   │                                                              │
   │  1. Đăng ký hội viên ──► users                               │
   │           │                                                  │
   │           │ POST /api/partners        (đồng bộ, lúc tạo user)│
   │           ▼                                                  │
   │  2. Đăng ký giải  ──► tournament_registrations               │
   │                       status = pending_payment               │
   │                                                              │
   │            ▲                                                 │
   │            │ 5. khớp đơn ──► status = registered, cộng BP    │
   │            │                                                 │
   │      pos365_order_imports ◄── 4. cron 60s                    │
   │                                  GET /api/orders             │
   └──────────────────────────────────────────────────────────────┘
                                          ▲
                                          │
   ┌──────────────────────────────────────┴───────────────────────┐
   │                         POS365                               │
   │                                                              │
   │  3. Người chơi ra quầy trả tiền                              │
   │     Thu ngân chọn khách ──► bán BUYIN-* ──► IN BILL          │
   │     (F&B đi chung một đơn cũng được)                         │
   └──────────────────────────────────────────────────────────────┘
```

Độ trễ giữa bước 3 và bước 5 là 30–60 giây. UI phải hiển thị trạng thái "đang
xác nhận thanh toán" để người chơi không hoang mang.

## API POS365 — phần đã kiểm chứng

Nguồn: **API Specification v1.0 (14/06/2021)** — bản chính thức lưu tại
`docs/POS365_APISpecification.docx` — đối chiếu với metadata công khai tại
<https://api.pos365.vn/api/metadata> (ServiceStack, ~400 operations). Mọi
endpoint dưới đây có mặt trong cả hai nguồn.

**Base URL theo từng cửa hàng**, không gọi thẳng `api.pos365.vn`:
`https://<ten-cua-hang>.pos365.vn`

**Xác thực.** Không có API key cố định, không có OAuth. Đăng nhập lấy
`SessionId` rồi gửi kèm dạng cookie `ss-id`:

```bash
curl 'https://<shop>.pos365.vn/api/auth/credentials?Username=admin&Password=xxx&format=json'
# → { "UserId": "...", "SessionId": "hRGLaEhg3mLEozorezm8", ... }

curl 'https://<shop>.pos365.vn/api/partners?format=json&Type=1&$top=20' \
  --header 'Cookie: ss-id=hRGLaEhg3mLEozorezm8'
```

`SessionId` không vĩnh viễn. Gặp 401 thì login lại — client phải tự xử lý
vòng này, xem phần "Client".

**Phân trang.** `$top` / `$skip`, response trả kèm `__count` là tổng số dòng và
`results` là mảng dữ liệu.

**Endpoint cần dùng:**

| Mục đích                  | Method | Route                    | Operation      |
| ------------------------- | ------ | ------------------------ | -------------- |
| Lấy session               | GET    | `/api/auth/credentials`  | —              |
| Đẩy hội viên sang POS     | POST   | `/api/partners`          | `PartnerSave`  |
| Kéo đơn hàng về           | GET    | `/api/orders`            | `OrderList`    |
| Lấy dòng hàng của một đơn | GET    | `/api/orders/detail`     | `OrderGetDetail` |
| Đối soát hội viên định kỳ | POST   | `/api/partners/sync`     | `PartnerSync`  |
| Khai/kiểm mã buy-in       | GET/POST | `/api/products`        | `ProductList` / `ProductSave` |

Tham số đáng chú ý:

- `GET /api/orders` — `Includes` (mảng, dùng `Partner` để lấy kèm khách hàng),
  `ProductCode`, `ExcludeVoid`, `IncludeSummary`, `EInvoiceStatus`, cùng bộ
  OData `Orderby` / `Select` / `Filter` / `Skip` / `Top`.
- `GET /api/orders/detail` — `OrderId`, `Includes=Product`, `IncludeSummary`.
  Trả về từng `OrderDetail` kèm `ProductId`, `Code`, `Name`, `Price`,
  `Quantity`. Spec ghi method là POST nhưng ví dụ curl lại dùng GET — thử cả hai
  lúc trial.
- `POST /api/partners/sync` — body `{"LatestSync":"2026-08-12T00:00:00Z"}`,
  trả về các partner thay đổi kể từ mốc đó.
- `GET /api/partners/getbycode` — `Code`, `Type`. Tra một khách theo mã, không
  phải quét cả danh sách.
- `DELETE /api/orders/{id}/void` — huỷ đơn. Ta không gọi, nhưng thu ngân sẽ gọi,
  xem phần "Đơn bị huỷ".

Body tạo/sửa khách hàng (`Type: 1` là khách hàng; có `Id` là sửa, không có là
tạo mới; để `Code` rỗng thì POS365 tự sinh `KH-xxxxx`):

```json
{ "Partner": { "Type": 1, "Code": "BC-000042", "Name": "Nguyễn Văn A", "Phone": "0912345678" } }
```

DTO `Partner` còn có `Email`, `DOB`, `Address`, `Description`, `MemberJoinDate`,
`Point`, `Loyalty`, `Password`. **Tuyệt đối không dùng `Point` / `Loyalty` để
chứa BP.** POS365 có hệ tích điểm riêng của nó; nhồi BP vào đó là tạo nguồn sự
thật thứ hai, và thu ngân sẽ sửa được điểm ngay trên máy POS. BP chỉ sống ở
Bluffing. Trường duy nhất nên đẩy thêm là `Description` = `"Hội viên Bluffing
#42"` để thu ngân nhìn là biết.

**Không có webhook.** Đã rà toàn bộ ~400 operations, không có endpoint nào cho
đăng ký callback URL. Có `FireBaseSubscribe` và `ServerEventsList` nhưng đó là
cơ chế nội bộ của app POS365, không tài liệu, không được phụ thuộc vào. Vì vậy
đồng bộ bắt buộc là **pull (polling)**.

## Ánh xạ dữ liệu

### Hội viên: `users` ↔ POS365 `Partner`

Khoá ghép là **`Partner.Code`**, do Bluffing sinh ra, không để POS365 tự sinh.
Format: `BC-` + id người dùng đệm 0 cho đủ 6 chữ số (`BC-000042`). Mã ổn định,
tra ngược bằng `getbycode` rất rẻ.

Số điện thoại chỉ là dữ liệu phụ để thu ngân tìm khách, **không** dùng làm khoá
ghép. POS365 cho tối đa 2 số/khách và không ràng buộc trùng. Dù vậy vẫn phải
chuẩn hoá format (`0912345678`, bỏ `+84`) ở một chỗ duy nhất phía Bluffing
trước khi đẩy, nếu không lúc đối soát sẽ lệch.

Chỉ đẩy sang POS365 đúng ba trường: `Code`, `Name`, `Phone`. Không đẩy BP,
badge, rank hay thống kê — POS365 không có khái niệm gì về những thứ đó.

### Buy-in: sản phẩm POS365 ↔ `tournament_registrations`

Danh mục hàng hoá cần khai trong POS365. Giá để 0 và cho thu ngân sửa lúc bán,
vì mỗi giải một giá khác nhau:

```
BUYIN-DRINK     Buy-in (kèm nước)
BUYIN-NODRINK   Buy-in (không nước)
REBUY           Rebuy
ADDON           Add-on
```

Khai bằng tay trên giao diện POS365 là đủ (bốn dòng, khai một lần). Nhưng
`POST /api/products` có tồn tại nên đáng dùng `GET /api/products` trong health
check: nếu một mã trong `pos365_product_map` không còn trong danh mục POS365
(ai đó xoá nhầm), cảnh báo ngay thay vì để đơn rơi vào `unmatched` hàng loạt.

Mã sản phẩm chỉ nói được **loại vé**, không nói được **giải nào**. Giải được
suy ra từ phía Bluffing: tìm registration của user đó đang ở trạng thái
`pending_payment`, thuộc giải chưa kết thúc, gần thời điểm hiện tại nhất.

Trong thực tế một người hiếm khi có 2 registration chờ thanh toán cùng lúc,
nên cách này khớp đúng gần như mọi trường hợp. Các trường hợp còn lại (0 hoặc
>1 ứng viên) rơi vào hàng đợi đối soát tay, không đoán mò.

`BUYIN-DRINK` / `BUYIN-NODRINK` ánh xạ sang `tournament_registrations.entry_type`
đã có sẵn, và giá đối chiếu với `tournaments.ticket_price_with_drink` /
`ticket_price_without_drink`. Lệch giá thì vẫn khớp nhưng gắn cờ cảnh báo cho
admin — thu ngân giảm giá tay là chuyện bình thường, không nên chặn.

## Thay đổi schema

Theo `.claude/rules/database-rules.md`: snake_case, đủ `id` / `created_at` /
`updated_at`, có foreign key, có index cho FK và cột lọc thường xuyên.

**`users`** — thêm:

| Cột                 | Kiểu                        | Ghi chú                    |
| ------------------- | --------------------------- | -------------------------- |
| `pos365_partner_id` | `unsignedBigInteger` null   | `Id` bên POS365, unique    |
| `pos365_code`       | `string` null               | `BC-000042`, unique        |
| `pos365_synced_at`  | `timestamp` null            | null = chưa đẩy / đẩy lỗi  |

**`pos365_product_map`** — bảng khai báo, admin sửa được, không hardcode:

| Cột            | Kiểu                | Ghi chú                              |
| -------------- | ------------------- | ------------------------------------ |
| `product_code` | `string` unique     | `BUYIN-DRINK`                        |
| `kind`         | `string` index      | enum: `buyin` / `rebuy` / `addon`    |
| `entry_type`   | `string` null       | khớp `registrations.entry_type`      |
| `is_active`    | `boolean`           |                                      |

**`pos365_order_imports`** — nhật ký đơn kéo về, đảm bảo idempotent:

| Cột                | Kiểu                          | Ghi chú                     |
| ------------------ | ----------------------------- | --------------------------- |
| `pos365_order_id`  | `unsignedBigInteger` unique   | chống xử lý trùng           |
| `pos365_order_code`| `string`                      | `HC190522-0008`             |
| `pos365_partner_id`| `unsignedBigInteger` null     |                             |
| `user_id`          | FK `users` null, index        | null nếu không khớp được    |
| `registration_id`  | FK `tournament_registrations` null | kết quả khớp           |
| `purchase_date`    | `timestamp` index             |                             |
| `total`            | `unsignedInteger`             | VND                         |
| `status`           | `string` index                | xem enum bên dưới           |
| `payload`          | `json`                        | nguyên văn, để truy vết     |
| `processed_at`     | `timestamp` null              |                             |

`status`: `pending` → `matched` | `unmatched` | `ignored` (đơn thuần F&B, không
chứa sản phẩm buy-in nào) | `voided` (đơn đã khớp nhưng sau đó bị huỷ ở POS365).

**`pos365_sync_states`** — con trỏ đồng bộ, mỗi luồng một dòng:

| Cột              | Kiểu             | Ghi chú                          |
| ---------------- | ---------------- | -------------------------------- |
| `key`            | `string` unique  | `orders` / `partners`            |
| `last_synced_at` | `timestamp` null | mốc cho `LatestSync`             |
| `last_cursor`    | `string` null    | `Id` đơn lớn nhất đã xử lý       |

**`TournamentRegistrationStatusEnum`** — thêm case `PendingPayment =
'pending_payment'`. `registered` giữ nguyên nghĩa "đã thanh toán, có ghế".

## Cấu trúc module backend

Theo `.claude/rules/backend-rules.md`: Controller → Service → Repository,
controller mỏng, service một trách nhiệm, repository không chứa business logic.

```
app/
  Support/Pos365/
    Pos365Client.php              HTTP thuần: login, giữ session, retry 401,
                                  phân trang. Không biết gì về nghiệp vụ.
  Services/Pos365/
    PartnerPushService.php        users ──► POS365 Partner
    OrderImportService.php        POS365 Order ──► pos365_order_imports
    OrderMatchingService.php      import ──► registration + BP
  Repositories/
    Pos365OrderImportRepository.php
    Pos365ProductMapRepository.php
  DTOs/Pos365/
    Pos365PartnerDTO.php
    Pos365OrderDTO.php
  Enums/
    Pos365OrderImportStatusEnum.php
    Pos365ProductKindEnum.php
  Http/Controllers/Admin/
    Pos365SyncController.php      trạng thái sync, đơn chưa khớp, khớp tay
```

`Pos365Client` nằm ở `Support/` chứ không phải `Services/` vì nó là hạ tầng kỹ
thuật, không phải nghiệp vụ. Nó chịu trách nhiệm: cache `SessionId` vào Redis,
tự login lại khi gặp 401 (tối đa 1 lần/request để tránh vòng lặp), và gom phân
trang `$top`/`$skip` thành iterator.

Cấu hình vào `config/services.php`, giá trị từ `.env`:

```php
'pos365' => [
    'base_url' => env('POS365_BASE_URL'),      // https://<shop>.pos365.vn
    'username' => env('POS365_USERNAME'),
    'password' => env('POS365_PASSWORD'),
    'enabled'  => env('POS365_ENABLED', false),
],
```

`enabled = false` thì mọi lời gọi thành no-op. Local dev và CI không được đụng
vào POS365 thật.

### Đẩy hội viên

Gọi khi tạo user và khi đổi tên/số điện thoại. **Không chặn luồng đăng ký** nếu
POS365 lỗi — đẩy qua queue job, thất bại thì retry, `pos365_synced_at` vẫn null
và admin thấy được trên dashboard. Người chơi không nên đăng ký hỏng chỉ vì
POS365 sập.

### Kéo đơn

Cron 60 giây. Cách lấy đơn mới, ưu tiên cách (a):

- **(a) Theo `Id` giảm dần.** `Orderby=Id desc`, đọc từng trang cho tới khi gặp
  `Id <= last_cursor` thì dừng. Không phụ thuộc ngữ nghĩa `Filter` của OData,
  không sợ lệch múi giờ.
- **(b) Theo `Filter` trên `PurchaseDate`.** Gọn hơn nhưng cú pháp OData của
  POS365 chưa được xác minh. Chỉ dùng nếu trial chứng minh nó chạy đúng.

Ghi thẳng vào `pos365_order_imports` với `status = pending`. Unique index trên
`pos365_order_id` khiến chạy trùng cũng vô hại.

### Khớp đơn

Chạy ngay sau bước kéo, trên các bản ghi `pending`:

1. Đọc `OrderDetails`, đối chiếu mã sản phẩm với `pos365_product_map`. Không có
   dòng buy-in nào → `ignored`.
2. Từ `Partner.Code` tra ra `user_id`. Không tra được → `unmatched`.
3. Tìm registration `pending_payment` của user đó ở giải chưa kết thúc, gần
   nhất. Không có hoặc có nhiều hơn một → `unmatched`.
4. Trong transaction, `lockForUpdate()` dòng registration, chuyển sang
   `registered`, ghi `entry_price` thực tế từ đơn, cộng BP qua `BpService`,
   đánh dấu import `matched`.

Bước 4 phải nằm trong transaction và có khoá dòng — rule của dự án yêu cầu vậy
cho mọi thao tác đụng tới trạng thái giải đấu, và ở đây cron có thể chạy song
song với thao tác tay của admin.

### Đơn bị huỷ

Thu ngân bấm nhầm rồi huỷ đơn là chuyện sẽ xảy ra. `DELETE /api/orders/{id}/void`
không xoá đơn mà đánh dấu void, và `GET /api/orders?ExcludeVoid=true` sẽ không
trả về nữa. Hệ quả: **không được dùng `ExcludeVoid=true` khi kéo đơn.** Phải kéo
cả đơn void, nếu không một đơn đã `matched` rồi bị huỷ sẽ biến mất lặng lẽ và
người chơi giữ nguyên ghế lẫn BP.

Cron phải quét lại các import `matched` trong ~24 giờ gần nhất, so với trạng thái
hiện tại bên POS365. Đơn đã void mà import đang `matched` → chuyển import sang
`voided`, trả registration về `pending_payment`, thu hồi BP đã cộng, và đẩy vào
hàng đợi đối soát tay. Không tự động đuổi người ra khỏi giải — chỉ gắn cờ cho
admin, vì rất có thể thu ngân huỷ đơn để bán lại ngay sau đó.

Đây là lý do `pos365_order_imports.payload` lưu nguyên văn: cần biết đơn lúc
khớp trông như thế nào để so với lúc bị huỷ.

### Đối soát

Màn hình admin cần có:

- Danh sách import `unmatched`, cho phép gán tay vào registration.
- Danh sách user `pos365_synced_at IS NULL`, nút đẩy lại.
- Job hằng ngày gọi `POST /api/partners/sync` để phát hiện khách được tạo thẳng
  trên máy POS (mã không theo format `BC-`) và cảnh báo.

Case cuối sẽ xảy ra thường xuyên, nên quy trình vận hành phải thống nhất:
**luôn tạo hội viên trên Bluffing trước, không tạo thẳng trên máy POS.**

## Cần xác minh trên tài khoản trial

Chạy hết trước khi trả tiền. Điểm 1 là rủi ro lớn nhất — không đạt thì toàn bộ
thiết kế này sập và phải đổi nhà cung cấp.

1. **Gói dịch vụ nào mở API?** Nhiều nhà cung cấp trong nước khoá API ở gói cao
   hoặc phải yêu cầu bật thủ công. Hỏi thẳng `hotro@pos365.vn`.
2. Tài khoản tích hợp có bắt buộc là admin không, hay tạo được user quyền hẹp
   chỉ có `Partner_Read` / `Partner_Save` / `Order_Read`. Đừng để mật khẩu admin
   nằm trong `.env` nếu tránh được.
3. `Includes=OrderDetails,Partner` có nhồi được dòng hàng vào `OrderList`
   không. Ví dụ trong spec chính thức trả `"OrderDetails": []` — **rỗng** — nên
   nhiều khả năng phải gọi `/api/orders/detail` cho từng đơn. **Quyết định trực
   tiếp cách viết cron:** nếu đúng vậy thì lọc trước bằng
   `ProductCode=BUYIN-DRINK` (v.v.) để chỉ gọi detail cho đơn có buy-in, thay vì
   gọi cho mọi hoá đơn cà phê trong ngày.
4. `ProductCode` trong `OrderList` lọc theo *một* mã hay nhận nhiều mã. Nếu chỉ
   một thì cron chạy 4 vòng, mỗi vòng một mã buy-in.
5. Đơn vừa thanh toán bao lâu thì xuất hiện trong `GET /api/orders`.
6. Rate limit — POS365 không công bố ở bất kỳ đâu.
7. Cú pháp OData `Filter` có hoạt động không (quyết định chọn cách (a) hay (b)).
8. `SessionId` sống được bao lâu, và login đồng thời nhiều phiên có đá nhau
   không (có operation tên `UserKick` trong metadata — đáng nghi).
9. Đơn tạo bằng `POST /api/orders` có ra bill giấy không. DTO không có trường
   in nên gần như chắc là không, nhưng thử một lần cho dứt điểm: nếu bất ngờ
   *có*, thiết kế đảo lại được — Bluffing đẩy đơn buy-in sang, quầy chỉ thu tiền
   — và toàn bộ phần khớp đơn ở trên biến mất.

## Rủi ro đã biết

**Tài liệu chính thức là bản v1.0 ngày 14/06/2021**, và cho tới nay chưa có bản
v2. Metadata thì live và đầy đủ hơn tài liệu rất nhiều (tài liệu mô tả 11
endpoint, metadata có ~400 operation) nên API rõ ràng vẫn được duy trì, nhưng
mọi thứ trong tài liệu đều phải test lại chứ không tin sẵn.

**Không có webhook nên độ trễ là cố hữu**, không tối ưu xuống dưới ~30 giây
được nếu không tăng tần suất poll một cách vô lý.

**Thu tiền tại quầy là giả định nền.** Nếu sau này muốn thanh toán trong app,
phần "khớp đơn" phải thiết kế lại hoàn toàn và phải giải quyết được bài toán in
bill từ đơn tạo qua API — thứ mà thiết kế hiện tại cố tình né.

**Phụ thuộc thao tác của thu ngân.** Chọn nhầm khách hoặc bán nhầm mã sản phẩm
đều dẫn tới `unmatched`. Hàng đợi đối soát tay không phải tính năng phụ, nó là
phần bắt buộc của luồng.
