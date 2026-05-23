import { Box, Button, Typography } from "@mui/material";
import { pageBtnSx, COLORS } from "../../theme/tokens";

function getPageRange(page, totalPages) {
  if (totalPages <= 7) return [...Array(totalPages)].map((_, i) => i);
  const range = [];
  range.push(0);
  if (page > 2) range.push("...");
  for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) range.push(i);
  if (page < totalPages - 3) range.push("...");
  range.push(totalPages - 1);
  return range;
}

export default function TablePagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;
  const range = getPageRange(page, totalPages);

  return (
    <Box
      sx={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        px: 2, py: 1,
        borderTop: `1px solid ${COLORS.borderLight}`,
        flexWrap: "wrap", gap: 1,
      }}
    >
      <Button onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0} sx={pageBtnSx(false)}>
        ‹ Prev
      </Button>

      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        {range.map((item, idx) =>
          item === "..." ? (
            <Typography key={`ellipsis-${idx}`} sx={{ fontSize: 11, color: COLORS.textFaint, px: 0.5 }}>…</Typography>
          ) : (
            <Button key={item} onClick={() => onPageChange(item)} sx={pageBtnSx(page === item)}>
              {item + 1}
            </Button>
          )
        )}
      </Box>

      <Button onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} sx={pageBtnSx(false)}>
        Next ›
      </Button>
    </Box>
  );
}
