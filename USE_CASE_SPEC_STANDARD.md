# Use Case Specification Standard — EcoTrade (WDP301, nhóm G2)

**Mục đích:** thống nhất cách 5 thành viên viết tài liệu đặc tả use case, để khi ghép 5 file lại thành báo cáo cuối thì mã số không trùng, thuật ngữ không lệch, và định dạng bảng giống hệt nhau.

**Áp dụng cho:** mọi file `USE_CASE_SPEC_<Tên>.md`.

**Nguồn chân lý:**
- Danh sách use case → `USE_CASE_TABLE.md`
- Quy tắc viết → file này
- Nội dung nghiệp vụ → code trong `backend/src/`

---

## 1. Quy ước đặt mã

### 1.1. Mã use case (`UC-xx`)

Mã UC **khóa bởi `USE_CASE_TABLE.md`**. Không ai được tự đặt mã UC mới trong file spec của mình.

Muốn thêm một use case:
1. Thêm dòng vào `USE_CASE_TABLE.md` trước, lấy mã kế tiếp.
2. Cập nhật lại bảng Feature Summary và Actor Summary ở cuối file đó.
3. Rồi mới viết bảng đặc tả chi tiết trong file spec cá nhân.

Hiện tại bảng đang có **UC-01 → UC-94**. Use case mới bắt đầu từ UC-95.

### 1.2. Mã business rule (`BR-xx`)

Mỗi người được cấp một dải số riêng, không đụng nhau:

| Người | Phạm vi feature | Dải BR |
|---|---|---|
| Long (Người 1) | Authentication, Profile, Reputation, Pro Subscription, Featured Products | `BR-01` → `BR-99` |
| Sơn (Người 2) | Category, Product Discovery, Post Management, Post Approval | `BR-100` → `BR-199` |
| Duy Anh (Người 3) | Shopping Cart, Order, Delivery, Delivery Inspection, Shipper Report | `BR-200` → `BR-299` |
| Người 4 | Rental Management, Rental Inspection, Rental Return, Deposit & Compensation | `BR-300` → `BR-399` |
| Khánh (Người 5) | Review, Report & Reputation, Chat, Support Chat, Notification, User Management, Admin Dashboard | `BR-400` → `BR-499` |
| — | **BR toàn cục dùng chung** (xem mục 4.4) | `BR-900` → `BR-999` |

**Quy tắc:**
- Đánh số tăng dần trong dải của mình, theo thứ tự use case xuất hiện trong file.
- Một mã BR đã cấp thì **không tái sử dụng**, kể cả khi rule đó bị xóa. Số bị bỏ trống là chuyện bình thường.
- BR chỉ liên quan tới một use case → viết trong bảng Business Rules của use case đó.
- BR liên quan nhiều module của nhiều người → đề xuất đưa vào dải 900 (mục 4.4), thống nhất trong nhóm rồi mới thêm.

### 1.3. Đánh số mục trong file spec

Mục đánh theo thứ tự trong file, không theo mã UC:

```
## 3.1. Register          ← UC-01
## 3.2. Verify Email OTP  ← UC-02
...
## 3.21. View Featured Setup Reminder  ← UC-84
```

Tiêu đề bảng đi kèm: `**Table III.<n>: Shows the <Tên use case> feature description**`, trong đó `<n>` khớp với số mục.

---

## 2. Template bảng use case

Copy nguyên khối dưới đây cho mỗi use case:

```markdown
## 3.<n>. <Tên use case>

**Table III.<n>: Shows the <Tên use case> feature description**

| USE CASE-<n> | |
|---|---|
| **Use-case No.** | UC-<xx> |
| **Use-case Version** | 1.0 |
| **Use-case Name** | <Tên use case> |
| **Author** | <TênBạn> |
| **Date** | <dd/mm/yyyy> |
| **Priority** | <High / Medium / Low> |
| **Actor** | <Guest / User / Shipper / Admin / System> |
| **Summary** | <Actor làm gì, một câu> |
| **Goal** | <Actor đạt được điều gì> |
| **Triggers** | <Hành động cụ thể khởi động use case> |
| **Preconditions** | <Điều kiện phải đúng trước khi bắt đầu> |
| **Post Conditions** | <Trạng thái hệ thống sau khi thành công> |
```

Đúng **11 trường, đúng thứ tự trên**, không thêm không bớt. Ý nghĩa từng trường:

