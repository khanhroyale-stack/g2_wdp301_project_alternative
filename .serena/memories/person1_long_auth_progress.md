# Người 1 (Long) — Account/Role/Verification/Reputation — Trạng thái

Đối chiếu code với `TASK.md` (Người 1). Thiết kế đã chốt: **OTP-only, KHÔNG KYC, KHÔNG admin duyệt tài khoản**; account status chỉ `active`/`banned`.

## Đã hoàn thiện
- **Account**: register, login, logout (client), forgot/reset/change password, get/update profile, public profile (`user.controller.js`, `auth.controller.js`).
- **Role**: enum `user/shipper/admin`, gán role qua admin, middleware `protect/adminOnly/shipperOnly/authorize` (`auth.middleware.js`).
- **Verification (OTP)**: gửi OTP khi register, verify OTP, resend OTP. OTP lưu in-memory Map, hết hạn 10 phút (`utils/otp.js`).
- **Reputation**: khởi tạo 100đ, trừ warning/minor/major = 10/20/50, lưu `ReputationLog`, auto-ban khi điểm=0, admin xem lịch sử + trừ thủ công (`reputation.controller.js`). Phần chắc nhất.

## Đã sửa trong session 2026-06-24 (A + B)
- **A — Login enforce xác thực email**:
  - User model: dùng `verificationStatus` = `unverified`/`verified` làm cờ email-verified (bỏ enum KYC pending/rejected). Bỏ `studentCardUrl`, `citizenIdUrl`. `accountStatus` còn `active`/`banned`.
  - `verifyEmail` set `verificationStatus="verified"` + save.
  - `login` chặn nếu chưa verified → trả 403 `{ needVerification:true, email }` và **gửi lại OTP mới**. Bỏ block "TEMPORARY DEV MODE" cho login không cần verify.
  - Frontend `LoginPage`: bắt `needVerification` → điều hướng `/xac-minh-otp` kèm state email.
- **B — Gỡ bỏ KYC hoàn toàn**:
  - Xoá backend: `verification.controller.js`, `verification.routes.js`, `verification_request.model.js`; gỡ mount `/api/verification` trong `server.js`; bỏ middleware `verifiedOnly` và `uploadVerification` (+ thư mục uploads/verification).
  - `stats.controller.js`: đếm `verificationStatus:"unverified"` thay cho `"pending"`.
  - Xoá frontend: `pages/auth/AccountVerification.jsx`, `pages/admin/AccountApprovals.jsx`; gỡ import/route trong `App.jsx`; gỡ link "Duyệt tài khoản" (Sidebar) và ô "Duyệt KYC" (AdminDashboard).
  - Điều hướng sau OTP (RegisterPage, VerifyOTPPage) → `/ho-so` thay vì trang KYC. Gỡ warning "tải lên giấy tờ" trong `Profile.jsx`.
- Verify: backend `node --check` pass; frontend `npm run build` pass (1933 modules).

## Đã thêm trong session 2026-06-24 (C — Hồ sơ chi tiết hơn)
- Thêm field profile vào đăng ký + trang Hồ sơ (tất cả **tùy chọn**): `dateOfBirth` (Date), `gender` (enum `male/female/other`), `address` (đã có sẵn). KHÔNG thêm CCCD vì trái thiết kế no-KYC.
  - `user.model.js`: thêm `dateOfBirth`, `gender` (default null).
  - `auth.controller.js` `register`: nhận `address/dateOfBirth/gender`; validate DOB (không tương lai, tuổi ≥13) + gender hợp lệ.
  - `user.controller.js` `updateMyProfile`: nhận thêm `dateOfBirth/gender`.
  - Frontend `RegisterPage` (RegisterForm): thêm ô ngày sinh (date, max=hôm nay), giới tính (select), địa chỉ.
  - `Profile.jsx`: tab Tổng quan hiển thị Ngày sinh + Giới tính; tab Chỉnh sửa thêm input date + select gender (format `dateOfBirth.split("T")[0]`).
- Verify: backend `node --check` pass; frontend `npm run build` pass (1933 modules).

## Đã thêm trong session 2026-06-24 (D — Siết bảo mật OTP)
- `utils/otp.js` viết lại, sở hữu toàn bộ logic cooldown + giới hạn nhập sai. Hằng số: `OTP_TTL_MS=10p`, `RESEND_COOLDOWN_MS=60s`, `MAX_ATTEMPTS=5`. Record giờ có thêm `createdAt`, `attempts`.
  - `verifyOTP` **đổi kiểu trả về**: từ boolean → object `{ success, reason?, attemptsLeft? }` (reason ∈ not_found/expired/locked/invalid). Sai quá 5 lần → khoá mã (xoá khỏi store), trả `locked`.
  - Thêm `getResendCooldown(email, purpose)` → số giây cooldown còn lại (0 = được gửi).
- `auth.controller.js`:
  - Thêm helper `otpErrorMessage(result)` map reason → message tiếng Việt; dùng ở `verifyEmail` + `resetPassword` (đã đổi sang nhận object).
  - Cooldown 60s (HTTP 429 + `retryAfter`) ở `resendOTP` và `forgotPassword`. `login` auto-resend chỉ gửi khi cooldown=0 (tránh spam).
  - `formatUser` bổ sung `dateOfBirth`, `gender` (để user object sau login/getMe có đủ field mục C).
- Verify: backend `node --check` pass (`utils/otp.js`, `auth.controller.js`).
- Frontend `VerifyOTPPage` vốn đã có cooldown 60s riêng → không cần sửa; backend giờ là nguồn chân lý.

## Còn thiếu nhỏ so với spec (chưa làm, ưu tiên thấp)
- OTP vẫn lưu in-memory Map → mất khi restart server, không chạy multi-instance. Muốn production-ready cần chuyển sang Redis/DB (TTL key) — là thay đổi hạ tầng, cố tình bỏ qua cho scope đồ án. Đã ghi chú ngay trong `utils/otp.js`.

## Ranh giới với người khác — Reputation (đã rà 2026-06-24)
- Reputation **là phần của Long** trên giấy phân công. Code lõi: `reputation.controller.js` (getMyReputation/getUserReputation/adminDeduct/adminGetHistory), `reputation.routes.js`, `reputation_log.model.js`, field `reputationScore` + auto-ban. ✅ xong.
- NHƯNG đường trừ điểm **tự động** khi admin xử lý report nằm trong `report.controller.js` `resolveReport` (module **Report của Khánh – Người 5**), **lặp lại** logic trừ + auto-ban + `ReputationLog.create` và **copy hằng số** `VIOLATION_POINTS={warning:10,minor:20,major:50}` y hệt bên reputation.controller.
- `services/report.service.js` có stub `processReport` rỗng + comment "phát event để người 1 lắng nghe trừ điểm" → cơ chế event tách bạch **bị bỏ dở**, chưa nối.
- Cải thiện tùy chọn (chưa làm, đụng file Khánh nên cần thống nhất trước): gom về 1 hàm `deductReputation()` của Long cho report gọi vào, bỏ code lặp.
