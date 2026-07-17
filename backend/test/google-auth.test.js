const test = require("node:test");
const assert = require("node:assert/strict");

// Env can thiet cho controller (jwt + google client id)
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "test-client-id";

// ── Mock util verify Google token (thay bang gia tri test) ───────────
let fakePayload = null;
let verifyShouldThrow = false;
const googleUtilPath = require.resolve("../src/utils/google.util");
require.cache[googleUtilPath] = {
  id: googleUtilPath,
  filename: googleUtilPath,
  loaded: true,
  exports: {
    verifyGoogleIdToken: async () => {
      if (verifyShouldThrow) throw new Error("invalid token");
      return fakePayload;
    },
  },
};

// ── Mock User model (in-memory, khong dung Mongoose/DB) ──────────────
let users = [];
class FakeUserDoc {
  constructor(data) {
    Object.assign(this, data);
    if (!this._id) this._id = "id_" + (users.length + 1);
    if (!this.accountStatus) this.accountStatus = "active";
    if (!this.role) this.role = "user";
  }
  async save() {
    if (!users.includes(this)) users.push(this);
    return this;
  }
}
const matches = (u, cond) =>
  Object.entries(cond).every(([k, v]) => u[k] === v);
const FakeUser = {
  findOne: async (query) => {
    const conds = query.$or || [query];
    return users.find((u) => conds.some((c) => matches(u, c))) || null;
  },
  create: async (data) => {
    const doc = new FakeUserDoc(data);
    users.push(doc);
    return doc;
  },
};
const userModelPath = require.resolve("../src/models/user.model");
require.cache[userModelPath] = {
  id: userModelPath,
  filename: userModelPath,
  loaded: true,
  exports: FakeUser,
};

// Require controller SAU khi da inject cache
const { googleAuth } = require("../src/controllers/auth.controller");

const mockRes = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const reset = () => {
  users = [];
  fakePayload = null;
  verifyShouldThrow = false;
};

const validPayload = {
  sub: "google-sub-123",
  email: "New.User@Gmail.com",
  email_verified: true,
  name: "New User",
  picture: "https://img/pic.jpg",
};

test("googleAuth tao user moi khi email chua ton tai", async () => {
  reset();
  fakePayload = { ...validPayload };
  const res = mockRes();

  await googleAuth({ body: { credential: "tok" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, "new.user@gmail.com"); // normalize lowercase
  assert.equal(res.body.user.verificationStatus, "verified");
  assert.equal(users.length, 1);
  assert.equal(users[0].googleId, "google-sub-123");
  assert.equal(users[0].avatarUrl, "https://img/pic.jpg");
});

test("googleAuth tu dong link tai khoan cu cung email (chua co googleId)", async () => {
  reset();
  users.push(
    new FakeUserDoc({
      _id: "existing-1",
      email: "new.user@gmail.com",
      fullName: "Old Name",
      passwordHash: "hash",
      verificationStatus: "unverified",
      avatarUrl: null,
    })
  );
  fakePayload = { ...validPayload };
  const res = mockRes();

  await googleAuth({ body: { credential: "tok" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.id, "existing-1"); // van la user cu
  assert.equal(users.length, 1); // khong tao moi
  assert.equal(users[0].googleId, "google-sub-123"); // da link
  assert.equal(users[0].verificationStatus, "verified"); // duoc nang len verified
  assert.equal(users[0].avatarUrl, "https://img/pic.jpg"); // dien avatar con thieu
});

test("googleAuth tim user theo googleId da ton tai", async () => {
  reset();
  users.push(
    new FakeUserDoc({
      _id: "existing-2",
      email: "someone@else.com",
      googleId: "google-sub-123",
      fullName: "Google User",
    })
  );
  fakePayload = { ...validPayload };
  const res = mockRes();

  await googleAuth({ body: { credential: "tok" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.id, "existing-2");
  assert.equal(users.length, 1);
});

test("googleAuth chan tai khoan bi ban (403)", async () => {
  reset();
  users.push(
    new FakeUserDoc({
      _id: "banned-1",
      email: "new.user@gmail.com",
      googleId: "google-sub-123",
      accountStatus: "banned",
    })
  );
  fakePayload = { ...validPayload };
  const res = mockRes();

  await googleAuth({ body: { credential: "tok" } }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.success, false);
});

test("googleAuth tra 400 khi thieu credential", async () => {
  reset();
  const res = mockRes();
  await googleAuth({ body: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("googleAuth tra 401 khi token khong hop le", async () => {
  reset();
  verifyShouldThrow = true;
  const res = mockRes();
  await googleAuth({ body: { credential: "bad" } }, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
});

test("googleAuth tra 401 khi email Google chua verified", async () => {
  reset();
  fakePayload = { ...validPayload, email_verified: false };
  const res = mockRes();
  await googleAuth({ body: { credential: "tok" } }, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
});