| Trường | Viết gì | Lỗi thường gặp |
|---|---|---|
| **Use-case No.** | Mã lấy từ `USE_CASE_TABLE.md` | Tự chế mã mới |
| **Use-case Version** | `1.0` cho bản đầu; tăng `1.1` khi sửa nội dung nghiệp vụ | Quên tăng khi sửa |
| **Use-case Name** | Giống hệt cột "Use Case" trong bảng tổng | Đặt tên khác bảng tổng |
| **Author** | Tên viết tắt của người viết | Bỏ trống |
| **Date** | Ngày viết/sửa gần nhất, `dd/mm/yyyy` | Để ngày cũ sau khi sửa |
| **Priority** | Xem mục 4.3 | Đánh High cho tất cả |
| **Actor** | Xem mục 4.2 | Ghi "Người dùng" thay vì "User" |
| **Summary** | Một câu, **actor làm gì** | Viết dài thành đoạn văn |
| **Goal** | **Actor được lợi gì** sau khi xong | Chép lại y hệt Summary |
| **Triggers** | Hành động cụ thể, có thể chỉ ra được trên UI | Viết chung chung "Khi user cần đăng nhập" |
| **Preconditions** | Điều kiện phải đúng **trước** khi bắt đầu | Nhồi cả bước validate vào đây |
| **Post Conditions** | Trạng thái hệ thống **sau** khi thành công | Mô tả cả trường hợp thất bại |

**Summary vs Goal khác nhau chỗ nào:**

> Summary: *A guest creates a new account on the system by submitting personal information.* → hành động
> Goal: *Allow a guest to own an account and become a User of the system.* → kết quả actor nhận được

**Triggers phải cụ thể:**

> Đúng: *Guest clicks the "Đăng ký" button on the navigation bar.*
> Sai: *Guest wants to create an account.*

---

## 3. Cách viết 4 bảng con

Sau bảng use case, mỗi use case có 4 bảng theo đúng thứ tự: Main Success Scenario → Alternative Scenario → Exceptions → Business Rules.

### 3.1. Main Success Scenario

```markdown
**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | User selects a plan on the Pro plans page | Highlight the selected plan and its price |
| 2 | User clicks "Thanh toán" | Validate that the plan exists in the configuration |
| 3 | | Generate a unique transaction reference and create a subscription record with status `pending` |
```

- Chỉ mô tả **luồng thành công**. Mọi rẽ nhánh xuống bảng Alternative, mọi lỗi xuống bảng Exceptions.
- Bước do hệ thống tự làm → **để trống cột Actor Event**, chỉ điền cột System response (xem step 3 ở trên).
- Mỗi step **một hành động**. Không gộp "user bấm nút và hệ thống validate rồi lưu DB" vào một dòng.
- Tên nút bấm giữ nguyên tiếng Việt như trên UI, đặt trong dấu ngoặc kép: `clicks "Thanh toán"`.
- Giá trị enum, tên trạng thái, tên field đặt trong backtick: `pending`, `verificationStatus`.
- Số bước hợp lý: 4–8. Dưới 3 là mô tả thiếu, trên 10 là nên tách use case.

### 3.2. Alternative Scenario

```markdown
**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 6a | The system processes the payment result returned by VNPay | UC-80 View Payment Result |
| 6b | User cancels on the VNPay page; the subscription record stays `pending` | UC-78 View Pro Plans |
```

- Cột Step đánh `<số bước rẽ nhánh><chữ cái>`: `3a`, `3b`, `6a`. Số phải khớp step trong Main Scenario.
- Cột "Use case" ghi `UC-xx <Tên use case>` — có cả mã lẫn tên để người đọc không phải tra bảng.
- Nếu nhánh không dẫn sang use case nào → để trống cột đó, đừng ghi "N/A".
- Đây là nơi ghi **luồng thay thế hợp lệ**, không phải lỗi. Lỗi thuộc bảng Exceptions.

### 3.3. Exceptions

```markdown
**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 400 | Email đã được sử dụng | Email already exists in the database |
| 401 | Không có quyền truy cập | The request has no valid token |
| 500 | Lỗi máy chủ | Unexpected server or database error |
```

- **Cột Message phải chép nguyên văn từ controller**, kể cả dấu câu và dấu tiếng Việt. Copy-paste, đừng gõ lại — gõ lại là lúc dấu bị thêm/bớt so với code. Đây là điểm dễ mất điểm nhất vì người chấm đối chiếu trực tiếp với code.
- Message trong code phải đạt chuẩn ở **mục 4.6** trước. Nếu message hiện tại chưa đạt chuẩn thì **sửa controller trước, chép vào spec sau** — không bao giờ sửa mỗi spec cho đẹp.
- Message có biến → dùng `{n}`, `{limit}`: `Vui lòng đợi {n}s trước khi gửi lại OTP`.
- Cột "Caught" mô tả **điều kiện nào làm lỗi xảy ra**, viết tiếng Anh, tham chiếu tên field trong backtick: `` `accountStatus` is `banned` ``.
- Sắp xếp theo mã tăng dần: 400 → 401 → 403 → 404 → 429 → 500.
- Mọi use case cần đăng nhập đều phải có dòng `401`. Mọi use case đều phải có dòng `500`.

