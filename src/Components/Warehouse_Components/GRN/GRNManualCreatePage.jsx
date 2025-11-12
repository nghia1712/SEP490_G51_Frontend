import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Typography,
  Grid,
  Button,
  MenuItem,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Tooltip,
  Autocomplete,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

import warehouseApi from "../../../API/warehouseAPI";
import grnApi from "../../../API/grnAPI";
import productAPI from "../../../API/productAPI";
import supplierAPI from "../../../API/supplierAPI";
import poAPI from "../../../API/poAPI";

export default function GRNManualCreatePage({ poId }) {
  // --- STATE ---
  const [poList, setPoList] = useState([]);
  const [selectedPO, setSelectedPO] = useState(poId ? Number(poId) : "");

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locationsLoading, setLocationsLoading] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const [description, setDescription] = useState("");
  const [total, setTotal] = useState(0);

  const [formData, setFormData] = useState({
    items: [{ productName: "", quantity: 1, unitPrice: 0, expiredDate: "" }],
  });

  const [productSuggestions, setProductSuggestions] = useState([]);
  const searchTimeout = useRef(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --- SNACKBAR ---
  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  // --- HANDLE ITEM CHANGE ---
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });

    if (field === "productName") {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => handleProductSearch(value), 300);
    }
  };

  // --- SEARCH PRODUCTS ---
  const handleProductSearch = async (keyword) => {
    if (!keyword.trim()) {
      setProductSuggestions([]);
      return;
    }
    try {
      const res = await productAPI.search(keyword);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const selectedIds = formData.items
        .map((item) => item.productId)
        .filter(Boolean);
      const filteredList = list.filter(
        (p) => !selectedIds.includes(p.productID)
      );
      setProductSuggestions(filteredList.slice(0, 10));
    } catch (err) {
      console.error("Lỗi search sản phẩm:", err);
    }
  };

  // --- ADD / REMOVE ITEM ---
  const handleAddItem = () =>
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { productName: "", quantity: 1, unitPrice: 0, expiredDate: "" },
      ],
    });

  const handleRemoveItem = (index) =>
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });

  // --- FETCH DATA ---
