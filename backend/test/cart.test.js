const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";

let cartDoc;
let populatedCart;
let createdOrders;
let reservedCalls;
let productById;

const buildCartDoc = (items = []) => ({
  _id: "cart-1",
  buyerId: "buyer-1",
  items,
  async save() {
    return this;
  },
});

const product = {
  _id: "product-1",
  title: "Ban go",
  salePrice: 100000,
  quantity: 3,
  postStatus: "approved",
  productType: "sale",
  ownerId: { _id: "seller-1", accountStatus: "active", fullName: "Seller" },
  categoryId: { _id: "cat-1", name: "Noi that" },
};

const reset = () => {
  cartDoc = buildCartDoc([]);
  populatedCart = {
    _id: "cart-1",
    buyerId: "buyer-1",
    items: [],
  };
  createdOrders = [];
  reservedCalls = [];
  productById = product;
};

const chain = (value) => ({
  populate() {
    return this;
  },
  sort() {
    return this;
  },
  lean: async () => value,
});

const Cart = {
  findOne: async () => cartDoc,
  create: async (data) => {
    cartDoc = buildCartDoc(data.items || []);
    return cartDoc;
  },
  findById: () => chain(populatedCart),
};

const ProductPost = {
  findById: () => ({
    populate: async () => productById,
  }),
};

const Order = {
  create: async (data) => {
    const order = { _id: `order-${createdOrders.length + 1}`, ...data };
    createdOrders.push(order);
    return order;
  },
  find: () => chain(createdOrders),
};

require.cache[require.resolve("../src/models/cart.model")] = {
  id: require.resolve("../src/models/cart.model"),
  filename: require.resolve("../src/models/cart.model"),
  loaded: true,
  exports: Cart,
};
require.cache[require.resolve("../src/models/product_post.model")] = {
  id: require.resolve("../src/models/product_post.model"),
  filename: require.resolve("../src/models/product_post.model"),
  loaded: true,
  exports: ProductPost,
};
require.cache[require.resolve("../src/models/order.model")] = {
  id: require.resolve("../src/models/order.model"),
  filename: require.resolve("../src/models/order.model"),
  loaded: true,
  exports: Order,
};
require.cache[require.resolve("../src/utils/product-images.util")] = {
  id: require.resolve("../src/utils/product-images.util"),
  filename: require.resolve("../src/utils/product-images.util"),
  loaded: true,
  exports: {
    getProductThumbnailUrl: async () => "http://img/product.jpg",
  },
};
require.cache[require.resolve("../src/services/order-inventory.service")] = {
  id: require.resolve("../src/services/order-inventory.service"),
  filename: require.resolve("../src/services/order-inventory.service"),
  loaded: true,
  exports: {
    reserveProductQuantity: async (productId, quantity) => {
      reservedCalls.push({ productId, quantity });
      return { ...product, quantity: product.quantity - quantity };
    },
  },
};

const { getMyCart, addCartItem, removeCartItem, checkoutCart } = require("../src/controllers/cart.controller");

const mockReq = (body = {}, params = {}) => ({
  body,
  params,
  user: { _id: "buyer-1" },
});

const mockRes = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("cart view hydrates items and summary", async () => {
  reset();
  populatedCart.items = [{ postId: product, quantity: 2, addedAt: new Date("2026-01-01") }];
  const res = mockRes();

  await getMyCart(mockReq(), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.items[0].productId, "product-1");
  assert.equal(res.body.data.items[0].product.thumbnailUrl, "http://img/product.jpg");
  assert.equal(res.body.data.summary.subtotal, 200000);
  assert.equal(res.body.data.summary.totalAmount, 235000);
});

test("cart add creates or updates item quantity", async () => {
  reset();
  populatedCart.items = [{ postId: product, quantity: 2, addedAt: new Date("2026-01-01") }];
  const res = mockRes();

  await addCartItem(mockReq({ productId: "product-1", quantity: 2 }), res);

  assert.equal(res.statusCode, 201);
  assert.equal(cartDoc.items.length, 1);
  assert.equal(cartDoc.items[0].quantity, 2);
  assert.equal(res.body.data.summary.itemCount, 2);
});

test("cart remove deletes matching item", async () => {
  reset();
  cartDoc.items = [{ postId: "product-1", quantity: 1 }, { postId: "product-2", quantity: 1 }];
  populatedCart.items = [{ postId: product, quantity: 1, addedAt: new Date("2026-01-01") }];
  const res = mockRes();

  await removeCartItem(mockReq({}, { productId: "product-1" }), res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(cartDoc.items.map((item) => item.postId), ["product-2"]);
});

test("cart checkout reserves inventory and creates pending orders", async () => {
  reset();
  cartDoc.items = [{ postId: "product-1", quantity: 2 }];
  const res = mockRes();

  await checkoutCart(
    mockReq({
      recipientName: "Buyer",
      buyerPhone: "0900000000",
      buyerAddress: "Hoa Lac",
      note: "Nhan gio hanh chinh",
    }),
    res
  );

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(createdOrders.length, 1);
  assert.deepEqual(reservedCalls, [{ productId: "product-1", quantity: 2 }]);
  assert.equal(createdOrders[0].status, "PENDING");
  assert.equal(createdOrders[0].inventoryStatus, "reserved");
  assert.equal(createdOrders[0].paymentMethod, "COD");
  assert.equal(createdOrders[0].totalAmount, 235000);
  assert.equal(cartDoc.items.length, 0);
});
