import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  Grid,
  Card,
  Typography,
  Stack,
  Divider,
  IconButton,
  CircularProgress,
  Chip
} from "@mui/material";
import {
  Business as BusinessIcon,
  Close as CloseIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon
} from "@mui/icons-material";

const SupplierDetailsModal = ({
  open,
  onClose,
  selectedSupplier,
  supplierProducts,
  tabValue,
  setTabValue,
  loadingProducts,
  palette,
  getStatusChip,
  formatPhoneNumber
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          height: "80vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: palette.dark,
          color: palette.white,
          display: "flex",
          alignItems: "center",
          pb: 2,
        }}
      >
        <BusinessIcon sx={{ mr: 1 }} />
        Chi tiết nhà cung cấp: {selectedSupplier?.name}
        <IconButton
          onClick={onClose}
          sx={{
            ml: "auto",
            color: palette.white,
            "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, height: "100%" }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            backgroundColor: "#f8fafc",
          }}
        >
          <Tab
            label="Thông tin cơ bản"
            sx={{ "&.Mui-selected": { color: palette.dark } }}
          />
          <Tab
            label={`Sản phẩm (${supplierProducts.length})`}
            sx={{ "&.Mui-selected": { color: palette.dark } }}
          />
        </Tabs>
        {/* Tab 1: Basic Info */}
        {tabValue === 0 && selectedSupplier && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 3, height: "100%" }}>
                  <Typography variant="h6" sx={{ mb: 2, color: palette.dark }}>
                    Thông tin liên hệ
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tên nhà cung cấp
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                        {selectedSupplier.name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Số điện thoại
                      </Typography>
                      <Typography variant="body1">
                        {formatPhoneNumber(selectedSupplier.contact)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {selectedSupplier.email || "Chưa cập nhật"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Địa chỉ
                      </Typography>
                      <Typography variant="body1">
                        {selectedSupplier.address || "Chưa cập nhật"}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 3, height: "100%" }}>
                  <Typography variant="h6" sx={{ mb: 2, color: palette.dark }}>
                    Thông tin khác
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Trạng thái
                      </Typography>
                      {getStatusChip(selectedSupplier.status)}
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Mô tả
                      </Typography>
                      <Typography variant="body1">
                        {selectedSupplier.description || "Không có mô tả"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Số lượng sản phẩm
                      </Typography>
                      <Typography variant="h4" sx={{ color: palette.medium, fontWeight: "bold" }}>
                        {supplierProducts.length}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        {/* Tab 2: Products */}
        {tabValue === 1 && (
          <Box sx={{ p: 3, height: "100%", overflow: "auto" }}>
            {loadingProducts ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
                <CircularProgress sx={{ color: palette.dark }} />
              </Box>
            ) : supplierProducts.length > 0 ? (
              <Grid container spacing={3}>
                {supplierProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product.supplierProductId}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 3,
                        height: "100%",
                        "&:hover": {
                          boxShadow: 4,
                          transform: "translateY(-4px)",
                        },
                        transition: "all 0.3s",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <ShoppingCartIcon sx={{ color: palette.dark, mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: palette.dark }}>
                          {product.productName}
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Danh mục
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                            {product.categoryName}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Giá bán
                          </Typography>
                          <Typography variant="h6" sx={{ color: palette.medium, fontWeight: "bold" }}>
                            {new Intl.NumberFormat("vi-VN").format(product.price)} VNĐ
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Tồn kho
                          </Typography>
                          <Chip
                            label={`${product.stock} sản phẩm`}
                            size="small"
                            color={product.stock > 0 ? "success" : "error"}
                            variant="outlined"
                          />
                        </Box>
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <InventoryIcon sx={{ fontSize: 64, color: "grey.300", mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                  Nhà cung cấp này chưa có sản phẩm nào
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupplierDetailsModal;
