import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Container,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Pagination,
  Stack,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import warehouseApi from "../../API/warehouseAPI";
import renderStatusChip from "../../Utils/renderStatusChip";
import AddWarehouseLocation from "./Location/AddWarehouseLocation";
import EditWarehouseLocation from "./Location/EditWarehouseLocation";

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // --- Pagination state ---
  const [page, setPage] = useState(1);
  const rowsPerPage = 5; // số dòng trên 1 trang

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const res = await warehouseApi.getWarehouseDetails(id);
        setWarehouse(res.data.data);
        setLocations(res.data.data.warehouseLocations || []);
      } catch (err) {
        console.error("Lỗi khi lấy chi tiết kho:", err);
        setError("Không thể tải chi tiết kho");
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  const filteredLocations = locations.filter((loc) =>
    loc.locationName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLocations.length / rowsPerPage);
  const paginatedLocations = filteredLocations.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const reloadLocations = async () => {
    setLoading(true);
    try {
      const res = await warehouseApi.getWarehouseDetails(id);
      setWarehouse(res.data.data);
      setLocations(res.data.data.warehouseLocations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url('/images/backgroundMedical2.jpg')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
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
        <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
          <Button onClick={() => navigate(-1)}>🔙 Quay lại</Button>
        </Box>
        <Card
          elevation={3}
          sx={{ borderRadius: 2, backgroundColor: "rgba(255,255,255,0.95)" }}
        >
          <CardContent sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : warehouse ? (
              <>
                <Typography
                  variant="h4"
                  sx={{ mb: 3, color: "#1976d2", fontWeight: "bold" }}
                >
                  Chi tiết kho: {warehouse.name}
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Tên kho</Typography>
                    <Typography>{warehouse.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Trạng thái</Typography>
                    {renderStatusChip(warehouse.status ? "active" : "inactive")}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Địa chỉ</Typography>
                    <Typography>
                      {warehouse.address || "Chưa cập nhật"}
                    </Typography>
                  </Grid>
                </Grid>

                {/* LOCATION TABLE */}
                <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <TextField
                    placeholder="Tìm kiếm vị trí..."
                    size="small"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1); // reset page khi tìm kiếm
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: 300 }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                      backgroundColor: "#1976d2",
                      "&:hover": { backgroundColor: "#1565c0" },
                    }}
                    onClick={() => setOpenAdd(true)}
                  >
                    Thêm vị trí
                  </Button>
                </Box>

                <AddWarehouseLocation
                  open={openAdd}
                  onClose={() => setOpenAdd(false)}
                  warehouseId={warehouse.id}
                  onSuccess={reloadLocations}
                />

                <EditWarehouseLocation
                  open={openEdit}
                  location={selectedLocation}
                  onClose={() => setOpenEdit(false)}
                  onSuccess={() => {
                    setOpenEdit(false);
                    reloadLocations();
                  }}
                />

                <TableContainer
                  component={Paper}
                  sx={{ maxHeight: 400, borderRadius: 2 }}
                >
                  <Table stickyHeader>
                    <TableHead
                      sx={{
                        backgroundColor: "#f5f5f5",
                        "& .MuiTableCell-root": { fontWeight: "bold" },
                      }}
                    >
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Tên vị trí</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell align="center">Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedLocations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                            Không tìm thấy vị trí nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedLocations.map((loc, index) => (
                          <TableRow key={loc.id} hover>
                            <TableCell>
                              {(page - 1) * rowsPerPage + index + 1}
                            </TableCell>
                            <TableCell>{loc.locationName}</TableCell>
                            <TableCell>
                              {renderStatusChip(
                                loc.status ? "active" : "inactive"
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Xem chi tiết">
                                <IconButton
                                  color="primary"
                                  onClick={() =>
                                    navigate(
                                      `/warehouse-location/details/${loc.id}`,
                                      {
                                        state: { warehouseID: warehouse.id },
                                      }
                                    )
                                  }
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Chỉnh sửa">
                                <IconButton
                                  color="secondary"
                                  onClick={() => {
                                    setSelectedLocation(loc);
                                    setOpenEdit(true);
                                  }}
                                  sx={{ ml: 1 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* PAGINATION */}
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
                >
                  <Pagination
                    count={totalPages || 1}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              </>
            ) : (
              <Typography>Không có dữ liệu chi tiết</Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
