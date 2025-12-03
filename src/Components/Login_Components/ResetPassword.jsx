import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Card, InputGroup } from 'react-bootstrap';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import authAPI from '../../API/authAPI';

// Import các thành phần cần thiết từ Framer Motion
import { motion, AnimatePresence } from "framer-motion";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('userId') || searchParams.get('UserId') || '';
    const token = searchParams.get('token') || searchParams.get('Token') || '';
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [countdown, setCountdown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // --- ĐỊNH NGHĨA ANIMATION ---
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const imageVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
    };

    const alertVariants = {
        initial: { opacity: 0, y: -20, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, x: -100 },
        shake: {
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.5 }
        }
    };

    // Hàm validate mật khẩu
    const validatePassword = (password) => {
        const errors = [];
        if (!password || password.length < 8) {
            errors.push('Mật khẩu phải có ít nhất 8 ký tự');
        }
        const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;
        if (!complexityRegex.test(password)) {
            errors.push('Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
        }
        return errors;
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsError(false);
        setStatusMessage('');
        setPasswordErrors([]);

        // Kiểm tra URL parameters
        if (!id || !token) {
            setIsError(true);
            setStatusMessage('Link reset password không hợp lệ hoặc đã hết hạn');
            return;
        }

        // Validate password
        const passwordValidationErrors = validatePassword(password);
        if (passwordValidationErrors.length > 0) {
            setIsError(true);
            setPasswordErrors(passwordValidationErrors);
            setStatusMessage('Mật khẩu không đáp ứng yêu cầu:');
            return;
        }

        if (password !== confirmPassword) {
            setIsError(true);
            setStatusMessage('Mật khẩu xác nhận không khớp');
            return;
        }

        try {
            const response = await authAPI.resetPassword({
                UserId: id,
                Token: token,
                NewPassword: password,
                ConfirmPassword: confirmPassword
            });
            setIsError(false);
            setStatusMessage(response.message || 'Đặt lại mật khẩu thành công');
            setCountdown(3);
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            setIsError(true);
            
            // Xử lý các trường hợp lỗi cụ thể
            if (error.response?.status === 400) {
                setStatusMessage('Đặt lại mật khẩu thất bại do bạn xác nhận email cũ.\nHãy đổi mật khẩu lại để nhận email xác nhận mới.');
            } else if (error.response?.status === 404) {
                setStatusMessage('Không tìm thấy người dùng');
            } else if (error.response?.status === 500) {
                setStatusMessage('Đặt lại mật khẩu thất bại do token đã được sử dụng hoặc không hợp lệ');
            } else {
                setStatusMessage(error.response?.data?.message || error.message || 'Có lỗi xảy ra!');
            }
        }
    };

    return (
        <Container
            fluid
            className="d-flex align-items-center justify-content-center p-3"
        >
            {/* Hiệu ứng fade-in và trôi lên cho toàn bộ card */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{ maxWidth: '900px', width: '100%' }}
            >
                <Card className="shadow-lg" style={{ border: 'none', overflow: 'hidden', borderRadius: '15px' }}>
                    <Row className="g-0">
                        {/* Cột Form */}
                        <Col xs={12} md={6} className="d-flex flex-column justify-content-center">
                            <motion.div
                                className="p-4 p-md-5"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <motion.h2 variants={itemVariants} className="text-center mb-4 fw-bold" style={{ color: '#155E64' }}>
                                    Đặt lại mật khẩu
                                </motion.h2>
                                <motion.p variants={itemVariants} className="text-center text-muted mb-4">
                                    Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
                                </motion.p>
                                
                                <AnimatePresence>
                                    {statusMessage && (
                                        <motion.div key="status" variants={alertVariants} initial="initial" animate={["animate", isError ? "shake" : "animate"]} exit="exit">
                                            <Alert variant={isError ? 'danger' : 'success'} style={{ whiteSpace: 'pre-line' }}>
                                                {statusMessage}
                                                {passwordErrors.length > 0 && (
                                                    <ul className="mb-0 mt-2">
                                                        {passwordErrors.map((error, index) => (
                                                            <li key={index}>{error}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Form onSubmit={handleResetPassword}>
                                    <motion.div variants={itemVariants}>
                                        <Form.Group className="mb-3">
                                            <InputGroup>
                                                <InputGroup.Text><FaLock /></InputGroup.Text>
                                                <Form.Control
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Nhập mật khẩu mới"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    onInvalid={(e) => e.target.setCustomValidity("Vui lòng không để trống")}
                                                    onInput={(e) => e.target.setCustomValidity("")}
                                                    style={{ fontSize: "1.1rem", padding: "10px" }}
                                                />
                                                <InputGroup.Text style={{ cursor: 'pointer' }} onClick={() => setShowPassword(s => !s)}>
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </InputGroup.Text>
                                            </InputGroup>
                                        </Form.Group>
                                    </motion.div>
                                    
                                    <motion.div variants={itemVariants}>
                                        <Form.Group className="mb-4">
                                            <InputGroup>
                                                <InputGroup.Text><FaLock /></InputGroup.Text>
                                                <Form.Control
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Nhập lại mật khẩu"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    onInvalid={(e) => e.target.setCustomValidity("Vui lòng không để trống")}
                                                    onInput={(e) => e.target.setCustomValidity("")}
                                                    style={{ fontSize: "1.1rem", padding: "10px" }}
                                                />
                                                <InputGroup.Text style={{ cursor: 'pointer' }} onClick={() => setShowConfirmPassword(s => !s)}>
                                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                </InputGroup.Text>
                                            </InputGroup>
                                        </Form.Group>
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <Button 
                                            type="submit" 
                                            className="w-100" 
                                            style={{ 
                                                padding: "10px", 
                                                fontSize: "1rem", 
                                                fontWeight: "600", 
                                                backgroundColor: "#48C1A6", 
                                                border: "none", 
                                            }}
                                        >
                                            Đặt lại mật khẩu
                                        </Button>
                                    </motion.div>
                                </Form>
                            </motion.div>
                        </Col>

                        {/* Cột Hình ảnh */}
                        <Col md={6} className="d-none d-md-block p-0">
                            <motion.div variants={imageVariants} initial="hidden" animate="visible" style={{ height: '100%' }}>
                                <Card.Img
                                    src={"/images/login_image.png"}
                                    alt="Reset Password"
                                    style={{ objectFit: "cover", height: '100%' }}
                                />
                            </motion.div>
                        </Col>
                    </Row>
                </Card>
            </motion.div>
        </Container>
    );
}

export default ResetPassword;
