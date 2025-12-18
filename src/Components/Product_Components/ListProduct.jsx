import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  Card,
  CardContent,
  Stack,
  InputAdornment,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormControl,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { visuallyHidden } from "@mui/utils";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";
import ProductDetails from "./ProductDetails";
import useProduct from "../../Hooks/useProduct";
import ProductLotsModal from "./ProductLotsModal";
import categoryAPI from "../../API/categoryAPI";
import MedicationIcon from "@mui/icons-material/Medication";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken";

const PAGE_SIZE = 5;

const ListProduct = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const userRole = getUserRoleFromToken();
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
  const [statusFilter, setStatusFilter] = useState({
    "Còn cung cấp": false,
    "Ngừng cung cấp": false,
  });
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
          const id = cat?.CategoryID ?? cat?.categoryID ?? cat?.id ?? cat?.Id;
          if (id !== undefined && id !== null) {
            map[id] =
              cat?.Name ||
              cat?.name ||
              cat?.CategoryName ||
              cat?.categoryName ||
              "";
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

    const hasStatusFilter =
      statusFilter["Còn cung cấp"] || statusFilter["Ngừng cung cấp"];

    if (hasStatusFilter) {
      updatedProducts = updatedProducts.filter((product) => {
        const normalized =
          product.status === true ||
          product.status === "active" ||
          product.Status === true
            ? "active"
            : "inactive";
        const isActive = normalized === "active";
        if (isActive) {
          return statusFilter["Còn cung cấp"];
        }
        return statusFilter["Ngừng cung cấp"];
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
      setSnackbarMessage("Không tìm thấy ID sản phẩm để xem chi tiết.");
      setSnackbarOpen(true);
      return;
    }
    setSelectedProduct(product);
    setSelectedProductId(productId);
    setShowProductDetailsModal(true);
  };

  const handleStatusFilterChange = (event) => {
    const { name, checked } = event.target;
    setStatusFilter((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleClearFilters = () => {
    setFilterText("");
    setStatusFilter({ "Còn cung cấp": false, "Ngừng cung cấp": false });
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
    { id: "productId", label: "#", sortable: true, align: "left", width: "3%" },
    {
      id: "productImage",
      label: "Hình Ảnh",
      sortable: false,
      width: "6%",
      align: "left",
    },
    { id: "productName", label: "Tên Thuốc", sortable: true, width: "15%" },
    { id: "category", label: "Danh Mục", sortable: false, width: "12%" },
    { id: "unit", label: "Đơn Vị", sortable: true, width: "3%" },
    { id: "status", label: "Trạng Thái", sortable: true, width: "10%" },
    {
      id: "actions",
      label: "Hành Động",
      sortable: false,
      align: "right",
      width: "25%",
    },
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
    <Container maxWidth="xl" sx={{ mt: 0, mb: 4, pt: 4 }}>
      <Card
        elevation={3}
        sx={{ borderRadius: 2, backgroundColor: "rgba(255, 255, 255, 0.95)" }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Title */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <MedicationIcon sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
            <Typography
              variant="h4"
              component="h1"
              sx={{ color: "#1976d2", fontWeight: "bold", flexGrow: 1 }}
            >
              Quản lý thuốc
            </Typography>
            <Typography variant="h6" color="textSecondary">
              {filteredProducts.length === products.length
                ? `Tổng: ${products.length} sản phẩm`
                : `Tổng: ${filteredProducts.length} / ${products.length} sản phẩm`}
            </Typography>
          </Box>

          {/* FILTER */}
          <Paper
            className="product-list-filter-container"
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: "#f8fafc",
              borderRadius: 2,
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "stretch", md: "center" }}
              spacing={2}
              justifyContent="space-between"
            >
              {/* LEFT: Lọc trạng thái + tìm kiếm */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                sx={{
                  width: { xs: "100%", md: "auto" },
                  flex: { xs: "1 1 auto", md: "0 1 auto" },
                }}
              >
                {/* Search */}
                <TextField
                  placeholder="Tìm kiếm thuốc..."
                  variant="outlined"
                  size="small"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    minWidth: { xs: "100%", sm: 250 },
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      "& fieldset": {
                        borderColor: "#1976d2",
                        borderWidth: "1.5px",
                      },
                      "&:hover fieldset": {
                        borderColor: "#1565c0",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1976d2",
                        borderWidth: "2px",
                      },
                    },
                  }}
                />
                <FormControl
                  size="small"
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    minWidth: { xs: "100%", sm: 200 },
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      "& fieldset": {
                        borderColor: "#1976d2",
                        borderWidth: "1.5px",
                      },
                      "&:hover fieldset": {
                        borderColor: "#1565c0",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1976d2",
                        borderWidth: "2px",
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexDirection: { xs: "column", sm: "row" },
                      width: { xs: "100%", sm: "auto" },
                    }}
                  >
                    <FormGroup row={!isMobile}>
                      {[
                        { key: "Còn cung cấp", label: "Đang bán" },
                        { key: "Ngừng cung cấp", label: "Ngừng bán" },
                      ].map(({ key, label }) => (
                        <FormControlLabel
                          key={key}
                          control={
                            <Checkbox
                              name={key}
                              checked={statusFilter[key]}
                              onChange={handleStatusFilterChange}
                              size="small"
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="body2">{label}</Typography>
                          }
                        />
                      ))}
                    </FormGroup>
                  </Box>
                </FormControl>
                {/* CLEAR FILTER */}
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleClearFilters}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Xóa lọc
                </Button>
              </Stack>

              {/* RIGHT: Nút thêm thuốc */}
              <Box
                sx={{
                  marginLeft: { xs: 0, md: "auto" },
                  width: { xs: "100%", md: "auto" },
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddProduct(true)}
                  fullWidth={isMobile}
                  sx={{
                    backgroundColor: "#155E64",
                    "&:hover": { backgroundColor: "#0D4F52" },
                    borderRadius: "8px",
                    px: { xs: 2, sm: 3 },
                    py: 1.5,
                    fontWeight: "600",
                  }}
                >
                  {isMobile ? "THÊM THUỐC" : "THÊM THUỐC"}
                </Button>
              </Box>
            </Stack>
          </Paper>

          {/* Loading */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Table View - Scrollable on all screen sizes */}
          {!loading && (
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 2,
                boxShadow: 1,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <Table
                className="product-list-table"
                sx={{
                  tableLayout: "auto",
                  borderSpacing: 0,
                  borderCollapse: "collapse",
                  minWidth: 1000, // Đảm bảo table rộng hơn container để có scroll ngang
                }}
              >
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    {headCells.map((headCell, idx) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.align || "left"}
                        sx={{
                          py: { xs: 1, sm: 1.5 },
                          px: {
                            xs: 1,
                            sm:
                              idx === 0
                                ? 2
                                : idx === 1
                                ? 0
                                : idx === 4
                                ? 0
                                : idx === 5
                                ? 0
                                : 2,
                          },
                          pr: {
                            xs: 1,
                            sm:
                              idx === 0
                                ? 0
                                : idx === 1
                                ? 1
                                : idx === 4
                                ? 0
                                : idx === 5
                                ? 1
                                : 2,
                          },
                          pl: {
                            xs: 1,
                            sm: idx === 4 ? 1 : idx === 5 ? 0 : undefined,
                          },
                          textAlign: headCell.align || "left",
                          fontWeight: 600,
                          letterSpacing: "0.03em",
                          fontSize: {
                            xs: "0.7rem",
                            sm: "0.8rem",
                            md: "0.875rem",
                          },
                          whiteSpace: "nowrap", // Prevent text wrapping in headers
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
                              fontWeight: 600,
                              letterSpacing: "0.03em",
                            }}
                          >
                            {headCell.label}
                          </TableSortLabel>
                        ) : (
                          <span
                            style={{
                              fontWeight: 600,
                              letterSpacing: "0.03em",
                            }}
                          >
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
                      <TableCell
                        colSpan={headCells.length}
                        sx={{ textAlign: "center", py: 3 }}
                      >
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
                            cursor: "pointer",
                            "&:nth-of-type(even)": {
                              backgroundColor: "#f9f9f9",
                            },
                            "& td": {
                              py: { xs: 1, sm: 1.5 },
                              px: { xs: 1, sm: 2 },
                              verticalAlign: "middle",
                              fontSize: {
                                xs: "0.7rem",
                                sm: "0.8rem",
                                md: "0.875rem",
                              },
                            },
                            "& td:nth-of-type(5)": {
                              px: 0,
                              pl: 1,
                              pr: 0,
                            },
                            "& td:nth-of-type(6)": {
                              px: 0,
                              pl: 0,
                              pr: 1,
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              fontWeight: 400,
                              textAlign: "left",
                              width: "5%",
                              pl: 2,
                              pr: 0,
                            }}
                          >
                            {pageStart + index + 1}
                          </TableCell>
                          <TableCell
                            sx={{
                              textAlign: "left",
                              width: "10%",
                              pl: 0,
                              pr: 1,
                            }}
                          >
                            <Avatar
                              variant="rounded"
                              src={
                                product.image
                                  ? `https://api.bbpharmacy.site${product.image}`
                                  : null
                              }
                              alt={product.productName}
                              onClick={(e) => {
                                e.stopPropagation(); // tránh mở modal chi tiết sản phẩm
                                if (product.image) {
                                  setSelectedImage(
                                    `https://api.bbpharmacy.site${product.image}`
                                  );
                                  setOpenImageDialog(true);
                                }
                              }}
                              sx={{
                                backgroundColor: product.image
                                  ? "transparent"
                                  : "#1976d2",
                                fontSize: "1rem",
                                fontWeight: "bold",
                                cursor: product.image ? "pointer" : "default",
                              }}
                            >
                              {!product.image && product.productName
                                ? product.productName.charAt(0).toUpperCase()
                                : null}
                            </Avatar>
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 500,
                              textAlign: "left",
                              pl: 1,
                              width: "15%",
                            }}
                          >
                            {product.productName ||
                              product.ProductName ||
                              "Tên không xác định"}
                          </TableCell>
                          <TableCell
                            sx={{
                              textAlign: "left",
                              width: "15%",
                              pr: 1,
                              pl: 3,
                            }}
                          >
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
                              const fromMap = categoryId
                                ? categoryMap[categoryId]
                                : null;
                              return (
                                product.categoryName ||
                                fromMap ||
                                product.Category?.Name ||
                                product.category?.name ||
                                "Không có"
                              );
                            })()}
                          </TableCell>
                          <TableCell
                            sx={{
                              textAlign: "left",
                              width: "15%",
                              pr: 0,
                              pl: 1,
                            }}
                          >
                            {product.Unit ?? product.unit}
                          </TableCell>
                          <TableCell
                            sx={{
                              width: "10%",
                              textAlign: "left",
                              pl: 0,
                              pr: 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                              }}
                            >
                              <Chip
                                label={(() => {
                                  const status =
                                    product.status ?? product.Status;
                                  return status === true || status === "active"
                                    ? "Đang bán"
                                    : "Ngừng bán";
                                })()}
                                size="small"
                                sx={{
                                  backgroundColor: (() => {
                                    const status =
                                      product.status ?? product.Status;
                                    return status === true ||
                                      status === "active"
                                      ? "#d4edda"
                                      : "#f8d7da";
                                  })(),
                                  color: (() => {
                                    const status =
                                      product.status ?? product.Status;
                                    return status === true ||
                                      status === "active"
                                      ? "#155724"
                                      : "#721c24";
                                  })(),
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              textAlign: "right",
                              verticalAlign: "middle",
                              width: "25%",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1.2,
                                alignItems: "center",
                                justifyContent: "flex-end",
                                flexWrap: "nowrap",
                              }}
                            >
                              {userRole !== "sales_staff" && (
                                <>
                                  <Tooltip title="Sửa" placement="bottom" arrow>
                                    <IconButton
                                      size="medium"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditModal(product);
                                      }}
                                      sx={{
                                        color: "#ed6c02",
                                        width: "40px",
                                        height: "40px",
                                        "&:hover": {
                                          backgroundColor:
                                            "rgba(237, 108, 2, 0.1)",
                                        },
                                      }}
                                    >
                                      <EditIcon fontSize="medium" />
                                    </IconButton>
                                  </Tooltip>
                                  <Button
                                    variant="contained"
                                    color={(() => {
                                      const status =
                                        product.status ?? product.Status;
                                      return status === true ||
                                        status === "active"
                                        ? "error"
                                        : "success";
                                    })()}
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleChangeStatus(
                                        product,
                                        product.status ?? product.Status
                                          ? "active"
                                          : "inactive"
                                      );
                                    }}
                                    sx={{
                                      minWidth: 100,
                                      width: 100,
                                      whiteSpace: "nowrap",
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    {(() => {
                                      const status =
                                        product.status ?? product.Status;
                                      return status === true ||
                                        status === "active"
                                        ? "NGỪNG BÁN"
                                        : "KÍCH HOẠT";
                                    })()}
                                  </Button>
                                </>
                              )}
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
              </Table>
            </TableContainer>
          )}

          {/* Pagination - chỉ hiện khi > 1 trang, căn phải */}
          {!loading && filteredProducts.length > 0 && totalPages > 1 && (
            <Box
              sx={{ display: "flex", justifyContent: "flex-end", mt: 2, mb: 1 }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, v) => setPage(v)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={openImageDialog}
        onClose={() => setOpenImageDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ textAlign: "center", p: 2 }}>
          <img
            src={selectedImage}
            alt="Ảnh sản phẩm"
            style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 8 }}
          />
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => setOpenImageDialog(false)}
            >
              Đóng
            </Button>
          </Box>
        </Box>
      </Dialog>

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
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={
            snackbarMessage.includes("thành công") ? "success" : "error"
          }
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ListProduct;
