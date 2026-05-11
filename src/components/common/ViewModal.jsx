import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Box, Typography, Divider,
} from "@mui/material";
import { FaTimes, FaInfoCircle } from "react-icons/fa";

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
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" } }}
    >
      <DialogTitle sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderBottom: "1px solid #f0f0f0",
        pb: 2,
        pt: 2.5,
        px: 3,
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: "10px", 
            background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white"
          }}>
            <FaInfoCircle size={18} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 20, color: "#212121" }}>
              {title}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#757575", mt: 0.25 }}>
              View complete information
            </Typography>
          </Box>
        </Box>
        <Box onClick={onClose} sx={{ cursor: "pointer", color: "#9e9e9e", "&:hover": { color: "#424242" } }}>
          <FaTimes size={18} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
        <Grid container spacing={2} sx={{ maxHeight: "65vh", overflowY: "auto", pr: 1 }}>
          {entries.map(([k, v], idx) => (
            <Grid item xs={6} key={k}>
              <Box sx={{ 
                background: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)", 
                borderRadius: "10px", 
                p: "14px 16px", 
                border: "1px solid #e8e8e8",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "#1976d2",
                  boxShadow: "0 2px 8px rgba(25, 118, 210, 0.1)",
                  transform: "translateY(-1px)"
                }
              }}>
                <Typography sx={{ 
                  fontSize: 11, 
                  color: "#1976d2", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.08em", 
                  fontWeight: 600,
                  mb: 0.75 
                }}>
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </Typography>
                <Typography sx={{ 
                  fontSize: 14, 
                  fontWeight: 500, 
                  color: "#212121",
                  wordBreak: "break-word",
                  lineHeight: 1.5
                }}>
                  {String(v ?? "—")}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid #f0f0f0", px: 3, py: 2.5, justifyContent: "center" }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ 
            textTransform: "none", 
            fontSize: 14, 
            fontWeight: 600,
            borderRadius: "8px",
            px: 4,
            py: 1,
            background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
              boxShadow: "0 6px 16px rgba(25, 118, 210, 0.4)"
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
