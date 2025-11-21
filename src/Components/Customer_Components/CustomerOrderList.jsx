import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Pagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import salesOrderAPI from '../../API/salesOrderAPI';

const headerTextSx = {
  textTransform: 'uppercase',
  fontWeight: 600,
  letterSpacing: '0.03em',
};

const CustomerOrderList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentOrderDetails, setPaymentOrderDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('VietQR');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const applyStatusFilter = useCallback(
    (data) => {
      if (statusFilter === 'all') return data;
      const filterStatus = Number(statusFilter);
      return data.filter((order) => order.status === filterStatus);
    },
    [statusFilter],
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await salesOrderAPI.myListSalesOrder();
      // Backend trả về: { success, message, data }
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Map dữ liệu từ API response sang format component
        // Backend trả về PascalCase (SalesOrderId, SalesOrderCode, etc.)
        const mappedOrders = response.data.data.map((order) => ({
          id: order.SalesOrderId || order.salesOrderId,
          quotationCode: order.SalesOrderCode || order.salesOrderCode,
          status: order.Status !== undefined ? order.Status : order.status, // 0=Draft, 1=Send, 2=Approved, 3=Rejected, 4=Deposited, 5=Paid, 6=Complete
          createdAt: order.CreateAt || order.createAt,
          totalAmount: order.TotalPrice || order.totalPrice,
          paidAmount: order.PaidAmount ?? order.paidAmount ?? 0, // Tiền đã trả
        }));
        setAllOrders(mappedOrders);
        setOrders(applyStatusFilter(mappedOrders));
      } else {
        setAllOrders([]);
        setOrders([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách đơn hàng';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      setAllOrders([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [applyStatusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-open order details if orderId is in location state
  useEffect(() => {
    if (location.state?.openOrderId) {
      const orderId = location.state.openOrderId;
      // Clear state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
      // Navigate to order details after a short delay to ensure orders are loaded
      setTimeout(() => {
        // Navigate to orders list (edit page removed)
        navigate('/customer/orders', { replace: true });
      }, 300);
    }
  }, [location.state, navigate]);

  useEffect(() => {
    setOrders(applyStatusFilter(allOrders));
  }, [applyStatusFilter, allOrders]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 0: // Draft
        return 'Nháp';
      case 1: // Send
        return 'Đã Gửi';
      case 2: // Approved
        return 'Đã Chấp Thuận';
      case 3: // Rejected
        return 'Đã Từ Chối';
      case 4: // Deposited
        return 'Đã Cọc';
      case 5: // Paid
        return 'Đã Thanh Toán';
      case 6: // Complete
        return 'Đã Hoàn Thành';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0: // Draft
        return 'default';
      case 1: // Send
        return 'info';
      case 2: // Approved
        return 'warning';
      case 3: // Rejected
        return 'error';
      case 4: // Deposited
        return 'secondary';
      case 5: // Paid
        return 'success';
      case 6: // Complete
        return 'primary';
      default:
        return 'default';
    }
  };

  const handleEdit = (orderId) => {
    // Navigate to edit page
    // Edit page removed, navigate to orders list
    navigate('/customer/orders');
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      return;
    }
    try {
      await salesOrderAPI.deleteOrder(orderId);
      setSnackbarMessage('Xóa đơn hàng thành công!');
      setSnackbarOpen(true);
      fetchOrders();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể xóa đơn hàng';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handleSend = async (orderId) => {
    try {
      await salesOrderAPI.sendOrder(orderId);
      setSnackbarMessage('Gửi đơn hàng thành công!');
      setSnackbarOpen(true);
      fetchOrders();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể gửi đơn hàng';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handlePayment = async (orderId) => {
    setPaymentDialogOpen(true);
    setPaymentLoading(true);
    setPaymentOrderDetails(null);
    setPaymentMethod('VietQR');
    try {
      const response = await salesOrderAPI.viewDetails(orderId);
      if (response.data && response.data.data) {
        const data = response.data.data;
        const totalAmount = data.totalAmount ?? data.TotalAmount ?? data.totalPrice ?? data.TotalPrice ?? data.grandTotal ?? 0;
        const depositPercent = data.depositPercent ?? data.DepositPercent ?? 0;
        const paidAmount = data.paidAmount ?? data.PaidAmount ?? 0;
        const depositAmount = totalAmount * (depositPercent / 100);
        const remainingDeposit = Math.max(0, depositAmount - paidAmount);
        
        setPaymentOrderDetails({
          id: data.salesOrderId ?? data.SalesOrderId,
          code: data.salesOrderCode ?? data.SalesOrderCode,
          status: data.status ?? data.Status,
          createdAt: data.createAt ?? data.CreateAt,
          expiredDate: data.orderExpiredDate ?? data.OrderExpiredDate,
          depositPercent: depositPercent,
          totalAmount: totalAmount,
          remainingDeposit: remainingDeposit,
          paidAmount: paidAmount,
          createBy: data.createBy ?? data.CreateBy,
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải thông tin đơn hàng';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentOrderDetails) return;
    
    setSubmittingPayment(true);
    try {
      // Status 4 = Deposited
      await salesOrderAPI.confirmPayment(paymentOrderDetails.id, 4);
      setSnackbarMessage('Thanh toán cọc thành công!');
      setSnackbarOpen(true);
      setPaymentDialogOpen(false);
      fetchOrders();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể xác nhận thanh toán';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const generateVietQRUrl = (amount) => {
    // VietQR URL format: https://img.vietqr.io/image/{bankCode}-{accountNumber}-{template}.png?amount={amount}&addInfo={addInfo}
    const bankCode = 'mbbank';
    const accountNumber = '0377708126';
    const template = 'compact2';
    const addInfo = paymentOrderDetails?.code || 'THANH TOAN COC';
    return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}`;
  };

  const handleComplete = async (orderId) => {
    try {
      await salesOrderAPI.completeOrder(orderId);
      setSnackbarMessage('Hoàn thành đơn hàng thành công!');
      setSnackbarOpen(true);
      fetchOrders();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể hoàn thành đơn hàng';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  // Extract tax rate from TaxText (e.g., "VAT 10%" -> 0.1)
  const getTaxRateFromText = (taxText) => {
    if (!taxText) return 0;
    const matched = String(taxText).match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (matched && matched[1]) {
      const parsed = Number(matched[1].replace(',', '.'));
      if (!Number.isNaN(parsed)) {
        return parsed / 100;
      }
    }
    return 0;
  };

  const handleView = async (orderId) => {
    setDetailDialogOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setOrderDetails(null);
    try {
      const response = await salesOrderAPI.viewDetails(orderId);
      if (response.data && response.data.data) {
        const data = response.data.data;
        console.log('Order details response:', data);
        const totalAmount = data.totalAmount ?? data.TotalAmount ?? data.totalPrice ?? data.TotalPrice ?? data.grandTotal ?? 0;
        const depositPercent = data.depositPercent ?? data.DepositPercent ?? 0;
        const depositDueDays = data.depositDueDays ?? data.DepositDueDays ?? null;
        const depositExpiredDate = data.depositExpiredDate ?? data.DepositExpiredDate ?? null;
        const paidAmount = data.paidAmount ?? data.PaidAmount ?? 0;
        const depositAmount = totalAmount * (depositPercent / 100);
        const remainingDeposit = data.remainingDeposit ?? data.RemainingDeposit ?? Math.max(0, depositAmount - paidAmount);
        
        // Process details with tax information from backend
        const rawDetails = data.details ?? data.Details ?? data.orderDetails ?? data.OrderDetails ?? data.salesOrderDetails ?? data.SalesOrderDetails ?? [];
        const processedDetails = rawDetails.map((detail) => {
          const quantity = detail.quantity ?? detail.Quantity ?? 0;
          const unitPrice = detail.unitPrice ?? detail.UnitPrice ?? detail.UnitPriceBeforeTax ?? 0;
          const unitPriceAfterTax = detail.unitPriceAfterTax ?? detail.UnitPriceAfterTax ?? unitPrice * (1 + (detail.taxRate ?? detail.TaxRate ?? 0));
          const subtotal = detail.subtotal ?? detail.Subtotal ?? detail.subTotalPrice ?? detail.SubTotalPrice ?? quantity * unitPrice;
          const subtotalAfterTax = detail.subtotalAfterTax ?? detail.SubtotalAfterTax ?? quantity * unitPriceAfterTax;
          const taxText = detail.taxText ?? detail.TaxText ?? '-';
          const taxRate = detail.taxRate ?? detail.TaxRate ?? (taxText !== '-' ? getTaxRateFromText(taxText) : 0);
          const expiredDate =
            detail.expiredDate ??
            detail.ExpiredDate ??
            detail.expiredDateText ??
            detail.Lot?.ExpiredDate ??
            detail.lot?.ExpiredDate ??
            null;
          const productName = detail.productName ?? detail.ProductName ?? '-';
          const expiredDisplay = expiredDate ? formatDate(expiredDate) : '-';
          return {
            ...detail,
            productName,
            quantity,
            unitPrice,
            unitPriceAfterTax,
            subtotal,
            subtotalAfterTax,
            taxText: taxText || '-',
            taxRate,
            expiredDate,
            expiredDisplay,
          };
        });
        
        setOrderDetails({
          id: data.id ?? data.salesOrderId ?? data.SalesOrderId ?? orderId,
          code: data.orderCode ?? data.salesOrderCode ?? data.SalesOrderCode ?? '',
          status: data.status ?? data.Status ?? data.SalesOrderStatus,
          statusName: data.statusName ?? data.StatusName ?? data.salesOrderStatusName ?? null,
          createdAt: data.CreateAt ?? data.createAt ?? data.CreatedAt ?? data.createdAt ?? data.createdDate ?? data.CreatedDate ?? null,
          expiredDate: data.orderExpiredDate ?? data.OrderExpiredDate ?? data.salesOrderExpiredDate ?? data.SalesOrderExpiredDate ?? data.expiredDate ?? data.ExpiredDate ?? null,
          depositExpiredDate,
          totalAmount: totalAmount,
          depositPercent: depositPercent,
          depositDueDays,
          paidAmount: paidAmount,
          depositAmount: depositAmount,
          remainingDeposit: remainingDeposit,
          details: processedDetails,
        });
      } else {
        setOrderDetails(null);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải chi tiết đơn hàng.';
      setDetailError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setOrderDetails(null);
    setDetailError(null);
  };

  const renderActions = (order) => {
    const { status, id } = order;
    
    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
        {status === 0 && (
          <>
            <Tooltip title="Sửa" placement="bottom" arrow>
              <IconButton
                size="medium"
                onClick={() => handleEdit(id)}
                sx={{
                  color: '#1976d2',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  },
                }}
              >
                <EditIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa" placement="bottom" arrow>
              <IconButton
                size="medium"
                onClick={() => handleDelete(id)}
                sx={{
                  color: '#d32f2f',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                  },
                }}
              >
                <DeleteIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Gửi" placement="bottom" arrow>
              <IconButton
                size="medium"
                onClick={() => handleSend(id)}
                sx={{
                  color: '#1976d2',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  },
                }}
              >
                <SendIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
          </>
        )}
        {status === 2 && (
          <Tooltip title="Thanh Toán" placement="bottom" arrow>
            <IconButton
              size="medium"
              onClick={() => handlePayment(id)}
              sx={{
                color: '#2e7d32',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: 'rgba(46, 125, 50, 0.1)',
                },
              }}
            >
              <PaymentIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        )}
        {status === 5 && (
          <Tooltip title="Hoàn Thành" placement="bottom" arrow>
            <IconButton
              size="medium"
              onClick={() => handleComplete(id)}
              sx={{
                color: '#1976d2',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                },
              }}
            >
              <CheckCircleIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        )}
        {/* Icon xem chi tiết cho tất cả các trạng thái */}
        <Tooltip title="Xem chi tiết" placement="bottom" arrow>
          <IconButton
            size="medium"
            onClick={() => handleView(id)}
            sx={{
              color: '#1976d2',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
              },
            }}
          >
            <VisibilityIcon fontSize="medium" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Title */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: '#155E64',
            mb: 2,
          }}
        >
          Đơn hàng của tôi
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="status-filter-label">Lọc theo trạng thái</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Lọc theo trạng thái"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="0">Nháp</MenuItem>
            <MenuItem value="1">Đã Gửi</MenuItem>
            <MenuItem value="2">Đã Chấp Thuận</MenuItem>
            <MenuItem value="3">Đã Từ Chối</MenuItem>
            <MenuItem value="4">Đã Cọc</MenuItem>
            <MenuItem value="5">Đã Thanh Toán</MenuItem>
            <MenuItem value="6">Hoàn Thành</MenuItem>
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
        <TableContainer 
          component={Paper} 
          sx={{ 
            boxShadow: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Table sx={{ tableLayout: 'fixed' }}>
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
                <TableCell sx={{ width: '20%', py: 1.5, px: 2, ...headerTextSx }}>Mã đơn hàng</TableCell>
                <TableCell sx={{ width: '15%', py: 1.5, px: 2, ...headerTextSx }}>Thời gian tạo</TableCell>
                <TableCell sx={{ width: '15%', py: 1.5, px: 2, ...headerTextSx }}>Trạng thái</TableCell>
                <TableCell sx={{ width: '15%', py: 1.5, px: 1, pl: 6, ...headerTextSx }}>Tiền đã trả</TableCell>
                <TableCell sx={{ width: '15%', py: 1.5, px: 2, pl: 5, ...headerTextSx }}>Tổng tiền đơn hàng</TableCell>
                <TableCell sx={{ width: '16%', textAlign: 'right', py: 1.5, px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    <span style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.03em' }}>
                      Hành động
                    </span>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có đơn hàng nào.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order, index) => (
                  <TableRow
                    key={order.id || index}
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
                    <TableCell sx={{ fontWeight: 500, textAlign: 'left' }}>
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{order.quotationCode || order.quotationId || '-'}</TableCell>
                    <TableCell>{formatDate(order.createdAt || order.createAt || order.createdDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(order.paidAmount)}</TableCell>
                    <TableCell sx={{ textAlign: 'right', pl: 7 }}>{formatCurrency(order.totalAmount || order.grandTotal)}</TableCell>
                    <TableCell sx={{ textAlign: 'right', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                      {renderActions(order)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {orders.length > 0 && (
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
              />
            </Box>
          )}
        </TableContainer>
      )}

      {/* Order Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Chi tiết đơn hàng
          </Typography>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : detailError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {detailError}
            </Alert>
          ) : orderDetails ? (
            <Box>
              {/* Thông tin đơn hàng - Layout 3 cột */}
              <Box sx={{ mb: 3, display: 'flex', gap: 4 }}>
                {/* Phần 1 - Bên trái: Mã đơn hàng, Trạng thái, Thời gian tạo */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã đơn hàng:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {orderDetails.code || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trạng thái:
                    </Typography>
                    <Chip
                      label={orderDetails.statusName || getStatusLabel(orderDetails.status)}
                      color={orderDetails.status !== undefined ? getStatusColor(orderDetails.status) : 'default'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Thời gian tạo:
                    </Typography>
                    <Typography variant="body1">
                      {orderDetails.createdAt ? formatDate(orderDetails.createdAt) : '-'}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Phần 2 - Ở giữa: Ngày hết hạn đơn hàng, Cọc, Thời hạn hết hạn cọc */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày hết hạn đơn hàng:
                    </Typography>
                    <Typography variant="body1">
                      {orderDetails.expiredDate ? formatDate(orderDetails.expiredDate) : '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Cọc (% đơn hàng):
                    </Typography>
                    <Typography variant="body1">
                      {orderDetails.depositPercent !== undefined && orderDetails.depositPercent !== null
                        ? `${orderDetails.depositPercent}%`
                        : '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Thời hạn hết hạn cọc:
                    </Typography>
                    <Typography variant="body1">
                      {orderDetails.depositExpiredDate ? formatDate(orderDetails.depositExpiredDate) : '-'}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Phần 3 - Bên phải: Số tiền đã cọc, Số tiền cần cọc, Tổng tiền đơn hàng */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số tiền đã cọc:
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(orderDetails.paidAmount)} VNĐ
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số tiền cần cọc:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(orderDetails.remainingDeposit)} VNĐ
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tổng tiền đơn hàng:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(orderDetails.totalAmount)} VNĐ
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Danh sách sản phẩm */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Danh sách sản phẩm:
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '500px', overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '50px', textAlign: 'center', backgroundColor: '#f5f5f5', whiteSpace: 'nowrap' }}>STT</TableCell>
                        <TableCell sx={{ backgroundColor: '#f5f5f5', minWidth: '180px', whiteSpace: 'nowrap' }}>Tên Sản Phẩm</TableCell>
                        <TableCell sx={{ textAlign: 'center', backgroundColor: '#f5f5f5', minWidth: '80px', whiteSpace: 'nowrap' }}>Số lượng</TableCell>
                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5', minWidth: '100px', whiteSpace: 'nowrap' }}>Đơn Giá</TableCell>
                        <TableCell sx={{ textAlign: 'left', backgroundColor: '#f5f5f5', pl: 2, minWidth: '120px', whiteSpace: 'nowrap' }}>Thuế</TableCell>
                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5', minWidth: '120px', whiteSpace: 'nowrap' }}>Đơn giá sau thuế</TableCell>
                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5', minWidth: '120px', whiteSpace: 'nowrap' }}>Ngày hết hạn</TableCell>
                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5', minWidth: '100px', whiteSpace: 'nowrap' }}>Tạm tính</TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5f5f5', minWidth: '150px', whiteSpace: 'nowrap', pr: 2, textAlign: 'right' }}>
                          <Box component="div" sx={{ textAlign: 'right', width: '100%', display: 'block' }}>
                            Tạm Tính Sau Thuế
                          </Box>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(orderDetails.details) && orderDetails.details.length > 0 ? (
                        orderDetails.details.map((detail, index) => {
                          const quantity = detail.quantity ?? detail.Quantity ?? 0;
                          const unitPrice = detail.unitPrice ?? detail.UnitPrice ?? 0;
                          const unitPriceAfterTax = detail.unitPriceAfterTax ?? unitPrice;
                          const subtotal = detail.subtotal ?? quantity * unitPrice;
                          const subtotalAfterTax = detail.subtotalAfterTax ?? quantity * unitPriceAfterTax;
                          const taxText = detail.taxText ?? detail.TaxText ?? '-';
                          const expiredDate = detail.expiredDate ?? '-';
                          
                          return (
                            <TableRow key={detail.id ?? detail.productId ?? index}>
                              <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                                  <TableCell>{detail.productName ?? detail.ProductName ?? '-'}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{quantity}</TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(unitPrice)}</TableCell>
                                  <TableCell sx={{ textAlign: 'left', pl: 3 }}>{taxText}</TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(unitPriceAfterTax)}</TableCell>
                                  <TableCell sx={{ textAlign: 'right' }}>
                                    {detail.expiredDisplay ?? (expiredDate ? formatDate(expiredDate) : '-')}
                                  </TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(subtotal)}</TableCell>
                              <TableCell align="right" sx={{ whiteSpace: 'nowrap', pr: 2 }}>
                                <Box component="div" sx={{ textAlign: 'right', width: '100%', display: 'block' }}>
                                  {formatCurrency(subtotalAfterTax)}
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
                <Box sx={{ mb: 2, textAlign: 'right' }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Tạm tính: {formatCurrency(
                      orderDetails.details.reduce((sum, detail) => {
                        return sum + (detail.subtotal ?? 0);
                      }, 0)
                    )} VNĐ
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Tổng tiền sau thuế: {formatCurrency(
                      orderDetails.details.reduce((sum, detail) => {
                        return sum + (detail.subtotalAfterTax ?? 0);
                      }, 0)
                    )} VNĐ
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="info">Không tìm thấy thông tin đơn hàng.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'left', fontWeight: 600, fontSize: '1.25rem' }}>
          Thanh Toán Tiền Cọc Đơn Mua
        </DialogTitle>
        <DialogContent>
          {paymentLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : paymentOrderDetails ? (
            <Box>
              {/* Thông tin đơn hàng - Layout 2 cột */}
              <Box sx={{ display: 'flex', gap: 4 }}>
                {/* Cột trái */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã đơn hàng:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {paymentOrderDetails.code || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trạng thái:
                    </Typography>
                    <Chip
                      label={getStatusLabel(paymentOrderDetails.status)}
                      color={getStatusColor(paymentOrderDetails.status)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tổng Trị Giá Đơn Hàng:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(paymentOrderDetails.totalAmount)} VND
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày hết hạn đơn hàng:
                    </Typography>
                    <Typography variant="body1">
                      {paymentOrderDetails.expiredDate ? formatDate(paymentOrderDetails.expiredDate) : '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Cọc (% đơn hàng):
                    </Typography>
                    <Typography variant="body1">
                      {paymentOrderDetails.depositPercent ? `${paymentOrderDetails.depositPercent}%` : '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số Tiền Cần Cọc:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(paymentOrderDetails.remainingDeposit)} VND
                    </Typography>
                  </Box>
                </Box>
                
                {/* Cột phải */}
                <Box sx={{ flex: 1 }}>
                  {/* Phương thức thanh toán */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Phương Thức Thanh Toán:
                    </Typography>
                    <Autocomplete
                      value={paymentMethod}
                      onChange={(event, newValue) => {
                        setPaymentMethod(newValue);
                      }}
                      options={['VietQR']}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Chọn phương thức thanh toán"
                          variant="outlined"
                          fullWidth
                        />
                      )}
                    />
                  </Box>

                  {/* QR Code */}
                  {paymentMethod === 'VietQR' && (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Box
                        sx={{
                          width: 300,
                          height: 300,
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f5f5f5',
                          position: 'relative',
                        }}
                      >
                        <img
                          src={generateVietQRUrl(paymentOrderDetails.remainingDeposit)}
                          alt="VietQR Code"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const errorDiv = document.createElement('div');
                            errorDiv.style.cssText = 'color: #999; text-align: center; padding: 20px;';
                            errorDiv.textContent = 'Không thể tải QR Code';
                            e.target.parentElement.appendChild(errorDiv);
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          ) : (
            <Alert severity="error">Không thể tải thông tin đơn hàng.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPaymentDialogOpen(false)} disabled={submittingPayment}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmitPayment}
            variant="contained"
            color="primary"
            disabled={submittingPayment || !paymentOrderDetails}
            startIcon={submittingPayment ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {submittingPayment ? 'Đang xử lý...' : 'Thanh toán cọc'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default CustomerOrderList;
