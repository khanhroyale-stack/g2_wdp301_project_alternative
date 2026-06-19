# EcoTrade - Walkthrough Testing Guide

## Tổng quan dự án

Dự án EcoTrade là hệ thống C2C để mua, bán và cho thuê đồ dùng cũ tại khu vực Hòa Lạc.

---

## 1. Chuẩn bị trước khi test

### 1.1 Cài đặt môi trường

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 1.2 Cấu hình biến môi trường

Tạo file `.env` trong thư mục `backend/` dựa trên `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CLOUDINARY_URL=cloudinary://...
```

### 1.3 Khởi động server

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Backend chạy tại: `http://localhost:5000`
Frontend chạy tại: `http://localhost:5173`

---

## 2. Người 2 - Product, Category, Post Approval

### 2.1 Chuẩn bị tài khoản test

- 1 tài khoản Admin
- 1 tài khoản User (để đăng bài)

### 2.2 Test Category Management (Quản lý danh mục)

**Bước 1: Đăng nhập Admin**

1. Mở trang: `http://localhost:5173/login`
2. Đăng nhập bằng tài khoản Admin

**Bước 2: Truy cập trang quản lý danh mục**

1. Vào menu Admin → Category Management
2. URL: `http://localhost:5173/admin/categories`

**Bước 3: Thêm danh mục mới**

1. Nhấn nút "Add Category"
2. Nhập tên danh mục (vd: "Đồ điện tử", "Xe đạp", "Sách", "Đồ gia dụng")
3. Nhập mô tả (nếu có)
4. Nhấn "Save"

**Kết quả mong đợi:**

- Danh mục mới hiển thị trong danh sách
- Thông báo thành công

**Bước 4: Sửa danh mục**

1. Chọn một danh mục → nhấn nút Edit
2. Thay đổi tên/mô tả
3. Lưu lại

**Kết quả mong đợi:**

- Thông tin được cập nhật

**Bước 5: Xóa/ẩn danh mục**

1. Chọn một danh mục → nhấn nút Delete/Disable
2. Xác nhận

**Kết quả mong đợi:**

- Danh mục không còn hiển thị trong danh sách select khi đăng bài

### 2.3 Test Product Post (Đăng bài sản phẩm)

**Bước 1: Đăng nhập User**

1. Đăng xuất Admin (nếu đang đăng nhập)
2. Đăng nhập bằng tài khoản User

**Bước 2: Đăng bài bán sản phẩm**

1. Nhấn nút "Sell/Post Product"
2. URL: `http://localhost:5173/product/create`
3. Điền thông tin:
   - Tên sản phẩm: "Laptop Dell XPS 13"
   - Danh mục: Chọn "Đồ điện tử"
   - Loại bài: "Bán"
   - Giá bán: 15000000
   - Mô tả: "Máy đẹp 95%, dùng 1 năm, còn bảo hành"
   - Tình trạng: "Đã dùng, còn tốt"
   - Vị trí: "Hòa Lạc"
   - Upload ảnh (ít nhất 1 ảnh)
4. Nhấn "Post"

**Kết quả mong đợi:**

- Bài đăng được tạo với trạng thái `PENDING`
- Thông báo thành công
- User thấy bài đăng trong "My Posts"

**Bước 3: Đăng bài cho thuê sản phẩm**

1. Lặp lại Bước 2
2. Chọn loại bài: "Thuê"
3. Điền giá thuê theo ngày: 50000
4. Điền tiền cọc: 500000
5. Điền ngày có thể thuê
6. Lưu bài

### 2.4 Test Post Approval (Duyệt bài)

**Bước 1: Đăng nhập Admin**

1. Đăng xuất User
2. Đăng nhập Admin

**Bước 2: Xem danh sách bài chờ duyệt**

1. Vào menu Admin → Post Approvals
2. URL: `http://localhost:5173/admin/post-approvals`
3. Thấy danh sách các bài `PENDING`

**Bước 3: Duyệt bài**

