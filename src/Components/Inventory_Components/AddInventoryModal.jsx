import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
} from "@mui/material";

const AddInventoryModal = ({
  open,
  onClose,
  onSubmit,
  form,
  handleChange,
  categories,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Thêm kệ mới</DialogTitle>
    <form onSubmit={onSubmit}>
      <DialogContent>
        <FormControl fullWidth margin="dense" required>
          <TextField
            margin="dense"
            label="Tên kệ"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            required
          />
        </FormControl>
        <FormControl fullWidth margin="dense" required>
          <InputLabel id="category-label">Loại sản phẩm</InputLabel>
          <Select
            labelId="category-label"
            label="Loại sản phẩm"
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
          >
            {categories.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {cat.categoryName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          label="Sức chứa tối đa"
          name="maxQuantitative"
          type="number"
          value={form.maxQuantitative}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          margin="dense"
          label="Cân nặng tối đa"
          name="maxWeight"
          type="number"
          value={form.maxWeight}
          onChange={handleChange}
          fullWidth
          required
        />
        <FormControl fullWidth margin="dense">
          <InputLabel id="status-label">Trạng thái</InputLabel>
          <Select
            labelId="status-label"
            label="Trạng thái"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <MenuItem value="active">Hoạt động</MenuItem>
            <MenuItem value="inactive">Ngừng</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button type="submit" variant="contained">
          Thêm
        </Button>
      </DialogActions>
    </form>
  </Dialog>
);

export default AddInventoryModal;