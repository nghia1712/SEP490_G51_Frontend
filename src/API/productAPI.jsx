import authorApi from "./baseAPI/authorAPI";
import formDataApi from "./baseAPI/formDataAPI";

// Backend controller: /api/Product
const API_URL = "/Product";

const productAPI = {
  getAll: () => authorApi.get(`${API_URL}/all`),
  getById: (id) => authorApi.get(`${API_URL}/getbyid/${id}`),
  create: (data) => authorApi.post(`${API_URL}/create`, data),
  update: (id, data) => authorApi.put(`${API_URL}/update/${id}`, data),
  setStatus: (id, status) => authorApi.put(`${API_URL}/${id}/status`, status),
};

export default productAPI;
