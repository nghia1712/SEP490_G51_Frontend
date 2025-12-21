// File: CreateRSQ.jsx - Tạo yêu cầu báo giá
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  Autocomplete,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import productAPI from '../../API/productAPI';
import requestSalesQuotationAPI from '../../API/requestSalesQuotationAPI';

const CreateRSQ = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Table rows state
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

  // Handle create request (save as draft)
  const handleCreateRequest = async () => {
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
        productIdList: selectedProductIds
      };
      
      const response = await requestSalesQuotationAPI.createRequest(payload);
      
      if (response.data) {
        // Lưu createdDate vào localStorage nếu có RequestCode từ response
        const responseData = response.data?.data || response.data;
        const requestCode = responseData?.RequestCode || responseData?.requestCode || responseData?.code;
        
        if (requestCode) {
          const currentDate = new Date();
          try {
            localStorage.setItem(
              `rsq_created_${requestCode}`,
              currentDate.toISOString()
            );
            console.log('Created date saved to localStorage for:', requestCode);
          } catch (error) {
            console.error('Error storing created date:', error);
          }
        }
        
        setSnackbarMessage('Tạo yêu cầu thành công!');
        setSnackbarOpen(true);
        // Navigate back to list after 1 second
        setTimeout(() => {
          navigate('/request-quotation');
        }, 1000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tạo yêu cầu báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle send (create and send immediately)
  const handleSend = async () => {
    // Same as create for now, backend will handle status
    await handleCreateRequest();
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
          Tạo yêu cầu báo giá
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 2, mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ width: '60px', textAlign: 'center' }}>#</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>Tên sản phẩm</span>
                  <IconButton size="small" disabled sx={{ p: 0, minWidth: 'auto' }}>
                    <Box sx={{ fontSize: '0.7rem' }}>◆</Box>
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell sx={{ width: '200px' }}>Thao tác</TableCell>
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
                  <Autocomplete
                    options={products}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.productName || option.name || '';
                    }}
                    value={products.find(p => (p.productID || p.id) === row.productId) || null}
                    onChange={(event, newValue) => handleProductChange(row.id, newValue)}
                    loading={productsLoading}
                    freeSolo={false}
                    disableClearable={false}
                    filterOptions={(options, params) => {
                      const filtered = options.filter((option) => {
                        const code = (option.productCode || option.code || '').toLowerCase();
                        const name = (option.productName || option.name || '').toLowerCase();
                        const inputValue = params.inputValue.toLowerCase();
                        return code.includes(inputValue) || name.includes(inputValue);
                      });
                      return filtered;
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option.productID || option.id}>
                        <Typography variant="body2">
                          {option.productName || option.name || ''}
                        </Typography>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Chọn sản phẩm"
                        variant="standard"
                        InputProps={{
                          ...params.InputProps,
                          readOnly: true,
                          endAdornment: (
                            <>
                              {productsLoading ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    sx={{ minWidth: 250 }}
                  />
                </TableCell>
                <TableCell>
                  {rows.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveRow(row.id)}
                      sx={{ color: '#d32f2f' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Row Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddRow}
          sx={{
            borderColor: '#155E64',
            color: '#155E64',
            '&:hover': {
              borderColor: '#0D4F52',
              backgroundColor: 'rgba(21, 94, 100, 0.04)',
            },
          }}
        >
          Thêm sản phẩm
        </Button>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleCreateRequest}
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
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Tạo yêu cầu'}
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

export default CreateRSQ;

