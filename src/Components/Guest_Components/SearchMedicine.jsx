import React, { useState } from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import InfoIcon from "@mui/icons-material/Info";
import { useNavigate } from "react-router-dom";

// Mock data cho demo
const mockMedicines = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    category: "Giảm đau, hạ sốt",
    price: 15000,
    unit: "Viên",
    stock: 100,
    description: "Thuốc giảm đau, hạ sốt hiệu quả",
    manufacturer: "Công ty ABC",
    dosage: "Người lớn: 1-2 viên/lần, tối đa 4 lần/ngày",
    sideEffects: "Có thể gây buồn nôn, đau dạ dày nhẹ",
    contraindications: "Không dùng cho người bị suy gan nặng",
  },
  {
    id: 2,
    name: "Amoxicillin 250mg",
    category: "Kháng sinh",
    price: 25000,
    unit: "Viên",
    stock: 50,
    description: "Kháng sinh điều trị nhiễm khuẩn",
    manufacturer: "Công ty XYZ",
    dosage: "Người lớn: 1 viên/lần, 3 lần/ngày",
    sideEffects: "Có thể gây tiêu chảy, phát ban",
    contraindications: "Không dùng cho người dị ứng penicillin",
  },
  {
    id: 3,
    name: "Vitamin C 1000mg",
    category: "Vitamin",
    price: 30000,
    unit: "Viên",
    stock: 75,
    description: "Bổ sung vitamin C tăng cường sức đề kháng",
    manufacturer: "Công ty DEF",
    dosage: "1 viên/ngày sau bữa ăn",
    sideEffects: "Có thể gây tiêu chảy nếu dùng quá liều",
    contraindications: "Không dùng cho người bị sỏi thận",
  },
  {
    id: 4,
    name: "Omeprazole 20mg",
    category: "Tiêu hóa",
    price: 20000,
    unit: "Viên",
    stock: 60,
    description: "Điều trị viêm loét dạ dày",
    manufacturer: "Công ty GHI",
    dosage: "1 viên/ngày trước bữa sáng",
    sideEffects: "Có thể gây đau đầu, buồn nôn",
    contraindications: "Không dùng cho phụ nữ có thai",
  },
  {
    id: 5,
    name: "Aspirin 100mg",
    category: "Giảm đau",
    price: 12000,
    unit: "Viên",
    stock: 80,
    description: "Giảm đau, chống viêm",
    manufacturer: "Công ty JKL",
    dosage: "1-2 viên/lần, tối đa 3 lần/ngày",
    sideEffects: "Có thể gây kích ứng dạ dày",
    contraindications: "Không dùng cho trẻ em dưới 12 tuổi",
  },
  {
    id: 6,
    name: "Ibuprofen 400mg",
    category: "Giảm đau, chống viêm",
    price: 18000,
    unit: "Viên",
    stock: 45,
    description: "Giảm đau, chống viêm không steroid",
    manufacturer: "Công ty MNO",
    dosage: "1 viên/lần, tối đa 3 lần/ngày",
    sideEffects: "Có thể gây đau dạ dày, chóng mặt",
    contraindications: "Không dùng cho người bị loét dạ dày",
  },
];

const SearchMedicine = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(mockMedicines);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const filtered = mockMedicines.filter(
        (medicine) =>
          medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults(mockMedicines);
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
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
            Tìm kiếm thông tin thuốc trong hệ thống của chúng tôi
          </Typography>
          
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

      <Grid container spacing={3}>
        {searchResults.map((medicine) => (
          <Grid item xs={12} sm={6} md={4} key={medicine.id}>
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
              onClick={() => handleMedicineClick(medicine)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {medicine.name}
                </Typography>
                
                <Chip
                  label={medicine.category}
                  color="primary"
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Giá:</strong> {formatPrice(medicine.price)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Tồn kho:</strong> {medicine.stock} {medicine.unit}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Nhà sản xuất:</strong> {medicine.manufacturer}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {medicine.description}
                </Typography>
                
                <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
                  <Button
                    variant="contained"
                    startIcon={<InfoIcon />}
                    fullWidth
                    sx={{ backgroundColor: "#48C1A6" }}
                  >
                    Xem chi tiết & Giá
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {searchResults.length === 0 && (
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
            Không tìm thấy thuốc phù hợp
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textShadow: "1px 1px 2px rgba(0,0,0,0.2)" }}>
            Hãy thử với từ khóa khác
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
              {selectedMedicine?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMedicine && (
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
                            <Chip label={selectedMedicine.category} color="primary" size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Giá bán:</strong></TableCell>
                          <TableCell>
                            <Typography variant="h6" color="primary" fontWeight="bold">
                              {formatPrice(selectedMedicine.price)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Đơn vị:</strong></TableCell>
                          <TableCell>{selectedMedicine.unit}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Tồn kho:</strong></TableCell>
                          <TableCell>
                            <Typography 
                              color={selectedMedicine.stock > 50 ? "success.main" : selectedMedicine.stock > 20 ? "warning.main" : "error.main"}
                              fontWeight="bold"
                            >
                              {selectedMedicine.stock} {selectedMedicine.unit}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Nhà sản xuất:</strong></TableCell>
                          <TableCell>{selectedMedicine.manufacturer}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h5" color="primary" gutterBottom>
                    Thông tin sử dụng
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Mô tả:
                    </Typography>
                    <Typography variant="body2">
                      {selectedMedicine.description}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Liều dùng:
                    </Typography>
                    <Typography variant="body2">
                      {selectedMedicine.dosage}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tác dụng phụ:
                    </Typography>
                    <Typography variant="body2">
                      {selectedMedicine.sideEffects}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Chống chỉ định:
                    </Typography>
                    <Typography variant="body2">
                      {selectedMedicine.contraindications}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Lưu ý:</strong> Thông tin giá có thể thay đổi. 
                  Để mua hàng và nhận giá ưu đãi, vui lòng đăng nhập vào hệ thống.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Đóng
          </Button>
          <Button 
            variant="contained" 
            onClick={() => navigate("/login")}
            sx={{ backgroundColor: "#48C1A6" }}
          >
            Đăng nhập để mua
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};

export default SearchMedicine;
