import React, { useState, useEffect } from "react";
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
import useGIN from "../../../Hooks/useGIN";
import { Button } from "@mui/material";

export const WarehouseCharts = ({ selectedYear: propSelectedYear }) => {
  const [modalTotal, setModalTotal] = useState(0);
  
  // Sử dụng selectedYear từ props, mặc định là năm hiện tại
  const selectedYear = propSelectedYear !== undefined ? propSelectedYear : new Date().getFullYear();
  
  const { importStats, statsLoading, setSelectedYear, fetchImportStats } =
    useGRNList({ poId: null, autoOpenCreate: false });
  
  // Đồng bộ selectedYear từ props với hook useGRNList
  useEffect(() => {
    if (propSelectedYear !== undefined) {
      setSelectedYear(propSelectedYear);
      fetchImportStats(propSelectedYear);
    }
  }, [propSelectedYear, setSelectedYear, fetchImportStats]);
  
  const {
    exportedStats,
    fetchExportedStats,
    statsLoading: ginStatsLoading,
  } = useGIN();
  useEffect(() => {
    fetchExportedStats();
  }, []);
  const [modalType, setModalType] = useState("import");
  const [selectedMonthProducts, setSelectedMonthProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMonth, setModalMonth] = useState("");

  // Chuẩn hóa dữ liệu cho chart (NHẬP + XUẤT)
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthNumber = i + 1;

    const importMonth = importStats.find((m) => m.month === monthNumber);
    const exportMonth = exportedStats.find((m) => m.month === monthNumber);

    return {
      month: `Tháng ${monthNumber}`,

      // Nhập kho
      importQuantity: importMonth?.totalQuantity || 0,
      importProducts: importMonth?.products || [],

      // Xuất kho
      exportQuantity: exportMonth?.totalQuantity || 0,
      exportProducts: exportMonth?.products || [],
    };
  });

  const totalQuantitySum = chartData.reduce(
    (sum, m) => sum + m.importQuantity + m.exportQuantity,
    0
  );

  const formatNumber = (value) =>
    new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 0 }).format(value);

  const handleBarClick = (data) => {
    if (!data || !data.activePayload) return;

    const payload = data.activePayload[0]?.payload;
    const dataKey = data.activePayload[0]?.dataKey;

    if (!payload) return;

    if (dataKey === "importQuantity") {
      setSelectedMonthProducts(payload.importProducts);
      setModalType("import");
    } else if (dataKey === "exportQuantity") {
      setSelectedMonthProducts(payload.exportProducts);
      setModalType("export");
    }

    setModalMonth(payload.month);
    setShowModal(true);
  };

  return (
    <>
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Header className="bg-white border-0 pt-4 px-4">
          <h5 className="fw-bold mb-0 d-flex align-items-center">
            <LocalShipping className="me-2" />
            Thống kê nhập & xuất kho theo tháng
          </h5>
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
            <>
              {/* BIỂU ĐỒ */}
              <ResponsiveContainer width="100%" height="85%">
                <BarChart
                  data={chartData}
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
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    labelFormatter={(label) => `${label}`}
                    formatter={(value, name) => {
                      if (name === "importQuantity") {
                        return [`${formatNumber(value)}`, "🔵 Nhập kho"];
                      }
                      if (name === "exportQuantity") {
                        return [`${formatNumber(value)}`, "🔴 Xuất kho"];
                      }
                      return value;
                    }}
                  />

                  <Bar
                    dataKey="importQuantity"
                    fill="#0d6efd"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                    name="Nhập kho"
                    onClick={(data) => {
                      setSelectedMonthProducts(data.importProducts || []);
                      setModalType("import");
                      setModalTotal(data.importQuantity || 0);
                      setModalMonth(data.month);
                      setShowModal(true);
                    }}
                  />

                  <Bar
                    dataKey="exportQuantity"
                    fill="#dc3545"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                    name="Xuất kho"
                    onClick={(data) => {
                      setModalTotal(data.exportQuantity || 0);
                      setSelectedMonthProducts(data.exportProducts || []);
                      setModalType("export");
                      setModalMonth(data.month);
                      setShowModal(true);
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* CHÚ THÍCH MÀU SẮC NẰM DƯỚI BIỂU ĐỒ */}
              <div className="d-flex justify-content-center gap-4 mt-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      backgroundColor: "#0d6efd",
                      borderRadius: 4,
                    }}
                  ></div>
                  <span className="text-muted">Nhập kho</span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      backgroundColor: "#dc3545",
                      borderRadius: 4,
                    }}
                  ></div>
                  <span className="text-muted">Xuất kho</span>
                </div>
              </div>
            </>
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
            {modalType === "import" ? "Sản phẩm nhập kho" : "Sản phẩm xuất kho"}{" "}
            - {modalMonth} / {selectedYear}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <div className="d-flex justify-content-end mb-3 fw-bold text-primary">
            Tổng số lượng: {formatNumber(modalTotal)}
          </div>
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
                  <th className="text-center">
                    {modalType === "import"
                      ? "Tỉ lệ nhập (%)"
                      : "Tỉ lệ xuất (%)"}
                  </th>
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
