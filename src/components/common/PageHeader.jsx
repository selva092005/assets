import { Box, Typography } from "@mui/material";
import { COLORS } from "../../theme/tokens";

export default function PageHeader({ title, actions }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 1.5,
        flexWrap: "wrap",
        gap: 1,
        animation: "headerSlideDown 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "@keyframes headerSlideDown": {
          from: { opacity: 0, transform: "translateY(-10px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 3, height: 16, borderRadius: 999, bgcolor: COLORS.primary, flexShrink: 0 }} />
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>
          {title}
        </Typography>
      </Box>
      {actions && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
