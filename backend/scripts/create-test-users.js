require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const User = require("../src/models/user.model");

const users = [
  {
    fullName: "Test Buyer",
    email: "test.buyer@example.com",
    password: "123456",
    phone: "0901000001",
    address: "Ho Chi Minh City",
    role: "user",
  },
  {
    fullName: "Test Seller",
    email: "test.seller@example.com",
    password: "123456",
    phone: "0901000002",
    address: "Ho Chi Minh City",
    role: "user",
  },
  {
    fullName: "Test Shipper",
    email: "test.shipper@example.com",
    password: "123456",
    phone: "0901000003",
    address: "Ho Chi Minh City",
    role: "shipper",
  },
];

async function main() {
  const dbName = process.env.MONGODB_DB_NAME || "WDP301";
  await mongoose.connect(process.env.MONGODB_URI, { dbName });

  for (const item of users) {
    const existing = await User.findOne({ email: item.email }).select("+passwordHash");

    if (existing) {
      existing.fullName = item.fullName;
      existing.phone = item.phone;
      existing.address = item.address;
      existing.role = item.role;
      existing.accountStatus = "active";
      existing.verificationStatus = "verified";
      existing.passwordHash = item.password;
      await existing.save();
      console.log(`Updated: ${item.email} (${item.role})`);
      continue;
    }

    await User.create({
      fullName: item.fullName,
      email: item.email,
      passwordHash: item.password,
      phone: item.phone,
      address: item.address,
      role: item.role,
      accountStatus: "active",
      verificationStatus: "verified",
    });
    console.log(`Created: ${item.email} (${item.role})`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
