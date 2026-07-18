# 📋 NHIỆM VỤ CỦA DUY ANH (NGƯỜI 3)

## 🎯 Tổng Quan

**Phụ trách:** Order, Delivery, Shipper, Seller Management  
**Module:** 5 modules chính  
**Tổng chức năng:** 58 chức năng

---

## 📦 MODULE 1: ORDER - ĐơN MUA HÀNG (14 chức năng)

### Mô tả
Quản lý toàn bộ quy trình đặt hàng từ khi người mua tạo đơn đến khi hoàn tất

### Danh sách chức năng

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | Người mua tạo đơn hàng | Chọn sản phẩm và đặt mua |
| 2 | Kiểm tra sản phẩm còn bán không | Chỉ đặt được sản phẩm trạng thái AVAILABLE |
| 3 | Lưu thông tin người mua | buyer_id |
| 4 | Lưu thông tin người bán | seller_id |
| 5 | Lưu thông tin sản phẩm | product_id |
| 6 | Tính tổng tiền đơn hàng | Giá sản phẩm + phí ship nếu có |
| 7 | Đơn hàng trạng thái PENDING | Chờ người bán xác nhận |
| 8 | Người bán xác nhận đơn | Chuyển sang SELLER_CONFIRMED |
| 9 | Người bán từ chối đơn | Chuyển sang CANCELLED |
| 10 | Hủy đơn hàng | Người mua/người bán hủy khi chưa giao |
| 11 | Xem danh sách đơn mua | Người mua xem đơn của mình |
| 12 | Xem danh sách đơn bán | Người bán xem đơn bán của mình |
| 13 | Xem chi tiết đơn hàng | Thông tin sản phẩm, buyer, seller, trạng thái |
| 14 | Hoàn tất đơn hàng | Khi người mua xác nhận nhận hàng |

### Trạng thái Order
- `PENDING` - Chờ người bán xác nhận
- `SELLER_CONFIRMED` - Người bán đã xác nhận
- `CANCELLED` - Đã hủy
- `COMPLETED` - Hoàn tất

---

## 👔 MODULE 2: SELLER MANAGEMENT - QUẢN LÝ SELLER (12 chức năng)

### Mô tả
Phân loại và quản lý Seller thường vs Seller Pro, giới hạn đăng bài, sản phẩm nổi bật

### Danh sách chức năng

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | Phân loại Seller | Chia thành NORMAL_SELLER và PRO_SELLER |
| 2 | Lưu loại Seller | Lưu seller_type của người bán |
| 3 | Seller thường đăng sản phẩm | Người bán cá nhân đăng bài bán đồ cũ |
| 4 | Giới hạn số lượng bài đăng Seller thường | Seller thường chỉ được đăng số lượng bài quy định trong 1 tháng |
| 5 | Kiểm tra giới hạn bài đăng | Kiểm tra số lượng bài đã đăng trước khi tạo bài mới |
| 6 | Từ chối đăng bài khi vượt giới hạn | Yêu cầu nâng cấp lên Seller Pro |
| 7 | Seller Pro đăng sản phẩm | Cho phép đăng sản phẩm bán |
| 8 | Không giới hạn bài đăng Seller Pro | Seller Pro được đăng sản phẩm không giới hạn |
| 9 | Quản lý sản phẩm Seller Pro | Quản lý nhiều sản phẩm đang bán |
| 10 | Chọn sản phẩm nổi bật | Seller Pro được chọn tối đa 3 sản phẩm nổi bật |
| 11 | Hiển thị sản phẩm nổi bật | Ưu tiên hiển thị sản phẩm được chọn |
| 12 | Cập nhật sản phẩm nổi bật | Seller Pro thay đổi danh sách 3 sản phẩm nổi bật |

### Phân loại Seller

#### NORMAL_SELLER (Seller thường)
- ❌ Có giới hạn số bài đăng trong 1 tháng (ví dụ: 5 bài)
- ❌ Không có sản phẩm nổi bật
- 💰 Miễn phí

