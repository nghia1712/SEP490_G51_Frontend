import authorApi from "./baseAPI/authorAPI";

const API_URL = "/SalesOrder";

const salesOrderAPI = {
  // GET /api/SalesOrder/list
  viewList: () => authorApi.get(`${API_URL}/list`),

  // GET /api/SalesOrder/list-sales-order
  listSalesOrder: () => authorApi.get(`${API_URL}/list-sales-order`),

  // GET /api/SalesOrder/my-list-sales-order
  myListSalesOrder: () => authorApi.get(`${API_URL}/my-list-sales-order`),

  // GET /api/SalesOrder/get-quotation-info/{quotationId}
  getQuotationInfo: (quotationId) =>
    authorApi.get(`${API_URL}/get-quotation-info/${quotationId}`),

  // GET /api/SalesOrder/details/{orderId}
  viewDetails: (orderId) => authorApi.get(`${API_URL}/details/${orderId}`),

  // POST /api/SalesOrder/send/{orderId}
  sendOrder: (orderId) => authorApi.post(`${API_URL}/send/${orderId}`),

  // POST /api/SalesOrder/approve/{orderId}
  approveOrder: (orderId) => authorApi.post(`${API_URL}/approve/${orderId}`),

  // POST /api/SalesOrder/reject/{orderId}
  rejectOrder: (orderId) => authorApi.post(`${API_URL}/reject/${orderId}`),

  // POST /api/SalesOrder/complete/{orderId}
  completeOrder: (orderId) => authorApi.post(`${API_URL}/complete/${orderId}`),

  // POST /api/SalesOrder/confirm-payment
  // => chuẩn nhất là truyền body {status}, version của bạn đang đúng
  confirmPayment: (orderId, status) =>
    authorApi.post(`${API_URL}/confirm-payment?orderId=${orderId}`, { status }),

  // POST /api/SalesOrder/draft/create
  createDraftFromQuotation: (data) =>
    authorApi.post(`${API_URL}/draft/create`, data),

  // DELETE /api/SalesOrder/draft/{orderId}
  deleteDraft: (orderId) => authorApi.delete(`${API_URL}/draft/${orderId}`),

  // PUT /api/SalesOrder/draft/{orderId}/quantities
  updateDraftQuantities: (items) =>
    authorApi.put(
      `${API_URL}/draft/${items.salesOrderId}/quantities`,
      items
    ),

  // POST /api/SalesOrder/total-receipt
  recalcTotalReceipt: () => authorApi.post(`${API_URL}/total-receipt`),

  // GET /api/SalesOrder/list-sales-order-not-delivered
  listNotDelivered: () =>
    authorApi.get(`${API_URL}/list-sales-order-not-delivered`),

  // POST /api/SalesOrder/check-delivered-sales-order
  checkDelivered: () => authorApi.post(`${API_URL}/check-delivered-sales-order`),
};

export default salesOrderAPI;
