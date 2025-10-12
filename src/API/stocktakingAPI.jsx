import authorApi from "./baseAPI/authorAPI";

const API_URL = "/stocktaking";

const stocktakingAPI = {
  // Lấy danh sách inventories
  getInventories: () => authorApi.get("/inventory/getAll"),
  
  // Lấy lịch sử kiểm kê
  getStocktakingHistory: () => authorApi.get(`${API_URL}/getHistory`),
  
  // Lấy chi tiết phiếu kiểm kê
  getStocktakingDetail: (id) => authorApi.get(`${API_URL}/getDetail/${id}`),
  
  // Tạo phiếu kiểm kê mới
  createPendingStocktaking: (data) => authorApi.post(`${API_URL}/create`, data),
  
  // Cập nhật phiếu kiểm kê
  updateStocktaking: (id, data) => authorApi.put(`${API_URL}/update/${id}`, data),
  
  // Tạo phiếu điều chỉnh
  createAdjustment: (data) => authorApi.post(`${API_URL}/createAdjustment`, data),
  
  // Xóa phiếu kiểm kê
  deleteStocktakingTask: (id) => authorApi.delete(`${API_URL}/delete/${id}`),
};

export default stocktakingAPI;
