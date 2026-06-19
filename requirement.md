# Người 3: Order, Delivery, Shipper

## 1. Tổng quan nghiệp vụ

Module này xử lý toàn bộ quá trình từ lúc người mua đặt hàng cho đến khi shipper nhận đơn, kiểm tra sản phẩm, giao hàng và hoàn tất đơn hàng.

Luồng chính:

Buyer đặt hàng → Seller xác nhận → Tạo delivery → Shipper nhận đơn → Shipper lấy hàng → Shipper kiểm tra sản phẩm → Shipper giao hàng → Buyer xác nhận nhận hàng → Hoàn tất order và delivery.

---

# 2. Order — Đơn mua hàng

## 2.1. Mục đích

Order dùng để lưu thông tin giao dịch giữa người mua và người bán đối với một sản phẩm cụ thể.

## 2.2. Luồng tạo đơn hàng

### Bước 1: Buyer chọn sản phẩm

Người mua vào chi tiết sản phẩm và bấm nút:

`Đặt mua`

Hệ thống cần kiểm tra:

- Sản phẩm có tồn tại không
- Sản phẩm có trạng thái `AVAILABLE` không
- Người mua không được mua chính sản phẩm của mình
- Seller của sản phẩm vẫn còn hoạt động

Nếu hợp lệ thì cho tạo order.

---

### Bước 2: Tạo order

Khi tạo đơn, hệ thống lưu:

- `buyer_id`
- `seller_id`
- `product_id`
- `product_price`
- `shipping_fee`
- `total_amount`
- `status = PENDING`
- `created_at`

Công thức:

```txt
total_amount = product_price + shipping_fee
```

Trạng thái ban đầu của đơn hàng là:

```txt
PENDING
```

Ý nghĩa: Đơn đang chờ người bán xác nhận.

---

## 2.3. Seller xử lý đơn hàng

### Seller xác nhận đơn

Seller vào danh sách đơn bán và bấm:

`Xác nhận đơn`

Khi đó:

```txt
Order status: PENDING → SELLER_CONFIRMED
```

Sau khi seller xác nhận, hệ thống sẽ tạo một delivery mới.

---

### Seller từ chối đơn

Seller có thể từ chối nếu:

- Sản phẩm không còn bán
- Sản phẩm bị lỗi
- Seller không muốn bán nữa

Khi từ chối:

```txt
Order status: PENDING → CANCELLED
```

Đồng thời cần lưu lý do hủy nếu có.

---

## 2.4. Hủy đơn hàng

Buyer hoặc Seller có thể hủy đơn khi đơn chưa giao.

Có thể hủy khi order đang ở:

```txt
PENDING
SELLER_CONFIRMED
```

Không nên cho hủy khi:

```txt
DELIVERING
COMPLETED
```

Khi hủy:

```txt
Order status → CANCELLED
```

---

## 2.5. Buyer xác nhận nhận hàng

Sau khi shipper giao hàng thành công, buyer bấm:

`Đã nhận hàng`

Khi đó:

```txt
Order status → COMPLETED
Delivery status → DELIVERED / COMPLETED
Product status → SOLD
```

Đây là bước kết thúc giao dịch.

---

## 2.6. Các trạng thái Order

```txt
PENDING
SELLER_CONFIRMED
CANCELLED
DELIVERING
COMPLETED
```

Ý nghĩa:

- `PENDING`: Chờ seller xác nhận
- `SELLER_CONFIRMED`: Seller đã xác nhận bán
- `CANCELLED`: Đơn bị hủy
- `DELIVERING`: Đang trong quá trình giao hàng
- `COMPLETED`: Đơn đã hoàn tất

---

# 3. Delivery — Giao hàng

## 3.1. Mục đích

Delivery quản lý quá trình vận chuyển của một order sau khi seller đã xác nhận bán hàng.

Một order hợp lệ sẽ có một delivery tương ứng.

---

## 3.2. Khi nào tạo Delivery?

Delivery được tạo sau khi:

```txt
Order status = SELLER_CONFIRMED
```

Thông tin cần lưu:

- `order_id`
- `buyer_id`
- `seller_id`
- `shipper_id = null`
- `pickup_address`
- `delivery_address`
- `status = WAITING_SHIPPER`
- `created_at`

---

