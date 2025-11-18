import authorApi from "./baseAPI/authorAPI";

const API_URL = "/GoodsIssueNote";

const stockExportApi = {
  // ✅ GET: Lấy danh sách toàn bộ phiếu xuất kho
  getAll: () => authorApi.get(`${API_URL}/goods-issue-note-list`),

  // ✅ GET: Lấy chi tiết phiếu xuất kho theo ID
  getDetail: (ginId) => authorApi.get(`${API_URL}/goods-issue-note-details`, { params: { ginId } }),

  // ✅ POST: Tạo phiếu xuất kho
  create: (data) => authorApi.post(`${API_URL}/create-goods-issue-note`, data, {
    headers: { "Content-Type": "application/json" },
  }),

  // ✅ POST: Gửi phiếu xuất kho (send)
  send: (ginId) => authorApi.post(`${API_URL}/send-goods-issue-note`, null, { params: { ginId } }),

  // ✅ PATCH: Cập nhật phiếu xuất kho
  update: (data) => authorApi.patch(`${API_URL}/update-goods-issue-note`, data, {
    headers: { "Content-Type": "application/json" },
  }),

  // ✅ DELETE: Xóa phiếu xuất kho
  delete: (ginId) => authorApi.delete(`${API_URL}/delete-goods-issue-note`, { params: { ginId } }),
};

export default stockExportApi;
