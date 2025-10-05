import authorApi from "./baseAPI/authorAPI";

const API_URL = "/suppliers";

// Cache-busting utility
const addCacheBusting = (url) => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_t=${Date.now()}&_r=${Math.random()
    .toString(36)
    .substr(2, 9)}`;
};

const supplierAPI = {
  getAll: () => {
    return authorApi.get(addCacheBusting(`${API_URL}/get-list-suppliers`), {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  },
  getList: () => {
    return authorApi.get(addCacheBusting(`${API_URL}/get-list-suppliers`), {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  },
  getMinimal: () => authorApi.get(`${API_URL}/getAllSuppliers`), // Minimal data (id, name, status only)
  add: (data) => authorApi.post(`${API_URL}/addSupplier`, data),
  update: (id, data) => authorApi.put(`${API_URL}/updateSupplier/${id}`, data),
  updateStatus: (id, data) =>
    authorApi.put(`${API_URL}/update-status/${id}`, data),
};

export default supplierAPI;
