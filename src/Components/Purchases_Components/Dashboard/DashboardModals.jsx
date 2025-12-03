// src/Components/Purchases_Components/DashboardModals.jsx
import React from "react";
import { Modal, Table, Button, Spinner, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

// Tái sử dụng getStatusBadge giống Dashboard
export const DashboardModals = ({
  showPendingOrdersModal,
  setShowPendingOrdersModal,
  showMonthlyOrdersModal,
  setShowMonthlyOrdersModal,
  showSupplierModal,
  setShowSupplierModal,
  pendingOrdersList,
  poList,
  suppliers,
  suppliersLoading,
  formatCurrency,
  getStatusBadge,
  showMonthlyChartModal,
  setShowMonthlyChartModal,
  monthlyOrders,
  selectedMonth,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Pending Orders Modal */}
      <Modal
        show={showPendingOrdersModal}
        onHide={() => setShowPendingOrdersModal(false)}
        size="lg"
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="fw-bold">Đơn hàng chờ xử lý</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table
            striped
            hover
            responsive
            className="table-borderless align-middle"
          >
            <thead className="bg-light text-muted">
              <tr>
                <th>Mã Đơn</th>
                <th>Nhà cung cấp</th>
                <th>Tổng tiền</th>
                <th className="text-end">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrdersList.length > 0 ? (
                pendingOrdersList.map((order, index) => (
                  <tr key={order.poid || index}>
                    <td className="fw-bold text-primary">{`PO-${order.poid}`}</td>
                    <td>{order.supplierName}</td>
                    <td className="fw-bold">{formatCurrency(order.total)}</td>
                    <td className="text-end">{getStatusBadge(order.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-3 text-muted">
                    Không có đơn hàng chờ xử lý.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="light"
            onClick={() => setShowPendingOrdersModal(false)}
          >
            Đóng
          </Button>
          <Button variant="primary" onClick={() => navigate("/po")}>
            Quản lý đơn hàng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Monthly Orders Modal */}
      <Modal
        show={showMonthlyOrdersModal}
        onHide={() => setShowMonthlyOrdersModal(false)}
        size="lg"
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            Chi tiết chi tiêu tháng này
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table
            striped
            hover
            responsive
            className="table-borderless align-middle"
          >
            <thead className="bg-light text-muted">
              <tr>
                <th>Mã Đơn</th>
                <th>Nhà cung cấp</th>
                <th>Tổng tiền</th>
                <th className="text-end">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {poList.length > 0 ? (
                poList
                  .filter((order) => [0, 3, 4, 5].includes(order.status))
                  .map((order) => (
                    <tr key={order.poid}>
                      <td className="fw-bold text-primary">{`PO-${order.poid}`}</td>
                      <td>{order.supplierName}</td>
                      <td className="fw-bold">{formatCurrency(order.total)}</td>
                      <td className="text-end">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-3 text-muted">
                    Không có đơn hàng trong tháng này.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="light"
            onClick={() => setShowMonthlyOrdersModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Supplier Modal */}
      <Modal
        show={showSupplierModal}
        onHide={() => setShowSupplierModal(false)}
        size="xl"
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="fw-bold">Danh sách nhà cung cấp</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {suppliersLoading ? (
            <div className="text-center p-4">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table hover responsive className="table-borderless align-middle">
              <thead className="bg-light text-muted">
                <tr>
                  <th>Tên nhà cung cấp</th>
                  <th>Liên hệ</th>
                  <th>Địa chỉ</th>
                  <th className="text-end">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {suppliers
                  .filter((s) => s.status === 1)
                  .map((s, index) => (
                    <tr key={s._id || index}>
                      <td>
                        <div className="fw-bold">{s.name}</div>
                      </td>
                      <td>
                        <div>{s.email}</div>
                        <small className="text-muted">{s.phoneNumber}</small>
                      </td>
                      <td>{s.address}</td>
                      <td className="text-end">
                        <Badge bg="success" pill>
                          Hoạt động
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowSupplierModal(false)}>
            Đóng
          </Button>
          <Button
            variant="info"
            className="text-white"
            onClick={() => navigate("/supplier")}
          >
            Quản lý nhà cung cấp
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Monthly Chart Orders Modal */}
      <Modal
        size="lg"
        show={showMonthlyChartModal}
        onHide={() => setShowMonthlyChartModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Đơn hàng tháng {selectedMonth}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <Table hover className="table-borderless align-middle mb-0">
              <thead className="bg-light text-muted">
                <tr>
                  <th className="ps-4 py-3 fw-semibold">Mã Đơn</th>
                  <th className="fw-semibold">Nhà cung cấp</th>
                  <th className="fw-semibold text-center">Ngày đặt hàng</th>

                  <th className="fw-semibold text-end">Còn nợ</th>
                  <th className="fw-semibold text-end">Tổng tiền</th>
                  <th className="pe-4 fw-semibold text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {monthlyOrders.length > 0 ? (
                  monthlyOrders.map((order, index) => {
                    const paid = Number(order.deposit || 0);
                    const remaining = Number(order.total || 0) - paid;
                    return (
                      <tr key={order.poid || index}>
                        <td className="ps-4 fw-bold text-primary">{`PO-${order.poid}`}</td>
                        <td>{order.supplierName}</td>
                        <td className="text-muted text-center small">
                          {order.orderDate
                            ? new Date(order.orderDate).toLocaleDateString(
                                "vi-VN"
                              )
                            : "-"}
                        </td>
                        <td className="fw-bold text-end text-danger">
                          {formatCurrency(remaining)}
                        </td>
                        <td className="fw-bold text-end">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="pe-4 text-center">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      Không có đơn hàng
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};
