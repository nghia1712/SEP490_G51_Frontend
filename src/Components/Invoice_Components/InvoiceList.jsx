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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PaidIcon from "@mui/icons-material/Paid";
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
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("3");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [creatingPaymentRemain, setCreatingPaymentRemain] = useState(false);

  const applyStatusFilter = useCallback(
    (data) => {
      if (statusFilter === "all") return data;
      const filterStatus = Number(statusFilter);
      return data.filter((invoice) => invoice.status === filterStatus);
    },
    [statusFilter]
  );

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoiceAPI.getInvoiceList();
      // Backend trả về: { success, message, data: List<InvoiceDTO> }
      const invoiceList = response.data?.data || response.data || [];

      if (Array.isArray(invoiceList)) {
        const mappedInvoices = invoiceList.map((invoice) => ({
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
          totalAmount: invoice.totalAmount || invoice.TotalAmount || 0,
        }));
        setAllInvoices(mappedInvoices);
        setInvoices(applyStatusFilter(mappedInvoices));
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
  }, [statusFilter]);

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

  const getStatusLabel = (status) => {
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

  const getStatusColor = (status) => {
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
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleView = (invoiceId) => {
    // Navigate to invoice detail page
    navigate(`/accountant/invoices/${invoiceId}`);
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

  const handleOpenPaymentRemainDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMethod("3");
    setPaymentAmount("");
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentRemainDialog = () => {
    if (creatingPaymentRemain) return;
    setPaymentDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleCreatePaymentRemain = async () => {
    if (!selectedInvoice) return;
    setCreatingPaymentRemain(true);
    try {
      const payload = {
        invoiceId: selectedInvoice.id,
        paymentMethod: Number(paymentMethod),
        paymentType: 1,
      };
      if (paymentAmount !== "") {
        payload.amount = Number(paymentAmount);
      }
      await paymentRemainAPI.createPaymentRemainRequest(payload);
      setSnackbarMessage("Đã tạo yêu cầu thanh toán phần còn lại");
      setSnackbarOpen(true);
      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
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
    } else if (invoice.status === 1) {
      actions.push(
        <Tooltip key="payment-remain" title="Tạo yêu cầu thanh toán">
          <IconButton
            size="small"
            onClick={() => handleOpenPaymentRemainDialog(invoice)}
            sx={{ color: "#0288d1" }}
          >
            <PaidIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }

    actions.push(
      <Tooltip key="view" title="Xem">
        <IconButton
          size="small"
          onClick={() => handleView(invoice.id)}
          sx={{ color: "#1976d2" }}
        >
          <VisibilityIcon fontSize="small" />
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
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
            >
              Hóa đơn
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Tổng: {paginatedInvoices.length} hóa đơn
            </Typography>
          </Box>

          <Paper
            sx={{ p: 2, mb: 2, backgroundColor: "#f8fafc", borderRadius: 2 }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems="center"
              spacing={2}
            >
              <FormControl size="small" sx={{ minWidth: 200 }}>
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
                      sx={{ width: "18%", py: 1.5, px: 2, textAlign: "right" }}
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
                      Hành động
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
                            label={getStatusLabel(invoice.status)}
                            size="small"
                            sx={getStatusColor(invoice.status)}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "right",
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
      <Dialog
        open={paymentDialogOpen}
        onClose={handleClosePaymentRemainDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Tạo yêu cầu thanh toán phần còn lại</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
            Hóa đơn: <strong>{selectedInvoice?.invoiceCode}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Tổng tiền:{" "}
            {selectedInvoice
              ? formatCurrency(selectedInvoice.totalAmount)
              : "-"}
          </Typography>
          <FormControl fullWidth margin="dense">
            <InputLabel id="payment-method-label">
              Phương thức thanh toán
            </InputLabel>
            <Select
              labelId="payment-method-label"
              value={paymentMethod}
              label="Phương thức thanh toán"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <MenuItem value="1">VNPAY</MenuItem>
              <MenuItem value="2">Tiền mặt</MenuItem>
              <MenuItem value="3">Chuyển khoản</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Số tiền yêu cầu (để trống nếu thu hết phần còn lại)"
            type="number"
            fullWidth
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClosePaymentRemainDialog}
            disabled={creatingPaymentRemain}
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreatePaymentRemain}
            variant="contained"
            disabled={creatingPaymentRemain}
          >
            {creatingPaymentRemain ? "Đang tạo..." : "Tạo yêu cầu"}
          </Button>
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
