# 🎯 Hướng Dẫn Demo Frontend

## 📋 Tổng Quan
Ứng dụng này được thiết kế để demo frontend với mock data, không cần backend thật.

## 🚀 Cách Chạy Demo

### 1. Cài Đặt Dependencies
```bash
npm install
```

### 2. Chạy Ứng Dụng
```bash
npm start
```

### 3. Truy Cập Ứng Dụng
Mở trình duyệt và truy cập: `http://localhost:3000`

## 👤 Tài Khoản Demo

### Tài Khoản Staff (Nhân viên)
- **Email**: `nguyenvana@example.com`
- **Mật khẩu**: `123456`
- **Vai trò**: Staff - IT Department

### Tài Khoản Customer (Khách hàng)
- **Email**: `tranthib@example.com` 
- **Mật khẩu**: `123456`
- **Vai trò**: Customer

### Tài Khoản Staff Khác
- **Email**: `levanc@example.com`
- **Mật khẩu**: `123456`
- **Vai trò**: Staff - Marketing Department

## 🎮 Các Chức Năng Demo

### 🌐 **Chức Năng Guest (Không cần đăng nhập)**

#### 1. **Tìm kiếm thuốc** (`/search-medicine`)
- Tìm kiếm thuốc theo tên, danh mục, mô tả
- Xem thông tin chi tiết thuốc
- **Kết quả**: Hiển thị danh sách thuốc phù hợp

#### 2. **Danh mục thuốc** (`/medicine-categories`)
- Xem các danh mục thuốc
- **Kết quả**: Trang đang phát triển

#### 3. **Thông tin thuốc** (`/medicine-info`)
- Xem thông tin chi tiết về thuốc
- **Kết quả**: Trang đang phát triển

#### 4. **Liên hệ** (`/contact`)
- Thông tin liên hệ nhà thuốc
- **Kết quả**: Trang đang phát triển

### 🔐 **Chức Năng Cần Đăng Nhập**

#### 5. **Đăng Ký** (`/register`)
- Điền form đăng ký với thông tin bất kỳ
- Email phải unique (không trùng với tài khoản demo)
- Mật khẩu: bất kỳ
- **Kết quả**: Thông báo đăng ký thành công

#### 6. **Đăng Nhập** (`/login`)
- Sử dụng tài khoản demo ở trên
- **Kết quả**: Chuyển hướng về trang chủ với đầy đủ chức năng

#### 7. **Quên Mật Khẩu** (`/forgot-password`)
- **Email**: `nguyenvana@example.com`
- **Số điện thoại**: `0123456789`
- **Kết quả**: Thông báo gửi email thành công

#### 8. **Xem Profile** (`/profile`)
- Hiển thị thông tin user đã đăng nhập
- **Staff**: Hiển thị mã nhân viên, phòng ban, ghi chú
- **Customer**: Hiển thị mã số thuế, mã HKD, hình CCCD/BYT
- Có thể chỉnh sửa thông tin
- Có thể đổi mật khẩu

#### 9. **Chỉnh Sửa Profile** (`/edit-profile`)
- Cập nhật thông tin cá nhân cơ bản
- **Staff**: Chỉnh sửa mã nhân viên, phòng ban, ghi chú
- **Customer**: Chỉnh sửa mã số thuế, mã HKD
- Upload avatar (demo)
- **Kết quả**: Thông báo cập nhật thành công

#### 10. **Đổi Mật Khẩu** (`/change-password`)
- **Mật khẩu cũ**: `123456`
- **Mật khẩu mới**: bất kỳ
- **Kết quả**: Thông báo đổi mật khẩu thành công

### 👥 **Chức Năng Theo Role**

#### **Staff (Nhân viên)**
- Quản lý sản phẩm
- Nhập hàng
- Xuất hàng
- Kiểm kê

#### **Customer (Khách hàng)**
- Đơn hàng của tôi
- Lịch sử mua hàng

## 🔧 Tính Năng Mock

### Mock Data
- Tất cả dữ liệu được lưu trong `src/mockData.js`
- Có 2 user demo sẵn có
- Token được mock với thời gian hết hạn 24h

### Mock API
- Tất cả API calls được mock trong `src/mockAPI.js`
- Có delay giả lập network (1-2 giây)
- Xử lý lỗi giống API thật

### Navigation
- Header hiển thị menu phù hợp với trạng thái đăng nhập
- Protected routes hoạt động bình thường
- Logout xóa token và chuyển về trang chủ

## 🎨 UI/UX Features

### Animation
- Framer Motion animations cho tất cả forms
- Loading states và transitions mượt mà
- Responsive design cho mobile/desktop

### Styling
- Bootstrap components
- Material-UI cho Header
- Custom color scheme
- Background images

## 🐛 Troubleshooting

### Lỗi Thường Gặp
1. **"Token không hợp lệ"**: Refresh trang hoặc đăng nhập lại
2. **"Email đã được sử dụng"**: Thử email khác khi đăng ký
3. **"Mật khẩu cũ không đúng"**: Sử dụng `123456` cho mật khẩu cũ

### Reset Demo
- Xóa localStorage: `localStorage.clear()`
- Refresh trang để reset hoàn toàn

## 📁 Cấu Trúc Mock

```
src/
├── mockData.js          # Dữ liệu demo
├── mockAPI.js           # API calls mock
├── Hooks/
│   ├── useAuth.jsx      # Auth logic với mock
│   └── useUser.jsx      # User logic với mock
└── Components/          # UI components
```

## 🎯 Demo Flow Hoàn Chỉnh

1. **Landing Page** → Click "Đăng nhập"
2. **Login** → Nhập tài khoản demo → Chuyển đến Profile
3. **Profile** → Xem thông tin → Click "Chỉnh sửa"
4. **Edit Profile** → Cập nhật thông tin → Save
5. **Profile** → Click "Đổi mật khẩu"
6. **Change Password** → Nhập mật khẩu mới → Confirm
7. **Header** → Click avatar → "Đăng xuất"

Tất cả các bước đều hoạt động với mock data và không cần backend!
