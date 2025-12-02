// src/hooks/usePO.jsx
import { useState, useEffect, useMemo } from "react";
import poApi from "../API/poAPI";
import prfqApi from "../API/prfqAPI";

export const statusMap = {
  0: { label: "Chấp thuận", color: "success" },
  1: { label: "Từ chối", color: "error" },
  3: { label: "Đã đặt cọc", color: "info" },
  4: { label: "Thanh toán một phần", color: "primary" },
  5: { label: "Hoàn thành", color: "secondary" },
  6: { label: "Chờ xử lý", color: "warning" },
  7: { label: "Nháp", color: "default" },
};

export const parseDDMMYYYY = (str) => {
  if (!str) return null;
  const [day, month, year] = str.split("/");
  return new Date(`${year}-${month}-${day}`);
};

export default function usePO() {
  // ================== PO LIST & LOADING ==================
  const [poList, setPoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // ================== MODAL STATE ==================
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  const [openUpload, setOpenUpload] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [depositOpen, setDepositOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // ================== EXCEL UPLOAD ==================
  const [excelFile, setExcelFile] = useState(null);
  const [uploadedProducts, setUploadedProducts] = useState([]);
  const [excelKey, setExcelKey] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  // ================== OTHER STATE ==================
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [editData, setEditData] = useState([]);
  const [fullyReceivedPOs, setFullyReceivedPOs] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [deletePOId, setDeletePOId] = useState(null);

  // ================== SECRET BUSINESS INFO ==================
  const [secretInfo, setSecretInfo] = useState(null);
  const [secretLoading, setSecretLoading] = useState(false);

  // ================== EFFECTS ==================
  useEffect(() => {
    fetchPOs();
  }, []);

  // ================== API FUNCTIONS ==================

  const fetchPharmacySecretInfo = async () => {
    setSecretLoading(true);
    try {
      const res = await poApi.getPharmacySecretInfo();
      setSecretInfo(res?.data?.data?.[0] || null);
    } catch (err) {
      console.error("❌ Lỗi lấy thông tin kinh doanh:", err);

      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Lấy thông tin kinh doanh thất bại";

      setSnackbar({
        open: true,
        message: apiMsg,
        severity: "error",
      });
    } finally {
      setSecretLoading(false);
    }
  };

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const res = await poApi.getAllPO();
      const poData = res?.data?.data || [];

      if (!poData.length) {
        console.warn("❗ Không có dữ liệu PO từ getAllPO");
        setPoList([]);
        return;
      }

      const statusRes = await poApi.getByReceivingStatus();
      const statusData = statusRes?.data?.data || {};
      const fullyIds = (statusData.FullyReceived || []).map((p) =>
        Number(p.poid)
      );
      const partialIds = (statusData.PartiallyReceived || []).map((p) =>
        Number(p.poid)
      );
      const notIds = (statusData.NotReceived || []).map((p) => Number(p.poid));

      const mappedPOs = poData.map((po) => {
        const poidNum = Number(po.poid);
        if (po.status === 6 || po.status === 7)
          return { ...po, receivingStatus: "Chờ xác nhận" };
        let receivingStatus = "Chưa nhận";
        if (fullyIds.includes(poidNum)) receivingStatus = "Đã nhận đủ";
        else if (partialIds.includes(poidNum))
          receivingStatus = "Nhận một phần";
        else if (notIds.includes(poidNum)) receivingStatus = "Chưa nhận";
        let debt = po.debt ?? 0;
        if (Number(po.status) === 0) debt = po.total ?? debt;

        return { ...po, receivingStatus, debt };
      });

      setPoList(mappedPOs);
      setFullyReceivedPOs(fullyIds);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách PO:", err);
      setSnackbar({
        open: true,
        message: "Lấy PO thất bại",
        severity: "error",
      });
      setPoList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPODetail = async (poId) => {
    if (!poId) return;
    try {
      const res = await poApi.getDetail(poId);
      let po = res.data?.data || null;
      if (po) {
        if (Number(po.status) === 0) {
          po.debt = po.total;
        }
      }
      setSelectedPO(po);
    } catch (err) {
      console.error("❌ Lỗi khi lấy chi tiết PO:", err);
      setSnackbar({
        open: true,
        message: "Lấy chi tiết PO thất bại",
        severity: "error",
      });
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await poApi.getDetail(id);
      const po = res.data?.data;
      if (po && Number(po.status) === 0) po.debt = po.total;
      setSelectedPO(po);

      setOpenDetail(true);
    } catch (err) {
      console.error("❌ Lỗi khi lấy chi tiết PO:", err);
      setSnackbar({
        open: true,
        message: "Lấy chi tiết PO thất bại",
        severity: "error",
      });
    }
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setSelectedPO(null);
  };

  // ================== EXCEL ==================
  const handleOpenUpload = () => setOpenUpload(true);
  const handleCloseUpload = () => {
    setOpenUpload(false);
    setExcelFile(null);
  };
  const handleUploadExcel = async () => {
    if (!excelFile) {
      setSnackbar({
        open: true,
        message: "Vui lòng chọn file Excel",
        severity: "warning",
      });
      return;
    }
    setUploading(true);
    try {
      const res = await prfqApi.uploadSupplierExcel(excelFile);
      const { excelKey, products } = res.data || {};
      if (!excelKey || !products)
        throw new Error("Server phản hồi không hợp lệ");
      setExcelKey(excelKey);
      setUploadedProducts(products);
      setPreviewOpen(true);
    } catch (err) {
      console.error("Upload error:", err);
      setSnackbar({
        open: true,
        message: "Tải lên thất bại",
        severity: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleConvertExcel = async () => {
    if (sending) return;
    const invalidItem = uploadedProducts.find(
      (p) => p.quantity === "" || p.quantity === undefined || p.quantity < 1
    );
    if (invalidItem) {
      setSnackbar({
        open: true,
        message: `Sản phẩm "${invalidItem.productName}" có số lượng không hợp lệ`,
        severity: "error",
      });
      return;
    }
    const details = uploadedProducts.map((p) => ({
      stt: p.STT ?? p.stt,
      quantity: Number(p.quantity),
    }));
    setSending(true);
    try {
      await prfqApi.convertToPo({ excelKey, details, status: 6 });
      setSnackbar({
        open: true,
        message: "Tạo PO thành công!",
        severity: "success",
      });
      setPreviewOpen(false);
      setExcelFile(null);
      setUploadedProducts([]);
      setExcelKey(null);
      setOpenUpload(false);
      fetchPOs();
    } catch (err) {
      console.error(err);

      const apiMsg = err?.response?.data?.message || err?.message;

      setSnackbar({
        open: true,
        message: apiMsg,
        severity: "error",
      });
    } finally {
      setSending(false);
    }
  };

  // ================== PO ACTIONS ==================
  const handleDepositPO = async (id, amount) => {
    if (!amount || amount <= 0) return;
    setLoading(true);
    try {
      await poApi.deposit(id, { paid: Number(amount) });
      setSnackbar({
        open: true,
        message: "Ghi nhận đặt cọc thành công",
        severity: "success",
      });
      fetchPOs();
      if (selectedPO?.poid === id) handleOpenDetail(id);
    } catch (err) {
      console.error(err);

      const apiMsg =
        err?.response?.data?.message || err?.message || "Tạo GRN thất bại";

      setSnackbar({
        open: true,
        message: apiMsg,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayPO = async (id, amount) => {
    if (!amount || amount <= 0) return;
    setLoading(true);
    try {
      await poApi.payDebt(id, { paid: Number(amount) });
      setSnackbar({
        open: true,
        message: "Thanh toán thành công",
        severity: "success",
      });
      fetchPOs();
      if (selectedPO?.poid === id) handleOpenDetail(id);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Thanh toán thất bại",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (id, newStatus) => {
    setLoading(true);
    try {
      await poApi.changeStatus(id, newStatus);
      setSnackbar({
        open: true,
        message: "Cập nhật trạng thái thành công",
        severity: "success",
      });
      if (selectedPO?.poid === id) handleOpenDetail(id);
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message || "Cập nhật trạng thái thất bại";
      setSnackbar({
        open: true,
        message: apiMsg,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraftPO = async (id) => {
    setLoading(true);
    try {
      await poApi.deleteDraftPO(id);
      setSnackbar({
        open: true,
        message: `Xóa PO-${id} thành công`,
        severity: "success",
      });
      if (selectedPO?.poid === id) handleCloseDetail();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Xóa PO-${id} thất bại`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (id) => {
    try {
      const res = await poApi.exportPaymentPdf(id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `PO-${id}.pdf`;
      link.click();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Xuất PDF thất bại",
        severity: "error",
      });
    }
  };

  const handleApprovePO = async (id) => handleChangeStatus(id, 0);
  const handleRejectPO = async (id) => handleChangeStatus(id, 1);

  const handleUpdatePODraft = async (id, status) => {
    try {
      const payload = {
        qid: id,
        status,
        details: editData.map((item) => ({
          productID: item.productID,
          date: item.expiredDate,
          quantity: Number(item.quantity),
        })),
      };

      setSending(true);
      await prfqApi.updateDraftPO(id, payload);

      if (selectedPO?.poid === id) {
        setSelectedPO((prev) => (prev ? { ...prev, status } : prev));
      }

      setEditData([]);
      setEditOpen(false);
      setSnackbar({
        open: true,
        message:
          status === 6 ? "Gửi yêu cầu thành công" : "Lưu nháp thành công",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Cập nhật thất bại",
        severity: "error",
      });
    } finally {
      setSending(false);
    }
  };

  // ================== PO BY YEAR ==================
  const [poByYear, setPoByYear] = useState([]);
  const [poByYearLoading, setPoByYearLoading] = useState(false);
  const fetchPOByYear = async (year) => {
    setPoByYearLoading(true);
    try {
      const res = await poApi.getDetailsByYear(year);
      const data = res?.data?.data || [];
      setPoByYear(data);
       return data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy PO theo năm:", err);

      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Lấy PO theo năm thất bại";

      setSnackbar({
        open: true,
        message: apiMsg,
        severity: "error",
      });
    } finally {
      setPoByYearLoading(false);
    }
  };

  // ================== FILTER ==================
  const filteredPOs = useMemo(() => {
    if (!search) return poList;
    return poList.filter(
      (po) =>
        po.userName.toLowerCase().includes(search.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        `PO-${po.poid}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, poList]);
  // ================== DEBT REPORT ==================
  const [debtList, setDebtList] = useState([]);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [debtLoading, setDebtLoading] = useState(false);

  const fetchDebtReport = async () => {
    setDebtLoading(true);
    try {
      const res = await poApi.getAllDebtReport();
      const data = res?.data?.data || [];
      setDebtList(data);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách công nợ:", err);
      setSnackbar({
        open: true,
        message: "Lấy danh sách công nợ thất bại",
        severity: "error",
      });
    } finally {
      setDebtLoading(false);
    }
  };

  const fetchDebtDetail = async (dbid) => {
    if (!dbid) return;
    setDebtLoading(true);
    try {
      const res = await poApi.getDetailDebtReport(dbid);
      setSelectedDebt(res.data?.data || null);
    } catch (err) {
      console.error("❌ Lỗi khi lấy chi tiết công nợ:", err);
      setSnackbar({
        open: true,
        message: "Lấy chi tiết công nợ thất bại",
        severity: "error",
      });
    } finally {
      setDebtLoading(false);
    }
  };

  // ================== RETURN ==================
  return {
    poList,
    filteredPOs,
    loading,
    search,
    setSearch,
    openDetail,
    selectedPO,
    handleOpenDetail,
    handleCloseDetail,
    openUpload,
    handleOpenUpload,
    handleCloseUpload,
    excelFile,
    setExcelFile,
    uploadedProducts,
    setUploadedProducts,
    previewOpen,
    setPreviewOpen,
    handleUploadExcel,
    handleConvertExcel,
    uploading,
    sending,
    snackbar,
    setSnackbar,
    depositOpen,
    setDepositOpen,
    payOpen,
    setPayOpen,
    editOpen,
    setEditOpen,
    editData,
    setEditData,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    deletePOId,
    setDeletePOId,
    fullyReceivedPOs,
    userRole,
    setUserRole,
    fetchPOs,
    handleDepositPO,
    handlePayPO,
    handleChangeStatus,
    handleDeleteDraftPO,
    handleExportPDF,
    handleApprovePO,
    handleRejectPO,
    handleUpdatePODraft,
    statusMap,
    parseDDMMYYYY,
    fetchPODetail,
    debtList,
    selectedDebt,
    debtLoading,
    fetchDebtReport,
    fetchDebtDetail,
    secretInfo,
    secretLoading,
    fetchPharmacySecretInfo,
    poByYear,
    poByYearLoading,
    fetchPOByYear,
  };
}
