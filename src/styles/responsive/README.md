# Responsive Styles Documentation

## Tổng quan

Thư mục này chứa các file CSS responsive được tổ chức theo category để dễ quản lý và bảo trì.

## Cấu trúc

```
styles/responsive/
├── index.css                    # File chính import tất cả các file responsive
├── admin.responsive.css         # Responsive cho Admin Components
├── product.responsive.css       # Responsive cho Product Components
├── category.responsive.css      # Responsive cho Category Components
├── sales.responsive.css         # Responsive cho Sales Components
├── purchases.responsive.css     # Responsive cho Purchases Components
├── warehouse.responsive.css     # Responsive cho Warehouse Components
├── customer.responsive.css      # Responsive cho Customer Components
├── supplier.responsive.css      # Responsive cho Supplier Components
├── invoice.responsive.css       # Responsive cho Invoice Components
└── utils.responsive.css         # Responsive cho Utils (Header, Footer, Common)
```

## Breakpoints

Các breakpoint được sử dụng trong toàn bộ dự án:

- **Mobile**: `max-width: 576px` (xs)
- **Tablet**: `max-width: 768px` (sm)
- **Desktop**: `max-width: 992px` (md)
- **Large Desktop**: `max-width: 1200px` (lg)
- **Extra Large**: `max-width: 1400px` (xl)

## Cách sử dụng

### 1. Import vào ứng dụng

File `index.css` đã được import vào `src/index.jsx`:

```jsx
import './styles/responsive/index.css';
```

### 2. Áp dụng class CSS vào component

#### Modal Responsive

```jsx
// Detail Modal
<Modal className="user-detail-modal" ...>
  ...
</Modal>

// Image Preview Modal
<Modal className="image-preview-modal" ...>
  ...
</Modal>

// Create Staff Modal
<Modal className="create-staff-modal" ...>
  ...
</Modal>
```

#### Table Responsive

```jsx
<Table className="user-list-table" ...>
  ...
</Table>
```

#### Form Responsive

```jsx
<Form className="user-filter-section" ...>
  ...
</Form>
```

#### Image Responsive

```jsx
<img className="customer-document-image" ... />
<div className="customer-document-container">
  ...
</div>
```

## Class CSS có sẵn

### ⚠️ LƯU Ý QUAN TRỌNG
Tất cả các component trong dự án đều sử dụng **MUI (Material-UI)**, không phải Bootstrap. Các class CSS đã được cập nhật để hỗ trợ MUI components.

### Admin Components

**Bootstrap (Legacy):**
- `.user-detail-modal` - Modal chi tiết người dùng (Bootstrap Modal)
- `.image-preview-modal` - Modal xem ảnh (Bootstrap Modal)
- `.create-staff-modal` - Modal tạo nhân viên (Bootstrap Modal)
- `.user-list-table` - Bảng danh sách người dùng (Bootstrap Table)
- `.user-filter-section` - Phần filter (Bootstrap Form)
- `.user-action-buttons` - Các nút hành động (Bootstrap Buttons)
- `.customer-document-image` - Ảnh tài liệu khách hàng
- `.customer-document-container` - Container ảnh tài liệu

### Product Components (MUI)

- `.product-list-table-container` - Container với scroll ngang cho table
- `.product-list-table` - Bảng danh sách sản phẩm (MUI Table)
- `.product-list-title` - Tiêu đề danh sách sản phẩm
- `.product-modal-mui` - Dialog sản phẩm (MUI Dialog)
- `.product-image-gallery` - Gallery ảnh sản phẩm
- `.product-form-mui` - Form sản phẩm (MUI Grid)
- `.product-search-filter-mui` - Tìm kiếm và filter (MUI Components)

### Category Components (MUI)

- `.category-list-table-container` - Container với scroll ngang cho table
- `.category-list-table` - Bảng danh mục (MUI Table)
- `.category-list-title` - Tiêu đề danh sách danh mục
- `.category-modal-mui` - Dialog danh mục (MUI Dialog)
- `.category-form-mui` - Form danh mục (MUI Grid)
- `.category-search-filter-mui` - Tìm kiếm và filter (MUI Components)

### Sales Components (MUI)

- `.sales-list-table-container` - Container với scroll ngang cho table
- `.sales-list-table` - Bảng bán hàng (MUI Table)
- `.sales-list-title` - Tiêu đề danh sách bán hàng
- `.sales-modal-mui` - Dialog bán hàng (MUI Dialog)
- `.sales-form-mui` - Form bán hàng (MUI Grid)
- `.sales-dashboard-grid` - Dashboard grid (CSS Grid)
- `.sales-search-filter-mui` - Tìm kiếm và filter (MUI Components)

### Purchases Components (MUI)

- `.purchases-list-table-container` - Container với scroll ngang cho table
- `.purchases-list-table` - Bảng mua hàng (MUI Table)
- `.purchases-list-title` - Tiêu đề danh sách mua hàng
- `.purchases-modal-mui` - Dialog mua hàng (MUI Dialog)
- `.purchases-form-mui` - Form mua hàng (MUI Grid)
- `.purchases-dashboard-grid` - Dashboard grid (CSS Grid)
- `.purchases-search-filter-mui` - Tìm kiếm và filter (MUI Components)

### Warehouse Components (MUI)

- `.warehouse-list-table-container` - Container với scroll ngang cho table
- `.warehouse-list-table` - Bảng kho hàng (MUI Table)
- `.warehouse-list-title` - Tiêu đề danh sách kho hàng
- `.warehouse-modal-mui` - Dialog kho hàng (MUI Dialog)
- `.warehouse-form-mui` - Form kho hàng (MUI Grid)
- `.warehouse-dashboard-grid` - Dashboard grid (CSS Grid)
- `.warehouse-search-filter-mui` - Tìm kiếm và filter (MUI Components)

