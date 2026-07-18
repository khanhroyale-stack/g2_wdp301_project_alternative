import api from "./api";

const uploadService = {
  uploadImages: async (files, fileType = "product_image") => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }
    formData.append("fileType", fileType);
    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
};

export default uploadService;
