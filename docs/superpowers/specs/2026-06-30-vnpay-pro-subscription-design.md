# Thiết kế: Nâng cấp tài khoản Pro qua VNPay Sandbox

**Ngày:** 2026-06-30
**Dự án:** EcoTrade (WDP301) — marketplace C2C thuê & mua bán đồ dùng
**Phạm vi:** Thêm tính năng mua gói "tài khoản Pro" thanh toán qua VNPay Sandbox. KHÔNG dùng ví nội bộ.

---

## 1. Mục tiêu & bối cảnh

Người dùng có thể mua gói **Pro** theo thời hạn để được:

1. **Đăng bài không giới hạn** (free user bị giới hạn 5 bài đang hoạt động).
2. **Ưu tiên hiển thị + badge "Pro"** trên Marketplace và trang cá nhân.

Hệ thống nhỏ, phục vụ demo/chấm điểm môn học → ưu tiên đơn giản, chạy được trên `localhost`, không cần public URL.

**Stack:** Backend Node.js/Express + Mongoose; Frontend React 18 + Vite. (Lưu ý: code PayOS mẫu ban đầu là Java Spring Boot — KHÔNG tái sử dụng; thiết kế này port sang Node + VNPay.)

### Quyết định đã chốt
- Cổng thanh toán: **VNPay Sandbox** (không phải PayOS) — vì test dùng thẻ giả, không mất tiền thật.
- Xác nhận thanh toán: **return-URL + verify chữ ký** (phương án B), **không dùng IPN/webhook** (cần public URL, không hợp localhost). Production thật nên bổ sung IPN sau.
- Lưu dữ liệu mua gói: **model mới `ProSubscription`** (không nới `Transaction` cũ — tránh làm rối model đang phục vụ order/rental).
- 3 gói theo thời hạn; gia hạn **cộng dồn** thời gian.

---

## 2. Các gói Pro

| Gói (`plan`) | Thời hạn (`durationDays`) | Giá (`amount`) |
|---|---|---|
| `1m` | 30 ngày | 50.000đ |
| `3m` | 90 ngày | 120.000đ |
| `12m` | 365 ngày | 400.000đ |

Danh sách gói khai báo tập trung 1 chỗ ở backend (vd `utils/business-rules.js`) và expose qua `GET /api/subscriptions/plans` để frontend lấy, tránh hardcode 2 nơi.

**Giới hạn bài đăng free:** `FREE_POST_LIMIT = 5`.

---

## 3. Data model

### 3.1. Model mới `ProSubscription` — collection `pro_subscriptions`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `userId` | ObjectId ref `User`, required | ai mua |
| `plan` | String enum `["1m","3m","12m"]`, required | gói |
| `durationDays` | Number, required | 30 / 90 / 365 |
| `amount` | Number, required, min 0 | 50000 / 120000 / 400000 (VND) |
| `vnpTxnRef` | String, required, unique | mã đơn gửi VNPay, vd `PRO-<timestamp>-<rand>` |
| `vnpTransactionNo` | String, default null | mã giao dịch VNPay trả về (lưu khi paid) |
| `status` | String enum `["pending","paid","failed","cancelled"]`, default `pending` | |
| `startsAt` | Date, default null | set khi paid |
| `expiresAt` | Date, default null | set khi paid = `max(now, user.proExpiresAt cũ) + durationDays` |
| `note` | String, default null | |
| `timestamps` | | `createdAt`/`updatedAt` |

Khai báo `collection: "pro_subscriptions"` trong schema options (theo quy tắc dự án).

### 3.2. Thêm field vào `User` model

```js
proExpiresAt: { type: Date, default: null }
```

- Là Pro ⇔ `proExpiresAt != null && proExpiresAt > now`. Không cần cron job — kiểm tra theo ngày tại thời điểm dùng.
- Lịch sử mua nằm trong `ProSubscription`; `User` chỉ giữ trạng thái hiện tại.

### 3.3. Cập nhật `formatUser` (auth.controller.js:41)

Thêm vào object trả về:
```js
proExpiresAt: user.proExpiresAt,
isPro: !!(user.proExpiresAt && user.proExpiresAt > new Date()),
```

---

## 4. Cấu hình & biến môi trường

Thêm vào `backend/.env` (KHÔNG commit — đã được `.gitignore`):

```
VNP_TMNCODE=<tmncode sandbox>
VNP_HASHSECRET=<secret sandbox>
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURNURL=http://localhost:5000/api/subscriptions/vnpay-return
```

Thêm placeholder tương ứng vào `backend/.env.example` (không có giá trị thật).