## 3.3. Shipper xem đơn chờ nhận

Shipper chỉ thấy các delivery có trạng thái:

```txt
WAITING_SHIPPER
```

Màn hình của shipper sẽ hiển thị:

- Mã đơn
- Tên sản phẩm
- Địa chỉ lấy hàng
- Địa chỉ giao hàng
- Phí ship nếu có
- Trạng thái đơn

Shipper bấm:

`Nhận đơn`

---

## 3.4. Shipper nhận đơn

Khi shipper nhận đơn:

```txt
Delivery status: WAITING_SHIPPER → SHIPPER_ACCEPTED
```

Đồng thời lưu:

```txt
shipper_id = id của shipper đang nhận
```

Từ lúc này, đơn chỉ thuộc về shipper đó.

---

## 3.5. Shipper đến lấy hàng

Khi shipper đang đi lấy hàng:

```txt
SHIPPER_ACCEPTED → PICKING_UP
```

Ý nghĩa: Shipper đã nhận task và đang đến chỗ seller lấy hàng.

---

## 3.6. Shipper xác nhận đã lấy hàng

Sau khi gặp seller và nhận sản phẩm:

```txt
PICKING_UP → PICKED_UP
```

Tại bước này shipper nên thực hiện inspection sản phẩm.

---

## 3.7. Shipper giao hàng

Sau khi đã lấy hàng và kiểm tra xong:

```txt
PICKED_UP → DELIVERING
```

Ý nghĩa: Shipper đang mang hàng đến cho buyer.

---

## 3.8. Buyer xác nhận nhận hàng

Khi buyer nhận được hàng:

```txt
DELIVERING → DELIVERED
```

Sau đó hệ thống có thể chuyển tiếp:

```txt
DELIVERED → COMPLETED
```

---

## 3.9. Giao hàng thất bại

Trường hợp thất bại:

- Buyer không nghe máy
- Sai địa chỉ
- Buyer từ chối nhận hàng
- Không liên hệ được buyer
- Sản phẩm bị lỗi khi giao
- Seller không giao hàng cho shipper

Khi đó:

```txt
Delivery status → FAILED
```

Cần lưu:

- `failure_reason`
- `failed_by`
- `failed_at`
- Ghi chú của shipper
- Ảnh bằng chứng nếu có

---

## 3.10. Các trạng thái Delivery

```txt
WAITING_SHIPPER
SHIPPER_ACCEPTED
PICKING_UP
PICKED_UP
DELIVERING
DELIVERED
COMPLETED
FAILED
```

Ý nghĩa:

- `WAITING_SHIPPER`: Đang chờ shipper nhận
- `SHIPPER_ACCEPTED`: Shipper đã nhận đơn
- `PICKING_UP`: Shipper đang đến lấy hàng
- `PICKED_UP`: Shipper đã lấy hàng
- `DELIVERING`: Shipper đang giao hàng
- `DELIVERED`: Buyer đã nhận hàng
- `COMPLETED`: Giao hàng hoàn tất
- `FAILED`: Giao hàng thất bại

---

# 4. Delivery Status History

## 4.1. Mục đích

Mỗi lần delivery đổi trạng thái, hệ thống cần lưu lịch sử để dễ kiểm tra và xử lý tranh chấp.

Ví dụ:

```txt
WAITING_SHIPPER lúc 10:00
SHIPPER_ACCEPTED lúc 10:15
PICKING_UP lúc 10:30
PICKED_UP lúc 11:00
DELIVERING lúc 11:15
DELIVERED lúc 12:00
COMPLETED lúc 12:05
```

---

## 4.2. Thông tin cần lưu

Mỗi bản ghi history gồm:

- `delivery_id`
- `old_status`
- `new_status`
- `changed_by`
- `changed_at`
- `note`

Ví dụ:

```json
{
  "delivery_id": "D001",
  "old_status": "PICKING_UP",
  "new_status": "PICKED_UP",
  "changed_by": "shipper_id",
  "changed_at": "2026-06-18T10:30:00",
  "note": "Shipper đã nhận hàng từ seller"
}
```

---

# 5. Shipper Inspection — Kiểm tra sản phẩm

## 5.1. Mục đích

Inspection dùng để shipper kiểm tra sản phẩm thật có đúng với bài đăng không trước khi giao cho buyer.

