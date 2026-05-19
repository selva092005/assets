import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, TextField, MenuItem, Typography,
} from "@mui/material";
import { FaTimes, FaMapMarkerAlt } from "react-icons/fa";
import { useState } from "react";
import { COLORS, inputSx, outlinedBtnSx } from "../../theme/tokens";

export default function MoveAssetModal({ open, asset, locations, onMove, onClose }) {
  const [newLocation, setNewLocation] = useState("");
  const [reason,      setReason]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async () => {
    if (!newLocation.trim()) return;
    const trimmedNewLocation = newLocation.trim();
    if (trimmedNewLocation === (asset?.locationName || "").trim()) {
      setValidationError("Please choose a different location than the current one.");
      return;
    }
    setValidationError("");
    setLoading(true);
    try {
      await onMove({ fromLocation: asset?.locationName || null, newLocation: trimmedNewLocation, reason });
      setNewLocation("");
      setReason("");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewLocation("");
    setReason("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      disableRestoreFocus
      slotProps={{ paper: { sx: { borderRadius: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", overflow: "hidden", p: 0 } } }}
    >
      {/* Title */}
      <DialogTitle
        sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          px: 2.5, py: 2,
          borderBottom: `1px solid ${COLORS.borderLight}`,
          background: COLORS.surface,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "9px", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32", flexShrink: 0 }}>
            <FaMapMarkerAlt size={16} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 15, color: COLORS.text, lineHeight: 1.3 }}>
              Move Asset
            </Typography>
            {asset?.assetName && (
              <Typography sx={{ fontSize: 12, color: COLORS.textFaint, mt: 0.2 }}>
                {asset.assetName} · {asset.assetCode}
              </Typography>
            )}
          </Box>
        </Box>
        <Box onClick={handleClose} sx={{ cursor: "pointer", color: COLORS.textFaint, p: 0.5, borderRadius: "6px", "&:hover": { color: COLORS.text, background: COLORS.bg }, transition: "all .15s" }}>
          <FaTimes size={15} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, py: 2.5, background: COLORS.surface, display: "flex", flexDirection: "column", gap: 2 }}>

        {/* Current location */}
        {asset?.locationName && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, background: COLORS.bg, borderRadius: "8px", border: `1px solid ${COLORS.borderLight}` }}>
            <Typography sx={{ fontSize: 12, color: COLORS.textFaint }}>Current location:</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{asset.locationName}</Typography>
          </Box>
        )}

        {/* New location — dropdown if locations provided, else free text */}
        {locations && locations.length > 0 ? (
          <TextField
            select
            label="New Location"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            fullWidth
            size="small"
            sx={inputSx}
          >
            {locations
              .filter((l) => l.locationName !== asset?.locationName)
              .map((l) => (
                <MenuItem key={l.locationId} value={l.locationName} sx={{ fontSize: 13 }}>
                  {l.locationName}
                </MenuItem>
              ))}
          </TextField>
        ) : (
          <TextField
            label="New Location"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g. Office Room 2"
            sx={inputSx}
          />
        )}

        {/* Reason */}
        <TextField
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
          size="small"
          placeholder="e.g. Reallocation, Repair, Loan"
          sx={inputSx}
        />
        {validationError && (
          <Typography sx={{ fontSize: 12, color: "#c62828", mt: 1 }}>{validationError}</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${COLORS.borderLight}`, background: COLORS.surface, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" sx={outlinedBtnSx}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!newLocation.trim() || loading}
          sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", py: "7px", px: 2, background: "#2e7d32", boxShadow: "none", "&:hover": { background: "#1b5e20", boxShadow: "none" } }}
        >
          {loading ? "Moving..." : "Confirm Move"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}