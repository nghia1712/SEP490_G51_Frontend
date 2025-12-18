import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Stack,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  TableContainer,
  InputLabel,
  Snackbar,
  Alert,
  Grid,
  Pagination,
  Card,
  CardContent,
  Container,
} from "@mui/material";
import { Visibility, Search, Download, ReceiptLong } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import useGRNList from "../../../Hooks/useGRNList";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { vi as viLocale } from "date-fns/locale";

export default function GRNListPage() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const location = useLocation();
  const { poId, create } = location.state || {};
  const {
    data,
    loading,
    search,
    setSearch,
    filtered,
    openDetail,
    setOpenDetail,
    selectedGRN,
    detailItems,
    detailLoading,
    handleViewDetail,
    warehouses,
    selectedWarehouse,
    setSelectedWarehouse,
    locations,
    selectedLocation,
    setSelectedLocation,
    locationsLoading,
    poItems,
    poInfo,
    openCreate,
    setOpenCreate,
    handleCreateGRN,
    handleDownloadPDF,
    snack,
    handleSnackClose,
  } = useGRNList({ poId, autoOpenCreate: create });

  // ===== Pagination =====
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredData = (filtered || [])
    .filter((item) => {
      const itemDate = item.createDate ? new Date(item.createDate) : null;
      if (!itemDate) return true;
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    })
    .sort((a, b) => Number(b.grnid) - Number(a.grnid));

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate]);

  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <ReceiptLong sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
              >
                Phiếu nhập kho
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {filteredData.length === data.length
                  ? `Tổng: ${data.length} phiếu`
                  : `Tổng: ${filteredData.length} / ${data.length} phiếu`}
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
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    placeholder="Tìm kiếm..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: 350 }}
                  />
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    locale={viLocale}
                  >
                    <DatePicker
                      label="Ngày tạo từ"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      slotProps={{
                        textField: { size: "small", sx: { width: 180 } },
                      }}
                      format="dd/MM/yyyy"
                      maxDate={endDate || undefined}
                    />
                    <DatePicker
                      label="Ngày tạo đến"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      slotProps={{
                        textField: { size: "small", sx: { width: 180 } },
                      }}
                      format="dd/MM/yyyy"
                      minDate={startDate || undefined}
                    />
                  </LocalizationProvider>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      setSearch("");
                      setStartDate(null);
                      setEndDate(null);
                    }}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    Xóa lọc
                  </Button>
                </Stack>

                <Button
                  variant="contained"
                  startIcon={<ReceiptLong />}
                  onClick={() => navigate("/grn/manual-create")}
                >
                  Tạo phiếu nhập kho
                </Button>
              </Stack>
            </Paper>

            {/* TABLE */}
            <TableContainer
              component={Paper}
              sx={{ borderRadius: 2, maxHeight: 500 }}
            >
              <Table stickyHeader>
                <TableHead
                  sx={{
                    backgroundColor: "#f5f5f5",
                    "& .MuiTableCell-root": { fontWeight: "bold" },
                  }}
                >
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell align="center">Phiếu nhập kho</TableCell>
                    <TableCell>Kho</TableCell>
                    <TableCell>Vị trí</TableCell>
                    <TableCell align="center">Đơn hàng</TableCell>
                    <TableCell>Nhà cung cấp</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                    <TableCell>Người tạo</TableCell>
                    {/* <TableCell align="center">Thao tác</TableCell> */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, idx) => (
                      <TableRow
                        key={row.grnId + "_" + idx}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => handleViewDetail(row)}
                      >
                        <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                        <TableCell align="center">{`GRN-${row.grnid}`}</TableCell>
                        <TableCell>{row.warehouse}</TableCell>
                        <TableCell>{row.warehouseName}</TableCell>
                        <TableCell align="center">{`PO-${row.poid}`}</TableCell>
                        <TableCell>{row.source}</TableCell>
                        <TableCell>
                          {row.createDate
                            ? new Date(row.createDate).toLocaleDateString(
                                "vi-VN"
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>{row.createBy}</TableCell>
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
                                size="small"
                                onClick={() => handleViewDetail(row)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip> */}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* PAGINATION */}
            {filteredData.length > 0 && totalPages > 1 && (
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

      {/* Create GRN Dialog */}
      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Tạo phiếu nhập kho</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Mã đơn hàng" value={poId ?? ""} disabled />

            {/* Warehouse Dropdown */}
            <FormControl fullWidth>
              <InputLabel>Kho</InputLabel>
              <Select
                value={selectedWarehouse}
                label="Kho"
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                {warehouses.length > 0 ? (
                  warehouses.map((w) => (
                    <MenuItem key={w.id} value={w.id}>
                      {w.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>Không có dữ liệu kho</MenuItem>
                )}
              </Select>
            </FormControl>

            {/* Warehouse Location Dropdown */}
            <FormControl
              fullWidth
              disabled={!selectedWarehouse || locationsLoading}
            >
              <InputLabel>Vị trí kho</InputLabel>
              <Select
                value={selectedLocation}
                label="Vị trí kho"
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                {locations.length === 0 ? (
                  <MenuItem disabled>Không có vị trí</MenuItem>
                ) : (
                  locations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.locationName}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Stack>

          {/* PO Items */}
          <Box mt={3}>
            <Typography fontWeight="bold" mb={1}>
              Danh sách sản phẩm
            </Typography>
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
                    <TableCell>Tên sản phẩm</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Đơn vị</TableCell>
                    <TableCell>Số lượng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {poItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Không có sản phẩm
                      </TableCell>
                    </TableRow>
                  ) : (
                    poItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.dvt}</TableCell>
                        <TableCell>{item.remainingQty}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Hủy</Button>
          <Button variant="contained" color="primary" onClick={handleCreateGRN}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
      {/* View GRN Detail Dialog */}
      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle fontWeight={"bold"}>Chi tiết phiếu nhập kho</DialogTitle>
        <DialogContent dividers>
          <IconButton
            sx={{ position: "absolute", top: 8, right: 8 }}
            color="primary"
            onClick={() => handleDownloadPDF(selectedGRN.grnid)}
          >
            <Download />
          </IconButton>
          {detailLoading ? (
            <Stack alignItems="center" justifyContent="center" mt={3}>
              <CircularProgress />
            </Stack>
          ) : (
            <>
              {selectedGRN && (
                <Box mb={2}>
                  <Grid container>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Phiếu nhập kho:</b> {`GRN-${selectedGRN.grnid}`}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Đơn hàng:</b> {`PO-${selectedGRN.poid}`}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Kho:</b> {selectedGRN.warehouse}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Vị trí:</b> {selectedGRN.warehouseName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Nhà cung cấp:</b> {selectedGRN.source}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Ngày tạo:</b>{" "}
                        {selectedGRN.createDate
                          ? new Date(selectedGRN.createDate).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Người tạo:</b> {selectedGRN.createBy}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Mô tả:</b> {selectedGRN.description}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Typography fontWeight="bold" mb={1}>
                Danh sách sản phẩm
              </Typography>
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
                      <TableCell>Tên sản phẩm</TableCell>
                      <TableCell>Số lượng</TableCell>
                      <TableCell>Đơn giá</TableCell>
                      <TableCell>Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Không có sản phẩm
                        </TableCell>
                      </TableRow>
                    ) : (
                      detailItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {item.unitPrice?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {(item.quantity * item.unitPrice)?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snack.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
