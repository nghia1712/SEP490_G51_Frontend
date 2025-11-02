import React, { useState, useEffect, useRef } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import prfqApi from "../../../API/prfqAPI";
import supplierAPI from "../../../API/supplierAPI";
import productAPI from "../../../API/productAPI";
import palette from "../../../constants/palette";
import AddProduct from "../../Product_Components/AddProduct";

export default function PRFQCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isUpdate = !!id;

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  const [openAddProduct, setOpenAddProduct] = useState(false);
  const handleOpenAddProduct = () => setOpenAddProduct(true);
  const handleCloseAddProduct = () => setOpenAddProduct(false);

  const [openPreview, setOpenPreview] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: "",
    taxCode: "030203002865",
    phone: "0398233047",
    address: "165 Dư Hàng Kênh Tp Hải Phòng",
    email: "",
    items: [{ productName: "" }],
  });

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [productSuggestions, setProductSuggestions] = useState([]);
  const searchTimeout = useRef(null);

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

  const handleItemChange = (index, value) => {
    const newItems = [...formData.items];
    newItems[index].productName = value;
    setFormData({ ...formData, items: newItems });

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleProductSearch(value), 300);
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await supplierAPI.getAll();
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
        setSuppliers(list.filter((s) => s.status === 1));
      } catch (err) {
        console.error("Lỗi tải danh sách NCC:", err);
      }
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (!isUpdate) return;
    const fetchDraft = async () => {
      try {
        const res = await prfqApi.getDetail(id);
        const data = res?.data?.data || res?.data;
        if (!data) throw new Error("Không có dữ liệu");

        let items = [];
        const rawItems =
          [
            data.items,
            data.quotationItems,
            data.productList,
            data.products,
            data.itemList,
          ].find((arr) => Array.isArray(arr)) || [];

        items = rawItems.map((item) => {
          const product = item.product || item.productInfo || {};
          return {
            productId:
              item.productId || item.productID || item.id || product.id || null,
            productName:
              item.productName ||
              product.productName ||
              product.name ||
              item.name ||
              "",
            description:
              item.productDescription ||
              product.productDescription ||
              product.description ||
              item.description ||
              "",
            unit:
              item.unit ||
              product.unit ||
              product.unitName ||
              product.donVi ||
              "",
          };
        });

        if (items.length === 0) items = [{ productName: "" }];

        setFormData((prev) => ({
          ...prev,
          supplierId: data.supplierId || data.supplier?.id || "",
          email: data.email || data.supplier?.email || "",
          items,
        }));

        const supplierId = data.supplierId || data.supplier?.id;
        if (supplierId) {
          const supplierRes = await supplierAPI.getById(supplierId);
          setSelectedSupplier(supplierRes?.data?.data || supplierRes?.data);
        }
      } catch (err) {
        console.error("Load draft error:", err);
        setSnackbar({
          open: true,
          message: "Không thể tải bản nháp!",
          severity: "error",
        });
      }
    };
    fetchDraft();
  }, [id, isUpdate]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "supplierId" && value) {
      try {
        const res = await supplierAPI.getById(value);
        const s = res.data?.data;
        setSelectedSupplier(s);
        setFormData((prev) => ({
          ...prev,
          supplierId: value,
          email: s.email || "",
        }));
      } catch (err) {
        console.error("Lỗi khi lấy thông tin NCC:", err);
      }
    }
  };

  const handleAddItem = () =>
    setFormData({
      ...formData,
      items: [...formData.items, { productName: "" }],
    });
  const handleRemoveItem = (index) =>
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (status) => {
    if (loading) return; // nếu đang gửi, bỏ qua click tiếp
    setLoading(true);

    try {
      const productIds = formData.items
        .map((item) => item.productId)
        .filter((id) => id);

      if (productIds.length === 0) {
        setSnackbar({
          open: true,
          message: "Vui lòng chọn ít nhất một sản phẩm từ danh sách!",
          severity: "warning",
        });
        setLoading(false);
        return;
      }

      const payload = {
        id: id || undefined,
        supplierId: Number(formData.supplierId),
        taxCode: formData.taxCode,
        myPhone: formData.phone,
        myAddress: formData.address,
        productIds,
        prfqStatus: status === "Draft" ? 4 : 1,
      };

      await prfqApi.create(payload);

      setSnackbar({
        open: true,
        message: isUpdate
          ? "Cập nhật PRFQ thành công!"
          : "Tạo PRFQ thành công!",
        severity: "success",
      });

      setTimeout(() => {
        navigate("/purchase/prfq");
      }, 1200);
    } catch (error) {
      console.error("Lỗi khi xử lý PRFQ:", error);
      setSnackbar({
        open: true,
        message: "Không thể lưu, vui lòng thử lại!",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AddProduct
        open={openAddProduct}
        handleClose={handleCloseAddProduct}
        onSaveSuccess={() => console.log("Thêm sản phẩm thành công!")}
      />

      <Box sx={{ p: 3 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 2, color: palette.primary.main }}
        >
          {isUpdate
            ? "Chỉnh sửa Yêu Cầu Báo Giá (Bản nháp)"
            : "Tạo Yêu Cầu Báo Giá Nhập"}
        </Typography>

        {/* THÔNG TIN NCC */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="Nhà cung cấp"
                name="supplierId"
                fullWidth
                size="small"
                value={formData.supplierId}
                onChange={handleChange}
                required
              >
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Mã số thuế"
                name="taxCode"
                fullWidth
                size="small"
                sx={{ mt: 2 }}
                value={formData.taxCode}
                onChange={handleChange}
              />
              <TextField
                label="Số điện thoại"
                name="phone"
                fullWidth
                size="small"
                sx={{ mt: 2 }}
                value={formData.phone}
                onChange={handleChange}
              />
              <TextField
                label="Địa chỉ"
                name="address"
                fullWidth
                size="small"
                sx={{ mt: 2 }}
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Thông tin nhà cung cấp
                </Typography>
                {selectedSupplier ? (
                  <>
                    <Typography variant="body2">
                      Tên: {selectedSupplier.name}
                    </Typography>
                    <Typography variant="body2">
                      Email: {selectedSupplier.email}
                    </Typography>
                    <Typography variant="body2">
                      Địa chỉ: {selectedSupplier.address}
                    </Typography>
                    <Typography variant="body2">
                      SĐT: {selectedSupplier.phoneNumber}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chưa chọn nhà cung cấp
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* DANH SÁCH SẢN PHẨM */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Danh sách sản phẩm
          </Typography>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>STT</TableCell>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        options={productSuggestions}
                        getOptionLabel={(p) => p.productName || ""}
                        isOptionEqualToValue={(option, value) =>
                          option.productID === value.productId
                        }
                        value={item || { productName: "" }}
                        onChange={(e, value) => {
                          const newItems = [...formData.items];
                          if (value) {
                            newItems[index] = {
                              productId: value.productID,
                              productName: value.productName,
                              description: value.productDescription || "",
                              unit: value.unit || "",
                            };
                          } else {
                            newItems[index] = {
                              productName: "",
                              productId: null,
                            };
                          }
                          setFormData({ ...formData, items: newItems });
                        }}
                        onInputChange={(e, value, reason) => {
                          if (reason === "input")
                            handleItemChange(index, value);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Tên sản phẩm"
                            size="small"
                            fullWidth
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Xóa dòng này">
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
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddItem}
                      sx={{ color: palette.success.main }}
                    >
                      Thêm sản phẩm
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* BUTTONS */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 2,
            mt: 2,
          }}
        >
          <Button variant="contained" onClick={() => setOpenPreview(true)}>
            Xem trước
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSubmit("Draft")}
            disabled={loading}
          >
            {isUpdate ? "Cập nhật bản nháp" : "Lưu bản nháp"}
          </Button>

          <Button
            variant="contained"
            onClick={() => handleSubmit("Submit")}
            disabled={loading}
          >
            {isUpdate ? "Gửi yêu cầu" : "Gửi yêu cầu"}
          </Button>
        </Box>

        {/* POPUP XEM TRƯỚC */}
        <Dialog
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              textAlign: "center",
              bgcolor: "#0070C0",
              color: "white",
            }}
          >
            YÊU CẦU BÁO GIÁ (REQUEST FOR QUOTATION)
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {/* Bảng xem trước PRFQ */}
            {/* ... giữ nguyên code bảng preview từ bản cũ ... */}
          </DialogContent>
        </Dialog>
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
