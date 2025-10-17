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
  Pagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import InventoryIcon from "@mui/icons-material/Inventory";
import { visuallyHidden } from "@mui/utils";
import Tooltip from "@mui/material/Tooltip";
import { motion, AnimatePresence } from "framer-motion";
import AddProductModal from "./AddProductModal"; // Đổi từ AddProduct sang AddProductModal
import UpdateProductModal from "./UpdateProductModal";
import ProductDetails from "./ProductDetails";
import useProduct from "../../Hooks/useProduct"; // <-- Use custom hook

const PAGE_SIZE = 5;

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
  const [page, setPage] = useState(1);
  const [itemsToShow, setItemsToShow] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let updatedProducts = [...products];
    if (filterText) {
      updatedProducts = updatedProducts.filter((product) => {
        const name = product.productName || product.ProductName || '';
        return String(name).toLowerCase().includes(filterText.toLowerCase());
      });
    }
    if (statusFilter !== null) {
      updatedProducts = updatedProducts.filter((product) => {
        const normalized = (product.status === true || product.status === 'active' || product.Status === true) ? 'active' : 'inactive';
        return normalized === (statusFilter ? 'active' : 'inactive');
      });
    }
    updatedProducts.sort((a, b) => {
      const isAsc = sortDirection === "asc";
      const aVal = sortBy === 'productId' ? (a._pid ?? getProductIdValue(a) ?? 0) : (a[sortBy] || a?.[sortBy?.charAt(0).toUpperCase() + sortBy?.slice(1)] || "");
      const bVal = sortBy === 'productId' ? (b._pid ?? getProductIdValue(b) ?? 0) : (b[sortBy] || b?.[sortBy?.charAt(0).toUpperCase() + sortBy?.slice(1)] || "");
      if (typeof aVal === "string" && typeof bVal === "string") {
        return isAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return isAsc ? aVal - bVal : bVal - aVal;
    });
    return updatedProducts;
  }, [products, filterText, sortBy, sortDirection, statusFilter]);

  useEffect(() => {
    setItemsToShow(PAGE_SIZE);
    setPage(1);
  }, [filterText, statusFilter, isMobile]);

  // Refetch from BE when toggling status filter to active-only
  useEffect(() => {
    if (statusFilter === true) {
      fetchProducts({ onlyActive: true });
    } else {
      // For both 'Ngừng bán' (false) and 'Tất cả' (null), load full list then filter client-side
      fetchProducts({ onlyActive: false });
    }
  }, [statusFilter]);

  const handleSort = (column) => {
    // For productId: define ascending = 1->5, descending = 5->1
    const isCurrentlyAsc = sortBy === column && sortDirection === "asc";
    setSortDirection(isCurrentlyAsc ? "desc" : "asc");
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
  const handleChangeStatus = async (product, currentStatus) => {
    const isActive = currentStatus === 'active' || currentStatus === true;
    const actionLabel = isActive ? 'Dừng bán' : 'Kích hoạt';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionLabel.toLowerCase()} sản phẩm?`)) return;
    try {
      const idForLog = product?._pid ?? getProductIdValue(product);
      console.log('Toggle product status →', { id: idForLog, currentStatus, product });
      await inactiveProduct(product);
      await fetchProducts();
    } catch (err) {
      // Error handled in hook
    }
  };

  const observer = useRef();
  const hasMore = false;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEnd = page * PAGE_SIZE;

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

  // Ensure each rendered row/card has a stable unique key
  const getProductKey = useCallback((p, idx) => {
    return (
      p?.ProductID ??
      p?.productID ??
      p?.ProductId ??
      p?.productId ??
      p?.id ??
      p?._id ??
      p?.code ??
      `${p?.productName || 'product'}-${idx}`
    );
  }, []);

  const getProductIdValue = (p) => p?.ProductID ?? p?.productID ?? p?.ProductId ?? p?.productId ?? p?.id ?? p?._id ?? '';

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
    { id: "productId", label: "#", sortable: true, align: "center" },
    { id: "productImage", label: "Hình Ảnh", sortable: false },
    { id: "productName", label: "Tên Thuốc", sortable: true },
    { id: "minQuantity", label: "SL Tối thiểu", sortable: true, align: "center" },
    { id: "maxQuantity", label: "SL Tối đa", sortable: true, align: "center" },
    { id: "totalCurrentQuantity", label: "Tổng SL hiện tại", sortable: true, align: "center" },
    { id: "unit", label: "Đơn Vị", sortable: true },
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
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: 2
             }}
           >
             <InventoryIcon sx={{ fontSize: '2.5rem' }} />
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
                .slice(pageStart, pageEnd)
                .map((product, index, arr) => (
                  <Box
                    component={motion.div}
                    key={getProductKey(product, index)}
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
                                    : "/images/login_image.jpg"
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
          <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
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
                          hideSortIcon
                          direction={(() => {
                            if (sortBy !== headCell.id) return 'asc';
                            // For productId, show up-arrow for desc (5->1), down-arrow for asc (1->5)
                            if (headCell.id === 'productId') {
                              return sortDirection === 'asc' ? 'desc' : 'asc';
                            }
                            return sortDirection;
                          })()}
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
                    .slice(pageStart, pageEnd)
                    .map((product, index, arr) => (
                      <TableRow
                        component={motion.tr}
                        key={getProductKey(product, index)}
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
                        <TableCell align="center">
                          {product._pid ?? product.ProductID ?? product.productID ?? product.ProductId ?? product.productId ?? index + 1}
                        </TableCell>
                        <TableCell>
                          <Avatar
                            variant="rounded"
                            src={
                              product.productImage
                                ? `http://localhost:9999${product.productImage}`
                                : "/images/login_image.jpg"
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
                          {product.MinQuantity ?? product.minQuantity ?? 0}
                        </TableCell>
                        <TableCell align="center">
                          {product.MaxQuantity ?? product.maxQuantity ?? 0}
                        </TableCell>
                        <TableCell align="center">
                          {product.TotalCurrentQuantity ?? product.totalCurrentQuantity ?? product.totalStock ?? 0}
                        </TableCell>
                        <TableCell>{product.Unit ?? product.unit}</TableCell>
                        {/* Xóa cột vị trí theo yêu cầu */}
                        <TableCell>
                          {renderStatusChip((product.status ?? product.Status) ? "active" : "inactive")}
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
                            <Tooltip title={product._pid ? "" : "Không tìm thấy ProductID từ API - không thể đổi trạng thái"}>
                              <span>
                                <Button
                                  variant="contained"
                                  color={(product.status ?? product.Status) ? "error" : "success"}
                                  size="small"
                                  disabled={!product._pid}
                                  onClick={() => handleChangeStatus(product, (product.status ?? product.Status) ? "active" : "inactive")}
                                >
                                  {(product.status ?? product.Status) ? "Ngừng bán" : "Kích hoạt"}
                                </Button>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </AnimatePresence>
              </Box>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={headCells.length} sx={{ borderBottom: "none", p: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
                    </Box>
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
