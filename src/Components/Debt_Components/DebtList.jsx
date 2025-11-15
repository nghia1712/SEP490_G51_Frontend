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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
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
  } = usePO();

  const [openDetail, setOpenDetail] = useState(false);

  useEffect(() => {
    fetchDebtReport();
  }, []);

  const handleOpenDetail = async (reportID) => {
    await fetchDebtDetail(reportID);
    setOpenDetail(true);
  };

  const handleClose = () => {
    setOpenDetail(false);
    setSelectedDebt(null);
  };

  const entityTypeLabel = (type) =>
    type === 1 ? "Nhà cung cấp" : type === 2 ? "Khách hàng" : "Không xác định";

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>
        Quản lý công nợ
      </Typography>

      {debtLoading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
        </Stack>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">#</TableCell>
                <TableCell align="center">Mã công nợ</TableCell>
                <TableCell>Loại thực thể</TableCell>
                <TableCell align="center">Thuộc về</TableCell>
                <TableCell align="center">Ngày tạo</TableCell>
                <TableCell align="center">Tổng tiền</TableCell>
                <TableCell align="center">Đã trả</TableCell>
                <TableCell align="center">Còn nợ</TableCell>
                <TableCell align="center">Ngày thanh toán</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {debtList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                debtList.map((debt, idx) => (
                  <TableRow key={debt.reportID}>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell align="center">{`DB-${debt.reportID}`}</TableCell>
                    <TableCell>{entityTypeLabel(debt.entityType)}</TableCell>
                    <TableCell align="center">{debt.entityID}</TableCell>
                    <TableCell align="center">
                      {new Date(debt.createdDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell align="right">
                      {(debt.payables + debt.currentDebt)?.toLocaleString()} đ
                    </TableCell>
                    <TableCell align="right">
                      {debt.payables?.toLocaleString()} đ
                    </TableCell>
                    <TableCell align="right">
                      {debt.currentDebt?.toLocaleString()} đ
                    </TableCell>
                    <TableCell align="center">
                      {debt.payday
                        ? new Date(debt.payday).toLocaleDateString("vi-VN")
                        : "-"}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          debtStatusMap[debt.status]?.label || "Không xác định"
                        }
                        color={debtStatusMap[debt.status]?.color || "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          color="info"
                          onClick={() => handleOpenDetail(debt.reportID)}
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

      <Dialog open={openDetail} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết công nợ</DialogTitle>
        <DialogContent dividers>
          {selectedDebt ? (
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
                    <b>Loại thực thể:</b>
                  </TableCell>
                  <TableCell align="right">
                    {entityTypeLabel(selectedDebt.entityType)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <b>Thuộc về:</b>
                  </TableCell>
                  <TableCell align="right">{selectedDebt.entityID}</TableCell>
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
                <TableRow>
                  <TableCell>
                    <b>Tổng tiền:</b>
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: "bold" }}>
                    {(
                      selectedDebt.payables + selectedDebt.currentDebt
                    )?.toLocaleString()}{" "}
                    đ
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <b>Đã trả:</b>
                  </TableCell>
                  <TableCell align="right">
                    {selectedDebt.payables?.toLocaleString()} đ
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <b>Còn nợ:</b>
                  </TableCell>
                  <TableCell align="right">
                    {selectedDebt.currentDebt?.toLocaleString()} đ
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <b>Ngày thanh toán:</b>
                  </TableCell>
                  <TableCell align="right">
                    {selectedDebt.payday
                      ? new Date(selectedDebt.payday).toLocaleDateString(
                          "vi-VN"
                        )
                      : "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <b>Trạng thái:</b>
                  </TableCell>
                  <TableCell align="center">
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
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <Stack alignItems="center" mt={2}>
              <CircularProgress />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" variant="contained">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
