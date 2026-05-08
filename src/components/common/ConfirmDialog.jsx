import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from "@mui/material";

/**
 * ConfirmDialog – generic yes/no confirmation dialog
 */
export default function ConfirmDialog({
  open,
  title    = "Confirm",
  message  = "Are you sure?",
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel  = "Cancel",
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{ sx: { borderRadius: "14px", p: 1, maxWidth: 380 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>{title}</DialogTitle>
      <DialogContent sx={{ fontSize: 14, color: "#555", pt: "8px !important" }}>
        {message}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{ textTransform: "none", fontSize: 13, borderColor: "#e0e0e0", color: "#555", borderRadius: "8px" }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", background: "#1976d2", boxShadow: "none", "&:hover": { background: "#1565c0" } }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
