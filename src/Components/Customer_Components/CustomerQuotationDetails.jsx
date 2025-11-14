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
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import requestSalesQuotationAPI from '../../API/requestSalesQuotationAPI';
import salesQuotationAPI from '../../API/salesQuotationAPI';
import salesOrderAPI from '../../API/salesOrderAPI';
import useUser from '../../Hooks/useUser';

const CustomerQuotationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getProfile } = useUser();

  const [requestInfo, setRequestInfo] = useState(null);
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

  const loadQuotationDetails = useCallback(async (sqId) => {
    console.log('loadQuotationDetails -> gọi API với sqId =', sqId);
    const detailResponse = await salesQuotationAPI.viewDetails(sqId);
    console.log('loadQuotationDetails -> response', detailResponse?.data);
    if (detailResponse.data && detailResponse.data.data) {
      setQuotationDetails(detailResponse.data.data);
      setSalesQuotationId(sqId);
    } else {
      console.error('loadQuotationDetails -> không có data trong response');
      throw new Error('Không lấy được chi tiết báo giá');
    }
  }, []);

  const extractSalesQuotationId = (data) => {
    if (!data) return null;

    const directId = data.SalesQuotationId ?? data.salesQuotationId;
    if (directId) return directId;

    const single = data.SalesQuotation ?? data.salesQuotation;
    if (single) {
      return single.Id ?? single.id ?? single.SalesQuotationId ?? single.salesQuotationId ?? null;
    }

    const collection = data.SalesQuotations ?? data.salesQuotations;
    if (Array.isArray(collection)) {
      const valid = collection.find((item) => {
        const status = item.Status ?? item.status;
        return status === undefined || status === null || status !== 0;
      });
      if (valid) {
        return valid.Id ?? valid.id ?? valid.SalesQuotationId ?? valid.salesQuotationId ?? null;
      }
    }

    return null;
  };

  const fetchData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const rsqId = Number(id);
      const requestRes = await requestSalesQuotationAPI.viewDetails(rsqId);
      if (!requestRes.data || !requestRes.data.data) {
        throw new Error('Không tìm thấy thông tin yêu cầu');
      }

      const reqData = requestRes.data.data;
      setRequestInfo(reqData);
      const searchParams = new URLSearchParams(location.search);
      let sqId = location.state?.sqId || searchParams.get('sqId');

      if (!sqId) {
        sqId = extractSalesQuotationId(reqData);
      }

      if (!sqId) {
        setError('Chưa có báo giá được gửi cho yêu cầu này.');
        setSnackbarMessage('Chưa có báo giá được gửi cho yêu cầu này.');
        setSnackbarOpen(true);
        return;
      }

      const numericSqId = Number(sqId);
      if (Number.isNaN(numericSqId)) {
        throw new Error('Mã báo giá không hợp lệ');
      }

      const preloadedQuotation = location.state?.quotationData;
      if (preloadedQuotation) {
        console.log('fetchData -> sử dụng dữ liệu preloaded từ navigation');
        setQuotationDetails(preloadedQuotation);
        setSalesQuotationId(numericSqId);
      }

      await loadQuotationDetails(numericSqId);
    } catch (err) {
      console.error('fetchData -> lỗi', err);
      const message = err.response?.data?.message || err.message || 'Không thể tải thông tin báo giá';
      setError(message);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, [id, loadQuotationDetails, location]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          navigate(`/customer/orders/${orderId}`);
        } else {
          navigate('/customer/orders');
        }
      }, 500);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Không thể tạo đơn hàng từ báo giá.';
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return value;
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

  const productDetails = React.useMemo(() => {
    if (!quotationDetails) return [];
    return quotationDetails.Details || quotationDetails.details || [];
  }, [quotationDetails]);

  const requestStatus = requestInfo?.Status ?? requestInfo?.status ?? null;

  useEffect(() => {
    console.log('requestStatus changed:', requestStatus, 'requestInfo:', requestInfo);
  }, [requestStatus, requestInfo]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: '#155E64' }}>
          Quay lại
        </Button>
      </Container>
    );
  }

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

      {/* Bên gửi và Bên nhận */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }} elevation={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Bên gửi
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Tên NCC:</strong> PMS Company
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Email:</strong> trananhtester@gmail.com
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Địa chỉ:</strong> Hà Nội
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Liên lạc:</strong> 0915054117
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Người gửi:</strong> PMS SALES
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Mã báo giá:</strong> {quotationDetails?.QuotationCode || '-'}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Ngày gửi:</strong> {formatDate(quotationDetails?.QuotationDate)}
            </Typography>
            <Typography>
              <strong>Hiệu lực đến:</strong> {formatDate(quotationDetails?.ExpiredDate)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }} elevation={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Bên nhận
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>SĐT:</strong> {customerProfile?.phoneNumber || '-'}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>Mã số thuế:</strong> {customerProfile?.mst || customerProfile?.MST || '-'}
            </Typography>
            <Typography>
              <strong>Địa chỉ:</strong> {customerProfile?.address || '-'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Bảng sản phẩm */}
      <TableContainer component={Paper} sx={{ boxShadow: 2, mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell align="center">STT</TableCell>
              <TableCell>Tên sản phẩm</TableCell>
              <TableCell>Đơn vị</TableCell>
              <TableCell>Thuế</TableCell>
              <TableCell>Ngày hết hạn</TableCell>
              <TableCell align="right">Số lượng tối thiểu</TableCell>
              <TableCell align="right">Đơn giá</TableCell>
              <TableCell align="right">Thành tiền</TableCell>
              <TableCell>Ghi chú</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productDetails.map((item, index) => (
              <TableRow key={item.Id || index}>
                <TableCell align="center">{index + 1}</TableCell>
                <TableCell>{item.ProductName || '-'}</TableCell>
                <TableCell>{item.Unit || '-'}</TableCell>
                <TableCell>{item.TaxText || '-'}</TableCell>
                <TableCell>{item.ExpiredDate || '-'}</TableCell>
                <TableCell align="right">{item.minQuantity || 1}</TableCell>
                <TableCell align="right">{formatCurrency(item.SalesPrice)}</TableCell>
                <TableCell align="right">{formatCurrency(item.ItemTotal)}</TableCell>
                <TableCell>{item.Note || '-'}</TableCell>
              </TableRow>
            ))}
            {productDetails.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  Không có dữ liệu sản phẩm
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Ghi chú */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Ghi chú
        </Typography>
        {quotationDetails?.note ? (
          <Box component="ul" sx={{ m: 0, pl: 3 }}>
            {quotationDetails.note.split('\n').map((line, index) => (
              <Typography key={index} component="li" sx={{ mb: 1 }}>
                {line}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography>Không có ghi chú.</Typography>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          {requestStatus === 2 && (
          <Button
            variant="contained"
              onClick={handleCreateOrder}
              disabled={isCreatingOrder}
            sx={{
              backgroundColor: '#155E64',
              '&:hover': { backgroundColor: '#0D4F52' },
            }}
          >
              {isCreatingOrder ? <CircularProgress size={22} color="inherit" /> : 'Lên đơn hàng'}
          </Button>
          )}
        </Box>
      </Paper>

      {/* Lịch sử trao đổi */}
      <Paper sx={{ p: 3 }} elevation={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Lịch sử trao đổi
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {(quotationDetails?.Comments || []).length === 0 ? (
            <Typography>Chưa có bình luận nào.</Typography>
          ) : (
            quotationDetails.Comments.map((comment, index) => (
              <Box key={index} sx={{ backgroundColor: '#f8f9fa', borderRadius: 1, p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Người dùng: {comment.UserId || 'Ẩn danh'}
                </Typography>
                <Typography>{comment.Content || ''}</Typography>
              </Box>
            ))
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Viết bình luận"
            placeholder="Viết bình luận"
            multiline
            minRows={2}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={isSubmittingComment}
            sx={{
              backgroundColor: '#155E64',
              '&:hover': { backgroundColor: '#0D4F52' },
              alignSelf: 'flex-start',
            }}
          >
            {isSubmittingComment ? <CircularProgress size={20} color="inherit" /> : 'Gửi'}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default CustomerQuotationDetails;
