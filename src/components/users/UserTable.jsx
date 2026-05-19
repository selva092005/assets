import { Table, TableHead, TableBody, TableRow, TableCell, Box, Typography, Avatar, Tooltip } from "@mui/material";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { COLORS, ROLE_COLORS } from "../../theme/tokens";
import ActionBtn  from "../common/ActionBtn";

const HEADERS = ["User Name ↕", "User ID ↕", "Email ↕", "Role ↕", "Created At ↕", "Actions ↕"];

export default function UserTable({ users, loading, currentUserName, userRole = "manager", onView, onEdit, onDelete }) {
  const canManage = userRole === "admin"; // only admin can edit/delete users
  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

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
          <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 5, color: "#aaa" }}>Loading...</TableCell></TableRow>
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
            <TableCell sx={{ py: "12px", px: 2 }}><Typography sx={{ fontSize: 13, fontWeight: 600, color: ROLE_COLORS[item.userRole]?.color || COLORS.text }}>{item.userRole}</Typography></TableCell>
            <TableCell sx={{ py: "12px", px: 2, fontSize: 13 }}>{formatDate(item.createdAt)}</TableCell>
            <TableCell sx={{ py: "12px", px: 2, textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75 }}>
                <ActionBtn title="View"   color="#1976d2" hoverBg="#e3f2fd" onClick={() => onView(item)}><FaEye   size={13} /></ActionBtn>
                {canManage && <ActionBtn title="Edit"   color="#f59e0b" hoverBg="#fffbeb" onClick={() => onEdit(item)}><FaEdit  size={13} /></ActionBtn>}
                {canManage && (
                <Tooltip title={item.userName === currentUserName ? "You cannot delete your own account" : "Delete user"} arrow>
                  <span>
                    <ActionBtn
                      title="Delete"
                      color="#ef4444"
                      hoverBg="#fef2f2"
                      onClick={() => item.userName !== currentUserName && onDelete(item.userId || item.id)}
                      disabled={item.userName === currentUserName}
                    >
                      <FaTrash size={13} />
                    </ActionBtn>
                  </span>
                </Tooltip>
                )}
              </Box>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 5, color: "#aaa" }}>No users found</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}
