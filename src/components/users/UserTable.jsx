import { Table, TableHead, TableBody, TableRow, TableCell, Box, Typography, Avatar, Tooltip } from "@mui/material";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { COLORS, ROLE_COLORS } from "../../theme/tokens";
import ActionBtn from "../common/ActionBtn";

const HEADERS = ["User Name ↕", "Emp ID ↕", "Department ↕", "Designation ↕", "Email ↕", "Role ↕", "Joined Date ↕", "Actions ↕"];

export default function UserTable({ users, loading, currentUserName, userRole = "manager", onView, onEdit, onDelete }) {
  const canManage = userRole === "admin"; // only admin can edit/delete users
  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <Table size="small" sx={{ minWidth: 900 }}>
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
              fontSize: 11
            }}>
              {h}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={8} sx={{ textAlign: "center", py: 5, color: "#aaa" }}>Loading...</TableCell></TableRow>
        ) : users.length > 0 ? users.map((item, i) => (
          <TableRow key={i} sx={{ borderBottom: `1px solid ${COLORS.borderLight}`, "&:hover": { background: "#fafbff" } }}>
            <TableCell sx={{ color: "#333" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, background: COLORS.avatarBg, color: COLORS.avatarColor, fontWeight: 700, fontSize: 10 }}>
                  {(item.userName || "U")[0].toUpperCase()}
                </Avatar>
                <Typography sx={{ fontWeight: 500, fontSize: 11 }}>{item.userName}</Typography>
              </Box>
            </TableCell>
            <TableCell sx={{ color: COLORS.textFaint, fontFamily: "monospace", fontSize: 11 }}>{item.employeeId || "—"}</TableCell>
            <TableCell sx={{ color: "#333", fontSize: 11 }}>{item.department || "—"}</TableCell>
            <TableCell sx={{ color: "#333", fontSize: 11 }}>{item.designation || "—"}</TableCell>
            <TableCell sx={{ color: "#333", fontSize: 11 }}>{item.userEmail || "—"}</TableCell>
            <TableCell><Typography sx={{ fontSize: 11, fontWeight: 600, color: ROLE_COLORS[item.userRole]?.color || COLORS.text }}>{item.userRole}</Typography></TableCell>
            <TableCell sx={{ fontSize: 11 }}>{formatDate(item.createdAt)}</TableCell>
            <TableCell sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                <ActionBtn title="View" color="#1976d2" hoverBg="#e3f2fd" onClick={() => onView(item)}><FaEye size={11} /></ActionBtn>
                {canManage && <ActionBtn title="Edit" color="#f59e0b" hoverBg="#fffbeb" onClick={() => onEdit(item)}><FaEdit size={11} /></ActionBtn>}
                {canManage && (
                  <Tooltip
                    title={
                      item.userName === currentUserName
                        ? "You cannot delete your own account"
                        : item.hasActiveAllocations
                        ? "Cannot delete user with active allocations. Return their assets first."
                        : "Delete user"
                    }
                    arrow
                  >
                    <span>
                      <ActionBtn
                        title="Delete"
                        color="#ef4444"
                        hoverBg="#fef2f2"
                        onClick={() =>
                          item.userName !== currentUserName &&
                          !item.hasActiveAllocations &&
                          onDelete(item.userId || item.id)
                        }
                        disabled={item.userName === currentUserName || item.hasActiveAllocations}
                      >
                        <FaTrash size={11} />
                      </ActionBtn>
                    </span>
                  </Tooltip>
                )}
              </Box>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow><TableCell colSpan={8} sx={{ textAlign: "center", py: 5, color: "#aaa" }}>No users found</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}
