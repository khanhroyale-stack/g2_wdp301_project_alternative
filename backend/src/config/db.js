const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Options tối ưu cho MongoDB Compass (local) và Atlas
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // timeout sau 5s nếu không kết nối được
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    // Lắng nghe sự kiện disconnect
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected.");
    });

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error("💡 Tip: Đảm bảo MongoDB đang chạy trên localhost:27017");
    console.error("   Hoặc kiểm tra lại MONGODB_URI trong file .env");
    process.exit(1);
  }
};

module.exports = connectDB;
