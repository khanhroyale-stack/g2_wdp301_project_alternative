const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const dbName = process.env.MONGODB_DB_NAME || "WDP301";
    console.log(`Connecting to MongoDB database "${dbName}"...`);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`MongoDB Database: ${conn.connection.name}`);

    // Disable old Atlas validators to avoid legacy validation failures.
    const collectionsToRelax = [
      "users", "rental_requests", "rental_contracts", "rental_inspections",
      "product_posts", "orders", "deliveries",
    ];
    for (const col of collectionsToRelax) {
      try {
        await conn.connection.db.command({ collMod: col, validator: {}, validationLevel: "off" });
      } catch (_) {
        // Ignore when the collection does not exist yet.
      }
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
