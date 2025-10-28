import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Alert,
} from "@mui/material";
import { Edit as EditIcon, Close as CloseIcon, Save as SaveIcon } from "@mui/icons-material";
import supplierAPI from "../../API/supplierAPI";
import palette from "../../constants/palette";

const EditSupplier = ({ 
  user, 
  closeModal, 
  users, 
  setUsers,
  onUpdateSuccess,
  open,
  onClose,
  formData,
  setFormData,
  formErrors,
  onSubmit,
  palette: customPalette
}) => {
  const [name, setSupplierName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [errors, setErrors] = useState({});
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [myDebt, setMyDebt] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Sử dụng customPalette nếu có, nếu không thì dùng palette mặc định
  const currentPalette = customPalette || palette;

  useEffect(() => {
    if (user) {
      // Hiển thị dữ liệu hiện tại của nhà cung cấp (giống logic của thuốc)
      setSupplierName(user.name || user.Name || '');
      setAddress(user.address || user.Address || '');
      setContact(user.contact || user.phoneNumber || user.PhoneNumber || '');
      setEmail(user.email || user.Email || '');
      setDescription(user.description || user.Description || '');
      setStatus(user.status === 1 || user.status === 'active' ? 'active' : 'inactive');
      setBankAccountNumber(user.bankAccountNumber || user.BankAccountNumber || user.bankAccountNumberMasked || '');
      setMyDebt(user.myDebt || user.MyDebt || '');
    }
  }, [user]);

  const handleSaveChanges = async () => {
    let validationErrors = {};

    // Validation nhẹ nhàng - chỉ validate format nếu có giá trị
    const contactStr = contact.toString().trim();
    if (contactStr && !/^0\d{9}$/.test(contactStr)) {
      validationErrors.contact = "Số điện thoại chỉ gồm số, 10 ký tự và bắt đầu bằng 0";
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.email = "Email không hợp lệ.";
    }

    if (myDebt.trim() && !/^\d+$/.test(myDebt)) {
      validationErrors.myDebt = "Số nợ chỉ được chứa số";
    }

    // Validation trùng lặp email và số điện thoại
    if (email.trim()) {
      console.log("=== CHECKING EMAIL DUPLICATE ===");
      console.log("Current email:", email.trim());
      console.log("Current user ID:", user._id || user.id);
      console.log("All users:", users);
      
      const duplicateEmail = users.find(supplier => {
        const supplierId = supplier._id || supplier.id;
        const currentUserId = user._id || user.id;
        const isDifferentSupplier = supplierId !== currentUserId;
        const hasSameEmail = supplier.email === email.trim() || supplier.Email === email.trim();
        
        console.log("Checking supplier:", supplier);
        console.log("Supplier ID:", supplierId);
        console.log("Current user ID:", currentUserId);
        console.log("Is different supplier:", isDifferentSupplier);
        console.log("Has same email:", hasSameEmail);
        
        return isDifferentSupplier && hasSameEmail;
      });
      
      console.log("Duplicate email found:", duplicateEmail);
      
      if (duplicateEmail) {
        validationErrors.email = "Email này đã được sử dụng bởi nhà cung cấp khác";
        console.log("Email validation error set");
      }
    }

    if (contactStr) {
      console.log("=== CHECKING PHONE DUPLICATE ===");
      console.log("Current phone:", contactStr);
      console.log("Current user ID:", user._id || user.id);
      
      const duplicatePhone = users.find(supplier => {
        const supplierId = supplier._id || supplier.id;
        const currentUserId = user._id || user.id;
        const isDifferentSupplier = supplierId !== currentUserId;
        const hasSamePhone = supplier.contact === contactStr || 
                           supplier.phoneNumber === contactStr || 
                           supplier.PhoneNumber === contactStr ||
                           supplier.Contact === contactStr;
        
        console.log("Checking supplier:", supplier);
        console.log("Supplier ID:", supplierId);
        console.log("Current user ID:", currentUserId);
        console.log("Is different supplier:", isDifferentSupplier);
        console.log("Has same phone:", hasSamePhone);
        
        return isDifferentSupplier && hasSamePhone;
      });
      
      console.log("Duplicate phone found:", duplicatePhone);
      
      if (duplicatePhone) {
        validationErrors.contact = "Số điện thoại này đã được sử dụng bởi nhà cung cấp khác";
        console.log("Phone validation error set");
      }
    }

    // Nếu có lỗi validation, hiển thị nhưng không block
    if (Object.keys(validationErrors).length > 0) {
      console.log("=== VALIDATION ERRORS FOUND ===");
      console.log("Validation errors:", validationErrors);
      console.log("Setting errors state...");
      setErrors(validationErrors);
      console.log("Errors state set, returning...");
      return;
    }

    // Gửi yêu cầu tới API với logic giống thuốc
    setLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      // Map frontend data to backend DTO format - sử dụng giá trị cũ nếu không có giá trị mới
      const statusValue = (() => {
        const s = status.toString().toLowerCase();
        if (s === 'active' || s === '1' || s === 'true') return 1;
        if (s === 'inactive' || s === '0' || s === 'false') return 0;
        return user.status === 1 || user.status === 'active' ? 1 : 0; // Fallback to current status
      })();

      const payload = {
        Name: name && name.trim() ? name.trim() : (user.name || user.Name || ''),
        Email: email && email.trim() ? email.trim() : (user.email || user.Email || ''),
        PhoneNumber: contact && contact.trim() ? contact.trim() : (user.contact || user.phoneNumber || user.PhoneNumber || ''),
        Address: address && address.trim() ? address.trim() : (user.address || user.Address || ''),
        Status: statusValue,
        MyDebt: myDebt && myDebt.trim() ? myDebt.trim() : (user.myDebt || user.MyDebt || '0'),
      };
      
      console.log("Update payload:", payload);
      const response = await supplierAPI.update(user._id || user.id, payload);

      // Cập nhật danh sách nhà cung cấp sau khi chỉnh sửa
      const updatedSuppliers = users.map(supplier =>
        supplier._id === user._id ? { ...supplier, ...payload } : supplier
      );
      setUsers(updatedSuppliers);
      
      // Hiển thị thông báo thành công
      setSuccessMessage("Cập nhật thành công!");
      setLoading(false);
      
      // Đóng modal và refresh danh sách sau 3 giây
      setTimeout(() => {
        closeModal();
        // Gọi callback để refresh danh sách
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
      }, 3000);
      
    } catch (err) {
      setErrors({ general: err.response?.data?.message || "Lỗi khi cập nhật thông tin." });
      setLoading(false);
    }
  };

  // Nếu có formData và onSubmit từ props, sử dụng chúng
  const handleSubmit = onSubmit || handleSaveChanges;
  const isOpen = open !== undefined ? open : user !== null;
  const handleClose = onClose || closeModal;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "#ffffff",
          color: "#000000",
          display: "flex",
          alignItems: "center",
          pb: 2,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <EditIcon sx={{ mr: 1, color: "#000000" }} />
        Chỉnh sửa nhà cung cấp
        <IconButton
          onClick={handleClose}
          sx={{
            ml: "auto",
            color: "#000000",
            "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {errors.general && <Alert severity="error" sx={{ mb: 2 }}>{errors.general}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tên nhà cung cấp"
              placeholder="Nhập tên nhà cung cấp (tùy chọn)"
              value={formData?.name || name}
              onChange={(e) => {
                if (formData && setFormData) {
                  setFormData({ ...formData, name: e.target.value });
                } else {
                  setSupplierName(e.target.value);
                }
              }}
              error={!!(formErrors?.name || errors.name)}
              helperText={formErrors?.name || errors.name}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: currentPalette.dark,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: currentPalette.dark,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Số điện thoại"
              placeholder="Nhập số điện thoại (tùy chọn)"
              value={formData?.contact || contact}
              onChange={(e) => {
                if (formData && setFormData) {
                  setFormData({ ...formData, contact: e.target.value });
                } else {
                  setContact(e.target.value);
                }
                console.log("Contact changed to:", e.target.value);
                console.log("Current errors:", errors);
                console.log("Current formErrors:", formErrors);
              }}
              error={!!(formErrors?.contact || errors.contact)}
              helperText={formErrors?.contact || errors.contact}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: currentPalette.dark,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: currentPalette.dark,
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              placeholder="Nhập email (tùy chọn)"
              type="email"
              value={formData?.email || email}
              onChange={(e) => {
                if (formData && setFormData) {
                  setFormData({ ...formData, email: e.target.value });
                } else {
                  setEmail(e.target.value);
                }
                console.log("Email changed to:", e.target.value);
                console.log("Current errors:", errors);
                console.log("Current formErrors:", formErrors);
              }}
              error={!!(formErrors?.email || errors.email)}
              helperText={formErrors?.email || errors.email}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: currentPalette.dark,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: currentPalette.dark,
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Địa chỉ"
              placeholder="Nhập địa chỉ (tùy chọn)"
              value={formData?.address || address}
              onChange={(e) => {
                if (formData && setFormData) {
                  setFormData({ ...formData, address: e.target.value });
                } else {
                  setAddress(e.target.value);
                }
              }}
              error={!!(formErrors?.address || errors.address)}
              helperText={formErrors?.address || errors.address}
              multiline
              rows={2}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: currentPalette.dark,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: currentPalette.dark,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel sx={{ "&.Mui-focused": { color: currentPalette.dark } }}>
                Trạng thái
              </InputLabel>
              <Select
                value={formData?.status || status}
                onChange={(e) => {
                  if (formData && setFormData) {
                    setFormData({ ...formData, status: e.target.value });
                  } else {
                    setStatus(e.target.value);
                  }
                }}
                label="Trạng thái"
                sx={{
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentPalette.dark,
                  },
                }}
              >
                <MenuItem value="active">Còn cung cấp</MenuItem>
                <MenuItem value="inactive">Ngừng cung cấp</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Số nợ"
              placeholder="Nhập số nợ (tùy chọn)"
              value={formData?.myDebt || myDebt}
              onChange={(e) => {
                if (formData && setFormData) {
                  setFormData({ ...formData, myDebt: e.target.value });
                } else {
                  setMyDebt(e.target.value);
                }
              }}
              error={!!(formErrors?.myDebt || errors.myDebt)}
              helperText={formErrors?.myDebt || errors.myDebt}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: currentPalette.dark,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: currentPalette.dark,
                },
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, backgroundColor: "#f8fafc" }}>
        <Button
          onClick={handleClose}
          sx={{
            color: "text.secondary",
            "&:hover": { backgroundColor: "grey.100" },
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading}
          sx={{
            backgroundColor: currentPalette.medium,
            color: currentPalette.dark,
            "&:hover": {
              backgroundColor: currentPalette.dark,
              color: currentPalette.white,
            },
            borderRadius: 2,
            px: 3,
          }}
        >
          {loading ? "Đang cập nhật..." : "Cập nhật"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSupplier;
