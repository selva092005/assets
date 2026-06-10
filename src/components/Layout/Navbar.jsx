import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar, Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, List, ListItemButton, ListItemText, Toolbar, Typography,
  Popover, Badge, Divider, Tooltip,
} from "@mui/material";
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  AssignmentInd as AssignmentIndIcon,
  SwapHoriz as SwapHorizIcon,
  Delete as DeleteIcon,
  UploadFile as UploadFileIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  NotificationsActive as NotificationsActiveIcon,
  Close as CloseIcon,
  Storage as StorageIcon,
} from "@mui/icons-material";
import { logoutUser } from "../../store/slices/authSlice";
import { NotificationBell } from "./NotificationBell";
import amsLogo from "../../assets/ams_no_bg.png";
import { FONT_FAMILIES } from "../../theme/tokens";
import toast from "../../utils/toast.jsx";

// ── Nav items — role restrictions defined here ─────────────────────────────
const navItems = [
  { label: "Dashboard", path: "/home", end: true, roles: ["admin", "manager", "user"] },
  {
    label: "Assets", path: "/home/assets", roles: ["admin", "manager", "user"],
    dropdown: [
      { label: "Allocation", path: "/home/allocation", roles: ["admin", "manager"] },
      { label: "Transfer", path: "/home/transfer", roles: ["admin", "manager"] },
      { label: "Disposal", path: "/home/disposal", roles: ["admin"] },
    ],
  },
  { label: "Users", path: "/home/users", roles: ["admin", "manager"] },
  { label: "Locations", path: "/home/locations", roles: ["admin", "manager"] },
  { label: "Reports", path: "/home/reports", roles: ["admin", "manager", "user"] },
];

const getDropdownMeta = (label) => {
  switch (label) {
    case "Assets Registry":
      return {
        icon: <StorageIcon sx={{ fontSize: 16 }} />,
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.04)",
        subtitle: "Inventory database & status tracking",
      };
    case "Allocation":
      return {
        icon: <AssignmentIndIcon sx={{ fontSize: 16 }} />,
        color: "#2563eb",
        bg: "rgba(37,99,235,0.04)",
        subtitle: "Assign assets to employees",
      };
    case "Transfer":
      return {
        icon: <SwapHorizIcon sx={{ fontSize: 16 }} />,
        color: "#10b981",
        bg: "rgba(16,185,129,0.04)",
        subtitle: "Relocate assets between sites",
      };
    case "Disposal":
      return {
        icon: <DeleteIcon sx={{ fontSize: 16 }} />,
        color: "#f43f5e",
        bg: "rgba(244,63,94,0.04)",
        subtitle: "Retire, sell or scrap assets",
      };
    case "Bulk Upload":
      return {
        icon: <UploadFileIcon sx={{ fontSize: 16 }} />,
        color: "#d97706",
        bg: "rgba(217,119,6,0.04)",
        subtitle: "Import assets via Excel template",
      };
    default:
      return {
        icon: null,
        color: "#64748b",
        bg: "rgba(241,245,249,0.04)",
        subtitle: "",
      };
  }
};

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

const rolePillTheme = {
  admin: {
    bg: "linear-gradient(135deg, rgba(180, 83, 9, 0.04) 0%, rgba(254, 243, 199, 0.4) 100%)",
    hoverBg: "linear-gradient(135deg, rgba(180, 83, 9, 0.08) 0%, rgba(254, 243, 199, 0.6) 100%)",
    border: "rgba(180, 83, 9, 0.16)",
    hoverBorder: "rgba(180, 83, 9, 0.36)",
    shadow: "0 0 14px rgba(180, 83, 9, 0.10)",
  },
  manager: {
    bg: "linear-gradient(135deg, rgba(3, 105, 161, 0.04) 0%, rgba(224, 242, 254, 0.4) 100%)",
    hoverBg: "linear-gradient(135deg, rgba(3, 105, 161, 0.08) 0%, rgba(224, 242, 254, 0.6) 100%)",
    border: "rgba(3, 105, 161, 0.16)",
    hoverBorder: "rgba(3, 105, 161, 0.36)",
    shadow: "0 0 14px rgba(3, 105, 161, 0.10)",
  },
  user: {
    bg: "linear-gradient(135deg, rgba(71, 85, 105, 0.04) 0%, rgba(241, 245, 249, 0.5) 100%)",
    hoverBg: "linear-gradient(135deg, rgba(71, 85, 105, 0.08) 0%, rgba(241, 245, 249, 0.7) 100%)",
    border: "rgba(71, 85, 105, 0.16)",
    hoverBorder: "rgba(71, 85, 105, 0.36)",
    shadow: "0 0 14px rgba(71, 85, 105, 0.10)",
  }
};