Việc này giúp giảm tranh chấp giữa buyer, seller và shipper.

---

## 5.2. Khi nào inspection diễn ra?

Inspection nên diễn ra sau khi:

```txt
Delivery status = PICKED_UP
```

Tức là shipper đã lấy được hàng từ seller.

---

## 5.3. Nội dung kiểm tra

Shipper cần kiểm tra:

### 1. Đúng sản phẩm

So sánh sản phẩm thật với bài đăng.

Ví dụ:

- Đúng điện thoại iPhone 12
- Đúng laptop Dell XPS
- Đúng máy ảnh Sony

---

### 2. Đúng hình ảnh

Kiểm tra sản phẩm thật có giống ảnh seller đăng không.

Nếu khác nhiều, shipper cần báo lỗi.

---

### 3. Đúng model

Ví dụ:

- iPhone 12 Pro Max, không phải iPhone 12 thường
- Dell XPS 13, không phải Dell Inspiron
- PS5 Slim, không phải PS5 Fat

---

### 4. Đúng tình trạng

So sánh tình trạng thật với mô tả.

Ví dụ seller ghi:

```txt
Máy đẹp 95%, không lỗi
```

Nhưng thực tế:

```txt
Màn hình nứt, pin chai, mất Face ID
```

Thì phải báo sai mô tả.

---

### 5. Phụ kiện đi kèm

Kiểm tra các phụ kiện seller cam kết:

- Sạc
- Cáp
- Hộp
- Tai nghe
- Túi đựng
- Hóa đơn
- Phụ kiện khác

---

## 5.4. Ảnh bằng chứng

Shipper cần chụp:

- Ảnh mặt trước
- Ảnh mặt sau
- Ảnh phụ kiện
- Ảnh lỗi nếu có

Các ảnh này lưu vào inspection record.

---

## 5.5. Kết quả inspection

Có thể có các kết quả:

```txt
PASSED
FAILED_SELLER_FAULT
FAILED_SHIPPER_FAULT
```

Ý nghĩa:

- `PASSED`: Sản phẩm đúng mô tả
- `FAILED_SELLER_FAULT`: Seller giao sai hoặc sản phẩm sai mô tả
- `FAILED_SHIPPER_FAULT`: Shipper làm hỏng sản phẩm

---

## 5.6. Nếu sản phẩm đúng mô tả

Nếu inspection đạt:

```txt
Inspection result = PASSED
Delivery tiếp tục sang DELIVERING
```

---

## 5.7. Nếu sản phẩm sai mô tả

Nếu sản phẩm sai mô tả:

```txt
Inspection result = FAILED_SELLER_FAULT
Delivery status = FAILED
Order status = CANCELLED hoặc DISPUTED
```

Hệ thống lưu lỗi thuộc seller.

Admin có thể xem biên bản để xử lý.

---

## 5.8. Nếu shipper làm hỏng sản phẩm

Nếu shipper làm hỏng sản phẩm:

```txt
Inspection result = FAILED_SHIPPER_FAULT
Delivery status = FAILED
Order status = DISPUTED
```

Hệ thống lưu lỗi thuộc shipper.

Admin xem biên bản để xử lý tranh chấp.

---

# 6. Shipper Management — Quản lý shipper

## 6.1. Shipper xem đơn được phép nhận

Shipper chỉ được xem các delivery đang ở trạng thái:

```txt
WAITING_SHIPPER
```

Không được xem đơn đã có shipper khác nhận.

---

## 6.2. Shipper nhận đơn giao hàng

Khi nhận đơn:

- Gán `shipper_id`
- Đổi trạng thái delivery
- Ghi lịch sử trạng thái

```txt
WAITING_SHIPPER → SHIPPER_ACCEPTED
```

---

## 6.3. Shipper xem đơn đang giao

Shipper xem các đơn có:

```txt
shipper_id = current_shipper_id
```

Và trạng thái thuộc:

```txt
SHIPPER_ACCEPTED
PICKING_UP
PICKED_UP
DELIVERING
```

---

## 6.4. Shipper cập nhật tiến trình

Shipper được phép cập nhật theo đúng thứ tự:

