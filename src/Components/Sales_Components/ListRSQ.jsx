// File: ListRSQ.jsx - Danh sách yêu cầu báo giá
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  TableSortLabel,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import RequestQuote from "@mui/icons-material/RequestQuote";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import VisibilityIcon from "@mui/icons-material/Visibility";
import requestSalesQuotationAPI from "../../API/requestSalesQuotationAPI";
import salesQuotationAPI from "../../API/salesQuotationAPI";
import { extractErrorMessage } from "../../Utils/errorHandler";

const headerTextSx = {
  textTransform: "capitalize",
  fontWeight: 600,
  letterSpacing: "0.03em",
};

const ListRSQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [allQuotations, setAllQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "sentDate",
    direction: "desc",
  }); // Mặc định sort theo ngày gửi từ mới nhất đến cũ nhất
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchRequestCode, setSearchRequestCode] = useState("");
  const [searchCustomerName, setSearchCustomerName] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [createQuotationDialogOpen, setCreateQuotationDialogOpen] =
    useState(false);
  const [quotationFormData, setQuotationFormData] = useState(null);
  const [quotationRows, setQuotationRows] = useState([]);
  const [initialQuotationRows, setInitialQuotationRows] = useState([]);
  const [quotationForm, setQuotationForm] = useState({
    expiredDate: "",
    depositPercent: 0,
    depositDueDays: "", // để trống khi mở form
    expectedDeliveryDate: "",
    noteId: 1,
  });
  const [quotationLoading, setQuotationLoading] = useState(false);
  const [quotationError, setQuotationError] = useState(null);
  const [quotationAction, setQuotationAction] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Map status enum
  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return "Nháp";
      case 1:
        return "Chưa báo giá";
      case 2:
        return "Đã báo giá";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return { backgroundColor: "#fff3cd", color: "#856404" }; // Draft - Yellow
      case 1:
        return { backgroundColor: "#f8d7da", color: "#721c24" }; // Chưa báo giá - Red
      case 2:
        return { backgroundColor: "#d4edda", color: "#155724" }; // Đã báo giá - Green
      default:
        return { backgroundColor: "#e3f2fd", color: "#1976d2" };
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "-";
    // Convert to number
    const numValue = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(numValue)) return "-";
    // Round to integer (Vietnamese currency doesn't use decimals)
    const intValue = Math.round(numValue);
    // Format with comma as thousand separator
    return intValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const renderCurrency = (value) => {
    if (value === null || value === undefined) return "-";
    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: 0.25,
        }}
      >
        <Typography component="span" sx={{ fontWeight: 500 }}>
          {formatCurrency(value)}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontSize: "0.75em",
            lineHeight: 1,
            textDecoration: "underline",
            textDecorationThickness: "1px",
            textUnderlineOffset: "1px",
          }}
        >
          đ
        </Typography>
      </Box>
    );
  };

  const getTaxRateValue = (tax) => {
    if (!tax) return 0;
    const raw =
      tax.rate ??
      tax.Rate ??
      tax.value ??
      tax.Value ??
      tax.percentage ??
      tax.Percentage ??
      tax.percent ??
      tax.Percent ??
      null;
    if (raw !== null && raw !== undefined) {
      const num = Number(String(raw).replace(",", "."));
      if (!Number.isNaN(num)) {
        return num > 1 ? num / 100 : num;
      }
    }
    const name = tax.name || tax.Name || "";
    const matched = name.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (matched && matched[1]) {
      const parsed = Number(matched[1].replace(",", "."));
      if (!Number.isNaN(parsed)) {
        return parsed / 100;
      }
    }
    return 0;
  };


  const calculateTotals = (minQuantity, unitPrice, taxRate = 0) => {
    const qty = Math.max(1, Number(minQuantity) || 1);
    const price = Number(unitPrice) || 0;
    const rateRaw = Number(taxRate) || 0;
    const rate = rateRaw > 1 ? rateRaw / 100 : rateRaw;
    const beforeTax = qty * price;
    const afterTax = beforeTax * rate + beforeTax;
    return { beforeTax, afterTax };
  };

  const getDefaultTaxInfo = (taxes) => {
    if (!Array.isArray(taxes) || taxes.length === 0) {
      return { id: null, rate: 0 };
    }
    const lowerIncludes = (name, keyword) =>
      typeof name === "string" && name.toLowerCase().includes(keyword);
    const noTax =
      taxes.find((tax) => lowerIncludes(tax.name || tax.Name, "không chịu")) ||
      taxes.find((tax) => getTaxRateValue(tax) === 0);
    const fallbackTax = noTax || taxes[0];
    return {
      id: fallbackTax.id || fallbackTax.Id || null,
      rate: getTaxRateValue(fallbackTax),
    };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

  // Format date range (khoảng ngày)
  const formatDateRange = (dateRange) => {
    if (!dateRange || !dateRange.minDate || !dateRange.maxDate) return null;
    try {
      const minDate = new Date(dateRange.minDate);
      const maxDate = new Date(dateRange.maxDate);
      if (Number.isNaN(minDate.getTime()) || Number.isNaN(maxDate.getTime()))
        return null;

      const minFormatted = minDate.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const maxFormatted = maxDate.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      
      return `Từ ${minFormatted} đến ${maxFormatted}`;
    } catch (error) {
      return null;
    }
  };

  const resolveCustomerName = (source) => {
    if (!source) return "-";

    const candidates = [
      source.CustomerName ?? source.customerName,
      source.CreatedByUserName ?? source.createdByUserName,
      source.CreatedByUsername ?? source.createdByUsername,
      source.CustomerUserName ?? source.customerUserName,
      source.CustomerUsername ?? source.customerUsername,
      source.CreatedBy ?? source.createdBy ?? source.CreateBy,
    ];

    for (const candidate of candidates) {
      if (candidate && String(candidate).trim() !== "") {
        return candidate;
      }
    }

    const profileCandidates = [
      source.CustomerProfile?.User?.FullName,
      source.CustomerProfile?.User?.fullName,
      source.customerProfile?.user?.FullName,
      source.customerProfile?.user?.fullName,
    ];

    for (const profile of profileCandidates) {
      if (profile && String(profile).trim() !== "") {
        return profile;
      }
    }

    return "-";
  };

  // Fetch data from API
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestsResult, quotationsResult] = await Promise.allSettled([
        requestSalesQuotationAPI.viewList(),
        salesQuotationAPI.viewList(),
      ]);

      if (requestsResult.status !== "fulfilled") {
        throw requestsResult.reason;
      }

      const requestResponse = requestsResult.value;
      const requestData = Array.isArray(requestResponse.data?.data)
        ? requestResponse.data.data
        : [];

      const quotationsData =
        quotationsResult.status === "fulfilled" &&
        Array.isArray(quotationsResult.value.data?.data)
          ? quotationsResult.value.data.data
          : [];

      // Lưu tất cả báo giá để dùng trong dialog chi tiết
      setAllQuotations(quotationsData);

      if (quotationsResult.status === "rejected") {
        console.error(
          "Không thể tải danh sách báo giá để lấy ngày báo giá",
          quotationsResult.reason
        );
      }

      // Map để lưu tất cả các báo giá cho mỗi requestCode
      const quotationInfoMap = quotationsData.reduce((acc, quotation) => {
        const requestCode =
          quotation.RequestCode || quotation.requestCode || null;
        const quotationDate =
          quotation.QuotationDate || quotation.quotationDate || null;
        const quotationCode =
          quotation.QuotationCode || quotation.quotationCode || null;
        const quotationId = quotation.Id || quotation.id || null;
        if (!requestCode) {
          return acc;
        }
        
        if (!acc[requestCode]) {
          acc[requestCode] = {
            quotations: [],
            quotationDate: null, // Ngày mới nhất (để tương thích với code cũ)
            quotationCode: null, // Code mới nhất
            quotationId: null, // ID mới nhất
            time: 0,
          };
        }
        
        const incomingTime = quotationDate ? Date.parse(quotationDate) : 0;
        const existing = acc[requestCode];
        
        // Thêm báo giá vào danh sách
        existing.quotations.push({
          quotationDate,
          quotationCode,
          quotationId,
          time: Number.isNaN(incomingTime) ? 0 : incomingTime,
        });
        
        // Cập nhật báo giá mới nhất (để tương thích với code cũ)
        if (
          (incomingTime && (!existing.time || incomingTime > existing.time)) ||
          (!incomingTime && !existing.time)
        ) {
          existing.quotationDate = quotationDate || null;
          existing.quotationCode = quotationCode || null;
          existing.quotationId = quotationId || null;
          existing.time = Number.isNaN(incomingTime) ? 0 : incomingTime;
        }

        return acc;
      }, {});

        // Chỉ giữ các yêu cầu đã gửi từ customer (status != 0) và có trạng thái hợp lệ
      const filteredData = requestData.filter((item) => {
          const status = item.Status !== undefined ? item.Status : item.status;
          return status !== undefined && status !== null && status !== 0;
        });

        const mappedData = filteredData.map((item) => {
          const status = item.Status !== undefined ? item.Status : item.status;
          const requestDate = item.RequestDate || item.requestDate || null;
          const createdDate = item.CreatedDate || item.createdDate || requestDate;
        const requestCode = item.RequestCode || item.requestCode || "";
        const customerName = resolveCustomerName(item);
        const quotationInfo = requestCode
          ? quotationInfoMap[requestCode]
          : null;
        
        // Tính toán ngày báo giá hiển thị
        let quotationDate = null;
        let quotationDateRange = null; // Khoảng ngày nếu có nhiều báo giá với ngày khác nhau
        
        if (
          quotationInfo &&
          quotationInfo.quotations &&
          quotationInfo.quotations.length > 0
        ) {
          // Lọc các báo giá có ngày hợp lệ
          const validQuotations = quotationInfo.quotations.filter(
            (q) => q.quotationDate
          );
          
          if (validQuotations.length > 0) {
            // Sắp xếp theo ngày
            validQuotations.sort((a, b) => a.time - b.time);
            
            const minDate = validQuotations[0].quotationDate;
            const maxDate =
              validQuotations[validQuotations.length - 1].quotationDate;
            
            // So sánh ngày (chỉ so sánh phần ngày, không so sánh giờ)
            const minDateObj = new Date(minDate);
            const maxDateObj = new Date(maxDate);
            const minDateOnly = new Date(
              minDateObj.getFullYear(),
              minDateObj.getMonth(),
              minDateObj.getDate()
            );
            const maxDateOnly = new Date(
              maxDateObj.getFullYear(),
              maxDateObj.getMonth(),
              maxDateObj.getDate()
            );
            const isSameDate = minDateOnly.getTime() === maxDateOnly.getTime();
            
            // Nếu tất cả cùng ngày hoặc chỉ có 1 báo giá
            if (isSameDate || validQuotations.length === 1) {
              quotationDate = maxDate;
            } else {
              // Có nhiều báo giá với ngày khác nhau
              quotationDate = maxDate; // Vẫn lưu ngày mới nhất để tương thích
              quotationDateRange = { minDate, maxDate };
            }
          } else {
            // Không có báo giá nào có ngày hợp lệ, dùng ngày mới nhất (có thể null)
            quotationDate = quotationInfo.quotationDate || null;
          }
        } else {
          // Không có báo giá, dùng ngày từ quotationInfo (tương thích với code cũ)
          quotationDate = quotationInfo?.quotationDate || null;
        }
        
        const quotationCode = quotationInfo?.quotationCode || null;
        const quotationId = quotationInfo?.quotationId || null;

          return {
            id: item.Id || item.id,
          code: requestCode,
          customerName,
            createdDate,
            sentDate: status === 1 || status === 2 ? requestDate : null,
          quotationDate,
          quotationDateRange, // Thêm khoảng ngày
          quotationId,
          quotationCode,
            status,
          };
        });

        setRequests(mappedData);
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Không thể tải danh sách yêu cầu báo giá"
      );
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Auto-open request details dialog from notification
  useEffect(() => {
    const rsqId = location.state?.openRsqId;
    console.log(
      "ListRSQ - useEffect triggered, location.state:",
      location.state
    );
    console.log("ListRSQ - rsqId:", rsqId);
    
    if (rsqId) {
      const normalizedRsqId = Number(rsqId);
      console.log("ListRSQ - Normalized rsqId:", normalizedRsqId);
      
      if (isNaN(normalizedRsqId)) {
        console.error("ListRSQ - Invalid rsqId:", rsqId);
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }
      
      // Clear state ngay lập tức để tránh re-trigger
      navigate(location.pathname, { replace: true, state: {} });
      
      // Mở dialog chi tiết
      const openRequestDetailsDialog = async () => {
        try {
          console.log(
            "ListRSQ - Fetching request details for rsqId:",
            normalizedRsqId
          );
          const response = await requestSalesQuotationAPI.viewDetails(
            normalizedRsqId
          );
          console.log("ListRSQ - Request details response:", response);
          
          if (response?.data?.data) {
            console.log("ListRSQ - Setting request details and opening dialog");
            setSelectedRequestDetails(response.data.data);
            setDetailDialogOpen(true);
          } else {
            console.warn("ListRSQ - No data in response");
            setSnackbarMessage("Không thể tải chi tiết yêu cầu báo giá");
            setSnackbarOpen(true);
          }
        } catch (err) {
          console.error(
            "ListRSQ - Error opening request details dialog from notification:",
            err
          );
          const errorMessage =
            err.response?.data?.message ||
            "Không thể mở chi tiết yêu cầu báo giá";
          setSnackbarMessage(errorMessage);
          setSnackbarOpen(true);
        }
      };
      
      // Đợi một chút để đảm bảo component đã render xong
      setTimeout(() => {
        openRequestDetailsDialog();
      }, 500);
    }
  }, [location.state, navigate]);

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === "asc";
    setSortConfig({ key, direction: isAsc ? "desc" : "asc" });
  };

  const handleViewDetails = (id) => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await requestSalesQuotationAPI.viewDetails(id);
        if (response.data && response.data.data) {
          // Debug: Kiểm tra response có CustomerName không
          console.log("Detail response:", response.data.data);
          console.log(
            "CustomerName in detail:",
            response.data.data.CustomerName || response.data.data.customerName
          );
          setSelectedRequestDetails(response.data.data);
          setDetailDialogOpen(true);
        }
      } catch (err) {
        const errorMessage = extractErrorMessage(
          err,
          "Không thể tải chi tiết yêu cầu"
        );
        setError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  };

  const handleCreateQuotation = async (id) => {
    const rsqId = Number(id);
    if (!rsqId) {
      setSnackbarMessage("ID yêu cầu báo giá không hợp lệ");
      setSnackbarOpen(true);
      return;
    }

    setGenerateLoading(true);
    setQuotationError(null);
    try {
      const response = await salesQuotationAPI.generateForm(rsqId);
      if (response.data && response.data.data) {
        const formData = response.data.data;
        setQuotationFormData(formData);
        
        // Lấy details từ selectedRequestDetails hoặc từ formData
        const details =
          selectedRequestDetails?.Details ||
          selectedRequestDetails?.details ||
          [];
        const lotProducts = formData.lotProducts || formData.LotProducts || [];
        const taxes = formData.taxes || formData.Taxes || [];
        const notes = formData.notes || formData.Notes || [];
        
        // Set noteId mặc định
        if (notes.length > 0) {
          const firstNote = notes[0];
          setQuotationForm((prev) => ({
            ...prev,
            noteId: firstNote.id || firstNote.Id || 1,
          }));
        }
        
        // Map lot products by productId
        const lotsByProduct = lotProducts.reduce((acc, lot) => {
          const productId = lot.productID || lot.ProductID;
          if (!acc[productId]) {
            acc[productId] = [];
          }
          const lotIdentifier =
            lot.lotCode ||
            lot.LotCode ||
            lot.lotName ||
            lot.LotName ||
            (lot.lotID || lot.LotID ? `Lô ${lot.lotID || lot.LotID}` : "Lô");
          const expiredLabelRaw = lot.expiredDate || lot.ExpiredDate || null;
          const formattedExpired = expiredLabelRaw
            ? formatDate(expiredLabelRaw)
            : null;
          const expiredLabel =
            formattedExpired && formattedExpired !== "-"
              ? formattedExpired
              : null;

          acc[productId].push({
            lotId: lot.lotID || lot.LotID || null,
            salePrice: lot.salePrice || lot.SalePrice || 0,
            expiredDate: lot.expiredDate || lot.ExpiredDate || null,
            lotQuantity: lot.lotQuantity || lot.LotQuantity || 1,
            unit: lot.unit || lot.Unit || "",
            note: lot.note || lot.Note || "",
            // Chỉ hiển thị ngày hết hạn (nếu có), không hiển thị "Lô x"
            displayLabel: expiredLabel || "Không có ngày hết hạn",
            taxRate: 0,
          });
          return acc;
        }, {});

        Object.keys(lotsByProduct).forEach((productId) => {
          lotsByProduct[productId].sort((a, b) => {
            const dateA = a.expiredDate ? new Date(a.expiredDate) : null;
            const dateB = b.expiredDate ? new Date(b.expiredDate) : null;
            if (dateA && dateB) return dateA - dateB;
            if (dateA) return -1;
            if (dateB) return 1;
            return 0;
          });
        });

        Object.keys(lotsByProduct).forEach((productId) => {
          lotsByProduct[productId].push({
            lotId: null,
            salePrice: 0,
            lotQuantity: 0,
            unit: "",
            note: "Hết lô hàng",
            displayLabel: "Hết lô hàng",
            expiredDate: null,
            taxRate: 0,
          });
        });

        const defaultTaxInfo = getDefaultTaxInfo(taxes);
        // Đảm bảo có taxId hợp lệ (nếu không có thì lấy tax đầu tiên)
        const defaultTaxId =
          defaultTaxInfo.id ||
          (taxes.length > 0 ? taxes[0].id || taxes[0].Id || null : null);
        
        // Tạo rows từ details
        const initialRows = details.map((detail, index) => {
          const productId = detail.productId || detail.ProductId;
          const productName = detail.productName || detail.ProductName || "";
          const productLots = lotsByProduct[productId] || [];
          const defaultLot = productLots[0] || null;
          
          // Lấy unit từ lotProducts - tìm lot đầu tiên có unit (không phải lot "Hết lô hàng")
          let productUnit = "-";
          const lotWithUnit = lotProducts.find(
            (lot) =>
              (lot.productID || lot.ProductID) === productId &&
              (lot.unit || lot.Unit) &&
              (lot.unit || lot.Unit).trim() !== ""
          );
          if (lotWithUnit) {
            productUnit = lotWithUnit.unit || lotWithUnit.Unit || "-";
          } else if (
            defaultLot &&
            defaultLot.unit &&
            defaultLot.unit.trim() !== ""
          ) {
            productUnit = defaultLot.unit;
          }
          
          const minQuantity = 1;
          const unitPrice = defaultLot ? defaultLot.salePrice ?? 0 : 0;
          const { beforeTax, afterTax } = calculateTotals(
            minQuantity,
            unitPrice,
            defaultTaxInfo.rate
          );
          
          return {
            id: index + 1,
            productId,
            productName,
            productUnit: productUnit,
            lotId: defaultLot?.lotId || null,
            lotOptions: productLots,
            taxId: defaultTaxId, // Đảm bảo luôn có taxId hợp lệ
            taxOptions: taxes,
            note: "",
            minQuantity,
            unitPrice,
            totalBeforeTax: beforeTax,
            totalAfterTax: afterTax,
            taxRate: defaultTaxInfo.rate,
          };
        });

        setInitialQuotationRows(initialRows);
        setQuotationRows(initialRows);
        setDetailDialogOpen(false);
        setCreateQuotationDialogOpen(true);
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Không thể tạo báo giá từ yêu cầu này"
      );
      setQuotationError(errorMessage);
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleCloseCreateQuotationDialog = () => {
    setCreateQuotationDialogOpen(false);
    setQuotationFormData(null);
    setQuotationRows([]);
    setInitialQuotationRows([]);
    setQuotationForm({
      expiredDate: "",
      depositPercent: 0,
      depositDueDays: "", // reset về trống
      noteId: 1,
    });
    setQuotationError(null);
    setQuotationAction(null);
  };

  const handleDuplicateQuotationRow = (rowId) => {
    setQuotationRows((prevRows) => {
      const targetIndex = prevRows.findIndex((r) => r.id === rowId);
      if (targetIndex === -1) return prevRows;

      const targetRow = prevRows[targetIndex];
      const maxId = prevRows.reduce(
        (max, r) => Math.max(max, r.id || 0),
        0
      );
      const newId = maxId + 1;

      const newRow = {
        ...targetRow,
        id: newId,
        // Giữ nguyên lô hàng và thuế giống dòng gốc
        // Các tổng tiền đã được tính sẵn theo lô & thuế hiện tại
        note: "",
      };

      const newRows = [...prevRows];
      newRows.splice(targetIndex + 1, 0, newRow);
      return newRows;
    });
  };

  const handleRemoveQuotationRow = (rowId) => {
    setQuotationRows((prevRows) =>
      prevRows.filter((row) => row.id !== rowId)
    );
  };

  const handleResetQuotationRows = () => {
    if (!initialQuotationRows || initialQuotationRows.length === 0) return;
    setQuotationRows(initialQuotationRows);
  };

const handleLotChange = (rowId, lotId) => {
    const normalizedLotId = lotId === "NONE" ? null : Number(lotId);
    setQuotationRows(
      quotationRows.map((row) => {
      if (row.id === rowId) {
      if (!normalizedLotId) {
        const defaultTax = getDefaultTaxInfo(row.taxOptions || []);
            const { beforeTax, afterTax } = calculateTotals(
              1,
              0,
              defaultTax.rate || 0
            );
        return {
          ...row,
          lotId: null,
          minQuantity: 1,
          unitPrice: 0,
              productUnit: row.productUnit || "-",
          totalBeforeTax: beforeTax,
          totalAfterTax: afterTax,
          taxId: defaultTax.id,
          taxRate: defaultTax.rate,
        };
      }
          const selectedLot = (row.lotOptions || []).find(
            (lot) => lot.lotId === normalizedLotId
          );
      if (selectedLot) {
        const minQuantity = 1;
        const unitPrice = selectedLot.salePrice ?? 0;
            const { beforeTax, afterTax } = calculateTotals(
              minQuantity,
              unitPrice,
              row.taxRate || 0
            );
        return {
          ...row,
          lotId: normalizedLotId,
          minQuantity,
          unitPrice,
              productUnit: selectedLot.unit || row.productUnit || "-",
          totalBeforeTax: beforeTax,
          totalAfterTax: afterTax,
        };
      }
      return { ...row, lotId: normalizedLotId };
      }
      return row;
      })
    );
  };

const handleDepositPercentChange = (value) => {
    const normalizedInput = (value || "").replace(",", ".");
    if (normalizedInput === "") {
      setQuotationForm((prev) => ({ ...prev, depositPercent: "" }));
    return;
  }

  let parsed = parseFloat(normalizedInput);
  if (isNaN(parsed)) {
      setQuotationForm((prev) => ({ ...prev, depositPercent: "" }));
    return;
  }
  parsed = Math.max(0, Math.min(70, parsed));
    const display = Number.isInteger(parsed)
      ? String(parsed)
      : parsed.toFixed(1).replace(/\.0+$/, "");
    setQuotationForm((prev) => ({ ...prev, depositPercent: display }));
};

  const handleTaxChange = (rowId, taxId) => {
    const normalizedTaxId = taxId ? Number(taxId) : null;
    setQuotationRows(
      quotationRows.map((row) => {
    if (row.id !== rowId) return row;

    if (!normalizedTaxId) {
        const { beforeTax, afterTax } = calculateTotals(1, row.unitPrice, 0);
      return {
        ...row,
        taxId: null,
        taxRate: 0,
        totalBeforeTax: beforeTax,
        totalAfterTax: afterTax,
      };
    }

    const selectedTax = (row.taxOptions || []).find(
          (tax) => (tax.id || tax.Id) === normalizedTaxId
    );
    const taxRate = getTaxRateValue(selectedTax);
        const { beforeTax, afterTax } = calculateTotals(
          1,
          row.unitPrice,
          taxRate
        );
    return {
      ...row,
      taxId: normalizedTaxId,
      taxRate,
      totalBeforeTax: beforeTax,
      totalAfterTax: afterTax,
    };
      })
    );
  };

  const handleSubmitQuotation = async (shouldSend = false) => {
    // Validate expiredDate (bắt buộc)
    if (!quotationForm.expiredDate || quotationForm.expiredDate.trim() === "") {
      const message = "Vui lòng chọn ngày hết hạn báo giá";
      setQuotationError(message);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
      return;
    }

    // Validate thời hạn thanh toán cọc
    if (
      quotationForm.depositDueDays === "" ||
      quotationForm.depositDueDays === null ||
      quotationForm.depositDueDays === undefined
    ) {
      const message = "Vui lòng nhập thời hạn thanh toán cọc (ngày)";
      setQuotationError(message);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
      return;
    }

    // Validate thời hạn giao hàng
    if (
      quotationForm.expectedDeliveryDate === "" ||
      quotationForm.expectedDeliveryDate === null ||
      quotationForm.expectedDeliveryDate === undefined
    ) {
      const message = "Vui lòng nhập thời hạn giao hàng (ngày)";
      setQuotationError(message);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
      return;
    }

    // Nếu không còn dòng sản phẩm nào trong bảng
    if (!quotationRows || quotationRows.length === 0) {
      const message =
        "Vui lòng thêm ít nhất một sản phẩm trước khi tạo / lưu nháp báo giá";
      setQuotationError(message);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
      return;
    }

    // Validate details - phải có ít nhất một sản phẩm với lô và thuế hợp lệ
    const detailPayload = quotationRows
      .filter((row) => {
        // Lọc các row có lotId hợp lệ (không null, undefined, hoặc 'NONE')
        const hasValidLot =
          row.lotId !== null && row.lotId !== undefined && row.lotId !== "NONE";
        // Lọc các row có taxId hợp lệ (phải là số > 0)
        const taxIdNum = Number(row.taxId);
        const hasValidTax = !isNaN(taxIdNum) && taxIdNum > 0;
        return hasValidLot && hasValidTax;
      })
      .map((row) => ({
        productId: row.productId,
        lotId: row.lotId,
        taxId: Number(row.taxId),
        note: row.note || "",
      }));

    // Không cho phép cùng 1 sản phẩm chọn trùng lô hàng
    // và không cho phép cùng 1 sản phẩm có nhiều loại thuế khác nhau
    if (detailPayload.length > 0) {
      const seenLots = new Set();
      let hasDuplicateLot = false;

      const productTaxMap = new Map();
      let hasInconsistentTax = false;

      for (const item of detailPayload) {
        const lotKey = `${item.productId ?? ""}-${item.lotId ?? ""}`;
        if (seenLots.has(lotKey)) {
          hasDuplicateLot = true;
        } else {
          seenLots.add(lotKey);
        }

        const prodKey = item.productId ?? "";
        const taxId = item.taxId ?? 0;
        if (productTaxMap.has(prodKey)) {
          if (productTaxMap.get(prodKey) !== taxId) {
            hasInconsistentTax = true;
          }
        } else {
          productTaxMap.set(prodKey, taxId);
        }

        if (hasDuplicateLot || hasInconsistentTax) break;
      }

      if (hasDuplicateLot) {
        const message =
          "Không được chọn trùng lô hàng cho cùng một sản phẩm. Vui lòng chọn lô khác hoặc xóa bớt dòng trùng.";
        setQuotationError(message);
        setSnackbarMessage(message);
        setSnackbarOpen(true);
        return;
      }

      if (hasInconsistentTax) {
        const message =
          "Mỗi sản phẩm chỉ được phép áp dụng một loại thuế duy nhất. Vui lòng kiểm tra và chọn cùng một loại thuế cho tất cả dòng của sản phẩm đó.";
        setQuotationError(message);
        setSnackbarMessage(message);
        setSnackbarOpen(true);
        return;
      }
    }

    if (detailPayload.length === 0) {
      const message =
        "Không thể tạo / lưu nháp báo giá vì tất cả sản phẩm đều không có lô hàng hoặc không có thuế hợp lệ. Vui lòng kiểm tra lại yêu cầu báo giá.";
      setQuotationError(message);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
      return;
    }

    setQuotationAction(shouldSend ? "send" : "draft");
    setQuotationLoading(true);
    setQuotationError(null);
    try {
      const payload = {
        rsqId: selectedRequestDetails?.Id || selectedRequestDetails?.id,
        noteId: quotationForm.noteId || 1,
        expiredDate: quotationForm.expiredDate,
        depositPercent: Number(quotationForm.depositPercent) || 0,
        depositDueDays: quotationForm.depositDueDays || 1,
        expectedDeliveryDate: quotationForm.expectedDeliveryDate || 1,
        status: shouldSend ? 1 : 0,
        details: detailPayload,
      };
      
      console.log("Submitting quotation payload:", payload);
      
      const response = await salesQuotationAPI.createSalesQuotation(payload);
      const serverMessage =
        response.data?.message ||
        response.data?.Message ||
        response.data?.data?.message ||
        response.data?.data?.Message ||
        null;

      setSnackbarMessage(
        serverMessage ||
          (shouldSend
            ? "Gửi báo giá thành công!"
            : "Lưu nháp báo giá thành công!")
      );
        setSnackbarOpen(true);
        handleCloseCreateQuotationDialog();
        setTimeout(() => {
          fetchRequests();
        }, 500);
    } catch (err) {
      console.error("Submit quotation error:", err.response?.data || err);
      const errorMessage = extractErrorMessage(err, "Không thể xử lý báo giá");
      setQuotationError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setQuotationLoading(false);
      setQuotationAction(null);
    }
  };

  // Filter requests by status and search
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Filter by status
    if (statusFilter !== "all") {
      const filterStatus = parseInt(statusFilter, 10);
      filtered = filtered.filter((request) => request.status === filterStatus);
    }

    // Filter by request code search
    if (searchRequestCode.trim()) {
      const searchTerm = searchRequestCode.trim().toLowerCase();
      filtered = filtered.filter(
        (request) =>
        request.code && request.code.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by customer name search
    if (searchCustomerName.trim()) {
      const searchTerm = searchCustomerName.trim().toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.customerName &&
          request.customerName.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [requests, statusFilter, searchRequestCode, searchCustomerName]);

  const detailMatchedRequest = useMemo(() => {
    if (!selectedRequestDetails) return null;
    const detailId =
      selectedRequestDetails.Id || selectedRequestDetails.id || null;
    if (!detailId) return null;
    return requests.find((request) => request.id === detailId) || null;
  }, [requests, selectedRequestDetails]);

  const detailQuotationDate = useMemo(() => {
    if (!selectedRequestDetails) return null;
    return (
      detailMatchedRequest?.quotationDate ||
      selectedRequestDetails.QuotationDate ||
      selectedRequestDetails.quotationDate ||
      null
    );
  }, [detailMatchedRequest, selectedRequestDetails]);

  // Kiểm tra báo giá có hết hạn không
  const isExpired = (expiredDate) => {
    if (!expiredDate) return false;
    try {
      const expired = new Date(expiredDate);
      expired.setHours(23, 59, 59, 999);
      return expired.getTime() < Date.now();
    } catch (error) {
      return false;
    }
  };

  // Lấy tất cả các báo giá liên quan đến yêu cầu báo giá hiện tại
  const relatedQuotations = useMemo(() => {
    if (!selectedRequestDetails) return [];
    const requestCode =
      selectedRequestDetails.RequestCode ||
      selectedRequestDetails.requestCode ||
      "";
    if (!requestCode) return [];
    
    // Filter tất cả báo giá có RequestCode trùng với request code hiện tại
    return allQuotations
      .filter((quotation) => {
        const qRequestCode =
          quotation.RequestCode || quotation.requestCode || "";
      return qRequestCode === requestCode;
      })
      .map((quotation) => ({
      id: quotation.Id || quotation.id,
        code: quotation.QuotationCode || quotation.quotationCode || "",
      date: quotation.QuotationDate || quotation.quotationDate || null,
      expiredDate: quotation.ExpiredDate || quotation.expiredDate || null,
        status:
          quotation.Status !== undefined ? quotation.Status : quotation.status,
      }))
      .sort((a, b) => {
      // Sắp xếp theo ngày giảm dần (mới nhất trước)
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [selectedRequestDetails, allQuotations]);

  const detailQuotationCode = useMemo(() => {
    if (!selectedRequestDetails) return null;
    // Lấy mã báo giá mới nhất
    if (relatedQuotations.length > 0) {
      return relatedQuotations[0].code;
    }
    return (
      detailMatchedRequest?.quotationCode ||
      selectedRequestDetails.QuotationCode ||
      selectedRequestDetails.quotationCode ||
      null
    );
  }, [detailMatchedRequest, selectedRequestDetails, relatedQuotations]);

  const detailQuotationId = useMemo(() => {
    if (!selectedRequestDetails) return null;
    // Lấy ID báo giá mới nhất
    if (relatedQuotations.length > 0) {
      return relatedQuotations[0].id;
    }
    return (
      detailMatchedRequest?.quotationId ||
      selectedRequestDetails.QuotationId ||
      selectedRequestDetails.quotationId ||
      null
    );
  }, [detailMatchedRequest, selectedRequestDetails, relatedQuotations]);

  const handleOpenQuotationDetail = (quotationId) => {
    const targetId = quotationId || detailQuotationId;
    if (!targetId) return;
    navigate("/sales-quotation", { state: { openQuotationId: targetId } });
    setDetailDialogOpen(false);
  };

  // Sort requests
  const sortedRequests = useMemo(() => {
    // Nếu không có sortConfig.key, mặc định sort theo ngày gửi từ mới nhất đến cũ nhất
    const effectiveSortConfig = sortConfig.key 
      ? sortConfig 
      : { key: "sentDate", direction: "desc" };

    return [...filteredRequests].sort((a, b) => {
      let aValue = a[effectiveSortConfig.key];
      let bValue = b[effectiveSortConfig.key];

      if (effectiveSortConfig.key === "code") {
        aValue = aValue || "";
        bValue = bValue || "";
      } else if (effectiveSortConfig.key === "customerName") {
        aValue = aValue || "";
        bValue = bValue || "";
      } else if (
        effectiveSortConfig.key === "sentDate" ||
        effectiveSortConfig.key === "quotationDate"
      ) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (effectiveSortConfig.key === "status") {
        aValue = aValue !== undefined && aValue !== null ? aValue : -1;
        bValue = bValue !== undefined && bValue !== null ? bValue : -1;
      }

      if (aValue < bValue) {
        return effectiveSortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return effectiveSortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredRequests, sortConfig]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / pageSize));

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRequests.slice(start, start + pageSize);
  }, [sortedRequests, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Reset page to 1 when search filters change
  useEffect(() => {
    setPage(1);
  }, [searchRequestCode, searchCustomerName, statusFilter]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent>
      {/* Title */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <RequestQuote sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
        <Typography
          variant="h4"
              sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
            >
              Yêu cầu báo giá từ khách hàng
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Tổng: {filteredRequests.length} yêu cầu
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
          {error}
        </Alert>
      )}

      {/* Filter */}
      <Box
        sx={{
          mb: 3,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
          gap: 2,
        }}
      >
            {/* LEFT: Bộ lọc và tìm kiếm */}
        <Box
          sx={{
                display: "flex",
                alignItems: "center",
            gap: 2,
                flexWrap: "wrap",
                flexGrow: 1,
          }}
        >
              {/* Tìm kiếm */}
          <TextField
            size="small"
            label="Tìm kiếm mã yêu cầu"
            value={searchRequestCode}
            onChange={(e) => setSearchRequestCode(e.target.value)}
            sx={{ 
              minWidth: 200,
                  backgroundColor: "white",
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
              },
            }}
            placeholder="Nhập mã yêu cầu..."
          />

          <TextField
            size="small"
            label="Tìm kiếm tên khách hàng"
            value={searchCustomerName}
            onChange={(e) => setSearchCustomerName(e.target.value)}
            sx={{ 
              minWidth: 200,
                  backgroundColor: "white",
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
              },
            }}
            placeholder="Nhập tên khách hàng..."
          />
              {/* Lọc trạng thái */}
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="status-filter-label">
                  Lọc theo trạng thái
                </InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Lọc theo trạng thái"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="1">Chưa báo giá</MenuItem>
                  <MenuItem value="2">Đã báo giá</MenuItem>
                </Select>
              </FormControl>

        </Box>
      </Box>

      {/* Loading */}
      {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Table */}
      {!loading && (
        <TableContainer
          component={Paper}
          sx={{
            boxShadow: 2,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: 2,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Table
            sx={{
              tableLayout: "auto",
              borderSpacing: 0,
              borderCollapse: "collapse",
              minWidth: 1000, // giống trang thuốc: table rộng hơn container để scroll ngang
            }}
          >
            <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell
                  sx={{
                        width: "8%",
                    py: 1.5,
                    px: 2,
                        textAlign: "left",
                    fontWeight: 600,
                        textTransform: "capitalize",
                        letterSpacing: "0.03em",
                  }}
                >
                  #
                </TableCell>
                    <TableCell sx={{ width: "22%", py: 1.5, px: 2 }}>
                  <TableSortLabel
                        active={sortConfig.key === "code"}
                        direction={
                          sortConfig.key === "code"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("code")}
                    hideSortIcon
                    sx={headerTextSx}
                  >
                    Mã yêu cầu báo giá
                  </TableSortLabel>
                </TableCell>
                    <TableCell sx={{ width: "18%", py: 1.5, px: 2 }}>
                  <TableSortLabel
                        active={sortConfig.key === "customerName"}
                        direction={
                          sortConfig.key === "customerName"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("customerName")}
                    sx={headerTextSx}
                  >
                    Khách hàng
                  </TableSortLabel>
                </TableCell>
                    <TableCell
                      sx={{
                        width: "20%",
                        py: 1.5,
                        px: 2,
                        whiteSpace: "nowrap",
                      }}
                    >
                  <TableSortLabel
                        active={sortConfig.key === "sentDate"}
                        direction={
                          sortConfig.key === "sentDate"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("sentDate")}
                    sx={headerTextSx}
                  >
                    Ngày khách hàng gửi
                  </TableSortLabel>
                </TableCell>
                    <TableCell sx={{ width: "17%", py: 1.5, px: 2 }}>
                  <TableSortLabel
                        active={sortConfig.key === "quotationDate"}
                        direction={
                          sortConfig.key === "quotationDate"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("quotationDate")}
                    sx={headerTextSx}
                  >
                    Ngày báo giá
                  </TableSortLabel>
                </TableCell>
                    <TableCell sx={{ width: "18%", py: 1.5, px: 2 }}>
                  <TableSortLabel
                        active={sortConfig.key === "status"}
                        direction={
                          sortConfig.key === "status"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("status")}
                    sx={headerTextSx}
                  >
                    Trạng thái
                  </TableSortLabel>
                </TableCell>
                  <TableCell
                    sx={{ width: "25%", textAlign: "right", py: 1.5, px: 2 }}
                  >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                        justifyContent: "flex-end",
                          gap: 0.5,
                        whiteSpace: "nowrap",
                        }}
                      >
                    <span
                      style={{
                        textTransform: "capitalize",
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                      }}
                    >
                      Hành động
                    </span>
                  </Box>
                </TableCell>
            </TableRow>
          </TableHead>
            <TableBody>
              {paginatedRequests.map((request, index) => (
                <TableRow 
                  key={request.id || index} 
                  hover
                  sx={{
                        "&:nth-of-type(even)": {
                          backgroundColor: "#f9f9f9",
                    },
                        "& td": {
                      py: 1.5,
                      px: 2,
                          verticalAlign: "middle",
                        },
                  }}
                >
                      <TableCell sx={{ textAlign: "left" }}>
                    {(page - 1) * pageSize + index + 1}
                  </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {request.code}
                      </TableCell>
                      <TableCell>{request.customerName || "-"}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatDate(request.sentDate)}
                      </TableCell>
                <TableCell>
                  {/* Luôn hiển thị ngày báo giá mới nhất */}
                  {formatDate(request.quotationDate)}
                </TableCell>
                <TableCell>
                        {request.status !== undefined &&
                        request.status !== null ? (
                    <Chip
                      label={getStatusLabel(request.status)}
                      size="small"
                      sx={getStatusColor(request.status)}
                    />
                  ) : (
                          "-"
                  )}
                </TableCell>
                <TableCell
                  sx={{ width: "25%", textAlign: "right", verticalAlign: "middle" }}
                >
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            alignItems: "center",
                            justifyContent: "flex-end",
                            flexWrap: "nowrap",
                          }}
                        >
                          <Tooltip
                            title="Xem chi tiết"
                            placement="bottom"
                            arrow
                          >
                        <IconButton
                          size="medium"
                    onClick={() => handleViewDetails(request.id)}
                    sx={{
                                color: "#1976d2",
                                width: "40px",
                                height: "40px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                "&:hover": {
                                  backgroundColor: "rgba(25, 118, 210, 0.1)",
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
              {sortedRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có yêu cầu báo giá nào
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
          {sortedRequests.length > 0 && (
            <Box
              sx={{
                mt: 0,
                pt: 2,
                pb: 2,
                    borderTop: "1px solid #e0e0e0",
                    display: "flex",
                    justifyContent: "flex-end",
                    backgroundColor: "#fff",
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
        </CardContent>
      </Card>
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div">
            Chi tiết yêu cầu báo giá
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedRequestDetails && (
            <Box>
              {/* Thông tin yêu cầu - Layout 2 cột */}
              <Box sx={{ mb: 3, display: "flex", gap: 4 }}>
                {/* Bên trái: Mã yêu cầu báo giá, Mã báo giá và Trạng thái */}
                <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Mã yêu cầu báo giá:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedRequestDetails.RequestCode ||
                        selectedRequestDetails.requestCode ||
                        "-"}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Mã báo giá:
                </Typography>
                <Box sx={{ fontWeight: 500 }}>
                  {relatedQuotations.length > 0 ? (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                      {relatedQuotations.map((quotation, index) => {
                        // Nếu chỉ có 1 báo giá thì không hiển thị trạng thái
                        const showStatus = relatedQuotations.length > 1;
                        const isLatest = index === 0; // Mã đầu tiên sau khi sort là mới nhất
                        const hasExpired = isExpired(quotation.expiredDate);
                        const isValid = isLatest && !hasExpired; // Có hiệu lực nếu là mã mới nhất và chưa hết hạn
                            const statusText = isValid
                              ? "có hiệu lực"
                              : "không hiệu lực";
                        
                        return (
                          <Typography
                            key={quotation.id || index}
                            component="span"
                            variant="body2"
                            onClick={() => {
                              if (quotation.id) {
                                handleOpenQuotationDetail(quotation.id);
                              }
                            }}
                            sx={{
                                  display: "block",
                                  textAlign: "left",
                                  color: quotation.id
                                    ? "#1976d2"
                                    : "text.disabled",
                                  textDecoration:
                                    showStatus && !isValid
                                      ? "line-through"
                                      : "none",
                              opacity: showStatus && !isValid ? 0.6 : 1,
                                  cursor: quotation.id ? "pointer" : "default",
                                  textDecorationColor: "rgba(0, 0, 0, 0.4)",
                                  "&:hover": {
                                    textDecoration: quotation.id
                                      ? showStatus && !isValid
                                        ? "line-through"
                                        : "underline"
                                      : "none",
                                    opacity: quotation.id
                                      ? showStatus && !isValid
                                        ? 0.6
                                        : 0.8
                                      : 0.6,
                              },
                            }}
                          >
                                {quotation.code || "-"}
                                {showStatus ? ` (${statusText})` : ""}
                          </Typography>
                        );
                      })}
                    </Box>
                  ) : (
                        "-"
                  )}
                </Box>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Trạng thái:
                </Typography>
                <Chip
                      label={getStatusLabel(
                        selectedRequestDetails.Status !== undefined
                          ? selectedRequestDetails.Status
                          : selectedRequestDetails.status
                      )}
                  size="small"
                      sx={getStatusColor(
                        selectedRequestDetails.Status !== undefined
                          ? selectedRequestDetails.Status
                          : selectedRequestDetails.status
                      )}
                />
                  </Box>
                </Box>
                
                {/* Bên phải: Khách hàng và ngày gửi */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Khách hàng:
                    </Typography>
                    <Typography variant="body1">
                      {resolveCustomerName(selectedRequestDetails)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày khách hàng gửi:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(
                        selectedRequestDetails.RequestDate ||
                          selectedRequestDetails.requestDate
                      )}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày báo giá:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(detailQuotationDate)}
                    </Typography>
                </Box>
              </Box>
              </Box>
              <Box
                sx={{
                  mb: 2,
                  maxWidth: 300,
                  mx: "auto",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Danh sách sản phẩm:
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    "& .MuiTableCell-root": {
                      py: 0.75,
                      px: 1.25,
                      fontSize: "0.9rem",
                    },
                  }}
                >
                  <Table
                    size="small"
                    sx={{
                      tableLayout: "fixed",
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: "60px", textAlign: "center" }}>
                          STT
                        </TableCell>
                        <TableCell>Tên sản phẩm</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedRequestDetails.Details &&
                      selectedRequestDetails.Details.length > 0 ? (
                        selectedRequestDetails.Details.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell
                              sx={{ width: "60px", textAlign: "center" }}
                            >
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              {detail.ProductName || detail.productName || "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : selectedRequestDetails.details &&
                        selectedRequestDetails.details.length > 0 ? (
                        selectedRequestDetails.details.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell
                              sx={{ width: "60px", textAlign: "center" }}
                            >
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              {detail.ProductName || detail.productName || "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} align="center">
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
          )}
        </DialogContent>
        <DialogActions>
          {selectedRequestDetails &&
            (() => {
              const status =
                selectedRequestDetails.Status !== undefined
                  ? selectedRequestDetails.Status
                  : selectedRequestDetails.status;
            // Hiển thị nút "Tạo báo giá" khi trạng thái là "Chưa báo giá" (status = 1) hoặc "Đã báo giá" (status = 2)
            if (status === 1 || status === 2) {
              return (
            <Button
                    onClick={() =>
                      handleCreateQuotation(
                        selectedRequestDetails.Id || selectedRequestDetails.id
                      )
                    }
              disabled={generateLoading}
                  variant="contained"
                  sx={{
                      backgroundColor: "#155E64",
                      "&:hover": {
                        backgroundColor: "#0D4F52",
                    },
                  }}
            >
                    {generateLoading ? "Đang xử lý..." : "Tạo báo giá"}
            </Button>
              );
            }
            return null;
          })()}
          <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Create Quotation Dialog */}
      <Dialog
        open={createQuotationDialogOpen}
        onClose={handleCloseCreateQuotationDialog}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div">
            Tạo báo giá
          </Typography>
        </DialogTitle>
        <DialogContent>
          {quotationFormData && (
            <Box>
              {/* Error Alert */}
              {quotationError && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  onClose={() => setQuotationError(null)}
                >
                  {quotationError}
                </Alert>
              )}

              {/* Form fields */}
              <Box sx={{ mb: 3, display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Box sx={{ width: 320 }}>
                  <Typography
                    variant="body1"
                    sx={{ mb: 1, fontWeight: 600, fontSize: "1.1rem" }}
                  >
                    Ngày hết hạn <span style={{ color: "#d32f2f" }}>*</span>
                  </Typography>
                  <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="vi"
                  >
                    <DatePicker
                      value={
                        quotationForm.expiredDate
                          ? dayjs(quotationForm.expiredDate)
                          : null
                      }
                      onChange={(newValue) =>
                        setQuotationForm({
                          ...quotationForm,
                          expiredDate: newValue
                            ? dayjs(newValue).format("YYYY-MM-DD")
                            : "",
                        })
                      }
                      format="DD/MM/YYYY"
                      minDate={dayjs().startOf("day")}
                      slotProps={{
                        textField: {
                          required: true,
                          fullWidth: true,
                          size: "medium",
                          sx: {
                            "& .MuiInputBase-input": {
                              fontSize: "1rem",
                              py: 1.5,
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Box>
                <Box sx={{ minWidth: 320 }}>
                  <Typography
                    variant="body1"
                    sx={{ mb: 1, fontWeight: 600, fontSize: "1.1rem" }}
                  >
                    Cọc (% của đơn hàng)
                    <span style={{ color: "#d32f2f" }}> *</span>
                  </Typography>
                  <TextField
                    type="number"
                    value={
                      quotationForm.depositPercent === ""
                        ? ""
                        : quotationForm.depositPercent
                    }
                    onChange={(e) => handleDepositPercentChange(e.target.value)}
                    inputProps={{ min: 0, max: 70, step: 0.1 }}
                    variant="outlined"
                    size="medium"
                    fullWidth
                    sx={{ 
                      "& .MuiInputBase-input": {
                        fontSize: "1rem",
                        py: 1.5,
                      },
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 320 }}>
                  <Typography
                    variant="body1"
                    sx={{ mb: 1, fontWeight: 600, fontSize: "1.1rem" }}
                  >
                    Thời hạn thanh toán cọc (ngày)
                    <span style={{ color: "#d32f2f" }}> *</span>
                  </Typography>
                  <TextField
                    type="number"
                    value={quotationForm.depositDueDays}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setQuotationForm((prev) => ({
                          ...prev,
                          depositDueDays: "",
                        }));
                        return;
                      }
                      const parsed = parseInt(raw, 10);
                      if (Number.isNaN(parsed)) {
                        setQuotationForm((prev) => ({
                          ...prev,
                          depositDueDays: "",
                        }));
                        return;
                      }
                      const clamped = Math.max(1, Math.min(365, parsed));
                      setQuotationForm((prev) => ({
                        ...prev,
                        depositDueDays: clamped,
                      }));
                    }}
                    inputProps={{ min: 1, max: 365 }}
                    variant="outlined"
                    size="medium"
                    fullWidth
                    sx={{
                      "& .MuiInputBase-input": {
                        fontSize: "1rem",
                        py: 1.5,
                      },
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 320 }}>
                  <Typography
                    variant="body1"
                    sx={{ mb: 1, fontWeight: 600, fontSize: "1.1rem" }}
                  >
                    Thời hạn giao hàng (ngày)
                    <span style={{ color: "#d32f2f" }}> *</span>
                  </Typography>
                  <TextField
                    type="number"
                    value={quotationForm.expectedDeliveryDate}
                    onChange={(e) =>
                      setQuotationForm({
                        ...quotationForm,
                        expectedDeliveryDate: Math.max(
                          1,
                          Math.min(365, parseInt(e.target.value, 10) || 1)
                        ),
                      })
                    }
                    inputProps={{ min: 1, max: 365 }}
                    variant="outlined"
                    size="medium"
                    fullWidth
                    sx={{
                      "& .MuiInputBase-input": {
                        fontSize: "1rem",
                        py: 1.5,
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Products table */}
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                  >
                    Danh sách sản phẩm:
                  </Typography>
                  <IconButton
                    color="primary"
                    onClick={handleResetQuotationRows}
                    disabled={
                      !initialQuotationRows ||
                      initialQuotationRows.length === 0
                    }
                    size="medium"
                  >
                    <RefreshIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: "60px", textAlign: "center" }}>
                          STT
                        </TableCell>
                        <TableCell>Tên sản phẩm</TableCell>
                        <TableCell>Đơn vị</TableCell>
                        <TableCell>Lô hàng (chọn theo ngày hết hạn)</TableCell>
                        <TableCell>Thuế</TableCell>
                        <TableCell align="right">
                          Giá trước thuế
                        </TableCell>
                        <TableCell align="right">Giá sau thuế</TableCell>
                        <TableCell>Ghi chú</TableCell>
                        <TableCell align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {quotationRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              Không có sản phẩm
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        quotationRows.map((row, index) => {
                          const hasValidLotForRow = (row.lotOptions || []).some(
                            (lot) =>
                              lot.lotId !== null && lot.lotId !== undefined
                          );

                          const showIndex =
                            index === 0 ||
                            quotationRows[index - 1].productId !==
                              row.productId;

                          return (
                            <TableRow key={row.id}>
                              <TableCell
                                sx={{ width: "60px", textAlign: "center" }}
                              >
                                {showIndex ? row.id : ""}
                              </TableCell>
                              <TableCell>{row.productName || "-"}</TableCell>
                            <TableCell>{row.productUnit || "-"}</TableCell>
                              <TableCell sx={{ minWidth: 200 }}>
                              {(() => {
                                const validLotOptions =
                                  (row.lotOptions || []).filter(
                                    (lot) =>
                                      lot.lotId !== null &&
                                      lot.lotId !== undefined
                                  );

                                if (validLotOptions.length === 0) {
                                  return (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Không có lô hàng
                                    </Typography>
                                  );
                                }

                                return (
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={
                                        row.lotId !== null &&
                                        row.lotId !== undefined
                                          ? row.lotId
                                          : "NONE"
                                      }
                                      onChange={(e) =>
                                        handleLotChange(row.id, e.target.value)
                                      }
                                    >
                                      {validLotOptions.map((lot, idx) => (
                                        <MenuItem
                                          key={`${row.id}-${idx}`}
                                          value={lot.lotId}
                                        >
                                          {lot.displayLabel ||
                                            `Lô ${lot.lotId}`}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                );
                              })()}
                              </TableCell>
                              <TableCell sx={{ minWidth: 150 }}>
                                {!hasValidLotForRow ? (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Không có thuế
                                  </Typography>
                                ) : row.taxOptions && row.taxOptions.length > 0 ? (
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={
                                        row.taxId && row.taxId > 0
                                          ? row.taxId
                                          : row.taxOptions[0]?.id ??
                                            row.taxOptions[0]?.Id ??
                                            ""
                                      }
                                      onChange={(e) =>
                                        handleTaxChange(row.id, e.target.value)
                                      }
                                    >
                                      {row.taxOptions.map((tax) => (
                                        <MenuItem
                                          key={tax.id || tax.Id}
                                          value={tax.id || tax.Id}
                                        >
                                          {tax.name || tax.Name || "-"}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Không có thuế
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                              {row.totalBeforeTax !== undefined
                                ? renderCurrency(row.totalBeforeTax)
                                : "-"}
                              </TableCell>
                              <TableCell align="right">
                              {row.totalAfterTax !== undefined
                                ? renderCurrency(row.totalAfterTax)
                                : "-"}
                              </TableCell>
                              <TableCell>
                              <TextField
                                value={row.note || ""}
                                onChange={(e) => {
                                  setQuotationRows(
                                    quotationRows.map((r) =>
                                      r.id === row.id
                                        ? { ...r, note: e.target.value }
                                        : r
                                    )
                                  );
                                }}
                                size="small"
                                fullWidth
                                placeholder="Ghi chú"
                              />
                              </TableCell>
                              <TableCell align="center">
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  justifyContent="center"
                                >
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() =>
                                      handleDuplicateQuotationRow(row.id)
                                    }
                                    title="Thêm dòng báo giá cho sản phẩm này"
                                  >
                                    <AddCircleOutlineIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleRemoveQuotationRow(row.id)
                                    }
                                    title="Xóa dòng này"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseCreateQuotationDialog}
            disabled={quotationLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={() => handleSubmitQuotation(false)}
            variant="outlined"
            disabled={quotationLoading}
            sx={{
              borderColor: "#155E64",
              color: "#155E64",
              "&:hover": {
                borderColor: "#0D4F52",
                backgroundColor: "rgba(21, 94, 100, 0.05)",
              },
            }}
          >
            {quotationLoading && quotationAction === "draft" ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Lưu nháp"
            )}
          </Button>
          <Button
            onClick={() => handleSubmitQuotation(true)}
            variant="contained"
            disabled={quotationLoading}
            sx={{
              backgroundColor: "#155E64",
              "&:hover": {
                backgroundColor: "#0D4F52",
              },
            }}
          >
            {quotationLoading && quotationAction === "send" ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Gửi báo giá"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ListRSQ;