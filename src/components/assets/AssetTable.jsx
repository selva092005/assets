import { Table, TableHead, TableBody, TableRow, TableCell, Box, Typography, Avatar, Tooltip } from "@mui/material";
import { FaEye, FaEdit, FaTrash, FaQrcode, FaHistory, FaExchangeAlt, FaLock } from "react-icons/fa";
import { COLORS, STATUS_COLORS, CONDITION_COLORS } from "../../theme/tokens";
import StatusPill from "../common/StatusPill";
import ActionBtn  from "../common/ActionBtn";

const HEADERS = ["Asset ID ↕", "Asset Name ↕", "Asset Code ↕", "Value ↕", "Type ↕", "Location ↕", "Company ↕", "Status ↕", "Condition ↕", "Actions ↕"];

export default function AssetTable({ assets, loading, userRole = "user", onView, onEdit, onDelete, onQR, onHistory, onMove }) {
  const canEdit   = userRole === "admin" || userRole === "manager"; // admin + manager
  const canDelete = userRole === "admin";                           // admin only
  const canMove   = userRole === "admin" || userRole === "manager"; // admin + manager
  return (
    <Table sx={{ minWidth: 900, fontSize: 13 }}>
      <TableHead>
        <TableRow sx={{ background: "#f8f9fc" }}>
          {HEADERS.map((h) => (
            <TableCell key={h} sx={{ py: "12px", px: 2, fontSize: 12, fontWeight: 600, color: COLORS.textFaint, whiteSpace: "nowrap", borderBottom: `1px solid ${COLORS.borderLight}` }}>
              {h}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={9} sx={{ textAlign: "center", py: 5, color: "#aaa" }}>Loading...</TableCell></TableRow>
        ) : assets.length > 0 ? assets.map((item, i) => {
          const isDisposed  = item.status?.toUpperCase() === "DISPOSED";
          const isAssigned  = item.status?.toUpperCase() === "ASSIGNED";
          const isMoveDisabled = isDisposed || item.status?.toUpperCase() === "DAMAGED";
          const isEditDisabled = isDisposed || isAssigned;
          return (
            <TableRow
              key={i}
              sx={{
                borderBottom: `1px solid ${COLORS.borderLight}`,
                opacity: isDisposed ? 0.6 : 1,
                background: isDisposed ? "#fdf2f2" : "transparent",
                "&:hover": { background: isDisposed ? "#fde8e8" : "#fafbff" },
              }}
            >
              <TableCell sx={{ py: "12px", px: 2, color: COLORS.textFaint, fontFamily: "monospace", fontSize: 13 }}>#{item.assetId}</TableCell>
              <TableCell sx={{ py: "12px", px: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Avatar sx={{ width: 32, height: 32, background: isDisposed ? "#f3c6c6" : COLORS.avatarBg, color: isDisposed ? "#c0392b" : COLORS.avatarColor, fontWeight: 700, fontSize: 13 }}>
                    {(item.assetName || "A")[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: 13 }}>{item.assetName}</Typography>
                    {isDisposed && (
                      <Typography sx={{ fontSize: 11, color: "#e53935", fontWeight: 500 }}>Permanently Disposed</Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>
              <TableCell sx={{ py: "12px", px: 2, color: COLORS.textFaint, fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>{item.assetCode || "—"}</TableCell>
              <TableCell sx={{ py: "12px", px: 2, color: "#333", fontSize: 13 }}>₹{item.cost || "—"}</TableCell>
              <TableCell sx={{ py: "12px", px: 2, color: "#333", fontSize: 13 }}>{item.typeName || item.assetType?.typeName || "—"}</TableCell>
              <TableCell sx={{ py: "12px", px: 2, color: COLORS.textMuted, fontSize: 13 }}>{item.locationName || "—"}</TableCell>
              <TableCell sx={{ py: "12px", px: 2, color: COLORS.textMuted, fontSize: 13 }}>{item.companyName || "—"}</TableCell>
              <TableCell sx={{ py: "12px", px: 2 }}><StatusPill label={item.status} map={STATUS_COLORS} /></TableCell>
              <TableCell sx={{ py: "12px", px: 2 }}><StatusPill label={item.assetCondition} map={CONDITION_COLORS} /></TableCell>
              <TableCell sx={{ py: "12px", px: 2, textAlign: "center" }}>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75 }}>

                  {/* View and QR always allowed */}
                  <ActionBtn title="View"    color="#1976d2" hoverBg="#e3f2fd" onClick={() => onView(item)}><FaEye      size={13} /></ActionBtn>
                  <ActionBtn title="QR Code" color="#7c3aed" hoverBg="#ede9fe" onClick={() => onQR(item)}><FaQrcode   size={13} /></ActionBtn>
                  <ActionBtn title="History" color="#0891b2" hoverBg="#e0f2fe" onClick={() => onHistory(item)}><FaHistory  size={13} /></ActionBtn>

                  {/* Move — manager + admin only */}
                  {canMove && (
                    <Tooltip title={isMoveDisabled ? (isDisposed ? "Cannot move a disposed asset" : "Cannot move a damaged asset") : "Move Asset"} arrow>
                      <span>
                        <ActionBtn
                          color="#10b981" hoverBg="#d1fae5"
                          onClick={() => !isMoveDisabled && onMove(item)}
                          disabled={isMoveDisabled}
                          sx={{ opacity: isMoveDisabled ? 0.35 : 1, cursor: isMoveDisabled ? "not-allowed" : "pointer" }}
                        >
                          <FaExchangeAlt size={13} />
                        </ActionBtn>
                      </span>
                    </Tooltip>
                  )}

                  {/* Edit — manager + admin only, disabled for disposed */}
                  {canEdit && (
                    isAssigned ? (
                      <Tooltip
                        arrow
                        placement="top"
                        title={
                          <Box sx={{ p: 0.5 }}>
                            <Typography fontSize={12} fontWeight={700} color="#fff" mb={0.25}>Locked — In Use</Typography>
                            <Typography fontSize={11} color="rgba(255,255,255,0.75)">Return from Allocation page to edit</Typography>
                          </Box>
                        }
                      >
                        <span>
                          <Box sx={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 30, height: 30,
                            borderRadius: "6px",
                            border: "1.5px solid #94a3b8",
                            background: "transparent",
                            color: "#94a3b8",
                            cursor: "not-allowed",
                            flexShrink: 0,
                          }}>
                            <FaLock size={11} />
                          </Box>
                        </span>
                      </Tooltip>
                    ) : (
                      <Tooltip title={isDisposed ? "Cannot edit a disposed asset" : "Edit"} arrow>
                        <span>
                          <ActionBtn
                            color="#f59e0b" hoverBg="#fffbeb"
                            onClick={() => !isDisposed && onEdit(item)}
                            disabled={isDisposed}
                            sx={{ opacity: isDisposed ? 0.35 : 1, cursor: isDisposed ? "not-allowed" : "pointer" }}
                          >
                            <FaEdit size={13} />
                          </ActionBtn>
                        </span>
                      </Tooltip>
                    )
                  )}

                  {/* Delete — manager only */}
                  {canDelete && (
                    <ActionBtn title="Delete" color="#ef4444" hoverBg="#fef2f2" onClick={() => onDelete(item.assetId)}>
                      <FaTrash size={13} />
                    </ActionBtn>
                  )}

                </Box>
              </TableCell>
            </TableRow>
          );
        }) : (
          <TableRow><TableCell colSpan={9} sx={{ textAlign: "center", py: 5, color: "#aaa" }}>No assets found</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}