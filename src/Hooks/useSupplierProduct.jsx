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
      
      // Handle response structure: { statusCode: 200, success: true, message: "", data: [...] }
      let products = [];
      
      console.log("=== fetchProductsBySupplier Debug ===");
      console.log("Full response:", response);
      console.log("response.data:", response.data);
      console.log("response.data.success:", response.data?.success);
      console.log("response.data.data:", response.data?.data);
      console.log("Is array:", Array.isArray(response.data?.data));
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        // Format: { success: true, data: [...], statusCode: 200, message: "" }
        products = response.data.data;
        console.log("Using response.data.data, count:", products.length);
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Fallback: check response.data.data directly
        products = response.data.data;
        console.log("Using response.data.data (fallback), count:", products.length);
      } else if (Array.isArray(response.data)) {
        // Legacy format: directly array
        products = response.data;
        console.log("Using response.data (legacy), count:", products.length);
      }
      
      if (products.length > 0) {
        console.log("First product:", products[0]);
        console.log("First product keys:", Object.keys(products[0]));
        console.log("First product inputPrice:", products[0].inputPrice, typeof products[0].inputPrice);
        console.log("First product lotQuantity:", products[0].lotQuantity, typeof products[0].lotQuantity);
      }
      
      console.log("Final products:", products);
      console.log("=== End Debug ===");
      
      return products || [];
    } catch (err) {
      setError(err.message || "Lỗi khi tải sản phẩm theo nhà cung cấp");
      return [];
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
