import React, { useEffect, useState, useCallback, useMemo } from 'react';

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

  Button,

  FormControl,

  InputLabel,

  Select,

  MenuItem,

  Dialog,

  DialogTitle,

  DialogContent,

  DialogActions,

  IconButton,

  Tooltip,

  TableSortLabel,

} from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';

import TaskAltIcon from '@mui/icons-material/TaskAlt';

import salesOrderAPI from '../../API/salesOrderAPI';



const AccountantOrderList = () => {

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [statusFilter, setStatusFilter] = useState('all');

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const [detailLoading, setDetailLoading] = useState(false);

  const [detailError, setDetailError] = useState(null);

  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [orderDetails, setOrderDetails] = useState(null);

  const [confirmingPayment, setConfirmingPayment] = useState(false);



  const fetchOrders = useCallback(async (showLoading = true) => {

    if (showLoading) {

      setLoading(true);

    }

    setError(null);

    try {

      const response = await salesOrderAPI.listSalesOrder();

      if (response.data && Array.isArray(response.data.data)) {

        const mappedOrders = response.data.data

          .map((order) => ({

            id: order.SalesOrderId || order.salesOrderId,

            code: order.SalesOrderCode || order.salesOrderCode || '',

            creator: order.CreateBy || order.createBy || order.CreatedBy || order.createdBy || order.CustomerName || order.customerName || '-',

            status: order.Status !== undefined ? order.Status : order.status,

            createdAt: order.CreateAt || order.createAt || order.CreatedAt,

            totalAmount: order.TotalPrice || order.totalPrice || 0,

            paidAmount: order.PaidAmount ?? order.paidAmount ?? 0,

          }))

          .filter((order) => order.status !== 0); // Lọc bỏ đơn hàng có status = 0 (Nháp)

        setOrders(mappedOrders);

      } else {

        setOrders([]);

      }

    } catch (err) {

      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách đơn hàng';

      setError(errorMessage);

      setSnackbarMessage(errorMessage);

      setSnackbarOpen(true);

      setOrders([]);

    } finally {

      if (showLoading) {

        setLoading(false);

      }

    }

  }, []);



  useEffect(() => {

    fetchOrders();

  }, [fetchOrders]);



  const getStatusLabel = (status) => {

    switch (status) {

      case 0:

        return 'Nháp';

      case 1:

        return 'Chờ xử lý';

      case 2:

        return 'Đã duyệt';

      case 3:

        return 'Đã từ chối';

      case 4:

        return 'Đã cọc';

      case 5:

        return 'Đã thanh toán';

      case 6:

        return 'Hoàn thành';

      default:

        return 'Không xác định';

    }

  };



  const getStatusColor = (status) => {

    switch (status) {

      case 0:

        return { backgroundColor: '#fff3cd', color: '#856404' };

      case 1:

        return { backgroundColor: '#e3f2fd', color: '#1a4a57' };

      case 2:

        return { backgroundColor: '#ffe082', color: '#8c6d1f' };

      case 3:

        return { backgroundColor: '#f8d7da', color: '#721c24' };

      case 4:

        return { backgroundColor: '#e1bee7', color: '#4a148c' };

      case 5:

        return { backgroundColor: '#d4edda', color: '#155724' };

      case 6:

        return { backgroundColor: '#cce5ff', color: '#004085' };

      default:

        return { backgroundColor: '#e3f2fd', color: '#1976d2' };

    }

  };



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



  const handleSort = (key) => {

    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';

    setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' });

  };



  // Filter orders by status

  const filteredOrders = useMemo(() => {

    if (statusFilter === 'all') return orders;

    const filterStatus = parseInt(statusFilter, 10);

    return orders.filter(order => order.status === filterStatus);

  }, [orders, statusFilter]);



  // Sort orders

  const sortedOrders = useMemo(() => {

    if (!sortConfig.key) return filteredOrders;



    return [...filteredOrders].sort((a, b) => {

      let aValue = a[sortConfig.key];

      let bValue = b[sortConfig.key];



      if (sortConfig.key === 'code') {

        aValue = aValue || '';

        bValue = bValue || '';

      } else if (sortConfig.key === 'createdAt') {

        aValue = aValue ? new Date(aValue).getTime() : 0;

        bValue = bValue ? new Date(bValue).getTime() : 0;

      } else if (sortConfig.key === 'status') {

        aValue = aValue !== undefined && aValue !== null ? aValue : -1;

        bValue = bValue !== undefined && bValue !== null ? bValue : -1;

      } else if (sortConfig.key === 'totalAmount' || sortConfig.key === 'paidAmount') {

        aValue = Number(aValue) || 0;

        bValue = Number(bValue) || 0;

      }



      if (aValue < bValue) {

        return sortConfig.direction === 'asc' ? -1 : 1;

      }

      if (aValue > bValue) {

        return sortConfig.direction === 'asc' ? 1 : -1;

      }

      return 0;

    });

  }, [filteredOrders, sortConfig]);



  const handleViewDetails = async (orderId) => {

    console.log('AccountantOrderList - handleViewDetails called with orderId:', orderId);

    console.log('AccountantOrderList - orderId type:', typeof orderId);

    console.log('AccountantOrderList - orderId value:', orderId);
    
    if (!orderId) {
      console.error('AccountantOrderList - orderId is null or undefined!');
      setDetailError('Không có ID đơn hàng');
      setDetailLoading(false);
      return;
    }
    
    setSelectedOrderId(orderId);

    setDetailDialogOpen(true);

    setDetailLoading(true);

    setDetailError(null);

    setOrderDetails(null);

    
    try {

      console.log('AccountantOrderList - About to call API with orderId:', orderId);
      console.log('AccountantOrderList - salesOrderAPI.viewDetails function:', salesOrderAPI.viewDetails);
      
      const response = await salesOrderAPI.viewDetails(orderId);

      console.log('AccountantOrderList - API response received:', response);
      console.log('AccountantOrderList - response type:', typeof response);
      console.log('AccountantOrderList - response.data:', response.data);
      console.log('AccountantOrderList - response.data type:', typeof response.data);
      console.log('AccountantOrderList - response.data?.data:', response.data?.data);
      console.log('AccountantOrderList - response.data?.data type:', typeof response.data?.data);
      
      // Try multiple ways to get data
      let data = null;
      if (response?.data?.data) {
        data = response.data.data;
      } else if (response?.data) {
        data = response.data;
      } else if (response) {
        data = response;
      }
      
      console.log('AccountantOrderList - Final data:', data);
      console.log('AccountantOrderList - Final data type:', typeof data);
      console.log('AccountantOrderList - Final data keys:', data ? Object.keys(data) : 'null');
      
      if (!data) {
        console.error('AccountantOrderList - No data found in response:', response);
        setDetailError('Không có dữ liệu từ server');
        return;
      }
      if (data) {

        console.log('AccountantOrderList - Processing order data:', data);
        const totalAmount = data.totalAmount ?? data.TotalAmount ?? data.totalPrice ?? data.TotalPrice ?? data.TotalPrice ?? data.grandTotal ?? 0;
        const depositPercent = data.depositPercent ?? data.DepositPercent ?? 0;

        const paidAmount = data.paidAmount ?? data.PaidAmount ?? 0;

        const depositAmount = totalAmount * (depositPercent / 100);

        const remainingDeposit = Math.max(0, depositAmount - paidAmount);

        

        // Process details with tax information from backend

        const rawDetails = data.details ?? data.Details ?? data.orderDetails ?? data.OrderDetails ?? data.salesOrderDetails ?? data.SalesOrderDetails ?? [];

        console.log('AccountantOrderList - rawDetails:', rawDetails);
        const processedDetails = rawDetails.map((detail) => {

          const quantity = detail.quantity ?? detail.Quantity ?? 0;

          const lotId = detail.lotId ?? detail.LotId ?? detail.lotID ?? detail.LotID ?? null;
          // Backend now returns UnitPrice (before tax) and UnitPriceAfterTax

          const unitPrice = detail.unitPrice ?? detail.UnitPrice ?? 0;

          const unitPriceAfterTax = detail.unitPriceAfterTax ?? detail.UnitPriceAfterTax ?? unitPrice;

          const subtotal = quantity * unitPrice;

          const subtotalAfterTax = quantity * unitPriceAfterTax;

          

          // Get expired date from Lot

          const expiredDate = detail.Lot?.ExpiredDate ?? detail.lot?.ExpiredDate ?? detail.expiredDate ?? detail.ExpiredDate ?? null;

          const formattedExpiredDate = expiredDate ? formatDate(expiredDate) : '-';

          
          // Get product name - backend doesn't return it, so we'll use a placeholder
          const productName = detail.productName ?? detail.ProductName ?? `Sản phẩm Lot ${lotId ?? 'N/A'}`;
          

          // Get tax information from backend response

          const taxText = detail.taxText ?? detail.TaxText ?? '-';

          const taxRate = detail.taxRate ?? detail.TaxRate ?? (taxText !== '-' ? getTaxRateFromText(taxText) : 0);

          

          return {

            ...detail,

            quantity,

            lotId,
            unitPrice,

            unitPriceAfterTax,

            subtotal,

            subtotalAfterTax,

            expiredDate: formattedExpiredDate,

            taxText: taxText || '-',

            taxRate,

            productName,
          };

        });

        

        setOrderDetails({

          id: data.id ?? data.salesOrderId ?? data.SalesOrderId ?? orderId,

          code: data.orderCode ?? data.salesOrderCode ?? data.SalesOrderCode ?? data.SalesOrderCode ?? '',
          creator:

            data.creator ??

            data.createBy ??

            data.CreateBy ??

            data.createdBy ??

            data.CreatedBy ??

            data.customerName ??

            data.CustomerName ??

            '-',

          status: data.status ?? data.Status ?? data.SalesOrderStatus ?? data.salesOrderStatus ?? null,
          createdAt: data.createdAt ?? data.CreateAt ?? data.CreatedAt ?? data.CreateAt ?? null,
          expiredDate: data.orderExpiredDate ?? data.OrderExpiredDate ?? data.expiredDate ?? data.ExpiredDate ?? data.dueDate ?? data.DueDate ?? data.SalesOrderExpiredDate ?? data.salesOrderExpiredDate ?? null,
          depositPercent: depositPercent,

          depositExpiredDate: data.depositExpiredDate ?? data.DepositExpiredDate ?? null,

          totalAmount: totalAmount,

          paidAmount: paidAmount,

          remainingDeposit: remainingDeposit,

          dueAmount:

            data.debtAmount ?? data.DebtAmount ?? data.balanceAmount ?? data.BalanceAmount ?? null,

          details: processedDetails,

        });

        console.log('AccountantOrderList - Order details set:', orderDetails);
      } else {

        console.warn('AccountantOrderList - No data in response');
        setOrderDetails(null);

        setDetailError('Không có dữ liệu đơn hàng');
      }

    } catch (err) {

      console.error('AccountantOrderList - Error loading order details:', err);
      console.error('AccountantOrderList - Error message:', err.message);
      console.error('AccountantOrderList - Error stack:', err.stack);
      console.error('AccountantOrderList - Error response:', err.response);
      console.error('AccountantOrderList - Error response data:', err.response?.data);
      console.error('AccountantOrderList - Error response status:', err.response?.status);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải chi tiết đơn hàng.';
      setDetailError(errorMessage);

      setSnackbarMessage(errorMessage);

      setSnackbarOpen(true);

    } finally {

      setDetailLoading(false);

      console.log('AccountantOrderList - handleViewDetails completed, detailLoading:', false);
    }

  };



  const handleCloseDetailDialog = () => {

    setDetailDialogOpen(false);

    setSelectedOrderId(null);

    setOrderDetails(null);

    setDetailError(null);

  };



  const handleConfirmPayment = async () => {

    if (!orderDetails) return;

    

    setConfirmingPayment(true);

    try {

      // Status 5 = Paid (Đã thanh toán)

      await salesOrderAPI.confirmPayment(orderDetails.id, 5);

      setSnackbarMessage('Xác nhận thanh toán thành công!');

      setSnackbarOpen(true);

      setDetailDialogOpen(false);

      // Refresh list without showing full page loading

      await fetchOrders(false);

    } catch (err) {

      const errorMessage = err.response?.data?.message || 'Không thể xác nhận thanh toán';

      setSnackbarMessage(errorMessage);

      setSnackbarOpen(true);

    } finally {

      setConfirmingPayment(false);

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

          Danh sách đơn hàng

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

            <MenuItem value="1">Chờ xử lý</MenuItem>

            <MenuItem value="2">Đã duyệt</MenuItem>

            <MenuItem value="3">Đã từ chối</MenuItem>

            <MenuItem value="4">Đã cọc</MenuItem>

            <MenuItem value="5">Đã thanh toán</MenuItem>

            <MenuItem value="6">Hoàn thành</MenuItem>

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

                <TableCell sx={{ width: '17%', py: 1.5, px: 2 }}>

                  <TableSortLabel

                    active={sortConfig.key === 'code'}

                    direction={sortConfig.key === 'code' ? sortConfig.direction : 'asc'}

                    onClick={() => handleSort('code')}

                    hideSortIcon

                  >

                    Mã đơn hàng

                  </TableSortLabel>

                </TableCell>

                <TableCell sx={{ width: '14%', py: 1.5, px: 2 }}>

                  Người tạo

                </TableCell>

                <TableCell sx={{ width: '14%', py: 1.5, px: 2 }}>

                  <TableSortLabel

                    active={sortConfig.key === 'createdAt'}

                    direction={sortConfig.key === 'createdAt' ? sortConfig.direction : 'asc'}

                    onClick={() => handleSort('createdAt')}

                  >

                    Thời gian tạo

                  </TableSortLabel>

                </TableCell>

                <TableCell sx={{ width: '13%', py: 1.5, px: 2 }}>

                  <TableSortLabel

                    active={sortConfig.key === 'status'}

                    direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'}

                    onClick={() => handleSort('status')}

                  >

                    Trạng thái

                  </TableSortLabel>

                </TableCell>

                <TableCell sx={{ width: '11%', py: 1.5, px: 2 }}>

                  <TableSortLabel

                    active={sortConfig.key === 'paidAmount'}

                    direction={sortConfig.key === 'paidAmount' ? sortConfig.direction : 'asc'}

                    onClick={() => handleSort('paidAmount')}

                  >

                    Tiền đã trả

                  </TableSortLabel>

                </TableCell>

                <TableCell sx={{ width: '15%', py: 1.5, px: 2 }}>

                  <TableSortLabel

                    active={sortConfig.key === 'totalAmount'}

                    direction={sortConfig.key === 'totalAmount' ? sortConfig.direction : 'asc'}

                    onClick={() => handleSort('totalAmount')}

                    sx={{ whiteSpace: 'nowrap' }}

                  >

                    Tổng tiền đơn hàng

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

              {sortedOrders.map((order, index) => (

                <TableRow 

                  key={order.id} 

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

                  <TableCell sx={{ fontWeight: 500 }}>{order.code || '-'}</TableCell>

                  <TableCell>{order.creator || '-'}</TableCell>

                  <TableCell>{formatDate(order.createdAt)}</TableCell>

                  <TableCell>

                    {order.status !== undefined && order.status !== null ? (

                      <Chip

                        label={getStatusLabel(order.status)}

                        size="small"

                        sx={getStatusColor(order.status)}

                      />

                    ) : (

                      '-'

                    )}

                  </TableCell>

                  <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(order.paidAmount)}</TableCell>

                  <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(order.totalAmount)}</TableCell>

                  <TableCell sx={{ textAlign: 'right', verticalAlign: 'middle' }}>

                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>

                      <Tooltip title="Xem chi tiết" placement="bottom" arrow>

                        <IconButton

                          size="medium"

                          onClick={() => handleViewDetails(order.id)}

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

              {sortedOrders.length === 0 && (

                <TableRow>

                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>

                    <Typography variant="body2" color="text.secondary">

                      Chưa có đơn hàng nào

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

        onClose={handleCloseDetailDialog}

        maxWidth="xl"

        fullWidth

      >

        <DialogTitle>

          <Typography variant="h6" component="div">

            Chi tiết đơn hàng

          </Typography>

        </DialogTitle>

        <DialogContent>

          {detailLoading ? (

            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>

              <CircularProgress />

            </Box>

          ) : detailError ? (

            <Alert severity="error" sx={{ mb: 2 }}>

              {detailError}

            </Alert>

          ) : !orderDetails ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Không có dữ liệu đơn hàng. Vui lòng thử lại.
            </Alert>
          ) : (
            <Box>

              {/* Thông tin đơn hàng - Layout 3 cột */}

              <Box sx={{ mb: 3, display: 'flex', gap: 4 }}>

                {/* Phần 1 - Bên trái: Mã đơn hàng, Người tạo, Trạng thái, Thời gian tạo */}

                <Box sx={{ flex: 1 }}>

                  <Box sx={{ mb: 2 }}>

                    <Typography variant="subtitle2" color="text.secondary">

                      Mã đơn hàng:

                    </Typography>

                    <Typography variant="body1" sx={{ fontWeight: 500 }}>

                      {orderDetails.code || '-'}

                    </Typography>

                  </Box>

                  <Box sx={{ mb: 2 }}>

                    <Typography variant="subtitle2" color="text.secondary">

                      Người tạo:

                    </Typography>

                    <Typography variant="body1">

                      {orderDetails.creator || '-'}

                    </Typography>

                  </Box>

                  <Box sx={{ mb: 2 }}>

                    <Typography variant="subtitle2" color="text.secondary">

                      Trạng thái:

                    </Typography>

                    <Chip

                      label={getStatusLabel(orderDetails.status)}

                      size="small"

                      sx={getStatusColor(orderDetails.status)}

                    />

                  </Box>

                  <Box sx={{ mb: 2 }}>

                    <Typography variant="subtitle2" color="text.secondary">

                      Thời gian tạo:

                    </Typography>

                    <Typography variant="body1">

                      {orderDetails.createdAt ? formatDate(orderDetails.createdAt) : '-'}

                    </Typography>

                  </Box>

                </Box>

                

                {/* Phần 2 - Ở giữa: Ngày hết hạn đơn hàng, Cọc, Thời hạn hết hạn cọc */}

                <Box sx={{ flex: 1 }}>

                  <Box sx={{ mb: 2 }}>

                    <Typography variant="subtitle2" color="text.secondary">

                      Ngày hết hạn đơn hàng:

                    </Typography>

                    <Typography variant="body1">

                      {orderDetails.expiredDate ? formatDate(orderDetails.expiredDate) : '-'}

                    </Typography>

                  </Box>

                  <Box sx={{ mb: 2 }}>

                    <Typography variant="subtitle2" color="text.secondary">

                      Cọc (% đơn hàng):

                    </Typography>

                    <Typography variant="body1">

                      {orderDetails.depositPercent ? `${orderDetails.depositPercent}%` : '-'}

                    </Typography>

                  </Box>

                  <Box sx={{ mb: 2 }}>

                    <Typography variant="subtitle2" color="text.secondary">

                      Thời hạn hết hạn cọc:

                    </Typography>

                    <Typography variant="body1">

                      {orderDetails.depositExpiredDate ? formatDate(orderDetails.depositExpiredDate) : '-'}

                    </Typography>

                  </Box>

                </Box>

                

                {/* Phần 3 - Bên phải: Số tiền đã cọc, Số tiền cần cọc, Tổng tiền đơn hàng */}

                <Box sx={{ flex: 1 }}>

                  <Box sx={{ mb: 2 }}>

                    <Typography variant="subtitle2" color="text.secondary">

                      Số tiền đã cọc:

                    </Typography>

                    <Typography variant="body1">

                      {formatCurrency(orderDetails.paidAmount)} VNĐ

                    </Typography>

                  </Box>

                  <Box sx={{ mb: 2 }}>

                    <Typography variant="subtitle2" color="text.secondary">

                      Số tiền cần cọc:

                    </Typography>

                    <Typography variant="body1" sx={{ fontWeight: 500 }}>

                      {formatCurrency(orderDetails.remainingDeposit)} VNĐ

                    </Typography>

                  </Box>

                  <Box sx={{ mb: 2 }}>

                    <Typography variant="subtitle2" color="text.secondary">

                      Tổng tiền đơn hàng:

                    </Typography>

                    <Typography variant="body1" sx={{ fontWeight: 500 }}>

                      {formatCurrency(orderDetails.totalAmount)} VNĐ

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

                        <TableCell sx={{ width: '50px', textAlign: 'center', backgroundColor: '#f5f5f5', whiteSpace: 'nowrap' }}>STT</TableCell>

                        <TableCell sx={{ backgroundColor: '#f5f5f5', minWidth: '180px', whiteSpace: 'nowrap' }}>Tên Sản Phẩm</TableCell>

                        <TableCell sx={{ textAlign: 'center', backgroundColor: '#f5f5f5', minWidth: '80px', whiteSpace: 'nowrap' }}>Số lượng</TableCell>

                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5', minWidth: '100px', whiteSpace: 'nowrap' }}>Đơn Giá</TableCell>

                        <TableCell sx={{ textAlign: 'left', backgroundColor: '#f5f5f5', pl: 2, minWidth: '120px', whiteSpace: 'nowrap' }}>Thuế</TableCell>

                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5', minWidth: '120px', whiteSpace: 'nowrap' }}>Đơn giá sau thuế</TableCell>

                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5', minWidth: '120px', whiteSpace: 'nowrap' }}>Ngày hết hạn</TableCell>

                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5', minWidth: '100px', whiteSpace: 'nowrap' }}>Tạm tính</TableCell>

                        <TableCell align="right" sx={{ backgroundColor: '#f5f5f5', minWidth: '150px', whiteSpace: 'nowrap', pr: 2, textAlign: 'right' }}>

                          <Box component="div" sx={{ textAlign: 'right', width: '100%', display: 'block' }}>

                            Tạm Tính Sau Thuế

                          </Box>

                        </TableCell>

                      </TableRow>

                    </TableHead>

                    <TableBody>

                      {Array.isArray(orderDetails.details) && orderDetails.details.length > 0 ? (

                        orderDetails.details.map((detail, index) => {

                          const quantity = detail.quantity ?? detail.Quantity ?? 0;

                          const unitPrice = detail.unitPrice ?? detail.UnitPrice ?? 0;

                          const unitPriceAfterTax = detail.unitPriceAfterTax ?? unitPrice;

                          const subtotal = detail.subtotal ?? quantity * unitPrice;

                          const subtotalAfterTax = detail.subtotalAfterTax ?? quantity * unitPriceAfterTax;

                          const taxText = detail.taxText ?? detail.TaxText ?? '-';

                          const expiredDate = detail.expiredDate ?? '-';

                          

                          return (

                            <TableRow key={detail.id ?? detail.productId ?? index}>

                              <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>

                              <TableCell>{detail.productName ?? detail.ProductName ?? '-'}</TableCell>

                              <TableCell sx={{ textAlign: 'center' }}>{quantity}</TableCell>

                              <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(unitPrice)}</TableCell>

                              <TableCell sx={{ textAlign: 'left', pl: 3 }}>{taxText}</TableCell>

                              <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(unitPriceAfterTax)}</TableCell>

                              <TableCell sx={{ textAlign: 'right' }}>{expiredDate}</TableCell>

                              <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(subtotal)}</TableCell>

                              <TableCell align="right" sx={{ whiteSpace: 'nowrap', pr: 2 }}>

                                <Box component="div" sx={{ textAlign: 'right', width: '100%', display: 'block' }}>

                                  {formatCurrency(subtotalAfterTax)}

                                </Box>

                              </TableCell>

                            </TableRow>

                          );

                        })

                      ) : (

                        <TableRow>

                          <TableCell colSpan={9} align="center" sx={{ py: 3 }}>

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

              

              {/* Tổng tiền */}

              {orderDetails.details && orderDetails.details.length > 0 && (

                <Box sx={{ mb: 2, textAlign: 'right' }}>

                  <Typography variant="body1" sx={{ mb: 1 }}>

                    Tạm tính: {formatCurrency(

                      orderDetails.details.reduce((sum, detail) => {

                        return sum + (detail.subtotal ?? 0);

                      }, 0)

                    )} VNĐ

                  </Typography>

                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>

                    Tổng tiền sau thuế: {formatCurrency(

                      orderDetails.details.reduce((sum, detail) => {

                        return sum + (detail.subtotalAfterTax ?? 0);

                      }, 0)

                    )} VNĐ

                  </Typography>

                </Box>

              )}

            </Box>

          )}

        </DialogContent>

        <DialogActions>

          <Button onClick={handleCloseDetailDialog} disabled={confirmingPayment}>

            Đóng

          </Button>

          {orderDetails && orderDetails.status === 4 && (

            <Button

              onClick={handleConfirmPayment}

              variant="contained"

              color="success"

              disabled={confirmingPayment}

              startIcon={confirmingPayment ? <CircularProgress size={20} /> : <TaskAltIcon />}

            >

              {confirmingPayment ? 'Đang xử lý...' : 'Chấp thuận'}

            </Button>

          )}

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



export default AccountantOrderList;
