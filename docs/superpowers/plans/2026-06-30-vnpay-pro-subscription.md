# VNPay Pro Subscription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép user mua gói "tài khoản Pro" (1m/3m/12m) thanh toán qua VNPay Sandbox, mở khoá đăng bài không giới hạn + ưu tiên hiển thị + badge Pro.

**Architecture:** Backend Express thêm model `ProSubscription` + field `proExpiresAt` trên `User`. Thanh toán theo luồng return-URL: backend ký URL VNPay (HMAC-SHA512), VNPay redirect về `/api/subscriptions/vnpay-return`, backend verify chữ ký rồi cộng dồn hạn Pro. Frontend thêm trang chọn gói + trang kết quả + badge.

**Tech Stack:** Node.js/Express, Mongoose 8, `crypto` + `querystring` (built-in, KHÔNG thêm dependency), React 18 + Vite, Axios. Test backend: `node --test` (`backend/test/*.test.js`).

## Global Constraints

- Controller bọc `try/catch`, trả JSON `{ success: true, data }` hoặc `{ success: false, message }` (status 4xx).
- Model khai báo `collection` trong options, dùng `timestamps: true`.
- Route prefix `/api/<resource>` số nhiều; `protect` trước route cần đăng nhập.
- Frontend gọi API qua `src/services/*`, không gọi axios trực tiếp trong component; base URL từ `src/services/api.js`.
- KHÔNG commit key thật vào git. Key VNPay chỉ trong `backend/.env`; `.env.example` dùng placeholder.
- KHÔNG thêm npm dependency mới.
- Số tiền VNPay = VND × 100. Cổng test: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`.
- Các gói (nguồn duy nhất, định nghĩa ở `business-rules.js`): `1m`=30 ngày/50000đ, `3m`=90 ngày/120000đ, `12m`=365 ngày/400000đ. `FREE_POST_LIMIT=5`.
- "Bài đang hoạt động" tính giới hạn = `postStatus ∈ {pending, approved, available}`.

---

## File Structure

**Backend — tạo mới:**
- `backend/src/utils/vnpay.util.js` — ký/verify chữ ký VNPay, build URL thanh toán.
- `backend/src/models/pro_subscription.model.js` — model `ProSubscription`.
- `backend/src/controllers/subscription.controller.js` — getPlans, createPayment, vnpayReturn, getMySubscriptions.
- `backend/src/routes/subscription.routes.js` — router `/api/subscriptions`.
- `backend/test/subscription.test.js` — test thuần cho business-rules mới + vnpay util.

**Backend — sửa:**
- `backend/src/utils/business-rules.js` — thêm `PRO_PLANS`, `FREE_POST_LIMIT`, `isUserPro`, `computeProExpiry`.
- `backend/src/models/user.model.js` — thêm `proExpiresAt`.
- `backend/src/controllers/auth.controller.js` — `formatUser` thêm `isPro`, `proExpiresAt`.
- `backend/src/controllers/product.controller.js` — enforce giới hạn bài + ưu tiên Pro + `ownerIsPro`.
- `backend/src/server.js` — mount route.
- `backend/.env.example` — thêm placeholder VNPay.

**Frontend — tạo mới:**
- `frontend/src/services/subscription.service.js`
- `frontend/src/pages/user/ProPlans.jsx` (`/goi-pro`)
- `frontend/src/pages/user/ProResult.jsx` (`/goi-pro/ket-qua`)
- `frontend/src/components/ui/ProBadge.jsx`

**Frontend — sửa:**
- `frontend/src/App.jsx` — 2 route mới.
- `frontend/src/components/Navbar.jsx` — link Pro + badge.
- `frontend/src/pages/product/Marketplace.jsx` — badge trên thẻ sản phẩm.
- `frontend/src/pages/product/CreatePost.jsx` — quota + xử lý 403.

---

## Task 1: Business rules cho Pro (pure functions + tests)

**Files:**
- Modify: `backend/src/utils/business-rules.js`
- Test: `backend/test/subscription.test.js` (create)

**Interfaces:**
- Produces:
  - `PRO_PLANS` — object `{ "1m": { durationDays: 30, amount: 50000 }, "3m": { durationDays: 90, amount: 120000 }, "12m": { durationDays: 365, amount: 400000 } }`
  - `FREE_POST_LIMIT` — number `5`
  - `isUserPro(user)` → boolean (`user.proExpiresAt` là Date/null)
  - `computeProExpiry(currentExpiry, durationDays, now)` → Date. `base = max(now, currentExpiry||now)`, kết quả = `base + durationDays` (ngày).

- [ ] **Step 1: Write the failing test**

Create `backend/test/subscription.test.js`:
```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  PRO_PLANS,
  FREE_POST_LIMIT,
  isUserPro,
  computeProExpiry,
} = require("../src/utils/business-rules");

