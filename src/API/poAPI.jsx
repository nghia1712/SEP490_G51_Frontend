import authorApi from "./baseAPI/authorAPI";

const API_URL = "/PO";

const poAPI = {
  // 🔹 Lấy tất cả PO
  getAllPO: () => authorApi.get(`${API_URL}/getAllPo`),

  // 🔹 Lấy chi tiết PO theo ID
  getDetail: (id) => authorApi.get(`${API_URL}/GetPoDetailByPoId2/${id}`),

  // 🔹 Ghi nhận tiền gửi (đặt cọc)
  deposit: (id, data) =>
    authorApi.put(`${API_URL}/DepositedPurchaseOrder/${id}`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🔹 Ghi nhận thanh toán công nợ
  payDebt: (id, data) =>
    authorApi.put(`${API_URL}/DebtAccountantPurchaseOrder/${id}`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🔹 Thay đổi trạng thái đơn hàng
  changeStatus: (id, newStatus) =>
    authorApi.put(`${API_URL}/${id}/status`, null, {
      params: { newStatus },
    }),

  // 🔹 Xuất file PDF báo cáo thanh toán PO
  exportPaymentPdf: (id) =>
    authorApi.get(`${API_URL}/exportPaymentPdf/${id}`, {
      responseType: "blob",
    }),

  // 🔹 Lấy danh sách PO theo trạng thái nhập kho (đủ, một phần, chưa nhập)
  getByReceivingStatus: () => authorApi.get(`${API_URL}/by-receiving-status`),

  // 🔹 Lấy danh sách PO đã nhập đủ hàng
  getFullyReceived: () => authorApi.get(`${API_URL}/fully-received`),

  // 🔹 Lấy danh sách PO mới nhập một phần
  getPartiallyReceived: () => authorApi.get(`${API_URL}/partially-received`),

  // 🔹 Lấy danh sách PO chưa nhập hàng nào
  getNotReceived: () => authorApi.get(`${API_URL}/not-received`),

  deleteDraftPO: (id) =>
    authorApi.delete(`${API_URL}/deletePOWithDraftStatus/${id}`),

  // 🔹 Lấy danh sách công nợ (Debt Report)
  getAllDebtReport: () => authorApi.get(`${API_URL}/GetAllDebtReport`),

  // 🔹 Lấy chi tiết công nợ theo dbid
  getDetailDebtReport: (dbid) =>
    authorApi.get(`${API_URL}/GetDetailDebtReport/${dbid}`),

  // 🔹 Lấy thông tin kinh doanh (Pharmacy Secret Info)
  getPharmacySecretInfo: () =>
    authorApi.get(`${API_URL}/GetPharmacySecretInfor`),
};

export default poAPI;
