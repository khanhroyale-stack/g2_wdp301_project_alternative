const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas");

    const User = require("./src/models/user.model");

    const email = "test@example.com";
    const password = "password123"; // Mật khẩu dễ nhớ
    
    // Check if exists
    let user = await User.findOne({ email });
    if (user) {
      console.log("Test user already exists! Deleting and recreating...");
      await User.deleteOne({ email });
    }

    user = new User({
      fullName: "Test User",
      email: email,
      passwordHash: password, // Will be hashed by pre-save hook
      phone: "0123456789",
      role: "user",
      verificationStatus: "verified", // Đã xác minh
      accountStatus: "active"
    });

    await user.save();
    console.log(`✅ Success! Test user created.`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error("Error creating test user:", error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUser();