### 3.4. Business Rules

```markdown
**Business Rules**

| Code | Rule |
|---|---|
| BR-01 | Email is normalized (trimmed and lower-cased) before being stored and compared. |
| BR-02 | Email must be unique across the whole system. |
```

- Mã BR lấy trong dải của mình (mục 1.2).
- Viết ở **thể khẳng định**, mô tả ràng buộc luôn đúng — không viết dạng câu điều kiện của một bước cụ thể.

> Đúng: *A user must be at least 13 years old to register.*
> Sai: *If the user is under 13, show an error.* ← cái này thuộc bảng Exceptions.

- Một rule một dòng. Rule có nhiều vế thì tách thành nhiều BR.
- Rule phải **trích được từ code**, không bịa. Ghi rõ hằng số nếu có: `FREE_POST_LIMIT` = 5.
- BR dùng chung toàn hệ thống → **không chép lại**, chỉ tham chiếu mã trong dải 900 (mục 4.4).

---

## 4. Catalog dùng chung

### 4.1. HTTP exception code

| Code | Dùng khi | Message mẫu đang dùng trong hệ thống |
|---|---|---|
| `400` | Dữ liệu client gửi lên sai/thiếu/không hợp lệ | `Vui lòng điền đầy đủ thông tin`, `Email đã được sử dụng`, `Gói Pro không hợp lệ` |
| `401` | Chưa đăng nhập, token sai, token hết hạn, sai mật khẩu | `Không có quyền truy cập`, `Email hoặc mật khẩu không đúng`, `Phiên đăng nhập đã hết hạn` |
| `403` | Đã đăng nhập nhưng **không đủ quyền** hoặc tài khoản bị chặn | `Tài khoản đã bị khóa do vi phạm` |
| `404` | Tài nguyên không tồn tại | `Không tìm thấy người dùng`, `Không tìm thấy tài khoản`, `Email không tồn tại trong hệ thống` |
| `429` | Vượt rate limit / cooldown | `Vui lòng đợi {n}s trước khi gửi lại OTP` |
| `500` | Lỗi server, lỗi DB, lỗi service ngoài ngoài dự kiến | `Lỗi máy chủ` |

**Quy tắc chọn code — 3 nhầm lẫn hay gặp:**

- Thiếu token → `401`, **không phải** `400`. Input không sai, chỉ là chưa xác thực.
- Đăng nhập rồi nhưng sai role (user gọi API admin) → `403`, **không phải** `401`.
- Sai mật khẩu → `401`, **không phải** `403`. Chưa xác thực được thì chưa nói tới chuyện quyền.

Không tự thêm mã ngoài 6 mã trên. Cần mã mới thì thống nhất nhóm và bổ sung vào bảng này.

**Lưu ý về message trùng ngữ nghĩa:** hiện code đang dùng 3 message khác nhau cho cùng một tình huống "không tìm thấy tài khoản" (`Không tìm thấy người dùng` / `Không tìm thấy tài khoản` / `Email không tồn tại trong hệ thống`). Spec **chép đúng theo code**, không tự ý sửa cho đồng nhất — nếu muốn gom về một message thì sửa controller trước, rồi cập nhật spec sau.

### 4.2. Actor

| Actor | Định nghĩa |
|---|---|
| `Guest` | Khách chưa đăng nhập. Chỉ xem công khai và thực hiện luồng đăng ký/đăng nhập. |
| `User` | Tài khoản đã đăng nhập, role `user`. Đóng vai buyer, seller, renter hoặc owner tùy ngữ cảnh. |
| `Shipper` | Tài khoản role `shipper`. Nhận đơn giao, kiểm định, cập nhật trạng thái giao hàng. |
| `Admin` | Tài khoản role `admin`. Duyệt bài, xử lý báo cáo, quản lý user, xem thống kê. |
| `System` | Hành động tự động, không do người dùng bấm. Ví dụ: sinh hợp đồng thuê sau khi duyệt. |

**Quy tắc:**
- Viết **đúng tiếng Anh như trên**. Không viết "Người dùng", "user", "USER", "Người mua".
- Nhiều actor cùng thực hiện được → ngăn bằng dấu phẩy, theo thứ tự `Guest, User, Shipper, Admin, System`: `User, Admin, Shipper`.
- Không tách "Buyer"/"Seller"/"Renter"/"Owner" thành actor riêng — tất cả đều là `User`, vai trò cụ thể mô tả trong Summary.
- Actor trong file spec phải khớp cột Actors của `USE_CASE_TABLE.md`.

### 4.3. Priority

