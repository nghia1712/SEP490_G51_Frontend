import { useState, useEffect } from "react";
import { Chip } from "@mui/material";
import customerDebtApi from "../API/customerDebtAPI";

// =========================
// MAP STATUS
// =========================
export const debtStatusMap = {
  0: { label: "Chưa trả nợ", color: "error" },
  1: { label: "Trả một phần", color: "warning" },
  2: { label: "Hết nợ", color: "success" },
  3: { label: "Nợ xấu", color: "default" },
  4: { label: "Quá hạn", color: "error" },
  5: { label: "Đơn bị hủy", color: "default" },
};

// chỉ lấy label
export const mapDebtStatus = (status) =>
  debtStatusMap[status]?.label || "Không xác định";

// render chip đẹp
export const renderDebtStatus = (status) => {
  const s = debtStatusMap[status] || {
    label: "Không xác định",
    color: "default",
  };

  return <Chip size="small" label={s.label} color={s.color} />;
};

// =========================
// HOOK CHÍNH
// =========================
export default function useCustomerDebt() {
  // ======== List ========
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ======== Filter theo năm ========
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthData, setMonthData] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // ======== Snackbar ========
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSnackClose = () =>
    setSnack((prev) => ({ ...prev, open: false }));

  // =========================
  // FETCH LIST
  // =========================
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await customerDebtApi.getAll();

      setData(res.data?.data || []);

      // Message từ backend
      setSnack({
        open: true,
        message: res.data?.message || "Lấy danh sách thành công",
        severity: "success",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Lấy danh sách nợ thất bại";

      setError(err);
      setSnack({
        open: true,
        message: msg,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH BY MONTH
  // =========================
  const fetchByMonth = async (selectedYear = year) => {
    setDetailLoading(true);
    try {
      const res = await customerDebtApi.getByMonth(selectedYear);

      setMonthData(res.data?.data || []);

      setSnack({
        open: true,
        message: res.data?.message || "Lấy dữ liệu theo tháng thành công",
        severity: "success",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Lấy dữ liệu theo tháng thất bại";

      setSnack({
        open: true,
        message: msg,
        severity: "error",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // khởi tạo
  useEffect(() => {
    fetchList();
  }, []);

  return {
    // list
    data,
    loading,
    error,
    refetch: fetchList,

    // filter theo năm
    year,
    setYear,
    monthData,
    fetchByMonth,
    detailLoading,

    // map status export
    mapDebtStatus,
    renderDebtStatus,

    // snackbar
    snack,
    setSnack,
    handleSnackClose,
  };
}
