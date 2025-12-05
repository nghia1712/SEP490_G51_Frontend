// src/Components/Warehouse_Components/WarehouseDashboardModals.jsx
import React from "react";
import { Modal, Table, Button, Spinner, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export const WarehouseDashboardModals = ({
  showPendingGINModal,
  setShowPendingGINModal,
  showPendingPOModal,
  setShowPendingPOModal,
  ginList,
  poList,
  showPendingExportProductModal,
  setShowPendingExportProductModal,
  notExportedStats,
}) => {
  const navigate = useNavigate();
  const modalBodyStyle = { maxHeight: "60vh", overflowY: "auto" };

  const getPOStatusBadge = (status) => {
    switch (status) {
      case 0:
        return <Badge bg="warning">Chưa nhập kho</Badge>;
      case 1:
        return <Badge bg="success">Đã nhập kho</Badge>;
      default:
        return <Badge bg="secondary">Khác</Badge>;
    }
  };
  const getGINStatusBadge = (status) => {
    switch (status) {
      case 1:
        return <Badge bg="warning">Chờ xử lý</Badge>;
      default:
        return <Badge bg="secondary">Khác</Badge>;
    }
  };
  return (
    <>
      {/* Pending GIN Modal */}
      <Modal
        show={showPendingGINModal}
        onHide={() => setShowPendingGINModal(false)}
        size="lg"
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="fw-bold">Phiếu xuất chờ xử lý</Modal.Title>
        </Modal.Header>
        <Modal.Body style={modalBodyStyle}>
          <Table
            striped
            hover
            responsive
            className="table-borderless align-middle"
          >
            <thead className="bg-light text-muted">
              <tr>
                <th>Mã phiếu</th>
                <th>Kho xuất</th>
                <th>Mã đơn hàng</th>
                <th>Người tạo</th>
                <th className="text-end">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {ginList.length > 0 ? (
                ginList.map((gin, index) => (
                  <tr key={gin.id || index}>
                    <td className="fw-bold text-primary">
                      {gin.goodsIssueNoteCode}
                    </td>
                    <td>{gin.warehouseName}</td>
                    <td>{gin.stockExportOrderCode}</td>
                    <td>{gin.createBy}</td>
                    <td className="text-end">
                      {getGINStatusBadge(gin.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-3 text-muted">
                    Không có phiếu xuất chờ xử lý
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="secondary"
            onClick={() => setShowPendingGINModal(false)}
          >
            Đóng
          </Button>
          <Button variant="primary" onClick={() => navigate("/gin")}>
            Quản lý phiếu xuất kho
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Pending PO Modal */}
      <Modal
        show={showPendingPOModal}
        onHide={() => setShowPendingPOModal(false)}
        size="lg"
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="fw-bold">Đơn hàng chờ nhập kho</Modal.Title>
        </Modal.Header>
        <Modal.Body style={modalBodyStyle}>
          <Table
            striped
            hover
            responsive
            className="table-borderless align-middle"
          >
            <thead className="bg-light text-muted">
              <tr>
                <th>Mã đơn</th>
                <th>Nhà cung cấp</th>
                <th className="text-end">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {poList.length > 0 ? (
                poList.map((po, index) => (
                  <tr key={po.poid || index}>
                    <td className="fw-bold text-primary">{`PO-${po.poid}`}</td>
                    <td>{po.supplierName}</td>
                    <td className="text-end">{getPOStatusBadge(po.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-3 text-muted">
                    Không có đơn hàng chờ nhập kho
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowPendingPOModal(false)}>
            Đóng
          </Button>
          <Button variant="primary" onClick={() => navigate("/po")}>
            Quản lý đơn hàng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Pending Export Products Modal */}
      <Modal
        show={showPendingExportProductModal}
        onHide={() => setShowPendingExportProductModal(false)}
        size="lg"
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="fw-bold">Sản phẩm chờ xuất kho</Modal.Title>
        </Modal.Header>

        <Modal.Body style={modalBodyStyle}>
          {/* Tổng số lượng */}
          <div className="mb-3 text-end fw-bold text-primary">
            Tổng số lượng chờ xuất: {notExportedStats?.totalQuantity || 0}
          </div>

          <Table
            striped
            hover
            responsive
            className="table-borderless align-middle"
          >
            <thead className="bg-light text-muted">
              <tr>
                <th>#</th>
                <th>Sản phẩm</th>
                <th className="text-end">Số lượng</th>
                <th className="text-center">Tỷ lệ (%)</th>
              </tr>
            </thead>
            <tbody>
              {notExportedStats?.products?.length > 0 ? (
                notExportedStats.products.map((p, index) => (
                  <tr key={p.productID || index}>
                    <td>{index + 1}</td>
                    <td className="fw-semibold">{p.productName}</td>
                    <td className="text-end">{p.quatity}</td>
                    <td className="text-center">{p.percentage}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-3 text-muted">
                    Không có sản phẩm chờ xuất
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="secondary"
            onClick={() => setShowPendingExportProductModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
