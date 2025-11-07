import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Box,
  InputAdornment,
  Chip,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from "@mui/material";
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

  // Kiểm tra xem user đã đăng nhập chưa
  const isAuthenticated = useMemo(() => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return false;
      const role = getUserRoleFromToken();
      return role === 'customer';
    } catch {
      return false;
    }
  }, []);

  // Fetch active products and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fallback categories (always use fallback since API requires auth)
        const fallbackCategories = [
          {
            categoryID: 2,
            name: "Kháng sinh",
            description: "Các loại thuốc kháng sinh điều trị nhiễm khuẩn"
          },
          {
            categoryID: 3,
            name: "Vitamin",
            description: "Các loại vitamin và chất bổ sung"
          },
          {
            categoryID: 4,
            name: "Tiêu hóa",
            description: "Các loại thuốc điều trị các vấn đề về tiêu hóa"
          }
        ];
        
        // Set categories with fallback data
        setCategories(fallbackCategories);
        
        // Try to fetch from real API first
        try {
          // Fetch active products only (categories will use fallback data)
          const productsResponse = await guestAPI.getActiveProducts();
          const productsData = productsResponse.data?.data || [];
          
          // Chỉ lấy những thuốc có status = true (đang bán)
          const activeProducts = productsData.filter(product => product.status === true);
          
          setAllProducts(activeProducts);
          setSearchResults(activeProducts);
          
          console.log("Fetched active products from API:", activeProducts);
        } catch (apiError) {
          console.warn("API not available, using fallback data:", apiError);
          
          // Fallback data nếu API không khả dụng
          const fallbackProducts = [
            {
              productID: 2,
              productName: "Amoxicillin 500mg",
              productDescription: "Kháng sinh điều trị nhiễm khuẩn",
              categoryID: 2,
              unit: "Vỉ",
              totalCurrentQuantity: 40,
              minQuantity: 5,
              maxQuantity: 80,
              status: true
            },
            {
              productID: 3,
              productName: "Omeprazole 20mg",
              productDescription: "Điều trị viêm loét dạ dày",
              categoryID: 4,
              unit: "Lọ",
              totalCurrentQuantity: 30,
              minQuantity: 10,
              maxQuantity: 70,
              status: true
            },
            {
              productID: 4,
              productName: "Vitamin C 500mg",
              productDescription: "Bổ sung vitamin C tăng cường sức đề kháng",
              categoryID: 3,
              unit: "Lọ",
              totalCurrentQuantity: 100,
              minQuantity: 20,
              maxQuantity: 150,
              status: true
            }
          ];
          
          const fallbackCategories = [
            {
              categoryID: 2,
              name: "Kháng sinh",
              description: "Các loại thuốc kháng sinh điều trị nhiễm khuẩn"
            },
            {
              categoryID: 3,
              name: "Vitamin",
              description: "Các loại vitamin và chất bổ sung"
            },
            {
              categoryID: 4,
              name: "Tiêu hóa",
              description: "Các loại thuốc điều trị các vấn đề về tiêu hóa"
            }
          ];
          
          setAllProducts(fallbackProducts);
          setSearchResults(fallbackProducts);
          
          console.log("Using fallback data:", fallbackProducts);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Không thể tải danh sách thuốc. Vui lòng thử lại sau.");
        setSearchResults([]);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const filtered = allProducts.filter(
        (product) => {
          // Chỉ tìm kiếm trong những thuốc đang bán (status = true)
          if (product.status !== true) return false;
          
          const productName = product.productName || product.ProductName || '';
          const description = product.productDescription || product.ProductDescription || '';
          const categoryId = product.categoryID || product.CategoryID;
          const category = categories.find(cat => 
            cat.categoryID === categoryId || cat.CategoryID === categoryId
          );
          const categoryName = category ? (category.name || category.Name || '') : '';
          
          const searchLower = searchTerm.toLowerCase();
          return (
            productName.toLowerCase().includes(searchLower) ||
            description.toLowerCase().includes(searchLower) ||
            categoryName.toLowerCase().includes(searchLower)
          );
        }
      );
      setSearchResults(filtered);
    } else {
      // Khi không có từ khóa tìm kiếm, hiển thị tất cả thuốc đang bán
      const activeProducts = allProducts.filter(product => product.status === true);
      setSearchResults(activeProducts);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
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
      <Container maxWidth="lg" sx={{ py: 4, position: "relative", zIndex: 2 }}>
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
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
            <LocalHospitalIcon sx={{ fontSize: 40, color: "#48C1A6", mr: 2 }} />
            <Typography variant="h4" component="h1" color="primary" fontWeight="bold" sx={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>
              Tìm kiếm thuốc
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: "1.1rem", textShadow: "1px 1px 2px rgba(0,0,0,0.2)" }}>
            Tìm kiếm thông tin thuốc đang bán trong hệ thống của chúng tôi
          </Typography>
          
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
          
          {/* Chỉ hiển thị alert và nút đăng nhập/đăng ký cho guest */}
          {!isAuthenticated && (
            <>
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
                  <strong>Lưu ý:</strong> Bạn đang xem ở chế độ khách. 
                  Để mua hàng và nhận giá ưu đãi, vui lòng đăng nhập vào hệ thống.
                </Typography>
              </Alert>
              
              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate("/login")}
                  sx={{ 
                    backgroundColor: "#48C1A6",
                    borderRadius: "12px",
                    px: 4,
                    py: 1.5,
                    fontWeight: "bold",
                    "&:hover": {
                      backgroundColor: "#3a9d8a",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(72, 193, 166, 0.3)",
                    }
                  }}
                >
                  Đăng nhập để mua hàng
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/register")}
                  sx={{
                    borderRadius: "12px",
                    px: 4,
                    py: 1.5,
                    fontWeight: "bold",
                    borderColor: "#48C1A6",
                    color: "#48C1A6",
                    "&:hover": {
                      backgroundColor: "rgba(72, 193, 166, 0.1)",
                      transform: "translateY(-2px)",
                    }
                  }}
                >
                  Đăng ký tài khoản
                </Button>
              </Box>
            </>
          )}
        </Box>

      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(5px)",
            borderRadius: "16px",
            padding: 3,
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Nhập tên thuốc, danh mục hoặc mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ 
              mb: 2,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderRadius: "12px",
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ 
              backgroundColor: "#48C1A6",
              borderRadius: "12px",
              px: 4,
              py: 1.5,
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "#3a9d8a",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(72, 193, 166, 0.3)",
              }
            }}
          >
            Tìm kiếm
          </Button>
        </Box>
      </Box>

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
          <Typography variant="h6" color="text.secondary" sx={{ textShadow: "1px 1px 2px rgba(0,0,0,0.2)" }}>
            Đang tải danh sách thuốc...
          </Typography>
        </Box>
      ) : (
      <Grid container spacing={3}>
          {searchResults.map((product) => {
            const productName = product.productName || product.ProductName || 'Tên không xác định';
            const description = product.productDescription || product.ProductDescription || 'Không có mô tả';
            const categoryId = product.categoryID || product.CategoryID;
            const category = categories.find(cat => 
              cat.categoryID === categoryId || cat.CategoryID === categoryId
            );
            const categoryName = category ? (category.name || category.Name || 'Không xác định') : 'Không xác định';
            const stock = product.totalCurrentQuantity || product.TotalCurrentQuantity || 0;
            const unit = product.unit || product.Unit || 'Đơn vị';
            const productId = product.productID || product.ProductID || product.id || product._id;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={productId}>
            <Card 
              sx={{ 
                height: "100%", 
                display: "flex", 
                flexDirection: "column",
                cursor: "pointer",
                transition: "all 0.3s ease",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(5px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
                  backgroundColor: "rgba(255, 255, 255, 1)",
                }
              }}
                  onClick={() => handleMedicineClick(product)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                      {productName}
                </Typography>
                
                <Chip
                      label={categoryName}
                  color="primary"
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Tồn kho:</strong> {stock} {unit}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                      {description}
                </Typography>
                
                <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
                  <Button
                    variant="contained"
                    startIcon={<InfoIcon />}
                    fullWidth
                    sx={{ backgroundColor: "#48C1A6" }}
                  >
                        Xem chi tiết
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
            );
          })}
      </Grid>
      )}

      {!loading && searchResults.length === 0 && (
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
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1, textShadow: "1px 1px 2px rgba(0,0,0,0.2)" }}>
            {error ? "Không thể tải danh sách thuốc" : "Không tìm thấy thuốc phù hợp"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textShadow: "1px 1px 2px rgba(0,0,0,0.2)" }}>
            {error ? "Vui lòng thử lại sau" : "Hãy thử với từ khóa khác"}
          </Typography>
        </Box>
      )}

      {/* Dialog hiển thị chi tiết thuốc và giá */}
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
              {selectedMedicine ? (selectedMedicine.productName || selectedMedicine.ProductName || 'Tên không xác định') : ''}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMedicine && (() => {
            const productName = selectedMedicine.productName || selectedMedicine.ProductName || 'Tên không xác định';
            const description = selectedMedicine.productDescription || selectedMedicine.ProductDescription || 'Không có mô tả';
            const categoryId = selectedMedicine.categoryID || selectedMedicine.CategoryID;
            const category = categories.find(cat => 
              cat.categoryID === categoryId || cat.CategoryID === categoryId
            );
            const categoryName = category ? (category.name || category.Name || 'Không xác định') : 'Không xác định';
            const stock = selectedMedicine.totalCurrentQuantity || selectedMedicine.TotalCurrentQuantity || 0;
            const unit = selectedMedicine.unit || selectedMedicine.Unit || 'Đơn vị';
            const minQuantity = selectedMedicine.minQuantity || selectedMedicine.MinQuantity || 0;
            const maxQuantity = selectedMedicine.maxQuantity || selectedMedicine.MaxQuantity || 0;
            
            return (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h5" color="primary" gutterBottom>
                    Thông tin sản phẩm
                  </Typography>
                  
                  <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Danh mục:</strong></TableCell>
                          <TableCell>
                              <Chip label={categoryName} color="primary" size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Đơn vị:</strong></TableCell>
                            <TableCell>{unit}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Tồn kho:</strong></TableCell>
                          <TableCell>
                            <Typography 
                                color={stock > 50 ? "success.main" : stock > 20 ? "warning.main" : "error.main"}
                              fontWeight="bold"
                            >
                                {stock} {unit}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><strong>Số lượng tối thiểu:</strong></TableCell>
                            <TableCell>{minQuantity} {unit}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Số lượng tối đa:</strong></TableCell>
                            <TableCell>{maxQuantity} {unit}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h5" color="primary" gutterBottom>
                      Mô tả sản phẩm
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Mô tả:
                    </Typography>
                    <Typography variant="body2">
                        {description}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              {/* Chỉ hiển thị alert cho guest */}
              {!isAuthenticated && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                      <strong>Lưu ý:</strong> Để mua hàng và nhận giá ưu đãi, vui lòng đăng nhập vào hệ thống.
                  </Typography>
                </Alert>
              )}
            </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Đóng
          </Button>
          {/* Chỉ hiển thị nút đăng nhập cho guest */}
          {!isAuthenticated && (
            <Button 
              variant="contained" 
              onClick={() => navigate("/login")}
              sx={{ backgroundColor: "#48C1A6" }}
            >
              Đăng nhập để mua
            </Button>
          )}
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};

export default SearchMedicine;