| Mức | Nghĩa | Ví dụ |
|---|---|---|
| `High` | Bỏ đi thì luồng nghiệp vụ chính gãy, hệ thống không dùng được | Register, Login, Create Post, Place Order, Upgrade to Pro |
| `Medium` | Làm nghiệp vụ hoàn chỉnh, thiếu thì bất tiện nhưng vẫn chạy được | Update Profile, View My Orders, Resend OTP, View My Subscriptions |
| `Low` | Tiện ích, phụ trợ, nice-to-have | View Featured Setup Reminder, Mark Notification as Read |

Tỉ lệ tham khảo cho một file ~20 use case: khoảng 40% High, 45% Medium, 15% Low. Nếu file toàn `High` thì tức là chưa phân loại.

### 4.4. Business rule toàn cục (dải 900)

Những rule dưới đây áp dụng cho **nhiều module của nhiều người**.

Trong file spec cá nhân có hai cách dùng, chọn theo ngữ cảnh:

- **Rule chỉ là bối cảnh, không phải trọng tâm của use case** → chỉ tham chiếu mã: `Áp dụng BR-904.` Không chép nội dung.
- **Rule là trọng tâm nghiệp vụ của chính use case đó** → được phép phát biểu lại thành một BR cục bộ trong dải của mình, và ghi ánh xạ ở mục 5. Ví dụ: UC-13 View My Reputation Score có BR-40 "Every account starts with 100 reputation points" — đây là nội dung chính của use case nên viết ra, đồng thời ánh xạ về `BR-901`.

Không phát biểu lại nếu chỉ để cho bảng Business Rules dài thêm.

| Code | Rule | Nguồn |
|---|---|---|
| `BR-901` | Điểm uy tín khởi tạo là 100 khi tạo tài khoản, giá trị nhỏ nhất là 0. | `user.model.js` |
| `BR-902` | Điểm uy tín về 0 thì tài khoản bị khóa (`accountStatus` = `banned`). | Reputation flow |
| `BR-903` | Mọi thay đổi điểm uy tín phải ghi một bản ghi vào `reputation_logs`. | `reputation_log.model.js` |
| `BR-904` | User thường được đăng tối đa `FREE_POST_LIMIT` = 5 bài đang hoạt động; user Pro không giới hạn. | `business-rules.js:73` |
| `BR-905` | User Pro chọn tối đa `MAX_FEATURED_PRODUCTS` = 3 sản phẩm nổi bật. | `business-rules.js:74` |
| `BR-906` | Bài đăng mới luôn ở trạng thái chờ duyệt, chỉ hiển thị công khai sau khi Admin duyệt. | Post approval flow |
| `BR-907` | Trạng thái giao hàng phải chuyển tuần tự theo bảng transition, không được nhảy bước. | `business-rules.js` — `isDeliveryTransitionAllowed` |
| `BR-908` | Tiền cọc hoàn 100% nếu sản phẩm nguyên vẹn; trừ dần theo mức bồi thường nếu hư hỏng. | Deposit & compensation flow |
| `BR-909` | Số tiền thanh toán luôn lấy từ cấu hình phía server, không bao giờ lấy từ request của client. | `subscription.controller.js` |
| `BR-910` | Mật khẩu luôn hash bằng bcrypt trước khi lưu; không bao giờ lưu mật khẩu thô. | `auth.controller.js` |

Muốn thêm rule vào dải 900: báo nhóm, thống nhất, rồi thêm vào bảng này kèm cột Nguồn.

### 4.5. Glossary — thuật ngữ VI/EN

Dùng để 5 người không dịch lệch nhau khi ghép báo cáo.

| Tiếng Việt | Tiếng Anh (dùng trong spec) | Ghi chú |
|---|---|---|
| Bài đăng | post / listing | Không dùng "article" |
| Sản phẩm | product | |
| Danh mục | category | |
| Người mua | buyer | Vai trò của `User`, không phải actor |
| Người bán | seller | Vai trò của `User` |
| Người thuê | renter | Vai trò của `User` |
| Chủ sở hữu | owner | Vai trò của `User` cho luồng thuê |
| Đơn hàng | order | Chỉ dùng cho luồng mua bán |
| Yêu cầu thuê | rental request | |
| Hợp đồng thuê | rental contract | |
| Tiền cọc | deposit | Không dùng "collateral" |
| Bồi thường | compensation | |
| Kiểm định | inspection | Cả giao hàng lẫn thuê đồ |
| Giao hàng | delivery | Không dùng "shipping" |
| Điểm uy tín | reputation score | Không dùng "credit" / "trust point" |
| Đánh giá | review | Kèm rating dạng sao |
| Báo cáo vi phạm | violation report | Không dùng "complaint" |
| Bằng chứng | evidence | |
| Xác thực email | email verification | Chỉ OTP, hệ thống **không có KYC** |
| Mã OTP | OTP code | Luôn 6 chữ số |
| Gói Pro | Pro subscription | |
| Sản phẩm nổi bật | featured product | |
| Thông báo | notification | |
| Giỏ hàng | shopping cart | |
| Khóa tài khoản | ban account | `accountStatus` = `banned` |

