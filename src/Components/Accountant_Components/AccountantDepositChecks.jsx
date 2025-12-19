import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  TextField,
  Container,
  Card,
  CardContent,
  Stack,
  TextField as MuiTextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { format } from "date-fns";
import paymentAPI from "../../API/paymentAPI";
import SearchIcon from "@mui/icons-material/Search";
import PaymentIcon from "@mui/icons-material/Payment";

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "-";
  const number = Number(value);
  if (Number.isNaN(number)) return "-";
  return number.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm");
  } catch {
    return "-";
  }
};

const getStatusChip = (status) => {
  // DepositCheckStatus: 0 = Chờ xử lý, 1 = Chấp nhận, 2 = Từ chối
  switch (status) {
    case 0:
      return <Chip label="Chờ xử lý" size="small" color="warning" />;
    case 1:
      return <Chip label="Đã chấp nhận" size="small" color="success" />;
    case 2:
      return <Chip label="Đã từ chối" size="small" color="error" />;
    default:
      return <Chip label="Không rõ" size="small" />;
  }
};

const mapPaymentMethod = (method) => {
  // PaymentMethod enum: 0 None, 1 VnPay, 2 Cash, 3 BankTransfer
  switch (method) {
    case 1:
      return "VNPay";
    case 2:
      return "Tiền mặt";
    case 3:
      return "Chuyển khoản";
    default:
      return "Khác";
  }
};

