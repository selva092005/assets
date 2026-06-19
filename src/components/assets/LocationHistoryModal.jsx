import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress,
} from "@mui/material";
import { FaTimes, FaHistory, FaMapMarkerAlt, FaArrowRight, FaUser } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getAssetHistory } from "../../services/location_history_service";
import { getAllocationsByAsset } from "../../services/allocation_service";
import { COLORS, outlinedBtnSx } from "../../theme/tokens";
import toast from "../../utils/toast.jsx";

function formatDateTime(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function formatOnlyDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function LocationHistoryModal({ open, asset, onClose }) {
  const [history, setHistory] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [activeTab, setActiveTab] = useState("location"); // "location" or "allocation"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !asset?.assetId) return;
    setLoading(true);

    Promise.all([
      getAssetHistory(asset.assetId),
      getAllocationsByAsset(asset.assetId)
    ])
      .then(([historyRes, allocationRes]) => {
        const hList = Array.isArray(historyRes?.data) ? historyRes.data : Array.isArray(historyRes) ? historyRes : [];
        const aList = Array.isArray(allocationRes?.data) ? allocationRes.data : Array.isArray(allocationRes) ? allocationRes : [];
        setHistory(hList);
        setAllocations(aList);
      })
      .catch(() => toast.error("Failed to load asset history"))
      .finally(() => setLoading(false));
  }, [open, asset?.assetId]);

  // Reset tab on close
  useEffect(() => {
    if (!open) {
      setActiveTab("location");
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
      slotProps={{ paper: { sx: { borderRadius: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", overflow: "hidden", p: 0 } } }}
    >
      {/* Title */}
      <DialogTitle
        sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          px: 2.5, py: 2,
          borderBottom: `1px solid ${COLORS.borderLight}`,
          background: COLORS.surface,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "9px", background: COLORS.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.primary, flexShrink: 0 }}>
            <FaHistory size={16} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 15, color: COLORS.text, lineHeight: 1.3 }}>
              Asset History Log
            </Typography>
            {asset?.assetName && (
              <Typography sx={{ fontSize: 12, color: COLORS.textFaint, mt: 0.2 }}>
                {asset.assetName} · {asset.assetCode}
              </Typography>
            )}
          </Box>
        </Box>
        <Box onClick={onClose} sx={{ cursor: "pointer", color: COLORS.textFaint, p: 0.5, borderRadius: "6px", "&:hover": { color: COLORS.text, background: COLORS.bg }, transition: "all .15s" }}>
          <FaTimes size={15} />
        </Box>
      </DialogTitle>

      {/* Tabs Selector */}
      <Box sx={{ display: "flex", gap: 1, px: 2.5, py: 1.25, borderBottom: `1px solid ${COLORS.borderLight}`, background: "#f8fafc" }}>
        <Button
          size="small"
          variant={activeTab === "location" ? "contained" : "text"}
          onClick={() => setActiveTab("location")}
          sx={{
            fontSize: 10.5,
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "20px",
            px: 2,
            py: 0.5,
            boxShadow: activeTab === "location" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            bgcolor: activeTab === "location" ? COLORS.primary : "transparent",
            color: activeTab === "location" ? "#fff" : COLORS.textMuted,
            "&:hover": { bgcolor: activeTab === "location" ? COLORS.primary : "rgba(0,0,0,0.04)" }
          }}
        >
          Location Movements ({history.length})
        </Button>
        <Button
          size="small"
          variant={activeTab === "allocation" ? "contained" : "text"}
          onClick={() => setActiveTab("allocation")}
          sx={{
            fontSize: 10.5,
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "20px",
            px: 2,
            py: 0.5,
            boxShadow: activeTab === "allocation" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            bgcolor: activeTab === "allocation" ? COLORS.primary : "transparent",
            color: activeTab === "allocation" ? "#fff" : COLORS.textMuted,
            "&:hover": { bgcolor: activeTab === "allocation" ? COLORS.primary : "rgba(0,0,0,0.04)" }
          }}
        >
          Custody / Allocation History ({allocations.length})
        </Button>
      </Box>

      <DialogContent sx={{ p: 0, background: COLORS.bg, maxHeight: 480, overflowY: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : activeTab === "location" ? (
          history.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6, color: COLORS.textFaint, fontSize: 13 }}>
              No location history found for this asset.
            </Box>
          ) : (
            <Box sx={{ px: 2.5, py: 2, display: "flex", flexDirection: "column", gap: 0 }}>
              {history.map((h, idx) => (
                <Box
                  key={h.historyId}
                  sx={{
                    display: "flex", gap: 1.5, alignItems: "flex-start",
                    opacity: 0,
                    animation: `rowIn .35s cubic-bezier(.22,1,.36,1) ${idx * 60}ms both`,
                    "@keyframes rowIn": {
                      from: { opacity: 0, transform: "translateY(10px)" },
                      to: { opacity: 1, transform: "translateY(0)" },
                    },
                  }}
                >
                  {/* Timeline line + dot */}
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, pt: "2px" }}>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: idx === 0 ? COLORS.primary : COLORS.primaryLight,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `2px solid ${idx === 0 ? COLORS.primary : COLORS.primaryBorder}`,
                      flexShrink: 0,
                    }}>
                      <FaMapMarkerAlt size={11} color={idx === 0 ? "#fff" : COLORS.primary} />
                    </Box>
                    {idx < history.length - 1 && (
                      <Box sx={{ width: "2px", flex: 1, minHeight: 20, background: COLORS.borderLight, my: "3px" }} />
                    )}
                  </Box>

                  {/* Card */}
                  <Box sx={{
                    flex: 1, mb: idx < history.length - 1 ? 1.5 : 0,
                    background: COLORS.surface,
                    border: `1px solid ${idx === 0 ? COLORS.primaryBorder : COLORS.borderLight}`,
                    borderRadius: "10px",
                    px: 2, py: 1.5,
                  }}>
                    {/* From → To */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 0.75 }}>
                      <Typography sx={{ fontSize: 12, color: COLORS.textFaint, fontWeight: 500 }}>
                        {h.fromLocation || "—"}
                      </Typography>
                      <FaArrowRight size={10} color={COLORS.primary} />
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                        {h.toLocation}
                      </Typography>
                      {idx === 0 && (
                        <Box sx={{ ml: "auto", px: 1, py: "2px", background: "#e8f5e9", borderRadius: "20px" }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#2e7d32" }}>Current</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Meta row */}
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>
                        👤 {h.movedBy || "—"}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>
                        📅 {formatDateTime(h.movedAt)}
                      </Typography>
                      {h.reason && (
                        <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>
                          📝 {h.reason}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )
        ) : allocations.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, color: COLORS.textFaint, fontSize: 13 }}>
            No allocation history found for this asset.
          </Box>
        ) : (
          <Box sx={{ px: 2.5, py: 2, display: "flex", flexDirection: "column", gap: 0 }}>
            {allocations.map((h, idx) => (
              <Box
                key={h.allocationId}
                sx={{
                  display: "flex", gap: 1.5, alignItems: "flex-start",
                  opacity: 0,
                  animation: `rowIn .35s cubic-bezier(.22,1,.36,1) ${idx * 60}ms both`,
                  "@keyframes rowIn": {
                    from: { opacity: 0, transform: "translateY(10px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                {/* Timeline line + dot */}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, pt: "2px" }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: h.status === "ACTIVE" ? COLORS.primary : COLORS.primaryLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `2px solid ${h.status === "ACTIVE" ? COLORS.primary : COLORS.primaryBorder}`,
                    flexShrink: 0,
                  }}>
                    <FaUser size={10} color={h.status === "ACTIVE" ? "#fff" : COLORS.primary} />
                  </Box>
                  {idx < allocations.length - 1 && (
                    <Box sx={{ width: "2px", flex: 1, minHeight: 20, background: COLORS.borderLight, my: "3px" }} />
                  )}
                </Box>

                {/* Card */}
                <Box sx={{
                  flex: 1, mb: idx < allocations.length - 1 ? 1.5 : 0,
                  background: COLORS.surface,
                  border: `1px solid ${h.status === "ACTIVE" ? COLORS.primaryBorder : COLORS.borderLight}`,
                  borderRadius: "10px",
                  px: 2, py: 1.5,
                }}>
                  {/* Assigned to & status badge */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 0.75 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                      Assigned to: {h.assignedTo || "—"}
                    </Typography>
                    <Box sx={{
                      ml: "auto", px: 1, py: "2px",
                      background: h.status === "ACTIVE" ? "#e2f0d9" : "#f1f5f9",
                      border: `1px solid ${h.status === "ACTIVE" ? "#a9d18e" : "#cbd5e1"}`,
                      borderRadius: "20px"
                    }}>
                      <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: h.status === "ACTIVE" ? "#385723" : "#475569" }}>
                        {h.status || "—"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Details info */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>
                        👤 Assigned By: {h.assignedBy || "—"}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>
                        📅 Allocation Date: {formatOnlyDate(h.assignedDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>
                        ⏳ Expected Return: {formatOnlyDate(h.expectedReturnDate)}
                      </Typography>
                      {h.returnDate && (
                        <Typography sx={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
                          ✓ Returned Date: {formatOnlyDate(h.returnDate)}
                        </Typography>
                      )}
                    </Box>
                    {h.remarks && (
                      <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mt: 0.5, borderTop: "1px dashed #e2e8f0", pt: 0.5 }}>
                        📝 {h.remarks}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${COLORS.borderLight}`, background: COLORS.surface, justifyContent: "flex-end" }}>
        <Button onClick={onClose} variant="outlined" sx={outlinedBtnSx}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
