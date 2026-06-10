import React from "react";
import { Box, Typography } from "@mui/material";

export default function CustomTooltip({ active, payload, unit = "" }) {
  if (active && payload && payload.length) {
    const unitText = unit ? ` ${unit}` : "";
    return (
      <Box sx={{
        bgcolor: "#ffffff",
        p: "6px 10px",
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e2e8f0",
        pointerEvents: "none"
      }}>
        <Typography sx={{ fontSize: "9.5px", fontWeight: 700, color: "#1e293b" }}>
          {payload[0].name}
        </Typography>
        <Typography sx={{ fontSize: "10.5px", fontWeight: 900, color: "#2563eb", mt: 0.25 }}>
          {payload[0].value.toLocaleString()}{unitText}
        </Typography>
      </Box>
    );
  }
  return null;
}
