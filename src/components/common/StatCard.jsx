import { Paper, Box, Typography } from "@mui/material";

export default function StatCard({ icon, label, value, iconBg, iconColor }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "8px",
        p: "8px 12px",
        background: "#fff",
        border: "1px solid #f1f5f9",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
        display: "flex",
        alignItems: "center",
        gap: 1,
        cursor: "default",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.07)",
        },
        animation: "fadeUp 300ms ease both",
        "@keyframes fadeUp": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box sx={{
        width: 32, height: 32, borderRadius: "6px",
        background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Box sx={{ color: iconColor, display: "flex", fontSize: 13 }}>{icon}</Box>
      </Box>
      <Box>
        <Typography sx={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 500, mb: 0.25, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}
