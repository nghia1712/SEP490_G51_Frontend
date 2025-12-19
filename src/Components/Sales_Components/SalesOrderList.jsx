import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Container,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  TableSortLabel,
  Pagination,
  TextField,
  Stack,
  Card,
  CardContent,
  InputAdornment,
} from "@mui/material";
import ShoppingCart from "@mui/icons-material/ShoppingCart";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import useStockExport from "../../Hooks/useStockExport";
import salesOrderAPI from "../../API/salesOrderAPI";
import salesQuotationAPI from "../../API/salesQuotationAPI";

const headerTextSx = {
  textTransform: "capitalize",
  fontWeight: 600,
  letterSpacing: "0.03em",
};

const SalesOrderList = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const { cancelSalesOrder } = useStockExport();
  const [notCompleteReason, setNotCompleteReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  const canMarkNotComplete = (order) => {
    if (!order) return false;
    return [2, 4].includes(order.status);
  };
  const [notCompleteConfirm, setNotCompleteConfirm] = useState(false);
  const [marking, setMarking] = useState(false);

  const handleMarkNotComplete = async () => {
    if (!orderDetails?.id) return;

    if (!notCompleteReason.trim()) {
      setReasonError(true);
      return;
    }

    setMarking(true);
    try {
      const res = await cancelSalesOrder(orderDetails.id, notCompleteReason);

      if (res.success) {
        setSnackbarMessage("Đã xác nhận đơn hàng không hoàn thành");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        setNotCompleteConfirm(false);
        setNotCompleteReason("");
        setReasonError(false);

        handleCloseDetailDialog();
        fetchOrders();
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setSnackbarMessage(
        err?.message ||
          err?.response?.data?.message ||
          "Xác nhận không hoàn thành thất bại"
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setMarking(false);
    }
  };

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false); // Flag để tránh gọi nhiều lần

  const [error, setError] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  }); // Mặc định sort theo ngày tạo từ mới nhất đến cũ nhất

  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [searchOrderCode, setSearchOrderCode] = useState("");
  const [searchCustomerName, setSearchCustomerName] = useState("");

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const [detailLoading, setDetailLoading] = useState(false);

  const [detailError, setDetailError] = useState(null);

  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [orderDetails, setOrderDetails] = useState(null);

  const [page, setPage] = useState(1);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState(null);

  const pageSize = 5;

  const fetchOrders = useCallback(async (showLoading = true) => {
    // Tránh gọi nhiều lần cùng lúc
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    if (showLoading) {
      setLoading(true);
    }

    setError(null);

    try {
      console.log("SalesOrderList - Calling API...");
      const response = await salesOrderAPI.listSalesOrder();
      console.log("SalesOrderList - API response received:", response?.data);

      if (response.data && Array.isArray(response.data.data)) {
        // Debug: Log first order to see structure
        if (response.data.data.length > 0) {
          console.log(
            "SalesOrderList - First order from backend:",
            response.data.data[0]
          );
          console.log("SalesOrderList - PaymentStatus fields:", {
            PaymentStatus: response.data.data[0].PaymentStatus,
            paymentStatus: response.data.data[0].paymentStatus,
            PaymentStatusValue: response.data.data[0].PaymentStatusValue,
            paymentStatusValue: response.data.data[0].paymentStatusValue,
            PaymentStatusName: response.data.data[0].PaymentStatusName,
            paymentStatusName: response.data.data[0].paymentStatusName,
          });
        }

        const mappedOrders = response.data.data

          .map((order) => {
            // Lấy SalesOrderStatus từ backend (enum hoặc số)
            // Backend trả về SalesOrderStatus (enum: Draft=0, Send=1, Approved=2, Rejected=3, Delivered=4, Complete=5, NotComplete=6)
            const orderStatusRaw =
              order.SalesOrderStatus ??
              order.salesOrderStatus ??
              order.Status ??
              order.status ??
              null;

            // Convert enum string thành số nếu cần
            let orderStatus = orderStatusRaw;
            if (typeof orderStatusRaw === "string") {
              const statusMap = {
                Draft: 0,
                Send: 1,
                Approved: 2,
                Rejected: 3,
                Delivered: 4,
                Complete: 5,
                NotComplete: 6,
              };
              orderStatus = statusMap[orderStatusRaw] ?? orderStatusRaw;
            }
            // Nếu là số, giữ nguyên
            if (typeof orderStatus === "number") {
              orderStatus = Number(orderStatus);
            }

            // Lấy PaymentStatus từ backend (enum hoặc số)
            // Backend trả về PaymentStatus (enum: Pending=0, Deposited=1, Paid=2, Success=3, Failed=4, Refunded=5)
            // Có thể backend trả về PaymentStatusName (string) thay vì PaymentStatus (enum)
            const paymentStatusRaw =
              order.PaymentStatus ??
              order.paymentStatus ??
              order.PaymentStatusValue ??
              order.paymentStatusValue ??
              (order.PaymentStatusName
                ? (() => {
                    // Map PaymentStatusName string to number
                    const nameMap = {
                      Pending: 0,
                      Deposited: 1,
                      Paid: 2,
                      Success: 3,
                      Failed: 4,
                      Refunded: 5,
                    };
                    return nameMap[order.PaymentStatusName] ?? null;
                  })()
                : null) ??
              (order.paymentStatusName
                ? (() => {
                    // Map paymentStatusName string to number
                    const nameMap = {
                      Pending: 0,
                      Deposited: 1,
                      Paid: 2,
                      Success: 3,
                      Failed: 4,
                      Refunded: 5,
                    };
                    return nameMap[order.paymentStatusName] ?? null;
                  })()
                : null) ??
              null;

            // Convert enum string thành số nếu cần
            let paymentStatus = paymentStatusRaw;
            if (typeof paymentStatusRaw === "string") {
              const paymentMap = {
                Pending: 0,
                Deposited: 1,
                Paid: 2,
                Success: 3,
                Failed: 4,
                Refunded: 5,
              };
              paymentStatus = paymentMap[paymentStatusRaw] ?? paymentStatusRaw;
            }
            // Nếu là số, giữ nguyên
            if (typeof paymentStatus === "number") {
              paymentStatus = Number(paymentStatus);
            }

            // Debug log for first order
            if (order === response.data.data[0]) {
              console.log(
                "SalesOrderList - Mapped paymentStatus:",
                paymentStatus,
                "from raw:",
                paymentStatusRaw
              );
            }

            if (orderStatus === 1 || orderStatus === 3) {
              paymentStatus = null;
            }

            return {
              id: order.SalesOrderId || order.salesOrderId,

              code: order.SalesOrderCode || order.salesOrderCode || "",

              creator:
                order.CustomerName ||
                order.customerName ||
                order.CreateBy ||
                order.createBy ||
                order.CreatedBy ||
                order.createdBy ||
                "-",

              orderStatus,

              paymentStatus,

              status: orderStatus,

              createdAt: order.CreateAt || order.createAt || order.CreatedAt,

              totalAmount: order.TotalPrice || order.totalPrice || 0,

              paidAmount: order.PaidAmount ?? order.paidAmount ?? 0,

              // Thông tin cọc (để xác định hiển thị "Chờ cọc" hay "Chờ thanh toán")
              depositPercent:
                order.DepositPercent ??
                order.depositPercent ??
                order.DepositPercentage ??
                order.depositPercentage ??
                null,
              depositAmount:
                order.DepositAmount ??
                order.depositAmount ??
                order.RequiredDepositAmount ??
                order.requiredDepositAmount ??
                null,
            };
          })

          .filter((order) => order.orderStatus !== 0); // Lọc bỏ đơn hàng có status = 0 (Nháp)

        setOrders(mappedOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("SalesOrderList - fetchOrders error:", err);
      const errorMessage =
        err.response?.data?.message || "Không thể tải danh sách đơn hàng";

      setError(errorMessage);

      setSnackbarMessage(errorMessage);

      setSnackbarOpen(true);

      setOrders([]);
    } finally {
      console.log("SalesOrderList - fetchOrders completed");
      isFetchingRef.current = false;
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Chỉ gọi một lần khi component mount, không gọi lại khi re-render
    if (!isFetchingRef.current && orders.length === 0 && !loading) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi mount

  const toNumberOrNull = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const sanitized =
      typeof value === "string" ? value.replace(/[^0-9.-]/g, "") : value;
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getEffectiveOrderStatus = (
    orderStatus,
    paymentStatus,
    orderData = null
  ) => {
    if (!orderData) {
      // Nếu không có orderData, chỉ kiểm tra payment status
      if (paymentStatus === 2) {
        // PartiallyPaid
        return 4; // PartiallyDelivered
      }
      return orderStatus;
    }

    const totalAmount =
      toNumberOrNull(
        orderData.totalAmount ??
          orderData.TotalAmount ??
          orderData.totalPrice ??
          orderData.TotalPrice ??
          orderData.grandTotal ??
          0
      ) ?? 0;

    const paidAmount =
      toNumberOrNull(
        orderData.paidAmount ??
          orderData.PaidAmount ??
          orderData.depositPaidAmount ??
          orderData.DepositPaidAmount ??
          0
      ) ?? 0;

    // Nếu tổng tiền = tiền đã trả → "Giao toàn bộ hàng" (Delivered = 5)
    if (totalAmount > 0 && paidAmount >= totalAmount) {
      return 5; // Delivered
    }

    // Nếu payment status là "Đã thanh toán 1 phần" (PartiallyPaid = 2)
    // thì hiển thị order status là "Giao hàng 1 phần" (PartiallyDelivered = 4)
    if (paymentStatus === 2) {
      // PartiallyPaid
      return 4; // PartiallyDelivered
    }

    // Trả về order status gốc
    return orderStatus;
  };

  const hasDepositRequirement = (depositInfo) => {
    if (!depositInfo) return false;
    const percentValue = depositInfo.percent;
    const amountValue = depositInfo.amount;
    if (percentValue !== null && percentValue !== undefined) {
      const parsed = Number(percentValue);
      if (Number.isFinite(parsed) && parsed > 0) {
        return true;
      }
    }
    if (amountValue !== null && amountValue !== undefined) {
      const parsedAmount = Number(amountValue);
      if (Number.isFinite(parsedAmount) && parsedAmount > 0) {
        return true;
      }
    }
    return false;
  };

  const getPaymentStatusCodeByContext = (
    paymentStatus,
    orderStatus,
    depositInfo,
    orderData = null
  ) => {
    const normalizedStatus =
      typeof orderStatus === "string" ? Number(orderStatus) : orderStatus;
    const normalizedPayment =
      typeof paymentStatus === "string" && paymentStatus !== ""
        ? Number(paymentStatus)
        : paymentStatus;

    let paidAmount = 0;
    let totalAmount = 0;
    let depositAmount = 0;
    let depositPercentNum = null;

    if (orderData) {
      paidAmount =
        toNumberOrNull(
          orderData.paidAmount ??
            orderData.PaidAmount ??
            orderData.depositPaidAmount ??
            orderData.DepositPaidAmount ??
            0
        ) ?? 0;
      totalAmount =
        toNumberOrNull(
          orderData.totalAmount ??
            orderData.TotalAmount ??
            orderData.totalPrice ??
            orderData.TotalPrice ??
            orderData.grandTotal ??
            0
        ) ?? 0;
      depositAmount =
        toNumberOrNull(
          depositInfo?.amount ??
            orderData.depositAmount ??
            orderData.DepositAmount ??
            null
        ) ?? 0;

      const depositPercentValue =
        depositInfo?.percent ??
        orderData?.depositPercent ??
        orderData?.DepositPercent ??
        null;
      depositPercentNum = toNumberOrNull(depositPercentValue);
    }

    // Nếu đã giao hàng 1 phần → xem như Đã tt 1 phần
    if (normalizedStatus === 4) {
      return 2;
    }

    // Nếu đơn hàng đã giao toàn bộ (Delivered = 5) và đã thanh toán đủ, ưu tiên hiển thị "Đã tt toàn bộ"
    // Thay vì "Trả lại tiền" từ backend
    if (
      normalizedStatus === 5 &&
      totalAmount > 0 &&
      paidAmount >= totalAmount
    ) {
      return 3; // Paid
    }

    // Nếu backend đã set trạng thái thanh toán cụ thể (nhưng không phải trường hợp trên)
    if (
      normalizedPayment === 1 || // Deposited
      normalizedPayment === 2 || // PartiallyPaid
      normalizedPayment === 3 || // Paid
      normalizedPayment === 4 || // Failed
      normalizedPayment === 5 // Refunded
    ) {
      return normalizedPayment;
    }

    // Đã thanh toán toàn bộ
    if (totalAmount > 0 && paidAmount >= totalAmount) {
      return 3;
    }

    // Tính tiền cọc hiệu quả
    let effectiveDepositAmount = depositAmount;
    if (
      (effectiveDepositAmount === 0 || effectiveDepositAmount === null) &&
      depositPercentNum !== null &&
      depositPercentNum > 0 &&
      totalAmount > 0
    ) {
      effectiveDepositAmount = (depositPercentNum / 100) * totalAmount;
    }
    if (
      (effectiveDepositAmount === 0 || effectiveDepositAmount === null) &&
      depositPercentNum !== null &&
      depositPercentNum > 0 &&
      totalAmount === 0
    ) {
      // Không có tổng nhưng có % cọc: không suy được, giữ 0 để tránh sai
      effectiveDepositAmount = 0;
    }

    // Đã thanh toán nhưng chưa đủ tổng (hoặc chưa biết tổng nhưng đã trả)
    if (paidAmount > 0 && (totalAmount === 0 || paidAmount < totalAmount)) {
      if (effectiveDepositAmount > 0) {
        if (paidAmount < effectiveDepositAmount) {
          return 0; // Chờ cọc
        }
        if (paidAmount === effectiveDepositAmount) {
          return 1; // Đã cọc
        }
        // Đã vượt mức cọc nhưng chưa đủ tổng
        return 2; // Đã tt 1 phần
      }

      // Không yêu cầu cọc hoặc không tính được cọc: đã trả nhưng chưa đủ tổng
      return 2;
    }

    // Đơn đã chấp thuận nhưng chưa thanh toán
    if (normalizedStatus === 2) {
      if (depositPercentNum !== null && depositPercentNum > 0) {
        return paidAmount > 0 ? 1 : 0; // Đã cọc hoặc Chờ cọc
      }
      return 0; // Chờ thanh toán
    }

    // Mặc định
    return 0;
  };

  const getPaymentStatusLabelByContext = (
    paymentStatus,
    orderStatus,
    depositInfo,
    orderData = null,
    short = false
  ) => {
    // Kiểm tra trường hợp đặc biệt: NotComplete (7) và cọc = 0% → "Ngừng giao dịch"
    const normalizedStatus =
      typeof orderStatus === "string" ? Number(orderStatus) : orderStatus;
    if (normalizedStatus === 7 && orderData) {
      // NotComplete
      const depositPercentValue =
        depositInfo?.percent ??
        orderData?.depositPercent ??
        orderData?.DepositPercent ??
        null;
      const depositPercentNum = toNumberOrNull(depositPercentValue);
      const depositAmountVal =
        toNumberOrNull(
          depositInfo?.amount ??
            orderData?.depositAmount ??
            orderData?.DepositAmount ??
            null
        ) ?? 0;
      const hasDeposit =
        (depositPercentNum !== null && depositPercentNum > 0) ||
        depositAmountVal > 0;

      if (!hasDeposit) {
        return "Ngừng giao dịch";
      }
    }

    const statusCode = getPaymentStatusCodeByContext(
      paymentStatus,
      orderStatus,
      depositInfo,
      orderData
    );
    // Phân biệt "Chờ cọc" và "Chờ thanh toán" khi statusCode = 0
    if (statusCode === 0 && orderData) {
      const paid =
        toNumberOrNull(
          orderData.paidAmount ??
            orderData.PaidAmount ??
            orderData.depositPaidAmount ??
            orderData.DepositPaidAmount ??
            0
        ) ?? 0;
      const depositPercentValue =
        depositInfo?.percent ??
        orderData?.depositPercent ??
        orderData?.DepositPercent ??
        null;
      const depositPercentNum = toNumberOrNull(depositPercentValue);
      const depositAmountVal =
        toNumberOrNull(
          depositInfo?.amount ??
            orderData?.depositAmount ??
            orderData?.DepositAmount ??
            null
        ) ?? 0;
      const hasDepositRequirement =
        (depositPercentNum !== null && depositPercentNum > 0) ||
        depositAmountVal > 0;

      if (paid === 0 && hasDepositRequirement) {
        return "Chờ cọc";
      }
      if (paid === 0 && !hasDepositRequirement) {
        return "Chờ thanh toán";
      }
    }

    return short
      ? getPaymentStatusLabelShort(statusCode)
      : getPaymentStatusLabel(statusCode);
  };

  const getOrderStatusLabel = (status, short = false) => {
    // SalesOrderStatus enum: Draft=0, Send=1, Approved=2, Rejected=3, PartiallyDelivered=4, Delivered=5, Complete=6, NotComplete=7
    switch (status) {
      case 0:
        return "Nháp"; // Draft
      case 1:
        return "Đã gửi"; // Send
      case 2:
        return "Chấp thuận"; // Approved
      case 3:
        return "Từ chối"; // Rejected
      case 4:
        return "Giao hàng 1 phần"; // PartiallyDelivered
      case 5:
        return "Giao toàn bộ hàng"; // Delivered
      case 6:
        return "Hoàn thành"; // Complete
      case 7:
        return "Chưa hoàn thành"; // NotComplete
      default:
        return "Không xác định";
    }
  };

  useEffect(() => {
    const openOrderId = location.state?.openOrderId;
    if (openOrderId) {
      navigate(location.pathname, { replace: true, state: {} });
      handleViewDetails(Number(openOrderId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, navigate]);

  const getOrderStatusColor = (status) => {
    // SalesOrderStatus enum: Draft=0, Send=1, Approved=2, Rejected=3, PartiallyDelivered=4, Delivered=5, Complete=6, NotComplete=7
    switch (status) {
      case 0: // Nháp (Draft)
        return { backgroundColor: "#fff3cd", color: "#856404" };
      case 1: // Đã gửi (Send)
        return { backgroundColor: "#e3f2fd", color: "#1a4a57" };
      case 2: // Chấp thuận (Approved)
        return { backgroundColor: "#ffe082", color: "#8c6d1f" };
      case 3: // Từ chối (Rejected)
        return { backgroundColor: "#f8d7da", color: "#721c24" };
      case 4: // Giao hàng 1 phần (PartiallyDelivered)
        return { backgroundColor: "#b3d9ff", color: "#003366" };
      case 5: // Giao toàn bộ hàng (Delivered)
        return { backgroundColor: "#cce5ff", color: "#004085" };
      case 6: // Hoàn thành (Complete)
        return { backgroundColor: "#d4edda", color: "#155724" };
      case 7: // Chưa hoàn thành (NotComplete)
        return { backgroundColor: "#ffe0b2", color: "#e65100" };
      default:
        return { backgroundColor: "#e3f2fd", color: "#1976d2" };
    }
  };

  const getPaymentStatusLabel = (status) => {
    // PaymentStatus enum backend: NotPaymentYet=0, Deposited=1, PartiallyPaid=2, Paid=3, Refunded=4
    switch (status) {
      case 0:
        return "Chờ thanh toán"; // NotPaymentYet
      case 1:
        return "Đã cọc"; // Deposited
      case 2:
        return "Thanh toán 1 phần"; // PartiallyPaid
      case 3:
        return "Hoàn thành"; // Paid
      case 4:
        return "Trả lại cọc"; // Refunded
      default:
        return "Không xác định";
    }
  };

  // Hàm lấy label ngắn gọn cho trạng thái thanh toán (dùng trong bảng list)
  const getPaymentStatusLabelShort = (status) => {
    // PaymentStatus enum backend: NotPaymentYet=0, Deposited=1, PartiallyPaid=2, Paid=3, Refunded=4
    switch (status) {
      case 0:
        return "Chờ thanh toán"; // NotPaymentYet
      case 1:
        return "Đã cọc"; // Deposited
      case 2:
        return "Thanh toán 1 phần"; // PartiallyPaid
      case 3:
        return "Hoàn thành"; // Paid
      case 4:
        return "Trả lại cọc"; // Refunded
      default:
        return "Không xác định";
    }
  };

  const getDepositAmountValue = (data) => {
    if (!data) return 0;
    const totalAmountValue = toNumberOrNull(
      data.totalAmount ??
        data.TotalAmount ??
        data.totalPrice ??
        data.TotalPrice ??
        data.grandTotal ??
        null
    );
    const depositPercentValue = toNumberOrNull(
      data.depositPercent ?? data.DepositPercent ?? null
    );
    const depositAmountValue = toNumberOrNull(
      data.depositAmount ?? data.DepositAmount ?? null
    );

    if (depositPercentValue !== null && totalAmountValue !== null) {
      return (depositPercentValue / 100) * totalAmountValue;
    }

    return depositAmountValue ?? 0;
  };

  const getAmountAfterDeposit = (data) => {
    if (!data) return 0;
    const totalAmountValue = toNumberOrNull(
      data.totalAmount ??
        data.TotalAmount ??
        data.totalPrice ??
        data.TotalPrice ??
        data.grandTotal ??
        null
    );
    if (totalAmountValue === null) return 0;

    const depositAmountValue = toNumberOrNull(getDepositAmountValue(data)) ?? 0;
    return Math.max(totalAmountValue - depositAmountValue, 0);
  };

  const getPaymentStatusColor = (
    status,
    orderStatus = null,
    orderData = null
  ) => {
    // Kiểm tra trường hợp đặc biệt: NotComplete (7) và cọc = 0% → "Ngừng giao dịch"
    if (orderStatus === 7 && orderData) {
      const depositPercentValue =
        orderData?.depositPercent ?? orderData?.DepositPercent ?? null;
      const depositPercentNum = toNumberOrNull(depositPercentValue);
      const depositAmountVal =
        toNumberOrNull(
          orderData?.depositAmount ?? orderData?.DepositAmount ?? null
        ) ?? 0;
      const hasDeposit =
        (depositPercentNum !== null && depositPercentNum > 0) ||
        depositAmountVal > 0;

      if (!hasDeposit) {
        return { backgroundColor: "#9e9e9e", color: "#ffffff" }; // Màu xám cho "Ngừng giao dịch"
      }
    }

    // PaymentStatus enum: Pending=0, Deposited=1, PartiallyPaid=2, Paid=3, Refunded=4
    switch (status) {
      case 0: // Chờ thanh toán (Pending)
        return { backgroundColor: "#fff3cd", color: "#856404" };
      case 1: // Đã cọc (Deposited)
        return { backgroundColor: "#9c27b0", color: "#ffffff" }; // Màu tím đậm
      case 2: // Đã thanh toán 1 phần (PartiallyPaid)
        return { backgroundColor: "#fff9c4", color: "#f57f17" }; // Màu vàng nhạt để phân biệt với đã cọc
      case 3: // Đã thanh toán toàn bộ (Paid)
        return { backgroundColor: "#c8e6c9", color: "#1b5e20" };
      case 4: // Thất bại (Failed)
        return { backgroundColor: "#ffcdd2", color: "#b71c1c" };
      case 5: // Trả lại cọc (Refunded)
        return { backgroundColor: "#f8bbd0", color: "#880e4f" };
      default:
        return { backgroundColor: "#e3f2fd", color: "#1976d2" };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    try {
      const date = new Date(dateString);

      return date.toLocaleDateString("vi-VN", {
        year: "numeric",

        month: "2-digit",

        day: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

  const formatCurrency = (value) => {
    const number = Number(value) || 0;
    // Format với dấu phẩy thay vì dấu chấm
    return new Intl.NumberFormat("vi-VN").format(number).replace(/\./g, ",");
  };

  const renderCurrency = (value, options = {}) => {
    const formatted = formatCurrency(value);
    const fontWeight = options.fontWeight ?? 500;
    const unitFontWeight = options.unitFontWeight ?? fontWeight;
    const fontSize = options.fontSize ?? "inherit";
    const unitFontSize = options.unitFontSize ?? "0.75em";
    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: 0.25,
        }}
      >
        <Typography component="span" sx={{ fontWeight, fontSize }}>
          {formatted}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontSize: unitFontSize,
            lineHeight: 1,
            textDecoration: "underline",
            textDecorationThickness: "1px",
            textUnderlineOffset: "1px",
            fontWeight: unitFontWeight,
          }}
        >
          đ
        </Typography>
      </Box>
    );
  };

  const buildTaxKey = (name, expiredDisplay) => {
    const normalizedName = (name || "").toString().trim().toLowerCase();

    const normalizedExpired = (expiredDisplay || "").toString().trim();

    return `${normalizedName}__${normalizedExpired}`;
  };

  // Extract tax rate from TaxText (e.g., "VAT 10%" -> 0.1)

  const getTaxRateFromText = (taxText) => {
    if (!taxText) return 0;

    const matched = String(taxText).match(/(\d+(?:[.,]\d+)?)\s*%/);

    if (matched && matched[1]) {
      const parsed = Number(matched[1].replace(",", "."));

      if (!Number.isNaN(parsed)) {
        return parsed / 100;
      }
    }

    return 0;
  };

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === "asc";

    setSortConfig({ key, direction: isAsc ? "desc" : "asc" });
  };

  // Filter orders by status

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Lọc theo trạng thái đơn hàng
    if (orderStatusFilter !== "all") {
      const filterOrderStatus = Number(orderStatusFilter);
      filtered = filtered.filter(
        (order) => order.orderStatus === filterOrderStatus
      );
    }

    // Lọc theo trạng thái thanh toán
    if (paymentStatusFilter !== "all") {
      // Xử lý trường hợp đặc biệt "Chờ cọc"
      if (paymentStatusFilter === "waiting_deposit") {
        filtered = filtered.filter((order) => {
          // Nếu trạng thái đơn hàng là Nháp (0), Đã gửi (1), hoặc Từ chối (3) thì không có trạng thái thanh toán
          if (
            order.orderStatus === 0 ||
            order.orderStatus === 1 ||
            order.orderStatus === 3
          ) {
            return false;
          }
          // Kiểm tra xem có phải "Chờ cọc" không
          const depositPercentValue =
            order.depositPercent ?? order.DepositPercent ?? null;
          const depositPercentNum = toNumberOrNull(depositPercentValue);
          const hasDepositRequirement =
            depositPercentNum !== null && depositPercentNum > 0;
          const paymentStatus = order.paymentStatus ?? 0;
          const paidAmount = order.paidAmount ?? 0;

          // "Chờ cọc" khi: đơn đã chấp thuận, có yêu cầu cọc, chưa thanh toán gì
          return (
            order.orderStatus === 2 &&
            hasDepositRequirement &&
            (paymentStatus === 0 ||
              paymentStatus === null ||
              paymentStatus === undefined) &&
            paidAmount === 0
          );
        });
      } else if (paymentStatusFilter === "transaction_stopped") {
        // Filter "Ngừng giao dịch": NotComplete (7) và cọc = 0%
        filtered = filtered.filter((order) => {
          if (order.orderStatus !== 7) return false; // Phải là NotComplete
          const depositPercentValue =
            order.depositPercent ?? order.DepositPercent ?? null;
          const depositPercentNum = toNumberOrNull(depositPercentValue);
          const depositAmountVal =
            toNumberOrNull(
              order.depositAmount ?? order.DepositAmount ?? null
            ) ?? 0;
          const hasDeposit =
            (depositPercentNum !== null && depositPercentNum > 0) ||
            depositAmountVal > 0;
          return !hasDeposit; // Cọc = 0%
        });
      } else {
        const filterPaymentStatus = Number(paymentStatusFilter);
        filtered = filtered.filter((order) => {
          // Nếu trạng thái đơn hàng là Nháp (0), Đã gửi (1), hoặc Từ chối (3) thì không có trạng thái thanh toán
          // Các đơn hàng này sẽ không khớp với bất kỳ filter thanh toán cụ thể nào
          if (
            order.orderStatus === 0 ||
            order.orderStatus === 1 ||
            order.orderStatus === 3
          ) {
            return false;
          }

          // Nếu filter là "Chờ Thanh Toán" (0), loại trừ các đơn hàng "Chờ cọc"
          if (filterPaymentStatus === 0) {
            const depositPercentValue =
              order.depositPercent ?? order.DepositPercent ?? null;
            const depositPercentNum = toNumberOrNull(depositPercentValue);
            const hasDepositRequirement =
              depositPercentNum !== null && depositPercentNum > 0;
            const paidAmount = order.paidAmount ?? 0;

            // Loại trừ nếu có yêu cầu cọc và chưa thanh toán (đó là "Chờ cọc", không phải "Chờ thanh toán")
            if (hasDepositRequirement && paidAmount === 0) {
              return false;
            }
          }

          return order.paymentStatus === filterPaymentStatus;
        });
      }
    }

    // Filter by order code search
    if (searchOrderCode.trim()) {
      const searchTerm = searchOrderCode.trim().toLowerCase();
      filtered = filtered.filter(
        (order) => order.code && order.code.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by customer name search
    if (searchCustomerName.trim()) {
      const searchTerm = searchCustomerName.trim().toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.creator && order.creator.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [
    orders,
    orderStatusFilter,
    paymentStatusFilter,
    searchOrderCode,
    searchCustomerName,
  ]);

  // Sort orders

  const sortedOrders = useMemo(() => {
    // Nếu không có sortConfig.key, mặc định sort theo ngày tạo từ mới nhất đến cũ nhất
    const effectiveSortConfig = sortConfig.key
      ? sortConfig
      : { key: "createdAt", direction: "desc" };

    return [...filteredOrders].sort((a, b) => {
      let aValue = a[effectiveSortConfig.key];
      let bValue = b[effectiveSortConfig.key];

      if (effectiveSortConfig.key === "code") {
        aValue = aValue || "";
        bValue = bValue || "";
      } else if (effectiveSortConfig.key === "createdAt") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (
        effectiveSortConfig.key === "status" ||
        effectiveSortConfig.key === "orderStatus" ||
        effectiveSortConfig.key === "paymentStatus"
      ) {
        aValue = aValue !== undefined && aValue !== null ? aValue : -1;
        bValue = bValue !== undefined && bValue !== null ? bValue : -1;
      } else if (
        effectiveSortConfig.key === "totalAmount" ||
        effectiveSortConfig.key === "paidAmount"
      ) {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      if (aValue < bValue) {
        return effectiveSortConfig.direction === "asc" ? -1 : 1;
      }

      if (aValue > bValue) {
        return effectiveSortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });
  }, [filteredOrders, sortConfig]);

  useEffect(() => {
    setPage(1);
  }, [
    orderStatusFilter,
    paymentStatusFilter,
    searchOrderCode,
    searchCustomerName,
  ]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;

    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, page]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const fetchQuotationSupplement = async (quotationId) => {
    if (!quotationId) {
      return {
        quotationInfo: null,

        quotationDetails: [],

        quotationDetailView: [],
      };
    }

    try {
      const [quotationInfoResponse, quotationDetailResponse] =
        await Promise.all([
          salesOrderAPI.getQuotationInfo(quotationId),

          salesQuotationAPI

            .viewDetails(quotationId)

            .catch(() => null),
        ]);

      const quotationInfo = quotationInfoResponse.data?.data || null;

      const quotationDetails =
        quotationInfo?.details ?? quotationInfo?.Details ?? [];

      const quotationDetailView =
        quotationDetailResponse?.data?.data?.details ??
        quotationDetailResponse?.data?.data?.Details ??
        [];

      return {
        quotationInfo,

        quotationDetails,

        quotationDetailView,
      };
    } catch (error) {
      return {
        quotationInfo: null,

        quotationDetails: [],

        quotationDetailView: [],
      };
    }
  };

  const handleViewDetails = async (orderId) => {
    console.log(
      "SalesOrderList - handleViewDetails called with orderId:",
      orderId
    );
    console.log("SalesOrderList - orderId type:", typeof orderId);
    console.log("SalesOrderList - orderId value:", orderId);

    if (!orderId) {
      console.error("SalesOrderList - orderId is null or undefined!");
      setDetailError("Không có ID đơn hàng");
      setDetailLoading(false);
      return;
    }

    setSelectedOrderId(orderId);

    setDetailDialogOpen(true);

    setDetailLoading(true);

    setDetailError(null);

    setOrderDetails(null);

    try {
      console.log("SalesOrderList - About to call API with orderId:", orderId);
      console.log(
        "SalesOrderList - salesOrderAPI.viewDetails function:",
        salesOrderAPI.viewDetails
      );

      const response = await salesOrderAPI.viewDetails(orderId);

      console.log("SalesOrderList - API response received:", response);
      console.log("SalesOrderList - response type:", typeof response);
      console.log("SalesOrderList - response.data:", response.data);
      console.log("SalesOrderList - response.data type:", typeof response.data);
      console.log("SalesOrderList - response.data?.data:", response.data?.data);
      console.log(
        "SalesOrderList - response.data?.data type:",
        typeof response.data?.data
      );

      // Try multiple ways to get data
      let data = null;
      if (response?.data?.data) {
        data = response.data.data;
      } else if (response?.data) {
        data = response.data;
      } else if (response) {
        data = response;
      }

      console.log("SalesOrderList - Final data:", data);
      console.log("SalesOrderList - Final data type:", typeof data);
      console.log(
        "SalesOrderList - Final data keys:",
        data ? Object.keys(data) : "null"
      );

      if (!data) {
        console.error("SalesOrderList - No data found in response:", response);
        setDetailError("Không có dữ liệu từ server");
        return;
      }
      if (data) {
        console.log("SalesOrderList - Processing order data:", data);
        const salesQuotationId =
          data.salesQuotationId ??
          data.SalesQuotationId ??
          data.salesQuotationID ??
          data.SalesQuotationID ??
          null;

        console.log("SalesOrderList - salesQuotationId:", salesQuotationId);
        const {
          quotationInfo,

          quotationDetails,

          quotationDetailView,
        } = await fetchQuotationSupplement(salesQuotationId);

        console.log("SalesOrderList - Quotation supplement:", {
          quotationInfo,
          quotationDetails,
          quotationDetailView,
        });

        const quotationDetailsMap = new Map();

        quotationDetails.forEach((item) => {
          const lotKey = item?.lotId ?? item?.LotId ?? null;

          if (lotKey !== null && lotKey !== undefined) {
            quotationDetailsMap.set(Number(lotKey), {
              productName: item.productName ?? item.ProductName ?? "-",

              productUnit: item.productUnit ?? item.ProductUnit ?? "",

              lotExpiredDate:
                item.lotExpiredDate ?? item.LotExpiredDate ?? null,

              unitPriceBeforeTax: item.unitPrice ?? item.UnitPrice ?? null,
            });
          }
        });

        const quotationTaxMap = new Map();

        quotationDetailView.forEach((detail) => {
          const productName = detail.productName ?? detail.ProductName ?? "";

          const expiredDisplay = detail.expiredDate ?? detail.ExpiredDate ?? "";

          const key = buildTaxKey(productName, expiredDisplay);

          if (key.trim() !== "__") {
            const taxText = detail.taxText ?? detail.TaxText ?? "-";

            quotationTaxMap.set(key, {
              taxText: taxText || "-",

              basePrice: detail.salesPrice ?? detail.SalesPrice ?? null,

              taxRate:
                taxText && taxText !== "-" ? getTaxRateFromText(taxText) : null,
            });
          }
        });

        const totalAmount =
          data.totalAmount ??
          data.TotalAmount ??
          data.totalPrice ??
          data.TotalPrice ??
          data.TotalPrice ??
          data.grandTotal ??
          0;
        const depositPercentRaw =
          data.depositPercent ??
          data.DepositPercent ??
          quotationInfo?.depositPercent ??
          quotationInfo?.DepositPercent ??
          0;

        const depositPercent = Number.isFinite(Number(depositPercentRaw))
          ? Number(depositPercentRaw)
          : 0;

        const paidAmount = data.paidAmount ?? data.PaidAmount ?? 0;

        const depositAmount = totalAmount * (depositPercent / 100);

        const remainingDeposit = Math.max(0, depositAmount - paidAmount);

        const depositDueDaysRaw =
          data.depositDueDays ??
          data.DepositDueDays ??
          quotationInfo?.depositDueDays ??
          quotationInfo?.DepositDueDays ??
          null;

        const depositDueDays = Number.isFinite(Number(depositDueDaysRaw))
          ? Number(depositDueDaysRaw)
          : null;

        const createdAtValue =
          data.createdAt ?? data.CreateAt ?? data.CreatedAt ?? null;

        const depositExpiredFromData =
          data.depositExpiredDate ??
          data.DepositExpiredDate ??
          data.depositExpiredDay ??
          data.DepositExpiredDay ??
          null;

        let computedDepositExpired = depositExpiredFromData;

        if (
          !computedDepositExpired &&
          createdAtValue &&
          depositDueDays !== null
        ) {
          const createdDate = new Date(createdAtValue);

          if (!Number.isNaN(createdDate.getTime())) {
            const dueDate = new Date(createdDate);

            dueDate.setDate(dueDate.getDate() + depositDueDays);

            computedDepositExpired = dueDate.toISOString();
          }
        }

        // Process details with tax information from backend

        const rawDetails =
          data.details ??
          data.Details ??
          data.orderDetails ??
          data.OrderDetails ??
          data.salesOrderDetails ??
          data.SalesOrderDetails ??
          [];

        console.log("SalesOrderList - rawDetails:", rawDetails);
        const processedDetails = rawDetails.map((detail) => {
          const lotId =
            detail.lotId ??
            detail.LotId ??
            detail.lotID ??
            detail.LotID ??
            detail.Lot?.LotId ??
            detail.lot?.LotId ??
            null;

          const quotationMatch =
            lotId !== null ? quotationDetailsMap.get(Number(lotId)) : null;

          const quantity = detail.quantity ?? detail.Quantity ?? 0;

          const unitPriceAfterTaxRaw =
            detail.unitPrice ??
            detail.UnitPrice ??
            detail.unitPriceAfterTax ??
            detail.UnitPriceAfterTax ??
            0;

          // Get expired date from Lot

          const expiredDate =
            detail.Lot?.ExpiredDate ??
            detail.lot?.ExpiredDate ??
            detail.expiredDate ??
            detail.ExpiredDate ??
            quotationMatch?.lotExpiredDate ??
            null;

          const formattedExpiredDate = expiredDate
            ? formatDate(expiredDate)
            : "-";

          // Try to get product name from multiple sources
          let productName =
            detail.productName ??
            detail.ProductName ??
            quotationMatch?.productName ??
            null;

          // If still no product name, try to get from quotation details by matching lotId
          if (!productName && lotId !== null) {
            const matchingQuotationDetail = quotationDetailView.find(
              (qd) =>
                (qd.lotId ?? qd.LotId) === lotId ||
                (qd.LotId ?? qd.lotId) === lotId
            );
            if (matchingQuotationDetail) {
              productName =
                matchingQuotationDetail.productName ??
                matchingQuotationDetail.ProductName ??
                null;
            }
          }

          // Fallback to '-' if still no product name
          if (!productName) {
            productName = "-";
          }
          const taxKey = buildTaxKey(productName, formattedExpiredDate);

          const taxData = quotationTaxMap.get(taxKey);

          // Get tax information from backend response

          let taxText =
            detail.taxText ?? detail.TaxText ?? taxData?.taxText ?? "-";

          let taxRate =
            detail.taxRate ?? detail.TaxRate ?? taxData?.taxRate ?? null;

          if (
            (taxRate === null || taxRate === undefined) &&
            taxText &&
            taxText !== "-"
          ) {
            taxRate = getTaxRateFromText(taxText);
          }

          const basePriceFromQuotation =
            taxData?.basePrice ?? quotationMatch?.unitPriceBeforeTax ?? null;

          let unitPriceBeforeTax;

          if (
            basePriceFromQuotation !== null &&
            basePriceFromQuotation !== undefined
          ) {
            unitPriceBeforeTax = basePriceFromQuotation;

            if (taxRate === null || taxRate === undefined) {
              const computedRate =
                basePriceFromQuotation > 0
                  ? (unitPriceAfterTaxRaw - basePriceFromQuotation) /
                    basePriceFromQuotation
                  : 0;

              if (Number.isFinite(computedRate) && computedRate >= 0) {
                taxRate = computedRate;
              }
            }
          } else if (taxRate !== null && taxRate !== undefined) {
            unitPriceBeforeTax = unitPriceAfterTaxRaw / (1 + taxRate);
          } else {
            unitPriceBeforeTax = unitPriceAfterTaxRaw;
          }

          if (!taxText || taxText === "-") {
            if (taxRate !== null && taxRate !== undefined && taxRate > 0) {
              const percentValue = Math.round(taxRate * 10000) / 100;

              taxText = `${percentValue}%`;
            } else {
              taxText = "-";
            }
          }

          const unitPriceAfterTax =
            taxRate !== null && taxRate !== undefined
              ? unitPriceBeforeTax * (1 + taxRate)
              : unitPriceAfterTaxRaw;

          const subtotal = quantity * unitPriceBeforeTax;

          const subtotalAfterTax =
            detail.subtotalAfterTax ??
            detail.SubtotalAfterTax ??
            quantity * unitPriceAfterTax;

          const normalizedTaxRate =
            taxRate !== null && taxRate !== undefined
              ? Math.max(0, Number(taxRate))
              : 0;

          return {
            ...detail,

            quantity,

            unitPrice: unitPriceBeforeTax,

            unitPriceAfterTax,

            subtotal,

            subtotalAfterTax,

            expiredDate: formattedExpiredDate,

            taxText: taxText || "-",

            taxRate: normalizedTaxRate,

            productName,
          };
        });

        setOrderDetails({
          id: data.id ?? data.salesOrderId ?? data.SalesOrderId ?? orderId,

          code:
            data.orderCode ??
            data.salesOrderCode ??
            data.SalesOrderCode ??
            data.SalesOrderCode ??
            "",
          creator:
            data.customerName ??
            data.CustomerName ??
            data.creator ??
            data.createBy ??
            data.CreateBy ??
            data.createdBy ??
            data.CreatedBy ??
            "-",
          customerName:
            data.customerName ??
            data.CustomerName ??
            data.customerFullName ??
            data.CustomerFullName ??
            data.creator ??
            data.createBy ??
            data.CreateBy ??
            data.createdBy ??
            data.CreatedBy ??
            "-",
          quotationCode:
            data.quotationCode ??
            data.QuotationCode ??
            data.salesQuotationCode ??
            data.SalesQuotationCode ??
            "",

          status:
            data.status ??
            data.Status ??
            data.SalesOrderStatus ??
            data.salesOrderStatus ??
            null,
          paymentStatus:
            data.paymentStatus ??
            data.PaymentStatus ??
            data.salesPaymentStatus ??
            data.SalesPaymentStatus ??
            null,
          createdAt:
            data.createdAt ??
            data.CreateAt ??
            data.CreatedAt ??
            data.CreateAt ??
            null,
          expiredDate:
            data.orderExpiredDate ??
            data.OrderExpiredDate ??
            data.expiredDate ??
            data.ExpiredDate ??
            data.dueDate ??
            data.DueDate ??
            data.SalesOrderExpiredDate ??
            data.salesOrderExpiredDate ??
            null,
          depositPercent: depositPercent,

          depositExpiredDate: computedDepositExpired,

          depositDueDays,

          totalAmount: totalAmount,

          paidAmount: paidAmount,

          remainingDeposit: remainingDeposit,

          depositAmount,

          dueAmount:
            data.debtAmount ??
            data.DebtAmount ??
            data.balanceAmount ??
            data.BalanceAmount ??
            null,

          details: processedDetails,

          salesQuotationId: salesQuotationId,

          quotationDetailsMap: quotationDetailsMap,
        });

        console.log("SalesOrderList - Order details set:", orderDetails);
      } else {
        console.warn("SalesOrderList - No data in response");
        setOrderDetails(null);

        setDetailError("Không có dữ liệu đơn hàng");
      }
    } catch (err) {
      console.error("SalesOrderList - Error loading order details:", err);
      console.error("SalesOrderList - Error message:", err.message);
      console.error("SalesOrderList - Error stack:", err.stack);
      console.error("SalesOrderList - Error response:", err.response);
      console.error(
        "SalesOrderList - Error response data:",
        err.response?.data
      );
      console.error(
        "SalesOrderList - Error response status:",
        err.response?.status
      );
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Không thể tải chi tiết đơn hàng.";
      setDetailError(errorMessage);

      setSnackbarMessage(errorMessage);

      setSnackbarOpen(true);
    } finally {
      setDetailLoading(false);

      console.log(
        "SalesOrderList - handleViewDetails completed, detailLoading:",
        false
      );
    }
  };

  const handleOpenPaymentDialog = async (orderId) => {
    setSelectedOrderId(orderId);

    setDetailDialogOpen(true);

    setDetailLoading(true);

    setDetailError(null);

    setOrderDetails(null);

    try {
      const response = await salesOrderAPI.viewDetails(orderId);

      const data = response.data?.data;

      if (data) {
        setOrderDetails({
          id: data.id ?? data.salesOrderId ?? data.SalesOrderId ?? orderId,

          code:
            data.orderCode ?? data.salesOrderCode ?? data.SalesOrderCode ?? "",

          creator:
            data.customerName ??
            data.CustomerName ??
            data.creator ??
            data.createBy ??
            data.CreateBy ??
            data.createdBy ??
            data.CreatedBy ??
            "-",

          status: data.status ?? data.Status,

          createdAt: data.createdAt ?? data.CreateAt ?? data.CreatedAt ?? null,

          expiredAt:
            data.expiredDate ??
            data.ExpiredDate ??
            data.dueDate ??
            data.DueDate ??
            null,

          totalAmount:
            data.totalAmount ??
            data.TotalAmount ??
            data.totalPrice ??
            data.TotalPrice ??
            data.grandTotal ??
            0,

          paidAmount: data.paidAmount ?? data.PaidAmount ?? 0,

          dueAmount:
            data.debtAmount ??
            data.DebtAmount ??
            data.balanceAmount ??
            data.BalanceAmount ??
            null,

          details:
            data.details ??
            data.orderDetails ??
            data.OrderDetails ??
            data.salesOrderDetails ??
            data.SalesOrderDetails ??
            [],

          paymentUrl: data.paymentUrl ?? data.PaymentUrl ?? "",

          qrImage:
            data.qrImage ??
            data.QrImage ??
            data.qrCodeUrl ??
            data.QRCodeUrl ??
            "",
        });
      } else {
        setOrderDetails(null);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể tải chi tiết đơn hàng.";

      setDetailError(errorMessage);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    try {
      await salesOrderAPI.approveOrder(orderId);

      setSnackbarMessage("Đã chấp thuận đơn hàng.");

      setSnackbarOpen(true);

      // Refresh list without showing full page loading

      await fetchOrders(false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể chấp thuận đơn hàng.";

      setSnackbarMessage(errorMessage);

      setSnackbarOpen(true);
    }
  };

  const handleReject = (orderId) => {
    setRejectOrderId(orderId);
    setRejectReason("");
    setRejectError(null);
    setRejectDialogOpen(true);
  };

  const handleCloseRejectDialog = () => {
    if (rejectLoading) return;
    setRejectDialogOpen(false);
    setRejectOrderId(null);
    setRejectReason("");
    setRejectError(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Vui lòng nhập lý do từ chối đơn hàng");
      return;
    }
    if (!rejectOrderId) {
      setRejectError("Không xác định được đơn hàng cần từ chối");
      return;
    }
    try {
      setRejectLoading(true);
      await salesOrderAPI.rejectOrder({
        salesOrderId: rejectOrderId,
        reason: rejectReason.trim(),
      });
      setSnackbarMessage("Đã từ chối đơn hàng.");
      setSnackbarOpen(true);
      setRejectDialogOpen(false);
      setRejectOrderId(null);
      setRejectReason("");
      setRejectError(null);
      await fetchOrders(false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể từ chối đơn hàng.";
      setRejectError(errorMessage);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);

    setSelectedOrderId(null);

    setOrderDetails(null);

    setDetailError(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <ShoppingCart sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
            >
              Đơn hàng
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {filteredOrders.length === orders.length
                ? `Tổng: ${orders.length} đơn hàng`
                : `Tổng: ${filteredOrders.length} / ${orders.length} đơn hàng`}
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Filter */}
          <Paper
            sx={{ p: 2, mb: 2, backgroundColor: "#f8fafc", borderRadius: 2 }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems="center"
              spacing={2}
            >
              {/* Search fields */}
              <TextField
                size="small"
                label="Tìm kiếm mã đơn hàng"
                value={searchOrderCode}
                onChange={(e) => setSearchOrderCode(e.target.value)}
                sx={{
                  minWidth: 200,
                  backgroundColor: "white",
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                  },
                }}
                placeholder="Nhập mã đơn hàng..."
                disabled={loading}
              />
              <TextField
                size="small"
                label="Tìm kiếm tên khách hàng"
                value={searchCustomerName}
                onChange={(e) => setSearchCustomerName(e.target.value)}
                sx={{
                  minWidth: 200,
                  backgroundColor: "white",
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                  },
                }}
                placeholder="Nhập tên khách hàng..."
                disabled={loading}
              />
              <FormControl
                size="small"
                sx={{ minWidth: 200 }}
                disabled={loading}
              >
                <InputLabel id="order-status-filter-label">
                  Lọc theo trạng thái đơn hàng
                </InputLabel>
                <Select
                  labelId="order-status-filter-label"
                  value={orderStatusFilter}
                  label="Lọc theo trạng thái đơn hàng"
                  onChange={(e) => {
                    setOrderStatusFilter(e.target.value);
                  }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="1">Đã Gửi</MenuItem>
                  <MenuItem value="2">Chấp Thuận</MenuItem>
                  <MenuItem value="3">Từ Chối</MenuItem>
                  <MenuItem value="4">Giao Hàng 1 Phần</MenuItem>
                  <MenuItem value="5">Giao Toàn Bộ Hàng</MenuItem>
                  <MenuItem value="6">Hoàn Thành</MenuItem>
                  <MenuItem value="7">Chưa Hoàn Thành</MenuItem>
                </Select>
              </FormControl>
              <FormControl
                size="small"
                sx={{ minWidth: 200 }}
                disabled={loading}
              >
                <InputLabel id="payment-status-filter-label">
                  Lọc theo trạng thái thanh toán
                </InputLabel>
                <Select
                  labelId="payment-status-filter-label"
                  value={paymentStatusFilter}
                  label="Lọc theo trạng thái thanh toán"
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value);
                  }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="waiting_deposit">Chờ Cọc</MenuItem>
                  <MenuItem value="0">Chờ Thanh Toán</MenuItem>
                  <MenuItem value="1">Đã Cọc</MenuItem>
                  <MenuItem value="2">Đã Thanh Toán 1 Phần</MenuItem>
                  <MenuItem value="3">Đã Thanh Toán Toàn Bộ</MenuItem>
                  <MenuItem value="5">Trả Lại Cọc</MenuItem>
                  <MenuItem value="transaction_stopped">
                    Ngừng Giao Dịch
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          {/* Loading spinner */}
          {loading && <CircularProgress size={28} sx={{ color: "#1976d2" }} />}
          {/* Table */}
          {!loading && (
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: 2,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: 2,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <Table
                sx={{
                  tableLayout: "auto",
                  borderSpacing: 0,
                  borderCollapse: "collapse",
                  minWidth: 1000, // giống trang thuốc: đảm bảo table rộng hơn container để có scroll ngang
                }}
              >
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell
                      sx={{
                        width: "8%",
                        py: 1.5,
                        px: 2,
                        textAlign: "left",
                        fontWeight: 600,
                        textTransform: "capitalize",
                        letterSpacing: "0.03em",
                      }}
                    >
                      #
                    </TableCell>

                    <TableCell sx={{ width: "17%", py: 1.5, px: 2 }}>
                      <TableSortLabel
                        active={sortConfig.key === "code"}
                        direction={
                          sortConfig.key === "code"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("code")}
                        hideSortIcon
                        sx={headerTextSx}
                      >
                        Mã đơn hàng
                      </TableSortLabel>
                    </TableCell>

                    <TableCell
                      sx={{
                        width: "14%",
                        py: 1.5,
                        px: 2,
                        textTransform: "capitalize",
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                      }}
                    >
                      Khách hàng
                    </TableCell>

                    <TableCell sx={{ width: "14%", py: 1.5, px: 2 }}>
                      <TableSortLabel
                        active={sortConfig.key === "createdAt"}
                        direction={
                          sortConfig.key === "createdAt"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("createdAt")}
                        sx={{ ...headerTextSx, whiteSpace: "nowrap" }}
                      >
                        Thời gian tạo
                      </TableSortLabel>
                    </TableCell>

                    <TableCell
                      sx={{ width: "13%", py: 1.5, px: 2, textAlign: "left" }}
                    >
                      <TableSortLabel
                        active={sortConfig.key === "orderStatus"}
                        direction={
                          sortConfig.key === "orderStatus"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("orderStatus")}
                        sx={{ ...headerTextSx, whiteSpace: "nowrap" }}
                      >
                        Trạng thái đơn hàng
                      </TableSortLabel>
                    </TableCell>

                    <TableCell
                      sx={{ width: "13%", py: 1.5, px: 2, textAlign: "center" }}
                    >
                      <TableSortLabel
                        active={sortConfig.key === "paymentStatus"}
                        direction={
                          sortConfig.key === "paymentStatus"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("paymentStatus")}
                        sx={{ ...headerTextSx, whiteSpace: "nowrap" }}
                      >
                        Trạng thái thanh toán
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ width: "12%", textAlign: "right" }}>
                      <TableSortLabel
                        active={sortConfig.key === "paidAmount"}
                        direction={
                          sortConfig.key === "paidAmount"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("paidAmount")}
                        sx={headerTextSx}
                      >
                        Đã trả
                      </TableSortLabel>
                    </TableCell>

                    <TableCell
                      sx={{ width: "15%", py: 1.5, textAlign: "right" }}
                    >
                      <TableSortLabel
                        active={sortConfig.key === "totalAmount"}
                        direction={
                          sortConfig.key === "totalAmount"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("totalAmount")}
                        sx={{ ...headerTextSx, whiteSpace: "nowrap" }}
                      >
                        Tổng đơn hàng
                      </TableSortLabel>
                    </TableCell>

                    <TableCell
                      sx={{ width: "16%", textAlign: "right", py: 1.5, px: 2 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 0.5,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            textTransform: "capitalize",
                            fontWeight: 600,
                            letterSpacing: "0.03em",
                          }}
                        >
                          Thao tác
                        </span>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedOrders.map((order, index) => {
                    const effectiveStatus = getEffectiveOrderStatus(
                      order.orderStatus,
                      order.paymentStatus,
                      order
                    );
                    const statusCode = getPaymentStatusCodeByContext(
                      order.paymentStatus,
                      effectiveStatus,
                      {
                        percent: order.depositPercent,
                        amount: order.depositAmount,
                      },
                      order
                    );
                    const labelFull = getPaymentStatusLabelByContext(
                      order.paymentStatus,
                      effectiveStatus,
                      {
                        percent: order.depositPercent,
                        amount: order.depositAmount,
                      },
                      order,
                      false
                    );
                    const labelShort = getPaymentStatusLabelByContext(
                      order.paymentStatus,
                      effectiveStatus,
                      {
                        percent: order.depositPercent,
                        amount: order.depositAmount,
                      },
                      order,
                      true
                    );
                    // Nút tạo yêu cầu xuất kho chỉ hiển thị khi:
                    // - Đơn đã được chấp thuận (status = 2)
                    // - Trạng thái thanh toán là: "Chờ thanh toán" (statusCode = 0 và không có deposit requirement) hoặc "Đã cọc" (statusCode = 1)
                    // - KHÔNG hiển thị khi là "Chờ cọc" (statusCode = 0 nhưng có deposit requirement)
                    const depositPercentValue =
                      order.depositPercent ?? order.DepositPercent ?? null;
                    const depositPercentNum =
                      toNumberOrNull(depositPercentValue);
                    const depositAmountValue =
                      toNumberOrNull(
                        order.depositAmount ?? order.DepositAmount ?? null
                      ) ?? 0;
                    const hasDepositRequirement =
                      (depositPercentNum !== null && depositPercentNum > 0) ||
                      depositAmountValue > 0;
                    const paidAmount =
                      toNumberOrNull(
                        order.paidAmount ?? order.PaidAmount ?? 0
                      ) ?? 0;

                    // "Chờ cọc" = statusCode = 0, có deposit requirement, và chưa thanh toán
                    const isWaitingDeposit =
                      statusCode === 0 &&
                      hasDepositRequirement &&
                      paidAmount === 0;

                    const canCreateExportRequest =
                      order.orderStatus === 2 && // Đơn đã chấp thuận
                      !isWaitingDeposit && // Không phải "Chờ cọc"
                      (statusCode === 0 || statusCode === 1); // Chờ thanh toán hoặc Đã cọc

                    return (
                      <TableRow
                        key={order.id}
                        hover
                        sx={{
                          "&:nth-of-type(even)": {
                            backgroundColor: "#f9f9f9",
                          },

                          "& td": {
                            py: 1.5,

                            px: 2,

                            verticalAlign: "middle",
                          },
                        }}
                      >
                        <TableCell sx={{ textAlign: "left" }}>
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>

                        <TableCell sx={{ fontWeight: 500 }}>
                          {order.code || "-"}
                        </TableCell>

                        <TableCell>{order.creator || "-"}</TableCell>

                        <TableCell>{formatDate(order.createdAt)}</TableCell>

                        <TableCell sx={{ textAlign: "center" }}>
                          {order.orderStatus !== undefined &&
                          order.orderStatus !== null ? (
                            <Chip
                              label={getOrderStatusLabel(
                                effectiveStatus,
                                false
                              )}
                              size="small"
                              sx={getOrderStatusColor(effectiveStatus)}
                            />
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        <TableCell sx={{ textAlign: "center" }}>
                          {order.orderStatus === 0 ||
                          order.orderStatus === 1 ||
                          order.orderStatus === 3 ? (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ textAlign: "center" }}
                            >
                              -
                            </Typography>
                          ) : order.paymentStatus !== undefined &&
                            order.paymentStatus !== null ? (
                            <Tooltip title={labelFull} arrow>
                              <Chip
                                label={labelShort}
                                size="small"
                                sx={getPaymentStatusColor(
                                  statusCode,
                                  effectiveStatus,
                                  order
                                )}
                              />
                            </Tooltip>
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {renderCurrency(order.paidAmount)}
                        </TableCell>

                        <TableCell sx={{ textAlign: "right" }}>
                          {renderCurrency(order.totalAmount)}
                        </TableCell>

                        <TableCell
                          sx={{ textAlign: "right", verticalAlign: "middle" }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              alignItems: "center",
                              justifyContent: "flex-end",
                              flexWrap: "nowrap",
                            }}
                          >
                            {canCreateExportRequest && (
                              <Tooltip
                                title="Tạo yêu cầu xuất kho từ đơn hàng này"
                                placement="bottom"
                                arrow
                              >
                                <IconButton
                                  size="medium"
                                  onClick={() =>
                                    navigate("/stock-export/create", {
                                      state: {
                                        preselectedSalesOrderId: order.id,
                                        preselectedSalesOrderCode: order.code,
                                      },
                                    })
                                  }
                                  sx={{
                                    color: "#1976d2",
                                    width: "40px",
                                    height: "40px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    "&:hover": {
                                      backgroundColor:
                                        "rgba(25, 118, 210, 0.1)",
                                    },
                                  }}
                                >
                                  <Inventory2Icon fontSize="medium" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {order.orderStatus === 1 && (
                              <>
                                <Tooltip
                                  title="Chấp thuận"
                                  placement="bottom"
                                  arrow
                                >
                                  <IconButton
                                    size="medium"
                                    onClick={() => handleApprove(order.id)}
                                    sx={{
                                      color: "#4caf50",

                                      width: "40px",

                                      height: "40px",

                                      display: "flex",

                                      alignItems: "center",

                                      justifyContent: "center",

                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(76, 175, 80, 0.1)",
                                      },
                                    }}
                                  >
                                    <TaskAltIcon fontSize="medium" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip
                                  title="Từ chối"
                                  placement="bottom"
                                  arrow
                                >
                                  <IconButton
                                    size="medium"
                                    onClick={() => handleReject(order.id)}
                                    sx={{
                                      color: "#d32f2f",

                                      width: "40px",

                                      height: "40px",

                                      display: "flex",

                                      alignItems: "center",

                                      justifyContent: "center",

                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(211, 47, 47, 0.1)",
                                      },
                                    }}
                                  >
                                    <HighlightOffIcon fontSize="medium" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}

                            <Tooltip
                              title="Xem chi tiết"
                              placement="bottom"
                              arrow
                            >
                              <IconButton
                                size="medium"
                                onClick={() => handleViewDetails(order.id)}
                                sx={{
                                  color: "#1976d2",

                                  width: "40px",

                                  height: "40px",

                                  display: "flex",

                                  alignItems: "center",

                                  justifyContent: "center",

                                  "&:hover": {
                                    backgroundColor: "rgba(25, 118, 210, 0.1)",
                                  },
                                }}
                              >
                                <VisibilityIcon fontSize="medium" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {sortedOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Chưa có đơn hàng nào
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {sortedOrders.length > 0 && (
                <Box
                  sx={{
                    pt: 2,

                    pb: 2,

                    borderTop: "1px solid #e0e0e0",

                    display: "flex",

                    justifyContent: "flex-end",

                    backgroundColor: "#fff",
                  }}
                >
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

      {/* Detail Dialog */}

      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div">
            Chi tiết đơn hàng
          </Typography>
        </DialogTitle>

        <DialogContent>
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : detailError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {detailError}
            </Alert>
          ) : !orderDetails ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Không có dữ liệu đơn hàng. Vui lòng thử lại.
            </Alert>
          ) : (
            <Box>
              {/* Thông tin đơn hàng - Layout 3 cột */}

              <Box sx={{ mb: 3, display: "flex", gap: 4 }}>
                {/* Phần 1 - Bên trái: Mã đơn hàng, Khách hàng, Trạng thái đơn hàng, Trạng thái thanh toán */}

                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã đơn hàng:
                    </Typography>

                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {orderDetails.code || "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Khách hàng:
                    </Typography>

                    <Typography variant="body1">
                      {orderDetails.customerName || orderDetails.creator || "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trạng thái đơn hàng:
                    </Typography>

                    {(() => {
                      const effectiveStatus = getEffectiveOrderStatus(
                        orderDetails.status,
                        orderDetails.paymentStatus,
                        orderDetails
                      );
                      return (
                        <Chip
                          label={getOrderStatusLabel(effectiveStatus, false)}
                          size="small"
                          sx={getOrderStatusColor(effectiveStatus)}
                        />
                      );
                    })()}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trạng thái thanh toán:
                    </Typography>
                    {(() => {
                      const statusValue = orderDetails.status;
                      const paymentValue = orderDetails.paymentStatus;

                      // Với Nháp, Đã gửi, Từ chối: không hiển thị trạng thái thanh toán
                      if (
                        statusValue === 0 ||
                        statusValue === 1 ||
                        statusValue === 3
                      ) {
                        return <Typography variant="body1">-</Typography>;
                      }

                      const effectiveStatus = getEffectiveOrderStatus(
                        statusValue,
                        paymentValue,
                        orderDetails
                      );
                      const statusCode = getPaymentStatusCodeByContext(
                        paymentValue,
                        effectiveStatus,
                        {
                          percent: orderDetails.depositPercent,
                          amount: orderDetails.depositAmount,
                        },
                        orderDetails
                      );
                      const label = getPaymentStatusLabelByContext(
                        paymentValue,
                        effectiveStatus,
                        {
                          percent: orderDetails.depositPercent,
                          amount: orderDetails.depositAmount,
                        },
                        orderDetails,
                        false
                      );
                      return (
                        <Chip
                          label={label}
                          size="small"
                          sx={getPaymentStatusColor(
                            statusCode,
                            effectiveStatus,
                            orderDetails
                          )}
                        />
                      );
                    })()}
                  </Box>
                </Box>

                {/* Phần 2 - Ở giữa: Ngày hết hạn đơn hàng, Cọc, Thời hạn hết hạn cọc */}

                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày hết hạn đơn hàng:
                    </Typography>

                    <Typography variant="body1">
                      {orderDetails.expiredDate
                        ? formatDate(orderDetails.expiredDate)
                        : "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Cọc (% đơn hàng):
                    </Typography>

                    <Typography variant="body1">
                      {(() => {
                        const value =
                          orderDetails.depositPercent !== undefined &&
                          orderDetails.depositPercent !== null
                            ? Number(orderDetails.depositPercent)
                            : 0;
                        return `${value}%`;
                      })()}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Thời hạn hết hạn cọc:
                    </Typography>

                    <Typography variant="body1">
                      {orderDetails.depositExpiredDate
                        ? formatDate(orderDetails.depositExpiredDate)
                        : "-"}
                    </Typography>
                  </Box>
                </Box>

                {/* Phần 3 - Bên phải: Số tiền đã cọc, Số tiền cần cọc, Tổng tiền đơn hàng */}

                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số tiền đã trả:
                    </Typography>

                    <Typography variant="body1">
                      {renderCurrency(orderDetails.paidAmount)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số tiền cần cọc:
                    </Typography>

                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {renderCurrency(getDepositAmountValue(orderDetails))}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số tiền sau cọc:
                    </Typography>

                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {renderCurrency(getAmountAfterDeposit(orderDetails))}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Danh sách sản phẩm */}

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Danh sách sản phẩm:
                </Typography>

                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ maxHeight: "500px", overflow: "auto" }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            width: "50px",
                            textAlign: "center",
                            backgroundColor: "#f5f5f5",
                            whiteSpace: "nowrap",
                          }}
                        >
                          #
                        </TableCell>

                        <TableCell
                          sx={{
                            backgroundColor: "#f5f5f5",
                            minWidth: "180px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Tên Sản Phẩm
                        </TableCell>

                        <TableCell
                          sx={{
                            textAlign: "center",
                            backgroundColor: "#f5f5f5",
                            minWidth: "80px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Đơn vị
                        </TableCell>

                        <TableCell
                          sx={{
                            textAlign: "center",
                            backgroundColor: "#f5f5f5",
                            minWidth: "120px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Ngày hết hạn
                        </TableCell>

                        <TableCell
                          sx={{
                            textAlign: "center",
                            backgroundColor: "#f5f5f5",
                            minWidth: "80px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Số lượng
                        </TableCell>

                        <TableCell
                          sx={{
                            textAlign: "right",
                            backgroundColor: "#f5f5f5",
                            minWidth: "140px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Đơn giá trước thuế
                        </TableCell>

                        <TableCell
                          sx={{
                            textAlign: "center",
                            backgroundColor: "#f5f5f5",
                            minWidth: "120px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Thuế
                        </TableCell>

                        <TableCell
                          sx={{
                            textAlign: "right",
                            backgroundColor: "#f5f5f5",
                            minWidth: "140px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Đơn giá sau thuế
                        </TableCell>

                        <TableCell
                          sx={{
                            textAlign: "right",
                            backgroundColor: "#f5f5f5",
                            minWidth: "150px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Thành tiền trước thuế
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            backgroundColor: "#f5f5f5",
                            minWidth: "170px",
                            whiteSpace: "nowrap",
                            pr: 2,
                            textAlign: "right",
                          }}
                        >
                          <Box
                            component="div"
                            sx={{
                              textAlign: "right",
                              width: "100%",
                              display: "block",
                            }}
                          >
                            Thành tiền sau thuế
                          </Box>
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {Array.isArray(orderDetails.details) &&
                      orderDetails.details.length > 0 ? (
                        orderDetails.details.map((detail, index) => {
                          const quantity =
                            detail.quantity ?? detail.Quantity ?? 0;

                          // Get lotId to find quotation match for unit
                          const lotId =
                            detail.lotId ??
                            detail.LotId ??
                            detail.lotID ??
                            detail.LotID ??
                            detail.Lot?.LotId ??
                            detail.lot?.LotId ??
                            null;
                          let quotationMatch = null;
                          if (
                            lotId !== null &&
                            orderDetails.quotationDetailsMap
                          ) {
                            quotationMatch =
                              orderDetails.quotationDetailsMap.get(
                                Number(lotId)
                              );
                          }

                          const unitName =
                            detail.unitName ??
                            detail.UnitName ??
                            detail.unit ??
                            detail.Unit ??
                            detail.productUnit ??
                            detail.ProductUnit ??
                            quotationMatch?.productUnit ??
                            detail.productUnitName ??
                            detail.ProductUnitName ??
                            detail.unitDisplay ??
                            detail.UnitDisplay ??
                            detail.unitText ??
                            detail.UnitText ??
                            detail.lotUnit ??
                            detail.LotUnit ??
                            detail.lot?.Unit ??
                            detail.Lot?.Unit ??
                            detail.lot?.unit ??
                            detail.Lot?.unit ??
                            detail.lot?.UnitName ??
                            detail.Lot?.UnitName ??
                            detail.lot?.unitName ??
                            detail.Lot?.unitName ??
                            detail.uomName ??
                            detail.UomName ??
                            "-";

                          const expiredDate =
                            detail.expiredDisplay ??
                            detail.expiredDate ??
                            detail.ExpiredDate ??
                            "-";

                          const unitPriceBeforeTax =
                            detail.unitPriceBeforeTax ??
                            detail.unitPrice ??
                            detail.UnitPrice ??
                            0;

                          const unitPriceAfterTax =
                            detail.unitPriceAfterTax ??
                            detail.UnitPriceAfterTax ??
                            unitPriceBeforeTax;

                          const subtotalBeforeTax =
                            detail.subtotalBeforeTax ??
                            detail.subtotal ??
                            detail.Subtotal ??
                            quantity * unitPriceBeforeTax;

                          const subtotalAfterTax =
                            detail.subtotalAfterTax ??
                            detail.SubtotalAfterTax ??
                            quantity * unitPriceAfterTax;

                          const taxText =
                            detail.taxText ?? detail.TaxText ?? "-";

                          return (
                            <TableRow
                              key={detail.id ?? detail.productId ?? index}
                            >
                              <TableCell sx={{ textAlign: "center" }}>
                                {index + 1}
                              </TableCell>

                              <TableCell>
                                {detail.productName ??
                                  detail.ProductName ??
                                  "-"}
                              </TableCell>

                              <TableCell sx={{ textAlign: "center" }}>
                                {unitName}
                              </TableCell>

                              <TableCell sx={{ textAlign: "center" }}>
                                {expiredDate}
                              </TableCell>

                              <TableCell sx={{ textAlign: "center" }}>
                                {quantity}
                              </TableCell>

                              <TableCell sx={{ textAlign: "right" }}>
                                {renderCurrency(unitPriceBeforeTax)}
                              </TableCell>

                              <TableCell sx={{ textAlign: "center" }}>
                                {taxText}
                              </TableCell>

                              <TableCell sx={{ textAlign: "right" }}>
                                {renderCurrency(unitPriceAfterTax)}
                              </TableCell>

                              <TableCell sx={{ textAlign: "right" }}>
                                {renderCurrency(subtotalBeforeTax)}
                              </TableCell>

                              <TableCell
                                align="right"
                                sx={{ whiteSpace: "nowrap", pr: 2 }}
                              >
                                <Box
                                  component="div"
                                  sx={{
                                    textAlign: "right",
                                    width: "100%",
                                    display: "block",
                                  }}
                                >
                                  {renderCurrency(subtotalAfterTax)}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              Không có sản phẩm
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Tổng tiền */}

              {orderDetails.details && orderDetails.details.length > 0 && (
                <Box sx={{ mb: 2, textAlign: "right" }}>
                  {(() => {
                    const totalBeforeTax = orderDetails.details.reduce(
                      (sum, detail) => {
                        return (
                          sum +
                          (detail.subtotalBeforeTax ??
                            detail.subtotal ??
                            detail.Subtotal ??
                            0)
                        );
                      },
                      0
                    );
                    const totalAfterTax = orderDetails.details.reduce(
                      (sum, detail) => {
                        return (
                          sum +
                          (detail.subtotalAfterTax ??
                            detail.SubtotalAfterTax ??
                            0)
                        );
                      },
                      0
                    );
                    const totalTax = Math.max(
                      totalAfterTax - totalBeforeTax,
                      0
                    );

                    return (
                      <>
                        <Typography
                          variant="body1"
                          sx={{
                            mb: 0.5,
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 1,
                          }}
                        >
                          <span>Tổng tiền trước thuế:</span>
                          {renderCurrency(totalBeforeTax)}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            mb: 0.5,
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 1,
                          }}
                        >
                          <span>Thuế:</span>
                          {renderCurrency(totalTax)}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 1,
                            alignItems: "baseline",
                          }}
                        >
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            Tổng tiền sau thuế:
                          </Box>
                          {renderCurrency(totalAfterTax, {
                            fontWeight: 700,
                            fontSize: "1.35rem",
                            unitFontWeight: 700,
                            unitFontSize: "1rem",
                          })}
                        </Typography>
                      </>
                    );
                  })()}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {canMarkNotComplete(orderDetails) && (
            <Button
              color="error"
              variant="contained"
              onClick={() => setNotCompleteConfirm(true)}
            >
              Không hoàn thành
            </Button>
          )}

          <Button onClick={handleCloseDetailDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={notCompleteConfirm}
        onClose={() => {
          setNotCompleteConfirm(false);
          setNotCompleteReason("");
          setReasonError(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle align="center">Xác nhận</DialogTitle>

        <DialogContent>
          <Typography align="center" sx={{ mb: 2 }}>
            Bạn chắc chắn muốn xác nhận đơn hàng này là{" "}
            <strong>không hoàn thành</strong>?
          </Typography>

          <TextField
            label="Lý do không hoàn thành"
            placeholder="Nhập lý do..."
            fullWidth
            multiline
            minRows={3}
            value={notCompleteReason}
            onChange={(e) => {
              setNotCompleteReason(e.target.value);
              if (e.target.value.trim()) setReasonError(false);
            }}
            error={reasonError}
            helperText={reasonError ? "Vui lòng nhập lý do" : ""}
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setNotCompleteConfirm(false);
              setNotCompleteReason("");
              setReasonError(false);
            }}
          >
            Hủy
          </Button>

          <Button
            color="error"
            variant="contained"
            disabled={marking}
            onClick={() => {
              if (!notCompleteReason.trim()) {
                setReasonError(true);
                return;
              }

              handleMarkNotComplete();
            }}
          >
            {marking ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={handleCloseRejectDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Từ chối đơn hàng</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Vui lòng nhập lý do từ chối để thông báo cho khách hàng.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Lý do từ chối"
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value);
              if (rejectError) setRejectError(null);
            }}
            error={Boolean(rejectError)}
            helperText={rejectError}
            disabled={rejectLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog} disabled={rejectLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirmReject}
            disabled={rejectLoading}
            variant="contained"
            sx={{
              backgroundColor: "#d32f2f",
              "&:hover": { backgroundColor: "#b71c1c" },
            }}
          >
            {rejectLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SalesOrderList;
