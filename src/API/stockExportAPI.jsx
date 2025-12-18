import authorApi from "./baseAPI/authorAPI";

const API_URL = "/StockExportOrder";

const stockExportApi = {
  // ✅ POST: Tạo phiếu xuất kho
  create: (data) =>
    authorApi.post(`${API_URL}/create-stock-export-order`, data),

  // ✅ POST: Gửi phiếu xuất kho
  send: (seoId) =>
    authorApi.post(`${API_URL}/send-stock-export-order?seoId=${seoId}`),

  // ✅ GET: Danh sách phiếu xuất kho
  list: () => authorApi.get(`${API_URL}/list-stock-export-order`),

  // ✅ GET: Chi tiết phiếu xuất kho
  details: (seoId) =>
    authorApi.get(`${API_URL}/details-stock-export-order?seoId=${seoId}`),

  // ✅ PATCH: Cập nhật phiếu xuất kho
  update: (data) =>
    authorApi.patch(`${API_URL}/update-stock-export-order`, data, {
      headers: { "Content-Type": "application/json-patch+json" },
    }),

  // ✅ DELETE: Xóa phiếu xuất kho
  delete: (seoId) =>
    authorApi.delete(`${API_URL}/delete-stock-export-order?seoId=${seoId}`),

  getOrderInfor: (orderId) =>
    authorApi.get(`${API_URL}/stock-export-order-form`, {
      params: { soId: orderId },
    }),

  // ✅ POST: Chờ xuất kho (Sales Staff)
  awaitStockExport: (seoId) =>
    authorApi.post(`${API_URL}/await-stock-export-order`, null, {
      params: { seoId },
    }),

  // ✅ POST: Kiểm tra sẵn sàng xuất kho (Warehouse Staff)
  checkReadyToExport: (seoId) =>
    authorApi.post(`${API_URL}/check-ready-to-export`, null, {
      params: { seoId },
    }),
};

export default stockExportApi;
