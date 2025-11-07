import authorApi from "./baseAPI/authorAPI";

// Backend controller: /api/Category
const API_URL = "/Category";

const categoryAPI = {
    getAll: () => authorApi.get(`${API_URL}/all`),
    getAllPublic: () => authorApi.get(`${API_URL}/public`),
    get: (id) => authorApi.get(`${API_URL}/getbyid/${id}`),
    add: (data) => authorApi.post(`${API_URL}/create`, data),
    // Backend supports PUT /api/Category/updatecategory with body: { CategoryID, Name, Description }
    update: (data) => authorApi.put(`${API_URL}/updatecategory`, data),
    // Backend supports PUT /api/Category/toggleStatus/{catId}
    toggleStatus: (catId) => authorApi.put(`${API_URL}/toggleStatus/${catId}`),
    // Backend supports DELETE /api/Category/delete/{catId}
    delete: (catId) => authorApi.delete(`${API_URL}/delete/${catId}`),
};

export default categoryAPI;