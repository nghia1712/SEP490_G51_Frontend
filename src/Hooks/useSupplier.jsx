import { useState } from "react";
import supplierAPI from "../API/supplierAPI";

const useSupplier = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [supplier, setSupplier] = useState(null);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await supplierAPI.getAll();
            // API returns { data: [...] } or just [...], handle both
            const data = response.data?.data || response.data || [];
            setSuppliers(data);
        } catch (err) {
            setError(err.message || "Failed to fetch suppliers");
        } finally {
            setLoading(false);
        }
    };

    // There is no getList(id) in supplierAPI, so this should be a separate endpoint if needed
    const fetchSupplierById = async (id) => {
        setLoading(true);
        try {
            const response = await supplierAPI.getById(id);
            setSupplier(response.data || null);
        } catch (err) {
            setError(err.message || "Failed to fetch supplier");
        } finally {
            setLoading(false);
        }
    };

    const createSupplier = async (formData) => {
        setLoading(true);
        try {
            const response = await supplierAPI.add(formData);
            // Backend returns { success, message, data }
            const created = response?.data?.data ?? response?.data;
            if (created) {
                setSuppliers(prev => [...prev, created]);
            }
            return response?.data; // allow caller to show message
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to create supplier");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateSupplier = async (id, formData) => {
        setLoading(true);
        try {
            const response = await supplierAPI.update(id, formData);
            setSuppliers(prev => prev.map(s => (s._id === id ? response.data : s)));
        } catch (err) {
            setError(err.message || "Failed to update supplier");
        } finally {
            setLoading(false);
        }
    };

    const updateSupplierStatus = async (id, status) => {
        setLoading(true);
        try {
            const response = await supplierAPI.updateStatus(id, { status });
            setSuppliers(prev => prev.map(s => (s._id === id ? response.data : s)));
        } catch (err) {
            setError(err.message || "Failed to update supplier status");
        } finally {
            setLoading(false);
        }
    };

    return {
        suppliers,
        loading,
        error,
        supplier,
        fetchSuppliers,
        fetchSupplierById,
        createSupplier,
        updateSupplier,
        updateSupplierStatus
    };
};

export default useSupplier;
