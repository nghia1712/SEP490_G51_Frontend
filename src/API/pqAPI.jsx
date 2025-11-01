// ✅ Dùng axios không có token (nếu sau này cần token thì đổi sang authorApi)
import unauthorApi from "./baseAPI/unauthorAPI";

const API_URL = "/PQ";

const pqApi = {
  // Lấy tất cả PQ (Purchase Quotations)
  getAll: () => unauthorApi.get(`${API_URL}/getAll`),

  // Lấy chi tiết PQ theo id
  getDetail: (id) => unauthorApi.get(`${API_URL}/detail/${id}`),

  // Tạo PQ mới
  create: (data) => unauthorApi.post(`${API_URL}/create`, data),

  // Xem trước file Excel
  previewExcel: (id) => unauthorApi.get(`${API_URL}/preview/${id}`),

  // Tải file Excel (xuất ra file blob)
  downloadExcel: (id) =>
    unauthorApi.get(`${API_URL}/download/${id}`, {
      responseType: "blob",
    }),

  // Xóa PQ theo id
  delete: (id) => unauthorApi.delete(`${API_URL}/delete/${id}`),

  // Upload file Excel để preview trước
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append("excelFile", file);
    return unauthorApi.post(`${API_URL}/previewExcel`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Chuyển PQ thành PO (Purchase Order)
  convertToPo: (data) => unauthorApi.post(`${API_URL}/convertToPo`, data),
};

export default pqApi;
