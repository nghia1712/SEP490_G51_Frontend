// File: SalesQuotationList.jsx - Danh sách báo giá cho Sales Staff
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import Autocomplete from '@mui/material/Autocomplete';
import salesQuotationAPI from '../../API/salesQuotationAPI';

const SalesQuotationList = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuotationId, setEditingQuotationId] = useState(null);
  const [editInitialData, setEditInitialData] = useState(null);
  const [editFormData, setEditFormData] = useState({
    sqnId: null,
    expiredDate: null,
    depositPercent: 0,
    depositDueDays: 1,
    details: []
  });
  const [notes, setNotes] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [sendingQuotationId, setSendingQuotationId] = useState(null);

  // Map status enum
  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return 'Nháp';
      case 1:
        return 'Đã gửi';
      case 2:
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

  // Format currency
  const formatCurrency = (value) => {
    const number = Number(value) || 0;
    return new Intl.NumberFormat('vi-VN').format(number);
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

  // Fetch data from API - Lấy danh sách yêu cầu báo giá đã gửi của customer
  // API này trả về các RequestSalesQuotation với status != Draft (đã gửi)
  const fetchQuotations = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await salesQuotationAPI.viewList();

      if (response.data && response.data.data) {
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        const mappedData = data.map((item) => ({
          id: item.Id || item.id,
          quotationCode: item.QuotationCode || item.quotationCode || '',
          requestCode: item.RequestCode || item.requestCode || '',
          quotationDate: item.QuotationDate || item.quotationDate || null,
          expiredDate: item.ExpiredDate || item.expiredDate || null,
          status: item.Status !== undefined ? item.Status : item.status,
        }));

        setQuotations(mappedData);
      } else {
        setQuotations([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      setQuotations([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';
    setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' });
  };

  // Filter quotations by status
  const filteredQuotations = useMemo(() => {
    if (statusFilter === 'all') return quotations;
    const filterStatus = parseInt(statusFilter, 10);
    return quotations.filter(quotation => quotation.status === filterStatus);
  }, [quotations, statusFilter]);

  // Sort quotations
  const sortedQuotations = useMemo(() => {
    if (!sortConfig.key) return filteredQuotations;

    return [...filteredQuotations].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'quotationCode') {
        aValue = aValue || '';
        bValue = bValue || '';
      } else if (sortConfig.key === 'quotationDate' || sortConfig.key === 'expiredDate') {
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
  }, [filteredQuotations, sortConfig]);

  const handleEdit = async (id) => {
    // Kiểm tra trạng thái trước khi cho phép sửa
    const quotation = quotations.find(q => q.id === id);
    if (quotation && quotation.status !== 0) {
      setSnackbarMessage('Chỉ có thể sửa báo giá ở trạng thái Nháp');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      // Fetch quotation details
      const response = await salesQuotationAPI.viewDetails(id);
      if (response.data && response.data.data) {
        const data = response.data.data;
        setEditingQuotationId(id);
        setEditInitialData(data);
        
        // Load notes from generateForm (cần rsqId từ quotation)
        // Tạm thời lấy từ quotation details hoặc có thể cần fetch riêng
        // Set form data
        const details = data.Details || data.details || [];
        setEditFormData({
          sqnId: data.SqnId || data.sqnId || null,
          expiredDate: data.ExpiredDate || data.expiredDate ? dayjs(data.ExpiredDate || data.expiredDate) : null,
          depositPercent: data.DepositPercent !== undefined ? data.DepositPercent : (data.depositPercent !== undefined ? data.depositPercent : 0),
          depositDueDays: data.DepositDueDays !== undefined ? data.DepositDueDays : (data.depositDueDays !== undefined ? data.depositDueDays : 1),
          details: details.map(detail => ({
            sqdId: detail.Id || detail.id,
            taxId: detail.TaxId || detail.taxId || null,
            note: detail.Note || detail.note || ''
          }))
        });

        // Load notes từ generateForm - cần rsqId từ RequestSalesQuotation
        // Có thể lấy rsqId từ quotation hoặc từ RequestCode
        // Tạm thời, để notes trống vì không có rsqId trực tiếp
        // Có thể cần fetch từ quotation để lấy rsqId
        // Hoặc có API riêng để load notes
        setNotes([]);
        
        // TODO: Load notes từ API hoặc từ quotation details
        // Có thể cần fetch rsqId từ quotation và gọi generateForm để lấy notes
        
        setEditDialogOpen(true);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải thông tin báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingQuotationId(null);
    setEditInitialData(null);
    setEditFormData({
      sqnId: null,
      expiredDate: null,
      depositPercent: 0,
      depositDueDays: 1,
      details: []
    });
    setEditError(null);
  };

  const handleUpdateQuotation = async () => {
    if (!editFormData.expiredDate) {
      setEditError('Vui lòng chọn ngày hết hạn');
      return;
    }

    if (!editFormData.sqnId || editFormData.sqnId === null) {
      setEditError('Báo giá này chưa có ghi chú. Vui lòng liên hệ quản trị viên.');
      return;
    }

    setUpdateLoading(true);
    setEditError(null);
    try {
      const payload = {
        SqId: editingQuotationId,
        SqnId: editFormData.sqnId,
        ExpiredDate: editFormData.expiredDate.format('YYYY-MM-DD'),
        DepositPercent: editFormData.depositPercent,
        DepositDueDays: editFormData.depositDueDays,
        Details: editFormData.details.map(detail => ({
          sqdId: detail.sqdId,
          TaxId: detail.taxId,
          Note: detail.note || ''
        }))
      };
      
      console.log('Update payload:', payload); // Debug log
      
      await salesQuotationAPI.updateSalesQuotation(payload);
      
      setSnackbarMessage('Cập nhật báo giá thành công!');
      setSnackbarOpen(true);
      handleCloseEditDialog();
      // Refresh list
      setTimeout(() => {
        fetchQuotations();
      }, 500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật báo giá';
      setEditError(errorMessage);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa báo giá này?')) {
      return;
    }

    setLoading(true);
    try {
      await salesQuotationAPI.deleteSalesQuotation(id);
      setSnackbarMessage('Xóa báo giá thành công!');
      setSnackbarOpen(true);
      await fetchQuotations();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể xóa báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    setLoading(true);
    try {
      const response = await salesQuotationAPI.viewDetails(id);
      if (response.data && response.data.data) {
        console.log('Quotation details response:', response.data.data);
        console.log('Details array:', response.data.data.Details || response.data.data.details);
        setSelectedQuotationDetails(response.data.data);
        setDetailDialogOpen(true);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải chi tiết báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (id) => {
    setSendingQuotationId(id);
    try {
      await salesQuotationAPI.sendSalesQuotation(id);
      setSnackbarMessage('Gửi báo giá thành công!');
      setSnackbarOpen(true);
      // Refresh list without showing full page loading
      await fetchQuotations(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể gửi báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setSendingQuotationId(null);
    }
  };

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
          Danh sách báo giá
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
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
            <MenuItem value="2">Hết hạn</MenuItem>
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
          }}
        >
          <Table sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ width: '8%', py: 1.5, px: 2, textAlign: 'left' }}>
                  STT
                </TableCell>
                <TableCell sx={{ width: '22%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'quotationCode'}
                    direction={sortConfig.key === 'quotationCode' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('quotationCode')}
                    hideSortIcon
                  >
                    Mã báo giá
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '18%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'quotationDate'}
                    direction={sortConfig.key === 'quotationDate' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('quotationDate')}
                  >
                    Ngày gửi
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '18%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'expiredDate'}
                    direction={sortConfig.key === 'expiredDate' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('expiredDate')}
                  >
                    Ngày hết hạn
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
              {sortedQuotations.map((quotation, index) => (
                <TableRow 
                  key={quotation.id} 
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
                  <TableCell sx={{ textAlign: 'left' }}>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{quotation.quotationCode}</TableCell>
                  <TableCell>{formatDate(quotation.quotationDate)}</TableCell>
                  <TableCell>{formatDate(quotation.expiredDate)}</TableCell>
                  <TableCell>
                    {quotation.status !== undefined && quotation.status !== null ? (
                      <Chip
                        label={getStatusLabel(quotation.status)}
                        size="small"
                        sx={getStatusColor(quotation.status)}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      {quotation.status === 0 && (
                        <>
                          <Tooltip title="Sửa" placement="bottom" arrow>
                            <IconButton
                              size="medium"
                              onClick={() => handleEdit(quotation.id)}
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
                              onClick={() => handleDelete(quotation.id)}
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
                          <Tooltip title="Gửi" placement="bottom" arrow>
                            <IconButton
                              size="medium"
                              onClick={() => handleSend(quotation.id)}
                              disabled={sendingQuotationId === quotation.id}
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
                                '&:disabled': {
                                  opacity: 0.6,
                                },
                              }}
                            >
                              {sendingQuotationId === quotation.id ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                <SendIcon fontSize="medium" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Xem chi tiết" placement="bottom" arrow>
                        <IconButton
                          size="medium"
                          onClick={() => handleViewDetails(quotation.id)}
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
              {sortedQuotations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có báo giá nào
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
                    <Chip
                      label={getStatusLabel(selectedQuotationDetails.Status !== undefined ? selectedQuotationDetails.Status : selectedQuotationDetails.status)}
                      size="small"
                      sx={getStatusColor(selectedQuotationDetails.Status !== undefined ? selectedQuotationDetails.Status : selectedQuotationDetails.status)}
                    />
                  </Box>
                </Box>
                
                {/* Bên phải: Ngày gửi và Ngày hết hạn */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày gửi:
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
                        <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Thuế</TableCell>
                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>Số lượng tối thiểu</TableCell>
                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>Đơn giá</TableCell>
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
                                <TableCell>{taxText || '-'}</TableCell>
                                <TableCell sx={{ textAlign: 'right' }}>{minQuantity}</TableCell>
                                <TableCell sx={{ textAlign: 'right' }}>
                                  {salesPrice !== null ? formatCurrency(salesPrice) : '-'}
                                </TableCell>
                                <TableCell sx={{ textAlign: 'right' }}>
                                  {totalBeforeTax > 0 ? formatCurrency(totalBeforeTax) : '-'}
                                </TableCell>
                                <TableCell sx={{ textAlign: 'right' }}>
                                  {itemTotal !== null ? formatCurrency(itemTotal) : '-'}
                                </TableCell>
                                <TableCell>{note}</TableCell>
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Sửa báo giá
          </Typography>
        </DialogTitle>
        <DialogContent>
          {editInitialData && (
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
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
                        {editInitialData.RequestCode || editInitialData.requestCode || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Mã báo giá:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {editInitialData.QuotationCode || editInitialData.quotationCode || '-'}
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
                  
                  {/* Bên phải: Ngày gửi và Ngày hết hạn */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Ngày gửi:
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(editInitialData.QuotationDate || editInitialData.quotationDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Ngày hết hạn:
                      </Typography>
                      <DatePicker
                        value={editFormData.expiredDate}
                        onChange={(newValue) => {
                          setEditFormData(prev => ({ ...prev, expiredDate: newValue }));
                        }}
                        format="DD/MM/YYYY"
                        slotProps={{
                          textField: {
                            variant: 'standard',
                            fullWidth: true,
                            error: false
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Error Alert */}
                {editError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEditError(null)}>
                    {editError}
                  </Alert>
                )}

                {/* Form fields */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      label="Phần trăm cọc (%)"
                      type="number"
                      value={editFormData.depositPercent}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        if (value >= 0 && value <= 70) {
                          setEditFormData(prev => ({ ...prev, depositPercent: value }));
                        }
                      }}
                      inputProps={{ min: 0, max: 70, step: 0.01 }}
                      fullWidth
                      variant="standard"
                    />
                    <TextField
                      label="Thời hạn thanh toán cọc (ngày)"
                      type="number"
                      value={editFormData.depositDueDays}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        if (value >= 1 && value <= 7) {
                          setEditFormData(prev => ({ ...prev, depositDueDays: value }));
                        }
                      }}
                      inputProps={{ min: 1, max: 7 }}
                      fullWidth
                      variant="standard"
                    />
                  </Box>
                </Box>

                {/* Danh sách sản phẩm - Chỉnh sửa ghi chú */}
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
                          <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Thuế</TableCell>
                          <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>Số lượng tối thiểu</TableCell>
                          <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>Đơn giá</TableCell>
                          <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>Thành tiền trước thuế</TableCell>
                          <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5' }}>Thành tiền sau thuế</TableCell>
                          <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Ghi chú</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {editFormData.details.map((detail, index) => {
                          const initialDetail = (editInitialData.Details || editInitialData.details || [])[index];
                          const productName = initialDetail?.ProductName || initialDetail?.productName || '-';
                          const taxText = initialDetail?.TaxText || initialDetail?.taxText || null;
                          const minQuantity = initialDetail?.minQuantity !== undefined && initialDetail?.minQuantity !== null 
                            ? initialDetail.minQuantity 
                            : (initialDetail?.MinQuantity !== undefined && initialDetail?.MinQuantity !== null ? initialDetail.MinQuantity : 1);
                          const salesPrice = initialDetail?.SalesPrice !== undefined && initialDetail?.SalesPrice !== null 
                            ? initialDetail.SalesPrice 
                            : (initialDetail?.salesPrice !== undefined && initialDetail?.salesPrice !== null ? initialDetail.salesPrice : null);
                          const itemTotal = initialDetail?.ItemTotal !== undefined && initialDetail?.ItemTotal !== null 
                            ? initialDetail.ItemTotal 
                            : (initialDetail?.itemTotal !== undefined && initialDetail?.itemTotal !== null ? initialDetail.itemTotal : null);
                          
                          // Calculate tax rate and total before tax
                          const taxRate = taxText ? getTaxRateFromText(taxText) : 0;
                          const totalBeforeTax = itemTotal !== null && itemTotal > 0 
                            ? calculateTotalBeforeTax(itemTotal, taxRate)
                            : (salesPrice !== null && salesPrice > 0 ? salesPrice * minQuantity : 0);
                          
                          return (
                            <TableRow key={detail.sqdId || index}>
                              <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                              <TableCell>{productName}</TableCell>
                              <TableCell>{taxText || '-'}</TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>{minQuantity}</TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>
                                {salesPrice !== null ? formatCurrency(salesPrice) : '-'}
                              </TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>
                                {totalBeforeTax > 0 ? formatCurrency(totalBeforeTax) : '-'}
                              </TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>
                                {itemTotal !== null ? formatCurrency(itemTotal) : '-'}
                              </TableCell>
                              <TableCell>
                                <TextField
                                  value={detail.note || ''}
                                  onChange={(e) => {
                                    const newDetails = [...editFormData.details];
                                    newDetails[index] = { ...newDetails[index], note: e.target.value };
                                    setEditFormData(prev => ({ ...prev, details: newDetails }));
                                  }}
                                  variant="standard"
                                  size="small"
                                  fullWidth
                                  placeholder="Nhập ghi chú"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {editFormData.details.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Không có sản phẩm
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            </LocalizationProvider>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={updateLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleUpdateQuotation}
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
    </Container>
  );
};

export default SalesQuotationList;

