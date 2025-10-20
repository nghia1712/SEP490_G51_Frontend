import React, { useState, useEffect } from "react";
import { Row, Col, Form, Button, Alert, InputGroup } from "react-bootstrap";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import adminAPI from "../../API/adminAPI";

function CreateStaff({ onClose }) {
  const navigate = useNavigate();
  
  // Align with backend AdminCreateAccountRequest/CreateAccountRequest
  const [data, setFormData] = useState({
    fullName: "",
    email: "",
    userName: "", // Add UserName field
    phoneNumber: "",
    password: "",
    avatar: "", // Add avatar field back
    address: "",
    gender: true, // true=Nam, false=Nữ
    employeeCode: "",
    notes: "",
    staffRole: 0, // 0=Sales,1=Purchases,2=Warehouse,3=Account
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [countdown, setCountdown] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...data, [name]: value });
  };

  // Countdown effect for redirect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && !isError) {
      // Redirect to staff accounts page after countdown
      navigate('/admin/users/staff');
    }
    return () => clearTimeout(timer);
  }, [countdown, isError, navigate]);

  // Hàm validate mật khẩu
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Mật khẩu phải có ít nhất 1 chữ số');
    }
    
    if (!/[\W_]/.test(password)) {
      errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt');
    }
    
    if (/\s/.test(password)) {
      errors.push('Mật khẩu không được có khoảng trắng');
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
    
    // Validate all required fields
    if (data.fullName.trim().length === 0) {
      setStatusMessage('Vui lòng nhập họ tên');
      setIsError(true);
      return;
    }
    
    if (!data.email || data.email.trim().length === 0) {
      setStatusMessage('Vui lòng nhập email');
      setIsError(true);
      return;
    }
    
    if (!data.phoneNumber || data.phoneNumber.trim().length === 0) {
      setStatusMessage('Vui lòng nhập số điện thoại');
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
    
    // Validate phone number format
    if (data.phoneNumber && data.phoneNumber.trim().length > 0) {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(data.phoneNumber)) {
        setStatusMessage('Số điện thoại phải bắt đầu bằng 0 và có đúng 10 số');
        setIsError(true);
        return;
      }
    }
    
    // Validate employee code is required
    if (!data.employeeCode || data.employeeCode.trim().length === 0) {
      setStatusMessage('Vui lòng nhập mã nhân viên');
      setIsError(true);
      return;
    }
    
    // Check email duplication before submit
    const isEmailDuplicate = await checkEmailDuplicate(data.email);
    if (isEmailDuplicate) {
      return; // Stop submission if email is duplicate
    }
    
    // Check phone number duplication before submit
    const isPhoneDuplicate = await checkPhoneDuplicate(data.phoneNumber);
    if (isPhoneDuplicate) {
      return; // Stop submission if phone is duplicate
    }
    
    // Validate avatar URL if provided
    if (data.avatar && data.avatar.trim() !== '') {
      try {
        new URL(data.avatar);
      } catch (e) {
        setStatusMessage('URL avatar không hợp lệ. Vui lòng nhập URL đúng định dạng.');
        setIsError(true);
        return;
      }
    }

    try {
      const payload = {
        Email: data.email,
        UserName: data.userName || data.email, // Use email as UserName if not provided
        PhoneNumber: data.phoneNumber,
        Password: data.password,
        FullName: data.fullName,
        Gender: data.gender,
        Address: data.address,
        EmployeeCode: data.employeeCode,
        Notes: data.notes,
        StaffRole: Number(data.staffRole)
      };
      const response = await adminAPI.createStaffAccount(payload);
      setStatusMessage(response.data?.message || 'Tạo thành công');
      setIsError(false);
      setCountdown(3); // Start 3-second countdown
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
            {statusMessage}
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
          <Row className="mb-2">
            <Col md={3} className="d-flex justify-content-center">
              <div style={{
                background: '#7BD1C2',
                width: '100%',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                minHeight: '120px'
              }}>
                <img 
                  src={data.avatar && data.avatar.trim() !== '' ? data.avatar : "https://res.cloudinary.com/ds9p5t0mx/image/upload/v1740308752/avatar-default-icon-1975x2048-2mpk4u9k_fjciku.png"} 
                  alt="avatar" 
                  style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = "https://res.cloudinary.com/ds9p5t0mx/image/upload/v1740308752/avatar-default-icon-1975x2048-2mpk4u9k_fjciku.png";
                  }}
                />
              </div>
            </Col>
            <Col md={9}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h4 className="mb-0">Tạo mới nhân viên</h4>
                <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
              </div>
              <Row className="mb-1">
                <Col md={6}>
                    <Form.Group controlId="formFullName">
                      <Form.Label style={{ fontSize: '14px', marginBottom: '4px' }}>
                        Họ Tên <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={data.fullName}
                        onChange={handleChange}
                        required
                        onInvalid={(e) => e.target.setCustomValidity("Vui lòng không để trống")}
                        onInput={(e) => e.target.setCustomValidity("")}
                        style={{ borderColor: "#48C1A6", fontSize: '13px', padding: '6px 10px' }}
                      />
                    </Form.Group>
                  </Col>
                <Col md={6}>
                    <Form.Group controlId="formEmail">
                      <Form.Label style={{ fontSize: '14px', marginBottom: '4px' }}>
                        Email<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={handleChange}
                        required
                        onInvalid={(e) => e.target.setCustomValidity("Vui lòng không để trống")}
                        onInput={(e) => e.target.setCustomValidity("")}
                        style={{ borderColor: "#48C1A6", fontSize: '13px', padding: '6px 10px' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-1">
                  <Col md={6}>
                    <Form.Group controlId="formUserName">
                      <Form.Label style={{ fontSize: '14px', marginBottom: '4px' }}>
                        Tên đăng nhập
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="userName"
                        value={data.userName}
                        onChange={handleChange}
                        placeholder="Để trống sẽ dùng email"
                        style={{ borderColor: "#48C1A6", fontSize: '13px', padding: '6px 10px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formPhoneNumber">
                      <Form.Label style={{ fontSize: '14px', marginBottom: '4px' }}>
                        Số điện thoại<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phoneNumber"
                        value={data.phoneNumber}
                        onChange={handleChange}
                        pattern="^0\d{9}$"
                        required
                        placeholder="0123456789"
                        onInvalid={(e) => e.target.setCustomValidity("Số điện thoại phải bắt đầu bằng 0 và có đúng 10 số")}
                        onInput={(e) => e.target.setCustomValidity("")}
                        style={{ borderColor: "#48C1A6", fontSize: '13px', padding: '6px 10px' }}
                      />
                      <Form.Text className="text-muted" style={{ fontSize: '11px' }}>
                        Ví dụ: 0123456789 (10 số, bắt đầu bằng 0)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-1">
                  <Col md={6}>
                    <Form.Group controlId="formEmployeeCode">
                      <Form.Label style={{ fontSize: '14px', marginBottom: '4px' }}>
                        Mã nhân viên<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control type="text" name="employeeCode" value={data.employeeCode} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formAddress">
                      <Form.Label style={{ fontSize: '14px', marginBottom: '4px' }}>
                        Địa chỉ<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={data.address}
                        onChange={handleChange}
                        style={{ borderColor: "#48C1A6", fontSize: '13px', padding: '6px 10px' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-1">
                  <Col md={6}>
                    <Form.Group controlId="formRole">
                      <Form.Label style={{ fontSize: '14px', marginBottom: '4px' }}>Vai trò</Form.Label>
                      <Form.Select name="staffRole" value={data.staffRole} onChange={handleChange}>
                        <option value={0}>Nhân viên Bán Hàng</option>
                        <option value={1}>Nhân viên Mua Hàng</option>
                        <option value={2}>Nhân viên Kho</option>
                        <option value={3}>Nhân viên Kế Toán</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formGender">
                      <Form.Label style={{ fontSize: '14px', marginBottom: '4px' }}>Giới tính</Form.Label>
                      <Form.Select name="gender" value={String(data.gender)} onChange={(e)=> setFormData(prev=>({...prev, gender: e.target.value === 'true'}))}>
                        <option value={'true'}>Nam</option>
                        <option value={'false'}>Nữ</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-1">
                  <Col md={6}>
                      <Form.Group controlId="formPassword">
                        <Form.Label style={{ fontSize: '14px', marginBottom: '4px' }}>
                          Mật khẩu<span style={{ color: "red" }}>*</span>
                        </Form.Label>
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
                              borderColor: "#48C1A6", 
                              fontSize: '13px', 
                              padding: '6px 10px'
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
                <Row className="mb-1">
                  <Col md={12}>
                    <Form.Group controlId="formAvatar">
                      <Form.Label style={{ fontSize: '14px', marginBottom: '4px' }}>Avatar URL</Form.Label>
                      <Form.Control 
                        type="url" 
                        name="avatar" 
                        value={data.avatar} 
                        onChange={handleChange} 
                        placeholder="Nhập URL avatar (tùy chọn)"
                        style={{ borderColor: "#48C1A6", fontSize: '13px', padding: '6px 10px' }}
                      />
                      <Form.Text className="text-muted" style={{ fontSize: '11px' }}>
                        Nhập URL hình ảnh để cập nhật avatar. Avatar sẽ hiển thị ở bên trái.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-1">
                  <Col md={12}>
                    <Form.Group controlId="formNotes">
                      <Form.Label style={{ fontSize: '14px', marginBottom: '4px' }}>Ghi chú</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={1} 
                        name="notes" 
                        value={data.notes} 
                        onChange={handleChange} 
                        placeholder="Nhập ghi chú về nhân viên..."
                        style={{ borderColor: "#48C1A6", fontSize: '13px', padding: '6px 10px' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-grid mt-3">
                  <Button size="md" style={{ background: '#48C1A6', border: 'none', fontSize: '14px', padding: '10px' }} type="submit">Tạo nhân viên</Button>
                </div>
            </Col>
          </Row>
        </Form>
      </div>
  );
}

export default CreateStaff;