#### PRO_SELLER (Seller Pro)
- ✅ Không giới hạn số bài đăng
- ✅ Được chọn 3 sản phẩm nổi bật
- ✅ Sản phẩm hiển thị ưu tiên trên trang chủ
- 💰 Trả phí gói Pro

---

## 🚚 MODULE 3: DELIVERY - GIAO HÀNG (12 chức năng)

### Mô tả
Quản lý quy trình giao hàng từ khi tạo đơn giao đến khi hoàn tất

### Danh sách chức năng

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | Tạo đơn giao hàng | Sau khi seller xác nhận |
| 2 | Đơn giao hàng chờ shipper nhận | Trạng thái WAITING_SHIPPER |
| 3 | Shipper xem danh sách đơn cần giao | List đơn giao hàng |
| 4 | Shipper nhận đơn | Chuyển sang SHIPPER_ACCEPTED |
| 5 | Shipper đến lấy hàng | Chuyển sang PICKING_UP |
| 6 | Shipper xác nhận đã nhận hàng | Chuyển sang PICKED_UP |
| 7 | Shipper giao hàng cho người mua | Chuyển sang DELIVERING |
| 8 | Người mua xác nhận nhận hàng | Chuyển sang DELIVERED |
| 9 | Hoàn tất giao hàng | Delivery COMPLETED |
| 10 | Cập nhật trạng thái giao hàng | Theo từng bước |
| 11 | Lưu lịch sử trạng thái giao hàng | Ghi thời gian thay đổi trạng thái |
| 12 | Xử lý giao hàng thất bại | Người mua không nhận, sai địa chỉ, không liên hệ được |

### Trạng thái Delivery
1. `WAITING_SHIPPER` - Chờ shipper nhận đơn
2. `SHIPPER_ACCEPTED` - Shipper đã nhận đơn
3. `PICKING_UP` - Shipper đang đi lấy hàng
4. `PICKED_UP` - Shipper đã nhận hàng
5. `DELIVERING` - Đang giao hàng
6. `DELIVERED` - Đã giao hàng
7. `COMPLETED` - Hoàn tất
8. `FAILED` - Thất bại

---

## 🔍 MODULE 4: SHIPPER INSPECTION - KIỂM TRA SẢN PHẨM (13 chức năng)

### Mô tả
Shipper kiểm tra sản phẩm khi lấy hàng, tạo biên bản, chụp ảnh bằng chứng

### Danh sách chức năng

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | Shipper kiểm tra đúng sản phẩm | So với bài đăng |
| 2 | Kiểm tra đúng hình ảnh | So sánh sản phẩm thật với ảnh |
| 3 | Kiểm tra đúng model | Ví dụ đúng đời máy, mã sản phẩm |
| 4 | Kiểm tra đúng tình trạng | Cũ/mới/lỗi như mô tả |
| 5 | Kiểm tra phụ kiện đi kèm | Sạc, dây, hộp, phụ kiện |
| 6 | Chụp ảnh mặt trước | Lưu bằng chứng |
| 7 | Chụp ảnh mặt sau | Lưu bằng chứng |
| 8 | Chụp ảnh phụ kiện | Lưu bằng chứng |
| 9 | Ghi chú kiểm tra | Ghi nhận tình trạng thực tế |
| 10 | Tạo biên bản kiểm tra | Lưu lại kết quả inspection |
| 11 | Báo lỗi nếu sản phẩm sai mô tả | Ghi nhận lỗi thuộc seller |
| 12 | Báo lỗi nếu shipper làm hỏng | Ghi nhận lỗi thuộc shipper |
| 13 | Admin xem biên bản shipper | Dùng khi có tranh chấp |

### Nội dung Inspection
- ✅ Sản phẩm đúng với mô tả
- ✅ Hình ảnh khớp với bài đăng
- ✅ Model/mã sản phẩm đúng
- ✅ Tình trạng như quảng cáo
- ✅ Phụ kiện đầy đủ
- 📸 Ảnh bằng chứng (trước, sau, phụ kiện)
- 📝 Ghi chú chi tiết

---

## 👨‍💼 MODULE 5: SHIPPER MANAGEMENT - QUẢN LÝ SHIPPER (7 chức năng)

### Mô tả
Quản lý hoạt động của shipper trong hệ thống

