import authorApi from "./baseAPI/authorAPI";

const API_URL = "/Warehouse";

const warehouseAPI = {
  // Lấy danh sách tất cả warehouse
  getAllWarehouses: () => authorApi.get(`${API_URL}/get-all-warehouse`),

  // Tạo warehouse mới
  createWarehouse: (data) => authorApi.post(`${API_URL}/create-warehouse`, data),

  // Cập nhật warehouse
  updateWarehouse: (data) => authorApi.put(`${API_URL}/update-warehouse`, data),

  // Xóa warehouse
  deleteWarehouse: (warehouseId) => authorApi.delete(`${API_URL}/delete-warehouse?warehouseId=${warehouseId}`),

  // Lấy chi tiết warehouse
  getWarehouseDetails: (warehouseId) => authorApi.get(`${API_URL}/get-warehouse-details/${warehouseId}`),

  // Lấy tất cả lô sản phẩm theo vị trí kho (Warehouse Location ID)
  getLotsByLocation: (whlcid) => authorApi.get(`${API_URL}/warehouse-location/${whlcid}`),

  // Cập nhật giá bán cho 1 lô hàng
  updateLotSalePrice: (whlcid, lotid, newSalePrice) =>
    authorApi.put(`${API_URL}/warehouse-location/${whlcid}/lot/${lotid}/update-saleprice`, newSalePrice),

  // Cập nhật kiểm kê vật lý cho tất cả lô trong vị trí kho
updatePhysicalInventory: (whlcid, updates) =>
  authorApi.put(`${API_URL}/physicalInventory/${whlcid}`, updates, {
    headers: { "Content-Type": "application/json-patch+json" },
  }),

  // Lấy báo cáo kiểm kê vật lý theo tháng/năm
  getPhysicalInventoryReport: (month, year) =>
    authorApi.get(`${API_URL}/reportphysicalInventory?month=${month}&year=${year}`),

  // Xuất báo cáo kiểm kê ra Excel
  generatePhysicalInventoryExcel: (month, year) =>
    authorApi.get(`${API_URL}/reportphysicalInventory/excel/${month}/${year}`, { responseType: "blob" }),
};

export default warehouseAPI;
