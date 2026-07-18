const otpStore = new Map();

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const keyOf = (email, purpose) => `${email}:${purpose}`;

const getResendCooldown = (email, purpose) => {
  const record = otpStore.get(keyOf(email, purpose));
  if (!record) return 0;
  const remaining = RESEND_COOLDOWN_MS - (Date.now() - record.createdAt);
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

const saveOTP = (email, code, purpose) => {
  otpStore.set(keyOf(email, purpose), {
    code,
    expiry: Date.now() + OTP_TTL_MS,
    createdAt: Date.now(),
    attempts: 0,
  });
};

// Return an object: { success, reason?, attemptsLeft? }
const verifyOTP = (email, code, purpose) => {
  const key = keyOf(email, purpose);
  const record = otpStore.get(key);

  if (!record) return { success: false, reason: "not_found" };
  if (Date.now() > record.expiry) {
    otpStore.delete(key);
    return { success: false, reason: "expired" };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { success: false, reason: "locked" };
  }
  if (record.code !== code) {
    record.attempts += 1;
    const attemptsLeft = MAX_ATTEMPTS - record.attempts;
    if (attemptsLeft <= 0) {
      otpStore.delete(key);
      return { success: false, reason: "locked" };
    }
    return { success: false, reason: "invalid", attemptsLeft };
  }

  otpStore.delete(key);
  return { success: true };
};

module.exports = {
  generateOTP,
  saveOTP,
  verifyOTP,
  getResendCooldown,
};
