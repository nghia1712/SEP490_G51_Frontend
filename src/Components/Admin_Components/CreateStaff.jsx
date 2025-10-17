import React, { useState } from "react";
import { Row, Col, Form, Button, Alert } from "react-bootstrap";
import adminAPI from "../../API/adminAPI";

function CreateStaff({ onClose }) {
  // Align with backend AdminCreateAccountRequest/CreateAccountRequest
  const [data, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "PMS@123456",
    // avatar removed from form per request (backend still supports but optional)
    address: "",
    gender: true, // true=Nam, false=Nữ
    employeeCode: "",
    notes: "",
    staffRole: 0, // 0=Sales,1=Purchases,2=Warehouse,3=Account
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...data, [name]: value });
  };

  // No extra UI logic required beyond basic field changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsError(false);
    setStatusMessage("");
    if (data.fullName.trim().length === 0) {
      setStatusMessage('Vui lòng nhập họ tên');
      setIsError(true);
      return;
    }

    try {
      const payload = {
        Email: data.email,
        PhoneNumber: data.phoneNumber,
        Password: data.password,
        FullName: data.fullName,
        Avatar: data.avatar,
        Gender: data.gender,
        Address: data.address,
        EmployeeCode: data.employeeCode,
        Notes: data.notes,
        StaffRole: Number(data.staffRole)
      };
      const response = await adminAPI.createStaffAccount(payload);
      setStatusMessage(response.data?.message || 'Tạo nhân viên thành công');
    } catch (error) {
      setIsError(true);
      const errorMessage =
        error.response?.data?.message || "An error occurred!";
      setStatusMessage(errorMessage);
    }
  };

  // --- end minimal helpers ---

  return (
      <div className="p-2">
        {statusMessage && (
          <Alert variant={isError ? "danger" : "success"}>{statusMessage}</Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <Row className="mb-4">
            <Col md={3} className="d-flex justify-content-center">
              <div style={{
                background: '#7BD1C2',
                width: '100%',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
              }}>
                <img src="https://res.cloudinary.com/ds9p5t0mx/image/upload/v1740308752/avatar-default-icon-1975x2048-2mpk4u9k_fjciku.png" alt="avatar" style={{ width: '200px', height: '200px' }} />
              </div>
            </Col>
            <Col md={9}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Tạo mới nhân viên</h2>
                <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
              </div>
              <Row className="mb-3">
                <Col md={6}>
                    <Form.Group controlId="formFullName">
                      <Form.Label>
                        Họ Tên <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={data.fullName}
                        onChange={handleChange}
                        required
                        style={{ borderColor: "#48C1A6" }}
                      />
                    </Form.Group>
                  </Col>
                <Col md={6}>
                    <Form.Group controlId="formEmail">
                      <Form.Label>
                        Email<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={handleChange}
                        required
                        style={{ borderColor: "#48C1A6" }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="formPhoneNumber">
                      <Form.Label>
                        Số điện thoại<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phoneNumber"
                        value={data.phoneNumber}
                        onChange={handleChange}
                        pattern="[0-9]{10}"
                        required
                        style={{ borderColor: "#48C1A6" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formEmployeeCode">
                      <Form.Label>Mã nhân viên</Form.Label>
                      <Form.Control type="text" name="employeeCode" value={data.employeeCode} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="formAddress">
                      <Form.Label>
                        Địa chỉ<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={data.address}
                        onChange={handleChange}
                        style={{ borderColor: "#48C1A6" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formRole">
                      <Form.Label>Vai trò</Form.Label>
                      <Form.Select name="staffRole" value={data.staffRole} onChange={handleChange}>
                        <option value={0}>Nhân viên Bán Hàng</option>
                        <option value={1}>Nhân viên Mua Hàng</option>
                        <option value={2}>Nhân viên Kho</option>
                        <option value={3}>Nhân viên Kế Toán</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="formGender">
                      <Form.Label>Giới tính</Form.Label>
                      <Form.Select name="gender" value={String(data.gender)} onChange={(e)=> setFormData(prev=>({...prev, gender: e.target.value === 'true'}))}>
                        <option value={'true'}>Nam</option>
                        <option value={'false'}>Nữ</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formPassword">
                      <Form.Label>Mật khẩu mặc định</Form.Label>
                      <Form.Control type="text" name="password" value={data.password} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group controlId="formNotes">
                      <Form.Label>Ghi chú</Form.Label>
                      <Form.Control as="textarea" rows={1} name="notes" value={data.notes} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-grid mt-3">
                  <Button size="lg" style={{ background: '#48C1A6', border: 'none' }} type="submit">Tạo nhân viên</Button>
                </div>
            </Col>
          </Row>
        </Form>
      </div>
  );
}

export default CreateStaff;


