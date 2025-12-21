import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  TableSortLabel,
  Pagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Stack,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PaidIcon from "@mui/icons-material/Paid";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import invoiceAPI from "../../API/invoiceAPI";
import paymentRemainAPI from "../../API/paymentRemainAPI";
import { filterProps } from "framer-motion";

const headerTextSx = {
  textTransform: "uppercase",
  fontWeight: 600,
  letterSpacing: "0.03em",
};

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [creatingPaymentRemain, setCreatingPaymentRemain] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const applyStatusFilter = useCallback(
    (data) => {
      let filtered = data;
      
      // Apply status filter
      if (statusFilter !== "all") {
        if (statusFilter === "paid") {
          // Filter for paid invoices
          filtered = filtered.filter((invoice) => invoice.isPaid === true);
        } else {
          const filterStatus = Number(statusFilter);
          filtered = filtered.filter((invoice) => invoice.status === filterStatus);
        }
      }
      
      // Apply search filter
      if (search.trim()) {
        const keyword = search.toLowerCase().trim();
        filtered = filtered.filter(
          (invoice) =>
            (invoice.invoiceCode || "").toLowerCase().includes(keyword) ||
            (invoice.orderCode || "").toLowerCase().includes(keyword) ||
            (invoice.customerCode || "").toLowerCase().includes(keyword)
        );
      }
      
      return filtered;
    },
    [statusFilter, search]
  );

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoiceAPI.getInvoiceList();
      // Backend trả về: { success, message, data: List<InvoiceDTO> }
      const invoiceList = response.data?.data || response.data || [];

      if (Array.isArray(invoiceList)) {
        const mappedInvoices = invoiceList.map((invoice) => {
          const totalAmount = invoice.totalAmount || invoice.TotalAmount || 0;
          const totalPaid = invoice.totalPaid || invoice.TotalPaid || 0;
          const totalRemain = invoice.totalRemain || invoice.TotalRemain || totalAmount;
          const isPaid = totalRemain === 0 || totalPaid >= totalAmount;
          
          return {
            id: invoice.id || invoice.Id,
            invoiceCode: invoice.invoiceCode || invoice.InvoiceCode || "-",
            customerCode: invoice.customerCode || invoice.CustomerCode || "-", // Cần lấy từ SalesOrder
            orderCode:
              invoice.salesOrderCode ||
              invoice.SalesOrderCode ||
              `SO-${invoice.salesOrderId || invoice.SalesOrderId}`,
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
            totalAmount,
            totalPaid,
            totalRemain,
            isPaid,
          };
        });
        
        // Remove duplicates dựa trên id hoặc invoiceCode
        const uniqueInvoices = mappedInvoices.reduce((acc, current) => {
          const existing = acc.find(
            (item) =>
              item.id === current.id ||
              item.invoiceCode === current.invoiceCode
          );
          if (!existing) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        setAllInvoices(uniqueInvoices);
        setInvoices(applyStatusFilter(uniqueInvoices));
      } else {
        setAllInvoices([]);
        setInvoices([]);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể tải danh sách hóa đơn";
      setError(errorMessage);
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
  }, [statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(invoices.length / pageSize));

  const sortedInvoices = useMemo(() => {
    // Nếu không có sortConfig.key, mặc định sort theo createdAt từ mới nhất đến cũ nhất
    const effectiveSortConfig = sortConfig.key
      ? sortConfig
      : { key: "createdAt", direction: "desc" };

    const sorted = [...invoices].sort((a, b) => {
      let aValue = a[effectiveSortConfig.key];
      let bValue = b[effectiveSortConfig.key];

      if (effectiveSortConfig.key === "createdAt") {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (effectiveSortConfig.key === "totalAmount") {
        aValue = Number(aValue || 0);
        bValue = Number(bValue || 0);
      } else {
        aValue = String(aValue || "").toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }

      if (aValue < bValue)
        return effectiveSortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue)
        return effectiveSortConfig.direction === "asc" ? 1 : -1;
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
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusLabel = (invoice) => {
    // Check if invoice is paid first
    if (invoice.isPaid) {
      return "Đã thanh toán";
    }
    
    // Otherwise, use invoice status
    const status = invoice.status;
    switch (status) {
      case 0:
        return "Nháp"; // Draft
      case 1:
        return "Đã Gửi"; // Send
      case 2:
        return "Đã Hủy"; // Cancelled
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (invoice) => {
    // Check if invoice is paid first
    if (invoice.isPaid) {
      return { backgroundColor: "#2e7d32", color: "#fff" }; // Paid - Green
    }
    
    // Otherwise, use invoice status
    const status = invoice.status;
    switch (status) {
      case 0:
        return { backgroundColor: "#9e9e9e", color: "#fff" }; // Draft - Gray
      case 1:
        return { backgroundColor: "#2196f3", color: "#fff" }; // Send - Blue
      case 2:
        return { backgroundColor: "#f44336", color: "#fff" }; // Cancelled - Red
      default:
        return { backgroundColor: "#757575", color: "#fff" };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0 ₫";
    // Format với dấu phẩy (,) thay vì dấu chấm (.)
    const formatted = new Intl.NumberFormat("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    // Thay dấu chấm thành dấu phẩy và thêm ký hiệu ₫
    return formatted.replace(/\./g, ",") + " ₫";
  };

  const handleView = async (invoiceId) => {
    setDetailDialogOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setInvoiceDetail(null);
    
    try {
      const response = await invoiceAPI.getInvoiceById(invoiceId);
      const data = response?.data?.data || response?.data;
      setInvoiceDetail(data);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể tải chi tiết hóa đơn";
      setDetailError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setInvoiceDetail(null);
    setDetailError(null);
  };

  const handleEdit = (invoiceId) => {
    // Navigate to invoice edit page (chỉ cho phép edit khi status = Draft)
    navigate(`/accountant/invoices/${invoiceId}/edit`);
  };

  const handleSend = async (invoiceId) => {
    try {
      await invoiceAPI.sendInvoiceEmail(invoiceId);
      setSnackbarMessage("Gửi hóa đơn thành công");
      setSnackbarOpen(true);
      fetchInvoices();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể gửi hóa đơn";
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handleCreateInvoice = () => {
    navigate("/accountant/invoices/create");
  };

  const handleCreatePaymentRemainDirect = async (invoice) => {
    if (!invoice) return;
    setCreatingPaymentRemain(true);
    try {
      // Tạo yêu cầu thanh toán với số tiền đầy đủ (totalRemain)
      const payload = {
        invoiceId: invoice.id,
        paymentMethod: 3, // Chuyển khoản (mặc định)
        paymentType: 1,
        // Không truyền amount để thu hết phần còn lại
      };
      await paymentRemainAPI.createPaymentRemainRequest(payload);
      setSnackbarMessage("Đã tạo yêu cầu thanh toán phần còn lại");
      setSnackbarOpen(true);
      fetchInvoices();
      navigate("/payment-remain");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể tạo yêu cầu thanh toán";
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setCreatingPaymentRemain(false);
    }
  };

  const handleDownloadPDF = async (invoiceId, invoiceCode) => {
    try {
      const response = await invoiceAPI.getInvoicePdf(invoiceId);
      // Tạo blob từ response
      const blob = new Blob([response.data], { type: "application/pdf" });
      // Tạo URL từ blob
      const url = window.URL.createObjectURL(blob);
      // Tạo link để download
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceCode || `invoice-${invoiceId}`}.pdf`;
      document.body.appendChild(link);
      link.click();
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSnackbarMessage("Tải PDF thành công");
      setSnackbarOpen(true);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể tải PDF hóa đơn";
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const renderActions = (invoice) => {
    const actions = [];

    // Show Edit/Delete/Send based on status
    if (invoice.status === 0) {
      // Draft - can edit, delete
      actions.push(
        <Tooltip key="edit" title="Sửa">
          <IconButton
            size="small"
            onClick={() => handleEdit(invoice.id)}
            sx={{ color: "#ed6c02" }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
      actions.push(
        <Tooltip key="delete" title="Xóa">
          <IconButton
            size="small"
            onClick={() => handleDelete(invoice)}
            sx={{ color: "#d32f2f" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
      actions.push(
        <Tooltip key="send" title="Gửi">
          <IconButton
            size="small"
            onClick={() => handleSend(invoice.id)}
            sx={{ color: "#2e7d32" }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    } else if (invoice.status === 1 && !invoice.isPaid) {
      // Only show payment remain button if invoice is sent but not paid yet
      actions.push(
        <Tooltip key="payment-remain" title="Tạo yêu cầu thanh toán">
          <IconButton
            size="small"
            onClick={() => handleCreatePaymentRemainDirect(invoice)}
            disabled={creatingPaymentRemain}
            sx={{ color: "#2e7d32" }}
          >
            <PaidIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }

    actions.push(
      <Tooltip key="view" title="Xem chi tiết">
        <IconButton
          size="small"
          onClick={() => handleView(invoice.id)}
          sx={{ color: "#1976d2" }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );

    actions.push(
      <Tooltip key="download" title="Tải PDF">
        <IconButton
          size="small"
          onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceCode)}
          sx={{ color: "#1976d2" }}
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );

    return (
      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
        {actions}
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <DescriptionIcon sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
            >
              Hóa đơn
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {invoices.length === allInvoices.length
                ? `Tổng: ${allInvoices.length} hóa đơn`
                : `Tổng: ${invoices.length} / ${allInvoices.length} hóa đơn`}
            </Typography>
          </Box>

          <Paper
            sx={{ p: 2, mb: 2, backgroundColor: "#f8fafc", borderRadius: 2 }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems="center"
              spacing={2}
              justifyContent="space-between"
              sx={{ width: "100%" }}
            >
              <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
                <TextField
                  placeholder="Tìm kiếm..."
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{
                    maxWidth: { xs: "100%", md: 300 },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Trạng Thái</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Trạng Thái"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="1">Đã Gửi</MenuItem>
                    <MenuItem value="2">Đã Hủy</MenuItem>
                    <MenuItem value="paid">Đã thanh toán</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </Paper>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: 2,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Table sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell
                      sx={{
                        width: "6%",
                        py: 1.5,
                        px: 2,
                        textAlign: "left",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      #
                    </TableCell>
                    <TableCell
                      sx={{
                        width: "22%",
                        py: 1.5,
                        px: 2,
                        textTransform: "none",
                        fontWeight: 500,
                      }}
                    >
                      <TableSortLabel
                        active={sortConfig.key === "invoiceCode"}
                        direction={
                          sortConfig.key === "invoiceCode"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("invoiceCode")}
                        sx={headerTextSx}
                      >
                        Mã hóa đơn
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: "22%", py: 1.5, px: 2 }}>
                      <TableSortLabel
                        active={sortConfig.key === "orderCode"}
                        direction={
                          sortConfig.key === "orderCode"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("orderCode")}
                        sx={headerTextSx}
                      >
                        Mã đơn hàng
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: "18%", py: 1.5, px: 2 }}>
                      <TableSortLabel
                        active={sortConfig.key === "createdAt"}
                        direction={
                          sortConfig.key === "createdAt"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("createdAt")}
                        sx={headerTextSx}
                      >
                        Ngày tạo
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: "14%", py: 1.5, px: 2 }}>
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
                      sx={{ width: "18%", py: 1.5, px: 2, textAlign: "center" }}
                    >
                      <TableSortLabel
                        active={sortConfig.key === "totalAmount"}
                        direction={
                          sortConfig.key === "totalAmount"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("totalAmount")}
                        sx={headerTextSx}
                      >
                        Tổng tiền
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        width: "18%",
                        py: 1.5,
                        px: 2,
                        textAlign: "right",
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
                      <TableCell
                        colSpan={7}
                        sx={{ textAlign: "center", py: 4 }}
                      >
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
                        <TableCell sx={{ fontWeight: 500 }}>
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 500, textTransform: "none" }}
                        >
                          {invoice.invoiceCode}
                        </TableCell>
                        <TableCell>{invoice.orderCode}</TableCell>
                        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(invoice)}
                            size="small"
                            sx={getStatusColor(invoice)}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "center",
                            fontWeight: 500,
                            textTransform: "none",
                          }}
                        >
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell align="right">
                          {renderActions(invoice)}
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

      {/* Dialog Chi tiết hóa đơn */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          fontWeight={"bold"}
          sx={{ textAlign: "center", fontSize: "1.4rem" }}
        >
          Chi tiết hóa đơn
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Stack alignItems="center" mt={3}>
              <CircularProgress />
            </Stack>
          ) : detailError ? (
            <Alert severity="error">{detailError}</Alert>
          ) : invoiceDetail ? (
            <>
              {/* Thông tin hóa đơn */}
              <Paper
                variant="outlined"
                sx={{ p: 2.5, borderRadius: 2, mb: 3 }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ mb: 2 }}
                >
                  Thông tin hóa đơn
                </Typography>
                <Stack spacing={1.2}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography color="text.secondary">Mã hóa đơn:</Typography>
                    <Typography fontWeight={500}>
                      {invoiceDetail.invoiceCode || invoiceDetail.InvoiceCode || "-"}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography color="text.secondary">Mã đơn hàng:</Typography>
                    <Typography fontWeight={500}>
                      {invoiceDetail.salesOrderCode ||
                        invoiceDetail.SalesOrderCode ||
                        "-"}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography color="text.secondary">Khách hàng:</Typography>
                    <Typography fontWeight={500}>
                      {invoiceDetail.customerName ||
                        invoiceDetail.CustomerName ||
                        "-"}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography color="text.secondary">Ngày tạo:</Typography>
                    <Typography fontWeight={500}>
                      {formatDate(
                        invoiceDetail.createdAt ||
                          invoiceDetail.CreatedAt ||
                          invoiceDetail.createAt ||
                          invoiceDetail.CreateAt
                      )}
                    </Typography>
                  </Box>
                  {(invoiceDetail.issuedAt || invoiceDetail.IssuedAt) && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography color="text.secondary">Ngày phát hành:</Typography>
                      <Typography fontWeight={500}>
                        {formatDate(
                          invoiceDetail.issuedAt || invoiceDetail.IssuedAt
                        )}
                      </Typography>
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography color="text.secondary">Trạng thái:</Typography>
                    <Chip
                      label={(() => {
                        const totalAmount = invoiceDetail.totalAmount || invoiceDetail.TotalAmount || 0;
                        const totalPaid = invoiceDetail.totalPaid || invoiceDetail.TotalPaid || 0;
                        const totalRemain = invoiceDetail.totalRemain || invoiceDetail.TotalRemain || totalAmount;
                        const isPaid = totalRemain === 0 || totalPaid >= totalAmount;
                        
                        if (isPaid) {
                          return "Đã thanh toán";
                        }
                        
                        const status = invoiceDetail.status !== undefined
                          ? invoiceDetail.status
                          : invoiceDetail.Status !== undefined
                          ? invoiceDetail.Status
                          : 0;
                        return getStatusLabel({ status, isPaid: false });
                      })()}
                      size="small"
                      sx={(() => {
                        const totalAmount = invoiceDetail.totalAmount || invoiceDetail.TotalAmount || 0;
                        const totalPaid = invoiceDetail.totalPaid || invoiceDetail.TotalPaid || 0;
                        const totalRemain = invoiceDetail.totalRemain || invoiceDetail.TotalRemain || totalAmount;
                        const isPaid = totalRemain === 0 || totalPaid >= totalAmount;
                        
                        if (isPaid) {
                          return { backgroundColor: "#2e7d32", color: "#fff" };
                        }
                        
                        const status = invoiceDetail.status !== undefined
                          ? invoiceDetail.status
                          : invoiceDetail.Status !== undefined
                          ? invoiceDetail.Status
                          : 0;
                        return getStatusColor({ status, isPaid: false });
                      })()}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography color="text.secondary">Tổng tiền:</Typography>
                    <Typography fontWeight={500}>
                      {formatCurrency(
                        invoiceDetail.totalAmount ||
                          invoiceDetail.TotalAmount ||
                          0
                      )}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
              {/* Chi tiết phiếu xuất kho */}
              {invoiceDetail.details &&
                Array.isArray(invoiceDetail.details) &&
                invoiceDetail.details.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      gutterBottom
                      sx={{ mb: 2 }}
                    >
                      Chi tiết phiếu xuất kho
                    </Typography>
                    <Table size="small">
                      <TableHead
                        sx={{
                          backgroundColor: "#f5f5f5",
                          "& .MuiTableCell-root": { fontWeight: "bold" },
                        }}
                      >
                        <TableRow>
                          <TableCell>STT</TableCell>
                          <TableCell>Mã phiếu xuất kho</TableCell>
                          <TableCell>Ngày xuất kho</TableCell>
                          <TableCell align="right">Số tiền</TableCell>
                          <TableCell align="right">Cọc đã phân bổ</TableCell>
                          <TableCell align="right">Đã thanh toán</TableCell>
                          <TableCell align="right">Còn lại</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoiceDetail.details.map((detail, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {detail.exportIndex || idx + 1}
                            </TableCell>
                            <TableCell>
                              {detail.goodsIssueNoteCode ||
                                detail.GoodsIssueNoteCode ||
                                `GIN-${detail.goodsIssueNoteId || detail.GoodsIssueNoteId || ""}`}
                            </TableCell>
                            <TableCell>
                              {formatDate(
                                detail.goodsIssueDate ||
                                  detail.GoodsIssueDate
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(
                                detail.goodsIssueAmount ||
                                  detail.GoodsIssueAmount ||
                                  0
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(
                                detail.allocatedDeposit ||
                                  detail.AllocatedDeposit ||
                                  0
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(
                                detail.totalPaidForNote ||
                                  detail.TotalPaidForNote ||
                                  0
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(
                                detail.noteBalance ||
                                  detail.NoteBalance ||
                                  0
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                )}
            </>
          ) : (
            <Typography>Không có dữ liệu</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={error ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default InvoiceList;
