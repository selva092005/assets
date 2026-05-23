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
    fontSize: 10.5, // Reduce base size globally
    h1: { fontFamily: "'Outfit', sans-serif", fontSize: "1.5rem", fontWeight: 700 },
    h2: { fontFamily: "'Outfit', sans-serif", fontSize: "1.3rem", fontWeight: 700 },
    h3: { fontFamily: "'Outfit', sans-serif", fontSize: "1.1rem", fontWeight: 700 },
    h4: { fontFamily: "'Outfit', sans-serif", fontSize: "1rem", fontWeight: 600 },
    h5: { fontFamily: "'Outfit', sans-serif", fontSize: "0.95rem", fontWeight: 600 },
    h6: { fontFamily: "'Outfit', sans-serif", fontSize: "0.85rem", fontWeight: 600 },
    subtitle1: { fontSize: "0.75rem", fontWeight: 600 },
    subtitle2: { fontSize: "0.7rem", fontWeight: 600 },
    body1: { fontSize: "0.75rem" },
    body2: { fontSize: "0.7rem" },
    button: { textTransform: "none", fontWeight: 600, fontSize: "0.75rem" },
    caption: { fontSize: "0.65rem" },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      defaultProps: {
        size: "small",
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          padding: "2px 8px",
          minWidth: "auto",
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
            fontSize: "0.75rem",
            height: "30px",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontSize: "0.75rem",
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
          fontSize: "0.75rem",
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
        select: {
          fontSize: "0.75rem",
          padding: "4.5px 8px",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "0.75rem",
          minHeight: "auto",
          padding: "4px 12px",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: "10.5px !important",
          padding: "4px 6px !important",
        },
        head: {
          fontWeight: 700,
          fontSize: "10px !important",
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
