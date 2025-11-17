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
  const { poId, create } = location.state || {};

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
  } = useGIN(); // hook hiện tại chỉ fetch list

  const [filtered, setFiltered] = useState([]);

  // =========================
  // Filter search
  // =========================
  useEffect(() => {
    setFiltered(
      data?.filter((item) =>
        item.description?.toLowerCase().includes(search.toLowerCase())
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

          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/stock-export/manual-create")}
          >
            Tạo phiếu xuất kho
          </Button>
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
                <TableCell>GIN ID</TableCell>
                <TableCell>Nhà cung cấp</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>Người phụ trách</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>PO ID</TableCell>
                <TableCell align="center">Action</TableCell>
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
                  <TableRow key={row.ginId + "_" + idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{`GIN-${row.ginId}`}</TableCell>
                    <TableCell>{row.source}</TableCell>
                    <TableCell>
                      {row.createDate
                        ? new Date(row.createDate).toLocaleDateString("vi-VN")
                        : "-"}
                    </TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.createBy}</TableCell>
                    <TableCell>{mapGINStatus(row.status)}</TableCell>
                    <TableCell>{row.poid}</TableCell>
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
                  <b>GIN ID:</b> {`GIN-${selectedExport.ginId}`}
                </Typography>
                <Typography>
                  <b>Nhà cung cấp:</b> {selectedExport.source}
                </Typography>
                <Typography>
                  <b>Ngày tạo:</b>{" "}
                  {selectedExport.createDate
                    ? new Date(selectedExport.createDate).toLocaleDateString(
                        "vi-VN"
                      )
                    : "-"}
                </Typography>
                <Typography>
                  <b>Người phụ trách:</b> {selectedExport.createBy}
                </Typography>
                <Typography>
                  <b>Mô tả:</b> {selectedExport.description}
                </Typography>
                <Typography>
                  <b>PO ID:</b> {`PO-${selectedExport.poid}`}
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
                          <TableCell>
                            {item.unitPrice?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {(item.quantity * item.unitPrice)?.toLocaleString()}
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