const DAY = 24 * 60 * 60 * 1000;

test("PRO_PLANS holds the three agreed plans", () => {
  assert.equal(PRO_PLANS["1m"].durationDays, 30);
  assert.equal(PRO_PLANS["1m"].amount, 50000);
  assert.equal(PRO_PLANS["3m"].amount, 120000);
  assert.equal(PRO_PLANS["12m"].durationDays, 365);
  assert.equal(FREE_POST_LIMIT, 5);
});

test("isUserPro is true only when proExpiresAt is in the future", () => {
  const now = Date.now();
  assert.equal(isUserPro({ proExpiresAt: null }), false);
  assert.equal(isUserPro({ proExpiresAt: new Date(now - DAY) }), false);
  assert.equal(isUserPro({ proExpiresAt: new Date(now + DAY) }), true);
  assert.equal(isUserPro({}), false);
});

test("computeProExpiry extends from now when user has no active Pro", () => {
  const now = new Date("2026-06-30T00:00:00.000Z");
  const result = computeProExpiry(null, 30, now);
  assert.equal(result.getTime(), now.getTime() + 30 * DAY);
});

test("computeProExpiry stacks on top of remaining Pro time", () => {
  const now = new Date("2026-06-30T00:00:00.000Z");
  const current = new Date(now.getTime() + 5 * DAY);
  const result = computeProExpiry(current, 30, now);
  assert.equal(result.getTime(), current.getTime() + 30 * DAY);
});

