import authorApi from "./baseAPI/authorAPI";

// Backend controller: /api/RequestSalesQuotation
const API_URL = "/RequestSalesQuotation";

const requestSalesQuotationAPI = {
    // GET /api/RequestSalesQuotation/view-list
    viewList: () => authorApi.get(`${API_URL}/view-list`),
    // POST /api/RequestSalesQuotation/create-request
    createRequest: (data) => authorApi.post(`${API_URL}/create-request`, data),
    // POST /api/RequestSalesQuotation/send-request
    sendRequest: (rsqId) => authorApi.post(`${API_URL}/send-request`, null, { params: { rsqId } }),
    // GET /api/RequestSalesQuotation/view-details
    viewDetails: (rsqId) => authorApi.get(`${API_URL}/view-details`, { params: { rsqId } }),
    // PUT /api/RequestSalesQuotation/update-request
    updateRequest: (data) => authorApi.put(`${API_URL}/update-request`, data),
    // DELETE /api/RequestSalesQuotation/delete-request
    deleteRequest: (rsqId) => authorApi.delete(`${API_URL}/delete-request`, { params: { rsqId } }),
};

export default requestSalesQuotationAPI;

