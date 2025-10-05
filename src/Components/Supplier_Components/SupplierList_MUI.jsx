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
} from "@mui/material";
import {
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  RestartAlt as RestartAltIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { green, red, orange } from "@mui/material/colors";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EditSuppliers from "./EditSuppliers";

const SupplierList = () => {
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

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:9999/suppliers/get-list-suppliers"
        );
        setSuppliers(response.data);
        setError(null);
      } catch (error) {
        setError("Không thể tải dữ liệu danh sách nhà cung cấp.");
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Cập nhật trạng thái nhà cung cấp
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:9999/suppliers/update-status/${id}`, {
        status: newStatus,
      });
      const newSupplier = suppliers.map((s) =>
        s._id === id ? { ...s, status: newStatus } : s
      );
      setSuppliers(newSupplier);
    } catch (error) {
      console.log("Lỗi khi cập nhật trạng thái:", error);
    }
  };

  const handleFilterChange = (e) => {
    setFilterStatus({ ...filterStatus, [e.target.name]: e.target.checked });
    setPage(0); // Reset về trang đầu khi filter
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  if (loading) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Đang tải dữ liệu...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ textAlign: "center" }}>
          {error}
        </Alert>
      </Container>
    );
  }

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
                        <SearchIcon color="action" />
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
                          color="primary"
                        />
                      }
                      label={<Typography variant="body2">{status}</Typography>}
                    />
                  ))}
                </FormGroup>

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
                    Tên nhà cung cấp
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
                {paginatedSuppliers.length > 0 ? (
                  paginatedSuppliers.map((supplier, index) => (
                    <TableRow
                      key={supplier._id}
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
                              : supplier.status === "inactive"
                              ? "Tạm ngưng"
                              : "Hiện đang dừng nguồn cung cấp từ doanh nghiệp này"}
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
                        <Typography variant="body2">
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
                          spacing={1}
                          justifyContent="center"
                        >
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

                          {supplier.status === "active" ? (
                            <Tooltip title="Ngừng cung cấp" arrow>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleUpdateStatus(supplier._id, "inactive")
                                }
                                sx={{
                                  color: red[600],
                                  "&:hover": {
                                    backgroundColor: red[50],
                                    transform: "scale(1.1)",
                                  },
                                  transition: "all 0.2s",
                                }}
                              >
                                <BlockIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Tái cung cấp" arrow>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleUpdateStatus(supplier._id, "active")
                                }
                                sx={{
                                  color: green[600],
                                  "&:hover": {
                                    backgroundColor: green[50],
                                    transform: "scale(1.1)",
                                  },
                                  transition: "all 0.2s",
                                }}
                              >
                                <RestartAltIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
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

export default SupplierList;
