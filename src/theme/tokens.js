// ─────────────────────────────────────────────
//  Design Tokens  –  single source of truth
// ─────────────────────────────────────────────

export const COLORS = {
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  primaryLight: "#f0f9ff",
  primaryBorder: "#bae6fd",

  bg: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  shadow: "0 2px 12px rgba(0,0,0,0.04)",

  text: "#0f172a",
  textMuted: "#475569",
  textFaint: "#94a3b8",

  avatarBg: "#e0f2fe",
  avatarColor: "#2563eb",
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
  background: "#ffffff",
  borderRadius: "6px",
  transition: "all 100ms ease",
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    fontSize: 11.5,
    height: 30,
    transition: "all 100ms ease",
    "& .MuiOutlinedInput-input": { py: "4px !important", px: "8px !important" },
    "& fieldset": { borderColor: "#cbd5e1", transition: "all 100ms ease" },
    "& svg": { transition: "all 100ms ease", color: "#888888" },
    "&:hover fieldset": { borderColor: "#000000" },
    "&.Mui-focused fieldset": { borderColor: "#000000", borderWidth: "1px !important" },
    "&.Mui-focused": {
      background: "#ffffff",
      boxShadow: "0 0 0 3px rgba(0, 0, 0, 0.05)",
    }
  }
};

export const selectSx = {
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 600,
  height: 26,
  border: "1px solid #d8e2ef",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  transition: "all 180ms cubic-bezier(0.4, 0, 0.2, 1)",
  boxSizing: "border-box",
  "& .MuiSelect-select": {
    py: "0px !important",
    pr: "22px !important",
    pl: "10px !important",
    display: "flex",
    alignItems: "center",
    height: "24px",
    lineHeight: "24px",
    boxSizing: "border-box",
  },
  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
  "& svg": {
    transition: "all 200ms ease",
    color: "#475569",
    right: "6px !important",
  },
  "&:hover": {
    background: "#ffffff",
    borderColor: "#a5b4fc",
    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.08)",
    "& svg": { color: "#2563eb" },
  },
  "&.Mui-focused": {
    background: "#ffffff",
    borderColor: "#2563eb",
    boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.12), 0 2px 4px rgba(37, 99, 235, 0.05)",
    "& svg": { color: "#2563eb" },
  }
};

export const pageBtnSx = (active) => ({
  minWidth: 28,
  width: 28,
  height: 28,
  p: 0,
  borderRadius: "8px",
  border: active ? "none" : `1px solid ${COLORS.border}`,
  background: active ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)` : "#ffffff",
  color: active ? "#ffffff" : COLORS.textMuted,
  fontSize: 11,
  fontWeight: active ? 700 : 500,
  textTransform: "none",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: active ? `0 3px 8px rgba(37,99,235,0.22)` : "none",
  "&:hover": {
    background: active ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)` : "#f8fafc",
    borderColor: active ? "none" : COLORS.primary,
    color: active ? "#ffffff" : COLORS.primary,
    transform: "translateY(-1px)",
    boxShadow: active ? `0 4px 12px rgba(37,99,235,0.3)` : "0 2px 6px rgba(0,0,0,0.04)",
  },
  "&.Mui-disabled": { background: COLORS.surface, color: "#ccc", borderColor: COLORS.border, transform: "none", boxShadow: "none" },
});

export const chipSx = (s = { bg: "#f5f5f5", color: "#555" }) => ({
  background: s.bg, color: s.color,
  fontWeight: 600, fontSize: 9,
  borderRadius: "12px", height: 16,
});

