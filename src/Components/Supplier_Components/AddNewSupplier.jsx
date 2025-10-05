import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

function AddNewSupplier() {
    const [name, setSupplierName] = useState('');
    const [address, setAddress] = useState('');
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Thêm nhà cung cấp
    const handleAddSupplier = async (e) => {
        e.preventDefault();

        let isValid = true;
        let errors = {}; // Lưu thông báo lỗi cho từng trường

        // Kiểm tra tên nhà cung cấp
        if (!name.trim()) {
            isValid = false;
            errors.name = "Vui lòng nhập tên nhà cung cấp.";
        }

        // Kiểm tra địa chỉ
        if (!address.trim()) {
            isValid = false;
            errors.address = "Vui lòng nhập địa chỉ nhà cung cấp.";
        }

        // Kiểm tra liên hệ
        const contactNumber = isNaN(contact) ? '' : parseInt(contact, 10);
        if (!contact.trim()) {
            isValid = false;
            errors.contact = "Vui lòng nhập liên hệ của nhà cung cấp.";
        } else if (isNaN(contactNumber)) {
            isValid = false;
            errors.contact = "Liên hệ phải là một số hợp lệ.";
        }

        // Kiểm tra email
        if (!email.trim()) {
            isValid = false;
            errors.email = "Vui lòng nhập email của nhà cung cấp.";
        } else if (!/\S+@\S+\.\S+/.test(email)) { // Kiểm tra định dạng email
            isValid = false;
            errors.email = "Email không hợp lệ.";
        }

        // Kiểm tra mô tả
        if (!description.trim()) {
            isValid = false;
            errors.description = "Vui lòng nhập mô tả cho nhà cung cấp.";
        }

        // Nếu có lỗi, không gửi yêu cầu và hiển thị thông báo lỗi
        if (!isValid) {
            setError(errors);
            return;
        }

        // Gửi yêu cầu tới API
        try {
            const response = await axios.post('http://localhost:9999/suppliers/addSupplier', {
                name,
                address,
                contact: contactNumber,
                email,
                description,
                status: 'active', // Set status to 'active' explicitly
            });

            // Thông báo thêm nhà cung cấp thành công
            setMessage(response.data.message || "Thêm nhà cung cấp thành công!");
            setError(null); // Xóa lỗi cũ
            // Reset các trường nhập liệu
            setSupplierName('');
            setAddress('');
            setContact('');
            setEmail('');
            setDescription('');
        } catch (err) {
            setError({ message: err.response?.data?.message || 'Lỗi khi thêm nhà cung cấp. Vui lòng thử lại.' });
            setMessage(null);
        }
    };

    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Col md={6} style={{ backgroundColor: "#A8E6CF", margin: "20px", borderRadius: "10px", padding: "20px" }}>
                    <h2 className="mt-4">Thêm nhà cung cấp</h2>
                    {message && <Alert variant="success">{message}</Alert>}
                    {error?.message && <Alert variant="danger">{error.message}</Alert>}
                    <Form onSubmit={handleAddSupplier}>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên nhà cung cấp</Form.Label>
                            <Form.Control
                                type="text"
                                value={name}
                                onChange={(e) => setSupplierName(e.target.value)}
                            />
                            {error?.name && <Alert variant="danger" className="mt-2">{error.name}</Alert>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Địa chỉ</Form.Label>
                            <Form.Control
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                            {error?.address && <Alert variant="danger" className="mt-2">{error.address}</Alert>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Liên hệ</Form.Label>
                            <Form.Control
                                type="text"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                            />
                            {error?.contact && <Alert variant="danger" className="mt-2">{error.contact}</Alert>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {error?.email && <Alert variant="danger" className="mt-2">{error.email}</Alert>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Mô tả</Form.Label>
                            <Form.Control
                                as="textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            {error?.description && <Alert variant="danger" className="mt-2">{error.description}</Alert>}
                        </Form.Group>

                        <br />
                        <div className="d-flex justify-content-end">
                            <Button variant="primary" type="submit">
                                Thêm nhà cung cấp
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default AddNewSupplier;
