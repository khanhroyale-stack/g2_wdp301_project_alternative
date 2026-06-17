import api from "./api";

const productService = {
  // Get all products with filters
  getProducts: async (params) => {
    const response = await api.get("/products", { params });
    return response.data;
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Get all categories
  getCategories: async () => {
    const response = await api.get("/products/categories");
    return response.data;
  },
};

export default productService;
