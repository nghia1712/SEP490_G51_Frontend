import authorApi from "./baseAPI/authorAPI";
const API_URL = "/WarehouseLocation";

const warehouseLocationAPI = {
  getAll: () => authorApi.get(`${API_URL}/get-all-warehouse-location`),

  getDetail: (id) =>
    authorApi.get(`${API_URL}/get-warehouse-location-details/${id}`),

  getByWarehouseId: (warehouseId) =>
    authorApi.get(`${API_URL}/get-warehouse-location-by-warehouse-id`, {
      params: { warehouseId },
    }),

  create: (data) =>
    authorApi.post(`${API_URL}/create-warehouse-location`, data),

  update: (data) => authorApi.put(`${API_URL}/update-warehouse-location`, data),

  delete: (warehouseLocationId) =>
    authorApi.delete(`${API_URL}/delete`, { params: { warehouseLocationId } }),
};

export default warehouseLocationAPI;
