import { useState, useEffect } from "react";
import pqApi from "../API/pqAPI";
import prfqApi from "../API/prfqAPI";

export default function usePQ() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openCreatePoDialog, setOpenCreatePoDialog] = useState(false);
  const [quotationToCreatePo, setQuotationToCreatePo] = useState(null);
  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await pqApi.getAllWithStatus();

      const list = Array.isArray(res?.data?.data)
        ? res.data.data.map((item) => ({
            quotationId: item.qid,
            sentDate: item.sendDate,
            supplierName: item.supplierName,
            status: item.status === 0 ? "InDate" : "OutOfDate",
            expiredDate: item.quotationExpiredDate,
            items: Array.isArray(item.quotationDetailDTOs)
              ? item.quotationDetailDTOs
              : [],
          }))
        : [];

      setQuotations(list);

      // Nếu API trả 404 và message "Không có báo giá nào trong hệ thống", set list rỗng, không show lỗi
    } catch (err) {
      if (err?.response?.status !== 404) {
        const msg = err?.response?.data?.message || "Đã có lỗi xảy ra";

        setSnackbar({
          open: true,
          message: msg,
          severity: "error",
        });
      } else {
        setQuotations([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Xem chi tiết PQ
  const openDetail = async (id) => {
    try {
      const res = await pqApi.getDetail(id);
      const q = res.data?.data;

      setSelectedQuotation({
        quotationId: q.qid,
        supplierName: q.supplierName || "(Chưa có tên NCC)",
        sentDate: q.sendDate,
        expiredDate: q.quotationExpiredDate,
        status: q.status === 0 ? "InDate" : "OutOfDate",
        items: q.quotationDetailDTOs || [],
      });

      setOpenDetailDialog(true);
    } catch (error) {
      console.error("❌ Lỗi khi lấy chi tiết PQ:", error);
      setSnackbar({
        open: true,
        message: "Lỗi tải chi tiết PQ",
        severity: "error",
      });
    }
  };

  // 🔹 Mở dialog tạo PO
  const openCreatePO = async (qid) => {
    try {
      const res = await prfqApi.preview2(qid);
      const list = res.data?.data;

      if (!Array.isArray(list)) {
        throw new Error("Dữ liệu preview2 không hợp lệ");
      }

      // Map lại cho UI PO:
      const itemsWithQty = list.map((item) => ({
        productID: item.productID,
        productName: item.productName,
        productDescription: item.description,
        productUnit: item.dvt,
        unitPrice: item.unitPrice,
        expiredDate: item.expiredDateDisplay,
        productDate: item.expiredDateDisplay,
        currentQty: item.currentQuantity,
        minQty: item.minQuantity,
        tax: item.tax,
        maxQty: item.maxQuantity,
        suggestedQty: item.suggestedQuantity,
        quantity: item.suggestedQuantity || 1,
      }));

      setQuotationToCreatePo({
        quotationId: qid,
        items: itemsWithQty,
      });

      setOpenCreatePoDialog(true);
    } catch (err) {
      console.error("❌ Lỗi mở dialog PO:", err);
      setSnackbar({
        open: true,
        message: "Không lấy được dữ liệu Preview2",
        severity: "error",
      });
    }
  };

  const createPO = async (status) => {
    if (!quotationToCreatePo || sending) return;

    setSending(true);

    // Convert date sang ISO 8601
    const payload = {
      qid: Number(quotationToCreatePo.quotationId),
      details: quotationToCreatePo.items.map((item) => {
        let dateISO = null;
        if (item.productDate) {
          // Nếu productDate ở dạng dd/MM/yyyy
          const parts = item.productDate.split("/");
          if (parts.length === 3) {
            const [day, month, year] = parts;
            dateISO = new Date(`${year}-${month}-${day}`).toISOString();
          } else {
            // Nếu đã là Date object hoặc ISO string
            dateISO = new Date(item.productDate).toISOString();
          }
        }

        return {
          productID: Number(item.productID),
          date: dateISO,
          quantity: Number(item.quantity),
        };
      }),
      status: Number(status),
    };

    console.log("Payload trước khi gửi:", payload);

    try {
      await prfqApi.createFromQuotation(payload);
      setSnackbar({
        open: true,
        message:
          status === 6 ? "Gửi yêu cầu thành công!" : "Tạo bản nháp thành công!",
        severity: "success",
      });
      setOpenCreatePoDialog(false);
    } catch (err) {
      console.error("❌ Lỗi tạo PO:", err.response?.data || err);
      setSnackbar({
        open: true,
        message:
          status === 6 ? "Gửi yêu cầu thất bại" : "Tạo bản nháp thất bại",
        severity: "error",
      });
    } finally {
      setSending(false);
    }
  };

  // 🔹 Chỉnh sửa số lượng
  const changeQuantity = (index, value) => {
    setQuotationToCreatePo((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], quantity: Number(value) };
      return { ...prev, items };
    });
  };

  // 🔹 Xóa sản phẩm
  const removeItem = (index) => {
    setQuotationToCreatePo((prev) => {
      const items = [...prev.items];
      items.splice(index, 1);
      return { ...prev, items };
    });
  };

  return {
    quotations,
    loading,
    selectedQuotation,
    openDetailDialog,
    openCreatePoDialog,
    quotationToCreatePo,
    sending,
    snackbar,
    setSnackbar,
    setOpenDetailDialog,
    setOpenCreatePoDialog,
    openDetail,
    openCreatePO,
    createPO,
    changeQuantity,
    removeItem,
    loadData,
  };
}
