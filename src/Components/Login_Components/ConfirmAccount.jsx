
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

function ConfirmAccount() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleConfirmAccount = async (e) => {
        e.preventDefault();
        setIsError(false);
        setStatusMessage('');

        if (newPassword !== confirmPassword) {
            setIsError(true);
            setStatusMessage('Mật khẩu không khớp!');
            return;
        }

        try {
            const response = await axios.post(`http://localhost:9999/authentication/verify/${token}`, {
                newPassword,
                confirmPassword,
            });
            setStatusMessage('Xác nhận tài khoản thành công!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            setIsError(true);
            setStatusMessage(error.response?.data?.message || 'Xác nhận thất bại!');
        }
    };

    return (
        <Container className="vh-100 d-flex align-items-center justify-content-center" style={{ background: "url('/images/backgroundLogin.jpg') no-repeat center center / cover" }}>
            <Row className="w-100 justify-content-center">
                <Col xs={12} md={6} className="p-4 shadow-lg rounded" style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}>
                    <h2 className="text-center mb-3">Xác nhận tài khoản</h2>
                    {statusMessage && <Alert variant={isError ? 'danger' : 'success'}>{statusMessage}</Alert>}
                    <Form onSubmit={handleConfirmAccount}>
                        <Form.Group className="mb-3">
                            <Form.Label>Mật khẩu mới</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Nhập mật khẩu mới"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nhập lại mật khẩu</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Xác nhận mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" className="w-100" style={{ padding: "12px", fontSize: "1rem", fontWeight: "bold", backgroundColor: "#48C1A6", border: "none", borderRadius: "20px" }}>
                            Xác nhận tài khoản
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default ConfirmAccount;
