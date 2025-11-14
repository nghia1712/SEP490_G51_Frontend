// File: CustomerRequestQuotationList.jsx - Danh sách yêu cầu báo giá cho Customer
import React, { useEffect, useState, useCallback } from 'react';
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
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SendIcon from '@mui/icons-material/Send';
import requestSalesQuotationAPI from '../../API/requestSalesQuotationAPI';
import salesQuotationAPI from '../../API/salesQuotationAPI';
import salesOrderAPI from '../../API/salesOrderAPI';
import productAPI from '../../API/productAPI';

const CustomerRequestQuotationList = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [editInitialData, setEditInitialData] = useState(null);
  const [editRows, setEditRows] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createRows, setCreateRows] = useState([{ id: 1, productId: null, productCode: '', productName: '' }]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editError, setEditError] = useState(null); // Error riêng cho dialog edit
  const [createError, setCreateError] = useState(null); // Error riêng cho dialog create
  const [statusFilter, setStatusFilter] = useState('all');

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
      case 0:
        return { backgroundColor: '#fff3cd', color: '#856404' }; // Draft - Yellow
      case 1:
        return { backgroundColor: '#d1ecf1', color: '#0c5460' }; // Sent - Blue
      case 2:
        return { backgroundColor: '#d4edda', color: '#155724' }; // Quoted - Green
      default:
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (error) {
      return '-';
    }
  };

  // Fetch data from API
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestSalesQuotationAPI.viewList();
      
      // Backend trả về: { message, data }
      if (response.data && response.data.data) {
        const data = Array.isArray(response.data.data) 
          ? response.data.data 
          : [];
        
        // Map data from API to component format
        // Backend trả về: Id, RequestCode, RequestDate (nullable), Status
        // Logic: 
        // - Khi tạo (status = 0 - Nháp): RequestDate = null, hiển thị ngày tạo (extract từ RequestCode), ngày gửi = null
        // - Khi gửi (status = 1 hoặc 2): RequestDate có giá trị (ngày gửi), hiển thị ngày gửi
        
        // Hàm extract ngày từ RequestCode (format: RSQ-{yyyyMMdd}-{random})
        const extractDateFromCode = (code) => {
          if (!code) return null;
          try {
            // RequestCode format: RSQ-20250115-ABC12345
            const parts = code.split('-');
            if (parts.length >= 2) {
              const dateStr = parts[1]; // yyyyMMdd
              if (dateStr && dateStr.length === 8) {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                return new Date(`${year}-${month}-${day}`);
              }
            }
          } catch (error) {
            console.error('Error extracting date from code:', error);
          }
          return null;
        };
        
        const mappedData = data.map((item, index) => {
          const status = item.Status !== undefined ? item.Status : item.status;
          const requestDate = item.RequestDate || item.requestDate || null;
          const requestCode = item.RequestCode || item.requestCode || '';
          
          // Ngày tạo: extract từ RequestCode (format: RSQ-{yyyyMMdd}-{random})
          // RequestCode được generate với ngày hiện tại khi tạo yêu cầu
          const createdDate = extractDateFromCode(requestCode);
          
          // Ngày gửi: chỉ có khi status là Đã gửi (1) hoặc Đã báo giá (2) và RequestDate có giá trị
          // RequestDate được set khi gửi yêu cầu (trong SendRequest service)
          const sentDate = (status === 1 || status === 2) && requestDate ? requestDate : null;
          
          return {
            id: item.Id || item.id,
            code: requestCode,
            createdDate, // Extract từ RequestCode
            sentDate, // RequestDate khi đã gửi
            status,
            originalIndex: index,
          };
        });
        
        setRequests(mappedData);
      } else {
        setRequests([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách yêu cầu báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';
    setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' });
  };

  const filteredRequests = React.useMemo(() => {
    if (statusFilter === 'all') return requests.map((req, idx) => ({ ...req, displayIndex: idx }));
    const statusValue = Number(statusFilter);
    let counter = 0;
    return requests
      .filter((req) => req.status === statusValue)
      .map((req) => ({
        ...req,
        displayIndex: counter++,
      }));
  }, [requests, statusFilter]);

  // Sort requests based on sortConfig
  const sortedRequests = React.useMemo(() => {
    const baseData = filteredRequests;
    if (!sortConfig.key) return baseData.map((req, idx) => ({ ...req, displayIndex: req.displayIndex ?? idx }));

    const sorted = [...baseData].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'stt') {
        aValue = a.displayIndex ?? 0;
        bValue = b.displayIndex ?? 0;
      } else if (sortConfig.key === 'code') {
        aValue = (a.code || '').toLowerCase();
        bValue = (b.code || '').toLowerCase();
      } else if (sortConfig.key === 'createdDate') {
        aValue = a.createdDate ? new Date(a.createdDate).getTime() : 0;
        bValue = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      } else if (sortConfig.key === 'sentDate') {
        aValue = a.sentDate ? new Date(a.sentDate).getTime() : 0;
        bValue = b.sentDate ? new Date(b.sentDate).getTime() : 0;
      } else if (sortConfig.key === 'status') {
        aValue = a.status !== undefined && a.status !== null ? a.status : -1;
        bValue = b.status !== undefined && b.status !== null ? b.status : -1;
      } else {
        return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted.map((req, idx) => ({
      ...req,
      displayIndex: idx,
    }));
  }, [filteredRequests, sortConfig]);

  const handleCreate = async () => {
    // Fetch products if not already loaded
    if (products.length === 0) {
      await fetchProducts();
    }
    setCreateRows([{ id: 1, productId: null, productCode: '', productName: '' }]);
    setCreateError(null);
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreateRows([{ id: 1, productId: null, productCode: '', productName: '' }]);
    setCreateError(null);
  };

  const handleAddCreateRow = () => {
    const newId = createRows.length > 0 ? Math.max(...createRows.map(r => r.id)) + 1 : 1;
    setCreateRows([...createRows, { id: newId, productId: null, productCode: '', productName: '' }]);
  };

  const handleRemoveCreateRow = (id) => {
    if (createRows.length > 1) {
      setCreateRows(createRows.filter(r => r.id !== id));
    }
  };

  const handleProductChangeCreate = (rowId, selectedProduct) => {
    setCreateRows(createRows.map(row => {
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

  const handleCreateRequest = async () => {
    const selectedProductIds = createRows
      .filter(row => row.productId)
      .map(row => row.productId);

    if (selectedProductIds.length === 0) {
      setCreateError('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    try {
      const payload = {
        ProductIdList: selectedProductIds
      };
      
      const response = await requestSalesQuotationAPI.createRequest(payload);
      
      if (response.data) {
        setSnackbarMessage('Tạo yêu cầu thành công!');
        setSnackbarOpen(true);
        handleCloseCreateDialog();
        // Refresh list
        setTimeout(() => {
          fetchRequests();
        }, 500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tạo yêu cầu báo giá';
      // Chỉ hiển thị lỗi trong dialog create, không hiển thị snackbar ở ngoài
      setCreateError(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  // Fetch products for edit dialog
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

  const handleEdit = async (id) => {
    // Kiểm tra trạng thái trước khi cho phép sửa
    const request = requests.find(r => r.id === id);
    if (request && request.status !== 0) {
      setSnackbarMessage('Chỉ có thể sửa yêu cầu ở trạng thái Nháp');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      // Fetch details to get product list
      const response = await requestSalesQuotationAPI.viewDetails(id);
      if (response.data && response.data.data) {
        setEditingRequestId(id);
        setEditInitialData(response.data.data);
        
        // Map initial data to rows
        const details = response.data.data.Details || response.data.data.details || [];
        if (details.length > 0) {
          const mappedRows = details.map((detail, index) => ({
            id: index + 1,
            productId: detail.productId || detail.ProductId,
            productCode: detail.productCode || detail.ProductCode || '',
            productName: detail.productName || detail.ProductName || '',
          }));
          setEditRows(mappedRows);
        } else {
          setEditRows([{ id: 1, productId: null, productCode: '', productName: '' }]);
        }
        
        // Fetch products if not already loaded
        if (products.length === 0) {
          await fetchProducts();
        }
        
        setEditDialogOpen(true);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải thông tin yêu cầu';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingRequestId(null);
    setEditInitialData(null);
    setEditRows([]);
    setEditError(null); // Reset error riêng của dialog edit
  };

  const handleAddEditRow = () => {
    const newId = editRows.length > 0 ? Math.max(...editRows.map(r => r.id)) + 1 : 1;
    setEditRows([...editRows, { id: newId, productId: null, productCode: '', productName: '' }]);
  };

  const handleRemoveEditRow = (id) => {
    if (editRows.length > 1) {
      setEditRows(editRows.filter(r => r.id !== id));
    }
  };

  const handleProductChange = (rowId, selectedProduct) => {
    setEditRows(editRows.map(row => {
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

  const handleUpdateRequest = async () => {
    const selectedProductIds = editRows
      .filter(row => row.productId)
      .map(row => row.productId);

    if (selectedProductIds.length === 0) {
      setEditError('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    setUpdateLoading(true);
    setEditError(null);
    try {
      const payload = {
        RsqId: editingRequestId,
        ProductIdList: selectedProductIds
      };
      
      const response = await requestSalesQuotationAPI.updateRequest(payload);
      
      if (response.data) {
        setSnackbarMessage('Cập nhật yêu cầu thành công!');
        setSnackbarOpen(true);
        handleCloseEditDialog();
        // Refresh list
        setTimeout(() => {
          fetchRequests();
        }, 500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật yêu cầu báo giá';
      // Chỉ hiển thị lỗi trong dialog edit, không hiển thị snackbar ở ngoài
      setEditError(errorMessage);
      // Không set snackbarMessage và snackbarOpen cho lỗi validate
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Kiểm tra trạng thái trước khi cho phép xóa
    const request = requests.find(r => r.id === id);
    if (request && request.status !== 0) {
      setSnackbarMessage('Chỉ có thể xóa yêu cầu ở trạng thái Nháp');
      setSnackbarOpen(true);
      return;
    }

    if (window.confirm('Bạn có chắc muốn xóa yêu cầu này?')) {
      setLoading(true);
      try {
        const response = await requestSalesQuotationAPI.deleteRequest(id);
        if (response.data) {
          setSnackbarMessage('Xóa yêu cầu thành công!');
          setSnackbarOpen(true);
          // Refresh list
          setTimeout(() => {
            fetchRequests();
          }, 500);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Không thể xóa yêu cầu báo giá';
        setError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDetails = async (id) => {
    setLoading(true);
    try {
      const response = await requestSalesQuotationAPI.viewDetails(id);
      if (response.data && response.data.data) {
        setSelectedRequestDetails(response.data.data);
        setDetailDialogOpen(true);
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

  const extractSalesQuotationId = (data) => {
    if (!data) return null;

    const directId = data.SalesQuotationId ?? data.salesQuotationId;
    if (directId) return directId;

    const singleQuotation = data.SalesQuotation ?? data.salesQuotation;
    if (singleQuotation) {
      return singleQuotation.Id ?? singleQuotation.id ?? null;
    }

    const quotationList = data.SalesQuotations ?? data.salesQuotations;
    if (Array.isArray(quotationList)) {
      const validQuotation = quotationList.find((item) => {
        const status = item.Status ?? item.status;
        return status === undefined || status === null || status !== 0;
      });

      if (validQuotation) {
        return validQuotation.Id ?? validQuotation.id ?? null;
      }
    }

    return null;
  };

  const resolveQuotationId = useCallback(async (rsqId) => {
    const response = await requestSalesQuotationAPI.viewDetails(rsqId);
    const data = response.data?.data;

    if (!data) {
      return null;
    }

    const quotationId = extractSalesQuotationId(data);

    return quotationId ? Number(quotationId) : null;
  }, []);

  const handleViewQuotation = async (rsqId) => {
    setLoading(true);
    try {
      const quotationId = await resolveQuotationId(rsqId);

      if (!quotationId) {
        setSnackbarMessage('Chưa có báo giá được gửi cho yêu cầu này.');
        setSnackbarOpen(true);
        return;
      }

      const quotationResponse = await salesQuotationAPI.viewDetails(quotationId);
      const quotationData = quotationResponse.data?.data;

      if (!quotationData) {
        throw new Error('Không lấy được dữ liệu báo giá');
      }

      navigate(
        `/customer/quotation/${rsqId}?sqId=${quotationId}`,
        { state: { sqId: quotationId, quotationData } }
      );
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể lấy thông tin báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDraftOrders = async (rsqId) => {
    setLoading(true);
    try {
      const quotationId = await resolveQuotationId(rsqId);

      if (!quotationId) {
        setSnackbarMessage('Chưa có báo giá được gửi cho yêu cầu này.');
        setSnackbarOpen(true);
        return;
      }

      const quotationInfoResponse = await salesOrderAPI.getQuotationInfo(quotationId);
      const quotationInfo = quotationInfoResponse.data?.data;

      if (!quotationInfo) {
        throw new Error('Không lấy được dữ liệu báo giá để lên đơn hàng.');
      }

      setSnackbarMessage('Đã lấy thông tin báo giá để lên đơn hàng.');
      setSnackbarOpen(true);

      setTimeout(() => {
        navigate('/customer/orders?status=draft');
      }, 500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể lấy thông tin báo giá từ hệ thống bán hàng.';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (id) => {
    if (window.confirm('Bạn có chắc muốn gửi yêu cầu báo giá này? Sau khi gửi, bạn sẽ không thể sửa hoặc xóa yêu cầu này.')) {
      setLoading(true);
      try {
        const response = await requestSalesQuotationAPI.sendRequest(id);
        if (response.data) {
          setSnackbarMessage('Gửi yêu cầu thành công! Yêu cầu đã được gửi đến bộ phận bán hàng.');
          setSnackbarOpen(true);
          // Refresh list để cập nhật trạng thái từ Nháp (0) sang Đã gửi (1)
          setTimeout(() => {
            fetchRequests();
          }, 500);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Không thể gửi yêu cầu báo giá';
        setError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    }
  };

  // Render list view
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
          Danh sách yêu cầu báo giá
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter + Create Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
            <MenuItem value="1">Đã gửi</MenuItem>
            <MenuItem value="2">Đã báo giá</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
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
          Tạo báo giá
        </Button>
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
          }}
        >
          <Table sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ width: '8%', py: 1.5, px: 2, textAlign: 'left', fontWeight: 600 }}>
                  STT
                </TableCell>
                <TableCell sx={{ width: '22%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'code'}
                    direction={sortConfig.key === 'code' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('code')}
                    hideSortIcon
                  >
                    Mã yêu cầu báo giá
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '18%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'createdDate'}
                    direction={sortConfig.key === 'createdDate' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('createdDate')}
                  >
                    Ngày tạo
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '18%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'sentDate'}
                    direction={sortConfig.key === 'sentDate' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('sentDate')}
                  >
                    Ngày gửi
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '18%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'status'}
                    direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Trạng thái
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '16%', textAlign: 'right', py: 1.5, px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    <span>Hành động</span>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRequests.map((request, index) => (
                <TableRow 
                  key={request.id || index} 
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
                  <TableCell sx={{ fontWeight: 500, textAlign: 'left' }}>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{request.code}</TableCell>
                  <TableCell>{formatDate(request.createdDate)}</TableCell>
                  <TableCell>{formatDate(request.sentDate)}</TableCell>
                  <TableCell>
                    {request.status !== undefined && request.status !== null ? (
                      <Chip
                        label={getStatusLabel(request.status)}
                        size="small"
                        sx={getStatusColor(request.status)}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      {/* Chỉ hiển thị nút Sửa và Xóa khi status là Draft (0) */}
                      {request.status === 0 && (
                        <>
                          <Tooltip title="Sửa" placement="bottom" arrow>
                            <IconButton
                              size="medium"
                              onClick={() => handleEdit(request.id)}
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
                              onClick={() => handleDelete(request.id)}
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
                        </>
                      )}
                      {request.status === 2 && (
                        <Tooltip title="Xem báo giá" placement="bottom" arrow>
                          <IconButton
                            size="medium"
                            onClick={() => handleViewQuotation(request.id)}
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
                            <DescriptionIcon fontSize="medium" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {/* Chỉ hiển thị nút Gửi khi status là Draft (0) */}
                      {request.status === 0 && (
                        <Tooltip title="Gửi" placement="bottom" arrow>
                          <IconButton
                            size="medium"
                            onClick={() => handleSend(request.id)}
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
                      )}
                      {/* Nút Xem chi tiết luôn hiển thị và luôn ở vị trí cuối cùng để thẳng hàng */}
                      <Tooltip title="Xem chi tiết" placement="bottom" arrow>
                        <IconButton
                          size="medium"
                          onClick={() => handleViewDetails(request.id)}
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
                  </TableCell>
                </TableRow>
              ))}
              {sortedRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có yêu cầu báo giá nào
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Chi tiết yêu cầu báo giá
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedRequestDetails && (
            <Box>
              {/* Thông tin yêu cầu - Layout 2 cột */}
              <Box sx={{ mb: 3, display: 'flex', gap: 4 }}>
                {/* Bên trái: Mã yêu cầu báo giá và Trạng thái */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã yêu cầu báo giá:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedRequestDetails.RequestCode || selectedRequestDetails.requestCode || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trạng thái:
                    </Typography>
                    <Chip
                      label={getStatusLabel(selectedRequestDetails.Status !== undefined ? selectedRequestDetails.Status : selectedRequestDetails.status)}
                      size="small"
                      sx={getStatusColor(selectedRequestDetails.Status !== undefined ? selectedRequestDetails.Status : selectedRequestDetails.status)}
                    />
                  </Box>
                </Box>
                
                {/* Bên phải: Ngày tạo và Ngày gửi */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày tạo:
                    </Typography>
                    <Typography variant="body1">
                      {(() => {
                        // Lấy ngày tạo từ CreatedDate hoặc extract từ RequestCode
                        const createdDate = selectedRequestDetails.CreatedDate || selectedRequestDetails.createdDate;
                        if (createdDate) {
                          return formatDate(createdDate);
                        }
                        // Nếu không có CreatedDate, extract từ RequestCode
                        const requestCode = selectedRequestDetails.RequestCode || selectedRequestDetails.requestCode || '';
                        if (requestCode) {
                          const parts = requestCode.split('-');
                          if (parts.length >= 2) {
                            const dateStr = parts[1];
                            if (dateStr && dateStr.length === 8) {
                              const year = dateStr.substring(0, 4);
                              const month = dateStr.substring(4, 6);
                              const day = dateStr.substring(6, 8);
                              return formatDate(new Date(`${year}-${month}-${day}`));
                            }
                          }
                        }
                        return '-';
                      })()}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày gửi:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedRequestDetails.RequestDate || selectedRequestDetails.requestDate)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Danh sách sản phẩm:
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small" sx={{ tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '60px', textAlign: 'center' }}>STT</TableCell>
                        <TableCell>Tên sản phẩm</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedRequestDetails.Details && selectedRequestDetails.Details.length > 0 ? (
                        selectedRequestDetails.Details.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ width: '60px', textAlign: 'center' }}>{index + 1}</TableCell>
                            <TableCell>
                              {detail.ProductName || detail.productName || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (selectedRequestDetails.details && selectedRequestDetails.details.length > 0 ? (
                        selectedRequestDetails.details.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ width: '60px', textAlign: 'center' }}>{index + 1}</TableCell>
                            <TableCell>
                              {detail.ProductName || detail.productName || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Không có sản phẩm
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Sửa yêu cầu báo giá
          </Typography>
        </DialogTitle>
        <DialogContent>
          {editInitialData && (
            <Box>
              {/* Thông tin yêu cầu - Layout 2 cột */}
              <Box sx={{ mb: 3, display: 'flex', gap: 4 }}>
                {/* Bên trái: Mã yêu cầu báo giá và Trạng thái */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã yêu cầu báo giá:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {editInitialData.RequestCode || editInitialData.requestCode || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trạng thái:
                    </Typography>
                    <Chip
                      label={getStatusLabel(editInitialData.Status !== undefined ? editInitialData.Status : editInitialData.status)}
                      size="small"
                      sx={getStatusColor(editInitialData.Status !== undefined ? editInitialData.Status : editInitialData.status)}
                    />
                  </Box>
                </Box>
                
                {/* Bên phải: Ngày tạo và Ngày gửi */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày tạo:
                    </Typography>
                    <Typography variant="body1">
                      {(() => {
                        const createdDate = editInitialData.CreatedDate || editInitialData.createdDate;
                        if (createdDate) {
                          return formatDate(createdDate);
                        }
                        const requestCode = editInitialData.RequestCode || editInitialData.requestCode || '';
                        if (requestCode) {
                          const parts = requestCode.split('-');
                          if (parts.length >= 2) {
                            const dateStr = parts[1];
                            if (dateStr && dateStr.length === 8) {
                              const year = dateStr.substring(0, 4);
                              const month = dateStr.substring(4, 6);
                              const day = dateStr.substring(6, 8);
                              return formatDate(new Date(`${year}-${month}-${day}`));
                            }
                          }
                        }
                        return '-';
                      })()}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày gửi:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(editInitialData.RequestDate || editInitialData.requestDate)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Error Alert - Chỉ hiển thị trong dialog edit */}
              {editError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEditError(null)}>
                  {editError}
                </Alert>
              )}

              {/* Danh sách sản phẩm - Có thể chỉnh sửa */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Danh sách sản phẩm:
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddEditRow}
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
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small" sx={{ tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '60px', textAlign: 'center', whiteSpace: 'nowrap' }}>STT</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>Tên sản phẩm</TableCell>
                        <TableCell sx={{ width: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editRows.map((row, index) => (
                        <TableRow key={row.id}>
                          <TableCell sx={{ width: '60px', textAlign: 'center' }}>
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
                              sx={{ minWidth: 200 }}
                            />
                          </TableCell>
                          <TableCell sx={{ width: '50px' }}>
                            {editRows.length > 1 && (
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveEditRow(row.id)}
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
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={updateLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleUpdateRequest}
            variant="contained"
            disabled={updateLoading}
            sx={{
              backgroundColor: '#155E64',
              '&:hover': {
                backgroundColor: '#0D4F52',
              },
            }}
          >
            {updateLoading ? <CircularProgress size={24} color="inherit" /> : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Tạo yêu cầu báo giá
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box>
            {/* Error Alert - Chỉ hiển thị trong dialog create */}
            {createError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCreateError(null)}>
                {createError}
              </Alert>
            )}

            {/* Danh sách sản phẩm */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Danh sách sản phẩm:
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddCreateRow}
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
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '60px', textAlign: 'center', whiteSpace: 'nowrap' }}>STT</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Tên sản phẩm</TableCell>
                      <TableCell sx={{ width: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {createRows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell sx={{ width: '60px', textAlign: 'center' }}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={{ padding: '8px' }}>
                          <Autocomplete
                            options={products}
                            getOptionLabel={(option) => {
                              if (!option) return '';
                              return option.productName || option.name || '';
                            }}
                            value={products.find(p => (p.productID || p.id) === row.productId) || null}
                            onChange={(event, newValue) => handleProductChangeCreate(row.id, newValue)}
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
                            sx={{ width: '100%', minWidth: 0 }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: '100px', textAlign: 'center', padding: '8px' }}>
                          {createRows.length > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveCreateRow(row.id)}
                                sx={{ color: '#d32f2f' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={createLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleCreateRequest}
            variant="contained"
            disabled={createLoading}
            sx={{
              backgroundColor: '#155E64',
              '&:hover': {
                backgroundColor: '#0D4F52',
              },
            }}
          >
            {createLoading ? <CircularProgress size={24} color="inherit" /> : 'Tạo yêu cầu'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default CustomerRequestQuotationList;

