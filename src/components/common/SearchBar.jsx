import { Box, TextField, IconButton, InputAdornment, Tooltip } from "@mui/material";
import { FaSearch, FaSyncAlt } from "react-icons/fa";
import { inputSx } from "../../theme/tokens";

export default function SearchBar({ value, placeholder = "Search...", onChange, onSearch, onReset }) {
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
      <TextField
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
        size="small"
        sx={{ flex: 1, maxWidth: 380, ...inputSx }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <FaSearch style={{ color: "#aaaaaa", fontSize: 13 }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Tooltip title="Search">
        <IconButton
          onClick={onSearch}
          sx={{ width: 34, height: 34, border: "1px solid #e0e0e0", borderRadius: "8px", background: "#fff" }}
        >
          <FaSearch size={13} color="#1976d2" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset">
        <IconButton
          onClick={onReset}
          sx={{ width: 34, height: 34, border: "1px solid #e0e0e0", borderRadius: "8px", background: "#fff" }}
        >
          <FaSyncAlt size={13} color="#757575" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}