import { Box, Button, Typography } from "@mui/material";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { COLORS } from "../../theme/tokens";

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

  const buttonStyle = (active) => ({
    minWidth: 22,
    width: 22,
    height: 22,
    p: 0,
    borderRadius: "50%",
    fontSize: "9.5px",
    fontWeight: active ? 700 : 600,
    color: active ? "#ffffff" : "#475569",
    background: active ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)` : "transparent",
    boxShadow: active ? "0 2px 6px rgba(37, 99, 235, 0.2)" : "none",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    textTransform: "none",
    "&:hover": {
      background: active ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)` : "rgba(255, 255, 255, 0.7)",
      color: active ? "#ffffff" : COLORS.primary,
      transform: active ? "none" : "scale(1.06)",
    },
    "&.Mui-disabled": {
      color: "#cbd5e1",
      background: "transparent",
    },
  });

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 2,
        py: 0.75,
        borderTop: `1px solid ${COLORS.borderLight}`,
        flexWrap: "wrap",
        gap: 1,
        background: "#ffffff",
      }}
    >
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted }}>
        Showing page <span style={{ color: COLORS.primary }}>{page + 1}</span> of {totalPages}
      </Typography>

      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          background: "#f1f5f9",
          borderRadius: "9999px",
          p: "2px",
          gap: "1.5px",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
        }}
      >
        <Button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          sx={buttonStyle(false)}
        >
          <FaChevronLeft size={6.5} />
        </Button>

        {range.map((item, idx) =>
          item === "..." ? (
            <Typography
              key={`ellipsis-${idx}`}
              sx={{
                fontSize: 9.5,
                color: "#94a3b8",
                px: 0.5,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 22,
              }}
            >
              …
            </Typography>
          ) : (
            <Button
              key={item}
              onClick={() => onPageChange(item)}
              sx={buttonStyle(page === item)}
            >
              {item + 1}
            </Button>
          )
        )}

        <Button
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          sx={buttonStyle(false)}
        >
          <FaChevronRight size={6.5} />
        </Button>
      </Box>
    </Box>
  );
}
