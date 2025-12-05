import React, { useState } from "react";
import { Card, Form, Modal, Table } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { LocalShipping } from "@mui/icons-material";
import useGRNList from "../../../Hooks/useGRNList";
import { Button } from "@mui/material";

export const WarehouseCharts = () => {
  const { importStats, statsLoading, selectedYear, setSelectedYear } =
    useGRNList({ poId: null, autoOpenCreate: false });

  const [selectedMonthProducts, setSelectedMonthProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMonth, setModalMonth] = useState("");

  const handleYearChange = (e) => setSelectedYear(Number(e.target.value));

  // Chuẩn hóa dữ liệu cho chart
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthNumber = i + 1;
    const monthData = importStats.find((m) => m.month === monthNumber);

    return {
      month: `Tháng ${monthNumber}`,
      totalQuantity: monthData?.totalQuantity || 0,
      products: monthData?.products || [],
    };
  });

  const totalQuantitySum = chartData.reduce(
    (sum, m) => sum + (m.totalQuantity || 0),
    0
  );

  const formatNumber = (value) =>
    new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 0 }).format(value);

  const handleBarClick = (data) => {
    if (!data || !data.activePayload) return;
    const payload = data.activePayload[0]?.payload;
    if (payload && payload.products?.length > 0) {
      setSelectedMonthProducts(payload.products);
      setModalMonth(payload.month);
      setShowModal(true);
    }
  };

  return (
    <>
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0 d-flex align-items-center">
            <LocalShipping className="me-2" /> Thống kê nhập kho theo tháng
          </h5>
          <div style={{ width: "120px" }}>
            <Form.Select
              size="sm"
              value={selectedYear}
              onChange={handleYearChange}
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

        <Card.Body style={{ height: "350px" }}>
          {statsLoading ? (
            <div className="h-100 d-flex justify-content-center align-items-center text-muted">
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : totalQuantitySum === 0 ? (
            <div className="h-100 d-flex justify-content-center align-items-center text-muted">
              <span>Không có dữ liệu thống kê năm {selectedYear}</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                onClick={handleBarClick}
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
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value) => [formatNumber(value), "Số lượng"]}
                />
                <Bar
                  dataKey="totalQuantity"
                  fill="#0d6efd"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card.Body>
      </Card>

      {/* Modal danh sách sản phẩm */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            Sản phẩm nhập kho - {modalMonth} / {selectedYear}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {selectedMonthProducts.length > 0 ? (
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
                  <th className="text-center">Tỉ lệ nhập (%)</th>
                </tr>
              </thead>
              <tbody>
                {selectedMonthProducts.map((p, idx) => (
                  <tr key={p.productID || idx}>
                    <td>{idx + 1}</td>
                    <td className="fw-semibold text-primary">
                      {p.productName}
                    </td>
                    <td className="text-end">{p.quantity}</td>
                    <td className="text-center">
                      {p.percentage ? p.percentage.toFixed(2) : "-"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-muted py-3">Không có sản phẩm</div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
