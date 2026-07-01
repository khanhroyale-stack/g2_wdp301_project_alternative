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

const { isUserPro: isPro2, FREE_POST_LIMIT: LIMIT } = require("../src/utils/business-rules");

test("free post limit constant is 5 and gates non-Pro users", () => {
  assert.equal(LIMIT, 5);
  // simulate the controller's guard expression
  const blocked = (user, activeCount) => !isPro2(user) && activeCount >= LIMIT;
  assert.equal(blocked({ proExpiresAt: null }, 5), true);
  assert.equal(blocked({ proExpiresAt: null }, 4), false);
  assert.equal(blocked({ proExpiresAt: new Date(Date.now() + 86400000) }, 99), false);
});
