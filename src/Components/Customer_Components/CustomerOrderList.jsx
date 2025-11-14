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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import salesOrderAPI from '../../API/salesOrderAPI';

const CustomerOrderList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const statusFilter = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    if (!statusParam) return null;

    switch (statusParam.toLowerCase()) {
      case 'draft':
      case '0':
        return 0;
      case 'send':
      case 'sent':
      case '1':
        return 1;
      case 'approved':
      case '2':
        return 2;
      case 'rejected':
      case '3':
        return 3;
      case 'deposited':
      case '4':
        return 4;
      case 'paid':
      case '5':
        return 5;
      case 'complete':
      case 'completed':
      case '6':
        return 6;
      default:
        return null;
    }
  }, [location.search]);

  const applyStatusFilter = useCallback(
    (data) => {
      if (statusFilter === null) return data;
      return data.filter((order) => order.status === statusFilter);
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
          depositAmount: (order.IsDeposited || order.isDeposited) ? (order.TotalPrice || order.totalPrice) : null, // Nếu đã cọc thì hiển thị totalPrice, chưa thì null
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

  useEffect(() => {
    setOrders(applyStatusFilter(allOrders));
  }, [applyStatusFilter, allOrders]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 0: // Draft
        return 'Nháp';
      case 1: // Send
        return 'Đã Gửi';
      case 2: // Approved
        return 'Đã Duyệt';
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
    navigate(`/customer/orders/edit/${orderId}`);
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
    // Navigate to payment page
    navigate(`/customer/orders/payment/${orderId}`);
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

  const handleView = (orderId) => {
    console.log('Navigating to order details, orderId:', orderId);
    navigate(`/customer/orders/${orderId}`);
  };

  const renderActions = (order) => {
    const { status, id } = order;
    
    switch (status) {
      case 0: // Draft
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={() => handleEdit(id)}
              sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
            >
              Sửa
            </Button>
            <Button
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => handleDelete(id)}
              color="error"
              sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
            >
              Xóa
            </Button>
            <Button
              size="small"
              startIcon={<SendIcon />}
              onClick={() => handleSend(id)}
              color="primary"
              sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
            >
              Gửi
            </Button>
          </Box>
        );
      case 1: // Send - Đã gửi, chờ duyệt
        return (
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => handleView(id)}
            sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
          >
            Xem
          </Button>
        );
      case 2: // Approved - Đã duyệt, có thể thanh toán
        return (
          <Button
            size="small"
            startIcon={<PaymentIcon />}
            onClick={() => handlePayment(id)}
            color="success"
            sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
          >
            Thanh Toán
          </Button>
        );
      case 3: // Rejected - Đã từ chối
        return (
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => handleView(id)}
            sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
          >
            Xem
          </Button>
        );
      case 4: // Deposited - Đã cọc
        return (
          <Button
            size="small"
            startIcon={<PaymentIcon />}
            onClick={() => handlePayment(id)}
            color="success"
            sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
          >
            Thanh Toán
          </Button>
        );
      case 5: // Paid - Đã thanh toán
        return (
          <Button
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleComplete(id)}
            color="primary"
            sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
          >
            Hoàn Thành
          </Button>
        );
      case 6: // Complete - Đã hoàn thành
        return (
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => handleView(id)}
            sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
          >
            Xem
          </Button>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
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

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ width: '60px', textAlign: 'center' }}>#</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>Mã báo giá</span>
                    <IconButton size="small" disabled sx={{ p: 0, minWidth: 'auto' }}>
                      <Box sx={{ fontSize: '0.7rem' }}>◆</Box>
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>Thời gian tạo</span>
                    <IconButton size="small" disabled sx={{ p: 0, minWidth: 'auto' }}>
                      <Box sx={{ fontSize: '0.7rem' }}>◆</Box>
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>Trạng thái</span>
                    <IconButton size="small" disabled sx={{ p: 0, minWidth: 'auto' }}>
                      <Box sx={{ fontSize: '0.7rem' }}>◆</Box>
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>Tiền cọc</span>
                    <IconButton size="small" disabled sx={{ p: 0, minWidth: 'auto' }}>
                      <Box sx={{ fontSize: '0.7rem' }}>◆</Box>
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>Tổng tiền đơn hàng</span>
                    <IconButton size="small" disabled sx={{ p: 0, minWidth: 'auto' }}>
                      <Box sx={{ fontSize: '0.7rem' }}>◆</Box>
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3 }}>
                    Chưa có đơn hàng nào.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, index) => (
                  <TableRow
                    key={order.id || index}
                    onClick={() => handleView(order.id)}
                    sx={{
                      cursor: 'pointer',
                      '&:nth-of-type(even)': {
                        backgroundColor: '#f9f9f9',
                      },
                      '&:hover': {
                        backgroundColor: '#e3f2fd',
                      },
                    }}
                  >
                    <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                    <TableCell>{order.quotationCode || order.quotationId || '-'}</TableCell>
                    <TableCell>{formatDate(order.createdAt || order.createAt || order.createdDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(order.depositAmount)}</TableCell>
                    <TableCell>{formatCurrency(order.totalAmount || order.grandTotal)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>{renderActions(order)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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

