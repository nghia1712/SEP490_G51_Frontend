import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  TableSortLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import salesOrderAPI from '../../API/salesOrderAPI';
import salesQuotationAPI from '../../API/salesQuotationAPI';
import paymentAPI from '../../API/paymentAPI';

const headerTextSx = {
  textTransform: 'uppercase',
  fontWeight: 600,
  letterSpacing: '0.03em',
};

const CustomerOrderList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' }); // Mặc định sort theo ngày tạo từ mới nhất đến cũ nhất
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentOrderDetails, setPaymentOrderDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [vnPayInitData, setVnPayInitData] = useState(null);
  const [vnPayInitError, setVnPayInitError] = useState('');
  const [vnPayInitLoading, setVnPayInitLoading] = useState(false);
  const [redirectingPayment, setRedirectingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('vnpay'); // 'vnpay', 'transfer', 'cash'
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const quotationInfoCache = useRef(new Map());
  const paymentWindowRef = useRef(null); // Reference đến tab thanh toán VNPay
  const remainingDepositAmount = paymentOrderDetails?.remainingDeposit ?? 0;
  const paymentButtonDisabled =
    redirectingPayment ||
    vnPayInitLoading ||
    !paymentOrderDetails ||
    (selectedPaymentMethod === 'vnpay' && !vnPayInitData?.paymentUrl) ||
    remainingDepositAmount <= 0;
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState('');
  const [pendingRejectOrderId, setPendingRejectOrderId] = useState(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const detailOrderStatus = orderDetails?.status ?? orderDetails?.Status ?? null;
  const detailPaymentStatus = orderDetails?.paymentStatus ?? orderDetails?.PaymentStatus ?? null;
  const detailQuotationCode =
    orderDetails?.quotationCode ??
    orderDetails?.QuotationCode ??
    orderDetails?.salesQuotationCode ??
    orderDetails?.SalesQuotationCode ??
    '-';

  const toNumberOrNull = useCallback((value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }, []);

  const detailPaymentLabel = useMemo(() => {
    if (!orderDetails) return null;

    const status =
      orderDetails.status ?? orderDetails.Status ?? orderDetails.salesOrderStatus ?? null;

    // Với Nháp, Đã gửi, Từ chối: không hiển thị trạng thái thanh toán
    if (status === 0 || status === 1 || status === 3) return null;

    const totalAmountValue =
      toNumberOrNull(
        orderDetails.totalAmount ??
          orderDetails.TotalAmount ??
          orderDetails.totalPrice ??
          orderDetails.TotalPrice ??
          null,
      ) ?? 0;

    const depositAmountValue =
      toNumberOrNull(orderDetails.depositAmount ?? orderDetails.DepositAmount ?? null) ?? 0;

    const paidAmountValue =
      toNumberOrNull(
        orderDetails.paidAmount ??
          orderDetails.PaidAmount ??
          orderDetails.depositPaidAmount ??
          orderDetails.DepositPaidAmount ??
          null,
      ) ?? 0;

    // Đã thanh toán toàn bộ
    if (totalAmountValue > 0 && paidAmountValue >= totalAmountValue) {
      return 'Đã thanh toán';
    }

    // Đã trả đủ tiền cọc nhưng chưa thanh toán hết
    if (depositAmountValue > 0 && paidAmountValue >= depositAmountValue) {
      return 'Đã cọc';
    }

    // Có yêu cầu cọc nhưng chưa trả đủ cọc
    if (depositAmountValue > 0 && paidAmountValue < depositAmountValue) {
      return 'Chờ cọc';
    }

    // Không yêu cầu cọc, chưa thanh toán đủ
    if (totalAmountValue > 0 && paidAmountValue < totalAmountValue) {
      return 'Chờ thanh toán';
    }

    return null;
  }, [orderDetails, toNumberOrNull]);

  const fetchQuotationInfo = useCallback(
    async (quotationId) => {
      if (!quotationId) return null;
      const cacheKey = String(quotationId);
      if (quotationInfoCache.current.has(cacheKey)) {
        return quotationInfoCache.current.get(cacheKey);
      }
      try {
        const res = await salesOrderAPI.getQuotationInfo(quotationId);
        const info = res.data?.data ?? null;
        if (info) {
          quotationInfoCache.current.set(cacheKey, info);
        }
        return info;
      } catch (error) {
        console.warn('Không thể lấy thông tin báo giá cho đơn hàng:', quotationId, error);
        return null;
      }
    },
    [],
  );

  const buildDepositInfo = useCallback(
    async (orderData, totalAmountHint) => {
      if (!orderData) {
        return {
          depositPercent: null,
          depositAmount: null,
          remainingDeposit: 0,
          paidAmount: 0,
          depositDueDays: null,
          depositExpiredDate: null,
        };
      }

      const totalAmount =
        totalAmountHint ??
        orderData.totalAmount ??
        orderData.TotalAmount ??
        orderData.totalPrice ??
        orderData.TotalPrice ??
        orderData.grandTotal ??
        0;

      let depositPercent = toNumberOrNull(
        orderData.depositPercent ??
          orderData.DepositPercent ??
          orderData.depositPercentage ??
          orderData.DepositPercentage ??
          null,
      );

      let depositAmount = toNumberOrNull(orderData.depositAmount ?? orderData.DepositAmount ?? null);
      const paidAmount = toNumberOrNull(
        orderData.paidAmount ?? orderData.PaidAmount ?? orderData.depositPaidAmount ?? orderData.DepositPaidAmount ?? 0,
      ) ?? 0;
      let remainingDeposit = toNumberOrNull(orderData.remainingDeposit ?? orderData.RemainingDeposit ?? null);
      let depositDueDays = toNumberOrNull(orderData.depositDueDays ?? orderData.DepositDueDays ?? null);
      let depositExpiredDate = orderData.depositExpiredDate ?? orderData.DepositExpiredDate ?? null;
      const createdAtValue =
        orderData.createAt ?? orderData.CreateAt ?? orderData.createdAt ?? orderData.CreatedAt ?? orderData.createdDate ?? orderData.CreatedDate ?? null;
      const salesQuotationId =
        orderData.salesQuotationId ?? orderData.SalesQuotationId ?? orderData.salesQuotationID ?? orderData.SalesQuotationID ?? null;

      if ((depositPercent === null || depositDueDays === null || !depositExpiredDate) && salesQuotationId) {
        const quotationInfo = await fetchQuotationInfo(salesQuotationId);
        if (quotationInfo) {
          depositPercent ??= toNumberOrNull(quotationInfo.depositPercent ?? quotationInfo.DepositPercent ?? null);
          depositDueDays ??= toNumberOrNull(quotationInfo.depositDueDays ?? quotationInfo.DepositDueDays ?? null);
          if (!depositExpiredDate) {
            depositExpiredDate =
              quotationInfo.depositExpiredDate ?? quotationInfo.DepositExpiredDate ?? null;
          }
        }
      }

      if (depositPercent !== null && totalAmount > 0) {
        const calculatedDepositAmount = totalAmount * (depositPercent / 100);
        depositAmount = Math.round(calculatedDepositAmount);
      }

      if (depositPercent === null && depositAmount !== null && totalAmount > 0) {
        depositPercent = Number(((depositAmount / totalAmount) * 100).toFixed(2));
      }

      remainingDeposit = depositAmount !== null ? Math.max(0, depositAmount - paidAmount) : 0;

      if (!depositExpiredDate && createdAtValue && depositDueDays !== null) {
        const createdDate = new Date(createdAtValue);
        if (!Number.isNaN(createdDate.getTime())) {
          const dueDate = new Date(createdDate);
          dueDate.setDate(dueDate.getDate() + depositDueDays);
          depositExpiredDate = dueDate.toISOString();
        }
      }

      return {
        depositPercent,
        depositAmount,
        remainingDeposit,
        paidAmount,
        depositDueDays,
        depositExpiredDate,
      };
    },
    [fetchQuotationInfo, toNumberOrNull],
  );

  const applyStatusFilter = useCallback(
    (data) => {
      let filtered = data;
      
      // Lọc theo trạng thái đơn hàng
      if (orderStatusFilter !== 'all') {
        const filterOrderStatus = Number(orderStatusFilter);
        filtered = filtered.filter((order) => order.orderStatus === filterOrderStatus);
      }
      
      // Lọc theo trạng thái thanh toán
      if (paymentStatusFilter !== 'all') {
        // Xử lý trường hợp đặc biệt "Chờ cọc"
        if (paymentStatusFilter === 'waiting_deposit') {
          filtered = filtered.filter((order) => {
            // Nếu trạng thái đơn hàng là Nháp (0), Đã gửi (1), hoặc Từ chối (3) thì không có trạng thái thanh toán
            if (order.orderStatus === 0 || order.orderStatus === 1 || order.orderStatus === 3) {
              return false;
            }
            // Kiểm tra xem có phải "Chờ cọc" không
            const depositPercentValue = order.depositPercent ?? order.DepositPercent ?? null;
            const depositPercentNum = toNumberOrNull(depositPercentValue);
            const hasDepositRequirement = depositPercentNum !== null && depositPercentNum > 0;
            const paymentStatus = order.paymentStatus ?? 0;
            const paidAmount = order.paidAmount ?? 0;
            
            // "Chờ cọc" khi: đơn đã chấp thuận, có yêu cầu cọc, chưa thanh toán gì
            return order.orderStatus === 2 && 
                   hasDepositRequirement && 
                   (paymentStatus === 0 || paymentStatus === null || paymentStatus === undefined) &&
                   paidAmount === 0;
          });
        } else {
          const filterPaymentStatus = Number(paymentStatusFilter);
          filtered = filtered.filter((order) => {
            // Nếu trạng thái đơn hàng là Nháp (0), Đã gửi (1), hoặc Từ chối (3) thì không có trạng thái thanh toán
            // Các đơn hàng này sẽ không khớp với bất kỳ filter thanh toán cụ thể nào
            if (order.orderStatus === 0 || order.orderStatus === 1 || order.orderStatus === 3) {
              return false;
            }
            
            // Nếu filter là "Chờ Thanh Toán" (0), loại trừ các đơn hàng "Chờ cọc"
            if (filterPaymentStatus === 0) {
              const depositPercentValue = order.depositPercent ?? order.DepositPercent ?? null;
              const depositPercentNum = toNumberOrNull(depositPercentValue);
              const hasDepositRequirement = depositPercentNum !== null && depositPercentNum > 0;
              const paidAmount = order.paidAmount ?? 0;
              
              // Loại trừ nếu có yêu cầu cọc và chưa thanh toán (đó là "Chờ cọc", không phải "Chờ thanh toán")
              if (hasDepositRequirement && paidAmount === 0) {
                return false;
              }
            }
            
            return order.paymentStatus === filterPaymentStatus;
          });
        }
      }
      
      return filtered;
    },
    [orderStatusFilter, paymentStatusFilter],
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await salesOrderAPI.myListSalesOrder();
      // Backend trả về: { success, message, data }
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Map dữ liệu từ API response sang format component
        // Backend trả về PascalCase (SalesOrderId, SalesOrderCode, etc.)
        const mappedOrders = response.data.data.map((order) => {
          // Lấy SalesOrderStatus từ backend (enum hoặc số)
          // Backend trả về SalesOrderStatus (enum: Draft=0, Send=1, Approved=2, Rejected=3, Delivered=4, Complete=5, NotComplete=6)
          const orderStatusRaw = 
            order.SalesOrderStatus ?? 
            order.salesOrderStatus ?? 
            order.Status ?? 
            order.status ?? 
            null;
          
          // Convert enum string thành số nếu cần
          let orderStatus = orderStatusRaw;
          if (typeof orderStatusRaw === 'string') {
            const statusMap = {
              'Draft': 0,
              'Send': 1,
              'Approved': 2,
              'Rejected': 3,
              'Delivered': 4,
              'Complete': 5,
              'NotComplete': 6
            };
            orderStatus = statusMap[orderStatusRaw] ?? orderStatusRaw;
          }
          if (typeof orderStatus === 'number') {
            orderStatus = Number(orderStatus);
          }

          // Lấy PaymentStatus từ backend (enum hoặc số)
          // Backend trả về PaymentStatus (enum: Pending=0, Deposited=1, Paid=2, Success=3, Failed=4, Refunded=5)
          const paymentStatusRaw = 
            order.PaymentStatus ?? 
            order.paymentStatus ?? 
            order.PaymentStatusValue ?? 
            order.paymentStatusValue ??
            (order.PaymentStatusName ? (() => {
              const nameMap = {
                'Pending': 0,
                'Deposited': 1,
                'Paid': 2,
                'Success': 3,
                'Failed': 4,
                'Refunded': 5
              };
              return nameMap[order.PaymentStatusName] ?? null;
            })() : null) ??
            (order.paymentStatusName ? (() => {
              const nameMap = {
                'Pending': 0,
                'Deposited': 1,
                'Paid': 2,
                'Success': 3,
                'Failed': 4,
                'Refunded': 5
              };
              return nameMap[order.paymentStatusName] ?? null;
            })() : null) ??
            null;
          
          // Convert enum string thành số nếu cần
          let paymentStatus = paymentStatusRaw;
          if (typeof paymentStatusRaw === 'string') {
            const paymentMap = {
              'Pending': 0,
              'Deposited': 1,
              'Paid': 2,
              'Success': 3,
              'Failed': 4,
              'Refunded': 5
            };
            paymentStatus = paymentMap[paymentStatusRaw] ?? paymentStatusRaw;
          }
          if (typeof paymentStatus === 'number') {
            paymentStatus = Number(paymentStatus);
          }

          // Đảm bảo trạng thái thanh toán tối thiểu hợp lý nếu backend chưa set
          // Nếu đơn đã được chấp thuận (2) mà backend chưa gán PaymentStatus, mặc định là Pending (0)
          if (orderStatus === 2 && (paymentStatus === null || paymentStatus === undefined)) {
            paymentStatus = 0;
          }
          // Nếu đơn đã hoàn thành (5) mà PaymentStatus chưa có, mặc định là Paid (2)
          if (orderStatus === 5 && (paymentStatus === null || paymentStatus === undefined)) {
            paymentStatus = 2;
          }

          const paidAmountValue =
            toNumberOrNull(order.PaidAmount ?? order.paidAmount ?? order.depositPaidAmount ?? order.DepositPaidAmount ?? null) ??
            0;

          const orderCode =
            order.SalesOrderCode ||
            order.salesOrderCode ||
            order.OrderCode ||
            order.orderCode ||
            '';

          const normalizedRejectReason = (order.RejectReason ?? order.rejectReason ?? '').toString().trim();
          const depositPercentValue = toNumberOrNull(
            order.DepositPercent ??
              order.depositPercent ??
              order.DepositPercentage ??
              order.depositPercentage ??
              null
          );
          const depositAmountValue = toNumberOrNull(
            order.DepositAmount ??
              order.depositAmount ??
              order.RequiredDepositAmount ??
              order.requiredDepositAmount ??
              null
          );

          return {
            id: order.SalesOrderId || order.salesOrderId,
            quotationCode: orderCode,
            orderStatus, // Trạng thái đơn hàng
            paymentStatus, // Trạng thái thanh toán
            status: orderStatus, // Giữ lại để tương thích với filter cũ
            orderCode,
            createdAt: order.CreateAt || order.createAt,
            totalAmount: order.TotalPrice || order.totalPrice,
            paidAmount: paidAmountValue,
            rejectReason: normalizedRejectReason || '',
            depositPercent: depositPercentValue,
            depositAmount: depositAmountValue,
          };
        });

        setAllOrders(mappedOrders);
        setOrders(applyStatusFilter(mappedOrders));

        // rejectReason đã có trong dữ liệu list, không cần gọi thêm API chi tiết
      } else {
        setAllOrders([]);
        setOrders([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách đơn hàng';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      setAllOrders([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [applyStatusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-open payment dialog hoặc dialog lý do từ chối / highlight đơn nếu được điều hướng từ màn khác
  useEffect(() => {
    const { openOrderId, openRejectOrderId, highlightOrderId } = location.state || {};

    // Nếu có đơn cần highlight (vừa tạo xong), lưu lại id để sắp xếp đưa lên đầu
    if (highlightOrderId) {
      const normalizedId = Number(highlightOrderId);
      if (!Number.isNaN(normalizedId)) {
        setHighlightedOrderId(normalizedId);
      }
    }

    if (openOrderId || openRejectOrderId || highlightOrderId) {
      navigate(location.pathname, { replace: true, state: {} });
    }

    if (openOrderId) {
      setTimeout(() => {
        handlePayment(openOrderId);
      }, 500);
    }

    if (openRejectOrderId) {
      const normalizedId = Number(openRejectOrderId);
      if (!Number.isNaN(normalizedId)) {
        setPendingRejectOrderId(normalizedId);
      }
    }
  }, [location.state, navigate]);

  // Sắp xếp lại danh sách để đơn được highlight xuất hiện ở đầu
  useEffect(() => {
    if (!highlightedOrderId || allOrders.length === 0) return;

    const index = allOrders.findIndex(
      (order) => Number(order.id) === Number(highlightedOrderId),
    );

    if (index <= 0) {
      return;
    }

    const highlightedOrder = allOrders[index];
    const reordered = [
      highlightedOrder,
      ...allOrders.slice(0, index),
      ...allOrders.slice(index + 1),
    ];

    setAllOrders(reordered);
    // Không reset highlightedOrderId, để khi reload lại data từ backend (đã được order theo CreateAt desc)
    // vẫn không gây loop vì index sẽ là 0.
  }, [highlightedOrderId, allOrders]);

  useEffect(() => {
    if (!pendingRejectOrderId || orders.length === 0) return;
    const targetOrder = orders.find(
      (order) => Number(order.id) === Number(pendingRejectOrderId),
    );
    if (targetOrder) {
      const reason = (targetOrder.rejectReason ?? '').toString().trim();
      setSelectedRejectReason(reason);
      setReasonDialogOpen(true);
      setPendingRejectOrderId(null);
    }
  }, [pendingRejectOrderId, orders]);

  useEffect(() => {
    setOrders(applyStatusFilter(allOrders));
  }, [applyStatusFilter, allOrders]);

  useEffect(() => {
    setPage(1);
  }, [orderStatusFilter, paymentStatusFilter, sortConfig]);

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';
    setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' });
  };

  // Sort orders based on sortConfig
  const sortedOrders = useMemo(() => {
    // Nếu không có sortConfig.key, mặc định sort theo createdAt từ mới nhất đến cũ nhất
    const effectiveSortConfig = sortConfig.key 
      ? sortConfig 
      : { key: 'createdAt', direction: 'desc' };
    
    if (!effectiveSortConfig.key) return orders;

    return [...orders].sort((a, b) => {
      let aValue, bValue;

      if (effectiveSortConfig.key === 'quotationCode') {
        aValue = (a.quotationCode || '').toLowerCase();
        bValue = (b.quotationCode || '').toLowerCase();
      } else if (effectiveSortConfig.key === 'createdAt') {
        aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (effectiveSortConfig.key === 'status' || effectiveSortConfig.key === 'orderStatus') {
        aValue = a.orderStatus !== undefined && a.orderStatus !== null ? a.orderStatus : (a.status !== undefined && a.status !== null ? a.status : -1);
        bValue = b.orderStatus !== undefined && b.orderStatus !== null ? b.orderStatus : (b.status !== undefined && b.status !== null ? b.status : -1);
      } else if (effectiveSortConfig.key === 'paymentStatus') {
        aValue = a.paymentStatus !== undefined && a.paymentStatus !== null ? a.paymentStatus : -1;
        bValue = b.paymentStatus !== undefined && b.paymentStatus !== null ? b.paymentStatus : -1;
      } else if (effectiveSortConfig.key === 'paidAmount') {
        aValue = a.paidAmount || 0;
        bValue = b.paidAmount || 0;
      } else if (effectiveSortConfig.key === 'totalAmount') {
        aValue = a.totalAmount || 0;
        bValue = b.totalAmount || 0;
      } else {
        return 0;
      }

      if (aValue < bValue) {
        return effectiveSortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return effectiveSortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [orders, sortConfig]);

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

  // Hàm lấy label cho trạng thái đơn hàng
  // Hàm tính toán trạng thái đơn hàng hiệu quả dựa trên payment status và số tiền
  const getEffectiveOrderStatus = (orderStatus, paymentStatus, orderData = null) => {
    if (!orderData) {
      // Nếu không có orderData, chỉ kiểm tra payment status
      if (paymentStatus === 2) { // PartiallyPaid
        return 4; // PartiallyDelivered
      }
      return orderStatus;
    }

    const totalAmount = toNumberOrNull(
      orderData.totalAmount ??
      orderData.TotalAmount ??
      orderData.totalPrice ??
      orderData.TotalPrice ??
      orderData.grandTotal ??
      0
    ) ?? 0;

    const paidAmount = toNumberOrNull(
      orderData.paidAmount ??
      orderData.PaidAmount ??
      orderData.depositPaidAmount ??
      orderData.DepositPaidAmount ??
      0
    ) ?? 0;

    // Nếu tổng tiền = tiền đã trả → "Giao toàn bộ hàng" (Delivered = 5)
    if (totalAmount > 0 && paidAmount >= totalAmount) {
      return 5; // Delivered
    }

    // Nếu payment status là "Đã thanh toán 1 phần" (PartiallyPaid = 2)
    // thì hiển thị order status là "Giao hàng 1 phần" (PartiallyDelivered = 4)
    if (paymentStatus === 2) { // PartiallyPaid
      return 4; // PartiallyDelivered
    }

    // Trả về order status gốc
    return orderStatus;
  };

  // Hàm lấy label cho trạng thái đơn hàng (đầy đủ)
  const getOrderStatusLabel = (status, short = false) => {
    // SalesOrderStatus enum: Draft=0, Send=1, Approved=2, Rejected=3, PartiallyDelivered=4, Delivered=5, Complete=6, NotComplete=7
    switch (status) {
      case 0:
        return 'Nháp'; // Draft
      case 1:
        return 'Đã gửi'; // Send
      case 2:
        return 'Chấp thuận'; // Approved
      case 3:
        return 'Từ chối'; // Rejected
      case 4:
        return short ? '... hàng 1 phần' : 'Giao hàng 1 phần'; // PartiallyDelivered
      case 5:
        return short ? '... toàn bộ hàng' : 'Giao toàn bộ hàng'; // Delivered
      case 6:
        return 'Hoàn thành'; // Complete
      case 7:
        return 'Chưa hoàn thành'; // NotComplete
      default:
        return 'Không xác định';
    }
  };

  // Hàm lấy màu cho trạng thái đơn hàng
  const getOrderStatusColor = (status) => {
    // SalesOrderStatus enum: Draft=0, Send=1, Approved=2, Rejected=3, PartiallyDelivered=4, Delivered=5, Complete=6, NotComplete=7
    switch (status) {
      case 0: // Nháp (Draft)
        return { backgroundColor: '#fff3cd', color: '#856404' };
      case 1: // Đã gửi (Send)
        return { backgroundColor: '#e3f2fd', color: '#1a4a57' };
      case 2: // Chấp thuận (Approved)
        return { backgroundColor: '#ffe082', color: '#8c6d1f' };
      case 3: // Từ chối (Rejected)
        return { backgroundColor: '#f8d7da', color: '#721c24' };
      case 4: // Giao hàng 1 phần (PartiallyDelivered)
        return { backgroundColor: '#b3d9ff', color: '#003366' };
      case 5: // Giao toàn bộ hàng (Delivered)
        return { backgroundColor: '#cce5ff', color: '#004085' };
      case 6: // Hoàn thành (Complete)
        return { backgroundColor: '#d4edda', color: '#155724' };
      case 7: // Chưa hoàn thành (NotComplete)
        return { backgroundColor: '#ffe0b2', color: '#e65100' };
      default:
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    }
  };

  // Hàm lấy label cho trạng thái thanh toán (đầy đủ)
  const getPaymentStatusLabel = (status) => {
    // PaymentStatus enum backend: NotPaymentYet=0, Deposited=1, PartiallyPaid=2, Paid=3, Refunded=4
    switch (status) {
      case 0:
        return 'Chờ thanh toán'; // NotPaymentYet
      case 1:
        return 'Đã cọc'; // Deposited
      case 2:
        return 'Đã thanh toán 1 phần'; // PartiallyPaid
      case 3:
        return 'Đã thanh toán toàn bộ'; // Paid
      case 4:
        return 'Trả lại tiền'; // Refunded
      default:
        return 'Không xác định';
    }
  };

  // Hàm lấy label ngắn gọn cho trạng thái thanh toán (dùng trong bảng list)
  const getPaymentStatusLabelShort = (status) => {
    // PaymentStatus enum backend: NotPaymentYet=0, Deposited=1, PartiallyPaid=2, Paid=3, Refunded=4
    switch (status) {
      case 0:
        return 'Chờ thanh toán'; // NotPaymentYet
      case 1:
        return 'Đã cọc'; // Deposited
      case 2:
        return '... toán 1 phần'; // PartiallyPaid
      case 3:
        return '... toán toàn bộ'; // Paid
      case 4:
        return 'Trả lại tiền'; // Refunded
      default:
        return 'Không xác định';
    }
  };

const hasDepositRequirement = (depositInfo) => {
  if (!depositInfo) return false;
  const percentValue = depositInfo.percent;
  const amountValue = depositInfo.amount;
  if (percentValue !== null && percentValue !== undefined) {
    const parsed = Number(percentValue);
    if (Number.isFinite(parsed) && parsed > 0) {
      return true;
    }
  }
  if (amountValue !== null && amountValue !== undefined) {
    const parsedAmount = Number(amountValue);
    if (Number.isFinite(parsedAmount) && parsedAmount > 0) {
      return true;
    }
  }
  return false;
};

const getPaymentStatusLabelByContext = (paymentStatus, orderStatus, depositInfo, orderData = null, short = false) => {
  const normalizedStatus = typeof orderStatus === 'string' ? Number(orderStatus) : orderStatus;
  const normalizedPayment =
    typeof paymentStatus === 'string' && paymentStatus !== ''
      ? Number(paymentStatus)
      : paymentStatus;

  // ƯU TIÊN: Nếu trạng thái đơn hàng là "Giao hàng 1 phần" (4) → trạng thái thanh toán là "Đã thanh toán 1 phần"
  if (normalizedStatus === 4) { // PartiallyDelivered
    return short ? '... toán 1 phần' : 'Đã thanh toán 1 phần';
  }

  let paidAmount = 0;
  let totalAmount = 0;
  let depositAmount = 0;

  // Kiểm tra dựa trên số tiền đã thanh toán và số tiền cọc yêu cầu
  if (orderData) {
    paidAmount = toNumberOrNull(orderData.paidAmount ?? orderData.PaidAmount ?? 0) ?? 0;
    totalAmount =
      toNumberOrNull(
        orderData.totalAmount ??
          orderData.TotalAmount ??
          orderData.totalPrice ??
          orderData.TotalPrice ??
          0,
      ) ?? 0;
    depositAmount =
      toNumberOrNull(
        depositInfo?.amount ?? orderData.depositAmount ?? orderData.DepositAmount ?? null,
      ) ?? 0;

    // ƯU TIÊN: Nếu đã thanh toán đủ tổng tiền → "Đã thanh toán toàn bộ"
    if (totalAmount > 0 && paidAmount >= totalAmount) {
      return short ? '... toán toàn bộ' : 'Đã thanh toán toàn bộ';
    }

    // Nếu đã thanh toán một phần (đã cọc hoặc thanh toán một phần nhưng chưa đủ tổng tiền)
    if (totalAmount > 0 && paidAmount > 0 && paidAmount < totalAmount) {
      // Nếu đã cọc đủ hoặc hơn số tiền cọc yêu cầu
      if (depositAmount > 0 && paidAmount >= depositAmount) {
        return 'Đã cọc';
      }
      // Nếu đã thanh toán một phần nhưng chưa đủ cọc
      return short ? '... toán 1 phần' : 'Đã thanh toán 1 phần';
    }
  }

  // Nếu không có orderData, kiểm tra paymentStatus từ backend
  // Nếu paymentStatus = 1 (Deposited), hiển thị "Đã cọc"
  if (normalizedPayment === 1) {
    return 'Đã cọc';
  }

  // Nếu backend đã set trạng thái thanh toán cụ thể (Đã thanh toán, ...)
  if (
    normalizedPayment === 2 || // PartiallyPaid
    normalizedPayment === 3 || // Paid
    normalizedPayment === 4 || // Failed
    normalizedPayment === 5 // Refunded
  ) {
    return short ? getPaymentStatusLabelShort(normalizedPayment) : getPaymentStatusLabel(normalizedPayment);
  }

  // Nếu đơn đã được chấp thuận và chưa thanh toán đồng nào
  // Kiểm tra depositPercent để quyết định hiển thị "Chờ cọc" hay "Chờ thanh toán"
  if (
    normalizedStatus === 2 &&
    (normalizedPayment === null || normalizedPayment === undefined || normalizedPayment === 0) &&
    paidAmount === 0
  ) {
    const depositPercentValue = depositInfo?.percent ?? orderData?.depositPercent ?? orderData?.DepositPercent ?? null;
    const depositPercentNum = toNumberOrNull(depositPercentValue);
    // Nếu depositPercent = 0 hoặc null: hiển thị "Chờ thanh toán"
    // Nếu depositPercent > 0: hiển thị "Chờ cọc"
    if (depositPercentNum === null || depositPercentNum === 0) {
      return 'Chờ thanh toán';
    } else {
      return 'Chờ cọc';
    }
  }

  // Mặc định: suy luận theo enum thanh toán
  return short ? getPaymentStatusLabelShort(normalizedPayment) : getPaymentStatusLabel(normalizedPayment);
};

  // Hàm lấy màu cho trạng thái thanh toán
  const getPaymentStatusColor = (status) => {
    // PaymentStatus enum: Pending=0, Deposited=1, PartiallyPaid=2, Paid=3, Refunded=4
    switch (status) {
      case 0: // Chờ thanh toán (Pending)
        return { backgroundColor: '#fff3cd', color: '#856404' };
      case 1: // Đã cọc (Deposited)
        return { backgroundColor: '#9c27b0', color: '#ffffff' }; // Màu tím đậm
      case 2: // Đã thanh toán 1 phần (PartiallyPaid)
        return { backgroundColor: '#fff9c4', color: '#f57f17' }; // Màu vàng nhạt để phân biệt với đã cọc
      case 3: // Đã thanh toán toàn bộ (Paid)
        return { backgroundColor: '#c8e6c9', color: '#1b5e20' };
      case 4: // Thất bại (Failed)
        return { backgroundColor: '#ffcdd2', color: '#b71c1c' };
      case 5: // Trả lại tiền (Refunded)
        return { backgroundColor: '#f8bbd0', color: '#880e4f' };
      default:
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    }
  };

  // Giữ lại hàm cũ để tương thích với filter
  const getStatusLabel = (status) => {
    return getOrderStatusLabel(status);
  };

  // Giữ lại hàm cũ để tương thích với filter
  const getStatusColor = (status) => {
    // Convert to MUI color name if possible, otherwise return object
    if (status === 0) return 'default';
    if (status === 1) return 'info';
    if (status === 2) return 'warning';
    if (status === 3) return 'error';
    if (status === 4) return 'primary';
    if (status === 5) return 'success';
    if (status === 6) return 'warning';
    return 'default';
  };

  const handleEdit = (orderId) => {
    // Navigate to edit page
    // Edit page removed, navigate to orders list
    navigate('/customer/orders');
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      return;
    }
    try {
      await salesOrderAPI.deleteOrder(orderId);
      setSnackbarMessage('Xóa đơn hàng thành công!');
      setSnackbarOpen(true);
      fetchOrders();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể xóa đơn hàng';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handleSend = async (orderId) => {
    try {
      await salesOrderAPI.sendOrder(orderId);
      setSnackbarMessage('Gửi đơn hàng thành công!');
      setSnackbarOpen(true);
      fetchOrders();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể gửi đơn hàng';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const initVnPayDeposit = useCallback(
    async (salesOrderId) => {
      if (!salesOrderId) {
        setVnPayInitData(null);
        setVnPayInitError('Không tìm thấy mã đơn hàng để khởi tạo thanh toán.');
        return;
      }
      setVnPayInitLoading(true);
      setVnPayInitError('');
      setVnPayInitData(null);
      try {
        const payload = {
          salesOrderId,
          paymentType: 'deposit',
          locale: 'vn',
        };
        const response = await paymentAPI.init(payload);
        const data = response.data?.data ?? {};
        const normalized = {
          paymentUrl: data.paymentUrl ?? data.PaymentUrl ?? '',
          qrBase64: data.qrBase64 ?? data.QrBase64 ?? '',
          amount: data.amount ?? data.Amount ?? null,
          txnRef: data.txnRef ?? data.TxnRef ?? '',
        };
        setVnPayInitData(normalized);
        if (!normalized.paymentUrl) {
          setVnPayInitError('Không nhận được link thanh toán từ VNPay.');
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Không thể khởi tạo thanh toán VNPay.';
        setVnPayInitError(message);
        setSnackbarMessage(message);
        setSnackbarOpen(true);
      } finally {
        setVnPayInitLoading(false);
      }
    },
    [setSnackbarMessage, setSnackbarOpen],
  );

  const handlePayment = async (orderId) => {
    setPaymentDialogOpen(true);
    setPaymentLoading(true);
    setPaymentOrderDetails(null);
    setVnPayInitData(null);
    setVnPayInitError('');
    setVnPayInitLoading(false);
    setRedirectingPayment(false);
    setSelectedPaymentMethod('vnpay');
    try {
      const response = await salesOrderAPI.viewDetails(orderId);
      if (response.data && response.data.data) {
        const data = response.data.data;
        const totalAmount =
          data.totalAmount ??
          data.TotalAmount ??
          data.totalPrice ??
          data.TotalPrice ??
          data.grandTotal ??
          0;
        const orderExpiredDate =
          data.orderExpiredDate ??
          data.OrderExpiredDate ??
          data.salesOrderExpiredDate ??
          data.SalesOrderExpiredDate ??
          data.expiredDate ??
          data.ExpiredDate ??
          null;
        const {
          depositPercent,
          depositAmount,
          remainingDeposit,
          paidAmount,
          depositDueDays,
          depositExpiredDate,
        } = await buildDepositInfo(data, totalAmount);
        const normalizedRemainingDeposit = remainingDeposit ?? 0;

        const paymentStatusRaw =
          data.paymentStatus ??
          data.PaymentStatus ??
          data.paymentStatusValue ??
          data.PaymentStatusValue ??
          data.paymentStatusName ??
          data.PaymentStatusName ??
          null;
        let paymentStatus = paymentStatusRaw;
        if (typeof paymentStatusRaw === 'string') {
          const paymentMap = {
            Pending: 0,
            Deposited: 1,
            Paid: 2,
            Success: 3,
            Failed: 4,
            Refunded: 5,
          };
          paymentStatus = paymentMap[paymentStatusRaw] ?? null;
        }
        if (typeof paymentStatus === 'number') {
          paymentStatus = Number(paymentStatus);
        }
        const orderStatusRaw = data.status ?? data.Status ?? data.salesOrderStatus ?? data.SalesOrderStatus ?? null;
        let orderStatus = orderStatusRaw;
        if (typeof orderStatusRaw === 'string') {
          const statusMap = {
            Draft: 0,
            Send: 1,
            Approved: 2,
            Rejected: 3,
            Delivered: 4,
            Complete: 5,
            NotComplete: 6,
          };
          orderStatus = statusMap[orderStatusRaw] ?? null;
        }
        if (typeof orderStatus === 'number') {
          orderStatus = Number(orderStatus);
        }
        if (orderStatus === 2 && (paymentStatus === null || paymentStatus === undefined)) {
          paymentStatus = 0;
        }
        
        const salesOrderId = data.salesOrderId ?? data.SalesOrderId;

        const normalizedOrder = {
          id: salesOrderId,
          code: data.salesOrderCode ?? data.SalesOrderCode,
          status: orderStatus,
          paymentStatus,
          createdAt: data.createAt ?? data.CreateAt,
          expiredDate: orderExpiredDate,
          depositPercent,
          totalAmount: totalAmount,
          remainingDeposit: normalizedRemainingDeposit,
          paidAmount: paidAmount ?? 0,
          depositAmount: depositAmount ?? null,
          createBy: data.createBy ?? data.CreateBy,
          depositExpiredDate,
          depositDueDays,
        };

        setPaymentOrderDetails(normalizedOrder);

        // Nếu còn tiền cần cọc và phương thức hiện tại là VNPay thì tự động khởi tạo phiên thanh toán VNPay
        if (normalizedRemainingDeposit > 0 && selectedPaymentMethod === 'vnpay') {
          await initVnPayDeposit(salesOrderId);
        } else if (normalizedRemainingDeposit <= 0) {
          setVnPayInitError('Đơn hàng này không còn số tiền cần cọc.');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải thông tin đơn hàng';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentMethodChange = async (method) => {
    setSelectedPaymentMethod(method);
    setVnPayInitData(null);
    setVnPayInitError('');
    
    if (method === 'vnpay' && paymentOrderDetails?.id) {
      // Khởi tạo VNPay khi chọn phương thức VNPay
      await initVnPayDeposit(paymentOrderDetails.id);
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
    // Mở cổng thanh toán VNPay ở tab mới để khách không mất màn hình đơn hàng
    paymentWindowRef.current = window.open(vnPayInitData.paymentUrl, '_blank', 'noopener,noreferrer');
    
    // Lắng nghe message từ tab thanh toán khi hoàn thành
    const handleMessage = (event) => {
      // Kiểm tra origin để đảm bảo an toàn (có thể điều chỉnh theo domain của bạn)
      if (event.data && event.data.type === 'VNPAY_PAYMENT_SUCCESS') {
        // Đóng tab thanh toán nếu còn mở
        if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
          paymentWindowRef.current.close();
        }
        // Refresh danh sách đơn hàng
        fetchOrders();
        // Đóng dialog thanh toán
        setPaymentDialogOpen(false);
        setSnackbarMessage('Thanh toán thành công!');
        setSnackbarOpen(true);
        // Xóa listener
        window.removeEventListener('message', handleMessage);
        setRedirectingPayment(false);
      } else if (event.data && event.data.type === 'VNPAY_PAYMENT_FAILED') {
        // Xử lý khi thanh toán thất bại
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
    
    // Kiểm tra định kỳ xem tab đã đóng chưa (fallback nếu không nhận được message)
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      if (paymentWindowRef.current && paymentWindowRef.current.closed) {
        // Tab đã đóng, đợi một chút để đảm bảo backend đã xử lý xong
        // Sau đó refresh danh sách đơn hàng
        clearInterval(checkInterval);
        window.removeEventListener('message', handleMessage);
        
        // Đợi 2 giây để backend xử lý callback từ VNPay
        setTimeout(() => {
          fetchOrders();
          setPaymentDialogOpen(false);
          setRedirectingPayment(false);
          paymentWindowRef.current = null;
        }, 2000);
      }
      
      // Dừng kiểm tra sau 10 phút
      if (checkCount >= 600) {
        clearInterval(checkInterval);
        window.removeEventListener('message', handleMessage);
        setRedirectingPayment(false);
      }
    }, 1000);
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

  const handleComplete = async (orderId) => {
    try {
      await salesOrderAPI.completeOrder(orderId);
      setSnackbarMessage('Hoàn thành đơn hàng thành công!');
      setSnackbarOpen(true);
      fetchOrders();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể hoàn thành đơn hàng';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
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

  const handleView = async (orderId) => {
    setDetailDialogOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setOrderDetails(null);
    try {
      const response = await salesOrderAPI.viewDetails(orderId);
      if (response.data && response.data.data) {
        const data = response.data.data;
        console.log('Order details response:', data);
        const totalAmount =
          data.totalAmount ?? data.TotalAmount ?? data.totalPrice ?? data.TotalPrice ?? data.grandTotal ?? 0;
        const {
          depositPercent,
          depositAmount,
          remainingDeposit,
          paidAmount,
          depositDueDays,
          depositExpiredDate,
        } = await buildDepositInfo(data, totalAmount);
        
        // Process details with tax information from backend
        const rawDetails =
          data.details ??
          data.Details ??
          data.orderDetails ??
          data.OrderDetails ??
          data.salesOrderDetails ??
          data.SalesOrderDetails ??
          [];
        const processedDetails = rawDetails.map((detail) => {
          const quantity = detail.quantity ?? detail.Quantity ?? 0;
          const unitPriceBeforeTax =
            detail.unitPrice ??
            detail.UnitPrice ??
            detail.unitPriceBeforeTax ??
            detail.UnitPriceBeforeTax ??
            detail.priceBeforeTax ??
            detail.PriceBeforeTax ??
            0;
          const rawTaxRate = detail.taxRate ?? detail.TaxRate ?? null;
          const taxText =
            detail.taxText ??
            detail.TaxText ??
            detail.taxPolicyName ??
            detail.TaxPolicyName ??
            detail.taxName ??
            detail.TaxName ??
            '-';
          const taxRate =
            rawTaxRate !== null && rawTaxRate !== undefined
              ? rawTaxRate
              : taxText !== '-' ? getTaxRateFromText(taxText) : 0;
          const unitPriceAfterTax =
            detail.unitPriceAfterTax ??
            detail.UnitPriceAfterTax ??
            detail.priceAfterTax ??
            detail.PriceAfterTax ??
            unitPriceBeforeTax * (1 + (taxRate || 0));
          const subtotalBeforeTax =
            detail.subtotal ??
            detail.Subtotal ??
            detail.subTotalPrice ??
            detail.SubTotalPrice ??
            detail.totalBeforeTax ??
            detail.TotalBeforeTax ??
            quantity * unitPriceBeforeTax;
          const subtotalAfterTax =
            detail.subtotalAfterTax ??
            detail.SubtotalAfterTax ??
            detail.totalAfterTax ??
            detail.TotalAfterTax ??
            quantity * unitPriceAfterTax;
          const expiredDate =
            detail.expiredDate ??
            detail.ExpiredDate ??
            detail.expiredDateText ??
            detail.ExpiredDateText ??
            detail.lot?.ExpiredDate ??
            detail.Lot?.ExpiredDate ??
            detail.lot?.expiredDate ??
            detail.Lot?.expiredDate ??
            null;
          const productName = detail.productName ?? detail.ProductName ?? '-';
          const expiredDisplay = expiredDate ? formatDate(expiredDate) : '-';
          const unitName =
            detail.unitName ??
            detail.UnitName ??
            detail.uomName ??
            detail.UomName ??
            detail.unit ??
            detail.Unit ??
            detail.unitMeasure ??
            detail.UnitMeasure ??
            detail.lot?.UnitName ??
            detail.Lot?.UnitName ??
            detail.lot?.unitName ??
            detail.Lot?.unitName ??
            '-';

          return {
            ...detail,
            productName,
            quantity,
            unitPriceBeforeTax,
            unitPriceAfterTax,
            subtotalBeforeTax,
            subtotalAfterTax,
            taxText: taxText || '-',
            taxRate,
            expiredDate,
            expiredDisplay,
            unitName,
          };
        });
        
        let quotationDetailsList = [];
        let quotationInfoData = null;
        if (data.salesQuotationId) {
          try {
            const quotationDetailResponse = await salesQuotationAPI.viewDetails(data.salesQuotationId);
            quotationInfoData = quotationDetailResponse.data?.data ?? null;
            quotationDetailsList =
              quotationInfoData?.Details ??
              quotationInfoData?.details ??
              [];
          } catch (quotationErr) {
            console.warn('Không thể lấy chi tiết báo giá để bổ sung dữ liệu đơn hàng', quotationErr);
          }
        }

        const mergedDetails = processedDetails.map((detail, index) => {
          const matchedQuotationDetail = quotationDetailsList[index] ?? null;
          const parsedQuantity = Number(detail.quantity ?? 0);
          const quantityValue = Number.isFinite(parsedQuantity) ? parsedQuantity : 0;

          let unitName = detail.unitName;
          let taxText = detail.taxText;
          let taxRate = detail.taxRate ?? null;
          let unitPriceBeforeTax = detail.unitPriceBeforeTax;
          let unitPriceAfterTax = detail.unitPriceAfterTax;
          let subtotalBeforeTax = detail.subtotalBeforeTax;
          let subtotalAfterTax = detail.subtotalAfterTax;
          let expiredDisplay = detail.expiredDisplay;

          if (matchedQuotationDetail) {
            const quotationUnit =
              matchedQuotationDetail.Unit ??
              matchedQuotationDetail.unit ??
              matchedQuotationDetail.ProductUnit ??
              matchedQuotationDetail.productUnit ??
              null;
            const quotationTaxText =
              matchedQuotationDetail.TaxText ??
              matchedQuotationDetail.taxText ??
              matchedQuotationDetail.TaxPolicyName ??
              matchedQuotationDetail.taxPolicyName ??
              null;
            const quotationSalesPrice =
              matchedQuotationDetail.SalesPrice ??
              matchedQuotationDetail.salesPrice ??
              matchedQuotationDetail.UnitPrice ??
              matchedQuotationDetail.unitPrice ??
              null;
            const quotationExpired =
              matchedQuotationDetail.ExpiredDate ??
              matchedQuotationDetail.expiredDate ??
              null;

            if (quotationUnit) {
              unitName = quotationUnit;
            }

            if (quotationTaxText) {
              taxText = quotationTaxText;
              const parsedRate = getTaxRateFromText(quotationTaxText);
              if (parsedRate !== null && !Number.isNaN(parsedRate)) {
                taxRate = parsedRate;
              }
            }

            if (quotationSalesPrice !== null && quotationSalesPrice !== undefined) {
              const parsedSalesPrice = Number(quotationSalesPrice);
              if (!Number.isNaN(parsedSalesPrice)) {
                unitPriceBeforeTax = parsedSalesPrice;
                subtotalBeforeTax = quantityValue * parsedSalesPrice;
              }
            }

            if (taxRate !== null && taxRate !== undefined && unitPriceBeforeTax !== null) {
              unitPriceAfterTax = unitPriceBeforeTax * (1 + taxRate);
              subtotalAfterTax = quantityValue * unitPriceAfterTax;
            } else if (unitPriceAfterTax === null || unitPriceAfterTax === undefined) {
              unitPriceAfterTax = detail.unitPriceAfterTax ?? unitPriceBeforeTax;
              subtotalAfterTax =
                subtotalAfterTax ??
                quantityValue * (unitPriceAfterTax !== null && unitPriceAfterTax !== undefined ? unitPriceAfterTax : 0);
            }

            if (quotationExpired && quotationExpired !== '-') {
              expiredDisplay = quotationExpired;
            }
          }

          return {
            ...detail,
            unitName,
            taxText,
            taxRate,
            unitPriceBeforeTax,
            unitPriceAfterTax,
            subtotalBeforeTax,
            subtotalAfterTax,
            expiredDisplay,
          };
        });

        const rawStatus =
          data.status ??
          data.Status ??
          data.salesOrderStatus ??
          data.SalesOrderStatus ??
          data.salesOrderStatusValue ??
          data.SalesOrderStatusValue ??
          null;
        const normalizedStatus = normalizeOrderStatus(rawStatus);

        const rawPaymentStatus =
          data.paymentStatus ??
          data.PaymentStatus ??
          data.paymentStatusValue ??
          data.PaymentStatusValue ??
          data.paymentStatusName ??
          data.PaymentStatusName ??
          null;
        const normalizedPaymentStatus = normalizePaymentStatus(rawPaymentStatus);

        let quotationCodeValue =
          data.salesQuotationCode ??
          data.SalesQuotationCode ??
          data.quotationCode ??
          data.QuotationCode ??
          data.salesQuotation?.QuotationCode ??
          data.salesQuotation?.quotationCode ??
          data.SalesQuotation?.QuotationCode ??
          data.SalesQuotation?.quotationCode ??
          data.salesQuotation?.SalesQuotationCode ??
          data.SalesQuotation?.SalesQuotationCode ??
          null;

        if (!quotationCodeValue && quotationInfoData) {
          quotationCodeValue =
            quotationInfoData.QuotationCode ??
            quotationInfoData.quotationCode ??
            quotationInfoData.SalesQuotationCode ??
            quotationInfoData.salesQuotationCode ??
            null;
        }

        setOrderDetails({
          id: data.id ?? data.salesOrderId ?? data.SalesOrderId ?? orderId,
          code: data.orderCode ?? data.salesOrderCode ?? data.SalesOrderCode ?? '',
          status: normalizedStatus,
          statusName: data.statusName ?? data.StatusName ?? data.salesOrderStatusName ?? null,
          paymentStatus: normalizedPaymentStatus,
          createdAt: data.CreateAt ?? data.createAt ?? data.CreatedAt ?? data.createdAt ?? data.createdDate ?? data.CreatedDate ?? null,
          expiredDate: data.orderExpiredDate ?? data.OrderExpiredDate ?? data.salesOrderExpiredDate ?? data.SalesOrderExpiredDate ?? data.expiredDate ?? data.ExpiredDate ?? null,
          depositExpiredDate,
          totalAmount: totalAmount,
          depositPercent: depositPercent,
          depositDueDays,
          paidAmount: paidAmount,
          depositAmount: depositAmount,
          remainingDeposit: remainingDeposit,
          quotationCode: quotationCodeValue,
          details: mergedDetails,
        });
      } else {
        setOrderDetails(null);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải chi tiết đơn hàng.';
      setDetailError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setOrderDetails(null);
    setDetailError(null);
  };

  const renderActions = (order) => {
    const status = order.orderStatus ?? order.status;
    const { id } = order;

    // Xác định label trạng thái thanh toán hiện tại cho quyết định hiển thị nút Thanh toán
    const paymentLabelForActions = getPaymentStatusLabelByContext(
      order.paymentStatus,
      status,
      {
        percent: order.depositPercent,
        amount: order.depositAmount,
      },
      order,
    );

    // Chỉ cho phép thanh toán khi:
    // - Đơn đã được chấp thuận (status === 2)
    // - Trạng thái thanh toán là "Chờ cọc" (chỉ khi depositPercent > 0)
    const depositPercentValue = order.depositPercent ?? order.DepositPercent ?? null;
    const depositPercentNum = toNumberOrNull(depositPercentValue);
    const hasDepositRequirement = depositPercentNum !== null && depositPercentNum > 0;
    
    const showPaymentButton =
      status === 2 &&
      paymentLabelForActions === 'Chờ cọc' &&
      hasDepositRequirement;

    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
        {status === 0 && (
          <>
            <Tooltip title="Sửa" placement="bottom" arrow>
              <IconButton
                size="medium"
                onClick={() => handleEdit(id)}
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
                onClick={() => handleDelete(id)}
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
                onClick={() => handleSend(id)}
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
                <SendIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
          </>
        )}
        {showPaymentButton && (
          <Tooltip title="Thanh Toán" placement="bottom" arrow>
            <IconButton
              size="medium"
              onClick={() => handlePayment(id)}
              sx={{
                color: '#2e7d32',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: 'rgba(46, 125, 50, 0.1)',
                },
              }}
            >
              <PaymentIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        )}
        {status === 5 && (
          <Tooltip title="Hoàn Thành" placement="bottom" arrow>
            <IconButton
              size="medium"
              onClick={() => handleComplete(id)}
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
              <CheckCircleIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        )}
        {status === 3 && (
          <Tooltip title="Xem lý do từ chối" placement="bottom" arrow>
            <IconButton
              size="medium"
              onClick={() => handleViewRejectReason(order)}
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
              <InfoOutlinedIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        )}
        {/* Icon xem chi tiết cho tất cả các trạng thái */}
        <Tooltip title="Xem chi tiết" placement="bottom" arrow>
          <IconButton
            size="medium"
            onClick={() => handleView(id)}
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
    );
  };

  const handleViewRejectReason = useCallback((order) => {
    if (!order) return;
    const reason = (order.rejectReason ?? '').toString().trim();
    setSelectedRejectReason(reason);
    setReasonDialogOpen(true);
  }, []);

  const handleCloseRejectReason = () => {
    setReasonDialogOpen(false);
    setSelectedRejectReason('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    const formatted = new Intl.NumberFormat('vi-VN').format(amount).replace(/\./g, ',');
    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5 }}>
        <Box component="span">{formatted}</Box>
        <Box component="span" sx={{ textDecoration: 'underline' }}>đ</Box>
      </Box>
    );
  };

  const normalizeOrderStatus = (statusValue) => {
    if (statusValue === null || statusValue === undefined) return null;
    if (typeof statusValue === 'number') return Number(statusValue);
    if (typeof statusValue === 'string') {
      const statusMap = {
        Draft: 0,
        Send: 1,
        Approved: 2,
        Rejected: 3,
        Delivered: 4,
        Complete: 5,
        NotComplete: 6,
      };
      if (statusValue in statusMap) {
        return statusMap[statusValue];
      }
      const parsed = Number(statusValue);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  const normalizePaymentStatus = (statusValue) => {
    if (statusValue === null || statusValue === undefined) return null;
    if (typeof statusValue === 'number') return Number(statusValue);
    if (typeof statusValue === 'string') {
      const paymentMap = {
        Pending: 0,
        Deposited: 1,
        Paid: 2,
        Success: 3,
        Failed: 4,
        Refunded: 5,
      };
      if (statusValue in paymentMap) {
        return paymentMap[statusValue];
      }
      const parsed = Number(statusValue);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  const getDepositAmountValue = (data) => {
    if (!data) return null;
    const totalAmountValue = toNumberOrNull(data.totalAmount ?? data.TotalAmount ?? null);
    const depositPercentValue = toNumberOrNull(data.depositPercent ?? data.DepositPercent ?? null);

    if (
      totalAmountValue !== null &&
      depositPercentValue !== null &&
      !Number.isNaN(totalAmountValue) &&
      !Number.isNaN(depositPercentValue)
    ) {
      return Math.round(totalAmountValue * (depositPercentValue / 100));
    }

    if (data.depositAmount !== undefined && data.depositAmount !== null) {
      return data.depositAmount;
    }

    if (data.remainingDeposit !== undefined && data.remainingDeposit !== null) {
      return data.remainingDeposit;
    }

    return null;
  };

  const getAmountAfterDeposit = (data) => {
    if (!data) return null;
    const totalAmountValue = toNumberOrNull(
      data.totalAmount ?? data.TotalAmount ?? data.totalPrice ?? data.TotalPrice ?? data.grandTotal ?? null,
    );
    if (totalAmountValue === null || Number.isNaN(totalAmountValue)) {
      return null;
    }
    const depositAmountValue = toNumberOrNull(getDepositAmountValue(data)) ?? 0;
    const amountAfterDeposit = totalAmountValue - depositAmountValue;
    return Math.max(amountAfterDeposit, 0);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Title */}
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          className="customer-order-list-title"
          sx={{
            fontWeight: 'bold',
            color: '#155E64',
            mb: 2,
          }}
        >
          Danh sách đơn hàng        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter */}
      <Box className="customer-order-filter-container" sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="order-status-filter-label">Lọc theo trạng thái đơn hàng</InputLabel>
          <Select
            labelId="order-status-filter-label"
            value={orderStatusFilter}
            label="Lọc theo trạng thái đơn hàng"
            onChange={(e) => setOrderStatusFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="0">Nháp</MenuItem>
            <MenuItem value="1">Đã Gửi</MenuItem>
            <MenuItem value="2">Chấp Thuận</MenuItem>
            <MenuItem value="3">Từ Chối</MenuItem>
            <MenuItem value="4">Giao Hàng 1 Phần</MenuItem>
            <MenuItem value="5">Giao Toàn Bộ Hàng</MenuItem>
            <MenuItem value="6">Hoàn Thành</MenuItem>
            <MenuItem value="7">Chưa Hoàn Thành</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="payment-status-filter-label">Lọc theo trạng thái thanh toán</InputLabel>
          <Select
            labelId="payment-status-filter-label"
            value={paymentStatusFilter}
            label="Lọc theo trạng thái thanh toán"
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="waiting_deposit">Chờ Cọc</MenuItem>
            <MenuItem value="0">Chờ Thanh Toán</MenuItem>
            <MenuItem value="1">Đã Cọc</MenuItem>
            <MenuItem value="2">Đã Thanh Toán 1 Phần</MenuItem>
            <MenuItem value="3">Đã Thanh Toán Toàn Bộ</MenuItem>
            <MenuItem value="4">Thất Bại</MenuItem>
            <MenuItem value="5">Trả Lại Tiền</MenuItem>
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
        <div className="customer-order-list-container">
          <TableContainer 
            component={Paper} 
            sx={{ 
              boxShadow: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 2,
              overflowX: 'auto',
            }}
          >
            <Table className="customer-order-list-table" sx={{ tableLayout: 'fixed', minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell
                  sx={{
                    width: '7%',
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
                <TableCell sx={{ width: '25%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'quotationCode'}
                    direction={sortConfig.key === 'quotationCode' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('quotationCode')}
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
                    Thời gian tạo
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '15%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'orderStatus'}
                    direction={sortConfig.key === 'orderStatus' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('orderStatus')}
                    sx={headerTextSx}
                  >
                    <Box component="span" sx={{ display: 'block', lineHeight: 1.2 }}>
                      <Box component="span" sx={{ display: 'block' }}>Trạng thái</Box>
                      <Box component="span" sx={{ display: 'block' }}>đơn hàng</Box>
                    </Box>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '15%', py: 1.5, px: 2 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'paymentStatus'}
                    direction={sortConfig.key === 'paymentStatus' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('paymentStatus')}
                    sx={headerTextSx}
                  >
                    <Box component="span" sx={{ display: 'block', lineHeight: 1.2 }}>
                      <Box component="span" sx={{ display: 'block' }}>Trạng thái</Box>
                      <Box component="span" sx={{ display: 'block' }}>thanh toán</Box>
                    </Box>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '15%', py: 1, px: 0, textAlign: 'right' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'paidAmount'}
                    direction={sortConfig.key === 'paidAmount' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('paidAmount')}
                    sx={headerTextSx}
                  >
                    Tiền đã trả
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '18%', py: 1.5, px: 2, whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'totalAmount'}
                    direction={sortConfig.key === 'totalAmount' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('totalAmount')}
                    sx={headerTextSx}
                  >
                    Tổng tiền đơn hàng
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: '20%', textAlign: 'right', py: 1.5, px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    <span style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.03em' }}>
                      Hành động
                    </span>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có đơn hàng nào.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order, index) => (
                  <TableRow
                    key={order.id || index}
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
                    <TableCell sx={{ fontWeight: 500, textAlign: 'left' }}>
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{order.quotationCode || order.quotationId || '-'}</TableCell>
                    <TableCell>{formatDate(order.createdAt || order.createAt || order.createdDate)}</TableCell>
                    <TableCell>
                      {order.orderStatus !== undefined && order.orderStatus !== null ? (() => {
                        const effectiveStatus = getEffectiveOrderStatus(order.orderStatus, order.paymentStatus, order);
                        return (
                          <Chip
                            label={getOrderStatusLabel(effectiveStatus, false)}
                            size="small"
                            sx={getOrderStatusColor(effectiveStatus)}
                          />
                        );
                      })() : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Hiển thị "-" nếu trạng thái đơn hàng là Nháp (0), Đã gửi (1), hoặc Từ chối (3) */}
                      {order.orderStatus === 0 || order.orderStatus === 1 || order.orderStatus === 3 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>-</Typography>
                      ) : order.paymentStatus !== undefined && order.paymentStatus !== null ? (
                        <Tooltip
                          title={getPaymentStatusLabelByContext(order.paymentStatus, order.orderStatus, {
                            percent: order.depositPercent,
                            amount: order.depositAmount,
                          }, order, false)}
                          arrow
                        >
                          <Chip
                            label={getPaymentStatusLabelByContext(order.paymentStatus, order.orderStatus, {
                              percent: order.depositPercent,
                              amount: order.depositAmount,
                            }, order, true)}
                            size="small"
                            sx={getPaymentStatusColor(order.paymentStatus)}
                          />
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell sx={{ width: '15%', textAlign: 'right', pr: 4 }}>{formatCurrency(order.paidAmount)}</TableCell>
                    <TableCell sx={{ textAlign: 'right', pr: 4 }}>{formatCurrency(order.totalAmount || order.grandTotal)}</TableCell>
                    <TableCell sx={{ textAlign: 'right', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                      {renderActions(order)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {orders.length > 0 && (
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
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog
        className="customer-order-detail-dialog"
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle className="customer-order-detail-dialog-title">
          <Typography variant="h6" component="div">
            Chi tiết đơn hàng
          </Typography>
        </DialogTitle>
        <DialogContent className="customer-order-detail-dialog-content">
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : detailError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {detailError}
            </Alert>
          ) : orderDetails ? (
            <Box>
              {/* Thông tin đơn hàng - Layout 3 cột */}
              <Box className="customer-order-detail-info-layout" sx={{ mb: 3, display: 'flex', gap: 4 }}>
                {/* Phần 1 - Bên trái: Mã đơn hàng, Mã báo giá, Trạng thái đơn hàng, Trạng thái thanh toán */}
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
                      Mã báo giá:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {detailQuotationCode}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trạng thái đơn hàng:
                    </Typography>
                    {detailOrderStatus !== null ? (() => {
                      const effectiveStatus = getEffectiveOrderStatus(
                        detailOrderStatus,
                        detailPaymentStatus,
                        orderDetails
                      );
                      return (
                        <Chip
                          label={orderDetails.statusName || getStatusLabel(effectiveStatus)}
                          sx={getOrderStatusColor(effectiveStatus)}
                          size="small"
                        />
                      );
                    })() : (
                      <Typography variant="body1">-</Typography>
                    )}
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trạng thái thanh toán:
                    </Typography>
                    {(() => {
                      if (!orderDetails) return <Typography variant="body1">-</Typography>;
                      
                      // Tính toán payment status để hiển thị dựa trên order status và số tiền (giống màn list)
                      const totalAmountValue = toNumberOrNull(
                        orderDetails.totalAmount ??
                        orderDetails.TotalAmount ??
                        orderDetails.totalPrice ??
                        orderDetails.TotalPrice ??
                        0
                      ) ?? 0;
                      
                      const paidAmountValue = toNumberOrNull(
                        orderDetails.paidAmount ??
                        orderDetails.PaidAmount ??
                        0
                      ) ?? 0;
                      
                      // Tính effective order status (có thể bị override bởi payment status)
                      const effectiveOrderStatus = getEffectiveOrderStatus(
                        detailOrderStatus,
                        detailPaymentStatus,
                        orderDetails
                      );
                      
                      // Nếu đã thanh toán đủ tổng tiền, payment status = 3 (Paid)
                      let paymentStatusForDisplay = detailPaymentStatus !== null && detailPaymentStatus !== undefined
                        ? detailPaymentStatus
                        : 0;
                      
                      if (totalAmountValue > 0 && paidAmountValue >= totalAmountValue) {
                        paymentStatusForDisplay = 3; // Paid
                      } else if (effectiveOrderStatus === 4) {
                        // Nếu trạng thái đơn hàng là "Giao hàng 1 phần" → trạng thái thanh toán là "Đã thanh toán 1 phần"
                        paymentStatusForDisplay = 2; // PartiallyPaid
                      } else if (totalAmountValue > 0 && paidAmountValue > 0 && paidAmountValue < totalAmountValue) {
                        // Nếu đã thanh toán một phần
                        const depositAmountValue = toNumberOrNull(
                          orderDetails.depositAmount ??
                          orderDetails.DepositAmount ??
                          0
                        ) ?? 0;
                        // Nếu đã cọc đủ hoặc hơn số tiền cọc yêu cầu
                        if (depositAmountValue > 0 && paidAmountValue >= depositAmountValue) {
                          paymentStatusForDisplay = 1; // Deposited
                        } else {
                          paymentStatusForDisplay = 2; // PartiallyPaid
                        }
                      }
                      
                      // Truyền effectiveOrderStatus vào để getPaymentStatusLabelByContext có thể kiểm tra
                      const paymentLabel = getPaymentStatusLabelByContext(
                        paymentStatusForDisplay,
                        effectiveOrderStatus, // Truyền effectiveOrderStatus thay vì detailOrderStatus
                        {
                          percent: orderDetails.depositPercent,
                          amount: orderDetails.depositAmount,
                        },
                        orderDetails,
                        false
                      );
                      
                      return paymentLabel ? (
                        <Chip
                          label={paymentLabel}
                          sx={getPaymentStatusColor(paymentStatusForDisplay)}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body1">-</Typography>
                      );
                    })()}
                  </Box>
                </Box>
                
                {/* Phần 2 - Ở giữa: Thời gian tạo, Ngày hết hạn đơn hàng, Cọc, Thời hạn hết hạn cọc */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Thời gian tạo:
                    </Typography>
                    <Typography variant="body1">
                      {orderDetails.createdAt ? formatDate(orderDetails.createdAt) : '-'}
                    </Typography>
                  </Box>
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
                      {orderDetails.depositPercent !== undefined && orderDetails.depositPercent !== null
                        ? `${orderDetails.depositPercent}%`
                        : '-'}
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
                
                {/* Phần 3 - Bên phải: Số tiền đã trả, Số tiền cần cọc, Số tiền sau cọc */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số tiền đã trả:
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(orderDetails.paidAmount)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số tiền cần cọc:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(getDepositAmountValue(orderDetails))}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số tiền sau cọc:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(getAmountAfterDeposit(orderDetails))}
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
                        <TableCell sx={{ textAlign: 'center', backgroundColor: '#f5f5f5', minWidth: '90px', whiteSpace: 'nowrap' }}>Đơn vị</TableCell>
                        <TableCell sx={{ textAlign: 'center', backgroundColor: '#f5f5f5', minWidth: '120px', whiteSpace: 'nowrap' }}>Ngày hết hạn</TableCell>
                        <TableCell sx={{ textAlign: 'center', backgroundColor: '#f5f5f5', minWidth: '80px', whiteSpace: 'nowrap' }}>Số lượng</TableCell>
                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5', minWidth: '120px', whiteSpace: 'nowrap' }}>Đơn giá trước thuế</TableCell>
                        <TableCell sx={{ textAlign: 'center', backgroundColor: '#f5f5f5', minWidth: '120px', whiteSpace: 'nowrap' }}>Thuế</TableCell>
                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5', minWidth: '120px', whiteSpace: 'nowrap' }}>Đơn giá sau thuế</TableCell>
                        <TableCell sx={{ textAlign: 'right', backgroundColor: '#f5f5f5', minWidth: '140px', whiteSpace: 'nowrap' }}>Thành tiền trước thuế</TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5f5f5', minWidth: '160px', whiteSpace: 'nowrap', pr: 2, textAlign: 'right' }}>
                          <Box component="div" sx={{ textAlign: 'right', width: '100%', display: 'block' }}>
                            Thành tiền sau thuế
                          </Box>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(orderDetails.details) && orderDetails.details.length > 0 ? (
                        orderDetails.details.map((detail, index) => {
                          const quantity = detail.quantity ?? 0;
                          const unitName = detail.unitName ?? '-';
                          const expiredDisplay =
                            detail.expiredDisplay ??
                            (detail.expiredDate ? formatDate(detail.expiredDate) : '-');
                          const unitPriceBeforeTax =
                            detail.unitPriceBeforeTax ??
                            detail.unitPrice ??
                            detail.UnitPrice ??
                            detail.UnitPriceBeforeTax ??
                            0;
                          const unitPriceAfterTax =
                            detail.unitPriceAfterTax ??
                            detail.UnitPriceAfterTax ??
                            unitPriceBeforeTax;
                          const subtotalBeforeTax =
                            detail.subtotalBeforeTax ??
                            detail.subtotal ??
                            detail.Subtotal ??
                            quantity * unitPriceBeforeTax;
                          const subtotalAfterTax =
                            detail.subtotalAfterTax ??
                            detail.SubtotalAfterTax ??
                            quantity * unitPriceAfterTax;
                          const taxText =
                            detail.taxText ??
                            detail.TaxText ??
                            detail.taxPolicyName ??
                            detail.TaxPolicyName ??
                            '-';
                          
                          return (
                            <TableRow key={detail.id ?? detail.productId ?? index}>
                              <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                              <TableCell>{detail.productName ?? detail.ProductName ?? '-'}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{unitName}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{expiredDisplay}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{quantity}</TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(unitPriceBeforeTax)}</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>{taxText}</TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(unitPriceAfterTax)}</TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(subtotalBeforeTax)}</TableCell>
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
                          <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
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
                  {(() => {
                    const totalBeforeTax = orderDetails.details.reduce((sum, detail) => {
                      const subtotalBeforeTax =
                        detail.subtotalBeforeTax ??
                        detail.subtotal ??
                        detail.Subtotal ??
                        0;
                      return sum + subtotalBeforeTax;
                    }, 0);
                    const totalAfterTax = orderDetails.details.reduce((sum, detail) => {
                      const subtotalAfterTax =
                        detail.subtotalAfterTax ??
                        detail.SubtotalAfterTax ??
                        0;
                      return sum + subtotalAfterTax;
                    }, 0);
                    const totalTax = totalAfterTax - totalBeforeTax;

                    return (
                      <>
                        <Typography variant="body1" sx={{ mb: 0.5 }}>
                          Tổng tiền trước thuế: {formatCurrency(totalBeforeTax)}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 0.5 }}>
                          Thuế: {formatCurrency(totalTax)}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Tổng tiền sau thuế: {formatCurrency(totalAfterTax)}
                        </Typography>
                      </>
                    );
                  })()}
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="info">Không tìm thấy thông tin đơn hàng.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        className="customer-order-payment-dialog"
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="customer-order-payment-dialog-title" sx={{ textAlign: 'left', fontWeight: 600, fontSize: '1.25rem' }}>
          Thanh Toán Tiền Cọc Đơn Hàng
        </DialogTitle>
        <DialogContent className="customer-order-payment-dialog-content">
          {paymentLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : paymentOrderDetails ? (
            <Box>
              {/* Thông tin đơn hàng - Layout 2 cột */}
              <Box className="customer-order-payment-info-layout" sx={{ display: 'flex', gap: 4 }}>
                {/* Cột trái */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã đơn hàng:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {paymentOrderDetails.code || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trạng thái thanh toán:
                    </Typography>
                    {paymentOrderDetails.paymentStatus !== undefined && paymentOrderDetails.paymentStatus !== null ? (
                      <Chip
                        label={getPaymentStatusLabelByContext(
                          paymentOrderDetails.paymentStatus,
                          paymentOrderDetails.status ?? paymentOrderDetails.orderStatus ?? null,
                          {
                            percent: paymentOrderDetails.depositPercent,
                            amount: paymentOrderDetails.depositAmount,
                          },
                          paymentOrderDetails
                        )}
                        size="small"
                        sx={{ ...getPaymentStatusColor(paymentOrderDetails.paymentStatus), fontWeight: 500 }}
                      />
                    ) : (
                      <Typography variant="body1">-</Typography>
                    )}
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tổng Trị Giá Đơn Hàng:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(paymentOrderDetails.totalAmount)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày hết hạn đơn hàng:
                    </Typography>
                    <Typography variant="body1">
                      {paymentOrderDetails.expiredDate ? formatDate(paymentOrderDetails.expiredDate) : '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày hết hạn cọc:
                    </Typography>
                    <Typography variant="body1">
                      {paymentOrderDetails.depositExpiredDate
                        ? formatDate(paymentOrderDetails.depositExpiredDate)
                        : '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Cọc (% đơn hàng):
                    </Typography>
                    <Typography variant="body1">
                      {paymentOrderDetails.depositPercent !== undefined && paymentOrderDetails.depositPercent !== null
                        ? `${paymentOrderDetails.depositPercent}%`
                        : '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số Tiền Cần Cọc:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(getDepositAmountValue(paymentOrderDetails))}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Cột phải */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
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

                  <Box sx={{ minHeight: 320, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                                {formatCurrency(vnPayInitData?.amount ?? paymentOrderDetails.remainingDeposit)}
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
                            <strong>{formatCurrency(paymentOrderDetails.remainingDeposit)}</strong> đến tài khoản của chúng tôi.
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
                            Số tiền cần thanh toán: <strong>{formatCurrency(paymentOrderDetails.remainingDeposit)}</strong>
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
            <Alert severity="error">Không thể tải thông tin đơn hàng.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPaymentDialogOpen(false)} disabled={redirectingPayment}>
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
                ? 'Thanh toán VNPay' 
                : selectedPaymentMethod === 'transfer'
                  ? 'Xác nhận Chuyển khoản'
                  : 'Xác nhận Tiền mặt'}
          </Button>
        </DialogActions>
      </Dialog>



      <Dialog
        className="customer-order-reject-reason-dialog"
        open={reasonDialogOpen}
        onClose={handleCloseRejectReason}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="customer-order-reject-reason-dialog-title">Lý do từ chối đơn hàng</DialogTitle>
        <DialogContent className="customer-order-reject-reason-dialog-content" dividers>
          {selectedRejectReason ? (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {selectedRejectReason}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Đơn hàng này không có lý do từ chối.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectReason}>Đóng</Button>
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

export default CustomerOrderList;

