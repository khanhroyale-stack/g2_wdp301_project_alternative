const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

const path = require("path");

// Serve static files from the public directory
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// ─── Routes ───────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/rentals", require("./routes/rental.routes"));
app.use("/api/reviews", require("./routes/review.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/chats", require("./routes/chat.routes"));
app.use("/api/upload", require("./routes/upload.routes"));
app.use("/api/admin", require("./routes/stats.routes"));
app.use("/api/inspections", require("./routes/inspection.routes"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "EcoTrade API đang chạy 🚀", timestamp: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ success: false, message: "Không tìm thấy route" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Lỗi máy chủ",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 EcoTrade API: http://localhost:${PORT} [${process.env.NODE_ENV}]`);
});
