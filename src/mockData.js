// Mock data cho demo frontend theo cấu trúc database thực tế
export const mockRoles = [
  { id: 1, name: "staff" },
  { id: 2, name: "customer" },
  { id: 3, name: "manager" }
];

export const mockAccounts = [
  {
    id: 1,
    fullName: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    password: "123456",
    phoneNumber: "0123456789",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    roleId: 1, // staff
    status: "active",
    createAt: "2024-01-15T08:00:00Z"
  },
  {
    id: 2,
    fullName: "Trần Thị B", 
    email: "tranthib@example.com",
    password: "123456",
    phoneNumber: "0987654321",
    address: "456 Đường XYZ, Quận 2, TP.HCM",
    roleId: 2, // customer
    status: "active",
    createAt: "2024-01-20T10:30:00Z"
  },
  {
    id: 3,
    fullName: "Lê Văn C",
    email: "levanc@example.com", 
    password: "123456",
    phoneNumber: "0369852147",
    address: "789 Đường DEF, Quận 3, TP.HCM",
    roleId: 1, // staff
    status: "active",
    createAt: "2024-02-01T14:15:00Z"
  }
  ,
  {
    id: 4,
    fullName: "Quản Trị Viên",
    email: "manager@example.com",
    password: "123456",
    phoneNumber: "0900000000",
    address: "1 Đường Quản Trị, Quận 1, TP.HCM",
    roleId: 3, // manager
    status: "active",
    createAt: "2024-02-10T09:00:00Z"
  }
];

export const mockStaffProfiles = [
  {
    staff_profile_id: 1,
    user_id: 1,
    employee_code: "EMP001",
    department: "IT Department",
    notes: "Nhân viên IT chuyên về frontend development"
  },
  {
    staff_profile_id: 2,
    user_id: 3,
    employee_code: "EMP002", 
    department: "Marketing Department",
    notes: "Nhân viên Marketing chuyên về digital marketing"
  }
];

export const mockCustomerProfiles = [
  {
    customer_profile_id: 1,
    user_id: 2,
    MST: "0123456789",
    ImageCNKD: "/images/customer/cccd_001.jpg",
    ImageBYT: "/images/customer/medical_001.jpg",
    MSHKD: "MSHKD001"
  }
];

// Mock tokens
export const mockTokens = {
  "demo-token-1": {
    userId: 1,
    roleId: 1, // staff
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  },
  "demo-token-2": {
    userId: 2,
    roleId: 2, // customer
    exp: Date.now() + 24 * 60 * 60 * 1000
  },
  "demo-token-3": {
    userId: 3,
    roleId: 1, // staff
    exp: Date.now() + 24 * 60 * 60 * 1000
  },
  "demo-token-4": {
    userId: 4,
    roleId: 3, // manager
    exp: Date.now() + 24 * 60 * 60 * 1000
  }
};

// Helper functions để lấy thông tin user đầy đủ
const getUserWithProfile = (accountId) => {
  const account = mockAccounts.find(a => a.id === accountId);
  if (!account) return null;
  
  const role = mockRoles.find(r => r.id === account.roleId);
  let profile = null;
  
  if (account.roleId === 1) { // staff
    profile = mockStaffProfiles.find(p => p.user_id === accountId);
  } else if (account.roleId === 2) { // customer
    profile = mockCustomerProfiles.find(p => p.user_id === accountId);
  }
  
  return {
    ...account,
    role: role,
    profile: profile
  };
};

// Mock API responses
export const mockResponses = {
  login: (credentials) => {
    const account = mockAccounts.find(a => a.email === credentials.email);
    if (account && credentials.password === account.password) {
      const token = `demo-token-${account.id}`;
      const user = getUserWithProfile(account.id);
      return {
        success: true,
        token: token,
        user: user,
        message: "Đăng nhập thành công!"
      };
    }
    throw new Error("Email hoặc mật khẩu không đúng!");
  },
  
  register: (form) => {
    // Kiểm tra email đã tồn tại
    const existingAccount = mockAccounts.find(a => a.email === form.email);
    if (existingAccount) {
      throw new Error("Email đã được sử dụng!");
    }
    
    return {
      success: true,
      message: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản."
    };
  },
  
  getCurrentUser: (token) => {
    const tokenData = mockTokens[token];
    if (!tokenData) {
      throw new Error("Token không hợp lệ!");
    }
    
    const user = getUserWithProfile(tokenData.userId);
    if (!user) {
      throw new Error("Không tìm thấy người dùng!");
    }
    
    return user;
  },
  
  forgotPassword: (data) => {
    const account = mockAccounts.find(a => 
      a.email === data.email && a.phoneNumber === data.phoneNumber
    );
    
    if (!account) {
      throw new Error("Email hoặc số điện thoại không đúng!");
    }
    
    return {
      success: true,
      message: "Mật khẩu mới đã được gửi đến email của bạn!"
    };
  },
  
  editProfile: (token, formData) => {
    const tokenData = mockTokens[token];
    if (!tokenData) {
      throw new Error("Token không hợp lệ!");
    }
    
    const account = mockAccounts.find(a => a.id === tokenData.userId);
    if (!account) {
      throw new Error("Không tìm thấy người dùng!");
    }
    
    // Cập nhật thông tin account
    account.fullName = formData.get("fullName") || account.fullName;
    account.phoneNumber = formData.get("phoneNumber") || account.phoneNumber;
    account.address = formData.get("address") || account.address;
    
    // Cập nhật thông tin profile dựa trên role
    if (account.roleId === 1) { // staff
      const staffProfile = mockStaffProfiles.find(p => p.user_id === account.id);
      if (staffProfile) {
        staffProfile.employee_code = formData.get("employee_code") || staffProfile.employee_code;
        staffProfile.department = formData.get("department") || staffProfile.department;
        staffProfile.notes = formData.get("notes") || staffProfile.notes;
      }
    } else if (account.roleId === 2) { // customer
      const customerProfile = mockCustomerProfiles.find(p => p.user_id === account.id);
      if (customerProfile) {
        customerProfile.MST = formData.get("MST") || customerProfile.MST;
        customerProfile.MSHKD = formData.get("MSHKD") || customerProfile.MSHKD;
      }
    }
    
    const updatedUser = getUserWithProfile(account.id);
    return {
      success: true,
      message: "Cập nhật thông tin thành công!",
      user: updatedUser
    };
  },
  
  changePassword: (token, data) => {
    const tokenData = mockTokens[token];
    if (!tokenData) {
      throw new Error("Token không hợp lệ!");
    }
    
    const account = mockAccounts.find(a => a.id === tokenData.userId);
    if (!account) {
      throw new Error("Không tìm thấy người dùng!");
    }
    
    // Mock validation - trong thực tế sẽ kiểm tra oldPassword
    if (data.oldPassword !== account.password) {
      throw new Error("Mật khẩu cũ không đúng!");
    }
    
    if (data.newPassword !== data.confirmPassword) {
      throw new Error("Mật khẩu mới không khớp!");
    }
    
    // Cập nhật mật khẩu
    account.password = data.newPassword;
    
    return {
      success: true,
      message: "Đổi mật khẩu thành công!"
    };
  }
};
