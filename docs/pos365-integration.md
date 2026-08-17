# Tích hợp POS365

> **Trạng thái: chiều kéo hội viên ĐÃ TRIỂN KHAI và chạy thật; phần khớp đơn
> buy-in vẫn là thiết kế.**
> Nhánh `feature/add_pos365_api`. Toàn bộ phần API trong tài liệu này đã gọi
> thật vào `bluffingcoffee.pos365.vn` ngày 13/08/2026 — xem "Kết quả thử
> nghiệm thực tế". Phần đơn hàng chưa chạm được vì shop trial còn trống, và
> mục 3 trong checklist quyết định trực tiếp cách viết cron nên chưa code.

## Quyết định thiết kế

Ranh giới trách nhiệm giữa hai hệ thống:

| Dữ liệu                                        | Nguồn sự thật     |
| ---------------------------------------------- | ----------------- |
| Danh tính hội viên: tạo mới, tên, số điện thoại | **POS365**        |
| BP, badge, rank, thống kê, giải đấu             | **Bluffing**      |
| Hoá đơn, thanh toán, in bill, hoá đơn điện tử   | **POS365**        |
| Doanh thu tổng (F&B + buy-in)                   | **POS365**        |

Ba hệ quả quan trọng:

**Hội viên được tạo ở POS365, Bluffing kéo về.** Thu ngân nhập khách vào máy POS
lúc bán hàng — đó là lúc duy nhất chắc chắn có mặt người thật và số điện thoại
thật. Bluffing không đẩy hội viên sang, chỉ hút về. Chiều ngược lại (tạo bên
Bluffing rồi đẩy sang) đã bị loại, xem phần "Vì sao kéo chứ không đẩy".

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

## Vì sao kéo chứ không đẩy

Đã rà toàn bộ ~400 operation trong metadata. **POS365 không đẩy dữ liệu ra ngoài
được, dưới bất kỳ hình thức nào.** Không có endpoint đăng ký webhook, không có
callback URL, không có chỗ khai báo URL của mình. Ba thứ trông giống push nhưng
không dùng được:

| Operation              | Thực chất là gì                                        |
| ---------------------- | ------------------------------------------------------ |
| `FireBaseSubscribe`    | `POST /api/firebase/subscribe`, body `{DeviceToken, DeviceType, BranchIds}`. Đây là FCM đẩy xuống **thiết bị chạy app POS365**, không phải đẩy tới server mình. Muốn hứng phải giả làm thiết bị trong FCM project của họ — không tài liệu, họ đổi là gãy. |
| `NotificationHubSentMsg` | Azure Notification Hubs, cũng là push xuống thiết bị. |
| `ServerEventsList`     | `GET /api/serverevents`, trả về các dòng Azure Table Storage (`PartitionKey`, `RowKey`, `ETag`, `JsonContent`). Là REST polling để máy POS đồng bộ trạng thái bàn/phòng. Không phải SSE, không phải subscription. |

Đổi lại, **chiều kéo thì POS365 làm rất tử tế** — có hẳn một họ endpoint đồng bộ
gia tăng mà chính app của họ dùng để chạy offline-first: `PartnerSync`,
`SinglePartnerSync`, `ProductSync`, `CategorySync`, `PriceBookSync`, `RoomSync`,
`AccountSync`, `BookingSync`, `GroupSync`.

Nên kiến trúc bắt buộc là polling, và điều đó **không mâu thuẫn** với việc để
POS365 làm nguồn sự thật về hội viên. Chỉ là độ trễ 30–60 giây, không tránh được.

## Luồng dữ liệu — hội viên lần đầu

```
   ┌──────────────────────────────────────────────────────────────┐
   │                         POS365                               │
   │                                                              │
   │  1. Người mới ra quầy                                        │
   │     Thu ngân tạo khách (tên + SĐT bắt buộc)                  │
   │     rồi bán BUYIN-* ──► IN BILL                              │
   └──────────────────────────────────────────────────────────────┘
              │                                    │
              │ 2a. cron 60s                       │ 2b. cron 60s
              │ POST /api/partners/sync            │ GET /api/orders
              ▼                                    ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                         Bluffing                             │
   │                                                              │
   │  3. users (tài khoản vỏ)  ◄── khoá ghép: pos365_partner_id   │
   │     password = null, chưa ai đăng nhập                       │
   │           │                                                  │
   │           ▼                                                  │
   │  4. khớp đơn buy-in ──► tournament_registrations             │
   │                         registered + cộng BP                 │
   │           │                                                  │
   │           ▼                                                  │
   │  5. Người chơi tải app, đăng nhập bằng SĐT ──► nhận tài khoản│
   │     đặt mật khẩu, thấy nguyên BP và lịch sử đã tích sẵn      │
   └──────────────────────────────────────────────────────────────┘
```

Thứ tự 2a trước 2b là quan trọng: kéo khách trước, kéo đơn sau. Nếu ngược lại,
đơn đầu tiên của khách mới sẽ không tìm ra user và rơi vào `unmatched` một cách
vô ích. Cùng một cron, chạy tuần tự hai bước.

