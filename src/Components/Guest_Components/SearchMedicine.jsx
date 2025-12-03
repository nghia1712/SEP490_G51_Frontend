import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  InputAdornment,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  Paper,
  CircularProgress,
  TableRow,
  IconButton,
  Link,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import SearchIcon from "@mui/icons-material/Search";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import InfoIcon from "@mui/icons-material/Info";
import { useNavigate } from "react-router-dom";
import guestAPI from "../../API/guestAPI";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken";

const SearchMedicine = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isAuthenticated = useMemo(() => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return false;
      const role = getUserRoleFromToken();
      return role === "customer";
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await guestAPI.getCategories();
        setCategories(res.data?.data || []);
      } catch (err) {
        console.error("Lỗi load danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const productsResponse = await guestAPI.getActiveProducts();
        const productsData = productsResponse.data?.data || [];
        const activeProducts = productsData.filter((p) => p.status === true);

        const mappedProducts = activeProducts.map((product) => {
          const categoryId = product.categoryID || product.CategoryID;
          const category = categories.find(
            (cat) =>
              cat.categoryID === categoryId || cat.CategoryID === categoryId
          );
          return {
            ...product,
            categoryName: category ? category.name || category.Name : "",
          };
        });
        setAllProducts(mappedProducts);
        setSearchResults(mappedProducts);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách thuốc. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset image index khi chọn thuốc
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedMedicine]);

  // Lấy danh sách ảnh hợp lệ
  const images = selectedMedicine
    ? ["image", "imageA", "imageB", "imageC", "imageD", "imageE"]
        .map((key) => selectedMedicine[key])
        .filter((img) => typeof img === "string" && img.trim() !== "")
    : [];

  // Filter search
  useEffect(() => {
    const filtered = allProducts.filter((product) => {
      const productName = product.productName || product.ProductName || "";
      const description =
        product.productDescription || product.ProductDescription || "";
      const categoryName = product.categoryName || "";
      const searchLower = searchTerm.toLowerCase();
      return (
        productName.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower) ||
        categoryName.toLowerCase().includes(searchLower)
      );
    });
    setSearchResults(filtered);
  }, [searchTerm, allProducts]);

  const handleMedicineClick = (medicine) => {
    setSelectedMedicine(medicine);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMedicine(null);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url('/images/backgroundMedical2.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          zIndex: 1,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4, position: "relative", zIndex: 2 }}>
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            textAlign: "center",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(5px)",
            borderRadius: "20px",
            padding: 4,
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              textAlign: "center",
            }}
          >
            {/* Icon + Tiêu đề chính */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <LocalHospitalIcon sx={{ fontSize: 40, color: "#48C1A6" }} />
              <Typography
                variant="h4"
                component="h1"
                color="primary"
                fontWeight="bold"
                sx={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
              >
                NHÀ THUỐC DƯỢC PHẨM SỐ 17
              </Typography>
            </Box>
          </Box>
          {/* Link Giới thiệu với dẫn lối */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body1"
              sx={{ mb: 1, fontSize: "1rem", color: "text.secondary" }}
            >
              Nếu bạn muốn tìm hiểu về chúng tôi và dịch vụ, vui lòng xem thêm:
            </Typography>
            <Link
              href="/about-me"
              underline="hover"
              sx={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                color: "#48C1A6",
                "&:hover": { color: "black" },
              }}
            >
              Giới thiệu
            </Link>
          </Box>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                textAlign: "left",
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                border: "1px solid rgba(244, 67, 54, 0.3)",
                borderRadius: "12px",
              }}
            >
              {error}
            </Alert>
          )}

          {!isAuthenticated && (
            <Alert
              severity="info"
              sx={{
                mb: 3,
                textAlign: "left",
                backgroundColor: "rgba(72, 193, 166, 0.1)",
                border: "1px solid rgba(72, 193, 166, 0.3)",
                borderRadius: "12px",
              }}
            >
              <Typography variant="body2">
                <strong>Lưu ý:</strong> Bạn đang xem ở chế độ khách. Để mua hàng
                và nhận giá ưu đãi, vui lòng đăng nhập vào hệ thống.
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Search Input */}
        <Box
          sx={{
            mb: 4,
            p: 4,
            borderRadius: 3,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(5px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 3,
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(5px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Mô tả tìm kiếm */}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mb: 3,
                fontSize: "1.1rem",
                textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
                textAlign: "center",
              }}
            >
              Tìm kiếm thông tin thuốc đang bán trong hệ thống của chúng tôi
            </Typography>

            {/* Ô tìm kiếm */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Nhập tên thuốc, danh mục hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "12px",
                },
              }}
            />
          </Box>

          {/* Loading */}
          <Box sx={{ textAlign: "center", mt: 4 }}>
            {loading ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(5px)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                }}
              >
                <CircularProgress size={60} sx={{ color: "#48C1A6", mb: 2 }} />
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ textShadow: "1px 1px 2px rgba(0,0,0,0.2)" }}
                >
                  Đang tải danh sách thuốc...
                </Typography>
              </Box>
            ) : (
              <>
                {searchResults.length > 0 ? (
                  <Grid container spacing={3}>
                    {searchResults.map((product) => {
                      const productName =
                        product.productName ||
                        product.ProductName ||
                        "Tên không xác định";
                      const description =
                        product.productDescription ||
                        product.ProductDescription ||
                        "Không có mô tả";
                      const categoryName = product.categoryName || "Không có";
                      const productId =
                        product.productID ||
                        product.ProductID ||
                        product.id ||
                        product._id;
                      const productImage = product.image || product.Image;
                      const firstImage = images[0] || productImage || "";

                      return (
                        <Grid item xs={12} sm={6} md={4} key={productId}>
                          <Card
                            sx={{
                              height: "100%",
                              display: "flex",
                              flexDirection: "row",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              backgroundColor: "rgba(255, 255, 255, 0.8)",
                              backdropFilter: "blur(5px)",
                              border: "1px solid rgba(255, 255, 255, 0.3)",
                              "&:hover": {
                                transform: "translateY(-4px)",
                                boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
                                backgroundColor: "rgba(255, 255, 255, 1)",
                              },
                            }}
                            onClick={() => handleMedicineClick(product)}
                          >
                            {/* Hình ảnh sản phẩm */}
                            <Box
                              sx={{
                                width: "150px",
                                minWidth: "150px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#f5f5f5",
                                p: 1,
                              }}
                            >
                              <CardMedia
                                component="img"
                                image={
                                  firstImage.startsWith("http")
                                    ? firstImage
                                    : `https://api.bbpharmacy.site${firstImage}`
                                }
                                alt={productName}
                                sx={{
                                  maxWidth: "100%",
                                  maxHeight: "300px",
                                  objectFit: "contain",
                                  cursor: "pointer",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImage(
                                    firstImage.startsWith("http")
                                      ? firstImage
                                      : `https://api.bbpharmacy.site${firstImage}`
                                  );
                                  setOpenImageDialog(true);
                                }}
                                onError={(e) => {
                                  e.target.src = "/images/login_image.png";
                                }}
                              />
                            </Box>

                            {/* Nội dung sản phẩm */}
                            <CardContent
                              sx={{
                                flexGrow: 1,
                                display: "flex",
                                flexDirection: "column",
                                p: 2,
                              }}
                            >
                              <Typography
                                variant="h6"
                                component="h2"
                                gutterBottom
                                sx={{ fontWeight: "bold", mb: 1 }}
                              >
                                {productName}
                              </Typography>

                              {categoryName && (
                                <Chip
                                  label={categoryName}
                                  color="primary"
                                  size="small"
                                  sx={{ mb: 1.5, alignSelf: "flex-center" }}
                                />
                              )}

                              <Typography
                                variant="body2"
                                sx={{ mb: 2, flexGrow: 1 }}
                              >
                                {description}
                              </Typography>

                              <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
                                <Button
                                  variant="contained"
                                  startIcon={<InfoIcon />}
                                  fullWidth
                                  sx={{
                                    background:
                                      "linear-gradient(90deg, #48C1A6 0%, #75B39C 100%)",
                                    color: "white",
                                    fontWeight: "bold",
                                    "&:hover": {
                                      background:
                                        "linear-gradient(90deg, #3a9d8a 0%, #5a9a7f 100%)",
                                    },
                                  }}
                                >
                                  XEM CHI TIẾT
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                ) : (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      backdropFilter: "blur(5px)",
                      borderRadius: "16px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ mb: 1, textShadow: "1px 1px 2px rgba(0,0,0,0.2)" }}
                    >
                      {error
                        ? "Không thể tải danh sách thuốc"
                        : "Không tìm thấy thuốc phù hợp"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textShadow: "1px 1px 2px rgba(0,0,0,0.2)" }}
                    >
                      {error
                        ? "Vui lòng thử lại sau"
                        : "Hãy thử với từ khóa khác"}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Dialog phóng to ảnh */}
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

        {/* Dialog chi tiết */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocalHospitalIcon color="primary" />
              <Typography variant="h6">
                {selectedMedicine?.productName ||
                  selectedMedicine?.ProductName ||
                  "Tên không xác định"}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedMedicine && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box
                    sx={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f5f5f5",
                      borderRadius: 2,
                      p: 2,
                      minHeight: "300px",
                    }}
                  >
                    {images.length > 0 && (
                      <>
                        {images.length > 1 && (
                          <IconButton
                            onClick={() =>
                              setCurrentImageIndex(
                                (prev) =>
                                  (prev - 1 + images.length) % images.length
                              )
                            }
                            sx={{
                              position: "absolute",
                              left: 0,
                              color: "rgba(0,0,0,0.5)",
                            }}
                          >
                            <ArrowBackIosIcon />
                          </IconButton>
                        )}
                        <CardMedia
                          component="img"
                          image={
                            images[currentImageIndex]
                              ? images[currentImageIndex].startsWith("http")
                                ? images[currentImageIndex]
                                : `https://api.bbpharmacy.site${images[currentImageIndex]}`
                              : "/images/login_image.png"
                          }
                          alt={selectedMedicine?.productName || ""}
                          sx={{
                            maxWidth: "100%",
                            maxHeight: "300px",
                            objectFit: "contain",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            const current = images[currentImageIndex];
                            if (current)
                              setSelectedImage(
                                current.startsWith("http")
                                  ? current
                                  : `https://api.bbpharmacy.site${current}`
                              );
                            setOpenImageDialog(true);
                          }}
                          onError={(e) => {
                            e.target.src = "/images/login_image.png";
                          }}
                        />
                        {images.length > 1 && (
                          <IconButton
                            onClick={() =>
                              setCurrentImageIndex(
                                (prev) => (prev + 1) % images.length
                              )
                            }
                            sx={{
                              position: "absolute",
                              right: 0,
                              color: "rgba(0,0,0,0.5)",
                            }}
                          >
                            <ArrowForwardIosIcon />
                          </IconButton>
                        )}
                      </>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" color="primary" gutterBottom>
                    Thông tin sản phẩm
                  </Typography>
                  <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <strong>Đơn vị:</strong>
                          </TableCell>
                          <TableCell>
                            {selectedMedicine.unit ||
                              selectedMedicine.Unit ||
                              "Đơn vị"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <strong>Danh mục:</strong>
                          </TableCell>
                          <TableCell>
                            {selectedMedicine.categoryName || "Không có"}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Mô tả sản phẩm
                    </Typography>
                    <Typography variant="body1">
                      {selectedMedicine.productDescription ||
                        selectedMedicine.ProductDescription ||
                        "Không có mô tả"}
                    </Typography>
                  </Box>
                  {selectedMedicine && !isAuthenticated && (
                    <Alert
                      severity="info"
                      sx={{
                        mt: 4,
                        textAlign: "center",
                        backgroundColor: "rgba(72, 193, 166, 0.1)",
                        border: "1px solid rgba(72, 193, 166, 0.3)",
                        borderRadius: "12px",
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Lưu ý:</strong> Bạn chưa đăng nhập. Vui lòng{" "}
                        <Link
                          href="/login"
                          underline="hover"
                          sx={{ fontWeight: "bold" }}
                        >
                          đăng nhập
                        </Link>{" "}
                        để mua hàng và nhận ưu đãi.
                      </Typography>
                    </Alert>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseDialog}
              variant="contained"
              color="primary"
            >
              Đóng
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default SearchMedicine;
