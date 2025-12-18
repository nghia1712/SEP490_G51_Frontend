import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stack,
  Alert,
  Box,
  CircularProgress,
  Typography,
  Divider,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import useCategory from "../../Hooks/useCategory";
import useProduct from "../../Hooks/useProduct";

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
    productIngredients: "",
    productUses: "",
    productWeight: "",
  });

  const [productImages, setProductImages] = useState([]); // File objects (ảnh mới)
  const [imagePreviews, setImagePreviews] = useState([]); // URLs để hiển thị
  const [originalImageUrls, setOriginalImageUrls] = useState([]); // URL ảnh cũ từ backend
  const [selectedImage, setSelectedImage] = useState(null);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { categories, getAllCategories } = useCategory();
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

  // Không cần fetch ảnh từ URL external (tránh CORS)
  // Chỉ lưu URL để hiển thị preview, backend sẽ xử lý khi không có File mới
  const fetchImageFileFromUrl = async (url) => {
    // Bỏ qua việc fetch để tránh CORS error
    // URL sẽ được giữ nguyên và backend sẽ xử lý
    return null;
  };

  // ------------------- useEffect để load product + ảnh -------------------
  useEffect(() => {
    if (open) {
      getAllCategories();

      if (product) {
        setProductData({
          productName: product.productName || "",
          categoryId:
            product.categoryID ||
            product.categoryId?._id ||
            product.categoryId ||
            "",
          productDescription: product.productDescription || "",
          unit: product.unit || "",
          minQuantity: product.minQuantity || 0,
          maxQuantity: product.maxQuantity || 0,
          totalCurrentQuantity: product.totalCurrentQuantity || 0,
          status: normalizeStatus(product.status),
          productIngredients: product.productIngredients || "",
          productUses: product.productlUses || "",
          productWeight: product.productWeight || "",
        });

        // Xử lý URL ảnh - loại bỏ double slash và tạo full URL
        const imageFields = [
          product.image,
          product.imageA,
          product.imageB,
          product.imageC,
          product.imageD,
          product.imageE,
        ];

        const urls = imageFields.filter(Boolean).map((u) => {
          // Loại bỏ double slash và tạo full URL
          const cleanPath = u.startsWith("/") ? u : `/${u}`;
          return `https://api.bbpharmacy.site${cleanPath}`.replace(
            /([^:]\/)\/+/g,
            "$1"
          );
        });

        setImagePreviews(urls);
        setOriginalImageUrls(urls); // Lưu URL ảnh cũ

        // Không fetch ảnh cũ để tránh CORS error
        // Chỉ lưu URL, khi submit sẽ chỉ gửi File mới (nếu có)
        setProductImages([]);
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
        productIngredients: "",
        productUses: "",
        productWeight: "",
      });
      setProductImages([]);
      setImagePreviews([]);
      setOriginalImageUrls([]);
      setErrors({});
      setLoading(false);
      setSuccessMessage("");
    }
  }, [open, product]);

  // ------------------- handle add file mới -------------------
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = [...productImages, ...files].slice(0, 6); // tối đa 6 ảnh
    const newPreviews = [
      ...imagePreviews,
      ...files.map((f) => URL.createObjectURL(f)),
    ].slice(0, 6);

    setProductImages(newFiles);
    setImagePreviews(newPreviews);

    if (errors.productImage)
      setErrors((prev) => ({ ...prev, productImage: "" }));
  };

  // ------------------- handle xóa ảnh -------------------
  const handleRemoveImage = (index) => {
    const newFiles = [...productImages];
    newFiles.splice(index, 1);

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);

    setProductImages(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const normalizeName = (value = "") =>
    String(value ?? "")
      .trim()
      .toLowerCase();

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

    // Product Name
    if (productData.productName && productData.productName.trim().length > 0) {
      if (productData.productName.trim().length < 10)
        tempErrors.productName = "Tên thuốc phải có ít nhất 10 ký tự.";
      else if (productData.productName.length > 100)
        tempErrors.productName = "Tên thuốc không được vượt quá 100 ký tự.";
    }

    // Duplicate check
    if (!tempErrors.productName && productData.productName?.trim()) {
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
      if (isDuplicate) tempErrors.productName = "Tên thuốc đã tồn tại.";
    }

    // Unit
    if (productData.unit && productData.unit.length > 10)
      tempErrors.unit = "Đơn vị không được vượt quá 10 ký tự.";

    // Validate ProductUses (required)
    if (
      !productData.productUses ||
      productData.productUses.trim().length === 0
    ) {
      tempErrors.productUses = "Công dụng không được bỏ trống.";
    } else {
      tempErrors.productUses = "";
    }

    // Validate ProductWeight (required, must be between 0 and 1500)
    if (!productData.productWeight || productData.productWeight === "") {
      tempErrors.productWeight = "Khối lượng không được bỏ trống.";
    } else {
      const weightNum = parseFloat(productData.productWeight);
      if (isNaN(weightNum)) {
        tempErrors.productWeight = "Khối lượng phải là số.";
      } else if (weightNum < 0) {
        tempErrors.productWeight = "Khối lượng không được nhỏ hơn 0.";
      } else if (weightNum > 1500) {
        tempErrors.productWeight = "Khối lượng không được lớn hơn 1500 g.";
      } else {
        tempErrors.productWeight = "";
      }
    }

    // Description (optional, but check max length if provided)
    if (
      productData.productDescription &&
      productData.productDescription.length > 300
    ) {
      tempErrors.productDescription = "Mô tả không được vượt quá 300 ký tự.";
    } else {
      tempErrors.productDescription = "";
    }

    // Quantities
    if (productData.minQuantity < 0)
      tempErrors.minQuantity = "Số lượng tối thiểu phải không âm.";
    if (productData.maxQuantity < 0)
      tempErrors.maxQuantity = "Số lượng tối đa phải không âm.";
    if (
      productData.minQuantity > 0 &&
      productData.maxQuantity > 0 &&
      productData.minQuantity > productData.maxQuantity
    )
      tempErrors.minQuantity =
        "Số lượng tối thiểu không được lớn hơn số lượng tối đa.";

    setErrors(tempErrors);
    return Object.values(tempErrors).every((x) => x === "");
  };

  const handleUpdate = async () => {
    setErrors((prev) => ({ ...prev, general: "" }));

    if (!(await validate())) return;

    setLoading(true);

    try {
      const formData = new FormData();

      // Các trường cơ bản
      formData.append("ProductName", productData.productName.trim());
      formData.append("CategoryID", Number(productData.categoryId));
      formData.append(
        "ProductDescription",
        productData.productDescription || ""
      );
      formData.append("Unit", productData.unit);
      formData.append(
        "MinQuantity",
        productData.minQuantity ? Number(productData.minQuantity) : 0
      );
      formData.append(
        "MaxQuantity",
        productData.maxQuantity ? Number(productData.maxQuantity) : 0
      );
      formData.append("Status", productData.status ? "true" : "false");
      formData.append(
        "ProductIngredients",
        productData.productIngredients || ""
      );

      // ProductUses / ProductlUses typo backend
      formData.append("ProductlUses", productData.productUses || "");

      // ProductWeight phải gửi decimal string
      const weightValue =
        productData.productWeight !== "" && productData.productWeight != null
          ? parseFloat(productData.productWeight)
          : 0;
      formData.append(
        "ProductWeight",
        isNaN(weightValue) ? "0.0" : weightValue.toFixed(1)
      );

      // Xử lý ảnh: chỉ gửi file mới, backend sẽ giữ ảnh cũ nếu không có file
      const imageKeys = [
        "Image",
        "ImageA",
        "ImageB",
        "ImageC",
        "ImageD",
        "ImageE",
      ];
      imageKeys.forEach((key, idx) => {
        if (productImages[idx] instanceof File) {
          formData.append(key, productImages[idx]);
        }
      });

      // Gọi API update
      const { default: productAPI } = await import("../../API/productAPI");
      const productId = getProductIdValue(product);
      const response = await productAPI.update(productId, formData);

      if (!response?.data?.success) {
        setErrors((prev) => ({
          ...prev,
          general: response?.data?.message || "Cập nhật thất bại",
        }));
        setLoading(false);
        return;
      }

      setSuccessMessage("Cập nhật thành công!");
      setSelectedImage(null);

      setTimeout(() => {
        onUpdateSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("=== Update Error ===", error);

      let errorMessage = "Có lỗi xảy ra khi cập nhật sản phẩm.";
      if (error?.response) {
        errorMessage = error.response?.data?.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setErrors((prev) => ({ ...prev, general: errorMessage }));
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Cập Nhật Thuốc</DialogTitle>
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
            {/* Left side form */}
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
                />
                <FormControl fullWidth error={!!errors.categoryId}>
                  <InputLabel>Danh Mục</InputLabel>
                  <Select
                    name="categoryId"
                    value={productData.categoryId}
                    onChange={handleChange}
                  >
                    <MenuItem value="">
                      <em>Tùy chọn</em>
                    </MenuItem>
                    {(categories || []).map((cat) => (
                      <MenuItem
                        key={cat.categoryID || cat._id}
                        value={cat.categoryID || cat._id}
                      >
                        {cat.name || cat.categoryName}
                      </MenuItem>
                    ))}
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
                />
                <TextField
                  name="productIngredients"
                  label="Thành phần"
                  value={productData.productIngredients}
                  onChange={handleChange}
                  error={!!errors.productIngredients}
                  helperText={errors.productIngredients}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Nhập thành phần của thuốc"
                />
                <TextField
                  name="productUses"
                  label="Công dụng"
                  value={productData.productUses}
                  onChange={handleChange}
                  error={!!errors.productUses}
                  helperText={errors.productUses}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Nhập công dụng của thuốc"
                />
                <TextField
                  label="Khối lượng (g)"
                  type="number"
                  name="productWeight"
                  value={productData.productWeight}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.productWeight}
                  helperText={errors.productWeight}
                  InputProps={{
                    inputProps: {
                      min: 0,
                      max: 1500,
                      step: 1,
                    },
                  }}
                />
                <FormControl fullWidth error={!!errors.unit}>
                  <InputLabel>Đơn Vị</InputLabel>
                  <Select
                    name="unit"
                    value={productData.unit}
                    onChange={handleChange}
                  >
                    <MenuItem value="Hộp">Hộp</MenuItem>
                    <MenuItem value="Vỉ">Vỉ</MenuItem>
                    <MenuItem value="Lọ">Lọ</MenuItem>
                    <MenuItem value="Chai">Chai</MenuItem>
                    <MenuItem value="Tuýp">Tuýp</MenuItem>
                  </Select>
                  {errors.unit && (
                    <FormHelperText>{errors.unit}</FormHelperText>
                  )}
                </FormControl>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    name="minQuantity"
                    label="Số lượng tối thiểu"
                    type="number"
                    value={productData.minQuantity}
                    onChange={handleChange}
                    error={!!errors.minQuantity}
                    helperText={errors.minQuantity}
                    fullWidth
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
                  />
                </Box>
              </Stack>
            </Box>

            {/* Right side images */}
            <Box
              sx={{
                width: "300px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              {/* Button thêm ảnh */}
              <Button
                disabled={loading}
                variant="outlined"
                component="label"
                color={errors.productImage ? "error" : "primary"}
                sx={{ mb: 1 }}
              >
                Thêm ảnh
                <input
                  type="file"
                  hidden
                  accept="image/png, image/jpeg"
                  multiple
                  onChange={handleFileChange}
                />
              </Button>

              {errors.productImage && (
                <FormHelperText error sx={{ mb: 1 }}>
                  {errors.productImage}
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
                    <Box
                      key={index}
                      sx={{ position: "relative", width: "250px" }}
                    >
                      <Button
                        onClick={() => {
                          setSelectedImage(img);
                          setOpenImageDialog(true);
                        }}
                        sx={{
                          width: "100%",
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
                        onClick={() => handleRemoveImage(index)}
                      >
                        <DeleteIcon
                          fontSize="small"
                          sx={{ color: "#d32f2f" }}
                        />
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
          disabled={loading || Boolean(successMessage)}
          sx={{ color: "#000" }}
          variant="text"
        >
          Đóng
        </Button>
        <Button
          onClick={handleUpdate}
          variant="contained"
          disabled={loading || Boolean(successMessage)}
        >
          {loading ? <CircularProgress size={24} /> : "Cập Nhật Thuốc"}
        </Button>
      </DialogActions>
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
    </Dialog>
  );
};

export default EditProduct;
