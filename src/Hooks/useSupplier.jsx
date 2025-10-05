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
            // You may need to implement a getById in supplierAPI if needed
            // For now, fallback to getAll and filter
            const response = await supplierAPI.getAll();
            const data = response.data?.data || response.data || [];
            const found = data.find(s => s._id === id);
            setSupplier(found || null);
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
            setSuppliers(prev => [...prev, response.data]);
        } catch (err) {
            setError(err.message || "Failed to create supplier");
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
