# WDP301 Project — Claude Code Guide

## Tổng quan

App marketplace cho **thuê và mua bán đồ dùng** (C2C), dự án môn học WDP301.
Người dùng có thể đăng bài, thuê/mua đồ, chat, đánh giá, và báo cáo vi phạm.

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React 18, React Router v6, Axios, Vite |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas (Mongoose 8) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| File upload | Cloudinary |

---

## Cấu trúc thư mục

```
root/
├── backend/
│   └── src/
│       ├── config/         # db.js — kết nối MongoDB
│       ├── controllers/    # Xử lý logic request
│       ├── middleware/     # auth.middleware.js (protect, adminOnly)
│       ├── models/         # Mongoose models (1 file = 1 collection)
│       ├── routes/         # Express routers
│       └── server.js       # Entry point
└── frontend/
    └── src/
        ├── components/     # UI components tái sử dụng
        ├── context/        # React Context (auth, v.v.)
        ├── pages/          # Trang theo route
        └── services/       # Axios API calls
```

---

## Lưu ý quan trọng

### DNS fix (bắt buộc)
Windows không resolve SRV record của MongoDB Atlas qua DNS hệ thống.
`server.js` đã có fix này — **không xóa 2 dòng đầu**:
```js
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
```

### Biến môi trường
File `.env` nằm ở `backend/.env` (không commit). Xem `backend/.env.example` để biết các biến cần thiết.

---

## Database — Models & Collections

### Users & Auth
| Model | Collection | Mô tả |
|---|---|---|
| `User` | `users` | Role: `user`, `shipper`, `admin` |
| `VerificationRequest` | `verification_requests` | Flow xác minh CCCD/thẻ SV |

### Sản phẩm
| Model | Collection | Mô tả |
|---|---|---|
| `Category` | `categories` | Danh mục sản phẩm |
| `ProductPost` | `product_posts` | Bài đăng, `productType`: `sale/rent/both` |
| `ProductImage` | `product_images` | Ảnh bài đăng, ref `MediaFile` qua `mediaId` |
| `MediaFile` | `media_files` | File upload lên Cloudinary |

### Thuê đồ
| Model | Collection | Mô tả |
|---|---|---|
| `RentalRequest` | `rental_requests` | Yêu cầu thuê từ renter |
| `RentalContract` | `rental_contracts` | Hợp đồng sau khi approved |
| `RentalInspection` | `rental_inspections` | Kiểm tra lúc giao (`handover`) và trả (`return`) |
| `RentalInspectionImage` | `rental_inspection_images` | Ảnh kiểm tra thuê |

### Mua bán
| Model | Collection | Mô tả |
|---|---|---|
| `Order` | `orders` | Đơn hàng mua bán |
| `Delivery` | `deliveries` | Giao hàng, ref `Order` hoặc `RentalContract` |
| `DeliveryInspection` | `delivery_inspections` | Kiểm tra khi shipper nhận/giao |
| `InspectionImage` | `inspection_images` | Ảnh kiểm tra giao hàng |

### Thanh toán & Uy tín
| Model | Collection | Mô tả |
|---|---|---|
| `Transaction` | `transactions` | Lịch sử thanh toán (payment/deposit/refund) |
| `ReputationLog` | `reputation_logs` | Lịch sử thay đổi điểm uy tín |

### Tương tác
| Model | Collection | Mô tả |
|---|---|---|
| `ChatRoom` | `chat_rooms` | Phòng chat giữa buyer và seller theo post |
| `Message` | `messages` | Tin nhắn, `mediaId` nếu có file đính kèm |
| `Notification` | `notifications` | Thông báo cho user |
| `Review` | `reviews` | Đánh giá sau giao dịch |
| `Report` | `report` | Báo cáo vi phạm |
| `ReportEvidence` | `report_evidences` | Bằng chứng đính kèm báo cáo |

---

## Quy tắc code

### Backend

**Đặt tên file**
- Model: `ten_collection.model.js` (snake_case)
- Controller: `ten_chucnang.controller.js`
- Route: `ten_chucnang.routes.js`
- Middleware: `ten.middleware.js`

**Controller**
- Mỗi function bọc trong `try/catch`
- Trả về JSON theo cấu trúc chuẩn:
```js
// Thành công
res.json({ success: true, data: ... })

// Lỗi
res.status(4xx).json({ success: false, message: "..." })
```
- Không để logic phức tạp trong route, chỉ để trong controller

**Model**
- Luôn khai báo `collection` trong schema options để khớp tên MongoDB
- Dùng `timestamps: true` thay vì tự thêm `createdAt`/`updatedAt`
- Ref đến MediaFile luôn dùng tên field `mediaId`, không dùng `field`
- Các ObjectId ref phải khai báo `ref` đúng tên Model

**Route**
- Prefix: `/api/<resource>` (số nhiều, kebab-case)
- Middleware `protect` cho route cần đăng nhập
- Middleware `adminOnly` sau `protect` cho route admin

**Middleware thứ tự trong route:**
```js
router.post("/", protect, adminOnly, controller)
```

### Frontend

**Đặt tên file**
- Component: `PascalCase.jsx`
- Page: `TenTrang.jsx`, để trong `src/pages/`
- Service: `tenResource.service.js`

**API calls**
- Tất cả gọi API đặt trong `src/services/`, không gọi axios trực tiếp trong component
- Base URL lấy từ env hoặc config, không hardcode `localhost:5000`

**State**
- Auth state dùng Context (`src/context/`)
- Không dùng prop drilling quá 2 cấp

---

## API Pattern chuẩn

```
GET    /api/products          # Danh sách
GET    /api/products/:id      # Chi tiết
POST   /api/products          # Tạo mới (protect)
PUT    /api/products/:id      # Cập nhật (protect)
DELETE /api/products/:id      # Xóa (protect + adminOnly)
```

---

## Roles & Quyền

| Role | Quyền |
|---|---|
| `user` | Đăng bài, thuê/mua, chat, review, report |
| `shipper` | Nhận đơn giao hàng, tạo delivery inspection |
| `admin` | Duyệt bài, xử lý report, quản lý user, xem tất cả |
