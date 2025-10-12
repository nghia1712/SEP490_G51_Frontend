import React from "react";
import { TextField, InputAdornment, Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const SearchBar = ({ value, onChange, placeholder = "Tìm kiếm chức năng..." }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <TextField
        fullWidth
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "rgba(255,255,255,0.8)" }} />
            </InputAdornment>
          ),
          sx: {
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: "16px",
            color: "white",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.3)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.5)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "white",
            },
            "& input::placeholder": {
              color: "rgba(255,255,255,0.7)",
              opacity: 1,
            },
            "& input": {
              color: "white",
            },
          },
        }}
        sx={{
          maxWidth: "500px",
          mx: "auto",
        }}
      />
    </Box>
  );
};

export default SearchBar;
