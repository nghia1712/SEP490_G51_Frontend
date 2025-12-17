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
import AddSupplierProduct from "./AddSupplierProduct";
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
        console.log("=== ExpandSupplierProduct - Products received ===");
        console.log("Products:", products);
        console.log("Products length:", products?.length);
        if (products && products.length > 0) {
          console.log("First product:", products[0]);
          console.log("First product keys:", Object.keys(products[0]));
          console.log("First product inputPrice:", products[0].inputPrice, typeof products[0].inputPrice);
          console.log("First product lotQuantity:", products[0].lotQuantity, typeof products[0].lotQuantity);
          console.log("First product productName:", products[0].productName);
          console.log("First product expiredDate:", products[0].expiredDate);
        }
        console.log("=== End Products received ===");
        setSupplierProducts(products || []);
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
                    <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Tên sản phẩm</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="right">Giá</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="right">Tồn kho</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="right">Ngày hết hạn</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplierProducts.map((product, index) => {
                    // Parse inputPrice to number
                    let price = null;
                    if (product.inputPrice !== undefined && product.inputPrice !== null) {
                      price = typeof product.inputPrice === 'string' 
                        ? parseFloat(product.inputPrice) 
                        : Number(product.inputPrice);
                    }
                    
                    // Get lotQuantity (could be 0, so check !== undefined)
                    const stock = product.lotQuantity !== undefined && product.lotQuantity !== null
                      ? product.lotQuantity
                      : null;
                    
                    // Format expiredDate to DD/MM/YYYY
                    let expiredDate = null;
                    if (product.expiredDate) {
                      try {
                        const date = new Date(product.expiredDate);
                        if (!isNaN(date.getTime())) {
                          const day = String(date.getDate()).padStart(2, '0');
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const year = date.getFullYear();
                          expiredDate = `${day}/${month}/${year}`;
                        }
                      } catch (e) {
                        expiredDate = product.expiredDate;
                      }
                    }
                    
                    // Create unique key combining productID and warehouselocationID or index
                    const uniqueKey = product.productID && product.warehouselocationID
                      ? `${product.productID}-${product.warehouselocationID}`
                      : product.productID
                      ? `${product.productID}-${index}`
                      : `product-${index}`;
                    
                    return (
                      <TableRow key={uniqueKey} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {product.productName || "Không có tên"}
                        </TableCell>
                        <TableCell align="right">
                          {price !== null && price !== undefined && !isNaN(price)
                            ? (
                                <>
                                  {new Intl.NumberFormat("vi-VN").format(price)} <span style={{ textDecoration: "underline" }}>đ</span>
                                </>
                              )
                            : "N/A"}
                        </TableCell>
                        <TableCell align="right">
                          {stock !== null && stock !== undefined
                            ? stock
                            : "N/A"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500 }}>
                          {expiredDate || "N/A"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
            Chưa có sản phẩm nào
          </Typography>
        )}
        <AddSupplierProduct
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
