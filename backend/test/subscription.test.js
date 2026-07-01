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
