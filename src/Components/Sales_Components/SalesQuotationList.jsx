// File: SalesQuotationList.jsx - Danh sách báo giá cho Sales Staff
import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  IconButton,
  TableSortLabel,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Pagination,
  Stack,
  Divider,
  Card,
  CardContent,
  InputAdornment,
} from "@mui/material";
import { PriceCheck } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import Autocomplete from "@mui/material/Autocomplete";
import salesQuotationAPI from "../../API/salesQuotationAPI";
import requestSalesQuotationAPI from "../../API/requestSalesQuotationAPI";

const headerTextSx = {
  textTransform: "uppercase",
  fontWeight: 600,
  letterSpacing: "0.03em",
};

const SalesQuotationList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "quotationDate",
    direction: "desc",
  }); // Mặc định sort theo ngày báo giá từ mới nhất đến cũ nhất
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedQuotationDetails, setSelectedQuotationDetails] =
    useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuotationId, setEditingQuotationId] = useState(null);
  const [editInitialData, setEditInitialData] = useState(null);
  const [editFormData, setEditFormData] = useState({
    sqnId: null,
    expiredDate: null,
    depositPercent: 0,
    depositDueDays: 1,
    expectedDeliveryDate: 2,
  });
  const [editRows, setEditRows] = useState([]);
  const [notes, setNotes] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [sendingQuotationId, setSendingQuotationId] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Map status enum
  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return "Nháp";
      case 1:
        return "Đã gửi";
      case 2:
        return "Hết hạn";
      case 3:
        return "Không hợp lệ";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return { backgroundColor: "#fff3cd", color: "#856404" }; // Draft - Yellow
      case 1:
        return { backgroundColor: "#d1ecf1", color: "#0c5460" }; // Sent - Blue
      case 2:
        return { backgroundColor: "#f8d7da", color: "#721c24" }; // Expired - Red
      case 3:
        return { backgroundColor: "#fdecea", color: "#b71c1c" }; // Invalid - Darker Red
      default:
        return { backgroundColor: "#e3f2fd", color: "#1976d2" };
    }
  };

  const selectedDetailDisplayStatus = useMemo(() => {
    if (!selectedQuotationDetails) return null;
    const rawStatus =
      selectedQuotationDetails.Status !== undefined &&
      selectedQuotationDetails.Status !== null
        ? selectedQuotationDetails.Status
        : selectedQuotationDetails.status;

    const sqId = selectedQuotationDetails.Id || selectedQuotationDetails.id;
    const listItem = quotations.find((q) => q.id === sqId);

    if (listItem && listItem.status !== undefined && listItem.status !== null) {
      return listItem.status;
    }

    return rawStatus;
  }, [selectedQuotationDetails, quotations]);

  const resolveCustomerName = (source) => {
    if (!source) return "-";

    const candidates = [
      source.ReceiverName ?? source.receiverName,
      source.CustomerName ?? source.customerName,
      source.CustomerProfile?.User?.FullName ??
        source.CustomerProfile?.User?.fullName,
      source.customerProfile?.user?.FullName ??
        source.customerProfile?.user?.fullName,
      source.RequestSalesQuotation?.CustomerProfile?.User?.FullName ??
        source.RequestSalesQuotation?.CustomerProfile?.User?.fullName,
      source.requestSalesQuotation?.customerProfile?.user?.FullName ??
        source.requestSalesQuotation?.customerProfile?.user?.fullName,
      source.RequestSalesQuotation?.CustomerProfile?.User?.UserName ??
        source.RequestSalesQuotation?.CustomerProfile?.User?.userName,
      source.requestSalesQuotation?.customerProfile?.user?.UserName ??
        source.requestSalesQuotation?.customerProfile?.user?.userName,
      source.CreatedByUserName ?? source.createdByUserName,
      source.CreatedBy ?? source.createdBy,
    ];

    for (const candidate of candidates) {
      if (candidate && String(candidate).trim() !== "") {
        return candidate;
      }
    }

    return "-";
  };

  const resolveCustomerUsername = (source) => {
    if (!source) return "-";

    const candidates = [
      source.CustomerUserName ?? source.customerUserName,
      source.CustomerUsername ?? source.customerUsername,
      source.CustomerUser ?? source.customerUser,
      source.Customer?.UserName ?? source.Customer?.userName,
      source.Customer?.Username ?? source.Customer?.username,
      source.CustomerProfile?.UserName ?? source.CustomerProfile?.username,
      source.customerProfile?.UserName ?? source.customerProfile?.username,
      source.CustomerProfile?.User?.UserName ??
        source.CustomerProfile?.User?.userName,
      source.CustomerProfile?.User?.Username ??
        source.CustomerProfile?.User?.username,
      source.customerProfile?.user?.UserName ??
        source.customerProfile?.user?.userName,
      source.customerProfile?.user?.Username ??
        source.customerProfile?.user?.username,
      source.RequestSalesQuotation?.CustomerProfile?.User?.UserName ??
        source.RequestSalesQuotation?.CustomerProfile?.User?.userName,
      source.RequestSalesQuotation?.CustomerProfile?.User?.Username ??
        source.RequestSalesQuotation?.CustomerProfile?.User?.username,
      source.requestSalesQuotation?.customerProfile?.user?.UserName ??
        source.requestSalesQuotation?.customerProfile?.user?.userName,
      source.requestSalesQuotation?.customerProfile?.user?.Username ??
        source.requestSalesQuotation?.customerProfile?.user?.username,
      source.RequestSalesQuotation?.CustomerProfile?.UserName ??
        source.RequestSalesQuotation?.CustomerProfile?.username,
      source.requestSalesQuotation?.customerProfile?.UserName ??
        source.requestSalesQuotation?.customerProfile?.username,
      source.CreatedByUsername ?? source.createdByUsername,
      source.CreatedByUserName ?? source.createdByUserName,
      source.CreatedBy ?? source.createdBy,
      source.CustomerEmail ?? source.customerEmail,
      source.Email ?? source.email,
    ];

    for (const candidate of candidates) {
      if (candidate && String(candidate).trim() !== "") {
        return candidate;
      }
    }

    return "-";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
        return typeof dateString === "string" ? dateString : "-";
      }
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      return typeof dateString === "string" ? dateString : "-";
    }
  };

  // Format currency
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

  // Extract tax rate from TaxText (e.g., "VAT 10%" -> 0.1)
  const getTaxRateFromText = (taxText) => {
    if (!taxText) return 0;
    const matched = String(taxText).match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (matched && matched[1]) {
      const parsed = Number(matched[1].replace(",", "."));
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

  const calculateTotals = (quantity, unitPrice, taxRate = 0) => {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    const rate = Number(taxRate) || 0;
    const beforeTax = qty * price;
    const afterTax = beforeTax * (rate > 1 ? rate / 100 : rate) + beforeTax;
    return { beforeTax, afterTax };
  };

  const getDefaultTaxInfo = (taxes) => {
    if (!Array.isArray(taxes) || taxes.length === 0) {
      return { id: null, rate: 0 };
    }
    const first = taxes[0];
    return {
      id: first.id || first.Id || null,
      rate: getTaxRateFromText(first.name || first.Name || "") || 0,
    };
  };

  // Fetch data from API - Lấy danh sách yêu cầu báo giá đã gửi của customer
  // API này trả về các RequestSalesQuotation với status != Draft (đã gửi)
  const fetchQuotations = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await salesQuotationAPI.viewList();

      if (response.data && response.data.data) {
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        // Nhóm theo RequestCode để xác định báo giá mới nhất trên mỗi yêu cầu
        const groups = data.reduce((acc, item) => {
          const requestCode = item.RequestCode || item.requestCode || "";
          if (!requestCode) return acc;

          if (!acc[requestCode]) {
            acc[requestCode] = [];
          }
          acc[requestCode].push(item);
          return acc;
        }, {});

        const latestIdSet = new Set();

        Object.values(groups).forEach((items) => {
          if (!Array.isArray(items) || items.length === 0) return;

          const sorted = [...items].sort((a, b) => {
            const aDate = a.QuotationDate || a.quotationDate || null;
            const bDate = b.QuotationDate || b.quotationDate || null;
            const aTime = aDate ? new Date(aDate).getTime() : 0;
            const bTime = bDate ? new Date(bDate).getTime() : 0;

            if (aTime !== bTime) {
              return bTime - aTime; // mới nhất trước
            }

            const aId = a.Id || a.id || 0;
            const bId = b.Id || b.id || 0;
            return (bId || 0) - (aId || 0);
          });

          const latest = sorted[0];
          const latestId = latest?.Id || latest?.id;
          if (latestId !== undefined && latestId !== null) {
            latestIdSet.add(latestId);
          }
        });

        const mappedData = data.map((item) => {
          const customerName = resolveCustomerUsername(item);
          const backendStatus =
            item.Status !== undefined && item.Status !== null
              ? item.Status
              : item.status;
          const id = item.Id || item.id;
          const isLatest = latestIdSet.has(id);

          let displayStatus = backendStatus;

          // Nếu là báo giá cũ (không phải mới nhất) và đã từng gửi/đã hết hạn, hiển thị là Không hợp lệ
          if (!isLatest && (backendStatus === 1 || backendStatus === 2)) {
            displayStatus = 3;
          } else if (backendStatus === 3) {
            displayStatus = 3;
          }

          return {
            id,
            quotationCode: item.QuotationCode || item.quotationCode || "",
            requestCode: item.RequestCode || item.requestCode || "",
            quotationDate: item.QuotationDate || item.quotationDate || null,
            expiredDate: item.ExpiredDate || item.expiredDate || null,
            customerName,
            status: displayStatus,
            rawStatus: backendStatus,
            isLatest,
            rawItem: item,
          };
        });

        setQuotations(mappedData);
      } else {
        setQuotations([]);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể tải danh sách báo giá";
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      setQuotations([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === "asc";
    setSortConfig({ key, direction: isAsc ? "desc" : "asc" });
  };

  // Filter quotations by status
  const filteredQuotations = useMemo(() => {
    if (statusFilter === "all") return quotations;
    const filterStatus = parseInt(statusFilter, 10);
    return quotations.filter((quotation) => quotation.status === filterStatus);
  }, [quotations, statusFilter]);

  // Sort quotations
  const sortedQuotations = useMemo(() => {
    // Nếu không có sortConfig.key, mặc định sort theo ngày báo giá từ mới nhất đến cũ nhất
    const effectiveSortConfig = sortConfig.key
      ? sortConfig
      : { key: "quotationDate", direction: "desc" };

    return [...filteredQuotations].sort((a, b) => {
      let aValue = a[effectiveSortConfig.key];
      let bValue = b[effectiveSortConfig.key];

      if (effectiveSortConfig.key === "quotationCode") {
        aValue = aValue || "";
        bValue = bValue || "";
      } else if (
        effectiveSortConfig.key === "quotationDate" ||
        effectiveSortConfig.key === "expiredDate"
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
  }, [filteredQuotations, sortConfig]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedQuotations.length / pageSize));

  const paginatedQuotations = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedQuotations.slice(start, start + pageSize);
  }, [sortedQuotations, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleEdit = async (id) => {
    // Kiểm tra trạng thái trước khi cho phép sửa
    const quotation = quotations.find((q) => q.id === id);
    if (quotation && quotation.status !== 0) {
      setSnackbarMessage("Chỉ có thể sửa báo giá ở trạng thái Nháp");
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      // Fetch quotation details
      const response = await salesQuotationAPI.viewDetails(id);
      if (response.data && response.data.data) {
        const data = response.data.data;
        setEditingQuotationId(id);
        setEditInitialData(data);

        // Load notes from generateForm (cần rsqId từ quotation)
        // Tạm thời lấy từ quotation details hoặc có thể cần fetch riêng
        // Set form data
        const details = data.Details || data.details || [];
        const rsqId =
          data.RsqId || data.rsqId || data.RequestSalesQuotationId || null;

        let formDataMeta = null;
        let resolvedRsqId = rsqId;

        // Nếu chưa có RsqId thì tìm theo RequestCode
        if (!resolvedRsqId) {
          const requestCode = data.RequestCode || data.requestCode || "";
          if (requestCode) {
            try {
              const rsqListResp = await requestSalesQuotationAPI.viewList();
              const rsqList = rsqListResp.data?.data || [];
              const matchedRsq = rsqList.find((item) => {
                const code = item.RequestCode || item.requestCode || "";
                return code === requestCode;
              });
              if (matchedRsq) {
                resolvedRsqId = matchedRsq.Id || matchedRsq.id || null;
              }
            } catch (findErr) {
              console.error(
                "Không thể tìm RsqId theo RequestCode khi sửa báo giá",
                findErr
              );
            }
          }
        }

        if (resolvedRsqId) {
          try {
            const formResp = await salesQuotationAPI.generateForm(
              resolvedRsqId
            );
            formDataMeta = formResp.data?.data || null;
          } catch (metaErr) {
            console.error("Không thể tải form meta cho sửa báo giá", metaErr);
          }
        }

        const lotProducts =
          formDataMeta?.lotProducts || formDataMeta?.LotProducts || [];
        const taxes = formDataMeta?.taxes || formDataMeta?.Taxes || [];
        const notesMeta = formDataMeta?.notes || formDataMeta?.Notes || [];
        setNotes(notesMeta);

        const lotsByProduct = lotProducts.reduce((acc, lot) => {
          const productId =
            lot.productID ||
            lot.ProductID ||
            lot.productId ||
            lot.ProductId ||
            null;
          if (!productId) {
            return acc;
          }
          if (!acc[productId]) {
            acc[productId] = [];
          }
          const lotIdentifier =
            lot.lotCode ||
            lot.LotCode ||
            lot.lotName ||
            lot.LotName ||
            (lot.lotID || lot.LotID ? `Lô ${lot.lotID || lot.LotID}` : "Lô");
          const expiredRaw = lot.expiredDate || lot.ExpiredDate || null;
          const formattedExpired =
            expiredRaw && !Number.isNaN(new Date(expiredRaw).getTime())
              ? new Date(expiredRaw).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : null;
          acc[productId].push({
            lotId: lot.lotID || lot.LotID || lot.id || lot.Id || null,
            salePrice: lot.salePrice || lot.SalePrice || 0,
            expiredDate: expiredRaw,
            // Chỉ hiển thị ngày hết hạn để người dùng chọn theo hạn dùng
            displayLabel: formattedExpired || "Không có ngày hết hạn",
          });
          return acc;
        }, {});

        // Thêm option "Hết lô hàng" cho mỗi sản phẩm giống màn Tạo báo giá
        Object.keys(lotsByProduct).forEach((productId) => {
          lotsByProduct[productId].push({
            lotId: null,
            salePrice: 0,
            expiredDate: null,
            displayLabel: "Hết lô hàng",
          });
        });

        const defaultTaxInfo = getDefaultTaxInfo(taxes);

        const initializedRows = details.map((detail, idx) => {
          let productId = detail.ProductId || detail.productId;
          const productName = detail.ProductName || detail.productName || "";
          const unit =
            detail.Unit ||
            detail.unit ||
            detail.ProductUnit ||
            detail.productUnit ||
            "";

          // Lấy danh sách lô tương ứng với sản phẩm.
          // Ưu tiên map theo ProductId; nếu không khớp thì map theo tên + đơn vị.
          let productLots = lotsByProduct[productId] || [];
          if (!productLots.length) {
            const matchingLots = lotProducts.filter((lot) => {
              const lotName = lot.productName || lot.ProductName || "";
              const lotUnit = lot.unit || lot.Unit || "";
              return (
                lotName.trim() === productName.trim() &&
                (!unit || lotUnit.trim() === unit.trim())
              );
            });

            productLots = matchingLots.map((lot) => {
              const expiredRaw = lot.expiredDate || lot.ExpiredDate || null;
              const formattedExpired =
                expiredRaw && !Number.isNaN(new Date(expiredRaw).getTime())
                  ? new Date(expiredRaw).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : null;
              return {
                lotId: lot.lotID || lot.LotID || lot.id || lot.Id || null,
                salePrice: lot.salePrice || lot.SalePrice || 0,
                expiredDate: expiredRaw,
                displayLabel: formattedExpired || "Không có ngày hết hạn",
              };
            });

            // Nếu tìm được lô theo tên/đơn vị thì cập nhật lại productId theo productID hiện tại của hệ thống
            if (matchingLots.length > 0) {
              const mappedProductId =
                matchingLots[0].productID || matchingLots[0].ProductID || null;
              if (mappedProductId) {
                productId = mappedProductId;
              }
            }

            // Thêm option "Hết lô hàng" cho trường hợp fallback theo tên sản phẩm
            if (productLots.length) {
              productLots.push({
                lotId: null,
                salePrice: 0,
                expiredDate: null,
                displayLabel: "Hết lô hàng",
              });
            }
          }
          const currentLotId = detail.LotId || detail.lotId || null;
          const sqdId = detail.Id || detail.id || null;

          const expiredRaw =
            detail.LotExpiredDate ||
            detail.lotExpiredDate ||
            detail.ExpiredDate ||
            detail.expiredDate ||
            null;

          const lotOptions =
            productLots.length > 0
              ? productLots
              : [
                  {
                    lotId: currentLotId ?? 1,
                    salePrice:
                      detail.UnitPrice ??
                      detail.unitPrice ??
                      detail.SalesPrice ??
                      detail.salesPrice ??
                      0,
                    expiredDate: expiredRaw,
                    // Hiển thị ngày hết hạn, không hiển thị "Lô x"
                    displayLabel: expiredRaw
                      ? formatDate(expiredRaw)
                      : "Không có ngày hết hạn",
                  },
                ];

          // Chọn lô mặc định:
          //  - Nếu có LotId từ backend thì ưu tiên tìm theo LotId
          //  - Nếu không có LotId nhưng có ngày hết hạn trong chi tiết thì map theo expiredDate
          //  - Cuối cùng fallback sang lô đầu tiên KHÔNG phải "Hết lô hàng"
          let selectedLot = null;
          if (currentLotId !== null && currentLotId !== undefined) {
            selectedLot =
              lotOptions.find((lot) => lot.lotId === currentLotId) || null;
          }
          if (!selectedLot && expiredRaw) {
            const targetTime = new Date(expiredRaw).getTime();
            selectedLot =
              lotOptions.find(
                (lot) =>
                  lot.expiredDate &&
                  new Date(lot.expiredDate).getTime() === targetTime
              ) || null;
          }
          if (!selectedLot) {
            selectedLot =
              lotOptions.find(
                (lot) => lot.lotId !== null && lot.lotId !== undefined
              ) ||
              lotOptions[0] ||
              null;
          }

          const lotId = selectedLot ? selectedLot.lotId : null;

          const minQuantity =
            detail.MinQuantity ??
            detail.minQuantity ??
            detail.Quantity ??
            detail.quantity ??
            1;

          const unitPrice =
            detail.UnitPrice ??
            detail.unitPrice ??
            detail.SalesPrice ??
            detail.salesPrice ??
            (selectedLot ? selectedLot.salePrice || 0 : 0);

          const taxText = detail.TaxText || detail.taxText || "";

          // Ưu tiên danh sách thuế đầy đủ từ form meta (giống màn Tạo báo giá)
          const taxOptions =
            taxes.length > 0 ? taxes : detail.Taxes || detail.taxes || [];

          // Chuẩn hóa TaxText để map với tên thuế trong meta
          const normalize = (value) =>
            String(value || "")
              .toLowerCase()
              .replace(/\s+/g, "");

          let taxId = detail.TaxId || detail.taxId || null;

          if (!taxId && taxText && taxOptions.length > 0) {
            const target = normalize(taxText);
            const matched = taxOptions.find((tax) => {
              const name = normalize(tax.name || tax.Name || "");
              return name === target;
            });
            if (matched) {
              taxId = matched.id || matched.Id || null;
            }
          }

          if (!taxId && taxOptions.length > 0) {
            taxId = taxOptions[0].id || taxOptions[0].Id || defaultTaxInfo.id;
          }

          const selectedTax = (taxOptions || []).find(
            (tax) => (tax.id || tax.Id) === taxId
          );
          const taxRateSource =
            (selectedTax && (selectedTax.name || selectedTax.Name || "")) ||
            taxText ||
            "";
          const taxRate = taxRateSource
            ? getTaxRateFromText(taxRateSource)
            : defaultTaxInfo.rate;

          const { beforeTax, afterTax } = calculateTotals(
            minQuantity,
            unitPrice,
            taxRate
          );

          return {
            id: idx + 1,
            sqdId,
            productId,
            productName,
            unit,
            lotId,
            lotOptions,
            taxId,
            taxOptions: taxOptions.length > 0 ? taxOptions : [],
            minQuantity,
            unitPrice,
            totalBeforeTax: beforeTax,
            totalAfterTax: afterTax,
            taxRate,
            note: detail.Note || detail.note || "",
          };
        });

        setEditRows(initializedRows);

        // Parse deposit / deadline information, ưu tiên field từ backend, fallback từ ghi chú
        const noteText = data.Notes || data.Note || data.note || "";

        let parsedDepositPercent = null;
        let parsedDepositDueDays = null;
        let parsedExpectedDeliveryDate = null;

        if (noteText) {
          try {
            // Ví dụ: "Tạm ứng 15% tiền cọc trong vòng 5 ngày ..."
            const depositMatch = noteText.match(
              /Tạm\s+ứng\s+(\d+(?:[.,]\d+)?)\s*%\s*tiền\s+cọc/i
            );
            if (depositMatch && depositMatch[1]) {
              parsedDepositPercent = Number(depositMatch[1].replace(",", "."));
            }

            const depositDueMatch = noteText.match(
              /trong\s+vòng\s+(\d+)\s+ngày\s+kể\s+từ\s+khi\s+ký\s+hợp\s+đồng/i
            );
            if (depositDueMatch && depositDueMatch[1]) {
              parsedDepositDueDays = Number(depositDueMatch[1]);
            }

            const deliveryMatch = noteText.match(
              /giao\s+trong\s+thời\s+gian\s+(\d+)\s+ngày\s+kể\s+từ\s+ngày\s+ký\s+kết\s+hợp\s+đồng/i
            );
            if (deliveryMatch && deliveryMatch[1]) {
              parsedExpectedDeliveryDate = Number(deliveryMatch[1]);
            }
          } catch (parseErr) {
            console.error(
              "Không thể parse thông tin cọc / giao hàng từ ghi chú:",
              parseErr
            );
          }
        }

        // Xác định sqnId gửi lên backend:
        //  - Ưu tiên SqnId từ dữ liệu báo giá
        //  - Nếu thiếu, fallback sang ghi chú đầu tiên trong notesMeta (giống khi tạo báo giá)
        let resolvedSqnId = data.SqnId || data.sqnId || null;
        if (
          !resolvedSqnId &&
          Array.isArray(notesMeta) &&
          notesMeta.length > 0
        ) {
          resolvedSqnId = notesMeta[0].id || notesMeta[0].Id || null;
        }

        setEditFormData({
          sqnId: resolvedSqnId,
          expiredDate:
            data.ExpiredDate || data.expiredDate
              ? dayjs(data.ExpiredDate || data.expiredDate)
              : null,
          depositPercent:
            data.DepositPercent !== undefined
              ? data.DepositPercent
              : data.depositPercent !== undefined
              ? data.depositPercent
              : parsedDepositPercent !== null
              ? parsedDepositPercent
              : 0,
          depositDueDays:
            data.DepositDueDays !== undefined
              ? data.DepositDueDays
              : data.depositDueDays !== undefined
              ? data.depositDueDays
              : parsedDepositDueDays !== null
              ? parsedDepositDueDays
              : 1,
          expectedDeliveryDate:
            data.ExpectedDeliveryDate !== undefined
              ? data.ExpectedDeliveryDate
              : data.expectedDeliveryDate !== undefined
              ? data.expectedDeliveryDate
              : parsedExpectedDeliveryDate !== null
              ? parsedExpectedDeliveryDate
              : 2,
        });

        setEditDialogOpen(true);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể tải thông tin báo giá";
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLotChange = (rowId, lotId) => {
    const normalizedLotId = lotId === "NONE" ? null : Number(lotId);
    setEditRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id !== rowId) return row;
        if (!normalizedLotId) {
          const quantity = row.minQuantity ?? 1;
          // Chọn thuế 0% nếu có trong danh sách thuế
          const zeroTax = (row.taxOptions || []).find((tax) => {
            const name = String(tax.name || tax.Name || "").toLowerCase();
            return name.includes("0%");
          });
          const zeroTaxId = zeroTax ? zeroTax.id || zeroTax.Id || null : null;

          const { beforeTax, afterTax } = calculateTotals(quantity, 0, 0);
          return {
            ...row,
            lotId: null,
            unitPrice: 0,
            taxId: zeroTaxId,
            taxRate: 0,
            totalBeforeTax: beforeTax,
            totalAfterTax: afterTax,
          };
        }
        const selectedLot = (row.lotOptions || []).find(
          (lot) => lot.lotId === normalizedLotId
        );
        if (selectedLot) {
          const unitPrice = selectedLot.salePrice ?? 0;
          const quantity = row.minQuantity ?? 1;
          const { beforeTax, afterTax } = calculateTotals(
            quantity,
            unitPrice,
            row.taxRate || 0
          );
          return {
            ...row,
            lotId: normalizedLotId,
            unitPrice,
            totalBeforeTax: beforeTax,
            totalAfterTax: afterTax,
          };
        }
        return { ...row, lotId: normalizedLotId };
      })
    );
  };

  const handleEditTaxChange = (rowId, taxId) => {
    const normalizedTaxId = taxId ? Number(taxId) : null;
    setEditRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id !== rowId) return row;

        if (!normalizedTaxId) {
          const quantity = row.minQuantity ?? 1;
          const { beforeTax, afterTax } = calculateTotals(
            quantity,
            row.unitPrice,
            0
          );
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
        const taxRate = getTaxRateFromText(
          selectedTax?.name || selectedTax?.Name || ""
        );
        const quantity = row.minQuantity ?? 1;
        const { beforeTax, afterTax } = calculateTotals(
          quantity,
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

  const handleEditNoteChange = (rowId, value) => {
    setEditRows((prevRows) =>
      prevRows.map((row) => (row.id === rowId ? { ...row, note: value } : row))
    );
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingQuotationId(null);
    setEditInitialData(null);
    setEditFormData({
      sqnId: null,
      expiredDate: null,
      depositPercent: 0,
      depositDueDays: 1,
    });
    setEditRows([]);
    setEditError(null);
  };

  const handleUpdateQuotation = async () => {
    if (!editFormData.expiredDate) {
      setEditError("Vui lòng chọn ngày hết hạn");
      return;
    }

    if (
      editFormData.expectedDeliveryDate === null ||
      editFormData.expectedDeliveryDate === undefined ||
      Number(editFormData.expectedDeliveryDate) <= 0
    ) {
      setEditError("Vui lòng nhập thời hạn giao hàng dự kiến");
      return;
    }

    if (editFormData.depositDueDays >= editFormData.expectedDeliveryDate) {
      setEditError(
        "Thời hạn thanh toán cọc phải nhỏ hơn thời hạn giao hàng dự kiến"
      );
      return;
    }

    const detailPayload = editRows
      .filter(
        (row) =>
          row.lotId !== null && row.lotId !== undefined && row.lotId !== "NONE"
      )
      .map((row) => ({
        sqdId: row.sqdId || null,
        productId: row.productId,
        lotId: row.lotId,
        taxId: row.taxId,
        note: row.note || "",
      }));

    if (detailPayload.length === 0) {
      setEditError(
        "Vui lòng chọn lô và thuế cho ít nhất một sản phẩm trước khi cập nhật"
      );
      return;
    }

    setUpdateLoading(true);
    setEditError(null);
    try {
      const payload = {
        SqId: editingQuotationId,
        SqnId: editFormData.sqnId,
        ExpiredDate: editFormData.expiredDate.format("YYYY-MM-DD"),
        DepositPercent: editFormData.depositPercent,
        DepositDueDays: editFormData.depositDueDays,
        ExpectedDeliveryDate: editFormData.expectedDeliveryDate,
        Details: detailPayload.map((detail) => ({
          SqdId: detail.sqdId,
          ProductId: detail.productId,
          LotId: detail.lotId,
          TaxId: detail.taxId,
          Note: detail.note,
        })),
      };

      console.log("Update payload:", payload); // Debug log

      await salesQuotationAPI.updateSalesQuotation(payload);

      setSnackbarMessage("Cập nhật báo giá thành công!");
      setSnackbarOpen(true);
      handleCloseEditDialog();
      // Refresh list
      setTimeout(() => {
        fetchQuotations();
      }, 500);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể cập nhật báo giá";
      setEditError(errorMessage);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa báo giá này?")) {
      return;
    }

    setLoading(true);
    try {
      await salesQuotationAPI.deleteSalesQuotation(id);
      setSnackbarMessage("Xóa báo giá thành công!");
      setSnackbarOpen(true);
      await fetchQuotations();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể xóa báo giá";
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setCommentInput(""); // Reset comment input
    try {
      const response = await salesQuotationAPI.viewDetails(id);
      if (response.data && response.data.data) {
        console.log("Quotation details response:", response.data.data);
        console.log(
          "Details array:",
          response.data.data.Details || response.data.data.details
        );
        console.log("Customer info:", {
          ReceiverName:
            response.data.data.ReceiverName || response.data.data.receiverName,
          CustomerName:
            response.data.data.CustomerName || response.data.data.customerName,
          RequestSalesQuotation:
            response.data.data.RequestSalesQuotation ||
            response.data.data.requestSalesQuotation,
        });
        setSelectedQuotationDetails(response.data.data);
        setDetailDialogOpen(true);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể tải chi tiết báo giá";
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddComment = async () => {
    if (!selectedQuotationDetails?.Id && !selectedQuotationDetails?.id) {
      setSnackbarMessage("Không xác định được mã báo giá");
      setSnackbarOpen(true);
      return;
    }
    if (!commentInput.trim()) {
      setSnackbarMessage("Vui lòng nhập nội dung bình luận");
      setSnackbarOpen(true);
      return;
    }

    const sqId = selectedQuotationDetails.Id || selectedQuotationDetails.id;
    setIsSubmittingComment(true);
    try {
      await salesQuotationAPI.addComment(sqId, commentInput.trim());
      setCommentInput("");
      // Reload details to get updated comments
      const response = await salesQuotationAPI.viewDetails(sqId);
      if (response.data && response.data.data) {
        setSelectedQuotationDetails(response.data.data);
      }
      setSnackbarMessage("Đã gửi bình luận");
      setSnackbarOpen(true);
    } catch (err) {
      const message = err.response?.data?.message || "Không thể gửi bình luận";
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSend = async (id) => {
    setSendingQuotationId(id);
    try {
      await salesQuotationAPI.sendSalesQuotation(id);
      setSnackbarMessage("Gửi báo giá thành công!");
      setSnackbarOpen(true);
      // Refresh list without showing full page loading
      await fetchQuotations(false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể gửi báo giá";
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setSendingQuotationId(null);
    }
  };

  useEffect(() => {
    const openId = location.state?.openQuotationId;
    if (openId) {
      handleViewDetails(openId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, handleViewDetails]);

  // Auto-refresh comments khi dialog mở
  useEffect(() => {
    if (!detailDialogOpen || !selectedQuotationDetails) return;

    const sqId = selectedQuotationDetails.Id || selectedQuotationDetails.id;
    if (!sqId) return;

    // Refresh comments mỗi 5 giây khi dialog mở
    const refreshInterval = setInterval(async () => {
      try {
        const response = await salesQuotationAPI.viewDetails(sqId);
        if (response.data && response.data.data) {
          const currentComments =
            selectedQuotationDetails?.Comments ||
            selectedQuotationDetails?.comments ||
            [];
          const newComments =
            response.data.data.Comments || response.data.data.comments || [];

          // Chỉ update nếu số lượng comments thay đổi (có comment mới)
          if (newComments.length !== currentComments.length) {
            setSelectedQuotationDetails(response.data.data);
            console.log(
              "SalesQuotationList - Comments auto-refreshed:",
              newComments.length
            );
          }
        }
      } catch (err) {
        console.error("Error auto-refreshing comments:", err);
      }
    }, 5000); // Refresh mỗi 5 giây

    return () => clearInterval(refreshInterval);
  }, [detailDialogOpen, selectedQuotationDetails]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent>
          {/* Header */}
          <Box className="sales-quotation-list-title-container" sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <PriceCheck sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
            <Typography
              variant="h4"
              className="sales-quotation-list-title"
              sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
            >
              Báo giá
            </Typography>
            <Typography variant="h6" color="text.secondary" className="sales-quotation-list-count">
              Tổng: {filteredQuotations.length} báo giá
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

          {/* FILTER */}
          <Paper
            className="sales-quotation-list-filter-container"
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: "#f8fafc",
              borderRadius: 2,
            }}
            elevation={1}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems="center"
              spacing={2}
              justifyContent="space-between"
            >
              {/* Left - Filter trạng thái */}
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                flexWrap="wrap"
              >
                <FormControl size="small" sx={{ minWidth: 220 }}>
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
                    <MenuItem value="0">Nháp</MenuItem>
                    <MenuItem value="1">Đã gửi</MenuItem>
                    <MenuItem value="2">Hết hạn</MenuItem>
                    <MenuItem value="3">Không hợp lệ</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {/* Right - Dự phòng (nếu bố muốn thêm nút sau này) */}
              <Box sx={{ ml: "auto" }}>{/* Button: */}</Box>
            </Stack>
          </Paper>

          {/* Loading */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Table */}
          {!loading && (
            <div className="sales-quotation-list-table-container">
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: 2,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: 2,
                overflowX: "auto",
              }}
            >
              <Table className="sales-quotation-list-table" sx={{ tableLayout: "fixed", minWidth: 1000 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell
                      sx={{
                        width: "8%",
                        py: 1.5,
                        px: 2,
                        textAlign: "left",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      STT
                    </TableCell>
                    <TableCell sx={{ width: "18%", py: 1.5, px: 2 }}>
                      <TableSortLabel
                        active={sortConfig.key === "quotationCode"}
                        direction={
                          sortConfig.key === "quotationCode"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("quotationCode")}
                        hideSortIcon
                        sx={headerTextSx}
                      >
                        Mã báo giá
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: "18%", py: 1.5, px: 2 }}>
                      <TableSortLabel
                        active={sortConfig.key === "requestCode"}
                        direction={
                          sortConfig.key === "requestCode"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("requestCode")}
                        sx={headerTextSx}
                      >
                        Mã yêu cầu báo giá
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: "18%", py: 1.5, px: 2 }}>
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
                        Ngày gửi
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: "18%", py: 1.5, px: 2 }}>
                      <TableSortLabel
                        active={sortConfig.key === "expiredDate"}
                        direction={
                          sortConfig.key === "expiredDate"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("expiredDate")}
                        sx={headerTextSx}
                      >
                        Ngày hết hạn
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
                      sx={{ width: "16%", textAlign: "right", py: 1.5, px: 2 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 0.5,
                        }}
                      >
                        <span
                          style={{
                            textTransform: "uppercase",
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
                  {paginatedQuotations.map((quotation, index) => (
                    <TableRow
                      key={quotation.id || index}
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
                        {quotation.quotationCode}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {quotation.requestCode || "-"}
                      </TableCell>
                      <TableCell>
                        {formatDate(quotation.quotationDate)}
                      </TableCell>
                      <TableCell>{formatDate(quotation.expiredDate)}</TableCell>
                      <TableCell>
                        {quotation.status !== undefined &&
                        quotation.status !== null ? (
                          <Chip
                            label={getStatusLabel(quotation.status)}
                            size="small"
                            sx={getStatusColor(quotation.status)}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell
                        sx={{ textAlign: "right", verticalAlign: "middle" }}
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
                          {quotation.status === 0 && (
                            <>
                              <Tooltip title="Sửa" placement="bottom" arrow>
                                <IconButton
                                  size="medium"
                                  onClick={() => handleEdit(quotation.id)}
                                  sx={{
                                    color: "#1976d2",
                                    width: "40px",
                                    height: "40px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    "&:hover": {
                                      backgroundColor:
                                        "rgba(25, 118, 210, 0.1)",
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="medium" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa" placement="bottom" arrow>
                                <IconButton
                                  size="medium"
                                  onClick={() => handleDelete(quotation.id)}
                                  sx={{
                                    color: "#d32f2f",
                                    width: "40px",
                                    height: "40px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    "&:hover": {
                                      backgroundColor: "rgba(211, 47, 47, 0.1)",
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="medium" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Gửi" placement="bottom" arrow>
                                <IconButton
                                  size="medium"
                                  onClick={() => handleSend(quotation.id)}
                                  disabled={sendingQuotationId === quotation.id}
                                  sx={{
                                    color: "#1976d2",
                                    width: "40px",
                                    height: "40px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    "&:hover": {
                                      backgroundColor:
                                        "rgba(25, 118, 210, 0.1)",
                                    },
                                    "&:disabled": {
                                      opacity: 0.6,
                                    },
                                  }}
                                >
                                  {sendingQuotationId === quotation.id ? (
                                    <CircularProgress
                                      size={20}
                                      color="inherit"
                                    />
                                  ) : (
                                    <SendIcon fontSize="medium" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip
                            title="Xem chi tiết"
                            placement="bottom"
                            arrow
                          >
                            <IconButton
                              size="medium"
                              onClick={() => handleViewDetails(quotation.id)}
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
                  {sortedQuotations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Chưa có báo giá nào
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {sortedQuotations.length > 0 && (
                <Box
                  sx={{
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
            </div>
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
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Chi tiết báo giá
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedQuotationDetails && (
            <Box>
              {/* Thông tin báo giá - Layout 2 cột */}
              <Box sx={{ mb: 3, display: "flex", gap: 4 }}>
                {/* Bên trái: Mã yêu cầu báo giá, Mã báo giá và Trạng thái */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã yêu cầu báo giá:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedQuotationDetails.RequestCode ||
                        selectedQuotationDetails.requestCode ||
                        "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mã báo giá:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedQuotationDetails.QuotationCode ||
                        selectedQuotationDetails.quotationCode ||
                        "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Trạng thái:
                    </Typography>
                    {selectedDetailDisplayStatus !== null && (
                      <Chip
                        label={getStatusLabel(selectedDetailDisplayStatus)}
                        size="small"
                        sx={getStatusColor(selectedDetailDisplayStatus)}
                      />
                    )}
                  </Box>
                </Box>

                {/* Bên phải: Ngày gửi và Ngày hết hạn */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Khách hàng:
                    </Typography>
                    <Typography variant="body1">
                      {resolveCustomerName(selectedQuotationDetails)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày gửi:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(
                        selectedQuotationDetails.QuotationDate ||
                          selectedQuotationDetails.quotationDate
                      )}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày hết hạn:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(
                        selectedQuotationDetails.ExpiredDate ||
                          selectedQuotationDetails.expiredDate
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Danh sách sản phẩm */}
              <Box sx={{ mb: 2 }}>
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
                  sx={{ maxHeight: "500px", overflow: "auto" }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            width: "50px",
                            textAlign: "center",
                            backgroundColor: "#f5f5f5",
                          }}
                        >
                          STT
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "#f5f5f5" }}>
                          Tên sản phẩm
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "#f5f5f5" }}>
                          Đơn vị
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "#f5f5f5" }}>
                          Ngày hết hạn
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "#f5f5f5" }}>
                          Thuế
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "right",
                            backgroundColor: "#f5f5f5",
                          }}
                        >
                          Thành tiền trước thuế
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "right",
                            backgroundColor: "#f5f5f5",
                          }}
                        >
                          Thành tiền sau thuế
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "#f5f5f5" }}>
                          Ghi chú
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        const details =
                          selectedQuotationDetails.Details ||
                          selectedQuotationDetails.details ||
                          [];
                        if (details.length > 0) {
                          return details.map((detail, index) => {
                            const productName =
                              detail.ProductName || detail.productName || "-";
                            const productUnit =
                              detail.Unit ||
                              detail.unit ||
                              detail.ProductUnit ||
                              detail.productUnit ||
                              "-";
                            const taxText =
                              detail.TaxText || detail.taxText || null;
                            const minQuantity =
                              detail.minQuantity !== undefined &&
                              detail.minQuantity !== null
                                ? detail.minQuantity
                                : detail.MinQuantity !== undefined &&
                                  detail.MinQuantity !== null
                                ? detail.MinQuantity
                                : 1;
                            const salesPrice =
                              detail.SalesPrice !== undefined &&
                              detail.SalesPrice !== null
                                ? detail.SalesPrice
                                : detail.salesPrice !== undefined &&
                                  detail.salesPrice !== null
                                ? detail.salesPrice
                                : null;
                            const itemTotal =
                              detail.ItemTotal !== undefined &&
                              detail.ItemTotal !== null
                                ? detail.ItemTotal
                                : detail.itemTotal !== undefined &&
                                  detail.itemTotal !== null
                                ? detail.itemTotal
                                : null;
                            const note = detail.Note || detail.note || "-";
                            const rawExpiredDate =
                              detail.LotExpiredDate ||
                              detail.lotExpiredDate ||
                              detail.ExpiredDate ||
                              detail.expiredDate ||
                              detail.LotProduct?.ExpiredDate ||
                              detail.LotProduct?.expiredDate ||
                              detail.lotProduct?.ExpiredDate ||
                              detail.lotProduct?.expiredDate ||
                              null;
                            const expiredDisplay = rawExpiredDate
                              ? formatDate(rawExpiredDate)
                              : "-";

                            // Calculate tax rate and total before tax
                            const taxRate = taxText
                              ? getTaxRateFromText(taxText)
                              : 0;
                            const totalBeforeTax =
                              itemTotal !== null && itemTotal > 0
                                ? calculateTotalBeforeTax(itemTotal, taxRate)
                                : salesPrice !== null && salesPrice > 0
                                ? salesPrice * minQuantity
                                : 0;

                            return (
                              <TableRow key={detail.Id || detail.id || index}>
                                <TableCell sx={{ textAlign: "center" }}>
                                  {index + 1}
                                </TableCell>
                                <TableCell>{productName}</TableCell>
                                <TableCell>{productUnit}</TableCell>
                                <TableCell>{expiredDisplay}</TableCell>
                                <TableCell>{taxText || "-"}</TableCell>
                                <TableCell sx={{ textAlign: "right" }}>
                                  {totalBeforeTax > 0
                                    ? renderCurrency(totalBeforeTax)
                                    : "-"}
                                </TableCell>
                                <TableCell sx={{ textAlign: "right" }}>
                                  {itemTotal !== null
                                    ? renderCurrency(itemTotal)
                                    : "-"}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    textAlign: "center",
                                    color:
                                      note === "-"
                                        ? "text.secondary"
                                        : "inherit",
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
                              <TableCell
                                colSpan={8}
                                align="center"
                                sx={{ py: 3 }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
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
              {selectedQuotationDetails.note && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Ghi chú:
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, backgroundColor: "#f9f9f9" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-line",
                        lineHeight: 1.8,
                      }}
                    >
                      {selectedQuotationDetails.note}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Lịch sử trao đổi */}
              <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid #e0e0e0" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", fontSize: "1.5rem" }}
                  >
                    Lịch sử trao đổi
                  </Typography>
                  <Tooltip title="Làm mới bình luận">
                    <IconButton
                      size="small"
                      onClick={async () => {
                        const sqId =
                          selectedQuotationDetails.Id ||
                          selectedQuotationDetails.id;
                        if (sqId) {
                          try {
                            const response =
                              await salesQuotationAPI.viewDetails(sqId);
                            if (response.data && response.data.data) {
                              setSelectedQuotationDetails(response.data.data);
                              setSnackbarMessage("Đã làm mới bình luận");
                              setSnackbarOpen(true);
                            }
                          } catch (err) {
                            console.error("Error refreshing comments:", err);
                          }
                        }
                      }}
                      sx={{ color: "#155E64" }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Hiển thị các comment đã có */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    mb: 3,
                  }}
                >
                  {(() => {
                    const comments =
                      selectedQuotationDetails?.Comments ||
                      selectedQuotationDetails?.comments ||
                      [];
                    if (comments.length === 0) {
                      return (
                        <Typography color="text.secondary">
                          Chưa có bình luận nào.
                        </Typography>
                      );
                    }
                    return comments.map((comment, index) => {
                      const label = String.fromCharCode(65 + index); // A, B, C, D...
                      return (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 2,
                          }}
                        >
                          {/* Box label (A, B, C...) */}
                          <Box
                            sx={{
                              minWidth: 40,
                              height: 40,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#f5f5f5",
                              border: "2px solid #ddd",
                              borderRadius: 1,
                              fontWeight: "bold",
                              fontSize: "1.1rem",
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
                              sx={{
                                mb: 0.5,
                                display: "block",
                                fontSize: "0.75rem",
                              }}
                            >
                              {comment.FullName ||
                                comment.fullName ||
                                "Ẩn danh"}
                            </Typography>
                            <TextField
                              value={comment.Content || comment.content || ""}
                              placeholder="Không có nội dung"
                              multiline
                              fullWidth
                              InputProps={{
                                readOnly: true,
                              }}
                              sx={{
                                "& .MuiInputBase-root": {
                                  backgroundColor: "#fafafa",
                                },
                                "& .MuiInputBase-input": {
                                  cursor: "default",
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
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  {/* Box label cho comment mới */}
                  <Box
                    sx={{
                      minWidth: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f5f5f5",
                      border: "2px solid #ddd",
                      borderRadius: 1,
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      flexShrink: 0,
                    }}
                  >
                    {String.fromCharCode(
                      65 +
                        (
                          selectedQuotationDetails?.Comments ||
                          selectedQuotationDetails?.comments ||
                          []
                        ).length
                    )}
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
                      backgroundColor: "#155E64",
                      "&:hover": { backgroundColor: "#0D4F52" },
                      "&:disabled": {
                        backgroundColor: "#ccc",
                      },
                      minWidth: 100,
                      boxShadow: 2,
                      alignSelf: "flex-start",
                    }}
                  >
                    {isSubmittingComment ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Gửi"
                    )}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDetailDialogOpen(false);
              setCommentInput(""); // Reset comment when closing
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Sửa báo giá
          </Typography>
        </DialogTitle>
        <DialogContent>
          {editInitialData && (
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
              <Box>
                {/* Thông tin báo giá - Layout 2 cột */}
                <Box sx={{ mb: 3, display: "flex", gap: 4 }}>
                  {/* Bên trái: Mã yêu cầu báo giá, Mã báo giá và Trạng thái */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Mã yêu cầu báo giá:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {editInitialData.RequestCode ||
                          editInitialData.requestCode ||
                          "-"}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Mã báo giá:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {editInitialData.QuotationCode ||
                          editInitialData.quotationCode ||
                          "-"}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Trạng thái:
                      </Typography>
                      <Chip
                        label={getStatusLabel(
                          editInitialData.Status !== undefined
                            ? editInitialData.Status
                            : editInitialData.status
                        )}
                        size="small"
                        sx={getStatusColor(
                          editInitialData.Status !== undefined
                            ? editInitialData.Status
                            : editInitialData.status
                        )}
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
                        {formatDate(
                          editInitialData.QuotationDate ||
                            editInitialData.quotationDate
                        )}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Ngày hết hạn:
                      </Typography>
                      <DatePicker
                        value={editFormData.expiredDate}
                        onChange={(newValue) => {
                          setEditFormData((prev) => ({
                            ...prev,
                            expiredDate: newValue,
                          }));
                        }}
                        format="DD/MM/YYYY"
                        slotProps={{
                          textField: {
                            variant: "standard",
                            fullWidth: true,
                            error: false,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Error Alert */}
                {editError && (
                  <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setEditError(null)}
                  >
                    {editError}
                  </Alert>
                )}

                {/* Form fields */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                      label="Phần trăm cọc (%)"
                      type="number"
                      value={editFormData.depositPercent}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        if (value >= 0 && value <= 70) {
                          setEditFormData((prev) => ({
                            ...prev,
                            depositPercent: value,
                          }));
                        }
                      }}
                      inputProps={{ min: 0, max: 70, step: 0.01 }}
                      fullWidth
                      variant="standard"
                    />
                    <TextField
                      label="Thời hạn thanh toán cọc (ngày)"
                      type="number"
                      value={editFormData.depositDueDays}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10) || 1;
                        if (value >= 1 && value <= 365) {
                          setEditFormData((prev) => ({
                            ...prev,
                            depositDueDays: value,
                          }));
                        }
                      }}
                      inputProps={{ min: 1, max: 365 }}
                      fullWidth
                      variant="standard"
                      error={
                        editFormData.expectedDeliveryDate !== undefined &&
                        editFormData.depositDueDays >=
                          editFormData.expectedDeliveryDate
                      }
                      helperText={
                        editFormData.expectedDeliveryDate !== undefined &&
                        editFormData.depositDueDays >=
                          editFormData.expectedDeliveryDate
                          ? "Thời hạn thanh toán cọc phải nhỏ hơn thời hạn giao hàng dự kiến"
                          : ""
                      }
                    />
                    <TextField
                      label="Thời hạn giao hàng (ngày)"
                      type="number"
                      value={editFormData.expectedDeliveryDate}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10) || 1;
                        if (value >= 1 && value <= 365) {
                          setEditFormData((prev) => ({
                            ...prev,
                            expectedDeliveryDate: value,
                          }));
                        }
                      }}
                      inputProps={{ min: 1, max: 365 }}
                      fullWidth
                      variant="standard"
                    />
                  </Box>
                </Box>

                {/* Danh sách sản phẩm - Chỉnh sửa ghi chú */}
                <Box sx={{ mb: 2 }}>
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
                    sx={{ maxHeight: "500px", overflow: "auto" }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              width: "50px",
                              textAlign: "center",
                              backgroundColor: "#f5f5f5",
                            }}
                          >
                            STT
                          </TableCell>
                          <TableCell sx={{ backgroundColor: "#f5f5f5" }}>
                            Tên sản phẩm
                          </TableCell>
                          <TableCell sx={{ backgroundColor: "#f5f5f5" }}>
                            Đơn vị
                          </TableCell>
                          <TableCell sx={{ backgroundColor: "#f5f5f5" }}>
                            Lô hàng (chọn theo ngày hết hạn)
                          </TableCell>
                          <TableCell sx={{ backgroundColor: "#f5f5f5" }}>
                            Thuế
                          </TableCell>
                          <TableCell
                            sx={{
                              textAlign: "right",
                              backgroundColor: "#f5f5f5",
                            }}
                          >
                            Thành tiền trước thuế
                          </TableCell>
                          <TableCell
                            sx={{
                              textAlign: "right",
                              backgroundColor: "#f5f5f5",
                            }}
                          >
                            Thành tiền sau thuế
                          </TableCell>
                          <TableCell sx={{ backgroundColor: "#f5f5f5" }}>
                            Ghi chú
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {editRows.length > 0 ? (
                          editRows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell sx={{ textAlign: "center" }}>
                                {row.id}
                              </TableCell>
                              <TableCell>{row.productName || "-"}</TableCell>
                              <TableCell>{row.unit || "-"}</TableCell>
                              <TableCell sx={{ minWidth: 200 }}>
                                {row.lotOptions && row.lotOptions.length > 0 ? (
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={
                                        row.lotId !== null &&
                                        row.lotId !== undefined
                                          ? row.lotId
                                          : "NONE"
                                      }
                                      onChange={(e) =>
                                        handleEditLotChange(
                                          row.id,
                                          e.target.value
                                        )
                                      }
                                    >
                                      {row.lotOptions.map((lot, idx) => (
                                        <MenuItem
                                          key={`${row.id}-${idx}`}
                                          value={
                                            lot.lotId !== null &&
                                            lot.lotId !== undefined
                                              ? lot.lotId
                                              : "NONE"
                                          }
                                        >
                                          {lot.displayLabel ||
                                            (lot.lotId
                                              ? `Lô ${lot.lotId}`
                                              : "Không có lô")}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Hết lô hàng
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ minWidth: 150 }}>
                                {row.taxOptions && row.taxOptions.length > 0 ? (
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={
                                        row.taxId ??
                                        row.taxOptions[0]?.id ??
                                        row.taxOptions[0]?.Id ??
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleEditTaxChange(
                                          row.id,
                                          e.target.value
                                        )
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
                              <TableCell sx={{ textAlign: "right" }}>
                                {row.totalBeforeTax !== undefined
                                  ? renderCurrency(row.totalBeforeTax)
                                  : "-"}
                              </TableCell>
                              <TableCell sx={{ textAlign: "right" }}>
                                {row.totalAfterTax !== undefined
                                  ? renderCurrency(row.totalAfterTax)
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <TextField
                                  value={row.note || ""}
                                  onChange={(e) =>
                                    handleEditNoteChange(row.id, e.target.value)
                                  }
                                  variant="standard"
                                  size="small"
                                  fullWidth
                                  placeholder="Nhập ghi chú"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              align="center"
                              sx={{ py: 3 }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
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
            </LocalizationProvider>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={updateLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleUpdateQuotation}
            variant="contained"
            disabled={updateLoading}
            sx={{
              backgroundColor: "#155E64",
              "&:hover": {
                backgroundColor: "#0D4F52",
              },
            }}
          >
            {updateLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Cập nhật"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SalesQuotationList;
