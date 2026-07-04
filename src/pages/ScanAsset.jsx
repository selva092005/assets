import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Typography, CircularProgress, IconButton, Alert } from "@mui/material";
import { Html5QrcodeScanner } from "html5-qrcode";
import { FaQrcode, FaArrowLeft, FaClipboardCheck, FaWrench, FaHistory, FaCheckCircle, FaTimes } from "react-icons/fa";
import { getAssets } from "../services/assets_service";
import toast from "../utils/toast.jsx";
import PageHeader from "../components/common/PageHeader";
import { COLORS, primaryBtnSx, outlinedBtnSx } from "../theme/tokens";

export default function ScanAsset() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [assetDetails, setAssetDetails] = useState(null);
  const [scanError, setScanError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize html5-qrcode scanner
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    });

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    // Stop scanner after success to avoid multiple rapid scans
    setScanError(null);
    if (scannerRef.current) {
      try {
        // We don't force a full clear to let them scan again if needed, but we save the result
      } catch (e) {
        console.error(e);
      }
    }

    setScanResult(decodedText);
    await lookupAsset(decodedText);
  };

  const onScanFailure = (error) => {
    // Quietly log scanning errors (mostly camera noise/unfocused frames)
    // console.warn(`Scan failure: ${error}`);
  };

  const lookupAsset = async (value) => {
    setLoadingAsset(true);
    setAssetDetails(null);
    try {
      // The QR code could be a URL or a direct code/id
      let searchKey = value.trim();
      if (searchKey.includes("assetId=")) {
        const match = searchKey.match(/assetId=(\d+)/);
        if (match) searchKey = match[1];
      } else if (searchKey.includes("/assets/view/")) {
        const parts = searchKey.split("/assets/view/");
        if (parts.length > 1) searchKey = parts[1];
      } else if (searchKey.includes("Asset Code:")) {
        const match = searchKey.match(/Asset Code:\s*([^,]+)/i);
        if (match) searchKey = match[1].trim();
      }

      // Query database for asset code or serial number matching the code
      const response = await getAssets({ keyword: searchKey, page: 0, size: 5 });
      const list = response?.data?.content || response?.data || response || [];

      if (list.length > 0) {
        setAssetDetails(list[0]);
        toast.success(`Asset identified: ${list[0].assetName}`);
      } else {
        setScanError(`No asset found with tag or code: "${searchKey}"`);
        toast.error("Unrecognized asset code");
      }
    } catch (err) {
      setScanError("Failed to lookup asset details");
      toast.error("Database query failed");
    } finally {
      setLoadingAsset(false);
    }
  };

  const handleResetScanner = () => {
    setScanResult(null);
    setAssetDetails(null);
    setScanError(null);
  };

  return (
    <Box sx={{ p: 0 }}>
      <PageHeader
        title="Scan Asset QR Code"
        subtitle="Use your system webcam or terminal camera to scan asset QR labels for rapid auditing and lookup"
      />

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, mt: 2 }}>
        {!scanResult ? (
          <Card sx={{ width: "100%", maxWidth: 500, borderRadius: "16px", border: "1px solid #cbd5e1" }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 4 }}>
              <Box sx={{ bgcolor: "rgba(59, 130, 246, 0.08)", p: 3, borderRadius: "50%", mb: 2 }}>
                <FaQrcode size={40} color="#3b82f6" />
              </Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Camera QR Reader</Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Position the physical asset QR code label inside the frame scanner to load lifecycle details.
              </Typography>

              {/* Reader Element */}
              <Box id="reader" sx={{ width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }} />
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ width: "100%", maxWidth: 550, borderRadius: "16px", border: "1px solid #cbd5e1", p: 1 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={850}>SCANNED CODE: {scanResult}</Typography>
                <IconButton onClick={handleResetScanner} color="error" size="small"><FaTimes /></IconButton>
              </Box>

              {loadingAsset ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 5 }}>
                  <CircularProgress size={30} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Querying Asset Database...</Typography>
                </Box>
              ) : scanError ? (
                <Box sx={{ py: 2 }}>
                  <Alert severity="warning" sx={{ borderRadius: "8px", mb: 2 }}>{scanError}</Alert>
                  <Button variant="outlined" startIcon={<FaArrowLeft />} onClick={handleResetScanner} sx={outlinedBtnSx}>
                    Scan Again
                  </Button>
                </Box>
              ) : assetDetails ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
                  {/* Asset summary Card */}
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center", bgcolor: "#f8fafc", p: 2, borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: "6px", bgcolor: "#3b82f6", display: "flex",
                      alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0
                    }}>
                      <FaCheckCircle size={22} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                        {assetDetails.assetName}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: "#64748b" }}>
                        Tag: {assetDetails.assetCode} | Status: <span style={{ fontWeight: 700, color: COLORS.primary }}>{assetDetails.status}</span>
                      </Typography>
                    </Box>
                  </Box>

                  {/* Quick Actions Panel */}
                  <Box>
                    <Typography sx={{ fontSize: 10, fontWeight: 800, color: COLORS.primary, mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Instant Asset Workflows
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <Button
                        variant="contained"
                        startIcon={<FaClipboardCheck size={13} />}
                        onClick={() => navigate(`/home/audit?assetId=${assetDetails.assetId}`)}
                        sx={{ ...primaryBtnSx, justifyContent: "flex-start", py: 1, px: 2 }}
                      >
                        Launch Physical Audit Check
                      </Button>

                      <Button
                        variant="outlined"
                        startIcon={<FaWrench size={13} />}
                        onClick={() => navigate(`/home/maintenance?assetId=${assetDetails.assetId}`)}
                        sx={{ ...outlinedBtnSx, justifyContent: "flex-start", py: 1, px: 2 }}
                      >
                        Log Repair / Maintenance Details
                      </Button>

                      <Button
                        variant="outlined"
                        startIcon={<FaHistory size={13} />}
                        onClick={() => navigate(`/home/assets/view/${assetDetails.assetId}`)}
                        sx={{ ...outlinedBtnSx, justifyContent: "flex-start", py: 1, px: 2, color: "#6366f1", borderColor: "#c7d2fe" }}
                      >
                        View Full History & Timeline
                      </Button>
                    </Box>
                  </Box>

                  <Button variant="text" size="small" onClick={handleResetScanner} sx={{ alignSelf: "center", fontSize: 11, mt: 1 }}>
                    Scan another asset
                  </Button>
                </Box>
              ) : null}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
