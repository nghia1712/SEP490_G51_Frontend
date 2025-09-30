import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Col, Nav, NavDropdown } from "react-bootstrap";

const Sidebar = () => {
  const location = useLocation();

    const menuItems = [
        { path: '/dashboard', label: 'Thống kê' },
        { path: '/product', label: 'Sản phẩm' },
        { path: '/category', label: 'Danh mục' },
        { path: '/manager/get-all-user', label: 'Nhân viên' },
        { path: '/get-list-suppliers', label: 'Nhà cung cấp' },
    ];

  return (
    <Col
      xs={2}
      className="vh-100 d-flex flex-column p-3"
      style={{ borderRight: "1px solid #ccc" }}
    >
      <h4 className="text-dark text-center mb-4">Quản lý</h4>
      <Nav className="flex-column">
        {menuItems.map((item) => (
          <Nav.Item key={item.path}>
            <Nav.Link
              as={Link}
              to={item.path}
              className={`text-dark d-flex align-items-center gap-2 p-2 rounded ${location.pathname === item.path ? "bg-primary" : ""
                }`}
            >
              {item.icon} {item.label}
            </Nav.Link>
          </Nav.Item>
        ))}
        <NavDropdown
          title=" Giao Dịch"
          id="nav-transaction"
          className="text-dark p-2"
        >
          <NavDropdown.Item as={Link} to="/create-receipt">
            Nhập Kho
          </NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/export">
            Xuất Kho
          </NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/list-transaction">
            Danh Sách Giao Dịch
          </NavDropdown.Item>
        </NavDropdown>
      </Nav>
    </Col>
  );
};

export default Sidebar;
