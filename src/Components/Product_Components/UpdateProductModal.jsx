import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, FormHelperText, Stack, Alert, Box, CircularProgress, Typography,
  FormControlLabel, Checkbox, IconButton
} from "@mui/material";
import useCategory from "../../Hooks/useCategory";
// import useInventory from "../../Hooks/useInventory"; // Commented out - will be developed later
import useSupplier from "../../Hooks/useSupplier";
import useProduct from "../../Hooks/useProduct";

const UpdateProductModal = ({
  open,
  handleClose,
  product,
  onUpdateSuccess,
}) => {
  const [productData, setProductData] = useState({
    productName: "",
    categoryId: "",
    totalStock: 0,
    productImage: null,
    unit: "",
    location: [],
    status: "active",
    supplierId: "",
    quantitative: "",
  });
  // const [selectedInventory, setSelectedInventory] = useState(""); // Commented out - will be developed later
  // const [inventoryStock, setInventoryStock] = useState(""); // Commented out - will be developed later
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasSupplier, setHasSupplier] = useState(false);

  // Hooks for category, inventory, supplier, and product
  const { categories, getAllCategories } = useCategory();
  // const { inventories, fetchInventories } = useInventory(); // Commented out - will be developed later
  const { suppliers, fetchSuppliers } = useSupplier();
  const { updateProduct } = useProduct();

  useEffect(() => {
    if (open) {
      getAllCategories();
      // fetchInventories(); // Commented out - will be developed later
      fetchSuppliers();
      if (product) {
        setProductData({
          productName: product.productName || "",
          categoryId: product.categoryId?._id || product.categoryId || "",
          totalStock: product.totalStock || 0,
          productImage: null,
          unit: product.unit || "",
          // Chuẩn hóa location: mỗi item là { inventoryId, stock }
          location: Array.isArray(product.location)
            ? product.location.map(loc => ({
                inventoryId: typeof loc.inventoryId === "object" && loc.inventoryId._id
                  ? loc.inventoryId._id
                  : loc.inventoryId,
                stock: loc.stock
              }))
            : [],
          status: product.status || "active",
          supplierId: product.supplierId || "",
          quantitative: product.quantitative || "",
        });
        setImagePreview(product.productImage ? `http://localhost:9999${product.productImage}` : null);
        setHasSupplier(!!product.supplierId);
      }
    } else {
      setProductData({
        productName: "",
        categoryId: "",
        totalStock: 0,
        productImage: null,
        unit: "",
        location: [],
        status: "active",
        supplierId: "",
        quantitative: "",
      });
      // setSelectedInventory(""); // Commented out - will be developed later
      // setInventoryStock(""); // Commented out - will be developed later
      setErrors({});
      setImagePreview(null);
      setLoading(false);
      setHasSupplier(false);
    }
  }, [open, product]);

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
      setImagePreview(URL.createObjectURL(file));
    } else {
      setProductData((prev) => ({ ...prev, productImage: null }));
      setImagePreview(null);
    }
    if (errors.productImage) {
      setErrors((prev) => ({ ...prev, productImage: "" }));
    }
  };

  // const handleInventorySelect = (e) => { // Commented out - will be developed later
  //   setSelectedInventory(e.target.value);
  //   setInventoryStock("");
  //   setErrors((prev) => ({ ...prev, location: "" }));
  // };

  // const handleInventoryStockInput = (e) => { // Commented out - will be developed later
  //   setInventoryStock(e.target.value);
  //   setErrors((prev) => ({ ...prev, location: "" }));
  // };

  // const handleAddInventory = () => { // Commented out - will be developed later
  //   if (!selectedInventory || inventoryStock === "" || Number(inventoryStock) < 0) {
  //     setErrors((prev) => ({
  //       ...prev,
  //       location: "Vui lòng chọn kho và nhập số lượng tồn kho hợp lệ."
  //     }));
  //     return;
  //   }
  //   if (productData.location.some(inv => inv.inventoryId === selectedInventory)) {
  //     setErrors((prev) => ({
  //       ...prev,
  //       location: "Kho đã được thêm."
  //     }));
  //     return;
  //   }
  //   setProductData((prev) => ({
  //     ...prev,
  //     location: [
  //       ...prev.location,
  //       { inventoryId: selectedInventory, stock: Number(inventoryStock) }
  //     ]
  //   }));
  //   setSelectedInventory("");
  //   setInventoryStock("");
  // };

  // const handleRemoveInventory = (inventoryId) => { // Commented out - will be developed later
  //   setProductData((prev) => ({
  //     ...prev,
  //     location: prev.location.filter(inv => inv.inventoryId !== inventoryId)
  //   }));
  // };

  const handleSupplierCheck = (e) => {
    setHasSupplier(e.target.checked);
    if (!e.target.checked) {
      setProductData((prev) => ({ ...prev, supplierId: "" }));
    }
  };

  const handleSupplierSelect = (e) => {
    setProductData((prev) => ({ ...prev, supplierId: e.target.value }));
    if (errors.supplierId) {
      setErrors((prev) => ({ ...prev, supplierId: "" }));
    }
  };

  const validate = async () => {
    let tempErrors = {};
    tempErrors.productName = productData.productName ? "" : "Tên thuốc không được bỏ trống.";
    tempErrors.categoryId = productData.categoryId ? "" : "Vui lòng chọn danh mục.";
    tempErrors.unit = productData.unit ? "" : "Đơn vị không được bỏ trống.";
    tempErrors.totalStock = productData.totalStock && Number(productData.totalStock) >= 0 ? "" : "Tổng số lượng phải là số dương.";
    tempErrors.quantitative = productData.quantitative !== "" && !isNaN(productData.quantitative) ? "" : "Định lượng không hợp lệ.";
    // Hình ảnh KHÔNG bắt buộc, chỉ kiểm tra nếu có
    if (productData.productImage && !["image/jpeg", "image/png"].includes(productData.productImage.type)) {
        tempErrors.productImage = "Hình ảnh phải là định dạng JPEG hoặc PNG.";
    } else {
        tempErrors.productImage = "";
    }


    // Kiểm tra tổng số lượng tồn kho phải bằng tổng số lượng thuốc
    // const totalLocationStock = productData.location.reduce((sum, inv) => sum + Number(inv.stock || 0), 0); // Commented out - will be developed later
    // if (totalLocationStock !== Number(productData.totalStock)) { // Commented out - will be developed later
    //   tempErrors.location = "Số lượng thuốc trong các kệ phải bằng với tổng số lượng thuốc"; // Commented out - will be developed later
    // }

    if (hasSupplier && !productData.supplierId) {
        tempErrors.supplierId = "Vui lòng chọn nhà cung cấp.";
    } else {
        tempErrors.supplierId = "";
    }
    setErrors(tempErrors);

    return Object.values(tempErrors).every((x) => x === "");
  };

  const handleUpdate = async () => {
    setErrors(prev => ({ ...prev, general: "" }));
    if (validate()) {
      setLoading(true);
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (key === "location") {
          // Commented out - will be developed later
          // value.forEach((loc, idx) => {
          //   formData.append(`location[${idx}][inventoryId]`, loc.inventoryId);
          //   formData.append(`location[${idx}][stock]`, loc.stock);
          // });
        } else if (key === "productImage" && value && typeof value !== "string") {
          formData.append(key, value);
        } else {
          formData.append(key, value);
        }
      });

      try {
        await updateProduct(product._id, formData);
        onUpdateSuccess();
        handleClose();
      } catch (error) {
        setErrors((prev) => ({ ...prev, general: error?.message || "Có lỗi xảy ra." }));
      } finally {
        setLoading(false);
      }
    }
  };

  console.log("Product Data:", product);
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
    <DialogTitle>Cập Nhật Thuốc</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {errors.general && <Alert severity="error">{errors.general}</Alert>}
          <TextField autoFocus name="productName" label="Tên Thuốc" value={productData.productName} onChange={handleChange} error={!!errors.productName} helperText={errors.productName} fullWidth />
          <FormControl fullWidth error={!!errors.categoryId}>
            <InputLabel id="category-select-label">Danh Mục</InputLabel>
            <Select labelId="category-select-label" name="categoryId" value={productData.categoryId} label="Danh Mục" onChange={handleChange}>
              <MenuItem value=""><em>Chọn danh mục</em></MenuItem>
              {categories.map((cat) => (<MenuItem key={cat._id} value={cat._id}>{cat.categoryName}</MenuItem>))}
            </Select>
            {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
          </FormControl>
          <TextField name="unit" label="Đơn Vị (ví dụ: cái, hộp, kg)" value={productData.unit} onChange={handleChange} error={!!errors.unit} helperText={errors.unit} fullWidth />
          <TextField
            name="totalStock"
            label="Tổng Số Lượng"
            type="number"
            value={productData.totalStock}
            onChange={handleChange}
            error={!!errors.totalStock}
            helperText={errors.totalStock}
            fullWidth
          />
          <TextField
            name="quantitative"
            label="Định lượng (Quantitative)"
            type="number"
            value={productData.quantitative}
            onChange={handleChange}
            error={!!errors.quantitative}
            helperText={errors.quantitative}
            fullWidth
          />          
          <FormControl fullWidth>
            <InputLabel id="status-select-label">Trạng Thái</InputLabel>
            <Select labelId="status-select-label" name="status" value={productData.status} label="Trạng Thái" onChange={handleChange}>
              <MenuItem value="active">Đang bán</MenuItem>
              <MenuItem value="inactive">Ngừng bán</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" component="label" color={errors.productImage ? "error" : "primary"}>
            Chọn Hình Ảnh
            <input type="file" hidden accept="image/png, image/jpeg" onChange={handleFileChange} />
          </Button>
          {errors.productImage && <FormHelperText error>{errors.productImage}</FormHelperText>}
          {imagePreview && <Box sx={{ mt: 2, textAlign: 'center' }}><img src={imagePreview} alt="Xem trước thuốc" style={{ maxWidth: "200px", height: "auto", borderRadius: '8px' }} /></Box>}
          {/* Supplier checkbox and selection */}
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hasSupplier}
                  onChange={handleSupplierCheck}
                  color="primary"
                />
              }
              label="Thuốc này có nhà cung cấp"
            />
            {hasSupplier && (
              <FormControl fullWidth sx={{ mt: 2 }} error={!!errors.supplierId}>
                <InputLabel id="supplier-select-label">Chọn nhà cung cấp</InputLabel>
                <Select
                  labelId="supplier-select-label"
                  value={productData.supplierId}
                  label="Chọn nhà cung cấp"
                  onChange={handleSupplierSelect}
                >
                  <MenuItem value=""><em>Chọn nhà cung cấp</em></MenuItem>
                  {suppliers.map(sup => (
                    <MenuItem key={sup._id} value={sup._id}>{sup.name}</MenuItem>
                  ))}
                </Select>
                {errors.supplierId && <FormHelperText>{errors.supplierId}</FormHelperText>}
              </FormControl>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={handleClose} disabled={loading} color="secondary">Đóng</Button>
        <Button onClick={handleUpdate} variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : "Cập Nhật Thuốc"}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateProductModal;