// src/Components/DebtManagement/DebtList.jsx
import React, { useEffect, useState } from "react";
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
  Button,
  Chip,
  Pagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Container,
  TextField,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import Payment from "@mui/icons-material/Payment";
import usePO from "../../Hooks/usePO";

const debtStatusMap = {
  2: { label: "Nợ xấu", color: "error" },
  4: { label: "Thanh toán một phần", color: "warning" },
  5: { label: "Hết nợ", color: "success" },
  6: { label: "Quá hạn", color: "secondary" },
};

const entityTypeLabel = (type) => {
  switch (type) {
    case 1:
      return "Nhà cung cấp";
    case 2:
      return "Khách hàng";
    default:
      return "Không xác định";
  }
};

export default function DebtList() {
  const {
    debtList,
    selectedDebt,
    debtLoading,
    fetchDebtReport,
    fetchDebtDetail,
    setSelectedDebt,
    secretInfo,
    secretLoading,
    fetchPharmacySecretInfo,
  } = usePO();

  const [openDetail, setOpenDetail] = useState(false);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");

  const rowsPerPage = 10;

  useEffect(() => {
    fetchDebtReport();
    fetchPharmacySecretInfo();
  }, []);

  const handleOpenDetail = async (id) => {
    await fetchDebtDetail(id);
    setOpenDetail(true);
  };

  const handleClose = () => {
    setOpenDetail(false);
    setSelectedDebt(null);
  };

  const filteredDebts = debtList.filter((item) =>
    item.debtName.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDebts.length / rowsPerPage);
  const paginatedDebts = filteredDebts.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [searchText]);

  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Payment sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
              >
                Quản lý thanh toán
              </Typography>
            </Box>

            {/* INFO BUTTONS */}
            <Paper
              sx={{ p: 2, mb: 2, backgroundColor: "#f8fafc", borderRadius: 2 }}
            >
              {secretLoading ? (
                <Stack alignItems="center">
                  <CircularProgress size={24} />
                </Stack>
              ) : (
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Button variant="contained">
                    Tổng thu:{" "}
                    {secretInfo?.totalRecieve?.toLocaleString() || "0"} đ
                  </Button>
                  <Button variant="outlined">
                    Tổng chi: {secretInfo?.totalPaid?.toLocaleString() || "0"} đ
                  </Button>
                  <Button variant="outlined">
                    Nợ trần: {secretInfo?.debtCeiling?.toLocaleString() || "0"}{" "}
                    đ
                  </Button>
                </Stack>
              )}
              <Paper
                sx={{
                  p: 2,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1"></Typography>
                <TextField
                  size="small"
                  placeholder="Tìm kiếm"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  sx={{ width: 300 }}
                />
              </Paper>
            </Paper>

            {/* TABLE */}
            {debtLoading ? (
              <Stack alignItems="center" mt={4}>
                <CircularProgress />
              </Stack>
            ) : (
              <TableContainer
                component={Paper}
                sx={{ borderRadius: 2, maxHeight: 500 }}
              >
                <Table stickyHeader>
                  <TableHead
                    sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}
                  >
                    <TableRow>
                      <TableCell align="center">#</TableCell>
                      {/* <TableCell align="center">Thể loại nợ</TableCell> */}
                      <TableCell align="center">Thuộc về</TableCell>
                      <TableCell align="right">Phải trả</TableCell>
                      <TableCell align="center">Dư nợ</TableCell>
                      <TableCell align="center">Ngày trả gần nhất</TableCell>
                      <TableCell align="center">Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedDebts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedDebts.map((item, idx) => (
                        <TableRow key={item.reportID}>
                          <TableCell align="center">
                            {(page - 1) * rowsPerPage + idx + 1}
                          </TableCell>
                          {/* <TableCell align="center">
                            {item.entityType === 1
                              ? "Nhà cung cấp"
                              : item.entityType === 2
                              ? "Khách hàng"
                              : "Không xác định"}
                          </TableCell> */}
                          <TableCell align="center">{item.debtName}</TableCell>
                          <TableCell align="right">
                            {item.payables.toLocaleString()} đ
                          </TableCell>
                          <TableCell align="center">
                            {item.currentDebt.toLocaleString()} đ
                          </TableCell>
                          <TableCell align="center">
                            {item.payday
                              ? new Date(item.payday).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "-"}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Chi tiết">
                              <IconButton
                                color="info"
                                onClick={() => handleOpenDetail(item.reportID)}
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
            )}

            {/* PAGINATION */}
            {paginatedDebts.length > 0 && totalPages > 1 && (
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

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={"bold"} align="center">
          Chi tiết thanh toán
        </DialogTitle>
        <DialogContent dividers>
          {selectedDebt ? (
            <Stack spacing={3}>
              {/* Thông tin cơ bản */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Thông tin
                </Typography>

                <Stack spacing={1}>
                  {/* <Stack direction="row" justifyContent="space-between">
                    <Typography>Loại thực thể:</Typography>
                    <Typography>
                      {entityTypeLabel(selectedDebt.entityType)}
                    </Typography>
                  </Stack> */}

                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Thuộc về:</Typography>
                    <Typography>{selectedDebt.debtName}</Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Phải trả:</Typography>
                    <Typography>
                      {selectedDebt.payables?.toLocaleString()} đ
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Dư nợ:</Typography>
                    <Typography>
                      {selectedDebt.currentDebt?.toLocaleString()} đ
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Ngày thanh toán gần nhất:</Typography>
                    <Typography>
                      {selectedDebt.payday
                        ? new Date(selectedDebt.payday).toLocaleDateString(
                            "vi-VN"
                          )
                        : "-"}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  ></Stack>
                </Stack>
              </Paper>

              {/* Danh sách PO */}
              {selectedDebt.viewDebtPODTOs?.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Danh sách đơn hàng liên quan
                  </Typography>

                  <Table size="small">
                    <TableHead
                      sx={{
                        backgroundColor: "#f5f5f5",
                        "& .MuiTableCell-root": { fontWeight: "bold" },
                      }}
                    >
                      <TableRow>
                        <TableCell align="center">Đơn hàng</TableCell>
                        <TableCell align="right">Tổng tiền</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedDebt.viewDebtPODTOs.map((po) => (
                        <TableRow key={po.poid}>
                          <TableCell align="center">{`PO-${po.poid}`}</TableCell>
                          <TableCell align="right">
                            {po.toatlPo?.toLocaleString()} đ
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}
            </Stack>
          ) : (
            <Stack alignItems="center" mt={2}>
              <CircularProgress />
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} variant="contained" color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
