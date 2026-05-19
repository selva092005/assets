import { Box, Chip } from "@mui/material";
import { FaUser } from "react-icons/fa";
import { COLORS, ROLE_COLORS } from "../../theme/tokens";
import ViewModal from "../common/ViewModal";

const FIELDS = [
  ["User ID",    "userId"],
  ["Username",   "userName"],
  ["Email",      "userEmail"],
  ["Created At", "createdAt"],
  ["Updated At", "updatedAt"],
];

// Role → pill colors (re-use ROLE_COLORS from tokens, flatten the gradient to a flat bg)
const ROLE_PILL = {
  ADMIN:   { bg: "#dbeafe", color: "#1e3a8a" },
  MANAGER: { bg: "#fef3c7", color: "#92400e" },
  USER:    { bg: "#e0e7ff", color: "#3730a3" },
};

export default function UserView({ open, data, onClose }) {
  const name     = data?.userName || "";
  const initials = name.split(" ").map((w) => w[0]?.toUpperCase()).join("").slice(0, 2) || "?";
  const roleClr  = ROLE_PILL[data?.userRole] || { bg: "#f5f5f5", color: "#555" };

  // Role badge shown next to title
  const badge = data?.userRole ? (
    <Chip
      label={data.userRole}
      size="small"
      sx={{
        background: roleClr.bg, color: roleClr.color,
        fontWeight: 700, fontSize: 11, height: 20, borderRadius: "20px",
      }}
    />
  ) : null;

  // Initials avatar as icon
  const avatarIcon = (
    <Box
      sx={{
        width: 38, height: 38, borderRadius: "50%",
        background: COLORS.primaryLight,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: COLORS.primary,
        flexShrink: 0,
      }}
    >
      {initials}
    </Box>
  );

  return (
    <ViewModal
      open={open}
      title={name || "User Details"}
      subtitle={data?.userEmail}
      icon={avatarIcon}
      iconBg="transparent"
      badge={badge}
      data={data}
      fields={FIELDS}
      onClose={onClose}
    />
  );
}