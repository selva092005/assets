import { TableRow, TableCell } from "@mui/material";
import { COLORS, denseCellSx } from "../../theme/tokens";

export default function InfoRow({ label, value, bg = false }) {
  return (
    <TableRow sx={{ background: bg ? "#fcfcfd" : "transparent" }}>
      <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "30%" }}>
        {label}
      </TableCell>
      <TableCell sx={denseCellSx}>
        {value}
      </TableCell>
    </TableRow>
  );
}
