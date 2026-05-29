import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Chip, CircularProgress, Typography, IconButton, Divider, Avatar, Table, TableBody, TableCell, TableRow } from "@mui/material";
import { FaArrowLeft, FaEdit, FaEnvelope } from "react-icons/fa";
import { useSelector } from "react-redux";
import toast from "../utils/toast.jsx";

import { getUserById } from "../services/users_service";
import {
  COLORS
} from "../theme/tokens";

const ROLE_PILL = {
  ADMIN: { bg: "#dbeafe", color: "#1e3a8a" },
  MANAGER: { bg: "#fef3c7", color: "#92400e" },
  USER: { bg: "#e0e7ff", color: "#3730a3" },
};

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userRole } = useSelector((s) => s.auth);

  const isAdmin = userRole === "admin";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserById(id);
        setData(res.data ?? res);
      } catch (e) {
        toast.error("Failed to load user details");
        navigate("/home/users");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (!data) return null;

  const roleClr = ROLE_PILL[data.userRole] || { bg: "#f5f5f5", color: "#555" };
  const initials = data.userName?.split(" ").map((w) => w[0]?.toUpperCase()).join("").slice(0, 2) || "?";

  const handleEdit = () => navigate("/home/users/edit/" + id);

  const denseCellSx = {
    py: 0.4,
    px: 0.75,
    fontSize: "10px",
    borderColor: COLORS.borderLight,
    lineHeight: 1.25,
  };

  return (
    <Box sx={{
      p: 0,
    }}>
      {/* Navigation header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <IconButton onClick={() => navigate("/home/users")} sx={{ p: 0.5, border: "1px solid " + COLORS.border, borderRadius: "4px" }}>
          <FaArrowLeft size={10} color={COLORS.textMuted} />
        </IconButton>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>User Detail Sheet</Typography>
      </Box>

      {/* Unified Two-Column Layout */}
      <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
        
        {/* LEFT PANEL: Summary Card */}
        <Box sx={{
          width: { xs: "100%", md: 220 },
          flexShrink: 0,
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "4px",
          p: 1.5,
          height: "fit-content",
        }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            {/* User Avatar */}
            <Avatar sx={{
              width: 60, height: 60, fontSize: 20, fontWeight: 800,
              background: COLORS.primaryLight, color: COLORS.primary,
              border: "2px solid " + COLORS.borderLight, mb: 1
            }}>
              {initials}
            </Avatar>

            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text, mb: 0.25 }}>
              {data.userName}
            </Typography>
            <Chip label={data.userRole} size="small" sx={{ height: 16, fontSize: 8, fontWeight: 700, borderRadius: "3px", background: roleClr.bg, color: roleClr.color, mb: 1.5, "& .MuiChip-label": { px: 1 } }} />

            <Divider sx={{ width: "100%", mb: 1.5, borderColor: COLORS.borderLight }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: COLORS.textMuted }}>
              <FaEnvelope size={10} />
              <Typography sx={{ fontSize: 11, fontWeight: 500 }}>{data.userEmail}</Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1.25, borderColor: COLORS.borderLight }} />

          {/* Quick Actions */}
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>Actions</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {isAdmin ? (
              <Button variant="outlined" size="small" startIcon={<FaEdit size={10} />} onClick={handleEdit} sx={{ fontSize: 10, py: "2px", textTransform: "none", borderRadius: "3px", color: COLORS.primary, borderColor: COLORS.primary, justifyContent: "flex-start" }}>
                Edit User
              </Button>
            ) : (
              <Typography sx={{ fontSize: 10, color: COLORS.textFaint, textAlign: "center", py: 0.5 }}>
                No actions available
              </Typography>
            )}
          </Box>
        </Box>

        {/* RIGHT PANEL: Unified Spec Sheet */}
        <Box sx={{
          flex: 1,
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "4px",
          p: 1.5,
        }}>
          {/* Section 1: User Information */}
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Identity Details</Typography>
          <Table size="small" sx={{ mb: 2, border: "1px solid " + COLORS.borderLight }}>
            <TableBody>
              <TableRow sx={{ background: "#fcfcfd" }}>
                <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "20%" }}>User ID</TableCell>
                <TableCell sx={denseCellSx}>{data.userId || data.id || "—"}</TableCell>
                <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "20%" }}>Full Name</TableCell>
                <TableCell sx={denseCellSx}>{data.userName || "—"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted }}>Email Address</TableCell>
                <TableCell sx={denseCellSx} colSpan={3}>{data.userEmail || "—"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Section 2: Professional Details */}
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Professional Details</Typography>
          <Table size="small" sx={{ mb: 2, border: "1px solid " + COLORS.borderLight }}>
            <TableBody>
              <TableRow sx={{ background: "#fcfcfd" }}>
                <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "20%" }}>Employee ID</TableCell>
                <TableCell sx={denseCellSx}>{data.employeeId || "—"}</TableCell>
                <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "20%" }}>Phone Number</TableCell>
                <TableCell sx={denseCellSx}>{data.phoneNumber || "—"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "20%" }}>Department</TableCell>
                <TableCell sx={denseCellSx}>{data.department || "—"}</TableCell>
                <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "20%" }}>Designation</TableCell>
                <TableCell sx={denseCellSx}>{data.designation || "—"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Section 3: Access & Permission */}
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Access Configuration</Typography>
          <Table size="small" sx={{ mb: 2, border: "1px solid " + COLORS.borderLight }}>
            <TableBody>
              <TableRow sx={{ background: "#fcfcfd" }}>
                <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "20%" }}>System Role</TableCell>
                <TableCell sx={denseCellSx}>{data.userRole || "—"}</TableCell>
                <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "20%" }}>Access Level</TableCell>
                <TableCell sx={denseCellSx}>
                  {data.userRole === "ADMIN" ? "Full System Access" : data.userRole === "MANAGER" ? "Asset Management Access" : "Basic Access"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* System Metadata */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", color: COLORS.textFaint, fontSize: "9px" }}>
            <Typography sx={{ fontSize: "inherit" }}>Joined On: {data.createdAt ? new Date(data.createdAt).toLocaleString() : "—"}</Typography>
            <Typography sx={{ fontSize: "inherit" }}>Last Modified: {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "—"}</Typography>
          </Box>
        </Box>
        
      </Box>
    </Box>
  );
}
