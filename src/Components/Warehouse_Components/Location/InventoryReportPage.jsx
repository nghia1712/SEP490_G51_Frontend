import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  CircularProgress,
  Container,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  Stack,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  FormControl,
  Tooltip,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Inventory as InventoryIcon,
} from "@mui/icons-material";
import warehouseAPI from "../../../API/warehouseAPI";
import warehouseLocationAPI from "../../../API/warehouseLocationAPI";
import { useLocation } from "react-router-dom";

export default function InventoryReportPage() {
  const locationState = useLocation();

  // --- State ---
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [histories, setHistories] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --- Load danh sách kho ---
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const res = await warehouseAPI.getAllWarehouses();
        setWarehouses(res.data.data || []);
      } catch (err) {
        console.error(err);
        setSnackbar({
          open: true,
          message: "Không thể tải danh sách kho",
          severity: "error",
        });
      }
    };
    loadWarehouses();
  }, []);

  // --- Khi navigate tới từ WarehousePage -> fill dữ liệu ---
  useEffect(() => {
    const initFromLocationState = async () => {
      console.log("📦 locationState nhận được:", locationState.state);

      if (!locationState.state?.warehouse || !locationState.state?.location)
        return;

      const { warehouse, location } = locationState.state;
      console.log("➡️  warehouse:", warehouse, " | location:", location);

      setSelectedWarehouse(warehouse);

      try {
        const res = await warehouseLocationAPI.getByWarehouseId(warehouse);
        const locList = res.data.data || [];
        setLocations(locList);
        const exists = locList.find(
          (l) => Number(l.id) === Number(location)
        );
        if (exists) {
          console.log("✅ Tìm thấy location trong danh sách:", exists);
          setSelectedLocation(location);
        } else {
          console.warn("⚠️ Location không tồn tại trong warehouse này!");
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách vị trí:", err);
        setSnackbar({
          open: true,
          message: "Không thể tải danh sách vị trí",
          severity: "error",
        });
        return;
      }

      setLoading(true);
      try {
        const res = await warehouseAPI.getSessionByWarehouseLocation(location);
        const data = (res.data.data || []).filter((s) => s.status === 3);
        setSessions(data);
        console.log("📊 Số phiên kiểm kê lấy được:", data.length);
      } catch (err) {
        console.error("❌ Lỗi khi tải session theo location:", err);
        setSnackbar({
          open: true,
          message: "Không thể tải phiên kiểm kê theo vị trí",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    initFromLocationState();
  }, [locationState.state]);

  // --- Load locations khi chọn warehouse ---
  useEffect(() => {
    if (!selectedWarehouse) {
      setLocations([]);
      setSelectedLocation("");
      return;
    }

    const loadLocations = async () => {
      try {
        const res = await warehouseLocationAPI.getByWarehouseId(
          selectedWarehouse
        );
        setLocations(res.data.data || []);
      } catch (err) {
        console.error(err);
        setSnackbar({
          open: true,
          message: "Không thể tải danh sách vị trí",
          severity: "error",
        });
      }
    };
    loadLocations();
  }, [selectedWarehouse]);

  // --- Load sessions theo filter ---
  useEffect(() => {
    const loadSessionsByFilter = async () => {
      setLoading(true);
      try {
        let data = [];

        if (selectedLocation) {
          const res = await warehouseAPI.getSessionByWarehouseLocation(
            selectedLocation
          );
          data = res.data.data || [];
        } else if (selectedWarehouse) {
          const res = await warehouseAPI.getAllSession();
          data = (res.data.data || []).filter(
            (s) => s.warehouseID === selectedWarehouse
          );
        } else {
          const res = await warehouseAPI.getAllSession();
          data = res.data.data || [];
        }

        // Chỉ lấy status = 3
        data = data.filter((s) => s.status === 3);

        // Lọc theo ID
        if (search) {
          data = data.filter((s) =>
            s.inventorySessionID.toString().includes(search)
          );
        }

        // Lọc theo ngày
        const parseDateOnly = (d) =>
          d ? new Date(new Date(d).toDateString()) : null;

        if (dateFrom) {
          const from = parseDateOnly(dateFrom);
          data = data.filter((s) => parseDateOnly(s.startDate) >= from);
        }
        if (dateTo) {
          const to = parseDateOnly(dateTo);
          data = data.filter(
            (s) => parseDateOnly(s.endDate || s.startDate) <= to
          );
        }

        setSessions(data);
      } catch (err) {
        console.error(err);
        setSnackbar({
          open: true,
          message: "Không thể tải phiên kiểm kê",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSessionsByFilter();
  }, [selectedWarehouse, selectedLocation, dateFrom, dateTo, search]);

  // --- Xem chi tiết ---
  const handleViewDetail = async (sessionId) => {
    setOpenDetail(true);
    setDetailLoading(true);
    try {
      const res = await warehouseAPI.getHistoriesBySessionId(sessionId);
      setHistories(res.data.data || []);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Không thể tải chi tiết phiên kiểm kê",
        severity: "error",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // --- Xuất Excel ---
  const handleExport = async (sessionId) => {
    try {
      const res = await warehouseAPI.exportInventorySessionToExcel(sessionId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `InventorySession_${sessionId}.xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Xuất Excel thất bại",
        severity: "error",
      });
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("vi-VN", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "-";

  const paginated = sessions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent>
          {/* HEADER */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <InventoryIcon sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
            >
              Báo cáo kiểm kê
            </Typography>
            <Typography variant="h6" color="textSecondary">
              Tổng: {sessions.length} phiên
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
            >
              <TextField
                placeholder="Tìm kiếm ID phiên..."
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">Tất cả kho</MenuItem>
                  {warehouses.map((w) => (
                    <MenuItem key={w.id} value={w.id}>
                      {w.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{ minWidth: 200 }}
                disabled={!selectedWarehouse}
              >
                <Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">Tất cả vị trí</MenuItem>
                  {locations.map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {l.locationName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                type="date"
                size="small"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                label="Từ ngày"
              />
              <TextField
                type="date"
                size="small"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                label="Đến ngày"
              />

              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setSearch("");
                  setSelectedWarehouse("");
                  setSelectedLocation("");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Clear
              </Button>
            </Stack>
          </Paper>

          {/* TABLE */}
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>ID Phiên</TableCell>
                  <TableCell>Ngày bắt đầu</TableCell>
                  <TableCell>Ngày hoàn tất</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      Không tìm thấy phiên nào
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((s, i) => (
                    <TableRow key={s.inventorySessionID} hover>
                      <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                      <TableCell>{s.inventorySessionID}</TableCell>
                      <TableCell>{formatDate(s.startDate)}</TableCell>
                      <TableCell>{formatDate(s.endDate)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "inline-flex", gap: 1 }}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              color="primary"
                              onClick={() =>
                                handleViewDetail(s.inventorySessionID)
                              }
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xuất Excel">
                            <IconButton
                              onClick={() => handleExport(s.inventorySessionID)}
                              size="small"
                              color="success"
                            >
                              <DownloadIcon />
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

          {/* PAGINATION */}
          {sessions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={sessions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) =>
                  setRowsPerPage(parseInt(e.target.value, 10))
                }
                labelRowsPerPage="Số hàng mỗi trang:"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* DIALOG DETAIL */}
      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết phiên kiểm kê</DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : histories.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell align="right">Tồn hệ thống</TableCell>
                    <TableCell align="right">Thực tế</TableCell>
                    <TableCell align="right">Chênh lệch</TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell>Người kiểm kê</TableCell>
                    <TableCell>Cập nhật</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {histories.map((h, idx) => (
                    <TableRow key={h.inventoryHistoryID}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{h.productName}</TableCell>
                      <TableCell align="right">{h.systemQuantity}</TableCell>
                      <TableCell align="right">{h.actualQuantity}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: h.diff < 0 ? "error.main" : "success.main",
                          fontWeight: 600,
                        }}
                      >
                        {h.diff}
                      </TableCell>
                      <TableCell>{h.note || "-"}</TableCell>
                      <TableCell>{h.inventoryBy}</TableCell>
                      <TableCell>{formatDate(h.lastUpdated)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography align="center" sx={{ py: 3 }}>
              Không có dữ liệu chi tiết
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
