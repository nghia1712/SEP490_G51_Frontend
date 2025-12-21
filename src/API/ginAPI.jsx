import authorApi from "./baseAPI/authorAPI";

const API_URL = "/GoodsIssueNote";

const ginAPI = {
  // ✅ GET: Lấy danh sách toàn bộ phiếu xuất kho
  getAll: () => authorApi.get(`${API_URL}/goods-issue-note-list`),

  // ✅ GET: Lấy chi tiết phiếu xuất kho theo ID
  getDetail: (ginId) =>
    authorApi.get(`${API_URL}/goods-issue-note-details`, { params: { ginId } }),

  // ✅ POST: Tạo phiếu xuất kho
  create: (data) =>
    authorApi.post(`${API_URL}/create-goods-issue-note`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // ✅ POST: Gửi phiếu xuất kho (send)
  send: (ginId) =>
    authorApi.post(`${API_URL}/send-goods-issue-note`, null, {
      params: { ginId },
    }),

  // ✅ PATCH: Cập nhật phiếu xuất kho
  update: (data) =>
    authorApi.patch(`${API_URL}/update-goods-issue-note`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // ✅ DELETE: Xóa phiếu xuất kho
  delete: (ginId) =>
    authorApi.delete(`${API_URL}/delete-goods-issue-note`, {
      params: { ginId },
    }),

  // ✅ POST: Báo kho không đủ hàng
  notEnough: (stockExportOrderId) =>
    authorApi.post(`${API_URL}/response-not-enough`, null, {
      params: { stockExportOrderId },
    }),

  // ✅ POST: Xuất lô sản phẩm
  exportedLotProduct: (goodsIssueNoteId) =>
    authorApi.post(`${API_URL}/exported-lot-product`, null, {
      params: { goodsIssueNoteId },
    }),

  // ✅ GET: Thống kê phiếu xuất kho đã xuất
  exportedStatistic: () => authorApi.get(`${API_URL}/exported-statistic`),

  // ✅ GET: Thống kê phiếu xuất kho chưa xuất
  notExportedStatistic: () =>
    authorApi.get(`${API_URL}/not-exported-statistic`),

  // ✅ GET: Xuất GRN PDF → trả file blob
exportPdf: (ginId) =>
  authorApi.get(`${API_URL}/download-goods-issue-note`, {
    params: { ginId },
    responseType: "blob",
  }),

};

export default ginAPI;
