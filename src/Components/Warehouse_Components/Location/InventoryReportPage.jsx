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
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  FormControl,
  Tooltip,
  Button,
  Pagination,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import warehouseAPI from "../../../API/warehouseAPI";
import warehouseLocationAPI from "../../../API/warehouseLocationAPI";
import { useLocation } from "react-router-dom";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import viLocale from "date-fns/locale/vi";

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
  const [totalSessions, setTotalSessions] = useState(0);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
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

  const showApiError = (err, fallback = "Có lỗi xảy ra") => {
    console.error(err);

    const apiMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      fallback;

    setSnackbar({
      open: true,
      message: apiMsg,
      severity: "error",
    });
  };

  // --- Khi navigate tới từ WarehousePage ---
  useEffect(() => {
    const initFromLocationState = async () => {
      if (!locationState.state?.warehouse || !locationState.state?.location)
        return;

      const { warehouse, location } = locationState.state;
      setSelectedWarehouse(warehouse);

      try {
        const res = await warehouseLocationAPI.getByWarehouseId(warehouse);
        const locList = res.data.data || [];
        setLocations(locList);
        const exists = locList.find((l) => Number(l.id) === Number(location));
        if (exists) setSelectedLocation(location);
      } catch (err) {
        showApiError(err, "Không thể tải chi tiết phiên kiểm kê");
        return;
      }

      setLoading(true);
      try {
        const res = await warehouseAPI.getSessionByWarehouseLocation(location);
        const data = (res.data.data || []).filter((s) => s.status === 3);
        setSessions(data);
      } catch (err) {
        showApiError(err, "Không thể tải chi tiết phiên kiểm kê");
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
        showApiError(err, "Không thể tải chi tiết phiên kiểm kê");
      }
    };
    loadLocations();
  }, [selectedWarehouse]);

  // --- Load sessions theo filter ---
  useEffect(() => {
    const loadSessionsByFilter = async () => {
      setLoading(true);

      const handleApiCall = async (apiCall) => {
        try {
          const res = await apiCall();
          return res.data.data || [];
        } catch (err) {
          if (
            err.response?.status === 400 &&
            (err.response?.data?.message === "Không có phiên kiểm kê nào." ||
              err.response?.data?.message ===
                "Không tìm thấy phiên kiểm kê nào cho vị trí kho này.")
          ) {
            return [];
          }
          throw err;
        }
      };

      try {
        let data = [];

        const allSessions = await handleApiCall(() =>
          warehouseAPI.getAllSession()
        );
        const completedSessions = allSessions.filter((s) => s.status === 3);
        setTotalSessions(completedSessions.length);

        if (selectedLocation) {
          data = allSessions.filter(
            (s) => String(s.warehouseLocationID) === String(selectedLocation)
          );
        } else if (selectedWarehouse) {
          data = allSessions.filter(
            (s) => String(s.warehouseID) === String(selectedWarehouse)
          );
        } else {
          data = allSessions;
        }

        // ✅ Chỉ lấy những session đã hoàn tất
        data = data.filter((s) => s.status === 3);

        // Filter theo search
        if (search) {
          data = data.filter((s) =>
            s.inventorySessionID.toString().includes(search)
          );
        }

        // Filter theo date
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
        setPage(1);
      } catch (err) {
        showApiError(err, "Không thể tải chi tiết phiên kiểm kê");
      } finally {
        setLoading(false);
      }
    };

    loadSessionsByFilter();
  }, [selectedWarehouse, selectedLocation, dateFrom, dateTo, search]);

  const handleViewDetail = async (sessionId) => {
    setOpenDetail(true);
    setDetailLoading(true);
    try {
      const res = await warehouseAPI.getHistoriesBySessionId(sessionId);
      setHistories(res.data.data || []);
    } catch (err) {
      showApiError(err, "Không thể tải chi tiết phiên kiểm kê");
    } finally {
      setDetailLoading(false);
    }
  };

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
      showApiError(err, "Không thể tải chi tiết phiên kiểm kê");
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("vi-VN", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "-";

  const totalPages = Math.ceil(sessions.length / rowsPerPage);
  const paginated = sessions.slice(
    (page - 1) * rowsPerPage,
    (page - 1) * rowsPerPage + rowsPerPage
  );

  const commonInfo = histories?.[0];

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
              {sessions.length === totalSessions
                ? `Tổng: ${totalSessions} phiên`
                : `Tổng: ${sessions.length} / ${totalSessions} phiên`}
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
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                locale={viLocale}
              >
                <DatePicker
                  label="Từ ngày"
                  value={dateFrom ? new Date(dateFrom) : null}
                  onChange={(newValue) => {
                    if (!newValue) return;
                    const value = newValue.toISOString().split("T")[0];
                    setDateFrom(value);

                    if (dateTo && new Date(dateTo) < newValue) {
                      setDateTo("");
                    }
                  }}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: { size: "small", sx: { width: 180 } },
                  }}
                  maxDate={dateTo ? new Date(dateTo) : undefined}
                />

                <DatePicker
                  label="Đến ngày"
                  value={dateTo ? new Date(dateTo) : null}
                  onChange={(newValue) => {
                    if (!newValue) return;
                    const value = newValue.toISOString().split("T")[0];
                    setDateTo(value);
                  }}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: { size: "small", sx: { width: 180 } },
                  }}
                  minDate={dateFrom ? new Date(dateFrom) : undefined}
                />
              </LocalizationProvider>

              <Tooltip title="Tải lại">
                <IconButton
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
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>

          {/* TABLE */}
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table stickyHeader>
              <TableHead
                sx={{
                  backgroundColor: "#f5f5f5",
                  "& .MuiTableCell-root": { fontWeight: "bold" },
                }}
              >
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Phiên kiểm kê</TableCell>
                  <TableCell>Thời gian bắt đầu</TableCell>
                  <TableCell>Thời gian hoàn tất</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
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
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((s, i) => (
                    <TableRow
                      key={s.inventorySessionID}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => handleViewDetail(s.inventorySessionID)}
                    >
                      <TableCell>{(page - 1) * rowsPerPage + i + 1}</TableCell>
                      <TableCell>{s.inventorySessionID}</TableCell>
                      <TableCell>{formatDate(s.startDate)}</TableCell>
                      <TableCell>{formatDate(s.endDate)}</TableCell>
                      <TableCell
                        onClick={(e) => e.stopPropagation()}
                        align="center"
                      >
                        <Box sx={{ display: "inline-flex", gap: 1 }}>
                          {/* <Tooltip title="Xem chi tiết">
                            <IconButton
                              color="primary"
                              onClick={() =>
                                handleViewDetail(s.inventorySessionID)
                              }
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip> */}
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
          {sessions.length > 0 && totalPages > 1 && (
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

      {/* DIALOG DETAIL */}
      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle fontWeight={"bold"}>Chi tiết phiên kiểm kê</DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : histories.length > 0 ? (
            <>
              {/* 🔹 THÔNG TIN CHUNG */}
              {commonInfo && (
                <Stack
                  direction="row"
                  spacing={3}
                  sx={{ mb: 1.5, color: "text.secondary" }}
                >
                  <Typography variant="body2">
                    <strong>Người phụ trách:</strong> {commonInfo.inventoryBy}
                  </Typography>

                  <Typography variant="body2">
                    <strong>Cập nhật:</strong>{" "}
                    {formatDate(commonInfo.lastUpdated)}
                  </Typography>
                </Stack>
              )}

              {/* 🔹 TABLE CHI TIẾT */}
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead
                    sx={{
                      backgroundColor: "#f5f5f5",
                      "& .MuiTableCell-root": { fontWeight: "bold" },
                    }}
                  >
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        Tồn hệ thống
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        Thực tế
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        Chênh lệch
                      </TableCell>
                      <TableCell>Ghi chú</TableCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
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