Bước 5 là điểm hay của hướng này: người chơi mua buy-in xong mới tải app, và
thấy ngay BP của lần mua đó đã có sẵn. Không phải đăng ký rồi chờ.

Độ trễ giữa bước 1 và bước 4 là 30–60 giây. UI phải hiển thị trạng thái "đang
xác nhận thanh toán" để người chơi không hoang mang.

## Luồng dữ liệu — hội viên đã có

Từ lần thứ hai trở đi, **nhánh đẩy hội viên biến mất hoàn toàn**. Không gọi
`POST /api/partners` nữa. `users.pos365_partner_id` đã có giá trị nên chỉ còn
một việc: kéo đơn về và khớp.

```
   ┌──────────────────────────────────────────────────────────────┐
   │                         POS365                               │
   │  1. Thu ngân gõ SĐT ──► khách hiện ra ──► bán BUYIN-* ──► IN │
   └──────────────────────────────────────────────────────────────┘
                                          │ 2. cron 60s
                                          ▼ GET /api/orders
   ┌──────────────────────────────────────────────────────────────┐
   │                         Bluffing                             │
   │      pos365_order_imports                                    │
   │            │ 3. khớp qua PartnerId ──► registered + BP       │
   │            ▼                                                 │
   │      tournament_registrations                                │
   └──────────────────────────────────────────────────────────────┘
```

Đường thường ngày chỉ có vậy. Sáu tình huống còn lại mới là phần cần xử lý.

### A. Hồ sơ đổi

Thu ngân sửa tên hoặc số điện thoại khách trên máy POS. `PartnerSync` sẽ trả về
bản ghi đó ở lần kéo kế tiếp — không cần làm gì thêm, cứ ghi đè `name` / `phone`
bên Bluffing.

Chiều ngược lại thì **không**: người chơi sửa hồ sơ trong app không được đẩy
sang POS365, vì như vậy là hai nguồn sự thật ghi đè lẫn nhau và cái nào chạy sau
thì thắng. Hoặc khoá luôn ô tên/SĐT trong app cho gọn, hoặc cho sửa nhưng coi
đó là "biệt danh hiển thị" tách khỏi tên trên hoá đơn — chọn cái đầu thì đơn
giản hơn nhiều.

### B. Hội viên có sẵn trước ngày tích hợp

`users` hiện đang có dữ liệu do admin tạo tay, chưa có `pos365_partner_id` nào.
Đây là lần duy nhất phải chạy chiều đẩy: một job một lần, `POST /api/partners`
cho từng user cũ, ghi lại `Id` trả về. Sau lần đó xoá luôn code đẩy, đừng để
lại — code đẩy còn nằm đó là sớm muộn có người gọi nhầm.

Trước khi chạy, phải khớp trùng: hội viên cũ rất có thể đã tồn tại bên POS365
với tư cách khách quen. Kéo toàn bộ partner về trước, so theo SĐT đã chuẩn hoá,
chỉ đẩy những người thật sự chưa có.

### C. Rebuy / add-on giữa giải

Đây là khác biệt lớn nhất của hội viên đã có. Trước đây hệ thống **không mô hình
hoá được**: mỗi người một dòng `tournament_registrations` cho một giải với đúng
một `entry_price`, và `LiveTableService::rebuy()` chỉ xoá người chơi khỏi bàn
rồi ghi một sự kiện — không đồng nào được ghi nhận.

**Đã sửa.** Bảng `tournament_purchases` giờ là sổ tiền: mỗi lần người chơi bỏ
tiền ra là một dòng.

| Cột | Ghi chú |
| --- | --- |
| `tournament_registration_id` | FK cascade |
| `kind` | `entry` hoặc `rebuy` (`TournamentPurchaseKindEnum`) |
| `entry_type` | chỉ có nghĩa với `entry` |
| `price` | số tiền thật của dòng đó |
| `created_by_admin_id` | null khi người chơi tự check-in trên app |

`App\Services\TournamentPurchaseService` là cửa duy nhất: `syncEntry()` giữ đúng
một dòng `entry` cho mỗi lượt đăng ký, `recordRebuy()` cộng thêm một dòng. Ghi
tiền chạy **trước** khi xoá trạng thái người chơi, nên ghi hỏng thì cả
transaction bị huỷ, không có chuyện hồi sinh mà không có dòng tiền nào.

**Không giới hạn số lần rebuy.** Cột `tournament_templates.max_rebuy` đã bị bỏ
hẳn (migration `2026_08_13_000004`) cùng ô nhập ở màn Mẫu giải đấu: quán không
giới hạn rebuy, nên giữ lại một cấu hình luôn để trống chỉ tạo thêm chỗ để bấm
nhầm — mà bấm nhầm ở đây nghĩa là khách trả tiền xong rồi hệ thống từ chối cho
ngồi lại. `rebuy_stack` giữ nguyên, đó là số chip chứ không phải giới hạn.

`entry_price` trên `tournament_registrations` **giữ nguyên**, không chuyển thành
cột tính toán: migration chạy trước khi container mới lên nên bỏ cột mà code cũ
còn đọc là làm chết site giữa lúc deploy. Muốn tổng thì dùng
`TournamentRegistration::totalPaid()`.

