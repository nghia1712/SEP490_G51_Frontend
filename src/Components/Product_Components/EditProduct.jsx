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
  });

  const [productImages, setProductImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
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

  const fetchImageFileFromUrl = async (url) => {
    if (!url) return null;
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      const extension = blob.type.includes("/")
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
        });

        const urls = [
          product.image,
          product.imageA,
          product.imageB,
          product.imageC,
          product.imageD,
          product.imageE,
        ]
          .filter(Boolean)
          .map((u) => `https://api.bbpharmacy.site${u}`);

        setImagePreviews(urls);

        // Tạo file ảo từ URL để gửi lại nếu không đổi
        const fetchAllImages = async () => {
          const files = await Promise.all(
            urls.map((url) => fetchImageFileFromUrl(url))
          );
          setProductImages(files.filter(Boolean)); // loại bỏ null
        };
        fetchAllImages();
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
      });
      setProductImages([]);
      setImagePreviews([]);
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

    // Description
    if (
      productData.productDescription &&
      productData.productDescription.length > 300
    )
      tempErrors.productDescription = "Mô tả không được vượt quá 300 ký tự.";

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
    const isValid = await validate();
    if (!isValid) return;

    setLoading(true);
    const formData = new FormData();
    formData.append(
      "ProductName",
      productData.productName || product.productName || ""
    );
    formData.append(
      "ProductDescription",
      productData.productDescription || product.productDescription || ""
    );
    formData.append("Unit", productData.unit || product.unit || "");
    formData.append(
      "CategoryID",
      Number(
        productData.categoryId || product.categoryID || product.CategoryID || 0
      )
    );
    formData.append(
      "MinQuantity",
      Number(productData.minQuantity ?? product.minQuantity ?? 0)
    );
    formData.append(
      "MaxQuantity",
      Number(productData.maxQuantity ?? product.maxQuantity ?? 0)
    );
    formData.append(
      "Status",
      normalizeStatus(productData.status ?? product.status) ? "true" : "false"
    );

    const keys = ["Image", "ImageA", "ImageB", "ImageC", "ImageD", "ImageE"];
    for (let i = 0; i < productImages.length; i++) {
      if (productImages[i]) formData.append(keys[i], productImages[i]);
    }

    try {
      const productId = getProductIdValue(product);
      await updateProduct(productId, formData);
      setSuccessMessage("Cập nhật thành công!");
      setLoading(false);
      setTimeout(() => {
        onUpdateSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: error?.message || "Có lỗi xảy ra.",
      }));
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
                <FormControl fullWidth error={!!errors.unit}>
                  <InputLabel>Đơn Vị</InputLabel>
                  <Select
                    name="unit"
                    value={productData.unit}
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

              {/* Danh sách ảnh */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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

                      {/* Icon Xóa */}
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
          onClick={handleClose}
          disabled={loading || Boolean(successMessage)}
          color="secondary"
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
