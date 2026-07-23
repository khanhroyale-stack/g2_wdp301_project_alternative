# 📋 DANH SÁCH USE CASES - DUY ANH (NGƯỜI 3)

## 🎯 Phạm Vi Nhiệm Vụ

Bạn phụ trách:
1. ✅ **Toàn bộ luồng Shipper** (Delivery + Inspection + Report)
2. ✅ **Các trang Order** (Purchase Order Management)
3. ✅ **Phân chia Role User Pro và User thường** (Pro Subscription)
4. ✅ **Hiển thị sản phẩm nổi bật** (Featured Products)
5. ✅ **Sản phẩm đề xuất trong chi tiết sản phẩm** (Related/Recommended Products)

---

## 📦 MODULE 1: ORDER MANAGEMENT (9 Use Cases)

### UC-36: Place Purchase Order
**Actor:** User  
**Mô tả:** Create a purchase order for a selected product after reviewing price, shipping fee, and total amount.  
**Trạng thái:** ✅ Đã làm

### UC-37: View My Orders
**Actor:** User  
**Mô tả:** View the list of personal purchase orders and sales orders with their current status.  
**Trạng thái:** ✅ Đã làm

### UC-38: Confirm Purchase Order
**Actor:** User  
**Mô tả:** Accept or reject a purchase order as the seller.  
**Trạng thái:** ✅ Đã làm

### UC-39: Cancel Purchase Order
**Actor:** User  
**Mô tả:** Cancel a purchase order before it is delivered.  
**Trạng thái:** ✅ Đã làm

### UC-40: Confirm Product Receipt
**Actor:** User  
**Mô tả:** Confirm successful receipt of the purchased product and complete the order.  
**Trạng thái:** ✅ Đã làm

### UC-32: Add to Cart
**Actor:** User  
**Mô tả:** Add a product for sale to the shopping cart, or update its quantity.  
**Trạng thái:** ⚠️ Cần kiểm tra (liên quan Order flow)

### UC-33: View Cart
**Actor:** User  
**Mô tả:** View items in the cart with subtotal, shipping fee, and total amount.  
**Trạng thái:** ⚠️ Cần kiểm tra

### UC-34: Remove from Cart
**Actor:** User  
**Mô tả:** Remove a product from the shopping cart.  
**Trạng thái:** ⚠️ Cần kiểm tra

### UC-35: Checkout Cart
**Actor:** User  
**Mô tả:** Convert all valid items in the cart into separate purchase orders in one action.  
**Trạng thái:** ⚠️ Cần kiểm tra

---

## 🚚 MODULE 2: DELIVERY MANAGEMENT (4 Use Cases)

### UC-41: Create Delivery Request
**Actor:** System  
**Mô tả:** Generate a delivery request automatically after the seller confirms the order.  
**Trạng thái:** ✅ Đã làm

### UC-42: View Delivery Orders
**Actor:** Shipper  
**Mô tả:** View available delivery requests waiting to be accepted, and personally assigned deliveries.  
**Trạng thái:** ✅ Đã làm

### UC-43: Accept Delivery Order
**Actor:** Shipper  
**Mô tả:** Accept a delivery request for processing.  
**Trạng thái:** ✅ Đã làm

### UC-44: Update Delivery Status
**Actor:** Shipper  
**Mô tả:** Update the delivery progress through picking up, picked up, delivering, and delivered.  
**Trạng thái:** ✅ Đã làm

### ~~UC-52: Deliver Rental Item~~
**❌ KHÔNG THUỘC PHẠM VI** - Rental không dùng Shipper (người thuê và chủ đồ hẹn nhau trực tiếp)

### ~~UC-58: Receive Returned Item~~
**❌ KHÔNG THUỘC PHẠM VI** - Rental không dùng Shipper

---

## 🔍 MODULE 3: DELIVERY INSPECTION (3 Use Cases)

### UC-45: Inspect Product Before Delivery
**Actor:** Shipper  
**Mô tả:** Verify product condition, description, model, images, and accessories before delivery.  
**Trạng thái:** ✅ Đã làm

### UC-46: Upload Inspection Evidence
**Actor:** Shipper  
**Mô tả:** Upload photos and inspection records as transaction evidence.  
**Trạng thái:** ✅ Đã làm

