const User = require("../models/user.model");

const publicFields = "fullName email avatarUrl reputationScore verificationStatus accountStatus role";

const normalizeAddresses = (addresses, fallback = {}) => {
  if (!Array.isArray(addresses)) return [];

  const cleaned = addresses
    .map((item) => ({
      label: (item?.label || "").trim(),
      recipientName: (item?.recipientName || "").trim(),
      phone: (item?.phone || "").trim(),
      address: (item?.address || "").trim(),
      isDefault: Boolean(item?.isDefault),
    }))
    .filter((item) => item.label || item.recipientName || item.phone || item.address);

  if (!cleaned.length && (fallback.fullName || fallback.phone || fallback.address)) {
    cleaned.push({
      label: "Địa chỉ mặc định",
      recipientName: fallback.fullName || "",
      phone: fallback.phone || "",
      address: fallback.address || "",
      isDefault: true,
    });
  }

  if (!cleaned.length) {
    return [];
  }

  const defaultIndex = cleaned.findIndex((item) => item.isDefault);
  const resolvedDefaultIndex = defaultIndex >= 0 ? defaultIndex : 0;

  return cleaned.slice(0, 2).map((item, index) => ({
    ...item,
    isDefault: index === resolvedDefaultIndex,
  }));
};

// @route GET /api/users/me
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/users/me
const updateMyProfile = async (req, res) => {
  try {

    const { fullName, phone, address, avatarUrl, addresses, dateOfBirth, gender } = req.body;
    const currentUser = await User.findById(req.user._id);

    const normalizedAddresses = Array.isArray(addresses)
      ? normalizeAddresses(addresses, {
        fullName: fullName ?? currentUser.fullName,
        phone: phone ?? currentUser.phone,
        address: address ?? currentUser.address,
      })
      : currentUser.addresses;

    const defaultAddress = normalizedAddresses.find((item) => item.isDefault) || normalizedAddresses[0] || null;

    const updatePayload = {
      ...(typeof fullName !== "undefined" ? { fullName } : {}),
      ...(typeof phone !== "undefined" ? { phone } : {}),
      ...(typeof avatarUrl !== "undefined" ? { avatarUrl } : {}),
      ...(typeof address !== "undefined" ? { address } : {}),
      ...(typeof dateOfBirth !== "undefined" ? { dateOfBirth } : {}),
      ...(typeof gender !== "undefined" ? { gender } : {}),
      ...(Array.isArray(addresses) ? { addresses: normalizedAddresses } : {}),
    };

    if (defaultAddress) {
      updatePayload.address = defaultAddress.address || updatePayload.address || currentUser.address;
      if (typeof fullName === "undefined" && defaultAddress.recipientName) {
        updatePayload.fullName = currentUser.fullName;
      }
      if (typeof phone === "undefined" && defaultAddress.phone) {
        updatePayload.phone = currentUser.phone;
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updatePayload, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/users/:id  (public profile)
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(publicFields);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/users  (admin)
const getAllUsers = async (req, res) => {
  try {
    const { role, status, verificationStatus, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.accountStatus = status;
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).select("-passwordHash").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, total, page: Number(page), users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/users/admin/:id  (admin)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/users/admin/:id  (admin — đổi role hoặc status)
const updateUserByAdmin = async (req, res) => {
  try {
    const { role, accountStatus } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, accountStatus },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
};
