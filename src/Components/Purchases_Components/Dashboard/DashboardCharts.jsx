// src/Components/Purchases_Components/DashboardCharts.jsx
import React from "react";
import { Card, Form, Row, Col, Modal, Button, Table } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Inventory } from "@mui/icons-material";

export const DashboardCharts = ({
  yearlyChartData,
  statusChartData,
  selectedYear,
  setSelectedYear,
  formatCurrency,
  setMonthlyOrders,
  setSelectedMonth,
  setShowMonthlyChartModal,
  setFilteredOrdersByStatus,
  setSelectedStatus,
  setShowStatusModal,
  showStatusModal,
  selectedStatus,
  filteredOrdersByStatus,
  getStatusBadge,
}) => {
  return (
    <>
      <Row>
        {/* ===================== YEARLY BAR CHART (8 COLUMNS) ===================== */}
        <Col xs={12} lg={7}>
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Biểu đồ chi phí</h5>
              <div style={{ width: "150px" }}>
                <Form.Select
                  size="sm"
                  className="border-0 bg-light fw-bold text-secondary"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        Năm {year}
                      </option>
                    );
                  })}
                </Form.Select>
              </div>
            </Card.Header>

            <Card.Body className="px-4 pb-4" style={{ height: "350px" }}>
              {yearlyChartData.length === 0 ||
              yearlyChartData.every((m) => m.total === 0) ? (
                <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted">
                  <Inventory
                    style={{ fontSize: 48, opacity: 0.2 }}
                    className="mb-2"
                  />
                  <span>Không có dữ liệu năm {selectedYear}</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={yearlyChartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e0e0e0"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6c757d" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                          minimumFractionDigits: 0,
                        }).format(value)
                      }
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value) => [formatCurrency(value), "Chi phí"]}
                    />
                    <Bar
                      dataKey="total"
                      fill="#0d6efd"
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                      onClick={(data, index) => {
                        const monthData = yearlyChartData[index];
                        if (monthData?.orders) {
                          setMonthlyOrders(monthData.orders);
                          setSelectedMonth(index + 1);
                          setShowMonthlyChartModal(true);
                        }
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* ===================== STATUS PIE CHART (4 COLUMNS) ===================== */}
        <Col xs={12} lg={5}>
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">Đơn hàng theo trạng thái</h5>
            </Card.Header>

            <Card.Body style={{ height: 350 }}>
              {statusChartData.length === 0 ? (
                <div className="h-100 d-flex justify-content-center align-items-center text-muted">
                  <Inventory style={{ fontSize: 48, opacity: 0.2 }} />
                  <span>Không có dữ liệu</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      labelLine={false}
                      onClick={(data) => {
                        // data = { name, value, color, orders }
                        if (data?.orders) {
                          setFilteredOrdersByStatus(data.orders);
                          setSelectedStatus(data.name);
                          setShowStatusModal(true);
                        }
                      }}
                      label={({ name, percent, value }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`var(--bs-${entry.color}, #8884d8)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Orders By Status Modal */}
      <Modal
        show={showStatusModal}
        onHide={() => setShowStatusModal(false)}
        size="lg"
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            Đơn hàng — {selectedStatus}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body
          style={{ maxHeight: "60vh", overflow: "hidden", padding: 0 }}
        >
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <Table
              striped
              hover
              responsive
              className="table-borderless align-middle mb-0"
            >
              <thead
                className="bg-light text-muted"
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  background: "#f8f9fa",
                }}
              >
                <tr>
                  <th>Mã Đơn</th>
                  <th>Nhà cung cấp</th>
                  <th className="text-end">Tổng tiền</th>
                  {filteredOrdersByStatus[0]?.status !== 6 && (
                    <>
                      <th className="text-end">
                        {" "}
                        {filteredOrdersByStatus[0]?.status === 3
                          ? "Đã cọc"
                          : "Đã trả"}
                      </th>
                      <th className="text-end">Còn nợ</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredOrdersByStatus?.length > 0 ? (
                  filteredOrdersByStatus.map((order, index) => (
                    <tr key={order.poid || index}>
                      <td className="fw-bold text-primary">{`PO-${order.poid}`}</td>
                      <td>{order.supplierName}</td>
                      <td className="fw-bold text-end">
                        {formatCurrency(order.total)}
                      </td>

                      {order.status !== 6 && (
                        <>
                          <td className="fw-bold text-end text-success">
                            {formatCurrency(order.deposit)}
                          </td>
                          <td className="fw-bold text-end text-danger">
                            {formatCurrency(order.debt)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={filteredOrdersByStatus[0]?.status !== 6 ? 5 : 3}
                      className="text-center py-3 text-muted"
                    >
                      Không có đơn hàng.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowStatusModal(false)}>
            Đóng
          </Button>
          <Button variant="primary" onClick={() => navigate("/po")}>
            Quản lý đơn hàng
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
