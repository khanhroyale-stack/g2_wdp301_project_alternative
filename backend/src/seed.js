/**
 * Seed script — tạo tài khoản demo cho EcoTrade
 * Chạy: node src/seed.js
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/user.model");
const Category = require("./models/category.model");
const Product = require("./models/product.model");
const Order = require("./models/order.model");
const Rental = require("./models/rental.model");
const Review = require("./models/review.model");
const Report = require("./models/report.model");
const Notification = require("./models/notification.model");
const ReputationHistory = require("./models/reputationHistory.model");

const USERS = [
  {
    name: "Admin EcoTrade",
    email: "admin@ecotrade.vn",
    phone: "0900000001",
    password: "Admin@123",
    role: "admin",
    accountStatus: "APPROVED",
    reputationScore: 100,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
  },
  {
    name: "Nguyễn Văn A",
    email: "user@ecotrade.vn",
    phone: "0912345678",
    password: "User@123",
    role: "user",
    accountStatus: "APPROVED",
    reputationScore: 98,
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200",
    cccdImage: "https://images.unsplash.com/photo-1621360841013-c76831f17360?w=500",
  },
  {
    name: "Trần Thị C",
    email: "seller@ecotrade.vn",
    phone: "0988888888",
    password: "User@123",
    role: "user",
    accountStatus: "APPROVED",
    reputationScore: 100,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  },
  {
    name: "Lê Shipper",
    email: "shipper@ecotrade.vn",
    phone: "0987654321",
    password: "Shipper@123",
    role: "shipper",
    accountStatus: "APPROVED",
    reputationScore: 100,
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200",
  },
  {
    name: "Phạm Chờ Duyệt",
    email: "pending@ecotrade.vn",
    phone: "0911222333",
    password: "Pending@123",
    role: "user",
    accountStatus: "PENDING",
    reputationScore: 100,
    cccdImage: "https://images.unsplash.com/photo-1621360841013-c76831f17360?w=500",
  },
  {
    name: "Hoàng Vi Phạm",
    email: "banned@ecotrade.vn",
    phone: "0900999000",
    password: "User@123",
    role: "user",
    accountStatus: "BANNED",
    reputationScore: 0,
  }
];

const CATEGORIES = [
  { name: "Điện tử", icon: "laptop" },
  { name: "Xe cộ", icon: "directions_car" },
  { name: "Thời trang", icon: "checkroom" },
  { name: "Nội thất", icon: "chair" },
  { name: "Sách & Tài liệu", icon: "menu_book" },
  { name: "Thể thao", icon: "sports_soccer" },
  { name: "Nhạc cụ", icon: "music_note" },
  { name: "Khác", icon: "category" },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Kết nối MongoDB thành công");

  // Xóa dữ liệu cũ
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Rental.deleteMany({}),
    Review.deleteMany({}),
    Report.deleteMany({}),
    Notification.deleteMany({}),
    ReputationHistory.deleteMany({}),
  ]);
  console.log("🗑️  Đã xóa dữ liệu cũ");

  // Tạo users
  const createdUsers = await User.create(USERS);
  console.log(`👤 Đã tạo ${createdUsers.length} tài khoản`);

  const adminUser = createdUsers.find(u => u.email === "admin@ecotrade.vn");
  const buyerUser = createdUsers.find(u => u.email === "user@ecotrade.vn");
  const sellerUser = createdUsers.find(u => u.email === "seller@ecotrade.vn");
  const shipperUser = createdUsers.find(u => u.email === "shipper@ecotrade.vn");

  // Tạo categories
  const createdCategories = await Category.insertMany(CATEGORIES);
  console.log(`📂 Đã tạo ${createdCategories.length} danh mục`);

  const electronicsCat = createdCategories.find(c => c.name === "Điện tử");
  const furnitureCat = createdCategories.find(c => c.name === "Nội thất");
  const vehicleCat = createdCategories.find(c => c.name === "Xe cộ");

  // Tạo products
  const productsToCreate = [
    {
      seller: sellerUser._id,
      title: "MacBook Pro M2 2022",
      description: "Máy dùng giữ gìn, pin còn 98%. Mới mua được 6 tháng. Full box.",
      category: electronicsCat._id,
      condition: "Như mới",
      listingType: "ban",
      salePrice: 18500000,
      location: "Khu vực Đại học FPT Hòa Lạc",
      images: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
        "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800"
      ],
      status: "ACTIVE",
      averageRating: 5,
      reviewCount: 1,
    },
    {
      seller: sellerUser._id,
      title: "Máy ảnh Sony A7III + Lens 28-70",
      description: "Combo quay chụp cực ngon. Lens không mốc rễ. Cảm biến sạch sẽ.",
      category: electronicsCat._id,
      condition: "Đã dùng - Còn tốt",
      listingType: "cho-thue",
      rentalPricePerDay: 250000,
      rentalPricePerWeek: 1500000,
      rentalPricePerMonth: 5000000,
      depositAmount: 15000000,
      location: "Ký túc xá Dom C",
      images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800"],
      status: "ACTIVE",
    },
    {
      seller: buyerUser._id,
      title: "Xe đạp địa hình thể thao",
      description: "Xe đạp mua về ít đi, còn rất mới. Thích hợp dạo quanh Hòa Lạc.",
      category: vehicleCat._id,
      condition: "Đã dùng - Còn tốt",
      listingType: "ban",
      salePrice: 1200000,
      location: "Tòa Alpha",
      images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800"],
      status: "PENDING",
    },
    {
      seller: buyerUser._id,
      title: "Bàn học gấp gọn sinh viên",
      description: "Bàn học sinh viên kích thước 1m2. Chân sắt chắc chắn.",
      category: furnitureCat._id,
      condition: "Đã dùng - Có lỗi nhỏ",
      listingType: "ban",
      salePrice: 150000,
      location: "Ký túc xá Dom E",
      images: ["https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800"],
      status: "ACTIVE",
    }
  ];

  const createdProducts = await Product.create(productsToCreate);
  console.log(`🛒 Đã tạo ${createdProducts.length} sản phẩm`);

  const activeMacbook = createdProducts[0];
  const activeCamera = createdProducts[1];

  // Tạo Order
  const ordersToCreate = [
    {
      buyer: buyerUser._id,
      seller: sellerUser._id,
      product: activeMacbook._id,
      totalAmount: 18500000,
      status: "COMPLETED",
      deliveryAddress: "Ký túc xá Dom E",
      statusHistory: [
        { status: "PENDING", changedBy: buyerUser._id },
        { status: "SELLER_CONFIRMED", changedBy: sellerUser._id },
        { status: "DELIVERED", changedBy: shipperUser._id },
        { status: "COMPLETED", changedBy: buyerUser._id },
      ],
      shipper: shipperUser._id,
    }
  ];

  const createdOrders = await Order.create(ordersToCreate);
  console.log(`📦 Đã tạo ${createdOrders.length} đơn hàng`);

  // Tạo Review
  await Review.create([
    {
      reviewer: buyerUser._id,
      reviewee: sellerUser._id,
      product: activeMacbook._id,
      order: createdOrders[0]._id,
      rating: 5,
      comment: "Máy dùng mượt mà, đúng như mô tả. Đóng gói cẩn thận.",
      reviewType: "mua"
    }
  ]);
  console.log(`⭐ Đã tạo 1 đánh giá`);

  // Update product sold
  await Product.findByIdAndUpdate(activeMacbook._id, { status: "SOLD" });

  // Tạo Rental
  const rentalsToCreate = [
    {
      renter: buyerUser._id,
      owner: sellerUser._id,
      product: activeCamera._id,
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
      totalDays: 3,
      rentalFee: 750000,
      depositAmount: 15000000,
      totalAmount: 15750000,
      status: "ACTIVE",
    }
  ];
  await Rental.create(rentalsToCreate);
  await Product.findByIdAndUpdate(activeCamera._id, { status: "RENTING" });
  console.log(`🤝 Đã tạo ${rentalsToCreate.length} hợp đồng thuê`);

  // Tạo Report
  await Report.create({
    reporter: buyerUser._id,
    reportedUser: sellerUser._id,
    product: activeMacbook._id,
    violationType: "Khác",
    content: "Người bán hỗ trợ không nhiệt tình",
    status: "PENDING",
  });
  console.log(`🚨 Đã tạo 1 báo cáo vi phạm`);

  console.log("\n═══════════════════════════════════════");
  console.log("        THÔNG TIN ĐĂNG NHẬP DEMO");
  console.log("═══════════════════════════════════════");
  console.log("");
  console.log("👑 ADMIN:");
  console.log("   Email   : admin@ecotrade.vn");
  console.log("   Mật khẩu: Admin@123");
  console.log("   Quyền   : Toàn quyền quản trị");
  console.log("");
  console.log("👤 USER (Người mua):");
  console.log("   Email   : user@ecotrade.vn");
  console.log("   Mật khẩu: User@123");
  console.log("");
  console.log("👤 SELLER (Người bán):");
  console.log("   Email   : seller@ecotrade.vn");
  console.log("   Mật khẩu: User@123");
  console.log("");
  console.log("🚚 SHIPPER:");
  console.log("   Email   : shipper@ecotrade.vn");
  console.log("   Mật khẩu: Shipper@123");
  console.log("");
  console.log("⏳ PENDING USER:");
  console.log("   Email   : pending@ecotrade.vn");
  console.log("   Mật khẩu: Pending@123");
  console.log("═══════════════════════════════════════\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed lỗi:", err.message);
  process.exit(1);
});
