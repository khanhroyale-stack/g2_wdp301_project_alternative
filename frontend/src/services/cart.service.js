import api from "./api";

const cartService = {
  getMyCart: async () => {
    const response = await api.get("/cart");
    return response.data;
  },
  addCartItem: async (productId, quantity = 1) => {
    const response = await api.post("/cart/items", { productId, quantity });
    return response.data;
  },
  removeCartItem: async (productId) => {
    const response = await api.delete(`/cart/items/${productId}`);
    return response.data;
  },
  checkoutCart: async (payload) => {
    const response = await api.post("/cart/checkout", payload);
    return response.data;
  },
};

export default cartService;
