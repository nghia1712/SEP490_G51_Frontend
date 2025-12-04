import authorApi from "./baseAPI/authorAPI";

const API_URL = "/GRN";

const grnApi = {
  // ✅ GET: Lấy danh sách toàn bộ GRN
  getAll: () => authorApi.get(`${API_URL}/getAll`),

  // ✅ GET: Lấy chi tiết GRN theo ID
  getDetail: (id) => authorApi.get(`${API_URL}/detail/${id}`),

  // ✅ POST: Tạo GRN từ PO
  createFromPO: (poId, data) =>
    authorApi.post(`${API_URL}/createGRNFromPo/${poId}`, data),

  // ✅ POST: Tạo GRN thủ công
  createManually: (poId, data) =>
    authorApi.post(`${API_URL}/CreateGRNManually/${poId}`, data, {
      headers: { "Content-Type": "application/json-patch+json" },
    }),

  // ✅ GET: Xuất GRN PDF → trả file blob
  exportPdf: (grnId) =>
    authorApi.get(`${API_URL}/exportPdf/${grnId}`, {
      responseType: "blob",
    }),

  // ✅ GET: Lấy thống kê nhập kho theo tháng
  getImportStatsByMonth: (year) =>
    authorApi.get(`${API_URL}/ImportStatisticsByMonth/${year}`),
};

export default grnApi;
