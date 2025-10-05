import { useState, useCallback } from "react";
import supplierProductAPI from "../API/supplierProductAPI";

const useSupplierProduct = () => {
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all supplier products
  const fetchAllSupplierProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierProductAPI.getAll();
      setSupplierProducts(response.data?.data || []);
    } catch (err) {
      setError(err.message || "Lỗi khi tải sản phẩm nhà cung cấp");
      setSupplierProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products by supplier
  const fetchProductsBySupplier = useCallback(async (supplierId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierProductAPI.getProductsBySupplier(supplierId);
      return response.data?.data || [];
    } catch (err) {
      setError(err.message || "Lỗi khi tải sản phẩm theo nhà cung cấp");
      setSupplierProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create supplier product
  const createSupplierProduct = useCallback(async (productData) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (key === "productImage" && value instanceof File) {
          formData.append("productImage", value);
        } else {
          formData.append(key, value);
        }
      });
      const response = await supplierProductAPI.create(formData);
      await fetchAllSupplierProducts();
      return response.data;
    } catch (err) {
      setError(err.message || "Lỗi khi tạo sản phẩm nhà cung cấp");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAllSupplierProducts]);

  // Update supplier product
  const updateSupplierProduct = useCallback(async (id, productData) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (key === "productImage" && value instanceof File) {
          formData.append("productImage", value);
        } else {
          formData.append(key, value);
        }
      });
      const response = await supplierProductAPI.update(id, formData);
      await fetchAllSupplierProducts();
      return response.data;
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật sản phẩm nhà cung cấp");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAllSupplierProducts]);

  // Delete supplier product
  const deleteSupplierProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierProductAPI.delete(id);
      await fetchAllSupplierProducts();
      return response.data;
    } catch (err) {
      setError(err.message || "Lỗi khi xóa sản phẩm nhà cung cấp");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAllSupplierProducts]);

  return {
    supplierProducts,
    loading,
    error,
    fetchAllSupplierProducts,
    fetchProductsBySupplier,
    createSupplierProduct,
    updateSupplierProduct,
    deleteSupplierProduct,
    setSupplierProducts,
  };
};

export default useSupplierProduct;
