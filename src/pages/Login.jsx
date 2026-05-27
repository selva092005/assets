import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import toast from "../utils/toast.jsx";
import { loginThunk } from "../store/slices/authSlice";
import { isValidEmail } from "../utils/validate";

import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Chip,
  Divider,
  CircularProgress,
  Link,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { COLORS } from "../theme/tokens";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../theme/theme";

/* ─── Component ─────────────────────────────────────────────── */
export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggedIn, loading, error: storeError } = useSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (isLoggedIn) return <Navigate to="/home" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    const fe = {};
    if (!email.trim())            fe.email    = "Email is required";
    else if (!isValidEmail(email)) fe.email   = "Enter a valid email address";
    if (!password)                fe.password = "Password is required";
    else if (password.length < 6) fe.password = "Password must be at least 6 characters";
    if (Object.keys(fe).length > 0) { setFieldErrors(fe); return; }
    setFieldErrors({ email: "", password: "" });
    setLocalError("");
    const result = await dispatch(loginThunk(email, password));
    if (result?.success) {
      toast.success("Welcome back!");
      setTimeout(() => navigate("/home"), 100);
    } else {
      toast.error(result?.error || storeError || "Login failed");
    }
  };

  const error = localError || storeError || "";

  return (
    <ThemeProvider theme={theme}>
      {/* Page background */}
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #EEF0FF 0%, #F9F5FF 50%, #EEF0FF 100%)",
          px: 2,
        }}
      >
        <Card
          elevation={0}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            width: "100%",
            maxWidth: 860,
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(25,118,210,0.12), 0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          {/* ── LEFT: Animation panel ── */}
          <Box
            sx={{
              flex: 1,
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(160deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
              p: 5,
              gap: 3,
            }}
          >
            <DotLottieReact
              src="https://lottie.host/5ed27295-87ec-4a1d-aefd-d7332b93d507/0oZNm435gK.lottie"
              loop
              autoplay
              style={{ width: "100%", maxWidth: 300 }}
            />
            <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, textAlign: "center" }}>
              Your workspace awaits
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.65)", textAlign: "center", maxWidth: 220 }}
            >
              Sign in to pick up right where you left off.
            </Typography>
          </Box>

          {/* ── RIGHT: Form panel ── */}
          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              p: { xs: 4, md: 6 },
              gap: 2.5,
              bgcolor: "#fff",
            }}
          >
            {/* Badge */}
            <Box>
              <Chip
                label="Welcome back"
                size="small"
                sx={{
                  bgcolor: COLORS.primaryLight,
                  color: COLORS.primary,
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  letterSpacing: 0.5,
                  mb: 1.5,
                }}
              />
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: "#1A1A2E", lineHeight: 1.2 }}
              >
                Login to your account
              </Typography>
            </Box>

            <Divider sx={{ borderColor: "#F0F0F8" }} />

            {/* Email */}
            <TextField
              fullWidth
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              size="medium"
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
            />

            {/* Password */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              size="medium"
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                        sx={{ color: COLORS.primaryDark }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Inline error */}
            {error && (
              <Typography variant="caption" color="error" sx={{ mt: -1 }}>
                {error}
              </Typography>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              disableElevation
              startIcon={
                loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null
              }
              sx={{ mt: 0.5 }}
            >
              {loading ? "Logging in…" : "Login"}
            </Button>

            {/* Footer links */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pt: 0.5,
              }}
            >
              <Link href="/signup" underline="hover" sx={{ fontSize: "0.85rem", color: COLORS.primary, fontWeight: 600 }}>
                Create Account
              </Link>
              <Link href="/forgot-password" underline="hover" sx={{ fontSize: "0.85rem", color: COLORS.primary, fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </Box>
          </Box>
        </Card>
      </Box>
    </ThemeProvider>
  );
}