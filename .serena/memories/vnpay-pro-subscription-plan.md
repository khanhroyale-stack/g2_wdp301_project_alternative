# Tính năng: Nâng cấp tài khoản Pro qua VNPay Sandbox (ĐÃ IMPLEMENT XONG — BỊ CHẶN BỞI LỖI SECRET VNPAY)

Implement xong ngày 2026-07-01 trên branch `LongTNP-PaymentMethod`, theo plan `docs/superpowers/plans/2026-06-30-vnpay-pro-subscription.md` (7 task TDD). Code + test đã commit (7 commit `9e43fa9`..`9f530e2`). Backend: 16/16 test pass. Frontend: build OK. UI hiển thị đúng.

## ⛔ LỖI ĐANG CHẶN E2E: VNPay báo "Sai chữ ký" (Error.html?code=70)
Khi bấm "Nâng cấp" → redirect sang VNPay → VNPay trả trang lỗi **"Sai chữ ký" (code=70)**, KHÔNG vào được trang nhập thẻ.

**Đã chẩn đoán kỹ ngày 2026-07-01 — KẾT LUẬN: CODE ĐÚNG, lỗi ở phía credentials VNPay:**
- `signData` (canonicalization) giống **byte-for-byte** với lib `qs` chính thức VNPay dùng (`MINE == QS ? true`). Express đã kéo sẵn `qs` nên test được: `require('qs')`.
- HMAC-SHA512 kiểm bằng **openssl** (độc lập Node crypto) ra **đúng y hệt** chữ ký backend gửi.
- `VNP_HASHSECRET` trong `.env` = `SBIYSZFWN0C180U6ST2JGKB63JD28QSW` và `VNP_TMNCODE` = `RNO6XMKU` — **khớp email VNPay 100%** (secret đủ 32 ký tự, so sánh full string === true).
- URL sinh ra **tự verify TRUE** với secret thật (mô phỏng đúng cách VNPay decode→re-encode→hash).
- Thử request tối giản kiểu demo (bỏ `vnp_ExpireDate`, ép `vnp_IpAddr=127.0.0.1`) → VNPay **vẫn** báo sai chữ ký ⇒ không phải do tập trường/field.
- Trình duyệt KHÔNG biến đổi URL khi `window.location.href` (`+` và `%3A%2F%2F` giữ nguyên).

**⇒ Vì chữ ký là hàm tất định của `hashData + secret`, và cả hai đã chứng minh đúng + openssl xác nhận, việc VNPay tính ra chữ ký khác nghĩa là SECRET VNPAY LƯU CHO `RNO6XMKU` KHÁC với `SBIYSZFWN0C180U6ST2JGKB63JD28QSW`** (khả năng: secret đã bị regenerate sau khi email gửi, hoặc có nhiều terminal).

**CÁCH SỬA:** Đăng nhập Merchant Admin Sandbox https://sandbox.vnpayment.vn/merchantv2/ (user `tplong2003@gmail.com`) → xem/regenerate Secret Key thực tế đang active cho `RNO6XMKU` → cập nhật `VNP_HASHSECRET` trong `backend/.env`. KHÔNG cần sửa code. (Lệnh test lại: `require('dotenv').config()` rồi `buildPaymentUrl(...)` → `verifyReturn(querystring.parse(url.split('?')[1]))` phải TRUE — nhưng cái đó luôn TRUE; điểm mấu chốt là VNPay phải chấp nhận, chỉ verify được bằng cách redirect thật.)

## Đã làm (code)
- **Backend mới:** `utils/vnpay.util.js` (ký/verify HMAC-SHA512), `models/pro_subscription.model.js`, `controllers/subscription.controller.js`, `routes/subscription.routes.js`, `test/subscription.test.js`.
- **Backend sửa:** `business-rules.js` (PRO_PLANS, FREE_POST_LIMIT=5, isUserPro, computeProExpiry), `user.model.js` (proExpiresAt), `auth.controller.js` (formatUser + isPro/proExpiresAt), `product.controller.js` (chặn free ≥5 bài active 403 + ownerIsPro + sort Pro-first trong page), `server.js` (mount `/api/subscriptions`), `.env.example`.
- **Frontend mới:** `services/subscription.service.js` (default-export object trả `response.data`, theo convention project — KHÁC plan), `pages/user/ProPlans.jsx` (`/goi-pro`), `pages/user/ProResult.jsx` (`/goi-pro/ket-qua`), `components/ui/ProBadge.jsx` (`Crown` từ lucide-react).
- **Frontend sửa:** `App.jsx`, `Navbar.jsx` (link "Nâng cấp Pro" + badge, dropdown + mobile), `Marketplace.jsx` (badge cạnh tên seller khi `product.ownerIsPro`), `CreatePost.jsx` (403 → alert + redirect `/goi-pro`).

## 2 điểm LỆCH so với plan (cố ý)
1. **BUG trong plan đã sửa:** plan dùng `querystring.stringify(sorted, { encode: false })` — nhưng `{encode:false}` là option của lib `qs`, KHÔNG phải querystring built-in của Node (arg thứ 2 là separator → thành `[object Object]`). Đã thay bằng helper `stringifyEncoded` tự join `key=value&...` (giá trị đã encode sẵn bởi `sortObject`). Helper này đã được chứng minh == `qs.stringify(...,{encode:false})`.
2. **subscription.service.js** viết theo convention project (giống `product.service.js`) thay vì trả raw axios promise như plan. Pages đọc `res.data`.

## Env (.env, KHÔNG commit — đã có đủ 4 key)
`VNP_TMNCODE=RNO6XMKU`, `VNP_HASHSECRET=SBIYSZFWN0C180U6ST2JGKB63JD28QSW` (⚠️ nghi ngờ secret này VNPay không còn nhận — xem lỗi trên), `VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`, `VNP_RETURNURL=http://localhost:5000/api/subscriptions/vnpay-return`. `.env.example` có placeholder.

## API
- `GET /api/subscriptions/plans`
- `POST /api/subscriptions/create` (protect) → `{ data: { paymentUrl } }`
- `GET /api/subscriptions/vnpay-return` → redirect `CLIENT_URL/goi-pro/ket-qua?status=success|failed`
- `GET /api/subscriptions/me` (protect)

## Thẻ test VNPay (từ email)
NCB, số thẻ `9704198526191432198`, tên NGUYEN VAN A, phát hành 07/15, OTP `123456`. (Người dùng tự nhập — Claude không nhập số thẻ.)

## CÒN LẠI
Sửa secret VNPay (như trên) → chạy lại backend+frontend → test luồng mua gói end-to-end.
