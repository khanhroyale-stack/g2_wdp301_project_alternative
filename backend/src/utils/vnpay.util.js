const qs = require("qs");
const crypto = require("crypto");

// 1. Hàm sắp xếp và mã hóa URL theo chuẩn VNPay
const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    // Ép kiểu về String để tránh lỗi khi mã hóa các giá trị số (như vnp_Amount)
    sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, "+");
  }

  return sorted;
};

// 2. Hàm định dạng thời gian yyyyMMddHHmmss theo múi giờ GMT+7 (VNPay)
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

// 3. Hàm tạo URL thanh toán
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
    vnp_Amount: amount * 100, // VNPay yêu cầu nhân 100
    vnp_ReturnUrl: process.env.VNP_RETURNURL,
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: formatVnpDate(now),
    vnp_ExpireDate: formatVnpDate(new Date(now.getTime() + 15 * 60 * 1000)),
  };

  const sorted = sortObject(params);
  const signData = qs.stringify(sorted, { encode: false });

  const signed = crypto
    .createHmac("sha512", process.env.VNP_HASHSECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  sorted.vnp_SecureHash = signed;

  console.log("=== CHECK CONFIG VNPAY ===");
  console.log("Secret Key:", process.env.VNP_HASHSECRET);
  console.log("TMN Code:", process.env.VNP_TMNCODE);
  console.log("Chuỗi ký data:", signData);

  return `${process.env.VNP_URL}?${qs.stringify(sorted, { encode: false })}`;
};

// 4. Hàm xác thực dữ liệu trả về
const verifyReturn = (query) => {
  const data = { ...query };
  const secureHash = data.vnp_SecureHash;

  // Xóa các trường chứa mã băm trước khi tạo lại chuỗi ký
  delete data.vnp_SecureHash;
  delete data.vnp_SecureHashType;

  const sorted = sortObject(data);
  const signData = qs.stringify(sorted, { encode: false });

  const signed = crypto
    .createHmac("sha512", process.env.VNP_HASHSECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  let isValid = false;
  try {
    // Sử dụng timingSafeEqual để tăng cường bảo mật (ngăn chặn Timing Attacks)
    isValid = crypto.timingSafeEqual(
      Buffer.from(secureHash, "utf-8"),
      Buffer.from(signed, "utf-8")
    );
  } catch (e) {
    // timingSafeEqual sẽ throw error nếu độ dài 2 chuỗi khác nhau
    isValid = secureHash === signed;
  }

  return { isValid, data: query };
};

module.exports = { buildPaymentUrl, verifyReturn, sortObject, formatVnpDate };