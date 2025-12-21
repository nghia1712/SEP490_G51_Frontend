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
  TextField,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PaymentIcon from '@mui/icons-material/Payment';
import invoiceAPI from '../../API/invoiceAPI';
import paymentRemainAPI from '../../API/paymentRemainAPI';

const headerTextSx = {
  textTransform: 'capitalize',
  fontWeight: 600,
  letterSpacing: '0.03em',
};

const CustomerInvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchCode, setSearchCode] = useState('');
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('vnpay'); // 'vnpay', 'manual'
  const paymentWindowRef = useRef(null); // Reference đến tab thanh toán VNPay

  const applyStatusFilter = useCallback(
    (data) => {
      let filtered = data;

      // Lọc theo trạng thái
      if (statusFilter !== 'all') {
        filtered = filtered.filter((invoice) => {
          const paymentStatus = invoice.paymentStatus ?? invoice.PaymentStatus ?? 0;
          const totalRemain = invoice.totalRemain ?? 0;

          switch (statusFilter) {
            case 'unpaid':
              // Chưa thanh toán: invoice đã được gửi (status = 1) và chưa thanh toán toàn bộ (paymentStatus != 3 và totalRemain > 0)
              return invoice.status === 1 && paymentStatus !== 3 && totalRemain > 0;
            case 'paid':
              // Đã thanh toán: paymentStatus = 3 HOẶC totalRemain = 0
              return paymentStatus === 3 || totalRemain === 0;
            case 'cancelled':
              // Đã hủy: status = 2
              return invoice.status === 2;
            default:
              return true;
          }
        });
      }

      // Lọc theo mã hóa đơn / mã đơn hàng (chung 1 ô search)
      const keyword = (searchCode || '').trim().toLowerCase();
      if (keyword) {
        filtered = filtered.filter((invoice) => {
          const inv = (invoice.invoiceCode || '').toLowerCase();
          const order = (invoice.orderCode || '').toLowerCase();
          return inv.includes(keyword) || order.includes(keyword);
        });
      }

      return filtered;
    },
    [statusFilter, searchCode],
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
            invoice.OrderCode ||
            invoice.orderCode ||
            invoice.salesOrder?.salesOrderCode ||
            invoice.salesOrder?.SalesOrderCode ||
            invoice.SalesOrder?.salesOrderCode ||
            invoice.SalesOrder?.SalesOrderCode ||
            invoice.salesOrder?.OrderCode ||
            invoice.salesOrder?.orderCode ||
            invoice.SalesOrder?.OrderCode ||
            invoice.SalesOrder?.orderCode ||
            (invoice.salesOrderId || invoice.SalesOrderId 
              ? `SO-${invoice.salesOrderId || invoice.SalesOrderId}` 
              : '-'),
          salesOrderId: invoice.salesOrderId || invoice.SalesOrderId || null,
          status:
            invoice.status !== undefined
              ? invoice.status
              : invoice.Status !== undefined
              ? invoice.Status
              : 0,
          // PaymentStatus: 0=NotPaymentYet, 1=Deposited, 2=PartiallyPaid, 3=Paid, 4=Refunded
          paymentStatus:
            invoice.paymentStatus !== undefined
              ? invoice.paymentStatus
              : invoice.PaymentStatus !== undefined
              ? invoice.PaymentStatus
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
  }, [statusFilter, searchCode]);

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

  // Hàm lấy label trạng thái cho customer - dựa vào PaymentStatus và totalRemain
  const getStatusLabel = (invoice) => {
    // Nếu invoice bị hủy
    if (invoice.status === 2) {
      return 'Đã Hủy';
    }
    
    // Lấy PaymentStatus (0=NotPaymentYet, 1=Deposited, 2=PartiallyPaid, 3=Paid, 4=Refunded)
    const paymentStatus = invoice.paymentStatus ?? invoice.PaymentStatus ?? 0;
    const totalRemain = invoice.totalRemain ?? 0;
    
    // Nếu đã thanh toán toàn bộ (paymentStatus = 3 HOẶC totalRemain = 0)
    if (paymentStatus === 3 || totalRemain === 0) {
      return 'Đã thanh toán';
    }
    
    // Nếu invoice đã được gửi (status = 1) và chưa thanh toán hoặc thanh toán 1 phần
    if (invoice.status === 1) {
      return 'Chưa thanh toán';
    }
    
    // Trường hợp còn lại (nháp hoặc không xác định)
    if (invoice.status === 0) {
      return 'Nháp';
    }
    
    return 'Không xác định';
  };

  // Hàm lấy màu cho trạng thái
  const getStatusColor = (invoice) => {
    // Nếu invoice bị hủy
    if (invoice.status === 2) {
      return { backgroundColor: '#f44336', color: '#fff' };
    }
    
    // Lấy PaymentStatus và totalRemain
    const paymentStatus = invoice.paymentStatus ?? invoice.PaymentStatus ?? 0;
    const totalRemain = invoice.totalRemain ?? 0;
    
    // Nếu đã thanh toán toàn bộ (paymentStatus = 3 HOẶC totalRemain = 0)
    if (paymentStatus === 3 || totalRemain === 0) {
      return { backgroundColor: '#4caf50', color: '#fff' }; // Xanh lá
    }
    
    // Nếu invoice đã được gửi (status = 1) và chưa thanh toán
    if (invoice.status === 1) {
      return { backgroundColor: '#ff9800', color: '#fff' }; // Cam - chưa thanh toán
    }
    
    // Trường hợp nháp
    if (invoice.status === 0) {
      return { backgroundColor: '#9e9e9e', color: '#fff' };
    }
    
    return { backgroundColor: '#757575', color: '#fff' };
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

      // Tự động khởi tạo phiên thanh toán VNPay
      const remainingAmount = invoiceDetails.totalRemain ?? 0;
      if (remainingAmount > 0) {
        await initVnPayInvoice(invoiceDetails.id, remainingAmount);
      } else {
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
    handleVnPayCheckout();
  };

  const remainingAmount = paymentInvoiceDetails?.totalRemain ?? 0;
  const paymentButtonDisabled =
    redirectingPayment ||
    vnPayInitLoading ||
    !paymentInvoiceDetails ||
    !vnPayInitData?.paymentUrl ||
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

      {/* Filter + List in one Paper */}
      <Paper
        elevation={2}
        sx={{
          mb: 3,
          px: 2,
          py: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 2,
          boxShadow: 2,
        }}
      >
        {/* Filter */}
        <Box
          className="customer-invoice-filter-container"
          sx={{
            mb: 2,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Trạng Thái</InputLabel>
            <Select
              value={statusFilter}
              label="Trạng Thái"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="unpaid">Chưa thanh toán</MenuItem>
              <MenuItem value="paid">Đã thanh toán</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Tìm theo mã hóa đơn/ mã đơn hàng"
            placeholder="Nhập mã hóa đơn hoặc mã đơn hàng..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            sx={{ minWidth: 220 }}
          />
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading / Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <div className="customer-invoice-list-container">
          <TableContainer
            sx={{
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
                    textTransform: 'capitalize',
                    letterSpacing: '0.03em',
                  }}
                >
                  #
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
                <TableCell align='center' sx={{ width: '15%', py: 1.5, px: 2 }}>
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
                  Thao tác
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
                    <TableCell align='center'>
                      <Chip label={getStatusLabel(invoice)} size="small" sx={getStatusColor(invoice)} />
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
                        {/* Chỉ hiển thị button thanh toán khi chưa thanh toán và invoice đã được gửi */}
                        {(() => {
                          const paymentStatus = invoice.paymentStatus ?? invoice.PaymentStatus ?? 0;
                          const isPaid = paymentStatus === 3; // Đã thanh toán toàn bộ
                          const isCancelled = invoice.status === 2; // Đã hủy
                          const isDraft = invoice.status === 0; // Nháp
                          const hasRemain = (invoice.totalRemain ?? 0) > 0;
                          
                          // Ẩn button nếu: đã thanh toán, đã hủy, là nháp, hoặc không còn tiền cần thanh toán
                          if (isPaid || isCancelled || isDraft || !hasRemain) {
                            return null;
                          }
                          
                          return (
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
                          );
                        })()}
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
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
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
              <Box className="customer-invoice-payment-info-layout" sx={{ display: 'flex', gap: 2 }}>
                {/* Cột trái */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  Mã hóa đơn:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {paymentInvoiceDetails.invoiceCode || '-'}
                </Typography>
              </Box>
                  <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Tổng Trị Giá Hóa Đơn:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCurrency(paymentInvoiceDetails.totalAmount)}
                  </Typography>
                </Box>
                  <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Đã Thanh Toán:
                  </Typography>
                  <Typography variant="body2">
                      {formatCurrency(paymentInvoiceDetails.totalPaid)}
                  </Typography>
                </Box>
                  <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Số Tiền Cần Thanh Toán:
                  </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCurrency(paymentInvoiceDetails.totalRemain)}
                  </Typography>
                </Box>
              </Box>

                {/* Cột phải */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {vnPayInitLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : vnPayInitError ? (
                    <Alert severity="warning" sx={{ mb: 1 }}>{vnPayInitError}</Alert>
                  ) : (
                    <>
                      <Box sx={{ textAlign: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                          {formatCurrency(vnPayInitData?.amount ?? paymentInvoiceDetails.totalRemain)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ fontSize: '0.875rem' }}>
                        Nhấn nút thanh toán để chuyển đến cổng VNPay
                      </Typography>
                    </>
                  )}
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
            {redirectingPayment ? 'Đang chuyển hướng...' : 'Thanh toán VNPay'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerInvoiceList;


