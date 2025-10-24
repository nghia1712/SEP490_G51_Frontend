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
  Warehouse as WarehouseIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Inventory as InventoryIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import useWarehouse from "../../Hooks/useWarehouse";
import renderStatusChip from "../../Utils/renderStatusChip";
import palette from "../../constants/palette";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken";

const WarehouseList = () => {
  const {
    warehouses,
    loading,
    error,
    fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    getWarehouseDetails
  } = useWarehouse();
  
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState({
    "Hoạt động": false,
    "Ngừng hoạt động": false,
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    status: "active",
  });
  const [formErrors, setFormErrors] = useState({});

  // Warehouse details states
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [openWarehouseDetails, setOpenWarehouseDetails] = useState(false);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Menu anchor
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuWarehouse, setMenuWarehouse] = useState(null);

  // Kiểm tra quyền truy cập
  const userRole = getUserRoleFromToken();
  const hasAccess = userRole === 'warehouse_staff' || userRole === 'admin' || userRole === 'manager';

  useEffect(() => {
    if (hasAccess) {
      fetchWarehouses();
    }
  }, [hasAccess, fetchWarehouses]);

  // Form validation
  const validateForm = (data) => {
    const errors = {};

    if (!data.name.trim()) errors.name = "Tên kho là bắt buộc";
    if (!data.address.trim()) errors.address = "Địa chỉ là bắt buộc";

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (isEdit = false) => {
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    
    try {
      if (isEdit) {
        await updateWarehouse({ ...formData, id: editingWarehouse.id });
        setOpenEditModal(false);
      } else {
        await createWarehouse(formData);
        setOpenAddModal(false);
      }
      // Reset form
      setFormData({
        name: "",
        address: "",
        description: "",
        status: "active",
      });
      setFormErrors({});
    } catch (error) {
      console.error("Lỗi khi lưu warehouse:", error);
    }
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name || "",
      address: warehouse.address || "",
      description: warehouse.description || "",
      status: warehouse.status || "active",
    });
    setFormErrors({});
    setOpenEditModal(true);
  };

  const handleViewDetails = async (warehouse) => {
    try {
      const details = await getWarehouseDetails(warehouse.id);
      setSelectedWarehouse({ ...warehouse, ...details });
      setOpenWarehouseDetails(true);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết warehouse:", error);
    }
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

  const handleMenuOpen = (event, warehouse) => {
    setAnchorEl(event.currentTarget);
    setMenuWarehouse(warehouse);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuWarehouse(null);
  };

  // Lọc danh sách warehouse
  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.name.toLowerCase().includes(search.toLowerCase()) &&
      (Object.values(filterStatus).some((value) => value)
        ? filterStatus[
            warehouse.status === "active" ? "Hoạt động" : "Ngừng hoạt động"
          ]
        : true)
  );

  // Pagination
  const paginatedWarehouses = filteredWarehouses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Kiểm tra quyền truy cập
  if (!hasAccess) {
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
          <WarehouseIcon sx={{ fontSize: 80, color: "grey.400", mb: 2 }} />
          <Typography variant="h4" sx={{ color: "grey.600", mb: 1 }}>
            Không có quyền truy cập
          </Typography>
          <Typography variant="body1" sx={{ color: "grey.500" }}>
            Chỉ nhân viên kho mới có thể xem trang này
          </Typography>
        </Box>
      </Box>
    );
  }

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
            <WarehouseIcon sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: "bold" }}
              >
                Quản lý kho
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                Tổng: {warehouses.length} kho
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
              Thêm kho
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
              placeholder="Tìm kiếm kho..."
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
              {["Hoạt động", "Ngừng hoạt động"].map((status) => (
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
                Hiển thị {filteredWarehouses.length} kết quả
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
            <Table stickyHeader aria-label="warehouse table">
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
                    Tên kho
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
                    Mô tả
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
                {paginatedWarehouses.length > 0 ? (
                  paginatedWarehouses.map((warehouse, index) => (
                    <TableRow
                      key={warehouse.id}
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
                              {warehouse.name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 200 }}
                        >
                          {warehouse.address || "Chưa cập nhật"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 200 }}
                        >
                          {warehouse.description || "Không có mô tả"}
                        </Typography>
                      </TableCell>
                      <TableCell>{renderStatusChip(warehouse.status)}</TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                        >
                          <Tooltip title="Xem chi tiết" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(warehouse)}
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
                                onClick={() => handleEdit(warehouse)}
                                disabled={warehouse.status === "inactive"}
                                sx={{
                                  color: palette.medium,
                                  "&:hover": {
                                    backgroundColor: palette.light + "40",
                                    transform: "scale(1.1)",
                                  },
                                  opacity:
                                    warehouse.status === "inactive" ? 0.5 : 1,
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Thêm tùy chọn" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, warehouse)}
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 6 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <WarehouseIcon
                          sx={{ fontSize: 48, color: "grey.300" }}
                        />
                        <Typography variant="h6" color="textSecondary">
                          Không tìm thấy kho nào
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredWarehouses.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredWarehouses.length}
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
          onClick={() => handleViewDetails(menuWarehouse)}
          sx={{
            "&:hover": { backgroundColor: palette.light + "40" },
            color: palette.dark,
          }}
        >
          <VisibilityIcon sx={{ mr: 1, fontSize: 20 }} />
          Xem chi tiết
        </MenuItem>
      </Menu>

      {/* TODO: Thêm các modal cho Add/Edit warehouse và Warehouse Details */}
    </Box>
  );
};

export default WarehouseList;
