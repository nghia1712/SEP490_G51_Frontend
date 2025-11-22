// File: CreateSalesQuotation.jsx - Tạo báo giá cho Sales Staff
import React, { useEffect, useState, useCallback } from 'react';
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
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  TextField,
  MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import requestSalesQuotationAPI from '../../API/requestSalesQuotationAPI';
import salesQuotationAPI from '../../API/salesQuotationAPI';

const CreateSalesQuotation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Debug: Log để kiểm tra component có được render không
  console.log('CreateSalesQuotation component rendered, id:', id);

  const [requestDetails, setRequestDetails] = useState(null);
  const [formData, setFormData] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);

  const [quotationData, setQuotationData] = useState({
    quotationCode: '',
    sentDate: null,
    expiredDate: '',
    status: 0, // 0: Draft
    depositPercent: 0,
    depositDueDays: 1,
  });

  // State cho lịch sử trao đổi
  const [quotationComments, setQuotationComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [salesQuotationId, setSalesQuotationId] = useState(null);

  const [rows, setRows] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [noteId, setNoteId] = useState(1); // Default note ID

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Helper function to format date
  const formatDate = (value) => {
    if (!value) return '';
    try {
      if (typeof value === 'string' && value.includes('/')) {
        return value;
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value || 0);
  };

  const fetchData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const rsqId = parseInt(id, 10);

      const requestResponse = await requestSalesQuotationAPI.viewDetails(rsqId);
      let requestData = null;
      if (requestResponse.data && requestResponse.data.data) {
        requestData = requestResponse.data.data;
        setRequestDetails(requestData);

        const name = requestData.CustomerName || requestData.customerName || requestData.CreatedByUserName || requestData.createdByUserName || null;
        const phone = requestData.CustomerPhone || requestData.customerPhone || null;
        const email = requestData.CustomerEmail || requestData.customerEmail || null;
        const address = requestData.CustomerAddress || requestData.customerAddress || null;

        if (name || phone || email || address) {
          setCustomerInfo({
            name: name || '-',
            phone: phone || '-',
            email: email || '-',
            address: address || '-',
          });
        } else {
          setCustomerInfo(null);
        }
      }

      const formResponse = await salesQuotationAPI.generateForm(rsqId);
      if (formResponse.data && formResponse.data.data) {
        const data = formResponse.data.data;
        setFormData(data);

        const notes = data.notes || data.Notes || [];
        if (notes.length > 0) {
          const firstNote = notes[0];
          setNoteId(firstNote.id || firstNote.Id || 1);
        }

        if (requestData) {
          const details = requestData.details || requestData.Details || [];
          const lotRaw = data.lotProducts || data.LotProducts || [];
          const lotOptions = lotRaw.map((lot) => ({
            productId: lot.productID || lot.ProductID,
            lotId: lot.lotID || lot.LotID || null,
            unit: lot.unit || lot.Unit || '',
            salePrice: lot.salePrice || lot.SalePrice || 0,
            expiredDate: lot.expiredDate || lot.ExpiredDate || null,
            lotQuantity: lot.lotQuantity || lot.LotQuantity || 1,
            note: lot.note || lot.Note || '',
          }));

          const lotsByProduct = lotOptions.reduce((acc, lot) => {
            if (!acc[lot.productId]) {
              acc[lot.productId] = [];
            }
            acc[lot.productId].push(lot);
            return acc;
          }, {});

          const initialRows = details.map((detail, index) => {
            const productId = detail.productId || detail.ProductId;
            const productName = detail.productName || detail.ProductName || '';
            const productLots = lotsByProduct[productId] || [];
            const defaultLot = productLots[0] || null;
            const minQuantity = defaultLot?.lotQuantity ?? 1;
            const unitPrice = defaultLot?.salePrice ?? 0;
            const subtotal = minQuantity * unitPrice;

            return {
              id: index + 1,
              productId,
              productName,
              unit: defaultLot?.unit || '',
              lotId: defaultLot?.lotId || null,
              lotOptions: productLots,
              taxId: null,
              expiryDate: defaultLot?.expiredDate ? formatDate(defaultLot.expiredDate) : '',
              minQuantity,
              unitPrice,
              subtotal,
              note: '',
            };
          });

          setRows(initialRows);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải dữ liệu';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate total amount (tổng tiền hàng)
  useEffect(() => {
    const newTotal = rows.reduce((sum, row) => sum + (row.subtotal || 0), 0);
    setTotalAmount(newTotal);
  }, [rows]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleLotChange = (rowId, lotId) => {
    const normalizedLotId = lotId ? Number(lotId) : null;
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const selectedLot = (row.lotOptions || []).find(lot => lot.lotId === normalizedLotId);
        if (selectedLot) {
          const minQuantity = selectedLot.lotQuantity ?? 1;
          const unitPrice = selectedLot.salePrice ?? 0;
          const subtotal = minQuantity * unitPrice;
          return {
            ...row,
            lotId: normalizedLotId,
            unit: selectedLot.unit || row.unit,
            expiryDate: selectedLot.expiredDate ? formatDate(selectedLot.expiredDate) : '',
            minQuantity,
            unitPrice,
            subtotal,
          };
        }
        return { ...row, lotId: normalizedLotId };
      }
      return row;
    }));
  };

  const handleTaxChange = (rowId, taxId) => {
    const normalizedTaxId = taxId ? Number(taxId) : null;
    setRows(rows.map(row => (row.id === rowId ? { ...row, taxId: normalizedTaxId } : row)));
  };

  const handleNoteChange = (rowId, value) => {
    setRows(rows.map(row => (row.id === rowId ? { ...row, note: value } : row)));
  };

  const validateForm = () => {
    if (!quotationData.expiredDate) {
      setError('Vui lòng chọn ngày hết hạn');
      setSnackbarMessage('Vui lòng chọn ngày hết hạn');
      setSnackbarOpen(true);
      return false;
    }
    if (rows.length === 0) {
      setError('Vui lòng thêm ít nhất một sản phẩm');
      setSnackbarMessage('Vui lòng thêm ít nhất một sản phẩm');
      setSnackbarOpen(true);
      return false;
    }
    const invalidRows = rows.filter(row => !row.productId || !row.lotId || !row.taxId);
    if (invalidRows.length > 0) {
      setError('Vui lòng chọn lô và thuế cho tất cả sản phẩm trước khi tạo báo giá');
      setSnackbarMessage('Vui lòng chọn lô và thuế cho tất cả sản phẩm trước khi tạo báo giá');
      setSnackbarOpen(true);
      return false;
    }
    return true;
  };

  const createQuotationPayload = () => ({
    rsqId: parseInt(id, 10),
    noteId: noteId,
    expiredDate: quotationData.expiredDate,
    depositPercent: quotationData.depositPercent || 0,
    depositDueDays: quotationData.depositDueDays || 1,
    details: rows.map(row => ({
      productId: row.productId,
      lotId: row.lotId,
      taxId: row.taxId,
      note: row.note || '',
    })),
  });

  // Load comments từ báo giá đã có
  const loadQuotationComments = useCallback(async (sqId) => {
    try {
      const response = await salesQuotationAPI.viewDetails(sqId);
      if (response.data && response.data.data) {
        const comments = response.data.data.Comments || response.data.data.comments || [];
        setQuotationComments(comments);
        setSalesQuotationId(sqId);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  }, []);

  const handleAddComment = async () => {
    if (!salesQuotationId) {
      setSnackbarMessage('Vui lòng tạo báo giá trước khi thêm bình luận');
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
      await loadQuotationComments(salesQuotationId);
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

  const handleCreateQuotation = async (shouldSend) => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    try {
      const payload = createQuotationPayload();
      const response = await salesQuotationAPI.createSalesQuotation(payload);
      if (response.data && response.data.data) {
        const sqId = response.data.data.id || response.data.data.Id;
        setSalesQuotationId(sqId);

        if (shouldSend && sqId) {
          await salesQuotationAPI.sendSalesQuotation(sqId);
          // Load comments sau khi gửi
          await loadQuotationComments(sqId);
          setSnackbarMessage('Gửi báo giá thành công!');
        } else {
          // Load comments sau khi tạo nháp
          await loadQuotationComments(sqId);
          setSnackbarMessage('Tạo báo giá thành công!');
        }

        setSnackbarOpen(true);
        // Không navigate ngay, để user có thể thêm comment
        // setTimeout(() => {
        //   navigate('/sales-quotation');
        // }, 1000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể xử lý báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 0: return 'Nháp';
      case 1: return 'Đã gửi';
      case 2: return 'Đã báo giá';
      default: return 'Không xác định';
    }
  };

  if (loading && !requestDetails) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const taxOptions = formData?.taxes || formData?.Taxes || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ color: '#155E64', mr: 2 }}>
          Quay lại
        </Button>
        <Typography
          variant="h4"
          component="h1"
          sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold', color: '#155E64' }}
        >
          Tạo báo giá
        </Typography>
        <Box sx={{ width: 120 }} />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {requestDetails && (
        <Box sx={{ mb: 3, backgroundColor: '#f8f9fa', borderRadius: 2, p: 3 }}>
          <Typography sx={{ mb: 1 }}>
            <strong>Mã yêu cầu:</strong> {requestDetails.requestCode || requestDetails.RequestCode || ''}
          </Typography>
          <Typography sx={{ mb: 1 }}>
            <strong>Ngày yêu cầu:</strong> {formatDate(requestDetails.requestDate || requestDetails.RequestDate)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography>
              <strong>Trạng thái:</strong>
            </Typography>
            <Chip
              label={getStatusLabel(requestDetails.status !== undefined ? requestDetails.status : (requestDetails.Status !== undefined ? requestDetails.Status : 0))}
              color="success"
              size="small"
            />
          </Box>
          {customerInfo && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Typography><strong>Khách hàng:</strong> {customerInfo.name}</Typography>
              <Typography><strong>SĐT:</strong> {customerInfo.phone}</Typography>
              <Typography><strong>Email:</strong> {customerInfo.email}</Typography>
              <Typography><strong>Địa chỉ:</strong> {customerInfo.address}</Typography>
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          label="Ngày hết hạn"
          type="date"
          value={quotationData.expiredDate}
          onChange={(e) => setQuotationData({ ...quotationData, expiredDate: e.target.value })}
          InputLabelProps={{ shrink: true }}
          variant="outlined"
          size="small"
          required
        />
        <TextField
          label="Cọc (%)"
          type="number"
          value={quotationData.depositPercent}
          onChange={(e) => setQuotationData({ ...quotationData, depositPercent: Math.max(0, Math.min(70, parseFloat(e.target.value) || 0)) })}
          inputProps={{ min: 0, max: 70, step: 0.1 }}
          variant="outlined"
          size="small"
        />
        <TextField
          label="Thời hạn thanh toán cọc (ngày)"
          type="number"
          value={quotationData.depositDueDays}
          onChange={(e) => setQuotationData({ ...quotationData, depositDueDays: Math.max(1, Math.min(7, parseInt(e.target.value, 10) || 1)) })}
          inputProps={{ min: 1, max: 7 }}
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Lịch sử trao đổi - chỉ hiển thị khi đã có báo giá */}
      {salesQuotationId && (
        <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, fontSize: '1.5rem' }}>
            Lịch sử trao đổi
          </Typography>
          
          {/* Hiển thị các comment đã có */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
            {quotationComments.length === 0 ? (
              <Typography color="text.secondary">Chưa có bình luận nào.</Typography>
            ) : (
              quotationComments.map((comment, index) => {
                const label = String.fromCharCode(65 + index); // A, B, C, D...
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
                );
              })
            )}
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
              {String.fromCharCode(65 + quotationComments.length)}
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
      )}

      <TableContainer component={Paper} sx={{ boxShadow: 2, mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell align="center">STT</TableCell>
              <TableCell>Tên sản phẩm</TableCell>
              <TableCell>Lô hàng</TableCell>
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                  Không có dữ liệu sản phẩm
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell align="center">{row.id}</TableCell>
                  <TableCell>{row.productName || '-'}</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    {row.lotOptions && row.lotOptions.length > 0 ? (
                      <TextField
                        select
                        value={row.lotId ?? ''}
                        onChange={(e) => handleLotChange(row.id, e.target.value)}
                        size="small"
                        fullWidth
                      >
                        <MenuItem value="">Chọn lô</MenuItem>
                        {row.lotOptions.map((lot) => (
                          <MenuItem key={`${row.id}-${lot.lotId}`} value={lot.lotId ?? ''}>
                            {`Lô ${lot.lotId ?? 'N/A'} - HH: ${formatDate(lot.expiredDate)}`}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Không có lô khả dụng
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{row.unit || '-'}</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    <TextField
                      select
                      value={row.taxId ?? ''}
                      onChange={(e) => handleTaxChange(row.id, e.target.value)}
                      size="small"
                      fullWidth
                      disabled={taxOptions.length === 0 || !row.lotId}
                    >
                      <MenuItem value="">Chọn thuế</MenuItem>
                      {taxOptions.map((tax) => (
                        <MenuItem key={tax.id || tax.Id} value={tax.id || tax.Id}>
                          {tax.name || tax.Name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>{row.expiryDate || '-'}</TableCell>
                  <TableCell align="right">{row.minQuantity ?? '-'}</TableCell>
                  <TableCell align="right">{formatCurrency(row.unitPrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.subtotal)}</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    <TextField
                      value={row.note}
                      onChange={(e) => handleNoteChange(row.id, e.target.value)}
                      variant="outlined"
                      size="small"
                      placeholder="Ghi chú"
                      fullWidth
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#155E64' }}>
          Tổng tiền: {formatCurrency(totalAmount)} VNĐ
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => handleCreateQuotation(false)}
            disabled={loading}
            sx={{
              borderColor: '#155E64',
              color: '#155E64',
              '&:hover': {
                borderColor: '#0D4F52',
                backgroundColor: 'rgba(21, 94, 100, 0.05)',
              },
              borderRadius: '8px',
              px: 4,
              py: 1.5,
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Lưu Nháp'}
          </Button>
          <Button
            variant="contained"
            onClick={() => handleCreateQuotation(true)}
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Gửi Báo Giá'}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default CreateSalesQuotation;

