// Migration: đổi tên collection "report" -> "reports" (đồng bộ convention số nhiều)
// Chạy 1 lần: node backend/migrations/rename-report-collection.js
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const exists = await db.listCollections({ name: "report" }).toArray();
    if (exists.length === 0) {
      console.log("Collection 'report' không tồn tại (có thể đã đổi tên rồi) — bỏ qua.");
    } else {
      await db.collection("report").rename("reports");
      console.log("✅ Đã đổi tên collection 'report' -> 'reports'.");
    }
  } catch (err) {
    console.error("❌ Migration lỗi:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
