import api from "./api";

const categoryService = {
  getCategories: async () => {
    const response = await api.get("/categories");
    return response.data;
  }
};

export default categoryService;
