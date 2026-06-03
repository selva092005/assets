import { useState, useEffect } from "react";
import { Paper, Box, Typography } from "@mui/material";
import { premiumCardSx } from "../../theme/tokens";

export default function PremiumCard({ title, icon, children, action, subtitle }) {
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

  const isDark = styleMode === "DARK_STEEL";

  return (
    <Paper
      elevation={0}
      sx={premiumCardSx(styleMode)}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyBox: "space-between", mb: 1, mt: 0.1, justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            className="premium-card-icon-box"
            sx={{
              width: 26,
              height: 26,
              borderRadius: "6px",
              background: isDark
                ? "rgba(129, 140, 248, 0.15)"
                : "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(139, 92, 246, 0.12) 100%)",
              border: isDark
                ? "1px solid rgba(129, 140, 248, 0.45)"
                : "1px solid rgba(37, 99, 235, 0.25)",
              color: isDark ? "#818cf8" : "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              flexShrink: 0,
              transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "12px", color: isDark ? "#ffffff" : "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.1 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ fontSize: "9px", fontWeight: 600, color: isDark ? "#94a3b8" : "#94a3b8", mt: 0.15 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {action}
      </Box>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </Box>
    </Paper>
  );
}
