import { Link, useNavigate } from "react-router-dom";
import "../styles/App.css";
import { useState, useEffect } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // ✅ check login status from localStorage
    const status = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(status === "true");
  }, []);

  const handleLogout = () => {
    // ✅ remove login status
    localStorage.removeItem("isLoggedIn");

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
          <button onClick={handleLogout} className="btn btn-danger fw-semibold px-3">
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