import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
  Pagination,
  Button,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PaymentIcon from '@mui/icons-material/Payment';
import invoiceAPI from '../../API/invoiceAPI';
import paymentRemainAPI from '../../API/paymentRemainAPI';

const headerTextSx = {
  textTransform: 'uppercase',
  fontWeight: 600,
  letterSpacing: '0.03em',
};

const CustomerInvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' }); // Mặc định sort theo ngày tạo từ mới nhất đến cũ nhất
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInvoiceDetails, setPaymentInvoiceDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [vnPayInitData, setVnPayInitData] = useState(null);
  const [vnPayInitError, setVnPayInitError] = useState('');
  const [vnPayInitLoading, setVnPayInitLoading] = useState(false);
  const [redirectingPayment, setRedirectingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('vnpay'); // 'vnpay', 'transfer', 'cash'
  const paymentWindowRef = useRef(null); // Reference đến tab thanh toán VNPay

  const applyStatusFilter = useCallback(
    (data) => {
      if (statusFilter === 'all') return data;
      const filterStatus = Number(statusFilter);
      return data.filter((invoice) => invoice.status === filterStatus);
    },
    [statusFilter],
  );

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoiceAPI.getMyInvoices();
      const invoiceList = response.data?.data || response.data || [];

      if (Array.isArray(invoiceList)) {
        const mappedInvoices = invoiceList.map((invoice) => ({
          id: invoice.id || invoice.Id,
          invoiceCode: invoice.invoiceCode || invoice.InvoiceCode || '-',
          orderCode:
            invoice.salesOrderCode ||
            invoice.SalesOrderCode ||
            `SO-${invoice.salesOrderId || invoice.SalesOrderId || ''}`,
          salesOrderId: invoice.salesOrderId || invoice.SalesOrderId || null,
          status:
            invoice.status !== undefined
              ? invoice.status
              : invoice.Status !== undefined
              ? invoice.Status
              : 0,
          createdAt:
            invoice.createdAt ||
            invoice.CreatedAt ||
            invoice.createAt ||
            invoice.CreateAt,
          // Tổng tiền hóa đơn
          totalAmount:
            invoice.totalAmount ??
            invoice.TotalAmount ??
            0,
          // Tổng đã thanh toán (nếu backend trả về)
          totalPaid:
            invoice.totalPaid ??
            invoice.TotalPaid ??
            0,
          // Số tiền còn lại phải thanh toán (ưu tiên TotalRemain nếu backend gửi)
          totalRemain:
            invoice.totalRemain ??
            invoice.TotalRemain ??
            (invoice.totalAmount ?? invoice.TotalAmount ?? 0) -
              (invoice.totalPaid ?? invoice.TotalPaid ?? 0),
        }));
        setAllInvoices(mappedInvoices);
        setInvoices(applyStatusFilter(mappedInvoices));
      } else {
        setAllInvoices([]);
        setInvoices([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách hóa đơn';
      setError(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      setAllInvoices([]);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [applyStatusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    setInvoices(applyStatusFilter(allInvoices));
  }, [applyStatusFilter, allInvoices]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(invoices.length / pageSize));

  const sortedInvoices = useMemo(() => {
    // Nếu không có sortConfig.key, mặc định sort theo createdAt từ mới nhất đến cũ nhất
    const effectiveSortConfig = sortConfig.key 
      ? sortConfig 
      : { key: 'createdAt', direction: 'desc' };

    const sorted = [...invoices].sort((a, b) => {
      let aValue = a[effectiveSortConfig.key];
      let bValue = b[effectiveSortConfig.key];

      if (effectiveSortConfig.key === 'createdAt') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (effectiveSortConfig.key === 'totalAmount' || effectiveSortConfig.key === 'totalRemain') {
        aValue = Number(aValue || 0);
        bValue = Number(bValue || 0);
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) return effectiveSortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return effectiveSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [invoices, sortConfig]);

  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedInvoices.slice(start, start + pageSize);
  }, [sortedInvoices, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return 'Nháp';
      case 1:
        return 'Đã Gửi';
      case 2:
        return 'Đã Hủy';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return { backgroundColor: '#9e9e9e', color: '#fff' };
      case 1:
        return { backgroundColor: '#2196f3', color: '#fff' };
      case 2:
        return { backgroundColor: '#f44336', color: '#fff' };
      default:
        return { backgroundColor: '#757575', color: '#fff' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Hàm lấy label cho trạng thái thanh toán
  const getPaymentStatusLabel = (status) => {
    // PaymentStatus enum backend: NotPaymentYet=0, Deposited=1, PartiallyPaid=2, Paid=3, Refunded=4
    switch (status) {
      case 0:
        return 'Chờ thanh toán';
      case 1:
        return 'Đã cọc';
      case 2:
        return 'Đã thanh toán 1 phần';
      case 3:
        return 'Đã thanh toán toàn bộ';
      case 4:
        return 'Trả lại tiền';
      default:
        return 'Không xác định';
    }
  };

  // Hàm lấy màu cho trạng thái thanh toán
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 0: // Chờ thanh toán
        return { backgroundColor: '#fff3cd', color: '#856404' };
      case 1: // Đã cọc
        return { backgroundColor: '#e1bee7', color: '#4a148c' };
      case 2: // Đã thanh toán 1 phần
        return { backgroundColor: '#fff9c4', color: '#f57f17' };
      case 3: // Đã thanh toán toàn bộ
        return { backgroundColor: '#c8e6c9', color: '#1b5e20' };
      case 4: // Trả lại tiền
        return { backgroundColor: '#f8bbd0', color: '#880e4f' };
      default:
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    }
  };

  // Hiển thị tiền với dấu phẩy và đơn vị "đ" gạch chân (giống màn đơn hàng)
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    const formatted = new Intl.NumberFormat('vi-VN')
      .format(amount)
      .replace(/\./g, ',');
    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5 }}>
        <Box component="span">{formatted}</Box>
        <Box component="span" sx={{ textDecoration: 'underline' }}>
          đ
        </Box>
      </Box>
    );
  };

  const handleDownloadPdf = async (invoice) => {
    try {
      const response = await invoiceAPI.getInvoicePdf(invoice.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceCode || 'invoice'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSnackbarSeverity('success');
      setSnackbarMessage('Đã tải hóa đơn');
      setSnackbarOpen(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải hóa đơn';
      setSnackbarSeverity('error');
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const initVnPayInvoice = useCallback(
    async (invoiceId, amount) => {
      if (!invoiceId) {
        setVnPayInitData(null);
        setVnPayInitError('Không tìm thấy mã hóa đơn để khởi tạo thanh toán.');
        return;
      }
      setVnPayInitLoading(true);
      setVnPayInitError('');
      setVnPayInitData(null);
      try {
        // Gọi API init VNPay cho Invoice
        // POST /api/PaymentRemain/invoices/{invoiceId}/vnpay/init
        const payload = {
          amount: amount || null, // null = thanh toán hết phần còn lại
          locale: 'vn',
        };
        const response = await paymentRemainAPI.initVnPayForInvoice(invoiceId, payload);
        const result = response.data;
        const data = result?.data ?? {};
        const normalized = {
          paymentUrl: data.paymentUrl ?? data.PaymentUrl ?? '',
          qrBase64: data.qrBase64 ?? data.QrBase64 ?? '',
          amount: data.amount ?? data.Amount ?? amount ?? null,
          txnRef: data.txnRef ?? data.TxnRef ?? '',
        };
        setVnPayInitData(normalized);
        if (!normalized.paymentUrl) {
          setVnPayInitError('Không nhận được link thanh toán từ VNPay.');
        }
      } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.Message || 'Không thể khởi tạo thanh toán VNPay.';
        setVnPayInitError(message);
        setSnackbarMessage(message);
        setSnackbarOpen(true);
      } finally {
        setVnPayInitLoading(false);
      }
    },
    [setSnackbarMessage, setSnackbarOpen],
  );

  const handlePayment = async (invoice) => {
    setPaymentDialogOpen(true);
    setPaymentLoading(true);
    setPaymentInvoiceDetails(null);
    setVnPayInitData(null);
    setVnPayInitError('');
    setVnPayInitLoading(false);
    setRedirectingPayment(false);
    setSelectedPaymentMethod('vnpay');
    try {
      // Fetch invoice details nếu cần
      const invoiceDetails = {
        id: invoice.id,
        invoiceCode: invoice.invoiceCode,
        totalAmount: invoice.totalAmount || 0,
        totalPaid: invoice.totalPaid || 0,
        totalRemain: invoice.totalRemain || 0,
        status: invoice.status,
        createdAt: invoice.createdAt,
        orderCode: invoice.orderCode,
      };
      setPaymentInvoiceDetails(invoiceDetails);

      // Nếu còn tiền cần thanh toán và phương thức hiện tại là VNPay thì tự động khởi tạo phiên thanh toán VNPay
      const remainingAmount = invoiceDetails.totalRemain ?? 0;
      if (remainingAmount > 0 && selectedPaymentMethod === 'vnpay') {
        await initVnPayInvoice(invoiceDetails.id, remainingAmount);
      } else if (remainingAmount <= 0) {
        setVnPayInitError('Hóa đơn này không còn số tiền cần thanh toán.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải thông tin hóa đơn';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleClosePaymentDialog = () => {
    // Đóng tab thanh toán nếu còn mở
    if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
      paymentWindowRef.current.close();
    }
    setPaymentDialogOpen(false);
    setPaymentInvoiceDetails(null);
    setVnPayInitData(null);
    setVnPayInitError('');
    setSelectedPaymentMethod('vnpay');
  };

  const handlePaymentMethodChange = async (method) => {
    setSelectedPaymentMethod(method);
    setVnPayInitData(null);
    setVnPayInitError('');
    
    if (method === 'vnpay' && paymentInvoiceDetails?.id) {
      // Khởi tạo VNPay khi chọn phương thức VNPay
      const remainingAmount = paymentInvoiceDetails.totalRemain ?? 0;
      await initVnPayInvoice(paymentInvoiceDetails.id, remainingAmount);
    }
  };

  const handleVnPayCheckout = () => {
    if (redirectingPayment || vnPayInitLoading) {
      return;
    }
    if (!vnPayInitData?.paymentUrl) {
      const message = vnPayInitError || 'Không tìm thấy link thanh toán VNPay.';
      setSnackbarMessage(message);
      setSnackbarOpen(true);
      return;
    }
    setRedirectingPayment(true);
    // Mở cổng thanh toán VNPay ở tab mới
    paymentWindowRef.current = window.open(vnPayInitData.paymentUrl, '_blank', 'noopener,noreferrer');
    
    // Lắng nghe message từ tab thanh toán khi hoàn thành
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'VNPAY_PAYMENT_SUCCESS') {
        if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
          paymentWindowRef.current.close();
        }
        fetchInvoices();
        setPaymentDialogOpen(false);
        setSnackbarMessage('Thanh toán thành công!');
        setSnackbarOpen(true);
        window.removeEventListener('message', handleMessage);
        setRedirectingPayment(false);
      } else if (event.data && event.data.type === 'VNPAY_PAYMENT_FAILED') {
        if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
          paymentWindowRef.current.close();
        }
        setSnackbarMessage(event.data.message || 'Thanh toán thất bại.');
        setSnackbarOpen(true);
        window.removeEventListener('message', handleMessage);
        setRedirectingPayment(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Kiểm tra định kỳ xem tab đã đóng chưa
    const checkInterval = setInterval(() => {
      if (paymentWindowRef.current && paymentWindowRef.current.closed) {
        clearInterval(checkInterval);
        window.removeEventListener('message', handleMessage);
        setTimeout(() => {
          fetchInvoices();
          setPaymentDialogOpen(false);
          setRedirectingPayment(false);
        }, 2000);
      }
    }, 1000);
    
    setTimeout(() => {
      clearInterval(checkInterval);
      window.removeEventListener('message', handleMessage);
      setRedirectingPayment(false);
    }, 600000); // 10 minutes timeout
  };

  const handleConfirmPayment = async () => {
    if (selectedPaymentMethod === 'vnpay') {
      handleVnPayCheckout();
    } else {
      // Với Chuyển khoản và Tiền mặt, hiển thị thông báo
      const methodName = selectedPaymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt';
      setSnackbarMessage(`Vui lòng liên hệ với nhân viên để xác nhận thanh toán bằng ${methodName}.`);
    setSnackbarOpen(true);
    }
  };

  const remainingAmount = paymentInvoiceDetails?.totalRemain ?? 0;
  const paymentButtonDisabled =
    redirectingPayment ||
    vnPayInitLoading ||
    !paymentInvoiceDetails ||
    (selectedPaymentMethod === 'vnpay' && !vnPayInitData?.paymentUrl) ||
    remainingAmount <= 0;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Typography
        variant="h4"
        component="h1"
        className="customer-invoice-list-title"
        sx={{
          textAlign: 'center',
          fontWeight: 600,
          color: '#155E64',
          mb: 2,
        }}
      >
        Danh sách hóa đơn
      </Typography>

      <Box className="customer-invoice-filter-container" sx={{ mb: 3, maxWidth: 220 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Trạng Thái</InputLabel>
          <Select
            value={statusFilter}
            label="Trạng Thái"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="0">Nháp</MenuItem>
            <MenuItem value="1">Đã Gửi</MenuItem>
            <MenuItem value="2">Đã Hủy</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <div className="customer-invoice-list-container">
        <TableContainer
          component={Paper}
          sx={{
            boxShadow: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 2,
            overflowX: 'auto',
          }}
        >
          <Table className="customer-invoice-list-table" sx={{ tableLayout: 'fixed', minWidth: 1000 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell
                  sx={{
                    width: '6%',
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
                <TableCell sx={{ width: '22%', py: 1.5, px: 2, textTransform: 'none', fontWeight: 500 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'invoiceCode'}
                    direction={sortConfig.key === 'invoiceCode' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('invoiceCode')}
                    sx={headerTextSx}
                  >
                    Mã hóa đơn
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '22%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'orderCode'}
                    direction={sortConfig.key === 'orderCode' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('orderCode')}
                    sx={headerTextSx}
                  >
                    Mã đơn hàng
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '18%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'createdAt'}
                    direction={sortConfig.key === 'createdAt' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('createdAt')}
                    sx={headerTextSx}
                  >
                    Ngày tạo
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '15%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'status'}
                    direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('status')}
                    sx={headerTextSx}
                  >
                    Trạng thái
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '16%', py: 1, pr: 0.1, pl: 1, textAlign: 'right' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'totalAmount'}
                    direction={sortConfig.key === 'totalAmount' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('totalAmount')}
                    sx={headerTextSx}
                  >
                    Tổng tiền
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '16%', py: 1, pr: 0.1, pl: 1, textAlign: 'right' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'totalRemain'}
                    direction={sortConfig.key === 'totalRemain' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('totalRemain')}
                    sx={headerTextSx}
                  >
                    Còn lại
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{
                    width: '16%',
                    py: 1.5,
                    px: 2,
                    textAlign: 'right',
                    ...headerTextSx,
                  }}
                >
                  Hành động
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Không có hóa đơn nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((invoice, index) => (
                  <TableRow
                    key={invoice.id}
                    hover
                    sx={{
                      '&:nth-of-type(even)': {
                        backgroundColor: '#f9f9f9',
                      },
                      '& td': {
                        py: 1.5,
                        px: 2,
                        verticalAlign: 'middle',
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, textTransform: 'none' }}>
                      {invoice.invoiceCode}
                    </TableCell>
                    <TableCell>{invoice.orderCode}</TableCell>
                    <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                    <TableCell>
                      <Chip label={getStatusLabel(invoice.status)} size="small" sx={getStatusColor(invoice.status)} />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', pr: 4, fontWeight: 500, textTransform: 'none' }}>
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', pr: 4, fontWeight: 500, textTransform: 'none' }}>
                      {formatCurrency(invoice.totalRemain)}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Tải hóa đơn PDF">
                          <span>
                            <IconButton
                              size="medium"
                              color="primary"
                              onClick={() => handleDownloadPdf(invoice)}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Thanh toán hóa đơn">
                          <span>
                            <IconButton
                              size="medium"
                              color="success"
                              onClick={() => handlePayment(invoice)}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {paginatedInvoices.length > 0 && totalPages > 1 && (
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
                siblingCount={1}
                boundaryCount={2}
              />
            </Box>
          )}
        </TableContainer>
        </div>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Payment Dialog */}
      <Dialog
        className="customer-invoice-payment-dialog"
        open={paymentDialogOpen}
        onClose={handleClosePaymentDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="customer-invoice-payment-dialog-title" sx={{ textAlign: 'left', fontWeight: 600, fontSize: '1.25rem' }}>
          Thanh Toán Hóa Đơn
        </DialogTitle>
        <DialogContent className="customer-invoice-payment-dialog-content">
          {paymentLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : paymentInvoiceDetails ? (
              <Box>
              {/* Thông tin hóa đơn - Layout 2 cột */}
              <Box className="customer-invoice-payment-info-layout" sx={{ display: 'flex', gap: 4 }}>
                {/* Cột trái */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Mã hóa đơn:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {paymentInvoiceDetails.invoiceCode || '-'}
                </Typography>
              </Box>
                  <Box sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                      Tổng Trị Giá Hóa Đơn:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(paymentInvoiceDetails.totalAmount)}
                  </Typography>
                </Box>
                  <Box sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                      Đã Thanh Toán:
                  </Typography>
                  <Typography variant="body1">
                      {formatCurrency(paymentInvoiceDetails.totalPaid)}
                  </Typography>
                </Box>
                  <Box sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                      Số Tiền Cần Thanh Toán:
                  </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(paymentInvoiceDetails.totalRemain)}
                  </Typography>
                </Box>
              </Box>

                {/* Cột phải */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Phương thức thanh toán:
                </Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel>Chọn phương thức thanh toán</InputLabel>
                      <Select
                        value={selectedPaymentMethod}
                        label="Chọn phương thức thanh toán"
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                      >
                        <MenuItem value="vnpay">VNPay</MenuItem>
                        <MenuItem value="transfer">Chuyển khoản</MenuItem>
                        <MenuItem value="cash">Tiền mặt</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ minHeight: 200, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedPaymentMethod === 'vnpay' ? (
                      <>
                        {vnPayInitLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                            <CircularProgress />
                          </Box>
                        ) : vnPayInitError ? (
                          <Alert severity="warning">{vnPayInitError}</Alert>
                        ) : (
                          <>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {formatCurrency(vnPayInitData?.amount ?? paymentInvoiceDetails.totalRemain)}
                </Typography>
              </Box>
                            <Typography variant="body2" color="text.secondary" textAlign="center">
                              Nhấn nút thanh toán để chuyển đến cổng VNPay
                            </Typography>
                          </>
                        )}
                      </>
                    ) : selectedPaymentMethod === 'transfer' ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                        <Alert severity="info">
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                            Thanh toán bằng Chuyển khoản
                          </Typography>
                          <Typography variant="body2">
                            Vui lòng chuyển khoản số tiền{' '}
                            <strong>{formatCurrency(paymentInvoiceDetails.totalRemain)}</strong> đến tài khoản của chúng tôi.
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Sau khi chuyển khoản, vui lòng liên hệ với nhân viên để xác nhận thanh toán.
                          </Typography>
                        </Alert>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                        <Alert severity="info">
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                            Thanh toán bằng Tiền mặt
                          </Typography>
                          <Typography variant="body2">
                            Số tiền cần thanh toán: <strong>{formatCurrency(paymentInvoiceDetails.totalRemain)}</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Vui lòng liên hệ với nhân viên để thực hiện thanh toán bằng tiền mặt.
                </Typography>
                        </Alert>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Alert severity="error">Không thể tải thông tin hóa đơn.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClosePaymentDialog} disabled={redirectingPayment}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirmPayment}
            variant="contained"
            color="primary"
            disabled={paymentButtonDisabled}
            startIcon={redirectingPayment ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {redirectingPayment 
              ? 'Đang chuyển hướng...' 
              : selectedPaymentMethod === 'vnpay' 
                ? 'THANH TOÁN VNPAY' 
                : selectedPaymentMethod === 'transfer'
                  ? 'Xác nhận Chuyển khoản'
                  : 'Xác nhận Tiền mặt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerInvoiceList;


