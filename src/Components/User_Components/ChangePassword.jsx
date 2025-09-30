import React, { useState } from "react";
import { Container, Form, Button, Alert, Card, Modal } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useUser from "../../Hooks/useUser";

function ChangePassword() {
  const navigate = useNavigate();
  const { changePassword } = useUser();
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsError(false);
    setStatusMessage("");
    setShowConfirm(true);
  };
  const handleConfirm = async (e) => {
    setShowConfirm(false);
    try {
      const response = await changePassword(form);
      if (response) {
        setStatusMessage(response.message);
        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {navigate("/profile");}, 3000);
      }
    } catch (error) {
      setIsError(true);
      setStatusMessage(error.message || "Lỗi khi thay đổi mật khẩu.");
    }
  };

  return (
    <>
      <Container fluid className="vh-100 d-flex align-items-center justify-content-center" style={{ background: "url('/images/backgroundLogin.jpg') no-repeat center center / cover" }}>

        <Card style={{ width: "30rem", padding: "1.5rem", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
          <Card.Body>
            {statusMessage && <Alert variant={isError ? "danger" : "success"}>{statusMessage}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "bold" }}>Old Password</Form.Label>
                <Form.Control type="password" name="oldPassword" value={form.oldPassword} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "bold" }}>New Password</Form.Label>
                <Form.Control type="password" name="newPassword" value={form.newPassword} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "bold" }}>Confirm New Password</Form.Label>
                <Form.Control type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
              </Form.Group>
              <div className="d-grid gap-2">
                <Button className="text-white" variant="light" type="submit" style={{ backgroundColor: "#48C1A6", borderRadius: "20px" }}>Change Password</Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
      {/* xác nhận */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận thay đổi mật khẩu</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn thay đổi mật khẩu?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ChangePassword;