```txt
SHIPPER_ACCEPTED → PICKING_UP
PICKING_UP → PICKED_UP
PICKED_UP → DELIVERING
DELIVERING → DELIVERED
```

Không được nhảy trạng thái sai.

Ví dụ không được:

```txt
SHIPPER_ACCEPTED → DELIVERED
WAITING_SHIPPER → DELIVERING
```

---

## 6.5. Shipper báo cáo vấn đề

Shipper có thể báo cáo khi:

- Seller không giao hàng
- Buyer không nhận hàng
- Sản phẩm sai mô tả
- Không liên hệ được buyer
- Địa chỉ sai
- Hàng bị hỏng
- Có tranh chấp

Thông tin report gồm:

- `delivery_id`
- `shipper_id`
- `issue_type`
- `description`
- `images`
- `created_at`
- `status = OPEN`

Admin xử lý report sau.

---

## 6.6. Admin quản lý shipper

Admin có thể:

- Xem danh sách shipper
- Xem trạng thái tài khoản shipper
- Xem số đơn đã giao
- Xem số đơn thất bại
- Xem các report liên quan
- Khóa tài khoản shipper
- Mở lại tài khoản shipper

Trạng thái tài khoản shipper:

```txt
ACTIVE
LOCKED
```

Nếu shipper bị khóa thì không được nhận đơn mới.

---

# 7. Các màn hình cần có

## 7.1. Buyer Order Screens

### Màn hình chi tiết sản phẩm

Có:

- Ảnh sản phẩm
- Tên sản phẩm
- Giá
- Mô tả
- Tình trạng
- Thông tin seller
- Nút `Đặt mua`

---

### Màn hình tạo đơn hàng

Có:

- Thông tin sản phẩm
- Giá sản phẩm
- Phí ship
- Tổng tiền
- Địa chỉ nhận hàng
- Nút `Xác nhận đặt hàng`

---

### Màn hình đơn mua của tôi

Có:

- Danh sách order của buyer
- Mã đơn
- Tên sản phẩm
- Tổng tiền
- Trạng thái đơn
- Nút xem chi tiết

---

### Màn hình chi tiết đơn mua

Có:

- Thông tin sản phẩm
- Thông tin seller
- Thông tin shipper nếu có
- Trạng thái order
- Trạng thái delivery
- Lịch sử giao hàng
- Nút `Hủy đơn` nếu còn được hủy
- Nút `Đã nhận hàng` nếu hàng đã giao tới

---

## 7.2. Seller Order Screens

### Màn hình đơn bán của tôi

Có:

- Danh sách đơn người khác đặt sản phẩm của mình
- Buyer
- Sản phẩm
- Tổng tiền
- Trạng thái
- Nút xem chi tiết

---

### Màn hình chi tiết đơn bán

Có:

- Thông tin buyer
- Thông tin sản phẩm
- Địa chỉ lấy hàng
- Trạng thái order
- Nút `Xác nhận bán`
- Nút `Từ chối đơn`

---

## 7.3. Shipper Screens

### Màn hình đơn chờ nhận

Có:

- Danh sách delivery `WAITING_SHIPPER`
- Mã đơn
- Sản phẩm
- Địa chỉ lấy hàng
- Địa chỉ giao hàng
- Nút `Nhận đơn`

---

### Màn hình đơn đang giao của tôi

Có:

- Các đơn shipper đã nhận
- Trạng thái hiện tại
- Buyer
- Seller
- Sản phẩm
- Nút xem chi tiết

---

### Màn hình chi tiết delivery

Có:

- Thông tin order
- Thông tin sản phẩm
- Địa chỉ lấy hàng
- Địa chỉ giao hàng
- Số điện thoại buyer/seller nếu có
- Trạng thái delivery
- Nút cập nhật trạng thái tiếp theo

Ví dụ:

```txt
Nếu đang SHIPPER_ACCEPTED → hiện nút "Đang đến lấy hàng"
Nếu đang PICKING_UP → hiện nút "Đã lấy hàng"
Nếu đang PICKED_UP → hiện nút "Bắt đầu giao hàng"
Nếu đang DELIVERING → hiện nút "Đã giao hàng"
```

---

### Màn hình inspection sản phẩm

Có:

