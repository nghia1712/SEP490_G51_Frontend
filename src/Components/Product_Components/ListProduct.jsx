import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
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
  TableFooter,
  Paper,
  TableSortLabel,
  CircularProgress,
  Alert,
  Avatar,
  Pagination,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { visuallyHidden } from "@mui/utils";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";
import ProductDetails from "./ProductDetails";
import useProduct from "../../Hooks/useProduct";
import ProductLotsModal from "./ProductLotsModal";
import categoryAPI from "../../API/categoryAPI";

const PAGE_SIZE = 5;

const ListProduct = () => {
    const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Use custom hook for product logic
  const {
    products,
    loading,
    error,
    fetchProducts,
    createProduct, // <-- Thêm hàm createProduct từ hook
    inactiveProduct,
    checkProductName,
    fetchProductLots,
  } = useProduct();
  const [showLotsModal, setShowLotsModal] = useState(false);
  const [lotsData, setLotsData] = useState([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const handleViewLots = async (product) => {
    setLotsLoading(true);
    try {
      const lots = await fetchProductLots(
        product._pid ?? product.productID ?? product.ProductID
      );
      setLotsData(lots);
      setSelectedProduct(product);
      setShowLotsModal(true);
    } catch (err) {
      alert("Lấy danh sách lô thất bại: " + err.message);
    } finally {
      setLotsLoading(false);
    }
  };

  // States for filtering and sorting
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortBy, setSortBy] = useState("productName");
  const [sortDirection, setSortDirection] = useState("asc");

  // States for modals
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProductDetailsModal, setShowProductDetailsModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [categoryMap, setCategoryMap] = useState({});

  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryAPI.getAll();
        const data = response?.data?.data || response?.data || [];
        const map = {};
        data.forEach((cat) => {
          const id =
            cat?.CategoryID ?? cat?.categoryID ?? cat?.id ?? cat?.Id;
          if (id !== undefined && id !== null) {
            map[id] =
              cat?.Name || cat?.name || cat?.CategoryName || cat?.categoryName || "";
          }
        });
        setCategoryMap(map);
      } catch (error) {
        console.error("Không tải được danh mục:", error);
        setCategoryMap({});
      }
    };

    loadCategories();
  }, []);


  const filteredProducts = useMemo(() => {
    let updatedProducts = [...products];
    if (filterText) {
      updatedProducts = updatedProducts.filter((product) => {
        const name = product.productName || product.ProductName || "";
        return String(name).toLowerCase().includes(filterText.toLowerCase());
      });
    }
    if (statusFilter !== null) {
      updatedProducts = updatedProducts.filter((product) => {
        const normalized =
          product.status === true ||
          product.status === "active" ||
          product.Status === true
            ? "active"
            : "inactive";
        return normalized === (statusFilter ? "active" : "inactive");
      });
    }
    updatedProducts.sort((a, b) => {
      const isAsc = sortDirection === "asc";
      const aVal =
        sortBy === "productId"
          ? a._pid ?? getProductIdValue(a) ?? 0
          : a[sortBy] ||
            a?.[sortBy?.charAt(0).toUpperCase() + sortBy?.slice(1)] ||
            "";
      const bVal =
        sortBy === "productId"
          ? b._pid ?? getProductIdValue(b) ?? 0
          : b[sortBy] ||
            b?.[sortBy?.charAt(0).toUpperCase() + sortBy?.slice(1)] ||
            "";
      if (typeof aVal === "string" && typeof bVal === "string") {
        return isAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return isAsc ? aVal - bVal : bVal - aVal;
    });
    return updatedProducts;
  }, [products, filterText, sortBy, sortDirection, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [filterText, statusFilter]);

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

  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleOpenProductDetailsModal = (product) => {
    const productId = getProductIdValue(product);
    if (!productId) {
      setSnackbarMessage('Không tìm thấy ID sản phẩm để xem chi tiết.');
      setSnackbarOpen(true);
      return;
    }
    setSelectedProduct(product);
    setSelectedProductId(productId);
    setShowProductDetailsModal(true);
  };

  const handleChangeStatus = async (product, currentStatus) => {
    const isActive = currentStatus === "active" || currentStatus === true;
    const actionLabel = isActive ? "Dừng bán" : "Kích hoạt";
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn ${actionLabel.toLowerCase()} sản phẩm?`
      )
    )
      return;
    try {
      const idForLog = product?._pid ?? getProductIdValue(product);
      console.log("Toggle product status →", {
        id: idForLog,
        currentStatus,
        product,
      });
      await inactiveProduct(product);
      await fetchProducts();
    } catch (err) {
      // Error handled in hook
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEnd = page * PAGE_SIZE;

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
      `${p?.productName || "product"}-${idx}`
    );
  }, []);

  const getProductIdValue = (p) =>
    p?.ProductID ??
    p?.productID ??
    p?.ProductId ??
    p?.productId ??
    p?.id ??
    p?._id ??
    "";

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
    { id: "productId", label: "#", sortable: true, align: "left", width: '3%' },
    { id: "productImage", label: "Hình Ảnh", sortable: false, width: '6%', align: "left" },
    { id: "productName", label: "Tên Thuốc", sortable: true, width: '15%' },
    { id: "category", label: "Danh Mục", sortable: false, width: '12%' },
    { id: "unit", label: "Đơn Vị", sortable: true, width: '10%' },
    { id: "status", label: "Trạng Thái", sortable: true, width: '12%' },
    { id: "actions", label: "Hành Động", sortable: false, align: "center", width: '25%' },
  ];

  // Loading
  if (loading && products.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Title */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
          variant="h4"
            component="h1"
            sx={{
            fontWeight: 'bold',
            color: '#155E64',
              mb: 2,
            }}
          >
            Quản Lý Thuốc
          </Typography>
        </Box>

      {/* Filter */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <FormControl
          size="small"
          sx={{
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'transparent',
              '& fieldset': {
                borderColor: '#1976d2',
                borderWidth: '1.5px',
              },
              '&:hover fieldset': {
                borderColor: '#1565c0',
                borderWidth: '1.5px',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1976d2',
                borderWidth: '2px',
              },
            },
          }}
        >
          <InputLabel id="status-filter-label">Lọc theo trạng thái</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter === null ? 'all' : statusFilter === true ? 'active' : 'inactive'}
            label="Lọc theo trạng thái"
            onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(value === 'all' ? null : value === 'active' ? true : false);
            }}
            sx={{
              backgroundColor: '#fff',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1976d2',
                borderWidth: '1.5px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1565c0',
                borderWidth: '1.5px',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1976d2',
                borderWidth: '2px',
              },
            }}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="active">Đang bán</MenuItem>
            <MenuItem value="inactive">Ngừng bán</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
            placeholder="Tìm kiếm thuốc..."
              variant="outlined"
              size="small"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              sx={{
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                '& fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: '1.5px',
                },
                '&:hover fieldset': {
                  borderColor: '#1565c0',
                  borderWidth: '1.5px',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: '2px',
                },
              },
              '& input': {
                color: '#000',
                fontWeight: 500,
              },
              '& input::placeholder': {
                color: '#666',
                  opacity: 1,
                fontWeight: 400,
                },
              }}
            />
          
              <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddProduct(true)}
                sx={{
              backgroundColor: '#155E64',
              '&:hover': {
                backgroundColor: '#0D4F52',
              },
              borderRadius: '8px',
              px: 3,
              py: 1.5,
            }}
          >
            THÊM THUỐC
                            </Button>
                    </Box>
            </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
            </Box>
      )}

      {/* Table */}
      {!loading && (
        <TableContainer 
          component={Paper} 
            sx={{
            boxShadow: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Table sx={{ tableLayout: 'fixed' }}>
                <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    {headCells.map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.align || "left"}
                    sx={{
                      py: 1.5,
                      px: 2,
                      textAlign: headCell.align || 'left',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                        sortDirection={
                          sortBy === headCell.id ? sortDirection : false
                        }
                      >
                        {headCell.sortable ? (
                          <TableSortLabel
                            active={sortBy === headCell.id}
                            direction={(() => {
                              if (sortBy !== headCell.id) return "asc";
                              if (headCell.id === "productId") {
                                return sortDirection === "asc" ? "desc" : "asc";
                              }
                              return sortDirection;
                            })()}
                            onClick={() => handleSort(headCell.id)}
                        sx={{
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          letterSpacing: '0.03em',
                        }}
                          >
                            {headCell.label}
                          </TableSortLabel>
                        ) : (
                      <span style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.03em' }}>
                        {headCell.label}
                      </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
            <TableBody>
        {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có thuốc nào.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
            filteredProducts
                      .slice(pageStart, pageEnd)
              .map((product, index) => (
                        <TableRow
                          key={getProductKey(product, index)}
                          hover
                          onClick={() => handleOpenProductDetailsModal(product)}
                  sx={{
                    cursor: 'pointer',
                    '&:nth-of-type(even)': {
                      backgroundColor: '#f9f9f9',
                    },
                    '& td': {
                      py: 1.5,
                      px: 2,
                      verticalAlign: 'middle',
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 400, textAlign: 'left', width: '3%', px: 1 }}>
                    {pageStart + index + 1}
                          </TableCell>
                  <TableCell sx={{ textAlign: 'left', width: '6%', pl: 0.5, pr: 1 }}>
                            <Avatar
                              variant="rounded"
                              src={
                                product.image
                                  ? `https://api.bbpharmacy.site/${product.image}`
                                  : null
                              }
                              alt={product.productName}
                              sx={{
                                backgroundColor: product.image
                                  ? "transparent"
                                  : "#1976d2",
                                fontSize: "1rem",
                                fontWeight: "bold",
                              }}
                            >
                              {!product.image && product.productName
                                ? product.productName.charAt(0).toUpperCase()
                                : null}
                            </Avatar>
                          </TableCell>
                  <TableCell sx={{ fontWeight: 500, textAlign: 'left', pl: 1, width: '18%' }}>
                        {product.productName || product.ProductName || 'Tên không xác định'}
                          </TableCell>
                  <TableCell sx={{ textAlign: 'left', width: '15%' }}>
                    {(() => {
                      const categoryId =
                        product.categoryID ??
                        product.CategoryID ??
                        product.categoryId ??
                        product.CategoryId ??
                        product.category?.CategoryID ??
                        product.category?.categoryID ??
                        product.Category?.CategoryID ??
                        null;
                      const fromMap = categoryId ? categoryMap[categoryId] : null;
                      return (
                        product.categoryName ||
                        fromMap ||
                        product.Category?.Name ||
                        product.category?.name ||
                        'Không có'
                      );
                    })()}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'left', width: '10%' }}>
                    {product.Unit ?? product.unit}
                  </TableCell>
                          {/* Xóa cột vị trí theo yêu cầu */}
                  <TableCell sx={{ width: '12%', textAlign: 'left', pl: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                          <Chip
                            label={(() => {
                              const status = product.status ?? product.Status;
                              return status === true || status === "active" ? 'Đang bán' : 'Ngừng bán';
                            })()}
                            size="small"
                              sx={{
                              backgroundColor: (() => {
                                const status = product.status ?? product.Status;
                                return status === true || status === "active" ? '#d4edda' : '#f8d7da';
                              })(),
                              color: (() => {
                                const status = product.status ?? product.Status;
                                return status === true || status === "active" ? '#155724' : '#721c24';
                              })(),
                            }}
                          />
                        </Box>
                          </TableCell>
                  <TableCell sx={{ textAlign: 'right', verticalAlign: 'middle', width: '25%' }} onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          <Tooltip title="Sửa" placement="bottom" arrow>
                            <IconButton
                              size="medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(product);
                              }}
                              sx={{
                                color: '#ed6c02',
                                width: '40px',
                                height: '40px',
                                '&:hover': {
                                  backgroundColor: 'rgba(237, 108, 2, 0.1)',
                                },
                              }}
                            >
                              <EditIcon fontSize="medium" />
                            </IconButton>
                          </Tooltip>
                                  <Button
                                    variant="contained"
                            color={(() => {
                              const status = product.status ?? product.Status;
                              return status === true || status === "active" ? "error" : "success";
                            })()}
                                    size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                                      handleChangeStatus(
                                        product,
                                product.status ?? product.Status ? "active" : "inactive"
                              );
                            }}
                            sx={{ 
                            minWidth: 140,
                            width: 140,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {(() => {
                              const status = product.status ?? product.Status;
                              return status === true || status === "active" ? "NGỪNG BÁN" : "KÍCH HOẠT";
                            })()}
                                  </Button>
                              <Button
                                variant="outlined"
                                color="info"
                                size="medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewLots(product);
                            }}
                                sx={{
                                  minWidth: 100,
                                  height: 32,
                                  fontWeight: 400,
                                  borderWidth: 1,
                                  px: 2,
                                }}
                              >
                            XEM LÔ
                              </Button>
                        </Box>
                          </TableCell>
                        </TableRow>
                  ))
              )}
            </TableBody>
            {filteredProducts.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell
                      colSpan={headCells.length}
                    sx={{ borderBottom: 'none', p: 2 }}
                    >
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Pagination
                          count={totalPages}
                          page={page}
                          onChange={(_, v) => setPage(v)}
                          color="primary"
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableFooter>
            )}
              </Table>
            </TableContainer>
        )}

        <ProductLotsModal
          open={showLotsModal}
          onClose={() => setShowLotsModal(false)}
          productName={selectedProduct?.productName ?? ""}
          lots={lotsData}
          loading={lotsLoading}
          onNotify={(snack) => setSnack(snack)}
        />


        {selectedProduct && (
          <>
            {/* Sử dụng phiên bản mới với Ant Design + Framer Motion */}
            <ProductDetails
              show={showProductDetailsModal}
              handleClose={() => setShowProductDetailsModal(false)}
              product={selectedProduct}
        productId={selectedProductId}
            />
            <EditProduct
              open={showEditModal}
              handleClose={() => setShowEditModal(false)}
              product={selectedProduct}
              existingProducts={products}
              onUpdateSuccess={fetchProducts}
            />
          </>
        )}

        {/* Thay thế AddProductModal bằng AddProduct và truyền createProduct vào */}
        <AddProduct
          open={showAddProduct}
          handleClose={() => setShowAddProduct(false)}
          onSaveSuccess={fetchProducts}
        createProduct={createProduct}
          checkProductName={checkProductName}
          existingProducts={products}
        />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarMessage.includes('thành công') ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      </Container>
  );
};

export default ListProduct;
