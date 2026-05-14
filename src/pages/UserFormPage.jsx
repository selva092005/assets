import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box, Button, Grid, TextField, Select, MenuItem,
  CircularProgress, Typography, InputAdornment,
} from "@mui/material";
import {
  FaArrowLeft, FaUser, FaEnvelope, FaLock, FaUserTag,
  FaCheckCircle, FaEdit, FaHome, FaChevronRight, FaUserPlus,
} from "react-icons/fa";
import { MdManageAccounts } from "react-icons/md";
import toast from "react-hot-toast";
import { inputSx, selectSx, primaryBtnSx, outlinedBtnSx, COLORS } from "../theme/tokens";
import { addUser, updateUser, getUserById } from "../services/users_service";
import { fetchUsers } from "../store/slices/userSlice";

const EMPTY = { userId: null, userName: "", userEmail: "", userPassword: "", userRole: "USER" };

const ROLE_COLORS = { ADMIN: "#7c3aed", MANAGER: "#1976d2", USER: "#2e7d32" };
function Section({ icon, title, index }) {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1, mb: 2, mt: index === 0 ? 0 : 3,
      animation: `sIn .4s ease ${index * 60}ms both`,
      "@keyframes sIn": { from: { opacity: 0, transform: "translateX(-8px)" }, to: { opacity: 1, transform: "translateX(0)" } },
    }}>
      <Box sx={{ width: 28, height: 28, borderRadius: "8px", background: COLORS.primaryLight,
        display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.primary, flexShrink: 0 }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.text, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {title}
      </Typography>
      <Box sx={{ flex: 1, height: "1px", background: COLORS.borderLight }} />
    </Box>
  );
}

