import { Moon, Sun, LogIn, LogOut, User, ShoppingCart } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useLocation, NavLink } from "react-router-dom";
import "./Navbar.css";
import { isUserLogged, logout } from "../services/authService";

function Navbar() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const loggedIn = isUserLogged();

  console.log("is user loggedIn => ", loggedIn);

  return (
    <div className="navbar-container" dir="rtl">
      <nav className="nav-bar">

        {/* ===== Logo (right) ===== */}
        <a href="/" className="nav-logo">
          <span className="logo-glam">Glam</span>
          <span className="logo-qena">Qena</span>
          <div className="logo-dot" />
          <span className="logo-ar">قنا</span>
        </a>

        {/* ===== Actions (left) ===== */}
        <div className="nav-actions">

          {!loggedIn && location.pathname !== "/login" && (
            <NavLink to="/login" className="nav-btn-login">
              <LogIn size={18} />
              <span>دخول</span>
            </NavLink>
          )}

          {!loggedIn && location.pathname !== "/register" && (
            <NavLink to="/register" className="nav-btn-signup">
              إنشاء حساب
            </NavLink>
          )}

          <NavLink to="/cart" title="السلة" className="nav-icon">
            <ShoppingCart size={20} />
          </NavLink>

          {loggedIn && (
            <NavLink to="/profile" title="الملف الشخصي" className="nav-icon">
              <User size={20} />
            </NavLink>
          )}

          {loggedIn && (
            <button className="nav-icon" title="تسجيل الخروج" onClick={async () => await logout()}>
              <LogOut size={20} />
            </button>
          )}

          <button className="mode-toggler" title="تبديل المظهر"
            onClick={() => setTheme(p => p === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

      </nav>
    </div>
  );
}

export default Navbar;