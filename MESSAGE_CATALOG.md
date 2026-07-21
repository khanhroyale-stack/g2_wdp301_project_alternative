# MESSAGE CATALOG — EcoTrade

> Danh mục tập trung các chuỗi `message` mà backend trả về cho người dùng cuối.
> Dùng làm **nguồn tra cứu duy nhất** khi viết cột `Message` trong bảng Exceptions của
> `USE_CASE_SPEC_STANDARD.md` / `USE_CASE_SPEC_LongTNP.md` — copy-paste từ đây, không gõ lại.

- **Nguồn:** `backend/src/controllers/*.js` (20 controller)
- **Phạm vi:** 95 message riêng biệt, 124 vị trí gọi
- **Chuẩn đối chiếu:** `USE_CASE_SPEC_STANDARD.md` mục 4.6 — *Chuẩn viết message*

---

## 1. Quy ước đọc bảng

| Ký hiệu | Nghĩa |
|---|---|
| `{n}`, `{limit}` | Biến nội suy trong template literal của code. Trong spec giữ nguyên dạng ngoặc nhọn. |
| Cột **HTTP** | Mã trả về kèm message đó. Cùng một câu chữ nhưng khác mã ⇒ tính là hai dòng riêng. |
| Cột **Vị trí** | `file:line` trong `backend/src/controllers/`. Nhiều vị trí ⇒ message dùng lại. |
| ⚠ | Message lệch chuẩn mục 4.6 — chi tiết ở [§13](#13-đối-chiếu-chuẩn-46). |

Message thành công (2xx) in **đậm** để tách khỏi message lỗi.

---

## 2. Auth — `auth.controller.js`

| HTTP | Message | Vị trí | Hàm |
|---|---|---|---|
| 201 | **Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực.** | `auth:38` | `register` |
| 200 | **OTP đã được gửi đến email của bạn** | `auth:184` | `forgotPassword` |
| 200 | **OTP mới đã được gửi đến email của bạn** | `auth:253` | `resendOTP` |
| 200 | **Đặt lại mật khẩu thành công** | `auth:210` | `resetPassword` |
| 200 | **Đổi mật khẩu thành công** | `auth:232` | `changePassword` |
| 200 | **Đã ghi nhận** ⚠ | `auth:161` | `markFeaturedSetupDone` |
| 400 | Vui lòng điền đầy đủ thông tin | `auth:20`, `auth:195`, `auth:221` | `register`, `resetPassword`, `changePassword` |
| 400 | Email đã được sử dụng | `auth:25` | `register` |
| 400 | Thiếu email hoặc OTP ⚠ | `auth:53` | `verifyEmail` |
| 400 | OTP không hợp lệ hoặc đã hết hạn | `auth:57`, `auth:199` | `verifyEmail`, `resetPassword` |
| 400 | Thiếu credential ⚠ | `auth:97` | `googleAuth` |
| 400 | Mật khẩu hiện tại không đúng | `auth:226` | `changePassword` |
| 401 | Email hoặc mật khẩu không đúng | `auth:79` | `login` |
| 401 | Email Google chưa được xác minh | `auth:102` | `googleAuth` |
| 401 | Token Google không hợp lệ | `auth:134` | `googleAuth` |
| 403 | Tài khoản đã bị khóa do vi phạm | `auth:83`, `auth:122` | `login`, `googleAuth` |
| 404 | Không tìm thấy tài khoản ⚠ | `auth:62`, `auth:142`, `auth:156`, `auth:204` | `verifyEmail`, `checkFeaturedReminder`, `markFeaturedSetupDone`, `resetPassword` |
| 404 | Email không tồn tại trong hệ thống ⚠ | `auth:173`, `auth:244` | `forgotPassword`, `resendOTP` |

> `Email hoặc mật khẩu không đúng` là message **cố tình mơ hồ** theo BR-13 — không tiết lộ email nào đã tồn tại. Không sửa thành hai câu riêng.

---

## 3. User & Reputation — `user.controller.js`, `reputation.controller.js`

| HTTP | Message | Vị trí | Hàm |
|---|---|---|---|
| 200 | **Đã trừ {n} điểm** | `reputation:87` | `adminDeduct` |
| 200 | **Đã trừ {n} điểm. Tài khoản đã bị khóa do điểm = 0.** ⚠ | `reputation:87` | `adminDeduct` |
| 400 | Mức vi phạm không hợp lệ (warning/minor/major) ⚠ | `reputation:63` | `adminDeduct` |
| 404 | Không tìm thấy người dùng ⚠ | `reputation:44`, `reputation:68`, `reputation:103`, `user:103`, `user:136`, `user:155` | `getUserReputation`, `adminDeduct`, `adminGetHistory`, `getPublicProfile`, `getUserById`, `updateUserByAdmin` |

> Message ở `reputation:87` là template literal có **hậu tố điều kiện**: phần `. Tài khoản đã bị khóa do điểm = 0.` chỉ được nối thêm khi `accountStatus === "banned"`. Trong spec ghi thành **hai dòng exception riêng** như trên.

---

## 4. Category — `category.controller.js`

| HTTP | Message | Vị trí | Hàm |
|---|---|---|---|
| 200 | **Đã ẩn danh mục** | `category:42` | `deleteCategory` |

---

## 5. Order — `order.controller.js`

| HTTP | Message | Vị trí | Hàm |
|---|---|---|---|
| 201 | **Tạo đơn hàng thành công** | `order:178` | `createOrder` |
| 400 | Thiếu thông tin đặt hàng ⚠ | `order:137` | `createOrder` |
| 400 | Sản phẩm hiện không đủ số lượng để mua | `order:149` | `createOrder` |
| 400 | Không thể hủy vì đơn đã bắt đầu giao | `order:272` | `updateOrderStatus` |
| 400 | Đơn hàng không còn ở trạng thái chờ xác nhận | `order:287` | `updateOrderStatus` |
| 400 | Bạn chưa được phân công đơn giao này | `order:296` | `updateOrderStatus` |
| 400 | Đơn hàng chưa ở giai đoạn có thể hoàn tất | `order:307` | `updateOrderStatus` |
| 400 | Trạng thái không hợp lệ | `order:317` | `updateOrderStatus` |
| 400 | Đơn giao này đã có shipper nhận | `order:349` | `acceptOrderForShipper` |
| 403 | Bạn không có quyền xem đơn hàng này | `order:221` | `getOrderById` |
| 403 | Bạn không có quyền cập nhật đơn hàng này | `order:262` | `updateOrderStatus` |
| 403 | Chỉ người mua hoặc người bán mới có thể hủy đơn | `order:269` | `updateOrderStatus` |
| 403 | Chỉ người bán mới có thể xác nhận đơn | `order:284` | `updateOrderStatus` |
| 403 | Chỉ shipper mới có thể cập nhật tiến trình giao hàng | `order:293` | `updateOrderStatus` |
| 403 | Chỉ người mua mới có thể hoàn tất đơn | `order:304` | `updateOrderStatus` |
| 403 | Bạn không có quyền tạo biên bản kiểm tra | `order:389` | `createInspection` |
| 404 | Không tìm thấy đơn hàng | `order:211`, `order:254`, `review:30` | `getOrderById`, `updateOrderStatus`, `createReview` |
| 404 | Không tìm thấy đơn giao | `order:345` | `acceptOrderForShipper` |
| 404 | Không tìm thấy delivery cho đơn hàng này ⚠ | `order:385` | `createInspection` |

---

## 6. Rental — `rental.controller.js`

### 6.1. Tạo yêu cầu thuê

| HTTP | Message | Vị trí | Hàm |
|---|---|---|---|
| 400 | Sản phẩm chưa được duyệt hoặc không khả dụng | `rental:111` | `createRentalRequest` |
| 400 | Sản phẩm này không cho thuê | `rental:113` | `createRentalRequest` |
| 400 | Không tìm thấy chủ sản phẩm | `rental:118` | `createRentalRequest` |
| 400 | Không thể thuê sản phẩm của chính mình | `rental:121` | `createRentalRequest` |
| 400 | Ngày không hợp lệ | `rental:126` | `createRentalRequest` |
| 400 | Ngày kết thúc phải sau ngày bắt đầu | `rental:128` | `createRentalRequest` |
| 400 | Ngày bắt đầu không được trong quá khứ | `rental:133` | `createRentalRequest` |
| 400 | Sản phẩm đã hết lịch thuê trong khoảng thời gian này | `rental:137` | `createRentalRequest` |
| 404 | Không tìm thấy sản phẩm | `rental:109` | `createRentalRequest` |

### 6.2. Duyệt & vòng đời hợp đồng

| HTTP | Message | Vị trí | Hàm |
|---|---|---|---|
| 200 | **Đã xác nhận nhận đồ** | `rental:408` | `updateRentalStatus` |
| 200 | **Đã gửi yêu cầu trả đồ** | `rental:475` | `requestReturn` |
| 200 | **Xử lý cọc thành công** | `rental:527` | `resolveDeposit` |
| 400 | Yêu cầu không còn ở trạng thái chờ | `rental:273`, `rental:333` | `updateRentalStatus` |
| 400 | Chỉ hủy được yêu cầu đang chờ xác nhận | `rental:362` | `updateRentalStatus` |
| 400 | Hợp đồng không ở trạng thái chờ nhận đồ | `rental:389` | `updateRentalStatus` |
| 400 | Chỉ có thể trả đồ khi đang trong quá trình thuê | `rental:457` | `requestReturn` |
| 400 | Chỉ xử lý cọc khi đồ đã được trả hoặc đang tranh chấp | `rental:500` | `resolveDeposit` |
| 403 | Không có quyền xem ⚠ | `rental:204` | `getRental` |
| 403 | Không có quyền ⚠ | `rental:271`, `rental:331`, `rental:360`, `rental:387`, `rental:454` | `updateRentalStatus`, `requestReturn` |
| 403 | Không có quyền xử lý cọc ⚠ | `rental:497` | `resolveDeposit` |
| 404 | Không tìm thấy ⚠ | `rental:197`, `rental:379`, `chat:196` | `getRental`, `updateRentalStatus`, `adminGetRoomMessages` |
| 404 | Không tìm thấy hợp đồng ⚠ | `rental:451`, `rental:491`, `rental:599` | `requestReturn`, `resolveDeposit`, `confirmExtend` |

### 6.3. Gia hạn thuê

| HTTP | Message | Vị trí | Hàm |
|---|---|---|---|
| 200 | **Đã gửi yêu cầu gia hạn {n} ngày, đang chờ chủ đồ xác nhận** | `rental:586` | `extendRental` |
| 200 | **Đã chấp nhận gia hạn** | `rental:638` | `confirmExtend` |
| 200 | **Đã từ chối yêu cầu gia hạn** | `rental:660` | `confirmExtend` |
| 400 | Số ngày gia hạn không hợp lệ (phải >= 1) ⚠ | `rental:538` | `extendRental` |
| 400 | Hợp đồng không khả dụng để gia hạn | `rental:542` | `extendRental` |
| 400 | Chỉ gia hạn được khi hợp đồng đang active hoặc đang thuê ⚠ | `rental:545` | `extendRental` |
| 400 | Đã có yêu cầu gia hạn đang chờ chủ đồ xác nhận | `rental:552` | `extendRental` |
| 400 | Không thể gia hạn vì đã có lịch thuê khác trong khoảng này | `rental:559` | `extendRental` |
| 400 | Không có yêu cầu gia hạn đang chờ | `rental:606` | `confirmExtend` |
| 403 | Chỉ người thuê mới có thể yêu cầu gia hạn | `rental:549` | `extendRental` |
| 403 | Chỉ chủ đồ mới có thể xác nhận gia hạn | `rental:603` | `confirmExtend` |

> `{n}` ở `rental:586` là biến `extraDays` trong code.

---

## 7. Chat — `chat.controller.js` (UC-70 → UC-72)

| HTTP | Message | Vị trí | Hàm |
|---|---|---|---|
| 400 | Thiếu otherUserId hoặc postId ⚠ | `chat:12` | `getOrCreateRoom` |
| 400 | Nội dung tin nhắn không được trống ⚠ | `chat:137` | `sendMessage` |
| 403 | Bạn không có quyền truy cập phòng chat này | `chat:96` | `getMessages` |
| 403 | Không có quyền gửi tin nhắn ⚠ | `chat:134` | `sendMessage` |
| 404 | Không tìm thấy phòng chat | `chat:91`, `chat:130` | `getMessages`, `sendMessage` |
| 404 | Không tìm thấy ⚠ | `chat:196` | `adminGetRoomMessages` |

## 8. Support Chat — `support_chat.controller.js` (UC-73 → UC-75)

| HTTP | Message | Vị trí | Hàm |
|---|---|---|---|
| 400 | Admin cần chỉ định customerId ⚠ | `support:41` | `sendMessage` |
| 400 | Nội dung không được rỗng ⚠ | `support:47` | `sendMessage` |

---

## 9. Notification — `notification.controller.js`

| HTTP | Message | Vị trí | Hàm |
|---|---|---|---|
| 200 | **Đã đánh dấu đọc tất cả** | `notification:53` | `markAllRead` |

---

## 10. Review — `review.controller.js`

| HTTP | Message | Vị trí | Hàm |
|---|---|---|---|
| 200 | **Đã ẩn đánh giá** | `review:220` | `adminHideReview` |
| 400 | Thiếu thông tin bắt buộc ⚠ | `review:23` | `createReview` |
| 400 | Chỉ được đánh giá sau khi bạn xác nhận đã nhận hàng (order: {orderStatus}, delivery: {deliveryStatus}) ⚠ | `review:41` | `createReview` |
| 400 | Chỉ được đánh giá sau khi hợp đồng thuê đã hoàn tất | `review:59` | `createReview` |
| 400 | Bạn đã đánh giá sản phẩm này rồi | `review:74` | `createReview` |
| 403 | Bạn không phải người mua của đơn hàng này | `review:36` | `createReview` |
| 403 | Bạn không phải người thuê của hợp đồng này | `review:56` | `createReview` |
| 404 | Không tìm thấy hợp đồng thuê | `review:51` | `createReview` |
| 404 | Không tìm thấy đánh giá | `review:197` | `adminHideReview` |

> `{deliveryStatus}` mặc định là chuỗi `none` khi đơn chưa có bản ghi delivery.

---

## 11. Report — `report.controller.js`

| HTTP | Message | Vị trí | Hàm |
|---|---|---|---|
| 400 | Thiếu thông tin bắt buộc ⚠ | `report:39`, `reputation:58`, `review:23` | `createReport`, `adminDeduct`, `createReview` |
| 400 | Status không hợp lệ ⚠ | `report:199` | `resolveReport` |
| 400 | Cần ít nhất 1 bằng chứng | `report:293` | `addReportEvidence` |
| 403 | Không có quyền thêm bằng chứng ⚠ | `report:301` | `addReportEvidence` |
| 404 | Không tìm thấy báo cáo | `report:164`, `report:206`, `report:297` | `getReportById`, `resolveReport`, `addReportEvidence` |

---

## 12. Message dùng chung nhiều module

Những câu dưới đây xuất hiện ở **từ 2 file trở lên**. Khi sửa, phải sửa đồng loạt.

| Message | HTTP | Số vị trí | Các file |
|---|---|---|---|
| Không tìm thấy người dùng | 404 | 6 | `reputation`, `user` |
| Không tìm thấy tài khoản | 404 | 4 | `auth` |
| Không có quyền | 403 | 5 | `rental` |
| Không tìm thấy đơn hàng | 404 | 3 | `order`, `review` |
| Thiếu thông tin bắt buộc | 400 | 3 | `report`, `reputation`, `review` |
| Vui lòng điền đầy đủ thông tin | 400 | 3 | `auth` |
| Không tìm thấy hợp đồng | 404 | 3 | `rental` |
| Không tìm thấy báo cáo | 404 | 3 | `report` |
| Không tìm thấy | 404 | 3 | `chat`, `rental` |
| OTP không hợp lệ hoặc đã hết hạn | 400 | 2 | `auth` |
| Tài khoản đã bị khóa do vi phạm | 403 | 2 | `auth` |
| Email không tồn tại trong hệ thống | 404 | 2 | `auth` |
| Không tìm thấy phòng chat | 404 | 2 | `chat` |
| Yêu cầu không còn ở trạng thái chờ | 400 | 2 | `rental` |

---

## 13. Đối chiếu chuẩn 4.6

Các mục ⚠ ở trên gom theo loại lệch chuẩn. Đây là **checklist dọn dẹp**, không phải lỗi chức năng.

### 13.1. Lộ chi tiết kỹ thuật (quy tắc 4)

Message hiển thị thẳng cho người dùng cuối nên không được chứa tên biến, tên field, tên collection.

| Message hiện tại | Vị trí | Đề xuất |
|---|---|---|
| Thiếu otherUserId hoặc postId | `chat:12` | Vui lòng điền đầy đủ thông tin |
| Thiếu credential | `auth:97` | Thiếu thông tin đăng nhập Google |
| Thiếu email hoặc OTP | `auth:53` | Vui lòng điền đầy đủ thông tin |
| Admin cần chỉ định customerId | `support:41` | Vui lòng chọn khách hàng cần hỗ trợ |
| Không tìm thấy delivery cho đơn hàng này | `order:385` | Không tìm thấy đơn giao của đơn hàng này |
| Status không hợp lệ | `report:199` | Trạng thái không hợp lệ |
| Chỉ gia hạn được khi hợp đồng đang active hoặc đang thuê | `rental:545` | Chỉ gia hạn được khi hợp đồng đang hiệu lực hoặc đang thuê |
| Mức vi phạm không hợp lệ (warning/minor/major) | `reputation:63` | Mức vi phạm không hợp lệ |
| Số ngày gia hạn không hợp lệ (phải >= 1) | `rental:538` | Số ngày gia hạn phải từ 1 ngày trở lên |
| Chỉ được đánh giá sau khi bạn xác nhận đã nhận hàng (order: …, delivery: …) | `review:41` | Chỉ được đánh giá sau khi bạn xác nhận đã nhận hàng |
| Đã trừ {n} điểm. Tài khoản đã bị khóa do điểm = 0. | `reputation:87` | Đã trừ {n} điểm. Tài khoản đã bị khóa do hết điểm uy tín. |

### 13.2. Thiếu `<đối tượng>` hoặc thiếu xưng hô (quy tắc 5, mục 4.6.5)

Chuẩn: `Không tìm thấy <đối tượng>` · `Bạn không có quyền <hành động> này`.

| Message hiện tại | Vị trí | Đề xuất |
|---|---|---|
| Không tìm thấy | `chat:196`, `rental:197`, `rental:379` | Không tìm thấy phòng chat / Không tìm thấy hợp đồng thuê |
| Không có quyền | `rental:271`, `:331`, `:360`, `:387`, `:454` | Bạn không có quyền cập nhật hợp đồng này |
| Không có quyền xem | `rental:204` | Bạn không có quyền xem hợp đồng này |
| Không có quyền xử lý cọc | `rental:497` | Bạn không có quyền xử lý tiền cọc |
| Không có quyền gửi tin nhắn | `chat:134` | Bạn không có quyền gửi tin nhắn trong phòng chat này |
| Không có quyền thêm bằng chứng | `report:301` | Bạn không có quyền thêm bằng chứng cho báo cáo này |
| Đã ghi nhận | `auth:161` | Đã ghi nhận thiết lập sản phẩm nổi bật |

### 13.3. Trùng nghĩa, khác câu chữ (mục 4.6.5)

Chọn **một** câu cho mỗi tình huống rồi sửa toàn bộ vị trí.

| Tình huống | Các biến thể đang dùng | Chuẩn đề xuất |
|---|---|---|
| Không tìm thấy tài khoản | `Không tìm thấy tài khoản` (auth, 4) · `Không tìm thấy người dùng` (reputation/user, 6) · `Email không tồn tại trong hệ thống` (auth, 2) | `Không tìm thấy người dùng` |
| Thiếu dữ liệu bắt buộc | `Vui lòng điền đầy đủ thông tin` (auth, 3) · `Thiếu thông tin bắt buộc` (report/reputation/review, 3) · `Thiếu thông tin đặt hàng` (order, 1) | `Vui lòng điền đầy đủ thông tin` |
| Hợp đồng thuê | `Không tìm thấy hợp đồng` (rental, 3) · `Không tìm thấy hợp đồng thuê` (review, 1) | `Không tìm thấy hợp đồng thuê` |
| Nội dung rỗng | `Nội dung tin nhắn không được trống` (chat) · `Nội dung không được rỗng` (support) | `Nội dung tin nhắn không được để trống` |

> **Lưu ý bảo mật:** `Email không tồn tại trong hệ thống` ở `auth:173` (Forgot Password) và `auth:244` (Resend OTP) đang **tiết lộ email nào đã đăng ký** — mâu thuẫn với BR-13 vốn cố tình giấu thông tin này ở luồng Login. Nếu thống nhất theo BR-13 thì hai endpoint này nên trả về message trung tính kiểu `Nếu email tồn tại, mã OTP đã được gửi` và phải bổ sung BR giải thích.

### 13.4. Handler 500 trả về `error.message` thô

**111 chỗ** trong 20 controller đang dùng:

```js
res.status(500).json({ success: false, message: error.message });
```

`error.message` là chuỗi do Node/Mongoose sinh ra (ví dụ `Cast to ObjectId failed for value ...`) — vi phạm quy tắc 4 và không thể chép vào spec vì không cố định. Chuẩn mục 4.6.5 cho mã 500 là `Lỗi máy chủ`.

Đề xuất: giữ `error.message` cho log server, trả về client câu cố định.

```js
console.error(error);
res.status(500).json({ success: false, message: "Lỗi máy chủ" });
```

Phân bố: `product` 11 · `order` 10 · `rental` 10 · `auth` 9 · `report` 7 · `stats` 7 · `review` 6 · `user` 6 · `category` 5 · `chat` 5 · `delivery` 5 · `cart` 4 · `inspection` 4 · `notification` 4 · `reputation` 4 · `shipper_report` 4 · `subscription` 4 · `support_chat` 3 · `admin_subscription` 2 · `upload` 1.

---

## 14. Phạm vi chưa phủ

Các controller sau **chưa có message nào trong catalog** — cần bổ sung khi module được chuẩn hóa:

`cart` · `delivery` · `inspection` · `product` · `shipper_report` · `subscription` · `upload` · `stats` · `admin_subscription`

Khi bổ sung, thêm message vào đúng mục theo module và cập nhật lại §12 nếu câu đó dùng chung.

---

## 15. Cách cập nhật catalog

1. Sửa message trong controller **trước**, catalog sau — không bao giờ sửa mỗi catalog cho đẹp.
2. Thêm/sửa dòng ở mục module tương ứng, kèm `file:line` chính xác.
3. Nếu message dùng ở ≥ 2 nơi, cập nhật cả §12.
4. Nếu message xuất hiện trong bảng Exceptions của use case spec, cập nhật đồng thời cả hai file.
5. Số dòng trong cột **Vị trí** thay đổi mỗi khi controller được sửa — kiểm tra lại trước khi nộp bài.

---

## 16. Phụ lục — Danh sách toàn bộ message

Toàn bộ 95 message ở một bảng phẳng, sắp xếp theo **HTTP code** rồi theo **alphabet tiếng Việt**.
Dùng bảng này để tra nhanh hoặc copy hàng loạt; xem ngữ cảnh nghiệp vụ thì quay lại §2–§11.

Cột **Context** = tình huống nghiệp vụ khiến message được trả về, viết gọn trong một câu.
Cột **SL** = số vị trí gọi. Dấu ⚠ = lệch chuẩn §4.6, xem §13.

| # | HTTP | Message | Context | SL | Vị trí |
|---|---|---|---|---|---|
| 1 | 200 | Đã ẩn danh mục | Admin ẩn một danh mục sản phẩm | 1 | `category:42` |
| 2 | 200 | Đã ẩn đánh giá | Admin ẩn một đánh giá vi phạm | 1 | `review:220` |
| 3 | 200 | Đã chấp nhận gia hạn | Chủ đồ đồng ý yêu cầu gia hạn của người thuê | 1 | `rental:638` |
| 4 | 200 | Đã đánh dấu đọc tất cả | User đánh dấu toàn bộ thông báo là đã đọc | 1 | `notification:53` |
| 5 | 200 | Đã ghi nhận ⚠ | User tắt nhắc nhở thiết lập sản phẩm nổi bật | 1 | `auth:161` |
| 6 | 200 | Đã gửi yêu cầu gia hạn {n} ngày, đang chờ chủ đồ xác nhận | Người thuê gửi yêu cầu gia hạn, chờ chủ đồ duyệt | 1 | `rental:586` |
| 7 | 200 | Đã gửi yêu cầu trả đồ | Người thuê báo muốn trả đồ khi hết hạn thuê | 1 | `rental:475` |
| 8 | 200 | Đã trừ {n} điểm | Admin trừ điểm uy tín sau khi xử lý vi phạm | 1 | `reputation:87` |
| 9 | 200 | Đã trừ {n} điểm. Tài khoản đã bị khóa do điểm = 0. ⚠ | Như trên, nhưng điểm về 0 nên tài khoản bị khóa tự động | 1 | `reputation:87` |
| 10 | 200 | Đã từ chối yêu cầu gia hạn | Chủ đồ từ chối yêu cầu gia hạn | 1 | `rental:660` |
| 11 | 200 | Đã xác nhận nhận đồ | Người thuê xác nhận đã nhận đồ, hợp đồng chuyển sang đang thuê | 1 | `rental:408` |
| 12 | 200 | Đặt lại mật khẩu thành công | User đặt mật khẩu mới sau khi xác thực OTP quên mật khẩu | 1 | `auth:210` |
| 13 | 200 | Đổi mật khẩu thành công | User đang đăng nhập đổi mật khẩu thành công | 1 | `auth:232` |
| 14 | 200 | OTP đã được gửi đến email của bạn | User yêu cầu quên mật khẩu, hệ thống gửi OTP qua email | 1 | `auth:184` |
| 15 | 200 | OTP mới đã được gửi đến email của bạn | User bấm gửi lại OTP sau khi hết thời gian chờ | 1 | `auth:253` |
| 16 | 200 | Xử lý cọc thành công | Chủ đồ hoặc admin quyết định hoàn hay giữ tiền cọc | 1 | `rental:527` |
| 17 | 201 | Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực. | Tạo tài khoản mới thành công, chờ xác thực email | 1 | `auth:38` |
| 18 | 201 | Tạo đơn hàng thành công | Người mua đặt đơn mua sản phẩm thành công | 1 | `order:178` |
| 19 | 400 | Admin cần chỉ định customerId ⚠ | Admin gửi tin hỗ trợ nhưng chưa chọn khách hàng | 1 | `support_chat:41` |
| 20 | 400 | Bạn chưa được phân công đơn giao này | Shipper cập nhật đơn giao không thuộc phân công của mình | 1 | `order:296` |
| 21 | 400 | Bạn đã đánh giá sản phẩm này rồi | Chặn đánh giá trùng cho cùng một sản phẩm | 1 | `review:74` |
| 22 | 400 | Cần ít nhất 1 bằng chứng | Thêm bằng chứng vào báo cáo nhưng danh sách rỗng | 1 | `report:293` |
| 23 | 400 | Chỉ có thể trả đồ khi đang trong quá trình thuê | Yêu cầu trả đồ khi hợp đồng chưa ở trạng thái đang thuê | 1 | `rental:457` |
| 24 | 400 | Chỉ được đánh giá sau khi bạn xác nhận đã nhận hàng (order: {orderStatus}, delivery: {deliveryStatus}) ⚠ | Đánh giá đơn mua khi người mua chưa xác nhận nhận hàng | 1 | `review:41` |
| 25 | 400 | Chỉ được đánh giá sau khi hợp đồng thuê đã hoàn tất | Đánh giá hợp đồng thuê khi chưa hoàn tất | 1 | `review:59` |
| 26 | 400 | Chỉ gia hạn được khi hợp đồng đang active hoặc đang thuê ⚠ | Gia hạn khi hợp đồng không ở trạng thái cho phép | 1 | `rental:545` |
| 27 | 400 | Chỉ hủy được yêu cầu đang chờ xác nhận | Hủy yêu cầu thuê đã được duyệt hoặc từ chối trước đó | 1 | `rental:362` |
| 28 | 400 | Chỉ xử lý cọc khi đồ đã được trả hoặc đang tranh chấp | Xử lý cọc khi đồ chưa được trả và không có tranh chấp | 1 | `rental:500` |
| 29 | 400 | Đã có yêu cầu gia hạn đang chờ chủ đồ xác nhận | Người thuê gửi yêu cầu gia hạn thứ hai khi cái trước còn chờ | 1 | `rental:552` |
| 30 | 400 | Đơn giao này đã có shipper nhận | Shipper nhận đơn đã bị shipper khác nhận trước | 1 | `order:349` |
| 31 | 400 | Đơn hàng chưa ở giai đoạn có thể hoàn tất | Người mua bấm hoàn tất khi đơn chưa giao xong | 1 | `order:307` |
| 32 | 400 | Đơn hàng không còn ở trạng thái chờ xác nhận | Người bán xác nhận đơn đã được xử lý trước đó | 1 | `order:287` |
| 33 | 400 | Email đã được sử dụng | Đăng ký bằng email đã tồn tại trong hệ thống | 1 | `auth:25` |
| 34 | 400 | Hợp đồng không khả dụng để gia hạn | Gia hạn hợp đồng đã kết thúc hoặc đã hủy | 1 | `rental:542` |
| 35 | 400 | Hợp đồng không ở trạng thái chờ nhận đồ | Xác nhận nhận đồ khi hợp đồng chưa tới bước giao | 1 | `rental:389` |
| 36 | 400 | Không có yêu cầu gia hạn đang chờ | Chủ đồ xác nhận gia hạn khi không có yêu cầu nào chờ | 1 | `rental:606` |
| 37 | 400 | Không thể gia hạn vì đã có lịch thuê khác trong khoảng này | Khoảng gia hạn trùng với lịch thuê khác của sản phẩm | 1 | `rental:559` |
| 38 | 400 | Không thể hủy vì đơn đã bắt đầu giao | Hủy đơn khi shipper đã bắt đầu giao | 1 | `order:272` |
| 39 | 400 | Không thể thuê sản phẩm của chính mình | Chủ sở hữu tự thuê sản phẩm của chính mình | 1 | `rental:121` |
| 40 | 400 | Không tìm thấy chủ sản phẩm | Bài đăng thiếu thông tin chủ sở hữu | 1 | `rental:118` |
| 41 | 400 | Mật khẩu hiện tại không đúng | Đổi mật khẩu nhưng nhập sai mật khẩu hiện tại | 1 | `auth:226` |
| 42 | 400 | Mức vi phạm không hợp lệ (warning/minor/major) ⚠ | Admin trừ điểm với mức vi phạm ngoài danh sách cho phép | 1 | `reputation:63` |
| 43 | 400 | Ngày bắt đầu không được trong quá khứ | Ngày bắt đầu thuê nằm trong quá khứ | 1 | `rental:133` |
| 44 | 400 | Ngày kết thúc phải sau ngày bắt đầu | Ngày kết thúc thuê không sau ngày bắt đầu | 1 | `rental:128` |
| 45 | 400 | Ngày không hợp lệ | Ngày thuê sai định dạng, không đọc được | 1 | `rental:126` |
| 46 | 400 | Nội dung không được rỗng ⚠ | Gửi tin nhắn hỗ trợ với nội dung rỗng | 1 | `support_chat:47` |
| 47 | 400 | Nội dung tin nhắn không được trống ⚠ | Gửi tin nhắn chat với nội dung rỗng | 1 | `chat:137` |
| 48 | 400 | OTP không hợp lệ hoặc đã hết hạn | Nhập sai hoặc quá hạn OTP khi xác thực email / đặt lại mật khẩu | 2 | `auth:57`, `auth:199` |
| 49 | 400 | Sản phẩm chưa được duyệt hoặc không khả dụng | Thuê sản phẩm chưa được admin duyệt hoặc đã ẩn | 1 | `rental:111` |
| 50 | 400 | Sản phẩm đã hết lịch thuê trong khoảng thời gian này | Khoảng ngày muốn thuê đã có người thuê trước | 1 | `rental:137` |
| 51 | 400 | Sản phẩm hiện không đủ số lượng để mua | Tồn kho ít hơn số lượng người mua đặt | 1 | `order:149` |
| 52 | 400 | Sản phẩm này không cho thuê | Sản phẩm chỉ đăng để bán, không cho thuê | 1 | `rental:113` |
| 53 | 400 | Số ngày gia hạn không hợp lệ (phải >= 1) ⚠ | Số ngày gia hạn nhỏ hơn 1 | 1 | `rental:538` |
| 54 | 400 | Status không hợp lệ ⚠ | Admin xử lý báo cáo với trạng thái ngoài danh sách | 1 | `report:199` |
| 55 | 400 | Thiếu credential ⚠ | Đăng nhập Google nhưng không gửi kèm ID token | 1 | `auth:97` |
| 56 | 400 | Thiếu email hoặc OTP ⚠ | Xác thực email nhưng thiếu email hoặc mã OTP | 1 | `auth:53` |
| 57 | 400 | Thiếu otherUserId hoặc postId ⚠ | Tạo phòng chat nhưng thiếu người nhận hoặc bài đăng | 1 | `chat:12` |
| 58 | 400 | Thiếu thông tin bắt buộc ⚠ | Tạo báo cáo / đánh giá / trừ điểm thiếu trường bắt buộc | 3 | `report:39`, `reputation:58`, `review:23` |
| 59 | 400 | Thiếu thông tin đặt hàng ⚠ | Đặt hàng thiếu sản phẩm hoặc địa chỉ nhận | 1 | `order:137` |
| 60 | 400 | Trạng thái không hợp lệ | Cập nhật đơn hàng sang trạng thái không tồn tại | 1 | `order:317` |
| 61 | 400 | Vui lòng điền đầy đủ thông tin | Đăng ký / đặt lại / đổi mật khẩu bỏ trống trường bắt buộc | 3 | `auth:20`, `auth:195`, `auth:221` |
| 62 | 400 | Yêu cầu không còn ở trạng thái chờ | Chủ đồ duyệt hoặc từ chối yêu cầu thuê đã xử lý rồi | 2 | `rental:273`, `rental:333` |
| 63 | 401 | Email Google chưa được xác minh | Tài khoản Google chưa xác minh email | 1 | `auth:102` |
| 64 | 401 | Email hoặc mật khẩu không đúng | Đăng nhập sai email hoặc mật khẩu — cố tình mơ hồ theo BR-13 | 1 | `auth:79` |
| 65 | 401 | Token Google không hợp lệ | Xác thực ID token Google thất bại | 1 | `auth:134` |
| 66 | 403 | Bạn không có quyền cập nhật đơn hàng này | Cập nhật đơn hàng không phải của mình | 1 | `order:262` |
| 67 | 403 | Bạn không có quyền tạo biên bản kiểm tra | Lập biên bản kiểm tra khi không phải shipper phụ trách | 1 | `order:389` |
| 68 | 403 | Bạn không có quyền truy cập phòng chat này | Mở phòng chat mà mình không phải thành viên | 1 | `chat:96` |
| 69 | 403 | Bạn không có quyền xem đơn hàng này | Xem đơn hàng không phải người mua / bán / shipper của đơn | 1 | `order:221` |
| 70 | 403 | Bạn không phải người mua của đơn hàng này | Đánh giá đơn hàng của người khác | 1 | `review:36` |
| 71 | 403 | Bạn không phải người thuê của hợp đồng này | Đánh giá hợp đồng thuê của người khác | 1 | `review:56` |
| 72 | 403 | Chỉ chủ đồ mới có thể xác nhận gia hạn | Người thuê tự xác nhận gia hạn thay chủ đồ | 1 | `rental:603` |
| 73 | 403 | Chỉ người bán mới có thể xác nhận đơn | Người khác người bán bấm xác nhận đơn | 1 | `order:284` |
| 74 | 403 | Chỉ người mua hoặc người bán mới có thể hủy đơn | Shipper hoặc admin bấm hủy đơn thay người mua / bán | 1 | `order:269` |
| 75 | 403 | Chỉ người mua mới có thể hoàn tất đơn | Người khác người mua bấm hoàn tất đơn | 1 | `order:304` |
| 76 | 403 | Chỉ người thuê mới có thể yêu cầu gia hạn | Chủ đồ tự gửi yêu cầu gia hạn thay người thuê | 1 | `rental:549` |
| 77 | 403 | Chỉ shipper mới có thể cập nhật tiến trình giao hàng | Người mua hoặc bán cập nhật tiến trình giao hàng | 1 | `order:293` |
| 78 | 403 | Không có quyền ⚠ | Thao tác trên hợp đồng thuê không thuộc về mình (5 nhánh) | 5 | `rental:271`, `rental:331`, `rental:360`, `rental:387`, `rental:454` |
| 79 | 403 | Không có quyền gửi tin nhắn ⚠ | Gửi tin nhắn vào phòng chat mà mình không thuộc | 1 | `chat:134` |
| 80 | 403 | Không có quyền thêm bằng chứng ⚠ | Thêm bằng chứng vào báo cáo do người khác tạo | 1 | `report:301` |
| 81 | 403 | Không có quyền xem ⚠ | Xem hợp đồng thuê mà mình không liên quan | 1 | `rental:204` |
| 82 | 403 | Không có quyền xử lý cọc ⚠ | Xử lý cọc khi không phải chủ đồ hoặc admin | 1 | `rental:497` |
| 83 | 403 | Tài khoản đã bị khóa do vi phạm | Đăng nhập bằng tài khoản đã bị khóa | 2 | `auth:83`, `auth:122` |
| 84 | 404 | Email không tồn tại trong hệ thống ⚠ | Quên mật khẩu / gửi lại OTP với email chưa đăng ký | 2 | `auth:173`, `auth:244` |
| 85 | 404 | Không tìm thấy ⚠ | Không tìm thấy phòng chat (admin xem) hoặc hợp đồng thuê | 3 | `chat:196`, `rental:197`, `rental:379` |
| 86 | 404 | Không tìm thấy báo cáo | Xem / xử lý / thêm bằng chứng cho báo cáo không tồn tại | 3 | `report:164`, `report:206`, `report:297` |
| 87 | 404 | Không tìm thấy delivery cho đơn hàng này ⚠ | Lập biên bản khi đơn hàng chưa có bản ghi giao hàng | 1 | `order:385` |
| 88 | 404 | Không tìm thấy đánh giá | Admin ẩn một đánh giá không tồn tại | 1 | `review:197` |
| 89 | 404 | Không tìm thấy đơn giao | Shipper nhận đơn giao không tồn tại | 1 | `order:345` |
| 90 | 404 | Không tìm thấy đơn hàng | Xem / cập nhật / đánh giá đơn hàng không tồn tại | 3 | `order:211`, `order:254`, `review:30` |
| 91 | 404 | Không tìm thấy hợp đồng ⚠ | Trả đồ / xử lý cọc / xác nhận gia hạn hợp đồng không tồn tại | 3 | `rental:451`, `rental:491`, `rental:599` |
| 92 | 404 | Không tìm thấy hợp đồng thuê | Đánh giá hợp đồng thuê không tồn tại | 1 | `review:51` |
| 93 | 404 | Không tìm thấy người dùng ⚠ | Xem hồ sơ, điểm uy tín hoặc quản lý user không tồn tại | 6 | `reputation:44`, `reputation:68`, `reputation:103`, `user:103`, `user:136`, `user:155` |
| 94 | 404 | Không tìm thấy phòng chat | Mở hoặc gửi tin vào phòng chat không tồn tại | 2 | `chat:91`, `chat:130` |
| 95 | 404 | Không tìm thấy sản phẩm | Tạo yêu cầu thuê cho bài đăng không tồn tại | 1 | `rental:109` |
| 96 | 404 | Không tìm thấy tài khoản ⚠ | Xác thực OTP / đặt lại mật khẩu với tài khoản không tồn tại | 4 | `auth:62`, `auth:142`, `auth:156`, `auth:204` |

### 16.1. Thống kê

| Nhóm | Số message | Ghi chú |
|---|---|---|
| 2xx — thành công | 17 | 15 mã `200`, 2 mã `201` |
| 400 — dữ liệu không hợp lệ | 44 | Nhóm lớn nhất |
| 401 — chưa xác thực | 3 | Toàn bộ ở `auth` |
| 403 — sai quyền | 18 | 5 câu chưa có xưng hô "Bạn" |
| 404 — không tìm thấy | 13 | 4 câu trùng nghĩa cần gom (§13.3) |
| **Tổng** | **95** | 124 vị trí gọi |

Về mức độ đạt chuẩn (tính theo 96 dòng của bảng trên):

| | Số dòng |
|---|---|
| Đạt chuẩn §4.6 | 70 |
| Lệch chuẩn ⚠ | 26 |

> Bảng §16 có **96 dòng** nhưng chỉ **95 message**: `reputation:87` sinh ra hai biến thể từ cùng một template literal (dòng 8 và 9), tính là 1 message.

| Module | Số message |
|---|---|
| `rental` | 32 |
| `order` | 19 |
| `auth` | 18 |
| `review` | 8 |
| `chat` | 6 |
| `report` | 5 |
| `reputation` | 3 |
| `support_chat` | 2 |
| `category` | 1 |
| `notification` | 1 |
