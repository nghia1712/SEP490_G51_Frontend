import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import useCustomerDebt from "../../../Hooks/useCustomerDebt";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { monthData, fetchByMonth, year, setYear, detailLoading } =
    useCustomerDebt();

  // Fetch dữ liệu khi load hoặc khi đổi năm
  useEffect(() => {
    fetchByMonth(year);
  }, [year]);

  // Chuẩn bị dữ liệu cho biểu đồ
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthItem = monthData.find((m) => m.month === i + 1);
    return {
      month: `${i + 1}`,
      totalDebt: monthItem?.totalDebt || 0,
    };
  });

  return (
    <Box sx={{ p: 3 }}>
      {" "}
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Báo cáo
      </Typography>
      {/* Chọn năm */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Năm</InputLabel>
            <Select
              value={year}
              label="Năm"
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>
      {/* Biểu đồ công nợ */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tổng nợ theo tháng ({year})
        </Typography>

        {detailLoading ? (
          <Stack alignItems="center" mt={4}>
            <CircularProgress />
          </Stack>
        ) : monthData.length === 0 ? (
          <Alert severity="info">Không có dữ liệu báo cáo</Alert>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                dataKey="month"
                label={{ value: "Tháng", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: "Số tiền",
                  angle: -90,
                  position: "insideLeft",
                  dx: -20,
                  style: { fontSize: 13 },
                }}
              />

              <Tooltip formatter={(value) => value.toLocaleString() + " đ"} />
              <Legend />
              <Bar dataKey="totalDebt" name="Tổng nợ" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>
    </Box>
  );
}
