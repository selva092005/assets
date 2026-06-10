import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Chip, CircularProgress, Typography, IconButton, Divider, Modal, Table, TableBody, TableCell, TableRow, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useForm } from "react-hook-form";
import { FormTextField } from "../components/FormFields";
import { FaArrowLeft, FaEdit, FaBox, FaTrash, FaLayerGroup, FaPrint, FaMapMarkerAlt, FaExchangeAlt, FaTimes } from "react-icons/fa";
import { useSelector } from "react-redux";
import toast from "../utils/toast.jsx";

import { getAssetById, getImageUrl } from "../services/assets_service";
import { getAssetHistory, moveAsset } from "../services/location_history_service";
import {
  COLORS,
  STATUS_COLORS,
  CONDITION_COLORS,
  outlinedBtnSx,
  primaryBtnSx,
  denseCellSx
} from "../theme/tokens";

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
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
        const [assetRes, historyRes] = await Promise.all([
          getAssetById(id),
          getAssetHistory(id).catch(() => [])
        ]);
        setData(assetRes.data ?? assetRes);
        setHistoryData(historyRes.data ?? historyRes ?? []);
      } catch (e) {
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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress size={20} />
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
      const [assetRes, historyRes] = await Promise.all([
        getAssetById(id),
        getAssetHistory(id).catch(() => [])
      ]);
      setData(assetRes.data ?? assetRes);
      setHistoryData(historyRes.data ?? historyRes ?? []);
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
      <Modal open={imgOpen} onClose={() => setImgOpen(false)} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box component="img" src={imageUrl} alt="asset" onClick={() => setImgOpen(false)} sx={{ width: 360, height: 280, objectFit: "contain", borderRadius: 1, background: "#fff", boxShadow: 12, cursor: "zoom-out", outline: "none" }} />
      </Modal>

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
            height: "fit-content",
          }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              {/* Compact Image */}
              <Box onClick={() => imageUrl && setImgOpen(true)} sx={{
                width: 60, height: 60, borderRadius: "4px", border: "1px solid " + COLORS.borderLight,
                background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", mb: 1,
                cursor: imageUrl ? "zoom-in" : "default"
              }}>
                {imageUrl ? (
                  <img src={imageUrl} alt="asset" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <FaBox size={18} color={COLORS.textFaint} />
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
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75, mb: 1.5 }}>
                  <Box sx={{ width: 50, height: 50, p: 0.5, border: "1px solid " + COLORS.borderLight, background: "#fff", borderRadius: "3px" }}>
                    <img src={"data:image/png;base64," + data.qrCode} alt="QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </Box>
                  <Button variant="outlined" size="small" startIcon={<FaPrint size={8} />} onClick={handlePrintQR} sx={{ ...outlinedBtnSx, color: COLORS.textMuted, borderColor: COLORS.border }}>Print</Button>
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <FaMapMarkerAlt size={9} color={COLORS.primary} />
                      {data.locationName || "—"}
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

            {/* Section 4: History Table */}
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Allocation / Movement History</Typography>
            {historyData.length === 0 ? (
              <Typography sx={{ fontSize: 10.5, color: COLORS.textMuted, fontStyle: "italic", p: 1.25, border: "1px solid " + COLORS.borderLight, borderRadius: "3px", textAlign: "center" }}>No movement history found.</Typography>
            ) : (
              <Table size="small" sx={{ border: "1px solid " + COLORS.borderLight }}>
                <TableBody>
                  <TableRow sx={{ background: "#f1f5f9" }}>
                    <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: "#475569" }}>Moved At</TableCell>
                    <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: "#475569" }}>From → To</TableCell>
                    <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: "#475569" }}>Moved By</TableCell>
                    <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: "#475569" }}>Reason</TableCell>
                  </TableRow>
                  {historyData.map((item, idx) => (
                    <TableRow key={idx} sx={{ "&:nth-of-type(even)": { background: "#fcfcfd" } }}>
                      <TableCell sx={denseCellSx}>{item.movedAt ? new Date(item.movedAt).toLocaleString() : "—"}</TableCell>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 600 }}>
                        {item.fromLocationName || item.fromLocation || "Register"} → {item.toLocationName || item.toLocation || item.locationName}
                      </TableCell>
                      <TableCell sx={denseCellSx}>{item.movedByName || item.movedBy || "System"}</TableCell>
                      <TableCell sx={denseCellSx}>{item.reason || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
