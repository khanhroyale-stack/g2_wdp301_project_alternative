import api from "./api";

const shipperReportService = {
  create: async (data) => (await api.post("/shipper-reports", data)).data,
  getMine: async () => (await api.get("/shipper-reports/my")).data,
  getAdmin: async (params) => (await api.get("/shipper-reports/admin", { params })).data,
  resolve: async (id, data) => (await api.patch(`/shipper-reports/${id}`, data)).data,
};

export default shipperReportService;
