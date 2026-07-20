const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const { sendExpiryReminders } = require("./controllers/rental.controller");

dotenv.config();
connectDB();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

app.set("io", io);
require("./sockets")(io);

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/reputation", require("./routes/reputation.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/deliveries", require("./routes/delivery.routes"));
app.use("/api/rentals", require("./routes/rental.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/support-chat", require("./routes/support_chat.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/shipper-reports", require("./routes/shipper_report.routes"));
app.use("/api/reviews", require("./routes/review.routes"));
app.use("/api/subscriptions", require("./routes/subscription.routes"));
app.use("/api/admin", require("./routes/stats.routes"));
app.use("/api/inspections", require("./routes/inspection.routes"));
app.use("/api/upload", require("./routes/upload.routes"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "EcoTrade API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`EcoTrade API running on http://localhost:${PORT} [${process.env.NODE_ENV || "development"}]`);
});

setInterval(() => {
  sendExpiryReminders(app).catch((error) => {
    console.error("[rental expiry reminder]", error.message);
  });
}, 60 * 60 * 1000);
