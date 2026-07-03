const ProSubscription = require("../models/pro_subscription.model");
const ProductPost = require("../models/product_post.model");
const User = require("../models/user.model");
const { PRO_PLANS, computeProExpiry, isUserPro, FREE_POST_LIMIT } = require("../utils/business-rules");
const { buildPaymentUrl, verifyReturn } = require("../utils/vnpay.util");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const getPlans = async (req, res) => {
  try {
    const plans = Object.entries(PRO_PLANS).map(([plan, info]) => ({
      plan,
      durationDays: info.durationDays,
      amount: info.amount,
    }));
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPayment = async (req, res) => {
  try {
    const { plan } = req.body;
    const planInfo = PRO_PLANS[plan];
    if (!planInfo) {
      return res.status(400).json({ success: false, message: "Goi Pro khong hop le" });
    }

    const txnRef = `PRO-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    await ProSubscription.create({
      userId: req.user._id,
      plan,
      durationDays: planInfo.durationDays,
      amount: planInfo.amount,
      vnpTxnRef: txnRef,
      status: "pending",
    });

    let ipAddr = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
    if (ipAddr === "::1" || ipAddr.includes("::ffff:")) {
      ipAddr = "127.0.0.1";
    }
    const paymentUrl = buildPaymentUrl({
      amount: planInfo.amount,
      txnRef,
      orderInfo: `Nang cap Pro ${plan}`,
      ipAddr: String(ipAddr),
    });

    res.json({ success: true, data: { paymentUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const vnpayReturn = async (req, res) => {
  const resultUrl = (status) => `${CLIENT_URL}/goi-pro/ket-qua?status=${status}`;
  try {
    const { isValid, data } = verifyReturn(req.query);
    if (!isValid) {
      return res.redirect(resultUrl("failed"));
    }

    const sub = await ProSubscription.findOne({ vnpTxnRef: data.vnp_TxnRef });
    if (!sub) {
      return res.redirect(resultUrl("failed"));
    }

    // Idempotent: already activated on a previous return hit (e.g. refresh)
    if (sub.status === "paid") {
      return res.redirect(resultUrl("success"));
    }

    const paidOk =
      data.vnp_ResponseCode === "00" &&
      data.vnp_TransactionStatus === "00" &&
      Number(data.vnp_Amount) === sub.amount * 100;

    if (!paidOk) {
      sub.status = "failed";
      await sub.save();
      return res.redirect(resultUrl("failed"));
    }

    const user = await User.findById(sub.userId);
    if (!user) {
      sub.status = "failed";
      await sub.save();
      return res.redirect(resultUrl("failed"));
    }

    const now = new Date();
    const newExpiry = computeProExpiry(user.proExpiresAt, sub.durationDays, now);

    sub.status = "paid";
    sub.vnpTransactionNo = data.vnp_TransactionNo || null;
    sub.startsAt = now;
    sub.expiresAt = newExpiry;
    await sub.save();

    user.proExpiresAt = newExpiry;
    await user.save();

    return res.redirect(resultUrl("success"));
  } catch (error) {
    return res.redirect(resultUrl("failed"));
  }
};

const getMySubscriptions = async (req, res) => {
  try {
    const subscriptions = await ProSubscription.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStatus = async (req, res) => {
  try {
    const isPro = isUserPro(req.user);
    const activePosts = await ProductPost.countDocuments({
      ownerId: req.user._id,
      postStatus: { $in: ["pending", "approved", "available"] },
    });
    const remainingPosts = isPro ? null : Math.max(0, FREE_POST_LIMIT - activePosts);

    res.json({
      success: true,
      data: {
        isPro,
        proExpiresAt: req.user.proExpiresAt || null,
        freePostLimit: FREE_POST_LIMIT,
        activePosts,
        remainingPosts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPlans, createPayment, vnpayReturn, getMySubscriptions, getStatus };
