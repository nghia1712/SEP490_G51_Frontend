import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
  TextField,
  Divider,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import requestSalesQuotationAPI from '../../API/requestSalesQuotationAPI';
import salesQuotationAPI from '../../API/salesQuotationAPI';
import salesOrderAPI from '../../API/salesOrderAPI';
import useUser from '../../Hooks/useUser';

const CustomerQuotationDetails = () => {
  try {
    console.log('CustomerQuotationDetails - Component function called');
  } catch (err) {
    console.error('CustomerQuotationDetails - Error in component function:', err);
  }

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getProfile } = useUser();

  console.log('CustomerQuotationDetails - Component mounted');
  console.log('CustomerQuotationDetails - Route id:', id);
  console.log('CustomerQuotationDetails - Location:', location);
  console.log('CustomerQuotationDetails - Location.pathname:', location.pathname);
  console.log('CustomerQuotationDetails - Location.search:', location.search);
  console.log('CustomerQuotationDetails - Location.state:', location.state);

  const [quotationDetails, setQuotationDetails] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [salesQuotationId, setSalesQuotationId] = useState(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    getProfile()
      .then((response) => {
        const data = response?.data || response;
        setCustomerProfile(data?.profile || null);
      })
      .catch(() => {
        setCustomerProfile(null);
      });
  }, [getProfile]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';

    const tryParseDate = (value) => {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    try {
      let date = tryParseDate(dateString);

      if (!date && typeof dateString === 'string') {
        const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) {
          const [, day, month, year] = match;
          date = tryParseDate(`${year}-${month}-${day}T00:00:00`);
        }
      }

      if (!date) return '-';

      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
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
        return { backgroundColor: '#d4edda', color: '#155724' }; // Expired - Green
      default:
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    }
  };

  const buildRelatedQuotations = (quotationList, requestCode) => {
    if (!Array.isArray(quotationList) || !requestCode) return [];
    return quotationList
      .filter((quotation) => {
        const qRequestCode = quotation.RequestCode ?? quotation.requestCode;
        const qStatus = quotation.Status !== undefined ? quotation.Status : quotation.status;
        return (
          qRequestCode === requestCode &&
          qStatus !== undefined &&
          qStatus !== null &&
          qStatus !== 0
        );
      })
      .map((quotation) => ({
        id: quotation.Id ?? quotation.id,
        code: quotation.QuotationCode ?? quotation.quotationCode ?? '-',
        date: quotation.QuotationDate ?? quotation.quotationDate ?? null,
        status: quotation.Status !== undefined ? quotation.Status : quotation.status,
      }))
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
  };

  const fetchData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams(location.search);
      const stateSqId = location.state?.sqId;
      let sqId = stateSqId || searchParams.get('sqId');

      const rsqId = Number(id);
      if (Number.isNaN(rsqId)) {
        throw new Error('Mã yêu cầu báo giá không hợp lệ');
      }

      let requestCode = location.state?.requestCode;
      if (!requestCode) {
        const requestResponse = await requestSalesQuotationAPI.viewDetails(rsqId);
        const requestData = requestResponse.data?.data;
        requestCode = requestData?.RequestCode ?? requestData?.requestCode;
      }

      if (!requestCode) {
        throw new Error('Không tìm thấy mã yêu cầu báo giá.');
      }

      const quotationListResponse = await salesQuotationAPI.viewList();
      const quotationList = quotationListResponse.data?.data || [];
      const relatedQuotations = buildRelatedQuotations(quotationList, requestCode);

      if (relatedQuotations.length === 0) {
        throw new Error('Chưa có báo giá được gửi cho yêu cầu này.');
      }

      let numericSqId = sqId ? Number(sqId) : NaN;
      let targetQuotation = Number.isNaN(numericSqId)
        ? null
        : relatedQuotations.find((quotation) => Number(quotation.id) === numericSqId);

      if (!targetQuotation) {
        targetQuotation = relatedQuotations[0];
        numericSqId = Number(targetQuotation.id);
      }

      if (Number.isNaN(numericSqId)) {
        throw new Error('Mã báo giá không hợp lệ');
      }

      const preloadedQuotation = location.state?.quotationData;
      const canUsePreloaded = preloadedQuotation && Number(stateSqId) === numericSqId;

      if (canUsePreloaded) {
        setQuotationDetails(preloadedQuotation);
        setSalesQuotationId(numericSqId);
        setLoading(false);
        return;
      }

      const response = await salesQuotationAPI.viewDetails(numericSqId);
      
      if (response.data && response.data.data) {
        const quotationData = response.data.data;
        setQuotationDetails(quotationData);
        setSalesQuotationId(numericSqId);
      } else {
        throw new Error('Không lấy được chi tiết báo giá');
      }
    } catch (err) {
      console.error('CustomerQuotationDetails - Error:', err);
      console.error('CustomerQuotationDetails - Error response:', err.response);
      console.error('CustomerQuotationDetails - Error message:', err.message);
      const message = err.response?.data?.message || err.message || 'Không thể tải thông tin báo giá';
      console.error('CustomerQuotationDetails - Setting error:', message);
      setError(message);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      console.log('CustomerQuotationDetails - fetchData completed, setting loading to false');
      setLoading(false);
    }
  }, [id, location]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadQuotationDetails = useCallback(async (sqId) => {
    const detailResponse = await salesQuotationAPI.viewDetails(sqId);
    if (detailResponse.data && detailResponse.data.data) {
      setQuotationDetails(detailResponse.data.data);
      setSalesQuotationId(sqId);
    } else {
      throw new Error('Không lấy được chi tiết báo giá');
    }
  }, []);

  const handleAddComment = async () => {
    if (!salesQuotationId || !commentInput.trim()) {
      setSnackbarMessage('Vui lòng nhập nội dung bình luận');
      setSnackbarOpen(true);
      return;
    }

    setIsSubmittingComment(true);
    try {
      await salesQuotationAPI.addComment(salesQuotationId, commentInput.trim());
      setCommentInput('');
      await loadQuotationDetails(salesQuotationId);
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
    console.log('handleCreateOrder invoked', { salesQuotationId });
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

      const detailsPayload = detailList
        .map((detail) => {
          const detailId = detail.SalesQuotationDetailsId ?? detail.salesQuotationDetailsId ?? detail.Id ?? detail.id;
          const productIdRaw = detail.ProductId ?? detail.productId;
          const lotId = detail.LotId ?? detail.lotId;

          const parsedProductId = Number(productIdRaw);

          if (!Number.isFinite(parsedProductId)) {
            return null;
          }

          if (lotId === undefined || lotId === null) {
            throw new Error('Thiếu thông tin lô sản phẩm trong báo giá.');
          }

          const rawQuantity =
            detail.MinQuantity ??
            detail.minQuantity ??
            detail.Quantity ??
            detail.quantity ??
            1;
          const parsedQuantity = Number(rawQuantity);
          const quantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;

          const parsedLotId = Number(lotId);
          if (!Number.isFinite(parsedLotId)) {
            throw new Error('Thông tin lô sản phẩm không hợp lệ.');
          }

          return {
            productId: parsedProductId,
            lotId: parsedLotId,
            quantity,
            unitPrice: detail.UnitPrice ?? detail.unitPrice ?? 0,
            subTotalPrice: 0,
          };
        })
        .filter(Boolean);

      if (detailsPayload.length === 0) {
        throw new Error('Không có sản phẩm hợp lệ để tạo đơn hàng.');
      }

      const payload = {
        salesOrderCode: '',
        salesQuotationId: quotationInfo.Id ?? quotationInfo.id ?? salesQuotationId,
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

      console.log('Creating order with payload', payload);
      const createOrderRes = await salesOrderAPI.createDraftFromQuotation(payload);
      console.log('Create order response', createOrderRes.data);
      const orderData = createOrderRes.data?.data;

      setSnackbarMessage('Tạo đơn hàng nháp thành công.');
      setSnackbarOpen(true);

      const orderId = orderData?.SalesOrderId ?? orderData?.salesOrderId;

      setTimeout(() => {
        if (orderId) {
          navigate('/customer/orders');
        } else {
          navigate('/customer/orders');
        }
      }, 500);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Không thể Tạo đơn hàng.';
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      setIsCreatingOrder(false);
    }
  };


  console.log('CustomerQuotationDetails - Rendering. Loading:', loading, 'Error:', error, 'QuotationDetails:', quotationDetails);
  console.log('CustomerQuotationDetails - QuotationDetails type:', typeof quotationDetails);
  console.log('CustomerQuotationDetails - QuotationDetails is null?', quotationDetails === null);
  console.log('CustomerQuotationDetails - QuotationDetails is undefined?', quotationDetails === undefined);
  if (quotationDetails) {
    console.log('CustomerQuotationDetails - QuotationDetails keys:', Object.keys(quotationDetails));
  }

  try {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: '#155E64', mr: 2 }}>
          Quay lại
        </Button>
        <Typography
          variant="h4"
          component="h1"
          sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold', color: '#155E64' }}
        >
          Xem chi tiết báo giá
        </Typography>
        <Box sx={{ width: 120 }} />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2, alignSelf: 'center' }}>
            Đang tải...
            </Typography>
        </Box>
      )}

      {!loading && quotationDetails ? (
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
                  {quotationDetails.RequestCode || quotationDetails.requestCode || '-'}
            </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Mã báo giá:
            </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {quotationDetails.QuotationCode || quotationDetails.quotationCode || '-'}
            </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Trạng thái:
            </Typography>
                <Chip
                  label={getStatusLabel(quotationDetails.Status !== undefined ? quotationDetails.Status : quotationDetails.status)}
                  size="small"
                  sx={getStatusColor(quotationDetails.Status !== undefined ? quotationDetails.Status : quotationDetails.status)}
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
                  {formatDate(quotationDetails.QuotationDate || quotationDetails.quotationDate)}
            </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Ngày hết hạn:
            </Typography>
                <Typography variant="body1">
                  {formatDate(quotationDetails.ExpiredDate || quotationDetails.expiredDate)}
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
                    const details = quotationDetails.Details || quotationDetails.details || [];
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
                              {salesPrice !== null ? renderCurrency(salesPrice) : '-'}
                            </TableCell>
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
          {quotationDetails.note && (
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
                  {quotationDetails.note}
              </Typography>
              </Paper>
          </Box>
          )}

          {/* Nút Tạo đơn hàng */}
          {quotationDetails.Status === 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 3 }}>
          <Button
            variant="contained"
              onClick={handleCreateOrder}
              disabled={isCreatingOrder}
            sx={{
              backgroundColor: '#155E64',
              '&:hover': { backgroundColor: '#0D4F52' },
            }}
          >
              {isCreatingOrder ? <CircularProgress size={22} color="inherit" /> : 'Tạo đơn hàng'}
          </Button>
            </Box>
          )}

          {/* Lịch sử trao đổi */}
          <Paper sx={{ p: 3, mt: 3 }} elevation={1}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, fontSize: '1.5rem' }}>
              Lịch sử trao đổi
            </Typography>
            
            {/* Debug: Log comments để kiểm tra */}
            {console.log('CustomerQuotationDetails - Comments:', quotationDetails?.Comments || quotationDetails?.comments)}
            {console.log('CustomerQuotationDetails - Comments length:', (quotationDetails?.Comments || quotationDetails?.comments || []).length)}
            
            {/* Hiển thị các comment đã có */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
              {(() => {
                const comments = quotationDetails?.Comments || quotationDetails?.comments || [];
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
                {String.fromCharCode(65 + ((quotationDetails?.Comments || quotationDetails?.comments || []).length))}
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
      ) : !loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Không tìm thấy thông tin báo giá
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Vui lòng kiểm tra lại hoặc thử lại sau.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate(-1)}
            sx={{
              backgroundColor: '#155E64',
              '&:hover': { backgroundColor: '#0D4F52' },
            }}
          >
            Quay lại
          </Button>
        </Box>
      ) : null}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
  } catch (renderErr) {
    console.error('CustomerQuotationDetails - Error rendering component:', renderErr);
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Có lỗi xảy ra khi tải trang. Vui lòng thử lại.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: '#155E64' }}>
          Quay lại
        </Button>
      </Container>
    );
  }
};

export default CustomerQuotationDetails;
