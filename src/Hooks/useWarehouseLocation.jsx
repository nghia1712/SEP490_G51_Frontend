import { useState } from "react";
import warehouseLocationAPI from "../API/warehouseLocationAPI";

const useWarehouseLocation = () => {
  const [loading, setLoading] = useState(false);

  // ✅ Lấy danh sách vị trí
  const getAllLocations = async () => {
    try {
      setLoading(true);
      const res = await warehouseLocationAPI.getAll();
      return res?.data || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách vị trí kho:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ✅ Tạo mới
  const createWarehouseLocation = async (data) => {
    try {
      setLoading(true);
      const res = await warehouseLocationAPI.create(data);
      return res?.data?.success ?? true;
    } catch (error) {
      console.error("Lỗi khi tạo vị trí kho:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cập nhật
  const updateWarehouseLocation = async (data) => {
    try {
      setLoading(true);
      const res = await warehouseLocationAPI.update(data);
      return res?.data?.success ?? true;
    } catch (error) {
      console.error("Lỗi khi cập nhật vị trí kho:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Xóa
  const deleteWarehouseLocation = async (warehouseLocationId) => {
    try {
      setLoading(true);
      const res = await warehouseLocationAPI.delete(warehouseLocationId);
      return res?.data?.success ?? true;
    } catch (error) {
      console.error("Lỗi khi xóa vị trí kho:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getAllLocations,
    createWarehouseLocation,
    updateWarehouseLocation,
    deleteWarehouseLocation,
  };
};

export default useWarehouseLocation;
