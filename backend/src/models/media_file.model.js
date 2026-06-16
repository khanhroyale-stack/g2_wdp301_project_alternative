const mongoose = require("mongoose");

const mediaFileSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    publicUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["product_image", "inspection", "verification", "evidence", "video", "other"],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "media_files",
  }
);

module.exports = mongoose.model("MediaFile", mediaFileSchema);
