import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box, Button, Grid, MenuItem,
  Typography, InputAdornment, CircularProgress,
} from "@mui/material";
import SkeletonLoader from "../components/common/SkeletonLoader";
import {
  FaArrowLeft, FaUser, FaEnvelope, FaLock, FaUserTag,
  FaCheckCircle, FaEdit, FaHome, FaChevronRight, FaUserPlus,
  FaIdCard, FaBuilding, FaPhone, FaBriefcase,
} from "react-icons/fa";
import { MdManageAccounts } from "react-icons/md";
import toast from "../utils/toast.jsx";
import { primaryBtnSx, outlinedBtnSx, COLORS } from "../theme/tokens";
import { isValidEmail, isStrongPassword, extractFieldErrors } from "../utils/validate";
import { addUser, updateUser, getUserById } from "../services/users_service";
import { FormTextField, FormSelect } from "../components/FormFields";

const ROLE_COLORS = { ADMIN: "#7c3aed", MANAGER: "#1976d2", USER: "#2e7d32" };

function Section({ icon, title, index }) {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 0.75, mb: 0.75, mt: index === 0 ? 0 : 1.25,
      animation: `sIn .4s ease ${index * 60}ms both`,
      "@keyframes sIn": { from: { opacity: 0, transform: "translateX(-8px)" }, to: { opacity: 1, transform: "translateX(0)" } },
    }}>
      <Box sx={{
        width: 20, height: 20, borderRadius: "4px", background: COLORS.primaryLight,
        display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.primary, flexShrink: 0
      }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.text, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {title}
      </Typography>
      <Box sx={{ flex: 1, height: "1px", background: COLORS.borderLight }} />
    </Box>
  );
}



