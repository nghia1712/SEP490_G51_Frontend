import authorApi from "./baseAPI/authorAPI";

// Backend controller: /api/SalesQuotation
const API_URL = "/SalesQuotation";

const salesQuotationAPI = {
    // GET /api/SalesQuotation/view-list
    viewList: () => authorApi.get(`${API_URL}/view-list`),
    // GET /api/SalesQuotation/view-sales-quotation-details
    viewDetails: (sqId) => authorApi.get(`${API_URL}/view-sales-quotation-details`, { params: { sqId } }),
    // GET /api/SalesQuotation/generate-form
    generateForm: (rsqId) => authorApi.get(`${API_URL}/generate-form`, { params: { rsqId } }),
    // POST /api/SalesQuotation/create-sales-quotation
    createSalesQuotation: (data) => authorApi.post(`${API_URL}/create-sales-quotation`, data),
    // PATCH /api/SalesQuotation/update-sales-quotation
    updateSalesQuotation: (data) => authorApi.patch(`${API_URL}/update-sales-quotation`, data),
    // POST /api/SalesQuotation/send-sales-quotation
    sendSalesQuotation: (sqId) => authorApi.post(`${API_URL}/send-sales-quotation`, null, { params: { sqId } }),
    // DELETE /api/SalesQuotation/delete-sales-quotation
    deleteSalesQuotation: (sqId) => authorApi.delete(`${API_URL}/delete-sales-quotation`, { params: { sqId } }),
    // POST /api/SalesQuotation/add-sales-quotation-comment
    addComment: (sqId, content) => authorApi.post(`${API_URL}/add-sales-quotation-comment`, { sqId, content }),
};

export default salesQuotationAPI;

