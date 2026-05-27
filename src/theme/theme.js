import { createTheme } from "@mui/material/styles";
import { COLORS } from "./tokens";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: COLORS.primary, dark: COLORS.primaryDark, light: COLORS.primaryLight },
    background: { default: COLORS.bg, paper: COLORS.surface },
    text: { primary: COLORS.text, secondary: COLORS.textMuted, disabled: COLORS.textFaint },
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
    fontSize: 10.5, // Base size
    h1: { fontFamily: "'Outfit', sans-serif", fontSize: "14px", fontWeight: 700, color: COLORS.text },
    h2: { fontFamily: "'Outfit', sans-serif", fontSize: "13px", fontWeight: 700, color: COLORS.text },
    h3: { fontFamily: "'Outfit', sans-serif", fontSize: "12px", fontWeight: 700, color: COLORS.text },
    h4: { fontFamily: "'Outfit', sans-serif", fontSize: "11px", fontWeight: 600, color: COLORS.text },
    h5: { fontFamily: "'Outfit', sans-serif", fontSize: "10.5px", fontWeight: 600, color: COLORS.text },
    h6: { fontFamily: "'Outfit', sans-serif", fontSize: "10px", fontWeight: 600, color: COLORS.text },
    subtitle1: { fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, color: COLORS.text },
    subtitle2: { fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, color: COLORS.textMuted },
    body1: { fontFamily: "'Inter', sans-serif", fontSize: "11px", color: COLORS.text },
    body2: { fontFamily: "'Inter', sans-serif", fontSize: "10px", color: COLORS.textMuted },
    button: { fontFamily: "'Inter', sans-serif", textTransform: "none", fontWeight: 600, fontSize: "11px" },
    caption: { fontFamily: "'Inter', sans-serif", fontSize: "9px", color: COLORS.textFaint },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          "&.MuiTypography-h1, &.MuiTypography-h2, &.MuiTypography-h3, &.MuiTypography-h4, &.MuiTypography-h5, &.MuiTypography-h6": {
            fontFamily: "'Outfit', sans-serif",
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        size: "small",
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "11px",
          height: "26px",
          borderRadius: "6px",
          padding: "0 12px",
          minWidth: "auto",
          boxSizing: "border-box",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          "& .MuiInputBase-root": {
            fontSize: "11px",
            height: "30px",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontSize: "11px",
          height: "30px",
          borderRadius: "6px",
        },
        input: {
          padding: "4.5px 8px",
        }
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "11px",
          transform: "translate(8px, 6px) scale(1)",
          "&.MuiInputLabel-shrink": {
            transform: "translate(8px, -6px) scale(0.85)",
          }
        }
      }
    },
    MuiSelect: {
      defaultProps: {
        size: "small",
      },
      styleOverrides: {
        root: {
          height: "26px",
          fontSize: "11px",
        },
        select: {
          fontSize: "11px",
          padding: "0 8px",
          height: "24px",
          lineHeight: "24px",
          display: "flex",
          alignItems: "center",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "11px",
          minHeight: "auto",
          padding: "4px 12px",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: "11px !important",
          padding: "4px 6px !important",
        },
        head: {
          fontWeight: 700,
          fontSize: "10.5px !important",
          padding: "5px 6px !important",
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif !important",
          fontSize: "11px !important",
          background: "#f4f6fb",
        },
      },
    },
  },
});
