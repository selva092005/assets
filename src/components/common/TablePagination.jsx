import { Box, Button } from "@mui/material";
import { pageBtnSx, COLORS } from "../../theme/tokens";

/**
 * TablePagination
 * @param {number}   page         – zero-based current page
 * @param {number}   totalPages
 * @param {Function} onPageChange – (newPage: number) => void
 */
export default function TablePagination({ page, totalPages, onPageChange }) {
  const pages = [...Array(totalPages)].map((_, i) => i);

  return (
    <Box
      sx={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        px: 2.5, py: 1.5,
        borderTop: `1px solid ${COLORS.borderLight}`,
        flexWrap: "wrap", gap: 1,
      }}
    >
      <Button
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        sx={pageBtnSx(false)}
      >
        ‹ Previous
      </Button>

      <Box sx={{ display: "flex", gap: 0.5 }}>
        {pages.map((i) => (
          <Button key={i} onClick={() => onPageChange(i)} sx={pageBtnSx(page === i)}>
            {String(i + 1).padStart(2, "0")}
          </Button>
        ))}
      </Box>

      <Button
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        sx={pageBtnSx(false)}
      >
        Next ›
      </Button>
    </Box>
  );
}
