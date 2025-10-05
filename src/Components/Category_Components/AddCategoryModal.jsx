import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormHelperText,
} from "@mui/material";
import axios from "axios";

const AddCategoryModal = ({ show, onClose, onCategoryCreated }) => {
    const [categoryName, setCategoryName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    const handleCreateCategory = async () => {
        if (!categoryName.trim()) {
            setError("Tên danh mục không được bỏ trống.");
            return;
        }

        try {
            const response = await axios.post("http://localhost:9999/categories/addCategory", {
                categoryName,
                description,
                classifications: [], // gửi mảng phân loại trống nếu không cần
            });

            onCategoryCreated(response.data); // callback cho AddProduct cập nhật
            setCategoryName("");
            setDescription("");
            onClose();
        } catch (err) {
            console.error("Lỗi tạo danh mục:", err);
            setError("Không thể tạo danh mục. Vui lòng thử lại.");
        }
    };

    return (
        <Dialog open={show} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Thêm Danh Mục Mới</DialogTitle>
            <DialogContent dividers>
                <TextField
                    fullWidth
                    label="Tên Danh Mục"
                    value={categoryName}
                    onChange={(e) => {
                        setCategoryName(e.target.value);
                        setError("");
                    }}
                    margin="normal"
                    error={!!error && !categoryName}
                />
                <TextField
                    fullWidth
                    label="Mô Tả"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    margin="normal"
                />
                {error && <FormHelperText error>{error}</FormHelperText>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button variant="contained" onClick={handleCreateCategory}>
                    Tạo
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddCategoryModal;
