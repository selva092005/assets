import { useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import { FaTimes, FaQrcode, FaDownload, FaHashtag, FaCheckCircle } from "react-icons/fa";
import { MdLayers } from "react-icons/md";
import { STATUS_COLORS, CONDITION_COLORS, outlinedBtnSx } from "../../theme/tokens";

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

  // Reuse token maps — fall back to FAIR/AVAILABLE colours if key not found
  const conditionStyle = CONDITION_COLORS[asset?.assetCondition] || CONDITION_COLORS.FAIR;
  const statusStyle    = STATUS_COLORS[asset?.status]            || STATUS_COLORS.AVAILABLE;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableRestoreFocus
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            background: "#ffffff",
            overflow: "visible",
          },
        },
      }}
    >
      <DialogTitle sx={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #f3f4f6", pb: 2, pt: 2.5, px: 3,
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "10px", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaQrcode size={22} color="#ffffff" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 17, color: "#111827", lineHeight: 1.3 }}>Asset QR Code</Typography>
            <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 0.25 }}>Scan to view asset details</Typography>
          </Box>
        </Box>
        <Box onClick={onClose} sx={{ cursor: "pointer", color: "#9ca3af", "&:hover": { color: "#374151" }, transition: "color 0.2s" }}>
          <FaTimes size={18} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2.5, px: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5 }}>

          {/* QR with corner brackets */}
          <Box sx={{ position: "relative", p: 2.5 }}>
            <Box sx={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none",
              "&::before, &::after": { content: '""', position: "absolute", width: 40, height: 40, border: "3px solid #2563eb" },
              "&::before": { top: 0, left: 0, borderRight: "none", borderBottom: "none", borderTopLeftRadius: "12px" },
              "&::after":  { top: 0, right: 0, borderLeft: "none", borderBottom: "none", borderTopRightRadius: "12px" },
            }}>
              <Box sx={{ position: "absolute", bottom: 0, left: 0,  width: 40, height: 40, border: "3px solid #2563eb", borderRight: "none", borderTop: "none", borderBottomLeftRadius:  "12px" }} />
              <Box sx={{ position: "absolute", bottom: 0, right: 0, width: 40, height: 40, border: "3px solid #2563eb", borderLeft:  "none", borderTop: "none", borderBottomRightRadius: "12px" }} />
            </Box>
            <Box ref={canvasRef} sx={{ background: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <QRCodeCanvas value={value || " "} size={200} level="H" includeMargin={false} />
            </Box>
          </Box>

          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827", textAlign: "center" }}>
            {asset?.assetName || "Asset Name"}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#6b7280", fontFamily: "monospace", textAlign: "center", mt: -1.5 }}>
            #{asset?.assetId || "1"} · {asset?.serialNumber || ""}
          </Typography>

          {/* Info chips — colours come from shared token maps */}
          <Box sx={{ display: "flex", gap: 1.5, width: "100%", justifyContent: "center", mt: 0.5 }}>
            {[
              { icon: <FaHashtag    size={14} color="#2563eb" />,  label: "Asset ID",  value: `#${asset?.assetId || "1"}`,       color: "#111827" },
              { icon: <MdLayers     size={16} color="#f59e0b" />,  label: "Condition", value: asset?.assetCondition || "FAIR",    color: conditionStyle.color },
              { icon: <FaCheckCircle size={14} color="#10b981" />, label: "Status",    value: asset?.status || "AVAILABLE",      color: statusStyle.color },
            ].map(({ icon, label, value, color }) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.25, borderRadius: "8px", background: "#f9fafb", border: "1px solid #f3f4f6" }}>
                {icon}
                <Box>
                  <Typography sx={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>{label}</Typography>
                  <Typography sx={{ fontSize: 13, color, fontWeight: 700, textTransform: "uppercase" }}>{value}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid #f3f4f6", px: 3, py: 2.5, gap: 1.5 }}>
        <Button
          onClick={handleDownload}
          variant="outlined"
          startIcon={<FaDownload size={14} />}
          fullWidth
          sx={outlinedBtnSx}
        >
          Download
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          startIcon={<FaTimes size={14} />}
          fullWidth
          sx={{ textTransform: "none", fontSize: 14, fontWeight: 700, borderRadius: "8px", py: 1.25, background: "#2563eb", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", "&:hover": { background: "#1d4ed8" } }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}