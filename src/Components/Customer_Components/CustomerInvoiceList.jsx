import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import invoiceAPI from '../../API/invoiceAPI';

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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

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
          totalAmount: invoice.totalAmount || invoice.TotalAmount || 0,
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
    if (!sortConfig.key) return invoices;

    const sorted = [...invoices].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'createdAt') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (sortConfig.key === 'totalAmount') {
        aValue = Number(aValue || 0);
        bValue = Number(bValue || 0);
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
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

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        sx={{
          textAlign: 'center',
          fontWeight: 600,
          color: '#2c3e50',
          textTransform: 'uppercase',
          mb: 2,
        }}
      >
        Danh sách hóa đơn
      </Typography>

      <Box sx={{ mb: 3, maxWidth: 220 }}>
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
                <TableCell sx={{ width: '14%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'status'}
                    direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('status')}
                    sx={headerTextSx}
                  >
                    Trạng thái
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '18%', py: 1.5, px: 2, textAlign: 'right' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'totalAmount'}
                    direction={sortConfig.key === 'totalAmount' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('totalAmount')}
                    sx={headerTextSx}
                  >
                    Tổng tiền
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{
                    width: '18%',
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
                    <TableCell sx={{ textAlign: 'right', fontWeight: 500, textTransform: 'none' }}>
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Tải hóa đơn PDF">
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadIcon fontSize="small" />}
                            onClick={() => handleDownloadPdf(invoice)}
                          >
                            Tải xuống
                          </Button>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {paginatedInvoices.length > 0 && (
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
              <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} color="primary" />
            </Box>
          )}
        </TableContainer>
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
    </Container>
  );
};

export default CustomerInvoiceList;


