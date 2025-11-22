import authorApi from "./baseAPI/authorAPI";

const API_URL = "/Invoice";

const invoiceAPI = {
  generateFromPaymentRemains: (payload) =>
    authorApi.post(`${API_URL}/generate-from-payment-remains`, payload),

  getInvoicePdf: (id) =>
    authorApi.get(`${API_URL}/${id}/pdf`, { responseType: "blob" }),

  sendInvoiceEmail: (id) => authorApi.post(`${API_URL}/${id}/send-email`),
  
  // Get list of invoices
  getInvoiceList: () => authorApi.get(`${API_URL}/get-all/invoices`),
  
  // Get invoice by id
  getInvoiceById: (id) => authorApi.get(`${API_URL}/${id}/invoice/details`),
  
  // Update draft invoice (add/remove payment remains)
  updateDraftInvoice: (id, data) => authorApi.put(`${API_URL}/${id}/update/draft-invoice`, data),
  
  // Send invoice (via email)
  sendInvoice: (id) => authorApi.post(`${API_URL}/${id}/send-email`),
};

export default invoiceAPI;

