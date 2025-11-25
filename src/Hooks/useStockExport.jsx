import { useState, useEffect } from "react";
import stockExportApi from "../API/stockExportAPI";

export const mapStockExportStatus = (status) => {
  switch (status) {
    case 0:
      return "Nháp";
    case 1:
      return "Chờ xử lý";
    case 2:
      return "Đã xuất kho";
    case 3:
      return "Quá hạn";
    default:
      return "Không xác định";
  }
};

export default function useStockExport(id = null) {
  const [data, setData] = useState(id ? null : []);
  const [loading, setLoading] = useState(id ? true : false);
  const [error, setError] = useState(null);

  // =========================
  // GET LIST
  // =========================
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await stockExportApi.list();
      setData(res.data?.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GET DETAIL
  // =========================
  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await stockExportApi.details(id);
      setData(res.data?.data || null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CREATE
  // =========================
  const createOrder = async (payload) => {
    try {
      const res = await stockExportApi.create(payload);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  // =========================
  // UPDATE
  // =========================
  const updateOrder = async (payload) => {
    try {
      const res = await stockExportApi.update(payload);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  // =========================
  // SEND
  // =========================
  const sendOrder = async (seoId) => {
    try {
      const res = await stockExportApi.send(seoId);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  // =========================
  // DELETE
  // =========================
  const deleteOrder = async (seoId) => {
    try {
      const res = await stockExportApi.delete(seoId);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  // =========================
  // AUTO FETCH
  // =========================
  useEffect(() => {
    if (id) fetchDetail();
    else fetchList();
  }, [id]);

  // =========================
  
  // =========================
  const getOrderInfor = async (orderId) => {
    try {
      const res = await stockExportApi.getOrderInfor(orderId);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  return {
    data,
    loading,
    error,
    refetch: id ? fetchDetail : fetchList,

    // CRUD
    createOrder,
    updateOrder,
    deleteOrder,
    sendOrder,
    getOrderInfor,
  };
}