const fetchPOs = async () => {
  try {
    const [partialRes, notRes] = await Promise.all([
      poAPI.getPartiallyReceived(),
      poAPI.getNotReceived(),
    ]);

    const partialList = Array.isArray(partialRes.data) ? partialRes.data : [];
    const notList = Array.isArray(notRes.data) ? notRes.data : [];

    const merged = [...partialList, ...notList].filter(
      (po) => po.status !== 6 && po.status !== 7
    );

    setPoList(merged);
  } catch (err) {
    console.error("Lỗi fetch PO chưa nhận đủ hàng:", err);
  }
};

  const fetchWarehouses = async () => {
    try {
      const res = await warehouseApi.getAllWarehouses();
      setWarehouses(res.data?.data ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLocations = async () => {
    if (!selectedWarehouse) return;
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

  const fetchSuppliers = async () => {
    try {
      const res = await supplierAPI.getAll();
      setSuppliers(res.data?.data ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPOs();
    fetchWarehouses();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) fetchLocations();
  }, [selectedWarehouse]);

  // --- Khi chọn PO thì tự điền supplier ---
  useEffect(() => {
    if (!selectedPO) return;

    const po = poList.find((p) => p.poid === selectedPO);
    if (po) {
      const supplier =
        suppliers.find(
          (s) =>
            s.id === po.supplierId ||
            s.supplierId === po.supplierId ||
            s.id === po.supplier?.id
        ) || {};
      setSelectedSupplier(supplier.name || supplier.supplierName || "");
      setDescription(po.description || "");
    }

    const fetchProductsFromPO = async () => {
      try {
        const res = await poAPI.getDetail(selectedPO);
        const poDetail = res.data?.data;
        if (!poDetail) return;

        const items = (poDetail.details || []).map((p) => ({
          productId: p.productID,
          productName: p.productName,
          quantity: p.quantity || 1,
          unitPrice: p.unitPrice || 0,
          expiredDate: p.expiredDate
            ? new Date(p.expiredDate).toLocaleDateString("vi-VN")
            : "",

          description: p.description || "",
        }));

        setFormData({ items });
      } catch (err) {
        console.error("Lỗi fetch chi tiết PO:", err);
        setFormData({ items: [] });
      }
    };

    fetchProductsFromPO();
  }, [selectedPO, poList, suppliers]);

  // --- TÍNH TOTAL ---
  useEffect(() => {
    const newTotal = formData.items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
    setTotal(newTotal);
  }, [formData.items]);

  const navigate = useNavigate();
  // --- CREATE GRN ---
  const handleCreateGRN = async () => {
    if (!selectedPO) {
      return setSnackbar({
        open: true,
        message: "Vui lòng chọn PO",
        severity: "error",
      });
    }
    if (!selectedWarehouse || !selectedLocation) {
      return setSnackbar({
        open: true,
        message: "Vui lòng chọn kho và vị trí kho",
        severity: "error",
      });
    }
    if (!selectedSupplier) {
      return setSnackbar({
        open: true,
        message: "Vui lòng chọn nhà cung cấp",
        severity: "error",
      });
    }

    const grndManuallyDTOs = formData.items
      .filter((i) => i.productId)
      .map((i) => ({
        productID: Number(i.productId),
        unitPrice: Number(i.unitPrice) || 0,
        quantity: Number(i.quantity) || 0,
        expiredDate: i.expiredDate
          ? new Date(i.expiredDate).toISOString()
          : null,
        grnManuallyDTO: i.note || "",
      }));

    if (grndManuallyDTOs.length === 0) {
      return setSnackbar({
        open: true,
        message: "Vui lòng chọn ít nhất một sản phẩm",
        severity: "warning",
      });
    }

    const payload = {
      source: selectedSupplier,
      total: Number(total) || 0,
      description: description || "",
      warehouseLocationID: Number(selectedLocation),
      grndManuallyDTOs,
    };

    console.log("Payload GRN:", payload);

    try {
      await grnApi.createManually(selectedPO, payload);

      setSnackbar({
        open: true,
        message: "Tạo phiếu nhập kho thành công",
        severity: "success",
      });

      // Reset form
      setSelectedPO("");
      setSelectedWarehouse("");
      setSelectedLocation("");
      setSelectedSupplier("");
      setFormData({
        items: [
          { productName: "", quantity: 1, unitPrice: 0, expiredDate: "" },
        ],
      });
      setDescription("");

      setTimeout(() => {
        navigate("/grn");
      }, 2000);
    } catch (err) {
      console.error(err);

      const apiMsg =
        err?.response?.data?.message || err?.message || "Tạo GRN thất bại";

      setSnackbar({
        open: true,
        message: apiMsg,
        severity: "error",
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Tạo phiếu nhập kho
      </Typography>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Đơn hàng</InputLabel>
              <Select
                value={selectedPO}
                onChange={(e) =>
                  setSelectedPO(e.target.value ? Number(e.target.value) : "")
                }
              >
                {poList.map((po) => (
                  <MenuItem key={po.poid} value={po.poid}>
                    {`PO-${po.poid}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={8} md={8}>
            <TextField
              label="Nhà cung cấp"
              fullWidth
              size="small"
              value={selectedSupplier || ""}
              disabled
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Kho</InputLabel>
              <Select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                {warehouses.map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              size="small"
              disabled={!selectedWarehouse || locationsLoading}
            >
              <InputLabel>Vị trí kho</InputLabel>
              <Select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                {locations.length === 0 ? (
                  <MenuItem disabled>
                    {locationsLoading ? "Đang tải..." : "Không có vị trí"}
                  </MenuItem>
                ) : (
                  locations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.locationName}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* Hàng 3: Mô tả phiếu nhập (Full width) */}
          <Grid item xs={12}>
            <TextField
              label="Mô tả phiếu nhập"
              fullWidth
              multiline
              minRows={3} // Tăng minRows để vùng nhập liệu trông rõ ràng hơn
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* --- DANH SÁCH SẢN PHẨM --- */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Danh sách sản phẩm
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>STT</TableCell>
                <TableCell>Sản phẩm</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>Số lượng</TableCell>
                <TableCell>Đơn giá</TableCell>
                <TableCell>Hạn sử dụng</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.items.map((item, index) => (
                <TableRow key={`item-${index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {item.unitPrice?.toLocaleString() || ""}
                  </TableCell>
                  <TableCell>{item.expiredDate || ""}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Xóa sản phẩm này">
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />
        <Typography textAlign="right" fontWeight={600}>
          Tổng cộng: {total.toLocaleString()} VNĐ
        </Typography>
      </Paper>

      {/* --- BUTTON --- */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" size="large" onClick={handleCreateGRN}>
          Tạo phiếu nhập kho
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
