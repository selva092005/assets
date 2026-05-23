import { Chip } from "@mui/material";

/**
 * StatusPill
 * @param {string}  label  – the status/role/condition string
 * @param {object}  map    – color map { [LABEL]: { bg, color, border? } }
 */
export default function StatusPill({ label, map = {} }) {
  const key = String(label ?? "").toUpperCase();
  const s   = map[key] || { bg: "#f5f5f5", color: "#555" };
  return (
    <Chip
      label={label}
      sx={{
        background:   s.bg,
        color:        s.color,
        border:       s.border ? `1px solid ${s.border}` : "none",
        fontWeight:   600,
        fontSize:     10,
        borderRadius: "6px",
        height:       18,
        "& .MuiChip-label": { px: "6px", py: 0, lineHeight: "18px" },
      }}
    />
  );
}
