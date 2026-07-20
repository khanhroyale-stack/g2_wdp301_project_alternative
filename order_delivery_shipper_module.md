# ORDER - DELIVERY - SHIPPER MODULE SPECIFICATION

## 1. Tổng quan

Module này chịu trách nhiệm quản lý toàn bộ quy trình mua bán và giao nhận sản phẩm trong hệ thống.

Bao gồm 4 phần chính:

1. Order Management
2. Delivery Management
3. Product Inspection
4. Shipper Management

---

# 2. Order Management

## Mục tiêu

Quản lý vòng đời của một đơn hàng từ khi người mua đặt hàng cho đến khi hoàn tất giao dịch.

---

## 2.1 Luồng nghiệp vụ

### Bước 1: Người mua tạo đơn hàng

Điều kiện:

- Sản phẩm tồn tại
- Product Status = AVAILABLE

Hệ thống thực hiện:

- Lấy buyer_id
- Lấy seller_id
- Lấy product_id
- Tính tổng tiền

```text
total_amount = product_price + shipping_fee
```

Tạo Order:

```text
status = PENDING
```

---

### Bước 2: Người bán xử lý đơn

Người bán có thể:

#### Xác nhận đơn

```text
PENDING
→ SELLER_CONFIRMED
```

#### Từ chối đơn

```text
PENDING
→ CANCELLED
```

---

### Bước 3: Hủy đơn hàng

Cho phép:

- Buyer hủy
- Seller hủy

Điều kiện:

```text
Delivery chưa bắt đầu
```

Trạng thái:

```text
→ CANCELLED
```

---

### Bước 4: Hoàn tất đơn hàng

Sau khi giao hàng thành công:

```text
DELIVERED
→ COMPLETED
```

---

## 2.2 Order Status

| Status           | Ý nghĩa                |
| ---------------- | ---------------------- |
| PENDING          | Chờ người bán xác nhận |
| SELLER_CONFIRMED | Người bán đã xác nhận  |
| CANCELLED        | Đã hủy                 |
| DELIVERING       | Đang giao              |
| DELIVERED        | Đã giao                |
| COMPLETED        | Hoàn tất               |

---

## 2.3 Chức năng Order

### Buyer

- Tạo đơn hàng
- Hủy đơn hàng
- Xem danh sách đơn mua
- Xem chi tiết đơn hàng
- Xác nhận đã nhận hàng

### Seller

- Xem đơn bán
- Xác nhận đơn
- Từ chối đơn
- Hủy đơn

---

# 3. Delivery Management

## Mục tiêu

Quản lý toàn bộ quá trình giao hàng từ khi seller xác nhận đến khi buyer nhận hàng.

---

## 3.1 Luồng giao hàng

### Bước 1

Seller xác nhận Order

Hệ thống tạo Delivery:

```text
WAITING_SHIPPER
```

---

### Bước 2

Shipper xem danh sách đơn cần giao.

---

### Bước 3

Shipper nhận đơn.

```text
WAITING_SHIPPER
→ SHIPPER_ACCEPTED
```

---

### Bước 4

Shipper đến lấy hàng.

```text
SHIPPER_ACCEPTED
→ PICKING_UP
```

---

### Bước 5

Shipper nhận hàng thành công.

```text
PICKING_UP
→ PICKED_UP
```

---

### Bước 6

Shipper bắt đầu giao.

```text
PICKED_UP
→ DELIVERING
```

---

### Bước 7

Buyer xác nhận nhận hàng.

```text
DELIVERING
→ DELIVERED
```

---

### Bước 8

Kết thúc giao hàng.

```text
DELIVERED
→ COMPLETED
```

---

## 3.2 Delivery Status

| Status           | Ý nghĩa            |
| ---------------- | ------------------ |
| WAITING_SHIPPER  | Chờ shipper nhận   |
| SHIPPER_ACCEPTED | Đã có shipper nhận |
| PICKING_UP       | Đang đến lấy hàng  |
| PICKED_UP        | Đã lấy hàng        |
| DELIVERING       | Đang giao          |
| DELIVERED        | Người mua đã nhận  |
| COMPLETED        | Hoàn tất           |
| FAILED           | Giao thất bại      |

---

## 3.3 Giao hàng thất bại

Các trường hợp:

- Buyer không nhận
- Sai địa chỉ
- Không liên lạc được
- Seller không giao hàng

