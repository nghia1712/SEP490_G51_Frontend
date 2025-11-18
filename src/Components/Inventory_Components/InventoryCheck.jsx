import React from "react";
import { Box, Typography } from "@mui/material";

function InventoryCheck() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 2,
        textAlign: "center",
        backgroundColor: "#fff",
        p: 4,
      }}
    >
      <Typography variant="h4" fontWeight={800} color="#1976d2">
        Kiểm kê kho
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Phần quản lý kệ hàng đã được gỡ bỏ để chuẩn bị cho phiên bản mới.
      </Typography>
    </Box>
  );
}

export default InventoryCheck;