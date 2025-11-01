import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import prfqApi from "../../../API/prfqAPI";

export default function PRFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prfq, setPrfq] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await prfqApi.getDetail(id);
      setPrfq(res.data?.data || res.data);
    } catch (error) {
      console.error("❌ Lỗi khi tải PRFQ:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (statusCode) => {
    switch (statusCode) {
      case 1:
        return { label: "Sent", color: "info" };
      case 2:
        return { label: "Approved", color: "success" };
      case 3:
        return { label: "Rejected", color: "error" };
      default:
        return { label: "Draft", color: "default" };
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Đang tải dữ liệu...
        </Typography>
      </Box>
    );
  }

  if (!prfq) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography variant="h6" color="error">
          Không tìm thấy yêu cầu báo giá.
        </Typography>
      </Box>
    );
  }

  const { label, color } = getStatus(prfq.status);

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>
        <Typography variant="h5" fontWeight={700}>
          Chi tiết yêu cầu
        </Typography>
      </Stack>

      {/* Thông tin chung */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          PRFQ ID: {prfq.prfqid}
        </Typography>

        <Box sx={{ border: "1px solid #ddd", borderRadius: 2, p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Trạng thái
              </Typography>
              <Chip label={label} color={color} size="small" />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Người tạo
              </Typography>
              <Typography variant="subtitle1">
                {prfq.createdBy?.userName || "—"}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Đến NCC
              </Typography>
              <Typography variant="subtitle1">
                {prfq.supplier?.name || "—"}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Ngày tạo
              </Typography>
              <Typography variant="subtitle1">
                {prfq.requestDate
                  ? new Date(prfq.requestDate).toLocaleString("vi-VN")
                  : "—"}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Danh sách sản phẩm */}
        <Typography variant="h6" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
          Sản phẩm
        </Typography>
        <Box sx={{ border: "1px dotted #aaa", borderRadius: 2, p: 2 }}>
          {prfq.products && prfq.products.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: "#f8f8f8" }}>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Tên sản phẩm</TableCell>
                    <TableCell>Mô tả</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prfq.products.map((product, index) => (
                    <TableRow key={product.productID}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{product.productName}</TableCell>
                      <TableCell>
                        {product.productDescription || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Không có sản phẩm nào trong PRFQ này.
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
