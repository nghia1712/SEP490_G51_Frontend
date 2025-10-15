import authorApi from "./baseAPI/authorAPI";

// Backend controller: /api/Supplier
const API_URL = "/Supplier";

// Cache-busting utility
const addCacheBusting = (url) => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_t=${Date.now()}&_r=${Math.random()
    .toString(36)
    .substr(2, 9)}`;
};

const supplierAPI = {
  getList: (page = 1, pageSize = 20, keyword) => {
    const params = new URLSearchParams({ page, pageSize });
    if (keyword) params.append('keyword', keyword);
    return authorApi.get(addCacheBusting(`${API_URL}/list?${params.toString()}`));
  },
  getById: (id) => authorApi.get(`${API_URL}/detail?id=${id}`),
  add: (data) => authorApi.post(`${API_URL}/create`, data),
  update: (id, data) => authorApi.put(`${API_URL}/update?id=${id}`, data),
  enable: (supplierId) => authorApi.post(`${API_URL}/enable?supplierId=${encodeURIComponent(supplierId)}`),
  disable: (supplierId) => authorApi.post(`${API_URL}/disable?supplierId=${encodeURIComponent(supplierId)}`),
};

export default supplierAPI;
