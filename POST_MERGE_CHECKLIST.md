# ✅ POST-MERGE SYSTEM CHECKLIST

## 📅 Ngày merge: 2026-07-20
## 🔀 Nhánh: AnhDTD ← LongTNP-MSG
## 👤 Người thực hiện: Duy Anh

---

## 🎯 MỤC TIÊU

Đảm bảo hệ thống hoạt động trơn tru sau khi merge code từ nhánh LongTNP-MSG, đặc biệt:
- ✅ API response format đồng bộ
- ✅ Frontend-Backend communication hoạt động
- ✅ Không có breaking changes
- ✅ Tất cả features core hoạt động

---

## 🔍 PHÂN TÍCH THAY ĐỔI QUAN TRỌNG

### 1. **Serializers được thêm vào** (từ Long)
**File:** `backend/src/utils/serializers.js`

**Thay đổi:**
- Chuẩn hóa User response format
- Chuẩn hóa Product response format với `hydrateProducts()`

**Ảnh hưởng:**
- ⚠️ Controllers có thể trả về format mới
- ⚠️ Frontend cần adapt với structure mới

---

### 2. **Google OAuth Integration**
**Files thay đổi:**
- `frontend/src/main.jsx` - Thêm GoogleOAuthProvider
- `frontend/src/pages/auth/LoginPage.jsx`
- `frontend/src/pages/auth/RegisterPage.jsx`

**Cần kiểm tra:**
- ✅ Login bình thường (email/password)
- ✅ Login với Google OAuth
- ✅ Register bình thường
- ✅ Toaster hiển thị đúng

---

### 3. **Order/Delivery Module Updates**
**Files đã sửa sau merge:**
- ✅ `backend/src/controllers/order.controller.js` - Đã fix
- ✅ `frontend/src/services/order.service.js` - Đã fix

**Cần test kỹ:**
- Order creation flow
- Order status updates
- Delivery tracking

---

## 📋 CHECKLIST KIỂM TRA CHI TIẾT

### ✅ PHASE 1: BACKEND API (Critical)


#### 🔴 Critical APIs (Phải test ngay)

- [ ] **POST /api/orders** - Tạo đơn hàng
  - Test: Tạo order từ ProductDetail
  - Expected: Order được tạo thành công với đầy đủ thông tin
  
- [ ] **GET /api/orders/:id** - Xem chi tiết đơn hàng
  - Test: Mở trang OrderDetail
  - Expected: Hiển thị đầy đủ thông tin order, product, delivery
  
- [ ] **PATCH /api/orders/:id/status** - Cập nhật trạng thái
  - Test: Seller xác nhận/từ chối, Buyer hủy/xác nhận nhận hàng
  - Expected: Status được update, notification gửi đúng
  
- [ ] **GET /api/orders/checkout/:productId** - Preview checkout
  - Test: Vào trang CreateOrder
  - Expected: Hiển thị đúng giá, phí ship, thông tin sản phẩm

- [ ] **GET /api/deliveries** - Danh sách giao hàng (Shipper)
  - Test: Shipper xem đơn cần giao
  - Expected: List deliveries với đầy đủ thông tin

---

#### 🟡 Important APIs (Test sau Critical)

- [ ] **POST /api/auth/login** - Đăng nhập
- [ ] **POST /api/auth/google** - Google OAuth
- [ ] **POST /api/auth/register** - Đăng ký
- [ ] **GET /api/products** - Danh sách sản phẩm
- [ ] **GET /api/products/:id** - Chi tiết sản phẩm
- [ ] **POST /api/reviews** - Đánh giá
- [ ] **GET /api/subscription/plans** - Gói Pro
- [ ] **POST /api/subscription/payment** - Thanh toán Pro

---

### ✅ PHASE 2: FRONTEND COMPONENTS

#### 🛒 Order Flow (Ưu tiên cao)

- [ ] **ProductDetail.jsx**
  - Click "Mua ngay" → Navigate đúng CreateOrder
  - Hiển thị đúng giá, thông tin sản phẩm
  
- [ ] **CreateOrder.jsx**
  - Load đúng preview checkout
  - Form địa chỉ hoạt động
  - Submit tạo order thành công
  - Navigate đến OrderDetail sau tạo
  
- [ ] **OrderDetail.jsx** ⚠️ (Đã fix nhưng cần test kỹ)
  - Hiển thị đầy đủ: order info, product, delivery, timeline
  - Actions buttons hiển thị đúng theo role và status
  - Seller: Xác nhận/Từ chối order
  - Buyer: Hủy order, Xác nhận nhận hàng
  - Review modal hiện sau khi complete (buyer)
  
- [ ] **MyOrders.jsx**
  - Tab "Đơn mua" hiển thị đúng orders
  - Tab "Đơn bán" hiển thị đúng sales
  - Filter theo status hoạt động
  - Actions từ list view hoạt động

- [ ] **MySales.jsx**
  - Hiển thị orders người khác mua từ mình
  - Xác nhận/từ chối order
  - Track delivery status

---

#### 🚚 Delivery Flow (Shipper)

- [ ] **DeliveryList.jsx**
  - Hiển thị đơn cần giao
  - Filter theo status
  - Nhận đơn thành công
  
- [ ] **DeliveryDetail.jsx**
  - Hiển thị đầy đủ thông tin giao hàng
  - Update status flow đúng
  - Upload ảnh inspection
  
- [ ] **DeliveryInspection.jsx**
  - Form kiểm tra sản phẩm
  - Upload ảnh trước/sau/phụ kiện
  - Submit inspection thành công