- Thông tin bài đăng sản phẩm
- Ảnh sản phẩm từ bài đăng
- Form kiểm tra:
  - Đúng sản phẩm?
  - Đúng hình ảnh?
  - Đúng model?
  - Đúng tình trạng?
  - Đủ phụ kiện?

- Upload ảnh:
  - Mặt trước
  - Mặt sau
  - Phụ kiện
  - Ảnh lỗi nếu có

- Ghi chú kiểm tra
- Kết quả:
  - Passed
  - Failed do seller
  - Failed do shipper

- Nút `Lưu biên bản kiểm tra`

---

### Màn hình báo cáo vấn đề

Có:

- Loại vấn đề
- Mô tả chi tiết
- Upload ảnh bằng chứng
- Nút `Gửi báo cáo`

---

## 7.4. Admin Screens

### Màn hình quản lý shipper

Có:

- Danh sách shipper
- Tên shipper
- Email/SĐT
- Trạng thái tài khoản
- Số đơn đã giao
- Số đơn thất bại
- Nút khóa/mở tài khoản

---

### Màn hình xem biên bản inspection

Có:

- Mã đơn
- Shipper
- Buyer
- Seller
- Sản phẩm
- Ảnh kiểm tra
- Ghi chú
- Kết quả inspection
- Lỗi thuộc ai

---

### Màn hình xử lý report

Có:

- Danh sách report
- Loại vấn đề
- Người báo cáo
- Delivery liên quan
- Mô tả
- Ảnh bằng chứng
- Trạng thái xử lý

---

# 8. Collection / Table đề xuất

## orders

```js
{
  (_id,
    buyer_id,
    seller_id,
    product_id,
    product_price,
    shipping_fee,
    total_amount,
    status,
    cancel_reason,
    created_at,
    updated_at);
}
```

---

## deliveries

```js
{
  (_id,
    order_id,
    buyer_id,
    seller_id,
    shipper_id,
    pickup_address,
    delivery_address,
    status,
    failure_reason,
    created_at,
    updated_at);
}
```

---

## delivery_status_histories

```js
{
  (_id, delivery_id, old_status, new_status, changed_by, note, created_at);
}
```

---

## shipper_inspections

```js
{
  (_id,
    delivery_id,
    order_id,
    shipper_id,
    product_id,
    is_correct_product,
    is_correct_image,
    is_correct_model,
    is_correct_condition,
    is_accessories_enough,
    front_image,
    back_image,
    accessories_images,
    issue_images,
    note,
    result,
    fault_by,
    created_at);
}
```

---

## shipper_reports

```js
{
  (_id,
    delivery_id,
    order_id,
    shipper_id,
    issue_type,
    description,
    images,
    status,
    created_at,
    resolved_at);
}
```

---

# 9. API cần làm

## Order APIs

```txt
POST   /orders
GET    /orders/buyer/:buyerId
GET    /orders/seller/:sellerId
GET    /orders/:orderId
PATCH  /orders/:orderId/seller-confirm
PATCH  /orders/:orderId/seller-reject
PATCH  /orders/:orderId/cancel
PATCH  /orders/:orderId/complete
```

---

## Delivery APIs

```txt
POST   /deliveries
GET    /deliveries/waiting-shipper
GET    /deliveries/shipper/:shipperId
GET    /deliveries/:deliveryId
PATCH  /deliveries/:deliveryId/accept
PATCH  /deliveries/:deliveryId/status
PATCH  /deliveries/:deliveryId/fail
```

---

## Inspection APIs

```txt
POST   /inspections
GET    /inspections/:inspectionId
GET    /inspections/delivery/:deliveryId
GET    /inspections/admin
```

---

## Shipper Report APIs

```txt
POST   /shipper-reports
GET    /shipper-reports
GET    /shipper-reports/:reportId
PATCH  /shipper-reports/:reportId/resolve
```

---

## Shipper Management APIs

```txt
GET    /admin/shippers
PATCH  /admin/shippers/:shipperId/lock
PATCH  /admin/shippers/:shipperId/unlock
```

---

# 10. Flow tổng hợp cuối cùng

