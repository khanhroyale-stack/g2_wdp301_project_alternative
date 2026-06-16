import api from "./api";

const rentalService = {
  createRentalRequest: async (data) => {
    const response = await api.post("/rentals", data);
    return response.data;
  },
  getMyRentals: async () => {
    const response = await api.get("/rentals/my-rentals");
    return response.data;
  },
  getMyLendings: async () => {
    const response = await api.get("/rentals/my-lendings");
    return response.data;
  },
  updateRentalStatus: async (id, data) => {
    const response = await api.patch(`/rentals/${id}/status`, data);
    return response.data;
  }
};

export default rentalService;
