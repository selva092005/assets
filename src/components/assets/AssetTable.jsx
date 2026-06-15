import { useState } from "react";
import { Table, TableHead, TableBody, TableRow, TableCell, Box, Typography, Avatar, Tooltip, Chip, Checkbox } from "@mui/material";
import { FaEye, FaEdit, FaTrash, FaQrcode, FaHistory, FaLock, FaBoxes } from "react-icons/fa";
import { COLORS, STATUS_COLORS, CONDITION_COLORS } from "../../theme/tokens";
import { getImageUrl } from "../../services/assets_service";
import StatusPill from "../common/StatusPill";
import ActionBtn from "../common/ActionBtn";
import ImagePreviewDialog from "../common/ImagePreviewDialog";

const HEADERS = ["#", "Asset Name", "Asset Code", "Value", "Type", "Location", "Company", "Status", "Condition", "Actions"];

const CustomCheckboxIcon = () => (
  <Box sx={{
    width: 14,
    height: 14,
    borderRadius: "3px",
    border: "1.2px solid #cbd5e1",
    bgcolor: "#ffffff",
    transition: "all 120ms cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      borderColor: "#94a3b8",
      bgcolor: "#f8fafc",
    }
  }} />
);

const CustomCheckboxCheckedIcon = () => (
  <Box sx={{
    width: 14,
    height: 14,
    borderRadius: "3px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "1.2px solid #2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 3px rgba(37, 99, 235, 0.25)",
    color: "#ffffff",
    transform: "scale(1.05)",
    transition: "all 150ms cubic-bezier(0.175, 0.885, 0.32, 1.15)"
  }}>
    <svg width="7" height="7" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 4L3 5.5L6.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Box>
);

const CustomCheckboxIndeterminateIcon = () => (
  <Box sx={{
    width: 14,
    height: 14,
    borderRadius: "3px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "1.2px solid #2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 3px rgba(37, 99, 235, 0.25)",
    color: "#ffffff",
    transform: "scale(1.05)",
    transition: "all 150ms cubic-bezier(0.175, 0.885, 0.32, 1.15)"
  }}>
    <Box sx={{ width: 6, height: 1.5, bgcolor: "#ffffff", borderRadius: "0.5px" }} />
  </Box>
);

