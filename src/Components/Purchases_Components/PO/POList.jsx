import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { Visibility, Search } from "@mui/icons-material";
import poApi from "../../../API/poAPI";

const statusMap = {
  0: { label: "Approved", color: "success" },
  1: { label: "Rejected", color: "error" },
  3: { label: "Deposited", color: "info" },
  4: { label: "Paid", color: "primary" },
  5: { label: "Completed", color: "success" },
  6: { label: "Sent", color: "warning" },
  7: { label: "Draft", color: "default" },
};

export default function POList() {
  const [poList, setPoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const res = await poApi.getAllPO();
      setPoList(res.data?.data || []);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách PO:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await poApi.getDetail(id);
      setSelectedPO(res.data?.data);
      setOpenDetail(true);
    } catch (err) {
      console.error("❌ Lỗi khi lấy chi tiết PO:", err);
    }
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setSelectedPO(null);
  };

  const renderStatus = (status) => {
    const s = statusMap[status] || { label: "Unknown", color: "default" };
    return <Chip label={s.label} color={s.color} size="small" />;
  };

  // 🔹 Filter theo PO ID hoặc tên người tạo
  const filteredPOs = useMemo(() => {
    if (!search) return poList;
    return poList.filter(
      (po) =>
        po.poid.toString().includes(search) ||
        po.userName.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, poList]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Danh sách yêu cầu mua hàng (PO)
      </Typography>

      {/* 🔹 Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Tìm kiếm PO ID hoặc người tạo..."
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
      </Paper>

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
                  <TableCell>PO ID</TableCell>
                  <TableCell>Người tạo</TableCell>
                  <TableCell>Ngày đặt</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Tổng tiền</TableCell>
                  <TableCell>Trả trước</TableCell>
                  <TableCell>Người trả</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredPOs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Không có dữ liệu PO
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPOs.map((po, index) => (
                    <TableRow key={po.poid}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{po.poid}</TableCell>
                      <TableCell>{po.userName}</TableCell>
                      <TableCell>
                        {new Date(po.orderDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{renderStatus(po.status)}</TableCell>
                      <TableCell>{po.total.toLocaleString()} ₫</TableCell>
                      <TableCell>{po.deposit.toLocaleString()} ₫</TableCell>
                      <TableCell>
                        {po.paymentBy === "Unknown"
                          ? "Chưa thanh toán"
                          : po.paymentBy}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenDetail(po.poid)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* 🔹 Popup xem chi tiết */}
      <Dialog
        open={openDetail}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết PO #{selectedPO?.poid}</DialogTitle>
        <DialogContent dividers>
          {selectedPO ? (
            <>
              <Typography>
                <strong>Người tạo:</strong> {selectedPO.userName}
              </Typography>
              <Typography>
                <strong>Ngày đặt:</strong>{" "}
                {new Date(selectedPO.orderDate).toLocaleString()}
              </Typography>
              <Typography>
                <strong>Trạng thái:</strong> {renderStatus(selectedPO.status)}
              </Typography>
              <Typography>
                <strong>Tổng tiền:</strong> {selectedPO.total.toLocaleString()} ₫
              </Typography>
              <Typography>
                <strong>Đặt cọc:</strong> {selectedPO.deposit.toLocaleString()} ₫
              </Typography>
              <Typography>
                <strong>Công nợ:</strong> {selectedPO.debt.toLocaleString()} ₫
              </Typography>

              <Typography sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
                Danh sách sản phẩm
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>ĐVT</TableCell>
                    <TableCell align="center">Số lượng</TableCell>
                    <TableCell align="center">Đơn giá</TableCell>
                    <TableCell align="center">Thành tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPO.details?.map((item) => (
                    <TableRow key={item.podid}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.dvt}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="center">
                        {item.unitPrice.toLocaleString()} ₫
                      </TableCell>
                      <TableCell align="center">
                        {item.unitPriceTotal.toLocaleString()} ₫
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <Typography>Đang tải chi tiết...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
