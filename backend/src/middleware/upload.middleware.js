const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Thư mục lưu ảnh xác minh KYC
const verificationDir = path.join(__dirname, "../../uploads/verification");
if (!fs.existsSync(verificationDir)) fs.mkdirSync(verificationDir, { recursive: true });

// Thư mục lưu ảnh sản phẩm / bằng chứng
const productsDir = path.join(__dirname, "../../uploads/products");
if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true });

// Storage cho verification
const verificationStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, verificationDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${file.fieldname}-${Date.now()}${ext}`);
  },
});

// Storage chung cho ảnh sản phẩm / bằng chứng
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, productsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Chỉ chấp nhận file ảnh JPG/PNG/WEBP"), false);
};

const uploadVerification = multer({
  storage: verificationStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
}).fields([
  { name: "studentCard", maxCount: 1 },
  { name: "citizenId", maxCount: 1 },
]);

// Generic uploader dùng cho /api/upload
const upload = multer({
  storage: generalStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

module.exports = { uploadVerification, upload };
