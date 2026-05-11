import { useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Chip } from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import { FaTimes, FaQrcode, FaDownload, FaHashtag, FaCheckCircle } from "react-icons/fa";
import { MdLayers } from "react-icons/md";

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

  const getConditionColor = (condition) => {
    const colors = {
      GOOD: { bg: "#dbeafe", color: "#1e40af" },
      FAIR: { bg: "#fef3c7", color: "#d97706" },
      POOR: { bg: "#fee2e2", color: "#dc2626" }
    };
    return colors[condition] || colors.FAIR;
  };

  const getStatusColor = (status) => {
    const colors = {
      AVAILABLE: { bg: "#d1fae5", color: "#065f46" },
      ASSIGNED: { bg: "#fef3c7", color: "#d97706" },
      DAMAGED: { bg: "#fee2e2", color: "#dc2626" }
    };
    return colors[status] || colors.AVAILABLE;
  };

  const conditionStyle = getConditionColor(asset?.assetCondition);
  const statusStyle = getStatusColor(asset?.status);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: "16px", 
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          background: "#ffffff",
          overflow: "visible"
        } 
      }}
    >
      <DialogTitle sx={{ 
        display: "flex", 
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #f3f4f6",
        pb: 2,
        pt: 2.5,
        px: 3,
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ 
            width: 44, 
            height: 44, 
            borderRadius: "10px", 
            background: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <FaQrcode size={22} color="#ffffff" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 17, color: "#111827", lineHeight: 1.3 }}>
              Asset QR Code
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 0.25 }}>
              Scan to view asset details
            </Typography>
          </Box>
        </Box>
        <Box 
          onClick={onClose} 
          sx={{ 
            cursor: "pointer", 
            color: "#9ca3af", 
            "&:hover": { color: "#374151" }, 
            transition: "color 0.2s"
          }}
        >
          <FaTimes size={18} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2.5, px: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5 }}>
          {/* QR Code with corner brackets */}
          <Box sx={{ position: "relative", p: 2.5 }}>
            {/* Corner brackets */}
            <Box sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              "&::before, &::after": {
                content: '""',
                position: "absolute",
                width: 40,
                height: 40,
                border: "3px solid #2563eb",
              },
              "&::before": {
                top: 0,
                left: 0,
                borderRight: "none",
                borderBottom: "none",
                borderTopLeftRadius: "12px"
              },
              "&::after": {
                top: 0,
                right: 0,
                borderLeft: "none",
                borderBottom: "none",
                borderTopRightRadius: "12px"
              }
            }}>
              <Box sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 40,
                height: 40,
                border: "3px solid #2563eb",
                borderRight: "none",
                borderTop: "none",
                borderBottomLeftRadius: "12px"
              }} />
              <Box sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 40,
                height: 40,
                border: "3px solid #2563eb",
                borderLeft: "none",
                borderTop: "none",
                borderBottomRightRadius: "12px"
              }} />
            </Box>

            {/* QR Code */}
            <Box 
              ref={canvasRef} 
              sx={{ 
                background: "#fff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <QRCodeCanvas value={value || " "} size={200} level="H" includeMargin={false} />
            </Box>
          </Box>

          {/* Asset Name */}
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827", textAlign: "center" }}>
            {asset?.assetName || "Asset Name"}
          </Typography>

          {/* Asset ID and Serial */}
          <Typography sx={{ 
            fontSize: 13, 
            color: "#6b7280", 
            fontFamily: "monospace",
            textAlign: "center",
            mt: -1.5
          }}>
            #{asset?.assetId || "1"} · {asset?.serialNumber || "SMSNG-TAB-9001"}
          </Typography>

          {/* Info Cards */}
          <Box sx={{ 
            display: "flex", 
            gap: 1.5, 
            width: "100%",
            justifyContent: "center",
            mt: 0.5
          }}>
            {/* Asset ID */}
            <Box sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1.25,
              borderRadius: "8px",
              background: "#f9fafb",
              border: "1px solid #f3f4f6"
            }}>
              <FaHashtag size={14} color="#2563eb" />
              <Box>
                <Typography sx={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>Asset ID</Typography>
                <Typography sx={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>#{asset?.assetId || "1"}</Typography>
              </Box>
            </Box>

            {/* Condition */}
            <Box sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1.25,
              borderRadius: "8px",
              background: "#f9fafb",
              border: "1px solid #f3f4f6"
            }}>
              <MdLayers size={16} color="#f59e0b" />
              <Box>
                <Typography sx={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>Condition</Typography>
                <Typography sx={{ 
                  fontSize: 13, 
                  color: conditionStyle.color, 
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}>
                  {asset?.assetCondition || "FAIR"}
                </Typography>
              </Box>
            </Box>

            {/* Status */}
            <Box sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1.25,
              borderRadius: "8px",
              background: "#f9fafb",
              border: "1px solid #f3f4f6"
            }}>
              <FaCheckCircle size={14} color="#10b981" />
              <Box>
                <Typography sx={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>Status</Typography>
                <Typography sx={{ 
                  fontSize: 13, 
                  color: statusStyle.color, 
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}>
                  {asset?.status || "AVAILABLE"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid #f3f4f6", px: 3, py: 2.5, gap: 1.5 }}>
        <Button 
          onClick={handleDownload} 
          variant="outlined"
          startIcon={<FaDownload size={14} />}
          fullWidth
          sx={{ 
            textTransform: "none", 
            fontSize: 14, 
            fontWeight: 600,
            borderColor: "#e5e7eb", 
            color: "#374151", 
            borderRadius: "8px",
            py: 1.25,
            "&:hover": { 
              borderColor: "#d1d5db", 
              background: "#f9fafb" 
            }
          }}
        >
          Download
        </Button>
        <Button 
          onClick={onClose} 
          variant="contained"
          startIcon={<FaTimes size={14} />}
          fullWidth
          sx={{ 
            textTransform: "none", 
            fontSize: 14, 
            fontWeight: 700, 
            borderRadius: "8px", 
            py: 1.25,
            background: "#2563eb", 
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)", 
            "&:hover": { 
              background: "#1d4ed8",
              boxShadow: "0 4px 6px rgba(37,99,235,0.2)"
            } 
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
