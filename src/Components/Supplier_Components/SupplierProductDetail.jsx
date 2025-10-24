import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import supplierAPI from "../../API/supplierAPI";
import supplierProductAPI from "../../API/supplierProductAPI";

const SupplierProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSupplierAndProducts();
  }, [id]);

  const fetchSupplierAndProducts = async () => {
    try {
      setLoading(true);
      const [supplierRes, productsRes] = await Promise.all([
        supplierAPI.getById(id),
        supplierProductAPI.getProductsBySupplier(id),
      ]);

      setSupplier(supplierRes.data);
      
      // Handle different response formats
      let productsData = [];
      if (productsRes.data?.success && productsRes.data?.data) {
        productsData = productsRes.data.data;
      } else if (Array.isArray(productsRes.data)) {
        productsData = productsRes.data;
      }
      
      setProducts(productsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Không thể tải dữ liệu nhà cung cấp và sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải dữ liệu...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/supplier")}
        >
          Quay lại danh sách nhà cung cấp
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/supplier")}
          sx={{ mb: 2 }}
        >
          Quay lại danh sách nhà cung cấp
        </Button>
        
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Chi tiết nhà cung cấp: {supplier?.name}
        </Typography>
        
        {supplier && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Thông tin nhà cung cấp
                  </Typography>
                  <Typography variant="body1">
                    <strong>Tên:</strong> {supplier.name}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Email:</strong> {supplier.email || "Chưa cập nhật"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Liên hệ:</strong> {supplier.contact || "Chưa cập nhật"}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>Địa chỉ:</strong> {supplier.address || "Chưa cập nhật"}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Mô tả:</strong> {supplier.description || "Không có mô tả"}
                  </Typography>
                  <Chip
                    label={supplier.status === "active" ? "Còn cung cấp" : "Ngừng cung cấp"}
                    color={supplier.status === "active" ? "success" : "error"}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Products Section */}
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        Sản phẩm của nhà cung cấp ({products.length} sản phẩm)
      </Typography>

      {products.length > 0 ? (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.supplierProductId}>
              <Card
                sx={{
                  height: "100%",
                  "&:hover": {
                    boxShadow: 3,
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.2s",
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                    {product.productName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Danh mục: {product.categoryName}
                  </Typography>
                  <Typography variant="body1" sx={{ color: "success.main", fontWeight: "medium", mb: 1 }}>
                    Giá: {new Intl.NumberFormat("vi-VN").format(product.price)} VNĐ
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tồn kho: {product.stock}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Nhà cung cấp này chưa có sản phẩm nào
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate("/manager/manage-supplier-products")}
            >
              Quản lý sản phẩm nhà cung cấp
            </Button>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default SupplierProductDetail;
