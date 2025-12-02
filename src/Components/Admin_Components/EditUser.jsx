import React, { useState, useEffect, useRef } from "react";
import { Button, Modal, Form, Alert, Row, Col } from "react-bootstrap";
import adminAPI from "../../API/adminAPI";
import userAPI from "../../API/userAPI";

const EditUser = ({ user, closeModal, users, setUsers, onUpdateSuccess }) => {
    console.log("=== EditUser Component Rendered ===");
    console.log("user prop:", user);
    console.log("user exists:", !!user);
    
    const [form, setForm] = useState({
        fullName: "",
        phoneNumber: "",
        address: "",
        gender: true,
        employeeCode: "", // Không sử dụng - chỉ để tương thích
        notes: "",
    });
    const [originalForm, setOriginalForm] = useState(null); // Store original data
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [userAvatarFromAPI, setUserAvatarFromAPI] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [removeAvatar, setRemoveAvatar] = useState(false);
    const fileInputRef = useRef(null);

    const getUserId = (u) => u?.userId || u?.UserId || u?._id || u?.accountId || u?.AccountId;

    // Helper function to get avatar URL from user data
    const getAvatarFromAny = (u) => {
        console.log("getAvatarFromAny called with user:", u);
        
        // Check various possible avatar field locations
        const avatar = u?.avatar || u?.Avatar || 
                      u?.profile?.avatar || u?.profile?.Avatar ||
                      u?.account?.avatar || u?.account?.Avatar ||
                      u?.imageUrl || u?.ImageUrl ||
                      u?.profileImage || u?.ProfileImage;
        
        console.log("Found avatar field:", avatar);
        
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
                    return `https://api.bbpharmacy.site/${avatar}`;
                } else {
                    // Try with .jpg extension
                    return `https://api.bbpharmacy.site/${avatar}.jpg`;
                }
            }
            // If it's just a filename, assume it's in the images folder
            if (avatar.startsWith('/')) {
                return `https://api.bbpharmacy.site/${avatar}`;
            }
            return `https://api.bbpharmacy.site//images/${avatar}`;
        }
        
        return null; // No avatar found
    };

    useEffect(() => {
        if (!user) return;
        
        console.log("=== useEffect - Initializing Form ===");
        console.log("User data:", user);
        
        const userAvatar = getAvatarFromAny(user);
        console.log("User avatar found:", userAvatar);
        
        // Test: Call getAccountDetails API to see if user has avatar in database
        const testAvatarFromAPI = async () => {
            try {
                const userId = user?.userId || user?.UserId || user?._id || user?.accountId || user?.AccountId;
                console.log("Testing API call for userId:", userId);
                
                if (userId) {
                    const response = await adminAPI.getAccountDetails(userId);
                    console.log("API response for avatar test:", response);
                    console.log("API response data:", response.data);
                    console.log("API response data.data:", response.data?.data);
                    
                    const avatarFromAPI = response.data?.data?.avatar ?? response.data?.avatar;
                    console.log("Avatar from API:", avatarFromAPI);
                    
                    // Save avatar from API to state (including null to indicate deletion)
                    // Explicitly set to null if API returns null/empty, otherwise set the value
                    if (avatarFromAPI === null || avatarFromAPI === '' || avatarFromAPI === undefined) {
                        setUserAvatarFromAPI(null);
                        console.log("Avatar is null/empty in API - cleared from state");
                    } else {
                        setUserAvatarFromAPI(avatarFromAPI);
                        console.log("Avatar saved to state:", avatarFromAPI);
                    }
                }
            } catch (error) {
                console.log("API test error:", error);
            }
        };
        
        testAvatarFromAPI();
        
        const initialForm = {
            fullName: user?.fullName || user?.profile?.fullName || "",
            phoneNumber: user?.phoneNumber || user?.profile?.phoneNumber || "",
            address: user?.address || user?.profile?.address || "",
            gender: (user?.gender ?? user?.profile?.gender) ?? true,
            employeeCode: "", // Không sử dụng - chỉ để tương thích
            notes: user?.notes || user?.profile?.notes || "",
        };
        
        console.log("Initial form:", initialForm);
        
        setForm(initialForm);
        setOriginalForm(initialForm);
    }, [user]);

    // Cleanup preview URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const setField = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setErrorMessage("Vui lòng chọn file hình ảnh hợp lệ (jpg, jpeg, png)");
            e.target.value = "";
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage("Kích thước file không được vượt quá 5MB");
            e.target.value = "";
            return;
        }

        // Set preview
        setAvatarPreview(URL.createObjectURL(file));
        setAvatarFile(file);
        setRemoveAvatar(false); // Reset remove flag when new file is selected
        setErrorMessage("");
    };

    const handleRemoveAvatar = () => {
        // Clear file and preview
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(null);
        setAvatarFile(null);
        setRemoveAvatar(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


    const handleCloseModal = () => {
        console.log("handleCloseModal called");
        
        // Clear all messages when closing modal
        setSuccessMessage("");
        setErrorMessage("");
        setUserAvatarFromAPI(null);
        setAvatarFile(null);
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(null);
        setRemoveAvatar(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        
        // Reset form to original state if user didn't save
        if (originalForm) {
            console.log("Resetting form to original state");
            setForm(originalForm);
        }
        
        console.log("Calling closeModal");
        closeModal();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        
        // Basic validation - chỉ validate các trường bắt buộc khác nếu có
        
        // Validate số điện thoại VN nếu có nhập
        if (form.phoneNumber && form.phoneNumber.trim() !== '') {
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(form.phoneNumber)) {
                setErrorMessage("Số điện thoại VN+84 phải có 10 ký tự và bắt đầu bằng 0");
                return;
            }
        }
        
        try {
            let avatarPathToUpdate = null;

            // If removeAvatar is true, set to empty string to remove avatar
            // Backend only updates if Avatar != null, so we need to send empty string to delete
            if (removeAvatar) {
                avatarPathToUpdate = ""; // Send empty string to delete avatar (backend will handle it)
            } 
            // Upload avatar file if selected
            else if (avatarFile) {
                try {
                    console.log("Uploading avatar file:", avatarFile.name);
                    const uploadResponse = await userAPI.uploadAvatar(avatarFile);
                    console.log("Upload response:", uploadResponse);
                    
                    if (uploadResponse?.data?.data) {
                        avatarPathToUpdate = uploadResponse.data.data;
                        console.log("Avatar uploaded successfully:", avatarPathToUpdate);
                    } else {
                        throw new Error("Upload response không có data");
                    }
                } catch (error) {
                    console.error("Upload avatar error:", error);
                    setErrorMessage("Không thể upload ảnh đại diện: " + (error.response?.data?.message || error.message));
                    return;
                }
            }

            const payload = {
                UserId: getUserId(user),
                PhoneNumber: form.phoneNumber && form.phoneNumber.trim() !== '' ? form.phoneNumber : null,
                FullName: form.fullName && form.fullName.trim() !== '' ? form.fullName : null,
                // Send empty string to delete avatar, null to skip update, or path to update
                Avatar: removeAvatar ? "" : avatarPathToUpdate,
                Gender: !!form.gender,
                Address: form.address && form.address.trim() !== '' ? form.address : null,
                EmployeeCode: null, // Không sử dụng - backend tự quản lý
                Notes: form.notes && form.notes.trim() !== '' ? form.notes : null,
            };

            console.log("Update payload:", payload);
            const res = await adminAPI.updateStaffAccount(payload);
            console.log("Update response:", res);

            // Update local list
            if (setUsers && users) {
                setUsers(prev => prev.map(u => {
                    if (getUserId(u) === getUserId(user)) {
                        // Create updated user without avatar fields first
                        const { avatar, Avatar, imageUrl, ImageUrl, profileImage, ProfileImage, ...userRest } = u;
                        const updatedUser = {
                            ...userRest,
                            fullName: payload.FullName ?? u.fullName,
                            phoneNumber: payload.PhoneNumber ?? u.phoneNumber,
                            address: payload.Address ?? u.address,
                            gender: payload.Gender,
                            employeeCode: u.employeeCode, // Giữ nguyên - không cập nhật
                            notes: payload.Notes ?? u.notes,
                        };
                        
                        // Handle profile separately
                        if (u.profile) {
                            const { avatar: pAvatar, Avatar: pAvatar2, imageUrl: pImg, ImageUrl: pImg2,
                                    profileImage: pProfImg, ProfileImage: pProfImg2, ...profileRest } = u.profile;
                            updatedUser.profile = { ...profileRest };
                        }
                        
                        // Handle avatar update: if payload.Avatar is explicitly set (including null), use it
                        // If removeAvatar is true or payload.Avatar is null, DELETE the avatar fields
                        if (removeAvatar || payload.Avatar === null) {
                            // Don't add avatar fields at all - they're already removed by destructuring
                            // But ensure they're not accidentally added back
                            delete updatedUser.avatar;
                            delete updatedUser.Avatar;
                            delete updatedUser.imageUrl;
                            delete updatedUser.ImageUrl;
                            delete updatedUser.profileImage;
                            delete updatedUser.ProfileImage;
                            if (updatedUser.profile) {
                                delete updatedUser.profile.avatar;
                                delete updatedUser.profile.Avatar;
                                delete updatedUser.profile.imageUrl;
                                delete updatedUser.profile.ImageUrl;
                                delete updatedUser.profile.profileImage;
                                delete updatedUser.profile.ProfileImage;
                            }
                        } else if (payload.Avatar !== null && payload.Avatar !== undefined) {
                            // Add new avatar
                            updatedUser.avatar = payload.Avatar;
                            updatedUser.Avatar = payload.Avatar;
                            // Also update in nested objects
                            if (updatedUser.profile) {
                                updatedUser.profile.avatar = payload.Avatar;
                                updatedUser.profile.Avatar = payload.Avatar;
                            }
                        }
                        
                        return updatedUser;
                    }
                    return u;
                }));
            }

            setSuccessMessage(res?.data?.message || "Cập nhật thông tin thành công!");
            setErrorMessage("");
            
            // Call callback to refresh user list
            if (onUpdateSuccess) {
                await onUpdateSuccess();
            }
            
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
                <Form>
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
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/jpeg,image/jpg,image/png"
                                    style={{ display: 'none' }}
                                />
                                {(() => {
                                    // Priority: removeAvatar > avatarPreview > userAvatarFromAPI > user data > default
                                    let avatarUrl = null;
                                    
                                    if (removeAvatar) {
                                        // User clicked remove, show default
                                        avatarUrl = '/images/avatar/image1.png';
                                    } else if (avatarPreview) {
                                        // New file selected, show preview
                                        avatarUrl = avatarPreview;
                                    } else if (userAvatarFromAPI !== null && userAvatarFromAPI !== undefined) {
                                        // Avatar from API (explicitly check for null/undefined to handle deleted avatars)
                                        if (userAvatarFromAPI.startsWith('/images/')) {
                                            avatarUrl = `https://api.bbpharmacy.site/${userAvatarFromAPI}`;
                                        } else if (userAvatarFromAPI.startsWith('http://') || userAvatarFromAPI.startsWith('https://')) {
                                            avatarUrl = userAvatarFromAPI;
                                        } else {
                                            avatarUrl = `https://api.bbpharmacy.site//images/${userAvatarFromAPI}`;
                                        }
                                    } else if (userAvatarFromAPI === null) {
                                        // API explicitly returned null (avatar deleted), show default
                                        avatarUrl = '/images/avatar/image1.png';
                                    } else if (user) {
                                        // Fallback to user data if API hasn't been called yet
                                        avatarUrl = getAvatarFromAny(user);
                                    }
                                    
                                    // Final fallback to default
                                    if (!avatarUrl) {
                                        avatarUrl = '/images/avatar/image1.png';
                                    }
                                    
                                    // Show remove button if:
                                    // 1. User has uploaded a new file (avatarFile || avatarPreview)
                                    // 2. OR user has an existing avatar (not default)
                                    const isDefaultAvatar = avatarUrl === '/images/avatar/image1.png' || 
                                                          avatarUrl.includes('/images/avatar/image1.png');
                                    const hasExistingAvatar = !isDefaultAvatar && !removeAvatar && 
                                                             (userAvatarFromAPI || getAvatarFromAny(user));
                                    const showRemoveButton = (avatarFile || avatarPreview) || hasExistingAvatar;
                                    
                                    return (
                                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div 
                                                style={{ 
                                                    display: 'inline-block',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s',
                                                    marginBottom: showRemoveButton ? '15px' : '0'
                                                }}
                                                onClick={handleAvatarClick}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                <img 
                                                    src={avatarUrl} 
                                                    alt="Avatar" 
                                                    style={{ 
                                                        width: '100px', 
                                                        height: '100px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: '3px solid #fff',
                                                        boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                                                        pointerEvents: 'none'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = '/images/avatar/image1.png';
                                                    }}
                                                />
                                            </div>
                                            {showRemoveButton && (
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveAvatar();
                                                    }}
                                                    style={{
                                                        padding: '4px 16px',
                                                        fontSize: '12px',
                                                        borderRadius: '6px',
                                                        width: 'auto',
                                                        minWidth: '100px'
                                                    }}
                                                >
                                                    Xóa ảnh
                                                </Button>
                                            )}
                                        </div>
                                    );
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
                                            <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Họ tên</Form.Label>
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
                                            <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Số điện thoại</Form.Label>
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
                                    Thông tin bổ sung
                                </h5>
                                
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
                justifyContent: 'flex-end',
                gap: '10px'
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

export default EditUser;
