import api from "./api";

const reportService = {
  createReport: async (data) => {
    const response = await api.post("/reports", data);
    return response.data;
  },
  getAdminReports: async (status) => {
    const response = await api.get("/reports", { params: { status } });
    return response.data;
  },
  resolveReport: async (id, status, adminNote) => {
    const response = await api.patch(`/reports/${id}/resolve`, { status, adminNote });
    return response.data;
  }
};

export default reportService;
