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

  Pagination,

} from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';

import TaskAltIcon from '@mui/icons-material/TaskAlt';

import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import salesOrderAPI from '../../API/salesOrderAPI';

import salesQuotationAPI from '../../API/salesQuotationAPI';



const headerTextSx = {

  textTransform: 'uppercase',

  fontWeight: 600,

  letterSpacing: '0.03em',

};



const SalesOrderList = () => {

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

  const [page, setPage] = useState(1);

  const pageSize = 5;



  const fetchOrders = useCallback(async (showLoading = true) => {

    if (showLoading) {

      setLoading(true);

    }

    setError(null);

    try {

      const response = await salesOrderAPI.listSalesOrder();

      if (response.data && Array.isArray(response.data.data)) {

        const mappedOrders = response.data.data

          .map((order) => {

            const orderStatus =

              order.SalesOrderStatus ??

              order.salesOrderStatus ??

              order.Status ??

              order.status ??

              null;

            const paymentStatus =

              order.PaymentStatus ??

              order.paymentStatus ??

              order.PaymentStatusValue ??

              order.paymentStatusValue ??

              null;

            return {

              id: order.SalesOrderId || order.salesOrderId,

              code: order.SalesOrderCode || order.salesOrderCode || '',

              creator:

                order.CreateBy ||

                order.createBy ||

                order.CreatedBy ||

                order.createdBy ||

                order.CustomerName ||

                order.customerName ||

                '-',

              orderStatus,

              paymentStatus,

              status: orderStatus,

              createdAt: order.CreateAt || order.createAt || order.CreatedAt,

              totalAmount: order.TotalPrice || order.totalPrice || 0,

              paidAmount: order.PaidAmount ?? order.paidAmount ?? 0,

            };

          })

          .filter((order) => order.orderStatus !== 0); // Lọc bỏ đơn hàng có status = 0 (Nháp)

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



  const getOrderStatusLabel = (status) => {

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



  const getOrderStatusColor = (status) => {

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



  const getPaymentStatusLabel = (status) => {

    switch (status) {

      case 0:

        return 'Chờ thanh toán';

      case 1:

        return 'Đã cọc';

      case 2:

        return 'Đã thanh toán';

      case 3:

        return 'Thành công';

      case 4:

        return 'Thất bại';

      case 5:

        return 'Hoàn tiền';

      default:

        return 'Không xác định';

    }

  };



  const getPaymentStatusColor = (status) => {

    switch (status) {

      case 0:

        return { backgroundColor: '#fff3cd', color: '#856404' };

      case 1:

        return { backgroundColor: '#ede7f6', color: '#4a148c' };

      case 2:

      case 3:

        return { backgroundColor: '#d4edda', color: '#155724' };

      case 4:

        return { backgroundColor: '#f8d7da', color: '#721c24' };

      case 5:

        return { backgroundColor: '#bbdefb', color: '#0d47a1' };

      default:

        return { backgroundColor: '#e0e0e0', color: '#424242' };

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



  const buildTaxKey = (name, expiredDisplay) => {

    const normalizedName = (name || '').toString().trim().toLowerCase();

    const normalizedExpired = (expiredDisplay || '').toString().trim();

    return `${normalizedName}__${normalizedExpired}`;

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

    return orders.filter(order => order.orderStatus === filterStatus);

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

      } else if (

        sortConfig.key === 'status' ||

        sortConfig.key === 'orderStatus' ||

        sortConfig.key === 'paymentStatus'

      ) {

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



  useEffect(() => {

    setPage(1);

  }, [statusFilter]);



  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));



  const paginatedOrders = useMemo(() => {

    const start = (page - 1) * pageSize;

    return sortedOrders.slice(start, start + pageSize);

  }, [sortedOrders, page]);



  useEffect(() => {

    if (page > totalPages) {

      setPage(totalPages);

    }

  }, [page, totalPages]);



  const fetchQuotationSupplement = async (quotationId) => {

    if (!quotationId) {

      return {

        quotationInfo: null,

        quotationDetails: [],

        quotationDetailView: [],

      };

    }



    try {

      const [quotationInfoResponse, quotationDetailResponse] = await Promise.all([

        salesOrderAPI.getQuotationInfo(quotationId),

        salesQuotationAPI

          .viewDetails(quotationId)

          .catch(() => null),

      ]);



      const quotationInfo = quotationInfoResponse.data?.data || null;

      const quotationDetails =

        quotationInfo?.details ??

        quotationInfo?.Details ??

        [];



      const quotationDetailView =

        quotationDetailResponse?.data?.data?.details ??

        quotationDetailResponse?.data?.data?.Details ??

        [];



      return {

        quotationInfo,

        quotationDetails,

        quotationDetailView,

      };

    } catch (error) {

      return {

        quotationInfo: null,

        quotationDetails: [],

        quotationDetailView: [],

      };

    }

  };



  const handleViewDetails = async (orderId) => {

    console.log('SalesOrderList - handleViewDetails called with orderId:', orderId);
    console.log('SalesOrderList - orderId type:', typeof orderId);
    console.log('SalesOrderList - orderId value:', orderId);
    
    if (!orderId) {
      console.error('SalesOrderList - orderId is null or undefined!');
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

      console.log('SalesOrderList - About to call API with orderId:', orderId);
      console.log('SalesOrderList - salesOrderAPI.viewDetails function:', salesOrderAPI.viewDetails);
      
      const response = await salesOrderAPI.viewDetails(orderId);

      console.log('SalesOrderList - API response received:', response);
      console.log('SalesOrderList - response type:', typeof response);
      console.log('SalesOrderList - response.data:', response.data);
      console.log('SalesOrderList - response.data type:', typeof response.data);
      console.log('SalesOrderList - response.data?.data:', response.data?.data);
      console.log('SalesOrderList - response.data?.data type:', typeof response.data?.data);
      
      // Try multiple ways to get data
      let data = null;
      if (response?.data?.data) {
        data = response.data.data;
      } else if (response?.data) {
        data = response.data;
      } else if (response) {
        data = response;
      }
      
      console.log('SalesOrderList - Final data:', data);
      console.log('SalesOrderList - Final data type:', typeof data);
      console.log('SalesOrderList - Final data keys:', data ? Object.keys(data) : 'null');
      
      if (!data) {
        console.error('SalesOrderList - No data found in response:', response);
        setDetailError('Không có dữ liệu từ server');
        return;
      }
      if (data) {

        console.log('SalesOrderList - Processing order data:', data);
        const salesQuotationId =

          data.salesQuotationId ??

          data.SalesQuotationId ??

          data.salesQuotationID ??

          data.SalesQuotationID ??

          null;

        console.log('SalesOrderList - salesQuotationId:', salesQuotationId);
        const {

          quotationInfo,

          quotationDetails,

          quotationDetailView,

        } = await fetchQuotationSupplement(salesQuotationId);

        console.log('SalesOrderList - Quotation supplement:', { quotationInfo, quotationDetails, quotationDetailView });


        const quotationDetailsMap = new Map();

        quotationDetails.forEach((item) => {

          const lotKey = item?.lotId ?? item?.LotId ?? null;

          if (lotKey !== null && lotKey !== undefined) {

            quotationDetailsMap.set(Number(lotKey), {

              productName: item.productName ?? item.ProductName ?? '-',

              productUnit: item.productUnit ?? item.ProductUnit ?? '',

              lotExpiredDate: item.lotExpiredDate ?? item.LotExpiredDate ?? null,

              unitPriceBeforeTax: item.unitPrice ?? item.UnitPrice ?? null,

            });

          }

        });



        const quotationTaxMap = new Map();

        quotationDetailView.forEach((detail) => {

          const productName = detail.productName ?? detail.ProductName ?? '';

          const expiredDisplay = detail.expiredDate ?? detail.ExpiredDate ?? '';

          const key = buildTaxKey(productName, expiredDisplay);

          if (key.trim() !== '__') {

            const taxText = detail.taxText ?? detail.TaxText ?? '-';

            quotationTaxMap.set(key, {

              taxText: taxText || '-',

              basePrice: detail.salesPrice ?? detail.SalesPrice ?? null,

              taxRate: taxText && taxText !== '-' ? getTaxRateFromText(taxText) : null,

            });

          }

        });



        const totalAmount = data.totalAmount ?? data.TotalAmount ?? data.totalPrice ?? data.TotalPrice ?? data.TotalPrice ?? data.grandTotal ?? 0;
        const depositPercentRaw =

          data.depositPercent ??

          data.DepositPercent ??

          quotationInfo?.depositPercent ??

          quotationInfo?.DepositPercent ??

          0;

        const depositPercent = Number.isFinite(Number(depositPercentRaw)) ? Number(depositPercentRaw) : 0;

        const paidAmount = data.paidAmount ?? data.PaidAmount ?? 0;

        const depositAmount = totalAmount * (depositPercent / 100);

        const remainingDeposit = Math.max(0, depositAmount - paidAmount);

        const depositDueDaysRaw =

          data.depositDueDays ??

          data.DepositDueDays ??

          quotationInfo?.depositDueDays ??

          quotationInfo?.DepositDueDays ??

          null;

        const depositDueDays = Number.isFinite(Number(depositDueDaysRaw)) ? Number(depositDueDaysRaw) : null;

        const createdAtValue = data.createdAt ?? data.CreateAt ?? data.CreatedAt ?? null;

        const depositExpiredFromData = data.depositExpiredDate ?? data.DepositExpiredDate ?? null;

        let computedDepositExpired = depositExpiredFromData;

        if (!computedDepositExpired && createdAtValue && depositDueDays !== null) {

          const createdDate = new Date(createdAtValue);

          if (!Number.isNaN(createdDate.getTime())) {

            const dueDate = new Date(createdDate);

            dueDate.setDate(dueDate.getDate() + depositDueDays);

            computedDepositExpired = dueDate.toISOString();

          }

        }

        

        // Process details with tax information from backend

        const rawDetails = data.details ?? data.Details ?? data.orderDetails ?? data.OrderDetails ?? data.salesOrderDetails ?? data.SalesOrderDetails ?? [];

        console.log('SalesOrderList - rawDetails:', rawDetails);
        const processedDetails = rawDetails.map((detail) => {

          const lotId = detail.lotId ?? detail.LotId ?? detail.lotID ?? detail.LotID ?? detail.Lot?.LotId ?? detail.lot?.LotId ?? null;

          const quotationMatch = lotId !== null ? quotationDetailsMap.get(Number(lotId)) : null;

          const quantity = detail.quantity ?? detail.Quantity ?? 0;

          const unitPriceAfterTaxRaw =

            detail.unitPrice ??

            detail.UnitPrice ??

            detail.unitPriceAfterTax ??

            detail.UnitPriceAfterTax ??

            0;

          

          // Get expired date from Lot

          const expiredDate =

            detail.Lot?.ExpiredDate ??

            detail.lot?.ExpiredDate ??

            detail.expiredDate ??

            detail.ExpiredDate ??

            quotationMatch?.lotExpiredDate ??

            null;

          const formattedExpiredDate = expiredDate ? formatDate(expiredDate) : '-';

          // Try to get product name from multiple sources
          let productName = 
            detail.productName ??

            detail.ProductName ??

            quotationMatch?.productName ??

            null;
          
          // If still no product name, try to get from quotation details by matching lotId
          if (!productName && lotId !== null) {
            const matchingQuotationDetail = quotationDetailView.find(qd => 
              (qd.lotId ?? qd.LotId) === lotId || 
              (qd.LotId ?? qd.lotId) === lotId
            );
            if (matchingQuotationDetail) {
              productName = matchingQuotationDetail.productName ?? matchingQuotationDetail.ProductName ?? null;
            }
          }
          
          // Fallback to '-' if still no product name
          if (!productName) {
            productName = '-';
          }
          const taxKey = buildTaxKey(productName, formattedExpiredDate);

          const taxData = quotationTaxMap.get(taxKey);

          

          // Get tax information from backend response

          let taxText = detail.taxText ?? detail.TaxText ?? taxData?.taxText ?? '-';

          let taxRate =

            detail.taxRate ??

            detail.TaxRate ??

            taxData?.taxRate ??

            null;

          if ((taxRate === null || taxRate === undefined) && taxText && taxText !== '-') {

            taxRate = getTaxRateFromText(taxText);

          }



          const basePriceFromQuotation =

            taxData?.basePrice ??

            quotationMatch?.unitPriceBeforeTax ??

            null;



          let unitPriceBeforeTax;

          if (basePriceFromQuotation !== null && basePriceFromQuotation !== undefined) {

            unitPriceBeforeTax = basePriceFromQuotation;

            if (taxRate === null || taxRate === undefined) {

              const computedRate =

                basePriceFromQuotation > 0

                  ? (unitPriceAfterTaxRaw - basePriceFromQuotation) / basePriceFromQuotation

                  : 0;

              if (Number.isFinite(computedRate) && computedRate >= 0) {

                taxRate = computedRate;

              }

            }

          } else if (taxRate !== null && taxRate !== undefined) {

            unitPriceBeforeTax = unitPriceAfterTaxRaw / (1 + taxRate);

          } else {

            unitPriceBeforeTax = unitPriceAfterTaxRaw;

          }



          if (!taxText || taxText === '-') {

            if (taxRate !== null && taxRate !== undefined && taxRate > 0) {

              const percentValue = Math.round(taxRate * 10000) / 100;

              taxText = `${percentValue}%`;

            } else {

              taxText = '-';

            }

          }



          const unitPriceAfterTax =

            taxRate !== null && taxRate !== undefined

              ? unitPriceBeforeTax * (1 + taxRate)

              : unitPriceAfterTaxRaw;



          const subtotal = quantity * unitPriceBeforeTax;

          const subtotalAfterTax =

            detail.subtotalAfterTax ??

            detail.SubtotalAfterTax ??

            quantity * unitPriceAfterTax;



          const normalizedTaxRate =

            taxRate !== null && taxRate !== undefined

              ? Math.max(0, Number(taxRate))

              : 0;

          

          return {

            ...detail,

            quantity,

            unitPrice: unitPriceBeforeTax,

            unitPriceAfterTax,

            subtotal,

            subtotalAfterTax,

            expiredDate: formattedExpiredDate,

            taxText: taxText || '-',

            taxRate: normalizedTaxRate,

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

          depositExpiredDate: computedDepositExpired,

          depositDueDays,

          totalAmount: totalAmount,

          paidAmount: paidAmount,

          remainingDeposit: remainingDeposit,

          depositAmount,

          dueAmount:

            data.debtAmount ?? data.DebtAmount ?? data.balanceAmount ?? data.BalanceAmount ?? null,

          details: processedDetails,

          salesQuotationId: salesQuotationId,

        });

        console.log('SalesOrderList - Order details set:', orderDetails);
      } else {

        console.warn('SalesOrderList - No data in response');
        setOrderDetails(null);

        setDetailError('Không có dữ liệu đơn hàng');
      }

    } catch (err) {

      console.error('SalesOrderList - Error loading order details:', err);
      console.error('SalesOrderList - Error message:', err.message);
      console.error('SalesOrderList - Error stack:', err.stack);
      console.error('SalesOrderList - Error response:', err.response);
      console.error('SalesOrderList - Error response data:', err.response?.data);
      console.error('SalesOrderList - Error response status:', err.response?.status);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải chi tiết đơn hàng.';
      setDetailError(errorMessage);

      setSnackbarMessage(errorMessage);

      setSnackbarOpen(true);

    } finally {

      setDetailLoading(false);

      console.log('SalesOrderList - handleViewDetails completed, detailLoading:', false);
    }

  };



  const handleOpenPaymentDialog = async (orderId) => {

    setSelectedOrderId(orderId);

    setDetailDialogOpen(true);

    setDetailLoading(true);

    setDetailError(null);

    setOrderDetails(null);

    try {

      const response = await salesOrderAPI.viewDetails(orderId);

      const data = response.data?.data;

      if (data) {

        setOrderDetails({

          id: data.id ?? data.salesOrderId ?? data.SalesOrderId ?? orderId,

          code: data.orderCode ?? data.salesOrderCode ?? data.SalesOrderCode ?? '',

          creator:

            data.creator ??

            data.createBy ??

            data.CreateBy ??

            data.createdBy ??

            data.CreatedBy ??

            data.customerName ??

            data.CustomerName ??

            '-',

          status: data.status ?? data.Status,

          createdAt: data.createdAt ?? data.CreateAt ?? data.CreatedAt ?? null,

          expiredAt: data.expiredDate ?? data.ExpiredDate ?? data.dueDate ?? data.DueDate ?? null,

          totalAmount:

            data.totalAmount ??

            data.TotalAmount ??

            data.totalPrice ??

            data.TotalPrice ??

            data.grandTotal ??

            0,

          paidAmount: data.paidAmount ?? data.PaidAmount ?? 0,

          dueAmount:

            data.debtAmount ?? data.DebtAmount ?? data.balanceAmount ?? data.BalanceAmount ?? null,

          details:

            data.details ??

            data.orderDetails ??

            data.OrderDetails ??

            data.salesOrderDetails ??

            data.SalesOrderDetails ??

            [],

          paymentUrl: data.paymentUrl ?? data.PaymentUrl ?? '',

          qrImage: data.qrImage ?? data.QrImage ?? data.qrCodeUrl ?? data.QRCodeUrl ?? '',

        });

      } else {

        setOrderDetails(null);

      }

    } catch (err) {

      const errorMessage = err.response?.data?.message || 'Không thể tải chi tiết đơn hàng.';

      setDetailError(errorMessage);

    } finally {

      setDetailLoading(false);

    }

  };



  const handleApprove = async (orderId) => {

    try {

      await salesOrderAPI.approveOrder(orderId);

      setSnackbarMessage('Đã chấp thuận đơn hàng.');

      setSnackbarOpen(true);

      // Refresh list without showing full page loading

      await fetchOrders(false);

    } catch (err) {

      const errorMessage = err.response?.data?.message || 'Không thể chấp thuận đơn hàng.';

      setSnackbarMessage(errorMessage);

      setSnackbarOpen(true);

    }

  };



  const handleReject = async (orderId) => {

    try {

      await salesOrderAPI.rejectOrder(orderId);

      setSnackbarMessage('Đã từ chối đơn hàng.');

      setSnackbarOpen(true);

      // Refresh list without showing full page loading

      await fetchOrders(false);

    } catch (err) {

      const errorMessage = err.response?.data?.message || 'Không thể từ chối đơn hàng.';

      setSnackbarMessage(errorMessage);

      setSnackbarOpen(true);

    }

  };



  const handleCloseDetailDialog = () => {

    setDetailDialogOpen(false);

    setSelectedOrderId(null);

    setOrderDetails(null);

    setDetailError(null);

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

                <TableCell sx={{ width: '17%', py: 1.5, px: 2 }}>

                  <TableSortLabel

                    active={sortConfig.key === 'code'}

                    direction={sortConfig.key === 'code' ? sortConfig.direction : 'asc'}

                    onClick={() => handleSort('code')}

                    hideSortIcon

                    sx={headerTextSx}

                  >

                    Mã đơn hàng

                  </TableSortLabel>

                </TableCell>

                <TableCell

                  sx={{

                    width: '14%',

                    py: 1.5,

                    px: 2,

                    textTransform: 'uppercase',

                    fontWeight: 600,

                    letterSpacing: '0.03em',

                  }}

                >

                  Người tạo

                </TableCell>

                <TableCell sx={{ width: '14%', py: 1.5, px: 2 }}>

                  <TableSortLabel

                    active={sortConfig.key === 'createdAt'}

                    direction={sortConfig.key === 'createdAt' ? sortConfig.direction : 'asc'}

                    onClick={() => handleSort('createdAt')}

                    sx={headerTextSx}

                  >

                    Thời gian tạo

                  </TableSortLabel>

                </TableCell>

                <TableCell sx={{ width: '13%', py: 1.5, px: 2 }}>

                  <TableSortLabel

                    active={sortConfig.key === 'orderStatus'}

                    direction={sortConfig.key === 'orderStatus' ? sortConfig.direction : 'asc'}

                    onClick={() => handleSort('orderStatus')}

                    sx={headerTextSx}

                  >

                    Trạng thái đơn hàng

                  </TableSortLabel>

                </TableCell>

                <TableCell sx={{ width: '13%', py: 1.5, px: 2 }}>

                  <TableSortLabel

                    active={sortConfig.key === 'paymentStatus'}

                    direction={sortConfig.key === 'paymentStatus' ? sortConfig.direction : 'asc'}

                    onClick={() => handleSort('paymentStatus')}

                    sx={headerTextSx}

                  >

                    Trạng thái thanh toán

                  </TableSortLabel>

                </TableCell>

                <TableCell sx={{ width: '11%', py: 1.5, px: 2 }}>

                  <TableSortLabel

                    active={sortConfig.key === 'paidAmount'}

                    direction={sortConfig.key === 'paidAmount' ? sortConfig.direction : 'asc'}

                    onClick={() => handleSort('paidAmount')}

                    sx={headerTextSx}

                  >

                    Tiền đã trả

                  </TableSortLabel>

                </TableCell>

                <TableCell sx={{ width: '15%', py: 1.5, px: 2 }}>

                  <TableSortLabel

                    active={sortConfig.key === 'totalAmount'}

                    direction={sortConfig.key === 'totalAmount' ? sortConfig.direction : 'asc'}

                    onClick={() => handleSort('totalAmount')}

                    sx={{ ...headerTextSx, whiteSpace: 'nowrap' }}

                  >

                    Tổng tiền đơn hàng

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

              {paginatedOrders.map((order, index) => (

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

                  <TableCell sx={{ textAlign: 'left' }}>

                    {(page - 1) * pageSize + index + 1}

                  </TableCell>

                  <TableCell sx={{ fontWeight: 500 }}>{order.code || '-'}</TableCell>

                  <TableCell>{order.creator || '-'}</TableCell>

                  <TableCell>{formatDate(order.createdAt)}</TableCell>

                  <TableCell>

                    {order.orderStatus !== undefined && order.orderStatus !== null ? (

                      <Chip

                        label={getOrderStatusLabel(order.orderStatus)}

                        size="small"

                        sx={getOrderStatusColor(order.orderStatus)}

                      />

                    ) : (

                      '-'

                    )}

                  </TableCell>

                  <TableCell>

                    {order.paymentStatus !== undefined && order.paymentStatus !== null ? (

                      <Chip

                        label={getPaymentStatusLabel(order.paymentStatus)}

                        size="small"

                        sx={getPaymentStatusColor(order.paymentStatus)}

                      />

                    ) : (

                      '-'

                    )}

                  </TableCell>

                  <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(order.paidAmount)}</TableCell>

                  <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(order.totalAmount)}</TableCell>

                  <TableCell sx={{ textAlign: 'right', verticalAlign: 'middle' }}>

                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>

                      {order.orderStatus === 1 && (

                        <>

                          <Tooltip title="Chấp thuận" placement="bottom" arrow>

                            <IconButton

                              size="medium"

                              onClick={() => handleApprove(order.id)}

                              sx={{

                                color: '#4caf50',

                                width: '40px',

                                height: '40px',

                                display: 'flex',

                                alignItems: 'center',

                                justifyContent: 'center',

                                '&:hover': {

                                  backgroundColor: 'rgba(76, 175, 80, 0.1)',

                                },

                              }}

                            >

                              <TaskAltIcon fontSize="medium" />

                            </IconButton>

                          </Tooltip>

                          <Tooltip title="Từ chối" placement="bottom" arrow>

                            <IconButton

                              size="medium"

                              onClick={() => handleReject(order.id)}

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

                              <HighlightOffIcon fontSize="medium" />

                            </IconButton>

                          </Tooltip>

                        </>

                      )}

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

                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>

                    <Typography variant="body2" color="text.secondary">

                      Chưa có đơn hàng nào

                    </Typography>

                  </TableCell>

                </TableRow>

              )}

            </TableBody>

          </Table>

          {sortedOrders.length > 0 && (

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

                      label={getOrderStatusLabel(orderDetails.status)}

                      size="small"

                      sx={getOrderStatusColor(orderDetails.status)}

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

          <Button onClick={handleCloseDetailDialog}>Đóng</Button>

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



export default SalesOrderList;

