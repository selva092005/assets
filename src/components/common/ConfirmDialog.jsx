import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

export default function ConfirmDialog({
  open,
  title        = "Confirm",
  message      = "Are you sure?",
  onConfirm,
  onCancel,
  onClose,
  confirmLabel = "Confirm",
  cancelLabel  = "Cancel",
}) {
  const handleCancel = onCancel || onClose;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      disableRestoreFocus
      slotProps={{ paper: { sx: { borderRadius: "14px", p: 1, maxWidth: 380 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>{title}</DialogTitle>
      <DialogContent sx={{ fontSize: 14, color: "#555", pt: "8px !important" }}>
        {message}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleCancel} variant="outlined"
          sx={{ textTransform: "none", fontSize: 13, borderColor: "#e0e0e0", color: "#555", borderRadius: "8px" }}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} variant="contained"
          sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", background: "#ef4444", boxShadow: "none", "&:hover": { background: "#dc2626" } }}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}