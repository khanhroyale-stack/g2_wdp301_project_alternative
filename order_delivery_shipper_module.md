# ORDER - DELIVERY - SHIPPER MODULE SPECIFICATION (UPDATED)

---

# 1. OVERVIEW

## Mục tiêu

Module này quản lý toàn bộ quy trình:

- Đăng sản phẩm bán hoặc cho thuê
- Kiểm duyệt sản phẩm
- Mua hàng
- Tạo đơn hàng
- Quản lý giao nhận
- Kiểm tra sản phẩm
- Quản lý shipper

---

## Vai trò hệ thống

### User

Một User có thể đồng thời là:

- Buyer
- Seller

Ví dụ:

- User A đăng bán iPhone → đóng vai Seller
- User A mua Macbook → đóng vai Buyer

Không cần tạo 2 loại tài khoản riêng biệt.

---

### Admin

Quản lý:

- Duyệt sản phẩm
- Từ chối sản phẩm
- Quản lý shipper
- Xử lý tranh chấp
- Xem báo cáo hệ thống

---

### Shipper

Phụ trách:

- Nhận đơn giao hàng
- Kiểm tra sản phẩm
- Giao hàng
- Cập nhật trạng thái giao hàng
- Báo cáo sự cố

---

# 2. PRODUCT LISTING MANAGEMENT

## Mục tiêu

Cho phép User đăng sản phẩm lên sàn để:

- Bán
- Cho thuê

Sản phẩm phải được Admin duyệt trước khi xuất hiện trên Marketplace.

---

# 2.1 Tạo bài đăng

User nhập:

- Tên sản phẩm
- Mô tả
- Danh mục
- Giá
- Hình ảnh
- Tình trạng sản phẩm

Loại bài đăng:

```text
SALE
```

hoặc

```text
RENT
```

---

Hệ thống tạo Product:

```text
status = PENDING
```

---

# 2.2 Admin duyệt sản phẩm

## Duyệt

```text
PENDING
→ APPROVED
```

Sản phẩm xuất hiện trên Marketplace.

---

## Từ chối

```text
PENDING
→ DENIED
```

Lưu:

```text
deny_reason
```

Ví dụ:

```text
Ảnh sản phẩm không rõ
```

```text
Thiếu mô tả
```

```text
Thông tin sai lệch
```

---

# 2.3 Product Status

| Status    | Meaning          |
| --------- | ---------------- |
| PENDING   | Chờ Admin duyệt  |
| APPROVED  | Đã được duyệt    |
| DENIED    | Bị từ chối       |
| AVAILABLE | Đang mở bán      |
| SOLD      | Đã bán           |
| RENTED    | Đang được thuê   |
| INACTIVE  | Người bán ẩn bài |

---

# 2.4 My Listings

Seller xem toàn bộ sản phẩm đã đăng.

Hiển thị:

- Tên sản phẩm
- Hình ảnh
- Giá
- Trạng thái

Ví dụ:

```text
Macbook M3

Status:
PENDING
```

---

```text
Canon R6

Status:
APPROVED
```

---

```text
iPhone 14 Pro

Status:
DENIED

Reason:
Thiếu hình ảnh mặt sau
```

---

# 3. MARKETPLACE

## Mục tiêu

Hiển thị tất cả sản phẩm đã được duyệt.

Điều kiện:

```text
status = APPROVED
```

hoặc

```text
status = AVAILABLE
```

---

# 3.1 Danh sách sản phẩm

Buyer có thể:

- Xem tất cả sản phẩm
- Tìm kiếm
- Lọc theo giá
- Lọc theo danh mục
- Lọc theo loại

Ví dụ:

```text
SALE
```

```text
RENT
```

---

# 3.2 Chi tiết sản phẩm

Hiển thị:

- Hình ảnh
- Tên sản phẩm
- Giá
- Mô tả
- Seller
- Loại bài đăng

---

# 3.3 Add To Cart

Buyer thêm sản phẩm vào giỏ hàng.

---

# 3.4 Buy Now

