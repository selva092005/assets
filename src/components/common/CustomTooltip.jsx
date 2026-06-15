import React from "react";
import { Box, Typography } from "@mui/material";

export default function CustomTooltip({ active, payload, unit = "" }) {
  if (active && payload && payload.length) {
    const unitText = unit ? ` ${unit}` : "";
    return (
      <Box sx={{
        bgcolor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(8px)",
        p: "6px 10px",
        borderRadius: "8px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        border: "1px solid rgba(226, 232, 240, 0.8)",
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
