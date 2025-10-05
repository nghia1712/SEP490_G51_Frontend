// AddProduct.js - Phiên bản Material-UI

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from "@mui/material";

// Đổi tên prop cho phù hợp với MUI: show -> open, handleSave -> onSaveSuccess
const AddProduct = ({ open, handleClose, onSaveSuccess }) => {
  const [productData, setProductData] = useState({
    productName: "",
    categoryId: "",
    totalStock: 0,
    productImage: null, // Dùng null thay vì chuỗi rỗng cho file
    unit: "",
    location: "",
    status: "active",
  });
  const [imagePreview, setImagePreview] = useState(null); // State riêng cho ảnh preview
  const [categories, setCategories] = useState([]);
  // const [shelves, setShelves] = useState([]); // Thêm shelves state - Commented out - will be developed later
  const [errors, setErrors] = useState({}); // Đổi tên để tránh nhầm lẫn
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // Chỉ fetch khi dialog mở
      axios
        .get("http://localhost:9999/categories/getAllCategories")
        .then((response) => setCategories(response.data))
        .catch((error) => console.error("Error fetching categories:", error));

      // Fetch shelves/inventories
      // axios.get("http://localhost:9999/inventory") // Commented out - will be developed later
      //   .then((response) => setShelves(response.data)) // Commented out - will be developed later
      //   .catch((error) => console.error("Error fetching shelves:", error)); // Commented out - will be developed later
    } else {
      // Reset form khi dialog đóng
      setProductData({
        productName: "", categoryId: "", totalStock: 0,
        productImage: null, unit: "", location: "", status: "active",
      });
      setErrors({});
      setImagePreview(null);
      setLoading(false);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductData((prev) => ({ ...prev, productImage: file }));
      // Tạo URL để preview ảnh
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      // Clean up URL object sau khi component unmount để tránh memory leak
      // (useEffect sẽ xử lý việc này khi dialog đóng)
    } else {
      setProductData((prev) => ({ ...prev, productImage: null }));
      setImagePreview(null);
    }
    if (errors.productImage) {
      setErrors((prev) => ({ ...prev, productImage: "" }));
    }
  };

  // const handleShelfSelect = (e) => { // Commented out - will be developed later
  //   const selectedShelf = shelves.find(shelf => shelf._id === e.target.value);
  //   if (selectedShelf) {
  //     setProductData((prev) => ({
  //       ...prev,
  //       location: selectedShelf.name
  //     }));
  //     if (errors.location) {
  //       setErrors((prev) => ({ ...prev, location: "" }));
  //     }
  //   }
  // };

  const validate = async () => {
    let tempErrors = {};
    tempErrors.productName = productData.productName ? "" : "Tên sản phẩm không được bỏ trống.";
    tempErrors.categoryId = productData.categoryId ? "" : "Vui lòng chọn danh mục.";
    tempErrors.unit = productData.unit ? "" : "Đơn vị không được bỏ trống.";
    tempErrors.location = productData.location ? "" : "Vị trí không được bỏ trống.";

    if (!productData.productImage) {
      tempErrors.productImage = "Vui lòng chọn hình ảnh sản phẩm.";
    } else if (!["image/jpeg", "image/png"].includes(productData.productImage.type)) {
      tempErrors.productImage = "Hình ảnh phải là định dạng JPEG hoặc PNG.";
    } else {
      tempErrors.productImage = "";
    }

    setErrors(tempErrors);

    // Kiểm tra xem tất cả các giá trị trong tempErrors có rỗng không
    const isValid = Object.values(tempErrors).every((x) => x === "");

    if (isValid) {
      // Chỉ kiểm tra tên khi các trường khác đã hợp lệ
      try {
        const response = await axios.get(`http://localhost:9999/products/checkProductName?name=${productData.productName}`);
        if (response.data.exists) {
          setErrors(prev => ({ ...prev, productName: "Sản phẩm đã tồn tại trong kho." }));
          return false;
        }
      } catch (error) {
        console.error("Error checking product name:", error);
        setErrors(prev => ({ ...prev, general: "Có lỗi xảy ra khi kiểm tra tên sản phẩm." }));
        return false;
      }
    }

    return isValid;
  };

  const handleSave = async () => {
    setErrors(prev => ({ ...prev, general: "" })); // Xóa lỗi chung cũ
    const isValid = await validate();

    if (isValid) {
      setLoading(true);
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      try {
        await axios.post(
          "http://localhost:9999/products/createProduct",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        onSaveSuccess(); // Gọi lại hàm fetchAllProducts
        handleClose(); // Tự động đóng dialog
      } catch (error) {
        console.error("Error creating product:", error);
        setErrors((prev) => ({
          ...prev,
          general: error.response?.data?.message || "Có lỗi xảy ra khi thêm sản phẩm.",
        }));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    // Dialog sẽ tự động quản lý zIndex và vị trí
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Thêm Sản Phẩm Mới</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {errors.general && <Alert severity="error">{errors.general}</Alert>}

          <TextField
            autoFocus
            name="productName"
            label="Tên Sản Phẩm"
            value={productData.productName}
            onChange={handleChange}
            error={!!errors.productName}
            helperText={errors.productName}
            fullWidth
          />

          <FormControl fullWidth error={!!errors.categoryId}>
            <InputLabel id="category-select-label">Danh Mục</InputLabel>
            <Select
              labelId="category-select-label"
              name="categoryId"
              value={productData.categoryId}
              label="Danh Mục"
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>Chọn danh mục</em>
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.categoryName}
                </MenuItem>
              ))}
            </Select>
            {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
          </FormControl>

          <TextField
            name="unit"
            label="Đơn Vị (ví dụ: cái, hộp, kg)"
            value={productData.unit}
            onChange={handleChange}
            error={!!errors.unit}
            helperText={errors.unit}
            fullWidth
          />

          {/* Thêm dropdown để chọn kệ hàng có sẵn */}
          {/* <FormControl fullWidth> // Commented out - will be developed later
            <InputLabel id="shelf-select-label">Chọn Kệ Hàng</InputLabel>
            <Select
              labelId="shelf-select-label"
              id="shelf-select"
              value=""
              label="Chọn Kệ Hàng"
              onChange={handleShelfSelect}
            >
              <MenuItem value=""><em>Chọn kệ hàng có sẵn</em></MenuItem>
              {shelves.map((shelf) => (
                <MenuItem key={shelf._id} value={shelf._id}>{shelf.name}</MenuItem>
              ))}
            </Select>
            <FormHelperText>Chọn kệ hàng hoặc nhập vị trí thủ công</FormHelperText>
          </FormControl> */}

          <TextField
            name="location"
            label="Vị Trí (ví dụ: Kệ A1, Kho B)"
            value={productData.location}
            onChange={handleChange}
            error={!!errors.location}
            helperText={errors.location}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel id="status-select-label">Trạng Thái</InputLabel>
            <Select
              labelId="status-select-label"
              name="status"
              value={productData.status}
              label="Trạng Thái"
              onChange={handleChange}
            >
              <MenuItem value="active">Đang bán</MenuItem>
              <MenuItem value="inactive">Ngừng bán</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            component="label"
            color={errors.productImage ? "error" : "primary"}
          >
            Chọn Hình Ảnh
            <input
              type="file"
              hidden
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
            />
          </Button>
          {errors.productImage && <FormHelperText error>{errors.productImage}</FormHelperText>}

          {imagePreview && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img
                src={imagePreview}
                alt="Xem trước sản phẩm"
                style={{ maxWidth: "200px", height: "auto", borderRadius: '8px' }}
              />
            </Box>
          )}

        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={handleClose} disabled={loading} color="secondary">
          Hủy
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Lưu Sản Phẩm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProduct;