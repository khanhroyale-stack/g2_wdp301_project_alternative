const User = require("../models/user.model");

const publicFields = "fullName email avatarUrl reputationScore verificationStatus accountStatus role";

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
    const { fullName, phone, address, avatarUrl, dateOfBirth, gender } = req.body;
    const updateData = { fullName, phone, address, avatarUrl };
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (!isNaN(dob.getTime())) {
        updateData.dateOfBirth = dob;
      }
    }
    if (gender) {
      updateData.gender = gender;
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );
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
