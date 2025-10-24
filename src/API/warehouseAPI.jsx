import authorApi from "./baseAPI/authorAPI";

const API_URL = "/Warehouse";

const warehouseAPI = {
  // Lấy danh sách tất cả warehouse
  getAllWarehouses: () => authorApi.get(`${API_URL}/get-all-warehouse`),
  
  // Tạo warehouse mới
  createWarehouse: (data) => authorApi.post(`${API_URL}/create-warehouse`, data),
  
  // Cập nhật warehouse
  updateWarehouse: (data) => authorApi.put(`${API_URL}/update-warehouse`, data),
  
  // Lấy chi tiết warehouse
  getWarehouseDetails: (warehouseId) => authorApi.get(`${API_URL}/get-warehouse-details?warehouseId=${warehouseId}`),
};

export default warehouseAPI;
