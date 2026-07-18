# Luồng màn hình Shipper - Website mua bán đồ cũ

## Mục tiêu

Thiết kế luồng nghiệp vụ cho ứng dụng Shipper trong hệ thống mua bán/trao đổi đồ cũ.

Điểm đặc biệt:

- Shipper kiểm tra sản phẩm trước khi nhận đơn.
- Biên bản kiểm tra nằm ngay trong màn hình chi tiết đơn hàng.
- Tất cả tiêu chí phải PASS mới được nhận hàng và giao hàng.
- Nếu có FAIL thì chuyển sang báo cáo sự cố cho Admin.

---

# Luồng tổng quát

```text
Danh sách đơn
      |
      v
Chi tiết đơn + Biên bản kiểm tra
      |
      +---------------- PASS ----------------+
      |                                     |
      v                                     v
Xác nhận nhận đơn                     Báo cáo sự cố
      |                                     |
      v                                     v
Đang giao                             Admin xử lý
      |
      v
Giao thành công
```

---

# Danh sách màn hình

Tổng số: **9 màn hình**

## 1. Đăng nhập

- Xác thực tài khoản shipper.
- Nhập email/số điện thoại.
- Nhập mật khẩu.

## 2. Dashboard

Hiển thị:

- Đơn mới.
- Đơn đang giao.
- Đơn hoàn thành.
- Thu nhập.

## 3. Danh sách đơn hàng

Các tab:

- Đơn mới.
- Đang giao.
- Hoàn thành.
- Sự cố.

Thông tin đơn:

- Ảnh sản phẩm.
- Tên sản phẩm.
- Giá.
- Khoảng cách.
- Người bán.
- Trạng thái.

## 4. Chi tiết đơn hàng + Biên bản kiểm tra

Đây là màn hình xử lý chính.

### Thông tin sản phẩm

- Ảnh sản phẩm.
- Tên sản phẩm.
- Danh mục.
- Thương hiệu.
- Model.
- Giá.
- Tình trạng.
- Mô tả.
- Phụ kiện.

### Người bán

- Họ tên.
- Số điện thoại.
- Địa chỉ lấy hàng.

### Người mua

- Họ tên.
- Số điện thoại.
- Địa chỉ giao hàng.

### Checklist kiểm tra

| Tiêu chí                | PASS | FAIL |
| ----------------------- | ---- | ---- |
| Đúng sản phẩm đăng bán  |      |      |
| Đúng thương hiệu/model  |      |      |
| Đúng tình trạng mô tả   |      |      |
| Đúng màu sắc/phiên bản  |      |      |
| Đủ phụ kiện             |      |      |
| Khớp hình ảnh đăng bán  |      |      |
| Không lỗi mới phát sinh |      |      |
| Hoạt động bình thường   |      |      |
| IMEI/Serial đúng        |      |      |

### Kết quả

PASS tất cả:

```
Xác nhận nhận đơn
→ RECEIVED
→ IN_DELIVERY
```

Có FAIL:

```
Báo cáo sự cố
→ INSPECTION_FAILED
```

## 5. Báo cáo sự cố

Bao gồm:

- Mã đơn.
- Lỗi phát hiện.
- Ảnh minh chứng.
- Ghi chú.

Gửi Admin xử lý.

## 6. Đang giao hàng

Hiển thị:

- Sản phẩm.
- Người nhận.
- Địa chỉ.
- Bản đồ.

Chức năng:

- Gọi khách.
- Chat.
- Xem đường đi.

## 7. Xác nhận giao hàng

Xác nhận bằng:

- OTP.
- Chữ ký.
- Xác nhận thủ công.

## 8. Hoàn thành đơn

Hiển thị:

- Mã đơn.
- Thời gian.
- Thu nhập.

Trạng thái:

```
DELIVERED
```

## 9. Tài khoản và lịch sử

Bao gồm:

- Hồ sơ shipper.
- Lịch sử đơn.
- Thu nhập.
- Cài đặt.

---

# Sơ đồ trạng thái

```text
NEW_ORDER
    |
ASSIGNED
    |
INSPECTION
    |
 +--------+
 |        |
PASS    FAIL
 |        |
 v        v
RECEIVED  INSPECTION_FAILED
 |
 v
IN_DELIVERY
 |
 v
DELIVERED
```

---

# Quy tắc nghiệp vụ

1. Không được bỏ qua bước kiểm tra.
2. Biên bản kiểm tra nằm trong chi tiết đơn.
3. 100% tiêu chí PASS mới được giao.
4. Chỉ cần một FAIL thì dừng luồng.
5. FAIL phải gửi báo cáo cho Admin.
6. Lưu lịch sử thay đổi trạng thái.
