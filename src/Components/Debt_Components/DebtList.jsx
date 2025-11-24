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
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import usePO from "../../Hooks/usePO";

const debtStatusMap = {
  2: { label: "Nợ xấu", color: "error" },
  4: { label: "Thanh toán một phần", color: "warning" },
  5: { label: "Hết nợ", color: "success" },
  6: { label: "Quá hạn", color: "secondary" },
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

  const totalPages = Math.ceil(debtList.length / rowsPerPage);
  const paginatedDebts = debtList.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Báo cáo công nợ
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        {secretLoading ? (
          <Stack alignItems="center">
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <Stack direction="row" spacing={2}>
            <Button variant="contained">
              Tổng thu: {secretInfo?.totalRecieve?.toLocaleString() || "0"} đ
            </Button>

            <Button variant="outlined">
              Tổng chi: {secretInfo?.totalPaid?.toLocaleString() || "0"} đ
            </Button>

            <Button variant="outlined">
              Nợ trần: {secretInfo?.debtCeiling?.toLocaleString() || "0"} đ
            </Button>
          </Stack>
        )}
      </Paper>

      {/* TABLE */}
      {debtLoading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
        </Stack>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">#</TableCell>
                  <TableCell align="center">Nợ phải trả</TableCell>
                  <TableCell align="center">Thể loại nợ</TableCell>
                  <TableCell align="center">Thuộc về</TableCell>
                  <TableCell align="center">Ngày trả gần nhất</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Dư nợ</TableCell>
                  <TableCell align="center">Ngày tạo</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedDebts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDebts.map((item, idx) => (
                    <TableRow key={item.reportID}>
                      <TableCell align="center">
                        {(page - 1) * rowsPerPage + idx + 1}
                      </TableCell>

                      <TableCell align="center">
                        {(item.payables + item.currentDebt)?.toLocaleString()} đ
                      </TableCell>

                      <TableCell align="center">
                        {item.entityType === 1
                          ? "Nhà cung cấp"
                          : item.entityType === 2
                          ? "Khách hàng"
                          : "Không xác định"}
                      </TableCell>

                      <TableCell align="center">{item.debtName}</TableCell>

                      <TableCell align="center">
                        {item.payday
                          ? new Date(item.payday).toLocaleDateString("vi-VN")
                          : "-"}
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={
                            debtStatusMap[item.status]?.label ||
                            "Không xác định"
                          }
                          color={debtStatusMap[item.status]?.color || "default"}
                          size="small"
                        />
                      </TableCell>

                      <TableCell align="center">
                        {item.currentDebt.toLocaleString()} đ
                      </TableCell>

                      <TableCell align="center">
                        {new Date(item.createdDate).toLocaleDateString("vi-VN")}
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

          <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
            />
          </Box>
        </Paper>
      )}

      {/* DETAIL DIALOG */}
      <Dialog open={openDetail} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết công nợ</DialogTitle>
        <DialogContent dividers>
          {!selectedDebt ? (
            <Stack alignItems="center" mt={2}>
              <CircularProgress />
            </Stack>
          ) : (
            <>
              {/* CÁC TRƯỜNG GIỮ NGUYÊN TỪ CODE CŨ */}
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <b>Mã công nợ:</b>
                    </TableCell>
                    <TableCell align="right">{`DB-${selectedDebt.reportID}`}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>
                      <b>Thể loại nợ:</b>
                    </TableCell>
                    <TableCell align="right">
                      {selectedDebt.entityType === 1
                        ? "Nhà cung cấp"
                        : "Khách hàng"}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>
                      <b>Thuộc về:</b>
                    </TableCell>
                    <TableCell align="right">{selectedDebt.debtName}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>
                      <b>Dư nợ:</b>
                    </TableCell>
                    <TableCell align="right" style={{ color: "red" }}>
                      {selectedDebt.currentDebt.toLocaleString()} đ
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>
                      <b>Ngày tạo:</b>
                    </TableCell>
                    <TableCell align="right">
                      {new Date(selectedDebt.createdDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