1. Chọn một bài → xem chi tiết
2. Kiểm tra nội dung, ảnh
3. Nhấn "Approve"

**Kết quả mong đợi:**

- Bài chuyển trạng thái `ACTIVE`
- Bài hiển thị trên Marketplace
- Người đăng nhận được thông báo

**Bước 4: Từ chối bài**

1. Chọn một bài khác
2. Nhấn "Reject"
3. Nhập lý do: "Ảnh không rõ ràng"
4. Xác nhận

**Kết quả mong đợi:**

- Bài chuyển trạng thái `REJECTED`
- Người đăng nhận được thông báo kèm lý do

### 2.5 Test Product Search & Filter (Tìm kiếm và lọc)

**Bước 1: Vào Marketplace**

1. URL: `http://localhost:5173/products`
2. Thấy danh sách sản phẩm `ACTIVE`

**Bước 2: Tìm kiếm theo tên**

1. Nhập từ khóa vào ô tìm kiếm: "laptop"
2. Nhấn Enter hoặc nút Search

**Kết quả mong đợi:**

- Hiển thị các sản phẩm có tên chứa "laptop"

**Bước 3: Lọc theo danh mục**

1. Chọn danh mục: "Đồ điện tử"
2. Kết quả chỉ hiện sản phẩm thuộc danh mục này

**Bước 4: Lọc theo giá**

1. Chọn khoảng giá: 10,000,000 - 20,000,000
2. Áp dụng filter

**Kết quả mong đợi:**

- Hiển thị sản phẩm trong khoảng giá

**Bước 5: Sắp xếp**

1. Chọn sắp xếp: "Giá tăng dần" / "Giá giảm dần" / "Mới nhất"
2. Kiểm tra thứ tự sản phẩm

---

## 3. Người 3 - Order, Delivery, Shipper

### 3.1 Chuẩn bị tài khoản test

- 1 tài khoản Buyer (User)
- 1 tài khoản Seller (User - đã có bài đăng ACTIVE)
- 1 tài khoản Shipper
- 1 tài khoản Admin (nếu cần)

### 3.2 Test Order - Đơn mua hàng

**Bước 1: Buyer tạo đơn hàng**

1. Đăng nhập bằng tài khoản Buyer
2. Vào Marketplace → chọn một sản phẩm (đã được duyệt)
3. Nhấn "Buy Now"
4. URL: `http://localhost:5173/orders/create/:productId`
5. Kiểm tra thông tin:
   - Tên sản phẩm
   - Giá sản phẩm
   - Phí ship (mặc định 35,000đ)
   - Tổng tiền
6. Điền địa chỉ nhận hàng
7. Nhấn "Place Order"

**Kết quả mong đợi:**

- Đơn hàng được tạo với trạng thái `PENDING`
- Buyer thấy đơn trong "My Orders"
- Seller nhận được thông báo có đơn hàng mới

**Bước 2: Seller xem đơn bán**

1. Đăng nhập Seller
2. Vào "My Sales"
3. URL: `http://localhost:5173/orders/my-sales`
4. Thấy đơn hàng mới `PENDING`

**Bước 3: Seller xác nhận đơn**

1. Vào chi tiết đơn hàng
2. Nhấn "Confirm Order"

**Kết quả mong đợi:**

- Order status: `PENDING` → `SELLER_CONFIRMED`
- Hệ thống tự động tạo Delivery với trạng thái `WAITING_SHIPPER`
- Buyer nhận được thông báo

**Bước 4: Seller từ chối đơn (test case khác)**

1. Tạo đơn hàng mới
2. Seller vào chi tiết → nhấn "Reject"
3. Nhập lý do
4. Xác nhận

**Kết quả mong đợi:**

- Order status: `PENDING` → `CANCELLED`
- Không tạo Delivery

### 3.3 Test Delivery - Giao hàng

**Bước 1: Shipper xem đơn chờ nhận**

