import authorApi from './baseAPI/authorAPI';

// Backend controller: /api/TaxPolicy
const API_URL = '/TaxPolicy';

const taxPolicyAPI = {
  createTaxPolicy: (data) => authorApi.post(`${API_URL}/create-tax-policy`, data),
  updateTaxPolicy: (data) => authorApi.post(`${API_URL}/update-tax-policy`, data),
  disableEnableTaxPolicy: (taxId) =>
    authorApi.post(`${API_URL}/disable-enable-tax-policy`, null, { params: { taxId } }),
  deleteTaxPolicy: (taxId) => authorApi.delete(`${API_URL}/delete-tax-policy`, { params: { taxId } }),
  listTaxPolicies: () => authorApi.get(`${API_URL}/tax-policy-list`),
  getTaxPolicyDetails: (taxId) =>
    authorApi.get(`${API_URL}/tax-policy-details`, { params: { taxId } }),
};

export default taxPolicyAPI;

