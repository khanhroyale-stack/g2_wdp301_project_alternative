const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Họ tên là bắt buộc"], trim: true },
    email: { type: String, required: [true, "Email là bắt buộc"], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, "Mật khẩu là bắt buộc"], minlength: [6, "Mật khẩu tối thiểu 6 ký tự"], select: false },
    phone: { type: String, trim: true, default: "" },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin", "shipper"], default: "user" },
    // Xác minh tài khoản
    accountStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "BANNED"], default: "PENDING" },
    rejectedReason: { type: String, default: "" },
    cccdImage: { type: String, default: "" },    // ảnh CCCD hoặc thẻ sinh viên
    isEmailVerified: { type: Boolean, default: false },
    // Điểm uy tín
    reputationScore: { type: Number, default: 100, min: 0, max: 100 },
    totalTransactions: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
