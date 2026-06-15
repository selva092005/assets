import { Dialog, IconButton, Box } from "@mui/material";
import { FaTimes } from "react-icons/fa";
import { lightboxSx } from "../../theme/tokens";

export default function ImagePreviewDialog({ open, onClose, imageUrl, title }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
      slotProps={{
        backdrop: { sx: lightboxSx.backdrop },
        paper: { sx: lightboxSx.paper }
      }}
    >
      <Box sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", p: 1 }}>
        {/* Floating Close Button outside image corners */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: -12,
            right: -12,
            zIndex: 10,
            color: "#ffffff",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            p: 0.75,
            "&:hover": {
              background: "rgba(15, 23, 42, 0.85)",
              transform: "scale(1.08)"
            },
            transition: "all 0.2s"
          }}
        >
          <FaTimes size={12} />
        </IconButton>

        {/* Floating Canvas Image */}
        <Box
          component="img"
          src={imageUrl}
          alt={title}
          sx={{
            width: "100%",
            maxHeight: "75vh",
            objectFit: "contain",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            background: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }}
        />

        {/* Floating Glass Metadata Label */}
        {title && (
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              px: 2,
              py: 0.5,
              color: "#ffffff",
              fontSize: 11,
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              textAlign: "center"
            }}
          >
            {title}
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
