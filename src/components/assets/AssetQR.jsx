import { useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";

export default function AssetQR({ open, asset, onClose }) {
  const canvasRef = useRef();

  const value = asset
    ? `Asset Code: ${asset.assetCode || "-"}, Asset Name: ${asset.assetName || "-"}, Location: ${asset.locationName || "-"}`
    : "";

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `asset-${asset?.assetId}-qr.png`;
    a.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>Asset QR Code</DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
          <Box ref={canvasRef} sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: "10px", background: "#fff" }}>
            <QRCodeCanvas value={value || " "} size={200} level="H" includeMargin />
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{asset?.assetName}</Typography>
          <Typography sx={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>#{asset?.assetId} · {asset?.serialNumber || "—"}</Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, justifyContent: "center" }}>
        <Button onClick={onClose} variant="outlined"
          sx={{ textTransform: "none", fontSize: 13, borderColor: "#e0e0e0", color: "#555", borderRadius: "8px" }}>
          Close
        </Button>
        <Button onClick={handleDownload} variant="contained"
          sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", background: "#1976d2", boxShadow: "none", "&:hover": { background: "#1565c0" } }}>
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
}