Buyer tạo đơn ngay lập tức.

---

# 4. CART MANAGEMENT

## Cart

Lưu các sản phẩm Buyer muốn mua.

---

## Chức năng

### Thêm vào giỏ

```text
Add To Cart
```

---

### Xóa khỏi giỏ

```text
Remove Item
```

---

### Checkout

Tạo Order từ Cart.

---

# 5. ORDER MANAGEMENT

## Mục tiêu

Quản lý vòng đời đơn hàng.

---

# 5.1 Tạo đơn hàng

Buyer:

```text
Buy Now
```

hoặc

```text
Checkout Cart
```

---

Hệ thống tạo:

```text
Order
```

---

Trạng thái:

```text
PENDING
```

---

Thông tin lưu:

- buyer_id
- seller_id
- product_id
- quantity
- unit_price
- shipping_fee
- total_amount

---

Công thức:

```text
total_amount = unit_price + shipping_fee
```

---

# 5.2 My Orders

Buyer xem:

- Danh sách đơn hàng
- Chi tiết đơn hàng
- Trạng thái đơn hàng
- Trạng thái giao hàng

---

# 5.3 Incoming Orders

Seller xem:

- Đơn hàng mới
- Đơn hàng đã xác nhận
- Đơn hàng đã giao

---

# 5.4 Seller xử lý đơn

## Chấp thuận

```text
PENDING
→ ACCEPTED
```

---

## Từ chối

```text
PENDING
→ CANCELLED
```

Lưu:

```text
cancel_reason
```

---

# 5.5 Buyer hủy đơn

Điều kiện:

```text
Delivery chưa bắt đầu
```

---

```text
PENDING
→ CANCELLED
```

---

# 5.6 Order Status

| Status     | Meaning      |
| ---------- | ------------ |
| PENDING    | Chờ xác nhận |
| ACCEPTED   | Đã xác nhận  |
| CANCELLED  | Đã hủy       |
| DELIVERING | Đang giao    |
| DELIVERED  | Đã giao      |
| COMPLETED  | Hoàn tất     |

---

# 6. DELIVERY MANAGEMENT

## Mục tiêu

Quản lý toàn bộ quá trình giao nhận.

---

# 6.1 Tạo Delivery

Khi:

```text
Order = ACCEPTED
```

---

Hệ thống tạo:

```text
Delivery
```

---

Trạng thái:

```text
WAITING_SHIPPER
```

---

# 6.2 Delivery Flow

```text
WAITING_SHIPPER
↓
SHIPPER_ACCEPTED
↓
PICKING_UP
↓
PICKED_UP
↓
DELIVERING
↓
DELIVERED
↓
COMPLETED
```

---

# 6.3 Delivery Status

| Status           | Meaning       |
| ---------------- | ------------- |
| WAITING_SHIPPER  | Chờ shipper   |
| SHIPPER_ACCEPTED | Đã nhận đơn   |
| PICKING_UP       | Đang lấy hàng |
| PICKED_UP        | Đã lấy hàng   |
| DELIVERING       | Đang giao     |
| DELIVERED        | Đã giao       |
| COMPLETED        | Hoàn tất      |
| FAILED           | Giao thất bại |

---

# 6.4 Delivery Failure

Ví dụ:

- Buyer không nhận
- Sai địa chỉ
- Không liên hệ được
- Seller không giao hàng

---

```text
status = FAILED
```

---

Lưu:

```text
failure_reason
```

---

# 6.5 Delivery History

Mỗi lần cập nhật trạng thái phải tạo log.

Ví dụ:

```text
WAITING_SHIPPER
2026-06-01 09:00
```

```text
SHIPPER_ACCEPTED
2026-06-01 09:15
```

```text
PICKED_UP
2026-06-01 10:00
```

---

# 7. PRODUCT INSPECTION

## Mục tiêu

Shipper kiểm tra sản phẩm trước khi giao.

---

# 7.1 Kiểm tra

