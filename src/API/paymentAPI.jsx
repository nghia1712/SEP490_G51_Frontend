import api from "./baseAPI/authorAPI";

const API_URL = "/Payment";
const SALES_ORDER_API_URL = "/SalesOrder";

const paymentAPI = {
  // 🔹 Khởi tạo thanh toán VNPay (deposit/full)
  init: (data) =>
    api.post(`${API_URL}/init`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🔹 ReturnUrl (VNPay redirect sau khi thanh toán)
  handleReturn: (queryParams) =>
    api.get(`${API_URL}/return`, {
      params: queryParams,
    }),

  // 🔹 IPN (Instant Payment Notification) - server to server
  handleIpn: (queryParams) =>
    api.get(`${API_URL}/vnpay/ipn`, {
      params: queryParams,
    }),

  // ================== MANUAL DEPOSIT CHECKS ==================
  // CUSTOMER: GET /api/SalesOrder/deposit-checks/manual/my
  getManualDepositChecks: () =>
    api.get(`${SALES_ORDER_API_URL}/deposit-checks/manual/my`),

  // GET /api/SalesOrder/deposit-checks/manual/{requestId}
  getManualDepositCheckDetail: (requestId) =>
    api.get(`${SALES_ORDER_API_URL}/deposit-checks/manual/${requestId}`),

  // POST /api/SalesOrder/deposit-checks/{requestId}/approve
  approveManualDepositCheck: (requestId) =>
    api.post(`${SALES_ORDER_API_URL}/deposit-checks/${requestId}/approve`),

  // POST /api/SalesOrder/deposit-checks/{requestId}/reject
  rejectManualDepositCheck: (requestId, payload) =>
    api.post(`${SALES_ORDER_API_URL}/deposit-checks/${requestId}/reject`, payload),

  // ACCOUNTANT: GET /api/SalesOrder/all-deposit-checks/manual
  getAllManualDepositChecks: (status) =>
    api.get(`${SALES_ORDER_API_URL}/all-deposit-checks/manual`, {
      params: status !== undefined && status !== null ? { status } : {},
    }),
};

export default paymentAPI;
