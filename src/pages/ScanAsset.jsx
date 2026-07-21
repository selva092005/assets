import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box, Button, Card, CardContent, Typography, CircularProgress, IconButton,
  Alert, Grid, Divider, TextField, MenuItem, Select, FormControl, InputLabel,
  Chip
} from "@mui/material";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  FaQrcode, FaArrowLeft, FaClipboardCheck, FaWrench, FaHistory,
  FaCheckCircle, FaTimes, FaKeyboard, FaClock, FaCamera
} from "react-icons/fa";
import { getAssets } from "../services/assets_service";
import { createAudit } from "../services/audit_service";
import toast from "../utils/toast.jsx";
import PageHeader from "../components/common/PageHeader";
import { COLORS, outlinedBtnSx } from "../theme/tokens";

export default function ScanAsset() {
  const navigate = useNavigate();
  const { userName } = useSelector((s) => s.auth);

  // Tactile 3D style definitions
  const tactile3DBtnSx = {
    position: "relative",
    bgcolor: "#2563eb",
    color: "#fff",
    borderRadius: "8px",
    fontWeight: 750,
    boxShadow: "0 4px 0 #1d4ed8, 0 6px 12px rgba(37, 99, 235, 0.15)",
    transition: "all 0.1s ease-in-out",
    textTransform: "none",
    "&:hover": {
      bgcolor: "#3b82f6",
      transform: "translateY(-1px)",
      boxShadow: "0 5px 0 #1d4ed8, 0 8px 16px rgba(37, 99, 235, 0.2)"
    },
    "&:active": {
      transform: "translateY(4px)",
      boxShadow: "0 0px 0 #1d4ed8, 0 2px 4px rgba(0, 0, 0, 0.1)"
    }
  };

  const tactile3DOutlinedBtnSx = {
    position: "relative",
    bgcolor: "#f8fafc",
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontWeight: 700,
    boxShadow: "0 4px 0 #94a3b8, 0 6px 12px rgba(0, 0, 0, 0.05)",
    transition: "all 0.1s ease-in-out",
    textTransform: "none",
    "&:hover": {
      bgcolor: "#f1f5f9",
      borderColor: "#cbd5e1",
      transform: "translateY(-1px)",
      boxShadow: "0 5px 0 #94a3b8, 0 8px 16px rgba(0, 0, 0, 0.08)"
    },
    "&:active": {
      transform: "translateY(4px)",
      boxShadow: "0 0px 0 #94a3b8, 0 2px 4px rgba(0, 0, 0, 0.05)"
    }
  };

  // Scan/Lookup state
  const [scanResult, setScanResult] = useState(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [assetDetails, setAssetDetails] = useState(null);
  const [scanError, setScanError] = useState(null);

  // Session tracking & manual search state
  const [scanSessionHistory, setScanSessionHistory] = useState([]);
  const [manualInput, setManualInput] = useState("");

  // Quick audit state
  const [auditCondition, setAuditCondition] = useState("GOOD");
  const [auditRemarks, setAuditRemarks] = useState("");
  const [submittingAudit, setSubmittingAudit] = useState(false);

  const scannerRef = useRef(null);

  const lookupAsset = useCallback(async (value) => {
    setLoadingAsset(true);
    setAssetDetails(null);
    try {
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

      const response = await getAssets({ keyword: searchKey, page: 0, size: 5 });
      const list = response?.data?.content || response?.data || response || [];

      if (list.length > 0) {
        const found = list[0];
        setAssetDetails(found);
        toast.success(`Asset identified: ${found.assetName}`);

        // Add to scan history (without duplicates)
        setScanSessionHistory((prev) => {
          if (prev.some((h) => h.assetId === found.assetId)) return prev;
          return [
            {
              assetId: found.assetId,
              assetName: found.assetName,
              assetCode: found.assetCode,
              status: found.status,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              success: true
            },
            ...prev
          ].slice(0, 5);
        });
      } else {
        setScanError(`No asset found with tag or code: "${searchKey}"`);
        toast.error("Unrecognized asset code");

        setScanSessionHistory((prev) => [
          {
            assetCode: searchKey,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            success: false
          },
          ...prev
        ].slice(0, 5));
      }
    } catch {
      setScanError("Failed to lookup asset details");
      toast.error("Database query failed");
    } finally {
      setLoadingAsset(false);
    }
  }, []);

  const onScanSuccess = useCallback(async (decodedText) => {
    setScanError(null);
    setScanResult(decodedText);
    await lookupAsset(decodedText);
  }, [lookupAsset]);

  const onScanFailure = useCallback(() => {
    // Quietly log scanning errors (mostly camera noise/unfocused frames)
  }, []);

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
  }, [onScanSuccess, onScanFailure]);

  const handleResetScanner = () => {
    setScanResult(null);
    setAssetDetails(null);
    setScanError(null);
  };

  const handleManualLookup = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setScanResult(manualInput);
    await lookupAsset(manualInput);
    setManualInput("");
  };

  const handleQuickAuditSubmit = async (e) => {
    e.preventDefault();
    if (!assetDetails) return;
    setSubmittingAudit(true);
    try {
      await createAudit({
        assetId: Number(assetDetails.assetId),
        auditedBy: userName || "Auditor",
        auditDate: new Date().toISOString().split("T")[0],
        status: auditCondition,
        remarks: auditRemarks || "Quick audit via QR scan dashboard",
        actionTaken: "NONE",
        screenOk: true,
        keyboardOk: true,
        chargerOk: true,
        batteryOk: true,
      });
      toast.success("Quick audit recorded successfully!");

      // Instantly update local condition state
      setAssetDetails((prev) => ({
        ...prev,
        assetCondition: auditCondition
      }));
      setAuditRemarks("");

      // Auto reset the scanner after 1.5s so auditor is ready for the next label
      setTimeout(() => {
        handleResetScanner();
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record quick audit");
    } finally {
      setSubmittingAudit(false);
    }
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Hide html5-qrcode library default info/help icon & style permission alert */}
      <style>{`
        #reader img {
          display: none !important;
        }
        #reader__header_message {
          background-color: transparent !important;
          color: #dc2626 !important;
          border: none !important;
          border-radius: 0 !important;
          padding: 8px 0 !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          margin: 0 auto 12px auto !important;
          width: 100% !important;
          text-align: center !important;
          font-family: inherit !important;
          box-shadow: none !important;
        }
        #reader {
          border: none !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
        }
        #reader button {
          margin-top: 10px !important;
          margin-bottom: 10px !important;
        }
        #reader a {
          margin-top: 10px !important;
          margin-bottom: 10px !important;
          display: inline-block !important;
        }
        #html5-qrcode-anchor-scan-type {
          margin-top: 12px !important;
          display: inline-block !important;
        }
        #reader__scan_region {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          width: 100% !important;
        }
        #reader__scan_region video {
          margin: 0 auto !important;
          border-radius: 8px !important;
        }
        #reader__dashboard {
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
        }
        #reader__dashboard select {
          margin: 5px auto !important;
          display: block !important;
        }
      `}</style>
      <PageHeader
        title="Asset Scanner Dashboard"
        subtitle="Webcam QR scanner with rapid physical auditing check and real-time session tracking"
      />

      <Grid container spacing={4} sx={{ mt: 1, alignItems: "stretch" }}>
        {/* Left Column: Live Webcam Scanner */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            width: "100%",
            height: "100%",
            borderRadius: "16px",
            border: "1px solid #cbd5e1",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
            display: "flex",
            flexDirection: "column"
          }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 4, height: "100%", flexGrow: 1 }}>
              <Box sx={{
                bgcolor: "rgba(59, 130, 246, 0.08)",
                p: 3,
                borderRadius: "50%",
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <FaQrcode size={40} color="#3b82f6" />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: "#0f172a", mb: 1 }}>
                Camera QR Reader
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Position the physical asset QR code label inside the frame scanner to load lifecycle details.
              </Typography>

              {/* Reader Element */}
              <Box id="reader" sx={{ width: "100%", maxWidth: "320px", mx: "auto", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }} />

              {scanResult && (
                <Box sx={{ display: "flex", justifyContent: "center", width: "100%", mt: 2.5 }}>
                  <Button
                    variant="outlined"
                    onClick={handleResetScanner}
                    sx={tactile3DOutlinedBtnSx}
                  >
                    Reset & Turn Camera On
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Dynamic Action & Metadata Feed */}
        <Grid item xs={12} md={6}>
          {!scanResult ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, height: "100%" }}>
              {/* 1. Manual Entry Panel */}
              <Card sx={{
                borderRadius: "20px",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)"
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "rgba(37,99,235,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                      <FaKeyboard size={14} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                      Manual Code Lookup
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 11, color: "#64748b", mb: 2 }}>
                    If the QR code sticker is faded, dirty, or camera scanner permissions are blocked, enter the Asset Tag or Asset Code manually.
                  </Typography>

                  <Box component="form" onSubmit={handleManualLookup} sx={{ display: "flex", gap: 1.5 }}>
                    <TextField
                      size="small"
                      placeholder="e.g. AST-0098, LAP-044"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          fontSize: 12
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{ ...tactile3DBtnSx, fontSize: 11.5, px: 3 }}
                    >
                      Lookup
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* 2. Scan Session History Feed */}
              <Card sx={{
                borderRadius: "20px",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column"
              }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "rgba(37,99,235,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                      <FaClock size={13} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                      Recent Scans (Current Session)
                    </Typography>
                  </Box>

                  {scanSessionHistory.length === 0 ? (
                    <Box sx={{ py: 3, textAlign: "center", border: "1px dashed rgba(226,232,240,0.8)", borderRadius: "10px", bgcolor: "#fafbfc", flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Typography sx={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 600 }}>No assets scanned in this session yet.</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flexGrow: 1, overflowY: "auto", maxHeight: 220 }}>
                      {scanSessionHistory.map((item, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            p: 1.5,
                            borderRadius: "10px",
                            border: "1px solid rgba(241, 245, 249, 0.8)",
                            bgcolor: item.success ? "#f8fafc" : "#fef2f2"
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.success ? "#10b981" : "#ef4444" }} />
                            <Box>
                              <Typography sx={{ fontSize: 12, fontWeight: 750, color: "#334155" }}>
                                {item.success ? item.assetName : "Unknown Tag / Scan Error"}
                              </Typography>
                              <Typography sx={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", mt: 0.1 }}>
                                Tag: {item.assetCode}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography sx={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>
                            {item.timestamp}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, height: "100%" }}>
              {/* Asset Identified & Detailed Sheet */}
              <Card sx={{
                borderRadius: "20px",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
                height: "100%"
              }}>
                <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  {loadingAsset ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2 }}>
                      <CircularProgress size={32} thickness={4} />
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Querying Asset Database...</Typography>
                    </Box>
                  ) : scanError ? (
                    <Box sx={{ py: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <Alert severity="warning" sx={{ borderRadius: "10px", width: "100%", fontSize: 11.5 }}>{scanError}</Alert>
                      <Button variant="outlined" startIcon={<FaArrowLeft />} onClick={handleResetScanner} sx={outlinedBtnSx}>
                        Scan Again
                      </Button>
                    </Box>
                  ) : assetDetails ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                      {/* Identified Header */}
                      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                        <Box sx={{
                          width: 44, height: 44, borderRadius: "8px",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", flexShrink: 0, boxShadow: "0 4px 12px rgba(16,185,129,0.15)"
                        }}>
                          <FaCheckCircle size={18} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                            {assetDetails.assetName}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#64748b", mt: 0.1 }}>
                            Code Tag: <span style={{ fontFamily: "monospace", fontWeight: 750, color: "#3b82f6" }}>{assetDetails.assetCode}</span>
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ borderColor: "rgba(241,245,249,0.8)" }} />

                      {/* Info Spec Grid */}
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: 9, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase" }}>Brand & Model</Typography>
                          <Typography sx={{ fontSize: 11.5, color: "#334155", fontWeight: 700 }}>{assetDetails.brand || "—"} {assetDetails.model ? `(${assetDetails.model})` : ""}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: 9, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase" }}>Serial Number</Typography>
                          <Typography sx={{ fontSize: 11.5, color: "#334155", fontWeight: 700, fontFamily: "monospace" }}>{assetDetails.serialNumber || "—"}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: 9, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", mb: 0.5 }}>Condition</Typography>
                          <Chip
                            label={assetDetails.assetCondition || "GOOD"}
                            size="small"
                            sx={{
                              fontSize: 9,
                              height: 18,
                              fontWeight: 800,
                              bgcolor: assetDetails.assetCondition === "POOR" ? "#fee2e2" : "#eff6ff",
                              color: assetDetails.assetCondition === "POOR" ? "#ef4444" : "#2563eb",
                              borderRadius: "4px"
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: 9, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", mb: 0.5 }}>Status</Typography>
                          <Chip
                            label={assetDetails.status}
                            size="small"
                            sx={{
                              fontSize: 9,
                              height: 18,
                              fontWeight: 800,
                              bgcolor: assetDetails.status === "AVAILABLE" ? "#e8f5e9" : "#eff6ff",
                              color: assetDetails.status === "AVAILABLE" ? "#2e7d32" : "#2563eb",
                              borderRadius: "4px"
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography sx={{ fontSize: 9, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase" }}>Assigned Location</Typography>
                          <Typography sx={{ fontSize: 11.5, color: "#334155", fontWeight: 700 }}>{assetDetails.locationName || "Central Warehouse"}</Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ borderColor: "rgba(241,245,249,0.8)" }} />

                      {/* 1. Quick Audit Form Panel */}
                      <Box sx={{
                        bgcolor: "#f8fafc",
                        p: 2.5,
                        borderRadius: "14px",
                        border: "1px solid rgba(226, 232, 240, 0.8)"
                      }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#2563eb", mb: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Quick Physical Audit Logging
                        </Typography>

                        <Box component="form" onSubmit={handleQuickAuditSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <FormControl size="small" fullWidth>
                            <InputLabel sx={{ fontSize: 11 }}>Log Physical Condition</InputLabel>
                            <Select
                              value={auditCondition}
                              label="Log Physical Condition"
                              onChange={(e) => setAuditCondition(e.target.value)}
                              sx={{
                                borderRadius: "8px",
                                fontSize: 12,
                                bgcolor: "#fff"
                              }}
                            >
                              <MenuItem value="GOOD" sx={{ fontSize: 12 }}>GOOD — Healthy & fully operational</MenuItem>
                              <MenuItem value="FAIR" sx={{ fontSize: 12 }}>FAIR — Minor visual wear / light usage</MenuItem>
                              <MenuItem value="POOR" sx={{ fontSize: 12 }}>POOR — Malfunctioning / needs repair</MenuItem>
                            </Select>
                          </FormControl>

                          <TextField
                            size="small"
                            placeholder="Add brief audit observations / tag status..."
                            value={auditRemarks}
                            onChange={(e) => setAuditRemarks(e.target.value)}
                            fullWidth
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                                fontSize: 11.5,
                                bgcolor: "#fff"
                              }
                            }}
                          />

                          <Button
                            type="submit"
                            disabled={submittingAudit}
                            variant="contained"
                            sx={{ ...tactile3DBtnSx, fontSize: 11.5, py: 1 }}
                          >
                            {submittingAudit ? "Saving Audit Check..." : "Record Verified Audit"}
                          </Button>
                        </Box>
                      </Box>

                      {/* 2. Standard Context Workflows */}
                      <Box sx={{ mt: 1 }}>
                        <Typography sx={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", mb: 1.5, letterSpacing: "0.05em" }}>
                          Full Action Workflows
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                          <Button
                            variant="outlined"
                            startIcon={<FaWrench size={11} />}
                            onClick={() => navigate(`/home/maintenance?assetId=${assetDetails.assetId}`)}
                            sx={{ ...outlinedBtnSx, textTransform: "none", fontSize: 11, py: 0.75, flexGrow: 1 }}
                          >
                            Log Repair Task
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<FaHistory size={11} />}
                            onClick={() => navigate(`/home/assets/view/${assetDetails.assetId}`)}
                            sx={{ ...outlinedBtnSx, textTransform: "none", fontSize: 11, py: 0.75, flexGrow: 1, color: "#6366f1", borderColor: "#c7d2fe" }}
                          >
                            Timeline & Profile
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  ) : null}
                </CardContent>
              </Card>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

