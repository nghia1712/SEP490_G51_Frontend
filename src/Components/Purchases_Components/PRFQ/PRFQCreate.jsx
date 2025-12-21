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
  Snackbar,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import prfqApi from "../../../API/prfqAPI";
import supplierAPI from "../../../API/supplierAPI";
import productAPI from "../../../API/productAPI";
import palette from "../../../constants/palette";
import AddProduct from "../../Product_Components/AddProduct";

export default function PRFQCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isUpdate = !!id;
  const location = useLocation();
  const notificationProducts = location.state?.products || [];
  console.log("Product from noti", notificationProducts);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  const [openAddProduct, setOpenAddProduct] = useState(false);
  const handleOpenAddProduct = () => setOpenAddProduct(true);
  const handleCloseAddProduct = () => setOpenAddProduct(false);

  const [openPreview, setOpenPreview] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: "",
    taxCode: "030203002865",
    phone: "0398233047",
    address: "165 Dư Hàng Kênh Tp Hải Phòng",
    email: "",
    items: [{ productName: "" }],
  });

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [productSuggestions, setProductSuggestions] = useState([]);
  const searchTimeout = useRef(null);

  const handleProductSearch = async (keyword) => {
    try {
      let list = [];
      if (!keyword.trim()) {
        // Nếu không nhập keyword → lấy tất cả sản phẩm
        const res = await productAPI.getAll();
        list = Array.isArray(res.data?.data) ? res.data.data : [];
      } else {
        // Nếu có keyword → search
        const res = await productAPI.search(keyword);
        list = Array.isArray(res.data?.data) ? res.data.data : [];
      }
      list = list.filter((p) => p.status === true);
      // Lọc những sản phẩm đã chọn
      const selectedIds = formData.items
        .map((item) => item.productId)
        .filter(Boolean);
      const filteredList = list.filter(
        (p) => !selectedIds.includes(p.productID)
      );
      setProductSuggestions(filteredList.slice(0, 10));
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
    }
  };
  useEffect(() => {
    handleProductSearch("");
  }, []);

  const handleItemChange = (index, value) => {
    const newItems = [...formData.items];
    newItems[index].productName = value;
    setFormData({ ...formData, items: newItems });

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleProductSearch(value), 300);
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
        setSuppliers(list.filter((s) => s.status === 1));
      } catch (err) {
        console.error("Lỗi tải danh sách NCC:", err);
      }
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (notificationProducts.length === 0 || isUpdate) return;

    const autoFillProducts = async () => {
      const res = await productAPI.getAll();
      const products = Array.isArray(res.data?.data) ? res.data.data : [];

      const matchedItems = notificationProducts
        .map((name) => {
          const matched = products.find(
            (p) =>
              p.status === true &&
              p.productName.trim().toLowerCase() === name.trim().toLowerCase()
          );

          if (!matched) return null;

          return {
            productId: matched.productID,
            productName: matched.productName,
            description: matched.productDescription || "",
            unit: matched.unit || "",
          };
        })
        .filter(Boolean);

      const ignoredProducts = notificationProducts.filter(
        (name) =>
          !products.some(
            (p) =>
              p.status === true &&
              p.productName.trim().toLowerCase() === name.trim().toLowerCase()
          )
      );

      if (ignoredProducts.length > 0) {
        setSnackbar({
          open: true,
          severity: "warning",
          message: `Không tìm thấy ${ignoredProducts.length} sản phẩm trong hệ thống, đã tự động bỏ qua.`,
        });
      }

      setFormData((prev) => ({
        ...prev,
        items: matchedItems.length > 0 ? matchedItems : [{ productName: "" }],
      }));
    };

    autoFillProducts();
  }, [notificationProducts, isUpdate]);

  useEffect(() => {
    if (!isUpdate) return;
    const fetchDraft = async () => {
      try {
        const res = await prfqApi.getDetail(id);
        const data = res?.data?.data || res?.data;
        if (!data) throw new Error("Không có dữ liệu");

        let items = [];
        const rawItems =
          [
            data.items,
            data.quotationItems,
            data.productList,
            data.products,
            data.itemList,
          ].find((arr) => Array.isArray(arr)) || [];

        items = rawItems.map((item) => {
          const product = item.product || item.productInfo || {};
          return {
            productId:
              item.productId || item.productID || item.id || product.id || null,
            productName:
              item.productName ||
              product.productName ||
              product.name ||
              item.name ||
              "",
            description:
              item.productDescription ||
              product.productDescription ||
              product.description ||
              item.description ||
              "",
            unit:
              item.unit ||
              product.unit ||
              product.unitName ||
              product.donVi ||
              "",
          };
        });

        if (items.length === 0) items = [{ productName: "" }];

        setFormData((prev) => ({
          ...prev,
          supplierId: data.supplierId || data.supplier?.id || "",
          email: data.email || data.supplier?.email || "",
          items,
        }));

        const supplierId = data.supplierId || data.supplier?.id;
        if (supplierId) {
          const supplierRes = await supplierAPI.getById(supplierId);
          setSelectedSupplier(supplierRes?.data?.data || supplierRes?.data);
        }
      } catch (err) {
        console.error("Load draft error:", err);
        setSnackbar({
          open: true,
          message: "Không thể tải bản nháp!",
          severity: "error",
        });
      }
    };
    fetchDraft();
  }, [id, isUpdate]);

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
          email: s.email || "",
        }));
      } catch (err) {
        console.error("Lỗi khi lấy thông tin NCC:", err);
      }
    }
  };

  const handleAddItem = () =>
    setFormData({
      ...formData,
      items: [...formData.items, { productName: "" }],
    });
  const handleRemoveItem = (index) =>
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (status) => {
    if (loading) return;
    setLoading(true);

    try {
      // validate + build payload
      const invalidItem = formData.items.some(
        (item) => !item.productId || !item.productName.trim()
      );

      if (!formData.supplierId) {
        setSnackbar({
          open: true,
          message: "Vui lòng chọn nhà cung cấp!",
          severity: "warning",
        });
        setLoading(false);
        return;
      }
      if (invalidItem) {
        setSnackbar({
          open: true,
          message: "Vui lòng chọn sản phẩm!",
          severity: "warning",
        });
        setLoading(false);
        return;
      }

      const productIds = formData.items
        .map((item) => item.productId)
        .filter(Boolean);

      if (productIds.length === 0) {
        setSnackbar({
          open: true,
          message: "Vui lòng chọn ít nhất một sản phẩm!",
          severity: "warning",
        });
        setLoading(false);
        return;
      }

      const payload = {
        supplierId: Number(formData.supplierId),
        taxCode: formData.taxCode,
        myPhone: formData.phone,
        myAddress: formData.address,
        productIds,
        prfqStatus: status === "Draft" ? 4 : 1,
      };

      let res;
      if (isUpdate) res = await prfqApi.continueEdit(id, payload);
      else res = await prfqApi.create(payload);

      setSnackbar({
        open: true,
        message:
          status === "Draft"
            ? isUpdate
              ? "Cập nhật bản nháp thành công!"
              : "Lưu bản nháp thành công!"
            : "Gửi yêu cầu thành công!",
        severity: "success",
      });

      setTimeout(() => navigate("/purchase/prfq"), 1200);
    } catch (error) {
      console.error("Lỗi Submit:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Có lỗi xảy ra!",
        severity: "error",
      });
      setLoading(false);
    }
  };

  return (
    <>
      <AddProduct
        open={openAddProduct}
        disabled={loading}
        handleClose={handleCloseAddProduct}
        onSaveSuccess={() => console.log("Thêm sản phẩm thành công!")}
      />

      <Box sx={{ p: 3 }}>
        {/* THÔNG TIN NCC */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography
            variant="h4"
            align="center"
            sx={{ fontWeight: 700, mb: 2, color: palette.primary }}
          >
            {isUpdate
              ? "Chỉnh sửa Yêu Cầu Báo Giá (Bản nháp)"
              : "Tạo Yêu Cầu Báo Giá Nhập"}
          </Typography>
          <Grid
            container
            spacing={2}
            sx={{ display: "flex", alignItems: "stretch" }}
          >
            {/* BÊN TRÁI: NHÀ THUỐC */}
            <Grid item xs={6} sx={{ display: "flex" }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Thông tin Nhà Thuốc
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tên:</strong> NHÀ THUỐC DƯỢC PHẨM SỐ 17
                  </Typography>
                  <Typography variant="body2">
                    <strong>Mã số thuế:</strong> 030203002865
                  </Typography>
                  <Typography variant="body2">
                    <strong>Địa chỉ:</strong> Kiot số 17, Phường Lê Thanh Nghị,
                    TP Hải Phòng
                  </Typography>
                  <Typography variant="body2">
                    <strong>Hotline:</strong> 0398233047
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* BÊN PHẢI: NHÀ CUNG CẤP */}
            <Grid item xs={6} sx={{ display: "flex" }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Thông tin Nhà Cung Cấp
                </Typography>

                <TextField
                  select
                  disabled={loading}
                  label="Chọn nhà cung cấp"
                  name="supplierId"
                  fullWidth
                  size="small"
                  value={formData.supplierId}
                  onChange={handleChange}
                  required
                >
                  {suppliers.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Box sx={{ mt: 1 }}>
                  {selectedSupplier ? (
                    <>
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedSupplier.email}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Địa chỉ:</strong> {selectedSupplier.address}
                      </Typography>
                      <Typography variant="body2">
                        <strong>SĐT:</strong> {selectedSupplier.phoneNumber}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                      Chưa chọn nhà cung cấp
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* DANH SÁCH SẢN PHẨM */}
        <Paper sx={{ p: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Danh sách sản phẩm
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Sản phẩm chưa có trong hệ thống?
              </Typography>

              <Tooltip title="Thêm sản phẩm nhanh">
                <IconButton
                  disabled={loading}
                  color="primary"
                  size="small"
                  onClick={handleOpenAddProduct}
                  sx={{
                    color: "primary",
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>
          <TableContainer
            sx={{
              maxHeight: 320,
              overflowY: "auto",
              mt: 2,
            }}
          >
            <Table stickyHeader>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Sản phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        disabled={loading}
                        options={productSuggestions}
                        getOptionLabel={(p) => p.productName || ""}
                        isOptionEqualToValue={(option, value) =>
                          option.productID === value.productId
                        }
                        value={
                          item.productId
                            ? productSuggestions.find(
                                (p) => p.productID === item.productId
                              ) || {
                                productID: item.productId,
                                productName: item.productName,
                              }
                            : null
                        }
                        onChange={(e, value) => {
                          if (value) {
                            const isDuplicate = formData.items.some(
                              (item, i) =>
                                i !== index &&
                                item.productId === value.productID
                            );
                            if (isDuplicate) {
                              // Hiển thị cảnh báo
                              setSnackbar({
                                open: true,
                                message: "Sản phẩm này đã được chọn!",
                                severity: "warning",
                              });

                              // Xóa value ở dòng hiện tại
                              const newItems = [...formData.items];
                              newItems[index] = {
                                productId: null,
                                productName: "",
                                description: "",
                                unit: "",
                              };
                              setFormData({ ...formData, items: newItems });

                              // Xóa luôn hiển thị Autocomplete
                              e.target.value = "";
                              return;
                            }
                          }

                          // Nếu không trùng thì cập nhật bình thường
                          const newItems = [...formData.items];
                          if (value) {
                            newItems[index] = {
                              productId: value.productID,
                              productName: value.productName,
                              description: value.productDescription || "",
                              unit: value.unit || "",
                            };
                          } else {
                            newItems[index] = {
                              productName: "",
                              productId: null,
                            };
                          }
                          setFormData({ ...formData, items: newItems });
                        }}
                        onInputChange={(e, value, reason) => {
                          if (reason === "input")
                            handleItemChange(index, value);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Chọn hoặc tìm kiếm sản phẩm"
                            size="small"
                            fullWidth
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Xóa dòng này">
                        <IconButton
                          color="error"
                          disabled={loading}
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
                      disabled={loading}
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
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setOpenPreview(true)}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                "Xem trước"
              )}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => handleSubmit("Draft")}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                "Lưu nháp"
              )}
            </Button>

            <Button
              variant="contained"
              onClick={() => handleSubmit("Submit")}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                "Gửi yêu cầu"
              )}
            </Button>
          </Box>
        </Paper>

        <Dialog
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          maxWidth="lg"
          fullWidth
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              px: 3,
              py: 2,
            }}
          >
            <Button variant="outlined" onClick={() => setOpenPreview(false)}>
              Đóng
            </Button>
          </Box>

          {/* HEADER */}
          <DialogTitle
            sx={{
              textAlign: "center",
              fontWeight: 700,
              bgcolor: "#0070C0",
              color: "white",
              fontSize: 20,
            }}
          >
            YÊU CẦU BÁO GIÁ (REQUEST FOR QUOTATION)
          </DialogTitle>

          <DialogContent sx={{ p: 0 }}>
            <Box
              sx={{
                fontSize: 14,
                border: "1px solid black",
                fontFamily: "Arial, sans-serif",
              }}
            >
              {/* SECTION: Sender & Receiver */}
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        sx={{ fontWeight: 700, borderRight: "1px solid #000" }}
                      >
                        BÊN GỬI
                      </TableCell>
                      <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                        BÊN NHẬN
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Người gửi:</TableCell>
                      <TableCell>Nhà thuốc dược phẩm số 17</TableCell>
                      <TableCell>Mã yêu cầu:</TableCell>
                      <TableCell>{id || "-"}</TableCell>
                      <TableCell>Tên NCC:</TableCell>
                      <TableCell>{selectedSupplier?.name || "-"}</TableCell>
                      <TableCell>Email:</TableCell>
                      <TableCell>{selectedSupplier?.email || "-"}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Mã số thuế:</TableCell>
                      <TableCell>030203002865</TableCell>
                      <TableCell>SDT:</TableCell>
                      <TableCell>0398233047</TableCell>
                      <TableCell>Địa chỉ:</TableCell>
                      <TableCell>{selectedSupplier?.address || "-"}</TableCell>
                      <TableCell>Liên lạc:</TableCell>
                      <TableCell>
                        {selectedSupplier?.phoneNumber || "-"}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Địa chỉ:</TableCell>
                      <TableCell colSpan={3}>
                        Kiot số 17, Phường Lê Thanh Nghị, TP Hải Phòng
                      </TableCell>
                      <TableCell>Ngày gửi:</TableCell>
                      <TableCell colSpan={3}>
                        {formData?.requestDate
                          ? new Date(formData.requestDate).toLocaleDateString(
                              "vi-VN"
                            )
                          : new Date().toLocaleDateString("vi-VN")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* SECTION: Product list */}
              <Box
                sx={{
                  bgcolor: "#00932aff",
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  py: 1,
                  mt: 1,
                }}
              >
                DANH SÁCH SẢN PHẨM
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#00B050" }}>
                    <TableRow>
                      <TableCell sx={{ color: "white", fontWeight: 700 }}>
                        Số thứ tự
                      </TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 700 }}>
                        Tên sản phẩm
                      </TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 700 }}>
                        Mô tả
                      </TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 700 }}>
                        Đơn vị
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData?.items?.length > 0 ? (
                      formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          Không có sản phẩm
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* SECTION: Notes */}
              <Box sx={{ borderTop: "1px solid black", p: 2 }}>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  GHI CHÚ (NOTES)
                </Typography>

                <Typography
                  component="div"
                  sx={{ whiteSpace: "pre-line", lineHeight: 1.7 }}
                >
                  • Vui lòng phản hồi báo giá qua email hoặc hệ thống trong thời
                  gian sớm nhất.{"\n"}• Báo giá cần ghi rõ điều kiện thanh toán
                  và thời gian đáo hạn thanh toán.{"\n"}• Đảm bảo tính trung
                  thực, rõ ràng trong báo giá.{"\n"}• Yêu cầu file phản hồi báo
                  giá theo chuẩn Format đã thống nhất.{"\n"}• Mọi thắc mắc, phát
                  sinh vui lòng liên lạc theo SĐT đã đính kèm.{"\n"}• BBPhamarcy
                  xin cam kết, đảm bảo tính pháp lý của những mặt hàng được yêu
                  cầu báo giá, thuộc loại được cấp phép lưu hành của BYT (Bộ Y
                  Tế) trên lãnh thổ Việt Nam.{"\n"}• BBPharmacy với tư cách bên
                  mua, cam kết chịu mọi trách nhiệm trước pháp luật, hiến pháp
                  nước CHXHCN Việt Nam.
                </Typography>
              </Box>

              {/* FOOTER */}
              <Box
                sx={{
                  textAlign: "center",
                  fontSize: 12,
                  mt: 2,
                  p: 1,
                  borderTop: "1px solid #000",
                }}
              >
                (Khởi tạo từ NHÀ THUỐC DƯỢC PHẨM SỐ 17 – MST: 030203002865 –
                Hotline: 0398233047)
              </Box>
            </Box>
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
          onClick={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
