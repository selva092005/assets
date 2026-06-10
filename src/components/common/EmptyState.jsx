import React from "react";
import { Box, Typography } from "@mui/material";
import { COLORS } from "../../theme/tokens";

export default function EmptyState({ icon: Icon, label }) {
  return (
    <Box sx={{ textAlign: "center", py: 8, color: COLORS.textFaint }}>
      {Icon && <Icon size={40} style={{ marginBottom: 12, opacity: 0.35 }} />}
      <Typography fontSize={14}>{label || "No records found."}</Typography>
    </Box>
  );
}
