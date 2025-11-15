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
  Button,
  Typography,
  IconButton,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  TextField,
  CircularProgress,
  Container,
  Pagination,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Warehouse as WarehouseIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import renderStatusChip from "../../Utils/renderStatusChip";
import AddWarehouse from "./AddWarehouse";
import EditWarehouse from "./EditWarehouse";
import useWarehouse from "../../Hooks/useWarehouse";

export default function WarehouseList() {
  const navigate = useNavigate();
  const { warehouses: rawWarehouses, loading, error, fetchWarehouses } =
    useWarehouse();

  // map status từ 0/1 sang "active"/"inactive"
  const warehouses = rawWarehouses.map((w) => ({
    ...w,
    status:
      w.status === 1 ||
      w.status === "1" ||
      w.status === true ||
      w.status === "active"
        ? "active"
        : "inactive",
  }));

  const [openAddWarehouse, setOpenAddWarehouse] = useState(false);
  const handleOpenAddWarehouse = () => setOpenAddWarehouse(true);
  const handleCloseAddWarehouse = () => setOpenAddWarehouse(false);

  const [openEditWarehouse, setOpenEditWarehouse] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const handleOpenEditWarehouse = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setOpenEditWarehouse(true);
  };
  const handleCloseEditWarehouse = () => {
    setSelectedWarehouse(null);
    setOpenEditWarehouse(false);
  };

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState({
    "Hoạt động": false,
    "Ngừng hoạt động": false,
  });

  // ===== Pagination =====
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleNavigateDetail = (id) => {
    navigate(`/warehouse/details/${id}`);
  };

  const handleFilterChange = (e) => {
    setFilterStatus({ ...filterStatus, [e.target.name]: e.target.checked });
    setPage(1);
  };

  // ===== FILTER + SEARCH =====
  const filteredWarehouses = warehouses.filter((w) => {
    const statusLabel = w.status === "active" ? "Hoạt động" : "Ngừng hoạt động";
    return (
      w.name?.toLowerCase().includes(search.toLowerCase()) &&
      (Object.values(filterStatus).some((value) => value)
        ? filterStatus[statusLabel]
        : true)
    );
  });

  // ===== Paginated Data =====
  const totalPages = Math.ceil(filteredWarehouses.length / pageSize);
  const paginated = filteredWarehouses.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Reset page khi search hoặc filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus]);

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
          background:
            "linear-gradient(135deg, rgba(0,150,136,0.4), rgba(0,77,64,0.45))",
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, pt: 4 }}>
        <Card
          elevation={3}
          sx={{ borderRadius: 2, backgroundColor: "rgba(255,255,255,0.95)" }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* HEADER */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <WarehouseIcon sx={{ fontSize: 40, color: "#1976d2", mr: 2 }} />
                <Typography
                  variant="h4"
                  sx={{ color: "#1976d2", fontWeight: "bold", flexGrow: 1 }}
                >
                  Quản lý kho
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  Tổng: {warehouses.length} kho
                </Typography>
              </Box>

              {/* TOOLBAR */}
              <Paper sx={{ p: 3, backgroundColor: "#f8fafc", borderRadius: 2 }}>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
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
                        label={<Typography variant="body2">{status}</Typography>}
                      />
                    ))}
                  </FormGroup>

                  <Box sx={{ ml: "auto" }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{
                        backgroundColor: "#1976d2",
                        "&:hover": { backgroundColor: "#1565c0" },
                        borderRadius: 2,
                        px: 3,
                      }}
                      onClick={handleOpenAddWarehouse}
                    >
                      Thêm kho
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Box>

            {/* MODALS */}
            <AddWarehouse
              open={openAddWarehouse}
              onClose={handleCloseAddWarehouse}
              onSuccess={fetchWarehouses}
            />
            {selectedWarehouse && (
              <EditWarehouse
                open={openEditWarehouse}
                warehouse={selectedWarehouse}
                onClose={handleCloseEditWarehouse}
                onSuccess={fetchWarehouses}
              />
            )}

            {/* TABLE */}
            <TableContainer
              component={Paper}
              sx={{ maxHeight: 600, borderRadius: 2, boxShadow: 1 }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Tên kho</TableCell>
                    <TableCell>Địa chỉ</TableCell>
                    <TableCell align="center">Trạng thái</TableCell>
                    <TableCell align="center">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Alert severity="error">{error}</Alert>
                      </TableCell>
                    </TableRow>
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <WarehouseIcon
                          sx={{ fontSize: 48, color: "grey.400", mb: 1 }}
                        />
                        <Typography>Không tìm thấy kho nào</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((w, i) => (
                      <TableRow
                        key={w.id}
                        hover
                        sx={{
                          "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                          "&:hover": { backgroundColor: "#f0f7ff" },
                        }}
                      >
                        <TableCell>{(page - 1) * pageSize + i + 1}</TableCell>
                        <TableCell>{w.name}</TableCell>
                        <TableCell>{w.address || "Chưa cập nhật"}</TableCell>
                        <TableCell align="center">
                          {renderStatusChip(w.status)}
                        </TableCell>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                          >
                            <Tooltip title="Xem chi tiết">
                              <IconButton
                                color="primary"
                                onClick={() => handleNavigateDetail(w.id)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa">
                              <IconButton
                                color="secondary"
                                onClick={() => handleOpenEditWarehouse(w)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* PAGINATION */}
            {filteredWarehouses.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
