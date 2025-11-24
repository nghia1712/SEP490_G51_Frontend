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
                  <TableCell align="center">Thể loại nợ</TableCell>
                  <TableCell align="center">Thuộc về</TableCell>
                  <TableCell align="center">Phải trả</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Dư nợ</TableCell>
                  <TableCell align="center">Ngày tạo</TableCell>
                  <TableCell align="center">Ngày trả</TableCell>
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
                        {item.entityType === 1
                          ? "Nhà cung cấp"
                          : item.entityType === 2
                          ? "Khách hàng"
                          : "Không xác định"}
                      </TableCell>

                      <TableCell align="center">{item.debtName}</TableCell>

                      <TableCell>{item.payables.toLocaleString()} đ</TableCell>

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
                        {item.payday
                          ? new Date(item.payday).toLocaleDateString("vi-VN")
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

          <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
            />
          </Box>
        </Paper>
      )}

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết công nợ</DialogTitle>
        <DialogContent dividers>
          {selectedDebt ? (
            <Stack spacing={3}>
              {/* Thông tin cơ bản */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Thông tin công nợ
                </Typography>

                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Mã công nợ:</Typography>
                    <Typography fontWeight="bold">{`DB-${selectedDebt.reportID}`}</Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Loại thực thể:</Typography>
                    <Typography>
                      {entityTypeLabel(selectedDebt.entityType)}
                    </Typography>
                  </Stack>

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
                    <Typography>Ngày tạo:</Typography>
                    <Typography>
                      {new Date(selectedDebt.createdDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Ngày thanh toán:</Typography>
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
                  >
                    <Typography>Trạng thái:</Typography>
                    <Chip
                      label={
                        debtStatusMap[selectedDebt.status]?.label ||
                        "Không xác định"
                      }
                      color={
                        debtStatusMap[selectedDebt.status]?.color || "default"
                      }
                      size="small"
                    />
                  </Stack>
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
                    <TableHead>
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
