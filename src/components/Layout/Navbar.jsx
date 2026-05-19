import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, List, ListItemButton, ListItemText, Toolbar, Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AccountCircleIcon     from "@mui/icons-material/AccountCircle";
import LogoutIcon            from "@mui/icons-material/Logout";
import MenuIcon              from "@mui/icons-material/Menu";
import { logoutUser }        from "../../store/slices/authSlice";
import amsLogo               from "../../assets/ams_no_bg.png";
import "../../styles/App.css";

// ── Nav items — role restrictions defined here ─────────────────────────────
const navItems = [
  { label: "Dashboard", path: "/home",       end: true, roles: ["admin", "manager", "user"] },
  {
    label: "Assets", path: "/home/assets", roles: ["admin", "manager", "user"],
    dropdown: [
      { label: "Allocation", path: "/home/allocation", roles: ["admin", "manager"] },
      { label: "Disposal",   path: "/home/disposal",   roles: ["admin"] },
    ],
  },
  { label: "Users",   path: "/home/users",   roles: ["admin", "manager"] },
  { label: "Reports", path: "/home/reports", roles: ["admin", "manager", "user"] },
];

const roleBadgeStyles = {
  manager: {
    bg:     "linear-gradient(135deg, #0f172a 0%, #1e3a8a 48%, #38bdf8 100%)",
    border: "rgba(125,211,252,0.82)",
    color:  "#f8fafc",
    iconBg: "rgba(255,255,255,0.16)",
    shadow: "0 10px 30px rgba(30,58,138,0.28), 0 6px 18px rgba(56,189,248,0.22)",
  },
  admin: {
    bg:     "linear-gradient(135deg, #172554 0%, #1e40af 48%, #60a5fa 100%)",
    border: "rgba(147,197,253,0.82)",
    color:  "#ffffff",
    iconBg: "rgba(255,255,255,0.18)",
    shadow: "0 14px 32px rgba(30,64,175,0.22), 0 8px 22px rgba(96,165,250,0.24)",
  },
  user: {
    bg:     "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 52%, #c7d2fe 100%)",
    border: "rgba(129,140,248,0.64)",
    color:  "#3730a3",
    iconBg: "rgba(255,255,255,0.88)",
    shadow: "0 12px 28px rgba(15,23,42,0.1), 0 8px 18px rgba(129,140,248,0.18)",
  },
};