---

#### 🔐 Authentication

- [ ] **LoginPage.jsx**
  - Login email/password
  - Login với Google
  - Error handling
  - Redirect sau login
  
- [ ] **RegisterPage.jsx**
  - Register form
  - Password strength indicator
  - OTP verification flow

---

#### 💎 Pro Subscription

- [ ] **Subscription Plans Page**
  - Hiển thị 3 gói (1m, 3m, 12m)
  - Giá hiển thị đúng
  - Click "Nâng cấp" → VNPay
  
- [ ] **VNPay Return**
  - Xử lý callback thành công/thất bại
  - Update Pro status
  - Navigate đến Featured Products selection
  
- [ ] **SelectFeaturedProducts.jsx**
  - Chọn tối đa 3 sản phẩm
  - Submit thành công
  - Dismiss reminder

---

#### 📊 Admin Features

- [ ] **RevenueReport.jsx** (MỚI - của bạn)
  - Hiển thị tổng doanh thu
  - Doanh thu theo gói
  - List transactions
  - Filter và pagination
  
- [ ] **PostApprovals.jsx**
  - Duyệt/từ chối bài đăng
  
- [ ] **ViolationReports.jsx**
  - Xem báo cáo vi phạm
  - Resolve reports
  - Trừ điểm uy tín

---

### ✅ PHASE 3: INTEGRATION TESTS

#### Luồng hoàn chỉnh cần test:

1. **Luồng Mua Hàng (End-to-end)**
   ```
   Login → Tìm sản phẩm → Xem chi tiết → Mua ngay 
   → Điền địa chỉ → Tạo order → Seller xác nhận 
   → Shipper nhận đơn → Kiểm tra → Giao hàng 
   → Buyer xác nhận → Review
   ```

2. **Luồng Shipper (End-to-end)**
   ```
   Login Shipper → Xem đơn cần giao → Nhận đơn 
   → Đến lấy hàng → Kiểm tra sản phẩm → Upload ảnh 
   → Xác nhận lấy hàng → Giao cho buyer → Hoàn tất
   ```

3. **Luồng Pro Subscription (End-to-end)**
   ```
   Login User → Xem gói Pro → Chọn gói → Thanh toán VNPay 
   → Return success → Chọn 3 sản phẩm nổi bật → Save 
   → Sản phẩm hiển thị ưu tiên trên trang chủ
   ```

4. **Luồng Admin Revenue (End-to-end)**
   ```
   Login Admin → Vào Revenue Report → Xem thống kê 
   → Xem transactions → Filter theo gói/status → Check chi tiết
   ```

---

## 🐛 KNOWN ISSUES & FIXES

### ✅ Issue 1: OrderDetail không load sau merge
**Triệu chứng:** OrderDetail page bị lỗi khi mở  
**Nguyên nhân:** API response format thay đổi do serializers  
**Fix:** Đã update `order.controller.js` và `order.service.js`  
**Status:** ✅ FIXED

### ⚠️ Issue 2: Google OAuth cần env var
**Triệu chứng:** Google login không hoạt động  
**Nguyên nhân:** Thiếu `VITE_GOOGLE_CLIENT_ID` trong `.env`  
**Fix:** Thêm vào `.env`:
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```
**Status:** ⚠️ CẦN CONFIG

---

## 🔧 RECOMMENDED ACTIONS

### Priority 1: CRITICAL (Làm ngay)
1. ✅ Test OrderDetail page với nhiều trạng thái khác nhau
2. ✅ Test CreateOrder flow hoàn chỉnh
3. ✅ Test Delivery flow (Shipper)
4. ⚠️ Config Google OAuth credentials

### Priority 2: IMPORTANT (Làm trong ngày)
5. Test Pro Subscription payment flow
6. Test Featured Products selection
7. Test Review sau order completed
8. Test Admin Revenue Report

### Priority 3: NICE TO HAVE (Làm khi có thời gian)
9. Test tất cả edge cases
10. Performance testing
11. Mobile responsive testing
12. Cross-browser testing

---

## 📝 TESTING CHECKLIST TEMPLATE

Sử dụng template này khi test mỗi feature:

```
Feature: [Tên feature]
Tested by: [Tên người test]
Date: [Ngày test]
Browser: [Chrome/Firefox/Safari]

Test Case 1: [Mô tả]
- Steps: ...
- Expected: ...
- Actual: ...
- Status: ✅ PASS / ❌ FAIL
- Notes: ...

Test Case 2: ...
```

---

## 🚨 ROLLBACK PLAN

Nếu phát hiện lỗi nghiêm trọng không fix được ngay:

### Rollback về trước merge:
```bash
git reset --hard c4bb803
git push origin AnhDTD --force
```

### Hoặc revert merge commit:
```bash
git revert df29325 -m 1
git push origin AnhDTD
```

**Backup point:** `c4bb803` (trước khi merge)

---

## ✅ SIGN-OFF

- [ ] Đã test tất cả Critical APIs
- [ ] Đã test tất cả Order flows
- [ ] Đã test Delivery flows
- [ ] Đã test Pro Subscription
- [ ] Không còn error trong console
- [ ] Không còn warning quan trọng
- [ ] Ready for deployment

**Người kiểm tra:** _________________  
**Ngày hoàn thành:** _________________  
**Ghi chú:** _________________

---

**LƯU Ý:** Document này nên được update liên tục trong quá trình testing!