```txt
1. Buyer chọn sản phẩm
2. Buyer tạo order
3. Hệ thống kiểm tra product AVAILABLE
4. Order được tạo với status PENDING
5. Seller xem đơn bán
6. Seller xác nhận đơn
7. Order chuyển SELLER_CONFIRMED
8. Hệ thống tạo delivery WAITING_SHIPPER
9. Shipper xem danh sách đơn chờ nhận
10. Shipper nhận đơn
11. Delivery chuyển SHIPPER_ACCEPTED
12. Shipper đến lấy hàng
13. Delivery chuyển PICKING_UP
14. Shipper nhận hàng từ seller
15. Delivery chuyển PICKED_UP
16. Shipper kiểm tra sản phẩm
17. Nếu sản phẩm đúng → Inspection PASSED
18. Shipper bắt đầu giao hàng
19. Delivery chuyển DELIVERING
20. Buyer nhận hàng
21. Buyer xác nhận đã nhận
22. Delivery chuyển DELIVERED / COMPLETED
23. Order chuyển COMPLETED
24. Product chuyển SOLD
```

---

# 11. Các case lỗi cần xử lý

## Case 1: Product không còn bán

Không cho buyer tạo order.

```txt
Product status != AVAILABLE → báo lỗi
```

---

## Case 2: Seller từ chối đơn

```txt
Order → CANCELLED
Không tạo delivery
```

---

## Case 3: Buyer hủy đơn trước khi giao

```txt
Order → CANCELLED
Delivery nếu đã tạo → CANCELLED hoặc FAILED
```

---

## Case 4: Shipper nhận đơn rồi seller không giao hàng

```txt
Delivery → FAILED
Report issue_type = SELLER_NOT_HANDOVER
```

---

## Case 5: Shipper kiểm tra thấy sản phẩm sai mô tả

```txt
Inspection → FAILED_SELLER_FAULT
Delivery → FAILED
Order → DISPUTED hoặc CANCELLED
```

---

## Case 6: Buyer không nhận hàng

```txt
Delivery → FAILED
Report issue_type = BUYER_NOT_RECEIVE
```

---

## Case 7: Shipper làm hỏng hàng

```txt
Inspection → FAILED_SHIPPER_FAULT
Delivery → FAILED
Order → DISPUTED
Admin xử lý
```

---

# 12. Phân quyền

## Buyer

Được phép:

- Tạo order
- Xem đơn mua của mình
- Hủy đơn khi chưa giao
- Xác nhận đã nhận hàng

Không được:

- Xác nhận đơn bán
- Nhận delivery
- Cập nhật trạng thái shipper

---

## Seller

Được phép:

- Xem đơn bán của mình
- Xác nhận đơn
- Từ chối đơn
- Hủy đơn khi chưa giao

Không được:

- Nhận đơn shipper
- Tự hoàn tất delivery

---

## Shipper

Được phép:

- Xem đơn chờ nhận
- Nhận delivery
- Cập nhật trạng thái giao hàng
- Tạo inspection
- Báo cáo vấn đề

Không được:

- Tạo order
- Xác nhận order thay seller
- Hoàn tất order thay buyer

---

## Admin

Được phép:

- Xem danh sách shipper
- Khóa/mở shipper
- Xem inspection
- Xem report
- Xử lý tranh chấp

---

# 13. Gợi ý thứ tự code

Nên làm theo thứ tự này:

```txt
1. Model Order
2. API tạo order
3. API seller xác nhận / từ chối order
4. Model Delivery
5. Tự động tạo delivery sau khi seller xác nhận
6. API shipper xem đơn chờ
7. API shipper nhận đơn
8. API cập nhật trạng thái delivery
9. Model delivery history
10. Tự động lưu history mỗi lần đổi trạng thái
11. Model inspection
12. API tạo inspection
13. API report vấn đề
14. API admin xem shipper / inspection / report
```

---

# 14. Kết luận nghiệp vụ

Phần của Người 3 là phần xử lý giao dịch sau khi có sản phẩm. Nhiệm vụ chính là đảm bảo đơn hàng đi đúng luồng:

```txt
Order hợp lệ → Seller xác nhận → Delivery được tạo → Shipper nhận → Kiểm tra sản phẩm → Giao hàng → Buyer xác nhận → Hoàn tất
```

Quan trọng nhất khi code là phải kiểm soát trạng thái thật chặt, không cho cập nhật sai thứ tự và luôn lưu lịch sử thay đổi trạng thái để dễ kiểm tra khi có tranh chấp.