const adorn = (icon) => (
  <InputAdornment position="start">
    <Box sx={{ color: "#c0c0c0", display: "flex", fontSize: 11 }}>{icon}</Box>
  </InputAdornment>
);

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEdit = !!id;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [showPass, setShowPass] = useState(false);

  const { control, handleSubmit, reset, setError } = useForm({
    defaultValues: {
      userName: "",
      userEmail: "",
      userPassword: "",
      userRole: "USER",
      employeeId: "",
      department: "",
      phoneNumber: "",
      designation: "",
    }
  });

  useEffect(() => {
    if (isEdit) {
      getUserById(id).then((res) => {
        const d = res.data ?? res;
        reset({
          userName: d.userName || "",
          userEmail: d.userEmail || "",
          userPassword: "",
          userRole: d.userRole || "USER",
          employeeId: d.employeeId || "",
          department: d.department || "",
          phoneNumber: d.phoneNumber || "",
          designation: d.designation || "",
        });
        setLoading(false);
      }).catch(() => {
        toast.error("Failed to load user");
        navigate("/home/users");
      });
    }
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        userName: data.userName,
        userEmail: data.userEmail,
        userRole: data.userRole,
        employeeId: data.employeeId || null,
        department: data.department || null,
        phoneNumber: data.phoneNumber || null,
        designation: data.designation || null,
        ...(data.userPassword ? { userPassword: data.userPassword } : {}),
      };
      if (isEdit) {
        await updateUser(id, payload);
        toast.success("User updated successfully");
      } else {
        await addUser(payload);
        toast.success("User created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      navigate("/home/users");
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error(err.response.data.message);
      } else if (err.response?.status === 400) {
        const fe = extractFieldErrors(err);
        if (Object.keys(fe).length > 0) {
          Object.keys(fe).forEach((key) => {
            setError(key, { type: "server", message: fe[key] });
          });
          toast.error("Please fix the highlighted fields");
        } else {
          toast.error(err.response?.data?.message || "Failed to save user");
        }
      } else {
        toast.error(err.response?.data?.message || "Failed to save user");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Box sx={{ p: 2 }}>
      <SkeletonLoader variant="detail" />
    </Box>
  );

  return (
    <Box sx={{
      height: { xs: "auto", md: "calc(100vh - 70px)" },
      display: "flex",
      flexDirection: "column",
      overflow: { xs: "visible", md: "hidden" }
    }}>
      {/* ── Top bar ── */}
      <Box sx={{
        px: 1.5, py: 0.75, background: "#fff", borderBottom: `1px solid ${COLORS.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
        animation: "topIn .35s ease both",
        "@keyframes topIn": { from: { opacity: 0, transform: "translateY(-8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: 11.5, color: COLORS.textFaint }}>
          <FaHome size={11} />
          <Box component="span" onClick={() => navigate("/home")}
            sx={{ cursor: "pointer", "&:hover": { color: COLORS.primary }, transition: "color .2s" }}>Home</Box>
          <FaChevronRight size={9} />
          <Box component="span" onClick={() => navigate("/home/users")}
            sx={{ cursor: "pointer", "&:hover": { color: COLORS.primary }, transition: "color .2s" }}>Users</Box>
          <FaChevronRight size={9} />
          <Box component="span" sx={{ color: COLORS.primary, fontWeight: 600 }}>
            {isEdit ? "Edit User" : "New User"}
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<FaArrowLeft size={10} />}
          onClick={() => navigate("/home/users")}
          sx={outlinedBtnSx}>
          Back to Users
        </Button>
      </Box>

      {/* ── Page content ── */}
      <Box sx={{
        flex: { xs: "initial", md: 1 },
        display: "flex",
        flexDirection: "column",
        p: 2,
        overflow: { xs: "visible", md: "hidden" },
        maxWidth: 1100,
        width: "100%",
        mx: "auto"
      }}>
        {/* Page title */}
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexShrink: 0,
          animation: "titleIn .4s ease .05s both",
          "@keyframes titleIn": { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: "6px",
            background: isEdit ? "linear-gradient(135deg,#f3e8ff,#e9d5ff)" : "linear-gradient(135deg,#e3f2fd,#bbdefb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isEdit ? "#7c3aed" : COLORS.primary,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            {isEdit ? <FaEdit size={14} /> : <FaUserPlus size={14} />}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: COLORS.text, lineHeight: 1.2 }}>
              {isEdit ? "Edit User" : "Add New User"}
            </Typography>
            <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mt: 0.15 }}>
              {isEdit ? "Update the user account details below" : "Fill in the information to create a new user account"}
            </Typography>
          </Box>
        </Box>

        {/* ── Card ── */}
        <Box sx={{
          flex: { xs: "initial", md: 1 },
          background: "rgba(255, 255, 255, 0.98)",
          borderRadius: "14px",
          border: `1px solid rgba(226, 232, 240, 0.8)`,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
          p: { xs: 2, md: 3 },
          display: "flex",
          flexDirection: "column",
          overflow: { xs: "visible", md: "hidden" },
          animation: "cardIn .45s cubic-bezier(.22,1,.36,1) .08s both",
          "@keyframes cardIn": { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        }}>
          <Grid container spacing={4} sx={{ flex: { xs: "initial", md: 1 }, overflow: { xs: "visible", md: "hidden" } }}>
            {/* Left Column: Account Credentials & Roles */}
            <Grid size={{ xs: 12, md: 6 }} sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              height: { xs: "auto", md: "100%" },
              overflowY: { xs: "visible", md: "auto" },
              pr: { xs: 0, md: 2 }
            }}>
              <Section icon={<MdManageAccounts size={15} />} title="Account Credentials" index={0} />
              <FormTextField
                name="userName"
                control={control}
                rules={{
                  required: "Username is required",
                  minLength: { value: 2, message: "Username must be at least 2 characters" }
                }}
                label="Username *"
                placeholder="e.g. john_doe"
                slotProps={{ input: { startAdornment: adorn(<FaUser size={12} />) } }}
              />
              <FormTextField
                name="userEmail"
                control={control}
                rules={{
                  required: "Email address is required",
                  validate: (val) => isValidEmail(val) || "Enter a valid email address"
                }}
                label="Email Address *"
                placeholder="user@example.com"
                type="email"
                slotProps={{ input: { startAdornment: adorn(<FaEnvelope size={12} />) } }}
              />
              <FormTextField
                name="userPassword"
                control={control}
                rules={{
                  required: !isEdit && "Password is required",
                  validate: (val) => {
                    if (!val && isEdit) return true;
                    return isStrongPassword(val) || "Min 8 chars with uppercase, lowercase, number & special char (@$!%*?&)";
                  }
                }}
                label={`Password ${isEdit ? "(leave blank to keep current)" : "*"}`}
                placeholder={isEdit ? "Leave blank to keep current password" : "Enter password"}
                type={showPass ? "text" : "password"}
                slotProps={{
                  input: {
                    startAdornment: adorn(<FaLock size={12} />),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box component="span" onClick={() => setShowPass((p) => !p)}
                          sx={{
                            fontSize: 11, color: COLORS.primary, cursor: "pointer", fontWeight: 600,
                            userSelect: "none", "&:hover": { textDecoration: "underline" }
                          }}>
                          {showPass ? "Hide" : "Show"}
                        </Box>
                      </InputAdornment>
                    ),
                  }
                }}
              />
              <Box sx={{ mt: 1.5 }}>
                <Section icon={<FaUserTag size={12} />} title="Role & Permissions" index={2} />
                <FormSelect
                  name="userRole"
                  control={control}
                  rules={{ required: "User role is required" }}
                  label="User Role"
                  options={[
                    { value: "ADMIN", label: "Admin" },
                    { value: "MANAGER", label: "Manager" },
                    { value: "USER", label: "User" },
                  ]}
                />
              </Box>
            </Grid>

            {/* Right Column: Professional Profile */}
            <Grid size={{ xs: 12, md: 6 }} sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              height: { xs: "auto", md: "100%" },
              overflowY: { xs: "visible", md: "auto" },
              pl: { xs: 0, md: 2 },
              borderLeft: { md: "1px solid #f1f5f9" },
              borderTop: { xs: "1px solid #f1f5f9", md: "none" },
              pt: { xs: 2, md: 0 }
            }}>
              <Section icon={<FaBriefcase size={12} />} title="Professional Profile" index={1} />
              <FormTextField
                name="employeeId"
                control={control}
                label="Employee ID"
                placeholder="e.g. EMP-0123"
                slotProps={{ input: { startAdornment: adorn(<FaIdCard size={12} />) } }}
              />
              <FormTextField
                name="phoneNumber"
                control={control}
                label="Phone Number"
                placeholder="e.g. +91 9876543210"
                slotProps={{ input: { startAdornment: adorn(<FaPhone size={12} />) } }}
              />
              <FormTextField
                name="department"
                control={control}
                label="Department"
                placeholder="e.g. Engineering"
                slotProps={{ input: { startAdornment: adorn(<FaBuilding size={12} />) } }}
              />
              <FormTextField
                name="designation"
                control={control}
                label="Designation"
                placeholder="e.g. Software Engineer"
                slotProps={{ input: { startAdornment: adorn(<FaBriefcase size={12} />) } }}
              />
            </Grid>
          </Grid>

          {/* ── Action bar ── */}
          <Box sx={{
            display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5, mt: 2, pt: 1.5,
            borderTop: `1px solid ${COLORS.borderLight}`,
            flexShrink: 0,
            animation: "barIn .4s ease .2s both",
            "@keyframes barIn": { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
          }}>
            <Typography sx={{ fontSize: 11.5, color: COLORS.textFaint, flex: 1 }}>
              * Required fields must be filled before saving
            </Typography>
            <Button variant="outlined" onClick={() => navigate("/home/users")} sx={outlinedBtnSx}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={saving}
              startIcon={saving ? null : (isEdit ? <FaEdit size={12} /> : <FaCheckCircle size={12} />)}
              sx={{ ...primaryBtnSx, minWidth: 130 }}>
              {saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : (isEdit ? "Update User" : "Save User")}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
