// File: EditRequestQuotation.jsx - Form sửa yêu cầu báo giá cho Customer
import React, { useEffect, useState, useCallback } from 'react';
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
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import productAPI from '../../API/productAPI';
import requestSalesQuotationAPI from '../../API/requestSalesQuotationAPI';

const EditRequestQuotation = ({ onCancel, onSuccess, requestId, initialData }) => {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [rows, setRows] = useState([
    { id: 1, productId: null, productCode: '', productName: '' }
  ]);

  // Fetch products list
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const response = await productAPI.getActive();
      if (response.data && response.data.data) {
        const data = Array.isArray(response.data.data) 
          ? response.data.data 
          : [];
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load initial data for editing
  useEffect(() => {
    if (requestId && initialData) {
      // Map initial data to rows (ViewRsqDTO.Details structure)
      const details = initialData.details || initialData.Details || [];
      if (details.length > 0) {
        const mappedRows = details.map((detail, index) => ({
          id: index + 1,
          productId: detail.productId || detail.ProductId,
          productCode: detail.productCode || detail.ProductCode || '',
          productName: detail.productName || detail.ProductName || '',
        }));
        setRows(mappedRows);
      }
    }
  }, [requestId, initialData]);

  // Add new row
  const handleAddRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows([...rows, { id: newId, productId: null, productCode: '', productName: '' }]);
  };

  // Remove row
  const handleRemoveRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  // Handle product selection
  const handleProductChange = (rowId, selectedProduct) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          productId: selectedProduct?.productID || selectedProduct?.id || null,
          productCode: selectedProduct?.productCode || selectedProduct?.code || '',
          productName: selectedProduct?.productName || selectedProduct?.name || '',
        };
      }
      return row;
    }));
  };

  // Handle update request
  const handleUpdateRequest = async () => {
    const selectedProductIds = rows
      .filter(row => row.productId)
      .map(row => row.productId);

    if (selectedProductIds.length === 0) {
      setError('Vui lòng chọn ít nhất một sản phẩm');
      setSnackbarMessage('Vui lòng chọn ít nhất một sản phẩm');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        RsqId: requestId,
        ProductIdList: selectedProductIds
      };
      
      const response = await requestSalesQuotationAPI.updateRequest(payload);
      
      if (response.data) {
        setSnackbarMessage('Cập nhật yêu cầu thành công!');
        setSnackbarOpen(true);
        // Call onSuccess callback after a short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 1000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật yêu cầu báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle send (update and send immediately)
  const handleSend = async () => {
    const selectedProductIds = rows
      .filter(row => row.productId)
      .map(row => row.productId);

    if (selectedProductIds.length === 0) {
      setError('Vui lòng chọn ít nhất một sản phẩm');
      setSnackbarMessage('Vui lòng chọn ít nhất một sản phẩm');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Step 1: Update request first
      const payload = {
        RsqId: requestId,
        ProductIdList: selectedProductIds
      };
      
      const updateResponse = await requestSalesQuotationAPI.updateRequest(payload);
      
      if (updateResponse.data) {
        // Step 2: Send the request
        const sendResponse = await requestSalesQuotationAPI.sendRequest(requestId);
        
        if (sendResponse.data) {
          setSnackbarMessage('Cập nhật và gửi yêu cầu thành công!');
          setSnackbarOpen(true);
          // Call onSuccess callback after a short delay
          setTimeout(() => {
            if (onSuccess) {
              onSuccess();
            }
          }, 1000);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật và gửi yêu cầu báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get request code from initialData (ViewRsqDTO structure)
  const requestCode = initialData?.requestCode || initialData?.RequestCode || '';
  const requestDate = initialData?.requestDate || initialData?.RequestDate || '';
  const status = initialData?.status !== undefined ? initialData.status : (initialData?.Status !== undefined ? initialData.Status : 0);

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
          Cập nhật bản nháp
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Request Information Box */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start' }}>
        <Card sx={{ minWidth: 400, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>RequestCode:</strong> {requestCode}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>RequestDate:</strong> {formatDate(requestDate)}
            </Typography>
            <Typography variant="body1">
              <strong>Status:</strong> Draft
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 2, mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ width: '100px', textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <span>STT</span>
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
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow 
                key={row.id} 
                hover
                sx={{ 
                  backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff'
                }}
              >
                <TableCell sx={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {row.productName || 'Chưa chọn sản phẩm'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleUpdateRequest}
          disabled={loading}
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
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Cập nhật'}
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
            borderRadius: '8px',
            px: 4,
            py: 1.5,
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Gửi'}
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

export default EditRequestQuotation;

