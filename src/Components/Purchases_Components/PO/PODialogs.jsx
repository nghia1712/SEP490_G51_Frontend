import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TextField,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Delete } from "@mui/icons-material";

export default function PODialogs({
  openUpload,
  openPreview,
  handleCloseUpload,
  excelFile,
  setExcelFile,
  handleUploadExcel,
  uploading,
  uploadedProducts,
  setUploadedProducts,
  setPreviewOpen,
  handleConvertExcel,
  sending,
  parseDDMMYYYY,
  snackbar,
  setSnackbar,
}) {
  return (
    <>
      {/* Upload Excel Dialog */}
      <Dialog open={openUpload} onClose={handleCloseUpload} fullWidth>
        <DialogTitle>Tải file Excel</DialogTitle>
        <DialogContent>
          <Button variant="outlined" component="label" disabled={uploading}>
            Chọn file Excel
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={(e) => setExcelFile(e.target.files[0])}
            />
          </Button>
          {excelFile && <p>{excelFile.name}</p>}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseUpload} disabled={uploading}>
            Hủy
          </Button>
          <Button
            onClick={handleUploadExcel}
            disabled={!excelFile || uploading}
            variant="contained"
          >
            {uploading ? "Đang tải lên..." : "Tải lên"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Excel Dialog */}
      <Dialog
        open={openPreview}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 2,
            borderBottom: "1px solid #e0e0e0",
            backgroundColor: "#f9f9f9",
          }}
        >
          <DialogTitle sx={{ m: 0, fontSize: 18, fontWeight: "bold" }}>
            Xác nhận sản phẩm từ Excel
          </DialogTitle>

          <Button
            color="info"
            size="small"
            onClick={handleUploadExcel}
            disabled={sending}
          >
            {sending ? <CircularProgress size={20} /> : "Tải lại"}
          </Button>
        </Box>

        <DialogContent dividers sx={{ minHeight: "70vh" }}>
          <Table size="small">
            <TableHead sx={{ background: "#e0e0e0" }}>
              <TableRow>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  Tên sản phẩm
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Mô tả</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>ĐVT</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Đơn giá</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Thuế</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Số lượng</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Gợi ý</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Tối thiểu</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Hiện tại</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Tối đa</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Hạn dùng</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {uploadedProducts.map((p, i) => (
                <TableRow key={p.productID}>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 200, // giới hạn chiều rộng cột
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      cursor: "pointer",
                    }}
                    title={p.description} // hiển thị tooltip khi hover
                  >
                    {p.description}
                  </TableCell>

                  <TableCell>{p.dvt}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{p.unitPrice.toLocaleString()} ₫</TableCell>
                  <TableCell>{p.tax * 100} %</TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={p.quantity === 0 ? "" : p.quantity}
                      helperText={
                        p.quantity > p.suggestedQuantity
                          ? "Vượt quá số lượng gợi ý"
                          : ""
                      }
                      FormHelperTextProps={{
                        sx: {
                          color: "warning.main",
                        },
                      }}
                      onChange={(e) => {
                        let val = e.target.value;
                        let newQuantity = val === "" ? "" : Number(val);
                        if (newQuantity < 1 && newQuantity !== "")
                          newQuantity = 1;

                        setUploadedProducts((prev) =>
                          prev.map((item, idx) =>
                            idx === i
                              ? { ...item, quantity: newQuantity }
                              : item
                          )
                        );

                        if (newQuantity > p.suggestedQuantity) {
                          setSnackbar({
                            open: true,
                            message: `Số lượng "${p.productName}" vượt quá số lượng gợi ý (${p.suggestedQuantity})`,
                            severity: "warning",
                          });
                        }
                      }}
                    />
                  </TableCell>

                  <TableCell>{p.suggestedQuantity}</TableCell>
                  <TableCell>{p.minQuantity}</TableCell>
                  <TableCell>{p.currentQuantity}</TableCell>
                  <TableCell>{p.maxQuantity}</TableCell>
                  <TableCell>
                    {p.expiredDateDisplay
                      ? new Date(p.expiredDateDisplay).toLocaleDateString(
                          "vi-VN"
                        )
                      : ""}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() =>
                        setUploadedProducts((prev) =>
                          prev.filter((_, index) => index !== i)
                        )
                      }
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: "flex-end",
            px: 3,
            py: 2,
            background: "#fff",
            borderTop: "1px solid #ddd",
          }}
        >
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setPreviewOpen(false)}
            disabled={sending}
          >
            {sending ? <CircularProgress size={20} /> : "Đóng"}
          </Button>
          <Button
            variant="contained"
            onClick={handleConvertExcel}
            disabled={sending}
          >
            {sending ? <CircularProgress size={20} /> : "Gửi yêu cầu"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