Giá rebuy lấy theo `ticket_price_without_drink` của chính giải đó — quán bán
rebuy đúng bằng giá vé không nước. Khi nào hai giá tách nhau mới cần cột riêng.

Chưa có `addon`: mẫu giải đấu không có cấu hình add-on nào, thêm case enum mà
không có chỗ tạo ra nó chỉ tạo ảo giác tính năng đã tồn tại.

Còn thiếu: **con trỏ nối một dòng mua với đơn POS365 đã trả tiền cho nó**. Chỗ
đó sẽ nằm ở `pos365_order_imports` (trỏ sang `tournament_purchases`) chứ không
phải ngược lại, để bảng sổ tiền không dính gì tới POS365 — nhưng phải chốt sau
khi biết `OrderList` trả về gì.

### D. Khách bên POS365 không có số điện thoại

Đây là ca hỏng đặc trưng của hướng kéo, và nó **chặn hẳn việc tạo user**:
`users.phone` đang là `unique NOT NULL`, trong khi `Partner.Phone` bên POS365
không bắt buộc và không ràng buộc trùng. Thu ngân tạo khách chỉ với mỗi cái tên
là chuyện xảy ra hàng ngày.

Partner không có `Phone` → không tạo user, ghi vào hàng đợi `pos365_partner_imports`
với trạng thái `missing_phone`. Đơn của khách đó vẫn kéo về nhưng thành
`unmatched`. Khi nào thu ngân bổ sung SĐT thì lần `PartnerSync` sau sẽ tự tạo
user, rồi chạy lại phần khớp cho các đơn `unmatched` của partner đó.

Cách phòng duy nhất có hiệu lực là quy trình quầy: **bắt buộc nhập SĐT khi tạo
khách**. Cần hỏi POS365 xem có bật được ràng buộc này không (mục 11 trong
checklist). Nếu không bật được thì đây là nguồn việc tay thường trực.

### E. Hai partner cùng một người

Thu ngân không tìm ra khách cũ nên tạo mới — cùng một người, hai `Partner.Id`.
`users.phone` unique sẽ chặn được nếu SĐT gõ y hệt, nhưng không chặn được
`0912345678` với `+84912345678` hay `84912345678`. Vì vậy **chuẩn hoá SĐT ngay
lúc kéo về**, một hàm duy nhất, trước mọi phép so sánh.

Trùng SĐT sau khi chuẩn hoá → không tạo user mới, chỉ gắn thêm `Partner.Id` thứ
hai vào user đã có. Nghĩa là quan hệ `users` ↔ partner là **một-nhiều**, không
phải một-một, và `pos365_partner_id` phải tách thành bảng riêng
`user_pos365_partners` chứ không nằm trên `users`. Thiết kế sai chỗ này là sau
phải migrate lại.

Trùng người nhưng khác SĐT thì máy không phát hiện được. Để admin gộp tay trong
màn đối soát.

### F. Khách không gắn với ai

Đơn thuần F&B, hoặc buy-in mà thu ngân quên chọn khách. Không có `PartnerId` →
`ignored` nếu không chứa mã buy-in, `unmatched` nếu có.

Buy-in mà quên chọn khách là ca tệ nhất: không có manh mối nào ngoài giờ mua và
số tiền. Đối soát tay dựa vào giờ đơn so với giờ check-in. Cách phòng tốt hơn là
đặt mã buy-in vào một nhóm hàng riêng và nhờ POS365 bật ràng buộc bắt buộc chọn
khách cho nhóm đó — cần hỏi hỗ trợ xem có làm được không (mục 10 trong
checklist).

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
| **Kéo hội viên về**       | GET    | `/api/partners/sync`     | `PartnerSync`  |
| Kéo hội viên (cách dự phòng) | GET | `/api/partners`          | `PartnerList`  |
| Kéo một hội viên          | GET    | `/api/partners/sync/{Id}`| `SinglePartnerSync` |
| Kéo đơn hàng về           | GET    | `/api/orders`            | `OrderList`    |
| Lấy dòng hàng của một đơn | GET    | `/api/orders/detail`     | `OrderGetDetail` |
| Khai/kiểm mã buy-in       | GET/POST | `/api/products`        | `ProductList` / `ProductSave` |
| Đẩy hội viên cũ (một lần) | POST   | `/api/partners`          | `PartnerSave`  |

Tham số đáng chú ý:

- `GET /api/orders` — `Includes` (mảng, dùng `Partner` để lấy kèm khách hàng),
  `ProductCode`, `ExcludeVoid`, `IncludeSummary`, `EInvoiceStatus`, cùng bộ
  OData `Orderby` / `Select` / `Filter` / `Skip` / `Top`.
- `GET /api/orders/detail` — `OrderId`, `Includes=Product`, `IncludeSummary`.
  Trả về từng `OrderDetail` kèm `ProductId`, `Code`, `Name`, `Price`,
  `Quantity`. Spec ghi method là POST nhưng ví dụ curl lại dùng GET — thử cả hai
  lúc trial.
