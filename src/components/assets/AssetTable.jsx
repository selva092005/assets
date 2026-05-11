import { Table, TableHead, TableBody, TableRow, TableCell, Box, Typography, Avatar } from "@mui/material";
import { FaEye, FaEdit, FaTrash, FaQrcode } from "react-icons/fa";
import { COLORS, STATUS_COLORS, CONDITION_COLORS } from "../../theme/tokens";
import StatusPill from "../common/StatusPill";
import ActionBtn  from "../common/ActionBtn";

const HEADERS = ["Asset Name ↕", "Asset Code ↕", "Asset ID ↕", "Value ↕", "Type ↕", "Location ↕", "Status ↕", "Condition ↕", "Actions ↕"];

export default function AssetTable({ assets, loading, canWrite = true, onView, onEdit, onDelete, onQR }) {
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
        ) : assets.length > 0 ? assets.map((item, i) => (
          <TableRow key={i} sx={{ borderBottom: `1px solid ${COLORS.borderLight}`, "&:hover": { background: "#fafbff" } }}>
            <TableCell sx={{ py: "12px", px: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Avatar sx={{ width: 32, height: 32, background: COLORS.avatarBg, color: COLORS.avatarColor, fontWeight: 700, fontSize: 13 }}>
                  {(item.assetName || "A")[0].toUpperCase()}
                </Avatar>
                <Typography sx={{ fontWeight: 500, fontSize: 13 }}>{item.assetName}</Typography>
              </Box>
            </TableCell>
            <TableCell sx={{ py: "12px", px: 2, color: COLORS.textFaint, fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>{item.assetCode || "—"}</TableCell>
            <TableCell sx={{ py: "12px", px: 2, color: COLORS.textFaint, fontFamily: "monospace", fontSize: 13 }}>#{item.assetId}</TableCell>
            <TableCell sx={{ py: "12px", px: 2, color: "#333", fontSize: 13 }}>₹{item.cost || "—"}</TableCell>
            <TableCell sx={{ py: "12px", px: 2, color: "#333", fontSize: 13 }}>{item.typeName || item.assetType?.typeName || "—"}</TableCell>
            <TableCell sx={{ py: "12px", px: 2, color: COLORS.textMuted, fontSize: 13 }}>{item.locationName || "—"}</TableCell>
            <TableCell sx={{ py: "12px", px: 2 }}><StatusPill label={item.status} map={STATUS_COLORS} /></TableCell>
            <TableCell sx={{ py: "12px", px: 2 }}><StatusPill label={item.assetCondition} map={CONDITION_COLORS} /></TableCell>
            <TableCell sx={{ py: "12px", px: 2, textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75 }}>
                <ActionBtn title="View"   color="#1976d2" hoverBg="#e3f2fd" onClick={() => onView(item)}><FaEye     size={13} /></ActionBtn>
                <ActionBtn title="QR Code" color="#7c3aed" hoverBg="#ede9fe" onClick={() => onQR(item)}><FaQrcode  size={13} /></ActionBtn>
                {canWrite && <ActionBtn title="Edit"   color="#f59e0b" hoverBg="#fffbeb" onClick={() => onEdit(item)}><FaEdit    size={13} /></ActionBtn>}
                {canWrite && <ActionBtn title="Delete" color="#ef4444" hoverBg="#fef2f2" onClick={() => onDelete(item.assetId)}><FaTrash  size={13} /></ActionBtn>}
              </Box>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow><TableCell colSpan={9} sx={{ textAlign: "center", py: 5, color: "#aaa" }}>No assets found</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}