### Danh sách chức năng

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | Shipper xem đơn được phép nhận | Chỉ thấy đơn đang chờ |
| 2 | Shipper nhận đơn giao hàng | Nhận task giao |
| 3 | Shipper xem đơn đang giao | Danh sách đơn của mình |
| 4 | Shipper cập nhật tiến trình | Đã lấy hàng, đang giao, đã giao |
| 5 | Shipper báo cáo vấn đề | Hàng lỗi, người mua không nhận, người bán không giao |
| 6 | Admin xem danh sách shipper | Quản lý đội giao hàng |
| 7 | Admin khóa/mở tài khoản shipper | Nếu shipper vi phạm |

---

## 📊 TỔNG KẾT

### Thống kê theo Module

| Module | Số chức năng | Độ ưu tiên |
|--------|--------------|------------|
| **Order** | 14 | 🔴 Cao nhất |
| **Seller Management** | 12 | 🟠 Cao |
| **Delivery** | 12 | 🔴 Cao nhất |
| **Shipper Inspection** | 13 | 🟡 Trung bình |
| **Shipper Management** | 7 | 🟡 Trung bình |
| **TỔNG** | **58 chức năng** | |

---

## 🎯 CHỨC NĂNG MVP BẮT BUỘC

### Phase 1: Core (Bắt buộc phải có)
1. ✅ Tạo đơn hàng (Order)
2. ✅ Seller xác nhận đơn
3. ✅ Tạo đơn giao hàng (Delivery)
4. ✅ Shipper nhận đơn
5. ✅ Shipper kiểm tra sản phẩm (Inspection)
6. ✅ Giao hàng và hoàn tất
7. ✅ Phân loại NORMAL_SELLER vs PRO_SELLER
8. ✅ Giới hạn bài đăng Seller thường

### Phase 2: Enhanced (Nâng cao)
1. 🔵 Chọn 3 sản phẩm nổi bật (Pro)
2. 🔵 Hiển thị sản phẩm nổi bật ưu tiên
3. 🔵 Báo cáo vấn đề Shipper
4. 🔵 Lịch sử trạng thái chi tiết
5. 🔵 Xử lý giao hàng thất bại

---

## 🔄 LUỒNG XỬ LÝ CHÍNH

### Luồng Order → Delivery → Inspection

```
1. Buyer tạo Order (PENDING)
   ↓
2. Seller xác nhận (SELLER_CONFIRMED)
   ↓
3. Tạo Delivery (WAITING_SHIPPER)
   ↓
4. Shipper nhận đơn (SHIPPER_ACCEPTED)
   ↓
5. Shipper đến lấy hàng (PICKING_UP)
   ↓
6. Shipper kiểm tra & chụp ảnh (Inspection)
   ↓
7. Shipper xác nhận lấy hàng (PICKED_UP)
   ↓
8. Shipper giao hàng (DELIVERING)
   ↓
9. Buyer xác nhận nhận hàng (DELIVERED)
   ↓
10. Hoàn tất (COMPLETED)
```

### Luồng Seller thường → Seller Pro

```
1. User đăng ký → NORMAL_SELLER (mặc định)
   ↓
2. Đăng bài → Kiểm tra giới hạn (5 bài/tháng)
   ↓
3. Vượt giới hạn → Yêu cầu nâng cấp Pro
   ↓
4. Mua gói Pro → PRO_SELLER
   ↓
5. Chọn 3 sản phẩm nổi bật
   ↓
6. Sản phẩm hiển thị ưu tiên trên trang chủ
```

---

## 📁 CẤU TRÚC DATABASE (Tham khảo)

### Order Model
```javascript
{
  buyer_id: ObjectId,
  seller_id: ObjectId,
  product_id: ObjectId,
  total_amount: Number,
  status: String, // PENDING, SELLER_CONFIRMED, CANCELLED, COMPLETED
  created_at: Date,
  updated_at: Date
}
```

### Delivery Model
```javascript
{
  order_id: ObjectId,
  shipper_id: ObjectId,
  status: String, // WAITING_SHIPPER, SHIPPER_ACCEPTED, PICKING_UP, PICKED_UP, DELIVERING, DELIVERED, COMPLETED
  pickup_address: String,
  delivery_address: String,
  created_at: Date,
  updated_at: Date
}
```