const anim = (i) => ({
  animation: `fIn .38s cubic-bezier(.22,1,.36,1) ${60 + i * 40}ms both`,
  "@keyframes fIn": { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
});

const adorn = (icon) => (
  <InputAdornment position="start">
    <Box sx={{ color: "#c0c0c0", display: "flex", fontSize: 13 }}>{icon}</Box>
  </InputAdornment>
);

export default function UserFormPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const dispatch   = useDispatch();
  const { page, search } = useSelector((s) => s.users);
  const isEdit     = !!id;

  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(isEdit);
  const [showPass, setShowPass] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    if (isEdit) {
      getUserById(id).then((res) => {
        const d = res.data ?? res;
        setForm({
          userId:       d.userId ?? d.id,
          userName:     d.userName  || "",
          userEmail:    d.userEmail || "",
          userPassword: "",
          userRole:     d.userRole  || "USER",
        });
        setLoading(false);
      }).catch(() => { toast.error("Failed to load user"); navigate("/home/users"); });
    }
  }, [id]);

  const handleSave = async () => {
    if (!form.userName.trim())  { toast.error("Username is required");  return; }
    if (!form.userEmail.trim()) { toast.error("Email is required");     return; }
    if (!isEdit && !form.userPassword.trim()) { toast.error("Password is required"); return; }

    setSaving(true);
    try {
      const payload = {
        userName:     form.userName,
        userEmail:    form.userEmail,
        userRole:     form.userRole,
        ...(form.userPassword ? { userPassword: form.userPassword } : {}),
      };
      if (isEdit) { await updateUser(form.userId, payload); toast.success("User updated successfully"); }
      else        { await addUser(payload);                 toast.success("User created successfully"); }
      dispatch(fetchUsers({ keyword: search, page, size: 10 }));
      navigate("/home/users");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save user");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: COLORS.bg }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ mt: "60px", minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── Top bar ── */}
      <Box sx={{
        px: "2.5rem", py: 1.75, background: "#fff", borderBottom: `1px solid ${COLORS.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        animation: "topIn .35s ease both",
        "@keyframes topIn": { from: { opacity: 0, transform: "translateY(-8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 13, color: COLORS.textFaint }}>
          <FaHome size={12} />
          <Box component="span" onClick={() => navigate("/home")}
            sx={{ cursor: "pointer", "&:hover": { color: COLORS.primary }, transition: "color .2s" }}>Home</Box>
          <FaChevronRight size={10} />
          <Box component="span" onClick={() => navigate("/home/users")}
            sx={{ cursor: "pointer", "&:hover": { color: COLORS.primary }, transition: "color .2s" }}>Users</Box>
          <FaChevronRight size={10} />
          <Box component="span" sx={{ color: COLORS.primary, fontWeight: 600 }}>
            {isEdit ? "Edit User" : "New User"}
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<FaArrowLeft size={11} />}
          onClick={() => navigate("/home/users")}
          sx={{ ...outlinedBtnSx, fontSize: 12, py: "5px" }}>
          Back to Users
        </Button>
      </Box>

      {/* ── Page content ── */}
      <Box sx={{ maxWidth: 600, mx: "auto", px: 3, py: 4 }}>

        {/* Page title */}
        <Box sx={{
          display: "flex", alignItems: "center", gap: 2, mb: 3,
          animation: "titleIn .4s ease .05s both",
          "@keyframes titleIn": { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        }}>
          <Box sx={{
            width: 46, height: 46, borderRadius: "12px",
            background: isEdit ? "linear-gradient(135deg,#f3e8ff,#e9d5ff)" : "linear-gradient(135deg,#e3f2fd,#bbdefb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isEdit ? "#7c3aed" : COLORS.primary,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            {isEdit ? <FaEdit size={18} /> : <FaUserPlus size={18} />}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 20, color: COLORS.text, lineHeight: 1.2 }}>
              {isEdit ? "Edit User" : "Add New User"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: COLORS.textFaint, mt: 0.3 }}>
              {isEdit ? "Update the user account details below" : "Fill in the information to create a new user account"}
            </Typography>
          </Box>
        </Box>

        {/* ── Card ── */}
        <Box sx={{
          background: "#fff", borderRadius: "16px", border: `1px solid ${COLORS.borderLight}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)", p: { xs: 2.5, sm: 3.5 },
          animation: "cardIn .45s cubic-bezier(.22,1,.36,1) .08s both",
          "@keyframes cardIn": { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        }}>

          {/* Account Info */}
          <Section icon={<MdManageAccounts size={15} />} title="Account Information" index={0} />
          <Grid container spacing={2}>
            <Grid size={6} sx={anim(0)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>Username *</Typography>
              <TextField name="userName" placeholder="e.g. john_doe" value={form.userName} onChange={onChange}
                size="small" fullWidth sx={inputSx}
                slotProps={{ input: { startAdornment: adorn(<FaUser size={12} />) } }} />
            </Grid>
            <Grid size={6} sx={anim(1)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>Email Address *</Typography>
              <TextField name="userEmail" placeholder="user@example.com" type="email" value={form.userEmail} onChange={onChange}
                size="small" fullWidth sx={inputSx}
                slotProps={{ input: { startAdornment: adorn(<FaEnvelope size={12} />) } }} />
            </Grid>
          </Grid>

          {/* Security */}
          <Section icon={<FaLock size={12} />} title="Security" index={1} />
          <Grid container spacing={2}>
            <Grid size={12} sx={anim(2)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>
                Password {isEdit && <Box component="span" sx={{ color: "#bbb" }}>(leave blank to keep current)</Box>}
              </Typography>
              <TextField
                name="userPassword"
                placeholder={isEdit ? "Leave blank to keep current password" : "Enter password"}
                type={showPass ? "text" : "password"}
                value={form.userPassword} onChange={onChange}
                size="small" fullWidth sx={inputSx}
                slotProps={{ input: {
                  startAdornment: adorn(<FaLock size={12} />),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Box component="span" onClick={() => setShowPass((p) => !p)}
                        sx={{ fontSize: 11, color: COLORS.primary, cursor: "pointer", fontWeight: 600,
                          userSelect: "none", "&:hover": { textDecoration: "underline" } }}>
                        {showPass ? "Hide" : "Show"}
                      </Box>
                    </InputAdornment>
                  ),
                }}} />
            </Grid>
          </Grid>

          {/* Role */}
          <Section icon={<FaUserTag size={12} />} title="Role & Permissions" index={2} />
          <Grid container spacing={2}>
            <Grid size={12} sx={anim(3)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>User Role</Typography>
              <Select name="userRole" value={form.userRole} onChange={onChange} size="small" fullWidth sx={selectSx}>
                {[
                  { v: "ADMIN",   label: "Admin",   desc: "Full access" },
                  { v: "MANAGER", label: "Manager", desc: "Manage users & assets" },
                  { v: "USER",    label: "User",    desc: "View only" },
                ].map(({ v, label }) => (
                  <MenuItem key={v} value={v} sx={{ fontSize: 13 }}>{label}</MenuItem>
                ))}
              </Select>

              {/* Role badge preview */}
            </Grid>
          </Grid>

        </Box>

        {/* ── Action bar ── */}
        <Box sx={{
          display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5, mt: 3,
          animation: "barIn .4s ease .2s both",
          "@keyframes barIn": { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        }}>
          <Typography sx={{ fontSize: 12, color: COLORS.textFaint, flex: 1 }}>
            * Required fields must be filled before saving
          </Typography>
          <Button variant="outlined" onClick={() => navigate("/home/users")} sx={outlinedBtnSx}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            startIcon={saving ? null : (isEdit ? <FaEdit size={12} /> : <FaCheckCircle size={12} />)}
            sx={{ ...primaryBtnSx, minWidth: 130 }}>
            {saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : (isEdit ? "Update User" : "Save User")}
          </Button>
        </Box>

      </Box>
    </Box>
  );
}
