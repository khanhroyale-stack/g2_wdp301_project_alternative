/**
 * Seed script — tạo tài khoản demo cho EcoTrade
 * Chạy: node src/seed.js
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/user.model");
const Category = require("./models/category.model");

const USERS = [
  {
    fullName: "Admin EcoTrade",
    email: "admin@ecotrade.vn",
    phone: "0900000001",
    passwordHash: "Admin@123",
    role: "admin",
    accountStatus: "active",
    verificationStatus: "verified",
    reputationScore: 100,
  },
  {
    fullName: "Nguyễn Văn A",
    email: "user@ecotrade.vn",
    phone: "0912345678",
    passwordHash: "User@123",
    role: "user",
    accountStatus: "active",
    verificationStatus: "verified",
    reputationScore: 98,
  },
  {
    fullName: "Trần Văn Shipper",
    email: "shipper@ecotrade.vn",
    phone: "0987654321",
    passwordHash: "Shipper@123",
    role: "shipper",
    accountStatus: "active",
    verificationStatus: "verified",
    reputationScore: 100,
  },
  {
    fullName: "Lê Thị Chờ Duyệt",
    email: "pending@ecotrade.vn",
    phone: "0911222333",
    passwordHash: "Pending@123",
    role: "user",
    accountStatus: "active",
    verificationStatus: "pending",
    reputationScore: 100,
  },
];

const CATEGORIES = [
  { name: "Điện tử", icon: "laptop", description: "Laptop, điện thoại, máy tính bảng, phụ kiện" },
  { name: "Xe cộ", icon: "directions_car", description: "Xe đạp, xe máy, phụ tùng" },
  { name: "Thời trang", icon: "checkroom", description: "Quần áo, giày dép, phụ kiện thời trang" },
  { name: "Nội thất", icon: "chair", description: "Bàn ghế, tủ kệ, đồ gia dụng" },
  { name: "Sách & Tài liệu", icon: "menu_book", description: "Sách giáo khoa, giáo trình, tài liệu tham khảo" },
  { name: "Thể thao", icon: "sports_soccer", description: "Dụng cụ thể thao, đồ tập gym" },
  { name: "Nhạc cụ", icon: "music_note", description: "Đàn guitar, piano, trống, nhạc cụ các loại" },
  { name: "Khác", icon: "category", description: "Các mặt hàng khác" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Kết nối MongoDB thành công\n");

    // Xóa dữ liệu cũ
    await User.deleteMany({});
    await Category.deleteMany({});
    console.log("🗑️  Đã xóa dữ liệu cũ");

    // Tạo categories
    await Category.insertMany(CATEGORIES);
    console.log(`📂 Đã tạo ${CATEGORIES.length} danh mục`);

    // Tạo users (passwordHash sẽ bị hash qua pre-save hook)
    const created = await User.create(USERS);
    console.log(`👤 Đã tạo ${created.length} tài khoản\n`);

    console.log("═══════════════════════════════════════════════");
    console.log("           THÔNG TIN ĐĂNG NHẬP DEMO            ");
    console.log("═══════════════════════════════════════════════");
    console.log("");
    console.log("👑  ADMIN:");
    console.log("    Email   : admin@ecotrade.vn");
    console.log("    Mật khẩu: Admin@123");
    console.log("    → Sau đăng nhập vào: /admin");
    console.log("");
    console.log("👤  USER (đã xác minh):");
    console.log("    Email   : user@ecotrade.vn");
    console.log("    Mật khẩu: User@123");
    console.log("    → Sau đăng nhập vào: /ho-so");
    console.log("");
    console.log("🚚  SHIPPER:");
    console.log("    Email   : shipper@ecotrade.vn");
    console.log("    Mật khẩu: Shipper@123");
    console.log("    → Sau đăng nhập vào: /shipper");
    console.log("");
    console.log("⏳  USER (chờ duyệt KYC):");
    console.log("    Email   : pending@ecotrade.vn");
    console.log("    Mật khẩu: Pending@123");
    console.log("    → Trạng thái: verificationStatus = pending");
    console.log("═══════════════════════════════════════════════\n");

  } catch (err) {
    console.error("❌ Seed lỗi:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
