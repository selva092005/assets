import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { outlinedBtnSx, primaryBtnSx, premiumDialogPaperSx } from "../../theme/tokens";

export default function ConfirmDialog({
  open,
  title = "Confirm",
  message = "Are you sure?",
  onConfirm,
  onCancel,
  onClose,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) {
  const handleCancel = onCancel || onClose;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      disableRestoreFocus
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "12px !important",
          border: "1px solid #e2e8f0 !important",
          background: "#ffffff !important",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.12) !important",
          maxWidth: "380px !important",
          width: "calc(100% - 32px) !important",
          margin: "auto !important",
          height: "auto !important",
          maxHeight: "calc(100% - 32px) !important",
          p: 1,
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>{title}</DialogTitle>
      <DialogContent sx={{ fontSize: 14, color: "#555", pt: "8px !important" }}>
        {message}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleCancel} variant="outlined" sx={outlinedBtnSx}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} variant="contained"
          sx={{ ...primaryBtnSx, background: "#ef4444", borderColor: "#dc2626", "&:hover": { background: "#dc2626" } }}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}