export default function AssetTable({ assets, loading, userRole = "user", page = 0, pageSize = 10, onView, onEdit, onDelete, onQR, onHistory, selectedIds = [], onSelect, onSelectAll }) {
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";
  const canSelect = userRole === "admin" || userRole === "manager";

  const isSelectable = (item) => {
    const status = item?.status?.toUpperCase();
    return status === "AVAILABLE" || status === "UNDER_MAINTENANCE";
  };

  const selectableAssetsOnPage = assets
    .filter(isSelectable)
    .map((item) => item.assetId);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  return (
    <Box sx={{
      "@keyframes fadeUp": {
        from: { opacity: 0, transform: "translateY(10px)" },
        to: { opacity: 1, transform: "translateY(0)" },
      },
    }}>
      <Table sx={{ minWidth: 750, tableLayout: "auto", borderCollapse: "collapse" }}>

        {/* ── Header ── */}
        <TableHead>
          <TableRow>
            {canSelect && (
              <TableCell sx={{
                width: 40,
                p: "6px 8px",
                textAlign: "center",
                background: "#f8fafc",
                borderBottom: "2px solid #e2e8f0"
              }}>
                <Checkbox
                  size="small"
                  icon={<CustomCheckboxIcon />}
                  checkedIcon={<CustomCheckboxCheckedIcon />}
                  indeterminateIcon={<CustomCheckboxIndeterminateIcon />}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < selectableAssetsOnPage.length}
                  checked={selectableAssetsOnPage.length > 0 && selectableAssetsOnPage.every(id => selectedIds.includes(id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectAll(selectableAssetsOnPage);
                    } else {
                      onSelectAll([]);
                    }
                  }}
                  sx={{
                    p: 0.5,
                    "&.Mui-disabled": {
                      opacity: 0.45,
                      "& > div": {
                        border: "1.5px solid #e2e8f0",
                        bgcolor: "#f1f5f9",
                      }
                    }
                  }}
                />
              </TableCell>
            )}
            {HEADERS.map((h) => (
              <TableCell key={h} sx={{
                fontWeight: 700,
                color: "#64748b",
                background: "#f8fafc",
                borderBottom: "2px solid #e2e8f0",
                whiteSpace: "nowrap",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontSize: 11
              }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={canSelect ? 11 : 10} sx={{ border: 0, py: 8, textAlign: "center" }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: "50%", mx: "auto",
                  border: "3px solid #e2e8f0", borderTopColor: "#3b82f6",
                  animation: "spin 0.8s linear infinite",
                  "@keyframes spin": { to: { transform: "rotate(360deg)" } },
                }} />
                <Typography sx={{ mt: 2, color: "#94a3b8", fontSize: 12 }}>Loading…</Typography>
              </TableCell>
            </TableRow>
          ) : assets.length > 0 ? assets.map((item, i) => {
            const isDisposed = item.status?.toUpperCase() === "DISPOSED";
            const isAssigned = item.status?.toUpperCase() === "ASSIGNED";

            const isSelected = selectedIds.includes(item.assetId);
            const imageUrl = getImageUrl(item.imagePath);
            const globalIndex = page * pageSize + i + 1;

            return (
              <TableRow key={i} sx={{
                opacity: isDisposed ? 0.5 : 1,
                animation: `fadeUp 250ms ease both`,
                animationDelay: `${i * 40}ms`,
                borderLeft: isSelected ? `3px solid ${COLORS.primary}` : "3px solid transparent",
                background: isSelected ? "linear-gradient(90deg, rgba(37, 99, 235, 0.04) 0%, rgba(255, 255, 255, 0) 100%)" : "transparent",
                transition: "border-color 180ms ease, background 180ms ease",
                "&:hover": {
                  borderLeft: `3px solid ${COLORS.primary}`,
                  background: isSelected ? "linear-gradient(90deg, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0) 100%)" : "#f0f7ff",
                },
                "& td": {
                  background: isDisposed ? "#fff5f5" : isSelected ? "transparent" : "transparent",
                  borderBottom: "1px solid #f1f5f9",
                },
              }}>

                {canSelect && (
                  <TableCell sx={{ p: "4px 8px", textAlign: "center", verticalAlign: "middle" }}>
                    <Checkbox
                      size="small"
                      icon={<CustomCheckboxIcon />}
                      checkedIcon={<CustomCheckboxCheckedIcon />}
                      indeterminateIcon={<CustomCheckboxIndeterminateIcon />}
                      disabled={!isSelectable(item)}
                      checked={selectedIds.includes(item.assetId)}
                      onChange={() => onSelect(item.assetId)}
                      sx={{
                        p: 0.5,
                        "&.Mui-disabled": {
                          opacity: 0.45,
                          "& > div": {
                            border: "1.5px solid #e2e8f0",
                            bgcolor: "#f1f5f9",
                          }
                        }
                      }}
                    />
                  </TableCell>
                )}

                <TableCell sx={{ verticalAlign: "middle", fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>
                  {String(globalIndex).padStart(2, "0")}
                </TableCell>

                <TableCell sx={{ verticalAlign: "middle" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Box
                      onClick={() => imageUrl && (setPreviewSrc(imageUrl), setPreviewTitle(item.assetName), setPreviewOpen(true))}
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "6px",
                        flexShrink: 0,
                        cursor: imageUrl ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isDisposed ? "#fee2e2" : imageUrl ? "#f1f5f9" : "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                        color: isDisposed ? "#ef4444" : "#3b82f6",
                        border: "1px solid",
                        borderColor: isDisposed ? "#fecaca" : imageUrl ? "#cbd5e1" : "#bbdefb",
                        overflow: "hidden",
                        boxShadow: imageUrl ? "0 1px 3px rgba(15, 23, 42, 0.05)" : "none",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": imageUrl ? {
                          transform: "scale(1.18)",
                          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.18)",
                          borderColor: COLORS.primary,
                        } : {}
                      }}
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt="asset" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <FaBoxes size={11} color="#3b82f6" style={{ opacity: 0.8 }} />
                      )}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", lineHeight: 1.25 }}>
                        {item.assetName}
                      </Typography>
                      {isDisposed && (
                        <Typography sx={{ fontSize: 9, color: "#ef4444", fontWeight: 500, lineHeight: 1 }}>Permanently Disposed</Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>

                <TableCell sx={{ verticalAlign: "middle" }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: "#475569", fontFamily: "monospace" }}>
                    {item.assetCode || "—"}
                  </Typography>
                </TableCell>

                <TableCell sx={{ verticalAlign: "middle", fontSize: 11, fontWeight: 700, color: "#0f172a" }}>
                  ₹{item.cost || "—"}
                </TableCell>

                <TableCell sx={{ verticalAlign: "middle", fontSize: 11, color: "#475569" }}>
                  {item.typeName || item.assetType?.typeName || "—"}
                </TableCell>
                <TableCell sx={{ verticalAlign: "middle" }}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#475569", lineHeight: 1.25 }}>
                    {item.locationName || "—"}
                  </Typography>
                  {item.latitude !== null && item.longitude !== null && item.latitude !== undefined && (
                    <Typography sx={{ fontSize: 9, color: "#64748b", fontFamily: "monospace", mt: 0.15 }}>
                      {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ verticalAlign: "middle", fontSize: 11, color: "#475569" }}>
                  {item.companyName || "—"}
                </TableCell>

                <TableCell sx={{ verticalAlign: "middle" }}>
                  <StatusPill label={item.status} map={STATUS_COLORS} />
                </TableCell>
                <TableCell sx={{ verticalAlign: "middle" }}>
                  <StatusPill label={item.assetCondition} map={CONDITION_COLORS} />
                </TableCell>

                <TableCell sx={{ verticalAlign: "middle" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ActionBtn title="View" color="#2563eb" hoverBg="#eff6ff" onClick={() => onView(item)}><FaEye size={11} /></ActionBtn>
                    <ActionBtn title="QR Code" color="#7c3aed" hoverBg="#f5f3ff" onClick={() => onQR(item)}><FaQrcode size={11} /></ActionBtn>
                    <ActionBtn title="History" color="#0891b2" hoverBg="#f0f9ff" onClick={() => onHistory(item)}><FaHistory size={11} /></ActionBtn>

                    {canEdit && (
                      isAssigned ? (
                        <Tooltip arrow placement="top" title={
                          <Box sx={{ p: 0.5 }}>
                            <Typography fontSize={11} fontWeight={700} color="#fff" mb={0.25}>Locked — In Use</Typography>
                            <Typography fontSize={10} color="rgba(255,255,255,0.75)">Return from Allocation page to edit</Typography>
                          </Box>
                        }>
                          <span>
                            <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "6px", border: "1px solid #e2e8f0", color: "#cbd5e1", cursor: "not-allowed" }}>
                              <FaLock size={10} />
                            </Box>
                          </span>
                        </Tooltip>
                      ) : (
                        <Tooltip title={isDisposed ? "Cannot edit a disposed asset" : "Edit"} arrow>
                          <span>
                            <ActionBtn color="#d97706" hoverBg="#fffbeb" onClick={() => !isDisposed && onEdit(item)} disabled={isDisposed}>
                              <FaEdit size={11} />
                            </ActionBtn>
                          </span>
                        </Tooltip>
                      )
                    )}

                    {canDelete && (
                      isAssigned ? (
                        <Tooltip arrow placement="top" title={
                          <Box sx={{ p: 0.5 }}>
                            <Typography fontSize={11} fontWeight={700} color="#fff" mb={0.25}>Locked — Assigned</Typography>
                            <Typography fontSize={10} color="rgba(255,255,255,0.75)">Cannot delete an assigned asset. Return it first.</Typography>
                          </Box>
                        }>
                          <span>
                            <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "6px", border: "1px solid #e2e8f0", color: "#cbd5e1", cursor: "not-allowed" }}>
                              <FaLock size={10} />
                            </Box>
                          </span>
                        </Tooltip>
                      ) : (
                        <ActionBtn title="Delete" color="#ef4444" hoverBg="#fff1f2" onClick={() => onDelete(item.assetId)}>
                          <FaTrash size={11} />
                        </ActionBtn>
                      )
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={canSelect ? 11 : 10} sx={{ border: 0 }}>
                <Box sx={{ textAlign: "center", py: 8, animation: "fadeUp 300ms ease both" }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: "16px", bgcolor: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                    <FaBoxes size={28} color="#93c5fd" />
                  </Box>
                  <Typography sx={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>No assets found</Typography>
                  <Typography sx={{ color: "#94a3b8", fontSize: 12, mt: 0.5 }}>Try adjusting your filters</Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ImagePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={previewSrc}
        title={previewTitle}
      />
    </Box>
  );
}
