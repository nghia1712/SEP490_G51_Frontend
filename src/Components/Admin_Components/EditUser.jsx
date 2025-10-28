import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Alert, Row, Col } from "react-bootstrap";
import adminAPI from "../../API/adminAPI";

const EditUser = ({ user, closeModal, users, setUsers }) => {
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
        avatar: "",
    });
    const [originalForm, setOriginalForm] = useState(null); // Store original data
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [avatarError, setAvatarError] = useState("");
    const [userAvatarFromAPI, setUserAvatarFromAPI] = useState(null);

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
                    
                    const avatarFromAPI = response.data?.data?.avatar || response.data?.avatar;
                    console.log("Avatar from API:", avatarFromAPI);
                    
                    // Save avatar from API to state
                    if (avatarFromAPI) {
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
            avatar: "", // Always start with empty avatar field
        };
        
        console.log("Initial form:", initialForm);
        
        setForm(initialForm);
        setOriginalForm(initialForm);
    }, [user]);

    const setField = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
        
        // Validate avatar URL when changed
        if (name === 'avatar') {
            validateAvatarUrl(value);
        }
    };

    const validateAvatarUrl = (url) => {
        if (!url || url.trim() === '') {
            setAvatarError("");
            return;
        }
        
        // Check for base64 data URL first
        if (url.startsWith('data:image/')) {
            setAvatarError("Không thể sử dụng base64 data URL. Vui lòng sử dụng URL hình ảnh thông thường (ví dụ: https://example.com/image.jpg) hoặc chọn file hình ảnh từ máy tính.");
            console.log("Base64 data URL blocked:", url.substring(0, 50) + "...");
            return;
        }
        
        // Validate regular URL format
        try {
            const urlObj = new URL(url);
            
            // Check if it's a valid image URL
            const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const pathname = urlObj.pathname.toLowerCase();
            const hasValidExtension = validImageExtensions.some(ext => pathname.endsWith(ext));
            
            // Also allow URLs without extension (might be dynamic image URLs)
            if (hasValidExtension || url.includes('image') || url.includes('avatar') || url.includes('photo') || url.includes('img')) {
                setAvatarError("");
                console.log("Valid image URL entered:", url);
            } else {
                setAvatarError("⚠️ URL không phải là hình ảnh hợp lệ. Vui lòng nhập URL hình ảnh (ví dụ: https://example.com/image.jpg) hoặc chọn file hình ảnh.");
                console.log("URL is not an image:", url);
            }
        } catch (error) {
            setAvatarError("URL không hợp lệ. Vui lòng nhập URL đúng định dạng (ví dụ: https://example.com/image.jpg).");
            console.log("Invalid URL format:", url);
        }
    };


    const handleCloseModal = () => {
        console.log("handleCloseModal called");
        
        // Clear all messages when closing modal
        setSuccessMessage("");
        setErrorMessage("");
        setAvatarError("");
        setUserAvatarFromAPI(null);
        
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
        
        // Validate avatar URL if provided
        if (form.avatar && form.avatar.trim() !== '') {
            validateAvatarUrl(form.avatar);
            if (avatarError) {
                setErrorMessage("Vui lòng sửa lỗi URL avatar trước khi lưu.");
                return;
            }
        }
        
        // Validate số điện thoại VN nếu có nhập
        if (form.phoneNumber && form.phoneNumber.trim() !== '') {
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(form.phoneNumber)) {
                setErrorMessage("Số điện thoại VN+84 phải có 10 ký tự và bắt đầu bằng 0");
                return;
            }
        }
        
        try {
            // Process avatar data - handle only regular URLs, block base64
            let processedAvatar = null;
            if (form.avatar && form.avatar.trim() !== '') {
                const avatarData = form.avatar.trim();
                
                // Check if it's base64 data
                if (avatarData.startsWith('data:image/')) {
                    console.error("Base64 data URL detected in handleSubmit - blocking submission");
                    setErrorMessage("Không thể sử dụng base64 data URL. Vui lòng sử dụng URL hình ảnh thông thường hoặc chọn file hình ảnh từ máy tính.");
                    return;
                }
                
                // Validate URL format
                try {
                    const urlObj = new URL(avatarData);
                    const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
                    const pathname = urlObj.pathname.toLowerCase();
                    const hasValidExtension = validImageExtensions.some(ext => pathname.endsWith(ext));
                    
                    if (!hasValidExtension && !avatarData.includes('image') && !avatarData.includes('avatar') && !avatarData.includes('photo') && !avatarData.includes('img')) {
                        setErrorMessage("⚠️ URL không phải là hình ảnh hợp lệ. Vui lòng nhập URL hình ảnh hoặc chọn file hình ảnh.");
                        return;
                    }
                } catch (error) {
                    setErrorMessage("URL không hợp lệ. Vui lòng nhập URL đúng định dạng.");
                    return;
                }
                
                // Regular URL
                console.log("Detected regular URL:", avatarData);
                processedAvatar = avatarData;
            }
            
            const payload = {
                UserId: getUserId(user),
                PhoneNumber: form.phoneNumber && form.phoneNumber.trim() !== '' ? form.phoneNumber : null,
                FullName: form.fullName && form.fullName.trim() !== '' ? form.fullName : null,
                Avatar: processedAvatar,
                Gender: !!form.gender,
                Address: form.address && form.address.trim() !== '' ? form.address : null,
                EmployeeCode: null, // Không sử dụng - backend tự quản lý
                Notes: form.notes && form.notes.trim() !== '' ? form.notes : null,
            };

            console.log("Update payload:", payload);
            console.log("Avatar in payload:", payload.Avatar);
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
                    employeeCode: u.employeeCode, // Giữ nguyên - không cập nhật
                    notes: payload.Notes ?? u.notes,
                    avatar: payload.Avatar, // Cập nhật avatar
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
                                {(() => {
                                    console.log("=== Avatar Display Logic ===");
                                    console.log("form.avatar:", form.avatar);
                                    console.log("user data:", user);
                                    
                                    // If no user data, show default
                                    if (!user) {
                                        console.log("No user data, showing default");
                                        return (
                                            <div style={{ textAlign: 'center' }}>
                                                <img 
                                                    src="/images/avatar/image1.png" 
                                                    alt="Default Avatar" 
                                                    style={{ 
                                                        width: '100px', 
                                                        height: '100px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
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

                                    // Get avatar URL - prioritize form input, then user data
                                    let avatarUrl = null;
                                    
                                    // First check if user entered a new avatar URL
                                    if (form.avatar && form.avatar.trim() !== '') {
                                        const avatarInput = form.avatar.trim();
                                        
                                        // Validate URL before using it
                                        if (avatarInput.startsWith('data:image/')) {
                                            // Block base64 - don't display
                                            console.log("Base64 data URL blocked from display");
                                            avatarUrl = null;
                                        } else if (avatarInput.startsWith('http://') || avatarInput.startsWith('https://')) {
                                            // Check if it's a valid image URL
                                            const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
                                            const hasValidExtension = validImageExtensions.some(ext => avatarInput.toLowerCase().includes(ext));
                                            
                                            if (hasValidExtension || avatarInput.includes('image') || avatarInput.includes('avatar') || avatarInput.includes('photo') || avatarInput.includes('img')) {
                                                avatarUrl = avatarInput;
                                                console.log("Using form avatar URL:", avatarUrl);
                                            } else {
                                                console.log("URL is not an image URL:", avatarInput);
                                                avatarUrl = null;
                                            }
                                        } else if (avatarInput.startsWith('/images/')) {
                                            // Local path
                                            avatarUrl = `http://localhost:5137${avatarInput}`;
                                            console.log("Using form avatar local path:", avatarUrl);
                                        } else {
                                            // Invalid URL - don't display
                                            console.log("Invalid avatar URL format:", avatarInput);
                                            avatarUrl = null;
                                        }
                                    } else {
                                        // First try to get avatar from API response
                                        if (userAvatarFromAPI) {
                                            // Construct full URL for avatar from API
                                            if (userAvatarFromAPI.startsWith('/images/')) {
                                                avatarUrl = `http://localhost:5137${userAvatarFromAPI}`;
                                            } else if (userAvatarFromAPI.startsWith('http://') || userAvatarFromAPI.startsWith('https://')) {
                                                avatarUrl = userAvatarFromAPI;
                                            } else {
                                                avatarUrl = `http://localhost:5137/images/${userAvatarFromAPI}`;
                                            }
                                            console.log("Using avatar from API:", avatarUrl);
                                        } else {
                                            // Fallback: Get avatar from user data
                                            avatarUrl = getAvatarFromAny(user);
                                            console.log("Using user avatar:", avatarUrl);
                                            
                                            // If no avatar found in user data, check if user has avatar in database
                                            if (!avatarUrl) {
                                                console.log("No avatar found in user data, checking if user has avatar in database...");
                                                // This means the user might have an avatar but it's not being returned by the API
                                                // For now, we'll show default avatar
                                                console.log("User might have avatar in database but API not returning it");
                                            }
                                        }
                                    }
                                    
                                    if (avatarUrl) {
                                        console.log("Displaying avatar:", avatarUrl);
                                        console.log("Avatar URL type:", typeof avatarUrl);
                                        console.log("Avatar URL length:", avatarUrl.length);
                                        
                                        // Additional validation for image URLs
                                        const isValidImageUrl = avatarUrl.startsWith('http://') || 
                                                               avatarUrl.startsWith('https://') ||
                                                               avatarUrl.includes('/images/');
                                        
                                        if (!isValidImageUrl) {
                                            console.log("Invalid image URL, showing default");
                                            avatarUrl = null;
                                        }
                                    }
                                    
                                    if (avatarUrl) {
                                        return (
                                            <div style={{ textAlign: 'center' }}>
                                                <img 
                                                    src={avatarUrl} 
                                                    alt="User Avatar" 
                                                    style={{ 
                                                        width: '100px', 
                                                        height: '100px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: '3px solid #fff',
                                                        boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
                                                    }}
                                                    onError={(e) => {
                                                        console.log("Avatar load error:", e.target.src);
                                                        console.log("Falling back to default avatar");
                                                        e.target.src = '/images/avatar/image1.png';
                                                    }}
                                                    onLoad={() => {
                                                        console.log("Avatar loaded successfully:", avatarUrl);
                                                    }}
                                                />
                                                <div style={{ 
                                                    marginTop: '10px', 
                                                    color: '#2c3e50', 
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                    {form.avatar && form.avatar.trim() !== '' ? 'Avatar Preview' : 'User Avatar'}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        console.log("No valid avatar found, showing default");
                                        return (
                                            <div style={{ textAlign: 'center' }}>
                                                <img 
                                                    src="/images/avatar/image1.png" 
                                                    alt="Default Avatar" 
                                                    style={{ 
                                                        width: '100px', 
                                                        height: '100px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
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
                                            <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Avatar URL</Form.Label>
                                            <Form.Control 
                                                type="url" 
                                                value={form.avatar} 
                                                onChange={e=>setField('avatar', e.target.value)} 
                                                placeholder="Nhập URL hình ảnh (ví dụ: https://example.com/image.jpg)"
                                                isInvalid={!!avatarError}
                                                style={{ 
                                                    borderColor: avatarError ? '#dc3545' : '#48C1A6',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px'
                                                }}
                                            />
                                            {avatarError && (
                                                <Form.Control.Feedback type="invalid" style={{ fontSize: '11px' }}>
                                                    {avatarError}
                                                </Form.Control.Feedback>
                                            )}
                                            <Form.Text className="text-muted" style={{ fontSize: '11px' }}>
                                                ✅ Chỉ chấp nhận URL hình ảnh hợp lệ. ❌ Không hỗ trợ base64 data URL.
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
