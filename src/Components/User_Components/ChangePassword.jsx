import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  InputGroup,
  Card,
  Modal,
} from "react-bootstrap";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import useUser from "../../Hooks/useUser";

// Import các thành phần cần thiết từ Framer Motion
import { motion, AnimatePresence } from "framer-motion";

function ChangePassword() {
  const navigate = useNavigate();
  const { changePassword } = useUser();
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsError(false);
    setStatusMessage("");

    // Validation
    if (!form.oldPassword.trim()) {
      setIsError(true);
      setStatusMessage("Vui lòng nhập mật khẩu cũ!");
      return;
    }

    if (!form.newPassword.trim()) {
      setIsError(true);
      setStatusMessage("Vui lòng nhập mật khẩu mới!");
      return;
    }

    if (!form.confirmPassword.trim()) {
      setIsError(true);
      setStatusMessage("Vui lòng xác nhận mật khẩu mới!");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setIsError(true);
      setStatusMessage("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    if (form.newPassword.length < 8) {
      setIsError(true);
      setStatusMessage("Mật khẩu mới phải có ít nhất 8 ký tự!");
      return;
    }

    // Validate password complexity
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;
    if (!complexityRegex.test(form.newPassword)) {
      setIsError(true);
      setStatusMessage("Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt!");
      return;
    }

    if (form.oldPassword === form.newPassword) {
      setIsError(true);
      setStatusMessage("Mật khẩu mới phải khác mật khẩu cũ!");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setIsError(false);
    setStatusMessage("");
    
    try {
      // Prepare data in the correct format for backend
      const changePasswordData = {
        OldPassword: form.oldPassword,
        NewPassword: form.newPassword
      };
      
      console.log("Sending change password data:", changePasswordData);
      const response = await changePassword(changePasswordData);
      console.log("Change password response:", response);
      
      if (response) {
        setIsError(false);
        setStatusMessage("Đổi mật khẩu thành công!");
        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {navigate("/profile");}, 3000);
      }
    } catch (error) {
      console.error("Change password error:", error);
      setIsError(true);
      
      // Handle specific error messages from backend
      let errorMessage = "Lỗi khi thay đổi mật khẩu.";
      
      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message.toLowerCase();
        
        if (backendMessage.includes('mật khẩu cũ') || backendMessage.includes('old password') || backendMessage.includes('incorrect') || backendMessage.includes('đổi mật khẩu thất bại')) {
          errorMessage = "Mật khẩu cũ nhập sai, vui lòng nhập đúng!";
        } else if (backendMessage.includes('mật khẩu mới') || backendMessage.includes('new password')) {
          errorMessage = "Mật khẩu mới không hợp lệ!";
        } else if (backendMessage.includes('không thể xác thực') || backendMessage.includes('unauthorized')) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!";
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStatusMessage(errorMessage);
    }
  };

  // --- ĐỊNH NGHĨA ANIMATION ---
  
  // Variants cho container chính để điều khiển stagger effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Mỗi phần tử con sẽ xuất hiện cách nhau 0.1s
      },
    },
  };

  // Variants cho các phần tử con (tiêu đề, input, button)
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    },
  };
  
  // Variants cho hình ảnh bên phải
  const imageVariants = {
      hidden: { x: 100, opacity: 0},
      visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut"}}
  }
  
  // Variants cho thông báo lỗi/thành công
  const alertVariants = {
    initial: { opacity: 0, y: -20, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, x: -100 },
    // Hiệu ứng rung cho lỗi
    shake: {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
    }
  };

  return (
    <>
      <Container
        fluid
        className="d-flex align-items-center justify-content-center p-3"
      >
        {/* Bọc Card trong motion.div để có hiệu ứng xuất hiện ban đầu */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ maxWidth: '900px', width: '100%' }}
        >
          <Card className="shadow-lg" style={{ border: 'none', overflow: 'hidden', borderRadius: '15px' }}>
            <Row className="g-0">
              {/* Cột Form */}
              <Col xs={12} md={6} className="d-flex flex-column justify-content-center">
                {/* Bọc Card.Body bằng motion.div để áp dụng stagger animation */}
                <motion.div
                  className="p-4 p-md-5"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.h2 variants={itemVariants} className="text-center mb-4 fw-bold" style={{ color: '#155E64' }}>
                    Đổi Mật Khẩu
                  </motion.h2>

                  {/* Sử dụng AnimatePresence để tạo hiệu ứng exit cho Alert */}
                  <AnimatePresence>
                    {statusMessage && (
                      <motion.div
                        key="message"
                        variants={alertVariants}
                        initial="initial"
                        animate={isError ? ["animate", "shake"] : "animate"}
                        exit="exit"
                      >
                        <Alert variant={isError ? "danger" : "success"}>{statusMessage}</Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Form onSubmit={handleSubmit}>
                    <motion.div variants={itemVariants}>
                      <Form.Group className="mb-3">
                        <InputGroup>
                          <InputGroup.Text><FaLock /></InputGroup.Text>
                          <Form.Control 
                            type={showPasswords.oldPassword ? "text" : "password"} 
                            placeholder="Nhập mật khẩu cũ" 
                            name="oldPassword"
                            value={form.oldPassword} 
                            onChange={handleChange} 
                            required 
                            onInvalid={(e) => e.target.setCustomValidity("Vui lòng không để trống")}
                            onInput={(e) => e.target.setCustomValidity("")}
                          />
                          <InputGroup.Text 
                            style={{ cursor: 'pointer' }}
                            onClick={() => togglePasswordVisibility('oldPassword')}
                          >
                            {showPasswords.oldPassword ? <FaEyeSlash /> : <FaEye />}
                          </InputGroup.Text>
                        </InputGroup>
                      </Form.Group>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Form.Group className="mb-3">
                        <InputGroup>
                          <InputGroup.Text><FaLock /></InputGroup.Text>
                          <Form.Control 
                            type={showPasswords.newPassword ? "text" : "password"} 
                            placeholder="Nhập mật khẩu mới" 
                            name="newPassword"
                            value={form.newPassword} 
                            onChange={handleChange} 
                            required 
                            onInvalid={(e) => e.target.setCustomValidity("Vui lòng không để trống")}
                            onInput={(e) => e.target.setCustomValidity("")}
                          />
                          <InputGroup.Text 
                            style={{ cursor: 'pointer' }}
                            onClick={() => togglePasswordVisibility('newPassword')}
                          >
                            {showPasswords.newPassword ? <FaEyeSlash /> : <FaEye />}
                          </InputGroup.Text>
                        </InputGroup>
                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>
                          Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                        </Form.Text>
                      </Form.Group>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Form.Group className="mb-4">
                        <InputGroup>
                          <InputGroup.Text><FaLock /></InputGroup.Text>
                          <Form.Control 
                            type={showPasswords.confirmPassword ? "text" : "password"} 
                            placeholder="Nhập lại mật khẩu mới" 
                            name="confirmPassword"
                            value={form.confirmPassword} 
                            onChange={handleChange} 
                            required 
                            onInvalid={(e) => e.target.setCustomValidity("Vui lòng không để trống")}
                            onInput={(e) => e.target.setCustomValidity("")}
                          />
                          <InputGroup.Text 
                            style={{ cursor: 'pointer' }}
                            onClick={() => togglePasswordVisibility('confirmPassword')}
                          >
                            {showPasswords.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </InputGroup.Text>
                        </InputGroup>
                      </Form.Group>
                    </motion.div>

                    <motion.div variants={itemVariants} className="d-flex justify-content-between align-items-center gap-1">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => navigate("/profile")}
                        style={{ color: '#155E64', borderColor: '#155E64', padding: '10px 20px' }}
                      >
                        Quay lại
                      </Button>
                      {/* Bọc Button trong motion.div để có hiệu ứng hover/tap */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button type="submit" style={{ backgroundColor: "#48C1A6", border: "none", padding: '10px 70px' }}>
                          Đổi mật khẩu
                        </Button>
                      </motion.div>
                    </motion.div>
                  </Form>
                </motion.div>
              </Col>

              {/* Cột Hình ảnh */}
              <Col md={6} className="d-none d-md-block">
                {/* Bọc Card.Img trong motion.div để tạo hiệu ứng */}
                <motion.div
                   variants={imageVariants}
                   initial="hidden"
                   animate="visible"
                   style={{height: '100%'}}
                >
                  <Card.Img src={"/images/login_image.jpg"} alt="Change Password" style={{ objectFit: "cover", height: '100%' }}/>
                </motion.div>
              </Col>
            </Row>
          </Card>
        </motion.div>
      </Container>

      {/* Modal xác nhận */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🔐 Xác nhận thay đổi mật khẩu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn thay đổi mật khẩu?</p>
          <p className="text-muted small">
            Sau khi thay đổi, bạn sẽ cần đăng nhập lại với mật khẩu mới.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirm} style={{ backgroundColor: "#48C1A6", border: "none" }}>
            Xác nhận đổi mật khẩu
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ChangePassword;
