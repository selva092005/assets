import { Table, TableHead, TableBody, TableRow, TableCell, Box, Typography, Avatar } from "@mui/material";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { COLORS, ROLE_COLORS } from "../../theme/tokens";
import StatusPill from "../common/StatusPill";
import ActionBtn  from "../common/ActionBtn";

const HEADERS = ["User Name ↕", "User ID ↕", "Email ↕", "Role ↕", "Actions ↕"];

export default function UserTable({ users, loading, onView, onEdit, onDelete }) {
  return (
    <Table sx={{ minWidth: 600, fontSize: 13 }}>
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
          <TableRow><TableCell colSpan={5} sx={{ textAlign: "center", py: 5, color: "#aaa" }}>Loading...</TableCell></TableRow>
        ) : users.length > 0 ? users.map((item, i) => (
          <TableRow key={i} sx={{ borderBottom: `1px solid ${COLORS.borderLight}`, "&:hover": { background: "#fafbff" } }}>
            <TableCell sx={{ py: "12px", px: 2, color: "#333" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Avatar sx={{ width: 32, height: 32, background: COLORS.avatarBg, color: COLORS.avatarColor, fontWeight: 700, fontSize: 13 }}>
                  {(item.userName || "U")[0].toUpperCase()}
                </Avatar>
                <Typography sx={{ fontWeight: 500, fontSize: 13 }}>{item.userName}</Typography>
              </Box>
            </TableCell>
            <TableCell sx={{ py: "12px", px: 2, color: COLORS.textFaint, fontFamily: "monospace", fontSize: 13 }}>#{item.userId || item.id}</TableCell>
            <TableCell sx={{ py: "12px", px: 2, color: "#333", fontSize: 13 }}>{item.userEmail || "—"}</TableCell>
            <TableCell sx={{ py: "12px", px: 2 }}><StatusPill label={item.userRole} map={ROLE_COLORS} /></TableCell>
            <TableCell sx={{ py: "12px", px: 2, textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75 }}>
                <ActionBtn title="View"   color="#1976d2" hoverBg="#e3f2fd" onClick={() => onView(item)}><FaEye   size={13} /></ActionBtn>
                <ActionBtn title="Edit"   color="#f59e0b" hoverBg="#fffbeb" onClick={() => onEdit(item)}><FaEdit  size={13} /></ActionBtn>
                <ActionBtn title="Delete" color="#ef4444" hoverBg="#fef2f2" onClick={() => onDelete(item.userId || item.id)}><FaTrash size={13} /></ActionBtn>
              </Box>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow><TableCell colSpan={5} sx={{ textAlign: "center", py: 5, color: "#aaa" }}>No users found</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}
