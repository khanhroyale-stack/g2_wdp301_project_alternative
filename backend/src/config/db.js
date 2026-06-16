const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Xóa Atlas validator cũ trên collection users nếu có (tránh lỗi "Document failed validation")
    try {
      await conn.connection.db.command({
        collMod: "users",
        validator: {},
        validationLevel: "off",
      });
    } catch (_) {
      // Collection chưa tồn tại — bỏ qua
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