test("computeProExpiry ignores expired Pro and counts from now", () => {
  const now = new Date("2026-06-30T00:00:00.000Z");
  const current = new Date(now.getTime() - 10 * DAY);
  const result = computeProExpiry(current, 90, now);
  assert.equal(result.getTime(), now.getTime() + 90 * DAY);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && node --test test/subscription.test.js`
Expected: FAIL — `PRO_PLANS`/`isUserPro`/`computeProExpiry` undefined.

- [ ] **Step 3: Add the implementation**

In `backend/src/utils/business-rules.js`, add before `module.exports`:
```js
const PRO_PLANS = {
  "1m": { durationDays: 30, amount: 50000 },
  "3m": { durationDays: 90, amount: 120000 },
  "12m": { durationDays: 365, amount: 400000 },
};

const FREE_POST_LIMIT = 5;

const isUserPro = (user) => {
  const expiry = user?.proExpiresAt;
  return !!(expiry && new Date(expiry).getTime() > Date.now());
};

const computeProExpiry = (currentExpiry, durationDays, now = new Date()) => {
  const nowMs = now.getTime();
  const currentMs = currentExpiry ? new Date(currentExpiry).getTime() : 0;
  const base = Math.max(nowMs, currentMs);
  return new Date(base + durationDays * 24 * 60 * 60 * 1000);
};
```

Add the four names to the existing `module.exports` object:
```js
module.exports = {
  normalizeInspectionOutcome,
  buildAvailableDeliveryClaimFilter,
  getProductAvailabilityStatus,
  isDeliveryTransitionAllowed,
  validateInspectionOutcome,
  validateProductBusinessRules,
  validateSellerCancellation,
  PRO_PLANS,
  FREE_POST_LIMIT,
  isUserPro,
  computeProExpiry,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && node --test test/subscription.test.js`
Expected: PASS (5 tests in this file so far).

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/business-rules.js backend/test/subscription.test.js
git commit -m "feat: add Pro plan rules and expiry computation"
```

---

## Task 2: VNPay signing util (pure functions + roundtrip test)

**Files:**
- Create: `backend/src/utils/vnpay.util.js`
- Test: `backend/test/subscription.test.js` (append)

**Interfaces:**
- Consumes: env `VNP_TMNCODE`, `VNP_HASHSECRET`, `VNP_URL`, `VNP_RETURNURL`.
- Produces:
  - `buildPaymentUrl({ amount, txnRef, orderInfo, ipAddr })` → string (full VNPay URL). `amount` là VND (hàm tự ×100).
  - `verifyReturn(query)` → `{ isValid: boolean, data: object }`. `query` là object đã URL-decode (như `req.query`).

- [ ] **Step 1: Write the failing test**

Append to `backend/test/subscription.test.js`:
```js
const querystring = require("node:querystring");

test("buildPaymentUrl then verifyReturn round-trips with a valid signature", () => {
  process.env.VNP_TMNCODE = "TESTCODE";
  process.env.VNP_HASHSECRET = "TESTSECRET";
  process.env.VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  process.env.VNP_RETURNURL = "http://localhost:5000/api/subscriptions/vnpay-return";
  const { buildPaymentUrl, verifyReturn } = require("../src/utils/vnpay.util");

  const url = buildPaymentUrl({
    amount: 50000,
    txnRef: "PRO-123",
    orderInfo: "Nang cap Pro 1m",
    ipAddr: "127.0.0.1",
  });
  const queryStr = url.split("?")[1];
  const parsed = querystring.parse(queryStr); // simulates Express decoding req.query

  assert.equal(parsed.vnp_Amount, "5000000"); // 50000 * 100
  const { isValid } = verifyReturn(parsed);
  assert.equal(isValid, true);
});

test("verifyReturn rejects a tampered amount", () => {
  process.env.VNP_TMNCODE = "TESTCODE";
  process.env.VNP_HASHSECRET = "TESTSECRET";
  process.env.VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  process.env.VNP_RETURNURL = "http://localhost:5000/api/subscriptions/vnpay-return";
  const { buildPaymentUrl, verifyReturn } = require("../src/utils/vnpay.util");

  const url = buildPaymentUrl({ amount: 50000, txnRef: "PRO-9", orderInfo: "x", ipAddr: "1.1.1.1" });
  const parsed = querystring.parse(url.split("?")[1]);
  parsed.vnp_Amount = "100"; // tamper
  assert.equal(verifyReturn(parsed).isValid, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && node --test test/subscription.test.js`
Expected: FAIL — cannot find module `../src/utils/vnpay.util`.

- [ ] **Step 3: Write the implementation**

Create `backend/src/utils/vnpay.util.js`:
```js
const crypto = require("crypto");
const querystring = require("querystring");

// Sort keys alphabetically AND URL-encode values exactly the way VNPay expects.
// Both signing and verifying must use this identical transform or the hash mismatches.
const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj)
    .map((key) => encodeURIComponent(key))
    .sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }
  return sorted;
};

// yyyyMMddHHmmss in GMT+7 (VNPay server timezone)
const formatVnpDate = (date) => {
  const gmt7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return (
    gmt7.getUTCFullYear().toString() +
    p(gmt7.getUTCMonth() + 1) +
    p(gmt7.getUTCDate()) +
    p(gmt7.getUTCHours()) +
    p(gmt7.getUTCMinutes()) +
    p(gmt7.getUTCSeconds())
  );
};

const buildPaymentUrl = ({ amount, txnRef, orderInfo, ipAddr }) => {
  const now = new Date();
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: process.env.VNP_TMNCODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: process.env.VNP_RETURNURL,
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: formatVnpDate(now),
    vnp_ExpireDate: formatVnpDate(new Date(now.getTime() + 15 * 60 * 1000)),
  };

  const sorted = sortObject(params);
  const signData = querystring.stringify(sorted, { encode: false });
  const signed = crypto
    .createHmac("sha512", process.env.VNP_HASHSECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");
  sorted.vnp_SecureHash = signed;
  return process.env.VNP_URL + "?" + querystring.stringify(sorted, { encode: false });
};

const verifyReturn = (query) => {
  const data = { ...query };
  const secureHash = data.vnp_SecureHash;
  delete data.vnp_SecureHash;
  delete data.vnp_SecureHashType;

  const sorted = sortObject(data);
  const signData = querystring.stringify(sorted, { encode: false });
  const signed = crypto
    .createHmac("sha512", process.env.VNP_HASHSECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  return { isValid: secureHash === signed, data: query };
};

module.exports = { buildPaymentUrl, verifyReturn, sortObject, formatVnpDate };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && node --test test/subscription.test.js`
Expected: PASS (all 7 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/vnpay.util.js backend/test/subscription.test.js
git commit -m "feat: add VNPay HMAC-SHA512 payment URL signing util"
```

---

## Task 3: ProSubscription model + User.proExpiresAt + formatUser

**Files:**
- Create: `backend/src/models/pro_subscription.model.js`
- Modify: `backend/src/models/user.model.js:102-106` (sau `accountStatus`, trước khi đóng object schema)
- Modify: `backend/src/controllers/auth.controller.js:41-55` (`formatUser`)

**Interfaces:**
- Produces: model `ProSubscription` với fields `userId, plan, durationDays, amount, vnpTxnRef, vnpTransactionNo, status, startsAt, expiresAt, note`; `User.proExpiresAt`; `formatUser` trả thêm `proExpiresAt`, `isPro`.

- [ ] **Step 1: Create the ProSubscription model**

Create `backend/src/models/pro_subscription.model.js`:
```js
const mongoose = require("mongoose");

const proSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: ["1m", "3m", "12m"],
      required: true,
    },
    durationDays: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    vnpTxnRef: {
      type: String,
      required: true,
      unique: true,
    },
    vnpTransactionNo: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
    },
    startsAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "pro_subscriptions",
  }
);

