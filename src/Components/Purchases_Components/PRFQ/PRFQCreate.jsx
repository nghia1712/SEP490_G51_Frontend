import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  Grid,
  Button,
  MenuItem,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Tooltip,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import prfqApi from "../../../API/prfqAPI";
import supplierAPI from "../../../API/supplierAPI";
import productAPI from "../../../API/productAPI";
import palette from "../../../constants/palette";
import AddProduct from "../../Product_Components/AddProduct";

export default function PRFQCreate() {
  const navigate = useNavigate();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | info | warning
  });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };
  // Popup thêm sản phẩm
  const [openAddProduct, setOpenAddProduct] = useState(false);
  const handleOpenAddProduct = () => setOpenAddProduct(true);
  const handleCloseAddProduct = () => setOpenAddProduct(false);

  // Popup xem qua
  const [openPreview, setOpenPreview] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    supplierId: "",
    taxCode: "",
    phone: "",
    address: "",
    email: "",
    items: [{ productName: "" }],
  });

  // Danh sách NCC
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Gợi ý sản phẩm
  const [productSuggestions, setProductSuggestions] = useState([]);
  const searchTimeout = useRef(null);

  const handleProductSearch = async (keyword) => {
    if (!keyword.trim()) {
      setProductSuggestions([]);
      return;
    }

    try {
      const res = await productAPI.search(keyword);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];

      // 🔒 Lọc bỏ những sản phẩm đã được chọn
      const selectedIds = formData.items
        .map((item) => item.productId)
        .filter((id) => id);

      const filteredList = list.filter(
        (p) => !selectedIds.includes(p.productID)
      );

      setProductSuggestions(filteredList.slice(0, 10));
    } catch (err) {
      console.error("Lỗi search sản phẩm:", err);
    }
  };

  const handleItemChange = (index, value) => {
    const newItems = [...formData.items];
    newItems[index].productName = value;
    setFormData({ ...formData, items: newItems });

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      handleProductSearch(value);
    }, 300);
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await supplierAPI.getAll();
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
        const activeSuppliers = list.filter((s) => s.status === 1);
        setSuppliers(activeSuppliers);
      } catch (err) {
        console.error("Lỗi tải danh sách NCC:", err);
      }
    };
    fetchSuppliers();
  }, []);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "supplierId" && value) {
      try {
        const res = await supplierAPI.getById(value);
        const s = res.data?.data;
        setSelectedSupplier(s);
        setFormData((prev) => ({
          ...prev,
          supplierId: value,
          phone: s.phoneNumber || "",
          address: s.address || "",
          email: s.email || "",
        }));
      } catch (err) {
        console.error("Lỗi khi lấy thông tin NCC:", err);
      }
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: "" }],
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // GỬI FORM
  const handleSubmit = async (status) => {
    try {
      const productIds = formData.items
        .map((item) => item.productId)
        .filter((id) => id);

      if (productIds.length === 0) {
        setSnackbar({
          open: true,
          message: "⚠️ Vui lòng chọn ít nhất một sản phẩm từ danh sách!",
          severity: "warning",
        });
        return;
      }

      const payload = {
        supplierId: Number(formData.supplierId),
        taxCode: "030203002865",
        myPhone: "0398233047",
        myAddress: "165 Dư Hàng Kênh Tp Hải Phòng",
        productIds,
        prfqStatus: status === "Draft" ? 0 : 1,
      };

      await prfqApi.create(payload);

      setSnackbar({
        open: true,
        message: "✅ Tạo PRFQ thành công!",
        severity: "success",
      });

      // ✅ Đợi Snackbar hiện rồi mới điều hướng
      setTimeout(() => {
        navigate("/purchase/prfq");
      }, 1200);
    } catch (error) {
      console.error("❌ Lỗi khi tạo PRFQ:", error);
      setSnackbar({
        open: true,
        message: "Không thể tạo PRFQ, vui lòng thử lại!",
        severity: "error",
      });
    }
  };

  return (
    <>
      <AddProduct
        open={openAddProduct}
        handleClose={handleCloseAddProduct}
        onSaveSuccess={() => console.log("Thêm sản phẩm thành công!")}
      />

      <Box sx={{ p: 3 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 2, color: palette.primary.main }}
        >
          🧾 Tạo Yêu Cầu Báo Giá Nhập
        </Typography>

        {/* THÔNG TIN NCC */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="Nhà cung cấp"
                name="supplierId"
                fullWidth
                size="small"
                value={formData.supplierId}
                onChange={handleChange}
              >
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Mã số thuế"
                name="taxCode"
                fullWidth
                size="small"
                sx={{ mt: 2 }}
                value="030203002865"
                onChange={handleChange}
              />

              <TextField
                label="Số điện thoại"
                name="phone"
                fullWidth
                size="small"
                sx={{ mt: 2 }}
                value="0398233047"
                onChange={handleChange}
              />

              <TextField
                label="Địa chỉ"
                name="address"
                fullWidth
                size="small"
                sx={{ mt: 2 }}
                value="165 Dư Hàng Kênh Tp Hải Phòng"
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Thông tin nhà cung cấp
                </Typography>
                {selectedSupplier ? (
                  <>
                    <Typography variant="body2">
                      Tên: {selectedSupplier.name}
                    </Typography>
                    <Typography variant="body2">
                      Email: {selectedSupplier.email}
                    </Typography>
                    <Typography variant="body2">
                      Địa chỉ: {selectedSupplier.address}
                    </Typography>
                    <Typography variant="body2">
                      SĐT: {selectedSupplier.phoneNumber}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chưa chọn nhà cung cấp
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* DANH SÁCH SẢN PHẨM */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Danh sách sản phẩm
          </Typography>

          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>STT</TableCell>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        options={productSuggestions}
                        getOptionLabel={(p) => p.productName || ""}
                        value={{ productName: item.productName }}
                        onInputChange={(e, value, reason) => {
                          if (reason === "input")
                            handleItemChange(index, value);
                        }}
                        onChange={(e, value) => {
                          const newItems = [...formData.items];

                          if (value) {
                            const isDuplicate = formData.items.some(
                              (item, i) =>
                                item.productId === value.productID &&
                                i !== index
                            );

                            if (isDuplicate) {
                              setSnackbar({
                                open: true,
                                message: "⚠️ Sản phẩm này đã được chọn!",
                                severity: "warning",
                              });
                              return;
                            }

                            newItems[index] = {
                              ...newItems[index],
                              productName: value.productName,
                              productId: value.productID,
                              description: value.productDescription || "",
                              unit: value.unit || "",
                            };
                          } else {
                            newItems[index] = {
                              productName: "",
                              productId: null,
                              description: "",
                              unit: "",
                            };
                          }

                          setFormData({ ...formData, items: newItems });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Tên sản phẩm"
                            size="small"
                            fullWidth
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {params.InputProps.endAdornment}
                                  <Tooltip title="Thêm sản phẩm mới">
                                    <IconButton
                                      size="small"
                                      onClick={handleOpenAddProduct}
                                    >
                                      <AddIcon color="success" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Xóa dòng này">
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddItem}
                      sx={{ color: palette.success.main }}
                    >
                      Thêm sản phẩm
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* BUTTONS */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 2,
            mt: 2,
          }}
        >
          <Button variant="contained" onClick={() => setOpenPreview(true)}>
            Xem trước
          </Button>
          <Button variant="contained" onClick={() => handleSubmit("Draft")}>
            Lưu bản nháp
          </Button>
          <Button variant="contained" onClick={() => handleSubmit("Submit")}>
            Gửi yêu cầu
          </Button>
        </Box>

        {/* POPUP XEM TRƯỚC */}
        <Dialog
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              textAlign: "center",
              bgcolor: "#0070C0",
              color: "white",
            }}
          >
            YÊU CẦU BÁO GIÁ (REQUEST FOR QUOTATION)
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            {/* BÊN GỬI / NHẬN */}
            <Table sx={{ border: "1px solid #000", mb: 2 }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: "50%" }} colSpan={2}>
                    BÊN GỬI / SENDER
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} colSpan={2}>
                    BÊN NHẬN / RECEIVER
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Người gửi:</TableCell>
                  <TableCell>purchases</TableCell>
                  <TableCell>Tên NCC:</TableCell>
                  <TableCell>{selectedSupplier?.name || "Chưa chọn"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mã số thuế:</TableCell>
                  <TableCell>030203002865</TableCell>
                  <TableCell>Email:</TableCell>
                  <TableCell>{selectedSupplier?.email || ""}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Số điện thoại:</TableCell>
                  <TableCell>0398233047</TableCell>
                  <TableCell>Liên lạc:</TableCell>
                  <TableCell>{selectedSupplier?.phoneNumber || ""}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Địa chỉ:</TableCell>
                  <TableCell>{formData.address || ""}</TableCell>
                  <TableCell>Địa chỉ:</TableCell>
                  <TableCell>{selectedSupplier?.address || ""}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ngày gửi:</TableCell>
                  <TableCell>
                    {new Date().toLocaleDateString("vi-VN")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* DANH SÁCH SẢN PHẨM */}
            <Typography
              sx={{
                fontWeight: 700,
                textAlign: "center",
                bgcolor: "#00B050",
                color: "white",
                p: 1,
                mb: 1,
              }}
            >
              DANH SÁCH SẢN PHẨM (PRODUCT LIST)
            </Typography>

            <Table size="small" sx={{ border: "1px solid #000", mb: 2 }}>
              <TableHead sx={{ bgcolor: "#E0E0E0" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Số thứ tự</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tên sản phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mô tả</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Đơn vị</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.length > 0 ? (
                  formData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.description || ""}</TableCell>
                      <TableCell>{item.unit || ""}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ color: "gray" }}
                    >
                      Không có sản phẩm tương ứng
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* GHI CHÚ */}
            <Typography
              sx={{
                textAlign: "center",
                bgcolor: "#E6E6FA",
                fontWeight: 600,
                p: 1,
                mb: 1,
              }}
            >
              GHI CHÚ (NOTES)
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2">
                • Vui lòng phản hồi báo giá qua email hoặc hệ thống trong thời
                gian sớm nhất.
              </Typography>
              <Typography variant="body2">
                • Báo giá cần ghi rõ điều kiện thanh toán và thời gian giao
                hàng.
              </Typography>
              <Typography variant="body2">
                • Đảm bảo tính trung thực, rõ ràng trong báo giá.
              </Typography>
            </Box>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                mt: 3,
                fontStyle: "italic",
              }}
            >
              (Khởi tạo từ CÔNG TY TNHH DƯỢC PHẨM SỐ 17 – MST: 030203002865 –
              Hotline: 0398233047)
            </Typography>
          </DialogContent>
        </Dialog>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