1. Đăng nhập tài khoản Shipper
2. Vào Shipper Dashboard → Pending Deliveries
3. URL: `http://localhost:5173/shipper/pending`
4. Thấy danh sách delivery `WAITING_SHIPPER`

**Bước 2: Shipper nhận đơn**

1. Chọn một delivery → nhấn "Accept Order"

**Kết quả mong đợi:**

- Delivery status: `WAITING_SHIPPER` → `SHIPPER_ACCEPTED`
- Đơn chuyển sang "My Deliveries" của shipper
- Ghi lại lịch sử trạng thái

**Bước 3: Shipper đến lấy hàng**

1. Vào chi tiết delivery → nhấn "I'm on my way to pick up"

**Kết quả mong đợi:**

- Delivery status: `SHIPPER_ACCEPTED` → `PICKING_UP`

**Bước 4: Shipper xác nhận đã lấy hàng**

1. Sau khi gặp seller và lấy hàng → nhấn "Picked Up"

**Kết quả mong đợi:**

- Delivery status: `PICKING_UP` → `PICKED_UP`
- Order status: `SELLER_CONFIRMED` → `DELIVERING`

### 3.4 Test Shipper Inspection - Kiểm tra sản phẩm

**Bước 1: Truy cập trang Inspection**

1. Sau khi PICKED_UP → nút "Inspect Product" hiện lên
2. Nhấn vào → URL: `http://localhost:5173/delivery/inspection/:deliveryId`

**Bước 2: Điền form kiểm tra**

1. Kiểm tra các mục:
   - ✅ Đúng sản phẩm
   - ✅ Đúng hình ảnh
   - ✅ Đúng model
   - ✅ Đúng tình trạng
   - ✅ Đủ phụ kiện
2. Upload ảnh:
   - Ảnh mặt trước
   - Ảnh mặt sau
   - Ảnh phụ kiện
3. Ghi chú (nếu có): "Máy có vết trầy nhẹ ở góc phải"
4. Chọn kết quả: "PASSED"

**Bước 3: Lưu biên bản**

1. Nhấn "Save Inspection Report"

**Kết quả mong đợi:**

- Biên bản được lưu vào database
- Có thể xem lại bất cứ lúc nào

**Test case lỗi - Seller Fault**

1. Lặp lại Bước 1-2
2. Check một số mục là ❌
3. Chọn kết quả: "FAILED - Seller Fault"
4. Lưu

**Kết quả mong đợi:**

- Delivery status: `PICKED_UP` → `FAILED`
- Order status: `DELIVERING` → `DISPUTED`
- Admin nhận được thông báo để xử lý

### 3.5 Test Tiếp tục giao hàng

**Bước 1: Shipper bắt đầu giao**

1. Sau khi Inspection PASSED → nhấn "Start Delivery"

**Kết quả mong đợi:**

- Delivery status: `PICKED_UP` → `DELIVERING`

**Bước 2: Buyer xác nhận nhận hàng**

1. Đăng nhập Buyer
2. Vào My Orders → chi tiết đơn hàng
3. Thấy delivery đang `DELIVERING`
4. Nhấn "I Received the Product"

**Kết quả mong đợi:**

- Delivery status: `DELIVERING` → `DELIVERED` → `COMPLETED`
- Order status: `DELIVERING` → `COMPLETED`
- Product status: `AVAILABLE` → `SOLD`
- Seller nhận được thông báo

### 3.6 Test Case lỗi - Giao hàng thất bại

**Scenario 1: Buyer không nhận hàng**

1. Shipper đến giao nhưng buyer không nhận
2. Shipper vào chi tiết delivery → nhấn "Report Issue"
3. Chọn loại issue: "Buyer not available"
4. Mô tả chi tiết
5. Upload ảnh bằng chứng (nếu có)
6. Gửi report

**Kết quả mong đợi:**

- Delivery status: `DELIVERING` → `FAILED`
- Lưu lý do thất bại
- Admin nhận được report

---

