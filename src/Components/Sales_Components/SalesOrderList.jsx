import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Grid,
  Divider,
  IconButton,
  Link,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CloseIcon from '@mui/icons-material/Close';
import salesOrderAPI from '../../API/salesOrderAPI';

const SalesOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('VNPay');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await salesOrderAPI.listSalesOrder();
      if (response.data && Array.isArray(response.data.data)) {
        const mappedOrders = response.data.data.map((order) => ({
          id: order.SalesOrderId || order.salesOrderId,
          code: order.SalesOrderCode || order.salesOrderCode || '',
          creator: order.CreateBy || order.createBy || order.CreatedBy || order.createdBy || order.CustomerName || order.customerName || '-',
          status: order.Status !== undefined ? order.Status : order.status,
          createdAt: order.CreateAt || order.createAt || order.CreatedAt,
          totalAmount: order.TotalPrice || order.totalPrice || 0,
          paidAmount: order.PaidAmount ?? order.paidAmount ?? 0,
        }));
        setOrders(mappedOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách đơn hàng';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return 'Nháp';
      case 1:
        return 'Chờ xử lý';
      case 2:
        return 'Đã duyệt';
      case 3:
        return 'Đã từ chối';
      case 4:
        return 'Đã cọc';
      case 5:
        return 'Đã thanh toán';
      case 6:
        return 'Hoàn thành';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return { backgroundColor: '#fff3cd', color: '#856404' };
      case 1:
        return { backgroundColor: '#e3f2fd', color: '#1a4a57' };
      case 2:
        return { backgroundColor: '#ffe082', color: '#8c6d1f' };
      case 3:
        return { backgroundColor: '#f8d7da', color: '#721c24' };
      case 4:
        return { backgroundColor: '#e0f7fa', color: '#006064' };
      case 5:
        return { backgroundColor: '#d4edda', color: '#155724' };
      case 6:
        return { backgroundColor: '#cce5ff', color: '#004085' };
      default:
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return value;
    }
  };

  const formatDateISO = (value) => {
    if (!value) return '-';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    } catch (error) {
      return value;
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount || 0);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') {
      return orders;
    }
    return orders.filter((order) => String(order.status) === String(statusFilter));
  }, [orders, statusFilter]);

  const handleViewDetails = () => {
    setSnackbarMessage('Tính năng xem chi tiết đang được phát triển.');
    setSnackbarOpen(true);
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
          code: data.orderCode ?? data.salesOrderCode ?? data.SalesOrderCode ?? '',
          creator:
            data.creator ??
            data.createBy ??
            data.CreateBy ??
            data.createdBy ??
            data.CreatedBy ??
            data.customerName ??
            data.CustomerName ??
            '-',
          status: data.status ?? data.Status,
          createdAt: data.createdAt ?? data.CreateAt ?? data.CreatedAt ?? null,
          expiredAt: data.expiredDate ?? data.ExpiredDate ?? data.dueDate ?? data.DueDate ?? null,
          totalAmount:
            data.totalAmount ??
            data.TotalAmount ??
            data.totalPrice ??
            data.TotalPrice ??
            data.grandTotal ??
            0,
          paidAmount: data.paidAmount ?? data.PaidAmount ?? 0,
          dueAmount:
            data.debtAmount ?? data.DebtAmount ?? data.balanceAmount ?? data.BalanceAmount ?? null,
          details:
            data.details ??
            data.orderDetails ??
            data.OrderDetails ??
            data.salesOrderDetails ??
            data.SalesOrderDetails ??
            [],
          paymentUrl: data.paymentUrl ?? data.PaymentUrl ?? '',
          qrImage: data.qrImage ?? data.QrImage ?? data.qrCodeUrl ?? data.QRCodeUrl ?? '',
        });
      } else {
        setOrderDetails(null);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải chi tiết đơn hàng.';
      setDetailError(errorMessage);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleClosePaymentDialog = () => {
    setDetailDialogOpen(false);
    setSelectedOrderId(null);
    setOrderDetails(null);
    setDetailError(null);
    setPaymentMethod('VNPay');
  };

  const handleApprove = async (orderId) => {
    try {
      await salesOrderAPI.approveOrder(orderId);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: 2 } : order
        )
      );
      setSnackbarMessage('Đã chấp thuận đơn hàng.');
      setSnackbarOpen(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể chấp thuận đơn hàng.';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handleReject = async (orderId) => {
    try {
      await salesOrderAPI.rejectOrder(orderId);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      setSnackbarMessage('Đã từ chối đơn hàng.');
      setSnackbarOpen(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể từ chối đơn hàng.';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handlePartialPayment = () => {
    setSnackbarMessage('Tính năng cọc sẽ sớm được cập nhật.');
    setSnackbarOpen(true);
  };

  const handleFullPayment = () => {
    setSnackbarMessage('Tính năng thanh toán toàn bộ sẽ sớm được cập nhật.');
    setSnackbarOpen(true);
  };

  const statusOptions = [
    { value: 'all', label: 'Trạng thái' },
    { value: 1, label: 'Chờ xử lý' },
    { value: 2, label: 'Đã duyệt' },
    { value: 3, label: 'Đã từ chối' },
    { value: 4, label: 'Đã cọc' },
    { value: 5, label: 'Đã thanh toán' },
    { value: 6, label: 'Hoàn thành' },
  ];

  const paymentMethodOptions = ['VNPay', 'Chuyển khoản', 'Tiền mặt'];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          backgroundColor: '#B9D3D8',
          borderRadius: 2,
          padding: 3,
          boxShadow: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h5"
            component="h1"
            sx={{ fontWeight: 'bold', color: '#1a4a57', flexGrow: 1 }}
          >
            Danh Sách Đơn Hàng
          </Typography>
          <FormControl size="small" sx={{ minWidth: 170, backgroundColor: '#ffffff', borderRadius: 1 }}>
            <InputLabel id="status-filter-label">Trạng Thái</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Trạng Thái"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

        {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
          <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#d9e8eb' }}>
                <TableRow>
                  <TableCell sx={{ width: 60, textAlign: 'center', fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Mã đơn hàng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Người tạo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Thời gian tạo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tiền đã trả</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tổng tiền đơn hàng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 180 }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      Chưa có đơn hàng nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order, index) => (
                    <TableRow
                      key={order.id || index}
                      sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f7fbfb' } }}
                    >
                      <TableCell align="center">{index + 1}</TableCell>
                      <TableCell>{order.code || '-'}</TableCell>
                      <TableCell>{order.creator || '-'}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(order.status)}
                          size="small"
                          sx={getStatusColor(order.status)}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(order.paidAmount)}</TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        {order.status === 1 ? (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap', alignItems: 'center' }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<TaskAltIcon />}
                              onClick={() => handleApprove(order.id)}
                              sx={{
                                backgroundColor: '#4caf50',
                                '&:hover': { backgroundColor: '#43a047' },
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Chấp thuận
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<HighlightOffIcon />}
                              onClick={() => handleReject(order.id)}
                              sx={{
                                borderColor: '#d32f2f',
                                color: '#d32f2f',
                                '&:hover': {
                                  backgroundColor: '#fbe9e7',
                                  borderColor: '#d32f2f',
                                },
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Từ chối
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap', alignItems: 'center' }}>
                            <Button
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={handleViewDetails}
                              sx={{
                                color: '#1976d2',
                                textTransform: 'none',
                                textDecoration: 'underline',
                                '&:hover': {
                                  textDecoration: 'underline',
                                  backgroundColor: 'transparent',
                                },
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Xem
                            </Button>
                            {(order.status === 2 || order.status === 4) && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleOpenPaymentDialog(order.id)}
                                sx={{
                                  backgroundColor: '#155e64',
                                  '&:hover': { backgroundColor: '#0d4f52' },
                                  textTransform: 'none',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Thanh toán
                              </Button>
                            )}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Dialog
        open={detailDialogOpen}
        onClose={handleClosePaymentDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#155e64',
            backgroundColor: '#f1f6f7',
            position: 'relative',
            pr: 6,
          }}
        >
          Chi tiết đơn hàng
          <IconButton
            onClick={handleClosePaymentDialog}
            sx={{ position: 'absolute', right: 12, top: 12, color: '#155e64' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#f7f9fa' }}>
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : detailError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {detailError}
            </Alert>
          ) : orderDetails ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2">
                    <strong>Mã đơn hàng:</strong> {orderDetails.code || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2">
                    <strong>Người tạo:</strong> {orderDetails.creator || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <strong>Trạng thái:</strong>
                    <Chip
                      label={getStatusLabel(orderDetails.status)}
                      size="small"
                      sx={getStatusColor(orderDetails.status)}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2">
                    <strong>Thời gian tạo:</strong> {formatDateISO(orderDetails.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2">
                    <strong>Ngày hết hạn đơn hàng:</strong> {formatDateISO(orderDetails.expiredAt)}
                  </Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    <strong>Tổng tiền:</strong> {formatCurrency(orderDetails.totalAmount)} VND
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    <strong>Số tiền đã trả:</strong> {formatCurrency(orderDetails.paidAmount)} VND
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    <strong>Số tiền nợ:</strong>{' '}
                    {formatCurrency(
                      orderDetails.dueAmount ??
                        Math.max(
                          (Number(orderDetails.totalAmount) || 0) -
                            (Number(orderDetails.paidAmount) || 0),
                          0
                        )
                    )}{' '}
                    VND
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#e8f1f2' }}>
                    <TableRow>
                      <TableCell sx={{ width: 60, textAlign: 'center' }}>#</TableCell>
                      <TableCell>Tên sản phẩm</TableCell>
                      <TableCell sx={{ width: 100, textAlign: 'center' }}>Số lượng</TableCell>
                      <TableCell sx={{ width: 140, textAlign: 'right' }}>Đơn giá</TableCell>
                      <TableCell sx={{ width: 160 }}>Ngày hết hạn</TableCell>
                      <TableCell sx={{ width: 140, textAlign: 'right' }}>Tạm tính</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(orderDetails.details) && orderDetails.details.length > 0 ? (
                      orderDetails.details.map((detail, index) => {
                        const quantity =
                          detail.quantity ?? detail.Quantity ?? detail.orderQuantity ?? detail.OrderQuantity ?? 0;
                        const unitPrice =
                          detail.unitPrice ??
                          detail.UnitPrice ??
                          detail.salesPrice ??
                          detail.SalesPrice ??
                          detail.price ??
                          detail.Price ??
                          0;
                        const subtotal =
                          detail.subtotal ??
                          detail.Subtotal ??
                          detail.subTotal ??
                          detail.SubTotal ??
                          quantity * unitPrice;
                        const expiredDate =
                          detail.expiredDate ?? detail.ExpiredDate ?? detail.expirationDate ?? detail.ExpirationDate;
                        return (
                          <TableRow key={detail.id ?? detail.productId ?? index}>
                            <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                            <TableCell>{detail.productName ?? detail.ProductName ?? '-'}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{quantity}</TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(unitPrice)}</TableCell>
                            <TableCell>{formatDateISO(expiredDate)}</TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(subtotal)}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                          Chưa có sản phẩm nào trong đơn hàng.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      minHeight: 240,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {orderDetails.qrImage ? (
                      <Box
                        component="img"
                        src={orderDetails.qrImage}
                        alt="QRCode"
                        sx={{ width: 220, height: 220, objectFit: 'contain', mb: 2 }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 220,
                          height: 220,
                          border: '1px dashed #9fb7bb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          color: '#9fb7bb',
                          borderRadius: 2,
                        }}
                      >
                        QRCode
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Quét mã để thanh toán nhanh
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 3, backgroundColor: '#ffffff', height: '100%' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        URL thanh toán
                      </Typography>
                      {orderDetails.paymentUrl ? (
                        <Link href={orderDetails.paymentUrl} target="_blank" rel="noopener">
                          {orderDetails.paymentUrl}
                        </Link>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Đang cập nhật
                        </Typography>
                      )}
                    </Box>
                    <FormControl fullWidth size="small">
                      <InputLabel id="payment-method-label">Phương thức thanh toán</InputLabel>
                      <Select
                        labelId="payment-method-label"
                        value={paymentMethod}
                        label="Phương thức thanh toán"
                        onChange={(event) => setPaymentMethod(event.target.value)}
                      >
                        {paymentMethodOptions.map((method) => (
                          <MenuItem key={method} value={method}>
                            {method}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography align="center" color="text.secondary">
              Không có dữ liệu đơn hàng.
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: '#f1f6f7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            py: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={handlePartialPayment}
            sx={{
              borderColor: '#155e64',
              color: '#155e64',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#0d4f52',
                backgroundColor: 'rgba(21, 94, 100, 0.05)',
              },
            }}
          >
            Cọc
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleClosePaymentDialog} sx={{ textTransform: 'none' }}>
              Đóng
            </Button>
            <Button
              variant="contained"
              onClick={handleFullPayment}
              sx={{
                backgroundColor: '#155e64',
                '&:hover': { backgroundColor: '#0d4f52' },
                textTransform: 'none',
              }}
              disabled={!orderDetails}
            >
              Thanh toán toàn bộ
            </Button>
          </Box>
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

export default SalesOrderList;
