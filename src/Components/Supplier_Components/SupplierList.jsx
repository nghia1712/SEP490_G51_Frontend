import React, { useEffect, useState } from "react";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, Typography,
  IconButton, Alert, FormGroup, FormControlLabel, Checkbox, Stack, Card, InputAdornment, Tooltip, TablePagination,
  CircularProgress, Grid, MenuItem, Collapse, Menu,
} from "@mui/material";
import {
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  RestartAlt as RestartAltIcon,
  Business as BusinessIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Inventory as InventoryIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import useSupplier from "../../Hooks/useSupplier";
import renderStatusChip from "../../utils/renderStatusChip";
import palette from "../../constants/palette";

// Import API modules for consistency
import supplierProductAPI from "../../API/supplierProductAPI";
import AddSupplierModal from "./AddSupplierModal";
import EditSupplierModal from "./EditSupplierModal";
import SupplierDetailsModal from "./SupplierDetailsModal";
import ExpandSupplierProduct from "./ExpandSupplierProduct";

const SupplierList = () => {
  const {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    updateSupplierStatus
  } = useSupplier();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState({
    "Còn cung cấp": false,
    "Ngừng cung cấp": false,
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact: "",
    email: "",
    description: "",
    status: "active",
  });
  const [formErrors, setFormErrors] = useState({});

  // Supplier details states
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [openSupplierDetails, setOpenSupplierDetails] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Menu anchor
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuSupplier, setMenuSupplier] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSupplierProducts = async (supplierId) => {
    try {
      setLoadingProducts(true);

      const response = await supplierProductAPI.getProductsBySupplier(
        supplierId
      );

      // Handle standardized response structure
      const products = response.data?.data || [];
      setSupplierProducts(products);

      if (products.length === 0) {
        console.log("No products found for supplier:", supplierId);
      }

    } catch (error) {
      console.error("Error fetching supplier products:", error);
      setSupplierProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Cập nhật trạng thái nhà cung cấp
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateSupplierStatus(id, newStatus);
      handleMenuClose();
    } catch (error) {
      console.log("Lỗi khi cập nhật trạng thái:", error);
    }
  };

  // Form validation
  const validateForm = (data) => {
    const errors = {};

    if (!data.name.trim()) errors.name = "Tên nhà cung cấp là bắt buộc";
    if (!data.address.trim()) errors.address = "Địa chỉ là bắt buộc";
    if (!data.contact.trim()) {
      errors.contact = "Số điện thoại là bắt buộc";
    } else if (!/^\d{10,15}$/.test(data.contact)) {
      errors.contact = "Số điện thoại phải có 10-15 chữ số";
    }
    if (!data.email.trim()) {
      errors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Email không hợp lệ";
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (isEdit = false) => {
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      if (isEdit) {
        await updateSupplier(editingSupplier._id, formData);
        setOpenEditModal(false);
      } else {
        await createSupplier(formData);
        setOpenAddModal(false);
      }
      // Reset form
      setFormData({
        name: "",
        address: "",
        contact: "",
        email: "",
        description: "",
        status: "active",
      });
      setFormErrors({});
    } catch (error) {
      console.error("Lỗi khi lưu nhà cung cấp:", error);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      address: supplier.address || "",
      contact: supplier.contact || "",
      email: supplier.email || "",
      description: supplier.description || "",
      status: supplier.status || "active",
    });
    setFormErrors({});
    setOpenEditModal(true);
  };

  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setOpenSupplierDetails(true);
    setTabValue(0);
    fetchSupplierProducts(supplier._id);
  };

  const handleFilterChange = (e) => {
    setFilterStatus({ ...filterStatus, [e.target.name]: e.target.checked });
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  const handleMenuOpen = (event, supplier) => {
    setAnchorEl(event.currentTarget);
    setMenuSupplier(supplier);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuSupplier(null);
  };

  // Lọc danh sách nhà cung cấp
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(search.toLowerCase()) &&
      (Object.values(filterStatus).some((value) => value)
        ? filterStatus[
            supplier.status === "active" ? "Còn cung cấp" : "Ngừng cung cấp"
          ]
        : true)
  );

  // Pagination
  const paginatedSuppliers = filteredSuppliers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const formatPhoneNumber = (contact) => {
    if (!contact) return "N/A";
    return ("0" + String(contact).replace(/\D/g, "")).replace(/^00/, "0");
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={60} sx={{ color: palette.dark }} />
          <Typography variant="h6" sx={{ mt: 2, color: palette.dark }}>
            Đang tải dữ liệu...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: "100vh", p: 3, backgroundColor: "#f5f5f5" }}>
        <Alert severity="error" sx={{ textAlign: "center" }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          backgroundColor: palette.dark,
          color: palette.white,
          borderRadius: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <BusinessIcon sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: "bold" }}
              >
                Quản lý nhà cung cấp
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                Tổng: {suppliers.length} nhà cung cấp
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddModal(true)}
              sx={{
                backgroundColor: palette.medium,
                color: palette.dark,
                "&:hover": {
                  backgroundColor: palette.light,
                  transform: "scale(1.05)",
                },
                borderRadius: 2,
                px: 3,
                py: 1,
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              Thêm nhà cung cấp
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Toolbar */}
        <Paper
          elevation={1}
          sx={{ p: 2, mb: 2, backgroundColor: palette.white }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="center"
          >
            {/* Tìm kiếm */}
            <TextField
              placeholder="Tìm kiếm nhà cung cấp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: palette.dark }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Bộ lọc trạng thái */}
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
                      sx={{ color: palette.dark }}
                    />
                  }
                  label={<Typography variant="body2">{status}</Typography>}
                />
              ))}
            </FormGroup>

            {/* Thông tin kết quả */}
            <Box sx={{ ml: "auto" }}>
              <Typography variant="body2" sx={{ color: palette.dark }}>
                Hiển thị {filteredSuppliers.length} kết quả
                {search && ` cho "${search}"`}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Bảng danh sách */}
        <Paper
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader aria-label="supplier table">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: palette.light,
                      color: palette.dark,
                    }}
                  >
                    #
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: palette.light,
                      color: palette.dark,
                    }}
                  >
                    Tên nhà cung cấp
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: palette.light,
                      color: palette.dark,
                    }}
                  >
                    Liên hệ
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: palette.light,
                      color: palette.dark,
                    }}
                  >
                    Email
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: palette.light,
                      color: palette.dark,
                    }}
                  >
                    Địa chỉ
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: palette.light,
                      color: palette.dark,
                    }}
                  >
                    Trạng thái
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: palette.light,
                      color: palette.dark,
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
                          "&:hover": { backgroundColor: palette.light + "20" },
                          transition: "background-color 0.2s",
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {page * rowsPerPage + index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: "medium",
                                  color: palette.dark,
                                }}
                              >
                                {supplier.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {supplier.description || "Không có mô tả"}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleExpandRow(supplier._id)}
                              sx={{ ml: 1, color: palette.dark }}
                            >
                              {expandedRows.has(supplier._id) ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatPhoneNumber(supplier.contact)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 180 }}
                          >
                            {supplier.email || "Chưa cập nhật"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 200 }}
                          >
                            {supplier.address || "Chưa cập nhật"}
                          </Typography>
                        </TableCell>
                        <TableCell>{renderStatusChip(supplier.status)}</TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                          >
                            <Tooltip title="Xem chi tiết" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(supplier)}
                                sx={{
                                  color: palette.dark,
                                  "&:hover": {
                                    backgroundColor: palette.light + "40",
                                    transform: "scale(1.1)",
                                  },
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Chỉnh sửa" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(supplier)}
                                  disabled={supplier.status === "inactive"}
                                  sx={{
                                    color: palette.medium,
                                    "&:hover": {
                                      backgroundColor: palette.light + "40",
                                      transform: "scale(1.1)",
                                    },
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
                                  color: palette.dark,
                                  "&:hover": {
                                    backgroundColor: palette.light + "40",
                                    transform: "scale(1.1)",
                                  },
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
                        <TableCell colSpan={7} sx={{ p: 0, border: "none" }}>
                          <ExpandSupplierProduct
                            open={expandedRows.has(supplier._id)}
                            supplier={supplier}
                            supplierProducts={supplierProducts}
                            loadingProducts={loadingProducts}
                            palette={palette}
                          />
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: "center", py: 6 }}>
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
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredSuppliers.length > 0 && (
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
                borderTop: `1px solid ${palette.light}`,
                backgroundColor: palette.white,
              }}
            />
          )}
        </Paper>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuItem
          onClick={() => handleViewDetails(menuSupplier)}
          sx={{
            "&:hover": { backgroundColor: palette.light + "40" },
            color: palette.dark,
          }}
        >
          <VisibilityIcon sx={{ mr: 1, fontSize: 20 }} />
          Xem chi tiết
        </MenuItem>
        {menuSupplier?.status === "active" ? (
          <MenuItem
            onClick={() => handleUpdateStatus(menuSupplier._id, "inactive")}
            sx={{
              "&:hover": { backgroundColor: "#ffebee" },
              color: "#d32f2f",
            }}
          >
            <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
            Ngừng cung cấp
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => handleUpdateStatus(menuSupplier._id, "active")}
            sx={{
              "&:hover": { backgroundColor: palette.light + "40" },
              color: palette.medium,
            }}
          >
            <RestartAltIcon sx={{ mr: 1, fontSize: 20 }} />
            Kích hoạt lại
          </MenuItem>
        )}
      </Menu>

      {/* Add Supplier Modal */}
      <AddSupplierModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        onSubmit={() => handleSubmit(false)}
        palette={palette}
      />

      {/* Edit Supplier Modal */}
      <EditSupplierModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        onSubmit={() => handleSubmit(true)}
        palette={palette}
      />

      {/* Supplier Details Modal */}
      <SupplierDetailsModal
        open={openSupplierDetails}
        onClose={() => setOpenSupplierDetails(false)}
        selectedSupplier={selectedSupplier}
        supplierProducts={supplierProducts}
        tabValue={tabValue}
        setTabValue={setTabValue}
        loadingProducts={loadingProducts}
        palette={palette}
        getStatusChip={renderStatusChip}
        formatPhoneNumber={formatPhoneNumber}
      />
    </Box>
  );
};

export default SupplierList;
