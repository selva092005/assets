import { Box, Typography } from "@mui/material";
import { COLORS } from "../../theme/tokens";

export default function PageHeader({ title, subtitle, actions }) {
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
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 15, color: COLORS.text, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {actions && (
        <Box sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          ml: "auto",
          justifyContent: "flex-end"
        }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
