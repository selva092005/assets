import { Paper, Box, Typography } from "@mui/material";
import { COLORS } from "../../theme/tokens";

/**
 * StatCard – KPI card used on the Dashboard
 */
export default function StatCard({ icon, label, value, iconBg, iconColor }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "14px",
        p: "20px 24px",
        background: COLORS.surface,
        boxShadow: COLORS.shadow,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 48, height: 48,
          borderRadius: "12px",
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Box sx={{ color: iconColor, display: "flex" }}>{icon}</Box>
      </Box>
      <Box>
        <Typography sx={{ fontSize: 12, color: COLORS.textFaint, fontWeight: 500, mb: 0.25 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 26, fontWeight: 700, color: COLORS.text, lineHeight: 1 }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}
