// File: ListRSQ.jsx - Danh sách yêu cầu báo giá
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  TableSortLabel,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import VisibilityIcon from '@mui/icons-material/Visibility';
import requestSalesQuotationAPI from '../../API/requestSalesQuotationAPI';
import salesQuotationAPI from '../../API/salesQuotationAPI';

const headerTextSx = {
  textTransform: 'uppercase',
  fontWeight: 600,
  letterSpacing: '0.03em',
};

const ListRSQ = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [createQuotationDialogOpen, setCreateQuotationDialogOpen] = useState(false);
  const [quotationFormData, setQuotationFormData] = useState(null);
  const [quotationRows, setQuotationRows] = useState([]);
  const [quotationForm, setQuotationForm] = useState({
    expiredDate: '',
    depositPercent: 0,
    depositDueDays: 1,
    noteId: 1,
  });
  const [quotationLoading, setQuotationLoading] = useState(false);
  const [quotationError, setQuotationError] = useState(null);
  const [quotationAction, setQuotationAction] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Map status enum
  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return 'Nháp';
      case 1:
        return 'Chưa báo giá';
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
        return { backgroundColor: '#f8d7da', color: '#721c24' }; // Chưa báo giá - Red
      case 2:
        return { backgroundColor: '#d4edda', color: '#155724' }; // Đã báo giá - Green
      default:
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    }
  };

  const formatCurrency = (value) => {
    const number = Number(value) || 0;
    return new Intl.NumberFormat('vi-VN').format(number);
  };

  const renderCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 0.25,
        }}
      >
        <Typography component="span" sx={{ fontWeight: 500 }}>
          {formatCurrency(value)}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontSize: '0.75em',
            lineHeight: 1,
            textDecoration: 'underline',
            textDecorationThickness: '1px',
            textUnderlineOffset: '1px',
          }}
        >
          đ
        </Typography>
      </Box>
    );
  };

  const getTaxRateValue = (tax) => {
    if (!tax) return 0;
    const raw =
      tax.rate ??
      tax.Rate ??
      tax.value ??
      tax.Value ??
      tax.percentage ??
      tax.Percentage ??
      tax.percent ??
      tax.Percent ??
      null;
    if (raw !== null && raw !== undefined) {
      const num = Number(String(raw).replace(',', '.'));
      if (!Number.isNaN(num)) {
        return num > 1 ? num / 100 : num;
      }
    }
    const name = tax.name || tax.Name || '';
    const matched = name.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (matched && matched[1]) {
      const parsed = Number(matched[1].replace(',', '.'));
      if (!Number.isNaN(parsed)) {
        return parsed / 100;
      }
    }
    return 0;
  };

  const extractErrorMessage = (error, fallback = 'Đã xảy ra lỗi') => {
    if (!error) return fallback;
    const data = error.response?.data ?? {};
    const errorsObj = data.errors || data.Errors;
    const errorsArray =
      Array.isArray(errorsObj)
        ? errorsObj
        : typeof errorsObj === 'object'
          ? Object.values(errorsObj).flat()
          : null;

    const candidates = [
      typeof data === 'string' ? data : null,
      data.message,
      data.Message,
      data.error,
      data.Error,
      data.title,
      data.Title,
      errorsArray && errorsArray[0],
      Array.isArray(errorsArray) && errorsArray.length > 0 ? errorsArray.join(', ') : null,
      error.response?.data?.Data?.Message,
      error.message,
    ];

    const message = candidates.find(
      (msg) => typeof msg === 'string' && msg.trim() !== ''
    );

    if (message) {
      if (message.trim() === 'One or more validation errors occurred.') {
        return 'Bạn chưa điền đủ thông tin báo giá, vui lòng kiểm tra lại.';
      }
      return message;
    }
    return fallback;
  };

  const calculateTotals = (minQuantity, unitPrice, taxRate = 0) => {
    const qty = Math.max(1, Number(minQuantity) || 1);
    const price = Number(unitPrice) || 0;
    const rateRaw = Number(taxRate) || 0;
    const rate = rateRaw > 1 ? rateRaw / 100 : rateRaw;
    const beforeTax = qty * price;
    const afterTax = beforeTax * rate + beforeTax;
    return { beforeTax, afterTax };
  };

  const getDefaultTaxInfo = (taxes) => {
    if (!Array.isArray(taxes) || taxes.length === 0) {
      return { id: null, rate: 0 };
    }
    const lowerIncludes = (name, keyword) =>
      typeof name === 'string' && name.toLowerCase().includes(keyword);
    const noTax =
      taxes.find(tax => lowerIncludes(tax.name || tax.Name, 'không chịu')) ||
      taxes.find(tax => getTaxRateValue(tax) === 0);
    const fallbackTax = noTax || taxes[0];
    return {
      id: fallbackTax.id || fallbackTax.Id || null,
      rate: getTaxRateValue(fallbackTax),
    };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (error) {
      return '-';
    }
  };

  const resolveCustomerName = (source) => {
    if (!source) return '-';

    const candidates = [
      source.CustomerName ?? source.customerName,
      source.CreatedByUserName ?? source.createdByUserName,
      source.CreatedByUsername ?? source.createdByUsername,
      source.CustomerUserName ?? source.customerUserName,
      source.CustomerUsername ?? source.customerUsername,
      source.CreatedBy ?? source.createdBy ?? source.CreateBy,
    ];

    for (const candidate of candidates) {
      if (candidate && String(candidate).trim() !== '') {
        return candidate;
      }
    }

    const profileCandidates = [
      source.CustomerProfile?.User?.FullName,
      source.CustomerProfile?.User?.fullName,
      source.customerProfile?.user?.FullName,
      source.customerProfile?.user?.fullName,
    ];

    for (const profile of profileCandidates) {
      if (profile && String(profile).trim() !== '') {
        return profile;
      }
    }

    return '-';
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

      if (requestsResult.status !== 'fulfilled') {
        throw requestsResult.reason;
      }

      const requestResponse = requestsResult.value;
      const requestData = Array.isArray(requestResponse.data?.data)
        ? requestResponse.data.data
        : [];

      const quotationsData =
        quotationsResult.status === 'fulfilled' && Array.isArray(quotationsResult.value.data?.data)
          ? quotationsResult.value.data.data
          : [];

      if (quotationsResult.status === 'rejected') {
        console.error('Không thể tải danh sách báo giá để lấy ngày báo giá', quotationsResult.reason);
      }

      const quotationInfoMap = quotationsData.reduce((acc, quotation) => {
        const requestCode = quotation.RequestCode || quotation.requestCode || null;
        const quotationDate = quotation.QuotationDate || quotation.quotationDate || null;
        const quotationCode = quotation.QuotationCode || quotation.quotationCode || null;
        const quotationId = quotation.Id || quotation.id || null;
        if (!requestCode) {
          return acc;
        }
        const incomingTime = quotationDate ? Date.parse(quotationDate) : 0;
        const existing = acc[requestCode];
        if (
          !existing ||
          (incomingTime && (!existing.time || incomingTime > existing.time)) ||
          (!incomingTime && !existing.time)
        ) {
          acc[requestCode] = {
            quotationDate: quotationDate || null,
            quotationCode: quotationCode || null,
            quotationId: quotationId || null,
            time: Number.isNaN(incomingTime) ? 0 : incomingTime,
          };
        }

        return acc;
      }, {});

        // Chỉ giữ các yêu cầu đã gửi từ customer (status != 0) và có trạng thái hợp lệ
      const filteredData = requestData.filter((item) => {
          const status = item.Status !== undefined ? item.Status : item.status;
          return status !== undefined && status !== null && status !== 0;
        });

        const mappedData = filteredData.map((item) => {
          const status = item.Status !== undefined ? item.Status : item.status;
          const requestDate = item.RequestDate || item.requestDate || null;
          const createdDate = item.CreatedDate || item.createdDate || requestDate;
        const requestCode = item.RequestCode || item.requestCode || '';
        const customerName = resolveCustomerName(item);
        const quotationInfo = requestCode ? quotationInfoMap[requestCode] : null;
        const quotationDate = quotationInfo?.quotationDate || null;
        const quotationCode = quotationInfo?.quotationCode || null;
        const quotationId = quotationInfo?.quotationId || null;

          return {
            id: item.Id || item.id,
          code: requestCode,
          customerName,
            createdDate,
            sentDate: status === 1 || status === 2 ? requestDate : null,
          quotationDate,
          quotationId,
          quotationCode,
            status,
          };
        });

        setRequests(mappedData);
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Không thể tải danh sách yêu cầu báo giá');
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

  const handleViewDetails = (id) => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await requestSalesQuotationAPI.viewDetails(id);
        if (response.data && response.data.data) {
          // Debug: Kiểm tra response có CustomerName không
          console.log('Detail response:', response.data.data);
          console.log('CustomerName in detail:', response.data.data.CustomerName || response.data.data.customerName);
          setSelectedRequestDetails(response.data.data);
          setDetailDialogOpen(true);
        }
      } catch (err) {
        const errorMessage = extractErrorMessage(err, 'Không thể tải chi tiết yêu cầu');
        setError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  };

  const handleCreateQuotation = async (id) => {
    const rsqId = Number(id);
    if (!rsqId) {
      setSnackbarMessage('ID yêu cầu báo giá không hợp lệ');
      setSnackbarOpen(true);
      return;
    }

    setGenerateLoading(true);
    setQuotationError(null);
    try {
      const response = await salesQuotationAPI.generateForm(rsqId);
      if (response.data && response.data.data) {
        const formData = response.data.data;
        setQuotationFormData(formData);
        
        // Lấy details từ selectedRequestDetails hoặc từ formData
        const details = selectedRequestDetails?.Details || selectedRequestDetails?.details || [];
        const lotProducts = formData.lotProducts || formData.LotProducts || [];
        const taxes = formData.taxes || formData.Taxes || [];
        const notes = formData.notes || formData.Notes || [];
        
        // Set noteId mặc định
        if (notes.length > 0) {
          const firstNote = notes[0];
          setQuotationForm(prev => ({
            ...prev,
            noteId: firstNote.id || firstNote.Id || 1,
          }));
        }
        
        // Map lot products by productId
        const lotsByProduct = lotProducts.reduce((acc, lot) => {
          const productId = lot.productID || lot.ProductID;
          if (!acc[productId]) {
            acc[productId] = [];
          }
          const lotIdentifier =
            lot.lotCode || lot.LotCode ||
            lot.lotName || lot.LotName ||
            (lot.lotID || lot.LotID ? `Lô ${lot.lotID || lot.LotID}` : 'Lô');
          const expiredLabelRaw = lot.expiredDate || lot.ExpiredDate || null;
          const formattedExpired = expiredLabelRaw ? formatDate(expiredLabelRaw) : null;
          const expiredLabel = formattedExpired && formattedExpired !== '-' ? formattedExpired : null;

          acc[productId].push({
            lotId: lot.lotID || lot.LotID || null,
            salePrice: lot.salePrice || lot.SalePrice || 0,
            expiredDate: lot.expiredDate || lot.ExpiredDate || null,
            lotQuantity: lot.lotQuantity || lot.LotQuantity || 1,
            unit: lot.unit || lot.Unit || '',
            note: lot.note || lot.Note || '',
            displayLabel: `${lotIdentifier}${expiredLabel ? `: ${expiredLabel}` : ''}`,
            taxRate: 0,
          });
          return acc;
        }, {});

        Object.keys(lotsByProduct).forEach((productId) => {
          lotsByProduct[productId].sort((a, b) => {
            const dateA = a.expiredDate ? new Date(a.expiredDate) : null;
            const dateB = b.expiredDate ? new Date(b.expiredDate) : null;
            if (dateA && dateB) return dateA - dateB;
            if (dateA) return -1;
            if (dateB) return 1;
            return 0;
          });
        });

        Object.keys(lotsByProduct).forEach((productId) => {
          lotsByProduct[productId].push({
            lotId: null,
            salePrice: 0,
            lotQuantity: 0,
            unit: '',
            note: 'Hết lô hàng',
            displayLabel: 'Hết lô hàng',
            expiredDate: null,
            taxRate: 0,
          });
        });

        const defaultTaxInfo = getDefaultTaxInfo(taxes);
        
        // Tạo rows từ details
        const initialRows = details.map((detail, index) => {
          const productId = detail.productId || detail.ProductId;
          const productName = detail.productName || detail.ProductName || '';
          const productLots = lotsByProduct[productId] || [];
          const defaultLot = productLots[0] || null;
          const minQuantity = 1;
          const unitPrice = defaultLot ? (defaultLot.salePrice ?? 0) : 0;
          const { beforeTax, afterTax } = calculateTotals(minQuantity, unitPrice, defaultTaxInfo.rate);
          
          return {
            id: index + 1,
            productId,
            productName,
            lotId: defaultLot?.lotId || null,
            lotOptions: productLots,
            taxId: defaultTaxInfo.id,
            taxOptions: taxes,
            note: '',
            minQuantity,
            unitPrice,
            totalBeforeTax: beforeTax,
            totalAfterTax: afterTax,
            taxRate: defaultTaxInfo.rate,
          };
        });
        
        setQuotationRows(initialRows);
        setDetailDialogOpen(false);
        setCreateQuotationDialogOpen(true);
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Không thể tạo báo giá từ yêu cầu này');
      setQuotationError(errorMessage);
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleCloseCreateQuotationDialog = () => {
    setCreateQuotationDialogOpen(false);
    setQuotationFormData(null);
    setQuotationRows([]);
    setQuotationForm({
      expiredDate: '',
      depositPercent: 0,
      depositDueDays: 1,
      noteId: 1,
    });
    setQuotationError(null);
    setQuotationAction(null);
  };

const handleLotChange = (rowId, lotId) => {
  const normalizedLotId = lotId === 'NONE' ? null : Number(lotId);
    setQuotationRows(quotationRows.map(row => {
      if (row.id === rowId) {
      if (!normalizedLotId) {
        const defaultTax = getDefaultTaxInfo(row.taxOptions || []);
        const { beforeTax, afterTax } = calculateTotals(1, 0, defaultTax.rate || 0);
        return {
          ...row,
          lotId: null,
          minQuantity: 1,
          unitPrice: 0,
          totalBeforeTax: beforeTax,
          totalAfterTax: afterTax,
          taxId: defaultTax.id,
          taxRate: defaultTax.rate,
        };
      }
      const selectedLot = (row.lotOptions || []).find(lot => lot.lotId === normalizedLotId);
      if (selectedLot) {
        const minQuantity = 1;
        const unitPrice = selectedLot.salePrice ?? 0;
        const { beforeTax, afterTax } = calculateTotals(minQuantity, unitPrice, row.taxRate || 0);
        return {
          ...row,
          lotId: normalizedLotId,
          minQuantity,
          unitPrice,
          totalBeforeTax: beforeTax,
          totalAfterTax: afterTax,
        };
      }
      return { ...row, lotId: normalizedLotId };
      }
      return row;
    }));
  };

const handleDepositPercentChange = (value) => {
  const normalizedInput = (value || '').replace(',', '.');
  if (normalizedInput === '') {
    setQuotationForm(prev => ({ ...prev, depositPercent: '' }));
    return;
  }

  let parsed = parseFloat(normalizedInput);
  if (isNaN(parsed)) {
    setQuotationForm(prev => ({ ...prev, depositPercent: '' }));
    return;
  }
  parsed = Math.max(0, Math.min(70, parsed));
  const display =
    Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(1).replace(/\.0+$/, '');
  setQuotationForm(prev => ({ ...prev, depositPercent: display }));
};

  const handleTaxChange = (rowId, taxId) => {
    const normalizedTaxId = taxId ? Number(taxId) : null;
  setQuotationRows(quotationRows.map(row => {
    if (row.id !== rowId) return row;

    if (!normalizedTaxId) {
        const { beforeTax, afterTax } = calculateTotals(1, row.unitPrice, 0);
      return {
        ...row,
        taxId: null,
        taxRate: 0,
        totalBeforeTax: beforeTax,
        totalAfterTax: afterTax,
      };
    }

    const selectedTax = (row.taxOptions || []).find(
      tax => (tax.id || tax.Id) === normalizedTaxId
    );
    const taxRate = getTaxRateValue(selectedTax);
    const { beforeTax, afterTax } = calculateTotals(1, row.unitPrice, taxRate);
    return {
      ...row,
      taxId: normalizedTaxId,
      taxRate,
      totalBeforeTax: beforeTax,
      totalAfterTax: afterTax,
    };
  }));
  };

  const handleSubmitQuotation = async (shouldSend = false) => {
    const detailPayload = quotationRows
      .filter(row => row.lotId !== null && row.lotId !== undefined && row.lotId !== 'NONE')
      .map(row => ({
        productId: row.productId,
        lotId: row.lotId,
        taxId: row.taxId,
        note: row.note || '',
      }));

    if (detailPayload.length === 0) {
      const message = 'Vui lòng chọn lô và thuế cho ít nhất một sản phẩm trước khi tạo báo giá';
      setQuotationError(message);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
      return;
    }

    setQuotationAction(shouldSend ? 'send' : 'draft');
    setQuotationLoading(true);
    setQuotationError(null);
    try {
      const payload = {
        rsqId: selectedRequestDetails?.Id || selectedRequestDetails?.id,
        noteId: quotationForm.noteId,
        expiredDate: quotationForm.expiredDate,
      depositPercent: Number(quotationForm.depositPercent) || 0,
        depositDueDays: quotationForm.depositDueDays || 1,
        status: shouldSend ? 1 : 0,
        details: detailPayload,
      };
      
      const response = await salesQuotationAPI.createSalesQuotation(payload);
      const serverMessage =
        response.data?.message ||
        response.data?.Message ||
        response.data?.data?.message ||
        response.data?.data?.Message ||
        null;

      setSnackbarMessage(
        serverMessage ||
          (shouldSend ? 'Gửi báo giá thành công!' : 'Lưu nháp báo giá thành công!')
      );
        setSnackbarOpen(true);
        handleCloseCreateQuotationDialog();
        setTimeout(() => {
          fetchRequests();
        }, 500);
    } catch (err) {
      console.error('Submit quotation error:', err.response?.data || err);
      const errorMessage = extractErrorMessage(err, 'Không thể xử lý báo giá');
      setQuotationError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setQuotationLoading(false);
      setQuotationAction(null);
    }
  };


  // Filter requests by status
  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return requests;
    const filterStatus = parseInt(statusFilter, 10);
    return requests.filter(request => request.status === filterStatus);
  }, [requests, statusFilter]);

  const detailMatchedRequest = useMemo(() => {
    if (!selectedRequestDetails) return null;
    const detailId = selectedRequestDetails.Id || selectedRequestDetails.id || null;
    if (!detailId) return null;
    return requests.find((request) => request.id === detailId) || null;
  }, [requests, selectedRequestDetails]);

  const detailQuotationDate = useMemo(() => {
    if (!selectedRequestDetails) return null;
    return (
      detailMatchedRequest?.quotationDate ||
      selectedRequestDetails.QuotationDate ||
      selectedRequestDetails.quotationDate ||
      null
    );
  }, [detailMatchedRequest, selectedRequestDetails]);

  const detailQuotationCode = useMemo(() => {
    if (!selectedRequestDetails) return null;
    return (
      detailMatchedRequest?.quotationCode ||
      selectedRequestDetails.QuotationCode ||
      selectedRequestDetails.quotationCode ||
      null
    );
  }, [detailMatchedRequest, selectedRequestDetails]);

  const detailQuotationId = useMemo(() => {
    if (!selectedRequestDetails) return null;
    return (
      detailMatchedRequest?.quotationId ||
      selectedRequestDetails.QuotationId ||
      selectedRequestDetails.quotationId ||
      null
    );
  }, [detailMatchedRequest, selectedRequestDetails]);

  const handleOpenQuotationDetail = () => {
    if (!detailQuotationId) return;
    navigate('/sales-quotation', { state: { openQuotationId: detailQuotationId } });
    setDetailDialogOpen(false);
  };

  // Sort requests
  const sortedRequests = useMemo(() => {
    if (!sortConfig.key) return filteredRequests;

    return [...filteredRequests].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'code') {
        aValue = aValue || '';
        bValue = bValue || '';
      } else if (sortConfig.key === 'customerName') {
        aValue = aValue || '';
        bValue = bValue || '';
      } else if (sortConfig.key === 'sentDate' || sortConfig.key === 'quotationDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (sortConfig.key === 'status') {
        aValue = aValue !== undefined && aValue !== null ? aValue : -1;
        bValue = bValue !== undefined && bValue !== null ? bValue : -1;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredRequests, sortConfig]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / pageSize));

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRequests.slice(start, start + pageSize);
  }, [sortedRequests, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
          Danh sách yêu cầu báo giá
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="status-filter-label">Lọc theo trạng thái</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Lọc theo trạng thái"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="1">Chưa báo giá</MenuItem>
            <MenuItem value="2">Đã báo giá</MenuItem>
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
                    active={sortConfig.key === 'customerName'}
                    direction={sortConfig.key === 'customerName' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('customerName')}
                    sx={headerTextSx}
                  >
                    Khách hàng
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '17%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'sentDate'}
                    direction={sortConfig.key === 'sentDate' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('sentDate')}
                    sx={headerTextSx}
                  >
                    Ngày khách hàng gửi
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '17%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'quotationDate'}
                    direction={sortConfig.key === 'quotationDate' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('quotationDate')}
                    sx={headerTextSx}
                  >
                    Ngày báo giá
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
                  <TableCell sx={{ textAlign: 'left' }}>
                    {(page - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{request.code}</TableCell>
                <TableCell>{request.customerName || '-'}</TableCell>
                <TableCell>{formatDate(request.sentDate)}</TableCell>
                <TableCell>{formatDate(request.quotationDate)}</TableCell>
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
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
                mt: 0,
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

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
                {/* Bên trái: Mã yêu cầu báo giá, Mã báo giá và Trạng thái */}
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
                  Mã báo giá:
                </Typography>
                <Box sx={{ fontWeight: 500 }}>
                  {detailQuotationCode ? (
                    <Button
                      variant="text"
                      color="primary"
                      onClick={handleOpenQuotationDetail}
                      disabled={!detailQuotationId}
                      sx={{
                        textTransform: 'none',
                        padding: 0,
                        minWidth: 0,
                        fontWeight: 500,
                        '&:disabled': {
                          color: 'text.disabled',
                        },
                      }}
                    >
                      {detailQuotationCode}
                    </Button>
                  ) : (
                    '-'
                  )}
                </Box>
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
                
                {/* Bên phải: Khách hàng và ngày gửi */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Khách hàng:
                    </Typography>
                    <Typography variant="body1">
                      {resolveCustomerName(selectedRequestDetails)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày khách hàng gửi:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedRequestDetails.RequestDate || selectedRequestDetails.requestDate)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày báo giá:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(detailQuotationDate)}
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
                  <Table
                    size="small"
                    sx={{
                      tableLayout: 'fixed',
                    }}
                  >
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
          {selectedRequestDetails && (() => {
            const status = selectedRequestDetails.Status !== undefined ? selectedRequestDetails.Status : selectedRequestDetails.status;
            // Chỉ hiển thị nút "Tạo báo giá" khi trạng thái là "Chưa báo giá" (status = 1)
            if (status === 1) {
              return (
            <Button
              onClick={() => handleCreateQuotation(selectedRequestDetails.Id || selectedRequestDetails.id)}
              disabled={generateLoading}
                  variant="contained"
                  sx={{
                    backgroundColor: '#155E64',
                    '&:hover': {
                      backgroundColor: '#0D4F52',
                    },
                  }}
            >
              {generateLoading ? 'Đang xử lý...' : 'Tạo báo giá'}
            </Button>
              );
            }
            return null;
          })()}
          <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Create Quotation Dialog */}
      <Dialog
        open={createQuotationDialogOpen}
        onClose={handleCloseCreateQuotationDialog}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Tạo báo giá
          </Typography>
        </DialogTitle>
        <DialogContent>
          {quotationFormData && (
            <Box>
              {/* Error Alert */}
              {quotationError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setQuotationError(null)}>
                  {quotationError}
                </Alert>
              )}

              {/* Form fields */}
              <Box sx={{ mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ width: 320 }}>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 600, fontSize: '1.1rem' }}>
                    Ngày hết hạn <span style={{ color: '#d32f2f' }}>*</span>
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                    <DatePicker
                      value={quotationForm.expiredDate ? dayjs(quotationForm.expiredDate) : null}
                      onChange={(newValue) =>
                        setQuotationForm({
                          ...quotationForm,
                          expiredDate: newValue ? dayjs(newValue).format('YYYY-MM-DD') : '',
                        })
                      }
                      format="DD/MM/YYYY"
                      minDate={dayjs().startOf('day')}
                      slotProps={{
                        textField: {
                          required: true,
                          fullWidth: true,
                          size: 'medium',
                          sx: {
                            '& .MuiInputBase-input': {
                              fontSize: '1rem',
                              py: 1.5,
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Box>
                <Box sx={{ minWidth: 320 }}>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 600, fontSize: '1.1rem' }}>
                    Cọc (% của đơn hàng)
                  </Typography>
                  <TextField
                    type="number"
                    value={quotationForm.depositPercent === '' ? '' : quotationForm.depositPercent}
                    onChange={(e) => handleDepositPercentChange(e.target.value)}
                    inputProps={{ min: 0, max: 70, step: 0.1 }}
                    variant="outlined"
                    size="medium"
                    fullWidth
                    sx={{ 
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        py: 1.5,
                      }
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 320 }}>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 600, fontSize: '1.1rem' }}>
                    Thời hạn thanh toán cọc (ngày)
                  </Typography>
                  <TextField
                    type="number"
                    value={quotationForm.depositDueDays}
                    onChange={(e) => setQuotationForm({ 
                      ...quotationForm, 
                      depositDueDays: Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1)) 
                    })}
                    inputProps={{ min: 1, max: 30 }}
                    variant="outlined"
                    size="medium"
                    fullWidth
                    sx={{ 
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        py: 1.5,
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Products table */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Danh sách sản phẩm:
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '60px', textAlign: 'center' }}>STT</TableCell>
                        <TableCell>Tên sản phẩm</TableCell>
                        <TableCell>Lô hàng</TableCell>
                        <TableCell>Thuế</TableCell>
                        <TableCell align="right">SL tối thiểu</TableCell>
                        <TableCell align="right">Đơn giá</TableCell>
                        <TableCell align="right">Thành tiền trước thuế</TableCell>
                        <TableCell align="right">Thành tiền sau thuế</TableCell>
                        <TableCell>Ghi chú</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {quotationRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              Không có sản phẩm
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        quotationRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell sx={{ width: '60px', textAlign: 'center' }}>
                              {row.id}
                            </TableCell>
                            <TableCell>{row.productName || '-'}</TableCell>
                            <TableCell sx={{ minWidth: 200 }}>
                              {row.lotOptions && row.lotOptions.length > 0 ? (
                                <FormControl fullWidth size="small">
                                  <Select
                            value={
                              row.lotId !== null && row.lotId !== undefined
                                ? row.lotId
                                : 'NONE'
                            }
                                    onChange={(e) => handleLotChange(row.id, e.target.value)}
                                  >
                                    {row.lotOptions.map((lot, idx) => (
                              <MenuItem
                                key={`${row.id}-${idx}`}
                                value={
                                  lot.lotId !== null && lot.lotId !== undefined
                                    ? lot.lotId
                                    : 'NONE'
                                }
                              >
                                        {lot.displayLabel || (lot.lotId ? `Lô ${lot.lotId}` : lot.note || 'Không có lô')}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Hết lô hàng
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ minWidth: 150 }}>
                              {row.taxOptions && row.taxOptions.length > 0 ? (
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={row.taxId ?? row.taxOptions[0]?.id ?? row.taxOptions[0]?.Id ?? ''}
                                    onChange={(e) => handleTaxChange(row.id, e.target.value)}
                                  >
                                    {row.taxOptions.map((tax) => (
                                      <MenuItem key={tax.id || tax.Id} value={tax.id || tax.Id}>
                                        {tax.name || tax.Name || '-'}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Không có thuế
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {row.minQuantity ?? 1}
                            </TableCell>
                            <TableCell align="right">
                              {row.unitPrice !== undefined ? renderCurrency(row.unitPrice) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {row.totalBeforeTax !== undefined ? renderCurrency(row.totalBeforeTax) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {row.totalAfterTax !== undefined ? renderCurrency(row.totalAfterTax) : '-'}
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={row.note || ''}
                                onChange={(e) => {
                                  setQuotationRows(quotationRows.map(r => 
                                    r.id === row.id ? { ...r, note: e.target.value } : r
                                  ));
                                }}
                                size="small"
                                fullWidth
                                placeholder="Ghi chú"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateQuotationDialog} disabled={quotationLoading}>
            Hủy
          </Button>
          <Button
            onClick={() => handleSubmitQuotation(false)}
            variant="outlined"
            disabled={quotationLoading}
            sx={{
              borderColor: '#155E64',
              color: '#155E64',
              '&:hover': {
                borderColor: '#0D4F52',
                backgroundColor: 'rgba(21, 94, 100, 0.05)',
              },
            }}
          >
            {quotationLoading && quotationAction === 'draft' ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Lưu nháp'
            )}
          </Button>
          <Button
            onClick={() => handleSubmitQuotation(true)}
            variant="contained"
            disabled={quotationLoading}
            sx={{
              backgroundColor: '#155E64',
              '&:hover': {
                backgroundColor: '#0D4F52',
              },
            }}
          >
            {quotationLoading && quotationAction === 'send' ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Gửi báo giá'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ListRSQ;

