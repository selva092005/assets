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
      size="small"
      sx={{
        background:  s.bg,
        color:       s.color,
        border:      s.border ? `1px solid ${s.border}` : undefined,
        boxShadow:   s.border ? "inset 0 1px 0 rgba(255,255,255,0.9)" : undefined,
        fontWeight:  700,
        fontSize:    12,
        borderRadius:"20px",
        height:      24,
      }}
    />
  );
}