### UC-47: View Inspection Records
**Actor:** Shipper, Admin  
**Mô tả:** View inspection records of a delivery for verification or dispute resolution.  
**Trạng thái:** ✅ Đã làm

### ~~UC-55: Inspect Product Before Rental~~
**❌ KHÔNG THUỘC PHẠM VI** - Rental không dùng Shipper

### ~~UC-56: Inspect Returned Item~~
**❌ KHÔNG THUỘC PHẠM VI** - Rental không dùng Shipper

---

## 📝 MODULE 4: SHIPPER REPORT (3 Use Cases)

### UC-92: Create Shipper Report
**Actor:** Shipper  
**Mô tả:** Report a delivery-related problem such as buyer unreachable, wrong address, or damage in transit.  
**Trạng thái:** ✅ Đã làm

### UC-93: View My Shipper Reports
**Actor:** Shipper  
**Mô tả:** View own submitted delivery reports and their resolution status.  
**Trạng thái:** ✅ Đã làm

### UC-94: Resolve Shipper Report
**Actor:** Admin  
**Mô tả:** Review and resolve a shipper-submitted delivery report.  
**Trạng thái:** ✅ Đã làm

---

## 💎 MODULE 5: PRO SUBSCRIPTION (6 Use Cases)

### UC-78: View Pro Plans
**Actor:** User  
**Mô tả:** View available Pro subscription plans (1/3/12 months) and prices.  
**Trạng thái:** ✅ Đã làm

### UC-79: Upgrade to Pro
**Actor:** User  
**Mô tả:** Pay for a Pro subscription via VNPay to remove the free-post limit.  
**Trạng thái:** ✅ Đã làm

### UC-80: View Payment Result
**Actor:** User  
**Mô tả:** Return from VNPay after payment and see whether the upgrade succeeded.  
**Trạng thái:** ✅ Đã làm

### UC-81: View My Subscriptions
**Actor:** User  
**Mô tả:** View history of past Pro subscription purchases.  
**Trạng thái:** ✅ Đã làm

### UC-82: Check Pro Status
**Actor:** User  
**Mô tả:** Check current Pro status, expiry date, and remaining free posts.  
**Trạng thái:** ✅ Đã làm

### UC-86: Manage Shippers
**Actor:** Admin  
**Mô tả:** Manage shipper accounts, assign the shipper role, and review delivery performance.  
**Trạng thái:** ⚠️ Cần kiểm tra (Admin - có thể phối hợp với người khác)

---

## ⭐ MODULE 6: FEATURED PRODUCTS (2 Use Cases)

### UC-83: Set Featured Products
**Actor:** User  
**Mô tả:** Select products to be highlighted on the platform, available to Pro users within a maximum limit.  
**Trạng thái:** ✅ Đã làm

### UC-84: View Featured Setup Reminder
**Actor:** User  
**Mô tả:** Receive and dismiss a reminder to set up featured products after upgrading to Pro.  
**Trạng thái:** ✅ Đã làm

---

## 🏷️ MODULE 7: PRODUCT DISCOVERY - SẢN PHẨM ĐỀ XUẤT (Related Products)

### UC-19: View Posts
**Actor:** Guest, User, Admin  
**Mô tả:** View product listings and detailed product information.  
**Phạm vi của bạn:** Hiển thị **sản phẩm đề xuất/liên quan** trong trang chi tiết sản phẩm  
**Trạng thái:** ⚠️ Cần kiểm tra (có thể đã có recommend logic chưa?)

---

## 📊 MODULE 8: ADMIN REVENUE & SUBSCRIPTION TRACKING (2 Use Cases)

### UC-90: View Revenue Report
**Actor:** Admin  
**Mô tả:** View revenue statistics generated from Pro subscription payments.  
**Chi tiết:**
- Xem tổng doanh thu từ gói Pro
- Xem số lượng giao dịch thành công
- Xem doanh thu theo từng gói (1m, 3m, 12m)
- Xem biểu đồ doanh thu theo tháng
**Trạng thái:** ✅ Đã làm

### UC-91: View Transaction History
**Actor:** Admin  
**Mô tả:** View the list of subscription payment transactions on the platform.  
**Chi tiết:**
- Xem danh sách hóa đơn upgrade Pro
- Lọc theo trạng thái (paid/pending/failed)
- Lọc theo loại gói
- Xem thông tin user, số tiền, ngày thanh toán
- Phân trang
**Trạng thái:** ✅ Đã làm

