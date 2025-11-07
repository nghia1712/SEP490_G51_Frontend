import React from "react";
import { Box, Typography } from "@mui/material";

// Component nút ứng dụng kiểu Odoo
const OdooAppButton = ({ title, icon, onClick, isMain = false, description = "", isActive = false }) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        cursor: "pointer",
        p: isMain ? 3 : 2,
        borderRadius: "12px",
        transition: "all 0.3s ease-in-out",
        border: isMain || isActive ? "2px solid rgba(255, 255, 255, 0.3)" : "none",
        backgroundColor: isMain || isActive ? "rgba(255, 255, 255, 0.1)" : "transparent",
        "&:hover": {
          backgroundColor: isMain || isActive ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.15)",
          transform: isMain ? "translateY(-5px) scale(1.05)" : "translateY(-3px)",
          border: isMain || isActive ? "2px solid rgba(255, 255, 255, 0.5)" : "none",
        },
      }}
    >
      <Box
        sx={{
          width: isMain ? 84 : 72,
          height: isMain ? 84 : 72,
          borderRadius: "16px",
          backgroundColor: isMain || isActive ? "#fff" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1,
          boxShadow: isMain || isActive ? "0 6px 12px rgba(0,0,0,0.2)" : "0 4px 8px rgba(0,0,0,0.15)",
          color: isMain || isActive ? "#1976d2" : "#155E64",
          border: isMain || isActive ? "3px solid #1976d2" : "none",
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: isMain ? 48 : 40 } })}
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: "white",
          fontWeight: isMain ? 600 : 500,
          fontSize: isMain ? "1rem" : "0.875rem",
          lineHeight: 1.2,
          mb: description ? 0.5 : 0,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "0.75rem",
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
};

export default OdooAppButton;
