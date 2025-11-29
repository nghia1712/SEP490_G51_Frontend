// src/Components/CustomerDebt/DebtList.jsx
import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Stack,
  Chip,
  Pagination,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import useCustomerDebt from "../../Hooks/useCustomerDebt";

export default function CustomerDebtList() {
  const { data, loading, renderDebtStatus } = useCustomerDebt();

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  // Fake nhắc nhở
  const handleReminder = (item) => {
    alert(`Đã gửi nhắc nhở cho khách hàng: ${item.customerName}`);
    // TODO: call API gửi reminder nếu có
  };

  // Filter & search
  const filteredData = useMemo(() => {
    return data
      .filter((item) =>
        statusFilter === "" ? true : item.status === statusFilter
      )
      .filter((item) =>
        searchText === ""
          ? true
          : item.customerName
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            item.salesOrderCode.toLowerCase().includes(searchText.toLowerCase())
      );
  }, [data, statusFilter, searchText]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Danh sách công nợ khách hàng
      </Typography>

      {/* Filter & Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            label="Tìm kiếm..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={statusFilter}
              label="Trạng thái"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value={0}>Chưa trả nợ</MenuItem>
              <MenuItem value={1}>Trả một phần</MenuItem>
              <MenuItem value={2}>Hết nợ</MenuItem>
              <MenuItem value={3}>Nợ xấu</MenuItem>
              <MenuItem value={4}>Quá hạn</MenuItem>
              <MenuItem value={5}>Đơn bị hủy</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              setStatusFilter("");
              setSearchText("");
            }}
          >
            Xóa lọc
          </Button>
        </Stack>
      </Paper>

      {/* List */}
      {loading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
        </Stack>
      ) : (
        <Paper>
          <TableContainer sx={{ maxHeight: 550 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell align="center">#</TableCell>
                  <TableCell align="center">Khách hàng</TableCell>
                  <TableCell align="center">Mã đơn hàng</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Hạn trả</TableCell>
                  <TableCell align="center">Tổng tiền phải trả</TableCell>
                  <TableCell align="center">Còn nợ</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell align="center">
                        {(page - 1) * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell align="center">{item.customerName}</TableCell>
                      <TableCell align="center">
                        {item.salesOrderCode}
                      </TableCell>
                      <TableCell align="center">
                        {renderDebtStatus(item.status)}
                      </TableCell>
                      <TableCell align="center">
                        {new Date(item.dueDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell align="right">
                        {item.totalAmount?.toLocaleString()} đ
                      </TableCell>
                      <TableCell align="right">
                        {item.debtAmount?.toLocaleString()} đ
                      </TableCell>
                      <TableCell align="center">
                        {item.status !== 2 && (
                          <Tooltip title="Nhắc nhở khách hàng">
                            <IconButton
                              color="primary"
                              onClick={() => handleReminder(item)}
                            >
                              <NotificationsActiveIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
}
