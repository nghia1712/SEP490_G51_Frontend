//list
import React, { useEffect, useState } from "react";
import { Table, Container, Alert, Card, Button, Form, Modal } from "react-bootstrap";
import adminAPI from "../../API/adminAPI";
import CreateStaff from "./CreateStaff";
import { FaEdit, FaBan, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import EditUserModal from "./EditUserModal";

const ListAllUsers = ({ roleGroup }) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState({ "Hoạt động": false, "Không hoạt động": false });
    const [roleQuery, setRoleQuery] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [detailUser, setDetailUser] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
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
                    // Refresh trang để cập nhật dữ liệu mới nhất
                    window.location.reload();
                } else {
                    alert("Có lỗi xảy ra khi ban tài khoản: " + (response?.data?.message || response?.message || "Unknown error"));
                }
            } else if (newStatus === "active") {
                console.log("Calling activeAccount API with userId:", id);
                const response = await adminAPI.activeAccount(id);
                console.log("activeAccount response:", response);
                
                if (response?.data?.success || response?.success) {
                    alert("Đã bỏ ban tài khoản thành công!");
                    // Refresh trang để cập nhật dữ liệu mới nhất
                    window.location.reload();
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
        const defaultPassword = "PMS@123456";
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
      console.log("openDetail - user data:", user);
      console.log("openDetail - user ID:", id);
      if (!id) return;
      const response = await adminAPI.getAccountDetails(id);
      console.log("getAccountDetails response:", response);
      const data = response?.data || response;
      console.log("Account details data:", data);
      setDetailUser(data || user);
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
        
        // Check for Role field first (from backend AccountList DTO)
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
        
        // Check for role field (lowercase)
        if (user?.role !== null && user?.role !== undefined) {
            console.log("role field:", user.role);
            switch (Number(user.role)) {
                case 0: return "Nhân viên Bán Hàng";
                case 1: return "Nhân viên Mua Hàng";
                case 2: return "Nhân viên Kho";
                case 3: return "Nhân viên Kế Toán";
                default: break;
            }
        }
        
        // Check for staff role ID
        const staffRoleId = user?.staffRole ?? user?.StaffRole ?? user?.profile?.staffRole ?? user?.staff?.roleId ?? user?.staffProfile?.roleId;
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
        
        // Check single role field
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
        }
        
        console.log("No role found, returning '-'");
        return '-';
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

    const filteredUsers = (users || []).filter((user) => {
        const name = (user?.fullName || user?.profile?.fullName || "").toLowerCase();
        const email = (user?.account?.email || user?.email || "").toLowerCase();
        const q = (search || "").toLowerCase();
        const matchesSearch = name.includes(q) || email.includes(q);
        
        // Fix status filter logic to match renderStatusBadge
        const status = user?.userStatus || user?.status;
        let isActive = false;
        
        if (typeof status === 'number') {
            isActive = status === 2; // Active
        } else if (typeof status === 'string') {
            const normalizedStatus = status.toLowerCase();
            isActive = normalizedStatus === 'active' || normalizedStatus === '2';
        } else {
            // Default to active for new accounts
            isActive = true;
        }
        
        const statusLabel = isActive ? "Hoạt động" : "Không hoạt động";
        const hasAnyStatusFilter = Object.values(filterStatus || {}).some(v => v);
        const matchesStatus = hasAnyStatusFilter ? !!filterStatus[statusLabel] : true;
        // role matching query
        const normalizedRoles = normalizeUserRoles(user);
        const matchesRoleQuery = roleQuery ? normalizedRoles.some(r => r.includes(roleQuery.toLowerCase())) : true;

        // Additional filter by role group for admin subpages
        let matchesRoleGroup = true;
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
    const indexColStyle = isStaffView ? { width: '50px' } : {};
    const equalColStyle = isStaffView ? { width: '20%' } : {};
    const actionColStyle = isStaffView ? { width: '140px' } : {};

    // Render status badge similar to product page
    const renderStatusBadge = (status) => {
        // Backend enum: Block=0, Inactive=1, Active=2
        // Map both string and numeric values
        let isActive = false;
        
        if (typeof status === 'number') {
            isActive = status === 2; // Active
        } else if (typeof status === 'string') {
            const normalizedStatus = status.toLowerCase();
            isActive = normalizedStatus === 'active' || normalizedStatus === '2';
        } else {
            // Default to active for new accounts
            isActive = true;
        }
        
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
    return (
        <Container className="mt-4" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
            {error || users.length === 0 ? (
                <Alert variant="danger" className="text-center">Không thể tải danh sách người dùng</Alert>
            ) : (
                <Card className="shadow-sm mt-3" style={{ backgroundColor: "#A8E6CF", padding: '5px', borderRadius: '15px' }}>
                    <Card.Body>

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Form className="d-flex gap-2 align-items-center" style={{ minHeight: '38px', width: '100%' }}>
                                <div className="d-flex gap-2">
                                    <Form.Control
                                        type="text"
                                        placeholder="Tìm kiếm theo email"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ width: "240px", height: "38px", fontSize: "1rem" }}
                                    />
                                    <Form.Control
                                        type="text"
                                        placeholder="Tìm kiếm theo vai trò"
                                        value={roleQuery}
                                        onChange={(e) => setRoleQuery(e.target.value)}
                                        style={{ width: "240px", height: "38px", fontSize: "1rem" }}
                                    />
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
                            </Form>
                            <Button variant="primary" onClick={() => setIsCreateOpen(true)} style={{ height: '35px', width: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                + Tạo nhân viên
                            </Button>
                        </div>

                        <div style={{ overflowY: 'auto', maxHeight: '620px' }}>
                        <Table striped bordered hover responsive className="text-center" style={{ width: "100%", tableLayout: "fixed", fontSize: '1rem', lineHeight: 1.6 }}>
                            <thead style={{ backgroundColor: "#A8E6CF", position: "sticky", top: 0, zIndex: 1 }}>
                                <tr>
                                    <th style={indexColStyle}>#</th>
                                    <th style={equalColStyle}>Email</th>
                                    {isStaffView ? <th style={equalColStyle}>Mã nhân viên</th> : <th>Tên đăng nhập</th>}
                                    {isStaffView ? <th style={equalColStyle}>Vai trò</th> : <th>Số điện thoại</th>}
                                    {isStaffView && <th style={equalColStyle}>Trạng thái</th>}
                                    {!isStaffView && <th>Vai trò</th>}
                                    {!isStaffView && <th>Họ tên</th>}
                                    {!isStaffView && <th>Giới tính</th>}
                                    {!isStaffView && <th>Địa chỉ</th>}
                                    {!isStaffView && <th>Mã nhân viên</th>}
                                    {!isStaffView && <th>Ghi chú</th>}
                                    <th style={actionColStyle}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user, index) => (
                                        <React.Fragment key={index}>
                                            <tr style={{ borderTop: '10px solid #A8E6CF', cursor: 'pointer' }} onClick={(e) => {
                                                // Avoid triggering on row click when pressing buttons inside actions
                                                if ((e.target.closest && e.target.closest('[data-row-action]'))) return;
                                                openDetail(user);
                                            }}>
                                                <td style={indexColStyle}>{index + 1}</td>
                                                <td style={equalColStyle}>{user?.account?.email || user?.email || '-'}</td>
                                                {isStaffView ? (
                                                    <td style={equalColStyle}>
                                                        {console.log("EmployeeCode debug:", user?.EmployeeCode, user?.employeeCode, user?.profile?.employeeCode, "Full user:", user)}
                                                        {user?.EmployeeCode || user?.employeeCode || user?.profile?.employeeCode || '-'}
                                                    </td>
                                                ) : (
                                                    <td>{user?.account?.userName || user?.username || user?.userName || '-'}</td>
                                                )}
                                                {isStaffView ? (
                                                    <td style={equalColStyle}>{getRoleDisplayName(user)}</td>
                                                ) : (
                                                <td>{user?.profile?.phoneNumber || user?.phoneNumber || '-'}</td>
                                                )}
                                                {isStaffView && (
                                                    <td style={equalColStyle}>
                                                        {renderStatusBadge(user?.userStatus || user?.status)}
                                                    </td>
                                                )}
                                                {!isStaffView && (
                                                    <>
                                                        <td>{getRoleDisplayName(user)}</td>
                                                <td className="text-start">{user?.fullName || user?.profile?.fullName || '-'}</td>
                                                <td>{user?.gender !== null && user?.gender !== undefined ? (user.gender === true ? "Nam" : "Nữ") : '-'}</td>
                                                <td className="text-start">{user?.profile?.address || user?.address || '-'}</td>
                                                <td>{user?.employeeCode || user?.profile?.employeeCode || '-'}</td>
                                                <td className="text-start">{user?.notes || user?.profile?.notes || '-'}</td>
                                                    </>
                                                )}
                                                <td style={actionColStyle}>
                                                    <div className="d-flex align-items-center justify-content-center gap-3" data-row-action>
                                                        <Button variant="warning" size="sm" onClick={() => setEditingUser(user)} style={{ opacity: (user?.status === "inactive" || user?.status === "banned") ? 0.5 : 1, padding: "2px 6px", fontSize: "0.8rem" }} disabled={user?.status === "inactive" || user?.status === "banned"}>
                                                            <FaEdit /> Sửa
                                                        </Button>
                                                        {(() => {
                                                            // Check if user is active (can login)
                                                            const isActive = (typeof user?.userStatus === 'number' && user.userStatus === 2) || 
                                                                           (typeof user?.userStatus === 'string' && user.userStatus.toLowerCase() === 'active') ||
                                                                           (typeof user?.status === 'string' && user.status.toLowerCase() === 'active');
                                                            
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

                                            </tr>
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isStaffView ? "5" : "8"} className="text-center">Không tìm thấy người dùng nào</td>
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
                                <div className="col-sm-8">{detailUser?.role || detailUser?.roleName || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-sm-4 fw-bold">Họ tên</div>
                                <div className="col-sm-8">{detailUser?.fullName || detailUser?.profile?.fullName || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-sm-4 fw-bold">Giới tính</div>
                                <div className="col-sm-8">
                                    {(() => {
                                        console.log("Gender debug:", {
                                            gender: detailUser?.gender,
                                            type: typeof detailUser?.gender,
                                            isNull: detailUser?.gender === null,
                                            isUndefined: detailUser?.gender === undefined,
                                            isTrue: detailUser?.gender === true,
                                            isFalse: detailUser?.gender === false
                                        });
                                        return detailUser?.gender !== null && detailUser?.gender !== undefined ? (detailUser.gender === true ? 'Nam' : 'Nữ') : '-';
                                    })()}
                                </div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-sm-4 fw-bold">Địa chỉ</div>
                                <div className="col-sm-8">{detailUser?.Address || detailUser?.address || detailUser?.profile?.address || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-sm-4 fw-bold">Mã nhân viên</div>
                                <div className="col-sm-8">{detailUser?.EmployeeCode || detailUser?.employeeCode || detailUser?.profile?.employeeCode || '-'}</div>
                            </div>
                            {detailUser?.department || detailUser?.profile?.department ? (
                                <div className="row mb-2">
                                    <div className="col-sm-4 fw-bold">Phòng ban</div>
                                    <div className="col-sm-8">{detailUser?.department || detailUser?.profile?.department}</div>
                                </div>
                            ) : null}
                            {detailUser?.notes || detailUser?.profile?.notes ? (
                                <div className="row mb-2">
                                    <div className="col-sm-4 fw-bold">Ghi chú</div>
                                    <div className="col-sm-8">{detailUser?.notes || detailUser?.profile?.notes}</div>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div>Đang tải...</div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
                </Modal.Footer>
            </Modal>
            {/* Create Staff Modal */}
            <Modal show={isCreateOpen} onHide={() => setIsCreateOpen(false)} centered size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>Tạo nhân viên</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <CreateStaff />
                </Modal.Body>
            </Modal>
            <EditUserModal
                user={editingUser}
                closeModal={() => setEditingUser(null)}
                users={users}
                setUsers={setUsers}
            />
        </Container>
    );

};
export default ListAllUsers;



