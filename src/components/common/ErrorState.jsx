import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { FaExclamationTriangle, FaRedo } from "react-icons/fa";
import { COLORS, outlinedBtnSx } from "../../theme/tokens";

export default function ErrorState({ message, onRetry }) {
  return (
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      py: 6,
      px: 3,
      background: "#fff5f5",
      border: "1px solid #fee2e2",
      borderRadius: "8px",
      margin: "16px auto",
      maxWidth: 500,
      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.05)",
      animation: "shake 0.4s ease",
      "@keyframes shake": {
        "0%, 100%": { transform: "translateX(0)" },
        "25%": { transform: "translateX(-4px)" },
        "75%": { transform: "translateX(4px)" }
      }
    }}>
      <Box sx={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "#fee2e2",
        color: "#ef4444",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mb: 1.5
      }}>
        <FaExclamationTriangle size={18} />
      </Box>
      <Typography fontSize={14} fontWeight={700} color="#991b1b" sx={{ mb: 0.5 }}>
        Failed to load data
      </Typography>
      <Typography fontSize={12} color="#b91c1c" sx={{ mb: 2, maxWidth: "80%" }}>
        {message || "The server could not be reached or returned an error. Please check your connection."}
      </Typography>
      {onRetry && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<FaRedo size={10} />}
          onClick={onRetry}
          sx={{
            ...outlinedBtnSx,
            color: "#b91c1c",
            borderColor: "#fca5a5",
            "&:hover": {
              background: "#fee2e2",
              borderColor: "#ef4444"
            }
          }}
        >
          Retry Connection
        </Button>
      )}
    </Box>
  );
}
