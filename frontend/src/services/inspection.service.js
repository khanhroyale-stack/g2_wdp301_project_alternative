import api from "./api";

const inspectionService = {
  // Create inspection report
  createInspection: async (data) => {
    const response = await api.post("/inspections", data);
    return response.data;
  },

  // Get inspections by delivery ID
  getInspectionsByDelivery: async (deliveryId) => {
    const response = await api.get(`/inspections/delivery/${deliveryId}`);
    return response.data;
  },

  // Get inspection by ID
  getInspectionById: async (id) => {
    const response = await api.get(`/inspections/${id}`);
    return response.data;
  },

  // Get my inspections
  getMyInspections: async () => {
    const response = await api.get("/inspections/my-inspections");
    return response.data;
  },
};

export default inspectionService;
