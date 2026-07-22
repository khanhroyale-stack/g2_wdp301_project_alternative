const qs = require("qs");
const crypto = require("crypto");

const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, "+");
  }

  return sorted;
};

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

const assertVnpayConfig = () => {
  const requiredEnv = ["VNP_TMNCODE", "VNP_HASHSECRET", "VNP_RETURNURL", "VNP_URL"];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length) {
    throw new Error(`Thieu cau hinh VNPay: ${missingEnv.join(", ")}`);
  }
};

const buildPaymentUrl = ({ amount, txnRef, orderInfo, ipAddr, returnUrl }) => {
  assertVnpayConfig();

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
    vnp_ReturnUrl: returnUrl || process.env.VNP_RETURNURL,
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

  return `${process.env.VNP_URL}?${qs.stringify(sorted, { encode: false })}`;
};

const verifyReturn = (query) => {
  assertVnpayConfig();

  const data = { ...query };
  const secureHash = data.vnp_SecureHash;

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
    isValid = crypto.timingSafeEqual(
      Buffer.from(secureHash || "", "utf-8"),
      Buffer.from(signed, "utf-8")
    );
  } catch (e) {
    isValid = secureHash === signed;
  }

  return { isValid, data: query };
};

module.exports = { buildPaymentUrl, verifyReturn, sortObject, formatVnpDate };
