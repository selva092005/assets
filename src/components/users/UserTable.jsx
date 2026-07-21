import { Box, Typography, Avatar, Tooltip } from "@mui/material";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { COLORS, ROLE_COLORS } from "../../theme/tokens";
import ActionBtn from "../common/ActionBtn";
import PremiumDataGrid from "../common/PremiumDataGrid";

export default function UserTable({
  users,
  loading,
  currentUserName,
  userRole = "manager",
  onView,
  onEdit,
  onDelete,
}) {
  const canManage = userRole === "admin"; // only admin can edit/delete users

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const columns = [
    {
      field: "userName",
      headerName: "User Name",
      sortable: true,
      renderCell: (item) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              background: COLORS.avatarBg,
              color: COLORS.avatarColor,
              fontWeight: 700,
              fontSize: 10,
            }}
          >
            {(item.userName || "U")[0].toUpperCase()}
          </Avatar>
          <Typography sx={{ fontWeight: 500, fontSize: 11 }}>{item.userName}</Typography>
        </Box>
      ),
    },
    {
      field: "employeeId",
      headerName: "Emp ID",
      sortable: true,
      fontFamily: "monospace",
      color: COLORS.textFaint,
      fontSize: 11,
      renderCell: (item) => item.employeeId || "—",
    },
    {
      field: "department",
      headerName: "Department",
      sortable: true,
      fontSize: 11,
      renderCell: (item) => item.department || "—",
    },
    {
      field: "designation",
      headerName: "Designation",
      sortable: true,
      fontSize: 11,
      renderCell: (item) => item.designation || "—",
    },
    {
      field: "userEmail",
      headerName: "Email",
      sortable: true,
      fontSize: 11,
      renderCell: (item) => item.userEmail || "—",
    },
    {
      field: "userRole",
      headerName: "Role",
      sortable: true,
      renderCell: (item) => (
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: ROLE_COLORS[item.userRole]?.color || COLORS.text,
          }}
        >
          {item.userRole}
        </Typography>
      ),
    },
    {
      field: "createdAt",
      headerName: "Joined Date",
      sortable: true,
      fontSize: 11,
      renderCell: (item) => formatDate(item.createdAt),
    },
    {
      field: "actions",
      headerName: "Actions",
      align: "center",
      renderCell: (item) => (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
          <ActionBtn title="View" color="#1976d2" hoverBg="#e3f2fd" onClick={() => onView(item)}>
            <FaEye size={11} />
          </ActionBtn>
          {canManage && (
            <ActionBtn title="Edit" color="#f59e0b" hoverBg="#fffbeb" onClick={() => onEdit(item)}>
              <FaEdit size={11} />
            </ActionBtn>
          )}
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
      ),
    },
  ];

  return (
    <PremiumDataGrid
      columns={columns}
      rows={users}
      loading={loading}
      rowIdField="userId"
      emptyMessage="No users found"
    />
  );
}
