import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, TextField, MenuItem, Typography,
} from "@mui/material";
import { FaTimes, FaMapMarkerAlt } from "react-icons/fa";
import { useState } from "react";
import { COLORS, inputSx, outlinedBtnSx, premiumDialogPaperSx } from "../../theme/tokens";

export default function MoveAssetModal({ open, asset, locations, onMove, onClose }) {
  const [newLocation, setNewLocation] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
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
      slotProps={{ paper: { sx: premiumDialogPaperSx } }}
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

      <DialogContent sx={{ 
        px: 2.5, 
        py: 2.5, 
        background: COLORS.surface, 
        display: "flex", 
        flexDirection: "column", 
        gap: 2,
        flexGrow: 1,
        justifyContent: { xs: "center", sm: "flex-start" }
      }}>

        {/* Current location */}
        {asset?.locationName && (
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1.25, 
            px: 2, 
            py: 1.25, 
            background: COLORS.bg, 
            border: `1px solid ${COLORS.borderLight}`,
            borderLeft: `4px solid ${COLORS.primary}`,
            borderRadius: "8px" 
          }}>
            <FaMapMarkerAlt size={13} color={COLORS.primary} style={{ flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontSize: 9.5, color: COLORS.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.25 }}>
                Current Location
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>
                {asset.locationName}
              </Typography>
            </Box>
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
              .filter((l) => {
                // 1. Cannot move to the exact same location
                if (l.locationName?.trim().toLowerCase() === asset?.locationName?.trim().toLowerCase()) return false;
                // 2. Must belong to the same company
                const assetComp = (asset?.companyName || "").trim().toLowerCase();
                const locComp = (l.companyName || "").trim().toLowerCase();
                if (assetComp && locComp && assetComp !== locComp) return false;
                return true;
              })
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

      <DialogActions sx={{ 
        px: 2.5, 
        py: 1.5, 
        borderTop: `1px solid ${COLORS.borderLight}`, 
        background: COLORS.surface, 
        gap: 1.5,
        flexDirection: { xs: "column-reverse", sm: "row" },
        "& > :not(style) ~ :not(style)": {
          marginLeft: { xs: "0px !important", sm: "8px !important" }
        }
      }}>
        <Button 
          onClick={handleClose} 
          variant="outlined" 
          sx={{ 
            ...outlinedBtnSx,
            width: { xs: "100%", sm: "auto" }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!newLocation.trim() || loading}
          sx={{ 
            textTransform: "none", 
            fontSize: 13, 
            fontWeight: 600, 
            borderRadius: "8px", 
            py: "7px", 
            px: 2, 
            background: "#2e7d32", 
            boxShadow: "none", 
            "&:hover": { background: "#1b5e20", boxShadow: "none" },
            width: { xs: "100%", sm: "auto" }
          }}
        >
          {loading ? "Moving..." : "Confirm Move"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}