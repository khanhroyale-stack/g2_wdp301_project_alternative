const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.IO setup ──────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Gắn io vào app để dùng trong controllers
app.set("io", io);

io.on("connection", (socket) => {
  // User join room cá nhân để nhận notification
  socket.on("join_user", (userId) => {
    socket.join(`user_${userId}`);
  });

  // User join chat room
  socket.on("join_chat", (roomId) => {
    socket.join(`chat_${roomId}`);
  });

  socket.on("leave_chat", (roomId) => {
    socket.leave(`chat_${roomId}`);
  });

  socket.on("disconnect", () => { });
});

// Export io để các controller dùng khi cần emit trực tiếp
module.exports.io = io;

// ─── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ─── Static files ─────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ─── Routes ───────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/verification", require("./routes/verification.routes"));
app.use("/api/reputation", require("./routes/reputation.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/rentals", require("./routes/rental.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/reviews", require("./routes/review.routes"));
app.use("/api/admin", require("./routes/stats.routes"));
app.use("/api/inspections", require("./routes/inspection.routes"));
app.use("/api/upload", require("./routes/upload.routes"));

// ─── Health check ─────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "EcoTrade API đang chạy 🚀",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route không tồn tại" });
});

// ─── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Lỗi máy chủ",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 EcoTrade API: http://localhost:${PORT} [${process.env.NODE_ENV}]`);
  console.log(`🔌 Socket.IO ready`);
});
