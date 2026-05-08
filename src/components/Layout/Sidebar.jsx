import { NavLink } from "react-router-dom";
import "../../styles/Sidebar.css";

const Sidebar = ({ isOpen, setIsOpen }) => (
  <div className={`sidebar ${isOpen ? "open" : "close"}`}>
    <div className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
      <i className={`bi ${isOpen ? "bi-chevron-left" : "bi-chevron-right"}`} />
    </div>

    <ul className="nav flex-column mt-4">
      <li className="nav-item">
        <NavLink to="/home" end className="nav-link">
          <i className="bi bi-speedometer2" />
          {isOpen && <span className="menu-text">Dashboard</span>}
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink to="/home/assets" className="nav-link">
          <i className="bi bi-book" />
          {isOpen && <span className="menu-text">Assets</span>}
        </NavLink>
      </li>
    </ul>
  </div>
);

export default Sidebar;