export const sharedBtnSizingSx = {
  textTransform: "none",
  fontSize: "11px",
  fontWeight: 600,
  borderRadius: "6px",
  height: 26,
  px: 1.5,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

export const primaryBtnSx = {
  ...sharedBtnSizingSx,
  background: "#000000",
  border: "1px solid #000000",
  color: "#ffffff",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  transition: "all 150ms ease-in-out",
  "&:hover": {
    background: "#1e1e1e",
    borderColor: "#1e1e1e",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
  },
  "&:active": {
    background: "#333333",
  },
  "&.Mui-disabled": {
    background: "#f1f5f9",
    color: "#94a3b8",
    borderColor: "#e2e8f0",
    boxShadow: "none",
  }
};

export const outlinedBtnSx = {
  ...sharedBtnSizingSx,
  border: "1px solid #e5e5e5",
  background: "#ffffff",
  color: "#666666",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
  transition: "all 150ms ease-in-out",
  "&:hover": {
    borderColor: "#000000",
    color: "#000000",
    background: "#ffffff",
  },
  "&:active": {
    background: "#fafafa",
  },
  "&.Mui-disabled": {
    background: "#fafafa",
    borderColor: "#eaeaea",
    color: "#ccc",
    boxShadow: "none",
  }
};

export const tabSx = {
  textTransform: "none",
  fontSize: "10.5px",
  fontWeight: 600,
  minWidth: 0,
  px: 1.25,
  py: 0.5,
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
  ...sharedBtnSizingSx,
  color: color,
  borderColor: color,
  border: "1px solid",
  background: "transparent",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
  transition: "all 150ms ease-in-out",
  "&:hover": {
    background: hoverBg,
    borderColor: color,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
    transform: "translateY(-0.5px)",
  },
  "&:active": {
    transform: "translateY(0.5px)",
  },
  "&.Mui-disabled": {
    borderColor: COLORS.borderLight,
    color: "#ccc",
    boxShadow: "none",
    transform: "none",
  }
});


// ─────────────────────────────────────────────
//  Unified Dynamic Gradient Configuration Theme
// ─────────────────────────────────────────────
export const CARD_GRADIENTS = {
  // Style A: Saturated Solid Vibrance
  indigo: {
    bg: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
    text: "#ffffff",
    label: "rgba(255, 255, 255, 0.8)",
    iconBg: "rgba(255, 255, 255, 0.16)",
    iconColor: "#ffffff",
    border: "rgba(255, 255, 255, 0.25)",
    shadow: "rgba(79, 70, 229, 0.25)"
  },
  emerald: {
    bg: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
    text: "#ffffff",
    label: "rgba(255, 255, 255, 0.8)",
    iconBg: "rgba(255, 255, 255, 0.16)",
    iconColor: "#ffffff",
    border: "rgba(255, 255, 255, 0.25)",
    shadow: "rgba(16, 185, 129, 0.25)"
  },
  blue: {
    bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    text: "#ffffff",
    label: "rgba(255, 255, 255, 0.8)",
    iconBg: "rgba(255, 255, 255, 0.16)",
    iconColor: "#ffffff",
    border: "rgba(255, 255, 255, 0.25)",
    shadow: "rgba(37, 99, 235, 0.25)"
  },
  amber: {
    bg: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
    text: "#ffffff",
    label: "rgba(255, 255, 255, 0.8)",
    iconBg: "rgba(255, 255, 255, 0.16)",
    iconColor: "#ffffff",
    border: "rgba(255, 255, 255, 0.25)",
    shadow: "rgba(217, 119, 6, 0.25)"
  },
  rose: {
    bg: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
    text: "#ffffff",
    label: "rgba(255, 255, 255, 0.8)",
    iconBg: "rgba(255, 255, 255, 0.16)",
    iconColor: "#ffffff",
    border: "rgba(255, 255, 255, 0.25)",
    shadow: "rgba(244, 63, 94, 0.25)"
  },

  // Style B: Futuristic Soft Aurora Metallic Glow
  auroraIndigo: {
    bg: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)",
    text: "#312e81",
    label: "#6366f1",
    iconBg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    iconColor: "#ffffff",
    border: "#c7d2fe",
    shadow: "rgba(99, 102, 241, 0.18)"
  },
  auroraEmerald: {
    bg: "linear-gradient(135deg, #ffffff 0%, #d1fae5 100%)",
    text: "#065f46",
    label: "#10b981",
    iconBg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    iconColor: "#ffffff",
    border: "#a7f3d0",
    shadow: "rgba(16, 185, 129, 0.18)"
  },
  auroraBlue: {
    bg: "linear-gradient(135deg, #ffffff 0%, #dbeafe 100%)",
    text: "#1e40af",
    label: "#3b82f6",
    iconBg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    iconColor: "#ffffff",
    border: "#bfdbfe",
    shadow: "rgba(59, 130, 246, 0.18)"
  },
  auroraAmber: {
    bg: "linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)",
    text: "#92400e",
    label: "#f59e0b",
    iconBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    iconColor: "#ffffff",
    border: "#fde68a",
    shadow: "rgba(245, 158, 11, 0.18)"
  },
  auroraRose: {
    bg: "linear-gradient(135deg, #ffffff 0%, #ffe4e6 100%)",
    text: "#9f1239",
    label: "#f43f5e",
    iconBg: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
    iconColor: "#ffffff",
    border: "#fecdd3",
    shadow: "rgba(244, 63, 94, 0.18)"
  }
};

