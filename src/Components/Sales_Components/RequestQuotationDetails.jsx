// File: RequestQuotationDetails.jsx - Chi tiết yêu cầu báo giá cho Sales Staff
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TableSortLabel,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import requestSalesQuotationAPI from '../../API/requestSalesQuotationAPI';

const RequestQuotationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [requestDetails, setRequestDetails] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);

  // Map status enum
  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return 'Nháp';
      case 1:
        return 'Đã gửi';
      case 2:
        return 'Đã báo giá';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 1:
        return { backgroundColor: '#d4edda', color: '#155724' }; // Sent - Green
      case 2:
        return { backgroundColor: '#d1ecf1', color: '#0c5460' }; // Quoted - Blue
      default:
        return { backgroundColor: '#fff3cd', color: '#856404' }; // Draft - Yellow
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '-';
    }
  };

  // Fetch request details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);
      try {
        const response = await requestSalesQuotationAPI.viewDetails(parseInt(id));
        
        if (response.data && response.data.data) {
          const data = response.data.data;
          setRequestDetails(data);
          
          // TODO: Fetch customer info from request if available
          // For now, we'll use placeholder or get from request if available
          setCustomerInfo({
            name: 'Nguyễn Văn A', // This should come from API
            phone: '0987654321',
            email: 'nguyenvana@example.com',
            address: '123 Đường ABC, Quận XYZ, TP.HCM',
          });
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Không thể tải chi tiết yêu cầu';
        setError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleCreateQuotation = () => {
    // Navigate to create sales quotation page with request ID
    console.log('Navigating to create quotation, id:', id);
    navigate(`/sales-quotation/create/${id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !requestDetails) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
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
          CHI TIẾT YÊU CẦU BÁO GIÁ
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Request Information Card */}
      {requestDetails && (
        <Card sx={{ mb: 3, boxShadow: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Mã yêu cầu:</strong> {requestDetails.requestCode || requestDetails.RequestCode || ''}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Ngày yêu cầu:</strong> {formatDate(requestDetails.requestDate || requestDetails.RequestDate)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Trạng thái:</strong>{' '}
                  <Chip
                    label={getStatusLabel(requestDetails.status !== undefined ? requestDetails.status : (requestDetails.Status !== undefined ? requestDetails.Status : 0))}
                    size="small"
                    sx={getStatusColor(requestDetails.status !== undefined ? requestDetails.status : (requestDetails.Status !== undefined ? requestDetails.Status : 0))}
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                {customerInfo && (
                  <>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Khách hàng:</strong> {customerInfo.name}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Số điện thoại:</strong> {customerInfo.phone}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {customerInfo.email}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Địa chỉ:</strong> {customerInfo.address}
                    </Typography>
                  </>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Product List Table */}
      {requestDetails && requestDetails.details && (
        <TableContainer component={Paper} sx={{ boxShadow: 2, mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ width: '80px', textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <span>STT</span>
                    <IconButton size="small" disabled sx={{ p: 0, minWidth: 'auto' }}>
                      <Box sx={{ fontSize: '0.7rem' }}>◆</Box>
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>Mã sản phẩm</span>
                    <IconButton size="small" disabled sx={{ p: 0, minWidth: 'auto' }}>
                      <Box sx={{ fontSize: '0.7rem' }}>◆</Box>
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>Tên sản phẩm</span>
                    <IconButton size="small" disabled sx={{ p: 0, minWidth: 'auto' }}>
                      <Box sx={{ fontSize: '0.7rem' }}>◆</Box>
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>Số lượng</span>
                    <IconButton size="small" disabled sx={{ p: 0, minWidth: 'auto' }}>
                      <Box sx={{ fontSize: '0.7rem' }}>◆</Box>
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requestDetails.details.map((detail, index) => (
                <TableRow 
                  key={detail.productId || detail.ProductId || index}
                  hover
                  sx={{
                    '&:nth-of-type(even)': {
                      backgroundColor: '#f9f9f9',
                    }
                  }}
                >
                  <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                  <TableCell>{detail.productCode || detail.ProductCode || '-'}</TableCell>
                  <TableCell>{detail.productName || detail.ProductName || '-'}</TableCell>
                  <TableCell>{detail.quantity || detail.Quantity || '-'}</TableCell>
                </TableRow>
              ))}
              {(!requestDetails.details || requestDetails.details.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có sản phẩm nào
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            borderColor: '#155E64',
            color: '#155E64',
            '&:hover': {
              borderColor: '#0D4F52',
              backgroundColor: 'rgba(21, 94, 100, 0.04)',
            },
            borderRadius: '8px',
            px: 3,
            py: 1.5,
          }}
        >
          Quay lại
        </Button>
        <Button
          variant="contained"
          onClick={handleCreateQuotation}
          sx={{
            backgroundColor: '#155E64',
            '&:hover': {
              backgroundColor: '#0D4F52',
            },
            borderRadius: '8px',
            px: 4,
            py: 1.5,
          }}
        >
          TẠO BÁO GIÁ
        </Button>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default RequestQuotationDetails;

