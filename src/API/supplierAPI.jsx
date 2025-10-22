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
  getAll: () => authorApi.get(`${API_URL}/list?page=1&pageSize=1000`),
  getList: (page = 1, pageSize = 20, keyword) => {
    const params = new URLSearchParams({ page, pageSize });
    if (keyword) params.append('keyword', keyword);
    return authorApi.get(addCacheBusting(`${API_URL}/list?${params.toString()}`));
  },
  getById: (id) => authorApi.get(`${API_URL}/detail?id=${id}`),
  // Align FE payload with BE CreateSupplierRequestDTO
  // BE expects: { Name, Email, PhoneNumber, Address, Status, BankAccountNumber, MyDebt }
  add: (data) => {
    // Map flexible frontend fields to backend DTO
    const statusValue = (() => {
      const s = (data?.status ?? data?.Status ?? '').toString().toLowerCase();
      if (s === 'active' || s === '1' || s === 'true') return 1; // SupplierStatus.Active
      if (s === 'inactive' || s === '0' || s === 'false') return 0; // SupplierStatus.Inactive
      return 1; // default Active
    })();

    const payload = {
      Name: data?.name ?? data?.Name ?? '',
      Email: data?.email ?? data?.Email ?? undefined,
      PhoneNumber: data?.phoneNumber ?? data?.PhoneNumber ?? data?.contact ?? '',
      Address: data?.address ?? data?.Address ?? undefined,
      Status: statusValue,
      BankAccountNumber: data?.bankAccountNumber ?? data?.BankAccountNumber ?? undefined,
      MyDebt: data?.myDebt ?? data?.MyDebt ?? undefined,
    };

    return authorApi.post(`${API_URL}/create`, payload);
  },
  update: (id, data) => authorApi.put(`${API_URL}/update?id=${id}`, data),
  updateStatus: (id, data) => authorApi.put(`${API_URL}/updateStatus?id=${id}`, data),
  enable: (supplierId) => authorApi.post(`${API_URL}/enable?supplierId=${encodeURIComponent(supplierId)}`),
  disable: (supplierId) => authorApi.post(`${API_URL}/disable?supplierId=${encodeURIComponent(supplierId)}`),
};

export default supplierAPI;
