import { Box, TextField, IconButton, InputAdornment, Tooltip } from "@mui/material";
import { FaSearch, FaSyncAlt } from "react-icons/fa";
import { inputSx } from "../../theme/tokens";

export default function SearchBar({ value, placeholder = "Search...", onChange, onSearch, onReset }) {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 0.75, mb: 1.5,
      animation: "fadeRight 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
      animationDelay: "100ms",
      "@keyframes fadeRight": {
        from: { opacity: 0, transform: "translateX(-15px)" },
        to:   { opacity: 1, transform: "translateX(0)" },
      }
    }}>
      <TextField
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
        size="small"
        sx={{ flex: 1, maxWidth: 320, ...inputSx }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <FaSearch style={{ color: "#aaaaaa", fontSize: 11 }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Tooltip title="Search">
        <IconButton
          onClick={onSearch}
          sx={{
            width: 30, height: 30, border: "1px solid #e0e0e0", borderRadius: "6px", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", p: 0,
            "&:hover": { background: "#f5f5f5", borderColor: "#bbb" }
          }}
        >
          <FaSearch size={11} color="#1976d2" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset">
        <IconButton
          onClick={onReset}
          sx={{
            width: 30, height: 30, border: "1px solid #e0e0e0", borderRadius: "6px", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", p: 0,
            "&:hover": { background: "#f5f5f5", borderColor: "#bbb" }
          }}
        >
          <FaSyncAlt size={11} color="#757575" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
