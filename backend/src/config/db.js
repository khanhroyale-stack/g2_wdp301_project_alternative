const mongoose = require("mongoose");

const ensureReviewIndexes = async (db) => {
  const reviews = db.collection("reviews");

  try {
    const indexes = await reviews.indexes();
    const indexMap = new Map(indexes.map((index) => [index.name, index]));
    const rebuildTargets = [
      {
        name: "reviewerId_1_orderId_1",
        key: { reviewerId: 1, orderId: 1 },
        partialFilterExpression: { orderId: { $type: "objectId" } },
      },
      {
        name: "reviewerId_1_rentalContractId_1",
        key: { reviewerId: 1, rentalContractId: 1 },
        partialFilterExpression: { rentalContractId: { $type: "objectId" } },
      },
    ];

    for (const target of rebuildTargets) {
      const current = indexMap.get(target.name);
      const hasExpectedPartialFilter =
        JSON.stringify(current?.partialFilterExpression || null) === JSON.stringify(target.partialFilterExpression);

      if (current && (!hasExpectedPartialFilter || current.sparse)) {
        await reviews.dropIndex(target.name);
      }

      if (!current || !hasExpectedPartialFilter || current.sparse) {
        await reviews.createIndex(target.key, {
          name: target.name,
          unique: true,
          partialFilterExpression: target.partialFilterExpression,
        });
      }
    }
  } catch (error) {
    console.error(`Review index sync error: ${error.message}`);
  }
};

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
      "media_files", "reports", "report_evidences", "notifications",
      "reputation_logs", "reviews",
    ];
    for (const col of collectionsToRelax) {
      try {
        await conn.connection.db.command({ collMod: col, validator: {}, validationLevel: "off" });
      } catch (_) {
        // Ignore when the collection does not exist yet.
      }
    }

    await ensureReviewIndexes(conn.connection.db);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
