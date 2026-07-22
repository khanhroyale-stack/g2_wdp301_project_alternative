# Thiết kế: Sửa lỗi gửi đánh giá & hiển thị comment ở Product Detail

Ngày: 2026-07-22

## Bối cảnh

Người mua hoàn tất đơn (`orderStatus = completed`) rồi bấm "Đánh giá sản phẩm" ở
trang Chi tiết đơn hàng (`OrderDetail` → `ReviewModal`). Hiện tại thao tác này
**thất bại** — không lưu được review. Ngoài ra, trang **Product Detail** chỉ hiển thị
điểm trung bình + số lượng đánh giá, **không** hiển thị nội dung các comment.

## Chẩn đoán nguyên nhân gốc (bug gửi review)

- Collection `reviews` còn dính **Atlas `$jsonSchema` validator** cũ, `validationAction: "error"`.
- Lúc kết nối DB, `backend/src/config/db.js` chủ động tắt validator cho 12 collection,
  nhưng **`reviews` không nằm trong danh sách** `collectionsToRelax`.
- Validator (xem `backend/scripts/fix-reviews-json-schema.js`) yêu cầu `rating`
  là `bsonType: "int"`. Mongoose lưu kiểu `Number` thành BSON `double` (5 → 5.0),
  nên **mọi** insert review đều vi phạm validator → rơi vào nhánh `catch`
  `schemaRulesNotSatisfied` ở `review.controller.js`.
  
Kết luận: review fail với **mọi** sản phẩm, không riêng sản phẩm hết hàng. Reviews
KHÔNG bị mất do hết hàng — chúng gắn theo `postId` và tồn tại độc lập với tồn kho.

## Vấn đề phụ (luồng trạng thái hết hàng)

Khi mua hết hàng, `reserveProductQuantity` gọi `syncProductAvailability(productId)`
không truyền `soldIfEmpty`, khiến `getProductAvailabilityStatus(0, false)` trả về
`"inactive"` (giống bị gỡ/ẩn) thay vì `"sold"` (đã bán). Đây là điểm "luồng chuẩn
không nên làm thế".

## Phạm vi & Thay đổi

### Phần 1 — Sửa bug gửi review
- File: `backend/src/config/db.js`
- Thêm `"reviews"` vào mảng `collectionsToRelax`.
- Lý do: đồng nhất với pattern đã áp dụng cho 12 collection khác; validation vẫn được
  Mongoose schema (`review.model.js`) đảm bảo ở tầng ứng dụng. Cách này khắc phục
  triệt để bất kể validator hiện tại trên collection là phiên bản nào (vì tắt hẳn).

### Phần 2 — Hiển thị comment review ở Product Detail
- File: `frontend/src/pages/product/ProductDetail.jsx`
- Thêm state `reviews`; trong `useEffect` gọi `reviewService.getPostReviews(id)`.
- Trong section "Đánh giá", dưới phần tóm tắt điểm số, render danh sách comment:
  avatar/chữ cái đầu + tên người đánh giá + số sao + ngày + nội dung comment.
  Tái dùng style thẻ review của `ProductReviews.jsx` để đồng nhất giao diện.
- Giữ nguyên link "Xem tất cả" sang trang `ProductReviews`.
- Chỉ hiển thị vài review mới nhất (giới hạn ~3-5) để không làm trang quá dài;
  phần còn lại xem ở "Xem tất cả".

### Phần 3 — Trạng thái hết hàng thành "sold"
- File: `backend/src/services/order-inventory.service.js`
- Trong `reserveProductQuantity`, đổi `syncProductAvailability(productId)` thành
  `syncProductAvailability(productId, true)` để sản phẩm bán hết chuyển sang `"sold"`.
- `releaseProductQuantity` giữ nguyên (khi hủy đơn, hàng về kho → `"available"`).

## Kiểm thử / Xác minh

- Backend: sau khi sửa `db.js`, gửi review cho một đơn `completed` phải trả `201`
  và ProductPost cập nhật `reviewCount`/`averageRating`. Chạy test backend hiện có.
- Frontend: mở Product Detail của sản phẩm đã có review → thấy danh sách comment.
- Hết hàng: mua hết sản phẩm số lượng 1 → `postStatus = "sold"` (không phải `"inactive"`);
  vẫn mở được Product Detail và xem/gửi được review từ trang đơn hàng.

## Ngoài phạm vi

- Không sửa cơ chế validator tổng thể của DB.
- Không thêm phân trang review trên Product Detail (đã có trang riêng).