> Key sandbox là bí mật kiểm thử — vẫn không được commit lên git.

---

## 5. Backend — files & API

### 5.1. Files mới
- `backend/src/utils/vnpay.util.js`
- `backend/src/models/pro_subscription.model.js`
- `backend/src/controllers/subscription.controller.js`
- `backend/src/routes/subscription.routes.js`

### 5.2. Files sửa
- `backend/src/models/user.model.js` — thêm `proExpiresAt`.
- `backend/src/controllers/auth.controller.js` — `formatUser` thêm `isPro`, `proExpiresAt`.
- `backend/src/utils/business-rules.js` — thêm `PRO_PLANS`, `FREE_POST_LIMIT = 5`, helper `isUserPro(user)`.
- `backend/src/controllers/product.controller.js` — enforce giới hạn bài đăng + ưu tiên hiển thị + cờ `ownerIsPro`.
- `backend/src/server.js` — mount `app.use("/api/subscriptions", require("./routes/subscription.routes"))`.

### 5.3. `vnpay.util.js` (dùng module `crypto` built-in, không thêm dependency)
- `buildPaymentUrl({ amount, txnRef, orderInfo, ipAddr, returnUrl })`:
  - Tập params chuẩn VNPay: `vnp_Version="2.1.0"`, `vnp_Command="pay"`, `vnp_TmnCode`, `vnp_Amount = amount*100`, `vnp_CurrCode="VND"`, `vnp_TxnRef`, `vnp_OrderInfo`, `vnp_OrderType="other"`, `vnp_Locale="vn"`, `vnp_ReturnUrl`, `vnp_IpAddr`, `vnp_CreateDate` (yyyyMMddHHmmss, GMT+7), `vnp_ExpireDate` (+15 phút).
  - **Sort param theo alphabet**, build query string (URL-encode đúng chuẩn VNPay), ký `HMAC-SHA512` bằng `VNP_HASHSECRET` → gắn `vnp_SecureHash`.
  - Trả về `VNP_URL + "?" + query`.
- `verifyReturn(query)`:
  - Tách `vnp_SecureHash` khỏi query, sort phần còn lại, ký lại, so sánh.
  - Trả `{ isValid, data }`.

> Lưu ý kỹ thuật: thứ tự sort + cách encode phải khớp tuyệt đối giữa lúc ký và lúc verify, nếu không hash sẽ lệch (đây là lỗi tích hợp VNPay phổ biến nhất). Dùng cùng 1 hàm encode cho cả hai chiều.

### 5.4. API endpoints (`/api/subscriptions`)

| Method | Path | Middleware | Mô tả |
|---|---|---|---|
| GET | `/plans` | — | Trả 3 gói (plan, durationDays, amount). |
| POST | `/create` | `protect` | Body `{ plan }`. Validate plan; tạo `ProSubscription` status=`pending`, sinh `vnpTxnRef`; build URL VNPay; trả `{ success:true, data:{ paymentUrl } }`. |
| GET | `/vnpay-return` | — | VNPay redirect về. Verify hash → nếu `vnp_ResponseCode="00"` & số tiền khớp → activate Pro; **redirect 302** về frontend `/goi-pro/ket-qua?status=success` (hoặc `failed`). |
| GET | `/me` | `protect` | Lịch sử mua gói của user hiện tại. |

### 5.5. Logic `vnpay-return` (kích hoạt Pro)
1. `verifyReturn(req.query)` → sai chữ ký ⇒ redirect `?status=failed`.
2. Tìm `ProSubscription` theo `vnpTxnRef`. Không thấy ⇒ failed.
3. **Idempotent:** nếu đã `paid` ⇒ redirect `?status=success` luôn, KHÔNG cộng hạn lần nữa.
4. Check `vnp_ResponseCode === "00"` && `vnp_TransactionStatus === "00"` && `Number(vnp_Amount) === sub.amount * 100`. Sai ⇒ set `failed`, redirect `?status=failed`.
5. Thành công:
   - `sub.status = "paid"`, `sub.vnpTransactionNo = vnp_TransactionNo`, `sub.startsAt = now`.
   - Tính `base = max(now, user.proExpiresAt || now)`; `newExpiry = base + durationDays`.
   - `sub.expiresAt = newExpiry`; `user.proExpiresAt = newExpiry`; lưu cả hai.
   - Redirect `?status=success`.

---

## 6. Enforcement

