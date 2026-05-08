import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Box, Typography,
} from "@mui/material";

/**
 * ViewModal – renders a grid of key / value pairs from any data object
 * @param {boolean} open
 * @param {string}  title
 * @param {object}  data    – flat object to display
 * @param {Array}   fields  – optional [ [label, key] ] to control which fields show
 * @param {Function} onClose
 */
export default function ViewModal({ open, title = "Details", data, fields, onClose }) {
  const entries = fields
    ? fields.map(([label, key]) => [label, data?.[key]])
    : data
      ? Object.entries(data)
      : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>{title}</DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <Grid container spacing={1} sx={{ maxHeight: "60vh", overflowY: "auto" }}>
          {entries.map(([k, v]) => (
            <Grid item xs={6} key={k}>
              <Box sx={{ background: "#f5f6fa", borderRadius: "8px", p: "8px 12px", border: "1px solid #e8e8e8" }}>
                <Typography sx={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.25 }}>
                  {k}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, wordBreak: "break-word" }}>
                  {String(v ?? "—")}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ textTransform: "none", fontSize: 13, borderColor: "#e0e0e0", color: "#555", borderRadius: "8px" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
