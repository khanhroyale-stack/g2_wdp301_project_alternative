// Lưu OTP in-memory. LƯU Ý: mất khi restart server và không chạy được multi-instance.
// Với scope đồ án thì chấp nhận được; nếu lên production cần chuyển sang Redis/DB (TTL key).
const otpStore = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // OTP sống 10 phút
const RESEND_COOLDOWN_MS = 60 * 1000; // chặn gửi lại trong 60 giây
const MAX_ATTEMPTS = 5; // số lần nhập sai tối đa trước khi khoá mã

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const keyOf = (email, purpose) => `${email}:${purpose}`;

// Số giây còn lại của cooldown gửi lại OTP; 0 nghĩa là được phép gửi.
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

// Trả về object: { success, reason?, attemptsLeft? }
// reason ∈ "not_found" | "expired" | "locked" | "invalid"
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
  RESEND_COOLDOWN_MS,
  MAX_ATTEMPTS,
};