### 4.6. Chuẩn viết message

Message là chuỗi trong `res.json({ message: "..." })` — hiển thị **trực tiếp cho người dùng cuối**, nên phải viết như câu tiếng Việt hoàn chỉnh.

#### 4.6.1. Bảy quy tắc bắt buộc

| # | Quy tắc | Đúng | Sai |
|---|---|---|---|
| 1 | **Tiếng Việt có dấu đầy đủ** | `Email đã được sử dụng` | `Email da duoc su dung` |
| 2 | **Viết hoa chữ đầu câu**, phần còn lại viết thường trừ danh từ riêng | `Không tìm thấy sản phẩm`, `Google token không hợp lệ` | `không tìm thấy sản phẩm`, `KHÔNG TÌM THẤY` |
| 3 | **Không có dấu chấm cuối** nếu chỉ một câu; có dấu chấm nếu từ hai câu trở lên | `Đã ẩn bài đăng` · `Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực.` | `Đã ẩn bài đăng.` |
| 4 | **Không lộ chi tiết kỹ thuật** — không tên biến, tên collection, stack trace, tên field DB | `Lỗi máy chủ` | `Cannot read property _id of null` |
| 5 | **Xưng hô nhất quán**: gọi người dùng là **"Bạn"**, hệ thống không tự xưng | `Bạn không có quyền cập nhật bài đăng này` | `Người dùng không có quyền...`, `Chúng tôi không cho phép...` |
| 6 | **"Vui lòng" chỉ dùng khi yêu cầu user làm gì tiếp theo**, không dùng cho thông báo lỗi thuần | `Vui lòng điền đầy đủ thông tin` | `Vui lòng lỗi máy chủ` |
| 7 | **Dùng đúng thuật ngữ trong glossary** (mục 4.5) | `Không tìm thấy hợp đồng thuê` | `Không tìm thấy contract` |

#### 4.6.2. Cấu trúc message

Hai dạng, chọn theo tình huống:

- **Một câu — nêu vấn đề:** `Sản phẩm đã hết hàng`
- **Hai câu — vấn đề + hành động cần làm:** `Tài khoản chưa xác thực email. Mã OTP mới đã được gửi, vui lòng nhập để kích hoạt.`

Dùng dạng hai câu khi user **có thể tự khắc phục**. Đừng để user đọc xong không biết làm gì tiếp.

#### 4.6.3. Message thành công

| Loại | Mẫu | Ví dụ |
|---|---|---|
| Hành động đơn lẻ | `Đã <động từ> <đối tượng>` | `Đã ẩn bài đăng`, `Đã thêm sản phẩm vào giỏ hàng`, `Đã đánh dấu đọc tất cả` |
| Kết thúc một luồng nghiệp vụ | `<Hành động> thành công` | `Đăng ký thành công`, `Đổi mật khẩu thành công`, `Cập nhật trạng thái thành công` |

Không trộn hai mẫu cho cùng một loại hành động.

#### 4.6.4. Message chứa biến

- **Trong code:** dùng template literal — `` `Vui lòng đợi ${cooldown}s trước khi gửi lại OTP` ``
- **Trong spec:** thay biến bằng tên trong ngoặc nhọn — `Vui lòng đợi {n}s trước khi gửi lại OTP`

Ghi rõ quy ước này ở bảng Exceptions để người đọc không tưởng `{n}` là chuỗi thật.

#### 4.6.5. Message chuẩn cho tình huống lặp lại

Những tình huống dưới đây xuất hiện ở nhiều module. **Dùng đúng câu chữ trong bảng**, không tự viết biến thể.

| Tình huống | Message chuẩn | Code |
|---|---|---|
| Thiếu/sai token | `Không có quyền truy cập` | 401 |
| Token hết hạn | `Phiên đăng nhập đã hết hạn` | 401 |
| Sai quyền thao tác | `Bạn không có quyền <hành động> này` | 403 |
| Tài khoản bị khóa | `Tài khoản đã bị khóa do vi phạm` | 403 |
| Không tìm thấy tài nguyên | `Không tìm thấy <đối tượng>` | 404 |
| Thiếu dữ liệu bắt buộc | `Vui lòng điền đầy đủ thông tin` | 400 |
| Dữ liệu sai định dạng | `<Đối tượng> không hợp lệ` | 400 |
| Lỗi không lường trước | `Lỗi máy chủ` | 500 |

