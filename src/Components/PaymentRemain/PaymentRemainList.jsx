import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
  Button,
  Stack,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Pagination,
  Autocomplete,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  TextField,
  Card,
  CardContent,
  InputAdornment,
} from "@mui/material";
import { Visibility, Payment as PaymentIcon, Search as SearchIcon } from "@mui/icons-material";
import paymentRemainAPI from "../../API/paymentRemainAPI";
import paymentAPI from "../../API/paymentAPI";
import userAPI from "../../API/userAPI";
import PaymentRemainDetail from "./PaymentRemainDetail";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken";

const PaymentRemainList = () => {
  const [fullList, setFullList] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [filters, setFilters] = useState({
    status: "",
    searchCode: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  // Helper function để lấy userId từ token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
      if (token.includes('.')) {
        const [, payload] = token.split('.');
        const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = b64 + "===".slice((b64.length + 3) % 4);
        const data = JSON.parse(atob(padded));
        return data.userId || data.id || data.sub || data.nameid || null;
      }
    } catch (e) {
      console.warn('[Auth] Failed to decode token payload', e);
    }
    return null;
  };

  // User info
  const [userRole, setUserRole] = useState(null);
  const [customerId, setCustomerId] = useState(null);

  // Lấy role và customerId nếu role là customer
  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);

    if (role === "customer") {
      // Lấy userId trực tiếp từ token (nhanh và đáng tin cậy hơn)
      const userId = getUserIdFromToken();
      if (userId) {
        setCustomerId(userId);
      } else {
        // Fallback: nếu không lấy được từ token thì gọi API
        userAPI
          .getProfile()
          .then((res) => {
            const profileData = res.data?.data || res.data;
            setCustomerId(profileData?.userId || profileData?.id || null);
          })
          .catch((err) => console.error("Lỗi lấy profile:", err));
      }
    }
  }, []);

  // Lấy danh sách từ API
  const getList = async () => {
    // Nếu là customer nhưng chưa có customerId thì không gọi API
    if (userRole === "customer" && !customerId) {
      return;
    }

    setLoading(true);
    try {
      // Chỉ gửi CustomerId nếu có giá trị (không gửi null/undefined)
      const params = {
        Page: 1,
        PageSize: 1000, // lấy nhiều dữ liệu để search trên FE
      };
      
      // Chỉ thêm CustomerId vào params nếu có giá trị
      if (userRole === "customer" && customerId) {
        params.CustomerId = customerId;
      }
      
      const res = await paymentRemainAPI.getList(params);
      const data = res.data?.data || [];

      // Chuẩn hóa dữ liệu và loại bỏ bản ghi trùng (theo invoiceCode/invoiceId/salesOrderCode/salesOrderId) cho customer
      const normalized = data.map((item) => {
        // PaymentMethod enum: None=0, VnPay=1, Cash=2, BankTransfer=3
        const paymentMethod = item.paymentMethod ?? item.PaymentMethod ?? null;
        const paymentMethodNum = paymentMethod !== null ? Number(paymentMethod) : null;
        
        return {
          ...item,
          invoiceCode: item.invoiceCode ?? item.InvoiceCode ?? "",
          salesOrderCode: item.salesOrderCode ?? item.SalesOrderCode ?? "",
          requestCreatedAt:
            item.requestCreatedAt ??
            item.RequestCreatedAt ??
            item.createdAt ??
            item.CreatedAt ??
            null,
          paymentDate:
            item.paymentDate ??
            item.PaymentDate ??
            item.paidAt ??
            item.PaidAt ??
            null,
          invoiceId: item.invoiceId ?? item.InvoiceId ?? null,
          salesOrderId: item.salesOrderId ?? item.SalesOrderId ?? null,
          paymentMethod: paymentMethodNum,
        };
      });

      // Dedupe theo invoiceCode/invoiceId/salesOrderCode/salesOrderId cho mọi role
      const map = new Map();
      // Hàm xếp hạng trạng thái để ưu tiên bản ghi đã thanh toán
      const rankStatus = (s) => {
        if (s === 1) return 2; // Success - Đã thanh toán
        if (s === 0) return 1; // Pending - Chưa thanh toán / Chờ xác nhận
        if (s === 2) return 0; // Failed - Thanh toán thất bại
        return 0;
      };

      normalized.forEach((item) => {
        const key =
          item.invoiceCode ||
          item.invoiceId ||
          item.salesOrderCode ||
          item.salesOrderId ||
          item.id;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, item);
          return;
        }

        const sNew =
          item.vnPayStatus ?? item.VnPayStatus ?? item.paymentStatus ?? -1;
        const sOld =
          existing.vnPayStatus ??
          existing.VnPayStatus ??
          existing.paymentStatus ??
          -1;
        const rNew = rankStatus(sNew);
        const rOld = rankStatus(sOld);

        // Ưu tiên bản ghi có trạng thái cao hơn (đã thanh toán > một phần > đặt cọc > chờ)
        if (rNew > rOld) {
          map.set(key, item);
          return;
        }

        // Nếu cùng hạng, ưu tiên bản ghi có paymentMethod = 3 (BankTransfer) - đã tạo request
        if (rNew === rOld) {
          const pmNew = item.paymentMethod ?? null;
          const pmOld = existing.paymentMethod ?? null;
          
          // Nếu bản ghi mới có paymentMethod = 3 (BankTransfer) và bản ghi cũ không có thì ưu tiên bản ghi mới
          if (pmNew === 3 && pmOld !== 3) {
            map.set(key, item);
            return;
          }
          // Nếu bản ghi cũ có paymentMethod = 3 và bản ghi mới không có thì giữ nguyên
          if (pmOld === 3 && pmNew !== 3) {
            return;
          }
          
          // Nếu cả 2 đều có paymentMethod = 3, ưu tiên bản ghi có thời gian request mới hơn
          if (pmNew === 3 && pmOld === 3) {
            const t1 = new Date(item.requestCreatedAt || 0).getTime();
            const t2 = new Date(existing.requestCreatedAt || 0).getTime();
            if (t1 > t2) {
              map.set(key, item);
            }
            return;
          }
          
          // Nếu cả 2 đều không có paymentMethod = 3, ưu tiên bản ghi có thời gian request mới hơn
          const t1 = new Date(item.requestCreatedAt || 0).getTime();
          const t2 = new Date(existing.requestCreatedAt || 0).getTime();
          if (t1 > t2) {
            map.set(key, item);
          }
        }
      });
      const deduped = Array.from(map.values());

      setFullList(deduped);
      setList(deduped);
      setTotalPages(Math.ceil(deduped.length / pageSize));
      setPage(1);
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Lỗi khi lấy danh sách";
      setSnack({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ gọi API khi userRole đã được set (không phải null)
    // Và nếu là customer thì phải có customerId
    if (userRole === null) {
      return; // Đợi userRole được set
    }
    
    // Nếu là customer nhưng chưa có customerId thì đợi
    if (userRole === "customer" && !customerId) {
      return;
    }
    
    // Gọi API khi:
    // - Role không phải customer (accountant có thể xem tất cả)
    // - HOẶC role là customer VÀ customerId đã được set
    getList();
  }, [customerId, userRole]);

  // Áp dụng filter trạng thái + search trên FE mỗi khi filters/fullList thay đổi
  useEffect(() => {
    let filtered = fullList;

    // Lọc theo trạng thái
    if (filters.status !== "") {
      const statusVal = Number(filters.status);
      filtered = filtered.filter(
        (item) =>
          (item.vnPayStatus ?? item.VnPayStatus ?? item.paymentStatus ?? -1) ===
          statusVal
      );
    }

    // Lọc theo mã đơn hàng / mã hóa đơn
    const keyword = (filters.searchCode || "").trim().toLowerCase();
    if (keyword) {
      filtered = filtered.filter((item) => {
        const invoice = (item.invoiceCode || "").toLowerCase();
        const order = (item.salesOrderCode || "").toLowerCase();
        return invoice.includes(keyword) || order.includes(keyword);
      });
    }

    setList(filtered);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
    setPage(1);
  }, [filters, fullList, pageSize]);


  // Hàm lấy màu cho trạng thái thanh toán (giống CustomerInvoiceList)
  const getPaymentStatusColor = (status, paymentMethod) => {
    // VNPayStatus enum: Pending=0, Success=1, Failed=2
    switch (status) {
      case 0: // Pending
        // Nếu paymentMethod = 3 (BankTransfer) thì là "Chờ xác nhận" (vàng nhạt)
        // Nếu không thì là "Chưa thanh toán" (cam)
        if (paymentMethod === 3) {
          return { backgroundColor: '#fff3cd', color: '#856404' }; // Vàng nhạt - Chờ xác nhận
        }
        return { backgroundColor: '#ff9800', color: '#fff' }; // Cam - Chưa thanh toán
      case 1: // Success - Đã thanh toán thành công
        return { backgroundColor: '#4caf50', color: '#fff' }; // Xanh lá - giống CustomerInvoiceList
      case 2: // Failed - Thanh toán thất bại
        return { backgroundColor: '#f44336', color: '#fff' }; // Đỏ
      default:
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    }
  };

  // Các hàm render
  const renderStatus = (vnPayStatus, paymentMethod) => {
    // VNPayStatus enum: Pending=0, Success=1, Failed=2
    // Nếu vnPayStatus = 0 (Pending) và paymentMethod = 3 (BankTransfer) thì là "Chờ xác nhận" (đã tạo request, đợi accountant duyệt)
    // Nếu vnPayStatus = 0 (Pending) và không phải BankTransfer thì là "Chưa thanh toán"
    let label = 'Không xác định';
    
    if (vnPayStatus === 0) {
      // Pending
      label = paymentMethod === 3 ? 'Chờ xác nhận' : 'Chưa thanh toán'; // 3 = BankTransfer
    } else if (vnPayStatus === 1) {
      // Success
      label = 'Đã thanh toán';
    } else if (vnPayStatus === 2) {
      // Failed
      label = 'Thanh toán thất bại';
    }
    
    return (
      <Chip
        label={label}
        size="small"
        sx={getPaymentStatusColor(vnPayStatus, paymentMethod)}
      />
    );
  };

  // Format date DD/MM/YYYY
  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Format currency with "đ" gạch chân (giống màn hóa đơn)
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    const formatted = new Intl.NumberFormat('vi-VN')
      .format(amount)
      .replace(/\./g, ',');
    return (
      <Box
        component="span"
        sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5 }}
      >
        <Box component="span">{formatted}</Box>
        <Box component="span" sx={{ textDecoration: 'underline' }}>
          đ
        </Box>
      </Box>
    );
  };

  // Init VNPay for Invoice
  const initVnPayInvoice = useCallback(
    async (invoiceId, amount) => {
      if (!invoiceId) {
        setVnPayInitData(null);
        setVnPayInitError('Không tìm thấy mã hóa đơn để khởi tạo thanh toán.');
        return;
      }
      setVnPayInitLoading(true);
      setVnPayInitError('');
      setVnPayInitData(null);
      try {
        const payload = {
          amount: amount || null,
          locale: 'vn',
        };
        const response = await paymentRemainAPI.initVnPayForInvoice(invoiceId, payload);
        const result = response.data;
        const data = result?.data ?? {};
        const normalized = {
          paymentUrl: data.paymentUrl ?? data.PaymentUrl ?? '',
          qrBase64: data.qrBase64 ?? data.QrBase64 ?? '',
          amount: data.amount ?? data.Amount ?? amount ?? null,
          txnRef: data.txnRef ?? data.TxnRef ?? '',
        };
        setVnPayInitData(normalized);
        if (!normalized.paymentUrl) {
          setVnPayInitError('Không nhận được link thanh toán từ VNPay.');
        }
      } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.Message || 'Không thể khởi tạo thanh toán VNPay.';
        setVnPayInitError(message);
        setSnack({
          open: true,
          message,
          severity: "error",
        });
      } finally {
        setVnPayInitLoading(false);
      }
    },
    [],
  );

  // Handle payment invoice
  const handlePaymentInvoice = async (item) => {
    setPaymentDialogOpen(true);
    setPaymentLoading(true);
    setPaymentInvoiceDetails(null);
    setVnPayInitData(null);
    setVnPayInitError('');
    setVnPayInitLoading(false);
    setRedirectingPayment(false);
    setSelectedPaymentMethod('vnpay');
    
    try {
      // Lấy chi tiết payment remain để có thông tin invoice
      const res = await paymentRemainAPI.getDetail(item.id);
      const detail = res.data?.data;
      
      if (!detail || !detail.invoiceId) {
        setSnack({
          open: true,
          message: "Không tìm thấy thông tin hóa đơn",
          severity: "error",
        });
        setPaymentLoading(false);
        return;
      }

      // Tính toán thông tin hóa đơn từ detail
      const invoiceDetails = {
        id: detail.invoiceId,
        invoiceCode: detail.invoiceCode || '-',
        totalAmount: detail.salesOrderTotalPrice || 0,
        totalPaid: detail.salesOrderPaidAmount || 0,
        totalRemain: detail.amount || 0,
        status: detail.vnPayStatus,
        createdAt: detail.requestCreatedAt,
        orderCode: detail.salesOrderCode || detail.salesOrderId,
      };
      setPaymentInvoiceDetails(invoiceDetails);

      // Nếu còn tiền cần thanh toán và phương thức hiện tại là VNPay thì tự động khởi tạo phiên thanh toán VNPay
      const remainingAmount = invoiceDetails.totalRemain ?? 0;
      if (remainingAmount > 0 && selectedPaymentMethod === 'vnpay') {
        await initVnPayInvoice(invoiceDetails.id, remainingAmount);
      } else if (remainingAmount <= 0) {
        setVnPayInitError('Hóa đơn này không còn số tiền cần thanh toán.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải thông tin hóa đơn';
      setSnack({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleClosePaymentDialog = () => {
    if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
      paymentWindowRef.current.close();
    }
    setPaymentDialogOpen(false);
    setPaymentInvoiceDetails(null);
    setVnPayInitData(null);
    setVnPayInitError('');
    setSelectedPaymentMethod('vnpay');
  };

  const handlePaymentMethodChange = async (method) => {
    setSelectedPaymentMethod(method);
    setVnPayInitData(null);
    setVnPayInitError('');
    
    if (method === 'vnpay' && paymentInvoiceDetails?.id) {
      const remainingAmount = paymentInvoiceDetails.totalRemain ?? 0;
      await initVnPayInvoice(paymentInvoiceDetails.id, remainingAmount);
    }
  };

  const handleVnPayCheckout = () => {
    if (redirectingPayment || vnPayInitLoading) {
      return;
    }
    if (!vnPayInitData?.paymentUrl) {
      const message = vnPayInitError || 'Không tìm thấy link thanh toán VNPay.';
      setSnack({
        open: true,
        message,
        severity: "error",
      });
      return;
    }
    setRedirectingPayment(true);
    paymentWindowRef.current = window.open(vnPayInitData.paymentUrl, '_blank', 'noopener,noreferrer');
    
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'VNPAY_PAYMENT_SUCCESS') {
        if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
          paymentWindowRef.current.close();
        }
        getList();
        setPaymentDialogOpen(false);
        setSnack({
          open: true,
          message: 'Thanh toán thành công!',
          severity: "success",
        });
        window.removeEventListener('message', handleMessage);
        setRedirectingPayment(false);
      } else if (event.data && event.data.type === 'VNPAY_PAYMENT_FAILED') {
        if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
          paymentWindowRef.current.close();
        }
        setSnack({
          open: true,
          message: event.data.message || 'Thanh toán thất bại.',
          severity: "error",
        });
        window.removeEventListener('message', handleMessage);
        setRedirectingPayment(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    const checkInterval = setInterval(() => {
      if (paymentWindowRef.current && paymentWindowRef.current.closed) {
        clearInterval(checkInterval);
        window.removeEventListener('message', handleMessage);
        setTimeout(() => {
          getList();
          setPaymentDialogOpen(false);
        setRedirectingPayment(false);
        setSnack({
          open: true,
          message: 'Đã đóng cổng thanh toán. Vui lòng kiểm tra lại trạng thái thanh toán.',
          severity: "info",
        });
      }, 2000);
      }
    }, 1000);
    
    setTimeout(() => {
      clearInterval(checkInterval);
      window.removeEventListener('message', handleMessage);
      setRedirectingPayment(false);
    }, 600000);
  };

  const handleConfirmPayment = async () => {
    if (selectedPaymentMethod === 'vnpay') {
      handleVnPayCheckout();
      return;
    }

    if (!paymentInvoiceDetails?.id) {
      setSnack({
        open: true,
        message: 'Không tìm thấy thông tin hóa đơn để xác nhận thanh toán.',
        severity: "error",
      });
      return;
    }

    try {
      setPaymentLoading(true);
      // Tạo bank transfer check request
      const payload = {
        amount: null, // null = thanh toán hết phần còn lại
        customerNote: null,
      };
      const response = await paymentRemainAPI.createBankTransferCheckRequest(paymentInvoiceDetails.id, payload);
      
      setSnack({
        open: true,
        message: 'Vui lòng thanh toán theo hướng dẫn: Chuyển khoản đến tài khoản 4619300024210402 - chủ sở hữu NGUYEN QUANG TRUNG - Ngân hàng Timo. Sau khi thanh toán thành công, vui lòng chờ nhân viên xác nhận hoặc liên hệ 0398233047.',
        severity: "success",
      });
      setPaymentDialogOpen(false);
      
      // Đợi backend commit xong trước khi refresh (tăng delay để đảm bảo)
      // Refresh nhiều lần để đảm bảo lấy được paymentMethod = 3
      setTimeout(() => {
        getList(); // Refresh lần 1
      }, 500);
      
      setTimeout(() => {
        getList(); // Refresh lần 2 để đảm bảo
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tạo yêu cầu thanh toán';
      setSnack({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePay = async (item) => {
    try {
      // Lấy chi tiết payment remain để có thông tin invoiceId
      const res = await paymentRemainAPI.getDetail(item.id);
      const detail = res.data?.data;
      
      if (!detail || !detail.invoiceId) {
        setSnack({
          open: true,
          message: "Không tìm thấy thông tin hóa đơn",
          severity: "error",
        });
        return;
      }

      // Sử dụng API như trong ảnh: POST /api/PaymentRemain/invoices/{invoiceId}/vnpay/init
      const payload = {
        amount: detail.amount || null, // null = thanh toán hết phần còn lại
        locale: "vn",
      };
      
      const initRes = await paymentRemainAPI.initVnPayForInvoice(detail.invoiceId, payload);
      const result = initRes.data;
      const data = result?.data ?? {};
      const paymentUrl = data.paymentUrl ?? data.PaymentUrl ?? '';
      
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        setSnack({
          open: true,
          message: result?.message || "Không nhận được link thanh toán từ VNPay.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error(error);
      setSnack({
        open: true,
        message: error.response?.data?.message || error.response?.data?.Message || "Lỗi khi tạo link thanh toán",
        severity: "error",
      });
    }
  };

  const handleSnackClose = () => setSnack({ ...snack, open: false });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  
  // Payment Invoice Dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInvoiceDetails, setPaymentInvoiceDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [vnPayInitData, setVnPayInitData] = useState(null);
  const [vnPayInitError, setVnPayInitError] = useState('');
  const [vnPayInitLoading, setVnPayInitLoading] = useState(false);
  const [redirectingPayment, setRedirectingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('vnpay');
  const paymentWindowRef = useRef(null);

  // Tính toán remainingAmount và paymentButtonDisabled sau khi state đã được khai báo
  const remainingAmount = paymentInvoiceDetails?.totalRemain ?? 0;
  const paymentButtonDisabled =
    redirectingPayment ||
    vnPayInitLoading ||
    !paymentInvoiceDetails ||
    (selectedPaymentMethod === 'vnpay' && !vnPayInitData?.paymentUrl) ||
    remainingAmount <= 0;

  const handleViewDetail = async (item) => {
    try {
      const res = await paymentRemainAPI.getDetail(item.id);
      setDetailData(res.data.data);
      setDetailOpen(true);
    } catch (error) {
      console.error(error);
      setSnack({
        open: true,
        message: "Lỗi khi lấy chi tiết",
        severity: "error",
      });
    }
  };
  const handleDetailClose = () => {
    setDetailOpen(false);
    setDetailData(null);
  };

  // Sort list by createdAt (newest first) before pagination
  const sortedList = React.useMemo(() => {
    return [...list].sort((a, b) => {
      const dateA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : a.CreatedAt
        ? new Date(a.CreatedAt).getTime()
        : 0;
      const dateB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : b.CreatedAt
        ? new Date(b.CreatedAt).getTime()
        : 0;
      return dateB - dateA; // Mới nhất trước
    });
  }, [list]);

  // Pagination FE
  const paginatedList = sortedList.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const headerTextSx = {
    textTransform: 'capitalize',
    fontWeight: 600,
    letterSpacing: '0.03em',
  };

  // Render UI khác nhau cho accountant và customer
  const isAccountant = userRole === "accountant_staff";

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      {isAccountant ? (
        // Giao diện cho accountant (giống InvoiceList)
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <PaymentIcon sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
              >
                Yêu cầu thanh toán
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {list.length === fullList.length
                  ? `Tổng: ${fullList.length} yêu cầu`
                  : `Tổng: ${list.length} / ${fullList.length} yêu cầu`}
              </Typography>
            </Box>

            {/* FILTER */}
            <Paper
              sx={{ p: 2, mb: 2, backgroundColor: "#f8fafc", borderRadius: 2 }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems="center"
                spacing={2}
                justifyContent="space-between"
                sx={{ width: "100%" }}
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
                  <TextField
                    placeholder="Tìm kiếm..."
                    size="small"
                    value={filters.searchCode}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, searchCode: e.target.value }))
                    }
                    sx={{
                      maxWidth: { xs: "100%", md: 300 },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={filters.status === "" ? "all" : String(filters.status)}
                      label="Trạng thái"
                      onChange={(e) => {
                        const val = e.target.value === "all" ? "" : Number(e.target.value);
                        setFilters((prev) => ({ ...prev, status: val }));
                      }}
                    >
                      <MenuItem value="all">Tất cả</MenuItem>
                      <MenuItem value={0}>Chưa thanh toán</MenuItem>
                      <MenuItem value={3}>Đã thanh toán</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
            </Paper>

            {/* Table cho accountant */}
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Mã hóa đơn</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Mã đơn hàng</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ngày yêu cầu</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ngày thanh toán</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Số tiền</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : paginatedList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Chưa có yêu cầu thanh toán nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedList.map((item, index) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                        <TableCell>{item.invoiceCode}</TableCell>
                        <TableCell>{item.salesOrderCode || item.salesOrderId}</TableCell>
                        <TableCell>{formatDate(item.requestCreatedAt)}</TableCell>
                        <TableCell>{formatDate(item.paymentDate)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                        <TableCell>{renderStatus(item.vnPayStatus, item.paymentMethod)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Xem chi tiết">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleViewDetail(item)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {paginatedList.length > 0 && totalPages >= 2 && (
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
          </CardContent>
        </Card>
      ) : (
        // Giao diện cho customer (giữ nguyên)
        <>
          {/* Title */}
          <Box sx={{ mb: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
            <Typography
              variant="h4"
              component="h1"
              className="payment-remain-list-title"
              sx={{
                fontWeight: 'bold',
                color: '#155E64',
                mb: 2,
              }}
            >
              Danh sách yêu cầu thanh toán
            </Typography>
          </Box>

          {/* Filter + List in one Paper */}
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderRadius: 2,
              boxShadow: 2,
              mb: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            {/* Filter */}
            <Box
              className="payment-remain-filter-container"
              sx={{
                mb: 2,
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="status-filter-label">Lọc theo trạng thái</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={filters.status === "" ? "all" : String(filters.status)}
                  label="Lọc theo trạng thái"
                  onChange={(e) => {
                    const val = e.target.value === "all" ? "" : Number(e.target.value);
                    setFilters((prev) => ({ ...prev, status: val }));
                  }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value={0}>Chờ thanh toán</MenuItem>
                  <MenuItem value={3}>Đã thanh toán</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Tìm theo mã hóa đơn/ mã đơn hàng"
                placeholder="Nhập mã hóa đơn hoặc mã đơn hàng..."
                value={filters.searchCode}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, searchCode: e.target.value }))
                }
                sx={{
                  minWidth: 220,
                  maxWidth: 220,
                  '& .MuiInputBase-root': {
                    width: 220,
                  },
                }}
              />
            </Box>

            {/* Loading */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Table */}
            {!loading && (
              <div className="payment-remain-list-container">
                <TableContainer
                  sx={{
                    borderRadius: 2,
                    overflowX: 'auto',
                  }}
                >
                  <Table className="payment-remain-list-table" sx={{ tableLayout: 'fixed', minWidth: 1000 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell
                          sx={{
                            width: '8%',
                            py: 1.5,
                            px: 2,
                            textAlign: 'left',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            letterSpacing: '0.03em',
                          }}
                        >
                          #
                        </TableCell>
                        <TableCell sx={{ width: '18%', py: 1.5, px: 2, ...headerTextSx }}>
                          Mã hóa đơn
                        </TableCell>
                        <TableCell sx={{ width: '15%', py: 1.5, px: 2, ...headerTextSx }}>
                          Mã đơn hàng
                        </TableCell>
                        <TableCell sx={{ width: '12%', py: 1.5, px: 2, ...headerTextSx }}>
                          Ngày yêu cầu
                        </TableCell>
                        <TableCell sx={{ width: '12%', py: 1.5, px: 2, ...headerTextSx }}>
                          Ngày thanh toán
                        </TableCell>
                        <TableCell sx={{ width: '15%', py: 1.5, px: 2, textAlign: 'right', ...headerTextSx }}>
                          Số tiền
                        </TableCell>
                        <TableCell sx={{ width: '12%', py: 1.5, px: 2, ...headerTextSx }}>
                          Trạng thái
                        </TableCell>
                        <TableCell sx={{ width: '9%', py: 1.5, px: 2, textAlign: 'right', ...headerTextSx }}>
                          Thao tác
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              Chưa có yêu cầu thanh toán nào.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedList.map((item, index) => (
                          <TableRow
                            key={item.id}
                            hover
                            sx={{
                              '&:nth-of-type(even)': {
                                backgroundColor: '#f9f9f9',
                              },
                              '& td': {
                                py: 1.5,
                                px: 2,
                                verticalAlign: 'middle',
                              }
                            }}
                          >
                            <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                            <TableCell>{item.invoiceCode}</TableCell>
                            <TableCell>
                              {item.salesOrderCode || item.salesOrderId}
                            </TableCell>
                            <TableCell>{formatDate(item.requestCreatedAt)}</TableCell>
                            <TableCell>{formatDate(item.paymentDate)}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.amount)}
                            </TableCell>
                            <TableCell>
                              {renderStatus(item.vnPayStatus, item.paymentMethod)}
                            </TableCell>
                            <TableCell align="right">
                              <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="flex-end"
                              >
                                {userRole === "customer" && item.vnPayStatus === 0 && (
                                  <Tooltip title="Thanh toán hóa đơn">
                                    <span>
                                      <IconButton
                                        color="success"
                                        onClick={() => handlePaymentInvoice(item)}
                                        disabled={loading}
                                      >
                                        <PaymentIcon />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                )}
                                <Tooltip title="Xem chi tiết">
                                  <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => handleViewDetail(item)}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {paginatedList.length > 0 && totalPages > 1 && (
                    <Box
                      sx={{
                        pt: 2,
                        pb: 2,
                        borderTop: '1px solid #e0e0e0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        backgroundColor: '#fff',
                      }}
                    >
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        color="primary"
                        siblingCount={1}
                        boundaryCount={2}
                      />
                    </Box>
                  )}
                </TableContainer>
              </div>
            )}
          </Paper>
        </>
      )}

      {/* Detail Dialog */}
      <PaymentRemainDetail
        open={detailOpen}
        onClose={handleDetailClose}
        data={detailData}
      />

      {/* Payment Invoice Dialog */}
      <Dialog
        className="customer-invoice-payment-dialog"
        open={paymentDialogOpen}
        onClose={handleClosePaymentDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="customer-invoice-payment-dialog-title" sx={{ textAlign: 'left', fontWeight: 600, fontSize: '1.25rem' }}>
          Thanh Toán Hóa Đơn
        </DialogTitle>
        <DialogContent className="customer-invoice-payment-dialog-content">
          {paymentLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : paymentInvoiceDetails ? (
            <Box>
              {/* Thông tin hóa đơn - Layout 2 cột */}
              <Box className="customer-invoice-payment-info-layout" sx={{ display: 'flex', gap: 4 }}>
                {/* Cột trái */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã hóa đơn:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {paymentInvoiceDetails.invoiceCode || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tổng Trị Giá Hóa Đơn:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(paymentInvoiceDetails.totalAmount)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Đã Thanh Toán:
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(paymentInvoiceDetails.totalPaid)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số Tiền Cần Thanh Toán:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(paymentInvoiceDetails.totalRemain)}
                    </Typography>
                  </Box>
                </Box>

                {/* Cột phải */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Phương thức thanh toán:
                    </Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel>Chọn phương thức thanh toán</InputLabel>
                      <Select
                        value={selectedPaymentMethod}
                        label="Chọn phương thức thanh toán"
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      >
                        <MenuItem value="vnpay">VNPay</MenuItem>
                        <MenuItem value="manual">Chuyển khoản / Tiền mặt</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ minHeight: 320, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedPaymentMethod === 'vnpay' ? (
                      <>
                        {vnPayInitLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                            <CircularProgress />
                          </Box>
                        ) : vnPayInitError ? (
                          <Alert severity="warning">{vnPayInitError}</Alert>
                        ) : (
                          <>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {formatCurrency(vnPayInitData?.amount ?? paymentInvoiceDetails.totalRemain)}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" textAlign="center">
                              Nhấn nút thanh toán để chuyển đến cổng VNPay
                            </Typography>
                          </>
                        )}
                      </>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                        <Alert severity="info">
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                            Thanh toán bằng Chuyển khoản / Tiền mặt
                          </Typography>
                          <Typography variant="body2">
                            Vui lòng chuyển khoản số tiền{' '}
                            <strong>{formatCurrency(paymentInvoiceDetails.totalRemain)}</strong> đến tài khoản{' '}
                            <strong>4619300024210402</strong> - chủ sở hữu <strong>NGUYEN QUANG TRUNG</strong> - Ngân hàng <strong>Timo</strong>.
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Sau khi thanh toán thành công, vui lòng chờ nhân viên để xác nhận thanh toán hoặc liên hệ với nhân viên qua số điện thoại <strong>0398233047</strong>.
                          </Typography>
                        </Alert>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Alert severity="error">Không thể tải thông tin hóa đơn.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClosePaymentDialog} disabled={redirectingPayment}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirmPayment}
            variant="contained"
            color="primary"
            disabled={paymentButtonDisabled}
            startIcon={redirectingPayment ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {redirectingPayment 
              ? 'Đang chuyển hướng...' 
              : selectedPaymentMethod === 'vnpay' 
                ? 'Thanh toán VNPay' 
                : 'Xác nhận thanh toán'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snack.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PaymentRemainList;
