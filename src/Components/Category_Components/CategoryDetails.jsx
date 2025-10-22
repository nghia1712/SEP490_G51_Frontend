import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
} from "@mui/material";

const CategoryDetails = ({ open, onClose, category }) => {
  if (!category) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>
        Chi tiết danh mục: {category?.name || category?.categoryName || 'Không có tên'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              ID danh mục
            </Typography>
            <Typography variant="body1">
              {category?.categoryID || category?.CategoryID || category?._id || category?.id || 'N/A'}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Tên danh mục
            </Typography>
            <Typography variant="body1">
              {category?.name || category?.categoryName || category?.CategoryName || 'Không có tên'}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Mô tả
            </Typography>
            <Typography variant="body1">
              {category?.description || 'Không có mô tả'}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Số sản phẩm
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="primary">
              {(() => {
                const products = category?.products || 
                               category?.Products || 
                               category?.productList || 
                               category?.ProductList ||
                               category?.items ||
                               category?.Items ||
                               [];
                
                const productCount = products?.length || 0;
                
                // Hiển thị trạng thái dựa trên số sản phẩm
                if (productCount > 0) {
                  return (
                    <span style={{ color: '#4caf50' }}>
                      {productCount} sản phẩm (Luôn hoạt động)
                    </span>
                  );
                }
                
                return (
                  <span style={{ color: '#ff9800' }}>
                    {productCount} sản phẩm (Có thể kích hoạt/ngừng hoạt động)
                  </span>
                );
              })()}
            </Typography>
          </Box>
          
          {/* Hiển thị danh sách sản phẩm nếu có */}
          {(() => {
            const products = category?.products || 
                           category?.Products || 
                           category?.productList || 
                           category?.ProductList ||
                           category?.items ||
                           category?.Items ||
                           [];
            
            if (products && products.length > 0) {
              return (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Danh sách sản phẩm
                  </Typography>
                  <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {products.map((product, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                        • {product?.productName || product?.ProductName || product?.name || 'Tên không xác định'}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              );
            }
            return null;
          })()}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryDetails;