### Inspection Model
```javascript
{
  delivery_id: ObjectId,
  shipper_id: ObjectId,
  product_match: Boolean,
  condition_match: Boolean,
  accessories_complete: Boolean,
  images: [String], // URLs
  notes: String,
  issue_type: String, // null, 'seller_fault', 'shipper_fault'
  created_at: Date
}
```

### User Model (Seller fields)
```javascript
{
  // ... other user fields
  seller_type: String, // 'NORMAL_SELLER', 'PRO_SELLER'
  post_limit: Number, // Số bài đã đăng trong tháng
  featured_products: [ObjectId], // Tối đa 3 sản phẩm (chỉ Pro)
  pro_expiry_date: Date // Ngày hết hạn gói Pro
}
```

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Multer (upload ảnh inspection)

### Frontend
- React.js
- Axios
- React Router
- Context API / Redux

---

## 📝 GHI CHÚ QUAN TRỌNG

1. **Seller Management là chức năng MỚI** - cần tích hợp với module Product của Sơn
2. **Inspection phải có ảnh** - bắt buộc chụp trước/sau/phụ kiện
3. **Trạng thái Delivery phải theo đúng thứ tự** - không được nhảy bước
4. **Pro Seller** - kết nối với Subscription module (payment)
5. **Giới hạn 5 bài/tháng** cho Seller thường - có thể config sau
6. **Featured products tối đa 3** - Seller Pro chọn được

---

## ✅ CHECKLIST HOÀN THÀNH

### Order Module
- [ ] API tạo đơn hàng
- [ ] API kiểm tra sản phẩm available
- [ ] API seller xác nhận/từ chối đơn
- [ ] API xem danh sách đơn (buyer/seller)
- [ ] API xem chi tiết đơn
- [ ] API hủy đơn
- [ ] UI tạo đơn hàng
- [ ] UI danh sách đơn mua/bán
- [ ] UI chi tiết đơn hàng

### Seller Management Module
- [ ] API phân loại seller (normal/pro)
- [ ] API kiểm tra giới hạn bài đăng
- [ ] API chọn sản phẩm nổi bật (Pro)
- [ ] API cập nhật featured products
- [ ] Logic từ chối đăng bài khi vượt giới hạn
- [ ] UI trang quản lý sản phẩm Pro
- [ ] UI chọn 3 sản phẩm nổi bật
- [ ] UI hiển thị featured products ưu tiên

### Delivery Module
- [ ] API tạo đơn giao hàng
- [ ] API shipper xem đơn cần giao
- [ ] API shipper nhận đơn
- [ ] API cập nhật trạng thái delivery
- [ ] API lưu lịch sử trạng thái
- [ ] UI danh sách đơn cần giao (Shipper)
- [ ] UI cập nhật trạng thái giao hàng
- [ ] UI tracking đơn hàng (Buyer/Seller)

### Inspection Module
- [ ] API tạo inspection
- [ ] API upload ảnh inspection
- [ ] API báo lỗi (seller/shipper fault)
- [ ] API admin xem biên bản
- [ ] UI form kiểm tra sản phẩm (Shipper)
- [ ] UI chụp/upload ảnh
- [ ] UI ghi chú và submit biên bản
- [ ] UI xem biên bản (Admin)

### Shipper Management Module
- [ ] API shipper xem đơn của mình
- [ ] API shipper báo cáo vấn đề
- [ ] API admin xem danh sách shipper
- [ ] API admin khóa/mở shipper
- [ ] UI dashboard shipper
- [ ] UI báo cáo vấn đề
- [ ] UI quản lý shipper (Admin)

---

**Người phụ trách:** Duy Anh (Người 3)  
**Tổng số chức năng:** 58 chức năng  
**Độ ưu tiên:** Cao (liên quan trực tiếp đến doanh thu)  
**Ước tính thời gian:** 6-8 tuần  
**Phụ thuộc:** Module Product (Sơn), Module Subscription (Payment)
