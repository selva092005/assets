import React, { useState } from "react";
import "../../styles/Login.css";
import { useNavigate } from "react-router-dom";
import { login } from "../../service/login";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

function Login() {
  const [email, setemail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
   const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    try {
      await login(email, password);
      if (localStorage.getItem("token")) {
        navigate("/home/assets");
      } else {
        setError("Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* LEFT — Animation */}
        <div className="login-left">
          <DotLottieReact
            src="https://lottie.host/5ed27295-87ec-4a1d-aefd-d7332b93d507/0oZNm435gK.lottie"
            loop
            autoplay
            style={{ width: "100%", maxWidth: 380 }}
          />
        </div>

        {/* RIGHT — Form */}
        <div className="login-right">
          <span className="welcome-badge">Welcome back</span>
          <h5 className="login-title">Login your account</h5>

          <form onSubmit={handleLogin}>
            <div className="input-box">
              <input
                type="email"
                placeholder="Username"
                value={email}
                onChange={(e) => setemail(e.target.value)}
              />
            </div>

            <div className="input-box password-box">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />

  <i
    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} eye-icon`}
    onClick={() => setShowPassword(!showPassword)}
  ></i>
</div>

            {error && <small className="error">{error}</small>}

            <button type="submit" className="login-btn">Login</button>
          </form>

          <p className="signup-text">Create Account</p>
          <p className="forgot-text">Forgot Password?</p>
        </div>

      </div>
    </div>
  );
}

export default Login;