`<đối tượng>` lấy đúng từ glossary: `sản phẩm`, `bài đăng`, `đơn hàng`, `hợp đồng thuê`, `người dùng`, `báo cáo`, `đánh giá`, `phòng chat`...

> **Lưu ý:** hiện code đang có các cặp trùng nghĩa khác chính tả (`Khong tim thay san pham` / `Không tìm thấy sản phẩm`, `Khong tim thay tai khoan` / `Không tìm thấy người dùng`). Khi dọn, gom về **một** câu theo bảng trên.

#### 4.6.6. Ngoại lệ: message cố tình mơ hồ

Một số message **phải** mơ hồ vì lý do bảo mật — đây là chủ ý, không phải viết ẩu:

| Message | Lý do | BR |
|---|---|---|
| `Email hoặc mật khẩu không đúng` | Không tiết lộ email nào đã tồn tại trong hệ thống | BR-13 |

Khi viết message dạng này, **phải có BR giải thích lý do**, nếu không người review sẽ tưởng là lỗi.

---

## 5. BR Registry

Bảng tra cứu toàn bộ business rule đã được định nghĩa, kèm use case sở hữu. Dùng để: tra nhanh một mã BR, kiểm tra trùng lặp, và làm phụ lục báo cáo.

> **Quy tắc sync:** nội dung rule ở đây phải khớp với bảng Business Rules trong file spec tương ứng. Sửa rule → sửa cả 2 nơi. Registry này là **bảng tra cứu**, spec mới là nơi rule được đặt trong ngữ cảnh use case.

### 5.1. BR-01 → BR-99 — Long (Người 1)

**Nguồn:** `USE_CASE_SPEC_LongTNP.md` · **Đã dùng:** BR-01 → BR-65 · **Còn trống:** BR-66 → BR-99

