import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, FormHelperText, Stack, Alert, Box, CircularProgress, Typography,
  Divider
} from "@mui/material";
import useCategory from "../../Hooks/useCategory";
// import useInventory from "../../Hooks/useInventory"; // Commented out - will be developed later
import useProduct from "../../Hooks/useProduct";
import productAPI from "../../API/productAPI";

const EditProduct = ({
  open,
  handleClose,
  product,
  onUpdateSuccess,
  existingProducts = [],
}) => {
  const [productData, setProductData] = useState({
    productName: "",
    categoryId: "",
    productDescription: "",
    unit: "",
    minQuantity: 0,
    maxQuantity: 0,
    totalCurrentQuantity: 0,
    status: false,
    productImage: null,
  });
  // const [selectedInventory, setSelectedInventory] = useState(""); // Commented out - will be developed later
  // const [inventoryStock, setInventoryStock] = useState(""); // Commented out - will be developed later
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null); // URL của hình ảnh hiện tại từ database
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  // const [imageUrlInput, setImageUrlInput] = useState(""); // (commented) reserved for future URL paste feature

  // Hooks for category, inventory, and product
  const { categories, getAllCategories } = useCategory();
  // const { inventories, fetchInventories } = useInventory(); // Commented out - will be developed later
  const { updateProduct } = useProduct();

  const normalizeStatus = (statusValue) => {
    if (typeof statusValue === "boolean") return statusValue;
    if (typeof statusValue === "number") return statusValue === 1;
    if (typeof statusValue === "string") {
      const normalized = statusValue.toLowerCase();
      return ["true", "1", "active", "đang bán"].includes(normalized);
    }
    return false;
  };

  const fetchImageFileFromUrl = async (url) => {
    if (!url) return null;
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      const extension =
        blob.type && blob.type.includes("/")
          ? `.${blob.type.split("/")[1]}`
          : ".jpg";
      return new File([blob], `current-image${extension}`, {
        type: blob.type || "image/jpeg",
      });
    } catch (error) {
      console.error("Không thể tải ảnh hiện tại:", error);
      return null;
    }
  };

  useEffect(() => {
    if (open) {
      getAllCategories();
      // fetchInventories(); // Commented out - will be developed later
      if (product) {
        setProductData({
          productName: product.productName || "",
          categoryId: product.categoryID || product.categoryId?._id || product.categoryId || "",
          productDescription: product.productDescription || "",
          unit: product.unit || "",
          minQuantity: product.minQuantity || 0,
          maxQuantity: product.maxQuantity || 0,
      totalCurrentQuantity: product.totalCurrentQuantity || 0,
          status: normalizeStatus(product.status),
          productImage: null,
        });
        const imageUrl = product.image ? `http://localhost:5137${product.image}` : null;
        setCurrentImageUrl(imageUrl);
        setImagePreview(imageUrl);
      }
    } else {
      setProductData({
        productName: "",
        categoryId: "",
        productDescription: "",
        unit: "",
        minQuantity: 0,
        maxQuantity: 0,
        totalCurrentQuantity: 0,
        status: false,
        productImage: null,
      });
      // setSelectedInventory(""); // Commented out - will be developed later
      // setInventoryStock(""); // Commented out - will be developed later
      setErrors({});
      setImagePreview(null);
      setCurrentImageUrl(null);
      setLoading(false);
      setSuccessMessage("");
      // setImageUrlInput("");
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


  const normalizeName = (value = "") =>
    String(value ?? "").trim().toLowerCase();

  const getProductIdValue = (item = {}) =>
    item?.ProductID ??
    item?.productID ??
    item?.ProductId ??
    item?.productId ??
    item?.id ??
    item?._id ??
    "";

  const validate = async () => {
    let tempErrors = {};
    
    // Validate ProductName (optional, but if provided: 10-100 characters)
    if (productData.productName && productData.productName.trim().length > 0) {
      if (productData.productName.trim().length < 10) {
        tempErrors.productName = "Tên thuốc phải có ít nhất 10 ký tự.";
      } else if (productData.productName.length > 100) {
        tempErrors.productName = "Tên thuốc không được vượt quá 100 ký tự.";
      } else {
        tempErrors.productName = "";
      }
    } else {
      tempErrors.productName = "";
    }

    if (
      !tempErrors.productName &&
      productData.productName &&
      productData.productName.trim()
    ) {
      const normalizedNewName = normalizeName(productData.productName);
      const currentId = getProductIdValue(product);
      const isDuplicate = (existingProducts || []).some((prod) => {
        const existingId = getProductIdValue(prod);
        if (existingId === currentId) return false;
        const existingName =
          prod?.productName ||
          prod?.ProductName ||
          prod?.name ||
          prod?.Name ||
          "";
        return normalizeName(existingName) === normalizedNewName;
      });
      if (isDuplicate) {
        tempErrors.productName = "Tên thuốc đã tồn tại.";
      }
    }
    
    // Validate CategoryID (optional)
    tempErrors.categoryId = "";
    
    // Validate Unit (optional, but if provided: max 10 characters)
    if (productData.unit && productData.unit.trim().length > 0) {
      if (productData.unit.length > 10) {
        tempErrors.unit = "Đơn vị không được vượt quá 10 ký tự.";
      } else {
        tempErrors.unit = "";
      }
    } else {
      tempErrors.unit = "";
    }
    
    // Validate ProductDescription (optional, max 300 characters)
    if (productData.productDescription && productData.productDescription.length > 300) {
        tempErrors.productDescription = "Mô tả không được vượt quá 300 ký tự.";
    } else {
        tempErrors.productDescription = "";
    }
    
    // Validate MinQuantity (optional, but if provided: >= 0)
    if (productData.minQuantity < 0) {
        tempErrors.minQuantity = "Số lượng tối thiểu phải không âm.";
    } else {
        tempErrors.minQuantity = "";
    }
    
    // Validate MaxQuantity (optional, but if provided: >= 0)
    if (productData.maxQuantity < 0) {
        tempErrors.maxQuantity = "Số lượng tối đa phải không âm.";
    } else {
        tempErrors.maxQuantity = "";
    }
    
    // Validate MinQuantity <= MaxQuantity (only if both are provided)
    if (productData.minQuantity > 0 && productData.maxQuantity > 0 && productData.minQuantity > productData.maxQuantity) {
        tempErrors.minQuantity = "Số lượng tối thiểu không được lớn hơn số lượng tối đa.";
    }
    
    // Validate TotalCurrentQuantity (optional, but if provided: >= 0)
    // Image is optional for edit, only validate if provided
    if (productData.productImage && typeof productData.productImage === 'object' && !["image/jpeg", "image/png"].includes(productData.productImage.type)) {
        tempErrors.productImage = "Hình ảnh phải là định dạng JPEG hoặc PNG.";
    } else {
        tempErrors.productImage = "";
    }
    
    setErrors(tempErrors);
    return Object.values(tempErrors).every((x) => x === "");
  };

  const handleUpdate = async () => {
    setErrors(prev => ({ ...prev, general: "" }));
    
    // Always validate but don't block if validation fails
    const isValid = await validate();
    
    if (!isValid) {
      // Show validation errors but don't close dialog
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    const resolvedProductName =
      productData.productName && productData.productName.trim()
        ? productData.productName.trim()
        : product.productName;
    const resolvedDescription =
      productData.productDescription && productData.productDescription.trim()
        ? productData.productDescription.trim()
        : product.productDescription || "";
    const resolvedUnit =
      productData.unit && productData.unit.trim()
        ? productData.unit.trim()
        : product.unit || "";
    const resolvedCategoryId =
      productData.categoryId ||
      product.categoryID ||
      product.CategoryID ||
      product.categoryId ||
      product.category?.categoryID ||
      0;
    const resolvedMin = Number(
      productData.minQuantity ?? product.minQuantity ?? 0
    );
    const resolvedMax = Number(
      productData.maxQuantity ?? product.maxQuantity ?? 0
    );
    const resolvedStatus = normalizeStatus(
      productData.status ?? product.status ?? false
    );

    formData.append("ProductName", resolvedProductName || "");
    formData.append("ProductDescription", resolvedDescription);
    formData.append("Unit", resolvedUnit);
    formData.append("CategoryID", Number(resolvedCategoryId));
    formData.append("MinQuantity", isNaN(resolvedMin) ? 0 : resolvedMin);
    formData.append("MaxQuantity", isNaN(resolvedMax) ? 0 : resolvedMax);
    formData.append("Status", resolvedStatus ? "true" : "false");

    if (
      productData.productImage &&
      typeof productData.productImage === "object"
    ) {
      formData.append("Image", productData.productImage);
    } else {
      const existingImageFile = await fetchImageFileFromUrl(currentImageUrl);
      if (existingImageFile) {
        formData.append("Image", existingImageFile);
      }
    }

    try {
      const productId = getProductIdValue(product);
      console.log("Product ID:", productId, "Product:", product);
      await updateProduct(productId, formData);
      
      // Show success message
      setSuccessMessage("Cập nhật thành công!");
      setLoading(false);
      
      // Close dialog after 3 seconds
      setTimeout(() => {
        onUpdateSuccess();
        handleClose();
      }, 3000);
      
    } catch (error) {
      setErrors((prev) => ({ ...prev, general: error?.message || "Có lỗi xảy ra." }));
      setLoading(false);
    }
  };

  console.log("Product Data:", product);
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Cập Nhật Thuốc</DialogTitle>
      <Divider sx={{ opacity: 0.5 }} />
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {errors.general && <Alert severity="error" sx={{ mb: 2 }}>{errors.general}</Alert>}
          {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
          
          <Box sx={{ display: 'flex', gap: 3 }}>
            {/* Left side - Form fields */}
            <Box sx={{ flex: 1 }}>
              <Stack spacing={2}>
                <TextField 
                  autoFocus 
                  name="productName" 
                  label="Tên Thuốc" 
                  value={productData.productName} 
                  onChange={handleChange} 
                  error={!!errors.productName} 
                  helperText={errors.productName} 
                  fullWidth 
                  placeholder="Nhập tên thuốc (tùy chọn, 10-100 ký tự nếu nhập)" 
                />
                <FormControl fullWidth error={!!errors.categoryId}>
                  <InputLabel id="category-select-label">Danh Mục</InputLabel>
                  <Select labelId="category-select-label" name="categoryId" value={productData.categoryId} label="Danh Mục" onChange={handleChange}>
                    <MenuItem value=""><em>Chọn danh mục (tùy chọn)</em></MenuItem>
                    {(categories || []).map((cat) => (
                      <MenuItem key={cat.categoryID || cat._id} value={cat.categoryID || cat._id}>
                        {cat.name || cat.categoryName}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
                </FormControl>
                <TextField 
                  name="productDescription" 
                  label="Mô tả thuốc" 
                  value={productData.productDescription} 
                  onChange={handleChange} 
                  error={!!errors.productDescription} 
                  helperText={errors.productDescription} 
                  fullWidth 
                  multiline
                  rows={3}
                  placeholder="Nhập mô tả thuốc (tùy chọn, tối đa 300 ký tự)"
                />
                <FormControl fullWidth error={!!errors.unit}>
                  <InputLabel id="unit-select-label">Đơn Vị</InputLabel>
                  <Select
                    labelId="unit-select-label"
                    name="unit"
                    value={productData.unit}
                    label="Đơn Vị"
                    onChange={handleChange}
                  >
                    <MenuItem value=""><em>Tùy chọn</em></MenuItem>
                    <MenuItem value="Hộp">Hộp</MenuItem>
                    <MenuItem value="Vỉ">Vỉ</MenuItem>
                    <MenuItem value="Lọ">Lọ</MenuItem>
                  </Select>
                  {errors.unit && <FormHelperText>{errors.unit}</FormHelperText>}
                </FormControl>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    name="minQuantity"
                    label="Số lượng tối thiểu"
                    type="number"
                    value={productData.minQuantity}
                    onChange={handleChange}
                    error={!!errors.minQuantity}
                    helperText={errors.minQuantity}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    name="maxQuantity"
                    label="Số lượng tối đa"
                    type="number"
                    value={productData.maxQuantity}
                    onChange={handleChange}
                    error={!!errors.maxQuantity}
                    helperText={errors.maxQuantity}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Box>
                {/* Trường tổng số lượng và trạng thái bị ẩn theo yêu cầu */}
              </Stack>
            </Box>
            
            {/* Right side - Image */}
            <Box sx={{ width: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button variant="outlined" component="label" color={errors.productImage ? "error" : "primary"}>
                  {currentImageUrl ? "Thay đổi ảnh" : "Chọn Hình Ảnh"}
                  <input type="file" hidden accept="image/png, image/jpeg" onChange={handleFileChange} />
                </Button>
              </Box>
          {/** URL image input (commented for later use)
          <TextField
            name="imageUrl"
            label="URL Hình Ảnh (tùy chọn)"
            value={imageUrlInput}
            onChange={(e) => {
              const v = e.target.value;
              setImageUrlInput(v);
              if (/^(https?:)\/\//i.test(v)) {
                setProductData((prev) => ({ ...prev, productImage: null }));
                setImagePreview(v);
                setCurrentImageUrl(v);
              } else if (!v) {
                setImagePreview(currentImageUrl);
              }
            }}
            fullWidth
            size="small"
            placeholder="https://.../image.png"
            sx={{ mb: 2 }}
          />
          */}
              {errors.productImage && <FormHelperText error sx={{ mb: 2 }}>{errors.productImage}</FormHelperText>}
              {imagePreview ? (
                <Box sx={{ textAlign: 'center' }}>
                  <img 
                    src={imagePreview} 
                    alt="Xem trước thuốc" 
                    style={{ 
                      maxWidth: "250px", 
                      height: "auto", 
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {productData.productImage ? "Hình ảnh mới" : "Hình ảnh hiện tại"}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  width: '250px', 
                  height: '200px', 
                  border: '2px dashed #e0e0e0', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999'
                }}>
                  <Typography variant="body2">Chưa có hình ảnh</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <Divider sx={{ opacity: 0.5 }} />
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={handleClose} disabled={loading || Boolean(successMessage)} color="secondary">Đóng</Button>
        <Button
          onClick={handleUpdate}
          variant="contained"
          disabled={loading || Boolean(successMessage)}
        >
          {loading ? <CircularProgress size={24} /> : "Cập Nhật Thuốc"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProduct;
