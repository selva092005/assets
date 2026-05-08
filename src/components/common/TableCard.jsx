import { Paper, Box, Typography } from "@mui/material";
import { COLORS } from "../../theme/tokens";

/**
 * TableCard – white card wrapper for MUI Table
 */
export default function TableCard({ title, children }) {
  return (
    <Paper
      elevation={0}
      sx={{ borderRadius: "14px", boxShadow: COLORS.shadow, overflow: "hidden" }}
    >
      {title && (
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${COLORS.borderLight}` }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>
            {title}
          </Typography>
        </Box>
      )}
      <Box sx={{ overflowX: "auto" }}>{children}</Box>
    </Paper>
  );
}
