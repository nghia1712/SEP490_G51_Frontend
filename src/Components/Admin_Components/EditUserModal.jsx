import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Alert, Row, Col } from "react-bootstrap";
import adminAPI from "../../API/adminAPI";

const EditUserModal = ({ user, closeModal, users, setUsers }) => {
    const [form, setForm] = useState({
        fullName: "",
        phoneNumber: "",
        address: "",
        gender: true,
        employeeCode: "",
        notes: "",
        avatar: "",
        userStatus: 2, // 0=Block,1=Inactive,2=Active
    });
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const getUserId = (u) => u?.userId || u?.UserId || u?._id || u?.accountId || u?.AccountId;

    useEffect(() => {
        if (!user) return;
        setForm({
            fullName: user?.fullName || user?.profile?.fullName || "",
            phoneNumber: user?.phoneNumber || user?.profile?.phoneNumber || "",
            address: user?.address || user?.profile?.address || "",
            gender: (user?.gender ?? user?.profile?.gender) ?? true,
            employeeCode: user?.employeeCode || user?.profile?.employeeCode || "",
            notes: user?.notes || user?.profile?.notes || "",
            avatar: user?.avatar || user?.profile?.avatar || "",
            userStatus: typeof user?.userStatus === 'number' ? user.userStatus : (String(user?.status).toLowerCase() === 'active' ? 2 : 1),
        });
    }, [user]);

    const setField = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                UserId: getUserId(user),
                PhoneNumber: form.phoneNumber || null,
                UserStatus: Number(form.userStatus),
                FullName: form.fullName || null,
                Avatar: form.avatar || null,
                Gender: !!form.gender,
                Address: form.address || null,
                EmployeeCode: form.employeeCode || null,
                Notes: form.notes || null,
            };

            const res = await adminAPI.updateStaffAccount(payload);

            // Update local list
            if (setUsers && users) {
                setUsers(prev => prev.map(u => (getUserId(u) === getUserId(user)) ? {
                    ...u,
                    fullName: payload.FullName ?? u.fullName,
                    phoneNumber: payload.PhoneNumber ?? u.phoneNumber,
                    address: payload.Address ?? u.address,
                    gender: payload.Gender,
                    employeeCode: payload.EmployeeCode ?? u.employeeCode,
                    notes: payload.Notes ?? u.notes,
                    userStatus: payload.UserStatus,
                } : u));
            }

            setSuccessMessage(res?.data?.message || "Cập nhật thông tin thành công!");
            setErrorMessage("");
            setTimeout(() => {
                setSuccessMessage("");
                closeModal();
            }, 1500);
        } catch (error) {
            console.error("Lỗi cập nhật thông tin người dùng:", error);
            setErrorMessage(error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin");
        }
    };

    return (
        <Modal show={!!user} onHide={closeModal} centered>
            <Modal.Header closeButton>
                <Modal.Title>Chỉnh sửa thông tin</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {successMessage && <Alert variant="success">{successMessage}</Alert>}
                {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Họ tên</Form.Label>
                                <Form.Control value={form.fullName} onChange={e=>setField('fullName', e.target.value)} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Số điện thoại</Form.Label>
                                <Form.Control value={form.phoneNumber} onChange={e=>setField('phoneNumber', e.target.value)} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Địa chỉ</Form.Label>
                                <Form.Control value={form.address} onChange={e=>setField('address', e.target.value)} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Giới tính</Form.Label>
                                <Form.Select value={String(form.gender)} onChange={e=>setField('gender', e.target.value === 'true')}>
                                    <option value={'true'}>Nam</option>
                                    <option value={'false'}>Nữ</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Mã nhân viên</Form.Label>
                                <Form.Control value={form.employeeCode} onChange={e=>setField('employeeCode', e.target.value)} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Trạng thái</Form.Label>
                                <Form.Select value={String(form.userStatus)} onChange={e=>setField('userStatus', Number(e.target.value))}>
                                    <option value={2}>Hoạt động</option>
                                    <option value={1}>Không hoạt động</option>
                                    <option value={0}>Bị khóa</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Ghi chú</Form.Label>
                                <Form.Control as="textarea" rows={2} value={form.notes} onChange={e=>setField('notes', e.target.value)} />
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>Hủy</Button>
                <Button variant="primary" type="submit" onClick={handleSubmit}>Lưu thay đổi</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditUserModal;


