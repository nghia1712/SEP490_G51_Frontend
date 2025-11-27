//list
import React, { useEffect, useState } from "react";
import { Table, Container, Alert, Card, Button, Form, Modal } from "react-bootstrap";
import adminAPI from "../../API/adminAPI";
import userAPI from "../../API/userAPI";
import CreateStaff from "./CreateStaff";
import { FaEdit, FaBan, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import EditUser from "./EditUser";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken.jsx";

const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || "http://localhost:5137";

const resolveMediaUrl = (path) => {
    if (!path || typeof path !== "string") return null;
    if (/^https?:\/\//i.test(path)) return path;
    const base = MEDIA_BASE_URL.replace(/\/$/, "");
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${base}${normalized}`;
};

const getCustomerProfileField = (user, field) => {
    if (!user) return null;
    const sources = [
        user,
        user?.CustomerProfile,
        user?.customerProfile,
        user?.customer_profile,
        user?.profile,
    ];
    const candidateKeys = [
        field,
        field?.toLowerCase(),
        field ? field.charAt(0).toLowerCase() + field.slice(1) : null,
    ].filter(Boolean);

    for (const source of sources) {
        if (!source) continue;
        for (const key of candidateKeys) {
            const value = source[key];
            if (value !== undefined && value !== null && String(value).trim() !== "") {
                return value;
            }
        }
    }
    return null;
};

const ListAllUsers = ({ roleGroup }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState({ "Hoạt động": false, "Không hoạt động": false });
    const [roleFilter, setRoleFilter] = useState("all");
    const [customerStatusFilter, setCustomerStatusFilter] = useState("all");
    const [editingUser, setEditingUser] = useState(null);
    const [detailUser, setDetailUser] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [approvingCustomerId, setApprovingCustomerId] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null);

    const fetchUsers = async () => {
        try {
            const response = await adminAPI.getAccountList();
            console.log("API response:", response);
            console.log("Response data:", response.data || response);
            const usersData = response.data || response;
            
            // Process users data to ensure avatar fields are handled correctly
            const processedUsers = Array.isArray(usersData) ? usersData.map(user => {
                // If avatar is null/empty, ensure it's not in the object
                const processedUser = { ...user };
                
                // Check if avatar should be null/empty (including empty string from backend)
                const avatar = processedUser.avatar ?? processedUser.Avatar;
                if (avatar === null || avatar === '' || avatar === undefined || 
                    (typeof avatar === 'string' && avatar.trim() === '')) {
                    // Remove avatar fields if null/empty
                    delete processedUser.avatar;
                    delete processedUser.Avatar;
                    delete processedUser.imageUrl;
                    delete processedUser.ImageUrl;
                    delete processedUser.profileImage;
                    delete processedUser.ProfileImage;
                    
                    if (processedUser.profile) {
                        delete processedUser.profile.avatar;
                        delete processedUser.profile.Avatar;
                        delete processedUser.profile.imageUrl;
                        delete processedUser.profile.ImageUrl;
                        delete processedUser.profile.profileImage;
                        delete processedUser.profile.ProfileImage;
                    }
                }
                
                return processedUser;
            }) : usersData;
            
            setUsers(processedUsers);
            
            // Debug: Check for accountant staff
            if (Array.isArray(usersData)) {
                console.log('fetchUsers - Total users:', usersData.length);
                // Log all users with their Role field
                usersData.forEach((u, index) => {
                    console.log(`User ${index}:`, {
                        email: u?.Email || u?.email,
                        role: u?.Role || u?.role,
                        roleType: typeof (u?.Role || u?.role),
                        employeeCode: u?.EmployeeCode || u?.employeeCode
                    });
                });
                
                const accountantUsers = usersData.filter(u => {
                    const role = u?.Role || u?.role;
                    if (typeof role === 'string' && role.toLowerCase().includes('accountant')) return true;
                    if (role === 3) return true;
                    return false;
                });
                console.log('fetchUsers - Accountant users found:', accountantUsers);
                console.log('fetchUsers - Accountant users count:', accountantUsers.length);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setError("Không thể tải dữ liệu danh sách các người dùng.");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        // Lấy role hiện tại từ token để phân quyền nút duyệt hồ sơ
        const role = getUserRoleFromToken();
        setCurrentUserRole(role);
    }, []);

    useEffect(() => {
        const openUserId = location.state?.openUserId;
        if (openUserId && users.length > 0) {
            const targetUser = users.find((u) => getUserIdFromAny(u) === openUserId);
            if (targetUser) {
                openDetail(targetUser);
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, users, navigate, location.pathname]);
    const handleUpdateStatus = async (id, newStatus) => {
        console.log("handleUpdateStatus called:", { id, newStatus, idType: typeof id });
        try {
            if (newStatus === "banned") {
                console.log("Calling suspendAccount API with userId:", id);
                const response = await adminAPI.suspendAccount(id);
                console.log("suspendAccount response:", response);
                
                // Kiểm tra response - có thể thành công ngay cả khi không có success flag
                const message = response?.data?.message || response?.message || "";
                const isSuccess = response?.data?.success || 
                                 response?.success || 
                                 response?.status === 200 ||
                                 message.includes("thành công") ||
                                 message.includes("success");
                
                if (isSuccess || response?.status === 200 || response?.statusText === "OK") {
                    alert("Ngừng hoạt động tài khoản thành công");
                    // Refresh trang
                    window.location.reload();
                } else if (message.includes("thành công") || message.includes("success")) {
                    // Nếu message chứa "thành công" thì coi như thành công
                    alert("Ngừng hoạt động tài khoản thành công");
                    // Refresh trang
                    window.location.reload();
                } else {
                    alert("Có lỗi xảy ra khi ban tài khoản: " + message);
                }
            } else if (newStatus === "active") {
                console.log("Calling activeAccount API with userId:", id);
                const response = await adminAPI.activeAccount(id);
                console.log("activeAccount response:", response);
                
                // Kiểm tra response - có thể thành công ngay cả khi không có success flag
                const message = response?.data?.message || response?.message || "";
                const isSuccess = response?.data?.success || 
                                 response?.success || 
                                 response?.status === 200 ||
                                 message.includes("thành công") ||
                                 message.includes("success");
                
                if (isSuccess || response?.status === 200 || response?.statusText === "OK") {
                    alert("Kích hoạt tài khoản thành công");
                    // Refresh trang
                    window.location.reload();
                } else if (message.includes("thành công") || message.includes("success")) {
                    // Nếu message chứa "thành công" thì coi như thành công
                    alert("Kích hoạt tài khoản thành công");
                    // Refresh trang
                    window.location.reload();
                } else {
                    alert("Có lỗi xảy ra khi bỏ ban tài khoản: " + message);
                }
            }
        } catch (error) {
            console.error("Error in handleUpdateStatus:", error);
            console.log("Error details:", error.response?.data);
            // Kiểm tra xem error message có chứa "thành công" không (có thể backend trả về success nhưng bị catch)
            const errorMessage = error?.response?.data?.message || error?.message || "";
            if (errorMessage.includes("thành công") || errorMessage.includes("success")) {
                alert("Ngừng hoạt động tài khoản thành công");
                window.location.reload();
            } else {
                alert("Có lỗi xảy ra khi cập nhật trạng thái người dùng: " + errorMessage);
            }
        }
    };
    const handleFilterChange = (e) => {
        setFilterStatus({ ...filterStatus, [e.target.name]: e.target.checked });
    };

    const getUserIdFromAny = (user) =>
        user?.userId || user?.UserId || user?._id || user?.id || user?.accountId;

    const handleApproveCustomer = async (user) => {
        const userId = getUserIdFromAny(user);
        if (!userId) {
            alert("Không xác định được khách hàng cần duyệt.");
            return;
        }
        setApprovingCustomerId(userId);
        try {
            const response = await userAPI.updateCustomerStatus(userId);
            const message =
                response?.data?.message ||
                response?.message ||
                "Đã duyệt hồ sơ khách hàng thành công.";
            alert(message);
            setIsDetailOpen(false);
            await fetchUsers();
        } catch (error) {
            console.error("Error approving customer:", error);
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Không thể duyệt hồ sơ khách hàng.";
            alert(message);
        } finally {
            setApprovingCustomerId(null);
        }
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
      console.log("Account details data.Avatar:", data?.Avatar);
      console.log("Account details data.staffProfileId:", data?.staffProfileId);
      console.log("Account details data.StaffProfileId:", data?.StaffProfileId);
      console.log("Account details data.staffRole:", data?.staffRole);
      console.log("Account details data.StaffRole:", data?.StaffRole);
      
      // Determine isStaff from backend data (StaffProfileId or StaffRole indicates staff)
      const isStaffFromApi = !!(data?.staffProfileId || data?.StaffProfileId || 
                                data?.staffRole || data?.StaffRole);
      console.log("Is staff from API:", isStaffFromApi);
      
      // Check if avatar is null/empty in API response
      const apiAvatar = data?.avatar ?? data?.Avatar ?? data?.profile?.avatar ?? data?.profile?.Avatar;
      const isAvatarDeleted = apiAvatar === null || apiAvatar === '' || apiAvatar === undefined;
      const hasAvatarInApi = data?.avatar !== undefined || data?.Avatar !== undefined || 
                            data?.profile?.avatar !== undefined || data?.profile?.Avatar !== undefined;
      console.log("Is avatar deleted:", isAvatarDeleted, "apiAvatar:", apiAvatar, "hasAvatarInApi:", hasAvatarInApi);
      
      // Merge: start with user data, but exclude avatar fields if API has avatar data
      // This prevents old avatar values from user object being merged in
      const userWithoutAvatar = user ? (() => {
        // Create a copy of user without avatar fields
        const { avatar, Avatar, imageUrl, ImageUrl, profileImage, ProfileImage, ...userRest } = user;
        const cleanedUser = { ...userRest };
        
        // Clean profile if exists
        if (user.profile) {
          const { avatar: pAvatar, Avatar: pAvatar2, imageUrl: pImg, ImageUrl: pImg2, 
                  profileImage: pProfImg, ProfileImage: pProfImg2, ...profileRest } = user.profile;
          cleanedUser.profile = { ...profileRest };
        }
        
        // Clean account if exists
        if (user.account) {
          const { avatar: aAvatar, Avatar: aAvatar2, imageUrl: aImg, ImageUrl: aImg2,
                  profileImage: aProfImg, ProfileImage: aProfImg2, ...accountRest } = user.account;
          cleanedUser.account = { ...accountRest };
        }
        
        return cleanedUser;
      })() : {};
      
      // Now merge: user data (without avatar) + API data
      const merged = (data && typeof data === 'object') ? { 
        ...userWithoutAvatar, 
        ...data,
        // Set isStaff based on API data
        isStaff: isStaffFromApi,
        IsStaff: isStaffFromApi,
      } : (userWithoutAvatar || data);
      
      // CRITICAL: If API says avatar is deleted, remove ALL avatar-related fields completely
      // Also handle case where API explicitly returns null (even if hasAvatarInApi is false)
      if (isAvatarDeleted && (hasAvatarInApi || data?.avatar === null || data?.Avatar === null)) {
        console.log("Clearing all avatar fields because API returned null/empty");
        // Delete all avatar-related properties from top level
        delete merged.avatar;
        delete merged.Avatar;
        delete merged.imageUrl;
        delete merged.ImageUrl;
        delete merged.profileImage;
        delete merged.ProfileImage;
        
        // Clear nested objects - delete properties instead of setting to null
        if (merged.profile) {
          delete merged.profile.avatar;
          delete merged.profile.Avatar;
          delete merged.profile.imageUrl;
          delete merged.profile.ImageUrl;
          delete merged.profile.profileImage;
          delete merged.profile.ProfileImage;
        }
        if (merged.account) {
          delete merged.account.avatar;
          delete merged.account.Avatar;
          delete merged.account.imageUrl;
          delete merged.account.ImageUrl;
          delete merged.account.profileImage;
          delete merged.account.ProfileImage;
        }
        
        // Also ensure no other avatar-related fields exist
        Object.keys(merged).forEach(key => {
          if (key.toLowerCase().includes('avatar') || key.toLowerCase().includes('image')) {
            if (key !== 'imageCnkd' && key !== 'imageByt' && key !== 'ImageCnkd' && key !== 'ImageByt') {
              delete merged[key];
            }
          }
        });
      } else if (data && hasAvatarInApi && !isAvatarDeleted) {
        // API returned a valid avatar, use it and clear other avatar fields
        merged.avatar = data.avatar ?? data.Avatar ?? null;
        merged.Avatar = data.Avatar ?? data.avatar ?? null;
        // Clear other avatar fields to avoid confusion
        delete merged.imageUrl;
        delete merged.ImageUrl;
        delete merged.profileImage;
        delete merged.ProfileImage;
        
        if (merged.profile && (data.profile?.avatar !== undefined || data.profile?.Avatar !== undefined)) {
          merged.profile.avatar = data.profile.avatar ?? data.profile.Avatar ?? null;
          merged.profile.Avatar = data.profile.Avatar ?? data.profile.avatar ?? null;
          delete merged.profile.imageUrl;
          delete merged.profile.ImageUrl;
          delete merged.profile.profileImage;
          delete merged.profile.ProfileImage;
        }
      }
      console.log("Merged user data:", merged);
      console.log("Merged user data.avatar:", merged?.avatar);
      console.log("Merged user data.Avatar:", merged?.Avatar);
      console.log("Merged user data.profile?.avatar:", merged?.profile?.avatar);
      console.log("Avatar is null/empty:", !merged?.avatar || merged?.avatar === '');
      
      // Final check: if getAvatarFromAny returns null, avatar should be cleared
      const finalAvatarCheck = getAvatarFromAny(merged);
      console.log("Final avatar check from getAvatarFromAny:", finalAvatarCheck);
      console.log("Merged object keys:", Object.keys(merged));
      console.log("Merged.avatar:", merged.avatar);
      console.log("Merged.Avatar:", merged.Avatar);
      console.log("'avatar' in merged:", 'avatar' in merged);
      console.log("'Avatar' in merged:", 'Avatar' in merged);
      
      // If API returned null avatar, ensure getAvatarFromAny returns null
      if (isAvatarDeleted && (hasAvatarInApi || data?.avatar === null || data?.Avatar === null)) {
        // Double-check: if getAvatarFromAny still finds something, force clear it
        if (finalAvatarCheck !== null) {
          console.warn("WARNING: getAvatarFromAny still found avatar after deletion, forcing clear");
          // Force delete all possible avatar fields
          const avatarFields = ['avatar', 'Avatar', 'imageUrl', 'ImageUrl', 'profileImage', 'ProfileImage'];
          avatarFields.forEach(field => {
            if (merged[field] !== undefined) {
              delete merged[field];
            }
          });
          // Also check nested objects
          if (merged.profile) {
            avatarFields.forEach(field => {
              if (merged.profile[field] !== undefined) {
                delete merged.profile[field];
              }
            });
          }
          if (merged.account) {
            avatarFields.forEach(field => {
              if (merged.account[field] !== undefined) {
                delete merged.account[field];
              }
            });
          }
        }
      }
      
      setDetailUser(merged);
      setIsDetailOpen(true);
    } catch (err) {
      console.log("getAccountDetails error:", err);
      // Fallback: still open with current row data
      setDetailUser(user);
      setIsDetailOpen(true);
    }
  };

  // Helper function to handle view detail (alias for openDetail)
  const handleViewDetail = (user) => {
    openDetail(user);
  };

    // Helper function to check if user is actually a staff member
    const isActualStaff = (user) => {
        const normalizedRoles = normalizeUserRoles(user);
        const staffRoles = new Set(['sales_staff','purchases_staff','warehouse_staff','accountant_staff']);
        
        // Debug log for accountant staff
        const isAccountantUser = user?.Role && (typeof user.Role === 'string' && user.Role.toLowerCase().includes('accountant'));
        if (isAccountantUser || user?.email === 'pmsaccountant@gmail.com') {
            console.log('isActualStaff - Found accountant user:', user);
            console.log('isActualStaff - user.Role:', user.Role);
            console.log('isActualStaff - user.Role type:', typeof user.Role);
            console.log('isActualStaff - normalizedRoles:', normalizedRoles);
            console.log('isActualStaff - staffRoles set:', Array.from(staffRoles));
        }
        
        // Check if user has customer role - safely handle different data types
        const isCustomerRole = normalizedRoles.includes('customer') || 
                              (user?.RoleName && typeof user.RoleName === 'string' && user.RoleName.toLowerCase() === 'customer') ||
                              (user?.role && typeof user.role === 'string' && user.role.toLowerCase() === 'customer');
        
        // Check if user has manager/admin role - safely handle different data types
        const isManagerRole = normalizedRoles.includes('manager') || 
                             normalizedRoles.includes('admin') ||
                             (user?.RoleName && typeof user.RoleName === 'string' && user.RoleName.toLowerCase() === 'manager') ||
                             (user?.RoleName && typeof user.RoleName === 'string' && user.RoleName.toLowerCase() === 'admin') ||
                             (user?.role && typeof user.role === 'string' && user.role.toLowerCase() === 'manager') ||
                             (user?.role && typeof user.role === 'string' && user.role.toLowerCase() === 'admin');
        
        // Check if user has staff role ID (can be number or string)
        const hasStaffRoleId = user?.Role !== null && user?.Role !== undefined && (
            (typeof user.Role === 'number' && (user.Role === 0 || user.Role === 1 || user.Role === 2 || user.Role === 3)) ||
            (typeof user.Role === 'string' && (
                user.Role.toLowerCase() === 'accountant' || 
                user.Role.toLowerCase() === 'salesstaff' || 
                user.Role.toLowerCase() === 'purchasesstaff' || 
                user.Role.toLowerCase() === 'warehousestaff' ||
                user.Role.toLowerCase() === 'sales_staff' ||
                user.Role.toLowerCase() === 'purchases_staff' ||
                user.Role.toLowerCase() === 'warehouse_staff' ||
                user.Role.toLowerCase() === 'accountant_staff' ||
                user.Role.toLowerCase().includes('accountant') ||
                user.Role.toLowerCase().includes('sales') ||
                user.Role.toLowerCase().includes('purchase') ||
                user.Role.toLowerCase().includes('warehouse')
            ))
        );
        
        const hasStaffRole = normalizedRoles.some(r => staffRoles.has(r)) || hasStaffRoleId;
        const isStaff = hasStaffRole && !isCustomerRole && !isManagerRole;
        
        // Debug log for accountant staff
        if (isAccountantUser || user?.email === 'pmsaccountant@gmail.com') {
            console.log('isActualStaff - hasStaffRoleId:', hasStaffRoleId);
            console.log('isActualStaff - hasStaffRole:', hasStaffRole);
            console.log('isActualStaff - isCustomerRole:', isCustomerRole);
            console.log('isActualStaff - isManagerRole:', isManagerRole);
            console.log('isActualStaff - final isStaff:', isStaff);
        }
        
        // User is staff if: has staff roles AND not customer AND not manager/admin
        return isStaff;
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
        
        // Check for Role field (from backend AccountList DTO) - can be number or string
        if (user?.Role !== null && user?.Role !== undefined) {
            console.log("Role field:", user.Role);
            // Handle string role from backend (e.g., "ACCOUNTANT", "SalesStaff")
            if (typeof user.Role === 'string') {
                const roleStr = user.Role.toLowerCase();
                if (roleStr === 'accountant' || roleStr.includes('accountant')) return "Nhân viên Kế Toán";
                if (roleStr === 'salesstaff' || roleStr.includes('sales')) return "Nhân viên Bán Hàng";
                if (roleStr === 'purchasesstaff' || roleStr.includes('purchase')) return "Nhân viên Mua Hàng";
                if (roleStr === 'warehousestaff' || roleStr.includes('warehouse')) return "Nhân viên Kho";
            }
            // Handle numeric role ID
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
        if (!u) return null;
        
        // Check various possible avatar field locations
        // Use explicit checks to avoid getting old values when avatar is null
        // Check each field individually to see if it's explicitly null
        let avatar = null;
        
        // Check top-level fields first
        if (u.avatar !== undefined) avatar = u.avatar;
        else if (u.Avatar !== undefined) avatar = u.Avatar;
        // Check nested profile
        else if (u.profile?.avatar !== undefined) avatar = u.profile.avatar;
        else if (u.profile?.Avatar !== undefined) avatar = u.profile.Avatar;
        // Check nested account
        else if (u.account?.avatar !== undefined) avatar = u.account.avatar;
        else if (u.account?.Avatar !== undefined) avatar = u.account.Avatar;
        // Check other possible fields
        else if (u.imageUrl !== undefined) avatar = u.imageUrl;
        else if (u.ImageUrl !== undefined) avatar = u.ImageUrl;
        else if (u.profileImage !== undefined) avatar = u.profileImage;
        else if (u.ProfileImage !== undefined) avatar = u.ProfileImage;
        
        // Return null if avatar is null, undefined, or empty string
        if (avatar === null || avatar === undefined || (typeof avatar === 'string' && avatar.trim() === '')) {
            return null;
        }
        
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

    // Helper function to map role string to normalized staff role key
    const mapRoleToStaffRole = (roleStr) => {
        if (!roleStr || typeof roleStr !== 'string') return null;
        const lowerRole = roleStr.toLowerCase();
        if (lowerRole === 'accountant' || lowerRole.includes('accountant')) return 'accountant_staff';
        if (lowerRole === 'sales_staff' || lowerRole === 'salesstaff' || (lowerRole.includes('sales') && !lowerRole.includes('accountant'))) return 'sales_staff';
        if (lowerRole === 'purchases_staff' || lowerRole === 'purchasesstaff' || (lowerRole.includes('purchase') && !lowerRole.includes('accountant'))) return 'purchases_staff';
        if (lowerRole === 'warehouse_staff' || lowerRole === 'warehousestaff' || (lowerRole.includes('warehouse') && !lowerRole.includes('accountant'))) return 'warehouse_staff';
        return null;
    };

    // Normalize roles coming from different backend shapes to lowercase keywords
    const normalizeUserRoles = (u) => {
        const collected = [];
        // roles as array: strings or objects with name
        if (Array.isArray(u?.roles)) {
            for (const r of u.roles) {
                if (typeof r === 'string') {
                    const mapped = mapRoleToStaffRole(r);
                    if (mapped) collected.push(mapped);
                    else collected.push(r.toLowerCase());
                } else if (r && typeof r === 'object') {
                    if (typeof r.name === 'string') {
                        const mapped = mapRoleToStaffRole(r.name);
                        if (mapped) collected.push(mapped);
                        else collected.push(r.name.toLowerCase());
                    }
                    if (typeof r.roleName === 'string') {
                        const mapped = mapRoleToStaffRole(r.roleName);
                        if (mapped) collected.push(mapped);
                        else collected.push(r.roleName.toLowerCase());
                    }
                }
            }
        }
        // single role as string
        if (typeof u?.role === 'string') {
            const mapped = mapRoleToStaffRole(u.role);
            if (mapped) collected.push(mapped);
            else collected.push(u.role.toLowerCase());
        }
        if (typeof u?.roleName === 'string') {
            const mapped = mapRoleToStaffRole(u.roleName);
            if (mapped) collected.push(mapped);
            else collected.push(u.roleName.toLowerCase());
        }
        if (typeof u?.account?.role === 'string') {
            const mapped = mapRoleToStaffRole(u.account.role);
            if (mapped) collected.push(mapped);
            else collected.push(u.account.role.toLowerCase());
        }
        if (typeof u?.account?.roleName === 'string') {
            const mapped = mapRoleToStaffRole(u.account.roleName);
            if (mapped) collected.push(mapped);
            else collected.push(u.account.roleName.toLowerCase());
        }
        
        // Handle Role field from backend (can be string like "ACCOUNTANT", "Accountant", "SalesStaff", etc.)
        if (typeof u?.Role === 'string') {
            const roleStr = u.Role.toLowerCase();
            // Debug log for accountant
            if (roleStr.includes('accountant')) {
                console.log('normalizeUserRoles - Found accountant role string:', u.Role, '-> normalized to:', roleStr);
            }
            // Map backend role strings to frontend role keys
            // Backend returns "ACCOUNTANT" (uppercase) from UserRoles.ACCOUNTANT
            const mapped = mapRoleToStaffRole(u.Role);
            if (mapped) {
                collected.push(mapped);
                if (roleStr.includes('accountant')) {
                    console.log('normalizeUserRoles - Mapped accountant role to accountant_staff');
                }
            } else {
                collected.push(roleStr); // Keep original if no match
            }
        }
        
        // Staff role id mapping aligned with BE enum StaffRole: byte
        // SalesStaff=0, PurchasesStaff=1, WarehouseStaff=2, AccountantStaff=3
        const staffRoleId = u?.staffRole ?? u?.StaffRole ?? u?.profile?.staffRole ?? u?.staff?.roleId ?? u?.staffProfile?.roleId ?? u?.Role;
        const mapStaffRoleId = (id) => {
            // Handle string role names from backend
            if (typeof id === 'string') {
                const roleStr = id.toLowerCase();
                if (roleStr === 'accountant' || roleStr.includes('accountant')) return 'accountant_staff';
                if (roleStr === 'salesstaff' || roleStr.includes('sales')) return 'sales_staff';
                if (roleStr === 'purchasesstaff' || roleStr.includes('purchase')) return 'purchases_staff';
                if (roleStr === 'warehousestaff' || roleStr.includes('warehouse')) return 'warehouse_staff';
                return null;
            }
            // Handle numeric role IDs
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
            if (customerStatusFilter !== 'all') {
                const isActive = getIsActive(user);
                matchesStatus = customerStatusFilter === 'active' ? isActive : !isActive;
            }
        } else if (roleGroup === 'staff') {
            // Sử dụng hàm isActualStaff để kiểm tra chính xác
            matchesRoleGroup = isActualStaff(user);
            
            // Debug log for accountant user
            if (user?.email === 'pmsaccountant@gmail.com' || (user?.Role && typeof user.Role === 'string' && user.Role.toLowerCase().includes('accountant'))) {
                console.log('filteredUsers - Accountant user filter check:', {
                    email: user?.email,
                    role: user?.Role,
                    matchesSearch,
                    matchesStatus,
                    matchesRoleQuery,
                    matchesRoleGroup,
                    finalResult: matchesSearch && matchesStatus && matchesRoleQuery && matchesRoleGroup
                });
            }
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

    // Render activation badge for customer accounts based on userStatus
    const renderCustomerActivationBadge = (user) => {
        const isActivated = getIsActive(user);
        return (
            <span
                style={{
                    color: '#fff',
                    backgroundColor: isActivated ? '#4caf50' : '#f44336',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    minWidth: '110px',
                }}
            >
                {isActivated ? 'Kích hoạt' : 'Chưa kích hoạt'}
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
                                    <div className="d-flex gap-2 align-items-center flex-wrap" style={{ width: '100%' }}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Tìm kiếm theo email"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            style={{ width: "300px", height: "38px", fontSize: "1rem" }}
                                        />
                                        {isCustomerView && (
                                            <Form.Select
                                                value={customerStatusFilter}
                                                onChange={(e) => setCustomerStatusFilter(e.target.value)}
                                                style={{ width: "220px", height: "38px", fontSize: "1rem" }}
                                            >
                                                <option value="all">Tất cả</option>
                                                <option value="active">Kích hoạt</option>
                                                <option value="inactive">Chưa kích hoạt</option>
                                            </Form.Select>
                                        )}
                                    </div>
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
                                                        <td style={customerStatusColStyle}>{renderCustomerActivationBadge(user)}</td>
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
                                        <td 
                                            colSpan={
                                                isStaffView ? "6" : 
                                                (isManagerView ? "6" : 
                                                (roleGroup === 'customer' ? "6" : "10"))
                                            } 
                                            className="text-center"
                                            style={{
                                                backgroundColor: "#f5f5f5",
                                                color: "#666",
                                                padding: "20px",
                                                fontSize: "1rem"
                                            }}
                                        >
                                            Không tìm thấy người dùng nào
                                        </td>
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
                                    {roleGroup === 'customer' && (
                                        <>
                                            <div className="row mb-2">
                                                <div className="col-sm-4 fw-bold">Mã số thuế</div>
                                                <div className="col-sm-8">
                                                    {getCustomerProfileField(detailUser, 'Mst') || 'Chưa cập nhật'}
                                                </div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-sm-4 fw-bold">Mã số hộ kinh doanh</div>
                                                <div className="col-sm-8">
                                                    {getCustomerProfileField(detailUser, 'Mshkd') || 'Chưa cập nhật'}
                                                </div>
                                            </div>
                                            {(getCustomerProfileField(detailUser, 'ImageCnkd') ||
                                                getCustomerProfileField(detailUser, 'ImageByt')) && (
                                                <div className="mt-3">
                                                    <div className="fw-bold mb-2">Tài liệu đính kèm</div>
                                                    <div className="d-flex gap-3 flex-wrap">
                                                        {(() => {
                                                            const imageCnkdUrl = resolveMediaUrl(
                                                                getCustomerProfileField(detailUser, 'ImageCnkd'),
                                                            );
                                                            if (!imageCnkdUrl) return null;
                                                            return (
                                                                <div style={{ maxWidth: '200px' }}>
                                                                    <div className="text-center fw-semibold mb-1">
                                                                        Ảnh CNKD
                                                                    </div>
                                                                    <img
                                                                        src={imageCnkdUrl}
                                                                        alt="Ảnh CNKD"
                                                                        style={{
                                                                            width: '200px',
                                                                            height: '150px',
                                                                            objectFit: 'contain',
                                                                            border: '1px solid #e0e0e0',
                                                                            borderRadius: '8px',
                                                                            backgroundColor: '#fafafa',
                                                                        }}
                                                                    />
                                                                </div>
                                                            );
                                                        })()}
                                                        {(() => {
                                                            const imageBytUrl = resolveMediaUrl(
                                                                getCustomerProfileField(detailUser, 'ImageByt'),
                                                            );
                                                            if (!imageBytUrl) return null;
                                                            return (
                                                                <div style={{ maxWidth: '200px' }}>
                                                                    <div className="text-center fw-semibold mb-1">
                                                                        Ảnh BYT
                                                                    </div>
                                                                    <img
                                                                        src={imageBytUrl}
                                                                        alt="Ảnh BYT"
                                                                        style={{
                                                                            width: '200px',
                                                                            height: '150px',
                                                                            objectFit: 'contain',
                                                                            border: '1px solid #e0e0e0',
                                                                            borderRadius: '8px',
                                                                            backgroundColor: '#fafafa',
                                                                        }}
                                                                    />
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
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
                    {(() => {
                        const hasMst = !!getCustomerProfileField(detailUser, 'Mst');
                        const hasMshkd = !!getCustomerProfileField(detailUser, 'Mshkd');
                        const hasImageCnkd = !!getCustomerProfileField(detailUser, 'ImageCnkd');
                        const hasImageByt = !!getCustomerProfileField(detailUser, 'ImageByt');
                        const userId = getUserIdFromAny(detailUser);
                        const isProcessing = approvingCustomerId === userId;
                        const isActivated = getIsActive(detailUser);
                        if (
                            roleGroup !== 'customer' ||
                            !hasMst ||
                            !hasMshkd ||
                            !hasImageCnkd ||
                            !hasImageByt ||
                            isActivated ||
                            currentUserRole !== 'manager'
                        ) {
                            return null;
                        }
                        return (
                            <Button
                                variant="success"
                                onClick={() => handleApproveCustomer(detailUser)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Đang duyệt...' : 'Duyệt hồ sơ'}
                            </Button>
                        );
                    })()}
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
                onUpdateSuccess={async () => {
                    // Close detail modal if open to force refresh on next open
                    if (isDetailOpen) {
                        setIsDetailOpen(false);
                        setDetailUser(null);
                    }
                    // Refresh user list after successful update
                    await fetchUsers();
                    // If editingUser is still set, refresh its data too
                    if (editingUser) {
                        const userId = editingUser?.userId || editingUser?.UserId || editingUser?._id || editingUser?.accountId || editingUser?.AccountId;
                        if (userId) {
                            try {
                                const response = await adminAPI.getAccountDetails(userId);
                                const data = (response?.data && (response.data.data ?? response.data)) || response;
                                // Update editingUser with fresh data
                                setUsers(prev => prev.map(u => {
                                    const uId = u?.userId || u?.UserId || u?._id || u?.accountId || u?.AccountId;
                                    if (uId === userId) {
                                        return { ...u, ...data };
                                    }
                                    return u;
                                }));
                            } catch (error) {
                                console.error("Error refreshing user data:", error);
                            }
                        }
                    }
                }}
            />
        </Container>
    );

};
export default ListAllUsers;



