import authorApi from "./baseAPI/authorAPI";

const API_URL = "/categories";

const categoryAPI = {
    getAll: () => authorApi.get(`${API_URL}/getAllCategories`),
    get: (id) => authorApi.get(`${API_URL}/getCategoryById/${id}`),
    add: (data) => authorApi.post(`${API_URL}/addCategory`, data),
    update: (id, data) => authorApi.put(`${API_URL}/updateCategory/${id}`, data),
    inactivate: (id) => authorApi.put(`${API_URL}/inactivateCategory/${id}`),
    addSub: (categoryId, data) => authorApi.post(`${API_URL}/${categoryId}/sub/add`, data),
    updateSub: (categoryId, subId, data) => authorApi.put(`${API_URL}/${categoryId}/sub/update/${subId}`, data),
    deleteSub: (categoryId, subId) => authorApi.delete(`${API_URL}/${categoryId}/sub/delete/${subId}`),
};

export default categoryAPI;