import authorApi from "./baseAPI/authorAPI";

// Backend controller: /api/RequestSalesQuotation
const API_URL = "/RequestSalesQuotation";

const requestSalesQuotationAPI = {
    // GET /api/RequestSalesQuotation/view-list
    viewList: () => authorApi.get(`${API_URL}/view-list`),
    // POST /api/RequestSalesQuotation/create-request
    createRequest: (data) => authorApi.post(`${API_URL}/create-request`, data),
};

export default requestSalesQuotationAPI;

