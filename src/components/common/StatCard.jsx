import { useState, useEffect } from "react";
import { Paper, Box, Typography } from "@mui/material";
import { statCardSx, getThemeConfig } from "../../theme/tokens";

export default function StatCard({ icon, label, value, iconColor }) {
  const [styleMode, setStyleMode] = useState(() => localStorage.getItem("ams_card_style") || "AURORA");

  useEffect(() => {
    const handleStyleChange = (e) => {
      if (e.detail) {
        setStyleMode(e.detail);
      }
    };
    window.addEventListener("ams-card-style-changed", handleStyleChange);
    return () => window.removeEventListener("ams-card-style-changed", handleStyleChange);
  }, []);

  const theme = getThemeConfig(iconColor, styleMode);

  return (
    <Paper
      elevation={0}
      sx={statCardSx(iconColor, styleMode)}
    >
      <Box
        className="stat-card-icon-box"
        sx={{
          width: 38,
          height: 38,
          borderRadius: "6px",
          background: theme.iconBg,
          border: `1px solid ${theme.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 2px 8px ${theme.shadow}`,
          transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <Box sx={{ color: theme.iconColor, display: "flex", fontSize: 15 }}>{icon}</Box>
      </Box>
      <Box sx={{ zIndex: 1 }}>
        <Typography sx={{ fontSize: 9.5, color: theme.label, fontWeight: 800, mb: 0.15, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 22, fontWeight: 950, color: theme.text, lineHeight: 1 }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}