---

## 📊 TỔNG KẾT

| Module | Số UC | Trạng thái |
|--------|-------|------------|
| **Order Management** | 9 | ✅ 5 đã làm, ⚠️ 4 cần check |
| **Delivery Management** | 4 | ✅ 4 đã làm ✅ |
| **Delivery Inspection** | 3 | ✅ 3 đã làm ✅ |
| **Shipper Report** | 3 | ✅ 3 đã làm ✅ |
| **Pro Subscription** | 6 | ✅ 5 đã làm, ⚠️ 1 cần check |
| **Featured Products** | 2 | ✅ 2 đã làm ✅ |
| **Product Discovery** | 1 | ⚠️ Cần implement recommend |
| **Admin Revenue & Subscription** | 2 | ✅ 2 đã làm ✅ |
| **TỔNG** | **30 UC** | ✅ 24 hoàn thành, ⚠️ 6 cần check |

**Ghi chú:** 4 UC liên quan Rental (UC-52, 55, 56, 58) **KHÔNG thuộc phạm vi** vì sản phẩm thuê không dùng Shipper - người thuê và chủ đồ gặp nhau trực tiếp.

---

## ✅ ĐÃ HOÀN THÀNH (24 UC)

1. ✅ UC-36: Place Purchase Order
2. ✅ UC-37: View My Orders
3. ✅ UC-38: Confirm Purchase Order
4. ✅ UC-39: Cancel Purchase Order
5. ✅ UC-40: Confirm Product Receipt
6. ✅ UC-41: Create Delivery Request
7. ✅ UC-42: View Delivery Orders
8. ✅ UC-43: Accept Delivery Order
9. ✅ UC-44: Update Delivery Status
10. ✅ UC-45: Inspect Product Before Delivery
11. ✅ UC-46: Upload Inspection Evidence
12. ✅ UC-47: View Inspection Records
13. ✅ UC-78: View Pro Plans
14. ✅ UC-79: Upgrade to Pro
15. ✅ UC-80: View Payment Result
16. ✅ UC-81: View My Subscriptions
17. ✅ UC-82: Check Pro Status
18. ✅ UC-83: Set Featured Products
19. ✅ UC-84: View Featured Setup Reminder
20. ✅ UC-90: View Revenue Report
21. ✅ UC-91: View Transaction History
22. ✅ UC-92: Create Shipper Report
23. ✅ UC-93: View My Shipper Reports
24. ✅ UC-94: Resolve Shipper Report

---

## ⚠️ CẦN KIỂM TRA/BỔ SUNG (6 UC)

### Shopping Cart (4 UC)
- ⚠️ UC-32: Add to Cart
- ⚠️ UC-33: View Cart
- ⚠️ UC-34: Remove from Cart
- ⚠️ UC-35: Checkout Cart

### Admin & Discovery (2 UC)
- ⚠️ UC-86: Manage Shippers (Admin)

---

## 🎯 ƯU TIÊN CÔNG VIỆC

### Priority 1: CRITICAL (Cần làm ngay nếu chưa có)
1. **Shopping Cart** - UC-32 đến UC-35 (nếu chưa có)
2. **Sản phẩm đề xuất** - UC-19 (recommend logic)

### Priority 2: LOW (Admin - có thể phối hợp)
3. **Manage Shippers** - UC-86

---

## 📝 GHI CHÚ

- **Rental Use Cases (UC-52, 55, 56, 58)**: ❌ **KHÔNG THUỘC PHẠM VI** - Sản phẩm thuê không dùng Shipper, người thuê và chủ đồ hẹn gặp nhau trực tiếp
- **Shopping Cart**: Cần xác nhận xem đã implement chưa
- **Sản phẩm đề xuất**: Cần thêm logic recommend products (based on category, tags, hoặc collaborative filtering)
- **Manage Shippers (UC-86)**: Admin feature - có thể phối hợp với người làm Admin Dashboard

---

**Tổng kết:** Bạn có **30 Use Cases** trong phạm vi nhiệm vụ (loại trừ 4 UC Rental), trong đó **24 UC đã hoàn thành**, còn **6 UC cần kiểm tra/bổ sung**.
