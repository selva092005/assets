import { useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import { FaTimes, FaDownload, FaQrcode } from "react-icons/fa";
import { STATUS_COLORS, CONDITION_COLORS, outlinedBtnSx, primaryBtnSx, FONT_FAMILIES, premiumDialogPaperSx } from "../../theme/tokens";

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
          sx: premiumDialogPaperSx,
        },
      }}
    >
      <DialogTitle sx={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #e2e8f0", pb: 1.5, pt: 2, px: 3,
        background: "#f8fafc",
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 28, height: 28, borderRadius: "6px", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaQrcode size={14} color="#ffffff" />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a", fontFamily: FONT_FAMILIES.header }}>
            Asset QR Code
          </Typography>
        </Box>
        <Box onClick={onClose} sx={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", "&:hover": { color: "#0f172a", background: "#e2e8f0" }, transition: "all 0.2s" }}>
          <FaTimes size={11} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        py: { xs: 2, sm: 3 }, 
        px: { xs: 2, sm: 3 }, 
        background: "#fafbfc",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1
      }}>
        <Box sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: 2,
          margin: { xs: "auto 0", sm: 0 },
          width: "100%"
        }}>
          
          <Typography sx={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", width: "100%" }}>
            Asset Passport Label
          </Typography>

          {/* Professional AMS Asset Label Card */}
          <Box sx={{ 
            width: "100%", 
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.02)",
            overflow: "hidden"
          }}>
            {/* Asset Label Header */}
            <Box sx={{ 
              background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)", 
              color: "#ffffff", 
              px: 2, 
              py: 0.75, 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center" 
            }}>
              <Typography sx={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                AMS INVENTORY TAG
              </Typography>
              <Typography sx={{ fontSize: 8.5, opacity: 0.8, fontWeight: 700, fontFamily: "monospace" }}>
                REGISTERED
              </Typography>
            </Box>

            {/* Asset Label Main Grid */}
            <Box sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              display: "flex", 
              flexDirection: { xs: "column", sm: "row" }, 
              gap: 2, 
              alignItems: { xs: "stretch", sm: "center" } 
            }}>
              {/* Left Column: Asset Info details */}
              <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: 8, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.25 }}>
                    Asset Code
                  </Typography>
                  <Box sx={{ 
                    display: "inline-block", 
                    px: 1, 
                    py: 0.25, 
                    bgcolor: "#e0f2fe", 
                    color: "#0369a1", 
                    border: "1px solid #bae6fd",
                    borderRadius: "4px", 
                    fontSize: 11.5,
                    fontWeight: 800, 
                    fontFamily: "monospace" 
                  }}>
                    {asset?.assetCode || "—"}
                  </Box>
                </Box>
                
                <Box>
                  <Typography sx={{ fontSize: 8, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.25 }}>
                    Asset Name
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {asset?.assetName || "—"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 8, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Serial No
                    </Typography>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>
                      {asset?.serialNumber || "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 8, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Location
                    </Typography>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>
                      {asset?.locationName || "—"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Right Column: QR Code canvas */}
              <Box sx={{ 
                flexShrink: 0, 
                p: 0.75, 
                border: "1px solid #e2e8f0", 
                borderRadius: "8px", 
                background: "#ffffff",
                alignSelf: { xs: "center", sm: "auto" }
              }}>
                <Box ref={canvasRef} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <QRCodeCanvas value={value || " "} size={80} level="H" includeMargin={false} />
                </Box>
              </Box>
            </Box>

            {/* Asset Status Footer Strip */}
            <Box sx={{ 
              borderTop: "1px solid #f1f5f9", 
              background: "#f8fafc", 
              px: 2, 
              py: 0.75, 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center" 
            }}>
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 0.5, 
                px: 1, 
                py: 0.25, 
                borderRadius: "4px", 
                background: statusStyle.bg || "#f1f5f9",
                border: `1px solid ${statusStyle.color}30`
              }}>
                <Box sx={{ width: 5, height: 5, borderRadius: "50%", background: statusStyle.color }} />
                <Typography sx={{ fontSize: 9, fontWeight: 700, color: statusStyle.color, textTransform: "uppercase" }}>
                  {asset?.status}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: conditionStyle.color, background: conditionStyle.bg, border: `1px solid ${conditionStyle.color}30`, px: 1, py: 0.25, borderRadius: "4px", textTransform: "uppercase" }}>
                {asset?.assetCondition}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        borderTop: "1px solid #e2e8f0", 
        px: 3, 
        py: 1.5, 
        gap: 1.5, 
        background: "#f8fafc",
        flexDirection: { xs: "column-reverse", sm: "row" },
        "& > :not(style) ~ :not(style)": {
          marginLeft: { xs: "0px !important", sm: "8px !important" }
        }
      }}>
        <Button
          onClick={handleDownload}
          variant="outlined"
          startIcon={<FaDownload size={11} />}
          fullWidth
          sx={outlinedBtnSx}
        >
          Download Tag
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          startIcon={<FaTimes size={11} />}
          fullWidth
          sx={primaryBtnSx}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}