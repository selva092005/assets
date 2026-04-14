import { Link, NavLink, useNavigate } from "react-router-dom";
import "../styles/App.css";
import { useState, useEffect } from "react";
import amsLogo from "../assets/ams_no_bg.png";

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <>
    <nav className="navbar-custom fixed-top">

      {/* Brand */}
      <Link className="nav-brand" to="/home">
        <img src={amsLogo} alt="AMS" className="nav-brand-logo" />
        <span className="nav-brand-name">
          <span className="brand-top">Asset</span>
          <br />
          <span className="brand-bottom">Manager System</span>
        </span>
      </Link>

      {/* Center pill nav — hidden on mobile */}
      <div className="nav-pill">
        <NavLink to="/home" end className="nav-pill-link" onClick={() => setMenuOpen(false)}>
          Dashboard
        </NavLink>
        <NavLink to="/home/assets" className="nav-pill-link" onClick={() => setMenuOpen(false)}>
          Assets
        </NavLink>
        <NavLink to="/home/users" className="nav-pill-link" onClick={() => setMenuOpen(false)}>
          Users
        </NavLink>
        <NavLink to="/home/reports" className="nav-pill-link" onClick={() => setMenuOpen(false)}>
          Reports
        </NavLink>
      </div>

      {/* Right actions */}
      <div className="nav-actions">

        {/* Hamburger — visible only on mobile */}
        <button className={`nav-hamburger${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        {isLoggedIn ? (
          <button onClick={handleLogout} className="nav-signin-btn">
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        ) : (
          <>
            <Link to="/" className="nav-signin-btn">Sign In</Link>
            <Link to="/" className="nav-getstarted-btn">Get Started</Link>
          </>
        )}
      </div>

    </nav>

    {/* Mobile dropdown menu */}
    {menuOpen && (
      <div className="nav-mobile-menu">
        <NavLink to="/home" end className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
        <NavLink to="/home/assets" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Assets</NavLink>
        <NavLink to="/home/users" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Users</NavLink>
        <NavLink to="/home/reports" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Reports</NavLink>
      </div>
    )}
    </>
  );
};

export default Navbar;