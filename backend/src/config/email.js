const nodemailer = require("nodemailer");

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const sendOTPEmail = async (to, otp, purpose) => {
  if (!process.env.EMAIL_USER) {
    console.log(`[DEV] OTP cho ${to} (${purpose}): ${otp}`);
    return;
  }

  const subject =
    purpose === "register" ? "Xác thực email đăng ký" : "Đặt lại mật khẩu";

  await createTransporter().sendMail({
    from: `"WDP301 Marketplace" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <h2>${subject}</h2>
      <p>Mã OTP của bạn là:</p>
      <h1 style="letter-spacing:4px">${otp}</h1>
      <p>Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này cho ai.</p>
    `,
  });
};

module.exports = { sendOTPEmail };
