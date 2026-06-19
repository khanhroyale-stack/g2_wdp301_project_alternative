const mongoose = require("mongoose");
const { Int32 } = require("mongodb");

const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const PORT = process.env.PORT || 5000;
    const BASE_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
    const db = mongoose.connection.db;

    // Insert raw vào media_files để tuân thủ Atlas JSON Schema validator
    // (schema có additionalProperties:false — Mongoose thêm updatedAt/__v sẽ bị reject)
    const insertResults = await Promise.all(
      req.files.map((file) =>
        db.collection("media_files").insertOne({
          uploadedBy: req.user._id,
          originalName: file.originalname,
          fileName: file.filename,
          mimeType: file.mimetype,
          fileSize: new Int32(file.size),
          storageType: "local",
          localPath: `/uploads/products/${file.filename}`,
          publicUrl: `${BASE_URL}/uploads/products/${file.filename}`,
          fileType: "product_image",
          createdAt: new Date(),
        })
      )
    );

    const urls = insertResults.map((r, i) => `${BASE_URL}/uploads/products/${req.files[i].filename}`);
    const mediaIds = insertResults.map((r) => r.insertedId);

    res.status(200).json({ success: true, urls, mediaIds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadImages };
