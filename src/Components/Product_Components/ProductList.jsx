import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  ButtonGroup,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Grid,
  TableFooter,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { visuallyHidden } from "@mui/utils";
import { motion, AnimatePresence } from "framer-motion";
import AddProductModal from "./AddProductModal"; // Đổi từ AddProduct sang AddProductModal
import UpdateProductModal from "./UpdateProductModal";
import ProductDetails from "./ProductDetails";
import useProduct from "../../Hooks/useProduct"; // <-- Use custom hook

const DESKTOP_PAGE_SIZE = 20;
const MOBILE_PAGE_SIZE = 10;

// --- BƯỚC 2: ĐỊNH NGHĨA CÁC VARIANTS CHO ANIMATION ---
const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Thời gian trễ giữa các item con
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
  exit: {
    y: -20,
    opacity: 0,
  },
};

const ProductList = () => {
  // Use custom hook for product logic
  const {
    products,
    loading,
    error,
    fetchProducts,
    createProduct, // <-- Thêm hàm createProduct từ hook
    inactiveProduct,
    checkProductName,
  } = useProduct();

  // States for filtering and sorting
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortBy, setSortBy] = useState("productName");
  const [sortDirection, setSortDirection] = useState("asc");

  // States for modals
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showProductDetailsModal, setShowProductDetailsModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // --- Responsive Design & Unified State for Infinite Scroll ---
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [itemsToShow, setItemsToShow] = useState(
    isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let updatedProducts = [...products];
    if (filterText) {
      updatedProducts = updatedProducts.filter((product) =>
        product.productName.toLowerCase().includes(filterText.toLowerCase())
      );
    }
    if (statusFilter !== null) {
      updatedProducts = updatedProducts.filter(
        (product) => product.status === (statusFilter ? "active" : "inactive")
      );
    }
    updatedProducts.sort((a, b) => {
      const isAsc = sortDirection === "asc";
      const aVal = a[sortBy] || "";
      const bVal = b[sortBy] || "";
      if (typeof aVal === "string" && typeof bVal === "string") {
        return isAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return isAsc ? aVal - bVal : bVal - aVal;
    });
    return updatedProducts;
  }, [products, filterText, sortBy, sortDirection, statusFilter]);

  useEffect(() => {
    setItemsToShow(isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE);
  }, [filterText, statusFilter, isMobile]);

  const handleSort = (column) => {
    const isAsc = sortBy === column && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortBy(column);
  };
  const handleOpenUpdateModal = (product) => {
    setSelectedProduct(product);
    setShowUpdateModal(true);
  };
  const handleOpenProductDetailsModal = (product) => {
    setSelectedProduct(product);
    setShowProductDetailsModal(true);
  };
  const handleChangeStatus = async (productId, currentStatus) => {
    if (!window.confirm("Bạn có chắc chắn muốn thay đổi trạng thái?")) return;
    try {
      await inactiveProduct(productId);
      await fetchProducts();
    } catch (err) {
      // Error handled in hook
    }
  };

  const observer = useRef();
  const hasMore = itemsToShow < filteredProducts.length;

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setItemsToShow(
        (prev) => prev + (isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE)
      );
      setIsLoadingMore(false);
    }, 500);
  }, [isMobile]);

  const lastItemElementRef = useCallback(
    (node) => {
      if (isLoadingMore || loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          handleLoadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoadingMore, loading, hasMore, handleLoadMore]
  );

  const renderStatusChip = (status) => (
    <Box
      component="span"
      sx={{
        color: "white",
        bgcolor: status === "active" ? "success.main" : "error.main",
        p: "4px 10px",
        borderRadius: "16px",
        display: "inline-block",
        fontSize: "0.75rem",
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      {status === "active" ? "Đang Bán" : "Ngừng Bán"}
    </Box>
  );
  const headCells = [
    { id: "productImage", label: "Hình Ảnh", sortable: false },
    { id: "productName", label: "Tên Thuốc", sortable: true },
    { id: "totalStock", label: "Tổng SL", sortable: true, align: "center" },
    { id: "importPrice", label: "Giá Nhập", sortable: true, align: "right" },
    { id: "unit", label: "Đơn Vị", sortable: true },
    { id: "location", label: "Vị Trí", sortable: true },
    { id: "status", label: "Trạng Thái", sortable: true },
    { id: "actions", label: "Hành Động", sortable: false, align: "center" },
  ];

  if (loading && products.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  // if (error) {
  //   return (<Container><Alert severity="error" sx={{ mt: 2 }}>{error}</Alert></Container>);
  // }

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
          backgroundColor: "rgba(0, 0, 0, 0.10)",
          backdropFilter: "blur(0.5px)",
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{ 
          p: { xs: 1, sm: 2, md: 3 }, 
          position: "relative", 
          zIndex: 1,
          pt: 4
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            color="white"
            fontWeight="bold"
            sx={{
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              mb: 2,
            }}
          >
            Quản Lý Thuốc
          </Typography>
        </Box>

      {/* --- BƯỚC 3: CẢI TIẾN THANH LỌC --- */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }} // Stretch trên mobile, center trên desktop
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddProductModal(true)}
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.3)",
            },
          }}
        >
          Thêm Thuốc
        </Button>

        {/* Nhóm các control tìm kiếm và lọc vào một Stack */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          <TextField
            placeholder={filterText ? "" : "Tìm kiếm thuốc..."}
            variant="outlined"
            size="small"
            fullWidth
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            sx={{ 
              minWidth: { sm: 250, md: 300 },
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "white",
                },
              },
              "& input::placeholder": {
                color: "rgba(0, 0, 0, 0.6)",
                opacity: 1,
              },
            }}
          />
          <ButtonGroup variant="outlined" fullWidth>
            <Button
              onClick={() => setStatusFilter(true)}
              variant={statusFilter === true ? "contained" : "outlined"}
              sx={{
                backgroundColor: statusFilter === true ? "rgba(255, 255, 255, 0.2)" : "transparent",
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
              }}
            >
              Đang Bán
            </Button>
            <Button
              onClick={() => setStatusFilter(false)}
              variant={statusFilter === false ? "contained" : "outlined"}
              sx={{
                backgroundColor: statusFilter === false ? "rgba(255, 255, 255, 0.2)" : "transparent",
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
              }}
            >
              Ngừng Bán
            </Button>
            <Button
              onClick={() => setStatusFilter(null)}
              variant={statusFilter === null ? "contained" : "outlined"}
              sx={{
                backgroundColor: statusFilter === null ? "rgba(255, 255, 255, 0.2)" : "transparent",
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
              }}
            >
              Tất Cả
            </Button>
          </ButtonGroup>
        </Stack>
      </Stack>

      {isMobile ? (
        // --- BƯỚC 4: ÁP DỤNG MOTION CHO MOBILE VIEW ---
        <>
          <Box
            component={motion.div}
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filteredProducts
                .slice(0, itemsToShow)
                .map((product, index, arr) => (
                  <Box
                    component={motion.div}
                    key={product._id}
                    variants={itemVariants}
                    exit="exit"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Card
                        elevation={2}
                        onClick={() => handleOpenProductDetailsModal(product)}
                        sx={{ mb: 2 }} // Thêm margin bottom cho mỗi card
                        ref={
                          index === arr.length - 1 ? lastItemElementRef : null
                        }
                      >
                        <CardContent>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={3}>
                              <Avatar
                                variant="rounded"
                                src={
                                  product.productImage
                                    ? `http://localhost:9999${product.productImage}`
                                    : "http://localhost:9999/uploads/default-product.png"
                                }
                                alt={product.productName}
                                sx={{ width: "100%", height: "auto" }}
                              />
                            </Grid>
                            <Grid item xs={9}>
                              <Button
                                variant="text"
                                color="primary"
                                sx={{
                                  textTransform: "none",
                                  fontWeight: "bold",
                                  fontSize: "1.1rem",
                                  p: 0,
                                  minWidth: 0,
                                  '&:hover': { textDecoration: 'underline' },
                                }}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleOpenProductDetailsModal(product);
                                }}
                              >
                                {product.productName}
                              </Button>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Tồn kho: <strong>{product.totalStock}</strong>{" "}
                                {product.unit}
                              </Typography>
                              <Typography
                                variant="body1"
                                color="primary.main"
                                fontWeight="bold"
                              >
                                {product.importPrice?.toLocaleString("vi-VN")}{" "}
                                VND
                              </Typography>
                              {renderStatusChip(product.status)}
                            </Grid>
                          </Grid>
                        </CardContent>
                        <CardActions
                          sx={{ justifyContent: "flex-end", p: 2, pt: 0 }}
                        >
                          <Button
                            size="small"
                            color="warning"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUpdateModal(product);
                            }}
                          >
                            Sửa
                          </Button>
                          <Button
                            size="small"
                            color={
                              product.status === "active" ? "error" : "success"
                            }
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChangeStatus(product._id, product.status);
                            }}
                          >
                            {product.status === "active"
                              ? "Vô hiệu"
                              : "Kích hoạt"}
                          </Button>
                        </CardActions>
                      </Card>
                    </motion.div>
                  </Box>
                ))}
            </AnimatePresence>
          </Box>
          {isLoadingMore && (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          )}
        </>
      ) : (
        // --- BƯỚC 5: ÁP DỤNG MOTION CHO DESKTOP VIEW ---
        <Paper sx={{ 
          width: "100%", 
          overflow: "hidden",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
        }}>
          <TableContainer sx={{ maxHeight: "calc(100vh - 280px)" }}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {headCells.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      align={headCell.align || "left"}
                      sortDirection={
                        sortBy === headCell.id ? sortDirection : false
                      }
                    >
                      {headCell.sortable ? (
                        <TableSortLabel
                          active={sortBy === headCell.id}
                          direction={
                            sortBy === headCell.id ? sortDirection : "asc"
                          }
                          onClick={() => handleSort(headCell.id)}
                        >
                          {headCell.label}
                          {sortBy === headCell.id ? (
                            <Box component="span" sx={visuallyHidden}>
                              {sortDirection === "desc"
                                ? "sorted descending"
                                : "sorted ascending"}
                            </Box>
                          ) : null}
                        </TableSortLabel>
                      ) : (
                        headCell.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <Box
                component={motion.tbody}
                variants={listContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {filteredProducts
                    .slice(0, itemsToShow)
                    .map((product, index, arr) => (
                      <TableRow
                        component={motion.tr}
                        key={product._id}
                        variants={itemVariants}
                        exit="exit"
                        layout // Prop quan trọng giúp animation mượt mà khi lọc/sắp xếp
                        hover
                        onClick={() => handleOpenProductDetailsModal(product)}
                        sx={{ cursor: "pointer" }}
                        ref={
                          index === arr.length - 1 ? lastItemElementRef : null
                        }
                      >
                        <TableCell>
                          <Avatar
                            variant="rounded"
                            src={
                              product.productImage
                                ? `http://localhost:9999${product.productImage}`
                                : "http://localhost:9999/uploads/default-product.png"
                            }
                            alt={product.productName}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="text"
                            color="primary"
                            sx={{
                              textTransform: "none",
                              fontWeight: "bold",
                              fontSize: "1rem",
                              p: 0,
                              minWidth: 0,
                              '&:hover': { textDecoration: 'underline' },
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenProductDetailsModal(product);
                            }}
                          >
                            {product.productName}
                          </Button>
                        </TableCell>
                        <TableCell align="center">
                          {product.totalStock}
                        </TableCell>
                        <TableCell align="right">
                          {product.importPrice?.toLocaleString("vi-VN")} VND
                        </TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>
                          {/* Hiển thị vị trí kho dưới dạng danh sách nếu có nhiều vị trí */}
                          {product.location && product.location.length > 0 ? (
                            <Box>
                              {product.location.map((loc, idx) => (
                                <Typography
                                  key={idx}
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {loc.inventoryId?.name ||
                                    "Kho không xác định"}
                                  : {loc.stock} {product.unit}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Chưa có vị trí
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {renderStatusChip(product.status)}
                        </TableCell>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            spacing={1}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              onClick={() => handleOpenUpdateModal(product)}
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="outlined"
                              color={
                                product.status === "active"
                                  ? "error"
                                  : "success"
                              }
                              size="small"
                              onClick={() =>
                                handleChangeStatus(product._id, product.status)
                              }
                            >
                              {product.status === "active"
                                ? "Vô hiệu"
                                : "Kích hoạt"}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </AnimatePresence>
              </Box>
              <TableFooter>
                <TableRow>
                  <TableCell
                    colSpan={headCells.length}
                    sx={{ textAlign: "center", borderBottom: "none" }}
                  >
                    {isLoadingMore && (
                      <CircularProgress size={30} sx={{ my: 1 }} />
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {selectedProduct && (
        <>
          {/* Sử dụng phiên bản mới với Ant Design + Framer Motion */}
          <ProductDetails
            show={showProductDetailsModal}
            handleClose={() => setShowProductDetailsModal(false)}
            product={selectedProduct}
          />
          <UpdateProductModal
            open={showUpdateModal}
            handleClose={() => setShowUpdateModal(false)}
            product={selectedProduct}
            onUpdateSuccess={fetchProducts}
          />
        </>
      )}

      {/* Thay thế AddProduct bằng AddProductModal và truyền createProduct vào */}
        <AddProductModal
          open={showAddProductModal}
          handleClose={() => setShowAddProductModal(false)}
          onSaveSuccess={fetchProducts}
          createProduct={createProduct} // Truyền hàm vào modal
          checkProductName={checkProductName}
        />
      </Container>
    </Box>
  );
};

export default ProductList;
