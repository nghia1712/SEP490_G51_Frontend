import React, { useState, useEffect } from "react";
import useCategory from "../../Hooks/useCategory";
import DeleteIcon from "@mui/icons-material/Delete";
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
    status: true,
    productImages: [],
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  // const [selectedInventory, setSelectedInventory] = useState(""); // Commented out - will be developed later
  // const [inventoryStock, setInventoryStock] = useState(""); // Commented out - will be developed later
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [hasSupplier, setHasSupplier] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
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
        status: true,
        productImages: [],
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

  const normalizeName = (value = "") =>
    String(value ?? "")
      .trim()
      .toLowerCase();

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
    const files = Array.from(e.target.files);
    const newFiles = [...productData.productImages, ...files];

    setProductData((prev) => ({ ...prev, productImages: newFiles }));
    setImagePreviews(newFiles.map((file) => URL.createObjectURL(file)));

    if (errors.productImages) {
      setErrors((prev) => ({ ...prev, productImages: "" }));
    }
  };

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
    if (!productData.productImages || productData.productImages.length < 4) {
      tempErrors.productImages = "Vui lòng chọn ít nhất 4 hình ảnh.";
    } else if (productData.productImages.length > 6) {
      tempErrors.productImages = "Chỉ được chọn tối đa 6 hình ảnh.";
    } else if (
      !productData.productImages.every((file) =>
        ["image/jpeg", "image/png"].includes(file.type)
      )
    ) {
      tempErrors.productImages =
        "Tất cả hình ảnh phải là định dạng JPEG hoặc PNG.";
    } else {
      tempErrors.productImages = "";
    }
    if (!tempErrors.productName && productData.productName) {
      const normalizedNewName = normalizeName(productData.productName);
      const isDuplicate = (existingProducts || []).some((prod) => {
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

    if (
      !productData.productDescription ||
      productData.productDescription.trim() === ""
    ) {
      tempErrors.productDescription = "Mô tả thuốc là bắt buộc.";
    } else if (productData.productDescription.length > 300) {
      tempErrors.productDescription = "Mô tả không được vượt quá 300 ký tự.";
    } else {
      tempErrors.productDescription = "";
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
        const formData = new FormData();
        formData.append("ProductName", productData.productName.trim());
        formData.append("CategoryID", Number(productData.categoryId));
        formData.append(
          "ProductDescription",
          productData.productDescription || ""
        );
        formData.append("Unit", productData.unit);
        formData.append("MinQuantity", Number(productData.minQuantity));
        formData.append("MaxQuantity", Number(productData.maxQuantity));
        formData.append("Status", productData.status ? "true" : "false");
        formData.append("Image", productData.productImages[0] || null);
        formData.append("ImageA", productData.productImages[1] || null);
        formData.append("ImageB", productData.productImages[2] || null);
        formData.append("ImageC", productData.productImages[3] || null);
        formData.append("ImageD", productData.productImages[4] || null);
        formData.append("ImageE", productData.productImages[5] || null);

        const { default: productAPI2 } = await import("../../API/productAPI");
        await productAPI2.create(formData);
        // success flow: show message and close after 3s
        setSuccessMessage("Thêm thuốc thành công!");
        setSelectedImage(null);
        setTimeout(() => {
          onSaveSuccess();
          handleClose();
        }, 3000);
        return;
      } catch (error) {
        setLoading(false);
        setErrors((prev) => ({
          ...prev,
          general: error?.message || "Có lỗi xảy ra.",
        }));
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Thêm Thuốc Mới</DialogTitle>
      <Divider sx={{ opacity: 0.5 }} />
      <DialogContent sx={{ overflowY: "hidden", maxHeight: "none" }}>
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
                  label="Tên Thuốc *"
                  value={productData.productName}
                  onChange={handleChange}
                  error={!!errors.productName}
                  helperText={errors.productName}
                  fullWidth
                  placeholder="Nhập tên thuốc (10-100 ký tự)"
                />
                <FormControl fullWidth error={!!errors.categoryId}>
                  <InputLabel id="category-select-label">Danh Mục *</InputLabel>
                  <Select
                    labelId="category-select-label"
                    name="categoryId"
                    value={productData.categoryId}
                    label="Danh Mục *"
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
                  label="Mô tả thuốc *"
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
                  <InputLabel id="unit-select-label">Đơn Vị *</InputLabel>
                  <Select
                    labelId="unit-select-label"
                    name="unit"
                    value={productData.unit}
                    label="Đơn Vị *"
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
                    value={productData.status ? "true" : "false"}
                    label="Trạng Thái"
                    onChange={(e) =>
                      setProductData((prev) => ({
                        ...prev,
                        status: e.target.value === "true",
                      }))
                    }
                  >
                    <MenuItem value="true">Đang bán</MenuItem>
                    <MenuItem value="false">Ngừng bán</MenuItem>
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
                disabled={loading}
                color={errors.productImages ? "error" : "primary"}
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
              {errors.productImages && (
                <FormHelperText error sx={{ mb: 2 }}>
                  {errors.productImages}
                </FormHelperText>
              )}

<Box
  sx={{
    display: "flex",
    flexDirection: "column",
    gap: 1,
    pointerEvents: loading ? "none" : "auto", // disable toàn bộ khi loading
    opacity: loading ? 0.6 : 1, // làm mờ khi loading (tuỳ chọn)
  }}
>
  {imagePreviews.length > 0 ? (
    imagePreviews.map((img, index) => (
      <Box key={index} sx={{ mb: 1, position: "relative" }}>
        <Button
          onClick={() => {
            setSelectedImage(img);
            setOpenImageDialog(true);
          }}
          sx={{
            width: "250px",
            p: 1,
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            textTransform: "none",
            justifyContent: "flex-start",
          }}
        >
          {`Ảnh ${index + 1}`}
        </Button>

        <IconButton
          size="small"
          sx={{
            position: "absolute",
            top: 5,
            right: 5,
            background: "#fff",
            border: "1px solid #ccc",
          }}
          onClick={() => {
            const newImages = productData.productImages.filter(
              (_, i) => i !== index
            );

            setProductData((prev) => ({
              ...prev,
              productImages: newImages,
            }));

            setImagePreviews(
              newImages.map((file) => URL.createObjectURL(file))
            );
          }}
        >
          <DeleteIcon fontSize="small" sx={{ color: "#d32f2f" }} />
        </IconButton>
      </Box>
    ))
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


              <Dialog
                open={openImageDialog}
                onClose={() => setOpenImageDialog(false)}
                maxWidth="lg"
              >
                <Box
                  component="img"
                  src={selectedImage}
                  alt="Xem ảnh"
                  sx={{
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    m: "auto",
                    display: "block",
                  }}
                />
              </Dialog>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <Divider sx={{ opacity: 0.5 }} />
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button
          onClick={() => {
            setSelectedImage(null);
            handleClose();
          }}
          disabled={loading || !!successMessage}
          sx={{ color: "#000" }}
          variant="text"
        >
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !!successMessage}
        >
          {loading ? <CircularProgress size={24} /> : "Thêm Thuốc Mới"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProduct;
