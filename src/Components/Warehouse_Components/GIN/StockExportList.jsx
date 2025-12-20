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
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
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
  Storefront,
  FactCheck,
  HourglassEmpty,
  Cancel,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import useStockExport from "../../../Hooks/useStockExport";
import useGIN from "../../../Hooks/useGIN";
import StockExportModal from "./StockExportModal";
import getUserRoleFromToken from "../../../Utils/getUserRoleFromToken";
import { useRef } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function StockExportList() {
  const {
    data,
    loading,
    refetch,
    deleteOrder,
    sendOrder,
    checkReadyToExport,
    awaitStockExport,
    cancelStockExport,
  } = useStockExport();
  const isUserFilteringRef = useRef(false);

  const idleTimerRef = useRef(null);

  const { createGIN, notEnoughGIN } = useGIN();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState({
    open: false,
    item: null,
  });

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
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);
    refetch();
  }, []);

  useEffect(() => {
    if (state?.searchCode) {
      setSearch(state.searchCode);
      setPage(1);

      window.history.replaceState({}, document.title);
    }
  }, [state]);

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

  const handleAwaitStock = async (item) => {
    const res = await awaitStockExport(item.id);

    if (res.success) {
      showSnack("Đã chuyển sang trạng thái chờ hàng!", "success");
      refetch();
    } else {
      showSnack(res.message || "Chuyển trạng thái thất bại", "error");
    }
  };

  const handleCancelStockExport = async () => {
    const item = cancelConfirm.item;
    if (!item) return;

    const res = await cancelStockExport(item.id);

    if (res.success) {
      showSnack("Đã hủy yêu cầu xuất kho!", "success");
      refetch();
    } else {
      showSnack(res.message || "Hủy yêu cầu thất bại", "error");
    }

    setCancelConfirm({ open: false, item: null });
  };

  const handleCheckReady = async (item) => {
    const res = await checkReadyToExport(item.id);

    if (res.success) {
      showSnack(res.message || "Kho đủ hàng, sẵn sàng xuất!", "success");

      setNotEnoughMap((prev) => {
        const updated = { ...prev, [item.id]: false };
        localStorage.setItem("notEnoughMap", JSON.stringify(updated));
        return updated;
      });

      refetch();
      return;
    }

    const msg =
      res.message || res?.error?.response?.data?.message || "Kho không đủ hàng";

    showSnack(msg, "warning");

    setNotEnoughMap((prev) => {
      const updated = { ...prev, [item.id]: true };
      localStorage.setItem("notEnoughMap", JSON.stringify(updated));
      return updated;
    });
  };

  const getStatus = (status) => {
    switch (status) {
      case 0:
        return { label: "Nháp", color: "default" };
      case 1:
        return { label: "Chở xử lý", color: "warning" };
      case 2:
        return { label: "Đã có phiếu xuất", color: "success" };
      case 3:
        return { label: "Không đủ hàng", color: "secondary" };
      case 4:
        return { label: "Chờ hàng", color: "default" };
      case 5:
        return { label: "Đã hủy", color: "error" };
      case 6:
        return { label: "Đủ hàng", color: "primary" };
      default:
        return { label: "Không xác định", color: "default" };
    }
  };

  const filteredList = (Array.isArray(data) ? data : [])
    .filter((item) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        (item.stockExportOrderCode || "").toLowerCase().includes(keyword) ||
        (item.salesOrderCode || "").toLowerCase().includes(keyword) ||
        (item.createBy || "").toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "" || Number(item.status) === Number(statusFilter);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => Number(b.id) - Number(a.id));
  const totalPages = Math.ceil(filteredList.length / pageSize);
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages || 1);
    }
  }, [totalPages, page]);

  const paginatedData = filteredList.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    if (isUserFilteringRef.current) {
      setPage(1);
      isUserFilteringRef.current = false;
    }
  }, [search, statusFilter]);

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
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Storefront sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
              >
                Yêu cầu xuất kho
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {filteredList.length === data.length
                  ? `Tổng: ${data.length} yêu cầu`
                  : `Tổng: ${filteredList.length} / ${data.length} yêu cầu`}
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
              >
                {/* BÊN TRÁI - filter, giống trang thuốc */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems="center"
                  sx={{
                    width: { xs: "100%", md: "auto" },
                    flexWrap: "wrap",
                  }}
                >
                  <TextField
                    placeholder="Tìm kiếm..."
                    size="small"
                    value={search}
                    onChange={(e) => {
                      isUserFilteringRef.current = true;
                      setSearch(e.target.value);
                    }}
                    sx={{
                      width: { xs: "100%", sm: 240 },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* ✅ FILTER STATUS */}
                  <FormControl
                    size="small"
                    sx={{
                      minWidth: { xs: "100%", sm: 180 },
                    }}
                  >
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Trạng thái"
                      onChange={(e) => {
                        isUserFilteringRef.current = true;
                        setStatusFilter(e.target.value);
                      }}
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value={0}>Nháp</MenuItem>
                      <MenuItem value={1}>Chờ xử lý</MenuItem>
                      <MenuItem value={2}>Đã có phiếu xuất</MenuItem>
                      <MenuItem value={3}>Không đủ hàng</MenuItem>
                      <MenuItem value={4}>Chờ hàng</MenuItem>
                      <MenuItem value={5}>Đã hủy</MenuItem>
                      <MenuItem value={6}>Đủ hàng</MenuItem>
                    </Select>
                  </FormControl>

                  {/* ✅ NÚT XÓA LỌC */}
                  <Tooltip title="Tải lại">
                    <IconButton
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        refetch();
                        isUserFilteringRef.current = true;
                        setSearch("");
                        setStatusFilter("");
                      }}
                      sx={{
                        whiteSpace: "nowrap",
                        width: { xs: "100%", sm: "auto" },
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* BÊN PHẢI - nút tạo, full width trên mobile giống trang thuốc */}
                {userRole === "sales_staff" && (
                  <Box
                    sx={{
                      marginLeft: { xs: 0, md: "auto" },
                      width: { xs: "100%", md: "auto" },
                    }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate("/stock-export/create")}
                      fullWidth={isMobile}
                      sx={{
                        px: { xs: 2, sm: 3 },
                        py: 1.2,
                        fontWeight: 600,
                      }}
                    >
                      TẠO YÊU CẦU XUẤT KHO
                    </Button>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* TABLE - responsive giống trang thuốc */}
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 2,
                maxHeight: 500,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <Table
                stickyHeader
                sx={{
                  tableLayout: "auto",
                  borderSpacing: 0,
                  borderCollapse: "collapse",
                  minWidth: 1000, // đảm bảo rộng hơn container để có scroll ngang
                }}
              >
                <TableHead
                  sx={{
                    backgroundColor: "#f5f5f5",
                    "& .MuiTableCell-root": { fontWeight: "bold" },
                  }}
                >
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell align="center">Yêu cầu xuất kho</TableCell>
                    <TableCell>Mã đơn hàng</TableCell>
                    <TableCell align="center">Ngày gửi yêu cầu</TableCell>
                    <TableCell align="center">Ngày xuất kho dự kiến</TableCell>
                    <TableCell align="center">Trạng thái</TableCell>
                    <TableCell>Người tạo</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((item, index) => (
                      <TableRow
                        key={item.id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => handleViewDetail(item)}
                      >
                        <TableCell>
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell align="center">
                          {item.stockExportOrderCode}
                        </TableCell>
                        <TableCell
                          sx={{
                            color:
                              userRole === "sales_staff"
                                ? "primary.main"
                                : "text.secondary",
                            fontWeight: 600,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();

                            if (userRole !== "sales_staff") {
                              return;
                            }

                            navigate("/sales/orders", {
                              state: { searchOrderCode: item.salesOrderCode },
                            });
                          }}
                        >
                          {item.salesOrderCode}
                        </TableCell>
                        <TableCell align="center">
                          {item.requestDate
                            ? new Date(item.requestDate).toLocaleDateString(
                                "vi-VN"
                              )
                            : ""}
                        </TableCell>
                        <TableCell align="center">
                          {item.dueDate
                            ? new Date(item.dueDate).toLocaleDateString("vi-VN")
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
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* <Tooltip title="Xem chi tiết">
                              <IconButton
                                color="primary"
                                onClick={() => handleViewDetail(item)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip> */}
                            {userRole === "warehouse_staff" &&
                              [1, 4].includes(Number(item.status)) && (
                                <Tooltip title="Kiểm tra sẵn sàng xuất kho">
                                  <IconButton
                                    color="success"
                                    onClick={() => handleCheckReady(item)}
                                  >
                                    <FactCheck />
                                  </IconButton>
                                </Tooltip>
                              )}

                            {userRole === "warehouse_staff" &&
                              item.status === 6 && (
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
                            {userRole === "sales_staff" &&
                              item.status === 3 && (
                                <>
                                  <Tooltip title="Chờ hàng">
                                    <IconButton
                                      color="primary"
                                      onClick={() => handleAwaitStock(item)}
                                    >
                                      <HourglassEmpty />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="Hủy yêu cầu xuất kho">
                                    <IconButton
                                      color="error"
                                      onClick={() =>
                                        setCancelConfirm({ open: true, item })
                                      }
                                    >
                                      <Cancel />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}

                            {item.status === 0 && (
                              <>
                                <Tooltip title="Sửa">
                                  <IconButton
                                    color="warning"
                                    onClick={() =>
                                      navigate(
                                        `/stock-export/edit/${item.id}`,
                                        { state: { salesOrderId: item.soId } }
                                      )
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

            {/* PAGINATION */}
            {filteredList.length > 0 && totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
      <Dialog
        open={cancelConfirm.open}
        onClose={() => setCancelConfirm({ open: false, item: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Xác nhận hủy</DialogTitle>

        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn <strong>hủy yêu cầu xuất kho</strong> này
            không?
          </Typography>
          {cancelConfirm.item && (
            <Typography sx={{ mt: 1 }} color="text.secondary">
              Mã yêu cầu:{" "}
              <strong>{cancelConfirm.item.stockExportOrderCode}</strong>
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setCancelConfirm({ open: false, item: null })}>
            Không
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleCancelStockExport}
          >
            Xác nhận hủy
          </Button>
        </DialogActions>
      </Dialog>

      <StockExportModal
        /* ===== DETAIL ===== */
        detailOpen={detailOpen}
        onCloseDetail={handleCloseDetail}
        detailLoading={detailLoading}
        detailData={detailData}
        getStatus={getStatus}
        /* ===== DELETE ===== */
        deleteOpen={confirmData.open}
        onCloseDelete={closeConfirm}
        onConfirmDelete={handleConfirmDelete}
        /* ===== SNACK ===== */
        snack={snack}
        onCloseSnack={() => setSnack({ ...snack, open: false })}
      />
    </Box>
  );
}
