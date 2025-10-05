import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Typography,
  Chip,
  IconButton,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  Container,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  TablePagination,
  CircularProgress,
  Backdrop,
  TableSortLabel,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Fab,
  Zoom,
  Skeleton,
  Collapse,
  Grid,
} from "@mui/material";
import {
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  RestartAlt as RestartAltIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Inventory as InventoryIcon,
} from "@mui/icons-material";
import { green, red, orange, blue } from "@mui/material/colors";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EditSuppliers from "./EditSuppliers";

// Import API modules for consistency
import supplierAPI from "../../API/supplierAPI";
import supplierProductAPI from "../../API/supplierProductAPI";

const SupplierListAdvanced = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState({
    "Còn cung cấp": false,
    "Ngừng cung cấp": false,
  });
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // States for product expansion
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      console.log("=== SupplierListAdvanced fetchSuppliers ===");

      const response = await supplierAPI.getAll();
      console.log("Suppliers API response:", response);
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      // Handle new standardized response structure with cache-busting
      let suppliersData = [];
      if (response.data?.success && response.data?.data) {
        // New format: { success: true, data: [...], total: x, timestamp: y }
        suppliersData = response.data.data;
        console.log(
          "Using new format - found",
          suppliersData.length,
          "suppliers"
        );
      } else if (Array.isArray(response.data)) {
        // Legacy format: directly array
        suppliersData = response.data;
        console.log(
          "Using legacy format - found",
          suppliersData.length,
          "suppliers"
        );
      } else {
        console.warn("Unexpected response format:", response.data);
        suppliersData = [];
      }

      setSuppliers(suppliersData);
      setError(null);

      console.log("Suppliers set to:", suppliersData);
      console.log("=== End fetchSuppliers ===");
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError(
        "Không thể tải dữ liệu danh sách nhà cung cấp: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật trạng thái nhà cung cấp
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:9999/suppliers/update-status/${id}`, {
        status: newStatus,
      });
      const updatedSuppliers = suppliers.map((s) =>
        s._id === id ? { ...s, status: newStatus } : s
      );
      setSuppliers(updatedSuppliers);
      setAnchorEl(null);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
    }
  };

  const handleFilterChange = (e) => {
    setFilterStatus({ ...filterStatus, [e.target.name]: e.target.checked });
    setPage(0); // Reset về trang đầu khi filter
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilterStatus({ "Còn cung cấp": false, "Ngừng cung cấp": false });
    setSearch("");
    setPage(0);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, supplier) => {
    setAnchorEl(event.currentTarget);
    setSelectedSupplier(supplier);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSupplier(null);
  };

  // Sorting function
  const descendingComparator = (a, b, orderBy) => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  const getComparator = (order, orderBy) => {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  // Lọc và sắp xếp danh sách nhà cung cấp
  const filteredSuppliers = suppliers
    .filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(search.toLowerCase()) &&
        (Object.values(filterStatus).some((value) => value)
          ? filterStatus[
              supplier.status === "active" ? "Còn cung cấp" : "Ngừng cung cấp"
            ]
          : true)
    )
    .sort(getComparator(order, orderBy));

  // Pagination
  const paginatedSuppliers = filteredSuppliers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusChip = (status) => {
    if (status === "active") {
      return (
        <Chip
          label="Còn cung cấp"
          color="success"
          size="small"
          icon={<CheckCircleIcon />}
          sx={{ fontWeight: "medium" }}
        />
      );
    } else {
      return (
        <Chip
          label="Ngừng cung cấp"
          color="error"
          size="small"
          icon={<BlockIcon />}
          sx={{ fontWeight: "medium" }}
        />
      );
    }
  };

  const formatPhoneNumber = (contact) => {
    if (!contact) return "N/A";
    return ("0" + String(contact).replace(/\D/g, "")).replace(/^00/, "0");
  };

  const activeFiltersCount =
    Object.values(filterStatus).filter(Boolean).length + (search ? 1 : 0);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Card elevation={3}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Skeleton variant="text" width={300} height={40} />
            </Box>
            <Skeleton variant="rectangular" height={400} />
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          sx={{ textAlign: "center" }}
          action={
            <Button color="inherit" size="small" onClick={fetchSuppliers}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  const fetchSupplierProducts = async (supplierId) => {
    try {
      setLoadingProducts(true);
      console.log("=== SupplierListAdvanced fetchSupplierProducts ===");
      console.log("Fetching products for supplier:", supplierId);

      const response = await supplierProductAPI.getProductsBySupplier(
        supplierId
      );

      console.log("API Response:", response);
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      // Handle new standardized response structure with cache-busting
      let products = [];
      if (response.data?.success && response.data?.data) {
        // New format: { success: true, data: [...], total: x, timestamp: y }
        products = response.data.data;
        console.log("Using new format - found", products.length, "products");
        console.log("Total products:", response.data.total);
        console.log("Response timestamp:", response.data.timestamp);
      } else if (Array.isArray(response.data)) {
        // Legacy format: directly array
        products = response.data;
        console.log("Using legacy format - found", products.length, "products");
      } else {
        console.warn("Unexpected response format:", response.data);
        products = [];
      }

      setSupplierProducts(products);

      if (products.length === 0) {
        console.log("No products found for supplier:", supplierId);
      }

      console.log("=== End fetchSupplierProducts ===");
    } catch (error) {
      console.error("=== SupplierListAdvanced fetchSupplierProducts Error ===");
      console.error("Error fetching supplier products:", error);
      console.error("Error details:", error.response?.data);
      console.error("=== End Error ===");
      setSupplierProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleExpandRow = (supplierId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(supplierId)) {
      newExpanded.delete(supplierId);
    } else {
      newExpanded.add(supplierId);
      // Fetch products for this supplier
      fetchSupplierProducts(supplierId);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <BusinessIcon sx={{ fontSize: 40, color: "#1976d2", mr: 2 }} />
              <Typography
                variant="h4"
                component="h1"
                sx={{ color: "#1976d2", fontWeight: "bold", flexGrow: 1 }}
              >
                Quản lý nhà cung cấp
              </Typography>
              <Typography variant="h6" color="textSecondary">
                Tổng: {suppliers.length} nhà cung cấp
              </Typography>
            </Box>

            {/* Toolbar với tìm kiếm và bộ lọc */}
            <Paper
              elevation={1}
              sx={{ p: 3, backgroundColor: "#f8fafc", borderRadius: 2 }}
            >
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={2}
                alignItems="center"
              >
                {/* Tìm kiếm */}
                <TextField
                  placeholder="Tìm kiếm theo tên nhà cung cấp..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                  sx={{ minWidth: 300 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: search && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={handleClearSearch}>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Bộ lọc trạng thái */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Badge badgeContent={activeFiltersCount} color="primary">
                    <FilterListIcon color="action" />
                  </Badge>
                  <FormGroup row>
                    {["Còn cung cấp", "Ngừng cung cấp"].map((status) => (
                      <FormControlLabel
                        key={status}
                        control={
                          <Checkbox
                            name={status}
                            checked={filterStatus[status]}
                            onChange={handleFilterChange}
                            size="small"
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2">{status}</Typography>
                        }
                      />
                    ))}
                  </FormGroup>
                </Box>

                {/* Nút làm mới và xóa bộ lọc */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Làm mới dữ liệu">
                    <IconButton onClick={fetchSuppliers} color="primary">
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  {activeFiltersCount > 0 && (
                    <Tooltip title="Xóa tất cả bộ lọc">
                      <IconButton
                        onClick={handleClearFilters}
                        color="secondary"
                      >
                        <ClearIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {/* Nút thêm nhà cung cấp */}
                <Box sx={{ ml: "auto" }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/manager/add-suppliers")}
                    sx={{
                      backgroundColor: "#1976d2",
                      "&:hover": { backgroundColor: "#1565c0" },
                      borderRadius: 2,
                      px: 3,
                    }}
                  >
                    Thêm nhà cung cấp
                  </Button>
                </Box>
              </Stack>
            </Paper>
          </Box>

          {/* Thông tin kết quả */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Hiển thị {filteredSuppliers.length} kết quả
              {search && ` cho "${search}"`}
              {activeFiltersCount > 0 && ` với ${activeFiltersCount} bộ lọc`}
            </Typography>
          </Box>

          {/* Bảng danh sách */}
          <TableContainer
            component={Paper}
            sx={{ maxHeight: 600, borderRadius: 2, boxShadow: 1 }}
          >
            <Table stickyHeader aria-label="supplier table">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                  >
                    #
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                  >
                    <TableSortLabel
                      active={orderBy === "name"}
                      direction={orderBy === "name" ? order : "asc"}
                      onClick={() => handleRequestSort("name")}
                    >
                      Tên nhà cung cấp
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                  >
                    Địa chỉ
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                  >
                    Liên hệ
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                  >
                    Email
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                  >
                    Mô tả
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                  >
                    <TableSortLabel
                      active={orderBy === "status"}
                      direction={orderBy === "status" ? order : "asc"}
                      onClick={() => handleRequestSort("status")}
                    >
                      Trạng thái
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: "#e3f2fd",
                      textAlign: "center",
                    }}
                  >
                    Hành động
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSuppliers.length > 0 ? (
                  paginatedSuppliers.map((supplier, index) => (
                    <React.Fragment key={supplier._id}>
                      <TableRow
                        hover
                        sx={{
                          "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                          "&:hover": { backgroundColor: "#f0f7ff" },
                          transition: "background-color 0.2s",
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {page * rowsPerPage + index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: "medium", mb: 0.5 }}
                            >
                              {supplier.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color:
                                  supplier.status === "active"
                                    ? green[700]
                                    : red[700],
                                backgroundColor:
                                  supplier.status === "active"
                                    ? green[50]
                                    : red[50],
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: "0.75rem",
                                fontWeight: "medium",
                              }}
                            >
                              {supplier.status === "active"
                                ? "Đang hoạt động"
                                : "Tạm ngưng"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ maxWidth: 200 }}
                            noWrap
                          >
                            {supplier.address || "Chưa cập nhật"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {formatPhoneNumber(supplier.contact)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ maxWidth: 180 }}
                            noWrap
                          >
                            {supplier.email || "Chưa cập nhật"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 150 }}
                          >
                            {supplier.description || "Không có mô tả"}
                          </Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(supplier.status)}</TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="center"
                          >
                            <Tooltip title="Xem sản phẩm" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleExpandRow(supplier._id)}
                                sx={{
                                  color: expandedRows.has(supplier._id)
                                    ? green[600]
                                    : blue[600],
                                  "&:hover": {
                                    backgroundColor: blue[50],
                                    transform: "scale(1.1)",
                                  },
                                  transition: "all 0.2s",
                                }}
                              >
                                {expandedRows.has(supplier._id) ? (
                                  <ExpandLessIcon fontSize="small" />
                                ) : (
                                  <InventoryIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Chỉnh sửa" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => setEditingSupplier(supplier)}
                                  disabled={supplier.status === "inactive"}
                                  sx={{
                                    color: orange[600],
                                    "&:hover": {
                                      backgroundColor: orange[50],
                                      transform: "scale(1.1)",
                                    },
                                    transition: "all 0.2s",
                                    opacity:
                                      supplier.status === "inactive" ? 0.5 : 1,
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Thêm tùy chọn" arrow>
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, supplier)}
                                sx={{
                                  color: blue[600],
                                  "&:hover": {
                                    backgroundColor: blue[50],
                                    transform: "scale(1.1)",
                                  },
                                  transition: "all 0.2s",
                                }}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>

                      {/* Expanded row for products */}
                      <TableRow>
                        <TableCell colSpan={8} sx={{ p: 0, border: "none" }}>
                          <Collapse in={expandedRows.has(supplier._id)}>
                            <Box
                              sx={{
                                p: 2,
                                backgroundColor: "#e3f2fd20",
                              }}
                            >
                              <Typography
                                variant="h6"
                                sx={{ mb: 2, color: blue[700] }}
                              >
                                <InventoryIcon
                                  sx={{ mr: 1, verticalAlign: "middle" }}
                                />
                                Sản phẩm của nhà cung cấp
                                <Typography
                                  component="span"
                                  variant="body2"
                                  sx={{ ml: 1, color: "text.secondary" }}
                                >
                                  (ID: {supplier._id})
                                </Typography>
                              </Typography>
                              {loadingProducts ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    p: 2,
                                  }}
                                >
                                  <CircularProgress
                                    size={24}
                                    sx={{ color: blue[600] }}
                                  />
                                </Box>
                              ) : supplierProducts.length > 0 ? (
                                <>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 2 }}
                                  >
                                    Debug: Tìm thấy {supplierProducts.length}{" "}
                                    sản phẩm
                                  </Typography>
                                  <Grid container spacing={2}>
                                    {supplierProducts
                                      .slice(0, 6)
                                      .map((product) => (
                                        <Grid
                                          item
                                          xs={12}
                                          sm={6}
                                          md={4}
                                          key={product.supplierProductId}
                                        >
                                          <Card
                                            variant="outlined"
                                            sx={{
                                              p: 2,
                                              height: "100%",
                                              "&:hover": {
                                                boxShadow: 2,
                                                transform: "translateY(-2px)",
                                              },
                                              transition: "all 0.2s",
                                            }}
                                          >
                                            <Typography
                                              variant="subtitle2"
                                              sx={{
                                                fontWeight: "bold",
                                                color: blue[700],
                                              }}
                                            >
                                              {product.productName}
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                              sx={{ mb: 1 }}
                                            >
                                              {product.categoryName}
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                color: green[600],
                                                fontWeight: "medium",
                                              }}
                                            >
                                              Giá:{" "}
                                              {new Intl.NumberFormat(
                                                "vi-VN"
                                              ).format(product.price)}{" "}
                                              VNĐ
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                            >
                                              Tồn kho: {product.stock}
                                            </Typography>
                                          </Card>
                                        </Grid>
                                      ))}
                                  </Grid>
                                </>
                              ) : (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ textAlign: "center", py: 2 }}
                                >
                                  Chưa có sản phẩm nào
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: "center", py: 6 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <BusinessIcon
                          sx={{ fontSize: 48, color: "grey.300" }}
                        />
                        <Typography variant="h6" color="textSecondary">
                          Không tìm thấy nhà cung cấp nào
                        </Typography>
                        {(search || activeFiltersCount > 0) && (
                          <Button
                            variant="outlined"
                            onClick={handleClearFilters}
                            size="small"
                          >
                            Xóa bộ lọc
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredSuppliers.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredSuppliers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Số hàng mỗi trang:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} trong tổng số ${
                    count !== -1 ? count : `hơn ${to}`
                  }`
                }
                sx={{
                  borderTop: "1px solid #e0e0e0",
                  pt: 1,
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Menu hành động */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200 },
        }}
      >
        {selectedSupplier?.status === "active" ? (
          <MenuItem
            onClick={() => handleUpdateStatus(selectedSupplier._id, "inactive")}
            sx={{ color: red[600] }}
          >
            <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
            Ngừng cung cấp
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => handleUpdateStatus(selectedSupplier._id, "active")}
            sx={{ color: green[600] }}
          >
            <RestartAltIcon sx={{ mr: 1, fontSize: 20 }} />
            Tái cung cấp
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          onClick={() =>
            navigate(`/manager/supplier-products/${selectedSupplier?._id}`)
          }
        >
          <BusinessIcon sx={{ mr: 1, fontSize: 20 }} />
          Quản lý sản phẩm
        </MenuItem>
      </Menu>

      {/* Floating Action Button */}
      <Zoom in={true}>
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          onClick={() => navigate("/manager/add-suppliers")}
        >
          <AddIcon />
        </Fab>
      </Zoom>

      {/* Modal chỉnh sửa */}
      <EditSuppliers
        user={editingSupplier}
        closeModal={() => setEditingSupplier(null)}
        users={suppliers}
        setUsers={setSuppliers}
      />
    </Container>
  );
};

export default SupplierListAdvanced;
