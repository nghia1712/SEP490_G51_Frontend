import React, { useEffect, useState, useMemo } from "react";
import {
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Container, Row, Col, Card, Form } from "react-bootstrap";
import { TrendingUp, TrendingDown, Savings } from "@mui/icons-material";

import usePO from "../../../Hooks/usePO";
import useSupplier from "../../../Hooks/useSupplier";
import salesOrderAPI from "../../../API/salesOrderAPI";

/* ===================== STAT CARD ===================== */
const StatCard = ({ title, value, icon, color, onClick, subText }) => (
  <Card
    className="border-0 shadow-sm h-100"
    onClick={onClick}
    style={{
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 .5rem 1rem rgba(0,0,0,.15)";
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
      }
    }}
  >
    <Card.Body className="d-flex align-items-center p-4">
      <div
        className={`d-flex align-items-center justify-content-center rounded-circle bg-${color} bg-opacity-10 me-3`}
        style={{ width: 60, height: 60, minWidth: 60 }}
      >
        {React.cloneElement(icon, {
          className: `text-${color}`,
          style: { fontSize: 30 },
        })}
      </div>

      <div>
        <p
          className="text-muted mb-1 text-uppercase fw-semibold"
          style={{ fontSize: 13 }}
        >
          {title}
        </p>
        <h4 className="fw-bold mb-0 text-dark">{value}</h4>
        {subText && <small className="text-muted">{subText}</small>}
      </div>
    </Card.Body>
  </Card>
);

/* ===================== DASHBOARD ===================== */
export default function ManagerDashboard() {
  const { fetchPOByYear, poByYearLoading } = usePO();
  const { fetchSupplierById } = useSupplier();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearlyChartData, setYearlyChartData] = useState([]);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  const supplierCache = {};

  const getSupplierName = async (id) => {
    if (!id) return "Unknown";
    if (supplierCache[id]) return supplierCache[id];
    const data = await fetchSupplierById(id);
    const name = data?.name || "Unknown";
    supplierCache[id] = name;
    return name;
  };

  /* ===================== SUMMARY ===================== */
  const totalCost = useMemo(
    () => yearlyChartData.reduce((s, m) => s + Number(m.cost || 0), 0),
    [yearlyChartData]
  );

  const totalRevenue = useMemo(
    () => yearlyChartData.reduce((s, m) => s + Number(m.revenue || 0), 0),
    [yearlyChartData]
  );

  const totalProfit = useMemo(
    () => totalRevenue - totalCost,
    [totalRevenue, totalCost]
  );

  const profitMargin = useMemo(() => {
    if (totalRevenue <= 0) return 0;
    return (totalProfit / totalRevenue) * 100;
  }, [totalProfit, totalRevenue]);

  /* ===================== LOAD DATA ===================== */
  const loadYearChart = async () => {
    try {
      setLoadingRevenue(true);

      // Chi phí PO
      const poData = await fetchPOByYear(selectedYear);

      // Doanh thu
      const revenueRes = await salesOrderAPI.getRevenueByYear(selectedYear);
      const revenueRaw = revenueRes?.data?.data ?? revenueRes?.data ?? [];

      const revenueByMonth = revenueRaw.map((item, idx) => ({
        monthIndex: item.month ?? idx + 1,
        revenue: Number(item.totalRevenue ?? item.total ?? item.amount ?? 0),
      }));

      const monthlyData = await Promise.all(
        Array.from({ length: 12 }, async (_, i) => {
          const month = i + 1;

          const poMonth = poData?.find((m) => m.month === month);
          const ordersWithName = await Promise.all(
            (poMonth?.orders || []).map(async (order) => ({
              ...order,
              supname: await getSupplierName(order.supname),
            }))
          );

          const cost = ordersWithName.reduce(
            (sum, o) => sum + Number(o.deposit || 0),
            0
          );

          const revenueMonth = revenueByMonth.find(
            (r) => r.monthIndex === month
          );

          return {
            month: `Tháng ${month}`,
            cost,
            revenue: revenueMonth?.revenue || 0,
          };
        })
      );

      setYearlyChartData(monthlyData);
    } catch (err) {
      console.error("Lỗi load Manager Dashboard", err);
    } finally {
      setLoadingRevenue(false);
    }
  };

  useEffect(() => {
    loadYearChart();
  }, [selectedYear]);

  /* ===================== FORMAT ===================== */
  const formatCurrency = (v) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(v || 0);

  const formatPercent = (v) => `${Number(v || 0).toFixed(1)}%`;

  /* ===================== UI ===================== */
  return (
    <Container>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-5 mt-4">
        <div>
          <h2 className="fw-bold mb-1">Thống kê tài chính</h2>
          <h5 className="text-muted mb-0">
            Tổng quan doanh thu & chi phí năm {selectedYear}
          </h5>
        </div>
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
      </div>

      {/* SUMMARY */}
      <Row className="g-4 mb-5">
        <Col md={6} lg={4}>
          <StatCard
            title="Doanh thu cả năm"
            value={formatCurrency(totalRevenue)}
            icon={<TrendingUp />}
            color="success"
            subText={`Năm ${selectedYear}`}
          />
        </Col>

        <Col md={6} lg={4}>
          <StatCard
            title="Tổng chi phí"
            value={formatCurrency(totalCost)}
            icon={<TrendingDown />}
            color="primary"
            subText="Chi phí mua hàng"
          />
        </Col>

        <Col md={6} lg={4}>
          <StatCard
            title="Lợi nhuận"
            value={formatCurrency(totalProfit)}
            icon={<Savings />}
            color={totalProfit >= 0 ? "success" : "danger"}
            subText={`Biên lợi nhuận: ${formatPercent(profitMargin)}`}
          />
        </Col>
      </Row>

      {/* CHART */}
      <Paper className="p-4 rounded-4 mb-5">
        <Typography className="fw-bold mb-3">
          Chi phí & Doanh thu theo tháng
        </Typography>

        <div style={{ height: 360 }}>
          {poByYearLoading || loadingRevenue ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <CircularProgress />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCurrency} width={90} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar
                  dataKey="cost"
                  name="Chi phí"
                  fill="#1976d2"
                  barSize={20}
                />
                <Bar
                  dataKey="revenue"
                  name="Doanh thu"
                  fill="#2e7d32"
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Paper>
    </Container>
  );
}