## 4. Người 5 - UI chung, Chat, Review, Report, Notification, Dashboard

### 4.1 Test UI chung

**Bước 1: Kiểm tra Layout chính**

1. Mở trang chủ: `http://localhost:5173`
2. Kiểm tra:
   - Header/Navbar hiển thị đúng
   - Sidebar (nếu có)
   - Footer
   - Responsive trên mobile (thay đổi kích thước trình duyệt)

**Bước 2: Kiểm tra Navbar theo role**

- **User**: Thấy menu Home, Marketplace, My Orders, My Posts, Messages, Profile
- **Shipper**: Thấy menu Home, Shipper Dashboard, My Deliveries
- **Admin**: Thấy menu Home, Admin Dashboard, User Management, Post Approvals, v.v.

**Bước 3: Test Loading/Error UI**

1. Tắt backend → reload trang
2. Kiểm tra xem có thông báo lỗi友好 không
3. Bật backend lại → reload
4. Kiểm tra xem có loading state không

### 4.2 Test Chat

**Bước 1: Tạo phòng chat**

1. Buyer đăng nhập → vào chi tiết sản phẩm
2. Nhấn nút "Chat with Seller"
3. URL: `http://localhost:5173/messages/:roomId`

**Bước 2: Gửi tin nhắn**

1. Nhập nội dung: "Xin chào, máy còn không?"
2. Nhấn Enter hoặc nút Send
3. Kiểm tra tin nhắn hiển thị

**Bước 3: Seller trả lời**

1. Đăng nhập Seller
2. Vào Messages → thấy cuộc trò chuyện mới
3. Mở và trả lời: "Còn bạn ơi!"

**Kết quả mong đợi:**

- Tin nhắn hiển thị realtime (nếu dùng socket)
- Lưu lịch sử chat

**Bước 4: Gửi ảnh (nếu có)**

1. Nhấn nút Attach Image
2. Chọn ảnh
3. Gửi

### 4.3 Test Review - Đánh giá

**Điều kiện:** Phải có đơn hàng `COMPLETED`

**Bước 1: Buyer tạo review**

1. Đăng nhập Buyer
2. Vào My Orders → đơn hàng đã hoàn tất
3. Nhấn "Write Review"
4. Điền:
   - Rating: 5 sao
   - Comment: "Sản phẩm đúng mô tả, shipper giao nhanh"
5. Lưu

**Kết quả mong đợi:**

- Review được lưu
- Hiển thị trên trang chi tiết sản phẩm
- Hiển thị trên profile của Seller

**Bước 2: Xem review**

1. Vào trang chi tiết sản phẩm
2. Scroll xuống phần Reviews
3. Thấy review vừa tạo

### 4.4 Test Report - Báo cáo vi phạm

**Bước 1: User gửi báo cáo**

1. Vào trang chi tiết sản phẩm / đơn hàng / user profile
2. Nhấn nút "Report"
3. Điền form:
   - Loại vi phạm: "Sai mô tả"
   - Mô tả: "Sản phẩm không đúng như ảnh"
   - Upload ảnh bằng chứng
4. Gửi report

**Bước 2: Admin xử lý report**

1. Đăng nhập Admin
2. Vào Admin → Violation Reports
3. URL: `http://localhost:5173/admin/reports`
4. Xem chi tiết report
5. Xem bằng chứng
6. Quyết định:
   - Accept (chấp nhận): Trừ điểm uy tín người bị báo cáo
   - Reject (từ chối): Không xử lý
7. Nhập lý do xử lý
8. Lưu

**Kết quả mong đợi:**

- Report status cập nhật
- Người gửi report nhận được thông báo kết quả
- Nếu accept: Người bị báo cáo bị trừ điểm uy tín

### 4.5 Test Notification - Thông báo

**Bước 1: Kiểm tra các loại thông báo**
Thực hiện các hành động và kiểm tra thông báo:

