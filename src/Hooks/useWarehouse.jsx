import { useState, useCallback } from "react";
import inventoryAPI from "../API/inventoryAPI";
import productAPI from "../API/productAPI";
import warehouseAPI from "../API/warehouseAPI";

const useWarehouse = () => {
  const [shelves, setShelves] = useState([]);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [optimizedShelves, setOptimizedShelves] = useState([]);
  const [warehouseStats, setWarehouseStats] = useState(null);

  // Tải dữ liệu kho
  const loadWarehouseData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      // Lấy layout kho và danh sách sản phẩm song song
      const [shelvesRes, productsRes] = await Promise.all([
        inventoryAPI.getLayout(),
        productAPI.getAll()
      ]);
      
      setShelves(shelvesRes.data);
      setProducts(productsRes.data);
      
      return { shelves: shelvesRes.data, products: productsRes.data };
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu kho:", err);
      setError(err.response?.data?.message || "Đã xảy ra lỗi khi tải dữ liệu");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy thông tin chi tiết kệ
  const getShelfById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError("");
      
      const response = await inventoryAPI.getShelfById(id);
      setSelectedShelf(response.data);
      
      return response.data;
    } catch (err) {
      console.error("Lỗi khi lấy thông tin kệ:", err);
      setError(err.response?.data?.message || "Không thể lấy thông tin kệ");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật thông tin kệ đã chọn
  const refreshSelectedShelf = useCallback(async () => {
    if (!selectedShelf) return;

    try {
      const response = await inventoryAPI.getLayout();
      const updatedShelves = response.data;
      setShelves(updatedShelves);

      // Tìm và cập nhật kệ đã chọn
      const updatedSelectedShelf = updatedShelves.find(
        (s) => s._id === selectedShelf._id
      );

      if (updatedSelectedShelf) {
        setSelectedShelf(updatedSelectedShelf);
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật thông tin kệ:", err);
      setError(err.response?.data?.message || "Không thể cập nhật thông tin kệ");
    }
  }, [selectedShelf]);

  // Nhập hàng vào kệ
  const importToShelf = useCallback(async (data) => {
    try {
      setLoading(true);
      setError("");
      
      await inventoryAPI.addProductToShelf(data);
      
      // Cập nhật dữ liệu sau khi nhập hàng
      await loadWarehouseData();
      await refreshSelectedShelf();
      
      setSuccess("Nhập hàng thành công");
      return true;
    } catch (err) {
      console.error("Lỗi khi nhập hàng:", err);
      setError(err.response?.data?.message || "Lỗi khi nhập hàng");
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadWarehouseData, refreshSelectedShelf]);

  // Xuất hàng từ kệ
  const exportFromShelf = useCallback(async (data) => {
    try {
      setLoading(true);
      setError("");
      
      await inventoryAPI.removeProductFromShelf(data);
      
      // Cập nhật dữ liệu sau khi xuất hàng
      await loadWarehouseData();
      await refreshSelectedShelf();
      
      setSuccess("Xuất hàng thành công");
      return true;
    } catch (err) {
      console.error("Lỗi khi xuất hàng:", err);
      setError(err.response?.data?.message || "Lỗi khi xuất hàng");
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadWarehouseData, refreshSelectedShelf]);

  // Tìm kệ tối ưu cho sản phẩm
  const findOptimalShelves = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError("");
      
      // Lấy thông tin sản phẩm
      const product = products.find((p) => p._id === productId);
      if (!product) {
        setError("Không tìm thấy sản phẩm");
        return [];
      }

      // Tải dữ liệu kho mới nhất
      await loadWarehouseData();

      // Tìm các kệ phù hợp với loại sản phẩm và còn trống
      const compatibleShelves = shelves.filter(
        (shelf) =>
          shelf.categoryId === product.categoryId ||
          shelf.category?._id === product.categoryId
      );

      // Sắp xếp kệ theo thứ tự ưu tiên
      const optimized = compatibleShelves
        .map((shelf) => {
          // Kiểm tra xem kệ đã có sản phẩm này chưa
          const hasProduct =
            shelf.products &&
            shelf.products.some(
              (p) =>
                p.productId === productId ||
                (p.productId && p.productId.toString() === productId)
            );

          // Tính % chỗ trống còn lại
          const spaceLeft = shelf.maxQuantitative - shelf.currentQuantitative;
          const spacePercentage = (spaceLeft / shelf.maxQuantitative) * 100;

          return {
            ...shelf,
            hasProduct,
            spaceLeft,
            spacePercentage,
          };
        })
        .filter((shelf) => shelf.spaceLeft > 0 && shelf.status === "active")
        .sort((a, b) => {
          // Ưu tiên kệ đã có sản phẩm
          if (a.hasProduct && !b.hasProduct) return -1;
          if (!a.hasProduct && b.hasProduct) return 1;

          // Nếu cùng trạng thái về sản phẩm, ưu tiên kệ còn nhiều chỗ trống
          return b.spaceLeft - a.spaceLeft;
        })
        .slice(0, 3); // Lấy 3 kệ tốt nhất

      setOptimizedShelves(optimized);

      if (optimized.length === 0) {
        setError("Không tìm thấy kệ phù hợp cho sản phẩm này");
      } else {
        setSuccess(
          `Đã tìm thấy ${optimized.length} kệ phù hợp (được đánh dấu màu xanh)`
        );
      }

      return optimized;
    } catch (err) {
      console.error("Lỗi khi tìm kệ tối ưu:", err);
      setError("Lỗi khi tìm kệ tối ưu");
      return [];
    } finally {
      setLoading(false);
    }
  }, [products, shelves, loadWarehouseData]);

  // Tạo kệ mới
  const createShelf = useCallback(async (data) => {
    try {
      setLoading(true);
      setError("");
      
      const response = await inventoryAPI.createShelf(data);
      
      // Cập nhật danh sách kệ
      await loadWarehouseData();
      
      setSuccess("Tạo kệ thành công");
      return response.data;
    } catch (err) {
      console.error("Lỗi khi tạo kệ:", err);
      setError(err.response?.data?.message || "Lỗi khi tạo kệ");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadWarehouseData]);

  // Cập nhật kệ
  const updateShelf = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError("");
      
      const response = await inventoryAPI.updateShelf(id, data);
      
      // Cập nhật danh sách kệ
      await loadWarehouseData();
      
      setSuccess("Cập nhật kệ thành công");
      return response.data;
    } catch (err) {
      console.error("Lỗi khi cập nhật kệ:", err);
      setError(err.response?.data?.message || "Lỗi khi cập nhật kệ");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadWarehouseData]);

  // Xóa kệ
  const deleteShelf = useCallback(async (id) => {
    try {
      setLoading(true);
      setError("");
      
      await inventoryAPI.deleteShelf(id);
      
      // Cập nhật danh sách kệ
      await loadWarehouseData();
      
      setSuccess("Xóa kệ thành công");
      return true;
    } catch (err) {
      console.error("Lỗi khi xóa kệ:", err);
      setError(err.response?.data?.message || "Lỗi khi xóa kệ");
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadWarehouseData]);

  // Lấy thống kê kho
  const getWarehouseStats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await inventoryAPI.getWarehouseStats();
      setWarehouseStats(response.data);
      
      return response.data;
    } catch (err) {
      console.error("Lỗi khi lấy thống kê kho:", err);
      setError(err.response?.data?.message || "Lỗi khi lấy thống kê kho");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Tìm kiếm sản phẩm trong kho
  const searchProductsInWarehouse = useCallback(async (query) => {
    try {
      setLoading(true);
      setError("");
      
      const response = await inventoryAPI.searchProductsInWarehouse(query);
      
      return response.data;
    } catch (err) {
      console.error("Lỗi khi tìm kiếm sản phẩm:", err);
      setError(err.response?.data?.message || "Lỗi khi tìm kiếm sản phẩm");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy danh sách warehouse
  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await warehouseAPI.getAllWarehouses();
      setWarehouses(response.data || []);
      
      return response.data || [];
    } catch (err) {
      console.error("Lỗi khi lấy danh sách warehouse:", err);
      setError(err.response?.data?.message || "Đã xảy ra lỗi khi tải danh sách warehouse");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Tạo warehouse mới
  const createWarehouse = useCallback(async (data) => {
    try {
      setLoading(true);
      setError("");
      
      await warehouseAPI.createWarehouse(data);
      
      // Cập nhật danh sách warehouse
      await fetchWarehouses();
      
      setSuccess("Tạo warehouse thành công");
      return true;
    } catch (err) {
      console.error("Lỗi khi tạo warehouse:", err);
      setError(err.response?.data?.message || "Lỗi khi tạo warehouse");
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchWarehouses]);

  // Cập nhật warehouse
  const updateWarehouse = useCallback(async (data) => {
    try {
      setLoading(true);
      setError("");
      
      await warehouseAPI.updateWarehouse(data);
      
      // Cập nhật danh sách warehouse
      await fetchWarehouses();
      
      setSuccess("Cập nhật warehouse thành công");
      return true;
    } catch (err) {
      console.error("Lỗi khi cập nhật warehouse:", err);
      setError(err.response?.data?.message || "Lỗi khi cập nhật warehouse");
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchWarehouses]);

  // Lấy chi tiết warehouse
  const getWarehouseDetails = useCallback(async (warehouseId) => {
    try {
      setLoading(true);
      setError("");
      
      const response = await warehouseAPI.getWarehouseDetails(warehouseId);
      
      return response.data;
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết warehouse:", err);
      setError(err.response?.data?.message || "Không thể lấy chi tiết warehouse");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Xóa thông báo
  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  // Tính toán sử dụng kệ
  const calculateShelfUsage = useCallback((shelf) => {
    if (!shelf) return 0;
    return Math.round((shelf.currentQuantitative / shelf.maxQuantitative) * 100);
  }, []);

  // Lấy màu sắc kệ dựa trên mức sử dụng
  const getShelfColor = useCallback((shelf) => {
    if (!shelf || shelf.status !== "active") return "secondary";
    
    const usageRate = calculateShelfUsage(shelf);
    if (usageRate >= 90) return "danger";
    if (usageRate >= 70) return "warning";
    return "primary";
  }, [calculateShelfUsage]);

  return {
    // State
    shelves,
    selectedShelf,
    products,
    warehouses,
    loading,
    error,
    success,
    optimizedShelves,
    warehouseStats,
    
    // Actions
    loadWarehouseData,
    getShelfById,
    refreshSelectedShelf,
    importToShelf,
    exportFromShelf,
    findOptimalShelves,
    createShelf,
    updateShelf,
    deleteShelf,
    getWarehouseStats,
    searchProductsInWarehouse,
    clearMessages,
    
    // Warehouse management
    fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    getWarehouseDetails,
    
    // Utilities
    calculateShelfUsage,
    getShelfColor,
    
    // Setters
    setSelectedShelf,
    setOptimizedShelves,
  };
};

export default useWarehouse;
