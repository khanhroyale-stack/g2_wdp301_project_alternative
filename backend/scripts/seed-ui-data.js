const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const User = require("../src/models/user.model");
const Category = require("../src/models/category.model");
const ProductPost = require("../src/models/product_post.model");
const Order = require("../src/models/order.model");
const Delivery = require("../src/models/delivery.model");
const DeliveryInspection = require("../src/models/delivery_inspection.model");

const SEED_PREFIX = "UI Seed";
const PASSWORD = "123456";
const SHIPPING_FEE = 35000;

const imageSets = {
  headphones: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80",
  ],
  chair: [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80",
  ],
  keyboard: [
    "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
  ],
  lamp: [
    "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?auto=format&fit=crop&w=1200&q=80",
  ],
};

async function upsertUser({ email, fullName, phone, address, role }) {
  let user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    user = new User({
      fullName,
      email,
      passwordHash: PASSWORD,
      phone,
      address,
      role,
      verificationStatus: "verified",
      accountStatus: "active",
      reputationScore: 100,
    });
  } else {
    user.fullName = fullName;
    user.passwordHash = PASSWORD;
    user.phone = phone;
    user.address = address;
    user.role = role;
    user.verificationStatus = "verified";
    user.accountStatus = "active";
    user.reputationScore = 100;
  }

  await user.save();
  return user;
}