// ─────────────────────────────────────────────
//  Unified Dynamic Multi-Mode Design Switcher
// ─────────────────────────────────────────────
export const getThemeConfig = (iconColor, styleMode = "AURORA") => {
  const mode = styleMode || "AURORA";

  // Standardize the color keys
  let baseColor = "blue";
  if (iconColor === "#3949ab") baseColor = "indigo";
  else if (iconColor === "#10b981") baseColor = "emerald";
  else if (iconColor === "#2563eb") baseColor = "blue";
  else if (iconColor === "#d97706") baseColor = "amber";
  else if (iconColor === "#f43f5e") baseColor = "rose";

  const themes = {
    SOLID: {
      indigo: { bg: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)", text: "#ffffff", label: "rgba(255,255,255,0.85)", iconBg: "rgba(255,255,255,0.18)", iconColor: "#ffffff", border: "rgba(255,255,255,0.25)", shadow: "rgba(79, 70, 229, 0.25)" },
      emerald: { bg: "linear-gradient(135deg, #10b981 0%, #047857 100%)", text: "#ffffff", label: "rgba(255,255,255,0.85)", iconBg: "rgba(255,255,255,0.18)", iconColor: "#ffffff", border: "rgba(255,255,255,0.25)", shadow: "rgba(16, 185, 129, 0.25)" },
      blue: { bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", text: "#ffffff", label: "rgba(255,255,255,0.85)", iconBg: "rgba(255,255,255,0.18)", iconColor: "#ffffff", border: "rgba(255,255,255,0.25)", shadow: "rgba(37, 99, 235, 0.25)" },
      amber: { bg: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)", text: "#ffffff", label: "rgba(255,255,255,0.85)", iconBg: "rgba(255,255,255,0.18)", iconColor: "#ffffff", border: "rgba(255,255,255,0.25)", shadow: "rgba(217, 119, 6, 0.25)" },
      rose: { bg: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)", text: "#ffffff", label: "rgba(255,255,255,0.85)", iconBg: "rgba(255,255,255,0.18)", iconColor: "#ffffff", border: "rgba(255,255,255,0.25)", shadow: "rgba(244, 63, 94, 0.25)" }
    },
    AURORA: {
      indigo: { bg: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)", text: "#312e81", label: "#6366f1", iconBg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", iconColor: "#ffffff", border: "#c7d2fe", shadow: "rgba(99, 102, 241, 0.18)" },
      emerald: { bg: "linear-gradient(135deg, #ffffff 0%, #d1fae5 100%)", text: "#065f46", label: "#10b981", iconBg: "linear-gradient(135deg, #10b981 0%, #059669 100%)", iconColor: "#ffffff", border: "#a7f3d0", shadow: "rgba(16, 185, 129, 0.18)" },
      blue: { bg: "linear-gradient(135deg, #ffffff 0%, #dbeafe 100%)", text: "#1e40af", label: "#3b82f6", iconBg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", iconColor: "#ffffff", border: "#bfdbfe", shadow: "rgba(59, 130, 246, 0.18)" },
      amber: { bg: "linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)", text: "#92400e", label: "#f59e0b", iconBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", iconColor: "#ffffff", border: "#fde68a", shadow: "rgba(245, 158, 11, 0.18)" },
      rose: { bg: "linear-gradient(135deg, #ffffff 0%, #ffe4e6 100%)", text: "#9f1239", label: "#f43f5e", iconBg: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)", iconColor: "#ffffff", border: "#fecdd3", shadow: "rgba(244, 63, 94, 0.18)" }
    },
    GLASS: {
      indigo: { bg: "rgba(255, 255, 255, 0.65)", text: "#1e1b4b", label: "#4f46e5", iconBg: "rgba(79, 70, 229, 0.08)", iconColor: "#4f46e5", border: "rgba(79, 70, 229, 0.22)", shadow: "rgba(79, 70, 229, 0.08)" },
      emerald: { bg: "rgba(255, 255, 255, 0.65)", text: "#064e3b", label: "#10b981", iconBg: "rgba(16, 185, 129, 0.08)", iconColor: "#10b981", border: "rgba(16, 185, 129, 0.22)", shadow: "rgba(16, 185, 129, 0.08)" },
      blue: { bg: "rgba(255, 255, 255, 0.65)", text: "#1e3a8a", label: "#3b82f6", iconBg: "rgba(59, 130, 246, 0.08)", iconColor: "#3b82f6", border: "rgba(59, 130, 246, 0.22)", shadow: "rgba(59, 130, 246, 0.08)" },
      amber: { bg: "rgba(255, 255, 255, 0.65)", text: "#78350f", label: "#f59e0b", iconBg: "rgba(245, 158, 11, 0.08)", iconColor: "#f59e0b", border: "rgba(245, 158, 11, 0.22)", shadow: "rgba(245, 158, 11, 0.08)" },
      rose: { bg: "rgba(255, 255, 255, 0.65)", text: "#4c0519", label: "#f43f5e", iconBg: "rgba(244, 63, 94, 0.08)", iconColor: "#f43f5e", border: "rgba(244, 63, 94, 0.22)", shadow: "rgba(244, 63, 94, 0.08)" }
    },
    DARK_STEEL: {
      indigo: { bg: "linear-gradient(135deg, #0b0f19 0%, #1e1b4b 100%)", text: "#f8fafc", label: "#818cf8", iconBg: "rgba(129, 140, 248, 0.15)", iconColor: "#818cf8", border: "rgba(129, 140, 248, 0.35)", shadow: "rgba(99, 102, 241, 0.25)" },
      emerald: { bg: "linear-gradient(135deg, #0b0f19 0%, #022c22 100%)", text: "#f8fafc", label: "#34d399", iconBg: "rgba(52, 211, 153, 0.15)", iconColor: "#34d399", border: "rgba(52, 211, 153, 0.35)", shadow: "rgba(16, 185, 129, 0.25)" },
      blue: { bg: "linear-gradient(135deg, #0b0f19 0%, #172554 100%)", text: "#f8fafc", label: "#60a5fa", iconBg: "rgba(96, 165, 250, 0.15)", iconColor: "#60a5fa", border: "rgba(96, 165, 250, 0.35)", shadow: "rgba(59, 130, 246, 0.25)" },
      amber: { bg: "linear-gradient(135deg, #0b0f19 0%, #451a03 100%)", text: "#f8fafc", label: "#fbbf24", iconBg: "rgba(251, 191, 36, 0.15)", iconColor: "#fbbf24", border: "rgba(251, 191, 36, 0.35)", shadow: "rgba(245, 158, 11, 0.25)" },
      rose: { bg: "linear-gradient(135deg, #0b0f19 0%, #4c0519 100%)", text: "#f8fafc", label: "#fb7185", iconBg: "rgba(251, 113, 133, 0.15)", iconColor: "#fb7185", border: "rgba(251, 113, 133, 0.35)", shadow: "rgba(244, 63, 94, 0.25)" }
    }
  };

  return (themes[mode] || themes.AURORA)[baseColor];
};

// ─────────────────────────────────────────────
//  Reusable SX Style Presets for Cards
// ─────────────────────────────────────────────
export const statCardSx = (iconColor, styleMode = "AURORA") => {
  const theme = getThemeConfig(iconColor, styleMode);
  const isSolid = styleMode === "SOLID";
  const isGlass = styleMode === "GLASS";
  const isDark = styleMode === "DARK_STEEL";

  return {
    borderRadius: "10px",
    p: "12px 16px",
    background: theme.bg,
    backdropFilter: (isGlass || isDark) ? "blur(14px)" : "none",
    border: isSolid ? "1px solid transparent" : `1px solid ${theme.border}`,
    boxShadow: `0 4px 14px -3px ${theme.shadow}, 0 2px 4px -2px ${theme.shadow}`,
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    cursor: "default",
    position: "relative",
    overflow: "hidden",
    transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
    "&::after": {
      content: '""',
      position: "absolute",
      top: "-50%",
      right: "-30%",
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      background: styleMode === "DARK_STEEL" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.15)",
      filter: "blur(8px)",
      pointerEvents: "none"
    },
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: `0 14px 28px -6px ${theme.shadow}, 0 6px 12px -4px ${theme.shadow}`,
      borderColor: isSolid ? "transparent" : iconColor,
      filter: "brightness(1.03)",
      "& .stat-card-icon-box": {
        transform: "scale(1.1) rotate(5deg)",
      }
    },
    animation: "fadeUp 350ms cubic-bezier(0.16, 1, 0.3, 1) both",
    "@keyframes fadeUp": {
      from: { opacity: 0, transform: "translateY(10px)" },
      to: { opacity: 1, transform: "translateY(0)" },
    }
  };
};

export const premiumCardSx = (styleMode = "AURORA") => {
  const isDark = styleMode === "DARK_STEEL";

  return {
    borderRadius: "10px",
    p: 1.5,
    background: isDark ? "rgba(15, 23, 42, 0.94)" : "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(14px)",
    border: isDark ? "1px solid rgba(129, 140, 248, 0.25)" : "1px solid rgba(226, 232, 240, 0.7)",
    position: "relative",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "8%",
      right: "8%",
      height: "2px",
      background: isDark
        ? "linear-gradient(90deg, transparent, #818cf8, #fb7185, transparent)"
        : "linear-gradient(90deg, transparent, #2563eb, #8b5cf6, transparent)",
      opacity: 0,
      transition: "opacity 300ms ease"
    },
    "&:hover": {
      transform: "translateY(-2px)",
      borderColor: isDark ? "rgba(129, 140, 248, 0.55)" : "rgba(37, 99, 235, 0.3)",
      boxShadow: isDark
        ? "0 16px 36px -12px rgba(129, 140, 248, 0.2)"
        : "0 12px 25px -10px rgba(37, 99, 235, 0.1)",
      background: isDark ? "#0f172a" : "#ffffff",
      "&::after": {
        opacity: 1
      }
    },
    animation: "cardSlideUp 450ms cubic-bezier(0.16, 1, 0.3, 1) both",
    "@keyframes cardSlideUp": {
      from: { opacity: 0, transform: "translateY(12px)" },
      to: { opacity: 1, transform: "translateY(0)" }
    }
  };
};

export const premiumDialogPaperSx = {
  borderRadius: "8px",
  boxShadow: "0 30px 60px rgba(0, 0, 0, 0.12)",
  border: "1px solid #e5e5e5",
  background: "#ffffff",
  overflow: "hidden",
  position: "relative",
};

export const premiumDialogTitleSx = {
  p: "20px 24px 8px 24px",
  fontWeight: 700,
  fontSize: "15px",
  color: "#000000",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

export const premiumFormGroupSx = {
  background: "#ffffff",
  border: "1px solid #eaeaea",
  borderRadius: "6px",
  p: 1.5,
  mb: 1.5,
  transition: "all 150ms ease",
  "&:hover": {
    borderColor: "#000000",
  }
};

// ─────────────────────────────────────────────
//  Centralized Font Families (Google Fonts)
// ─────────────────────────────────────────────
export const FONT_FAMILIES = {
  header: "'Plus Jakarta Sans', sans-serif",
  content: "'Plus Jakarta Sans', sans-serif"
};




