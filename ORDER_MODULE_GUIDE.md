# 🛍️ EcoTrade - Order & Delivery Module

## 📁 Cấu trúc đã tạo

### Backend

#### Controllers
- `backend/src/controllers/product.controller.js` - Quản lý sản phẩm
- `backend/src/controllers/order.controller.js` - Quản lý đơn hàng
- `backend/src/controllers/delivery.controller.js` - Quản lý giao hàng
- `backend/src/controllers/inspection.controller.js` - Quản lý kiểm tra sản phẩm

#### Routes
- `backend/src/routes/product.routes.js`
- `backend/src/routes/order.routes.js`
- `backend/src/routes/delivery.routes.js`
- `backend/src/routes/inspection.routes.js`

### Frontend

#### Services
- `frontend/src/services/product.service.js`
- `frontend/src/services/order.service.js`
- `frontend/src/services/delivery.service.js`
- `frontend/src/services/inspection.service.js`

#### Pages
**Products:**
- `frontend/src/pages/products/ProductList.jsx` - Danh sách sản phẩm
- `frontend/src/pages/products/ProductDetail.jsx` - Chi tiết sản phẩm

**Orders:**
- `frontend/src/pages/orders/CreateOrder.jsx` - Tạo đơn hàng
- `frontend/src/pages/orders/OrderList.jsx` - Danh sách đơn hàng (mua/bán)
- `frontend/src/pages/orders/OrderDetail.jsx` - Chi tiết đơn hàng

**Delivery:**
- `frontend/src/pages/delivery/DeliveryList.jsx` - Danh sách giao hàng (shipper)

---

## 🚀 Cách chạy

### 1. Chạy Backend
```bash
cd backend
npm run dev
```
Backend sẽ chạy ở `http://localhost:5000`

### 2. Chạy Frontend
```bash
cd frontend
npm run dev
```
Frontend sẽ chạy ở `http://localhost:5173`

---

## 🔗 Routes Frontend (Không cần login để test)

### Sản phẩm
- `/products` - Danh sách tất cả sản phẩm
- `/products/:id` - Chi tiết sản phẩm
- `/orders/create/:productId` - Tạo đơn hàng

### Đơn hàng
- `/orders/my-orders` - Danh sách đơn hàng (tab Đơn mua / Đơn bán)
- `/orders/:id` - Chi tiết đơn hàng

### Giao hàng (Shipper)
- `/deliveries` - Danh sách đơn giao hàng (tab Đơn có sẵn / Đơn của tôi)

---

## 📊 API Endpoints

### Products
```
GET /api/products - Lấy danh sách sản phẩm
GET /api/products/:id - Chi tiết sản phẩm
GET /api/products/categories - Danh sách danh mục
```

### Orders
```
GET /api/orders/checkout/:productId - Xem trước checkout
POST /api/orders - Tạo đơn hàng
GET /api/orders/my-orders - Đơn mua của tôi
GET /api/orders/my-sales - Đơn bán của tôi
GET /api/orders/:id - Chi tiết đơn hàng
PATCH /api/orders/:id/status - Cập nhật trạng thái đơn
```

### Deliveries
```
GET /api/deliveries/available - Đơn giao có sẵn (shipper)
POST /api/deliveries/:id/accept - Nhận đơn giao
GET /api/deliveries/my-deliveries - Đơn giao của tôi
GET /api/deliveries/:id - Chi tiết giao hàng
PATCH /api/deliveries/:id/status - Cập nhật trạng thái giao hàng
```

### Inspections
```
POST /api/inspections - Tạo biên bản kiểm tra
GET /api/inspections/delivery/:deliveryId - Lấy biên bản theo delivery
GET /api/inspections/:id - Chi tiết biên bản
GET /api/inspections/my-inspections - Biên bản của tôi
```

---

## 🔄 Luồng hoạt động

### 1. Mua hàng (Buyer)
1. Xem danh sách sản phẩm: `/products`
2. Xem chi tiết: `/products/:id`
3. Nhấn "Mua ngay" → Redirect đến `/orders/create/:productId`
4. Điền thông tin nhận hàng
5. Nhấn "Đặt hàng"
6. Xem đơn hàng tại `/orders/my-orders` (tab Đơn mua)

### 2. Bán hàng (Seller)
1. Xem đơn bán tại `/orders/my-orders` (tab Đơn bán)
2. Nhấn "Xác nhận đơn" → Tạo delivery tự động
3. Chờ shipper nhận hàng

### 3. Giao hàng (Shipper)
1. Xem đơn có sẵn: `/deliveries` (tab Đơn có sẵn)
2. Nhấn "Nhận đơn giao"
3. Xem đơn đã nhận: `/deliveries` (tab Đơn của tôi)
4. Cập nhật trạng thái: picking_up → in_transit → delivered

### 4. Hoàn tất (Buyer)
1. Khi shipper cập nhật "delivered"
2. Buyer xác nhận "Đã nhận hàng"
3. Đơn hoàn tất

---

## 📝 Trạng thái đơn hàng

### Order Status
- `pending` - Chờ người bán xác nhận
- `confirmed` - Đã xác nhận
- `shipping` - Đang giao
- `delivered` - Đã giao
- `completed` - Hoàn thành
- `cancelled` - Đã hủy

### Delivery Status
- `pending` - Chờ shipper nhận
- `picking_up` - Đang lấy hàng
- `in_transit` - Đang giao
- `delivered` - Đã giao
- `failed` - Thất bại

---

## 🎨 Design Reference

Các trang đã được thiết kế dựa trên file trong folder `frontend/EcoTrade/`:
- Create order.png
- Order detail.png (order-details.png)
- delivery list.png
- delivery detail.png
- Product inspection.png

---

## ⚠️ Lưu ý

1. **Authentication đã được tắt tạm thời** để test dễ dàng
2. Để bật lại authentication, uncomment `PrivateRoute` trong `App.jsx`
3. Database sử dụng: MongoDB Atlas (đã config trong `.env`)
4. Phí ship mặc định: 35,000 VND

---

## 🔧 Các chức năng cần phát triển tiếp

1. ✅ Product CRUD (chỉ có Read)
2. ✅ Order Management (Create, Read, Update status)
3. ✅ Delivery Management
4. ⏳ Product Inspection UI (chưa có trang nhập biên bản)
5. ⏳ Upload images cho inspection
6. ⏳ Chat với người bán
7. ⏳ Review & Rating
8. ⏳ Admin dashboard

---

## 📞 Hỗ trợ

Nếu gặp lỗi:
1. Check backend đang chạy: `http://localhost:5000/api/health`
2. Check database connection trong backend console
3. Check browser console có lỗi không
4. Restart cả backend và frontend

**Happy coding! 🚀**
