import api from "./api";

const inspectionService = {
  createInspection: async (data) => {
    const response = await api.post("/inspections", data);
    return response.data;
  },
  getInspection: async (id) => {
    const response = await api.get(`/inspections/${id}`);
    return response.data;
  },
  getInspectionsByOrder: async (orderId) => {
    const response = await api.get(`/inspections/order/${orderId}`);
    return response.data;
  },
  getInspectionsByRental: async (rentalId) => {
    const response = await api.get(`/inspections/rental/${rentalId}`);
    return response.data;
  },
  updateInspection: async (id, data) => {
    const response = await api.put(`/inspections/${id}`, data);
    return response.data;
  },
  adminGetAllInspections: async () => {
    const response = await api.get("/inspections/admin");
    return response.data;
  }
};

export default inspectionService;