module.exports = mongoose.model("ProSubscription", proSubscriptionSchema);
```

- [ ] **Step 2: Add proExpiresAt to User**

In `backend/src/models/user.model.js`, inside `userSchema` fields, after the `accountStatus` block (line 102-106), add:
```js
    proExpiresAt: {
      type: Date,
      default: null,
    },
```

- [ ] **Step 3: Expose Pro status in formatUser**

In `backend/src/controllers/auth.controller.js`, update `formatUser` (line 41) to include two new lines before the closing `})`:
```js
  accountStatus: user.accountStatus,
  proExpiresAt: user.proExpiresAt,
  isPro: !!(user.proExpiresAt && new Date(user.proExpiresAt).getTime() > Date.now()),
});
```

- [ ] **Step 4: Sanity check models load**

Run: `cd backend && node -e "require('./src/models/pro_subscription.model'); require('./src/models/user.model'); console.log('models ok')"`
Expected: prints `models ok` (no schema errors).

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/pro_subscription.model.js backend/src/models/user.model.js backend/src/controllers/auth.controller.js
git commit -m "feat: add ProSubscription model and Pro status on user"
```

---

## Task 4: Subscription controller + routes + server mount + env

**Files:**
- Create: `backend/src/controllers/subscription.controller.js`
- Create: `backend/src/routes/subscription.routes.js`
- Modify: `backend/src/server.js:83` (thêm mount sau dòng `/api/upload`)
- Modify: `backend/.env.example` (thêm block VNPay)

**Interfaces:**
- Consumes: `PRO_PLANS`, `computeProExpiry` (Task 1); `buildPaymentUrl`, `verifyReturn` (Task 2); `ProSubscription` (Task 3); `protect` middleware.
- Produces routes:
  - `GET /api/subscriptions/plans`
  - `POST /api/subscriptions/create` (protect) — body `{ plan }` → `{ data: { paymentUrl } }`
  - `GET /api/subscriptions/vnpay-return` — redirect 302 về frontend
  - `GET /api/subscriptions/me` (protect) — `{ data: [subscriptions] }`

- [ ] **Step 1: Write the controller**

