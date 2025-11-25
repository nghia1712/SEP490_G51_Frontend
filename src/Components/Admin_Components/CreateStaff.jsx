import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Form, Button, Alert, InputGroup } from "react-bootstrap";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import adminAPI from "../../API/adminAPI";
import userAPI from "../../API/userAPI";

function CreateStaff({ onClose, onCreated }) {
  const navigate = useNavigate();
  
  // Align with backend AdminCreateAccountRequest/CreateAccountRequest
  const [data, setFormData] = useState({
    fullName: "",
    email: "",
    userName: "", // Add UserName field
    phoneNumber: "",
    password: "",
    address: "",
    gender: true, // true=Nam, false=Nữ
    employeeCode: null, // Backend sẽ tự động generate
    notes: "",
    staffRole: 0, // 0=Sales,1=Purchases,2=Warehouse,3=Account
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [closeAfterCountdown, setCloseAfterCountdown] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...data, [name]: value });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setStatusMessage("Vui lòng chọn file hình ảnh hợp lệ (jpg, jpeg, png)");
      setIsError(true);
      e.target.value = "";
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage("Kích thước file không được vượt quá 5MB");
      setIsError(true);
      e.target.value = "";
      return;
    }

    // Set preview
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarFile(file);
    setIsError(false);
    setStatusMessage("");
  };

  const handleRemoveAvatar = () => {
    // Clear file and preview
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Cleanup preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Countdown effect: after success, wait N seconds then refresh + close
  useEffect(() => {
    let timer;
    if (countdown > 0 && closeAfterCountdown) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0 && closeAfterCountdown && !isError) {
      (async () => {
        if (typeof onCreated === 'function') {
          try { await onCreated(); } catch {}
        }
        if (typeof onClose === 'function') {
          onClose();
        }
      })();
      setCloseAfterCountdown(false);
    }
    return () => clearTimeout(timer);
  }, [countdown, closeAfterCountdown, isError, onCreated, onClose]);

  // Hàm validate mật khẩu
  const validatePassword = (password) => {
    const errors = [];
    if (!password || password.length < 8) {
      errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }
    // Must contain at least one lower, one upper, one digit, one special
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;
    if (!complexityRegex.test(password)) {
      errors.push('Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
    }
    return errors;
  };

  // Check email duplication
  const checkEmailDuplicate = async (email) => {
    if (!email || email.trim() === '') return false;
    
    try {
      const response = await adminAPI.getAccountList();
      const users = response.data || response;
      
      const isDuplicate = users.some(user => 
        user.email && user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (isDuplicate) {
        setStatusMessage('Email này đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.');
        setIsError(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking email:', error);
      setStatusMessage('Không thể kiểm tra email. Vui lòng thử lại.');
      setIsError(true);
      return true;
    }
  };

  // Check phone number duplication
  const checkPhoneDuplicate = async (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === '') return false;
    
    try {
      const response = await adminAPI.getAccountList();
      const users = response.data || response;
      
      const isDuplicate = users.some(user => 
        user.phoneNumber && user.phoneNumber === phoneNumber
      );
      
      if (isDuplicate) {
        setStatusMessage('Số điện thoại đã được đăng ký trong hệ thống. Vui lòng sử dụng số điện thoại khác.');
        setIsError(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking phone:', error);
      setStatusMessage('Không thể kiểm tra số điện thoại. Vui lòng thử lại.');
      setIsError(true);
      return true;
    }
  };

  // Remove real-time validation - only validate on submit

  // No extra UI logic required beyond basic field changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsError(false);
    setStatusMessage("");
    setPasswordErrors([]);
    
    // Basic validation - chỉ validate các trường bắt buộc
    if (!data.email || data.email.trim().length === 0) {
      setStatusMessage('Vui lòng nhập email');
      setIsError(true);
      return;
    }
    
    if (!data.password || data.password.trim().length === 0) {
      setStatusMessage('Vui lòng nhập mật khẩu');
      setIsError(true);
      return;
    }
    
    // Validate password strength
    const passwordValidationErrors = validatePassword(data.password);
    if (passwordValidationErrors.length > 0) {
      setIsError(true);
      setPasswordErrors(passwordValidationErrors);
      setStatusMessage('Mật khẩu không đáp ứng yêu cầu:');
      return;
    }
    
    // Validate số điện thoại VN nếu có nhập
    if (data.phoneNumber && data.phoneNumber.trim() !== '') {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(data.phoneNumber)) {
        setStatusMessage('Số điện thoại VN+84 phải có 10 chữ số và bắt đầu bằng 0');
        setIsError(true);
        return;
      }
    }
    
    // Employee code validation removed - Backend tự động generate
    
    // Check email duplication before submit
    const isEmailDuplicate = await checkEmailDuplicate(data.email);
    if (isEmailDuplicate) {
      return; // Stop submission if email is duplicate
    }
    
    // Check phone number duplication before submit (only if phone number is provided)
    if (data.phoneNumber && data.phoneNumber.trim() !== '') {
      const isPhoneDuplicate = await checkPhoneDuplicate(data.phoneNumber);
      if (isPhoneDuplicate) {
        return; // Stop submission if phone is duplicate
      }
    }
    
    try {
      let avatarPathToCreate = null;

      // Upload avatar file if selected
      if (avatarFile) {
        try {
          console.log("Uploading avatar file:", avatarFile.name);
          const uploadResponse = await userAPI.uploadAvatar(avatarFile);
          console.log("Upload response:", uploadResponse);
          
          if (uploadResponse?.data?.data) {
            avatarPathToCreate = uploadResponse.data.data;
            console.log("Avatar uploaded successfully:", avatarPathToCreate);
          } else {
            throw new Error("Upload response không có data");
          }
        } catch (error) {
          console.error("Upload avatar error:", error);
          setStatusMessage("Không thể upload ảnh đại diện: " + (error.response?.data?.message || error.message));
          setIsError(true);
          return;
        }
      }

      const payload = {
        Email: data.email,
        UserName: data.userName && data.userName.trim() !== '' ? data.userName : data.email, // Use email as UserName if not provided
        PhoneNumber: data.phoneNumber && data.phoneNumber.trim() !== '' ? data.phoneNumber : null,
        Password: data.password,
        FullName: data.fullName && data.fullName.trim() !== '' ? data.fullName : null,
        Gender: data.gender,
        Address: data.address && data.address.trim() !== '' ? data.address : null,
        EmployeeCode: null, // Backend sẽ tự động generate
        Notes: data.notes && data.notes.trim() !== '' ? data.notes : null,
        StaffRole: Number(data.staffRole),
        Avatar: avatarPathToCreate
      };
      const response = await adminAPI.createStaffAccount(payload);
      setStatusMessage(response.data?.message || 'Tạo thành công');
      setIsError(false);
      setCloseAfterCountdown(true);
      setCountdown(3);
    } catch (error) {
      setIsError(true);
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi tạo nhân viên. Vui lòng thử lại.";
      setStatusMessage(errorMessage);
    }
  };

  // --- end minimal helpers ---

  return (
      <div className="p-2">
        {statusMessage && (
          <Alert variant={isError ? "danger" : "success"} style={{ fontSize: '13px', marginBottom: '10px' }}>
            <div>{statusMessage}</div>
            {passwordErrors.length > 0 && (
              <ul style={{ marginTop: '8px', marginBottom: '0' }}>
                {passwordErrors.map((error, index) => (
                  <li key={index} style={{ fontSize: '12px' }}>{error}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}
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
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                />
                {(() => {
                  // Priority: avatarPreview > default
                  let avatarUrl = null;
                  
                  if (avatarPreview) {
                    avatarUrl = avatarPreview;
                  } else {
                    avatarUrl = '/images/avatar/image1.png';
                  }
                  
                  const showRemoveButton = avatarFile || avatarPreview;
                  
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
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0" style={{ color: '#2c3e50', fontWeight: '600' }}>Tạo mới nhân viên</h4>
                  <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
                </div>
                
                {/* Divider */}
                <hr style={{ borderColor: '#48C1A6', borderWidth: '2px', margin: '20px 0' }} />
                
                {/* Scrollable Form */}
                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                  {/* Thông tin cá nhân */}
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
                        <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Họ tên <span style={{ color: "red" }}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={data.fullName}
                        onChange={handleChange}
                        required
                        onInvalid={(e) => e.target.setCustomValidity("Vui lòng không để trống")}
                        onInput={(e) => e.target.setCustomValidity("")}
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
                    <Form.Group controlId="formEmail">
                        <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Email <span style={{ color: "red" }}>*</span></Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={handleChange}
                        required
                        onInvalid={(e) => e.target.setCustomValidity("Vui lòng không để trống")}
                        onInput={(e) => e.target.setCustomValidity("")}
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
                <Row className="mb-1">
                  <Col md={6}>
                    <Form.Group controlId="formAddress">
                      <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Địa chỉ <span style={{ color: "red" }}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={data.address}
                        onChange={handleChange}
                        required
                        onInvalid={(e) => e.target.setCustomValidity("Vui lòng không để trống")}
                        onInput={(e) => e.target.setCustomValidity("")}
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
                    <Form.Group controlId="formPhoneNumber">
                      <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Số điện thoại <span style={{ color: "red" }}>*</span></Form.Label>
                      <Form.Control
                        type="tel"
                        name="phoneNumber"
                        value={data.phoneNumber}
                        onChange={handleChange}
                        pattern="^0\d{9}$"
                        required
                        placeholder="0123456789"
                        onInvalid={(e) => {
                          if (!e.target.value || e.target.value.trim() === '') {
                            e.target.setCustomValidity("Vui lòng không để trống");
                          } else {
                            e.target.setCustomValidity("Số điện thoại phải bắt đầu bằng 0 và có đúng 10 số");
                          }
                        }}
                        onInput={(e) => e.target.setCustomValidity("")}
                        style={{ 
                          borderColor: '#48C1A6',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '13px'
                        }}
                      />
                      <Form.Text className="text-muted" style={{ fontSize: '11px' }}>
                        Ví dụ: 0123456789 (10 số, bắt đầu bằng 0)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                
                {/* Thông tin tài khoản */}
                <h5 style={{ 
                  color: '#2c3e50', 
                  marginBottom: '15px',
                  marginTop: '25px',
                  fontWeight: '600',
                  borderBottom: '2px solid #48C1A6',
                  paddingBottom: '6px',
                  fontSize: '16px'
                }}>
                  Thông tin tài khoản
                </h5>
                <Row className="mb-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Vai trò <span style={{ color: "red" }}>*</span></Form.Label>
                      <Form.Select 
                        name="staffRole" 
                        value={data.staffRole} 
                        onChange={handleChange}
                        required
                        onInvalid={(e) => e.target.setCustomValidity("Vui lòng không để trống")}
                        onInput={(e) => e.target.setCustomValidity("")}
                        style={{ 
                          borderColor: '#48C1A6',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '13px'
                        }}
                      >
                        <option value={0}>Nhân viên Bán Hàng</option>
                        <option value={1}>Nhân viên Mua Hàng</option>
                        <option value={2}>Nhân viên Kho</option>
                        <option value={3}>Nhân viên Kế Toán</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formGender">
                      <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Giới tính</Form.Label>
                      <Form.Select name="gender" value={String(data.gender)} onChange={(e)=> setFormData(prev=>({...prev, gender: e.target.value === 'true'}))} style={{ 
                        borderColor: '#48C1A6',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '13px'
                      }}>
                        <option value={'true'}>Nam</option>
                        <option value={'false'}>Nữ</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Mật khẩu <span style={{ color: "red" }}>*</span></Form.Label>
                        <InputGroup>
                          <Form.Control 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            value={data.password} 
                            onChange={handleChange}
                            required
                            placeholder="Nhập mật khẩu mới"
                            onInvalid={(e) => e.target.setCustomValidity("Vui lòng không để trống")}
                            onInput={(e) => e.target.setCustomValidity("")}
                            style={{ 
                              borderColor: '#48C1A6',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '13px'
                            }}
                          />
                          <InputGroup.Text 
                            style={{ cursor: 'pointer', borderColor: "#48C1A6" }} 
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </InputGroup.Text>
                        </InputGroup>
                        <Form.Text className="text-muted" style={{ fontSize: '11px' }}>
                          Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                        </Form.Text>
                      </Form.Group>
                  </Col>
                  <Col md={6}>
                    {/* Empty column for balance */}
                  </Col>
                </Row>
                <Row className="mb-2">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label style={{ fontWeight: '600', color: '#34495e', fontSize: '13px' }}>Ghi chú</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={1} 
                        name="notes" 
                        value={data.notes} 
                        onChange={handleChange} 
                        placeholder="Nhập ghi chú về nhân viên..."
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
                </div>
                
                {/* Bottom Divider */}
                <hr style={{ borderColor: '#48C1A6', borderWidth: '2px', margin: '20px 0' }} />
                
                {/* Action Buttons */}
                <div className="d-flex justify-content-end gap-2">
                  <Button 
                    variant="secondary" 
                    onClick={onClose}
                    style={{ 
                      padding: '8px 20px',
                      fontSize: '14px',
                      borderRadius: '6px'
                    }}
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit"
                    style={{ 
                      background: '#48C1A6', 
                      border: 'none',
                      padding: '8px 20px',
                      fontSize: '14px',
                      borderRadius: '6px'
                    }}
                  >
                    Tạo nhân viên
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
  );
}

export default CreateStaff;


