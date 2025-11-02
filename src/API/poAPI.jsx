import authorApi from "./baseAPI/authorAPI";

const API_URL = "/PO";

const poAPI = {
  // 🔹 Lấy tất cả PO
  getAllPO: () => authorApi.get(`${API_URL}/getAllPo`),

  // 🔹 Lấy chi tiết PO theo ID
  getDetail: (id) => authorApi.get(`${API_URL}/GetPoDetailByPoId/${id}`),

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
};

export default poAPI;
