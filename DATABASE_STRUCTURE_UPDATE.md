# 🗄️ Cập Nhật Cấu Trúc Database

## 📋 Tổng Quan
Đã cập nhật mock data và components để phù hợp với cấu trúc database thực tế theo ERD được cung cấp.

## 🏗️ Cấu Trúc Database Mới

### 1. **Account (Tài khoản chính)**
```javascript
{
  id: 1,
  fullName: "Nguyễn Văn A",
  email: "nguyenvana@example.com", 
  password: "123456",
  phoneNumber: "0123456789",
  address: "123 Đường ABC, Quận 1, TP.HCM",
  roleId: 1, // 1 = staff, 2 = customer
  status: "active",
  createAt: "2024-01-15T08:00:00Z"
}
```

### 2. **Role (Vai trò)**
```javascript
[
  { id: 1, name: "staff" },
  { id: 2, name: "customer" }
]
```

### 3. **Staff Profile (Hồ sơ nhân viên)**
```javascript
{
  staff_profile_id: 1,
  user_id: 1,
  employee_code: "EMP001",
  department: "IT Department", 
  notes: "Nhân viên IT chuyên về frontend development"
}
```

### 4. **Customer Profile (Hồ sơ khách hàng)**
```javascript
{
  customer_profile_id: 1,
  user_id: 2,
  MST: "0123456789",
  ImageCNKD: "/images/customer/cccd_001.jpg",
  ImageBYT: "/images/customer/medical_001.jpg", 
  MSHKD: "MSHKD001"
}
```

## 🔄 Những Thay Đổi Đã Thực Hiện

### 1. **Mock Data (`src/mockData.js`)**
- ✅ Tách riêng `mockAccounts`, `mockRoles`, `mockStaffProfiles`, `mockCustomerProfiles`
- ✅ Cập nhật `mockTokens` với `roleId` thay vì `role`
- ✅ Tạo helper function `getUserWithProfile()` để join data
- ✅ Cập nhật tất cả mock responses để phù hợp với cấu trúc mới

### 2. **ViewProfile Component**
- ✅ Hiển thị thông tin cơ bản từ Account
- ✅ Hiển thị role với badge màu sắc
- ✅ **Staff**: Hiển thị mã nhân viên, phòng ban, ghi chú
- ✅ **Customer**: Hiển thị mã số thuế, mã HKD, hình CCCD/BYT
- ✅ Hiển thị ngày tạo tài khoản

### 3. **EditProfile Component**
- ✅ Form cơ bản cho Account (fullName, phoneNumber, address)
- ✅ **Staff**: Form riêng cho employee_code, department, notes
- ✅ **Customer**: Form riêng cho MST, MSHKD
- ✅ Dynamic form dựa trên role của user
- ✅ Email không thể chỉnh sửa (disabled)

### 4. **Header Component**
- ✅ Cập nhật `getUserRole()` để trả về role name
- ✅ Navigation items dựa trên role (staff/customer)

### 5. **Mock API Responses**
- ✅ `login()`: Trả về user với role và profile đầy đủ
- ✅ `getCurrentUser()`: Join data từ Account + Role + Profile
- ✅ `editProfile()`: Cập nhật cả Account và Profile dựa trên role
- ✅ `forgotPassword()`: Sử dụng email và phoneNumber từ Account

## 🎯 Tài Khoản Demo Mới

### Staff Account 1
- **Email**: `nguyenvana@example.com`
- **Password**: `123456`
- **Role**: Staff - IT Department
- **Employee Code**: EMP001

### Customer Account
- **Email**: `tranthib@example.com`
- **Password**: `123456` 
- **Role**: Customer
- **MST**: 0123456789

### Staff Account 2
- **Email**: `levanc@example.com`
- **Password**: `123456`
- **Role**: Staff - Marketing Department
- **Employee Code**: EMP002

## 🔧 Tính Năng Mới

### 1. **Role-Based UI**
- ✅ Profile hiển thị khác nhau cho Staff vs Customer
- ✅ Edit form có trường khác nhau theo role
- ✅ Navigation menu dựa trên role

### 2. **Data Relationships**
- ✅ 1 Account có 1 Role
- ✅ 1 Account có 0 hoặc 1 Staff Profile
- ✅ 1 Account có 0 hoặc 1 Customer Profile
- ✅ Helper function để join data đúng cách

### 3. **Form Validation**
- ✅ Staff form: employee_code, department, notes
- ✅ Customer form: MST, MSHKD
- ✅ Account form: fullName, phoneNumber, address

## 🚀 Cách Test

1. **Đăng nhập với Staff account**:
   - Xem profile → Thấy thông tin nhân viên
   - Edit profile → Có form cho mã nhân viên, phòng ban

2. **Đăng nhập với Customer account**:
   - Xem profile → Thấy thông tin khách hàng  
   - Edit profile → Có form cho mã số thuế, mã HKD

3. **Test tất cả chức năng**:
   - Đăng ký, đăng nhập, quên mật khẩu
   - Xem/chỉnh sửa profile theo role
   - Đổi mật khẩu

## 📁 Files Đã Cập Nhật

- ✅ `src/mockData.js` - Cấu trúc data mới
- ✅ `src/Components/User_Components/ViewProfile.jsx` - UI theo role
- ✅ `src/Components/User_Components/EditProfile.jsx` - Form theo role  
- ✅ `src/Components/Utils/Header.jsx` - Role-based navigation
- ✅ `DEMO_GUIDE.md` - Hướng dẫn demo mới

Tất cả đã được cập nhật để phù hợp với cấu trúc database thực tế! 🎉
