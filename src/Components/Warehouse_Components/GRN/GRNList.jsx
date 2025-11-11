import React, { useState, useEffect, useMemo } from "react";
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
  Button,
  Stack,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
} from "@mui/material";
import { Visibility, Search, Download } from "@mui/icons-material";
import grnApi from "../../../API/grnAPI";
import warehouseApi from "../../../API/warehouseAPI";
import { useSearchParams } from "react-router-dom";
import poAPI from "../../../API/poAPI";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

export default function GRNListPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { poId, create } = location.state || {};
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [detailItems, setDetailItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const handleViewDetail = async (grn) => {
    setSelectedGRN(grn);
    setOpenDetail(true);
    setDetailLoading(true);
    try {
      const res = await grnApi.getDetail(grn.grnid);

      const data = res.data?.data ?? {};
      const items = data.grnDetailViewDTO ?? [];
      setDetailItems(items);
    } catch (err) {
      console.error(err);
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // Warehouse & Location
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locationsLoading, setLocationsLoading] = useState(false);

  // PO
  const [poItems, setPoItems] = useState([]);
  const [poInfo, setPoInfo] = useState(null);

  // Dialog
  const [openCreate, setOpenCreate] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const handleSnackClose = () => setSnack({ ...snack, open: false });

  // Fetch GRN list
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await grnApi.getAll();
      const items = res?.data?.data ?? res?.data?.result ?? [];
      setData(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await warehouseApi.getAllWarehouses();
        setWarehouses(res.data?.data ?? []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWarehouses();
  }, []);

  // Fetch Locations
  useEffect(() => {
    if (!selectedWarehouse) return;

    const fetchLocations = async () => {
      setLocationsLoading(true);
      try {
        const res = await warehouseApi.getWarehouseDetails(selectedWarehouse);
        setLocations(res.data?.data?.warehouseLocations ?? []);
        setSelectedLocation("");
      } catch (err) {
        console.error(err);
      } finally {
        setLocationsLoading(false);
      }
    };
    fetchLocations();
  }, [selectedWarehouse]);

  // Fetch PO Details
  useEffect(() => {
    if (poId && openCreate) fetchPOItems(poId);
  }, [poId, openCreate]);

  const fetchPOItems = async (id) => {
    try {
      const res = await poAPI.getDetail(id);
      const data = res?.data?.data ?? null;
      setPoInfo(data);
      setPoItems(data?.details ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (create) setOpenCreate(true);
  }, [create]);

  // Filter
  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter((item) => {
      const text = [item.grnId, item.supplierName, item.description, item.poid]
        .join(" ")
        .toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [search, data]);

  // Submit GRN
  const handleCreateGRN = async () => {
    if (!selectedWarehouse || !selectedLocation) {
      setSnack({
        open: true,
        severity: "error",
        message: "Vui lòng chọn kho và vị trí kho",
      });
      return;
    }
    const payload = { warehouseLocationId: selectedLocation };
    try {
      await grnApi.createFromPO(poId, payload);
      setSnack({
        open: true,
        severity: "success",
        message: "Tạo phiếu nhập kho thành công",
      });
      setOpenCreate(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setSnack({
        open: true,
        severity: "error",
        message: "Tạo phiếu nhập kho thất bại",
      });
    }
  };
  const handleDownloadPDF = async (grnId) => {
    try {
      const response = await grnApi.exportPdf(grnId, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GRN_${grnId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setSnack({
        open: true,
        severity: "error",
        message: "Không thể tải file PDF",
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Phiếu nhập kho
      </Typography>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search GRN..."
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
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/grn/manual-create")}
          >
            Tạo phiếu nhập kho
          </Button>
        </Stack>
      </Paper>

      {/* GRN Table */}
      {loading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
        </Stack>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>GRN ID</TableCell>
                  <TableCell>Nhà cung cấp</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell>Người phụ trách</TableCell>
                  <TableCell>Tổng tiền</TableCell>
                  <TableCell>PO ID</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row, idx) => (
                    <TableRow key={row.grnId + "_" + idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{`GRN-${row.grnid}`}</TableCell>
                      <TableCell>{row.source}</TableCell>
                      <TableCell>
                        {row.createDate
                          ? new Date(row.createDate).toLocaleDateString("vi-VN")
                          : "-"}
                      </TableCell>

                      <TableCell>{row.description}</TableCell>
                      <TableCell>{row.createBy}</TableCell>
                      <TableCell align="right">
                        {row.total?.toLocaleString() ?? "-"}
                      </TableCell>
                      <TableCell>{row.poid}</TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                        >
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleViewDetail(row)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      {/* View GRN Detail Dialog */}
      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết phiếu nhập kho</DialogTitle>

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
                  <Typography>
                    <b>GRN ID:</b>{" "}
                    {selectedGRN ? `GRN-${selectedGRN.grnid}` : "-"}
                  </Typography>

                  <Typography>
                    <b>Nhà cung cấp:</b> {selectedGRN.source}
                  </Typography>
                  <Typography>
                    <b>Ngày tạo:</b>{" "}
                    {selectedGRN.createDate
                      ? new Date(selectedGRN.createDate).toLocaleDateString(
                          "vi-VN"
                        )
                      : "-"}
                  </Typography>
                  <Typography>
                    <b>Người phụ trách:</b> {selectedGRN.createBy}
                  </Typography>
                  <Typography>
                    <b>Mô tả:</b> {selectedGRN.description}
                  </Typography>
                  <Typography>
                    <b>PO ID:</b> {`PO-${selectedGRN.poid}`}
                  </Typography>
                </Box>
              )}

              <Typography fontWeight="bold" mb={1}>
                Danh sách sản phẩm
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
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
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleDownloadPDF(selectedGRN.grnid)}
          >
            Tải PDF
          </Button>
        </DialogActions>
      </Dialog>

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
            <TextField label="PO ID" value={poId ?? ""} disabled />

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
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Tên sản phẩm</TableCell>
                    <TableCell>Mô tả</TableCell>
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
                        <TableCell>{item.quantity}</TableCell>
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