- `GET /api/partners/sync?LatestSync=<cursor>` — **đã gọi thật, chạy tốt, đây là
  đường chính.** Lưu ý phải là `GET`; `POST` trả 500 với mọi dạng body. Trả về:

  ```json
  { "LatestSync": "2026-08-13T07:07:02.5315247Z", "Data": [ … ] }
  ```

  `LatestSync` trong response là **con trỏ theo giờ máy chủ POS365** — lưu lại,
  lần sau truyền vào để lấy phần thay đổi tiếp theo. Vì mốc do phía họ sinh nên
  không có rủi ro lệch đồng hồ giữa hai hệ thống. Gọi lần đầu không kèm tham số
  thì trả toàn bộ. Xem "Kết quả thử nghiệm" để biết chính xác nó bắt được gì.
- `GET /api/partners?Type=1&Orderby=ModifiedDate desc&$top=50` — **không dùng
  làm đường dự phòng được.** `ModifiedDate` chỉ được điền sau lần sửa đầu tiên;
  khách vừa tạo xong có `ModifiedDate` null nên bị rơi khỏi thứ tự này — đúng
  nhóm ta cần nhất. Muốn dự phòng thì phải quét hai chiều, `Orderby=CreatedDate
  desc` cho khách mới và `ModifiedDate desc` cho khách sửa, rồi gộp lại.
- `GET /api/partners/getbycode` — `Code`, `Type`. Tra một khách theo mã.
- `DELETE /api/orders/{id}/void` — huỷ đơn. Ta không gọi, nhưng thu ngân sẽ gọi,
  xem phần "Đơn bị huỷ".

Body tạo/sửa khách hàng — chỉ dùng cho job backfill một lần ở ca B (`Type: 1` là
khách hàng; có `Id` là sửa, không có là tạo mới; để `Code` rỗng thì POS365 tự
sinh `KH-xxxxx`):

```json
{ "Partner": { "Type": 1, "Code": "", "Name": "Nguyễn Văn A", "Phone": "0912345678" } }
```

Để `Code` rỗng cho POS365 tự sinh. Bluffing không áp mã của mình lên POS365 nữa
— nguồn sự thật là bên đó, mã cũng là của bên đó.

DTO `Partner` có: `Id`, `Code`, `Name`, `Phone`, `Phone2`, `Email`, `DOB`,
`Gender`, `Address`, `Description`, `MemberJoinDate`, `Point`, `Loyalty`,
`Password`, `Type`, `ModifiedDate`. Kéo về dùng `Id`, `Name`, `Phone`,
`ModifiedDate`; các trường còn lại tuỳ nhu cầu.

**Tuyệt đối không dùng `Point` / `Loyalty` để chứa BP.** POS365 có hệ tích điểm
riêng của nó; nhồi BP vào đó là tạo nguồn sự thật thứ hai, và thu ngân sẽ sửa
được điểm ngay trên máy POS. BP chỉ sống ở Bluffing.

## Ánh xạ dữ liệu

### Hội viên: POS365 `Partner` → `users`

Khoá ghép là **`Partner.Id`** — số nguyên do POS365 sinh, bất biến, không ai gõ
tay được nên không gõ sai được. Không dùng `Partner.Code` (`KH-10341`) vì nó là
chuỗi hiển thị, và không dùng số điện thoại vì POS365 cho tối đa 2 số/khách và
không ràng buộc trùng.

Số điện thoại vẫn quan trọng, nhưng ở vai trò khác: nó là thứ **người chơi dùng
để nhận tài khoản** khi tải app, và là thứ dùng để phát hiện hai partner trùng
người. Vì vậy phải chuẩn hoá (`0912345678`, bỏ `+84`, bỏ khoảng trắng và dấu
chấm) ngay tại điểm kéo về, một hàm duy nhất.

Quan hệ là **một user ↔ nhiều partner** (xem ca E), nên ánh xạ nằm ở bảng nối
`user_pos365_partners` chứ không phải một cột trên `users`.

### Tài khoản vỏ và việc nhận tài khoản

User kéo từ POS365 về chưa có mật khẩu — chưa ai đăng nhập bao giờ. Đây là thay
đổi bắt buộc lên schema hiện tại: `users.password` đang `NOT NULL`.

Người chơi tải app, nhập số điện thoại. Nếu SĐT đó khớp một tài khoản vỏ, họ đặt
mật khẩu và nhận luôn tài khoản đó — giữ nguyên BP, badge, lịch sử giải đã tích
từ trước. Không tạo tài khoản mới, không mất dữ liệu.

Bước xác minh SĐT (OTP hoặc mã do thu ngân đọc) là **bắt buộc**: không có nó thì
bất kỳ ai đoán được SĐT của người khác đều chiếm được tài khoản kèm toàn bộ BP.
Hệ thống hiện chưa có luồng đăng ký tự phục vụ nào — `main/auth` chỉ có `login`
— nên phần này là làm mới hoàn toàn.

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

**`users`** — sửa cột có sẵn, đây là phần rủi ro nhất vì đụng vào bảng đang chạy:

