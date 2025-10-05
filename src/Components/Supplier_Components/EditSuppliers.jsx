import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import axios from "axios";

const EditSuppliers = ({ user, closeModal, users, setUsers }) => {
    const [name, setSupplierName] = useState('');
    const [address, setAddress] = useState('');
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('active');
    const [errors, setErrors] = useState({}); // Lưu trữ lỗi cho từng trường

    useEffect(() => {
        if (user) {
            setSupplierName(user.name);
            setAddress(user.address);
            setContact(user.contact);
            setEmail(user.email);
            setDescription(user.description);
            setStatus(user.status);
        }
    }, [user]);

  const handleSaveChanges = async () => {
    let isValid = true;
    let errors = {}; // Lưu các lỗi cho từng trường

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
    const contactStr = contact.toString().trim();  // Chuyển đổi contact thành chuỗi
    if (!contactStr) {
        isValid = false;
        errors.contact = "Vui lòng nhập liên hệ của nhà cung cấp.";
    } else if (isNaN(contact)) {
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
        setErrors(errors);
        return;
    }

    // Gửi yêu cầu tới API
    try {
        const updatedSupplier = { name, address, contact, email, description, status };
        const response = await axios.put(`http://localhost:9999/suppliers/updateSupplier/${user._id}`, updatedSupplier);

        // Cập nhật danh sách nhà cung cấp sau khi chỉnh sửa
        const updatedSuppliers = users.map(supplier =>
            supplier._id === user._id ? response.data : supplier
        );
        setUsers(updatedSuppliers);
        setErrors({});
        closeModal();
    } catch (err) {
        setErrors({ general: err.response?.data?.message || "Lỗi khi cập nhật thông tin." });
    }
};


    return (
        <Modal show={user !== null} onHide={closeModal} centered>
            <Modal.Header closeButton>
                <Modal.Title>Sửa thông tin nhà cung cấp</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {errors.general && <Alert variant="danger">{errors.general}</Alert>}
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Tên nhà cung cấp</Form.Label>
                        <Form.Control
                            type="text"
                            value={name}
                            onChange={(e) => setSupplierName(e.target.value)}
                        />
                        {errors.name && <div className="text-danger mt-2">{errors.name}</div>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Địa chỉ</Form.Label>
                        <Form.Control
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                        {errors.address && <div className="text-danger mt-2">{errors.address}</div>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Liên hệ</Form.Label>
                        <Form.Control
                            type="text"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                        />
                        {errors.contact && <div className="text-danger mt-2">{errors.contact}</div>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {errors.email && <div className="text-danger mt-2">{errors.email}</div>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Mô tả</Form.Label>
                        <Form.Control
                            as="textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        {errors.description && <div className="text-danger mt-2">{errors.description}</div>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Trạng thái</Form.Label>
                        <Form.Control
                            as="select"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="active">Còn cung cấp</option>
                            <option value="inactive">Ngừng cung cấp</option>
                        </Form.Control>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>Đóng</Button>
                <Button variant="primary" onClick={handleSaveChanges}>Lưu thay đổi</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditSuppliers;
