import api from "./api";

const productService = {
  getProducts: async (params) => {
    const response = await api.get("/products", { params });
    return response.data;
  },
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get("/products/categories");
    return response.data;
  },
  createProduct: async (data) => {
    const response = await api.post("/products", data);
    return response.data;
  },
  updateProduct: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  getMyProducts: async () => {
    const response = await api.get("/products/my");
    return response.data;
  },
  adminGetProducts: async (status) => {
    const response = await api.get("/products/admin/all", { params: { status } });
    return response.data;
  },
  adminApproveProduct: async (id) => {
    const response = await api.patch(`/products/${id}/approve`);
    return response.data;
  },
  adminRejectProduct: async (id, reason) => {
    const response = await api.patch(`/products/${id}/reject`, { reason });
    return response.data;
  },
  adminChangeStatus: async (id, status, reason) => {
    const response = await api.patch(`/products/${id}/status`, { status, reason });
    return response.data;
  },
};

export default productService;
