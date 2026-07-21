import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Typography, IconButton, Divider, Modal, Table, TableBody, TableCell, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from "@mui/material";
import SkeletonLoader from "../components/common/SkeletonLoader";
import { useForm } from "react-hook-form";
import { FormTextField } from "../components/FormFields";
import { FaArrowLeft, FaEdit, FaBox, FaTrash, FaLayerGroup, FaPrint, FaMapMarkerAlt, FaExchangeAlt, FaTimes, FaUser, FaCalendarAlt, FaHistory, FaClipboardCheck, FaWrench } from "react-icons/fa";
import { useSelector } from "react-redux";
import toast from "../utils/toast.jsx";

import { getAssetById, getImageUrl } from "../services/assets_service";
import { getAssetHistory, moveAsset } from "../services/location_history_service";
import { getLogsByAsset } from "../services/activity_log_service";
import ImagePreviewDialog from "../components/common/ImagePreviewDialog";
import {
  COLORS,
  STATUS_COLORS,
  CONDITION_COLORS,
  outlinedBtnSx,
  primaryBtnSx,
  denseCellSx,
  imageCardSx
} from "../theme/tokens";

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgOpen, setImgOpen] = useState(false);
  const { userRole, userName } = useSelector((s) => s.auth);

  // Transfer Dialog State
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSaving, setTransferSaving] = useState(false);

  const transferForm = useForm({
    defaultValues: { newLocation: "", reason: "" }
  });

  const canEdit = userRole === "admin" || userRole === "manager";
  const canAllocate = userRole === "admin" || userRole === "manager";
  const canDispose = userRole === "admin";

  useEffect(() => {
    const fetchAssetAndHistory = async () => {
      try {
        const [assetRes, , logsRes] = await Promise.all([
          getAssetById(id),
          getAssetHistory(id).catch(() => []),
          getLogsByAsset(id).catch(() => [])
        ]);
        setData(assetRes.data ?? assetRes);
        setActivityLogs(logsRes ?? []);
      } catch {
        toast.error("Failed to load asset details");
        navigate("/home/assets");
      } finally {
        setLoading(false);
      }
    };
    fetchAssetAndHistory();
  }, [id, navigate]);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <SkeletonLoader variant="detail" />
      </Box>
    );
  }

  if (!data) return null;

  const imageUrl = getImageUrl(data.imagePath);
  const statusClr = STATUS_COLORS[data.status] || { bg: "#f5f5f5", color: "#555" };
  const condClr = CONDITION_COLORS[data.assetCondition] || { bg: "#f5f5f5", color: "#555" };

  const isDisposed = data.status === "DISPOSED";
  const isAssigned = data.status === "ASSIGNED";
  const isDamaged = data.assetCondition === "DAMAGED";
  const isUnderMaintenance = data.status === "UNDER_MAINTENANCE";

  const getWarrantyInfo = () => {
    if (!data.purchaseDate || !data.warrantyExpiry) return null;

    const purchase = new Date(data.purchaseDate);
    const expiry = new Date(data.warrantyExpiry);
    const today = new Date();

    const totalDuration = expiry - purchase;
    if (totalDuration <= 0) return null;

    const remaining = expiry - today;
    const daysLeft = Math.ceil(remaining / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return {
        percent: 0,
        status: "EXPIRED",
        daysLeft: 0,
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
        text: "Expired"
      };
    }

    const percent = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));

    let color = "#10b981";
    let bgColor = "rgba(16, 185, 129, 0.1)";
    let text = "Active";

    if (percent < 25) {
      color = "#ef4444";
      bgColor = "rgba(239, 68, 68, 0.1)";
      text = "Expiring Soon";
    } else if (percent < 50) {
      color = "#f59e0b";
      bgColor = "rgba(245, 158, 11, 0.1)";
      text = "Active (Mid-term)";
    }

    return {
      percent,
      status: text,
      daysLeft,
      color,
      bgColor,
      text: `${daysLeft} Day${daysLeft !== 1 ? "s" : ""} Left`
    };
  };

  const getValueRetentionInfo = () => {
    if (!data.cost || !data.currentValue) return null;
    const percent = Math.max(0, Math.min(100, (data.currentValue / data.cost) * 100));
    const depreciatedValue = Math.max(0, data.cost - data.currentValue);
    const depreciatedPercent = 100 - percent;
    return {
      percent,
      depreciatedValue,
      depreciatedPercent,
      costText: "₹" + data.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      valueText: "₹" + data.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      depreciatedText: "₹" + depreciatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    };
  };

  const handleEdit = () => navigate("/home/assets/edit/" + id);
  const handleAllocate = () => navigate("/home/allocation?assetId=" + id);
  const handleDispose = () => navigate("/home/disposal?assetId=" + id);

  const handleTransfer = async (values) => {
    setTransferSaving(true);
    try {
      await moveAsset({
        assetId: data.assetId,
        fromLocation: data.locationName || null,
        newLocation: values.newLocation.trim(),
        movedBy: userName || "Admin",
        reason: values.reason.trim() || "Transferred via asset detail view",
      });
      toast.success("Asset location transferred successfully");
      setTransferOpen(false);
      transferForm.reset();

      // Reload page details & history
      setLoading(true);
      const [assetRes, , logsRes] = await Promise.all([
        getAssetById(id),
        getAssetHistory(id).catch(() => []),
        getLogsByAsset(id).catch(() => [])
      ]);
      setData(assetRes.data ?? assetRes);
      setActivityLogs(logsRes ?? []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Transfer failed");
    } finally {
      setTransferSaving(false);
      setLoading(false);
    }
  };

  const handlePrintQR = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head><title>Print QR - ${data.assetName}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
          <div style="border:1px solid #ccc;padding:25px;border-radius:12px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.05);max-width:220px;">
            <img src="data:image/png;base64,${data.qrCode}" style="width:160px;height:160px;object-fit:contain;"/>
            <h3 style="margin:12px 0 6px 0;font-size:16px;color:#111;">${data.assetName}</h3>
            <p style="margin:0;font-size:12px;color:#666;">ID: ${data.assetId}</p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };


  return (
    <>
      <ImagePreviewDialog
        open={imgOpen}
        onClose={() => setImgOpen(false)}
        imageUrl={imageUrl}
        title={data?.assetName}
      />

      <Box sx={{
        p: 0,
      }}>
        {/* Navigation header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <IconButton onClick={() => navigate("/home/assets")} sx={{ p: 0.5, border: "1px solid " + COLORS.border, borderRadius: "4px" }}>
            <FaArrowLeft size={10} color={COLORS.textMuted} />
          </IconButton>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Asset Detail Sheet</Typography>
        </Box>

        {/* Unified Two-Column Layout */}
        <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>

          {/* LEFT PANEL: Summary Card */}
          <Box sx={{
            width: { xs: "100%", md: 220 },
            flexShrink: 0,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "4px",
            p: 1.5,
            display: "flex",
            flexDirection: "column",
          }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              {/* Premium Image Card */}
              <Box
                onClick={() => imageUrl && setImgOpen(true)}
                sx={imageCardSx(imageUrl)}
              >
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt="asset" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <Box
                      className="zoom-overlay"
                      sx={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(15, 23, 42, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 9.5,
                        fontWeight: 600,
                        opacity: 0,
                        transition: "opacity 0.2s ease",
                        pointerEvents: "none"
                      }}
                    >
                      Click to expand
                    </Box>
                  </>
                ) : (
                  <>
                    <FaBox size={20} color="#94a3b8" style={{ marginBottom: 4 }} />
                    <Typography sx={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 600 }}>No Image Available</Typography>
                  </>
                )}
              </Box>

              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text, mb: 0.25 }}>
                {data.assetName}
              </Typography>
              <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mb: 1 }}>{data.assetCode || "—"}</Typography>

              <Box sx={{ display: "flex", gap: 0.5, mb: 1.5 }}>
                <Chip label={data.status} size="small" sx={{ background: statusClr.bg, color: statusClr.color, fontWeight: 700, fontSize: 8, height: 16, borderRadius: "3px", "& .MuiChip-label": { px: 1 } }} />
                <Chip label={data.assetCondition} size="small" sx={{ background: condClr.bg, color: condClr.color, fontWeight: 700, fontSize: 8, height: 16, borderRadius: "3px", "& .MuiChip-label": { px: 1 } }} />
              </Box>

              {data.qrCode && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, mb: 2, mt: 0.5 }}>
                  <Box sx={{ width: 100, height: 100, p: 0.75, border: "1px solid " + COLORS.borderLight, background: "#fff", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <img src={"data:image/png;base64," + data.qrCode} alt="QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </Box>
                  <Button variant="outlined" size="small" startIcon={<FaPrint size={10} />} onClick={handlePrintQR} sx={{ ...outlinedBtnSx, width: 100, height: 28, fontSize: 10, color: COLORS.textMuted, borderColor: COLORS.border }}>Print</Button>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 1.25, borderColor: COLORS.borderLight }} />

            {/* Quick Actions */}
            <Typography sx={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>Actions</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {canEdit && (
                <Button variant="outlined" size="small" startIcon={<FaEdit size={10} />} onClick={handleEdit} disabled={isDisposed || isAssigned} sx={{ ...outlinedBtnSx, color: COLORS.primary, borderColor: COLORS.primary, justifyContent: "flex-start", width: "100%" }}>
                  Edit Asset
                </Button>
              )}
              {canAllocate && (
                <Button variant="outlined" size="small" startIcon={<FaLayerGroup size={10} />} onClick={handleAllocate} disabled={isDisposed || isAssigned || isDamaged || isUnderMaintenance} sx={{ ...outlinedBtnSx, color: "#059669", borderColor: "#059669", justifyContent: "flex-start", width: "100%" }}>
                  Allocate
                </Button>
              )}
              {/* Transfer Location */}
              {canEdit && (
                <Button variant="outlined" size="small" startIcon={<FaExchangeAlt size={10} />} onClick={() => setTransferOpen(true)} disabled={isDisposed} sx={{ ...outlinedBtnSx, color: "#3b82f6", borderColor: "#3b82f6", justifyContent: "flex-start", width: "100%" }}>
                  Transfer
                </Button>
              )}
              {canDispose && (
                <Button variant="outlined" size="small" startIcon={<FaTrash size={10} />} onClick={handleDispose} disabled={isDisposed} sx={{ ...outlinedBtnSx, color: "#dc2626", borderColor: "#dc2626", justifyContent: "flex-start", width: "100%" }}>
                  Dispose
                </Button>
              )}
            </Box>

            <Divider sx={{ my: 1.25, borderColor: COLORS.borderLight }} />

            {/* Warranty Status Section */}
            <Box sx={{ width: "100%" }}>
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
                Warranty Tracker
              </Typography>
              {(() => {
                const w = getWarrantyInfo();
                if (!w) {
                  return (
                    <Box sx={{
                      p: 1.25,
                      bgcolor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: 1
                    }}>
                      <Box sx={{
                        width: 22,
                        height: 22,
                        borderRadius: "4px",
                        bgcolor: "rgba(100, 116, 139, 0.1)",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <FaClipboardCheck size={10} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: COLORS.text }}>
                          No Warranty Info
                        </Typography>
                        <Typography sx={{ fontSize: 8, color: COLORS.textMuted }}>
                          Acquisition date not set
                        </Typography>
                      </Box>
                    </Box>
                  );
                }

                return (
                  <Box sx={{
                    p: 1.25,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1
                  }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box sx={{
                          width: 18,
                          height: 18,
                          borderRadius: "4px",
                          bgcolor: w.bgColor,
                          color: w.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <FaClipboardCheck size={9} />
                        </Box>
                        <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: COLORS.text }}>
                          {w.status}
                        </Typography>
                      </Box>
                      <Chip
                        label={w.percent.toFixed(0) + "% Left"}
                        size="small"
                        sx={{
                          height: 14,
                          fontSize: 7.5,
                          fontWeight: 700,
                          bgcolor: w.bgColor,
                          color: w.color,
                          borderRadius: "3px"
                        }}
                      />
                    </Box>

                    {/* Visual Progress Bar */}
                    <Box sx={{
                      width: "100%",
                      height: 5,
                      bgcolor: "#e2e8f0",
                      borderRadius: 3,
                      overflow: "hidden"
                    }}>
                      <Box sx={{
                        width: `${w.percent}%`,
                        height: "100%",
                        bgcolor: w.color,
                        borderRadius: 3,
                        transition: "width 0.5s ease-in-out"
                      }} />
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "8.5px", color: COLORS.textMuted, mt: 0.25 }}>
                      <Typography fontSize="inherit">Remaining:</Typography>
                      <Typography fontSize="inherit" fontWeight={700} sx={{ color: w.color }}>{w.text}</Typography>
                    </Box>
                  </Box>
                );
              })()}
            </Box>

            {/* Value Retention / Depreciation Section */}
            {(() => {
              const v = getValueRetentionInfo();
              if (!v) return null;
              return (
                <>
                  <Divider sx={{ my: 1.25, borderColor: COLORS.borderLight }} />
                  <Box sx={{ width: "100%" }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
                      Value Retention
                    </Typography>
                    <Box sx={{ 
                      p: 1.25, 
                      bgcolor: "#f8fafc", 
                      border: "1px solid #e2e8f0", 
                      borderRadius: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1
                    }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: COLORS.text }}>
                          Retained Value
                        </Typography>
                        <Chip 
                          label={v.percent.toFixed(0) + "% Retained"} 
                          size="small" 
                          sx={{ 
                            height: 14, 
                            fontSize: 7.5, 
                            fontWeight: 700, 
                            bgcolor: "rgba(14, 165, 233, 0.1)", 
                            color: "#0ea5e9",
                            borderRadius: "3px" 
                          }} 
                        />
                      </Box>
                      
                      {/* Visual Progress Bar */}
                      <Box sx={{ 
                        width: "100%", 
                        height: 5, 
                        bgcolor: "#e2e8f0", 
                        borderRadius: 3, 
                        overflow: "hidden"
                      }}>
                        <Box sx={{ 
                          width: `${v.percent}%`, 
                          height: "100%", 
                          bgcolor: "#0ea5e9", 
                          borderRadius: 3,
                          transition: "width 0.5s ease-in-out" 
                        }} />
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "8.5px", color: COLORS.textMuted, mt: 0.25 }}>
                        <Typography fontSize="inherit">Acquisition Cost:</Typography>
                        <Typography fontSize="inherit" fontWeight={700}>{v.costText}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "8.5px", color: COLORS.textMuted }}>
                        <Typography fontSize="inherit">Depreciated Loss:</Typography>
                        <Typography fontSize="inherit" fontWeight={700} sx={{ color: "#ef4444" }}>-{v.depreciatedPercent.toFixed(0)}% ({v.depreciatedText})</Typography>
                      </Box>
                    </Box>
                  </Box>
                </>
              );
            })()}
          </Box>

          {/* RIGHT PANEL: Unified Spec Sheet & History */}
          <Box sx={{
            flex: 1,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "4px",
            p: 1.5,
          }}>
            {/* Section 1: Specifications */}
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Asset Information</Typography>
            <Table size="small" sx={{ mb: 2, border: "1px solid " + COLORS.borderLight }}>
              <TableBody>
                <TableRow sx={{ background: "#fcfcfd" }}>
                  <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "20%" }}>Serial Number</TableCell>
                  <TableCell sx={denseCellSx}>{data.serialNumber || "—"}</TableCell>
                  <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "20%" }}>Brand</TableCell>
                  <TableCell sx={denseCellSx}>{data.brand || "—"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted }}>Model</TableCell>
                  <TableCell sx={denseCellSx}>{data.model || "—"}</TableCell>
                  <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted }}>Type</TableCell>
                  <TableCell sx={denseCellSx}>{data.typeName || data.assetType?.typeName || "—"}</TableCell>
                </TableRow>
                <TableRow sx={{ background: "#fcfcfd" }}>
                  <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted }}>Current Location</TableCell>
                  <TableCell sx={denseCellSx} colSpan={3}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                      <FaMapMarkerAlt size={9} color={COLORS.primary} />
                      <Typography component="span" sx={{ fontSize: 11, fontWeight: 600, color: COLORS.text }}>
                        {data.locationName || "—"}
                      </Typography>
                      {data.latitude !== null && data.longitude !== null && data.latitude !== undefined && (
                        <Typography component="span" sx={{ fontSize: 9.5, color: COLORS.textMuted, fontFamily: "monospace", ml: 1, bgcolor: "#f1f5f9", px: 0.75, py: 0.25, borderRadius: "3px" }}>
                          GPS: {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Section 2: Acquisition & Company details */}
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Financials & Ownership</Typography>
            <Table size="small" sx={{ mb: 2, border: "1px solid " + COLORS.borderLight }}>
              <TableBody>
                <TableRow sx={{ background: "#fcfcfd" }}>
                  <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "20%" }}>Purchase Cost</TableCell>
                  <TableCell sx={denseCellSx}>{data.cost ? "₹" + data.cost : "—"}</TableCell>
                  <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "20%" }}>Purchase Date</TableCell>
                  <TableCell sx={denseCellSx}>{data.purchaseDate ? new Date(data.purchaseDate).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted }}>Warranty Expiry</TableCell>
                  <TableCell sx={denseCellSx}>{data.warrantyExpiry ? new Date(data.warrantyExpiry).toLocaleDateString() : "—"}</TableCell>
                  <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted }}>Company</TableCell>
                  <TableCell sx={denseCellSx}>{data.companyName || "—"}</TableCell>
                </TableRow>
                <TableRow sx={{ background: "#fcfcfd" }}>
                  <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted }}>Depreciation Rate</TableCell>
                  <TableCell sx={denseCellSx}>{data.depreciationRate ? data.depreciationRate + "% / year" : "20% / year"}</TableCell>
                  <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted }}>Current Net Value</TableCell>
                  <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: "#0284c7" }}>
                    {data.currentValue ? "₹" + data.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Section 3: Notes */}
            {data.notes && (
              <>
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes / Remarks</Typography>
                <Box sx={{ p: 1, border: "1px solid " + COLORS.borderLight, borderRadius: "3px", background: "#fcfcfd", mb: 2 }}>
                  <Typography sx={{ fontSize: 10.5, color: COLORS.text, whiteSpace: "pre-line" }}>{data.notes}</Typography>
                </Box>
              </>
            )}

            {/* Section: Live Location Map */}
            {data.latitude != null && data.longitude != null && (
              <>
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Live Location Map</Typography>
                <Box sx={{
                  width: "100%",
                  height: 180,
                  border: "1px solid " + COLORS.borderLight,
                  borderRadius: "4px",
                  overflow: "hidden",
                  mb: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  background: "#f1f5f9",
                  position: "relative"
                }}>
                  <iframe
                    title="Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://maps.google.com/maps?q=${data.latitude},${data.longitude}&z=15&output=embed`}
                    style={{ border: 0 }}
                  />
                </Box>
              </>
            )}

            {/* Section 4: History Timeline */}
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.primary, mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Unified Activity & Lifecycle Timeline</Typography>
            {activityLogs.length === 0 ? (
              <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, fontStyle: "italic", p: 1.25, border: "1px solid " + COLORS.borderLight, borderRadius: "3px", textAlign: "center" }}>No activity history found.</Typography>
            ) : (
              <Box sx={{
                maxHeight: 240,
                overflowY: "auto",
                pl: 1,
                pr: 1.5,
                mr: -1,
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "#f1f5f9",
                  borderRadius: "3px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "#cbd5e1",
                  borderRadius: "3px",
                  "&:hover": {
                    background: "#94a3b8",
                  }
                }
              }}>
                <Box sx={{ position: "relative", pl: 3, borderLeft: `2px solid ${COLORS.borderLight}`, ml: 1.5, display: "flex", flexDirection: "column", gap: 2, py: 1 }}>
                  {activityLogs.map((item, idx) => {
                    let icon = <FaHistory size={9} />;
                    let bg = "#f1f5f9";
                    let borderClr = "#cbd5e1";
                    let textClr = "#64748b";

                    if (item.action === "ALLOCATED") {
                      icon = <FaUser size={9} />;
                      bg = "rgba(37, 99, 235, 0.1)";
                      borderClr = "#2563eb";
                      textClr = "#2563eb";
                    } else if (item.action === "RETURNED") {
                      icon = <FaExchangeAlt size={9} />;
                      bg = "rgba(16, 185, 129, 0.1)";
                      borderClr = "#10b981";
                      textClr = "#10b981";
                    } else if (item.action === "TRANSFERRED") {
                      icon = <FaMapMarkerAlt size={9} />;
                      bg = "rgba(139, 92, 246, 0.1)";
                      borderClr = "#8b5cf6";
                      textClr = "#8b5cf6";
                    } else if (item.action === "AUDITED") {
                      icon = <FaClipboardCheck size={9} />;
                      bg = "rgba(217, 119, 6, 0.1)";
                      borderClr = "#d97706";
                      textClr = "#d97706";
                    } else if (item.action === "MAINTENANCE" || item.action === "MAINTENANCE_START" || item.action === "MAINTENANCE_END") {
                      icon = <FaWrench size={9} />;
                      bg = "rgba(239, 68, 68, 0.1)";
                      borderClr = "#ef4444";
                      textClr = "#ef4444";
                    } else if (item.action === "DISPOSED") {
                      icon = <FaTrash size={9} />;
                      bg = "rgba(100, 116, 139, 0.1)";
                      borderClr = "#64748b";
                      textClr = "#64748b";
                    }

                    return (
                      <Box key={item.logId || idx} sx={{ position: "relative" }}>
                        {/* Timeline dot */}
                        <Box sx={{
                          position: "absolute",
                          left: -34,
                          top: 0,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: bg,
                          border: `2px solid ${borderClr}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 2,
                          color: textClr,
                        }}>
                          {icon}
                        </Box>
                        {/* Timeline card/content */}
                        <Box sx={{
                          background: idx === 0 ? "#f8faff" : "#fff",
                          border: `1px solid ${idx === 0 ? "#dbeafe" : COLORS.borderLight}`,
                          borderRadius: "4px",
                          p: 1,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                        }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 0.5 }}>
                            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: idx === 0 ? "#1e40af" : COLORS.text, textTransform: "uppercase" }}>
                              {item.action?.replace("_", " ")}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: COLORS.textMuted }}>
                              <FaCalendarAlt size={8} />
                              <Typography sx={{ fontSize: 8.5, fontWeight: 500 }}>
                                {item.actionDate ? new Date(item.actionDate).toLocaleString() : "—"}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "#f1f5f9", px: 0.5, py: 0.15, borderRadius: "3px" }}>
                              <FaUser size={7} color="#64748b" />
                              <Typography sx={{ fontSize: 8.5, fontWeight: 600, color: "#475569" }}>
                                {item.actionBy || "System"}
                              </Typography>
                            </Box>
                            {idx === 0 && (
                              <Chip label="Latest Event" size="small" sx={{ height: 14, fontSize: 8, fontWeight: 700, bgcolor: "#dbeafe", color: "#1e40af" }} />
                            )}
                          </Box>
                          {item.details && (
                            <Typography sx={{ fontSize: 9.5, color: COLORS.textMuted, borderLeft: "2px solid #cbd5e1", pl: 0.75, py: 0.15 }}>
                              {item.details}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* System Metadata */}
            <Box sx={{ mt: 2.5, display: "flex", justifyContent: "space-between", color: COLORS.textFaint, fontSize: "9px" }}>
              <Typography sx={{ fontSize: "inherit" }}>System Created: {data.createdAt ? new Date(data.createdAt).toLocaleString() : "—"}</Typography>
              <Typography sx={{ fontSize: "inherit" }}>Last Modified: {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "—"}</Typography>
            </Box>
          </Box>

        </Box>
      </Box>

      {/* ── Transfer Asset Dialog ── */}
      <Dialog open={transferOpen} onClose={() => { if (!transferSaving) { setTransferOpen(false); transferForm.reset(); } }} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: "6px" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1, borderBottom: "1px solid " + COLORS.borderLight }}>
          <Typography fontWeight={700} fontSize={13} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Transfer Asset</Typography>
          <IconButton size="small" onClick={() => { if (!transferSaving) { setTransferOpen(false); transferForm.reset(); } }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important", pb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 11, color: COLORS.textMuted, mb: 0.5 }}>Current Location</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{data.locationName || "Register"}</Typography>
          </Box>
          <FormTextField
            name="newLocation"
            control={transferForm.control}
            rules={{ required: "New location is required" }}
            label="New Location *"
            placeholder="Enter new location"
            disabled={transferSaving}
          />
          <FormTextField
            name="reason"
            control={transferForm.control}
            label="Reason"
            placeholder="Enter reason (optional)"
            multiline
            rows={2}
            disabled={transferSaving}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: "1px solid " + COLORS.borderLight, gap: 1 }}>
          <Button onClick={() => { setTransferOpen(false); transferForm.reset(); }} disabled={transferSaving} sx={outlinedBtnSx}>Cancel</Button>
          <Button
            variant="contained"
            onClick={transferForm.handleSubmit(handleTransfer)}
            disabled={transferSaving}
            startIcon={transferSaving ? <CircularProgress size={10} color="inherit" /> : <FaExchangeAlt size={10} />}
            sx={{ ...primaryBtnSx, background: COLORS.primary, "&:hover": { background: COLORS.primaryDark } }}
          >
            {transferSaving ? "Transferring..." : "Transfer"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
