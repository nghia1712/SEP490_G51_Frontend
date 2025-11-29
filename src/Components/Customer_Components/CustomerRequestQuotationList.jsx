// File: CustomerRequestQuotationList.jsx - Danh sách yêu cầu báo giá cho Customer
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
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
import useUser from '../../Hooks/useUser';

const headerTextSx = {
  textTransform: 'uppercase',
  fontWeight: 600,
  letterSpacing: '0.03em',
};

const CustomerRequestQuotationList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [pendingRsqId, setPendingRsqId] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [editInitialData, setEditInitialData] = useState(null);
  const [editRows, setEditRows] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createRows, setCreateRows] = useState([{ id: 1, productId: null, productCode: '', productName: '' }]);
  const [createSubmitStatus, setCreateSubmitStatus] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editError, setEditError] = useState(null); // Error riêng cho dialog edit
  const [createError, setCreateError] = useState(null); // Error riêng cho dialog create
  const [statusFilter, setStatusFilter] = useState('all');
  const [quotationDetailDialogOpen, setQuotationDetailDialogOpen] = useState(false);
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState(null);
  const [quotationSelectionDialogOpen, setQuotationSelectionDialogOpen] = useState(false);
  const [availableQuotations, setAvailableQuotations] = useState([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [orderFormDialogOpen, setOrderFormDialogOpen] = useState(false);
  const [orderFormData, setOrderFormData] = useState(null);
  const [orderFormRows, setOrderFormRows] = useState([]);
  const [orderFormLoading, setOrderFormLoading] = useState(false);
  const { getProfile } = useUser();

  const parseDateValue = (value) => {
    if (!value) return null;
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;

    if (typeof value === 'string') {
      const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (match) {
        const alternative = new Date(`${match[3]}-${match[2]}-${match[1]}`);
        if (!Number.isNaN(alternative.getTime())) {
          return alternative;
        }
      }
    }

    return null;
  };

  const isExpiredDate = (value) => {
    const parsed = parseDateValue(value);
    if (!parsed) return false;
    const deadline = new Date(parsed);
    deadline.setHours(23, 59, 59, 999);
    return deadline.getTime() < Date.now();
  };

  const getTimestamp = (value) => {
    const parsed = parseDateValue(value);
    return parsed ? parsed.getTime() : 0;
  };

  // Map status enum
  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return 'Nháp';
      case 1:
        return 'Đã gửi';
      case 2:
        return 'Đã báo giá';
      case 3:
        return 'Hết hạn';
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
      case 3:
        return { backgroundColor: '#f8d7da', color: '#721c24' }; // Expired - Red
      default:
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    }
  };

  const getDisplayStatus = (status, expiredDate = null) => {
    if (status === undefined || status === null) return status;
    const normalizedStatus = Number(status);
    if (normalizedStatus === 2 && expiredDate && isExpiredDate(expiredDate)) {
      return 3;
    }
    return normalizedStatus;
  };

  const getQuotationDetailStatus = (status, expiredDate = null) => {
    if (expiredDate && isExpiredDate(expiredDate)) {
      return 3; // Hết hạn
    }
    return 2; // Đã báo giá
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';

    try {
      const date = parseDateValue(dateString);

      if (!date) return '-';

      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (error) {
      return '-';
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    // Convert to number
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return '-';
    // Round to integer (Vietnamese currency doesn't use decimals)
    const intValue = Math.round(numValue);
    // Format with comma as thousand separator
    return intValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const renderCurrency = (value, options = {}) => {
    if (value === null || value === undefined) return '-';
    const { fontWeight } = options;
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 0.35,
        }}
      >
        <Typography component="span" sx={{ fontWeight: fontWeight ?? 500 }}>
          {formatCurrency(value)}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontSize: '0.8em',
            lineHeight: 1,
            borderBottom: '1px solid currentColor',
            paddingBottom: '1px',
            fontWeight: fontWeight ?? 500,
          }}
        >
          đ
        </Typography>
      </Box>
    );
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

  // Calculate total before tax from total after tax and tax rate
  const calculateTotalBeforeTax = (totalAfterTax, taxRate) => {
    if (!totalAfterTax || totalAfterTax === 0) return 0;
    if (!taxRate || taxRate === 0) return totalAfterTax;
    return totalAfterTax / (1 + taxRate);
  };

  // Hàm extract ngày từ RequestCode (format: RSQ-{yyyyMMdd}-{random})
  const extractDateFromCode = (code) => {
    if (!code) return null;
    try {
      // RequestCode format: RSQ-20250115-ABC12345
      const parts = code.split('-');
      if (parts.length >= 2) {
        const dateStr = parts[1]; // yyyyMMdd
        if (dateStr && dateStr.length === 8 && /^\d+$/.test(dateStr)) {
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

  // Lấy ngày tạo từ localStorage (được lưu khi tạo request)
  const getStoredCreatedDate = (requestCode) => {
    if (!requestCode) return null;
    try {
      const stored = localStorage.getItem(`rsq_created_${requestCode}`);
      if (stored) {
        const date = parseDateValue(stored);
        if (date) return date;
      }
    } catch (error) {
      console.error('Error reading stored created date:', error);
    }
    return null;
  };

  // Fetch data from API
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestsResult, quotationsResult] = await Promise.allSettled([
        requestSalesQuotationAPI.viewList(),
        salesQuotationAPI.viewList(),
      ]);

      if (requestsResult.status === 'rejected') {
        throw requestsResult.reason;
      }

      const requestResponse = requestsResult.value;
      const requestPayload = requestResponse?.data?.data;
      const requestsData = Array.isArray(requestPayload) ? requestPayload : [];

      if (quotationsResult.status === 'rejected') {
        console.warn('Không thể tải danh sách báo giá để đồng bộ trạng thái hết hạn:', quotationsResult.reason);
      }

      const quotationPayload = quotationsResult.status === 'fulfilled'
        ? quotationsResult.value?.data?.data
        : [];
      const quotationsData = Array.isArray(quotationPayload) ? quotationPayload : [];

      const quotationInfoMap = quotationsData.reduce((acc, quotation) => {
        const requestCode = quotation.RequestCode || quotation.requestCode || '';
        if (!requestCode) return acc;

        const quotationStatus = quotation.Status !== undefined ? quotation.Status : quotation.status;
        const expiredDate = quotation.ExpiredDate || quotation.expiredDate || null;
        const quotationDate = quotation.QuotationDate || quotation.quotationDate || null;
        const timestamp = getTimestamp(quotationDate);
        const existing = acc[requestCode];
        const existingPriority = existing?.status ?? -1;
        const newPriority = quotationStatus ?? -1;
        const shouldReplace =
          !existing ||
          newPriority > existingPriority ||
          (newPriority === existingPriority && timestamp >= (existing?.timestamp ?? 0));

        if (shouldReplace) {
          acc[requestCode] = {
            status: quotationStatus,
            expiredDate,
            timestamp,
          };
        }

        return acc;
      }, {});

      const mappedData = requestsData.map((item, index) => {
        const backendStatus = item.Status !== undefined ? item.Status : item.status;
        const requestDate = item.RequestDate || item.requestDate || null;
        const requestCode = item.RequestCode || item.requestCode || '';

        // Ưu tiên: CreatedDate từ backend > localStorage > extract từ RequestCode
        const backendCreatedDate = item.CreatedDate || item.createdDate || null;
        let createdDate = backendCreatedDate 
          ? parseDateValue(backendCreatedDate) 
          : getStoredCreatedDate(requestCode) || extractDateFromCode(requestCode);
        
        // Nếu vẫn không có createdDate, xử lý theo trạng thái
        if (!createdDate && requestCode) {
          const storedDate = getStoredCreatedDate(requestCode);
          
          if (storedDate) {
            // Đã có trong localStorage, dùng nó
            createdDate = storedDate;
          } else if (backendStatus === 0) {
            // Request nháp: lưu ngày hiện tại vào localStorage
            const currentDate = new Date();
            try {
              localStorage.setItem(`rsq_created_${requestCode}`, currentDate.toISOString());
              createdDate = currentDate;
            } catch (error) {
              console.error('Error storing created date:', error);
              createdDate = currentDate;
            }
          } else if ((backendStatus === 1 || backendStatus === 2) && requestDate) {
            // Request đã gửi: dùng RequestDate làm ngày tạo (thường request được tạo và gửi cùng ngày)
            // Lưu vào localStorage để giữ cho lần sau
            const sentDate = parseDateValue(requestDate);
            if (sentDate) {
              try {
                localStorage.setItem(`rsq_created_${requestCode}`, sentDate.toISOString());
                createdDate = sentDate;
              } catch (error) {
                console.error('Error storing created date:', error);
                createdDate = sentDate;
              }
            }
          }
        }
        
        const sentDate = (backendStatus === 1 || backendStatus === 2) && requestDate ? requestDate : null;

        const quotationInfo = quotationInfoMap[requestCode];
        const quotationExpiredDate = quotationInfo?.expiredDate || null;
        const quotationStatus = quotationInfo?.status;
        const expiredByStatus = quotationStatus === 2;
        const expiredByDate = quotationExpiredDate ? isExpiredDate(quotationExpiredDate) : false;
        const isExpired = backendStatus === 2 && (expiredByStatus || expiredByDate);
        const displayStatus = isExpired ? 3 : backendStatus;

        return {
          id: item.Id || item.id,
          code: requestCode,
          createdDate,
          sentDate,
          status: displayStatus,
          rawStatus: backendStatus,
          quotationExpiredDate,
          isExpired,
          originalIndex: index,
        };
      });

      setRequests(mappedData);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Không thể tải danh sách yêu cầu báo giá';
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

  // Xử lý pending rsqId sau khi requests đã được fetch
  useEffect(() => {
    if (pendingRsqId && requests.length > 0) {
      console.log('CustomerRequestQuotationList - Processing pending rsqId:', pendingRsqId);
      const openRequestDetailsDialog = async () => {
        try {
          const response = await requestSalesQuotationAPI.viewDetails(pendingRsqId);
          if (response?.data?.data) {
            console.log('CustomerRequestQuotationList - Opening dialog with pending rsqId');
            setSelectedRequestDetails(response.data.data);
            setDetailDialogOpen(true);
            setPendingRsqId(null);
          }
        } catch (err) {
          console.error('CustomerRequestQuotationList - Error opening dialog with pending rsqId:', err);
          setPendingRsqId(null);
        }
      };
      openRequestDetailsDialog();
    }
  }, [pendingRsqId, requests]);

  // Auto-open quotation dialog from notification
  useEffect(() => {
    const sqId = location.state?.sqId || location.state?.openQuotationId;
    if (sqId) {
      // Clear state to prevent re-opening on re-render
      navigate(location.pathname, { replace: true, state: {} });
      
      // Open quotation dialog directly with sqId
      const openQuotationDialog = async () => {
        try {
          // Get quotation details
          const quotationResponse = await salesQuotationAPI.viewDetails(sqId);
          const quotationData = quotationResponse.data?.data;
          
          if (quotationData) {
            // Open dialog directly
            setSelectedQuotationDetails(quotationData);
            setCommentInput('');
            setQuotationDetailDialogOpen(true);
          }
        } catch (err) {
          console.error('Error opening quotation dialog from notification:', err);
          setSnackbarMessage('Không thể mở chi tiết báo giá');
          setSnackbarOpen(true);
        }
      };
      
      openQuotationDialog();
    }
  }, [location.state, navigate]);

  // Auto-open request details dialog from notification
  useEffect(() => {
    const rsqId = location.state?.openRsqId;
    console.log('CustomerRequestQuotationList - useEffect triggered, location.state:', location.state);
    console.log('CustomerRequestQuotationList - rsqId:', rsqId, 'Type:', typeof rsqId);
    
    if (rsqId) {
      const normalizedRsqId = Number(rsqId);
      console.log('CustomerRequestQuotationList - Normalized rsqId:', normalizedRsqId);
      
      if (isNaN(normalizedRsqId)) {
        console.error('CustomerRequestQuotationList - Invalid rsqId:', rsqId);
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }
      
      // Clear state ngay lập tức để tránh re-trigger
      navigate(location.pathname, { replace: true, state: {} });
      
      console.log('CustomerRequestQuotationList - Setting pending rsqId:', normalizedRsqId);
      // Set pending rsqId để xử lý sau khi requests đã được fetch
      setPendingRsqId(normalizedRsqId);
    }
  }, [location.state, navigate]);

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

  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / pageSize));
  const paginatedRequests = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRequests.slice(start, start + pageSize);
  }, [sortedRequests, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

  const handleCreateRequest = async (status = 0) => {
    const selectedProductIds = createRows
      .filter(row => row.productId)
      .map(row => row.productId);

    if (selectedProductIds.length === 0) {
      setCreateError('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    setCreateSubmitStatus(status);
    setCreateLoading(true);
    setCreateError(null);
    try {
      const payload = {
        ProductIdList: selectedProductIds,
        Status: status,
      };
      
      const response = await requestSalesQuotationAPI.createRequest(payload);
      
      if (response.data) {
        setSnackbarMessage(status === 1 ? 'Gửi yêu cầu báo giá thành công!' : 'Lưu nháp yêu cầu thành công!');
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
      setCreateSubmitStatus(null);
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
    console.log('CustomerRequestQuotationList - resolveQuotationId called with rsqId:', rsqId);
    try {
      // First, get request details to get RequestCode
      const requestResponse = await requestSalesQuotationAPI.viewDetails(rsqId);
      console.log('CustomerRequestQuotationList - Request details response:', requestResponse);
      const requestData = requestResponse.data?.data;
      console.log('CustomerRequestQuotationList - Request details data:', requestData);

      if (!requestData) {
        console.error('CustomerRequestQuotationList - No request data in response');
      return null;
    }

      // Try to extract from request data first
      let quotationId = extractSalesQuotationId(requestData);
      if (quotationId) {
        console.log('CustomerRequestQuotationList - Found quotationId from request data:', quotationId);
        return Number(quotationId);
      }

      // If not found, get RequestCode and find in SalesQuotation list
      const requestCode = requestData.RequestCode ?? requestData.requestCode;
      console.log('CustomerRequestQuotationList - Request code:', requestCode);

      if (!requestCode) {
        console.error('CustomerRequestQuotationList - No RequestCode found');
        return null;
      }

      // Fetch SalesQuotation list
      console.log('CustomerRequestQuotationList - Fetching SalesQuotation list');
      const quotationListResponse = await salesQuotationAPI.viewList();
      console.log('CustomerRequestQuotationList - Quotation list response:', quotationListResponse);
      const quotationList = quotationListResponse.data?.data;
      console.log('CustomerRequestQuotationList - Quotation list:', quotationList);

      if (!quotationList || !Array.isArray(quotationList)) {
        console.error('CustomerRequestQuotationList - No quotation list or not an array');
        return null;
      }

      // Find quotation with matching RequestCode
      const matchingQuotation = quotationList.find((q) => {
        const qRequestCode = q.RequestCode ?? q.requestCode;
        return qRequestCode === requestCode;
      });

      if (matchingQuotation) {
        quotationId = matchingQuotation.Id ?? matchingQuotation.id;
        console.log('CustomerRequestQuotationList - Found quotationId from list:', quotationId);
    return quotationId ? Number(quotationId) : null;
      }

      console.error('CustomerRequestQuotationList - No matching quotation found');
      return null;
    } catch (err) {
      console.error('CustomerRequestQuotationList - Error in resolveQuotationId:', err);
      return null;
    }
  }, []);

  const handleViewQuotation = async (rsqId) => {
    console.log('CustomerRequestQuotationList - handleViewQuotation called with rsqId:', rsqId);
    setLoading(true);
    try {
      // Lấy RequestCode từ request details
      const requestResponse = await requestSalesQuotationAPI.viewDetails(rsqId);
      const requestData = requestResponse.data?.data;
      
      if (!requestData) {
        throw new Error('Không lấy được thông tin yêu cầu');
      }

      const requestCode = requestData.RequestCode ?? requestData.requestCode;
      if (!requestCode) {
        throw new Error('Không tìm thấy mã yêu cầu');
      }

      // Lấy tất cả các báo giá liên quan đến RequestCode
      const quotationListResponse = await salesQuotationAPI.viewList();
      const quotationList = quotationListResponse.data?.data || [];
      
      // Lọc các báo giá có RequestCode trùng khớp và không phải draft (status !== 0)
      const relatedQuotations = quotationList
        .filter((q) => {
          const qRequestCode = q.RequestCode ?? q.requestCode;
          const qStatus = q.Status !== undefined ? q.Status : q.status;
          return qRequestCode === requestCode && qStatus !== 0 && qStatus !== null && qStatus !== undefined;
        })
        .map((q) => ({
          id: q.Id ?? q.id,
          code: q.QuotationCode ?? q.quotationCode ?? '-',
          date: q.QuotationDate ?? q.quotationDate ?? null,
          status: q.Status !== undefined ? q.Status : q.status,
        }))
        .sort((a, b) => {
          // Sắp xếp theo ngày giảm dần (mới nhất trước)
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });

      if (relatedQuotations.length === 0) {
        setSnackbarMessage('Chưa có báo giá được gửi cho yêu cầu này.');
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      // Nếu chỉ có 1 báo giá, mở trực tiếp
      if (relatedQuotations.length === 1) {
        const quotationId = relatedQuotations[0].id;
        const quotationResponse = await salesQuotationAPI.viewDetails(quotationId);
        const quotationData = quotationResponse.data?.data;

        if (!quotationData) {
          throw new Error('Không lấy được dữ liệu báo giá');
        }

        setSelectedQuotationDetails(quotationData);
        setCommentInput('');
        setQuotationDetailDialogOpen(true);
      } else {
        // Nếu có nhiều báo giá, hiển thị dialog chọn
        setAvailableQuotations(relatedQuotations);
        setQuotationSelectionDialogOpen(true);
      }
    } catch (err) {
      console.error('CustomerRequestQuotationList - Error in handleViewQuotation:', err);
      console.error('CustomerRequestQuotationList - Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể lấy thông tin báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      console.log('CustomerRequestQuotationList - handleViewQuotation completed');
    }
  };

  const handleSelectQuotation = async (quotationId) => {
    setQuotationSelectionDialogOpen(false);
    setLoading(true);
    try {
      const quotationResponse = await salesQuotationAPI.viewDetails(quotationId);
      const quotationData = quotationResponse.data?.data;

      if (!quotationData) {
        throw new Error('Không lấy được dữ liệu báo giá');
      }

      setSelectedQuotationDetails(quotationData);
      setCommentInput('');
      setQuotationDetailDialogOpen(true);
    } catch (err) {
      console.error('CustomerRequestQuotationList - Error loading quotation details:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải chi tiết báo giá';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedQuotationDetails) {
      setSnackbarMessage('Không xác định được thông tin báo giá');
      setSnackbarOpen(true);
      return;
    }
    
    const salesQuotationId = selectedQuotationDetails.Id || selectedQuotationDetails.id;
    if (!salesQuotationId) {
      setSnackbarMessage('Không xác định được mã báo giá');
      setSnackbarOpen(true);
      return;
    }
    
    if (!commentInput.trim()) {
      setSnackbarMessage('Vui lòng nhập nội dung bình luận');
      setSnackbarOpen(true);
      return;
    }

    setIsSubmittingComment(true);
    try {
      await salesQuotationAPI.addComment(salesQuotationId, commentInput.trim());
      setCommentInput('');
      // Reload quotation details to get updated comments
      const quotationResponse = await salesQuotationAPI.viewDetails(salesQuotationId);
      if (quotationResponse.data && quotationResponse.data.data) {
        setSelectedQuotationDetails(quotationResponse.data.data);
      }
      setSnackbarMessage('Đã gửi bình luận');
      setSnackbarOpen(true);
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể gửi bình luận';
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedQuotationDetails) {
      setSnackbarMessage('Không xác định được thông tin báo giá để tạo đơn hàng.');
      setSnackbarOpen(true);
      return;
    }

    const salesQuotationId = selectedQuotationDetails.Id || selectedQuotationDetails.id;
    if (!salesQuotationId) {
      setSnackbarMessage('Không xác định được mã báo giá để tạo đơn hàng.');
      setSnackbarOpen(true);
      return;
    }

    setIsCreatingOrder(true);
    try {
      const quotationInfoRes = await salesOrderAPI.getQuotationInfo(salesQuotationId);
      console.log('Quotation info response', quotationInfoRes.data);
      const quotationInfo = quotationInfoRes.data?.data;

      if (!quotationInfo) {
        throw new Error('Không lấy được thông tin báo giá.');
      }

      const detailList = quotationInfo.Details || quotationInfo.details || [];

      if (!Array.isArray(detailList) || detailList.length === 0) {
        throw new Error('Báo giá không có sản phẩm để tạo đơn hàng.');
      }

      // Get quotation details to get tax information
      const quotationDetailsRes = await salesQuotationAPI.viewDetails(salesQuotationId);
      const quotationDetailsData = quotationDetailsRes.data?.data;
      const quotationDetailsList = quotationDetailsData?.Details || quotationDetailsData?.details || [];

      // Prepare form data from quotation info
      // Map by index since both APIs return products in the same order
      const formRows = detailList
        .map((detail, index) => {
          const productIdRaw = detail.ProductId ?? detail.productId;
          const lotId = detail.LotId ?? detail.lotId;
          const parsedProductId = Number(productIdRaw);
          const parsedLotId = Number(lotId);

          if (!Number.isFinite(parsedProductId) || !Number.isFinite(parsedLotId)) {
            return null;
          }

          const rawQuantity =
            detail.MinQuantity ??
            detail.minQuantity ??
            detail.Quantity ??
            detail.quantity ??
            1;
          const parsedQuantity = Number(rawQuantity);
          const quantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
          const unitPrice = detail.UnitPrice ?? detail.unitPrice ?? 0;
          
          // Get tax info from quotation details by index
          const quotationDetail = quotationDetailsList[index];
          const taxText = quotationDetail?.TaxText ?? quotationDetail?.taxText ?? '-';
          const taxRate = taxText !== '-' ? getTaxRateFromText(taxText) : 0;
          const unitPriceAfterTax = unitPrice * (1 + taxRate);
          const subtotal = quantity * unitPrice;
          const subtotalAfterTax = quantity * unitPriceAfterTax;
          
          // Get expired date
          const expiredDate = detail.LotExpiredDate ?? detail.lotExpiredDate;
          const formattedExpiredDate = expiredDate 
            ? formatDate(expiredDate) 
            : (quotationDetail?.ExpiredDate ?? quotationDetail?.expiredDate ?? '-');

          // Get product unit - API getQuotationInfo trả về LotUnit trong detail
          const productUnit = detail.LotUnit ?? detail.lotUnit ?? detail.ProductUnit ?? detail.productUnit ?? detail.Unit ?? detail.unit ?? quotationDetail?.Unit ?? quotationDetail?.unit ?? '-';

          return {
            id: index + 1,
            productId: parsedProductId,
            productName: detail.ProductName ?? detail.productName ?? '-',
            productUnit: productUnit,
            lotId: parsedLotId,
            quantity,
            unitPrice,
            taxText,
            taxRate,
            unitPriceAfterTax,
            expiredDate: formattedExpiredDate,
            subtotal,
            subtotalAfterTax,
          };
        })
        .filter(Boolean);

      if (formRows.length === 0) {
        throw new Error('Không có sản phẩm hợp lệ để tạo đơn hàng.');
      }

      // Set form data and open dialog
      const depositPercent = quotationInfo.DepositPercent ?? quotationInfo.depositPercent ?? null;
      const depositDueDaysRaw = quotationInfo.DepositDueDays ?? quotationInfo.depositDueDays ?? null;
      const depositDueDays =
        depositDueDaysRaw !== null && depositDueDaysRaw !== undefined
          ? Number(depositDueDaysRaw)
          : null;
      const quotationDateRaw = quotationInfo.QuotationDate ?? quotationInfo.quotationDate ?? null;
      let depositExpiredDate = null;
      if (quotationDateRaw && Number.isFinite(depositDueDays) && depositDueDays > 0) {
        const baseDate = new Date(quotationDateRaw);
        if (!Number.isNaN(baseDate.getTime())) {
          const expired = new Date(baseDate);
          expired.setDate(expired.getDate() + depositDueDays);
          depositExpiredDate = expired.toISOString();
        }
      }

      setOrderFormData({
        salesQuotationId,
        quotationInfo,
        depositPercent,
        depositDueDays,
        depositExpiredDate,
      });
      setOrderFormRows(formRows);
      setQuotationDetailDialogOpen(false); // Close quotation dialog
      setOrderFormDialogOpen(true); // Open order form dialog
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Không thể tải thông tin báo giá.';
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleCloseOrderFormDialog = () => {
    setOrderFormDialogOpen(false);
    setOrderFormData(null);
    setOrderFormRows([]);
  };

  const handleQuantityChange = (rowId, newQuantity) => {
    const quantity = Math.max(1, Number(newQuantity) || 1);
    setOrderFormRows(rows =>
      rows.map(row => {
        if (row.id === rowId) {
          const subtotal = quantity * row.unitPrice;
          const subtotalAfterTax = quantity * row.unitPriceAfterTax;
          return {
            ...row,
            quantity,
            subtotal,
            subtotalAfterTax,
          };
        }
        return row;
      })
    );
  };

  const handleRemoveProduct = (rowId) => {
    if (orderFormRows.length > 1) {
      setOrderFormRows(orderFormRows.filter(row => row.id !== rowId));
    } else {
      setSnackbarMessage('Phải có ít nhất một sản phẩm trong đơn hàng.');
      setSnackbarOpen(true);
    }
  };

  const createOrderPayload = () => {
    if (!orderFormData || orderFormRows.length === 0) {
      return null;
    }

    const detailsPayload = orderFormRows.map((row) => ({
      productId: row.productId,
      lotId: row.lotId,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      subTotalPrice: 0,
    }));

    return {
      salesOrderCode: '',
      salesQuotationId: orderFormData.salesQuotationId,
      createBy: 'placeholder',
      status: 0,
      totalPrice: 0,
      isDeposited: false,
      details: detailsPayload,
      customerDebt: {
        customerId: 'placeholder',
        salesOrderId: 0,
        debtAmount: 0,
      },
    };
  };

  const handleSaveDraftOrder = async () => {
    if (!orderFormData || orderFormRows.length === 0) {
      setSnackbarMessage('Không có dữ liệu để tạo đơn hàng.');
      setSnackbarOpen(true);
      return;
    }

    setOrderFormLoading(true);
    try {
      const payload = createOrderPayload();

      console.log('Creating order with payload', payload);
      const createOrderRes = await salesOrderAPI.createDraftFromQuotation(payload);
      console.log('Create order response', createOrderRes.data);
      const orderData = createOrderRes.data?.data;

      const orderId = orderData?.SalesOrderId ?? orderData?.salesOrderId;

      // Close dialog
      handleCloseOrderFormDialog();

      setSnackbarMessage('Tạo đơn hàng nháp thành công.');
      setSnackbarOpen(true);

      // Navigate to orders page and auto-open order details
      if (orderId) {
        navigate('/customer/orders', {
          state: {
            openOrderId: orderId,
            fromQuotation: true,
          },
        });
      } else {
        navigate('/customer/orders');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Không thể Tạo đơn hàng.';
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      setOrderFormLoading(false);
    }
  };

  const handleSendOrder = async () => {
    if (!orderFormData || orderFormRows.length === 0) {
      setSnackbarMessage('Không có dữ liệu để tạo đơn hàng.');
      setSnackbarOpen(true);
      return;
    }

    setOrderFormLoading(true);
    try {
      const payload = createOrderPayload();

      console.log('Creating order with payload', payload);
      const createOrderRes = await salesOrderAPI.createDraftFromQuotation(payload);
      console.log('Create order response', createOrderRes.data);
      const orderData = createOrderRes.data?.data;

      const orderId = orderData?.SalesOrderId ?? orderData?.salesOrderId;

      if (!orderId) {
        throw new Error('Không lấy được mã đơn hàng sau khi tạo.');
      }

      // Send order (change status from Draft to Sent)
      console.log('Sending order with id', orderId);
      await salesOrderAPI.sendOrder(orderId);
      console.log('Order sent successfully');

      // Close dialog
      handleCloseOrderFormDialog();

      setSnackbarMessage('Gửi đơn hàng thành công.');
      setSnackbarOpen(true);

      // Navigate to orders page and auto-open order details
      navigate('/customer/orders', {
        state: {
          openOrderId: orderId,
          fromQuotation: true,
        },
      });
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Không thể gửi đơn hàng.';
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      setOrderFormLoading(false);
    }
  };

  const orderTotals = React.useMemo(() => {
    const totals = orderFormRows.reduce(
      (acc, row) => {
        const before = Number(row.subtotal) || 0;
        const after = Number(row.subtotalAfterTax) || 0;
        acc.before += before;
        acc.after += after;
        return acc;
      },
      { before: 0, after: 0 }
    );
    return {
      ...totals,
      tax: Math.max(totals.after - totals.before, 0),
    };
  }, [orderFormRows]);

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
        throw new Error('Không lấy được dữ liệu báo giá để Tạo đơn hàng.');
      }

      setSnackbarMessage('Đã lấy thông tin báo giá để Tạo đơn hàng.');
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
            <MenuItem value="3">Hết hạn</MenuItem>
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
                <TableCell sx={{ width: '22%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'code'}
                    direction={sortConfig.key === 'code' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('code')}
                    hideSortIcon
                    sx={headerTextSx}
                  >
                    Mã yêu cầu báo giá
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '18%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'createdDate'}
                    direction={sortConfig.key === 'createdDate' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('createdDate')}
                    sx={headerTextSx}
                  >
                    Ngày tạo
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '18%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'sentDate'}
                    direction={sortConfig.key === 'sentDate' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('sentDate')}
                    sx={headerTextSx}
                  >
                    Ngày gửi
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '18%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'status'}
                    direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('status')}
                    sx={headerTextSx}
                  >
                    Trạng thái
                  </TableSortLabel>
                </TableCell>
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
              {paginatedRequests.map((request, index) => (
                <TableRow
                  key={request.id || index}
                  hover
                  sx={{
                    '&:nth-of-type(even)': { backgroundColor: '#f9f9f9' },
                    '& td': { py: 1.5, px: 2, verticalAlign: 'middle' },
                  }}
                >
                  <TableCell sx={{ fontWeight: 500, textAlign: 'left' }}>
                    {(page - 1) * pageSize + index + 1}
                  </TableCell>
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
                      {request.rawStatus === 0 && (
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
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' },
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
                                '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' },
                              }}
                            >
                              <DeleteIcon fontSize="medium" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {request.rawStatus === 2 && (
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
                              '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' },
                            }}
                          >
                            <DescriptionIcon fontSize="medium" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {request.rawStatus === 0 && (
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
                              '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' },
                            }}
                          >
                            <SendIcon fontSize="medium" />
                          </IconButton>
                        </Tooltip>
                      )}
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
                            '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' },
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
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có yêu cầu báo giá nào
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {sortedRequests.length > 0 && (
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
                        const requestCode = selectedRequestDetails.RequestCode || selectedRequestDetails.requestCode || '';
                        const backendStatus = selectedRequestDetails.Status !== undefined ? selectedRequestDetails.Status : selectedRequestDetails.status;
                        const requestDate = selectedRequestDetails.RequestDate || selectedRequestDetails.requestDate || null;
                        
                        // Ưu tiên: CreatedDate từ backend > localStorage > extract từ RequestCode > RequestDate (nếu đã gửi)
                        const backendCreatedDate = selectedRequestDetails.CreatedDate || selectedRequestDetails.createdDate;
                        let createdDate = backendCreatedDate 
                          ? parseDateValue(backendCreatedDate) 
                          : getStoredCreatedDate(requestCode) || extractDateFromCode(requestCode);
                        
                        // Nếu vẫn không có và là request đã gửi, dùng RequestDate
                        if (!createdDate && (backendStatus === 1 || backendStatus === 2) && requestDate) {
                          createdDate = parseDateValue(requestDate);
                        }
                        
                        return createdDate ? formatDate(createdDate) : '-';
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
              <Box
                sx={{
                  mb: 2,
                  maxWidth: 300,
                  mx: 'auto',
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Danh sách sản phẩm:
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    '& .MuiTableCell-root': {
                      py: 0.75,
                      px: 1.25,
                      fontSize: '0.9rem',
                    },
                  }}
                >
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
                        const requestCode = editInitialData.RequestCode || editInitialData.requestCode || '';
                        
                        // Ưu tiên: CreatedDate từ backend > localStorage > extract từ RequestCode
                        const backendCreatedDate = editInitialData.CreatedDate || editInitialData.createdDate;
                        const createdDate = backendCreatedDate 
                          ? parseDateValue(backendCreatedDate) 
                          : getStoredCreatedDate(requestCode) || extractDateFromCode(requestCode);
                        
                        return createdDate ? formatDate(createdDate) : '-';
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
            onClick={() => handleCreateRequest(0)}
            variant="outlined"
            disabled={createLoading}
            sx={{
              borderColor: '#155E64',
              color: '#155E64',
              '&:hover': {
                borderColor: '#0D4F52',
                backgroundColor: 'rgba(21, 94, 100, 0.05)',
              },
            }}
          >
            {createLoading && createSubmitStatus === 0 ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Lưu nháp'
            )}
          </Button>
          <Button
            onClick={() => handleCreateRequest(1)}
            variant="contained"
            disabled={createLoading}
            sx={{
              backgroundColor: '#155E64',
              '&:hover': {
                backgroundColor: '#0D4F52',
              },
            }}
          >
            {createLoading && createSubmitStatus === 1 ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Gửi yêu cầu'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quotation Selection Dialog */}
      <Dialog
        open={quotationSelectionDialogOpen}
        onClose={() => setQuotationSelectionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Chọn báo giá để xem
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Yêu cầu này có {availableQuotations.length} báo giá. Vui lòng chọn báo giá bạn muốn xem:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {availableQuotations.map((quotation) => (
                <Button
                  key={quotation.id}
                  variant="outlined"
                  fullWidth
                  onClick={() => handleSelectQuotation(quotation.id)}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    py: 1.5,
                    px: 2,
                    borderColor: '#1976d2',
                    '&:hover': {
                      borderColor: '#1565c0',
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {quotation.code}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {quotation.date ? formatDate(quotation.date) : 'Chưa có ngày'}
                    </Typography>
                  </Box>
                </Button>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuotationSelectionDialogOpen(false)}>
            Hủy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quotation Detail Dialog */}
      <Dialog
        open={quotationDetailDialogOpen}
        onClose={() => setQuotationDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Chi tiết báo giá
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedQuotationDetails && (
            <Box>
              {/* Thông tin báo giá - Layout 2 cột */}
              <Box sx={{ mb: 3, display: 'flex', gap: 4 }}>
                {/* Bên trái: Mã yêu cầu báo giá, Mã báo giá và Trạng thái */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã yêu cầu báo giá:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedQuotationDetails.RequestCode || selectedQuotationDetails.requestCode || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã báo giá:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedQuotationDetails.QuotationCode || selectedQuotationDetails.quotationCode || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trạng thái:
                    </Typography>
                    {(() => {
                      const rawStatus = selectedQuotationDetails.Status !== undefined
                        ? selectedQuotationDetails.Status
                        : selectedQuotationDetails.status;
                      const expiredDate = selectedQuotationDetails.ExpiredDate ?? selectedQuotationDetails.expiredDate ?? null;
                      const displayStatus = getQuotationDetailStatus(rawStatus, expiredDate);
                      return (
                        <Chip
                          label={getStatusLabel(displayStatus)}
                          size="small"
                          sx={getStatusColor(displayStatus)}
                        />
                      );
                    })()}
                  </Box>
                </Box>
                
                {/* Bên phải: Ngày nhận báo giá và Ngày hết hạn */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày nhận báo giá:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedQuotationDetails.QuotationDate || selectedQuotationDetails.quotationDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày hết hạn:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedQuotationDetails.ExpiredDate || selectedQuotationDetails.expiredDate)}
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
                        <TableCell sx={{ width: '50px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>STT</TableCell>
                        <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Tên sản phẩm</TableCell>
                        <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Đơn vị</TableCell>
                        <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Ngày hết hạn</TableCell>
                        <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Thuế</TableCell>
                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>Thành tiền trước thuế</TableCell>
                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>Thành tiền sau thuế</TableCell>
                        <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Ghi chú</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        const details = selectedQuotationDetails.Details || selectedQuotationDetails.details || [];
                        if (details.length > 0) {
                          return details.map((detail, index) => {
                            const productName = detail.ProductName || detail.productName || '-';
                            const productUnit = detail.Unit || detail.unit || detail.ProductUnit || detail.productUnit || '-';
                            const rawExpired =
                              detail.LotExpiredDate ||
                              detail.lotExpiredDate ||
                              detail.ExpiredDate ||
                              detail.expiredDate ||
                              detail.LotProduct?.ExpiredDate ||
                              detail.LotProduct?.expiredDate ||
                              null;
                            const expiredDisplay = rawExpired ? formatDate(rawExpired) : '-';
                            const taxText = detail.TaxText || detail.taxText || null;
                            const minQuantity = detail.minQuantity !== undefined && detail.minQuantity !== null 
                              ? detail.minQuantity 
                              : (detail.MinQuantity !== undefined && detail.MinQuantity !== null ? detail.MinQuantity : 1);
                            const salesPrice = detail.SalesPrice !== undefined && detail.SalesPrice !== null 
                              ? detail.SalesPrice 
                              : (detail.salesPrice !== undefined && detail.salesPrice !== null ? detail.salesPrice : null);
                            const itemTotal = detail.ItemTotal !== undefined && detail.ItemTotal !== null 
                              ? detail.ItemTotal 
                              : (detail.itemTotal !== undefined && detail.itemTotal !== null ? detail.itemTotal : null);
                            const note = detail.Note || detail.note || '-';
                            
                            // Calculate tax rate and total before tax
                            const taxRate = taxText ? getTaxRateFromText(taxText) : 0;
                            const totalBeforeTax = itemTotal !== null && itemTotal > 0 
                              ? calculateTotalBeforeTax(itemTotal, taxRate)
                              : (salesPrice !== null && salesPrice > 0 ? salesPrice * minQuantity : 0);

                            return (
                              <TableRow key={detail.Id || detail.id || index}>
                                <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                                <TableCell>{productName}</TableCell>
                                <TableCell>{productUnit}</TableCell>
                                <TableCell>{expiredDisplay}</TableCell>
                                <TableCell>{taxText || '-'}</TableCell>
                                <TableCell sx={{ textAlign: 'right' }}>
                                  {totalBeforeTax > 0 ? renderCurrency(totalBeforeTax) : '-'}
                                </TableCell>
                                <TableCell sx={{ textAlign: 'right' }}>
                                  {itemTotal !== null ? renderCurrency(itemTotal) : '-'}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    textAlign: 'center',
                                    color: note === '-' ? 'text.secondary' : 'inherit',
                                  }}
                                >
                                  {note}
                                </TableCell>
                              </TableRow>
                            );
                          });
                        } else {
                          return (
                            <TableRow>
                              <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Không có sản phẩm
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        }
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Ghi chú - Thông tin cọc và thời hạn */}
              {selectedQuotationDetails.note && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Ghi chú:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        whiteSpace: 'pre-line',
                        lineHeight: 1.8
                      }}
                    >
                      {selectedQuotationDetails.note}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Lịch sử trao đổi */}
              <Paper sx={{ p: 3, mt: 3 }} elevation={1}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, fontSize: '1.5rem' }}>
                  Lịch sử trao đổi
                </Typography>
                
                {/* Debug: Log comments để kiểm tra */}
                {console.log('CustomerRequestQuotationList - Comments in dialog:', selectedQuotationDetails?.Comments || selectedQuotationDetails?.comments)}
                {console.log('CustomerRequestQuotationList - Comments length:', (selectedQuotationDetails?.Comments || selectedQuotationDetails?.comments || []).length)}
                
                {/* Hiển thị các comment đã có */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
                  {(() => {
                    const comments = selectedQuotationDetails?.Comments || selectedQuotationDetails?.comments || [];
                    if (comments.length === 0) {
                      return <Typography color="text.secondary">Chưa có bình luận nào.</Typography>;
                    }
                    return comments.map((comment, index) => {
                      const label = String.fromCharCode(65 + index); // A, B, C, D...
                      const senderName = comment.FullName || comment.fullName || 'Ẩn danh';
                      return (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          {/* Box label (A, B, C...) */}
                          <Box
                            sx={{
                              minWidth: 40,
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f5f5f5',
                              border: '2px solid #ddd',
                              borderRadius: 1,
                              fontWeight: 'bold',
                              fontSize: '1.1rem',
                              flexShrink: 0,
                            }}
                          >
                            {label}
                          </Box>
                          {/* Input field hiển thị nội dung comment (readonly) */}
                          <Box sx={{ flex: 1 }}>
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ mb: 0.5, display: 'block', fontSize: '0.75rem' }}
                            >
                              {senderName}
                            </Typography>
                            <TextField
                              value={comment.Content || comment.content || ''}
                              placeholder="Không có nội dung"
                              multiline
                              fullWidth
                              InputProps={{
                                readOnly: true,
                              }}
                              sx={{
                                '& .MuiInputBase-root': {
                                  backgroundColor: '#fafafa',
                                },
                                '& .MuiInputBase-input': {
                                  cursor: 'default',
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    });
                  })()}
                </Box>

                {/* Phần nhập comment mới */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {/* Box label cho comment mới */}
                  <Box
                    sx={{
                      minWidth: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5',
                      border: '2px solid #ddd',
                      borderRadius: 1,
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      flexShrink: 0,
                    }}
                  >
                    {String.fromCharCode(65 + ((selectedQuotationDetails?.Comments || selectedQuotationDetails?.comments || []).length))}
                  </Box>
                  {/* Input field để nhập comment mới */}
                  <TextField
                    placeholder="Viết bình luận"
                    multiline
                    minRows={2}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    fullWidth
                    sx={{
                      flex: 1,
                    }}
                  />
                  {/* Button Gửi */}
                  <Button
                    variant="contained"
                    onClick={handleAddComment}
                    disabled={isSubmittingComment || !commentInput.trim()}
                    sx={{
                      backgroundColor: '#155E64',
                      '&:hover': { backgroundColor: '#0D4F52' },
                      '&:disabled': {
                        backgroundColor: '#ccc',
                      },
                      minWidth: 100,
                      boxShadow: 2,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {isSubmittingComment ? <CircularProgress size={20} color="inherit" /> : 'Gửi'}
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedQuotationDetails && (selectedQuotationDetails.Status === 1 || selectedQuotationDetails.status === 1) && (
            <Button
              variant="contained"
              onClick={handleCreateOrder}
              disabled={isCreatingOrder}
              sx={{
                backgroundColor: '#155E64',
                '&:hover': { backgroundColor: '#0D4F52' },
                mr: 1,
              }}
            >
              {isCreatingOrder ? <CircularProgress size={22} color="inherit" /> : 'Tạo đơn hàng'}
            </Button>
          )}
          <Button onClick={() => {
            setQuotationDetailDialogOpen(false);
            setCommentInput(''); // Reset comment when closing
          }}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Order Form Dialog */}
      <Dialog
        open={orderFormDialogOpen}
        onClose={handleCloseOrderFormDialog}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Tạo đơn hàng
          </Typography>
        </DialogTitle>
        <DialogContent>
          {orderFormData && (
            <Box>
              {/* Thông tin báo giá */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Thông tin báo giá:
                </Typography>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Mã báo giá:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedQuotationDetails?.QuotationCode || selectedQuotationDetails?.quotationCode || '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Cọc (% đơn hàng):
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {orderFormData.depositPercent !== null && orderFormData.depositPercent !== undefined
                        ? `${orderFormData.depositPercent}%`
                        : '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Ngày hết hạn cọc:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {orderFormData.depositExpiredDate ? formatDate(orderFormData.depositExpiredDate) : '-'}
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
                        <TableCell sx={{ width: '50px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>STT</TableCell>
                      <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Tên Sản Phẩm</TableCell>
                      <TableCell sx={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>Đơn vị</TableCell>
                      <TableCell sx={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>Ngày hết hạn</TableCell>
                        <TableCell sx={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>Số lượng</TableCell>
                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>Đơn Giá</TableCell>
                        <TableCell sx={{ textAlign: 'left', backgroundColor: '#f5f5f5', pl: 2 }}>Thuế</TableCell>
                      <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>Đơn giá sau thuế</TableCell>
                      <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>Thành tiền trước thuế</TableCell>
                      <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>Thành tiền sau thuế</TableCell>
                        <TableCell sx={{ textAlign: 'center', backgroundColor: '#f5f5f5', width: '80px' }}>Hành Động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderFormRows.map((row, index) => (
                        <TableRow key={row.id}>
                          <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {row.productName}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            {row.productUnit || '-'}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            {row.expiredDate || '-'}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <TextField
                              type="number"
                              value={row.quantity}
                              onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                              inputProps={{ min: 1, style: { textAlign: 'center' } }}
                              size="small"
                              sx={{ width: '100px' }}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'right' }}>
                            {renderCurrency(row.unitPrice)}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'left', pl: 3 }}>
                            {row.taxText || '-'}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'right' }}>
                            {renderCurrency(row.unitPriceAfterTax)}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'right' }}>
                            {renderCurrency(row.subtotal)}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'right' }}>
                            {renderCurrency(row.subtotalAfterTax)}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveProduct(row.id)}
                              color="error"
                              disabled={orderFormRows.length <= 1}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Tổng tiền */}
              <Box sx={{ mb: 2, textAlign: 'right' }}>
                <Typography variant="body1" sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <span>Thành tiền trước thuế:</span>
                  <Box component="span">{renderCurrency(orderTotals.before)}</Box>
                </Typography>
                <Typography variant="body1" sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <span>Thuế:</span>
                  <Box component="span">{renderCurrency(orderTotals.tax)}</Box>
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                    alignItems: 'center',
                    fontSize: '1.25rem',
                  }}
                >
                  <Typography component="span" sx={{ fontWeight: 'bold' }}>
                    Tổng tiền sau thuế:
                  </Typography>
                  <Box component="span">
                    {renderCurrency(orderTotals.after, { fontWeight: 'bold' })}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderFormDialog} disabled={orderFormLoading}>
            Hủy
          </Button>
          <Button
            variant="outlined"
            onClick={handleSaveDraftOrder}
            disabled={orderFormLoading}
            sx={{
              borderColor: '#155E64',
              color: '#155E64',
              '&:hover': { borderColor: '#0D4F52', backgroundColor: 'rgba(21, 94, 100, 0.04)' },
            }}
          >
            {orderFormLoading ? <CircularProgress size={22} color="inherit" /> : 'Lưu nháp'}
          </Button>
          <Button
            variant="contained"
            onClick={handleSendOrder}
            disabled={orderFormLoading}
            sx={{
              backgroundColor: '#155E64',
              '&:hover': { backgroundColor: '#0D4F52' },
            }}
          >
            {orderFormLoading ? <CircularProgress size={22} color="inherit" /> : 'Gửi đơn hàng'}
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

export default CustomerRequestQuotationList;

