import authorApi from "./baseAPI/authorAPI";

const API_URL = "/Warehouse";

const warehouseAPI = {
  // 1️⃣ Lấy danh sách tất cả warehouse
  getAllWarehouses: () => authorApi.get(`${API_URL}/get-all-warehouse`),

  // 2️⃣ Tạo warehouse mới
  createWarehouse: (data) =>
    authorApi.post(`${API_URL}/create-warehouse`, data),

  // 3️⃣ Cập nhật warehouse
  updateWarehouse: (data) => authorApi.put(`${API_URL}/update-warehouse`, data),

  // 4️⃣ Xóa warehouse
  deleteWarehouse: (warehouseId) =>
    authorApi.delete(`${API_URL}/delete-warehouse?warehouseId=${warehouseId}`),

  // 5️⃣ Lấy chi tiết warehouse
  getWarehouseDetails: (warehouseId) =>
    authorApi.get(`${API_URL}/get-warehouse-details/${warehouseId}`),

  // 6️⃣ Lấy tất cả lô sản phẩm theo vị trí kho (Warehouse Location ID)
  getLotsByLocation: (whlcid) =>
    authorApi.get(`${API_URL}/warehouse-location/${whlcid}`),

  // 7️⃣ Tạo phiên kiểm kê mới
  createInventorySession: (whlcid) =>
    authorApi.post(`${API_URL}/create-session/${whlcid}`),

  // 8️⃣ Cập nhật số lượng thực tế của Lot trong phiên kiểm kê
  updateInventoryBatch: (data) =>
    authorApi.put(`${API_URL}/update-count`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // 9️⃣ Lấy danh sách so sánh chênh lệch giữa thực tế và hệ thống của phiên kiểm kê
  getInventoryComparison: (sessionId) =>
    authorApi.get(`${API_URL}/comparison/${sessionId}`),

  // 🔟 Hoàn tất phiên kiểm kê
  completeInventorySession: (sessionId) =>
    authorApi.post(`${API_URL}/complete-session/${sessionId}`),

  // 11️⃣ Lấy lịch sử của phiên kiểm kê
  getHistoriesBySessionId: (sessionId) =>
    authorApi.get(`${API_URL}/session/${sessionId}/histories`),

  // 12️⃣ Xuất Excel toàn bộ InventoryHistories của một phiên kiểm kê
  exportInventorySessionToExcel: (sessionId) =>
    authorApi.get(`${API_URL}/session/${sessionId}/export`, {
      responseType: "blob",
    }),
};

export default warehouseAPI;
