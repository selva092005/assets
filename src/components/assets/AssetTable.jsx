import { Table, TableHead, TableBody, TableRow, TableCell, Box, Typography, Avatar, Tooltip, Chip } from "@mui/material";
import { FaEye, FaEdit, FaTrash, FaQrcode, FaHistory, FaExchangeAlt, FaLock, FaBoxes, FaBarcode } from "react-icons/fa";
import { COLORS, STATUS_COLORS, CONDITION_COLORS } from "../../theme/tokens";
import { getImageUrl } from "../../services/assets_service";
import StatusPill from "../common/StatusPill";
import ActionBtn from "../common/ActionBtn";

const HEADERS = ["ID", "Asset Name", "Asset Code", "Value", "Type", "Location", "Company", "Status", "Condition", "Actions"];

export default function AssetTable({ assets, loading, userRole = "user", onView, onEdit, onDelete, onQR, onHistory, onMove }) {
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";
  const canMove = userRole === "admin" || userRole === "manager";

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
            {HEADERS.map((h) => (
              <TableCell key={h} sx={{
                fontWeight: 700,
                color: "#64748b",
                background: "#f8fafc",
                borderBottom: "2px solid #e2e8f0",
                whiteSpace: "nowrap",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={10} sx={{ border: 0, py: 8, textAlign: "center" }}>
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
            const isMoveDisabled = isDisposed || item.status?.toUpperCase() === "DAMAGED";

            const imageUrl = getImageUrl(item.imagePath);

            return (
              <TableRow key={i} sx={{
                opacity: isDisposed ? 0.5 : 1,
                animation: `fadeUp 250ms ease both`,
                animationDelay: `${i * 40}ms`,
                borderLeft: "3px solid transparent",
                transition: "border-color 180ms ease, background 180ms ease",
                "&:hover": {
                  borderLeft: "3px solid #3b82f6",
                  background: "#f0f7ff",
                },
                "& td": {
                  background: isDisposed ? "#fff5f5" : "transparent",
                  borderBottom: "1px solid #f1f5f9",
                },
              }}>

                <TableCell sx={{ verticalAlign: "middle", fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>
                  {String(i + 1).padStart(2, "0")}
                </TableCell>

                <TableCell sx={{ verticalAlign: "middle" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      src={imageUrl}
                      imgProps={{ style: { objectFit: "cover" } }}
                      sx={{
                        width: 24, height: 24, fontSize: 10, fontWeight: 700, flexShrink: 0,
                        bgcolor: isDisposed ? "#fee2e2" : "#eff6ff",
                        color: isDisposed ? "#ef4444" : "#2563eb",
                        border: isDisposed ? "1.5px solid #fecaca" : "1.5px solid #bfdbfe",
                      }}
                    >
                      {(item.assetName || "A")[0].toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", lineHeight: 1.25 }}>
                        {item.assetName}
                      </Typography>
                      {isDisposed
                        ? <Typography sx={{ fontSize: 9, color: "#ef4444", fontWeight: 500, lineHeight: 1 }}>Permanently Disposed</Typography>
                        : <Typography sx={{ fontSize: 9, color: "#94a3b8", lineHeight: 1 }}>#{item.assetId}</Typography>
                      }
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
                <TableCell sx={{ verticalAlign: "middle", fontSize: 11, color: "#475569" }}>
                  {item.locationName || "—"}
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

                    {canMove && (
                      <Tooltip title={isMoveDisabled ? (isDisposed ? "Cannot move a disposed asset" : "Cannot move a damaged asset") : "Move Asset"} arrow>
                        <span>
                          <ActionBtn color="#059669" hoverBg="#f0fdf4" onClick={() => !isMoveDisabled && onMove(item)} disabled={isMoveDisabled}>
                            <FaExchangeAlt size={11} />
                          </ActionBtn>
                        </span>
                      </Tooltip>
                    )}

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
                      <ActionBtn title="Delete" color="#ef4444" hoverBg="#fff1f2" onClick={() => onDelete(item.assetId)}>
                        <FaTrash size={11} />
                      </ActionBtn>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={10} sx={{ border: 0 }}>
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
    </Box>
  );
}
