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
} from "@mui/material";
import { Visibility, Payment as PaymentIcon } from "@mui/icons-material";
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
      setFullList(data);
      setList(data);
      setTotalPages(Math.ceil(data.length / pageSize));
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


  // Hàm lấy màu cho trạng thái thanh toán (giống CustomerOrderList)
  const getPaymentStatusColor = (status) => {
    // VNPayStatus enum: NotPaymentYet=0, Deposited=1, PartiallyPaid=2, Paid=3, Refunded=4
    switch (status) {
      case 0: // Chờ thanh toán (NotPaymentYet)
        return { backgroundColor: '#fff3cd', color: '#856404' };
      case 1: // Đã đặt cọc (Deposited)
        return { backgroundColor: '#9c27b0', color: '#ffffff' };
      case 2: // Đã thanh toán 1 phần (PartiallyPaid)
        return { backgroundColor: '#fff9c4', color: '#f57f17' };
      case 3: // Đã thanh toán toàn bộ (Paid)
        return { backgroundColor: '#c8e6c9', color: '#1b5e20' };
      case 4: // Đã hoàn tiền (Refunded)
        return { backgroundColor: '#f8bbd0', color: '#880e4f' };
      default:
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    }
  };

  // Các hàm render
  const renderStatus = (vnPayStatus) => {
    const statusLabels = {
      0: 'Chờ thanh toán',
      1: 'Đã đặt cọc',
      2: 'Thanh toán một phần',
      3: 'Đã thanh toán',
      4: 'Đã hoàn tiền',
    };
    
    return (
      <Chip
        label={statusLabels[vnPayStatus] || 'Không xác định'}
        size="small"
        sx={getPaymentStatusColor(vnPayStatus)}
      />
    );
  };

  const renderPaymentMethod = (m) => {
    switch (m) {
      case 0:
        return "-";
      case 1:
        return "VnPay";
      case 2:
        return "Tiền mặt";
      case 3:
        return "Chuyển khoản ngân hàng";
      default:
        return "Không xác định";
    }
  };

  const renderPaymentType = (t) => {
    switch (t) {
      case 1:
        return "Thanh toán còn lại";
      case 0:
        return "Thanh toán toàn bộ";
      default:
        return "Không xác định";
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    const formatted = new Intl.NumberFormat('vi-VN')
      .format(amount)
      .replace(/\./g, ',');
    return `${formatted} ₫`;
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
    } else {
      const methodName = selectedPaymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt';
      setSnack({
        open: true,
        message: `Vui lòng liên hệ với nhân viên để xác nhận thanh toán bằng ${methodName}.`,
        severity: "info",
      });
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
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.03em',
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
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

      {/* Filter */}
      <Box className="payment-remain-filter-container" sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="status-filter-label">Lọc theo trạng thái</InputLabel>
          <Select
            labelId="status-filter-label"
            value={filters.status === "" ? "all" : String(filters.status)}
            label="Lọc theo trạng thái"
            onChange={(e) => {
              const val = e.target.value === "all" ? "" : Number(e.target.value);
              setFilters({ ...filters, status: val });

              let filtered = fullList;

              if (val !== "") {
                filtered = filtered.filter((item) => item.vnPayStatus === val);
              }

              setList(filtered);
              setTotalPages(Math.ceil(filtered.length / pageSize));
              setPage(1);
            }}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value={0}>Chờ thanh toán</MenuItem>
            <MenuItem value={1}>Đã đặt cọc</MenuItem>
            <MenuItem value={2}>Thanh toán một phần</MenuItem>
            <MenuItem value={3}>Đã thanh toán</MenuItem>
            <MenuItem value={4}>Hoàn tiền</MenuItem>
          </Select>
        </FormControl>
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
            component={Paper} 
            sx={{ 
              boxShadow: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    STT
                  </TableCell>
                  <TableCell sx={{ width: '15%', py: 1.5, px: 2, ...headerTextSx }}>
                    Mã đơn hàng
                  </TableCell>
                  <TableCell sx={{ width: '18%', py: 1.5, px: 2, ...headerTextSx }}>
                    Mã hóa đơn
                  </TableCell>
                  <TableCell sx={{ width: '15%', py: 1.5, px: 2, ...headerTextSx }}>
                    Loại thanh toán
                  </TableCell>
                  <TableCell sx={{ width: '12%', py: 1.5, px: 2, textAlign: 'center', ...headerTextSx }}>
                    Phương thức
                  </TableCell>
                  <TableCell sx={{ width: '12%', py: 1.5, px: 2, textAlign: 'right', ...headerTextSx }}>
                    Số tiền
                  </TableCell>
                  <TableCell sx={{ width: '12%', py: 1.5, px: 2, ...headerTextSx }}>
                    Trạng thái
                  </TableCell>
                  <TableCell sx={{ width: '12%', py: 1.5, px: 2, ...headerTextSx }}>
                    Ngày yêu cầu
                  </TableCell>
                  <TableCell sx={{ width: '10%', py: 1.5, px: 2, textAlign: 'right', ...headerTextSx }}>
                    Hành động
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 3 }}>
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
                      <TableCell>
                        {item.salesOrderCode || item.salesOrderId}
                      </TableCell>
                      <TableCell>{item.invoiceCode}</TableCell>
                      <TableCell>
                        {renderPaymentType(item.paymentType)}
                      </TableCell>
                      <TableCell align="center">
                        {renderPaymentMethod(item.paymentMethod)}
                      </TableCell>
                      <TableCell align="right">
                        {item.amount.toLocaleString()} ₫
                      </TableCell>
                      <TableCell>
                        {renderStatus(item.vnPayStatus)}
                      </TableCell>
                      <TableCell>
                        {item.requestCreatedAt
                          ? new Date(
                              item.requestCreatedAt
                            ).toLocaleDateString("vi-VN")
                          : "-"}
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
                        <MenuItem value="transfer">Chuyển khoản</MenuItem>
                        <MenuItem value="cash">Tiền mặt</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ minHeight: 200, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    ) : selectedPaymentMethod === 'transfer' ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                        <Alert severity="info">
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                            Thanh toán bằng Chuyển khoản
                          </Typography>
                          <Typography variant="body2">
                            Vui lòng chuyển khoản số tiền{' '}
                            <strong>{formatCurrency(paymentInvoiceDetails.totalRemain)}</strong> đến tài khoản của chúng tôi.
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Sau khi chuyển khoản, vui lòng liên hệ với nhân viên để xác nhận thanh toán.
                          </Typography>
                        </Alert>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                        <Alert severity="info">
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                            Thanh toán bằng Tiền mặt
                          </Typography>
                          <Typography variant="body2">
                            Số tiền cần thanh toán: <strong>{formatCurrency(paymentInvoiceDetails.totalRemain)}</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Vui lòng liên hệ với nhân viên để thực hiện thanh toán bằng tiền mặt.
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
                ? 'THANH TOÁN VNPAY' 
                : selectedPaymentMethod === 'transfer'
                  ? 'Xác nhận Chuyển khoản'
                  : 'Xác nhận Tiền mặt'}
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
