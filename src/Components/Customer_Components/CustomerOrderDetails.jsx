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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import salesOrderAPI from '../../API/salesOrderAPI';

const CustomerOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Debug: Log để kiểm tra component có được render không
  console.log('CustomerOrderDetails component rendered, id:', id);
  const [orderDetails, setOrderDetails] = useState(null);
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
        setOrderDetails(response.data.data);
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
              productName: 'Paracetamol 500mg',
              quantity: 50,
              unitPrice: 15000,
              supplier: 'Công ty Dược Phẩm Trung Ương CPC1',
              subtotal: 750000,
            },
            {
              productName: 'Amoxicillin 500mg',
              quantity: 50,
              unitPrice: 32000,
              supplier: 'Công ty TNHH Dược Phẩm Hoa Linh',
              subtotal: 1600000,
            },
            {
              productName: 'Omeprazole 20mg',
              quantity: 25,
              unitPrice: 22000,
              supplier: 'Công ty Dược Phẩm Imexpharm',
              subtotal: 550000,
            },
            {
              productName: 'Vitamin C 500mg',
              quantity: 70,
              unitPrice: 13000,
              supplier: 'Công ty Dược Phẩm Imexpharm',
              subtotal: 910000,
            },
          ],
        });
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

  const handleEdit = () => {
    console.log('Navigating to edit page, id:', id);
    navigate(`/customer/orders/${id}/edit`);
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
    try {
      await salesOrderAPI.sendOrder(id);
      setSnackbarMessage('Gửi đơn hàng thành công!');
      setSnackbarOpen(true);
      fetchOrderDetails(); // Refresh to update status
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể gửi đơn hàng';
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
          Đơn hàng chi tiết
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
              <TableCell sx={{ width: '120px', textAlign: 'center' }}>Số lượng</TableCell>
              <TableCell sx={{ width: '150px', textAlign: 'right' }}>Đơn Giá</TableCell>
              <TableCell>Nhà Cung Cấp</TableCell>
              <TableCell sx={{ width: '150px', textAlign: 'right' }}>Tạm tính</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderDetails.details && orderDetails.details.length > 0 ? (
              orderDetails.details.map((detail, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:nth-of-type(even)': {
                      backgroundColor: '#f9f9f9',
                    },
                  }}
                >
                  <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                  <TableCell>{detail.productName || detail.ProductName || '-'}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{detail.quantity || detail.Quantity || '-'}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(detail.unitPrice || detail.UnitPrice || detail.salesPrice || detail.SalesPrice)}</TableCell>
                  <TableCell>{detail.supplier || detail.Supplier || detail.supplierName || detail.SupplierName || '-'}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(detail.subtotal || detail.Subtotal || (detail.quantity || 0) * (detail.unitPrice || detail.UnitPrice || 0))}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                  Chưa có sản phẩm nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Total Amount */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#155E64' }}>
          Tổng Tiền: {formatCurrency(orderDetails.totalAmount || orderDetails.grandTotal || 0)} VND
        </Typography>
      </Box>

      {/* Action Buttons */}
      {orderDetails.status === 0 && ( // Only show actions for Draft status
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSend}
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
            Gửi
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            color="error"
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
            startIcon={<EditIcon />}
            onClick={handleEdit}
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
            Sửa
          </Button>
        </Box>
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

export default CustomerOrderDetails;

