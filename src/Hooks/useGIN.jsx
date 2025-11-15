import { useState, useEffect } from "react";
import ginApi from "../API/ginAPI";

export const mapGINStatus = (status) => {
  switch (status) {
    case 0:
      return "Nháp";
    case 1:
      return "Đã gửi";
    default:
      return "Không xác định";
  }
};

export default function useGIN(id = null) {
  const [data, setData] = useState(id ? null : []);
  const [loading, setLoading] = useState(id ? true : false);
  const [error, setError] = useState(null);

  // Snackbar state
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSnackClose = () => {
    setSnack({ ...snack, open: false });
  };

  // =========================
  // GET LIST
  // =========================
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await ginApi.getAll();
      setList(res.data || []);
    } catch (err) {
      setError(err);
      setSnack({
        open: true,
        message: "Lấy danh sách thất bại",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await ginApi.getDetail(id);
      setData(res.data || null);
    } catch (err) {
      setError(err);
      setSnack({
        open: true,
        message: "Lấy chi tiết thất bại",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
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
    refetch();
    return { success: true, data: res.data };
  } catch (err) {
    const message =
      err?.response?.data?.message || "Tạo phiếu xuất kho thất bại";
    setSnack({
      open: true,
      message,
      severity: "error",
    });
    return { success: false, error: err, message };
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
      refetch();
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

  useEffect(() => {
    if (id) fetchDetail();
    else fetchList();
  }, [id]);

  return {
    data,
    loading,
    error,
    refetch: id ? fetchDetail : fetchList,

    // CRUD
    createGIN,
    sendGIN,

    // Snackbar
    snack,
    handleSnackClose,
  };
}
