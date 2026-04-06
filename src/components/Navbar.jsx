import { Link, useNavigate } from "react-router-dom";
import "../styles/App.css";
import { useState, useEffect } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // ✅ check login status from localStorage
    const token = localStorage.getItem("token");
setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    // ✅ remove login status
    localStorage.removeItem("token");

    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-custom px-3 fixed-top">

      <Link className="navbar-brand fw-bold" to="/home">
        <i className="bi bi-box p-2"></i>
        Asset Manager
      </Link>

      <div className="ms-auto">
        {isLoggedIn ? (
          <button onClick={handleLogout} className="logout-btn gradient">
  <i className="bi bi-box-arrow-right"></i>
  Logout
</button>
        ) : (
          <Link to="/" className="btn btn-light fw-semibold px-3">
            Login
          </Link>
        )}
      </div>

    </nav>
  );
};

export default Navbar;