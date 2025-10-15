import authorApi from "./baseAPI/authorAPI";

// Backend controller: /api/Category
const API_URL = "/Category";

const categoryAPI = {
    getAll: () => authorApi.get(`${API_URL}/all`),
    get: (id) => authorApi.get(`${API_URL}/getbyid/${id}`),
    add: (data) => authorApi.post(`${API_URL}/create`, data),
    // Missing in backend: update/inactivate/subcategory endpoints
};

export default categoryAPI;