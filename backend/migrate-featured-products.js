const dotenv = require("dotenv");
const mongoose = require("mongoose");
const ProductPost = require("./src/models/product_post.model");
const User = require("./src/models/user.model");

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function migrate() {
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI or MONGO_URI");
  }

  await mongoose.connect(mongoUri);

  const productResult = await ProductPost.updateMany(
    { isFeatured: { $exists: false } },
    { $set: { isFeatured: false, featuredAt: null } }
  );

  const userResult = await User.updateMany(
    { hasSetupFeaturedProducts: { $exists: false } },
    { $set: { hasSetupFeaturedProducts: false } }
  );

  console.log("Featured products migration complete", {
    productPostsMatched: productResult.matchedCount,
    productPostsModified: productResult.modifiedCount,
    usersMatched: userResult.matchedCount,
    usersModified: userResult.modifiedCount,
  });
}

migrate()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
