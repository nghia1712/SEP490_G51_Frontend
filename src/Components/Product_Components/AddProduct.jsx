import React, { useState, useEffect } from "react";
import useCategory from "../../Hooks/useCategory";
// import useInventory from "../../Hooks/useInventory"; // Commented out - will be developed later
import useSupplier from "../../Hooks/useSupplier";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel,
  IconButton,
  Divider,
} from "@mui/material";

const AddProduct = ({
  open,
  handleClose,
  onSaveSuccess,
  createProduct,
  checkProductName,
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
    // imageUrl: "", // (commented) reserved for future URL paste feature
  });
  // const [selectedInventory, setSelectedInventory] = useState(""); // Commented out - will be developed later
  // const [inventoryStock, setInventoryStock] = useState(""); // Commented out - will be developed later
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [hasSupplier, setHasSupplier] = useState(false);

  // Use category hook
  const { categories, getAllCategories } = useCategory();
  // Use inventory hook
  // const { inventories, fetchInventories } = useInventory(); // Commented out - will be developed later
  // Use supplier hook
  const { suppliers, fetchSuppliers } = useSupplier();

  // console.log("Invetories:", inventories); // Commented out - will be developed later
  useEffect(() => {
    if (open) {
      getAllCategories();
      // fetchInventories(); // Commented out - will be developed later
      fetchSuppliers();
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
        // imageUrl: "", // (commented)
      });
      // setSelectedInventory(""); // Commented out - will be developed later
      // setInventoryStock(""); // Commented out - will be developed later
      setErrors({});
      setImagePreview(null);
      setLoading(false);
      setSuccessMessage("");
      setHasSupplier(false);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let val = value;
    if (["minQuantity", "maxQuantity", "totalCurrentQuantity"].includes(name)) {
      val = Number(value) >= 0 ? Number(value) : 0;
    }

    setProductData((prev) => ({ ...prev, [name]: val }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductData((prev) => ({ ...prev, productImage: file }));
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      // clear url input when selecting file
      setProductData((prev) => ({ ...prev, imageUrl: "" }));
    } else {
      setProductData((prev) => ({ ...prev, productImage: null }));
      setImagePreview(null);
    }
    if (errors.productImage) {
      setErrors((prev) => ({ ...prev, productImage: "" }));
    }
  };

  // Handle inventory selection and stock input
  // const handleInventorySelect = (e) => { // Commented out - will be developed later
  //     setSelectedInventory(e.target.value);
  //     setInventoryStock("");
  //     setErrors((prev) => ({ ...prev, location: "" }));
  // };

  // const handleInventoryStockInput = (e) => { // Commented out - will be developed later
  //     setInventoryStock(e.target.value);
  //     setErrors((prev) => ({ ...prev, location: "" }));
  // };

  // const handleAddInventory = () => { // Commented out - will be developed later
  //     if (!selectedInventory || inventoryStock === "" || Number(inventoryStock) < 0) {
  //         setErrors((prev) => ({
  //             ...prev,
  //             location: "Vui lòng chọn kệ và nhập số lượng tồn kho hợp lệ."
  //         }));
  //         return;
  //     }
  //     // Prevent duplicate inventory
  //     if (productData.location.some(inv => inv.inventoryId === selectedInventory)) {
  //         setErrors((prev) => ({
  //             ...prev,
  //             location: "Kệ đã được thêm."
  //         }));
  //         return;
  //     }

  //     // Kiểm tra sức chứa định lượng của kệ
  //     const inventoryObj = inventories.find(i => i._id === selectedInventory);
  //     if (inventoryObj) {
  //         const productQuantitative = Number(productData.quantitative) || 0;
  //         const addQuantitative = Number(inventoryStock) * productQuantitative;
  //         const availableQuantitative = (Number(inventoryObj.maxQuantitative) || 0) - (Number(inventoryObj.currentQuantitative) || 0);

  //         if (addQuantitative > availableQuantitative) {
  //             setErrors((prev) => ({
  //                 ...prev,
  //                 location: `Kệ này chỉ còn sức chứa định lượng tối đa là ${availableQuantitative}. Sản phẩm bạn thêm vượt quá sức chứa.`
  //             }));
  //             return;
  //         }
  //     }

  //     setProductData((prev) => ({
  //         ...prev,
  //         location: [
  //             ...prev.location,
  //             { inventoryId: selectedInventory, stock: Number(inventoryStock) }
  //         ]
  //     }));
  //     setSelectedInventory("");
  //     setInventoryStock("");
  // };

  // const handleRemoveInventory = (inventoryId) => { // Commented out - will be developed later
  //     setProductData((prev) => ({
  //         ...prev,
  //         location: prev.location.filter(inv => inv.inventoryId !== inventoryId)
  //     }));
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

    // Validate ProductName (required, 10-100 characters)
    if (
      !productData.productName ||
      productData.productName.trim().length < 10
    ) {
      tempErrors.productName = "Tên thuốc phải có ít nhất 10 ký tự.";
    } else if (productData.productName.length > 100) {
      tempErrors.productName = "Tên thuốc không được vượt quá 100 ký tự.";
    } else {
      tempErrors.productName = "";
    }

    // Validate CategoryID (required)
    tempErrors.categoryId = productData.categoryId
      ? ""
      : "Vui lòng chọn danh mục.";

    // Validate Unit (required, max 10 characters)
    if (!productData.unit || productData.unit.trim().length === 0) {
      tempErrors.unit = "Đơn vị không được bỏ trống.";
    } else if (productData.unit.length > 10) {
      tempErrors.unit = "Đơn vị không được vượt quá 10 ký tự.";
    } else {
      tempErrors.unit = "";
    }
    // validate min/max
    if (productData.minQuantity < 0) {
      tempErrors.minQuantity = "Số lượng tối thiểu không được nhỏ hơn 0.";
    }
    if (productData.maxQuantity < 0) {
      tempErrors.maxQuantity = "Số lượng tối đa không được nhỏ hơn 0.";
    }
    if (productData.minQuantity > productData.maxQuantity) {
      tempErrors.minQuantity =
        "Số lượng tối thiểu không được lớn hơn số lượng tối đa.";
      tempErrors.maxQuantity =
        "Số lượng tối đa không được nhỏ hơn số lượng tối thiểu.";
    }

    // Validate ProductDescription (optional, max 300 characters)
    if (
      productData.productDescription &&
      productData.productDescription.length > 300
    ) {
      tempErrors.productDescription = "Mô tả không được vượt quá 300 ký tự.";
    } else {
      tempErrors.productDescription = "";
    }

    // Bỏ validate số lượng (ẩn khỏi form), giữ giá trị mặc định 0

    // Validate Image (file is required for now)
    if (!productData.productImage) {
      tempErrors.productImage = "Vui lòng chọn hình ảnh thuốc.";
    } else if (
      !["image/jpeg", "image/png"].includes(productData.productImage.type)
    ) {
      tempErrors.productImage = "Hình ảnh phải là định dạng JPEG hoặc PNG.";
    } else {
      tempErrors.productImage = "";
    }

    setErrors(tempErrors);
    const isFormValid = Object.values(tempErrors).every((x) => x === "");
    return isFormValid;
  };

  const handleSave = async () => {
    setErrors((prev) => ({ ...prev, general: "" }));
    if (await validate()) {
      setLoading(true);
      try {
        let imagePath = ""; // URL paste feature disabled for now
        if (productData.productImage) {
          // upload then take returned path
          const { default: productAPI } = await import("../../API/productAPI");
          const uploadRes = await productAPI.uploadImage(
            productData.productImage
          );
          imagePath = uploadRes?.data?.data || "";
        }

        const body = {
          productName: productData.productName,
          categoryID: productData.categoryId,
          productDescription: productData.productDescription || "",
          unit: productData.unit,
          minQuantity: productData.minQuantity,
          maxQuantity: productData.maxQuantity,
          totalCurrentQuantity: productData.totalCurrentQuantity,
          status: productData.status,
          image: imagePath,
        };

        const { default: productAPI2 } = await import("../../API/productAPI");
        await productAPI2.createJson(body);
        // success flow: show message and close after 3s
        setSuccessMessage("Thêm thuốc thành công!");
        setLoading(false);
        setTimeout(() => {
          onSaveSuccess();
          handleClose();
        }, 3000);
        return;
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          general: error?.message || "Có lỗi xảy ra.",
        }));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Thêm Thuốc Mới</DialogTitle>
      <Divider sx={{ opacity: 0.5 }} />
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {errors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.general}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 3 }}>
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
                  placeholder="Nhập tên thuốc (10-100 ký tự)"
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
                    {(() => {
                      console.log("🔍 All categories:", categories);
                      const activeCategories = categories.filter((cat) => {
                        console.log(
                          "📋 Category:",
                          cat.name || cat.categoryName,
                          "Status:",
                          cat.status,
                          "IsActive:",
                          cat.isActive
                        );
                        return cat.status === true || cat.isActive === true;
                      });
                      console.log("✅ Active categories:", activeCategories);

                      // Fallback: nếu không có danh mục hoạt động, hiển thị tất cả
                      const categoriesToShow =
                        activeCategories.length > 0
                          ? activeCategories
                          : categories;
                      console.log("📝 Categories to show:", categoriesToShow);

                      return categoriesToShow.map((cat) => (
                        <MenuItem
                          key={cat.categoryID || cat._id}
                          value={cat.categoryID || cat._id}
                        >
                          {cat.name || cat.categoryName}
                        </MenuItem>
                      ));
                    })()}
                  </Select>
                  {errors.categoryId && (
                    <FormHelperText>{errors.categoryId}</FormHelperText>
                  )}
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
                  placeholder="Nhập mô tả thuốc (tối đa 300 ký tự)"
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
                    <MenuItem value="">
                      <em>Tùy chọn</em>
                    </MenuItem>
                    <MenuItem value="Hộp">Hộp</MenuItem>
                    <MenuItem value="Vỉ">Vỉ</MenuItem>
                    <MenuItem value="Lọ">Lọ</MenuItem>
                  </Select>
                  {errors.unit && (
                    <FormHelperText>{errors.unit}</FormHelperText>
                  )}
                </FormControl>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    label="Số lượng tối thiểu"
                    type="number"
                    name="minQuantity"
                    value={productData.minQuantity}
                    onChange={handleChange}
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                    error={!!errors.minQuantity}
                    helperText={errors.minQuantity}
                  />
                  <TextField
                    label="Số lượng tối đa"
                    type="number"
                    name="maxQuantity"
                    value={productData.maxQuantity}
                    onChange={handleChange}
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                    error={!!errors.maxQuantity}
                    helperText={errors.maxQuantity}
                  />
                </Box>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">Trạng Thái</InputLabel>
                  <Select
                    labelId="status-select-label"
                    name="status"
                    value={productData.status}
                    label="Trạng Thái"
                    onChange={(e) =>
                      setProductData((prev) => ({
                        ...prev,
                        status: e.target.value === "true",
                      }))
                    }
                  >
                    <MenuItem value={false}>Ngừng bán</MenuItem>
                    <MenuItem value={true}>Đang bán</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* Right side - Image */}
            <Box
              sx={{
                width: "300px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Button
                variant="outlined"
                component="label"
                color={errors.productImage ? "error" : "primary"}
                sx={{ mb: 2 }}
              >
                Chọn Hình Ảnh
                <input
                  type="file"
                  hidden
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                />
              </Button>
              {/** URL image input (commented for later use)
                            <TextField
                                name="imageUrl"
                                label="URL Hình Ảnh (tùy chọn)"
                                value={productData.imageUrl}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                placeholder="https://.../image.png"
                                sx={{ mb: 2 }}
                            />
                            */}
              {errors.productImage && (
                <FormHelperText error sx={{ mb: 2 }}>
                  {errors.productImage}
                </FormHelperText>
              )}
              {imagePreview ? (
                <Box sx={{ textAlign: "center" }}>
                  <img
                    src={imagePreview}
                    alt="Xem trước thuốc"
                    style={{
                      maxWidth: "250px",
                      height: "auto",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    width: "250px",
                    height: "200px",
                    border: "2px dashed #e0e0e0",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                  }}
                >
                  <Typography variant="body2">Chưa có hình ảnh</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <Divider sx={{ opacity: 0.5 }} />
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button
          onClick={handleClose}
          disabled={loading || !!successMessage}
          color="secondary"
        >
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !!successMessage}
        >
          {loading ? <CircularProgress size={24} /> : "Lưu Thuốc"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProduct;
