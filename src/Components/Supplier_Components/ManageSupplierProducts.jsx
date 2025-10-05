import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Alert,
  Chip,
  Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import supplierProductAPI from "../../API/supplierProductAPI";
import productAPI from "../../API/productAPI";
import supplierAPI from "../../API/supplierAPI";

const palette = {
  dark: "#155E64",
  medium: "#75B39C",
};

const ManageSupplierProducts = () => {
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    supplier: null,
    product: null,
    price: "",
    stock: "",
    expiry: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [spRes, pRes, sRes] = await Promise.all([
        supplierProductAPI.getAll(),
        productAPI.getAll(),
        supplierAPI.getAll(),
      ]);
      console.log("Fetched data:", {
        spRes: spRes.data,
        pRes: pRes.data,
        sRes: sRes.data,
      });
      setSupplierProducts(spRes.data || []);
      setProducts(pRes.data || []);
      setSuppliers(sRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        "Không thể tải dữ liệu: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        supplier: item.supplier,
        product: item.product,
        price: item.price,
        stock: item.stock,
        expiry: item.expiry ? item.expiry.split("T")[0] : "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        supplier: null,
        product: null,
        price: "",
        stock: "",
        expiry: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      const payload = {
        supplierId: formData.supplier?._id,
        productId: formData.product?._id,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        expiry: formData.expiry || null,
      };

      console.log("Submitting payload:", payload);

      if (editingItem) {
        console.log("Updating existing item:", editingItem._id);
        const response = await supplierProductAPI.update(editingItem._id, {
          price: payload.price,
          stock: payload.stock,
          expiry: payload.expiry,
        });
        console.log("Update response:", response);
        setSuccess("Cập nhật thành công!");
      } else {
        console.log("Creating new item");
        const response = await supplierProductAPI.create(payload);
        console.log("Create response:", response);
        setSuccess("Tạo quan hệ mới thành công!");
      }

      setTimeout(() => {
        handleCloseDialog();
        fetchData();
        setSuccess("");
      }, 1500);
    } catch (err) {
      console.error("Submit error:", err);
      console.error("Error response:", err.response);
      setError(err.response?.data?.message || "Có lỗi xảy ra: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa quan hệ này?")) {
      try {
        await supplierProductAPI.delete(id);
        setSuccess("Xóa thành công!");
        fetchData();
        setTimeout(() => setSuccess(""), 2000);
      } catch (err) {
        setError("Không thể xóa quan hệ này");
      }
    }
  };

  const getAvailableProducts = () => {
    if (!formData.supplier || editingItem) return products;

    const existingProductIds = supplierProducts
      .filter((sp) => sp.supplier._id === formData.supplier._id)
      .map((sp) => sp.product._id);

    return products.filter((p) => !existingProductIds.includes(p._id));
  };

  const handleCreateSampleData = async () => {
    if (
      window.confirm(
        "Bạn có muốn tạo dữ liệu mẫu cho quan hệ supplier-product không?"
      )
    ) {
      try {
        setLoading(true);
        const response = await supplierProductAPI.createSampleData();
        setSuccess(response.data.message);
        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tạo dữ liệu mẫu");
        setTimeout(() => setError(""), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          Quản lý Quan hệ Nhà cung cấp - Sản phẩm
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCreateSampleData}
            disabled={loading}
            sx={{ color: palette.medium, borderColor: palette.medium }}
          >
            Tạo dữ liệu mẫu
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: palette.dark, "&:hover": { bgcolor: "#104c50" } }}
          >
            Thêm quan hệ mới
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Nhà cung cấp</strong>
                </TableCell>
                <TableCell>
                  <strong>Sản phẩm</strong>
                </TableCell>
                <TableCell>
                  <strong>Danh mục</strong>
                </TableCell>
                <TableCell>
                  <strong>Giá (VNĐ)</strong>
                </TableCell>
                <TableCell>
                  <strong>Tồn kho</strong>
                </TableCell>
                <TableCell>
                  <strong>Hạn sử dụng</strong>
                </TableCell>
                <TableCell>
                  <strong>Thao tác</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierProducts.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.supplier?.name || "N/A"}</TableCell>
                  <TableCell>{item.product?.productName || "N/A"}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.product?.categoryId?.categoryName || "N/A"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{item.price?.toLocaleString() || "0"}</TableCell>
                  <TableCell>{item.stock || 0}</TableCell>
                  <TableCell>
                    {item.expiry
                      ? new Date(item.expiry).toLocaleDateString("vi-VN")
                      : "Không có"}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleOpenDialog(item)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(item._id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {supplierProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Chưa có quan hệ nào được tạo
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog for Create/Edit */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? "Chỉnh sửa quan hệ" : "Tạo quan hệ mới"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={suppliers}
                getOptionLabel={(option) => option.name}
                value={formData.supplier}
                onChange={(_, value) =>
                  setFormData((prev) => ({
                    ...prev,
                    supplier: value,
                    product: null,
                  }))
                }
                disabled={!!editingItem}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Nhà cung cấp"
                    fullWidth
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={getAvailableProducts()}
                getOptionLabel={(option) => option.productName}
                value={formData.product}
                onChange={(_, value) =>
                  setFormData((prev) => ({ ...prev, product: value }))
                }
                disabled={!!editingItem || !formData.supplier}
                renderInput={(params) => (
                  <TextField {...params} label="Sản phẩm" fullWidth required />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Giá nhập (VNĐ)"
                type="number"
                fullWidth
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Tồn kho"
                type="number"
                fullWidth
                value={formData.stock}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, stock: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Hạn sử dụng"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.expiry}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, expiry: e.target.value }))
                }
              />
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              loading ||
              !formData.supplier ||
              !formData.product ||
              !formData.price
            }
            sx={{ bgcolor: palette.dark, "&:hover": { bgcolor: "#104c50" } }}
          >
            {loading ? "Đang xử lý..." : editingItem ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageSupplierProducts;
