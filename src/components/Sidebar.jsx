import { NavLink } from "react-router-dom";
import { useState } from "react";
import "../styles/SIdebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`sidebar ${isOpen ? "" : "close"}`}>
      
      {/* Toggle */}
      <div className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        <i className={`bi ${isOpen ? "bi-chevron-left" : "bi-chevron-right"}`}></i>
      </div>

      <ul className="nav flex-column mt-4">

        {/* <li className="nav-item">
          <NavLink to="/home" className="nav-link">
            <i className="bi bi-house"></i>
            <span className="menu-text">Home</span>
          </NavLink>
        </li> */}

        <li className="nav-item">
          <NavLink to="/home" className="nav-link">
            <i className="bi bi-speedometer2"></i>
            <span className="menu-text">Dashboard</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink to="/home/assets" className="nav-link">
            <i className="bi bi-book"></i>
            <span className="menu-text">Assets</span>
          </NavLink>
        </li>


      </ul>
    </div>
  );
};

export default Sidebar;