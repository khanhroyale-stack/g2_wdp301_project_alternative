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
    // Timeout để tránh treo mãi
    connectionTimeout: 5000,   // 5s kết nối
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

const sendOTPEmail = async (to, otp, purpose) => {
  // Luôn log ra console khi dev để test nhanh
  console.log(`\n📧 OTP cho ${to} (${purpose}): ${otp}\n`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("[DEV] Chưa config EMAIL — chỉ log ra console");
    return;
  }

  const subject =
    purpose === "register" ? "Xác thực email đăng ký" : "Đặt lại mật khẩu";

  try {
    await createTransporter().sendMail({
      from: `"WDP301 Marketplace" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f9ff;border-radius:16px">
          <h2 style="color:#006c49;margin-bottom:8px">${subject}</h2>
          <p style="color:#3c4a42;margin-bottom:24px">Mã OTP của bạn là:</p>
          <div style="background:#fff;border:2px solid #006c49;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="letter-spacing:8px;color:#006c49;font-size:36px;margin:0">${otp}</h1>
          </div>
          <p style="color:#3c4a42;font-size:14px">Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này cho ai.</p>
        </div>
      `,
    });
  } catch (emailErr) {
    // Không throw — chỉ log lỗi, đăng ký vẫn tiếp tục được
    console.error("[Email] Lỗi gửi email:", emailErr.message);
    console.log(`[Fallback] OTP: ${otp}`);
  }
};

module.exports = { sendOTPEmail };
