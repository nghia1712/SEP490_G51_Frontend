import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Pagination,
} from "@mui/material";
import {
  Search,
  Visibility,
  Delete,
  Send,
  Add,
  Edit,
  NoteAdd,
  WarningAmber,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useStockExport from "../../../Hooks/useStockExport";
import useGIN from "../../../Hooks/useGIN";
import getUserRoleFromToken from "../../../Utils/getUserRoleFromToken";

export default function StockExportList() {
  const { data, loading, refetch, deleteOrder, sendOrder } = useStockExport();
  const { createGIN, notEnoughGIN } = useGIN();
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState(null);
  const [search, setSearch] = useState("");
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmData, setConfirmData] = useState({ open: false, id: null });
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const { data: detailData, loading: detailLoading } = useStockExport(viewId);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);
    refetch();
  }, []);

  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, message: msg, severity });
  const openConfirm = (id) => setConfirmData({ open: true, id });
  const closeConfirm = () => setConfirmData({ open: false, id: null });

  const handleConfirmDelete = async () => {
    const res = await deleteOrder(confirmData.id);
    closeConfirm();
    if (res.success) {
      showSnack("Xóa thành công!");
      refetch();
    } else showSnack("Xóa thất bại!", "error");
  };

  const handleSend = async (id, status) => {
    if (status !== 0)
      return showSnack("Chỉ gửi được khi đang Nháp!", "warning");
    const res = await sendOrder(id);
    if (res.success) {
      showSnack("Gửi thành công!");
      refetch();
    } else showSnack("Gửi thất bại!", "error");
  };

  const handleNotEnough = async (item) => {
    const res = await notEnoughGIN(item.id);

    if (res.success) {
      showSnack(res.message, "success");
      refetch();
    } else {
      showSnack(res.message, "error");
    }
  };

  const getStatus = (status) => {
    switch (status) {
      case 0:
        return { label: "Nháp", color: "default" };
      case 1:
        return { label: "Chở xử lý", color: "info" };
      case 2:
        return { label: "Đã có phiếu xuất", color: "success" };
      case 3:
        return { label: "Không đủ hàng", color: "secondary" };
      case 4:
        return { label: "Quá hạn", color: "error" };
      default:
        return { label: "Không xác định", color: "default" };
    }
  };

  const filteredList = (Array.isArray(data) ? data : []).filter((item) => {
    const keyword = search.toLowerCase();

    const statusText = getStatus(item.status).label.toLowerCase();

    return (
      (item.stockExportOrderCode || "").toLowerCase().includes(keyword) ||
      (item.salesOrderCode || "").toLowerCase().includes(keyword) ||
      (item.createBy || "").toLowerCase().includes(keyword)
    );
  });

  const totalPages = Math.ceil(filteredList.length / pageSize);
  const paginatedData = filteredList.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => setPage(1), [search]);

  const handleViewDetail = (item) => {
    setViewId(item.id);
    setDetailOpen(true);
  };
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setViewId(null);
  };

  const [notEnoughMap, setNotEnoughMap] = useState({});

  const handleCreateGIN = async (item) => {
    const payload = {
      stockExportOrderId: item.id,
      note: `Tạo phiếu xuất kho từ yêu cầu ${item.salesOrderCode}`,
    };

    try {
      const res = await createGIN(payload);

      // Nếu API báo thất bại
      if (!res.success) {
        const msg =
          res?.message ||
          res?.error?.response?.data?.message ||
          "Tạo phiếu xuất kho thất bại";

        // Kiểm tra message "không đủ hàng"
        if (/không đủ hàng/i.test(msg)) {
          showSnack(msg, "error");
          setNotEnoughMap((prev) => {
            const updated = { ...prev, [item.id]: true };
            localStorage.setItem("notEnoughMap", JSON.stringify(updated));
            return updated;
          });
          return;
        }

        showSnack(msg, "error");
        return;
      }

      // Nếu tạo thành công
      showSnack("Tạo phiếu xuất kho thành công!", "success");
      setNotEnoughMap((prev) => {
        const updated = { ...prev, [item.id]: false };
        localStorage.setItem("notEnoughMap", JSON.stringify(updated));
        return updated;
      });
      refetch();
    } catch (error) {
      const msg =
        error?.response?.data?.message || "Tạo phiếu xuất kho thất bại";
      showSnack(msg, "error");
    }
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("notEnoughMap") || "{}");
    setNotEnoughMap(saved);
  }, []);

  return (
    <Box p={3}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight="bold">
          Yêu cầu xuất kho
        </Typography>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <TextField
            variant="outlined"
            size="small"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />

          {/* Chỉ show nút create với sales_staff */}
          {userRole === "sales_staff" && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/stock-export/create")}
            >
              Tạo yêu cầu xuất kho
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Table */}
      <Paper elevation={2}>
        {loading ? (
          <Stack alignItems="center" p={3}>
            <CircularProgress />
          </Stack>
        ) : (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead sx={{ background: "#eee", fontWeight: "bold" }}>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell align="center">Yêu cầu xuất kho</TableCell>
                  <TableCell>Mã đơn hàng</TableCell>
                  <TableCell>Ngày gửi yêu cầu</TableCell>
                  <TableCell>Ngày giao hàng</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell>Người tạo</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell align="center">
                        {item.stockExportOrderCode}
                      </TableCell>
                      <TableCell>{item.salesOrderCode}</TableCell>
                      <TableCell>
                        {item.requestDate
                          ? new Date(item.requestDate).toLocaleDateString(
                              "vi-EN"
                            )
                          : ""}
                      </TableCell>
                      <TableCell>
                        {item.dueDate
                          ? new Date(item.dueDate).toLocaleDateString("vi-EN")
                          : ""}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatus(item.status).label}
                          color={getStatus(item.status).color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.createBy}</TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                        >
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              color="primary"
                              onClick={() => handleViewDetail(item)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>

                          {/* Chỉ show tạo GIN với warehouse_staff */}
                          {userRole === "warehouse_staff" &&
                            item.status === 1 &&
                            !notEnoughMap[item.id] && (
                              <Tooltip title="Tạo phiếu xuất kho">
                                <IconButton
                                  color="secondary"
                                  onClick={() => handleCreateGIN(item)}
                                >
                                  <NoteAdd />
                                </IconButton>
                              </Tooltip>
                            )}

                          {userRole === "warehouse_staff" &&
                            item.status === 1 &&
                            notEnoughMap[item.id] && (
                              <Tooltip title="Báo kho không đủ hàng">
                                <IconButton
                                  color="warning"
                                  onClick={() => handleNotEnough(item)}
                                >
                                  <WarningAmber />
                                </IconButton>
                              </Tooltip>
                            )}

                          {item.status === 0 && (
                            <>
                              <Tooltip title="Sửa">
                                <IconButton
                                  color="info"
                                  onClick={() =>
                                    navigate(`/stock-export/edit/${item.id}`, {
                                      state: { salesOrderId: item.soId },
                                    })
                                  }
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa">
                                <IconButton
                                  color="error"
                                  onClick={() => openConfirm(item.id)}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Gửi">
                                <IconButton
                                  color="success"
                                  onClick={() =>
                                    handleSend(item.id, item.status)
                                  }
                                >
                                  <Send />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {filteredList.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết yêu cầu xuất kho</DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Stack alignItems="center" p={3}>
              <CircularProgress />
            </Stack>
          ) : detailData ? (
            <Box>
              <Typography>
                <b>Mã đơn hàng:</b> {detailData.salesOrderCode}
              </Typography>
              <Typography>
                <b>Người tạo:</b> {detailData.createBy}
              </Typography>
              <Typography>
                <b>Ngày gửi:</b>{" "}
                {detailData.requestDate
                  ? new Date(detailData.requestDate).toLocaleDateString("vi-EN")
                  : "—"}
              </Typography>
              <Typography>
                <b>Ngày giao hàng:</b>{" "}
                {detailData.dueDate
                  ? new Date(detailData.dueDate).toLocaleDateString("vi-EN")
                  : "—"}
              </Typography>
              <Typography>
                <b>Trạng thái:</b>{" "}
                <Chip
                  label={getStatus(detailData.status).label}
                  color={getStatus(detailData.status).color}
                  size="small"
                />
              </Typography>

              <Typography variant="h6" sx={{ mt: 2 }}>
                Danh sách sản phẩm
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Tên SP</TableCell>
                    <TableCell>Hạn dùng</TableCell>
                    <TableCell>Số lượng</TableCell>
                    <TableCell>Đơn vị</TableCell>
                    <TableCell>Kho</TableCell>
                    <TableCell>Vị trí</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailData.details?.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{d.productName}</TableCell>
                      <TableCell>
                        {new Date(d.expiredDate).toLocaleDateString("vi-EN")}
                      </TableCell>
                      <TableCell>{d.quantity}</TableCell>
                      <TableCell>{d.unit}</TableCell>
                      <TableCell>{d.warehouseName}</TableCell>
                      <TableCell>{d.locationName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography>Không có dữ liệu</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={confirmData.open} onClose={closeConfirm}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn xóa yêu cầu này không?
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Hủy</Button>
          <Button color="error" onClick={handleConfirmDelete}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
