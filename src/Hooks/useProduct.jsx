import { useState } from "react";
import productAPI from "../API/productAPI";

const useProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [productSupplier, setProductSupplier] = useState(null);

  // Helper: normalize varied API shapes to a flat array
  const normalizeToArray = (possibleArray) => {
    if (Array.isArray(possibleArray)) return possibleArray;
    if (possibleArray && typeof possibleArray === "object") {
      if (Array.isArray(possibleArray.data)) return possibleArray.data;
      if (Array.isArray(possibleArray.items)) return possibleArray.items;
      // Try to find the first array field in the object (fallback for unknown shapes)
      const firstArray = Object.values(possibleArray).find(Array.isArray);
      if (Array.isArray(firstArray)) return firstArray;
    }
    return [];
  };
  const fetchProductLots = async (productId) => {
    setLoading(true);
    try {
      const response = await productAPI.searchLotByProductId(productId);
      const lots = response?.data?.data ?? [];
      const normalizedLots = lots.map((lot) => ({
        ...lot,
        _lotID: lot.lotID ?? lot.id,
        inputDate: lot.inputDate,
        expiredDate: lot.expiredDate,
        lotQuantity: lot.lotQuantity,
        salePrice: lot.salePrice,
        inputPrice: lot.inputPrice,
        productName: lot.productName,
        supplierID: lot.supplierID,
        productID: lot.productID,
        warehouselocationID: lot.warehouselocationID,
        lastCheckedDate: lot.lastCheckedDate,
      }));
      return normalizedLots;
    } catch (err) {
      setError(err.message || "Failed to fetch product lots");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (options = {}) => {
    setLoading(true);
    try {
      const { onlyActive } = options;
      const response = onlyActive
        ? await productAPI.getActive()
        : await productAPI.getAll();
      const normalized = normalizeToArray(response?.data);
      // Normalize ID field into _pid for consistent usage in UI/actions
      const withPid = normalized.map((p) => ({
        ...p,
        _pid:
          p?.ProductID ??
          p?.productID ??
          p?.ProductId ??
          p?.productId ??
          p?.id ??
          p?._id ??
          null,
        // Normalize field names for consistent access
        productID:
          p?.ProductID ??
          p?.productID ??
          p?.ProductId ??
          p?.productId ??
          p?.id ??
          p?._id,
        productName: p?.ProductName ?? p?.productName,
        productDescription: p?.ProductDescription ?? p?.productDescription,
        unit: p?.Unit ?? p?.unit,
        categoryID: p?.CategoryID ?? p?.categoryID,
        image: p?.Image ?? p?.image,
        minQuantity: p?.MinQuantity ?? p?.minQuantity,
        maxQuantity: p?.MaxQuantity ?? p?.maxQuantity,
        totalCurrentQuantity:
          p?.TotalCurrentQuantity ?? p?.totalCurrentQuantity ?? p?.totalStock,
        status: p?.Status ?? p?.status,
        categoryName:
          p?.CategoryName ??
          p?.categoryName ??
          p?.Category?.Name ??
          p?.category?.name ??
          null,
      }));
      console.log("Loaded products sample for shape check:", withPid?.[0]);
      setProducts(withPid);
    } catch (err) {
      setError(err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductById = async (id) => {
    setLoading(true);
    try {
      const response = await productAPI.getById(id);
      setProduct(response.data);
    } catch (err) {
      setError(err.message || "Failed to fetch product");
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (formData) => {
    setLoading(true);
    try {
      const response = await productAPI.create(formData);
      const created = response?.data?.data ?? response?.data ?? null;
      setProducts(created ? [...products, created] : products);
    } catch (err) {
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id, formData) => {
    setLoading(true);
    try {
      const response = await productAPI.update(id, formData);
      const updated = response?.data?.data ?? response?.data ?? null;
      setProducts(products.map((p) => (p._id === id ? updated || p : p)));
    } catch (err) {
      setError(err.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const updateProductWithSupplier = async (id, formData) => {
    setLoading(true);
    try {
      const response = await productAPI.updateWithSupplier(id, formData);
      setProducts(
        products.map((p) => (p._id === id ? response.data.product : p))
      );
      return response.data;
    } catch (err) {
      setError(err.message || "Failed to update product with supplier");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchProductSupplier = async (productId) => {
    setLoading(true);
    try {
      const response = await productAPI.getProductSupplier(productId);
      setProductSupplier(response.data.supplierProduct);
      return response.data.supplierProduct;
    } catch (err) {
      setError(err.message || "Failed to fetch product supplier");
      setProductSupplier(null);
    } finally {
      setLoading(false);
    }
  };

  const inactiveProduct = async (productOrId) => {
    setLoading(true);
    try {
      // Accept whole product object or raw id
      let id =
        typeof productOrId === "object" && productOrId !== null
          ? productOrId._pid ??
            productOrId.ProductID ??
            productOrId.productID ??
            productOrId.ProductId ??
            productOrId.productId ??
            productOrId.id ??
            productOrId._id
          : productOrId;
      const currentProduct =
        typeof productOrId === "object" && productOrId !== null
          ? productOrId
          : products.find(
              (p) =>
                p?._id === id ||
                p?.id === id ||
                p?.ProductID === id ||
                p?.productID === id ||
                p?.ProductId === id ||
                p?.productId === id
            );

      // Fallback: if no id resolved, query server and try to resolve by name
      if (!id) {
        try {
          const res = await productAPI.getAll();
          const serverList = Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data)
            ? res.data
            : [];
          const matched = serverList.find((p) => {
            const name = p?.ProductName ?? p?.productName;
            return (
              currentProduct &&
              name &&
              String(name).toLowerCase() ===
                String(currentProduct.productName || "").toLowerCase()
            );
          });
          id =
            matched?._pid ??
            matched?.ProductID ??
            matched?.productID ??
            matched?.ProductId ??
            matched?.productId ??
            matched?.id ??
            matched?._id;
        } catch {}
      }

      if (!id) throw new Error("Không tìm thấy mã sản phẩm để đổi trạng thái");
      // Toggle boolean per BE
      const isActive =
        currentProduct?.Status === true ||
        currentProduct?.status === "active" ||
        currentProduct?.status === true;
      const newStatusBool = !isActive;
      await productAPI.setStatus(id, newStatusBool);
      // 更新本地状态
      setProducts(
        products.map((p) => {
          const isTarget =
            p?._id === id ||
            p?.id === id ||
            p?.ProductID === id ||
            p?.productID === id ||
            p?.ProductId === id ||
            p?.productId === id;
          if (!isTarget) return p;
          // Keep both boolean and string forms consistent for UI
          return {
            ...p,
            Status: newStatusBool,
            status: newStatusBool ? "active" : "inactive",
          };
        })
      );
    } catch (err) {
      setError(err.message || "Failed to inactivate product");
    } finally {
      setLoading(false);
    }
  };

  const checkProductName = async (name) => {
    try {
      const response = await productAPI.checkProductName(name);
      console.log(response);
      return response.data.exists; // Giả sử API trả về { exists: true/false }
    } catch (err) {
      setError(err.message || "Failed to check product name");
      return false;
    }
  };

  return {
    products,
    loading,
    error,
    product,
    productSupplier,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    updateProductWithSupplier,
    fetchProductSupplier,
    inactiveProduct,
    checkProductName,
    fetchProductLots,
  };
};

export default useProduct;
