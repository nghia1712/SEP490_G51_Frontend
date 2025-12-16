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
  Card,
  CardContent,
  Container,
} from "@mui/material";
import { AccountBalanceWallet } from "@mui/icons-material";
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

  const renderCurrency = (value) => {
    const number = Number(value) || 0;
    const formatted = new Intl.NumberFormat("vi-VN")
      .format(number)
      .replace(/\./g, ",");
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: 2,
        }}
      >
        <span>{formatted}</span>
        <span
          style={{
            textDecoration: "underline",
            textUnderlineOffset: "1px",
          }}
        >
          đ
        </span>
      </span>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <AccountBalanceWallet
                sx={{ fontSize: 40, mr: 2, color: "#1976d2" }}
              />
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
              >
                Danh sách nợ của khách hàng
              </Typography>
            </Box>

            {/* FILTER + SEARCH */}
            <Paper
              sx={{ p: 2, mb: 2, backgroundColor: "#f8fafc", borderRadius: 2 }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems="center"
              >
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
                    <MenuItem value={0}>Chưa trả</MenuItem>
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

            {/* TABLE */}
            {loading ? (
              <Stack alignItems="center" mt={4}>
                <CircularProgress />
              </Stack>
            ) : (
              <TableContainer
                component={Paper}
                sx={{ borderRadius: 2, maxHeight: 550 }}
              >
                <Table stickyHeader>
                  <TableHead
                    sx={{
                      backgroundColor: "#f5f5f5",
                      "& .MuiTableCell-root": { fontWeight: "bold" },
                    }}
                  >
                    <TableRow>
                      <TableCell align="center">#</TableCell>
                      <TableCell align="center">Khách hàng</TableCell>
                      <TableCell align="center">Mã đơn hàng</TableCell>
                      <TableCell align="center">Trạng thái</TableCell>
                      <TableCell align="center">Hạn trả</TableCell>
                      <TableCell align="right">Tổng tiền phải trả</TableCell>
                      <TableCell align="right">Còn nợ</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell align="center">
                            {(page - 1) * rowsPerPage + idx + 1}
                          </TableCell>
                          <TableCell align="center">
                            {item.customerName}
                          </TableCell>
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
                        {renderCurrency(item.totalAmount)}
                      </TableCell>
                      <TableCell align="right">
                        {renderCurrency(item.debtAmount)}
                      </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* PAGINATION */}
            {paginatedData.length > 0 && totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, v) => setPage(v)}
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