Create `backend/src/controllers/subscription.controller.js`:
```js
const ProSubscription = require("../models/pro_subscription.model");
const User = require("../models/user.model");
const { PRO_PLANS, computeProExpiry } = require("../utils/business-rules");
const { buildPaymentUrl, verifyReturn } = require("../utils/vnpay.util");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const getPlans = async (req, res) => {
  try {
    const plans = Object.entries(PRO_PLANS).map(([plan, info]) => ({
      plan,
      durationDays: info.durationDays,
      amount: info.amount,
    }));
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPayment = async (req, res) => {
  try {
    const { plan } = req.body;
    const planInfo = PRO_PLANS[plan];
    if (!planInfo) {
      return res.status(400).json({ success: false, message: "Goi Pro khong hop le" });
    }

    const txnRef = `PRO-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    await ProSubscription.create({
      userId: req.user._id,
      plan,
      durationDays: planInfo.durationDays,
      amount: planInfo.amount,
      vnpTxnRef: txnRef,
      status: "pending",
    });

    const ipAddr =
      req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
    const paymentUrl = buildPaymentUrl({
      amount: planInfo.amount,
      txnRef,
      orderInfo: `Nang cap Pro ${plan}`,
      ipAddr: String(ipAddr),
    });

    res.json({ success: true, data: { paymentUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const vnpayReturn = async (req, res) => {
  const resultUrl = (status) => `${CLIENT_URL}/goi-pro/ket-qua?status=${status}`;
  try {
    const { isValid, data } = verifyReturn(req.query);
    if (!isValid) {
      return res.redirect(resultUrl("failed"));
    }

    const sub = await ProSubscription.findOne({ vnpTxnRef: data.vnp_TxnRef });
    if (!sub) {
      return res.redirect(resultUrl("failed"));
    }

    // Idempotent: already activated on a previous return hit (e.g. refresh)
    if (sub.status === "paid") {
      return res.redirect(resultUrl("success"));
    }

    const paidOk =
      data.vnp_ResponseCode === "00" &&
      data.vnp_TransactionStatus === "00" &&
      Number(data.vnp_Amount) === sub.amount * 100;

    if (!paidOk) {
      sub.status = "failed";
      await sub.save();
      return res.redirect(resultUrl("failed"));
    }

    const user = await User.findById(sub.userId);
    if (!user) {
      sub.status = "failed";
      await sub.save();
      return res.redirect(resultUrl("failed"));
    }

    const now = new Date();
    const newExpiry = computeProExpiry(user.proExpiresAt, sub.durationDays, now);

    sub.status = "paid";
    sub.vnpTransactionNo = data.vnp_TransactionNo || null;
    sub.startsAt = now;
    sub.expiresAt = newExpiry;
    await sub.save();

    user.proExpiresAt = newExpiry;
    await user.save();

    return res.redirect(resultUrl("success"));
  } catch (error) {
    return res.redirect(resultUrl("failed"));
  }
};

const getMySubscriptions = async (req, res) => {
  try {
    const subscriptions = await ProSubscription.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPlans, createPayment, vnpayReturn, getMySubscriptions };
```

- [ ] **Step 2: Write the routes**

Create `backend/src/routes/subscription.routes.js`:
```js
const express = require("express");
const {
  getPlans,
  createPayment,
  vnpayReturn,
  getMySubscriptions,
} = require("../controllers/subscription.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/plans", getPlans);
router.post("/create", protect, createPayment);
router.get("/vnpay-return", vnpayReturn);
router.get("/me", protect, getMySubscriptions);

module.exports = router;
```

- [ ] **Step 3: Mount the route in server.js**

In `backend/src/server.js`, after line 83 (`app.use("/api/upload", ...)`), add:
```js
app.use("/api/subscriptions", require("./routes/subscription.routes"));
```

- [ ] **Step 4: Add VNPay placeholders to .env.example**

Append to `backend/.env.example`:
```
# ================================
# VNPAY SANDBOX
# ================================
VNP_TMNCODE=your_vnp_tmncode
VNP_HASHSECRET=your_vnp_hashsecret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURNURL=http://localhost:5000/api/subscriptions/vnpay-return
```

Then add the real sandbox values to `backend/.env` (NOT committed): `VNP_TMNCODE`, `VNP_HASHSECRET` from the VNPay email, plus the `VNP_URL` and `VNP_RETURNURL` above.

- [ ] **Step 5: Smoke test the plans route**

Run (with backend deps installed): `cd backend && node -e "require('./src/routes/subscription.routes'); console.log('routes ok')"`
Expected: prints `routes ok`.

Then start server (`npm run dev`) and run: `curl http://localhost:5000/api/subscriptions/plans`
Expected: JSON `{"success":true,"data":[{"plan":"1m",...},{"plan":"3m",...},{"plan":"12m",...}]}`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/subscription.controller.js backend/src/routes/subscription.routes.js backend/src/server.js backend/.env.example
git commit -m "feat: add subscription endpoints and VNPay return handler"
```

---

## Task 5: Enforce post limit + Pro priority + ownerIsPro flag

**Files:**
- Modify: `backend/src/controllers/product.controller.js` (imports line 6; `getProducts` line 166-201; `createProduct` line 232-265)

**Interfaces:**
- Consumes: `isUserPro`, `FREE_POST_LIMIT` (Task 1).
- Produces: `createProduct` chặn free user khi ≥5 bài active (403); `getProducts` trả mỗi product có `ownerIsPro`, sắp bài Pro lên đầu trang.

- [ ] **Step 1: Extend the business-rules import**

In `backend/src/controllers/product.controller.js` line 6, replace:
```js
const { validateProductBusinessRules } = require("../utils/business-rules");
```
with:
```js
const { validateProductBusinessRules, isUserPro, FREE_POST_LIMIT } = require("../utils/business-rules");
```

- [ ] **Step 2: Enforce the limit in createProduct**

In `createProduct` (line 232), right after `const payload = mapProductPayload(req.body);` and the imageIds line, before the existing `validationError` line, add the limit check:
```js
    if (!isUserPro(req.user)) {
      const activePosts = await ProductPost.countDocuments({
        ownerId: req.user._id,
        postStatus: { $in: ["pending", "approved", "available"] },
      });
      if (activePosts >= FREE_POST_LIMIT) {
        return res.status(403).json({
          success: false,
          message: `Ban da dat gioi han ${FREE_POST_LIMIT} bai dang. Nang cap Pro de dang khong gioi han.`,
        });
      }
    }
```

- [ ] **Step 3: Add ownerIsPro + Pro priority in getProducts**

In `getProducts` (line 176), change the `.populate("ownerId", ...)` to also select `proExpiresAt`:
```js
      .populate("ownerId", "fullName email avatarUrl phone reputationScore proExpiresAt")
```
Then, after `await attachImagesToProducts(products);` (line 184), add:
```js
    const nowMs = Date.now();
    for (const p of products) {
      p.ownerIsPro = !!(p.ownerId?.proExpiresAt && new Date(p.ownerId.proExpiresAt).getTime() > nowMs);
    }
    // Stable sort: Pro owners' posts first, keep existing order otherwise (within page)
    products.sort((a, b) => Number(b.ownerIsPro) - Number(a.ownerIsPro));
```

> Note: priority sort is applied within the fetched page (DB-level pagination stays unchanged). This is acceptable for the small demo scope; a global Pro-first ordering would require an aggregation `$lookup` and is intentionally out of scope.

- [ ] **Step 4: Add the enforcement test**

Append to `backend/test/subscription.test.js`:
```js
const { isUserPro: isPro2, FREE_POST_LIMIT: LIMIT } = require("../src/utils/business-rules");

test("free post limit constant is 5 and gates non-Pro users", () => {
  assert.equal(LIMIT, 5);
  // simulate the controller's guard expression
  const blocked = (user, activeCount) => !isPro2(user) && activeCount >= LIMIT;
  assert.equal(blocked({ proExpiresAt: null }, 5), true);
  assert.equal(blocked({ proExpiresAt: null }, 4), false);
  assert.equal(blocked({ proExpiresAt: new Date(Date.now() + 86400000) }, 99), false);
});
```

- [ ] **Step 5: Run tests + smoke check**

Run: `cd backend && node --test test/*.test.js`
Expected: PASS (all subscription + business-rules tests).

Run: `cd backend && node -e "require('./src/controllers/product.controller'); console.log('controller ok')"`
Expected: prints `controller ok`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/product.controller.js backend/test/subscription.test.js
git commit -m "feat: enforce free post limit and prioritize Pro listings"
```

---

## Task 6: Frontend subscription service + plan & result pages + routes

**Files:**
- Create: `frontend/src/services/subscription.service.js`
- Create: `frontend/src/pages/user/ProPlans.jsx`
- Create: `frontend/src/pages/user/ProResult.jsx`
- Modify: `frontend/src/App.jsx` (imports + 2 routes)

**Interfaces:**
- Consumes: `api` from `src/services/api.js`; `useAuth` from `src/context/AuthContext`; backend `/api/subscriptions/*`.
- Produces: routes `/goi-pro` (PrivateRoute) and `/goi-pro/ket-qua` (public).

> Frontend has no test runner configured — verification for these tasks is manual (run `npm run dev` and click through). TDD steps are replaced by explicit manual-verification steps.

- [ ] **Step 1: Create the service**

Create `frontend/src/services/subscription.service.js`:
```js
import api from "./api";

export const getPlans = () => api.get("/subscriptions/plans");
export const createPayment = (plan) => api.post("/subscriptions/create", { plan });
export const getMySubscriptions = () => api.get("/subscriptions/me");
```

> Confirm the axios base URL in `src/services/api.js` already includes `/api` (it is used by other services like `product.service.js`). If base is `http://localhost:5000/api`, the paths above are correct. Match whatever prefix existing services use.

- [ ] **Step 2: Create ProPlans page**

Create `frontend/src/pages/user/ProPlans.jsx`:
```jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getPlans, createPayment } from "../../services/subscription.service";
import { useAuth } from "../../context/AuthContext";

const PLAN_LABELS = { "1m": "1 tháng", "3m": "3 tháng", "12m": "12 tháng" };
const formatVnd = (n) => n.toLocaleString("vi-VN") + "đ";

export default function ProPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    getPlans()
      .then((res) => setPlans(res.data.data))
      .catch(() => toast.error("Không tải được danh sách gói"));
  }, []);

  const handleBuy = async (plan) => {
    try {
      setLoadingPlan(plan);
      const res = await createPayment(plan);
      window.location.href = res.data.data.paymentUrl;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tạo được thanh toán");
      setLoadingPlan(null);
    }
  };

  const isPro = user?.isPro;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Nâng cấp tài khoản Pro</h1>
      <p className="text-on-surface-variant mb-6">
        Đăng bài không giới hạn, ưu tiên hiển thị và huy hiệu Pro.
      </p>
      {isPro && (
        <div className="mb-6 rounded-lg bg-primary/10 p-4 text-sm">
          Bạn đang là Pro, hết hạn ngày{" "}
          {new Date(user.proExpiresAt).toLocaleDateString("vi-VN")}. Mua thêm để gia hạn.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p.plan} className="rounded-xl border p-5 flex flex-col">
            <div className="text-lg font-semibold">{PLAN_LABELS[p.plan] || p.plan}</div>
            <div className="text-2xl font-bold my-2">{formatVnd(p.amount)}</div>
            <div className="text-sm text-on-surface-variant mb-4">{p.durationDays} ngày</div>
            <button
              className="mt-auto rounded-lg bg-primary text-white py-2 disabled:opacity-60"
              disabled={loadingPlan === p.plan}
              onClick={() => handleBuy(p.plan)}
            >
              {loadingPlan === p.plan ? "Đang chuyển..." : isPro ? "Gia hạn" : "Nâng cấp"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ProResult page**

Create `frontend/src/pages/user/ProResult.jsx`:
```jsx
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProResult() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const { refreshUser } = useAuth();
  const [refreshed, setRefreshed] = useState(false);

  useEffect(() => {
    if (status === "success" && typeof refreshUser === "function" && !refreshed) {
      refreshUser().finally(() => setRefreshed(true));
    }
  }, [status, refreshUser, refreshed]);

  const success = status === "success";
  return (
    <div className="max-w-md mx-auto p-8 text-center">
      <h1 className={`text-2xl font-bold mb-3 ${success ? "text-green-600" : "text-red-600"}`}>
        {success ? "Thanh toán thành công" : "Thanh toán thất bại"}
      </h1>
      <p className="text-on-surface-variant mb-6">
        {success
          ? "Tài khoản của bạn đã được nâng cấp Pro."
          : "Giao dịch chưa hoàn tất. Bạn có thể thử lại."}
      </p>
      <div className="flex gap-3 justify-center">
        <Link to="/goi-pro" className="rounded-lg border px-4 py-2">Xem gói</Link>
        <Link to="/" className="rounded-lg bg-primary text-white px-4 py-2">Về trang chủ</Link>
      </div>
    </div>
  );
}
```

> If `AuthContext` does not expose `refreshUser`, use the existing method that re-fetches the current user (check `src/context/AuthContext.jsx` — it calls `/api/auth/me` on load; reuse that function name). The guard `typeof refreshUser === "function"` keeps the page safe if absent.

- [ ] **Step 4: Wire the routes in App.jsx**

In `frontend/src/App.jsx`, add imports near the other user-page imports (after line 26):
```jsx
import ProPlans from "./pages/user/ProPlans";
import ProResult from "./pages/user/ProResult";
```
Add routes inside `<Routes>`, near the other user routes (after the `/gio-hang` route, line 128):
```jsx
            <Route path="/goi-pro" element={<PrivateRoute><ProPlans /></PrivateRoute>} />
            <Route path="/goi-pro/ket-qua" element={<ProResult />} />
```

- [ ] **Step 5: Manual verification**

Start frontend (`cd frontend && npm run dev`) and backend. Log in, visit `/goi-pro`.
Expected: 3 gói hiển thị với giá 50.000đ / 120.000đ / 400.000đ. Bấm "Nâng cấp" → chuyển sang trang VNPay sandbox. Thanh toán bằng thẻ test NCB (số `9704198526191432198`, OTP `123456`) → quay về `/goi-pro/ket-qua?status=success`, hiện "Thanh toán thành công". Vào lại `/goi-pro` thấy dòng "Bạn đang là Pro, hết hạn ngày...".

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/subscription.service.js frontend/src/pages/user/ProPlans.jsx frontend/src/pages/user/ProResult.jsx frontend/src/App.jsx
git commit -m "feat: add Pro plans page, result page and routes"
```

---

## Task 7: ProBadge + integrate into Navbar, Marketplace, CreatePost

**Files:**
- Create: `frontend/src/components/ui/ProBadge.jsx`
- Modify: `frontend/src/components/Navbar.jsx`
- Modify: `frontend/src/pages/product/Marketplace.jsx`
- Modify: `frontend/src/pages/product/CreatePost.jsx`

**Interfaces:**
- Consumes: `useAuth` (for `user.isPro`); product objects with `ownerIsPro` (Task 5).
- Produces: reusable `<ProBadge />`; visible Pro entry point + badge.

> Verification is manual (no frontend test runner).

- [ ] **Step 1: Create the ProBadge component**

Create `frontend/src/components/ui/ProBadge.jsx`:
```jsx
import { Crown } from "lucide-react";

export default function ProBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 ${className}`}
    >
      <Crown size={12} />
      Pro
    </span>
  );
}
```

> `lucide-react` is already a dependency. If `Crown` is unavailable in the installed version, replace the icon with the text "★".

- [ ] **Step 2: Add Pro link + badge to Navbar**

In `frontend/src/components/Navbar.jsx`:
- Import at top: `import ProBadge from "./ui/ProBadge";`
- Where the logged-in user's avatar/name is rendered, conditionally show the badge: `{user?.isPro && <ProBadge className="ml-1" />}`.
- Add a navigation link to the upgrade page in the user menu/links: `<Link to="/goi-pro">Nâng cấp Pro</Link>` (match the existing link styling/structure in this file).

> Read `Navbar.jsx` first to match its exact markup (it already consumes `useAuth` and renders `Link`s). Insert into the existing authenticated-user block.

- [ ] **Step 3: Show badge on Marketplace product cards**

In `frontend/src/pages/product/Marketplace.jsx`:
- Import: `import ProBadge from "../../components/ui/ProBadge";`
- In the product card markup, near the seller name / card header, render: `{product.ownerIsPro && <ProBadge />}` (use the same variable name the map uses for each product).

> Read `Marketplace.jsx` first to find the card render and the per-item variable name.

- [ ] **Step 4: Show quota + handle 403 in CreatePost**

In `frontend/src/pages/product/CreatePost.jsx`, in the submit handler's `catch`, surface the limit error and link to upgrade:
```jsx
      if (err?.response?.status === 403) {
        toast.error(err.response.data.message);
        navigate("/goi-pro");
        return;
      }
```
> Read `CreatePost.jsx` first to confirm it already imports `toast` and `useNavigate` (App uses react-router; add `const navigate = useNavigate();` if missing). Place this inside the existing try/catch around the create call, before any generic error toast.

- [ ] **Step 5: Manual verification**

Run frontend. As a free user with 5 active posts, try to create a 6th → toast "Bạn đã đạt giới hạn 5 bài đăng..." and redirect to `/goi-pro`. As a Pro user, badge shows in Navbar; Pro sellers' posts show the Pro badge on Marketplace and appear at the top of the list.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ui/ProBadge.jsx frontend/src/components/Navbar.jsx frontend/src/pages/product/Marketplace.jsx frontend/src/pages/product/CreatePost.jsx
git commit -m "feat: add Pro badge and wire into navbar, marketplace, create-post"
```

---

## Final verification

- [ ] Run full backend test suite: `cd backend && node --test test/*.test.js` — all PASS.
- [ ] End-to-end: free user blocked at 6th post → upgrade → pay with NCB test card → return success → Pro active → unlimited posts + badge + priority ordering.
- [ ] Confirm `backend/.env` has real VNPay keys and is NOT staged in git (`git status` shows it untracked/ignored).
