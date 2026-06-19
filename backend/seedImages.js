/**
 * seedImages.js — Seed ảnh demo cho sản phẩm
 * Tuân thủ đúng Atlas JSON Schema (field names từ checkSchema2.js)
 * Chạy: node seedImages.js
 */
require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const { Int32, ObjectId } = require("mongodb");

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
];

async function seedImages() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db;
  const User = require("./src/models/user.model");
  const anyUser = await User.findOne({}).lean();

  const posts = await db.collection("product_posts").find({}).toArray();
  console.log(`Tìm thấy ${posts.length} sản phẩm`);

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const imageUrl = DEMO_IMAGES[i % DEMO_IMAGES.length];

    // Xoá product_images cũ
    await db.collection("product_images").deleteMany({ postId: post._id });

    // Insert MediaFile — chỉ các field trong Atlas schema, không có updatedAt/__v
    const mediaResult = await db.collection("media_files").insertOne({
      uploadedBy: anyUser._id,
      originalName: `demo-${i}.jpg`,
      fileName: `demo-${i}.jpg`,
      mimeType: "image/jpeg",
      fileSize: new Int32(1000),
      storageType: "external",
      localPath: imageUrl,
      publicUrl: imageUrl,
      fileType: "product_image",
      createdAt: new Date(),
    });

    // Insert ProductImage — dùng tên field "field" (theo Atlas schema)
    // Insert raw để tránh Mongoose thêm updatedAt/__v
    await db.collection("product_images").insertOne({
      postId: post._id,
      field: mediaResult.insertedId,   // "field" là tên trong Atlas schema
      isThumbnail: true,
      sortOrder: new Int32(0),
      createdAt: new Date(),
    });

    console.log(`  ✓ "${post.title}" → ${imageUrl}`);
  }

  console.log("\n✅ Seed hoàn tất! Reload trang để thấy ảnh.");
  await mongoose.disconnect();
}

seedImages().catch(console.error);
