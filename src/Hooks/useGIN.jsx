import { useState, useEffect } from "react";
import { Chip } from "@mui/material";
import ginApi from "../API/ginAPI";

// ==== map trạng thái ====
const ginStatusMap = {
  0: { label: "Nháp", color: "default" },
  1: { label: "Chờ xử lý", color: "info" },
  2: { label: "Đã xuất kho", color: "success" },
};

// chỉ lấy label
export const mapGINStatus = (status) =>
  ginStatusMap[status]?.label || "Không xác định";

// render Chip màu
export const renderGINStatus = (status) => {
  const s = ginStatusMap[status] || {
    label: "Không xác định",
    color: "default",
  };
  return <Chip label={s.label} color={s.color} size="small" />;
};

export default function useGIN() {
  // ======== List ========
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // ======== Detail ========
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedExport, setSelectedExport] = useState(null);
  const [detailItems, setDetailItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // ======== Snackbar ========
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSnackClose = () => setSnack({ ...snack, open: false });

  // =========================
  // FETCH LIST
  // =========================
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await ginApi.getAll();
      setData(res.data?.data || []);
    } catch (err) {
      setError(err);
      setSnack({
        open: true,
        message: err?.response?.data?.message || "Lấy danh sách thất bại",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH DETAIL
  // =========================
  const fetchDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await ginApi.getDetail(id);
      const detail = res.data?.data;
      setSelectedExport(detail);
      setDetailItems(detail.details || []);
      setOpenDetail(true);
    } catch (err) {
      setSnack({
        open: true,
        message: "Lấy chi tiết thất bại",
        severity: "error",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetail = (row) => {
    if (!row?.id) return;
    fetchDetail(row.id);
  };

  // =========================
  // CREATE
  // =========================
  const createGIN = async (payload) => {
    try {
      const res = await ginApi.create(payload);
      setSnack({
        open: true,
        message: "Tạo phiếu xuất kho thành công",
        severity: "success",
      });
      fetchList();
      return { success: true, data: res.data };
    } catch (err) {
      setSnack({
        open: true,
        message: err?.response?.data?.message || "Tạo phiếu xuất kho thất bại",
        severity: "error",
      });
      return { success: false, error: err };
    }
  };

  // =========================
  // SEND
  // =========================
  const sendGIN = async (ginId) => {
    try {
      const res = await ginApi.send(ginId);
      setSnack({
        open: true,
        message: "Gửi phiếu xuất kho thành công",
        severity: "success",
      });
      fetchList();
      return { success: true, data: res.data };
    } catch (err) {
      setSnack({
        open: true,
        message: "Gửi phiếu xuất kho thất bại",
        severity: "error",
      });
      return { success: false, error: err };
    }
  };


  // =========================
  // NOT ENOUGH
  // =========================
  const notEnoughGIN = async (stockExportOrder) => {
    try {
      const res = await ginApi.notEnough(stockExportOrder);
      return {
        success: true,
        message: res.data?.message || "Báo kho không đủ hàng thành công",
        data: res.data,
      };
    } catch (err) {
      return {
        success: false,
        message:
          err?.response?.data?.message || "Báo kho không đủ hàng thất bại",
        error: err,
      };
    }
  };

  // =========================
  // EXPORTED LOT PRODUCT
  // =========================
  const exportedLotProduct = async (ginId) => {
    try {
      const res = await ginApi.exportedLotProduct(ginId);

      setSnack({
        open: true,
        message: res.data?.message || "Xuất lô sản phẩm thành công",
        severity: "success",
      });

      fetchList();

      return {
        success: true,
        message: res.data?.message,
        data: res.data,
      };
    } catch (err) {
      setSnack({
        open: true,
        message: err?.response?.data?.message || "Xuất lô sản phẩm thất bại",
        severity: "error",
      });

      return {
        success: false,
        error: err,
        message: err?.response?.data?.message || "Xuất lô sản phẩm thất bại",
      };
    }
  };

  // =========================
  // STATISTICS
  // =========================
  const [exportedStats, setExportedStats] = useState([]);
  const [notExportedStats, setNotExportedStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchExportedStats = async () => {
    setStatsLoading(true);
    try {
      const res = await ginApi.exportedStatistic();
      setExportedStats(res.data?.data?.monthlyData || []);
    } catch (err) {
      setSnack({
        open: true,
        message: err?.response?.message || "Lấy thống kê xuất kho thất bại",
        severity: "error",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchNotExportedStats = async () => {
    setStatsLoading(true);
    try {
      const res = await ginApi.notExportedStatistic();
      setNotExportedStats(res.data?.data || {});
    } catch (err) {
      setSnack({
        open: true,
        message:
          err?.response?.data?.message || "Lấy thống kê chưa xuất kho thất bại",
        severity: "error",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    search,
    setSearch,
    refetch: fetchList,
    renderGINStatus,

    openDetail,
    setOpenDetail,
    selectedExport,
    detailItems,
    detailLoading,
    handleViewDetail,

    createGIN,
    sendGIN,
    notEnoughGIN,
    exportedLotProduct,

    exportedStats,
    notExportedStats,
    fetchExportedStats,
    fetchNotExportedStats,

    setSnack,
    snack,
    handleSnackClose,
  };
}
