import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Alert, Row, Col } from "react-bootstrap";
import adminAPI from "../../API/adminAPI";

const EditUserModal = ({ user, closeModal, users, setUsers }) => {
    const [form, setForm] = useState({
        fullName: "",
        phoneNumber: "",
        address: "",
        gender: true,
        employeeCode: "",
        notes: "",
        avatar: "",
        userStatus: 2, // 0=Block,1=Inactive,2=Active
    });
    const [originalForm, setOriginalForm] = useState(null); // Store original data
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const getUserId = (u) => u?.userId || u?.UserId || u?._id || u?.accountId || u?.AccountId;

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
            // If it's a relative path, construct full URL
            if (avatar.startsWith('/')) {
                return `${window.location.origin}${avatar}`;
            }
            // If it's just a filename, assume it's in the images folder
            return `${window.location.origin}/images/${avatar}`;
        }
        
        return null; // No avatar found
    };

    useEffect(() => {
        if (!user) return;
        const initialForm = {
            fullName: user?.fullName || user?.profile?.fullName || "",
            phoneNumber: user?.phoneNumber || user?.profile?.phoneNumber || "",
            address: user?.address || user?.profile?.address || "",
            gender: (user?.gender ?? user?.profile?.gender) ?? true,
            employeeCode: user?.employeeCode || user?.profile?.employeeCode || "",
            notes: user?.notes || user?.profile?.notes || "",
            avatar: user?.avatar || user?.profile?.avatar || "",
            userStatus: typeof user?.userStatus === 'number' ? user.userStatus : (String(user?.status).toLowerCase() === 'active' ? 2 : 1),
        };
        setForm(initialForm);
        setOriginalForm(initialForm); // Store original data
    }, [user]);

    const setField = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

    const handleCloseModal = () => {
        // Clear all messages when closing modal
        setSuccessMessage("");
        setErrorMessage("");
        
        // Reset form to original state if user didn't save
        if (originalForm) {
            setForm(originalForm);
        }
        
        closeModal();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        
        // Basic validation
        if (!form.fullName || form.fullName.trim() === '') {
            setErrorMessage("Họ tên không được để trống");
            return;
        }
        
        if (!form.phoneNumber || form.phoneNumber.trim() === '') {
            setErrorMessage("Số điện thoại không được để trống");
            return;
        }
        
        try {
            const payload = {
                UserId: getUserId(user),
                PhoneNumber: form.phoneNumber || null,
                UserStatus: form.userStatus, // Keep as number, backend expects UserStatus enum
                FullName: form.fullName || null,
                Avatar: form.avatar || null,
                Gender: !!form.gender,
                Address: form.address || null,
                EmployeeCode: form.employeeCode || null,
                Notes: form.notes || null,
            };

            console.log("Update payload:", payload);
            const res = await adminAPI.updateStaffAccount(payload);
            console.log("Update response:", res);

            // Update local list
            if (setUsers && users) {
                setUsers(prev => prev.map(u => (getUserId(u) === getUserId(user)) ? {
                    ...u,
                    fullName: payload.FullName ?? u.fullName,
                    phoneNumber: payload.PhoneNumber ?? u.phoneNumber,
                    address: payload.Address ?? u.address,
                    gender: payload.Gender,
                    employeeCode: payload.EmployeeCode ?? u.employeeCode,
                    notes: payload.Notes ?? u.notes,
                    userStatus: payload.UserStatus,
                } : u));
            }

            setSuccessMessage(res?.data?.message || "Cập nhật thông tin thành công!");
            setErrorMessage("");
            setTimeout(() => {
                setSuccessMessage("");
                closeModal();
            }, 1500);
        } catch (error) {
            console.error("Lỗi cập nhật thông tin người dùng:", error);
            console.error("Error response:", error?.response);
            console.error("Error data:", error?.response?.data);
            
            // Extract detailed error message from backend
            let errorMessage = "Có lỗi xảy ra khi cập nhật thông tin";
            
            if (error?.response?.data) {
                // Check for different error response formats
                if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data.errors) {
                    // Handle validation errors
                    const validationErrors = Object.values(error.response.data.errors).flat();
                    errorMessage = validationErrors.join(', ');
                } else if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            setErrorMessage(errorMessage);
        }
    };

    return (
        <Modal show={!!user} onHide={handleCloseModal} centered size="xl" style={{ marginTop: '30px' }}>
            <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #48C1A6', padding: '12px 20px' }}>
                <Modal.Title style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '20px' }}>Chỉnh sửa thông tin nhân viên</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
                {successMessage && <Alert variant="success">{successMessage}</Alert>}
                {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        {/* Avatar Column */}
                        <Col md={3} className="d-flex justify-content-center">
                            <div style={{
                                background: 'linear-gradient(135deg, #7BD1C2 0%, #A8E6CF 100%)',
                                width: '100%',
                                borderRadius: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '20px 15px',
                                boxShadow: '0 6px 20px rgba(123, 209, 194, 0.3)',
                                minHeight: '250px'
                            }}>
                                {(() => {
                                    // First try to get avatar from form (user input)
                                    let avatarUrl = form.avatar && form.avatar.trim() !== '' ? form.avatar : null;
                                    
                                    // If no form avatar, try to get from original user data
                                    if (!avatarUrl) {
                                        avatarUrl = getAvatarFromAny(user);
                                    }
                                    
                                    if (avatarUrl) {
                                        return (
                                            <div style={{ textAlign: 'center' }}>
                                                <img 
                                                    src={avatarUrl} 
                                                    alt="Avatar" 
                                                    style={{ 
                                                        width: '100px', 
                                                        height: '100px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: '3px solid #fff',
                                                        boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = 'https://res.cloudinary.com/ds9p5t0mx/image/upload/v1740308752/avatar-default-icon-1975x2048-2mpk4u9k_fjciku.png';
                                                    }}
                                                />
                                                <div style={{ 
                                                    marginTop: '10px', 
                                                    color: '#2c3e50', 
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                    Avatar Preview
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div style={{ textAlign: 'center' }}>
                                                <img 
                                                    src="https://res.cloudinary.com/ds9p5t0mx/image/upload/v1740308752/avatar-default-icon-1975x2048-2mpk4u9k_fjciku.png" 
                                                    alt="avatar" 
                                                    style={{ 
                                                        width: '100px', 
                                                        height: '100px',
                                                        borderRadius: '50%',
                                                        border: '3px solid #fff',
                                                        boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
                                                    }} 
                                                />
                                                <div style={{ 
                                                    marginTop: '10px', 
                                                    color: '#2c3e50', 
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                    Default Avatar
                                                </div>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                        </Col>
                        {/* Form Column */}
                        <Col md={9}>
                            <div style={{ paddingLeft: '20px' }}>
                                <h5 style={{ 
                                    color: '#2c3e50', 
                                    marginBottom: '15px',
                                    fontWeight: '600',
                                    borderBottom: '2px solid #48C1A6',
                                    paddingBottom: '6px',
                                    fontSize: '16px'
                                }}>
                                    Thông tin cá nhân
                                </h5>
                                <Row className="mb-2">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Họ tên <span style={{ color: 'red' }}>*</span></Form.Label>
                                            <Form.Control 
                                                value={form.fullName} 
                                                onChange={e=>setField('fullName', e.target.value)}
                                                style={{ 
                                                    borderColor: '#48C1A6',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px'
                                                }}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Số điện thoại <span style={{ color: 'red' }}>*</span></Form.Label>
                                            <Form.Control 
                                                value={form.phoneNumber} 
                                                onChange={e=>setField('phoneNumber', e.target.value)}
                                                style={{ 
                                                    borderColor: '#48C1A6',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px'
                                                }}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Địa chỉ</Form.Label>
                                            <Form.Control 
                                                value={form.address} 
                                                onChange={e=>setField('address', e.target.value)}
                                                style={{ 
                                                    borderColor: '#48C1A6',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px'
                                                }}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Giới tính</Form.Label>
                                            <Form.Select 
                                                value={String(form.gender)} 
                                                onChange={e=>setField('gender', e.target.value === 'true')}
                                                style={{ 
                                                    borderColor: '#48C1A6',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                <option value={'true'}>Nam</option>
                                                <option value={'false'}>Nữ</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <h5 style={{ 
                                    color: '#2c3e50', 
                                    marginBottom: '12px',
                                    marginTop: '15px',
                                    fontWeight: '600',
                                    borderBottom: '2px solid #48C1A6',
                                    paddingBottom: '5px',
                                    fontSize: '16px'
                                }}>
                                    Thông tin công việc
                                </h5>
                                
                                <Row className="mb-2">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Mã nhân viên</Form.Label>
                                            <Form.Control 
                                                value={form.employeeCode} 
                                                onChange={e=>setField('employeeCode', e.target.value)}
                                                style={{ 
                                                    borderColor: '#48C1A6',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px'
                                                }}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Trạng thái</Form.Label>
                                            <Form.Select 
                                                value={String(form.userStatus)} 
                                                onChange={e=>setField('userStatus', Number(e.target.value))}
                                                style={{ 
                                                    borderColor: '#48C1A6',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                <option value={2}>Hoạt động</option>
                                                <option value={1}>Không hoạt động</option>
                                                <option value={0}>Bị khóa</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <h5 style={{ 
                                    color: '#2c3e50', 
                                    marginBottom: '12px',
                                    marginTop: '15px',
                                    fontWeight: '600',
                                    borderBottom: '2px solid #48C1A6',
                                    paddingBottom: '5px',
                                    fontSize: '16px'
                                }}>
                                    Thông tin bổ sung
                                </h5>
                                
                                <Row className="mb-2">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Avatar URL</Form.Label>
                                            <Form.Control 
                                                type="url" 
                                                value={form.avatar} 
                                                onChange={e=>setField('avatar', e.target.value)} 
                                                placeholder="Nhập URL avatar (tùy chọn)"
                                                style={{ 
                                                    borderColor: '#48C1A6',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px'
                                                }}
                                            />
                                            <Form.Text className="text-muted" style={{ fontSize: '11px' }}>
                                                Nhập URL hình ảnh để cập nhật avatar. Avatar sẽ hiển thị ở bên trái.
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Ghi chú</Form.Label>
                                            <Form.Control 
                                                as="textarea" 
                                                rows={2} 
                                                value={form.notes} 
                                                onChange={e=>setField('notes', e.target.value)}
                                                placeholder="Nhập ghi chú về nhân viên..."
                                                style={{ 
                                                    borderColor: '#48C1A6',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer style={{ 
                backgroundColor: '#f8f9fa', 
                borderTop: '2px solid #48C1A6',
                padding: '15px 20px',
                justifyContent: 'space-between'
            }}>
                <Button 
                    variant="outline-secondary" 
                    onClick={handleCloseModal}
                    style={{
                        borderRadius: '6px',
                        padding: '8px 20px',
                        fontWeight: '600',
                        borderColor: '#6c757d',
                        color: '#6c757d',
                        fontSize: '13px'
                    }}
                >
                    Hủy
                </Button>
                <Button 
                    variant="primary" 
                    type="submit" 
                    onClick={handleSubmit}
                    style={{
                        backgroundColor: '#48C1A6',
                        borderColor: '#48C1A6',
                        borderRadius: '6px',
                        padding: '8px 20px',
                        fontWeight: '600',
                        boxShadow: '0 3px 10px rgba(72, 193, 166, 0.3)',
                        fontSize: '13px'
                    }}
                >
                    Lưu thay đổi
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditUserModal;


