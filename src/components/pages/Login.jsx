import React, { useState } from "react";
import "../../styles/Login.css";
import logo from "../../assets/final.png";
import { useNavigate } from "react-router-dom";
import { login } from "../../service/login";

function Login() {
  const [email, setemail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // 🚀 prevents page reload

    // ✅ validation
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      const res = await login(email, password);

      console.log("Login Response:", res);

      if (res.success && res.data) {
        setError(""); // clear error
        navigate("/home");
      } else {
        setError(res.message || "Invalid credentials");
      }

    } catch (err) {
      console.log("Login Failed", err);

      setError(
        err.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
<div className="main-container">
  <div className="image-container">
    <img src={logo} alt="login" />

    <div className="form-card">
      <form onSubmit={handleLogin}>
        
        <div className="profile-icon">
          <div className="circle">
            <span>👤</span>
          </div>
        </div>

        <div className="input-box">
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setemail(e.target.value)}
          />
        </div>

        <div className="input-box">
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <small className="error">{error}</small>}

        <p className="signup-text">Sign up now</p>

        <button type="submit" className="login-btn">
          Login
        </button>

        <p className="forgot-text">Forgot Password?</p>

      </form>
    </div>
  </div>
</div>
  );
}

export default Login;