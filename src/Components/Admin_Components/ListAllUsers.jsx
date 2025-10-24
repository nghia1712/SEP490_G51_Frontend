//list
import React, { useEffect, useState } from "react";
import { Table, Container, Alert, Card, Button, Form, Modal } from "react-bootstrap";
import adminAPI from "../../API/adminAPI";
import CreateStaff from "./CreateStaff";
import { FaEdit, FaBan, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import EditUser from "./EditUser";

const ListAllUsers = ({ roleGroup }) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState({ "Hoạt động": false, "Không hoạt động": false });
    const [roleFilter, setRoleFilter] = useState("all");
    const [editingUser, setEditingUser] = useState(null);
    const [detailUser, setDetailUser] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchUsers = async () => {
        try {
            const response = await adminAPI.getAccountList();
            console.log("API response:", response);
            console.log("Response data:", response.data || response);
            setUsers(response.data || response);
        } catch (error) {
            console.error("Error fetching users:", error);
            setError("Không thể tải dữ liệu danh sách các người dùng.");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);
    const handleUpdateStatus = async (id, newStatus) => {
        console.log("handleUpdateStatus called:", { id, newStatus, idType: typeof id });
        try {
            if (newStatus === "banned") {
                console.log("Calling suspendAccount API with userId:", id);
                const response = await adminAPI.suspendAccount(id);
                console.log("suspendAccount response:", response);
                
                if (response?.data?.success || response?.success) {
                    alert("Đã ban tài khoản thành công!");
                    // Cập nhật ngay trạng thái trên UI
                    setUsers(prev => prev.map(u => {
                        const uid = u?.userId || u?.UserId || u?._id || u?.accountId || u?.AccountId;
                        if (String(uid) === String(id)) {
                            return { ...u, userStatus: 0, status: 'banned' };
                        }
                        return u;
                    }));
                } else {
                    alert("Có lỗi xảy ra khi ban tài khoản: " + (response?.data?.message || response?.message || "Unknown error"));
                }
            } else if (newStatus === "active") {
                console.log("Calling activeAccount API with userId:", id);
                const response = await adminAPI.activeAccount(id);
                console.log("activeAccount response:", response);
                
                if (response?.data?.success || response?.success) {
                    alert("Đã bỏ ban tài khoản thành công!");
                    // Cập nhật ngay trạng thái trên UI
                    setUsers(prev => prev.map(u => {
                        const uid = u?.userId || u?.UserId || u?._id || u?.accountId || u?.AccountId;
                        if (String(uid) === String(id)) {
                            return { ...u, userStatus: 2, status: 'active' };
                        }
                        return u;
                    }));
                } else {
                    alert("Có lỗi xảy ra khi bỏ ban tài khoản: " + (response?.data?.message || response?.message || "Unknown error"));
                }
            }
        } catch (error) {
            console.error("Error in handleUpdateStatus:", error);
            console.log("Error details:", error.response?.data);
            alert("Có lỗi xảy ra khi cập nhật trạng thái người dùng: " + (error.response?.data?.message || error.message));
        }
    };
    const handleFilterChange = (e) => {
        setFilterStatus({ ...filterStatus, [e.target.name]: e.target.checked });
    };

    const handleResetPassword = async (userId) => {
        const defaultPassword = "Pms@123456";
        if (window.confirm(`Bạn có chắc chắn muốn reset mật khẩu của nhân viên này về mặc định không?\n\nMật khẩu mới sẽ là: ${defaultPassword}`)) {
            try {
                // Gọi API reset password thực sự
                const response = await adminAPI.resetPassword(userId);
                
                if (response.data?.success) {
                    const newPassword = response.data?.data || defaultPassword;
                    
                    // Cập nhật state để hiển thị mật khẩu tạm thời
                    const user = users.find(u => (u?.userId || u?._id) === userId);
                    if (user) {
                        setUsers(prevUsers => 
                            prevUsers.map(u => 
                                (u?.userId || u?._id) === userId 
                                    ? { ...u, tempPassword: newPassword, showTempPassword: true }
                                    : u
                            )
                        );
                        
                        // Tự động ẩn mật khẩu sau 10 giây
                        setTimeout(() => {
                            setUsers(prevUsers => 
                                prevUsers.map(u => 
                                    (u?.userId || u?._id) === userId 
                                        ? { ...u, showTempPassword: false }
                                        : u
                                )
                            );
                        }, 10000);
                    }
                    
                    alert(`Mật khẩu đã được reset thành công!\nMật khẩu mới: ${newPassword}\n\nLưu ý: Mật khẩu này sẽ tự động ẩn sau 10 giây.`);
                } else {
                    alert(`Lỗi: ${response.data?.message || 'Có lỗi xảy ra khi reset mật khẩu'}`);
                }
            } catch (error) {
                console.log("Lỗi khi reset mật khẩu:", error);
                alert('Có lỗi xảy ra khi reset mật khẩu');
            }
        }
    };

  // Fetch account details for a given user (supports multiple id shapes)
  const openDetail = async (user) => {
    try {
      const id = user?.userId || user?.UserId || user?._id || user?.accountId || user?.AccountId;
      console.log("=== openDetail Debug ===");
      console.log("openDetail - user data:", user);
      console.log("openDetail - user ID:", id);
      if (!id) return;
      const response = await adminAPI.getAccountDetails(id);
      console.log("getAccountDetails response:", response);
      console.log("getAccountDetails response.data:", response.data);
      
      // Unwrap common API shapes: axios { data }, and backend { success, data }
      const data = (response?.data && (response.data.data ?? response.data)) || response;
      console.log("Account details data:", data);
      console.log("Account details data.avatar:", data?.avatar);
      
      // Merge: keep fields from list row (like role), override with detail fields when present
      const merged = (data && typeof data === 'object') ? { ...(user || {}), ...data } : (user || data);
      console.log("Merged user data:", merged);
      console.log("Merged user data.avatar:", merged?.avatar);
      console.log("Avatar is null/empty:", !merged?.avatar || merged?.avatar === '');
      
      setDetailUser(merged);
      setIsDetailOpen(true);
    } catch (err) {
      console.log("getAccountDetails error:", err);
      // Fallback: still open with current row data
      setDetailUser(user);
      setIsDetailOpen(true);
    }
  };

    // Helper function to map role ID to Vietnamese role name
    const getRoleDisplayName = (user) => {
        console.log("getRoleDisplayName - user data:", user);
        
        // Check RoleName field first (for admin/manager/customer from backend)
        if (user?.RoleName) {
            console.log("RoleName field:", user.RoleName);
            const roleLower = user.RoleName.toLowerCase();
            if (roleLower === 'admin') return "Admin";
            if (roleLower === 'manager') return "Quản lý";
            if (roleLower === 'customer') return "Khách hàng";
        }
        
        // Check single role field (for admin/manager/customer)
        const role = user?.role || user?.roleName;
        console.log("single role:", role);
        if (typeof role === 'string') {
            const roleLower = role.toLowerCase();
            if (roleLower === 'sales_staff') return "Nhân viên Bán Hàng";
            if (roleLower === 'purchases_staff') return "Nhân viên Mua Hàng";
            if (roleLower === 'warehouse_staff') return "Nhân viên Kho";
            if (roleLower === 'accountant_staff') return "Nhân viên Kế Toán";
            if (roleLower === 'customer') return "Khách hàng";
            if (roleLower === 'manager') return "Quản lý";
            if (roleLower === 'admin') return "Admin";
            // Fallback for enum name strings ("SalesStaff", "PurchasesStaff" ...)
            if (roleLower.includes('sales')) return "Nhân viên Bán Hàng";
            if (roleLower.includes('purchase')) return "Nhân viên Mua Hàng";
            if (roleLower.includes('warehouse')) return "Nhân viên Kho";
            if (roleLower.includes('account')) return "Nhân viên Kế Toán";
        }
        
        // Check for Role field (from backend AccountList DTO) - only for staff roles
        if (user?.Role !== null && user?.Role !== undefined) {
            console.log("Role field:", user.Role);
            switch (Number(user.Role)) {
                case 0: return "Nhân viên Bán Hàng";
                case 1: return "Nhân viên Mua Hàng";
                case 2: return "Nhân viên Kho";
                case 3: return "Nhân viên Kế Toán";
                default: break;
            }
        }
        
        // Check for role field (lowercase) - only for staff roles
        if (user?.role !== null && user?.role !== undefined && typeof user.role === 'number') {
            console.log("role field:", user.role);
            switch (Number(user.role)) {
                case 0: return "Nhân viên Bán Hàng";
                case 1: return "Nhân viên Mua Hàng";
                case 2: return "Nhân viên Kho";
                case 3: return "Nhân viên Kế Toán";
                default: break;
            }
        }
        
        // Check for staff role ID across multiple possible shapes
        const staffRoleId = 
            user?.staffRole ?? user?.StaffRole ??
            user?.profile?.staffRole ?? user?.profile?.StaffRole ??
            user?.staff?.roleId ?? user?.staff?.RoleId ?? user?.staff?.staffRole ?? user?.staff?.StaffRole ??
            user?.staffProfile?.roleId ?? user?.staffProfile?.RoleId ?? user?.staffProfile?.staffRole ?? user?.staffProfile?.StaffRole;
        console.log("staffRoleId:", staffRoleId);
        
        if (staffRoleId !== null && staffRoleId !== undefined) {
            switch (Number(staffRoleId)) {
                case 0: return "Nhân viên Bán Hàng";
                case 1: return "Nhân viên Mua Hàng";
                case 2: return "Nhân viên Kho";
                case 3: return "Nhân viên Kế Toán";
                default: break;
            }
        }
        
        // Check for role name or role array
        if (Array.isArray(user?.roles)) {
            const roleName = user.roles[0]?.name || user.roles[0];
            console.log("roleName from array:", roleName);
            if (typeof roleName === 'string') {
                const roleLower = roleName.toLowerCase();
                if (roleLower === 'sales_staff') return "Nhân viên Bán Hàng";
                if (roleLower === 'purchases_staff') return "Nhân viên Mua Hàng";
                if (roleLower === 'warehouse_staff') return "Nhân viên Kho";
                if (roleLower === 'accountant_staff') return "Nhân viên Kế Toán";
                if (roleLower === 'customer') return "Khách hàng";
                if (roleLower === 'manager') return "Quản lý";
                if (roleLower === 'admin') return "Admin";
            }
        }
        
        // Check StaffRole as string enum from BE (e.g., "SalesStaff", "PurchasesStaff", ...)
        const staffRoleName = user?.StaffRoleName || user?.staffRoleName || user?.staff?.roleName || user?.staffProfile?.roleName;
        if (typeof staffRoleName === 'string') {
            const r = staffRoleName.toLowerCase();
            if (r.includes('sales')) return "Nhân viên Bán Hàng";
            if (r.includes('purchase')) return "Nhân viên Mua Hàng";
            if (r.includes('warehouse')) return "Nhân viên Kho";
            if (r.includes('account')) return "Nhân viên Kế Toán";
        }
        
        
        console.log("No role found, returning '-'");
        return '-';
    };

    // Helper function to format employee code (role + ...)
    const formatEmployeeCode = (user) => {
        const employeeCode = user?.EmployeeCode || user?.employeeCode || user?.profile?.employeeCode;
        if (!employeeCode) return '-';
        
        // Extract role from employee code (format: ROLE_TIMESTAMP)
        const role = employeeCode.split(/\d/)[0]; // Get everything before first digit
        return role ? `${role}...` : employeeCode;
    };

    // Helper function to get full employee code
    const getFullEmployeeCode = (user) => {
        return user?.EmployeeCode || user?.employeeCode || user?.profile?.employeeCode || '-';
    };

    // Determine if an account is active based on multiple possible backend shapes
    const getIsActive = (u) => {
        if (typeof u?.isActive === 'boolean') return u.isActive;
        const rawStatus = u?.userStatus ?? u?.status ?? u?.Status;
        if (typeof rawStatus === 'number') {
            // Backend enum commonly: 0=Block, 1=Inactive, 2=Active
            return Number(rawStatus) === 2;
        }
        if (typeof rawStatus === 'string') {
            const s = rawStatus.toLowerCase();
            if (s === 'active' || s === '2' || s === 'true') return true;
            if (s === 'inactive' || s === '1' || s === 'banned' || s === 'block' || s === '0' || s === 'false') return false;
        }
        // Default to not active if unclear to avoid false positives
        return false;
    };

    // Normalize gender from various shapes to Vietnamese label
    const getGenderLabelFromAny = (u) => {
        // Prefer top-level first
        let g = u?.gender ?? u?.Gender ?? u?.profile?.gender ?? u?.profile?.Gender;
        if (g === null || g === undefined) return '-';
        // Handle booleans directly
        if (typeof g === 'boolean') return g ? 'Nam' : 'Nữ';
        // Handle numbers (1/0 or 2/1 conventions)
        if (typeof g === 'number') {
            // common: 1 male, 0 female. Fallback: 2 male, 1 female
            if (g === 1 || g === 2) return 'Nam';
            if (g === 0 || g === 1) return g === 1 ? 'Nam' : 'Nữ';
        }
        // Handle strings: 'true'/'false', 'male'/'female', 'nam'/'nu'
        if (typeof g === 'string') {
            const s = g.trim().toLowerCase();
            if (s === 'true' || s === '1' || s === 'male' || s === 'nam') return 'Nam';
            if (s === 'false' || s === '0' || s === 'female' || s === 'nữ' || s === 'nu') return 'Nữ';
        }
        return '-';
    };

    const getAddressFromAny = (u) => {
        return u?.Address || u?.address || u?.profile?.address || u?.profile?.Address || '-';
    };

    // Helper function to get avatar URL from user data
    const getAvatarFromAny = (u) => {
        // Check various possible avatar field locations
        const avatar = u?.avatar || u?.Avatar || 
                      u?.profile?.avatar || u?.profile?.Avatar ||
                      u?.account?.avatar || u?.account?.Avatar ||
                      u?.imageUrl || u?.ImageUrl ||
                      u?.profileImage || u?.ProfileImage;
        
        if (avatar && avatar.trim() !== '') {
            // If it's already a full URL, return as is
            if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
                return avatar;
            }
            // If it's a relative path starting with /images/, construct full URL with correct port
            if (avatar.startsWith('/images/')) {
                // Check if path has extension
                const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(avatar);
                if (hasExtension) {
                    return `http://localhost:5137${avatar}`;
                } else {
                    // Try with .jpg extension
                    return `http://localhost:5137${avatar}.jpg`;
                }
            }
            // If it's just a filename, assume it's in the images folder
            if (avatar.startsWith('/')) {
                return `http://localhost:5137${avatar}`;
            }
            return `http://localhost:5137/images/${avatar}`;
        }
        
        return null; // No avatar found
    };

    // Helper function to truncate email for display
    const truncateEmail = (email, maxLength = 20) => {
        if (!email) return '-';
        if (email.length <= maxLength) return email;
        return email.substring(0, maxLength) + '...';
    };
    const getEmailVerificationStatus = (u) => {
        // Debug: Log the user data to see what fields are available
        console.log("Debug user data for email verification:", u);
        console.log("Available fields:", Object.keys(u || {}));
        
        // Check EmailConfirmed field from backend (ASP.NET Core Identity)
        const emailConfirmed = u?.EmailConfirmed || u?.emailConfirmed;
        
        console.log("EmailConfirmed value found:", emailConfirmed);
        console.log("EmailConfirmed type:", typeof emailConfirmed);
        
        if (emailConfirmed !== null && emailConfirmed !== undefined) {
            const result = emailConfirmed === true || emailConfirmed === 'true' || emailConfirmed === 1;
            console.log("Email verification result:", result);
            return result;
        }
        
        console.log("No EmailConfirmed field found, defaulting to false");
        // Default to false if unclear
        return false;
    };

    // Normalize roles coming from different backend shapes to lowercase keywords
    const normalizeUserRoles = (u) => {
        const collected = [];
        // roles as array: strings or objects with name
        if (Array.isArray(u?.roles)) {
            for (const r of u.roles) {
                if (typeof r === 'string') collected.push(r.toLowerCase());
                else if (r && typeof r === 'object') {
                    if (typeof r.name === 'string') collected.push(r.name.toLowerCase());
                    if (typeof r.roleName === 'string') collected.push(r.roleName.toLowerCase());
                }
            }
        }
        // single role as string
        if (typeof u?.role === 'string') collected.push(u.role.toLowerCase());
        if (typeof u?.roleName === 'string') collected.push(u.roleName.toLowerCase());
        if (typeof u?.account?.role === 'string') collected.push(u.account.role.toLowerCase());
        if (typeof u?.account?.roleName === 'string') collected.push(u.account.roleName.toLowerCase());
        // Staff role id mapping aligned with BE enum StaffRole: byte
        // SalesStaff=0, PurchasesStaff=1, WarehouseStaff=2, AccountantStaff=3
        const staffRoleId = u?.staffRole ?? u?.StaffRole ?? u?.profile?.staffRole ?? u?.staff?.roleId ?? u?.staffProfile?.roleId;
        const mapStaffRoleId = (id) => {
            switch (Number(id)) {
                case 0: return 'sales_staff';
                case 1: return 'purchases_staff';
                case 2: return 'warehouse_staff';
                case 3: return 'accountant_staff';
                default: return null;
            }
        };
        const mappedStaff = mapStaffRoleId(staffRoleId);
        if (mappedStaff) collected.push(mappedStaff);
        return collected.filter(Boolean);
    };

    // Remove Vietnamese diacritics and normalize spacing for robust text match
    const toSearchKey = (text) => {
        if (!text) return '';
        return String(text)
            .normalize('NFD')
            .replace(/\p{Diacritic}+/gu, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');
    };

    // Build a set of searchable role strings for a user, including VN display
    const getSearchableRoleKeys = (user) => {
        const keys = new Set(normalizeUserRoles(user));
        const vn = getRoleDisplayName(user); // e.g., "Nhân viên Bán Hàng"
        if (vn && vn !== '-') {
            keys.add(toSearchKey(vn));
        }
        // Also add English-ish keywords for convenience
        const map = {
            'nhan vien ban hang': 'sales_staff',
            'nhan vien mua hang': 'purchases_staff',
            'nhan vien kho': 'warehouse_staff',
            'nhan vien ke toan': 'accountant_staff',
            'sales': 'sales_staff',
            'purchases': 'purchases_staff',
            'warehouse': 'warehouse_staff',
            'accountant': 'accountant_staff',
        };
        for (const [k, v] of Object.entries(map)) keys.add(k) && keys.add(v);
        return Array.from(keys);
    };

    const filteredUsers = (users || []).filter((user) => {
        const name = (user?.fullName || user?.profile?.fullName || "").toLowerCase();
        const email = (user?.account?.email || user?.email || "").toLowerCase();
        const q = (search || "").toLowerCase();
        const matchesSearch = name.includes(q) || email.includes(q);
        
        // Only apply status and role filters for staff view
        let matchesStatus = true;
        let matchesRoleQuery = true;
        
        if (roleGroup === 'staff') {
            // Use unified status resolver
            const isActive = getIsActive(user);
            const statusLabel = isActive ? "Hoạt động" : "Không hoạt động";
            const hasAnyStatusFilter = Object.values(filterStatus || {}).some(v => v);
            matchesStatus = hasAnyStatusFilter ? !!filterStatus[statusLabel] : true;
            
            // role matching query: filter by selected role dropdown
            matchesRoleQuery = (() => {
                if (roleFilter === "all") return true;
                const roleText = getRoleDisplayName(user);
                const roleMap = {
                    "sales": "Nhân viên Bán Hàng",
                    "purchases": "Nhân viên Mua Hàng", 
                    "warehouse": "Nhân viên Kho",
                    "accountant": "Nhân viên Kế Toán"
                };
                return roleText === roleMap[roleFilter];
            })();
        }

        // Additional filter by role group for admin subpages
        let matchesRoleGroup = true;
        const normalizedRoles = normalizeUserRoles(user);
        const isCustomerFlag = user?.isCustomer === true || user?.IsCustomer === true;
        const isStaffFlag = user?.isStaff === true || user?.IsStaff === true || !!user?.Department;
        if (roleGroup === 'customer') {
            // Khách hàng: ưu tiên cờ BE, fallback theo role string
            matchesRoleGroup = isCustomerFlag || normalizedRoles.includes('customer');
        } else if (roleGroup === 'staff') {
            const staffRoles = new Set(['sales_staff','purchases_staff','warehouse_staff','accountant_staff']);
            // New BE list does not include roles or IsStaff; treat as staff if not customer and not admin/manager keywords
            const textFields = [
                user?.account?.userName,
                user?.username,
                user?.userName,
                user?.fullName,
                user?.account?.email,
                user?.email
            ].filter(Boolean).join(' ').toLowerCase();
            const looksMgmt = /\b(admin|manager)\b/.test(textFields);
            matchesRoleGroup = isStaffFlag || normalizedRoles.some(r => staffRoles.has(r)) || (!isCustomerFlag && !looksMgmt);
        } else if (roleGroup === 'manager') {
            const mgmtRoles = new Set(['manager','admin']);
            const roleMatch = normalizedRoles.some(r => mgmtRoles.has(r));
            const textFields = [
                user?.account?.userName,
                user?.username,
                user?.userName,
                user?.fullName,
                user?.account?.email,
                user?.email
            ].filter(Boolean).join(' ').toLowerCase();
            const looksAdminOrManager = /(\badmin\b|\bmanager\b)/.test(textFields);
            // Quản lý: phải là admin/manager rõ ràng hoặc theo từ khóa, đồng thời không phải KH/nhân viên
            matchesRoleGroup = (roleMatch || looksAdminOrManager) && !isCustomerFlag && !isStaffFlag;
        }
        // Admin xem được tất cả các tài khoản (staff, customer, manager)
        return matchesSearch && matchesStatus && matchesRoleQuery && matchesRoleGroup;
    });
    const isStaffView = roleGroup === 'staff';
    const isManagerView = roleGroup === 'manager';
    const isCustomerView = roleGroup === 'customer';
    const indexColStyle = { width: '50px' };
    const equalColStyle = isStaffView ? { width: '20%' } : {};
    const actionColStyle = isStaffView ? { width: '140px' } : {};
    
    // Customer view column styles
    const customerEmailColStyle = { width: '25%' };
    const customerPhoneColStyle = { width: '18%' };
    const customerAddressColStyle = { width: '18%' };
    const customerRoleColStyle = { width: '18%' };
    const customerStatusColStyle = { width: '18%' };

    // Render status badge similar to product page
    const renderStatusBadge = (statusOrUser) => {
        const isActive = typeof statusOrUser === 'object' ? getIsActive(statusOrUser) : (
            typeof statusOrUser === 'number' ? statusOrUser === 2 :
            (typeof statusOrUser === 'string' ? ['active','2','true'].includes(statusOrUser.toLowerCase()) : false)
        );
        
        return (
            <span
                style={{
                    color: 'white',
                    backgroundColor: isActive ? '#4caf50' : '#f44336',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                }}
            >
                {isActive ? 'Hoạt động' : 'Không hoạt động'}
            </span>
        );
    };

    // Render email verification status badge
    const renderEmailVerificationBadge = (user) => {
        const isEmailVerified = getEmailVerificationStatus(user);
        
        return (
            <span
                style={{
                    color: 'white',
                    backgroundColor: isEmailVerified ? '#4caf50' : '#f44336',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                }}
            >
                {isEmailVerified ? 'Kích hoạt' : 'Chưa kích hoạt'}
            </span>
        );
    };
    return (
        <Container className="mt-4" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
            {error || users.length === 0 ? (
                <Alert variant="danger" className="text-center">Không thể tải danh sách người dùng</Alert>
            ) : (
                <Card className="shadow-sm mt-3" style={{ backgroundColor: "#A8E6CF", padding: '5px', borderRadius: '15px' }}>
                    <Card.Body>

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Form className="d-flex gap-2 align-items-center" style={{ minHeight: '38px', width: '100%' }}>
                                {isStaffView ? (
                                    <>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                type="text"
                                                placeholder="Tìm kiếm theo email"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                style={{ width: "240px", height: "38px", fontSize: "1rem" }}
                                            />
                                            <Form.Select
                                                value={roleFilter}
                                                onChange={(e) => setRoleFilter(e.target.value)}
                                                style={{ width: "240px", height: "38px", fontSize: "1rem" }}
                                            >
                                                <option value="all">Tất cả</option>
                                                <option value="sales">Nhân viên Bán Hàng</option>
                                                <option value="purchases">Nhân viên Mua Hàng</option>
                                                <option value="warehouse">Nhân viên Kho</option>
                                                <option value="accountant">Nhân viên Kế Toán</option>
                                            </Form.Select>
                                        </div>
                                        <div className="d-flex align-items-center gap-3" style={{ flex: 1, justifyContent: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                                            {["Hoạt động", "Không hoạt động"].map((status) => (
                                                <Form.Check
                                                    inline
                                                    className="mb-0"
                                                    key={status}
                                                    type="checkbox"
                                                    label={<span style={{ whiteSpace: 'nowrap' }}>{status}</span>}
                                                    name={status}
                                                    checked={filterStatus[status]}
                                                    onChange={handleFilterChange}
                                                />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <Form.Control
                                        type="text"
                                        placeholder="Tìm kiếm theo email"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ width: "300px", height: "38px", fontSize: "1rem" }}
                                    />
                                )}
                            </Form>
                            {isStaffView && (
                                <Button variant="primary" onClick={() => setIsCreateOpen(true)} style={{ height: '35px', width: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    + Tạo nhân viên
                                </Button>
                            )}
                        </div>

                        <div style={{ overflowY: 'auto', maxHeight: '620px' }}>
                        <Table striped bordered hover responsive className="text-center" style={{ width: "100%", tableLayout: "fixed", fontSize: '1rem', lineHeight: 1.6 }}>
                            <thead style={{ backgroundColor: "#A8E6CF", position: "sticky", top: 0, zIndex: 1 }}>
                                <tr>
                                    <th style={indexColStyle}>#</th>
                                    <th style={isCustomerView ? customerEmailColStyle : equalColStyle}>Email</th>
                                    {isStaffView && <th style={equalColStyle}>Mã nhân viên</th>}
                                    {isStaffView && <th style={equalColStyle}>Vai trò</th>}
                                    {isStaffView && <th style={equalColStyle}>Trạng thái</th>}
                                    {isManagerView && <th>Họ tên</th>}
                                    {isManagerView && <th>Số điện thoại</th>}
                                    {isManagerView && <th>Địa chỉ</th>}
                                    {isManagerView && <th>Vai trò</th>}
                                    {roleGroup === 'customer' && <th style={customerPhoneColStyle}>Số điện thoại</th>}
                                    {roleGroup === 'customer' && <th style={customerAddressColStyle}>Địa chỉ</th>}
                                    {roleGroup === 'customer' && <th style={customerRoleColStyle}>Vai trò</th>}
                                    {roleGroup === 'customer' && <th style={customerStatusColStyle}>Kích hoạt</th>}
                                    {!isStaffView && !isManagerView && roleGroup !== 'customer' && <th>Tên đăng nhập</th>}
                                    {!isStaffView && !isManagerView && roleGroup !== 'customer' && <th>Số điện thoại</th>}
                                    {!isStaffView && !isManagerView && roleGroup !== 'customer' && <th>Vai trò</th>}
                                    {!isStaffView && !isManagerView && roleGroup !== 'customer' && <th>Họ tên</th>}
                                    {!isStaffView && !isManagerView && roleGroup !== 'customer' && <th>Giới tính</th>}
                                    {!isStaffView && !isManagerView && roleGroup !== 'customer' && <th>Địa chỉ</th>}
                                    {!isStaffView && !isManagerView && roleGroup !== 'customer' && <th>Mã nhân viên</th>}
                                    {!isStaffView && !isManagerView && roleGroup !== 'customer' && <th>Ghi chú</th>}
                                    {isStaffView ? <th style={actionColStyle}>Hành động</th> : null}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user, index) => (
                                        <React.Fragment key={index}>
                                            <tr style={{ borderTop: '10px solid #A8E6CF', cursor: isManagerView ? 'default' : 'pointer' }} onClick={(e) => {
                                                // Avoid triggering on row click when pressing buttons inside actions
                                                if ((e.target.closest && e.target.closest('[data-row-action]'))) return;
                                                // Only allow detail view for non-manager pages
                                                if (!isManagerView) {
                                                    openDetail(user);
                                                }
                                            }}>
                                                <td style={indexColStyle}>{index + 1}</td>
                                                <td style={isCustomerView ? customerEmailColStyle : equalColStyle}>{truncateEmail(user?.account?.email || user?.email)}</td>
                                                {isStaffView ? (
                                                    <td style={equalColStyle}>
                                                        <span 
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => handleViewDetail(user)}
                                                            title={`Click để xem chi tiết: ${getFullEmployeeCode(user)}`}
                                                        >
                                                            {formatEmployeeCode(user)}
                                                        </span>
                                                    </td>
                                                ) : null}
                                                {isStaffView ? (
                                                    <td style={equalColStyle}>{getRoleDisplayName(user)}</td>
                                                ) : null}
                                                {isStaffView && (
                                                    <td style={equalColStyle}>
                                                        {renderStatusBadge(user)}
                                                    </td>
                                                )}
                                                {isManagerView && (
                                                    <>
                                                        <td>{user?.fullName || user?.profile?.fullName || '-'}</td>
                                                        <td>{user?.profile?.phoneNumber || user?.phoneNumber || '-'}</td>
                                                        <td className="text-center">{user?.profile?.address || user?.address || '-'}</td>
                                                        <td>{getRoleDisplayName(user)}</td>
                                                    </>
                                                )}
                                                {roleGroup === 'customer' && (
                                                    <>
                                                        <td style={customerPhoneColStyle}>{user?.profile?.phoneNumber || user?.phoneNumber || '-'}</td>
                                                        <td style={customerAddressColStyle} className="text-center">{user?.profile?.address || user?.address || '-'}</td>
                                                        <td style={customerRoleColStyle}>{getRoleDisplayName(user)}</td>
                                                        <td style={customerStatusColStyle}>{renderEmailVerificationBadge(user)}</td>
                                                    </>
                                                )}
                                                {!isStaffView && !isManagerView && roleGroup !== 'customer' && (
                                                    <>
                                                        <td>{getRoleDisplayName(user)}</td>
                                                <td className="text-start">{user?.fullName || user?.profile?.fullName || '-'}</td>
                                                <td>{user?.gender !== null && user?.gender !== undefined ? (user.gender === true ? "Nam" : "Nữ") : '-'}</td>
                                                <td className="text-center">{user?.profile?.address || user?.address || '-'}</td>
                                                <td>
                                                    <span 
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleViewDetail(user)}
                                                        title={`Click để xem chi tiết: ${getFullEmployeeCode(user)}`}
                                                    >
                                                        {formatEmployeeCode(user)}
                                                    </span>
                                                </td>
                                                <td className="text-start">{user?.Notes || user?.notes || user?.profile?.notes || '-'}</td>
                                                    </>
                                                )}
                                                {isStaffView ? (
                                                    <td style={actionColStyle}>
                                                        <div className="d-flex align-items-center justify-content-center gap-3" data-row-action>
                                                            <Button variant="warning" size="sm" onClick={() => setEditingUser(user)} style={{ opacity: (!getIsActive(user)) ? 0.5 : 1, padding: "2px 6px", fontSize: "0.8rem" }} disabled={!getIsActive(user)}>
                                                                <FaEdit /> Sửa
                                                            </Button>
                                                            {(() => {
                                                                // Check if user is active (can login)
                                                                const isActive = getIsActive(user);
                                                                
                                                                if (isActive) {
                                                                    return (
                                                                        <Button variant="danger" size="sm" onClick={() => handleUpdateStatus(user._id || user?.userId, "banned")} style={{ padding: "2px 6px", fontSize: "0.8rem" }}>
                                                                        <FaBan /> Ban
                                                                    </Button>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <Button variant="success" size="sm" onClick={() => handleUpdateStatus(user._id || user?.userId, "active")} style={{ padding: "2px 6px", fontSize: "0.8rem" }}>
                                                                        Bỏ ban
                                                                    </Button>
                                                                    );
                                                                }
                                                            })()}
                                                        </div>
                                                    </td>
                                                ) : null}

                                            </tr>
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={
                                            isStaffView ? "5" : 
                                            (isManagerView ? "5" : 
                                            (roleGroup === 'customer' ? "6" : "8"))
                                        } className="text-center">Không tìm thấy người dùng nào</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                        </div>
                    </Card.Body>
                </Card>
            )}
            {/* Detail Modal */}
            <Modal show={isDetailOpen} onHide={() => setIsDetailOpen(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Thông tin tài khoản</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {detailUser ? (
                        <div className="container-fluid">
                            <div className="row">
                                {/* Avatar Column */}
                                <div className="col-md-3 text-center mb-3">
                                    {(() => {
                                        const avatarUrl = getAvatarFromAny(detailUser);
                                        if (avatarUrl) {
                                            return (
                                                <img 
                                                    src={avatarUrl} 
                                                    alt="Avatar" 
                                                    style={{
                                                        width: '100px',
                                                        height: '100px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: '3px solid #A8E6CF',
                                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = '/images/avatar/image1.png';
                                                    }}
                                                />
                                            );
                                        } else {
                                            return (
                                                <img 
                                                    src="/images/avatar/image1.png" 
                                                    alt="Default Avatar" 
                                                    style={{
                                                        width: '100px',
                                                        height: '100px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: '3px solid #A8E6CF',
                                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = '/images/avatar/image1.png';
                                                    }}
                                                />
                                            );
                                        }
                                    })()}
                                </div>
                                
                                {/* Information Column */}
                                <div className="col-md-9">
                                    <div className="row mb-2">
                                        <div className="col-sm-4 fw-bold">Email</div>
                                        <div className="col-sm-8">{detailUser?.email || detailUser?.account?.email || '-'}</div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-sm-4 fw-bold">Số điện thoại</div>
                                        <div className="col-sm-8">{detailUser?.phoneNumber || detailUser?.profile?.phoneNumber || '-'}</div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-sm-4 fw-bold">Vai trò</div>
                                        <div className="col-sm-8">{getRoleDisplayName(detailUser) || '-'}</div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-sm-4 fw-bold">Họ tên</div>
                                        <div className="col-sm-8">{detailUser?.fullName || detailUser?.profile?.fullName || '-'}</div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-sm-4 fw-bold">Giới tính</div>
                                        <div className="col-sm-8">{getGenderLabelFromAny(detailUser)}</div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-sm-4 fw-bold">Địa chỉ</div>
                                        <div className="col-sm-8">{getAddressFromAny(detailUser)}</div>
                                    </div>
                                    {/* Only show employee code and notes for staff accounts */}
                                    {!isCustomerView && (
                                        <>
                                            <div className="row mb-2">
                                                <div className="col-sm-4 fw-bold">Mã nhân viên</div>
                                                <div className="col-sm-8">
                                                    <code style={{ backgroundColor: '#f8f9fa', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9em' }}>
                                                        {getFullEmployeeCode(detailUser)}
                                                    </code>
                                                </div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-sm-4 fw-bold">Ghi chú</div>
                                                <div className="col-sm-8">{detailUser?.Notes || detailUser?.notes || detailUser?.profile?.notes || '-'}</div>
                                            </div>
                                        </>
                                    )}
                                    {/* Only show department for staff accounts */}
                                    {!isCustomerView && (detailUser?.department || detailUser?.profile?.department) && (
                                        <div className="row mb-2">
                                            <div className="col-sm-4 fw-bold">Phòng ban</div>
                                            <div className="col-sm-8">{detailUser?.department || detailUser?.profile?.department}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>Đang tải...</div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
                </Modal.Footer>
            </Modal>
            {/* Chỉ cho phép tạo nhân viên trong trang nhân viên */}
            {isStaffView && (
                <Modal show={isCreateOpen} onHide={() => setIsCreateOpen(false)} centered size="xl" contentClassName="p-0">
                    <Modal.Body className="p-4">
                        <CreateStaff 
                            onClose={() => setIsCreateOpen(false)} 
                            onCreated={async () => {
                                await fetchUsers();
                            }}
                        />
                    </Modal.Body>
                </Modal>
            )}
            <EditUser
                user={editingUser}
                closeModal={() => setEditingUser(null)}
                users={users}
                setUsers={setUsers}
            />
        </Container>
    );

};
export default ListAllUsers;



