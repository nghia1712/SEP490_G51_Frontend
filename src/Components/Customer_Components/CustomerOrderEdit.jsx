import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import salesOrderAPI from '../../API/salesOrderAPI';

const CustomerOrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Debug: Log để kiểm tra component có được render không
  console.log('CustomerOrderEdit component rendered, id:', id);
  const [orderDetails, setOrderDetails] = useState(null);
  const [rows, setRows] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const fetchOrderDetails = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await salesOrderAPI.viewDetails(id);
      if (response.data && response.data.data) {
        const data = response.data.data;
        setOrderDetails(data);
        
        // Initialize rows from order details
        if (data.details && data.details.length > 0) {
          const initialRows = data.details.map((detail, index) => ({
            id: index + 1,
            productId: detail.productId || detail.ProductId,
            productName: detail.productName || detail.ProductName || '',
            quantity: detail.quantity || detail.Quantity || 0,
            unitPrice: detail.unitPrice || detail.UnitPrice || detail.salesPrice || detail.SalesPrice || 0,
            supplier: detail.supplier || detail.Supplier || detail.supplierName || detail.SupplierName || '',
            subtotal: (detail.quantity || detail.Quantity || 0) * (detail.unitPrice || detail.UnitPrice || detail.salesPrice || detail.SalesPrice || 0),
          }));
          setRows(initialRows);
        }
      } else {
        // Mock data for development - remove when API is ready
        setOrderDetails({
          id: 1,
          orderCode: '1',
          createdAt: '2025-10-06',
          creator: 'Customer-1',
          status: 0, // Draft
          totalAmount: 3810000,
          details: [
            {
              productId: 1,
              productName: 'Paracetamol 500mg',
              quantity: 50,
              unitPrice: 15000,
              supplier: 'Công ty Dược Phẩm Trung Ương CPC1',
              subtotal: 750000,
            },
            {
              productId: 2,
              productName: 'Amoxicillin 500mg',
              quantity: 50,
              unitPrice: 32000,
              supplier: 'Công ty TNHH Dược Phẩm Hoa Linh',
              subtotal: 1600000,
            },
            {
              productId: 3,
              productName: 'Omeprazole 20mg',
              quantity: 25,
              unitPrice: 22000,
              supplier: 'Công ty Dược Phẩm Imexpharm',
              subtotal: 550000,
            },
            {
              productId: 4,
              productName: 'Vitamin C 500mg',
              quantity: 70,
              unitPrice: 13000,
              supplier: 'Công ty Dược Phẩm Imexpharm',
              subtotal: 910000,
            },
          ],
        });
        
        // Initialize rows from mock data
        const initialRows = [
          {
            id: 1,
            productId: 1,
            productName: 'Paracetamol 500mg',
            quantity: 50,
            unitPrice: 15000,
            supplier: 'Công ty Dược Phẩm Trung Ương CPC1',
            subtotal: 750000,
          },
          {
            id: 2,
            productId: 2,
            productName: 'Amoxicillin 500mg',
            quantity: 50,
            unitPrice: 32000,
            supplier: 'Công ty TNHH Dược Phẩm Hoa Linh',
            subtotal: 1600000,
          },
          {
            id: 3,
            productId: 3,
            productName: 'Omeprazole 20mg',
            quantity: 25,
            unitPrice: 22000,
            supplier: 'Công ty Dược Phẩm Imexpharm',
            subtotal: 550000,
          },
          {
            id: 4,
            productId: 4,
            productName: 'Vitamin C 500mg',
            quantity: 70,
            unitPrice: 13000,
            supplier: 'Công ty Dược Phẩm Imexpharm',
            subtotal: 910000,
          },
        ];
        setRows(initialRows);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải chi tiết đơn hàng';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Calculate total amount whenever rows change
  useEffect(() => {
    const newTotal = rows.reduce((sum, row) => sum + (row.subtotal || 0), 0);
    setTotalAmount(newTotal);
  }, [rows]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return 'Nháp';
      case 1:
        return 'Đã Gửi';
      case 2:
        return 'Đã Thanh Toán';
      case 3:
        return 'Đã Hoàn Thành';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return 'default';
      case 1:
        return 'info';
      case 2:
        return 'success';
      case 3:
        return 'primary';
      default:
        return 'default';
    }
  };

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  const handleQuantityDecrease = (rowId) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const newQuantity = Math.max(1, (row.quantity || 1) - 1);
        const newSubtotal = newQuantity * (row.unitPrice || 0);
        return { ...row, quantity: newQuantity, subtotal: newSubtotal };
      }
      return row;
    }));
  };

  const handleQuantityIncrease = (rowId) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const newQuantity = (row.quantity || 0) + 1;
        const newSubtotal = newQuantity * (row.unitPrice || 0);
        return { ...row, quantity: newQuantity, subtotal: newSubtotal };
      }
      return row;
    }));
  };

  const handleQuantityChange = (rowId, value) => {
    const newQuantity = Math.max(1, parseInt(value, 10) || 1);
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const newSubtotal = newQuantity * (row.unitPrice || 0);
        return { ...row, quantity: newQuantity, subtotal: newSubtotal };
      }
      return row;
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = rows.map(row => ({
        productId: row.productId,
        quantity: row.quantity,
      }));

      await salesOrderAPI.updateDraftQuantities(id, items);
      setSnackbarMessage('Lưu đơn hàng thành công!');
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate(`/customer/orders/${id}`);
      }, 1000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể lưu đơn hàng';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      return;
    }
    try {
      await salesOrderAPI.deleteOrder(id);
      setSnackbarMessage('Xóa đơn hàng thành công!');
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate('/customer/orders');
      }, 1000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể xóa đơn hàng';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handleSend = async () => {
    // First save, then send
    try {
      const items = rows.map(row => ({
        productId: row.productId,
        quantity: row.quantity,
      }));

      await salesOrderAPI.updateDraftQuantities(id, items);
      await salesOrderAPI.sendOrder(id);
      setSnackbarMessage('Gửi đơn hàng thành công!');
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate('/customer/orders');
      }, 1000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể gửi đơn hàng';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
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
    if (amount === null || amount === undefined) return '0';
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  if (loading && !orderDetails) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!orderDetails) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Không tìm thấy đơn hàng.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center', position: 'relative' }}>
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#155E64',
          }}
        >
          <CloseIcon />
        </IconButton>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: '#155E64',
            mb: 2,
          }}
        >
          Update Sales Order Details
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Order Information */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Mã đơn hàng:</strong> {orderDetails.orderCode || orderDetails.id || '-'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Thời gian tạo:</strong> {formatDate(orderDetails.createdAt || orderDetails.createAt || orderDetails.createdDate)}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Người tạo:</strong> {orderDetails.creator || orderDetails.customerName || '-'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Trạng thái:</strong>{' '}
          <Chip
            label={getStatusLabel(orderDetails.status)}
            color={getStatusColor(orderDetails.status)}
            size="small"
          />
        </Typography>
      </Box>

      {/* Product Details Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 2, mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ width: '60px', textAlign: 'center' }}>#</TableCell>
              <TableCell>Tên Sản Phẩm</TableCell>
              <TableCell sx={{ width: '200px', textAlign: 'center' }}>Số lượng</TableCell>
              <TableCell sx={{ width: '150px', textAlign: 'right' }}>Đơn Giá</TableCell>
              <TableCell>Nhà Cung Cấp</TableCell>
              <TableCell sx={{ width: '150px', textAlign: 'right' }}>Tạm tính</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                  Chưa có sản phẩm nào.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  sx={{
                    '&:nth-of-type(even)': {
                      backgroundColor: '#f9f9f9',
                    },
                  }}
                >
                  <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                  <TableCell>{row.productName}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityDecrease(row.id)}
                        sx={{
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          minWidth: '32px',
                          height: '32px',
                        }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <TextField
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                        inputProps={{ min: 1, style: { textAlign: 'center' } }}
                        variant="outlined"
                        size="small"
                        sx={{ width: '80px' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityIncrease(row.id)}
                        sx={{
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          minWidth: '32px',
                          height: '32px',
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(row.unitPrice)}</TableCell>
                  <TableCell>{row.supplier}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(row.subtotal)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Total Amount */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#155E64' }}>
          Tổng Tiền: {formatCurrency(totalAmount)} VND
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSend}
          disabled={loading}
          sx={{
            backgroundColor: '#155E64',
            '&:hover': {
              backgroundColor: '#0D4F52',
            },
            borderRadius: '8px',
            px: 3,
            py: 1.5,
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Gửi'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
          color="error"
          disabled={loading}
          sx={{
            borderRadius: '8px',
            px: 3,
            py: 1.5,
          }}
        >
          Xóa
        </Button>
        <Button
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
          sx={{
            color: '#155E64',
            borderColor: '#155E64',
            '&:hover': {
              borderColor: '#0D4F52',
              backgroundColor: 'rgba(21, 94, 100, 0.04)',
            },
            borderRadius: '8px',
            px: 3,
            py: 1.5,
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Lưu'}
        </Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default CustomerOrderEdit;

