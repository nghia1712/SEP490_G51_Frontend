import React from "react";
import { Chip } from "@mui/material";
import { CheckCircle as CheckCircleIcon, Block as BlockIcon } from "@mui/icons-material";

const palette = {
  dark: "#155E64",
  medium: "#75B39C",
  light: "#A0E4D0",
};

const renderStatusChip = (status) => {
  if (status === "active") {
    return (
      <Chip
        label="Còn cung cấp"
        size="small"
        icon={<CheckCircleIcon />}
        sx={{
          backgroundColor: palette.light,
          color: palette.dark,
          fontWeight: "medium",
        }}
      />
    );
  } else {
    return (
      <Chip
        label="Ngừng cung cấp"
        color="error"
        size="small"
        icon={<BlockIcon />}
        sx={{ fontWeight: "medium" }}
      />
    );
  }
};

export default renderStatusChip;
