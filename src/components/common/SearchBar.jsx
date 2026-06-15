import { Box, TextField, IconButton, InputAdornment, Tooltip } from "@mui/material";
import { FaSearch, FaSyncAlt } from "react-icons/fa";
import { searchFieldSx, resetBtnSx, COLORS } from "../../theme/tokens";

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
        sx={{
          flex: 1,
          ...searchFieldSx(320, 380, true),
        }}
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
            ...resetBtnSx,
            "& svg": { transition: "none" },
            "&:hover svg": { transform: "none" }
          }}
        >
          <FaSearch size={11} color={COLORS.primary} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset">
        <IconButton
          onClick={onReset}
          sx={resetBtnSx}
        >
          <FaSyncAlt size={11} color="#757575" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
