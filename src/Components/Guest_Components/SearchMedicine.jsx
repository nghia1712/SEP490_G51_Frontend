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
  const [selectedCategories, setSelectedCategories] = useState([]);

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

        // 1. Lấy categories trước
        const categoriesResponse = await guestAPI.getCategories();
        const categoryData = categoriesResponse.data?.data || [];
        setCategories(categoryData);

        // 2. Lấy products
        const productsResponse = await guestAPI.getActiveProducts();
        const productsData = productsResponse.data?.data || [];
        const activeProducts = productsData.filter((p) => p.status === true);

        // 3. Map products với categoryName
        const mappedProducts = activeProducts.map((product) => {
          const categoryId = product.categoryID || product.CategoryID;
          const category = categoryData.find(
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

  // Filter search và category
  useEffect(() => {
    const filtered = allProducts.filter((product) => {
      // Filter theo categories nếu có chọn
      if (selectedCategories.length > 0) {
        const productCategoryId = product.categoryID || product.CategoryID;
        const isInSelectedCategories = selectedCategories.some((cat) => {
          const categoryId = cat.categoryID || cat.CategoryID;
          return categoryId === productCategoryId;
        });
        if (!isInSelectedCategories) {
          return false;
        }
      }

      // Filter theo search term
      const productName = product.productName || product.ProductName || "";
      const description =
        product.productDescription || product.ProductDescription || "";
      const categoryName = product.categoryName || "";
      const searchLower = searchTerm.toLowerCase();
      
      if (searchTerm.trim() === "") {
        return true; // Hiển thị tất cả nếu không có search term
      }
      
      return (
        productName.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower) ||
        categoryName.toLowerCase().includes(searchLower)
      );
    });
    setSearchResults(filtered);
  }, [searchTerm, allProducts, selectedCategories]);

  const handleCategoryClick = (category) => {
    const categoryId = category.categoryID || category.CategoryID;
    const isSelected = selectedCategories.some(
      (cat) => (cat.categoryID || cat.CategoryID) === categoryId
    );

    if (isSelected) {
      // Nếu đã chọn thì bỏ chọn
      setSelectedCategories((prev) =>
        prev.filter(
          (cat) => (cat.categoryID || cat.CategoryID) !== categoryId
        )
      );
    } else {
      // Nếu chưa chọn thì thêm vào
      setSelectedCategories((prev) => [...prev, category]);
    }
  };

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
      <Container className="search-medicine-container" maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 }, position: "relative", zIndex: 2 }}>
        {/* Header */}
        <Box
          className="search-medicine-header"
          sx={{
            mb: { xs: 2, sm: 3, md: 4 },
            textAlign: "center",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(5px)",
            borderRadius: "20px",
            padding: { xs: 2, sm: 3, md: 4 },
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            className="search-medicine-header-content"
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
            <Box className="search-medicine-title-container" sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
              <LocalHospitalIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 }, color: "#48C1A6" }} />
              <Typography
                variant="h4"
                component="h1"
                className="search-medicine-title"
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

        {/* Layout 2 cột: Danh mục trái, Search + Results phải */}
        <Grid container spacing={3}>
          {/* Sidebar - Danh mục sản phẩm */}
          {categories.length > 0 && (
            <Grid item xs={12} md={3}>
              <Box
                sx={{
                  position: { md: "sticky" },
                  top: { md: 100 },
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  maxHeight: { md: "calc(100vh - 100px)" },
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* Header - Fixed */}
                <Box
                  sx={{
                    p: 3,
                    pb: 2,
                    flexShrink: 0,
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      textTransform: "uppercase",
                      color: "#155E64",
                      fontSize: { xs: "1rem", md: "1.1rem" },
                    }}
                  >
                    Danh mục sản phẩm
                  </Typography>
                  
                  {/* Button xóa filter */}
                  {selectedCategories.length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={() => setSelectedCategories([])}
                      sx={{
                        mb: 0,
                        borderColor: "#48C1A6",
                        color: "#48C1A6",
                        "&:hover": {
                          borderColor: "#3a9d8a",
                          backgroundColor: "rgba(72, 193, 166, 0.1)",
                        },
                      }}
                    >
                      Xóa tất cả ({selectedCategories.length})
                    </Button>
                  )}
                </Box>

                {/* Scrollable Content */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    p: 3,
                    pt: 2,
                    pb: 3,
                    "&::-webkit-scrollbar": {
                      width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "rgba(0,0,0,0.05)",
                      borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "rgba(72, 193, 166, 0.3)",
                      borderRadius: "4px",
                      "&:hover": {
                        backgroundColor: "rgba(72, 193, 166, 0.5)",
                      },
                    },
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {categories.map((cat) => {
                    const name = cat.name || cat.Name || "";
                    const categoryId = cat.categoryID || cat.CategoryID;
                    const isSelected = selectedCategories.some(
                      (selectedCat) => 
                        (selectedCat.categoryID || selectedCat.CategoryID) === categoryId
                    );
                    
                    // Đếm số sản phẩm trong danh mục này
                    const productCount = allProducts.filter((product) => {
                      const productCategoryId = product.categoryID || product.CategoryID;
                      return categoryId === productCategoryId;
                    }).length;
                    
                    return (
                      <Paper
                        key={categoryId || name}
                        elevation={isSelected ? 3 : 1}
                        onClick={() => handleCategoryClick(cat)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          border: isSelected ? "2px solid #48C1A6" : "1px solid #e0e0e0",
                          backgroundColor: isSelected ? "rgba(72, 193, 166, 0.1)" : "#ffffff",
                          "&:hover": {
                            borderColor: "#48C1A6",
                            boxShadow: "0 4px 12px rgba(72, 193, 166, 0.2)",
                            transform: "translateX(4px)",
                            backgroundColor: isSelected ? "rgba(72, 193, 166, 0.15)" : "rgba(72, 193, 166, 0.05)",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: isSelected ? "#48C1A6" : "#2e7d32",
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ 
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? "#155E64" : "inherit",
                            flex: 1,
                            minWidth: 0, // Cho phép text wrap
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            lineHeight: 1.4,
                          }}
                          title={name}
                        >
                          {name}
                        </Typography>
                        <Chip
                          label={productCount}
                          size="small"
                          sx={{
                            height: 20,
                            minWidth: 32,
                            fontSize: "0.7rem",
                            backgroundColor: isSelected ? "#48C1A6" : "rgba(0,0,0,0.08)",
                            color: isSelected ? "#fff" : "inherit",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        />
                      </Paper>
                    );
                  })}
                  </Box>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Main Content - Search + Results */}
          <Grid item xs={12} md={categories.length > 0 ? 9 : 12}>
            {/* Search Input */}
            <Box
              className="search-medicine-search-container"
              sx={{
                mb: { xs: 2, sm: 3, md: 4 },
                p: { xs: 2, sm: 3, md: 4 },
                borderRadius: 3,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(5px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                // Đảm bảo width 100% để căn chỉnh
                width: "100%",
                boxSizing: "border-box",
              }}
            >
          <Box
            className="search-medicine-search-box"
            sx={{
              mb: { xs: 2, sm: 3, md: 4 },
              p: { xs: 2, sm: 2.5, md: 3 },
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
              className="search-medicine-search-description"
              color="text.secondary"
              sx={{
                mb: { xs: 2, sm: 2.5, md: 3 },
                fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
                textAlign: "center",
              }}
            >
              Tìm kiếm thông tin thuốc đang bán trong hệ thống của chúng tôi
            </Typography>

            {/* Ô tìm kiếm */}
            <TextField
              className="search-medicine-search-input"
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
            </Box>

            {/* Thông báo filter */}
            {selectedCategories.length > 0 && (
              <Box sx={{ mb: 2, width: "100%" }}>
                <Alert
                  severity="info"
                  sx={{
                    backgroundColor: "rgba(72, 193, 166, 0.1)",
                    border: "1px solid rgba(72, 193, 166, 0.3)",
                    borderRadius: 2,
                    width: "100%",
                  }}
                  action={
                    <Button
                      size="small"
                      onClick={() => setSelectedCategories([])}
                      sx={{ color: "#48C1A6" }}
                    >
                      Xóa tất cả
                    </Button>
                  }
                >
                  <Box>
                    <Typography variant="body2" sx={{ mb: selectedCategories.length > 1 ? 1 : 0 }}>
                      Đang lọc theo {selectedCategories.length} danh mục:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: selectedCategories.length > 1 ? 1 : 0 }}>
                      {selectedCategories.map((cat, index) => (
                        <Chip
                          key={cat.categoryID || cat.CategoryID || index}
                          label={cat.name || cat.Name}
                          size="small"
                          onDelete={() => {
                            const categoryId = cat.categoryID || cat.CategoryID;
                            setSelectedCategories((prev) =>
                              prev.filter(
                                (c) => (c.categoryID || c.CategoryID) !== categoryId
                              )
                            );
                          }}
                          sx={{
                            backgroundColor: "#48C1A6",
                            color: "#fff",
                            fontWeight: 600,
                            "& .MuiChip-deleteIcon": {
                              color: "#fff",
                              "&:hover": {
                                color: "#e0e0e0",
                              },
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Alert>
              </Box>
            )}

            {/* Loading và Results */}
            <Box 
              sx={{ 
                width: "100%", 
                boxSizing: "border-box",
                // Padding = outer container padding + inner box padding để căn với TextField
                // Outer: { xs: 2, sm: 3, md: 4 } + Inner: { xs: 2, sm: 2.5, md: 3 }
                // px: { xs: 4, sm: 5.5, md: 7 },
              }}
            >
            {loading ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  px: { xs: 4, sm: 5.5, md: 7 },
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
                  <Grid 
                    className="search-medicine-results-grid" 
                    container 
                    gap={2}
                    sx={{
                      width: "100%",
                      margin: 0,
                      display: "flex",
                      flexWrap: "wrap",
                      // Đảm bảo Grid items không bị wrap sớm
                      "& > .MuiGrid-item": {
                        flexBasis: { xs: "100%", sm: "calc(50% - 8px)", md: "calc(33.333% - 16px)" },
                        maxWidth: { xs: "100%", sm: "calc(50% - 8px)", md: "calc(33.333% - 16px)" },
                        flexGrow: 0,
                        flexShrink: 0,
                      },
                    }}
                  >
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
                        <Grid 
                          item 
                          xs={12} 
                          sm={6} 
                          md={4} 
                          key={productId}
                          sx={{
                            // Đảm bảo không bị shrink và luôn hiển thị đủ 3 trên desktop
                            display: "flex",
                            minWidth: 0,
                          }}
                        >
                          <Card
                            className="search-medicine-product-card"
                            sx={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              backgroundColor: "rgba(255, 255, 255, 0.8)",
                              backdropFilter: "blur(5px)",
                              border: "1px solid rgba(255, 255, 255, 0.3)",
                              boxSizing: "border-box",
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
                              className="search-medicine-product-image-container"
                              sx={{
                                width: { xs: "100%", sm: "150px" },
                                minWidth: { xs: "100%", sm: "150px" },
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
                      px: { xs: 4, sm: 5.5, md: 7 },
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
          </Grid>
        </Grid>

        {/* Dialog phóng to ảnh */}
        <Dialog
          className="search-medicine-image-dialog"
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
          className="search-medicine-detail-dialog"
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle className="search-medicine-detail-dialog-title">
            <Box className="search-medicine-detail-title-container" sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <LocalHospitalIcon color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
              <Typography className="search-medicine-detail-title" variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                {selectedMedicine?.productName ||
                  selectedMedicine?.ProductName ||
                  "Tên không xác định"}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent className="search-medicine-detail-dialog-content">
            {selectedMedicine && (
              <Grid className="search-medicine-detail-grid" container spacing={{ xs: 2, sm: 3 }}>
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