async function upsertCategory(name, description) {
  return Category.findOneAndUpdate(
    { name },
    { name, description, status: "active" },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function createProduct({
  ownerId,
  categoryId,
  title,
  description,
  salePrice,
  conditionStatus,
  location,
  imageUrls,
}) {
  const product = await ProductPost.create({
    ownerId,
    categoryId,
    title,
    description,
    productType: "sale",
    salePrice,
    location,
    conditionStatus,
    quantity: 1,
    postStatus: "approved",
    approvedAt: new Date(),
  });

  await mongoose.connection.collection("product_images").insertMany(
    imageUrls.map((imageUrl, index) => ({
      productPostId: product._id,
      imageUrl,
      displayOrder: index,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  return product;
}

async function clearSeedData(seedUsers) {
  const sellerId = seedUsers.seller._id;
  const buyerId = seedUsers.buyer._id;
  const shipperId = seedUsers.shipper._id;

  const existingProducts = await ProductPost.find({
    ownerId: sellerId,
    title: { $regex: `^${SEED_PREFIX}` },
  }).select("_id");

  const productIds = existingProducts.map((item) => item._id);

  const existingOrders = await Order.find({
    buyerId,
    sellerId,
    note: { $regex: "\\[UI_SEED\\]" },
  }).select("_id");

  const orderIds = existingOrders.map((item) => item._id);

  const existingDeliveries = await Delivery.find({
    $or: [
      { orderId: { $in: orderIds } },
      { shipperId },
      { pickupAddress: { $regex: "\\[UI_SEED\\]" } },
      { deliveryAddress: { $regex: "\\[UI_SEED\\]" } },
    ],
  }).select("_id");

  const deliveryIds = existingDeliveries.map((item) => item._id);

  if (deliveryIds.length) {
    await DeliveryInspection.deleteMany({ deliveryId: { $in: deliveryIds } });
  }

  if (orderIds.length) {
    await Delivery.deleteMany({ orderId: { $in: orderIds } });
    await Order.deleteMany({ _id: { $in: orderIds } });
  }

  if (productIds.length) {
    await mongoose.connection.collection("product_images").deleteMany({
      productPostId: { $in: productIds },
    });
    await ProductPost.deleteMany({ _id: { $in: productIds } });
  }
}

async function relaxLegacyValidators() {
  const collections = [
    "users",
    "categories",
    "product_posts",
    "product_images",
    "orders",
    "deliveries",
    "delivery_inspections",
  ];

  for (const collection of collections) {
    try {
      await mongoose.connection.db.command({
        collMod: collection,
        validator: {},
        validationLevel: "off",
      });
    } catch (_) {
      // Ignore when a collection does not exist yet.
    }
  }
}

async function seed() {
  const dbName = process.env.MONGODB_DB_NAME || "WDP301";
  await mongoose.connect(process.env.MONGODB_URI, { dbName });
  await relaxLegacyValidators();

  const seller = await upsertUser({
    email: "ui.seller@example.com",
    fullName: "UI Seller Demo",
    phone: "0901000001",
    address: "KTX Khu A, Thu Duc, TP.HCM [UI_SEED]",
    role: "user",
  });

  const buyer = await upsertUser({
    email: "ui.buyer@example.com",
    fullName: "UI Buyer Demo",
    phone: "0901000002",
    address: "Linh Trung, Thu Duc, TP.HCM [UI_SEED]",
    role: "user",
  });

  const shipper = await upsertUser({
    email: "ui.shipper@example.com",
    fullName: "UI Shipper Demo",
    phone: "0901000003",
    address: "Binh Thanh, TP.HCM [UI_SEED]",
    role: "shipper",
  });

  await clearSeedData({ seller, buyer, shipper });

  const electronics = await upsertCategory(`${SEED_PREFIX} Electronics`, "Danh mục seed cho giao diện điện tử");
  const lifestyle = await upsertCategory(`${SEED_PREFIX} Lifestyle`, "Danh mục seed cho giao diện lifestyle");

  const products = {
    pending: await createProduct({
      ownerId: seller._id,
      categoryId: electronics._id,
      title: `${SEED_PREFIX} Headphones Pro`,
      description: "Tai nghe bluetooth cho trang danh sach san pham va don mua pending.",
      salePrice: 650000,
      conditionStatus: "like_new",
      location: "Thu Duc, TP.HCM",
      imageUrls: imageSets.headphones,
    }),
    shipping: await createProduct({
      ownerId: seller._id,
      categoryId: electronics._id,
      title: `${SEED_PREFIX} Mechanical Keyboard`,
      description: "Ban phim co dang duoc giao de test order detail va delivery detail.",
      salePrice: 890000,
      conditionStatus: "good",
      location: "Go Vap, TP.HCM",
      imageUrls: imageSets.keyboard,
    }),
    delivered: await createProduct({
      ownerId: seller._id,
      categoryId: lifestyle._id,
      title: `${SEED_PREFIX} Study Lamp`,
      description: "Den hoc da giao thanh cong de test cac trang tong hop.",
      salePrice: 320000,
      conditionStatus: "good",
      location: "Phu Nhuan, TP.HCM",
      imageUrls: imageSets.lamp,
    }),
    availableDelivery: await createProduct({
      ownerId: seller._id,
      categoryId: lifestyle._id,
      title: `${SEED_PREFIX} Lounge Chair`,
      description: "Ghe seed de xuat hien trong available deliveries.",
      salePrice: 540000,
      conditionStatus: "fair",
      location: "Quan 7, TP.HCM",
      imageUrls: imageSets.chair,
    }),
  };

  const pendingOrder = await Order.create({
    buyerId: buyer._id,
    sellerId: seller._id,
    postId: products.pending._id,
    productPrice: products.pending.salePrice,
    shippingFee: SHIPPING_FEE,
    totalAmount: products.pending.salePrice + SHIPPING_FEE,
    buyerAddress: buyer.address,
    buyerPhone: buyer.phone,
    recipientName: buyer.fullName,
    note: "[UI_SEED] Pending order for order list",
    orderStatus: "pending",
  });

  const shippingOrder = await Order.create({
    buyerId: buyer._id,
    sellerId: seller._id,
    postId: products.shipping._id,
    productPrice: products.shipping.salePrice,
    shippingFee: SHIPPING_FEE,
    totalAmount: products.shipping.salePrice + SHIPPING_FEE,
    buyerAddress: buyer.address,
    buyerPhone: buyer.phone,
    recipientName: buyer.fullName,
    note: "[UI_SEED] Shipping order for order and delivery detail",
    orderStatus: "shipping",
  });

  const deliveredOrder = await Order.create({
    buyerId: buyer._id,
    sellerId: seller._id,
    postId: products.delivered._id,
    productPrice: products.delivered.salePrice,
    shippingFee: SHIPPING_FEE,
    totalAmount: products.delivered.salePrice + SHIPPING_FEE,
    buyerAddress: buyer.address,
    buyerPhone: buyer.phone,
    recipientName: buyer.fullName,
    note: "[UI_SEED] Delivered order for history screens",
    orderStatus: "delivered",
  });

  const availableOrder = await Order.create({
    buyerId: buyer._id,
    sellerId: seller._id,
    postId: products.availableDelivery._id,
    productPrice: products.availableDelivery.salePrice,
    shippingFee: SHIPPING_FEE,
    totalAmount: products.availableDelivery.salePrice + SHIPPING_FEE,
    buyerAddress: `${buyer.address} - Toa B1`,
    buyerPhone: buyer.phone,
    recipientName: buyer.fullName,
    note: "[UI_SEED] Confirmed order waiting for shipper",
    orderStatus: "confirmed",
  });

  const shippingDelivery = await Delivery.create({
    orderId: shippingOrder._id,
    shipperId: shipper._id,
    pickupAddress: `${seller.address} - pickup [UI_SEED]`,
    deliveryAddress: `${buyer.address} - shipping [UI_SEED]`,
    deliveryFee: SHIPPING_FEE,
    deliveryType: "standard",
    deliveryStatus: "picking_up",
    history: [
      { status: "pending", note: "Created from seed data" },
      { status: "picking_up", note: "Assigned to shipper for UI test" },
    ],
  });

  const deliveredDelivery = await Delivery.create({
    orderId: deliveredOrder._id,
    shipperId: shipper._id,
    pickupAddress: `${seller.address} - delivered [UI_SEED]`,
    deliveryAddress: `${buyer.address} - delivered [UI_SEED]`,
    deliveryFee: SHIPPING_FEE,
    deliveryType: "standard",
    deliveryStatus: "delivered",
    history: [
      { status: "pending", note: "Created from seed data" },
      { status: "picking_up", note: "Shipper picked up the parcel" },
      { status: "in_transit", note: "On the way" },
      { status: "delivered", note: "Delivered successfully" },
    ],
  });

  const availableDelivery = await Delivery.create({
    orderId: availableOrder._id,
    shipperId: null,
    pickupAddress: `${seller.address} - available [UI_SEED]`,
    deliveryAddress: `${buyer.address} - available [UI_SEED]`,
    deliveryFee: SHIPPING_FEE,
    deliveryType: "standard",
    deliveryStatus: "pending",
    history: [{ status: "pending", note: "Waiting for shipper accept" }],
  });

  const pickupInspection = await DeliveryInspection.create({
    deliveryId: shippingDelivery._id,
    shipperId: shipper._id,
    inspectionType: "pickup",
    conditionNote: "[UI_SEED] San pham dung mo ta, hop con nguyen ven.",
    isMatchDescription: true,
    isDamagedByShipper: false,
  });

  console.log("UI seed completed.");
  console.log("");
  console.log("Login accounts:");
  console.log("Buyer   : ui.buyer@example.com / 123456");
  console.log("Seller  : ui.seller@example.com / 123456");
  console.log("Shipper : ui.shipper@example.com / 123456");
  console.log("");
  console.log("Created records:");
  console.log(`- Products: 4`);
  console.log(`- Orders: 4`);
  console.log(`- Deliveries: 3`);
  console.log(`- Inspections: 1`);
  console.log("");
  console.log("Useful IDs:");
  console.log(`- Pending order: ${pendingOrder._id}`);
  console.log(`- Shipping order: ${shippingOrder._id}`);
  console.log(`- Delivered order: ${deliveredOrder._id}`);
  console.log(`- Available delivery: ${availableDelivery._id}`);
  console.log(`- Shipping delivery: ${shippingDelivery._id}`);
  console.log(`- Delivered delivery: ${deliveredDelivery._id}`);
  console.log(`- Inspection: ${pickupInspection._id}`);
}

seed()
  .catch((error) => {
    console.error("UI seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
