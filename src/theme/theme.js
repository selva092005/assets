import { createTheme } from "@mui/material/styles";
import { COLORS, FONT_FAMILIES } from "./tokens";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: COLORS.primary, dark: COLORS.primaryDark, light: COLORS.primaryLight },
    background: { default: COLORS.bg, paper: COLORS.surface },
    text: { primary: COLORS.text, secondary: COLORS.textMuted, disabled: COLORS.textFaint },
  },
  typography: {
    fontFamily: `${FONT_FAMILIES.content}, 'Segoe UI', 'Roboto', sans-serif`,
    fontSize: 10.5, // Base size
    h1: { fontFamily: FONT_FAMILIES.header, fontSize: "14px", fontWeight: 700, color: COLORS.text },
    h2: { fontFamily: FONT_FAMILIES.header, fontSize: "13px", fontWeight: 700, color: COLORS.text },
    h3: { fontFamily: FONT_FAMILIES.header, fontSize: "12px", fontWeight: 700, color: COLORS.text },
    h4: { fontFamily: FONT_FAMILIES.header, fontSize: "11px", fontWeight: 600, color: COLORS.text },
    h5: { fontFamily: FONT_FAMILIES.header, fontSize: "10.5px", fontWeight: 600, color: COLORS.text },
    h6: { fontFamily: FONT_FAMILIES.header, fontSize: "10px", fontWeight: 600, color: COLORS.text },
    subtitle1: { fontFamily: FONT_FAMILIES.content, fontSize: "11px", fontWeight: 600, color: COLORS.text },
    subtitle2: { fontFamily: FONT_FAMILIES.content, fontSize: "10px", fontWeight: 600, color: COLORS.textMuted },
    body1: { fontFamily: FONT_FAMILIES.content, fontSize: "11px", color: COLORS.text },
    body2: { fontFamily: FONT_FAMILIES.content, fontSize: "10px", color: COLORS.textMuted },
    button: { fontFamily: FONT_FAMILIES.content, textTransform: "none", fontWeight: 600, fontSize: "11px" },
    caption: { fontFamily: FONT_FAMILIES.content, fontSize: "9px", color: COLORS.textFaint },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          "&.MuiTypography-h1, &.MuiTypography-h2, &.MuiTypography-h3, &.MuiTypography-h4, &.MuiTypography-h5, &.MuiTypography-h6": {
            fontFamily: FONT_FAMILIES.header,
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
            "&.MuiInputBase-multiline": {
              height: "auto",
            },
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
          "&.MuiInputBase-multiline": {
            height: "auto",
          },
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
        "@font-face": [
          {
            fontFamily: "'DevilCandle'",
            src: "url('/DevilCandle_PERSONAL_USE_ONLY.otf')",
            fontStyle: "normal",
            fontWeight: "normal",
          },
          {
            fontFamily: "'Amoria'",
            src: "url('/AMORIA.otf')",
            fontStyle: "normal",
            fontWeight: "normal",
          },
          {
            fontFamily: "'Game Of Squids'",
            src: "url('/Game Of Squids.otf')",
            fontStyle: "normal",
            fontWeight: "normal",
          },
          {
            fontFamily: "'Unigeo'",
            src: "url('/Unigeo64-Bold-Italic-trial.ttf')",
            fontStyle: "normal",
            fontWeight: "normal",
          }
        ],
        body: {
          fontFamily: `${FONT_FAMILIES.content}, 'Segoe UI', 'Roboto', sans-serif !important`,
          fontSize: "11px !important",
          background: "#f4f6fb",
        },
        "input[type=\"date\"]": {
          position: "relative",
          paddingRight: "28px !important",
          "&::-webkit-calendar-picker-indicator": {
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            padding: 0,
            margin: 0,
          }
        },
        "*": {
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(148, 163, 184, 0.3) transparent",
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(148, 163, 184, 0.3)",
            borderRadius: "99px",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              background: "rgba(100, 116, 139, 0.5)",
            },
          },
        },
      },
    },
  },
});
