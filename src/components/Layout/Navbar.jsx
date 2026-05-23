import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, List, ListItemButton, ListItemText, Toolbar, Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { logoutUser } from "../../store/slices/authSlice";
import amsLogo from "../../assets/ams_no_bg.png";

// ── Nav items — role restrictions defined here ─────────────────────────────
const navItems = [
  { label: "Dashboard", path: "/home", end: true, roles: ["admin", "manager", "user"] },
  {
    label: "Assets", path: "/home/assets", roles: ["admin", "manager", "user"],
    dropdown: [
      { label: "Allocation", path: "/home/allocation", roles: ["admin", "manager"] },
      { label: "Disposal", path: "/home/disposal", roles: ["admin"] },
    ],
  },
  { label: "Users", path: "/home/users", roles: ["admin", "manager"] },
  { label: "Reports", path: "/home/reports", roles: ["admin", "manager", "user"] },
];

const roleBadgeStyles = {
  manager: {
    bg: "#e0f2fe",
    color: "#0369a1",
  },
  admin: {
    bg: "#fef3c7",
    color: "#b45309",
  },
  user: {
    bg: "#f1f5f9",
    color: "#475569",
  },
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { isLoggedIn, userRole } = useSelector((s) => s.auth);

  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileAssetsOpen, setMobileAssetsOpen] = useState(false);
  const closeTimer = useRef(null);

  const openDropdown = () => { clearTimeout(closeTimer.current); setDropOpen(true); };
  const closeDropdown = () => { closeTimer.current = setTimeout(() => setDropOpen(false), 100); };

  const handleLogoutConfirm = () => {
    dispatch(logoutUser());
    setLogoutConfirmOpen(false);
    navigate("/");
  };

  const isActivePath = (item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const isManager = userRole === "manager";
  const isAdmin = userRole === "admin";
  const RoleIcon = isManager || isAdmin ? AdminPanelSettingsIcon : AccountCircleIcon;
  const roleStyle = isManager ? roleBadgeStyles.manager : isAdmin ? roleBadgeStyles.admin : roleBadgeStyles.user;
  const roleLabel = isManager ? "Manager" : isAdmin ? "Admin" : "User";

  // Filter nav items by current user role
  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <>
      {/* ── AppBar ─────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          animation: "navbarDrop 420ms ease both",
          bgcolor: "rgba(255,255,255,0.94)",
          borderBottom: "1px solid #e5e7eb",
          boxShadow: "0 10px 30px rgba(15,23,42,0.10)",
          color: "#111827",
          backdropFilter: "blur(14px)",
          transition: "box-shadow 180ms ease, background-color 180ms ease",
          "&::before": {
            animation: "navLightSweep 4.5s linear infinite",
            background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.28), transparent)",
            content: '""', height: 2, left: "-40%", position: "absolute", top: 0, width: "40%",
          },
          "@keyframes navbarDrop": { "0%": { opacity: 0, transform: "translateY(-16px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
          "@keyframes navLightSweep": { "0%": { left: "-40%" }, "100%": { left: "100%" } },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 42, md: 46 }, px: { xs: 1.5, md: 2.5 }, gap: 1, justifyContent: "space-between" }}>

          {/* Logo */}
          <Box component={Link} to="/home"
            sx={{ alignItems: "center", color: "inherit", display: "flex", gap: 1.25, textDecoration: "none", transition: "transform 160ms ease", "&:hover": { transform: "translateY(-1px)" } }}>
            <Box component="img" src={amsLogo} alt="AMS"
              sx={{ height: { xs: 26, md: 30 }, objectFit: "contain", width: { xs: 26, md: 30 }, filter: "drop-shadow(0 2px 6px rgba(37,99,235,0.15))" }} />
            <Box sx={{ lineHeight: 1.05 }}>
              <Typography component="span" sx={{ color: "#2563eb", display: "block", fontFamily: '"Playfair Display",Georgia,serif', fontSize: 12, fontWeight: 800, lineHeight: 1 }}>Asset</Typography>
              <Typography component="span" sx={{ color: "#111827", fontFamily: '"Manrope","Segoe UI",sans-serif', fontSize: 9, fontWeight: 700, lineHeight: 1.15 }}>Management System</Typography>
            </Box>
          </Box>

          {/* Desktop nav pill */}
          <Box sx={{ background: "linear-gradient(135deg,rgba(239,246,255,0.96),rgba(219,234,254,0.92),rgba(255,255,255,0.96))", border: "1px solid #dbeafe", borderRadius: 999, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)", display: { xs: "none", md: "flex" }, gap: 0.25, p: "3px" }}>
            {visibleNavItems.map((item) => {
              const active = isActivePath(item);
              const visibleDropdown = item.dropdown?.filter((d) => d.roles.includes(userRole));
              if (visibleDropdown?.length) {
                const dropActive = active || visibleDropdown.some((d) => location.pathname.startsWith(d.path));
                return (
                  <Box key={item.path}
                    onMouseEnter={openDropdown}
                    onMouseLeave={closeDropdown}
                    sx={{ position: "relative" }}
                  >
                    {/* Nav button */}
                    <Button
                      component={Link} to={item.path}
                      endIcon={
                        <KeyboardArrowDownIcon sx={{
                          fontSize: "13px !important",
                          transition: "transform 300ms cubic-bezier(.34,1.56,.64,1)",
                          transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }} />
                      }
                      sx={{
                        bgcolor: dropActive ? "#ffffff" : "transparent",
                        borderRadius: 999,
                        boxShadow: dropActive ? "0 2px 8px rgba(37,99,235,0.15)" : "none",
                        color: dropActive ? "#2563eb" : "#475569",
                        fontWeight: dropActive ? 700 : 500,
                        fontSize: 12, px: 1.25, py: 0.4, minHeight: 0, textTransform: "none",
                        transition: "all 150ms ease",
                        "&:hover": { bgcolor: "#ffffff", color: "#2563eb" },
                      }}>
                      {item.label}
                    </Button>

                    {/* Dropdown card */}
                    {dropOpen && (
                      <Box
                        onMouseEnter={openDropdown}
                        onMouseLeave={closeDropdown}
                        sx={{
                          position: "absolute",
                          top: "calc(100% + 6px)",
                          left: "50%",
                          zIndex: 1400,
                          minWidth: 160,
                          borderRadius: "10px",
                          background: "#fff",
                          border: "1px solid #f1f5f9",
                          boxShadow: "0 16px 48px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)",
                          py: 1,
                          animation: "simpleDrop 200ms cubic-bezier(.16,1,.3,1) both",
                          "@keyframes simpleDrop": {
                            "0%": { opacity: 0, transform: "translateX(-50%) translateY(-8px)" },
                            "100%": { opacity: 1, transform: "translateX(-50%) translateY(0)" },
                          },
                          "&::before": {
                            content: '""', position: "absolute", top: -6, left: "50%",
                            transform: "translateX(-50%) rotate(45deg)",
                            width: 11, height: 11,
                            background: "#fff",
                            border: "1px solid #f1f5f9",
                            borderBottom: "none", borderRight: "none",
                          },
                        }}
                      >
                        {visibleDropdown.map((d, i) => {
                          const isSelected = location.pathname.startsWith(d.path);
                          return (
                            <Box
                              key={d.path}
                              component={Link} to={d.path}
                              onClick={() => setDropOpen(false)}
                              sx={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                px: 1.5, py: 0.7,
                                mx: 0.5, borderRadius: "6px",
                                textDecoration: "none",
                                color: isSelected ? "#2563eb" : "#374151",
                                fontWeight: isSelected ? 700 : 500,
                                fontSize: 12,
                                bgcolor: isSelected ? "#eff6ff" : "transparent",
                                transition: "all 150ms ease",
                                animation: `si 180ms ${i * 50}ms both`,
                                "@keyframes si": {
                                  "0%": { opacity: 0 },
                                  "100%": { opacity: 1 },
                                },
                                "&:hover": { bgcolor: "#f8fafc", color: "#2563eb" },
                              }}
                            >
                              {d.label}
                              {isSelected && (
                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#2563eb", flexShrink: 0 }} />
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                );
              }
              return (
                <Button key={item.path} component={Link} to={item.path}
                  sx={{ bgcolor: active ? "#ffffff" : "transparent", borderRadius: 999, boxShadow: active ? "0 2px 8px rgba(37,99,235,0.15)" : "none", color: active ? "#111827" : "#475569", fontWeight: active ? 700 : 500, fontSize: 12, px: 1.25, py: 0.4, minHeight: 0, textTransform: "none", transition: "all 150ms ease", "&:hover": { bgcolor: "#ffffff", color: "#111827" } }}>
                  {item.label}
                </Button>
              );
            })}
          </Box>

          {/* Right side */}
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            {/* Mobile hamburger */}
            <IconButton aria-label="Open navigation menu" onClick={() => setMenuOpen(true)} size="small"
              sx={{ border: "1px solid #e5e7eb", display: { xs: "inline-flex", md: "none" }, p: 0.5, "&:hover": { bgcolor: "#eff6ff" } }}>
              <MenuIcon sx={{ fontSize: 18 }} />
            </IconButton>

            {isLoggedIn ? (
              <>
                {/* Role badge */}
                <Box sx={{ alignItems: "center", background: roleStyle.bg, borderRadius: "6px", color: roleStyle.color, display: "flex", gap: 0.75, px: 1, py: "3px" }} title={`${roleLabel} logged in`}>
                  <RoleIcon sx={{ fontSize: 13 }} />
                  <Typography component="span" sx={{ display: { xs: "none", sm: "inline" }, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    {roleLabel}
                  </Typography>
                </Box>

                <Button onClick={() => setLogoutConfirmOpen(true)} startIcon={<LogoutIcon sx={{ fontSize: "13px !important" }} />}
                  sx={{ color: "#64748b", fontSize: 11, fontWeight: 600, minHeight: 0, py: "3px", px: 1, textTransform: "none", borderRadius: "6px", "&:hover": { bgcolor: "#fef2f2", color: "#ef4444" } }}>
                  Logout
                </Button>
              </>
            ) : (
              <Button component={Link} to="/" variant="outlined"
                sx={{ borderColor: "#bfdbfe", borderRadius: 999, color: "#111827", fontSize: 11, fontWeight: 600, minHeight: 0, py: 0.4, px: 1.25, textTransform: "none", "&:hover": { bgcolor: "#eff6ff", borderColor: "#60a5fa" } }}>
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Mobile menu ─────────────────────────────── */}
      {menuOpen && (
        <Box sx={{ animation: "mobileMenuReveal 260ms cubic-bezier(.2,.8,.2,1) both", bgcolor: "#ffffff", borderBottom: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(15,23,42,0.10)", display: { xs: "block", md: "none" }, left: 0, position: "fixed", right: 0, top: 42, zIndex: (t) => t.zIndex.appBar - 1, "@keyframes mobileMenuReveal": { "0%": { clipPath: "inset(0 0 100% 0)", opacity: 0, transform: "translateY(-10px)" }, "70%": { clipPath: "inset(0 0 0 0)", opacity: 1 }, "100%": { opacity: 1, transform: "translateY(0)" } } }}>
          <List sx={{ p: 1 }}>
            {visibleNavItems.map((item) => {
              const active = isActivePath(item);
              const visibleDropdown = item.dropdown?.filter((d) => d.roles.includes(userRole));
              if (visibleDropdown?.length) {
                return (
                  <Box key={item.path}>
                    <ListItemButton component={Link} to={item.path}
                      onClick={() => setMobileAssetsOpen((p) => !p)}
                      sx={{ bgcolor: active ? "#eff6ff" : "transparent", borderBottom: "1px solid #f3f4f6", color: active ? "#1d4ed8" : "#111827", px: 1.25, py: 0.75, "&:hover": { bgcolor: "#eff6ff" } }}>
                      <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 700 : 500 }} />
                      <KeyboardArrowDownIcon sx={{ fontSize: 15, transition: "transform 160ms ease", transform: mobileAssetsOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </ListItemButton>
                    {mobileAssetsOpen && visibleDropdown.map((d) => (
                      <ListItemButton key={d.path} component={Link} to={d.path} onClick={() => { setMenuOpen(false); setMobileAssetsOpen(false); }}
                        sx={{ bgcolor: location.pathname.startsWith(d.path) ? "#eff6ff" : "#f8fafc", borderBottom: "1px solid #f3f4f6", color: location.pathname.startsWith(d.path) ? "#1d4ed8" : "#374151", pl: 3, py: 0.6, "&:hover": { bgcolor: "#eff6ff" } }}>
                        <ListItemText primary={d.label} primaryTypographyProps={{ fontSize: 12, fontWeight: 500 }} />
                      </ListItemButton>
                    ))}
                  </Box>
                );
              }
              return (
                <ListItemButton key={item.path} component={Link} to={item.path} onClick={() => setMenuOpen(false)}
                  sx={{ bgcolor: active ? "#eff6ff" : "transparent", borderBottom: "1px solid #f3f4f6", color: active ? "#1d4ed8" : "#111827", px: 1.25, py: 0.75, "&:hover": { bgcolor: "#eff6ff" }, "&:last-child": { borderBottom: 0 } }}>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 700 : 500 }} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      )}

      {/* ── Logout confirm ───────────────────────────── */}
      <Dialog open={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)}
        slotProps={{ 
          paper: { sx: { borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxWidth: 280, width: "calc(100% - 24px)", p: 0 } }, 
          backdrop: { sx: { backdropFilter: "blur(4px)", bgcolor: "rgba(15, 23, 42, 0.6)" } } 
        }}>
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography sx={{ color: "#0f172a", fontSize: 14, fontWeight: 700, mb: 0.5, fontFamily: "'Outfit', sans-serif" }}>
            Sign Out
          </Typography>
          <Typography sx={{ color: "#475569", fontSize: 12, lineHeight: 1.4 }}>
            Are you sure you want to log out?
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, px: 2, pb: 2, justifyContent: "flex-end" }}>
          <Button onClick={() => setLogoutConfirmOpen(false)} 
            sx={{ color: "#64748b", fontSize: 11, fontWeight: 600, py: 0.5, px: 1.5, textTransform: "none", borderRadius: "6px", minWidth: 0, "&:hover": { bgcolor: "#f1f5f9" } }}>
            Cancel
          </Button>
          <Button onClick={handleLogoutConfirm} variant="contained" disableElevation
            sx={{ bgcolor: "#ef4444", borderRadius: "6px", fontSize: 11, fontWeight: 700, py: 0.5, px: 1.5, textTransform: "none", minWidth: 0, "&:hover": { bgcolor: "#dc2626" } }}>
            Sign Out
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default Navbar;
