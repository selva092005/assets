import { Tooltip, IconButton } from "@mui/material";

/**
 * ActionBtn – small icon button used in table rows
 */
export default function ActionBtn({ children, title, color, hoverBg, onClick, disabled, sx: sxProp }) {
  return (
    <Tooltip title={title}>
      <IconButton
        onClick={onClick}
        disabled={disabled}
        size="small"
        sx={{
          width: 22, height: 22,
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          background: "#fff",
          color,
          "&:hover": { background: hoverBg },
          "&.Mui-disabled": { opacity: 0.35, background: "#fff", color },
          transition: "all .15s",
          ...sxProp,
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}
