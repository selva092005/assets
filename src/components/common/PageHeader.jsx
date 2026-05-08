import { Box, Typography } from "@mui/material";
import { COLORS } from "../../theme/tokens";

/**
 * PageHeader
 * @param {string}   title    – page title text
 * @param {ReactNode} actions – buttons / controls rendered on the right
 */
export default function PageHeader({ title, actions }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2.5,
        flexWrap: "wrap",
        gap: 1.25,
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: 22, color: COLORS.text }}>
        {title}
      </Typography>
      {actions && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