1. Đăng bài → Admin nhận thông báo "Bài mới chờ duyệt"
2. Admin duyệt bài → User nhận thông báo "Bài đăng đã được duyệt"
3. Buyer đặt hàng → Seller nhận thông báo "Có đơn hàng mới"
4. Seller xác nhận đơn → Buyer nhận thông báo "Đơn hàng đã được xác nhận"
5. Shipper nhận đơn → Buyer/Seller nhận thông báo "Shipper đã nhận đơn"
6. Giao hàng thành công → Buyer/Seller nhận thông báo
7. Có review mới → Seller nhận thông báo

**Bước 2: Xem danh sách thông báo**

1. Nhấn biểu tượng thông báo trên Navbar
2. Thấy danh sách các thông báo
3. Nhấn vào một thông báo → chuyển đến trang liên quan
4. Đánh dấu đã đọc

### 4.6 Test Dashboard Admin

**Bước 1: Vào Admin Dashboard**

1. Đăng nhập Admin
2. URL: `http://localhost:5173/admin/dashboard`

**Bước 2: Kiểm tra các thống kê**
Kiểm tra các số liệu hiển thị:

- Tổng số User
- User chờ duyệt
- Tổng bài đăng
- Bài chờ duyệt
- Tổng đơn hàng
- Đơn hoàn tất / Đơn hủy
- Tổng báo cáo vi phạm
- Số shipper hoạt động

**Bước 3: Kiểm tra biểu đồ (nếu có)**

- Biểu đồ giao dịch theo thời gian
- Biểu đồ vi phạm

---

## 5. Flow hoàn chỉnh End-to-End

Dưới đây là flow test toàn bộ từ đầu đến cuối:

### 5.1 Chuẩn bị

1. Admin tạo danh mục: "Đồ điện tử"
2. User A (Seller) đăng ký → upload CCCD → Admin duyệt tài khoản
3. User A đăng bài bán Laptop → Admin duyệt bài → bài ACTIVE

### 5.2 Thực hiện giao dịch

1. User B (Buyer) đăng ký → Admin duyệt
2. User B xem bài đăng Laptop → nhắn tin cho User A
3. User B đặt hàng → Order PENDING
4. User A (Seller) xem đơn → xác nhận → Order SELLER_CONFIRMED, tạo Delivery WAITING_SHIPPER
5. User C (Shipper) đăng nhập → xem đơn chờ → nhận đơn → SHIPPER_ACCEPTED
6. Shipper đến lấy hàng → PICKING_UP → PICKED_UP
7. Shipper kiểm tra sản phẩm → tạo Inspection PASSED
8. Shipper giao hàng → DELIVERING
9. User B (Buyer) xác nhận nhận hàng → Delivery DELIVERED → COMPLETED, Order COMPLETED, Product SOLD
10. User B viết review cho sản phẩm và User A

### 5.3 Kết thúc

Tất cả các bước đều hoạt động đúng, thông báo được gửi đầy đủ, dữ liệu được lưu chính xác.

---

## 6. Lưu ý khi test

- **Luôn kiểm tra Console**: Mở DevTools (F12) để xem có lỗi nào không
- **Kiểm tra Network**: Xem các API request/response có đúng không
- **Kiểm tra Database**: Dùng MongoDB Compass để xem dữ liệu được lưu đúng không
- **Test Responsive**: Thử trên điện thoại hoặc resize trình duyệt
- **Test Edge Cases**:
  - Hủy đơn khi đang giao
  - Shipper báo lỗi sản phẩm
  - Buyer không nhận hàng
  - Từ chối bài đăng
  - Trừ điểm uy tín

---

## 7. Tài liệu tham khảo

- `README.md` - Cách cài đặt và chạy dự án
- `CLAUDE.md` - Hướng dẫn chung về dự án
- `ORDER_MODULE_GUIDE.md` - Chi tiết về Order và Delivery
- `TASK.md` - Phân chia nhiệm vụ cho 5 người

Chúc bạn test thành công! 🚀
