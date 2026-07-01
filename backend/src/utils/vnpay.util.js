const crypto = require("crypto");

// Join an already-encoded, already-sorted param object into `key=value&key=value`
// WITHOUT re-encoding. Node's built-in querystring.stringify would double-encode the
// values (and its 2nd arg is the separator, not a `{ encode: false }` option like `qs`),
// so we build the string ourselves to match VNPay's signing expectations exactly.
const stringifyEncoded = (obj) =>
  Object.keys(obj)
    .map((key) => `${key}=${obj[key]}`)
    .join("&");

// Sort keys alphabetically AND URL-encode values exactly the way VNPay expects.
// Both signing and verifying must use this identical transform or the hash mismatches.
const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj)
    .map((key) => encodeURIComponent(key))
    .sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }
  return sorted;
};

// yyyyMMddHHmmss in GMT+7 (VNPay server timezone)
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
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: process.env.VNP_RETURNURL,
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: formatVnpDate(now),
    vnp_ExpireDate: formatVnpDate(new Date(now.getTime() + 15 * 60 * 1000)),
  };

  const sorted = sortObject(params);
  const signData = stringifyEncoded(sorted);
  const signed = crypto
    .createHmac("sha512", process.env.VNP_HASHSECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");
  sorted.vnp_SecureHash = signed;
  return process.env.VNP_URL + "?" + stringifyEncoded(sorted);
};

const verifyReturn = (query) => {
  const data = { ...query };
  const secureHash = data.vnp_SecureHash;
  delete data.vnp_SecureHash;
  delete data.vnp_SecureHashType;

  const sorted = sortObject(data);
  const signData = stringifyEncoded(sorted);
  const signed = crypto
    .createHmac("sha512", process.env.VNP_HASHSECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  return { isValid: secureHash === signed, data: query };
};

module.exports = { buildPaymentUrl, verifyReturn, sortObject, formatVnpDate };
