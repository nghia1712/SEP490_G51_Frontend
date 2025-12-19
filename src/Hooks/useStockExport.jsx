import { useState, useEffect } from "react";
import stockExportApi from "../API/stockExportAPI";
import salesOrderAPI from "../API/salesOrderAPI";
import { message } from "antd";

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
    case 4:
      return "Chờ hàng";
    case 5:
      return "Đã hủy";
    case 6:
      return "Sẵn sàng";
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

  // =========================
  // CANCEL SALES ORDER (NotComplete)
  // =========================
  const cancelSalesOrder = async (salesOrderId, rejectReason) => {
    try {
      const res = await salesOrderAPI.markNotComplete(
        salesOrderId,
        rejectReason
      );

      return {
        success: res?.data?.success ?? true,
        message: res?.data?.message,
        data: res?.data?.data,
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || "Hủy đơn hàng thất bại",
        error: err,
      };
    }
  };

  // =========================
  // AWAIT STOCK EXPORT (Sales Staff)
  // =========================
  const awaitStockExport = async (seoId) => {
    try {
      const res = await stockExportApi.awaitStockExport(seoId);
      return {
        success: true,
        message: res?.data?.message,
        data: res.data,
      };
    } catch (err) {
      return {
        success: false,
        message:
          err?.response?.data?.message || "Chuyển sang chờ xuất kho thất bại",
        error: err,
      };
    }
  };

  const cancelStockExport = async (seoId) => {
    try {
      const res = await stockExportApi.cancelStockExport(seoId);
      return {
        success: true,
        message: res?.data?.message,
        data: res.data,
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message,
        error: err,
      };
    }
  };

  const CheckSoWithSeoNotEnough = async (seoId) => {
    try {
      const res = await stockExportApi.CheckSoWithSeoNotEnough(seoId);
      return {
        success: true,
        message: res?.data?.message,
        data: res.data,
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message,
        error: err,
      };
    }
  };

  // =========================
  // CHECK READY TO EXPORT (Warehouse Staff)
  // =========================
  const checkReadyToExport = async (seoId) => {
    try {
      const res = await stockExportApi.checkReadyToExport(seoId);
      return {
        success: true,
        message: res?.data?.message,
        data: res.data,
      };
    } catch (err) {
      return {
        success: false,
        message:
          err?.response?.data?.message || "Kiểm tra sẵn sàng xuất kho thất bại",
        error: err,
      };
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

    cancelSalesOrder,
    awaitStockExport,
    checkReadyToExport,
    cancelStockExport,
    CheckSoWithSeoNotEnough,
  };
}
