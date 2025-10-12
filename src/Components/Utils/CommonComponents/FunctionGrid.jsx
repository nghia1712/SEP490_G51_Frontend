import React from "react";
import { Grid, Box, Typography } from "@mui/material";
import OdooAppButton from "./OdooAppButton";

const FunctionGrid = ({ functions, onNavigate, searchTerm = "" }) => {
  // Lọc functions theo search term
  const filteredFunctions = functions.filter((func) =>
    func.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (func.description && func.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      {/* Lưới chức năng */}
      <Grid container spacing={3} justifyContent="center">
        {filteredFunctions.map((func) => (
          <Grid item key={func.title} md={2}>
            <OdooAppButton
              title={func.title}
              icon={func.icon}
              description={func.description}
              onClick={() => onNavigate(func.path)}
              isMain={false}
            />
          </Grid>
        ))}
      </Grid>

      {/* Thông báo không tìm thấy chức năng */}
      {filteredFunctions.length === 0 && (
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <Typography variant="h5" color="white">
            Không tìm thấy chức năng phù hợp
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
            Thử tìm kiếm với từ khóa khác
          </Typography>
        </Box>
      )}
    </>
  );
};

export default FunctionGrid;
