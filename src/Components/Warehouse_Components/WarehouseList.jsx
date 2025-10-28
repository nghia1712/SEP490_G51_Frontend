import React, { useEffect, useState } from "react";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Typography,
  IconButton, Alert, FormGroup, FormControlLabel, Checkbox, Stack, Card, CardContent, InputAdornment, Tooltip, TablePagination,
  CircularProgress, Collapse, Menu, Container, TextField, MenuItem,
} from "@mui/material";
import {
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
  Add as AddIcon,
} from "@mui/icons-material";
import useWarehouse from "../../Hooks/useWarehouse";
import renderStatusChip from "../../Utils/renderStatusChip";
import palette from "../../constants/palette";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken";
import WarehouseDetails from "./WarehouseDetails";
import AddWarehouse from "./AddWarehouse";

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
  const [openWarehouseDetails, setOpenWarehouseDetails] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

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

  // Debug logging
  useEffect(() => {
    console.log("Warehouses in WarehouseList:", warehouses);
    console.log("Loading state:", loading);
    console.log("Error state:", error);
  }, [warehouses, loading, error]);

  const handleViewDetails = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setOpenWarehouseDetails(true);
  };

  const handleAddSuccess = () => {
    fetchWarehouses();
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
            warehouse.status === 1 ? "Hoạt động" : "Ngừng hoạt động"
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
        minHeight: "100vh",
        backgroundImage: "url('/images/backgroundMedical2.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(0, 150, 136, 0.4) 0%, rgba(0, 121, 107, 0.45) 25%, rgba(0, 96, 100, 0.5) 50%, rgba(0, 77, 64, 0.45) 75%, rgba(0, 60, 50, 0.4) 100%)",
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="xl" sx={{ mt: 0, mb: 4, position: "relative", zIndex: 1, pt: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2, backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
          <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <WarehouseIcon sx={{ fontSize: 40, color: "#1976d2", mr: 2 }} />
              <Typography
                variant="h4"
                component="h1"
                sx={{ color: "#1976d2", fontWeight: "bold", flexGrow: 1 }}
              >
                Quản lý kho
              </Typography>
              <Typography variant="h6" color="textSecondary">
                Tổng: {warehouses.length} kho
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
                  placeholder="Tìm kiếm theo tên kho..."
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
                  }}
                />

                {/* Bộ lọc trạng thái */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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

                {/* Nút thêm kho */}
                <Box sx={{ ml: "auto" }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenAddModal(true)}
                    sx={{
                      backgroundColor: "#1976d2",
                      "&:hover": { backgroundColor: "#1565c0" },
                      borderRadius: 2,
                      px: 3,
                    }}
                  >
                    Thêm kho
                  </Button>
                </Box>

              </Stack>
            </Paper>
          </Box>

          {/* Thông tin kết quả */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Hiển thị {filteredWarehouses.length} kết quả
              {search && ` cho "${search}"`}
            </Typography>
          </Box>

          {/* Bảng danh sách */}
          <TableContainer
            component={Paper}
            sx={{ maxHeight: 600, borderRadius: 2, boxShadow: 1 }}
          >
            <Table stickyHeader aria-label="warehouse table">
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
                    Tên kho
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                  >
                    Địa chỉ
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                  >
                    Số vị trí
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                  >
                    Trạng thái
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 6 }}>
                      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <CircularProgress size={24} sx={{ mr: 2 }} />
                        <Typography variant="body2" color="textSecondary">
                          Đang tải dữ liệu...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 6 }}>
                      <Alert severity="error" sx={{ maxWidth: 400, mx: "auto" }}>
                        {error}
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : paginatedWarehouses.length > 0 ? (
                  paginatedWarehouses.map((warehouse, index) => (
                    <TableRow
                      key={warehouse.id}
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
                          {warehouse.warehouseLocationLists?.length || 0} vị trí
                        </Typography>
                      </TableCell>
                      <TableCell>{renderStatusChip(warehouse.status === 1 ? "active" : "inactive")}</TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="center"
                        >
                          <Tooltip title="Xem chi tiết" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(warehouse)}
                              sx={{
                                color: "#1976d2",
                                "&:hover": {
                                  backgroundColor: "#e3f2fd",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s",
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Thêm tùy chọn" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, warehouse)}
                              sx={{
                                color: "#1976d2",
                                "&:hover": {
                                  backgroundColor: "#e3f2fd",
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
            <Box sx={{ mt: 2 }}>
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
                  borderTop: "1px solid #e0e0e0",
                  pt: 1,
                }}
              />
            </Box>
          )}
          </CardContent>
        </Card>
      </Container>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200 },
        }}
      >
        <MenuItem
          onClick={() => handleViewDetails(menuWarehouse)}
          sx={{
            "&:hover": { backgroundColor: "#e3f2fd" },
            color: "#1976d2",
          }}
        >
          <VisibilityIcon sx={{ mr: 1, fontSize: 20 }} />
          Xem chi tiết
        </MenuItem>
      </Menu>

      {/* Components */}
      <AddWarehouse
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      <WarehouseDetails
        open={openWarehouseDetails}
        onClose={() => setOpenWarehouseDetails(false)}
        warehouse={selectedWarehouse}
      />
    </Box>
  );
};

export default WarehouseList;
