const otpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const saveOTP = (email, code, purpose) => {
  otpStore.set(`${email}:${purpose}`, {
    code,
    expiry: Date.now() + 10 * 60 * 1000,
  });
};

const verifyOTP = (email, code, purpose) => {
  const key = `${email}:${purpose}`;
  const record = otpStore.get(key);
  if (!record) return false;
  if (Date.now() > record.expiry) {
    otpStore.delete(key);
    return false;
  }
  if (record.code !== code) return false;
  otpStore.delete(key);
  return true;
};

module.exports = { generateOTP, saveOTP, verifyOTP };