### 6.1. Giới hạn bài đăng (free = 5)
Trong hàm tạo bài (`product.controller.js`), trước khi tạo:
```
if (!isUserPro(req.user)) {
  const active = await ProductPost.countDocuments({
    ownerId: req.user._id,
    postStatus: { $in: ["pending", "approved", "available"] },
  });
  if (active >= FREE_POST_LIMIT) {
    return res.status(403).json({
      success: false,
      message: "Bạn đã đạt giới hạn 5 bài đăng. Nâng cấp Pro để đăng không giới hạn.",
    });
  }
}
```
Pro ⇒ bỏ qua check. "Bài đang hoạt động" = `postStatus ∈ {pending, approved, available}`.

### 6.2. Ưu tiên hiển thị + badge
Trong list Marketplace (`product.controller.js`):
- Populate `ownerId` kèm `proExpiresAt`.
- Tính `ownerIsPro` cho mỗi bài; thêm vào response.
- Sắp xếp: **bài của Pro lên trước**, trong cùng nhóm thì theo `createdAt` mới nhất. (Hệ thống nhỏ → sort trong JS sau populate, không cần aggregation.)

---

## 7. Frontend — files & UI

### 7.1. Files mới
- `frontend/src/services/subscription.service.js` — `getPlans()`, `createPayment(plan)`, `getMySubscriptions()`.
- `frontend/src/pages/user/ProPlans.jsx` — route `/goi-pro`.
- `frontend/src/pages/user/ProResult.jsx` — route `/goi-pro/ket-qua`.
- `frontend/src/components/ui/ProBadge.jsx` — badge vương miện + "Pro".

### 7.2. Files sửa
- `frontend/src/App.jsx` — thêm 2 route (bọc `PrivateRoute` cho `/goi-pro`; `/goi-pro/ket-qua` công khai để nhận redirect).
- `Navbar` / `Sidebar` — link "Nâng cấp Pro"; hiện `ProBadge` cạnh avatar nếu `isPro`.
- `pages/product/Marketplace.jsx` + thẻ sản phẩm — render `ProBadge` khi `ownerIsPro`.
- `pages/user/PublicProfile.jsx` + `Profile.jsx` — hiện `ProBadge` / ngày hết hạn.
- `pages/product/CreatePost.jsx` — hiện "Đã dùng X/5 bài" cho free; khi nhận 403 → toast + nút tới `/goi-pro`.

### 7.3. Luồng frontend
1. `/goi-pro`: hiển thị 3 gói (từ `getPlans`). Nếu đang Pro → hiện ngày hết hạn + nút "Gia hạn".
2. Bấm "Nâng cấp" → `createPayment(plan)` → `window.location = paymentUrl`.
3. Thanh toán trên VNPay sandbox bằng thẻ test NCB.
4. VNPay → backend `/vnpay-return` → backend redirect về `/goi-pro/ket-qua?status=...`.
5. `ProResult.jsx`: đọc `?status`; nếu success → gọi `/api/auth/me` refresh user (cập nhật `isPro`), hiện thông báo + nút điều hướng.

---

## 8. Xử lý lỗi & bảo mật

- Chữ ký HMAC sai/thiếu param ⇒ failed, KHÔNG kích hoạt.
- Số tiền `vnp_Amount` không khớp gói ⇒ failed (chống sửa giá phía client).
- Pro chỉ kích hoạt khi: chữ ký hợp lệ **và** `vnp_ResponseCode="00"` **và** số tiền khớp. Không tin client.
- Gọi `/vnpay-return` 2 lần (refresh) ⇒ idempotent theo `vnpTxnRef` + check `status` đã `paid`.
- Mọi controller bọc `try/catch`, trả JSON chuẩn `{ success, ... }` theo quy tắc dự án.

---

## 9. Testing

- Backend dùng `node --test` (`test/*.test.js`).
- Unit test `vnpay.util.js`:
  - `buildPaymentUrl` rồi `verifyReturn` trên cùng bộ param ⇒ chữ ký khớp.
  - Sửa 1 param sau khi ký ⇒ `verifyReturn` trả `isValid=false`.
- Unit test logic cộng dồn `expiresAt`:
  - User chưa Pro (`proExpiresAt=null`) mua 1m ⇒ expiry ≈ now+30d.
  - User còn hạn 5 ngày mua 1m ⇒ expiry ≈ now+35d.
- Test enforcement đếm bài: free đủ 5 bài active ⇒ 403; Pro ⇒ tạo được.

---

## 10. Ngoài phạm vi (YAGNI)

- IPN/webhook (cần public URL) — production thật mới bổ sung.
- Gia hạn tự động định kỳ (recurring).
- Hoàn tiền / hủy gói giữa chừng.
- Nhiều bậc Pro khác nhau (chỉ 1 cấp Pro).
- Ví nội bộ / số dư.