Kết quả:

```text
status = FAILED
```

Lưu lý do thất bại.

---

## 3.4 Delivery History

Mỗi lần thay đổi trạng thái phải ghi log:

Ví dụ:

```text
WAITING_SHIPPER
2026-06-01 09:00

SHIPPER_ACCEPTED
2026-06-01 09:15

PICKED_UP
2026-06-01 10:00
```

Mục đích:

- Tracking
- Audit
- Giải quyết tranh chấp

---

# 4. Product Inspection

## Mục tiêu

Cho phép shipper kiểm tra sản phẩm trước khi giao.

---

## 4.1 Nội dung kiểm tra

### Kiểm tra thông tin

- Đúng sản phẩm
- Đúng model
- Đúng hình ảnh
- Đúng tình trạng
- Đúng phụ kiện

---

### Kiểm tra hình ảnh

Shipper phải chụp:

- Ảnh mặt trước
- Ảnh mặt sau
- Ảnh phụ kiện

Lưu vào hệ thống.

---

### Ghi chú

Ví dụ:

```text
Máy có trầy nhẹ góc phải
```

```text
Thiếu hộp gốc
```

---

## 4.2 Kết quả Inspection

### PASS

Sản phẩm đúng mô tả.

```text
inspection_result = PASSED
```

---

### FAILED

Sản phẩm sai mô tả.

```text
inspection_result = FAILED
```

---

## 4.3 Báo lỗi

### Seller Fault

Ví dụ:

- Sai model
- Sai cấu hình
- Thiếu phụ kiện

```text
fault_type = SELLER
```

---

### Shipper Fault

Ví dụ:

- Làm rơi sản phẩm
- Làm hỏng phụ kiện

```text
fault_type = SHIPPER
```

---

## 4.4 Inspection Report

Thông tin lưu:

- inspection_id
- delivery_id
- shipper_id
- inspection_result
- note
- images
- fault_type
- created_at

---

## 4.5 Admin

Admin có thể:

- Xem biên bản kiểm tra
- Tìm kiếm biên bản
- Giải quyết tranh chấp

---

# 5. Shipper Management

## Mục tiêu

Quản lý hoạt động của shipper trong hệ thống.

---

## 5.1 Chức năng Shipper

### Xem đơn chờ nhận

Điều kiện:

```text
delivery.status = WAITING_SHIPPER
```

---

### Nhận đơn

```text
WAITING_SHIPPER
→ SHIPPER_ACCEPTED
```

---

### Xem đơn đang giao

Bao gồm:

- Đang lấy hàng
- Đang giao hàng

---

### Cập nhật tiến trình

Các trạng thái:

- PICKING_UP
- PICKED_UP
- DELIVERING
- DELIVERED

---

### Báo cáo vấn đề

Ví dụ:

- Seller không giao hàng
- Buyer không nhận
- Hàng lỗi
- Không liên hệ được

---

## 5.2 Chức năng Admin

### Quản lý shipper

- Xem danh sách shipper
- Xem số đơn đã giao
- Xem lịch sử giao hàng

---

### Khóa tài khoản shipper

```text
status = BLOCKED
```

Shipper không thể nhận đơn mới.

---

### Mở khóa tài khoản shipper

```text
status = ACTIVE
```

Có thể tiếp tục nhận đơn.

---

# 6. Database Collections Đề Xuất

## Orders

```text
orders
```

Thông tin đơn hàng.

---

## Deliveries

```text
deliveries
```

Thông tin giao hàng.

---

## DeliveryHistories

```text
delivery_histories
```

Lưu lịch sử trạng thái giao hàng.

---

## Inspections

```text
inspections
```

Biên bản kiểm tra sản phẩm.

---

## Shippers

```text
shippers
```

Thông tin shipper.

---

## ShipperReports

```text
shipper_reports
```

Các báo cáo sự cố.

---

# 7. Quy trình tổng thể

```text
Buyer đặt hàng
        ↓
Order PENDING
        ↓
Seller xác nhận
        ↓
Order SELLER_CONFIRMED
        ↓
Tạo Delivery
        ↓
WAITING_SHIPPER
        ↓
Shipper nhận đơn
        ↓
Kiểm tra sản phẩm
        ↓
Lấy hàng
        ↓
Giao hàng
        ↓
Buyer xác nhận
        ↓
DELIVERED
        ↓
COMPLETED
```