const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch();

  const { isLoggedIn, userRole } = useSelector((s) => s.auth);

  const [menuOpen,          setMenuOpen]          = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [dropOpen,         setDropOpen]          = useState(false);
  const [mobileAssetsOpen, setMobileAssetsOpen]  = useState(false);
  const closeTimer = useRef(null);

  const openDropdown  = () => { clearTimeout(closeTimer.current); setDropOpen(true); };
  const closeDropdown = () => { closeTimer.current = setTimeout(() => setDropOpen(false), 100); };

  const handleLogoutConfirm = () => {
    dispatch(logoutUser());
    setLogoutConfirmOpen(false);
    navigate("/");
  };

  const isActivePath = (item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const isManager = userRole === "manager";
  const isAdmin   = userRole === "admin";
  const RoleIcon  = isManager || isAdmin ? AdminPanelSettingsIcon : AccountCircleIcon;
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
          "@keyframes navbarDrop":    { "0%": { opacity: 0, transform: "translateY(-16px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
          "@keyframes navLightSweep": { "0%": { left: "-40%" }, "100%": { left: "100%" } },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 70, md: 78 }, px: { xs: 2, md: 4 }, gap: 2, justifyContent: "space-between" }}>

          {/* Logo */}
          <Box component={Link} to="/home"
            sx={{ alignItems: "center", color: "inherit", display: "flex", gap: 1.25, textDecoration: "none", transition: "transform 160ms ease", "&:hover": { transform: "translateY(-1px)" } }}>
            <Box component="img" src={amsLogo} alt="AMS"
              sx={{ height: { xs: 52, md: 62 }, objectFit: "contain", width: { xs: 52, md: 62 }, filter: "drop-shadow(0 6px 10px rgba(37,99,235,0.18))", animation: "logoFloat 3.6s ease-in-out infinite", "@keyframes logoFloat": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-3px)" } } }} />
            <Box sx={{ lineHeight: 1.05 }}>
              <Typography component="span" sx={{ color: "#2563eb", display: "block", fontFamily: '"Playfair Display",Georgia,serif', fontSize: 17, fontWeight: 800, lineHeight: 1 }}>Asset</Typography>
              <Typography component="span" sx={{ color: "#111827", fontFamily: '"Manrope","Segoe UI",sans-serif', fontSize: 12, fontWeight: 700, lineHeight: 1.15 }}>Management System</Typography>
            </Box>
          </Box>

          {/* Desktop nav pill */}
          <Box sx={{ animation: "pillGlow 5s ease-in-out infinite", background: "linear-gradient(135deg,rgba(239,246,255,0.96),rgba(219,234,254,0.92),rgba(255,255,255,0.96))", backgroundSize: "220% 220%", border: "1px solid #dbeafe", borderRadius: 999, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85), 0 8px 22px rgba(37,99,235,0.10)", display: { xs: "none", md: "flex" }, gap: 0.5, p: 0.5, "@keyframes pillGlow": { "0%,100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } } }}>
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
                          fontSize: "15px !important",
                          transition: "transform 300ms cubic-bezier(.34,1.56,.64,1)",
                          transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }} />
                      }
                      sx={{
                        bgcolor: dropActive ? "#ffffff" : "transparent",
                        borderRadius: 999,
                        boxShadow: dropActive ? "0 8px 24px rgba(37,99,235,0.18), inset 0 1px 0 rgba(255,255,255,0.9)" : "none",
                        color: dropActive ? "#2563eb" : "#475569",
                        fontWeight: dropActive ? 700 : 600,
                        px: 2.25, textTransform: "none",
                        transition: "all 200ms ease",
                        "&:hover": { bgcolor: "#ffffff", color: "#2563eb", boxShadow: "0 8px 20px rgba(37,99,235,0.14)" },
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
                          top: "calc(100% + 12px)",
                          left: "50%",
                          zIndex: 1400,
                          minWidth: 190,
                          borderRadius: "14px",
                          background: "#fff",
                          border: "1px solid #f1f5f9",
                          boxShadow: "0 16px 48px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)",
                          py: 1,
                          animation: "simpleDrop 200ms cubic-bezier(.16,1,.3,1) both",
                          "@keyframes simpleDrop": {
                            "0%":   { opacity: 0, transform: "translateX(-50%) translateY(-8px)" },
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
                                px: 2, py: 1.1,
                                mx: 0.75, borderRadius: "8px",
                                textDecoration: "none",
                                color: isSelected ? "#2563eb" : "#374151",
                                fontWeight: isSelected ? 700 : 500,
                                fontSize: 14,
                                bgcolor: isSelected ? "#eff6ff" : "transparent",
                                transition: "all 150ms ease",
                                animation: `si 180ms ${i * 50}ms both`,
                                "@keyframes si": {
                                  "0%":   { opacity: 0 },
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
                  sx={{ bgcolor: active ? "#ffffff" : "transparent", borderRadius: 999, boxShadow: active ? "0 8px 24px rgba(37,99,235,0.18), inset 0 1px 0 rgba(255,255,255,0.9)" : "none", color: active ? "#111827" : "#475569", fontWeight: active ? 700 : 600, px: 2.25, textTransform: "none", transition: "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease", "&:hover": { bgcolor: "#ffffff", boxShadow: "0 8px 20px rgba(37,99,235,0.14)", color: "#111827", transform: "translateY(-1px)" } }}>
                  {item.label}
                </Button>
              );
            })}
          </Box>

          {/* Right side */}
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            {/* Mobile hamburger */}
            <IconButton aria-label="Open navigation menu" onClick={() => setMenuOpen(true)}
              sx={{ border: "1px solid #e5e7eb", display: { xs: "inline-flex", md: "none" }, transition: "transform 160ms ease", "&:hover": { bgcolor: "#eff6ff", transform: "translateY(-1px)" }, "&:active": { transform: "rotate(90deg) scale(0.92)" } }}>
              <MenuIcon />
            </IconButton>

            {isLoggedIn ? (
              <>
                {/* Role badge */}
                <Box sx={{ alignItems: "center", background: roleStyle.bg, border: `1px solid ${roleStyle.border}`, borderRadius: 999, boxShadow: roleStyle.shadow, color: roleStyle.color, display: "flex", gap: 0.75, minHeight: 38, pl: 0.65, pr: 1.55, transition: "transform 160ms ease", "&:hover": { transform: "translateY(-1px)" } }} title={`${roleLabel} logged in`}>
                  <Box sx={{ alignItems: "center", bgcolor: roleStyle.iconBg, borderRadius: "50%", display: "inline-flex", height: 27, justifyContent: "center", width: 27 }}>
                    <RoleIcon fontSize="small" />
                  </Box>
                  <Typography component="span" sx={{ display: { xs: "none", sm: "inline" }, fontSize: 13, fontWeight: 800, lineHeight: 1 }}>
                    {roleLabel}
                  </Typography>
                </Box>

                <Button onClick={() => setLogoutConfirmOpen(true)} startIcon={<LogoutIcon />} variant="outlined"
                  sx={{ borderColor: "#bfdbfe", borderRadius: 999, color: "#111827", fontWeight: 700, textTransform: "none", transition: "transform 160ms ease", "&:hover": { bgcolor: "#eff6ff", borderColor: "#60a5fa", transform: "translateY(-1px)" }, "&:active": { transform: "scale(0.97)" } }}>
                  Logout
                </Button>
              </>
            ) : (
              <Button component={Link} to="/" variant="outlined"
                sx={{ borderColor: "#bfdbfe", borderRadius: 999, color: "#111827", fontWeight: 700, textTransform: "none", "&:hover": { bgcolor: "#eff6ff", borderColor: "#60a5fa" } }}>
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Mobile menu ─────────────────────────────── */}
      {menuOpen && (
        <Box sx={{ animation: "mobileMenuReveal 260ms cubic-bezier(.2,.8,.2,1) both", bgcolor: "#ffffff", borderBottom: "1px solid #e5e7eb", boxShadow: "0 18px 36px rgba(15,23,42,0.14)", display: { xs: "block", md: "none" }, left: 0, position: "fixed", right: 0, top: 70, zIndex: (t) => t.zIndex.appBar - 1, "@keyframes mobileMenuReveal": { "0%": { clipPath: "inset(0 0 100% 0)", opacity: 0, transform: "translateY(-10px)" }, "70%": { clipPath: "inset(0 0 0 0)", opacity: 1 }, "100%": { opacity: 1, transform: "translateY(0)" } } }}>
          <List sx={{ p: 2 }}>
            {visibleNavItems.map((item) => {
              const active = isActivePath(item);
              const visibleDropdown = item.dropdown?.filter((d) => d.roles.includes(userRole));
              if (visibleDropdown?.length) {
                return (
                  <Box key={item.path}>
                    <ListItemButton component={Link} to={item.path}
                      onClick={() => setMobileAssetsOpen((p) => !p)}
                      sx={{ bgcolor: active ? "#eff6ff" : "transparent", borderBottom: "1px solid #f3f4f6", color: active ? "#1d4ed8" : "#111827", px: 1.5, py: 1.5, "&:hover": { bgcolor: "#eff6ff" } }}>
                      <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 15, fontWeight: active ? 800 : 600 }} />
                      <KeyboardArrowDownIcon sx={{ fontSize: 18, transition: "transform 160ms ease", transform: mobileAssetsOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </ListItemButton>
                    {mobileAssetsOpen && visibleDropdown.map((d) => (
                      <ListItemButton key={d.path} component={Link} to={d.path} onClick={() => { setMenuOpen(false); setMobileAssetsOpen(false); }}
                        sx={{ bgcolor: location.pathname.startsWith(d.path) ? "#eff6ff" : "#f8fafc", borderBottom: "1px solid #f3f4f6", color: location.pathname.startsWith(d.path) ? "#1d4ed8" : "#374151", pl: 4, py: 1.25, "&:hover": { bgcolor: "#eff6ff" } }}>
                        <ListItemText primary={d.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
                      </ListItemButton>
                    ))}
                  </Box>
                );
              }
              return (
                <ListItemButton key={item.path} component={Link} to={item.path} onClick={() => setMenuOpen(false)}
                  sx={{ bgcolor: active ? "#eff6ff" : "transparent", borderBottom: "1px solid #f3f4f6", color: active ? "#1d4ed8" : "#111827", px: 1.5, py: 1.5, transition: "transform 160ms ease", "&:hover": { bgcolor: "#eff6ff", transform: "translateX(4px)" }, "&:last-child": { borderBottom: 0 } }}>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 15, fontWeight: active ? 800 : 600 }} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      )}

      {/* ── Logout confirm ───────────────────────────── */}
      <Dialog open={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)}
        PaperProps={{ sx: { animation: "confirmPop 220ms cubic-bezier(.2,.8,.2,1) both", border: "1px solid #dbeafe", borderRadius: 3, boxShadow: "0 24px 70px rgba(15,23,42,0.24)", maxWidth: 380, overflow: "hidden", position: "relative", width: "calc(100% - 32px)", "&::before": { background: "linear-gradient(90deg,transparent,rgba(37,99,235,0.34),transparent)", content: '""', height: 3, left: 0, position: "absolute", right: 0, top: 0 }, "@keyframes confirmPop": { "0%": { opacity: 0, transform: "translateY(10px) scale(0.96)" }, "100%": { opacity: 1, transform: "translateY(0) scale(1)" } } } }}
        BackdropProps={{ sx: { backdropFilter: "blur(5px)", bgcolor: "rgba(15,23,42,0.28)" } }}>
        <DialogTitle sx={{ color: "#111827", fontSize: 20, fontWeight: 800, pb: 1, pt: 3 }}>Confirm Logout</DialogTitle>
        <DialogContent sx={{ color: "#475569", fontSize: 15, pb: 2 }}>Are you sure you want to logout from Asset Manager System?</DialogContent>
        <DialogActions sx={{ gap: 1, px: 3, pb: 3 }}>
          <Button onClick={() => setLogoutConfirmOpen(false)} variant="outlined" sx={{ borderColor: "#bfdbfe", borderRadius: 999, color: "#111827", fontWeight: 700, px: 2.5, textTransform: "none", "&:hover": { bgcolor: "#eff6ff", borderColor: "#60a5fa" } }}>Cancel</Button>
          <Button onClick={handleLogoutConfirm} startIcon={<LogoutIcon />} variant="contained" sx={{ bgcolor: "#2563eb", borderRadius: 999, boxShadow: "0 10px 24px rgba(37,99,235,0.28)", fontWeight: 800, px: 2.5, textTransform: "none", "&:hover": { bgcolor: "#1d4ed8", boxShadow: "0 14px 30px rgba(37,99,235,0.34)" }, "&:active": { transform: "scale(0.97)" } }}>Logout</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;
