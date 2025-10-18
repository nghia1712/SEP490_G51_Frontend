import React, { useState, useEffect } from "react";
import useCategory from "../../Hooks/useCategory";
// import useInventory from "../../Hooks/useInventory"; // Commented out - will be developed later
import useSupplier from "../../Hooks/useSupplier";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, FormControl,
    InputLabel, Select, MenuItem, FormHelperText, Button, Box, CircularProgress, Alert, Typography, Checkbox,
    FormGroup, FormControlLabel, IconButton
} from "@mui/material";

const AddProductModal = ({ open, handleClose, onSaveSuccess, createProduct, checkProductName }) => {
    const [productData, setProductData] = useState({
        productName: "",
        categoryId: "",
        totalStock: 0,
        thresholdStock: 0, // Thêm trường ngưỡng tồn kho
        productImage: null,
        unit: "",
        location: [],
        status: "active",
        supplierId: "",
        quantitative: "",
    });
    // const [selectedInventory, setSelectedInventory] = useState(""); // Commented out - will be developed later
    // const [inventoryStock, setInventoryStock] = useState(""); // Commented out - will be developed later
    const [imagePreview, setImagePreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [hasSupplier, setHasSupplier] = useState(false);

    // Use category hook
    const { categories, getAllCategories } = useCategory();
    // Use inventory hook
    // const { inventories, fetchInventories } = useInventory(); // Commented out - will be developed later
    // Use supplier hook
    const { suppliers, fetchSuppliers } = useSupplier();

    // console.log("Invetories:", inventories); // Commented out - will be developed later
    useEffect(() => {
        if (open) {
            getAllCategories();
            // fetchInventories(); // Commented out - will be developed later
            fetchSuppliers();
        } else {
            setProductData({
                productName: "", categoryId: "", totalStock: 0,
                productImage: null, unit: "", status: "active",
                location: [],
                supplierId: "",
            });
            // setSelectedInventory(""); // Commented out - will be developed later
            // setInventoryStock(""); // Commented out - will be developed later
            setErrors({});
            setImagePreview(null);
            setLoading(false);
            setHasSupplier(false);
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProductData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProductData((prev) => ({ ...prev, productImage: file }));
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        } else {
            setProductData((prev) => ({ ...prev, productImage: null }));
            setImagePreview(null);
        }
        if (errors.productImage) {
            setErrors((prev) => ({ ...prev, productImage: "" }));
        }
    };

    // Handle inventory selection and stock input
    // const handleInventorySelect = (e) => { // Commented out - will be developed later
    //     setSelectedInventory(e.target.value);
    //     setInventoryStock("");
    //     setErrors((prev) => ({ ...prev, location: "" }));
    // };

    // const handleInventoryStockInput = (e) => { // Commented out - will be developed later
    //     setInventoryStock(e.target.value);
    //     setErrors((prev) => ({ ...prev, location: "" }));
    // };

    // const handleAddInventory = () => { // Commented out - will be developed later
    //     if (!selectedInventory || inventoryStock === "" || Number(inventoryStock) < 0) {
    //         setErrors((prev) => ({
    //             ...prev,
    //             location: "Vui lòng chọn kệ và nhập số lượng tồn kho hợp lệ."
    //         }));
    //         return;
    //     }
    //     // Prevent duplicate inventory
    //     if (productData.location.some(inv => inv.inventoryId === selectedInventory)) {
    //         setErrors((prev) => ({
    //             ...prev,
    //             location: "Kệ đã được thêm."
    //         }));
    //         return;
    //     }

    //     // Kiểm tra sức chứa định lượng của kệ
    //     const inventoryObj = inventories.find(i => i._id === selectedInventory);
    //     if (inventoryObj) {
    //         const productQuantitative = Number(productData.quantitative) || 0;
    //         const addQuantitative = Number(inventoryStock) * productQuantitative;
    //         const availableQuantitative = (Number(inventoryObj.maxQuantitative) || 0) - (Number(inventoryObj.currentQuantitative) || 0);

    //         if (addQuantitative > availableQuantitative) {
    //             setErrors((prev) => ({
    //                 ...prev,
    //                 location: `Kệ này chỉ còn sức chứa định lượng tối đa là ${availableQuantitative}. Sản phẩm bạn thêm vượt quá sức chứa.`
    //             }));
    //             return;
    //         }
    //     }

    //     setProductData((prev) => ({
    //         ...prev,
    //         location: [
    //             ...prev.location,
    //             { inventoryId: selectedInventory, stock: Number(inventoryStock) }
    //         ]
    //     }));
    //     setSelectedInventory("");
    //     setInventoryStock("");
    // };

    // const handleRemoveInventory = (inventoryId) => { // Commented out - will be developed later
    //     setProductData((prev) => ({
    //         ...prev,
    //         location: prev.location.filter(inv => inv.inventoryId !== inventoryId)
    //     }));
    // };

    const handleSupplierCheck = (e) => {
        setHasSupplier(e.target.checked);
        if (!e.target.checked) {
            setProductData((prev) => ({ ...prev, supplierId: "" }));
        }
    };

    const handleSupplierSelect = (e) => {
        setProductData((prev) => ({ ...prev, supplierId: e.target.value }));
        if (errors.supplierId) {
            setErrors((prev) => ({ ...prev, supplierId: "" }));
        }
    };

    const validate = async () => {
        let tempErrors = {};
        tempErrors.productName = productData.productName ? "" : "Tên thuốc không được bỏ trống.";
        tempErrors.categoryId = productData.categoryId ? "" : "Vui lòng chọn danh mục.";
        tempErrors.unit = productData.unit ? "" : "Đơn vị không được bỏ trống.";
        tempErrors.totalStock = productData.totalStock && Number(productData.totalStock) >= 0 ? "" : "Tổng số lượng phải là số dương.";
        tempErrors.quantitative = productData.quantitative !== "" && !isNaN(productData.quantitative) ? "" : "Định lượng không hợp lệ.";
        if (!productData.productImage) {
            tempErrors.productImage = "Vui lòng chọn hình ảnh thuốc.";
        } else if (!["image/jpeg", "image/png"].includes(productData.productImage.type)) {
            tempErrors.productImage = "Hình ảnh phải là định dạng JPEG hoặc PNG.";
        } else {
            tempErrors.productImage = "";
        }
        // Validate inventories
        // if (!productData.location.length) {
        //     tempErrors.location = "Vui lòng thêm ít nhất một kệ và số lượng tồn kho.";
        // } else if (productData.location.some(inv => !inv.stock || inv.stock < 0)) {
        //     tempErrors.location = "Số lượng tồn kho phải là số >= 0.";
        // } else {
        //     tempErrors.location = "";
        // }
        // Validate supplier if checked
        if (hasSupplier && !productData.supplierId) {
            tempErrors.supplierId = "Vui lòng chọn nhà cung cấp.";
        } else {
            tempErrors.supplierId = "";
        }
        setErrors(tempErrors);

        const isFormValid = Object.values(tempErrors).every((x) => x === "");
        return isFormValid;
    };

    const handleSave = async () => {
        setErrors(prev => ({ ...prev, general: "" }));
        if (await validate()) {
            setLoading(true);
            const formData = new FormData();
            Object.entries(productData).forEach(([key, value]) => {
                if (key === "location") {
                    // Commented out - will be developed later
                    // value.forEach((loc, idx) => {
                    //     formData.append(`location[${idx}][inventoryId]`, loc.inventoryId);
                    //     formData.append(`location[${idx}][stock]`, loc.stock);
                    // });
                } else {
                    formData.append(key, value);
                }
            });

            try {
                await createProduct(formData);
                onSaveSuccess();
            } catch (error) {
                setErrors((prev) => ({ ...prev, general: error?.message || "Có lỗi xảy ra." }));
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Thêm Thuốc</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {errors.general && <Alert severity="error">{errors.general}</Alert>}
                    <TextField autoFocus name="productName" label="Tên Thuốc" value={productData.productName} onChange={handleChange} error={!!errors.productName} helperText={errors.productName} fullWidth />
                    <FormControl fullWidth error={!!errors.categoryId}>
                        <InputLabel id="category-select-label">Danh Mục</InputLabel>
                        <Select labelId="category-select-label" name="categoryId" value={productData.categoryId} label="Danh Mục" onChange={handleChange}>
                            <MenuItem value=""><em>Chọn danh mục</em></MenuItem>
                            {categories.map((cat) => (<MenuItem key={cat._id} value={cat._id}>{cat.categoryName}</MenuItem>))}
                        </Select>
                        {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
                    </FormControl>
                    <TextField name="unit" label="Đơn Vị (ví dụ: cái, hộp, kg)" value={productData.unit} onChange={handleChange} error={!!errors.unit} helperText={errors.unit} fullWidth />
                    <TextField
                        name="totalStock"
                        label="Tổng Số Lượng"
                        type="number"
                        value={productData.totalStock}
                        onChange={handleChange}
                        error={!!errors.totalStock}
                        helperText={errors.totalStock}
                        fullWidth
                        inputProps={{ min: 0 }}
                    />
                    <TextField
                        name="quantitative"
                        label="Định lượng (Quantitative)"
                        type="number"
                        value={productData.quantitative}
                        onChange={handleChange}
                        error={!!errors.quantitative}
                        helperText={errors.quantitative}
                        fullWidth
                    />
                    <TextField
                        name="thresholdStock"
                        label="Ngưỡng tồn kho"
                        type="number"
                        value={productData.thresholdStock}
                        onChange={handleChange}
                        fullWidth
                        inputProps={{ min: 0 }}
                    />
                    {/* Inventory selection */}
                    {/* <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Chọn kệ và nhập tồn kho cho từng kệ:</Typography>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                            <FormControl sx={{ minWidth: 160 }}>
                                <InputLabel id="inventory-select-label">Kệ</InputLabel>
                                <Select
                                    labelId="inventory-select-label"
                                    value={selectedInventory}
                                    label="Kệ"
                                    onChange={handleInventorySelect}
                                >
                                    <MenuItem value=""><em>Chọn kệ</em></MenuItem>
                                    {inventories
                                        .filter(inv => !productData.location.some(i => i.inventoryId === inv._id))
                                        .map(inv => (
                                            <MenuItem key={inv._id} value={inv._id}>{inv.name}</MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                            <TextField
                                type="number"
                                label="Tồn kho"
                                size="small"
                                inputProps={{ min: 0 }}
                                value={inventoryStock}
                                onChange={handleInventoryStockInput}
                                sx={{ width: 120 }}
                            />
                            <Button variant="contained" onClick={handleAddInventory}>Thêm</Button>
                        </Stack>
                        {productData.location.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle2">Danh sách kệ đã chọn:</Typography>
                                {productData.location.map(inv => {
                                    const inventoryObj = inventories.find(i => i._id === inv.inventoryId);
                                    return (
                                        <Stack direction="row" alignItems="center" spacing={2} key={inv.inventoryId} sx={{ mb: 1 }}>
                                            <Typography sx={{ minWidth: 100 }}>{inventoryObj ? inventoryObj.name : inv.inventoryId}</Typography>
                                            <Typography sx={{ minWidth: 80 }}>Tồn kho: {inv.stock}</Typography>
                                            <Button variant="outlined" color="error" size="small" onClick={() => handleRemoveInventory(inv.inventoryId)}>Xóa</Button>
                                        </Stack>
                                    );
                                })}
                            </Box>
                        )}
                        {errors.location && <FormHelperText error>{errors.location}</FormHelperText>}
                    </Box> */}
                    <FormControl fullWidth>
                        <InputLabel id="status-select-label">Trạng Thái</InputLabel>
                        <Select labelId="status-select-label" name="status" value={productData.status} label="Trạng Thái" onChange={handleChange}>
                            <MenuItem value="active">Đang bán</MenuItem>
                            <MenuItem value="inactive">Ngừng bán</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="outlined" component="label" color={errors.productImage ? "error" : "primary"}>
                        Chọn Hình Ảnh
                        <input type="file" hidden accept="image/png, image/jpeg" onChange={handleFileChange} />
                    </Button>
                    {errors.productImage && <FormHelperText error>{errors.productImage}</FormHelperText>}
                    {imagePreview && <Box sx={{ mt: 2, textAlign: 'center' }}><img src={imagePreview} alt="Xem trước thuốc" style={{ maxWidth: "200px", height: "auto", borderRadius: '8px' }} /></Box>}
                    {/* Supplier checkbox and selection */}
                    <Box sx={{ mt: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={hasSupplier}
                                    onChange={handleSupplierCheck}
                                    color="primary"
                                />
                            }
                            label="Thuốc này có nhà cung cấp"
                        />
                        {hasSupplier && (
                            <FormControl fullWidth sx={{ mt: 2 }} error={!!errors.supplierId}>
                                <InputLabel id="supplier-select-label">Chọn nhà cung cấp</InputLabel>
                                <Select
                                    labelId="supplier-select-label"
                                    value={productData.supplierId}
                                    label="Chọn nhà cung cấp"
                                    onChange={handleSupplierSelect}
                                >
                                    <MenuItem value=""><em>Chọn nhà cung cấp</em></MenuItem>
                                    {suppliers.map(sup => (
                                        <MenuItem key={sup._id} value={sup._id}>{sup.name}</MenuItem>
                                    ))}
                                </Select>
                                {errors.supplierId && <FormHelperText>{errors.supplierId}</FormHelperText>}
                            </FormControl>
                        )}
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={handleClose} disabled={loading} color="secondary">Hủy</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : "Lưu Thuốc"}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddProductModal;