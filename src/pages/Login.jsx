import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "../utils/toast.jsx";
import { loginThunk } from "../store/slices/authSlice";
import { isValidEmail } from "../utils/validate";
import amsLogo from "../assets/ams_no_bg.png";

import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff, EmailOutlined, LockOutlined, ArrowForward, Inventory2Outlined, QrCode, QrCodeScanner } from "@mui/icons-material";
import { COLORS } from "../theme/tokens";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../theme/theme";

/* ─── Tactile Recessed Input Custom Styles ───────────────────────────── */
const tactileInputStyle = {
  position: "relative",
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    background: "#f8fafc",
    boxShadow: "inset 0 1.5px 3px rgba(15, 23, 42, 0.04)",
    transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
    fontSize: "0.85rem",
    "& fieldset": {
      borderColor: "#e2e8f0",
      transition: "all 250ms ease",
    },
    "&:hover": {
      background: "#f1f5f9",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(37,99,235,0.08), inset 0 1.5px 3px rgba(15,23,42,0.04)",
    },
    "&:hover fieldset": { borderColor: "#93c5fd" },
    "&.Mui-focused": {
      background: "#ffffff",
      transform: "translateY(-2px)",
      boxShadow: "0 8px 24px -4px rgba(37,99,235,0.18), 0 0 0 3px rgba(37,99,235,0.08)",
    },
    "&.Mui-focused fieldset": {
      borderColor: COLORS.primary,
      borderWidth: "2px",
    },
    "&.Mui-error fieldset": {
      borderColor: "#ef4444",
      animation: "errorBorderPulse 0.5s ease",
    },
  },
  "@keyframes errorBorderPulse": {
    "0%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" },
    "70%": { boxShadow: "0 0 0 6px rgba(239,68,68,0)" },
    "100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0)" },
  },
};

/* ─── Blue Gradient Button with Sliding Arrow ────────────────────────── */
const submitBtnStyle = {
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  backgroundSize: "200% 100%",
  color: "#ffffff",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.8rem",
  borderRadius: "8px",
  py: 1.0,
  boxShadow: "0 4px 10px rgba(37, 99, 235, 0.15)",
  transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
  "& .MuiButton-endIcon": { transition: "transform 250ms ease" },
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0, left: "-100%",
    width: "60%",
    height: "100%",
    background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.18), transparent)",
    animation: "btnShimmer 2.5s infinite",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    top: "50%", left: "50%",
    width: 0, height: 0,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.25)",
    transform: "translate(-50%,-50%)",
    transition: "width 0.5s ease, height 0.5s ease",
  },
  "&:active::after": {
    width: "300px",
    height: "300px",
  },
  "@keyframes btnShimmer": {
    "0%": { left: "-100%" },
    "60%, 100%": { left: "160%" },
  },
  "&:hover": {
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    boxShadow: "0 8px 20px rgba(37,99,235,0.35)",
    transform: "translateY(-2px) scale(1.01)",
    "& .MuiButton-endIcon": { transform: "translateX(5px)" },
  },
  "&:active": { transform: "translateY(1px) scale(0.98)" },
  "&.Mui-disabled": {
    background: "#e2e8f0",
    color: "#94a3b8",
    boxShadow: "none",
  },
};

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggedIn, loading, error: storeError } = useSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [passwordTyped, setPasswordTyped] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isWaitingForColdStart, setIsWaitingForColdStart] = useState(false);

  if (isLoggedIn && !isZooming) return <Navigate to="/home" replace />;

  const handleInputChange = () => {
    if (loginFailed && !isRepairing) {
      setIsRepairing(true);
      setTimeout(() => {
        setIsRepairing(false);
        setLoginFailed(false);
      }, 1600);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const fe = {};
    if (!email.trim()) fe.email = "Email is required";
    else if (!isValidEmail(email)) fe.email = "Enter a valid email address";
    if (!password) fe.password = "Password is required";
    else if (password.length < 6) fe.password = "Password must be at least 6 characters";
    if (Object.keys(fe).length > 0) {
      setFieldErrors(fe);
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
      return;
    }
    setFieldErrors({ email: "", password: "" });
    setIsZooming(true);
    setIsWaitingForColdStart(false);

    // Show warning if it takes > 3.5 seconds (likely Render cold-start)
    const coldStartTimer = setTimeout(() => {
      setIsWaitingForColdStart(true);
    }, 3500);

    const startTime = Date.now();

    try {
      const result = await dispatch(loginThunk(email, password));
      clearTimeout(coldStartTimer);
      setIsWaitingForColdStart(false);

      const elapsedTime = Date.now() - startTime;
      const remainingDelay = Math.max(0, 1800 - elapsedTime);

      if (result?.success) {
        setTimeout(() => {
          setLoginSuccess(true);
          toast.success("Welcome back!");
          setTimeout(() => navigate("/home"), 850);
        }, remainingDelay);
      } else {
        setTimeout(() => {
          setIsZooming(false);
          setShakeTrigger(true);
          setTimeout(() => setShakeTrigger(false), 500);
          setLoginFailed(true);
          const errMsg = result?.error || storeError || "Login failed";
          toast.error(errMsg);

          const normalizedErr = errMsg.toLowerCase();
          if (normalizedErr.includes("password") || normalizedErr.includes("credential")) {
            setFieldErrors({ email: "", password: errMsg });
          } else {
            setFieldErrors({ email: errMsg, password: "" });
          }
        }, remainingDelay);
      }
    } catch (err) {
      clearTimeout(coldStartTimer);
      setIsWaitingForColdStart(false);
      setIsZooming(false);
      toast.error("An unexpected login error occurred");
    }
  };

  const handleDemoLogin = async (role) => {
    let demoEmail = "";
    let demoPassword = "";

    if (role === "admin") {
      demoEmail = "admin@gmail.com";
      demoPassword = "Admin@123";
    } else {
      demoEmail = "user@organization.com";
      demoPassword = "User@123";
    }

    setEmail(demoEmail);
    setPassword(demoPassword);
    setPasswordTyped(true);
    setFieldErrors({ email: "", password: "" });
    setIsZooming(true);
    setIsWaitingForColdStart(false);

    // Show warning if it takes > 3.5 seconds (likely Render cold-start)
    const coldStartTimer = setTimeout(() => {
      setIsWaitingForColdStart(true);
    }, 3500);

    const startTime = Date.now();

    try {
      const result = await dispatch(loginThunk(demoEmail, demoPassword));
      clearTimeout(coldStartTimer);
      setIsWaitingForColdStart(false);

      const elapsedTime = Date.now() - startTime;
      const remainingDelay = Math.max(0, 1800 - elapsedTime);

      if (result?.success) {
        setTimeout(() => {
          setLoginSuccess(true);
          toast.success("Welcome back!");
          setTimeout(() => navigate("/home"), 850);
        }, remainingDelay);
      } else {
        setTimeout(() => {
          setIsZooming(false);
          setShakeTrigger(true);
          setTimeout(() => setShakeTrigger(false), 500);
          setLoginFailed(true);
          const errMsg = result?.error || storeError || "Login failed";
          toast.error(errMsg);
        }, remainingDelay);
      }
    } catch (err) {
      clearTimeout(coldStartTimer);
      setIsWaitingForColdStart(false);
      setIsZooming(false);
      toast.error("An unexpected login error occurred");
    }
  };



  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #eff6ff 100%)",
          px: 2,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Vector Accent 1: Rotating Concentric Radar Rings (Top Left) */}
        <Box sx={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: { xs: 240, md: 360 },
          height: { xs: 240, md: 360 },
          opacity: 0.15,
          pointerEvents: "none",
          animation: "spin 40s linear infinite",
          zIndex: 1,
        }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#2563eb" strokeWidth="0.3" strokeDasharray="2, 2" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="#2563eb" strokeWidth="0.3" />
            <circle cx="50" cy="50" r="22" fill="none" stroke="#1d4ed8" strokeWidth="0.4" strokeDasharray="6, 3" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="#2563eb" strokeWidth="0.15" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="#2563eb" strokeWidth="0.15" />
          </svg>
        </Box>

        {/* Vector Accent 2: Floating Connecting Mesh Network (Bottom Right) */}
        <Box sx={{
          position: "absolute",
          bottom: "8%",
          right: "5%",
          width: { xs: 280, md: 420 },
          height: { xs: 280, md: 420 },
          opacity: 0.12,
          pointerEvents: "none",
          animation: "float 24s ease-in-out infinite",
          zIndex: 1,
        }}>
          <svg width="100%" height="100%" viewBox="0 0 120 120">
            <path d="M20,100 L40,80 L80,80 L100,40 M40,80 L60,40 L100,40" fill="none" stroke="#2563eb" strokeWidth="0.5" />
            <circle cx="20" cy="100" r="2" fill="#2563eb" />
            <circle cx="40" cy="80" r="2" fill="#1d4ed8" />
            <circle cx="80" cy="80" r="2.5" fill="#2563eb" />
            <circle cx="100" cy="40" r="3" fill="#2563eb" />
            <circle cx="60" cy="40" r="2" fill="#1d4ed8" />
          </svg>
        </Box>

        {/* ── CARD BOX CONTAINER ── */}
        <Box
          className={`center-card-container ${isZooming && !loginSuccess ? "authenticating" : ""
            } ${loginSuccess ? "success-transition" : ""
            } ${shakeTrigger ? "error-shake" : ""
            }`}
          sx={{
            width: "100%",
            maxWidth: 410,
            position: "relative",
            transform: "translateY(-40px)",
            zIndex: 10
          }}
        >

          {/* Card Outer Shadow Halo */}
          <Box sx={{
            position: "absolute",
            top: 6, left: 6, right: 6, bottom: 6,
            background: "rgba(37, 99, 235, 0.03)",
            filter: "blur(24px)",
            borderRadius: "16px",
            pointerEvents: "none",
            zIndex: -1,
          }} />

          {/* Overlapping Floating Logo Badge */}
          <Box sx={{
            position: "absolute",
            top: "-26px",
            left: "calc(50% - 26px)",
            width: 52,
            height: 52,
            borderRadius: "12px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 16px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.03)",
            zIndex: 10,
          }}>
            <Box component="img" src={amsLogo} alt="AMS Logo" sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.5, borderRadius: "11px" }} />
          </Box>

          <Card
            elevation={0}
            sx={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02), 0 10px 20px -5px rgba(15, 23, 42, 0.03), 0 30px 60px -15px rgba(15, 23, 42, 0.06)",
              overflow: "visible",
              p: 3.5,
              pt: 5,
              transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02), 0 15px 30px -5px rgba(15, 23, 42, 0.04), 0 45px 80px -20px rgba(15, 23, 42, 0.08)",
              }
            }}
          >
            {/* Header branding & keycard reader slot */}
            <Box className={`keycard-reader-container ${email.length > 0 ? "email-typed" : ""} ${password.length > 0 ? "password-typed" : ""} ${(loading || isZooming) ? "authenticating" : ""} ${loginFailed ? "failed" : ""} ${loginSuccess ? "success" : ""}`} sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3, textAlign: "center", position: "relative" }}>
              <Typography sx={{ color: "#64748b", fontSize: "0.85rem", mt: 0.5, fontWeight: 600, mb: 1.5 }}>
                Asset Management System
              </Typography>

              {/* Keycard Reader SVG */}
              <Box sx={{ width: 140, height: 60, display: "flex", justifyContent: "center", mb: 1 }}>
                <svg className="keycard-reader-svg" width="100%" height="100%" viewBox="0 0 140 60" style={{ overflow: "visible" }}>
                  <defs>
                    <linearGradient id="card-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>

                  {/* Card Slot Reader base */}
                  <rect x="35" y="32" width="70" height="14" rx="3" fill="#334155" stroke="#475569" strokeWidth="1" />

                  {/* Real insertion slot line */}
                  <rect x="42" y="36" width="56" height="5" rx="1.5" fill="#0f172a" />

                  {/* Security Clearance text on the reader */}
                  <text x="70" y="41" fontSize="3.5" fill="#94a3b8" textAnchor="middle" letterSpacing="0.3" fontWeight="bold">AMS ACCESS</text>

                  {/* Status Indicator LED */}
                  <circle className="reader-led" cx="96" cy="39" r="2" />

                  {/* Sliding Keycard */}
                  <g className="operator-keycard">
                    {/* Keycard body */}
                    <rect x="48" y="2" width="44" height="28" rx="2" fill="url(#card-grad)" stroke="#60a5fa" strokeWidth="0.5" />

                    {/* Magnetic security stripe at top */}
                    <rect x="48" y="4" width="44" height="4" fill="#1e293b" />

                    {/* Chip contact */}
                    <rect x="54" y="14" width="6" height="5" rx="0.5" fill="#fbbf24" stroke="#d97706" strokeWidth="0.3" />

                    {/* Barcode representation */}
                    <rect x="74" y="14" width="12" height="5" fill="#ffffff" opacity="0.8" />
                    <line x1="77" y1="14" x2="77" y2="19" stroke="#1e293b" strokeWidth="0.5" />
                    <line x1="80" y1="14" x2="80" y2="19" stroke="#1e293b" strokeWidth="0.8" />
                    <line x1="83" y1="14" x2="83" y2="19" stroke="#1e293b" strokeWidth="0.5" />

                    {/* Operator Tag text */}
                    <text x="70" y="25" fontSize="3" fill="#eff6ff" textAnchor="middle" fontWeight="bold">OPERATOR</text>
                  </g>
                </svg>
              </Box>
            </Box>

            {/* Form */}
            <Box component="form" onSubmit={handleLogin} sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>

              {/* Email Section with Static Top Label */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                  Email
                </Typography>
                <TextField
                  fullWidth
                  placeholder="username@organization.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }
                    handleInputChange();
                  }}
                  autoComplete="email"
                  size="medium"
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email}
                  sx={tactileInputStyle}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start" sx={{ color: "#94a3b8", mr: 0.5 }}>
                          <EmailOutlined sx={{
                            fontSize: 16,
                            color: email.length > 0 ? COLORS.primary : "#94a3b8",
                            transition: "color 300ms ease",
                          }} />
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Box>

              {/* Password Section with Static Top Label */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                  Password
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordTyped(e.target.value.length > 0);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }
                    handleInputChange();
                  }}
                  autoComplete="current-password"
                  size="medium"
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password}
                  sx={tactileInputStyle}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 0.5 }}>
                          <LockOutlined sx={{
                            fontSize: 16,
                            color: passwordTyped ? COLORS.primary : "#94a3b8",
                            transition: "color 300ms ease",
                          }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end" sx={{ mr: 0.5 }}>
                          <IconButton
                            onClick={() => setShowPassword((v) => !v)}
                            edge="end"
                            size="small"
                            sx={{ color: "#94a3b8" }}
                          >
                            {showPassword ? <QrCodeScanner sx={{ fontSize: 18, color: "#3b82f6" }} /> : <QrCode sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>



              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || isZooming}
                disableElevation
                endIcon={(loading || isZooming) ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <ArrowForward sx={{ fontSize: 14 }} />}
                sx={submitBtnStyle}
              >
                {(loading || isZooming) ? "Signing In..." : "Sign In"}
              </Button>

              {/* Render Free-Tier Cold-Start Alert */}
              {isWaitingForColdStart && (loading || isZooming) && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: "8px",
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px dashed rgba(245, 158, 11, 0.3)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    textAlign: "left",
                    animation: "fadeInAlert 0.3s ease-in-out",
                    "@keyframes fadeInAlert": {
                      "0%": { opacity: 0, transform: "translateY(5px)" },
                      "100%": { opacity: 1, transform: "translateY(0)" }
                    }
                  }}
                >
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#d97706", display: "flex", alignItems: "center", gap: 0.5 }}>
                    ⏳ Server is waking up...
                  </Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: "#78350f", lineHeight: 1.3 }}>
                    The backend is hosted on a free server. If it was asleep, waking it up can take 50-90 seconds. Thank you for your patience!
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Quick Demo Login Section */}
            <Box sx={{ mt: 3, pt: 2, borderTop: "1px dashed #cbd5e1", textAlign: "center" }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", mb: 1.5 }}>
                Quick Demo Login
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleDemoLogin("admin")}
                  disabled={loading || isZooming}
                  sx={{
                    textTransform: "none",
                    borderRadius: "6px",
                    fontSize: "0.7rem",
                    borderColor: "#3b82f6",
                    color: "#2563eb",
                    "&:hover": {
                      background: "rgba(37, 99, 235, 0.04)",
                      borderColor: "#2563eb",
                    }
                  }}
                >
                  🔑 Demo Admin
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleDemoLogin("user")}
                  disabled={loading || isZooming}
                  sx={{
                    textTransform: "none",
                    borderRadius: "6px",
                    fontSize: "0.7rem",
                    borderColor: "#64748b",
                    color: "#475569",
                    "&:hover": {
                      background: "rgba(100, 116, 139, 0.04)",
                      borderColor: "#475569",
                    }
                  }}
                >
                  👤 Demo Staff
                </Button>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Running Vector Animation at Bottom */}
        <Box sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 160,
          pointerEvents: "none",
          zIndex: 2,
          overflow: "visible"
        }}>
          {/* Ground Track */}
          <Box sx={{
            position: "absolute",
            bottom: 25,
            left: 0,
            width: "100%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #2563eb 20%, #2563eb 80%, transparent)",
            opacity: 0.25,
          }} />

          {/* Speed Lines moving from right to left (always visible, accelerating when zooming) */}
          <Box className={`speed-lines-container ${isZooming ? "zooming" : ""} ${isZooming && !loginSuccess ? "loading-progress" : ""} ${loginSuccess ? "login-success" : ""}`} sx={{ position: "absolute", width: "100%", height: "100%", top: 0, left: 0 }}>
            <Box className="speed-line speed-line-1" sx={{ top: 20, width: 40 }} />
            <Box className="speed-line speed-line-2" sx={{ top: 40, width: 60 }} />
            <Box className="speed-line speed-line-3" sx={{ top: 60, width: 30 }} />
            <Box className="speed-line speed-line-4" sx={{ top: 75, width: 50 }} />
            <Box className="speed-line speed-line-5" sx={{ top: 90, width: 35 }} />
          </Box>

          {/* Moving Vehicle Container */}
          <Box className={`truck-container ${isZooming ? "zooming" : ""} ${isZooming && !loginSuccess ? "loading-progress" : ""} ${loginSuccess ? "login-success" : ""} ${loginFailed ? "crashed" : ""} ${isRepairing ? "repairing" : ""}`}>
            {/* Exhaust puff particles emitting from the rear bumper tailpipe */}
            <Box className="exhaust-puff puff-1" />
            <Box className="exhaust-puff puff-2" />
            <Box className="exhaust-puff puff-3" />

            {/* Boost Flame / Exhaust Fire (only active when zooming) */}
            <Box className="exhaust-flame" />



            {/* Tire smoke/dust burnout particles (only active when zooming) */}
            <Box className="tire-smoke smoke-left-1" />
            <Box className="tire-smoke smoke-left-2" />
            <Box className="tire-smoke smoke-right-1" />
            <Box className="tire-smoke smoke-right-2" />

            <svg viewBox="0 0 120 120" width="120" height="120" style={{ overflow: "visible" }}>
              <defs>
                {/* Fire/Flame Eruption Gradient */}
                <radialGradient id="fire-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="25%" stopColor="#ffea70" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#f97316" stopOpacity="0.8" />
                  <stop offset="85%" stopColor="#dc2626" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
                </radialGradient>
                {/* Volumetric Smoke Gradient */}
                <radialGradient id="smoke-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#64748b" stopOpacity="0.85" />
                  <stop offset="45%" stopColor="#475569" stopOpacity="0.65" />
                  <stop offset="80%" stopColor="#334155" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
                </radialGradient>
                {/* Laser Scanning Beam Gradient */}
                <linearGradient id="laser-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
                  <stop offset="40%" stopColor="#34d399" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Soft shadow below vehicle */}
              <ellipse cx="60" cy="69" rx="46" ry="2.5" fill="rgba(15, 23, 42, 0.12)" />

              {/* Bobbing Truck Chassis and Cabin */}
              <g className="truck-body">
                {/* Flatbed Trailer Platform */}
                <rect x="16" y="50" width="64" height="8" fill="#475569" />
                <rect x="14" y="52" width="4" height="3" rx="0.5" fill="#64748b" /> {/* Tailpipe */}

                {/* Cabin (Front Cab) */}
                <path d="M80,34 L96,34 L100,42 L105,42 L106,46 L106,58 L80,58 Z" fill="#1d4ed8" />

                {/* Cabin window */}
                <path d="M83,38 L93,38 L96,45 L83,45 Z" fill="#eff6ff" opacity="0.85" />

                {/* Headlight & Bumper */}
                <circle cx="104" cy="50" r="1.5" fill="#facc15" />
                <polygon className="headlight-beam" points="106,49 118,45 118,55 106,53" fill="rgba(250, 204, 21, 0.2)" />
                <rect x="100" y="54" width="6" height="3" rx="1" fill="#64748b" />
              </g>

              {/* Physical IT Assets cargo sitting on the flatbed */}
              <g className="flatbed-assets">
                {/* Asset 1: Server Rack Cabinet */}
                <g className="asset-server">
                  <rect x="20" y="24" width="16" height="26" rx="2" fill="#1e293b" />
                  {/* Server unit slot panels */}
                  <line x1="23" y1="28" x2="33" y2="28" stroke="#475569" strokeWidth="1.2" />
                  <line x1="23" y1="33" x2="33" y2="33" stroke="#475569" strokeWidth="1.2" />
                  <line x1="23" y1="38" x2="33" y2="38" stroke="#475569" strokeWidth="1.2" />
                  <line x1="23" y1="43" x2="33" y2="43" stroke="#475569" strokeWidth="1.2" />
                  {/* Pulsing Status LEDs */}
                  <circle cx="34" cy="28" r="0.8" fill="#10b981" />
                  <circle cx="34" cy="33" r="0.8" fill="#06b6d4" className="server-led" />
                  <circle cx="34" cy="38" r="0.8" fill="#f59e0b" />
                  <circle cx="34" cy="43" r="0.8" fill="#ef4444" className="server-led" style={{ animationDelay: "0.4s" }} />
                </g>

                {/* Asset 2: Barcode Crate Box */}
                <g className="asset-crate">
                  <rect x="40" y="34" width="18" height="16" rx="1.5" fill="#d97706" />
                  {/* Crate barcode lines */}
                  <rect x="44" y="39" width="2" height="6" fill="#1e293b" />
                  <rect x="47" y="39" width="1" height="6" fill="#1e293b" />
                  <rect x="49" y="39" width="2" height="6" fill="#1e293b" />
                  <rect x="52" y="39" width="1" height="6" fill="#1e293b" />
                </g>

                {/* Asset 3: Office Monitor Screen */}
                <g className="asset-monitor">
                  <path d="M68,46 L70,46 L69,50 Z" fill="#64748b" /> {/* Stand */}
                  <rect x="61" y="32" width="16" height="14" rx="1" fill="#475569" /> {/* Bezel */}
                  <rect x="62" y="33" width="14" height="10" fill="#0f172a" /> {/* Display Screen */}
                  <path d="M64,40 L67,37 L70,39 L74,35" fill="none" stroke="#10b981" strokeWidth="1" strokeLinejoin="round" /> {/* Line chart */}
                </g>
              </g>

              {/* Spinning wheels */}
              <g className="truck-wheel wheel-left">
                <circle cx="32" cy="60" r="8" fill="#1e293b" />
                <circle cx="32" cy="60" r="3.5" fill="#cbd5e1" />
                <line x1="32" y1="52" x2="32" y2="68" stroke="#1e293b" strokeWidth="1" />
                <line x1="24" y1="60" x2="40" y2="60" stroke="#1e293b" strokeWidth="1" />
              </g>
              <g className="truck-wheel wheel-right">
                <circle cx="88" cy="60" r="8" fill="#1e293b" />
                <circle cx="88" cy="60" r="3.5" fill="#cbd5e1" />
                <line x1="88" y1="52" x2="88" y2="68" stroke="#1e293b" strokeWidth="1" />
                <line x1="80" y1="60" x2="96" y2="60" stroke="#1e293b" strokeWidth="1" />
              </g>

              {/* crash fire, smoke, and embers */}
              {loginFailed && (
                <g>
                  {/* Smoke clouds using radial smoke gradient */}
                  <circle className="crash-smoke s1" cx="101" cy="44" r="10" fill="url(#smoke-grad)" />
                  <circle className="crash-smoke s2" cx="103" cy="42" r="7" fill="url(#smoke-grad)" />
                  <circle className="crash-smoke s3" cx="99" cy="43" r="8" fill="url(#smoke-grad)" />
                  <circle className="crash-smoke s4" cx="102" cy="41" r="6" fill="url(#smoke-grad)" />

                  {/* Fire/Flame eruption using radial fire gradient */}
                  <circle className="crash-fire f1" cx="101" cy="45" r="8" fill="url(#fire-grad)" />
                  <circle className="crash-fire f2" cx="103" cy="43" r="6" fill="url(#fire-grad)" />
                  <circle className="crash-fire f3" cx="100" cy="44" r="4" fill="url(#fire-grad)" />

                  {/* Rising glowing embers */}
                  <circle className="crash-ember e1" cx="101" cy="44" r="1.2" fill="#fbbf24" />
                  <circle className="crash-ember e2" cx="102" cy="42" r="0.9" fill="#f97316" />
                  <circle className="crash-ember e3" cx="100" cy="45" r="1.5" fill="#fef08a" />
                  <circle className="crash-ember e4" cx="99" cy="43" r="1" fill="#ef4444" />
                  <circle className="crash-ember e5" cx="103" cy="44" r="0.8" fill="#fbbf24" />

                  {/* Repair Action Visuals */}
                  {isRepairing && (
                    <g className="repair-indicator">
                      {/* Green Sparkles */}
                      <circle className="repair-sparkle rs1" cx="97" cy="40" r="1" fill="#34d399" />
                      <circle className="repair-sparkle rs2" cx="105" cy="38" r="1.5" fill="#6ee7b7" />
                      <circle className="repair-sparkle rs3" cx="101" cy="35" r="0.8" fill="#a7f3d0" />

                      {/* High-Tech Repair Drone hovering and scanning */}
                      <g className="repair-drone">
                        {/* Scan Laser Beam */}
                        <polygon points="101,22 93,44 109,44" fill="url(#laser-grad)" className="drone-laser" />

                        {/* Landing skids */}
                        <line x1="98" y1="24" x2="97" y2="28" stroke="#475569" strokeWidth="1" />
                        <line x1="104" y1="24" x2="105" y2="28" stroke="#475569" strokeWidth="1" />
                        <line x1="95" y1="28" x2="107" y2="28" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />

                        {/* Propeller arms */}
                        <line x1="97" y1="22" x2="91" y2="18" stroke="#475569" strokeWidth="1.2" />
                        <line x1="105" y1="22" x2="111" y2="18" stroke="#475569" strokeWidth="1.2" />

                        {/* Rotor pins */}
                        <circle cx="91" cy="18" r="0.8" fill="#1e293b" />
                        <circle cx="111" cy="18" r="0.8" fill="#1e293b" />

                        {/* Spinning rotor blades */}
                        <ellipse cx="91" cy="18" rx="6" ry="1.2" fill="#cbd5e1" opacity="0.75" className="drone-prop" />
                        <ellipse cx="111" cy="18" rx="6" ry="1.2" fill="#cbd5e1" opacity="0.75" className="drone-prop" />

                        {/* Fuselage body */}
                        <rect x="97" y="20" width="8" height="4" rx="1.5" fill="#334155" />

                        {/* Glowing camera eye */}
                        <circle cx="101" cy="22" r="1.2" fill="#38bdf8" className="drone-eye" />
                      </g>
                    </g>
                  )}
                </g>
              )}
            </svg>
          </Box>
        </Box>
      </Box>

      {/* Vector animations definition */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(4deg); }
        }

        /* Stationary Parked Position (Bottom-Center) */
        .truck-container {
          position: absolute;
          bottom: 12px;
          left: calc(50% - 60px);
          width: 120px;
          height: 80px;
          transition: left 0.3s ease;
        }

        /* Loading/Progress State while API call is running (crawls slowly across screen) */
        .truck-container.loading-progress {
          left: 75% !important;
          transition: left 18s cubic-bezier(0.1, 0.8, 0.25, 1) !important;
        }

        /* Fast Zoom-Off on Success */
        .truck-container.login-success {
          left: 120% !important;
          transition: left 0.45s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Chassis and Cab normal suspension vibration */
        .truck-body {
          animation: truckBob 0.35s ease-in-out infinite;
        }

        /* Flatbed cargo assets vibrate independently from chassis */
        .flatbed-assets {
          animation: truckBob 0.4s ease-in-out infinite;
          animation-delay: -0.05s;
        }

        /* Server Cabinet & Monitor shake dynamically under loading / acceleration */
        .loading-progress .flatbed-assets {
          animation: shakeAssets 0.25s linear infinite !important;
        }
        .login-success .flatbed-assets {
          animation: shakeAssets 0.08s linear infinite !important;
        }

        /* Torque lift and chassis vibration on loading / zoom off */
        .loading-progress .truck-body {
          animation: truckZoomBob 0.25s linear infinite !important;
        }
        .login-success .truck-body {
          animation: truckZoomBob 0.08s linear infinite !important;
        }

        {/* Flashing server rack cabinet indicators */}
        .server-led {
          animation: blinkLed 0.8s infinite ease-in-out;
        }

        /* Wheel rotation animation (slow roll by default) */
        .truck-wheel {
          transform-box: fill-box;
          transform-origin: center;
          animation: spin 2.8s linear infinite;
        }

        .repairing .truck-wheel {
          animation: none !important;
        }

        /* Spin wheels relative to vehicle speed state */
        .loading-progress .truck-wheel {
          animation: spin 0.6s linear infinite !important;
        }
        .login-success .truck-wheel {
          animation: spin 0.08s linear infinite !important;
        }

        /* Slower exhaust puff smoke particles emitting when parked/idling */
        .exhaust-puff {
          position: absolute;
          left: 12px;
          top: 52px;
          width: 5px;
          height: 5px;
          background: #cbd5e1;
          border-radius: 50%;
          opacity: 0;
          animation: puff 2.5s infinite linear;
        }
        .puff-1 { animation-delay: 0s; }
        .puff-2 { animation-delay: 0.8s; }
        .puff-3 { animation-delay: 1.6s; }

        /* Speed up exhaust smoke and turn it into a glowing jet trail when moving */
        .loading-progress .exhaust-puff {
          width: 7px;
          height: 7px;
          background: radial-gradient(circle, #38bdf8 0%, #1d4ed8 75%, transparent 100%);
          filter: drop-shadow(0 0 4px #38bdf8);
          animation: puffFast 0.8s infinite linear !important;
        }
        .login-success .exhaust-puff {
          width: 12px;
          height: 12px;
          background: radial-gradient(circle, #38bdf8 0%, #1d4ed8 75%, transparent 100%);
          filter: drop-shadow(0 0 8px #38bdf8);
          animation: puffFast 0.15s infinite linear !important;
        }

        /* Exhaust rocket fire boost plume (only active when login is successful) */
        .exhaust-flame {
          position: absolute;
          left: 4px;
          top: 51px;
          width: 16px;
          height: 5px;
          background: linear-gradient(-90deg, #ff7c00, #ff0055, transparent);
          border-radius: 3px 0 0 3px;
          opacity: 0;
          pointer-events: none;
          transform-origin: right center;
        }
        .login-success .exhaust-flame {
          animation: flameBoost 0.5s ease-out forwards !important;
          opacity: 1 !important;
        }

        /* Tire burnout smoke particles */
        .tire-smoke {
          position: absolute;
          width: 7px;
          height: 7px;
          background: rgba(241, 245, 249, 0.75);
          border-radius: 50%;
          opacity: 0;
          pointer-events: none;
          bottom: 12px;
          filter: blur(0.5px);
        }
        .smoke-left-1 { left: 22px; animation-delay: 0s; }
        .smoke-left-2 { left: 28px; animation-delay: 0.15s; }
        .smoke-right-1 { left: 78px; animation-delay: 0.08s; }
        .smoke-right-2 { left: 84px; animation-delay: 0.22s; }
        .loading-progress .tire-smoke {
          animation: burnout 0.8s infinite ease-out !important;
        }
        .login-success .tire-smoke {
          animation: burnout 0.2s infinite ease-out !important;
        }

        /* Headlight beam glow scaling and flicker */
        .headlight-beam {
          transform-origin: 106px 51px;
          transition: all 0.3s ease;
        }
        .loading-progress .headlight-beam {
          fill: rgba(250, 204, 21, 0.35);
          animation: headlightFlicker 0.15s infinite alternate;
        }
        .login-success .headlight-beam {
          fill: rgba(250, 204, 21, 0.6);
          transform: scaleX(2.2) scaleY(1.5);
          filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.95));
          animation: headlightFlicker 0.05s infinite alternate;
        }

        /* Speed lines styling & animation (always visible, accelerating when zooming) */
        .speed-line {
          position: absolute;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.45) 50%, transparent);
          opacity: 0.08;
          border-radius: 3px;
          animation: speedMoveSlow 5.5s linear infinite;
        }

        .speed-line-1 { animation-delay: 0s; }
        .speed-line-2 { animation-delay: 1.1s; }
        .speed-line-3 { animation-delay: 2.2s; }
        .speed-line-4 { animation-delay: 3.3s; }
        .speed-line-5 { animation-delay: 4.4s; }

        .loading-progress .speed-line {
          height: 1.8px;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.6) 50%, transparent);
          opacity: 0.25;
          animation: speedMoveFast 1.5s linear infinite !important;
        }
        .login-success .speed-line {
          height: 2.5px;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.95) 50%, transparent);
          opacity: 0.6;
          animation: speedMoveFast 0.3s linear infinite !important;
        }

        @keyframes speedMoveSlow {
          0% { transform: translateX(0); left: 100%; }
          100% { transform: translateX(-120vw); left: -150px; }
        }

        @keyframes speedMoveFast {
          0% { transform: translateX(0); left: 100%; }
          100% { transform: translateX(-120vw); left: -150px; }
        }

        /* Zoom off keyframes (starting from the center and driving off-screen) */
        @keyframes zoomOff {
          0% { left: calc(50% - 60px); }
          100% { left: 100%; }
        }

        /* Suspension keyframes */
        @keyframes truckBob {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-1px);
          }
        }

        /* Acceleration torque tilt and shake keyframes */
        @keyframes truckZoomBob {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-1px) rotate(-2deg); }
        }

        /* Rattle assets shaking animation under massive load */
        @keyframes shakeAssets {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(0.5px, -0.5px); }
          50% { transform: translate(-0.5px, 0.5px); }
          75% { transform: translate(0.5px, 0.5px); }
        }

        /* Flashing Server LED indicator keyframes */
        @keyframes blinkLed {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        /* Wind speed trail drifting keyframes */
        @keyframes puff {
          0% {
            transform: translate(0, 0) scale(0.5);
            opacity: 0.8;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: translate(-35px, -5px) scale(1.6);
            opacity: 0;
          }
        }

        @keyframes puffFast {
          0% {
            transform: translate(0, 0) scale(0.3);
            opacity: 0.9;
          }
          100% {
            transform: translate(-50px, 2px) scale(2.2);
            opacity: 0;
          }
        }

        @keyframes flameBoost {
          0% {
            opacity: 1;
            transform: scaleX(0.2) scaleY(1);
          }
          15%, 35% {
            opacity: 1;
            transform: scaleX(1.6) scaleY(1.3) skewY(2deg);
            filter: drop-shadow(0 0 10px #ff4500);
          }
          60% {
            opacity: 0.7;
            transform: scaleX(0.8) scaleY(0.8);
          }
          100% {
            opacity: 0;
            transform: scaleX(0) scaleY(0);
          }
        }

        @keyframes burnout {
          0% {
            transform: translate(0, 0) scale(0.3);
            opacity: 0.8;
          }
          100% {
            transform: translate(-25px, -6px) scale(2.5);
            opacity: 0;
          }
        }

        @keyframes headlightFlicker {
          0% { opacity: 0.8; }
          100% { opacity: 1; }
        }

        .center-card-container {
          transition: all 850ms cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* Success Transition: Keep card stationary */
        .center-card-container.success-transition {
          pointer-events: none;
        }

        /* Authenticating State: pulsing neon blue/cyan aura around card (disabled) */
        .center-card-container.authenticating {
          /* animation: borderPulse 1.2s infinite ease-in-out; */
        }

        /* @keyframes borderPulse {
          0%, 100% {
            box-shadow: 0 0 0 0px rgba(37, 99, 235, 0.2);
          }
          50% {
            box-shadow: 0 0 25px 4px rgba(6, 182, 212, 0.5);
          }
        } */

        /* Error Shake State */
        .center-card-container.error-shake {
          animation: cardShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes cardShake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        /* ══════════════════════════════════════════════════
           CRASH STATE — brake skid + black smoke + debris
        ══════════════════════════════════════════════════ */

        /* 1. Whole truck: hard brake jolt — lurches forward then settles */
        .truck-container.crashed {
          left: calc(50% - 60px) !important;
          transition: none !important;
          animation: brakeLurch 0.6s cubic-bezier(0.22,1,0.36,1) both !important;
          transform-origin: center bottom;
        }
        @keyframes brakeLurch {
          0%   { transform: translateX(0)   translateY(0)    rotate(0deg)  scaleX(1); }
          12%  { transform: translateX(8px)  translateY(-3px) rotate(-4deg) scaleX(1.04); }
          28%  { transform: translateX(-5px) translateY(2px)  rotate(3deg)  scaleX(0.97); }
          44%  { transform: translateX(3px)  translateY(-1px) rotate(-2deg) scaleX(1.02); }
          60%  { transform: translateX(-2px) translateY(1px)  rotate(1deg)  scaleX(0.99); }
          78%  { transform: translateX(1px)  translateY(0)    rotate(-0.5deg) scaleX(1); }
          100% { transform: translateX(0)   translateY(0)    rotate(0deg)  scaleX(1); }
        }

        /* 2. Body darkens + red brake glow */
        .crashed .truck-body {
          animation: bodyBrake 2.5s ease forwards !important;
        }
        @keyframes bodyBrake {
          0%   { filter: brightness(1); }
          10%  { filter: brightness(1.6) drop-shadow(0 0 10px #ef4444) drop-shadow(0 0 20px #dc2626); }
          25%  { filter: brightness(0.8) saturate(0.5) drop-shadow(0 0 6px rgba(0,0,0,0.6)); }
          50%  { filter: brightness(0.7) saturate(0.3) drop-shadow(0 0 4px rgba(0,0,0,0.5)); }
          80%  { filter: brightness(0.9) saturate(0.7); }
          100% { filter: brightness(1); }
        }

        /* 3. Wheels lock — hard stop then slow roll */
        .crashed .truck-wheel {
          animation: wheelLock 0.6s ease forwards !important;
          transform-box: fill-box;
          transform-origin: center;
        }
        @keyframes wheelLock {
          0%   { transform: rotate(0deg); }
          15%  { transform: rotate(30deg); filter: drop-shadow(0 0 4px #ef4444); }
          30%  { transform: rotate(15deg); }
          50%  { transform: rotate(20deg); }
          70%  { transform: rotate(18deg); }
          100% { transform: rotate(18deg); filter: none; }
        }

        /* 4. Cargo jolts hard forward */
        .crashed .flatbed-assets {
          animation: cargoJolt 0.7s cubic-bezier(0.22,1,0.36,1) forwards !important;
          transform-box: fill-box;
          transform-origin: center bottom;
        }
        @keyframes cargoJolt {
          0%   { transform: translateX(0)    rotate(0deg);   }
          20%  { transform: translateX(10px)  rotate(5deg);   }
          40%  { transform: translateX(-4px)  rotate(-3deg);  }
          60%  { transform: translateX(3px)   rotate(2deg);   }
          80%  { transform: translateX(-1px)  rotate(-1deg);  }
          100% { transform: translateX(0)    rotate(0deg);   }
        }



        /* 10. Fire eruption, smoke expansion, and rising embers */
        .crash-fire {
          transform-box: fill-box;
          transform-origin: center bottom;
          filter: drop-shadow(0 0 6px #f97316) blur(0.5px);
        }
        .f1 { animation: fireErupt 1.6s ease-in-out infinite; animation-delay: 0s; }
        .f2 { animation: fireErupt 1.6s ease-in-out infinite; animation-delay: 0.5s; }
        .f3 { animation: fireErupt 1.6s ease-in-out infinite; animation-delay: 1.0s; }

        @keyframes fireErupt {
          0% {
            transform: translate(0, 0) scale(0.2);
            opacity: 0;
          }
          20% {
            transform: translate(1px, -4px) scale(1.3);
            opacity: 1;
          }
          50% {
            transform: translate(-2px, -12px) scale(1.5) skewX(4deg);
            opacity: 0.8;
          }
          85% {
            transform: translate(2px, -20px) scale(0.8) skewX(-4deg);
            opacity: 0.3;
          }
          100% {
            transform: translate(0, -25px) scale(0.3);
            opacity: 0;
          }
        }

        .crash-smoke {
          transform-box: fill-box;
          transform-origin: center bottom;
          filter: blur(1.5px);
        }
        .s1 { animation: smokeRise 2.4s ease-in-out infinite; animation-delay: 0s; }
        .s2 { animation: smokeRise 2.4s ease-in-out infinite; animation-delay: 0.6s; }
        .s3 { animation: smokeRise 2.4s ease-in-out infinite; animation-delay: 1.2s; }
        .s4 { animation: smokeRise 2.4s ease-in-out infinite; animation-delay: 1.8s; }

        @keyframes smokeRise {
          0% {
            transform: translate(0, 0) scale(0.3);
            opacity: 0;
          }
          10% {
            transform: translate(-1px, -5px) scale(0.7);
            opacity: 0.6;
          }
          50% {
            transform: translate(4px, -20px) scale(1.6) rotate(15deg);
            opacity: 0.8;
          }
          80% {
            transform: translate(-6px, -40px) scale(2.4) rotate(-15deg);
            opacity: 0.3;
          }
          100% {
            transform: translate(2px, -55px) scale(3.2) rotate(10deg);
            opacity: 0;
          }
        }

        .crash-ember {
          transform-box: fill-box;
          transform-origin: center;
          filter: drop-shadow(0 0 4px #fbbf24);
        }
        .e1 { animation: emberFloat 2.0s ease-in-out infinite; animation-delay: 0s; }
        .e2 { animation: emberFloat 2.0s ease-in-out infinite; animation-delay: 0.4s; }
        .e3 { animation: emberFloat 2.0s ease-in-out infinite; animation-delay: 0.8s; }
        .e4 { animation: emberFloat 2.0s ease-in-out infinite; animation-delay: 1.2s; }
        .e5 { animation: emberFloat 2.0s ease-in-out infinite; animation-delay: 1.6s; }

        @keyframes emberFloat {
          0% {
            transform: translate(0, 0) scale(0.4);
            opacity: 0;
          }
          15% {
            transform: translate(0, -4px) scale(1.1);
            opacity: 1;
          }
          50% {
            transform: translate(8px, -20px) scale(0.9);
            opacity: 0.8;
          }
          80% {
            transform: translate(-4px, -36px) scale(0.6);
            opacity: 0.3;
          }
          100% {
            transform: translate(2px, -48px) scale(0.3);
            opacity: 0;
          }
        }

        /* Extinguish fire and smoke during repair */
        .repairing .crash-fire {
          animation: fireExtinguish 0.8s ease forwards !important;
        }
        .repairing .crash-smoke {
          animation: smokeExtinguish 0.8s ease forwards !important;
        }
        .repairing .crash-ember {
          animation: emberExtinguish 0.6s ease forwards !important;
        }

        @keyframes fireExtinguish {
          100% {
            transform: scale(0);
            opacity: 0;
            filter: blur(4px);
          }
        }
        @keyframes smokeExtinguish {
          100% {
            transform: translateY(-20px) scale(0);
            opacity: 0;
            filter: blur(8px);
          }
        }
        @keyframes emberExtinguish {
          100% {
            opacity: 0;
          }
        }

        /* High-Tech Repair Drone flying & scanning animations */
        .repair-drone {
          transform-box: fill-box;
          transform-origin: center;
          animation: droneFlyInOut 1.6s ease-in-out forwards;
        }

        @keyframes droneFlyInOut {
          0% {
            transform: translate(45px, -30px) rotate(15deg);
            opacity: 0;
          }
          18% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          28%, 48%, 68% {
            transform: translateY(-1.2px);
          }
          38%, 58%, 78% {
            transform: translateY(1.2px);
          }
          82% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50px, -40px) rotate(-20deg);
            opacity: 0;
          }
        }

        .drone-prop {
          transform-box: fill-box;
          transform-origin: center;
          animation: propSpin 0.08s linear infinite;
        }

        @keyframes propSpin {
          0% { transform: scaleX(1); }
          50% { transform: scaleX(0.1); }
          100% { transform: scaleX(1); }
        }

        .drone-laser {
          transform-box: fill-box;
          transform-origin: 101px 22px;
          animation: laserSweep 0.4s ease-in-out infinite alternate;
          animation-delay: 0.3s;
          opacity: 0.85;
        }

        @keyframes laserSweep {
          0% { transform: skewX(-12deg); opacity: 0.9; }
          100% { transform: skewX(12deg); opacity: 0.9; }
        }

        .drone-eye {
          animation: eyePulse 0.4s infinite alternate;
        }

        @keyframes eyePulse {
          0% { fill: #06b6d4; filter: drop-shadow(0 0 1px #06b6d4); }
          100% { fill: #10b981; filter: drop-shadow(0 0 2px #10b981); }
        }

        .repair-sparkle {
          transform-box: fill-box;
          transform-origin: center;
          animation: sparkleFloat 1.0s ease-out infinite;
        }
        .rs1 { animation-delay: 0s; }
        .rs2 { animation-delay: 0.3s; }
        .rs3 { animation-delay: 0.6s; }

        @keyframes sparkleFloat {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          50% { opacity: 1; transform: translateY(-5px) scale(1.2); }
          100% { transform: translateY(-10px) scale(0); opacity: 0; }
        }

        /* Restoration bounce of the truck body when repairing */
        .repairing .truck-body {
          animation: bodyRepairBounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important;
        }
        @keyframes bodyRepairBounce {
          0% {
            filter: brightness(0.6) saturate(0.7);
            transform: scale(1);
          }
          40% {
            filter: brightness(1.2) saturate(1.2);
            transform: scale(1.05) translateY(-2px);
          }
          100% {
            filter: brightness(1) saturate(1);
            transform: scale(1) translateY(0);
          }
        }

        /* ══════════════════════════════════════════════════
           KEYCARD MAGNETIC READER SYSTEM
        ══════════════════════════════════════════════════ */
        .keycard-reader-svg {
          overflow: visible;
        }

        .operator-keycard {
          transform-box: fill-box;
          transform-origin: center top;
          transform: translateY(0px);
          transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .email-typed .operator-keycard {
          transform: translateY(8px);
        }

        .password-typed .operator-keycard {
          transform: translateY(22px);
        }

        .failed .operator-keycard {
          animation: cardEject 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes cardEject {
          0% { transform: translateY(22px); }
          40% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        .reader-led {
          fill: #64748b; /* idle gray */
          transition: fill 0.3s ease;
        }

        .email-typed .reader-led {
          fill: #06b6d4; /* connected cyan */
          filter: drop-shadow(0 0 2px #06b6d4);
        }

        .password-typed .reader-led {
          fill: #3b82f6; /* validated blue */
          filter: drop-shadow(0 0 3px #3b82f6);
        }

        .authenticating .reader-led {
          animation: ledPulse 0.25s infinite alternate;
        }

        @keyframes ledPulse {
          0% { fill: #3b82f6; filter: drop-shadow(0 0 1px #3b82f6); }
          100% { fill: #93c5fd; filter: drop-shadow(0 0 5px #3b82f6); }
        }

        .failed .reader-led {
          animation: ledAlert 0.35s infinite alternate;
        }

        @keyframes ledAlert {
          0% { fill: #ef4444; filter: drop-shadow(0 0 1px #ef4444); }
          100% { fill: #fee2e2; filter: drop-shadow(0 0 5px #ef4444); }
        }

        .success .reader-led {
          fill: #10b981; /* success green */
          filter: drop-shadow(0 0 5px #10b981);
        }


      `}</style>
    </ThemeProvider>
  );
}