const AccountantDepositChecks = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [Reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentAPI.getAllManualDepositChecks();
      const data = res?.data?.data ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        "Không thể tải danh sách yêu cầu xác nhận thanh toán.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  const handleApprove = async (id) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await paymentAPI.approveManualDepositCheck(id);
      
      // Optimistic update: Update local state immediately
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, status: 1 } : item // 1 = Chấp nhận
        )
      );
      
      // Update selectedItem if it's the same item
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, status: 1 }); // Chấp nhận
      }
      
      // Close dialog
      setDetailDialogOpen(false);
      
      // Then fetch fresh data from server (with a small delay to ensure backend has updated)
      setTimeout(async () => {
        await fetchData();
      }, 500);
    } catch (err) {
      console.error("Approve deposit check error:", err);
      // Revert optimistic update on error by fetching fresh data
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (item) => {
    if (item) {
      setSelectedItem(item);
    }
    setReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedItem?.id) return;
    // Validate Reason is not empty (backend requirement)
    const rejectReason = Reason?.trim();
    if (!rejectReason) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }
    const itemId = selectedItem.id;
    setActionLoading(true);
    try {
      await paymentAPI.rejectManualDepositCheck(itemId, {
        Reason: rejectReason,
      });
      
      // Optimistic update: Update local state immediately
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? { ...item, status: 2, Reason: rejectReason } // 2 = Từ chối
            : item
        )
      );
      
      // Update selectedItem immediately
      if (selectedItem) {
        setSelectedItem({
          ...selectedItem,
          status: 2, // Từ chối
          Reason: rejectReason,
        });
      }
      
      // Close dialogs
      setRejectDialogOpen(false);
      setDetailDialogOpen(false);
      setReason("");
      
      // Then fetch fresh data from server (with a small delay to ensure backend has updated)
      setTimeout(async () => {
        await fetchData();
      }, 500);
    } catch (err) {
      console.error("Reject deposit check error:", err);
      const errorMsg = err?.response?.data?.message || err?.response?.data?.Message || "Có lỗi xảy ra khi từ chối yêu cầu.";
      alert(errorMsg);
      // Revert optimistic update on error by fetching fresh data
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = items
    .filter((item) => {
      if (statusFilter === "") return true;
      // "pending" = Chờ xử lý (0)
      if (statusFilter === "pending") {
        return item.status === 0;
      }
      return item.status === Number(statusFilter);
    })
    .filter((item) => {
      const keyword = search.toLowerCase().trim();
      if (!keyword) return true;
      return (
        (item.salesOrderCode || "").toLowerCase().includes(keyword) ||
        (item.customerName || "").toLowerCase().includes(keyword)
      );
    })
    .sort((a, b) => (b.id || 0) - (a.id || 0));

  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <PaymentIcon sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  flexGrow: 1,
                  color: "#1976d2",
                  textTransform: "uppercase",
                }}
              >
                Xác nhận thanh toán
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mr: 2 }}>
                Tổng: {filteredItems.length} / {items.length} yêu cầu
              </Typography>
            </Box>

            {/* FILTER */}
            <Paper
              sx={{ p: 2, mb: 2, backgroundColor: "#f8fafc", borderRadius: 2 }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ width: "100%" }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <MuiTextField
                    placeholder="Tìm theo mã đơn/ tên khách hàng..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                      flexGrow: 1,
                      maxWidth: { xs: "100%", md: 400 },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Trạng thái"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="pending">Chờ xử lý</MenuItem>
                      <MenuItem value="1">Đã chấp nhận</MenuItem>
                      <MenuItem value="2">Đã từ chối</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
            </Paper>

            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            {/* TABLE */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>STT</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Mã đơn hàng</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Khách hàng</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Số tiền yêu cầu</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Thời gian yêu cầu</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Thao tác
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Không có yêu cầu xác nhận thanh toán nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item, index) => (
                <TableRow key={item.id || index} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.salesOrderCode || "-"}</TableCell>
                  <TableCell>{item.customerName || "-"}</TableCell>
                  <TableCell>
                    {formatCurrency(item.requestedAmount ?? item.amount)}
                  </TableCell>
                  <TableCell>{getStatusChip(item.status)}</TableCell>
                  <TableCell>{formatDateTime(item.requestedAt)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      {item.status === 0 && (
                        <>
                          <Tooltip title="Chấp nhận thanh toán">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprove(item.id)}
                              sx={{ ml: 0.5 }}
                            >
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Từ chối yêu cầu">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenReject(item)}
                              sx={{ ml: 0.5 }}
                            >
                              <HighlightOffIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDetail(item)}
                          sx={{ ml: 0.5 }}
                        >
                          <VisibilityIcon fontSize="small" color="primary" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
          </CardContent>
        </Card>
      </Container>

      {/* Chi tiết yêu cầu */}
      <Dialog
        open={detailDialogOpen && !!selectedItem}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chi tiết yêu cầu xác nhận thanh toán</DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography>
                <strong>Mã đơn hàng:</strong> {selectedItem.salesOrderCode || "-"}
              </Typography>
              <Typography>
                <strong>Khách hàng:</strong> {selectedItem.customerName || "-"}
              </Typography>
              <Typography>
                <strong>Số tiền khách báo đã thanh toán:</strong>{" "}
                {formatCurrency(selectedItem.requestedAmount ?? selectedItem.amount)}
              </Typography>
              <Typography>
                <strong>Trạng thái:</strong> {getStatusChip(selectedItem.status)}
              </Typography>
              <Typography>
                <strong>Thời gian yêu cầu:</strong>{" "}
                {formatDateTime(selectedItem.requestedAt)}
              </Typography>
              {selectedItem.customerNote && (
                <Typography>
                  <strong>Ghi chú của khách hàng:</strong>{" "}
                  {selectedItem.customerNote}
                </Typography>
              )}
              {selectedItem.Reason && (
                <Typography color="error">
                  <strong>Lý do từ chối:</strong> {selectedItem.Reason}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
          {selectedItem && selectedItem.status === 0 && (
            <>
              <Button
                color="error"
                onClick={() => handleOpenReject(selectedItem)}
                disabled={actionLoading}
                startIcon={<HighlightOffIcon />}
              >
                Từ chối
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => handleApprove(selectedItem.id)}
                disabled={actionLoading}
              >
                Chấp nhận thanh toán
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog nhập lý do từ chối */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Từ chối yêu cầu xác nhận thanh toán</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Vui lòng nhập lý do từ chối <strong>(bắt buộc)</strong>.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={Reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Lý do từ chối..."
            error={!Reason?.trim() && Reason !== ""}
            helperText={!Reason?.trim() && Reason !== "" ? "Lý do từ chối là bắt buộc" : ""}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Hủy</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmReject}
            disabled={actionLoading || !Reason?.trim()}
          >
            Xác nhận từ chối
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountantDepositChecks;

