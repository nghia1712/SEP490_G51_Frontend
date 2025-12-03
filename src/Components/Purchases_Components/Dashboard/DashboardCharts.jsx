// src/Components/Purchases_Components/DashboardCharts.jsx
import React from "react";
import { Card, Form } from "react-bootstrap";
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
}) => {
  return (
    <>
      {/* Yearly Chart */}
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
                    const monthData = yearlyChartData[index]; // lấy tháng tương ứng
                    if (monthData?.orders) {
                      setMonthlyOrders(monthData.orders); // set state danh sách đơn
                      setSelectedMonth(index + 1); // Lưu tháng để hiển thị tiêu đề modal
                      setShowMonthlyChartModal(true); // mở modal
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card.Body>
      </Card>

      {/* Pie Chart */}
      <Card className="border-0 shadow-sm rounded-4">
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
                  label={({ name, percent, value }) =>
                    `${name} (${value}): ${(percent * 100).toFixed(0)}%`
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
    </>
  );
};
