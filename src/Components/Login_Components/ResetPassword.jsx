import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

function ResetPassword() {
    const { id, token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsError(false);
        setStatusMessage('');

        if (password !== confirmPassword) {
            setIsError(true);
            setStatusMessage('Mật khẩu không khớp');
            return;
        }

        if (/\s/.test(password || confirmPassword)) {
            setIsError(true);
            setStatusMessage('Mật khẩu không được có khoảng trắng');
            return;
        }


        try {
            const response = await axios.post(
                `http://localhost:9999/authentication/reset-password/${id}/${token}`,
                { password, confirmPassword }
            );
            setStatusMessage(response.data.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            setIsError(true);
            const errorMessage =
                error.response && error.response.data
                    ? error.response.data.status
                    : 'Something went wrong!';
            setStatusMessage(errorMessage);
        }
    };

    return (
        <Container fluid className="vh-100 d-flex align-items-center justify-content-center" style={{ background: "url('/images/backgroundLogin.jpg') no-repeat center center / cover" }}>
            <Row className="w-90 h-90 d-flex align-items-center justify-content-center">
                <Col className="d-flex flex-column align-items-center justify-content-center p-4"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.8)", boxShadow: "0px 10px 15px rgba(0,0,0,0.2)", borderRadius: "10px", maxWidth: "400px" }}>

                    <h3 className="text-center mb-4">Đặt lại mật khẩu tài khoản</h3>
                    {statusMessage && (
                        <Alert variant={isError ? 'danger' : 'success'}>{statusMessage}</Alert>
                    )}
                    <Form onSubmit={handleResetPassword} style={{ width: "100%" }}>
                        <Form.Group className="mb-3" controlId="formPassword">
                            <Form.Control
                                type="password"
                                placeholder="   "
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ fontSize: "1.1rem", padding: "10px" }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formConfirmPassword">
                            <Form.Control
                                type="password"
                                placeholder="Nhập lại mật khẩu"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                style={{ fontSize: "1.1rem", padding: "10px" }}
                            />
                        </Form.Group>
                        <Button type="submit" className="w-100" style={{ padding: "12px", fontSize: "1rem", fontWeight: "bold", backgroundColor: "#48C1A6", border: "none", borderRadius: "20px" }}>
                            Đặt lại mật khẩu
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default ResetPassword;
