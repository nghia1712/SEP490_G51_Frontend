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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

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
        <DialogTitle>Upload file Excel PO</DialogTitle>
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
            {uploading ? "Đang upload..." : "Upload"}
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
        <DialogTitle>Xác nhận sản phẩm từ Excel</DialogTitle>

        <DialogContent dividers sx={{ minHeight: "70vh" }}>
          <Table size="small">
            <TableHead sx={{ background: "#e0e0e0" }} >
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Tên sản phẩm</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>ĐVT</TableCell>
                <TableCell>Đơn giá</TableCell>
                <TableCell>Thuế</TableCell>
                <TableCell>Số lượng</TableCell>
                <TableCell>Gợi ý</TableCell>
                <TableCell>Tối thiểu</TableCell>
                <TableCell>Hiện tại</TableCell>
                <TableCell>Tối đa</TableCell>
                <TableCell>Hạn sử dụng</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {uploadedProducts.map((p, i) => (
                <TableRow key={p.productID}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell>{p.description}</TableCell>
                  <TableCell>{p.dvt}</TableCell>
                  <TableCell>{p.unitPrice.toLocaleString()} ₫</TableCell>
                  <TableCell>{p.tax * 100} %</TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={p.quantity === 0 ? "" : p.quantity}
                      error={p.quantity > p.suggestedQuantity}
                      helperText={
                        p.quantity > p.suggestedQuantity
                          ? "Vượt quá số lượng gợi ý"
                          : ""
                      }
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
                      ? parseDDMMYYYY(p.expiredDateDisplay).toLocaleDateString(
                          "vi-VN"
                        )
                      : "-"}
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
                      <CloseIcon />
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
            variant="outlined"
            color="info"
            onClick={handleUploadExcel}
            disabled={sending}
          >
            {sending ? <CircularProgress size={20} /> : "Tải lại"}
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
