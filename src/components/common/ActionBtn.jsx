import { Tooltip, IconButton } from "@mui/material";

/**
 * ActionBtn – small icon button used in table rows
 */
export default function ActionBtn({ children, title, color, hoverBg, onClick }) {
  return (
    <Tooltip title={title}>
      <IconButton
        onClick={onClick}
        size="small"
        sx={{
          width: 30, height: 30,
          border: "1px solid #e0e0e0",
          borderRadius: "6px",
          background: "#fff",
          color,
          "&:hover": { background: hoverBg },
          transition: "all .15s",
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}