| Code | Rule | Use case |
|---|---|---|
| BR-01 | Email is normalized (trimmed and lower-cased) before being stored and compared. | UC-01 Register |
| BR-02 | Email must be unique across the whole system. | UC-01 Register |
| BR-03 | Password is hashed with bcrypt before storage; the plain password is never saved. | UC-01 Register |
| BR-04 | A user must be at least 13 years old to register. | UC-01 Register |
| BR-05 | A newly created account has `verificationStatus = unverified` and cannot log in until verified. | UC-01 Register |
| BR-06 | The OTP email is sent asynchronously; a failure to send does not roll back the account creation. | UC-01 Register |
| BR-07 | The OTP consists of 6 digits and is valid for 10 minutes. | UC-02 Verify Email OTP |
| BR-08 | A maximum of 5 wrong attempts is allowed; after that the OTP is destroyed and a new one must be requested. | UC-02 Verify Email OTP |
| BR-09 | The OTP is deleted immediately after a successful verification and cannot be reused. | UC-02 Verify Email OTP |
| BR-10 | Verifying the OTP logs the user in directly without requiring a separate login step. | UC-02 Verify Email OTP |
| BR-11 | Two consecutive OTP requests for the same email and purpose must be at least 60 seconds apart. | UC-03 Resend OTP |
| BR-12 | Issuing a new OTP invalidates the previous code and resets the failed-attempt counter. | UC-03 Resend OTP |
| BR-13 | The system returns the same message for a wrong email and a wrong password to avoid disclosing which accounts exist. | UC-04 Login |
| BR-14 | A banned account cannot log in regardless of correct credentials. | UC-04 Login |
| BR-15 | An unverified account cannot log in; the system automatically issues a new OTP if the cooldown has elapsed. | UC-04 Login |
| BR-16 | The JWT token is valid for 7 days by default, configurable through `JWT_EXPIRES_IN`. | UC-04 Login |
| BR-17 | An account signing in through Google is treated as verified and skips the OTP step. | UC-05 Login with Google |
| BR-18 | If the Google email matches an existing account, the two login methods are linked instead of creating a duplicate account. | UC-05 Login with Google |
| BR-19 | An account created through Google has no password and must use Forgot Password to set one. | UC-05 Login with Google |
| BR-20 | Authentication is stateless with JWT, so logging out only clears the token on the client side. | UC-06 Logout |
| BR-21 | An issued token remains technically valid until it expires; the system does not maintain a blacklist. | UC-06 Logout |
| BR-22 | The reset OTP is stored separately from the registration OTP, so the two flows do not interfere with each other. | UC-07 Forgot Password |
| BR-23 | Requesting a reset OTP does not change the current password until the reset is completed. | UC-07 Forgot Password |
| BR-24 | The new password is hashed by the model middleware before being stored. | UC-08 Reset Password |
| BR-25 | Resetting the password does not log the user in automatically; a fresh login is required. | UC-08 Reset Password |
| BR-26 | This flow also allows a Google-created account to set its first password. | UC-08 Reset Password |
| BR-27 | The current password must be confirmed before the new one is accepted. | UC-09 Change Password |
| BR-28 | Changing the password does not invalidate the current JWT token. | UC-09 Change Password |
| BR-29 | The password hash is never returned in any profile response. | UC-10 View My Profile |
| BR-30 | Pro status is derived at read time by comparing `proExpiresAt` with the current time, not stored as a flag. | UC-10 View My Profile |
| BR-31 | When the address list is empty, the system generates a default address from the name, phone, and address fields. | UC-10 View My Profile |
| BR-32 | Only fields present in the request are updated; omitted fields keep their current values. | UC-11 Update Profile |
| BR-33 | Address entries that are entirely empty are removed from the list. | UC-11 Update Profile |
| BR-34 | Exactly one address must be the default; if none is marked, the first entry becomes the default. | UC-11 Update Profile |
| BR-35 | The default address is synchronized back into the main `address` field of the account. | UC-11 Update Profile |
| BR-36 | Email and role cannot be changed by the user through this use case. | UC-11 Update Profile |
| BR-37 | Only full name, email, avatar, reputation score, account status, and role are exposed publicly. | UC-12 View Public Profile |
| BR-38 | Phone number, address, and date of birth are never exposed on a public profile. | UC-12 View Public Profile |
| BR-39 | This use case does not require authentication and is accessible to guests. | UC-12 View Public Profile |
| BR-40 | Every account starts with 100 reputation points. | UC-13 View My Reputation Score |
| BR-41 | Each change is written to the reputation log with a reason, an amount, and the acting administrator. | UC-13 View My Reputation Score |
| BR-42 | When the score reaches 0 the account is banned automatically and can no longer log in. | UC-13 View My Reputation Score |
| BR-43 | Only the numeric score is public; the detailed deduction history is visible to the owner and administrators. | UC-14 View User Reputation Score |
| BR-44 | Three plans are offered: 30 days for 50,000 VND, 90 days for 120,000 VND, and 365 days for 400,000 VND. | UC-78 View Pro Plans |
| BR-45 | Plan prices and durations are defined centrally in the business rules module, not hard-coded in the interface. | UC-78 View Pro Plans |
| BR-46 | Each payment attempt creates a separate subscription record with a unique transaction reference. | UC-79 Upgrade to Pro |
| BR-47 | The subscription record is created before redirecting to VNPay so the result can be reconciled later. | UC-79 Upgrade to Pro |
| BR-48 | The payment amount is taken from the server-side configuration, never from the client request. | UC-79 Upgrade to Pro |
| BR-49 | A local IPv6 address is converted to `127.0.0.1` because VNPay only accepts IPv4. | UC-79 Upgrade to Pro |
| BR-50 | The returned data must pass secure hash verification before any account change is applied. | UC-80 View Payment Result |
| BR-51 | A payment is accepted only when the response code and the transaction status are both `00` and the amount matches the plan exactly. | UC-80 View Payment Result |
| BR-52 | The flow is idempotent: an already-paid subscription is not granted a second time when the page is refreshed. | UC-80 View Payment Result |
| BR-53 | A new Pro period stacks on top of the remaining period instead of overwriting it. | UC-80 View Payment Result |
| BR-54 | After a successful upgrade the featured product setup flag is reset so the user is prompted to choose again. | UC-80 View Payment Result |
| BR-55 | The user can only see their own subscription records. | UC-81 View My Subscriptions |
| BR-56 | Failed and pending records are kept in the history for reconciliation purposes. | UC-81 View My Subscriptions |
| BR-57 | A non-Pro account may keep at most 5 active listings at the same time. | UC-82 Check Pro Status |
| BR-58 | Only listings in pending, approved, or available state count towards the quota; sold and hidden listings do not. | UC-82 Check Pro Status |
| BR-59 | A Pro account has no post limit, so the remaining quota is returned as null. | UC-82 Check Pro Status |
| BR-60 | Pro status is computed at read time and expires automatically without a scheduled job. | UC-82 Check Pro Status |
| BR-61 | Only an account with an active Pro period may set featured products. | UC-83 Set Featured Products |
| BR-62 | A maximum of 3 listings can be featured at the same time. | UC-83 Set Featured Products |
| BR-63 | Only listings owned by the requesting user can be selected. | UC-83 Set Featured Products |
| BR-64 | The reminder is shown only when the account is Pro and has not completed the featured setup. | UC-84 View Featured Setup Reminder |
| BR-65 | The setup flag is reset to false after every successful upgrade, so a renewing member is prompted again. | UC-84 View Featured Setup Reminder |

**Quan hệ với BR toàn cục (dải 900):** bốn rule dưới đây là bản phát biểu cụ thể trong ngữ cảnh use case của rule toàn cục, giữ nguyên chứ không xóa:

