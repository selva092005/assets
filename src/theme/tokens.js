// ─────────────────────────────────────────────
//  Design Tokens  –  single source of truth
// ─────────────────────────────────────────────

export const COLORS = {
  primary: "#1976d2",
  primaryDark: "#1565c0",
  primaryLight: "#e3f2fd",
  primaryBorder: "#bfdbfe",

  bg: "#f4f6fb",
  surface: "#ffffff",
  border: "#e0e0e0",
  borderLight: "#f0f0f0",
  shadow: "0 2px 12px rgba(0,0,0,0.07)",

  text: "#1a1a2e",
  textMuted: "#555",
  textFaint: "#888",

  avatarBg: "#e8eaf6",
  avatarColor: "#3949ab",
};

export const STATUS_COLORS = {
  AVAILABLE: { bg: "#e8f5e9", color: "#2e7d32" },
  ASSIGNED: { bg: "#dbeafe", color: "#2563eb" },
  DAMAGED: { bg: "#ffebee", color: "#c62828" },
  DISPOSED: { bg: "#e5e7eb", color: "#4b5563" },
};

export const CONDITION_COLORS = {
  GOOD: { bg: "#e3f2fd", color: "#1565c0" },
  FAIR: { bg: "#fffde7", color: "#f57f17" },
  POOR: { bg: "#ffebee", color: "#c62828" },
};

export const ROLE_COLORS = {
  ADMIN: { bg: "linear-gradient(135deg, #dbeafe, #e0f2fe)", border: "#3b82f6", color: "#1e3a8a" },
  USER: { bg: "linear-gradient(135deg, #f8fafc, #e0e7ff)", border: "#818cf8", color: "#3730a3" },
};

// Shared MUI sx helpers
export const inputSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 11.5, height: 30 },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.border },
};

export const selectSx = {
  borderRadius: "6px", fontSize: 11.5, height: 30,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.border },
};

export const pageBtnSx = (active) => ({
  minWidth: 0, px: "6px", py: "2px",
  border: `1px solid ${active ? COLORS.primary : COLORS.border}`,
  borderRadius: "4px",
  background: active ? COLORS.primary : COLORS.surface,
  color: active ? "#fff" : COLORS.textMuted,
  fontSize: 10.5, fontWeight: active ? 700 : 400,
  textTransform: "none",
  "&:hover": { background: active ? COLORS.primaryDark : "#f5f5f5" },
  "&.Mui-disabled": { background: COLORS.surface, color: "#ccc", borderColor: COLORS.border },
});

export const chipSx = (s = { bg: "#f5f5f5", color: "#555" }) => ({
  background: s.bg, color: s.color,
  fontWeight: 600, fontSize: 9.5,
  borderRadius: "12px", height: 18,
});

export const primaryBtnSx = {
  textTransform: "none", fontSize: 11, fontWeight: 600,
  borderRadius: "4px", py: "4px", px: 1.25,
  background: "#1976d2", boxShadow: "none",
  "&:hover": { background: "#1565c0", boxShadow: "none" },
};

export const outlinedBtnSx = {
  textTransform: "none", fontSize: 11,
  borderColor: COLORS.border, color: COLORS.textMuted,
  borderRadius: "4px", py: "3.5px", px: 1.25,
  "&:hover": { borderColor: "#bbb", background: "#fafafa" },
};

export const tabSx = {
  textTransform: "none",
  fontSize: "11px",
  fontWeight: 600,
  minWidth: 0,
  px: 1.5,
  py: 0.75,
  color: COLORS.textMuted,
  "&.Mui-selected": {
    color: COLORS.primary,
  }
};

export const detailContainerSx = {
  p: 0,
};

export const detailHeroCardSx = {
  p: 1.5,
  borderRadius: "4px",
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  mb: 2,
};

export const detailSectionCardSx = {
  p: 1.5,
  borderRadius: "4px",
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

export const infoLabelSx = {
  fontSize: "9.5px",
  fontWeight: 700,
  color: "text.secondary",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  mb: 0.25,
};

export const infoValueSx = {
  fontSize: "11.5px",
  fontWeight: 600,
  color: "text.primary",
};

export const actionBtnSx = (color, hoverBg) => ({
  textTransform: "none",
  fontSize: "11px",
  fontWeight: 600,
  py: "4px",
  px: 1.25,
  borderRadius: "4px",
  color: color,
  borderColor: color,
  "&:hover": {
    background: hoverBg,
    borderColor: color,
  },
  "&.Mui-disabled": {
    borderColor: COLORS.borderLight,
    color: "#ccc",
  }
});

