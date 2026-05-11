import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import toast from "react-hot-toast";
import { loginThunk } from "../store/slices/authSlice";
import "../styles/Login.css";

export default function Login() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const { isLoggedIn, loading, error: storeError } = useSelector((s) => s.auth);

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [localError,   setLocalError]   = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (isLoggedIn) return <Navigate to="/home" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setLocalError("Please enter email and password"); return; }
    setLocalError("");
    const result = await dispatch(loginThunk(email, password));
    if (result?.success) {
      toast.success("Welcome back!");
      navigate("/home");
    } else {
      toast.error(storeError || "Login failed");
    }
  };

  const error = localError || storeError || "";

  return (
    <div className="login-page">
      <div className="login-card">

        {/* LEFT – Animation */}
        <div className="login-left">
          <DotLottieReact
            src="https://lottie.host/5ed27295-87ec-4a1d-aefd-d7332b93d507/0oZNm435gK.lottie"
            loop autoplay
            style={{ width: "100%", maxWidth: 380 }}
          />
        </div>

        {/* RIGHT – Form */}
        <div className="login-right">
          <span className="welcome-badge">Welcome back</span>
          <h5 className="login-title">Login your account</h5>

          <form onSubmit={handleLogin}>
            <div className="input-box">
              <input type="email" placeholder="Username" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="input-box password-box">
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} eye-icon`} onClick={() => setShowPassword(!showPassword)} />
            </div>

            {error && <small className="error">{error}</small>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="signup-text">Create Account</p>
          <p className="forgot-text">Forgot Password?</p>
        </div>

      </div>
    </div>
  );
}
