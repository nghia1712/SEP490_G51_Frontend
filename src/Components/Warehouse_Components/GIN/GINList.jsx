import React, { useEffect, useState } from "react";
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
  Snackbar,
  Alert,
} from "@mui/material";
import { Visibility, Search } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import useGIN, { mapGINStatus } from "../../../Hooks/useGIN";

export default function GRNList() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    data,
    loading,
    error,
    search,
    setSearch,
    refetch,
    openDetail,
    setOpenDetail,
    selectedExport,
    detailItems,
    detailLoading,
    handleViewDetail,
    createGIN,
    sendGIN,
    snack,
    handleSnackClose,
    renderGINStatus,
  } = useGIN();

  const [filtered, setFiltered] = useState([]);

  // =========================
  // Filter search
  // =========================
  useEffect(() => {
    setFiltered(
      data?.filter(
        (item) =>
          (item.note || "").toLowerCase().includes(search.toLowerCase()) ||
          (item.goodsIssueNoteCode || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (item.warehouseName || "")
            .toLowerCase()
            .includes(search.toLowerCase())
      ) || []
    );
  }, [search, data]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Phiếu xuất kho
      </Typography>

      {/* Search + Tạo phiếu */}
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
            placeholder="Search..."
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

        </Stack>
      </Paper>

      {/* Table danh sách */}
      {loading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
        </Stack>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Phiếu xuất kho</TableCell>
                <TableCell>Kho</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>Người phụ trách</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Mã yêu cầu</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row, idx) => (
                  <TableRow key={row.id + "_" + idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{row.goodsIssueNoteCode}</TableCell>
                    <TableCell>{row.warehouseName}</TableCell>
                    <TableCell>
                      {row.createAt
                        ? new Date(row.createAt).toLocaleDateString("vi-VN")
                        : "-"}
                    </TableCell>
                    <TableCell>{row.note}</TableCell>
                    <TableCell>{row.createBy}</TableCell>
                    <TableCell>{renderGINStatus(row.status)}</TableCell>
                    <TableCell>{row.stockExportOrderCode}</TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
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
        </Paper>
      )}

      {/* Dialog chi tiết */}
      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết phiếu xuất kho</DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Stack alignItems="center" mt={3}>
              <CircularProgress />
            </Stack>
          ) : (
            selectedExport && (
              <>
                <Typography>
                  <b>Phiếu xuất kho:</b> {selectedExport.goodsIssueNoteCode}
                </Typography>
                <Typography>
                  <b>Kho xuất:</b> {selectedExport.warehouseName}
                </Typography>

                <Typography>
                  <b>Ngày tạo:</b>{" "}
                  {selectedExport.createAt
                    ? new Date(selectedExport.createAt).toLocaleDateString(
                        "vi-VN"
                      )
                    : "-"}
                </Typography>

                <Typography>
                  <b>Người phụ trách:</b> {selectedExport.createBy}
                </Typography>
                <Typography>
                  <b>Mô tả:</b> {selectedExport.note}
                </Typography>
                <Typography>
                  <b>Mã đơn hàng:</b> {selectedExport.stockExportOrderCode}
                </Typography>

                <Typography fontWeight="bold" mt={2} mb={1}>
                  Danh sách sản phẩm
                </Typography>

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Tên sản phẩm</TableCell>
                      <TableCell>Số lượng</TableCell>
                      <TableCell>Vị trí kho</TableCell>
                      <TableCell>Hạn dùng</TableCell>
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
                          <TableCell>{item.warehouseLocationName}</TableCell>
                          <TableCell>
                            {item.expiredDate
                              ? new Date(item.expiredDate).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </>
            )
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