### Customer Components (MUI)

- `.customer-order-list-container` - Container với scroll ngang cho table đơn hàng
- `.customer-order-list-table` - Bảng đơn hàng khách hàng (MUI Table)
- `.customer-order-list-title` - Tiêu đề danh sách đơn hàng
- `.customer-order-filter-container` - Container filter đơn hàng (MUI FormControl)
- `.customer-list-table` - Bảng khách hàng (Bootstrap Legacy)
- `.customer-modal` - Modal khách hàng (Bootstrap Legacy)
- `.customer-form` - Form khách hàng (Bootstrap Legacy)
- `.customer-dashboard-grid` - Dashboard grid (CSS Grid)
- `.customer-details-container` - Container chi tiết
- `.customer-search-filter` - Tìm kiếm và filter (Bootstrap Legacy)
- `.customer-additional-info-form` - Form thông tin bổ sung

### Supplier Components (MUI)

- `.supplier-list-table-container` - Container với scroll ngang cho table
- `.supplier-list-table` - Bảng nhà cung cấp (MUI Table)
- `.supplier-list-title` - Tiêu đề danh sách nhà cung cấp
- `.supplier-modal-mui` - Dialog nhà cung cấp (MUI Dialog)
- `.supplier-form-mui` - Form nhà cung cấp (MUI Grid)
- `.supplier-details-container` - Container chi tiết
- `.supplier-search-filter-mui` - Tìm kiếm và filter (MUI Components)
- `.supplier-product-management` - Quản lý sản phẩm

### Invoice Components (MUI)

- `.invoice-list-table-container` - Container với scroll ngang cho table
- `.invoice-list-table` - Bảng hóa đơn (MUI Table)
- `.invoice-list-title` - Tiêu đề danh sách hóa đơn
- `.invoice-modal-mui` - Dialog hóa đơn (MUI Dialog)
- `.invoice-form-mui` - Form hóa đơn (MUI Grid)
- `.invoice-details-container` - Container chi tiết
- `.invoice-search-filter-mui` - Tìm kiếm và filter (MUI Components)

### Utils Components (MUI)

**MUI Components:**
- `.app-header-mui` - Header ứng dụng (MUI AppBar)
- `.app-footer-mui` - Footer ứng dụng (MUI Box/Container)
- `.common-modal-mui` - Dialog chung (MUI Dialog)
- `.simple-header-wrapper` - Wrapper header đơn giản
- `.notification-menu` - Menu thông báo (MUI Menu)
- `.search-bar-container` - Container thanh tìm kiếm (MUI TextField)
- `.protected-route-container` - Container route được bảo vệ

**Bootstrap Legacy:**
- `.app-header` - Header ứng dụng (Bootstrap Navbar)
- `.app-footer` - Footer ứng dụng (Bootstrap Footer)
- `.common-modal` - Modal chung (Bootstrap Modal)

## Utility Classes

### Responsive Visibility

```jsx
// Ẩn trên mobile
<div className="hide-on-mobile">...</div>

// Chỉ hiển thị trên mobile
<div className="show-on-mobile">...</div>
```

### Responsive Text

```jsx
<p className="responsive-text">...</p>
```

### Responsive Padding

```jsx
<div className="responsive-padding">...</div>
```

## Best Practices

1. **Luôn sử dụng class CSS có sẵn** thay vì inline styles cho responsive
2. **Thêm class CSS mới** vào file category tương ứng nếu cần
3. **Test trên nhiều kích thước màn hình** trước khi commit
4. **Giữ code CSS gọn gàng** và có comment rõ ràng
5. **Sử dụng breakpoint chuẩn** đã định nghĩa trong `index.css`

## Ví dụ

### Ví dụ 1: MUI Dialog Responsive

```jsx
<Dialog 
  open={isOpen} 
  onClose={handleClose}
  className="product-modal-mui"
  maxWidth="lg"
  fullWidth
>
  <DialogTitle>Chi tiết sản phẩm</DialogTitle>
  <DialogContent>
    {/* Nội dung */}
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Đóng</Button>
  </DialogActions>
</Dialog>
```

### Ví dụ 2: MUI Table Responsive

```jsx
<div className="product-list-table-container">
  <TableContainer component={Paper}>
    <Table className="product-list-table">
      <TableHead>
        {/* Header */}
      </TableHead>
      <TableBody>
        {/* Body */}
      </TableBody>
    </Table>
  </TableContainer>
</div>
```

### Ví dụ 3: MUI Form Filter Responsive

```jsx
<Box className="product-search-filter-mui">
  <TextField 
    placeholder="Tìm kiếm" 
    size="small"
    fullWidth
  />
  <FormControl size="small" fullWidth>
    <InputLabel>Lọc</InputLabel>
    <Select>
      <MenuItem value="all">Tất cả</MenuItem>
    </Select>
  </FormControl>
</Box>
```

### Ví dụ 4: Bootstrap Modal (Legacy)

```jsx
<Modal 
  show={isOpen} 
  onHide={handleClose}
  className="user-detail-modal"
  centered 
  size="lg"
>
  <Modal.Header closeButton>
    <Modal.Title>Chi tiết</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {/* Nội dung */}
  </Modal.Body>
</Modal>
```

## Lưu ý

- Tất cả các file CSS responsive đã được import tự động qua `index.css`
- Không cần import từng file riêng lẻ
- Các class CSS sẽ tự động áp dụng responsive khi màn hình nhỏ hơn breakpoint
- Có thể override CSS nếu cần thiết bằng cách thêm CSS vào file category tương ứng