const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { isLoggedIn, userRole, userName, userEmail } = useSelector((s) => s.auth);

  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [mobileAssetsOpen, setMobileAssetsOpen] = useState(false);

  const [isAssetsHovered, setIsAssetsHovered] = useState(false);
  const assetsHoverTimer = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleAssetsEnter = () => {
    clearTimeout(assetsHoverTimer.current);
    setIsAssetsHovered(true);
  };

  const handleAssetsLeave = () => {
    assetsHoverTimer.current = setTimeout(() => {
      setIsAssetsHovered(false);
    }, 200);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 900) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
  const pillTheme = isAdmin ? rolePillTheme.admin : isManager ? rolePillTheme.manager : rolePillTheme.user;

  // Filter nav items by current user role
  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  // Generate allowed subtabs dynamically under Assets
  const assetsItem = navItems.find((item) => item.label === "Assets");
  const visibleSubtabs = [];
  if (assetsItem) {
    visibleSubtabs.push({ label: "Assets Registry", path: assetsItem.path, roles: assetsItem.roles });
    if (assetsItem.dropdown) {
      assetsItem.dropdown.forEach((d) => {
        visibleSubtabs.push(d);
      });
    }
  }
  const allowedSubtabs = visibleSubtabs.filter((sub) => sub.roles.includes(userRole));

  const isAssetsActive =
    location.pathname.startsWith("/home/assets") ||
    location.pathname.startsWith("/home/allocation") ||
    location.pathname.startsWith("/home/transfer") ||
    location.pathname.startsWith("/home/disposal");

  const activeIndex = allowedSubtabs.findIndex((tab) =>
    tab.path === "/home/assets"
      ? location.pathname === "/home/assets"
      : location.pathname.startsWith(tab.path)
  );

  const showSubtabs = isAssetsHovered && allowedSubtabs.length > 1;

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
          <Box sx={{ background: "linear-gradient(135deg, rgba(239, 246, 255, 0.9), rgba(219, 234, 254, 0.95))", border: "1px solid rgba(191, 219, 254, 0.8)", backdropFilter: "blur(12px)", borderRadius: 999, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)", display: { xs: "none", md: "flex" }, gap: 0.25, p: "3px" }}>
            {visibleNavItems.map((item) => {
              const active = item.path === "/home/assets"
                ? isAssetsActive
                : isActivePath(item);

              const hasSubmenu = item.path === "/home/assets" && allowedSubtabs.length > 1;

              if (hasSubmenu) {
                return (
                  <Box key={item.path}
                    onMouseEnter={handleAssetsEnter}
                    onMouseLeave={handleAssetsLeave}
                    sx={{ position: "relative" }}
                  >
                    {/* Nav button */}
                    <Button
                      component={Link} to={item.path}
                      sx={{
                        bgcolor: (active || isAssetsHovered) ? "rgba(255, 255, 255, 0.85)" : "transparent",
                        border: "1px solid",
                        borderColor: (active || isAssetsHovered) ? "rgba(37, 99, 235, 0.25)" : "transparent",
                        borderRadius: 999,
                        boxShadow: (active || isAssetsHovered) ? "0 2px 8px rgba(37,99,235,0.08)" : "none",
                        color: (active || isAssetsHovered) ? "#2563eb" : "#475569",
                        fontWeight: (active || isAssetsHovered) ? 700 : 500,
                        fontSize: 12, px: 1.25, py: 0.4, minHeight: 0, textTransform: "none",
                        transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.95)", color: "#2563eb", borderColor: "rgba(37, 99, 235, 0.35)" },
                      }}>
                      {item.label}
                    </Button>

                    {/* Professional SaaS Magnetic Glass Pill Subtabs */}
                    {showSubtabs && (
                      <Box
                        onMouseEnter={handleAssetsEnter}
                        onMouseLeave={handleAssetsLeave}
                        onMouseMove={handleMouseMove}
                        sx={{
                          position: "absolute",
                          top: "calc(100% + 7px)",
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: `radial-gradient(90px circle at ${mousePos.x}px ${mousePos.y}px, rgba(37, 99, 235, 0.09), transparent 80%), rgba(255, 255, 255, 0.94)`,
                          backdropFilter: "blur(16px)",
                          border: "1px solid rgba(226, 232, 240, 0.9)",
                          borderRadius: "999px",
                          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 4px 10px -6px rgba(0, 0, 0, 0.02)",
                          p: "3.5px",
                          display: "flex",
                          gap: "3px",
                          zIndex: 1400,
                          whiteSpace: "nowrap",
                          animation: "premiumDrop 220ms cubic-bezier(.16,1,.3,1) both",
                          "@keyframes premiumDrop": {
                            "0%": { opacity: 0, transform: "translateX(-50%) translateY(-5px) scale(0.98)" },
                            "100%": { opacity: 1, transform: "translateX(-50%) translateY(0) scale(1)" },
                          },
                          // Pointer connection arrow
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: -4,
                            left: "50%",
                            transform: "translateX(-50%) rotate(45deg)",
                            width: 7,
                            height: 7,
                            bgcolor: "rgba(255, 255, 255, 0.94)",
                            borderTop: "1px solid rgba(226, 232, 240, 0.9)",
                            borderLeft: "1px solid rgba(226, 232, 240, 0.9)",
                          }
                        }}
                      >
                        {allowedSubtabs.map((tab) => {
                          const isTabActive = tab.path === "/home/assets"
                            ? location.pathname === "/home/assets"
                            : location.pathname.startsWith(tab.path);

                          return (
                            <Button
                              key={tab.path}
                              component={Link}
                              to={tab.path}
                              onClick={() => setIsAssetsHovered(false)}
                              sx={{
                                fontSize: 10.5,
                                fontWeight: isTabActive ? 700 : 500,
                                textTransform: "none",
                                px: 1.5,
                                py: 0.35,
                                borderRadius: "999px",
                                minWidth: 0,
                                color: isTabActive ? "#2563eb" : "#475569",
                                background: isTabActive 
                                  ? "linear-gradient(135deg, #eff6ff, #dbeafe)" 
                                  : "transparent",
                                border: "1px solid",
                                borderColor: isTabActive ? "rgba(37, 99, 235, 0.2)" : "transparent",
                                transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                                "&:hover": {
                                  background: isTabActive 
                                    ? "linear-gradient(135deg, #eff6ff, #dbeafe)" 
                                    : "rgba(241, 245, 249, 0.85)",
                                  color: "#2563eb",
                                  borderColor: isTabActive ? "rgba(37, 99, 235, 0.3)" : "rgba(226, 232, 240, 0.6)",
                                  transform: "translateY(-1px)",
                                },
                                "&:active": {
                                  transform: "scale(0.97) translateY(0)",
                                }
                              }}
                            >
                              {tab.label}
                            </Button>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                );
              }
              return (
                <Button key={item.path} component={Link} to={item.path}
                  sx={{
                    bgcolor: active ? "rgba(255, 255, 255, 0.85)" : "transparent",
                    border: "1px solid",
                    borderColor: active ? "rgba(37, 99, 235, 0.25)" : "transparent",
                    borderRadius: 999,
                    boxShadow: active ? "0 2px 8px rgba(37,99,235,0.08)" : "none",
                    color: active ? "#2563eb" : "#475569",
                    fontWeight: active ? 700 : 500,
                    fontSize: 12, px: 1.25, py: 0.4, minHeight: 0, textTransform: "none",
                    transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.95)", color: "#2563eb", borderColor: "rgba(37, 99, 235, 0.35)" }
                  }}>
                  {item.label}
                </Button>
              );
            })}
          </Box>

          {/* Right side */}
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>

            {/* Mobile hamburger */}
            <IconButton aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} onClick={() => setMenuOpen((prev) => !prev)} size="small"
              sx={{ border: "1px solid #e5e7eb", display: { xs: "inline-flex", md: "none" }, p: 0.5, "&:hover": { bgcolor: "#eff6ff" } }}>
              {menuOpen ? <CloseIcon sx={{ fontSize: 18 }} /> : <MenuIcon sx={{ fontSize: 18 }} />}
            </IconButton>

            {isLoggedIn ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* Ultra-Premium 3D Coin-Spin Reveal Morph Profile Capsule */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    height: 32,
                    minWidth: 32,
                    borderRadius: "16px",
                    background: roleStyle.bg,
                    color: roleStyle.color,
                    border: `1.5px solid ${roleStyle.color}22`,
                    pl: 0.5,
                    pr: 0.5,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                    transition: "all 380ms cubic-bezier(0.4, 0, 0.2, 1)",
                    overflow: "hidden",
                    "&:hover": {
                      pl: 0.75,
                      pr: 1.5,
                      boxShadow: `0 4px 14px ${roleStyle.color}20`,
                      borderColor: `${roleStyle.color}45`,
                      "& .icon-rotator": {
                        transform: "rotate(360deg)",
                      },
                      "& .role-letter": {
                        opacity: 0,
                        transform: "scale(0) rotate(-180deg)",
                      },
                      "& .role-icon-reveal": {
                        opacity: 1,
                        transform: "scale(1) rotate(0)",
                      },
                      "& .username-reveal": {
                        maxWidth: 160,
                        opacity: 1,
                        transform: "translateX(0)",
                        pl: 0.75,
                      }
                    }
                  }}
                  title={`${roleLabel} Account: ${userName || "Guest"}`}
                >
                  {/* Left Side: Coin-Spinning Icon / Letter Stack */}
                  <Box
                    className="icon-rotator"
                    sx={{
                      position: "relative",
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "transform 420ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {/* Role Letter */}
                    <Box
                      className="role-letter"
                      sx={{
                        position: "absolute",
                        fontSize: 12,
                        fontWeight: 900,
                        fontFamily: FONT_FAMILIES.header,
                        textTransform: "uppercase",
                        opacity: 1,
                        transform: "scale(1) rotate(0)",
                        transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    >
                      {roleLabel[0].toUpperCase()}
                    </Box>

                    {/* Role Icon */}
                    <RoleIcon
                      className="role-icon-reveal"
                      sx={{
                        position: "absolute",
                        fontSize: 13,
                        opacity: 0,
                        transform: "scale(0) rotate(180deg)",
                        transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </Box>

                  {/* Right Side: Wipe-revealed Username */}
                  <Box
                    className="username-reveal"
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      fontFamily: FONT_FAMILIES.header,
                      letterSpacing: "0.2px",
                      whiteSpace: "nowrap",
                      maxWidth: 0,
                      opacity: 0,
                      transform: "translateX(-8px)",
                      transition: "all 380ms cubic-bezier(0.4, 0, 0.2, 1)",
                      pl: 0,
                    }}
                  >
                    {userName || "Guest"}
                  </Box>
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
                      <ListItemText primary={<Typography sx={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{item.label}</Typography>} />
                      <KeyboardArrowDownIcon sx={{ fontSize: 15, transition: "transform 160ms ease", transform: mobileAssetsOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </ListItemButton>
                    {mobileAssetsOpen && visibleDropdown.map((d) => (
                      <ListItemButton key={d.path} component={Link} to={d.path} onClick={() => { setMenuOpen(false); setMobileAssetsOpen(false); }}
                        sx={{ bgcolor: location.pathname.startsWith(d.path) ? "#eff6ff" : "#f8fafc", borderBottom: "1px solid #f3f4f6", color: location.pathname.startsWith(d.path) ? "#1d4ed8" : "#374151", pl: 3, py: 0.6, "&:hover": { bgcolor: "#eff6ff" } }}>
                        <ListItemText primary={<Typography sx={{ fontSize: 12, fontWeight: 500 }}>{d.label}</Typography>} />
                      </ListItemButton>
                    ))}
                  </Box>
                );
              }
              return (
                <ListItemButton key={item.path} component={Link} to={item.path} onClick={() => setMenuOpen(false)}
                  sx={{ bgcolor: active ? "#eff6ff" : "transparent", borderBottom: "1px solid #f3f4f6", color: active ? "#1d4ed8" : "#111827", px: 1.25, py: 0.75, "&:hover": { bgcolor: "#eff6ff" }, "&:last-child": { borderBottom: 0 } }}>
                  <ListItemText primary={<Typography sx={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{item.label}</Typography>} />
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
          <Typography sx={{ color: "#0f172a", fontSize: 14, fontWeight: 700, mb: 0.5, fontFamily: FONT_FAMILIES.header }}>
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