| BR cục bộ | Ứng với BR toàn cục |
|---|---|
| BR-40 | `BR-901` Điểm uy tín khởi tạo 100 |
| BR-42 | `BR-902` Về 0 thì khóa tài khoản |
| BR-57 | `BR-904` `FREE_POST_LIMIT` = 5 |
| BR-62 | `BR-905` `MAX_FEATURED_PRODUCTS` = 3 |

### 5.2. BR-100 → BR-199 — Sơn (Người 2)

**Nguồn:** `USE_CASE_SPEC_Son.md` · **Trạng thái:** chưa viết

| Code | Rule | Use case |
|---|---|---|
| | *(chờ bổ sung)* | |

### 5.3. BR-200 → BR-299 — Duy Anh (Người 3)

**Nguồn:** `USE_CASE_SPEC_DuyAnh.md` · **Trạng thái:** chưa viết

| Code | Rule | Use case |
|---|---|---|
| | *(chờ bổ sung)* | |

### 5.4. BR-300 → BR-399 — Người 4

**Nguồn:** `USE_CASE_SPEC_<Tên>.md` · **Trạng thái:** chưa viết

| Code | Rule | Use case |
|---|---|---|
| | *(chờ bổ sung)* | |

### 5.5. BR-400 → BR-499 — Khánh (Người 5)

**Nguồn:** `USE_CASE_SPEC_Khanh.md` · **Trạng thái:** chưa viết

| Code | Rule | Use case |
|---|---|---|
| | *(chờ bổ sung)* | |

### 5.6. BR-900 → BR-999 — Toàn cục

Xem mục 4.4.

---

## 6. Checklist trước khi nộp

Tick hết trước khi commit file spec:

- [ ] Mọi use case thuộc phạm vi của mình trong `USE_CASE_TABLE.md` đều đã có bảng đặc tả — không thiếu cái nào.
- [ ] Mã `UC-xx` khớp `USE_CASE_TABLE.md`; tên use case cũng khớp từng chữ.
- [ ] Mọi mã `BR-xx` nằm trong dải được cấp (mục 1.2), tăng dần, không trùng, không nhảy về số đã dùng.
- [ ] Đủ 11 trường trong mọi bảng use case, đúng thứ tự; `Author`, `Date`, `Version` đã điền.
- [ ] Cột Message trong bảng Exceptions **chép đúng nguyên văn** message trong controller — copy-paste, không gõ lại, không tự thêm dấu tiếng Việt.
- [ ] Message trong controller đã đạt chuẩn mục 4.6: có dấu đầy đủ, đúng xưng hô, dùng message chuẩn cho tình huống lặp.
- [ ] Mọi use case cần đăng nhập có dòng `401`; mọi use case có dòng `500`.
- [ ] Actor viết đúng theo mục 4.2, khớp cột Actors của bảng tổng.
- [ ] Priority không phải toàn `High` (tham khảo tỉ lệ ở mục 4.3).
- [ ] Thuật ngữ dùng đúng glossary mục 4.5.
- [ ] BR toàn cục: dùng đúng một trong hai cách ở mục 4.4 — tham chiếu mã, hoặc phát biểu lại kèm ánh xạ trong mục 5.
- [ ] Đủ 4 bảng con đúng thứ tự cho mỗi use case: Main → Alternative → Exceptions → Business Rules.
- [ ] **BR Registry (mục 5) đã cập nhật**: mọi BR mới/sửa trong spec đều được đồng bộ sang bảng registry của mình, nội dung khớp từng chữ.

---

## 7. Reference implementation

`USE_CASE_SPEC_LongTNP.md` là file mẫu — 21 use case, viết đúng toàn bộ quy chuẩn trên. Ba use case đáng xem nhất khi bắt đầu viết file của mình:

| Xem mục | Use case | Học được gì |
|---|---|---|
| `## 3.1` | Register (UC-01) | Bảng đầy đủ nhất: 7 dòng Exceptions với message nguyên văn, 6 BR trích thẳng từ validate logic của controller. Mẫu chuẩn cho use case tạo dữ liệu. |
| `## 3.16` | Upgrade to Pro (UC-79) | Cách viết use case có **hệ thống bên ngoài** (VNPay): step hệ thống tự làm để trống cột Actor Event, Alternative trỏ sang UC khác, Post Conditions mô tả trạng thái trung gian `pending`. |
| `## 3.3` | Resend OTP (UC-03) | Cách viết use case có **rate limit**: exception `429` với message chứa biến `{n}`, BR mô tả cooldown. |

---

*Version 1.0 — 19/07/2026. Sửa file này phải báo cả nhóm vì nó ảnh hưởng tới 5 file spec.*