- Đúng sản phẩm
- Đúng model
- Đúng ảnh
- Đúng phụ kiện
- Đúng tình trạng

---

# 7.2 Chụp ảnh

Bắt buộc:

- Mặt trước
- Mặt sau
- Phụ kiện

---

# 7.3 Ghi chú

Ví dụ:

```text
Máy có trầy nhẹ góc phải
```

```text
Thiếu hộp gốc
```

---

# 7.4 Kết quả

## PASSED

```text
inspection_result = PASSED
```

---

## FAILED

```text
inspection_result = FAILED
```

---

# 7.5 Fault Type

## Seller Fault

```text
SELLER
```

Ví dụ:

- Sai model
- Thiếu phụ kiện

---

## Shipper Fault

```text
SHIPPER
```

Ví dụ:

- Làm rơi sản phẩm
- Làm hỏng hàng

---

# 7.6 Inspection Report

Lưu:

- inspection_id
- delivery_id
- shipper_id
- inspection_result
- note
- images
- fault_type
- created_at

---

# 8. SHIPPER MANAGEMENT

## Chức năng Shipper

### Xem đơn chờ nhận

```text
WAITING_SHIPPER
```

---

### Nhận đơn

```text
WAITING_SHIPPER
→ SHIPPER_ACCEPTED
```

---

### Cập nhật trạng thái

```text
PICKING_UP
```

↓

```text
PICKED_UP
```

↓

```text
DELIVERING
```

↓

```text
DELIVERED
```

---

### Báo cáo sự cố

Tạo:

```text
Shipper Report
```

---

# 9. ADMIN MANAGEMENT

## Quản lý sản phẩm

### Xem sản phẩm chờ duyệt

```text
PENDING
```

---

### Duyệt

```text
APPROVED
```

---

### Từ chối

```text
DENIED
```

---

### Xem lý do từ chối

```text
deny_reason
```

---

## Quản lý Shipper

- Xem danh sách shipper
- Xem lịch sử giao hàng
- Khóa tài khoản
- Mở khóa tài khoản

---

# 10. DATABASE COLLECTIONS

```text
users
```

Thông tin người dùng

---

```text
products
```

Thông tin sản phẩm

---

```text
carts
```

Giỏ hàng

---

```text
cart_items
```

Chi tiết giỏ hàng

---

```text
orders
```

Đơn hàng

---

```text
order_items
```

Chi tiết đơn hàng

---

```text
deliveries
```

Thông tin giao hàng

---

```text
delivery_histories
```

Lịch sử giao hàng

---

```text
inspections
```

Biên bản kiểm tra

---

```text
shippers
```

Thông tin shipper

---

```text
shipper_reports
```

Báo cáo sự cố

---

```text
notifications
```

Thông báo hệ thống

---

# 11. OVERALL SYSTEM FLOW

```text
User đăng sản phẩm
        ↓
Product PENDING
        ↓
Admin duyệt
        ↓
Product APPROVED
        ↓
Marketplace
        ↓
Buyer xem sản phẩm
        ↓
Add To Cart / Buy Now
        ↓
Order PENDING
        ↓
Seller ACCEPTED
        ↓
Tạo Delivery
        ↓
WAITING_SHIPPER
        ↓
Shipper nhận đơn
        ↓
Inspection
        ↓
PICKING_UP
        ↓
PICKED_UP
        ↓
DELIVERING
        ↓
Buyer nhận hàng
        ↓
DELIVERED
        ↓
COMPLETED
```

# 12. MÀN HÌNH CẦN CÓ

## User

- Marketplace
- Product Detail
- Cart
- Checkout
- My Orders
- Order Detail
- My Listings
- Create Product Listing
- Edit Product Listing

---

## Seller

- Incoming Orders
- Order Detail
- Delivery Tracking

---

## Shipper

- Available Deliveries
- My Deliveries
- Delivery Detail
- Inspection Form
- Report Issue

---

## Admin

- Pending Products
- Product Approval
- Product Detail
- Shipper Management
- Inspection Reports
- Delivery Reports
