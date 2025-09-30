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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

// Mock data cho demo
const mockMedicines = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    category: "Giảm đau, hạ sốt",
    price: "15,000 VNĐ",
    stock: 100,
    description: "Thuốc giảm đau, hạ sốt hiệu quả",
    manufacturer: "Công ty ABC",
  },
  {
    id: 2,
    name: "Amoxicillin 250mg",
    category: "Kháng sinh",
    price: "25,000 VNĐ",
    stock: 50,
    description: "Kháng sinh điều trị nhiễm khuẩn",
    manufacturer: "Công ty XYZ",
  },
  {
    id: 3,
    name: "Vitamin C 1000mg",
    category: "Vitamin",
    price: "30,000 VNĐ",
    stock: 75,
    description: "Bổ sung vitamin C tăng cường sức đề kháng",
    manufacturer: "Công ty DEF",
  },
  {
    id: 4,
    name: "Omeprazole 20mg",
    category: "Tiêu hóa",
    price: "20,000 VNĐ",
    stock: 60,
    description: "Điều trị viêm loét dạ dày",
    manufacturer: "Công ty GHI",
  },
];

const SearchMedicine = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(mockMedicines);

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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Tìm kiếm thuốc
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Tìm kiếm thông tin thuốc trong hệ thống của chúng tôi
        </Typography>
        
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 3 }}>
          <Button
            variant="contained"
            onClick={() => navigate("/login")}
            sx={{ backgroundColor: "#48C1A6" }}
          >
            Đăng nhập để mua hàng
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/register")}
          >
            Đăng ký tài khoản
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
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
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{ backgroundColor: "#48C1A6" }}
        >
          Tìm kiếm
        </Button>
      </Box>

      <Grid container spacing={3}>
        {searchResults.map((medicine) => (
          <Grid item xs={12} sm={6} md={4} key={medicine.id}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
                  <strong>Giá:</strong> {medicine.price}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Tồn kho:</strong> {medicine.stock} sản phẩm
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Nhà sản xuất:</strong> {medicine.manufacturer}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {medicine.description}
                </Typography>
                
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate("/login")}
                  sx={{ mt: "auto" }}
                >
                  Đăng nhập để mua
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {searchResults.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Không tìm thấy thuốc phù hợp
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hãy thử với từ khóa khác
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default SearchMedicine;