| Cột        | Đang là            | Đổi thành          | Vì sao                        |
| ---------- | ------------------ | ------------------ | ----------------------------- |
| `password` | `string NOT NULL`  | `string` nullable  | tài khoản vỏ chưa ai đăng nhập |

Thêm:

| Cột            | Kiểu             | Ghi chú                                    |
| -------------- | ---------------- | ------------------------------------------ |
| `claimed_at`   | `timestamp` null | null = tài khoản vỏ, chưa ai nhận           |
| `phone_e164`   | `string` index   | SĐT đã chuẩn hoá, dùng để so trùng          |

`password` nullable kéo theo việc phải rà mọi chỗ đăng nhập: tài khoản vỏ phải
bị từ chối đăng nhập bằng mật khẩu (không phải "mật khẩu sai" mà là "tài khoản
chưa kích hoạt"), và `Auth::attempt` với `password = null` không được lọt.

**`user_pos365_partners`** — bảng nối, một user có thể ứng với nhiều partner:

| Cột                 | Kiểu                         | Ghi chú                     |
| ------------------- | ---------------------------- | --------------------------- |
| `user_id`           | FK `users` cascade, index    |                             |
| `pos365_partner_id` | `unsignedBigInteger` unique  | `Partner.Id`                |
| `pos365_code`       | `string` index               | `KH-10341`, để tra cứu tay  |
| `is_primary`        | `boolean`                    | partner chính của user      |
| `last_synced_at`    | `timestamp` null             |                             |

**`pos365_partner_imports`** — hàng đợi partner kéo về chưa tạo được user:

| Cột                 | Kiểu                         | Ghi chú                          |
| ------------------- | ---------------------------- | -------------------------------- |
| `pos365_partner_id` | `unsignedBigInteger` unique  |                                  |
| `status`            | `string` index               | `pending` / `imported` / `linked` / `missing_phone` / `ignored` |
| `payload`           | `json`                       | nguyên văn                       |
| `user_id`           | FK `users` null              | kết quả, null nếu chưa xử lý     |
| `processed_at`      | `timestamp` null             |                                  |

**`pos365_product_map`** — bảng khai báo, admin sửa được, không hardcode:

| Cột            | Kiểu                | Ghi chú                              |
| -------------- | ------------------- | ------------------------------------ |
| `product_code` | `string` unique     | `BUYIN-DRINK`                        |
| `kind`         | `string` index      | khớp `TournamentPurchaseKindEnum`: `entry` / `rebuy` |
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
    PartnerImportService.php      POS365 Partner ──► pos365_partner_imports
    PartnerLinkService.php        import ──► users (tạo vỏ / gắn partner thêm)
    OrderImportService.php        POS365 Order ──► pos365_order_imports
    OrderMatchingService.php      import ──► registration + BP
  Services/
    AccountClaimService.php       SĐT + OTP ──► nhận tài khoản vỏ
  Repositories/
    Pos365PartnerImportRepository.php
    Pos365OrderImportRepository.php
    Pos365ProductMapRepository.php
  DTOs/Pos365/
    Pos365PartnerDTO.php
    Pos365OrderDTO.php
  Enums/
    Pos365PartnerImportStatusEnum.php
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

### Kéo hội viên

Cron 60 giây, **chạy trước bước kéo đơn trong cùng một lượt**. Đường chính là
`GET /api/partners?Type=1&Orderby=ModifiedDate desc&$top=50`, đọc từng trang cho
tới khi gặp `ModifiedDate <= last_synced_at`. Đổi sang `PartnerSync` nếu trial
chứng minh nó trả bản ghi đầy đủ.

Mỗi partner ghi vào `pos365_partner_imports` rồi xử lý:

1. Không có `Phone` → `missing_phone`, dừng. Không tạo user.
2. Chuẩn hoá SĐT. Đã có `user_pos365_partners` cho `Partner.Id` này → cập nhật
   `name` / `phone` của user, xong.
3. `phone_e164` khớp một user đang có → gắn thêm partner vào user đó
   (`is_primary = false`), đánh dấu `duplicate`. Không tạo user mới.
4. Còn lại → tạo user vỏ: `password = null`, `claimed_at = null`,
   `role = member`, `bp_balance = 0`.

Bước 3 và 4 phải nằm trong transaction có khoá, vì cron có thể chạy song song
với luồng nhận tài khoản của chính người đó.

`last_synced_at` chỉ được đẩy lên **sau khi cả trang xử lý xong**. Cập nhật sớm
mà job chết giữa chừng là mất luôn những partner chưa xử lý — không có cách nào
biết để kéo lại.

### Kéo đơn

Cron 60 giây, ngay sau bước kéo hội viên. Cách lấy đơn mới, ưu tiên cách (a):

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
2. Từ `Order.PartnerId` tra `user_pos365_partners` ra `user_id`. Không tra được
   → `unmatched` (partner chưa kéo về kịp, hoặc đang kẹt ở `missing_phone`).
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

- Danh sách đơn `unmatched`, gán tay vào registration.
- Danh sách partner `missing_phone` — nhắc thu ngân bổ sung SĐT trên máy POS.
  Đây sẽ là hàng đợi bận nhất, nên đặt ngay trên dashboard chứ không giấu trong
  menu con.
- Danh sách partner `duplicate` để admin xác nhận hoặc tách ra.
- Nút chạy lại phần khớp cho một partner sau khi đã sửa dữ liệu.

Quy trình vận hành phải thống nhất một câu: **tạo khách trên máy POS, luôn có
số điện thoại.** Nếu thu ngân bỏ qua SĐT thì hệ thống không có gì để bấu víu.

## Kết quả thử nghiệm thực tế

Chạy ngày **13/08/2026** trên tài khoản dùng thử `bluffingcoffee.pos365.vn`
(chi nhánh "HNI", `RetailerId=235797`, tạo 12/08, **hết hạn 26/08/2026**).
Shop trống hoàn toàn lúc thử: 0 khách, 0 hàng hoá, 0 đơn, chỉ có sẵn 30 phòng
bàn do hệ thống seed. Mọi bản ghi test đã được xoá sạch sau khi chạy.

### Đã kiểm chứng — chạy được

| Việc | Kết quả |
| --- | --- |
| Đăng nhập `GET /api/auth/credentials` | 200, trả `SessionId`. **API mở sẵn ở gói dùng thử, không phải xin bật.** |
| `GET /api/partners/sync` | 200, trả `{LatestSync, Data}` |
| Con trỏ `LatestSync` | Thật sự tăng dần: gọi lại ngay với cùng con trỏ trả **0 dòng** |
| Sync bắt được **tạo mới** | Có — tạo 3 khách, sync trả đúng 3 |
| Sync bắt được **sửa** | Có — đổi tên rồi sync trả đúng 1 dòng |
| Sync trả bản ghi đầy đủ | Có: `Id`, `Code`, `Name`, `Phone`, `Gender`, `Debt`, `TotalDebt`, `Point`, `PartnerGroupMembers`. Trường null bị lược khỏi JSON chứ không phải thiếu. |
| Con trỏ có bền qua phiên khác | Có — đăng nhập phiên mới, đưa con trỏ cũ vào vẫn đúng. Cron không cần giữ phiên. |
| `PartnerSave` tạo khách | 200, POS365 tự sinh `Code` tuần tự `KH-0001`, `KH-0002`… |
| Xoá khách `DELETE /api/partners/{id}` | 200 `"Xóa dữ liệu thành công"` |
| Session sai | **401** — chối rõ ràng, không trả rỗng giả. Phân biệt được "không có quyền" với "không có dữ liệu". |
| Nhịp gọi | 15 lần trong 1 giây, không thấy 429. Chưa chạm trần. |
| `Orderby` với cột không tồn tại | 500 — báo lỗi đàng hoàng, không nuốt lỗi âm thầm. Tin được `Orderby`. |

### Đã kiểm chứng — kết quả xấu, phải thiết kế đỡ

**1. Số điện thoại KHÔNG bắt buộc** (mục 11 cũ — đã có câu trả lời, và là câu
xấu). Tạo khách chỉ với mỗi `Name` vẫn ra 200. Không có cách nào ép ở tầng API.
⇒ Hàng đợi `missing_phone` là **thường trực**, phải làm, và phải có quy trình
quầy bắt buộc nhập SĐT chứ code không đỡ được.

**2. POS365 cho phép trùng số điện thoại.** Tạo hai khách khác nhau cùng
`0912345678` đều thành công, ra `KH-0002` và `KH-0003`. ⇒ Bảng nối
`user_pos365_partners` một-nhiều là **bắt buộc**, không phải phòng xa.

**2b. Liên kết phải được xét lại mỗi lượt sync, không phải gắn xong là xong.**
Thu ngân tạo trùng rồi sửa lại số điện thoại cho đúng là chuyện thường. Lúc đó
bản trùng **không còn là người đó nữa** và phải tách ra. Chỉ bản ghi `is_primary`
mới được sửa hồ sơ thành viên — để bản trùng sửa được thì nó chiếm chỗ người
gốc, và người gốc biến mất khỏi danh sách thành viên.

**3. Xoá khách là mất tích im lặng** (mục 13 cũ — đã có câu trả lời). Xoá
`KH-0003` rồi sync với con trỏ ngay trước đó: **0 dòng**. Không có cờ xoá, không
có tombstone. ⇒ Bên Bluffing giữ nguyên user, chỉ mất liên kết; đơn sau của
người đó rơi vào `unmatched`. Chấp nhận, không có cách khác.

**4. `ModifiedDate` null cho tới lần sửa đầu tiên.** Khách vừa tạo không có
trường này. ⇒ Đường dự phòng OData theo `ModifiedDate` bỏ sót đúng khách mới.
`PartnerSync` giờ là đường **duy nhất** đáng tin, không còn phương án hai đơn
giản.

**5. `PartnerSave` khi sửa đòi gửi lại nguyên bản ghi.** Gửi thiếu trường thì
400 `"Vui lòng nhập đủ các thông tin bắt buộc trước khi lưu."` ⇒ Job backfill
một lần ở ca B phải đọc bản ghi hiện tại rồi gửi lại kèm sửa đổi, không gửi
patch được.

**6. Đăng nhập thi thoảng lỗi.** Có lần `GET /api/auth/credentials` không trả
`SessionId`, gọi lại 3 giây sau thì bình thường. ⇒ `Pos365Client` phải retry
đăng nhập, đừng để cron chết vì một lần trượt.

### Vấn đề an ninh phát hiện ngoài lề

`GET /api/users` trả về **mật khẩu băm SHA-1 không salt** của mọi tài khoản POS.
Băm của tài khoản thử là `356A192B...28AB`, đúng bằng `sha1("1")` — tra ngược
trong một nốt nhạc. Nghĩa là bất kỳ tài khoản nào đọc được API cũng lấy được
hash mật khẩu của toàn bộ nhân viên, kể cả chủ. ⇒ Hệ quả trực tiếp cho ta:
**mật khẩu POS365 dùng cho tích hợp phải là mật khẩu riêng, mạnh, và không được
trùng với bất kỳ mật khẩu nào khác của quán.**

### Còn nợ — cần dữ liệu thật mới thử được

Shop trống nên chưa chạm được vào phần đơn hàng, tức là phần lõi của việc khớp
buy-in: mục 3 (`Includes=OrderDetails` có nhồi được dòng hàng không), mục 4
(`ProductCode` lọc một hay nhiều mã), mục 5 (độ trễ đơn), mục 9 (đơn tạo bằng
API có ra bill giấy không — cái này bắt buộc phải có người đứng cạnh máy in).

## Đã triển khai — chiều kéo hội viên

Chạy được đầu-cuối trên nhánh `feature/add_pos365_api`.

```
config/pos365.php                                cấu hình + công tắc bật/tắt
app/Support/PhoneNumber.php                      chuẩn hoá SĐT về E.164 / nội địa
app/Support/Pos365/Pos365Client.php              phiên ss-id, retry đăng nhập, tự login lại khi 401
app/DTOs/Pos365/Pos365PartnerDTO.php             một Partner như POS365 trả về
app/Services/Pos365/PartnerImportService.php     kéo theo con trỏ ──► pos365_partner_imports
app/Services/Pos365/PartnerLinkService.php       import ──► users (tạo vỏ / gắn thêm partner)
app/Repositories/Pos365PartnerImportRepository.php
app/Repositories/Pos365SyncStateRepository.php
app/Console/Commands/SyncPos365PartnersCommand.php   `php artisan pos365:sync-partners [--full]`
app/Http/Controllers/Api/Admin/Pos365PartnerImportController.php   hàng đợi đối soát
```

Lịch chạy: `routes/console.php`, hai phút một lần, `withoutOverlapping()`.

Ba chỗ khác thiết kế ban đầu, đều do chạy thật mới lộ ra:

**Trạng thái `duplicate` đổi tên thành `linked`, và thêm `pending`.**
"Duplicate" nghe như lỗi, trong khi đây là kết cục đúng: một người có hai
`Partner.Id`. `pending` chỉ tồn tại trong lúc chạy một lô.

**`phone_e164` là cột dẫn xuất, không bao giờ gán tay.** Mutator trên
`User::phone` tự sinh nó. Để hai cột trôi khỏi nhau thì việc khớp hỏng âm thầm,
mà kiểu hỏng đó rất khó phát hiện.

**Số điện thoại lưu vào `users.phone` là bản đã chuẩn hoá về dạng nội địa.**
Thu ngân gõ `"0988 111 222"`, nếu lưu nguyên chuỗi đó thì người chơi gõ
`0988111222` sẽ không đăng nhập được — `users.phone` vừa là số điện thoại vừa
là tên đăng nhập. `AuthService` cũng đã sửa để so khớp thêm ở `phone_e164`.

### Đăng nhập với tài khoản vỏ

`AuthService` báo riêng "Tài khoản chưa được kích hoạt" thay vì "sai mật khẩu".
Nói "sai mật khẩu" ở đây vừa sai vừa bế tắc: người chơi có tài khoản thật, có BP
thật, nhưng không tồn tại mật khẩu nào để nhập cho đúng.

Đánh đổi: thông báo này để lộ việc một số điện thoại có tài khoản vỏ hay không.
Chấp nhận được vì muốn nhận tài khoản vẫn phải qua OTP gửi về đúng số đó.

`isClaimed()` xét theo việc **có mật khẩu hay không**, chứ không theo
`claimed_at` — admin tạo thành viên tay thì tài khoản dùng được ngay.
`claimed_at` chỉ ghi lại thời điểm.

### Đã kiểm thử đầu-cuối

Tạo khách thật trên POS365 rồi để cron kéo về, cả bốn nhánh đều đúng:

| Tình huống | Kết quả |
| --- | --- |
| Khách mới có SĐT | Tạo tài khoản vỏ, gắn partner `is_primary` |
| Khách trùng SĐT khác định dạng (`"0988 111 222"` vs `"0988111222"`) | Nhận ra cùng một người, gắn thêm partner không primary |
| Khách không có SĐT | Vào hàng đợi `missing_phone`, không tạo user |
| Quầy sửa tên khách | Cập nhật lan về tài khoản vỏ |
| Quầy sửa tên khách **đã nhận tài khoản** | KHÔNG ghi đè — hồ sơ là của người chơi |
| Quầy sửa tên **bản trùng** | KHÔNG ghi đè hồ sơ người gốc, vẫn giữ liên kết |
| Quầy sửa **số điện thoại của bản trùng** sang số khác | Gỡ liên kết, tách thành thành viên riêng |
| Chạy lại nhiều lượt | Con trỏ giữ đúng, không đẻ bản trùng |
| Admin bấm "bỏ qua" rồi quầy sửa lại khách đó | Vẫn `ignored` — quyết định của người thắng máy |

### Hạn chế đã biết của phần này

`GET /api/partners/sync` **không trả trường `Type`**, nên không phân biệt được
khách hàng với nhà cung cấp. Nếu quán tạo nhà cung cấp có số điện thoại trên
POS365 thì bên mình sẽ tạo nhầm một tài khoản vỏ cho họ. Chưa có cách lọc ở tầng
API; tạm thời dựa vào việc quán hiếm khi tạo nhà cung cấp, và màn đối soát cho
thấy mọi tài khoản vừa được tạo.

## Cần xác minh trên tài khoản trial

Mục 11, 12, 13 đã có câu trả lời ở phần trên. Phần còn lại vẫn để nguyên.
Điểm 1 là rủi ro lớn nhất — không đạt thì toàn bộ thiết kế này sập và phải đổi
nhà cung cấp.

1. **Gói dịch vụ nào mở API?** ✅ Gói dùng thử đã mở sẵn, không phải xin bật.
   Nhưng **vẫn phải hỏi `hotro@pos365.vn`** xem gói trả tiền rẻ nhất có giữ
   nguyên quyền đó không — trial mở rộng rồi bóp lại khi trả tiền là chuyện có
   thật ở nhiều nhà cung cấp.
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
10. POS365 có bắt buộc chọn khách hàng cho một nhóm hàng cụ thể được không (xem
    ca F). Nếu được thì số đơn `unmatched` giảm hẳn.
11. ❌ **Không bắt buộc nhập số điện thoại được** — đã thử, tạo khách chỉ có tên
    vẫn 200. Hàng đợi `missing_phone` là thường trực. Chỉ còn cách siết bằng
    quy trình quầy.
12. ✅ **`PartnerSync` đạt yêu cầu.** Là `GET` chứ không phải `POST`. Trả bản ghi
    đầy đủ (có `Phone`), bắt được cả tạo lẫn sửa, con trỏ theo giờ máy chủ và
    bền qua phiên. Xem "Kết quả thử nghiệm thực tế".
13. ❌ **Xoá là mất tích im lặng** — đã xác nhận, sync không báo gì. Chấp nhận:
    user bên Bluffing giữ nguyên, chỉ mất liên kết. BP và lịch sử vẫn là của
    người chơi, chỉ là đơn sau của họ sẽ `unmatched`.
14. `Partner.Id` có ổn định vĩnh viễn không, hay đổi khi gộp/nhập lại dữ liệu.
    **Toàn bộ thiết kế khớp dựa trên giả định này.** Hỏi thẳng hỗ trợ — chưa
    kiểm chứng được bằng API vì cần một lần gộp dữ liệu thật.
15. **Trùng số điện thoại** — đã xác nhận POS365 cho phép. Không cần hỏi nữa,
    nhưng ghi ở đây để nhớ: bảng `user_pos365_partners` là bắt buộc.
16. **Phân biệt khách hàng với nhà cung cấp trong `PartnerSync`.** Endpoint này
    không trả `Type`, nên nhà cung cấp có số điện thoại sẽ bị kéo về thành tài
    khoản vỏ. Hỏi POS365 xem có tham số lọc không; nếu không thì phải đối chiếu
    thêm bằng `GET /api/partners?Type=1`.

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

**Phụ thuộc thao tác của thu ngân — và ở hướng kéo thì phụ thuộc nặng hơn.**
Khi POS365 là nguồn sự thật về danh tính hội viên, mọi cẩu thả tại quầy đều chảy
thẳng vào cơ sở dữ liệu của Bluffing: thiếu SĐT thì không tạo được user, gõ sai
SĐT thì tạo nhầm người, tạo trùng thì đẻ tài khoản rác. Hàng đợi đối soát tay
không phải tính năng phụ, nó là phần bắt buộc của luồng.

**Đổi lại là một thứ đáng giá:** không có màn "đăng ký hội viên" nào phải làm
hai lần, và không bao giờ có chuyện khách có trên hệ thống này mà thu ngân tìm
không thấy trên máy POS. Đó là lỗi vận hành khó chịu nhất của hướng đẩy, và
hướng kéo loại bỏ nó hoàn toàn.

**Phụ thuộc `Partner.Id` bất biến.** Nếu POS365 đổi `Id` khi gộp dữ liệu (mục 14
trong checklist) thì toàn bộ liên kết đứt và phải khớp lại bằng SĐT. Đây là rủi
ro nền của hướng kéo, tương đương rủi ro `Code` bất biến của hướng đẩy.
