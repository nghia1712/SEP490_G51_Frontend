import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Stack,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  TableContainer,
  InputLabel,
  Snackbar,
  Alert,
  Grid,
  Pagination,
} from "@mui/material";
import { Visibility, Search, Download } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import useGRNList from "../../../Hooks/useGRNList";

export default function GRNListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { poId, create } = location.state || {};
  const {
    data,
    loading,
    search,
    setSearch,
    filtered,
    openDetail,
    setOpenDetail,
    selectedGRN,
    detailItems,
    detailLoading,
    handleViewDetail,
    warehouses,
    selectedWarehouse,
    setSelectedWarehouse,
    locations,
    selectedLocation,
    setSelectedLocation,
    locationsLoading,
    poItems,
    poInfo,
    openCreate,
    setOpenCreate,
    handleCreateGRN,
    handleDownloadPDF,
    snack,
    handleSnackClose,
  } = useGRNList({ poId, autoOpenCreate: create });

  // ===== Pagination =====
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredData = filtered || [];
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1); // Reset page khi search thay đổi
  }, [search]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Phiếu nhập kho
      </Typography>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search GRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: 350 }}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/grn/manual-create")}
          >
            Tạo phiếu nhập kho
          </Button>
        </Stack>
      </Paper>

      {/* GRN Table */}
      {loading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
        </Stack>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell align="center">Phiếu nhập kho</TableCell>
                  <TableCell>Kho</TableCell>
                  <TableCell>Vị trí</TableCell>
                  <TableCell align="center">Đơn hàng</TableCell>
                  <TableCell>Nhà cung cấp</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell>Người phụ trách</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, idx) => (
                    <TableRow key={row.grnId + "_" + idx}>
                      <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell align="center">{`GRN-${row.grnid}`}</TableCell>
                      <TableCell>{row.warehouse}</TableCell>
                      <TableCell>{row.warehouseName}</TableCell>
                      <TableCell align="center">{`PO-${row.poid}`}</TableCell>
                      <TableCell>{row.source}</TableCell>
                      <TableCell>
                        {row.createDate
                          ? new Date(row.createDate).toLocaleDateString("vi-VN")
                          : "-"}
                      </TableCell>
                      <TableCell>{row.createBy}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleViewDetail(row)}
                            >
                              <Visibility />
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

          {/* Pagination */}
          {filteredData.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      )}

      {/* Dialogs và Snackbar giữ nguyên như code cũ */}
      {/* View GRN Detail Dialog */}
      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết phiếu nhập kho</DialogTitle>
        <DialogContent dividers>
          <IconButton
            sx={{ position: "absolute", top: 8, right: 8 }}
            color="primary"
            onClick={() => handleDownloadPDF(selectedGRN.grnid)}
          >
            <Download />
          </IconButton>
          {detailLoading ? (
            <Stack alignItems="center" justifyContent="center" mt={3}>
              <CircularProgress />
            </Stack>
          ) : (
            <>
              {selectedGRN && (
                <Box mb={2}>
                  <Grid container>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Phiếu nhập kho:</b> {`GRN-${selectedGRN.grnid}`}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Đơn hàng:</b> {`PO-${selectedGRN.poid}`}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Kho:</b> {selectedGRN.warehouse}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Vị trí:</b> {selectedGRN.warehouseName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Nhà cung cấp:</b> {selectedGRN.source}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Ngày tạo:</b>{" "}
                        {selectedGRN.createDate
                          ? new Date(selectedGRN.createDate).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Người phụ trách:</b> {selectedGRN.createBy}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Mô tả:</b> {selectedGRN.description}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Typography fontWeight="bold" mb={1}>
                Danh sách sản phẩm
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Tên sản phẩm</TableCell>
                      <TableCell>Số lượng</TableCell>
                      <TableCell>Đơn giá</TableCell>
                      <TableCell>Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Không có sản phẩm
                        </TableCell>
                      </TableRow>
                    ) : (
                      detailItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unitPrice?.toLocaleString()}</TableCell>
                          <TableCell>
                            {(item.quantity * item.unitPrice)?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snack.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
