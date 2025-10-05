import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
} from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import { useState, useEffect } from "react";
import AddSupplierProductModal from "./AddSupplierProductModal";
import useSupplierProduct from "../../Hooks/useSupplierProduct";
import useCategory from "../../Hooks/useCategory";

const ExpandSupplierProduct = ({
  open,
  supplier,
  palette,
}) => {
  const [openAddProductModal, setOpenAddProductModal] = useState(false);
  const { categories, getAllCategories, loading: loadingCategories } = useCategory();
  const {
    loading,
    error,
    fetchProductsBySupplier,
    createSupplierProduct
  } = useSupplierProduct();

  const [supplierProducts, setSupplierProducts] = useState([]);
  // Fetch products when expanded
  useEffect(() => {
    if (open && supplier?._id) {
      const fetchProducts = async () => {
        const products = await fetchProductsBySupplier(supplier._id);
        setSupplierProducts(products);
      };
      fetchProducts();
    }
    getAllCategories();
  }, [open, supplier?._id]);


  const handleAddProduct = async (productData) => {
    try {
      await createSupplierProduct(productData);
      setOpenAddProductModal(false);
      // Refresh product list after adding
      if (supplier?._id) {
        const products = await fetchProductsBySupplier(supplier._id);
        setSupplierProducts(products);
      }
    } catch (err) {
      alert("Lỗi khi thêm sản phẩm nhà cung cấp: " + (err.message || ""));
    }
  };

  return (
    <Collapse in={open}>
      <Box sx={{ p: 2, backgroundColor: palette.light + "20" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ color: palette.dark }}>
            <InventoryIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Sản phẩm của nhà cung cấp
            <Typography component="span" variant="body2" sx={{ ml: 1, color: "text.secondary" }}>
              (ID: {supplier._id})
            </Typography>
          </Typography>
          <Button
            variant="contained"
            size="small"
            sx={{
              backgroundColor: palette.medium,
              color: palette.dark,
              fontWeight: "bold",
              boxShadow: 1,
              borderRadius: 2,
              textTransform: "none"
            }}
            onClick={() => setOpenAddProductModal(true)}
          >
            Thêm sản phẩm nhà cung cấp
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={32} sx={{ color: palette.dark }} />
          </Box>
        ) : supplierProducts.length > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tìm thấy {supplierProducts.length} sản phẩm
            </Typography>
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: palette.light }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Tên sản phẩm</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Danh mục</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Tồn kho</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Định lượng</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Đơn vị</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Ngày hết hạn</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Ảnh</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplierProducts.map((product) => (
                    <TableRow key={product._id} hover>
                      <TableCell>{product.productName}</TableCell>
                      <TableCell>{product.categoryId?.categoryName || "Không có"}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>{product.quantitative}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>
                        {product.expiry ? new Date(product.expiry).toLocaleDateString() : ""}
                      </TableCell>
                      <TableCell>
                        {product.productImage ? (
                          <Avatar
                            src={product.productImage}
                            alt={product.productName}
                            sx={{ width: 40, height: 40, borderRadius: 2 }}
                            variant="rounded"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Không có
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
            Chưa có sản phẩm nào
          </Typography>
        )}
        <AddSupplierProductModal
          open={openAddProductModal}
          onClose={() => setOpenAddProductModal(false)}
          onSubmit={handleAddProduct}
          supplierId={supplier._id}
          palette={palette}
          categories={categories}
          loadingCategories={loadingCategories}
        />
      </Box>
    </Collapse>
  );
};

export default ExpandSupplierProduct;
