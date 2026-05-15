import { Moon, Sun, LogIn, LogOut, User, ShoppingCart } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useLocation, NavLink } from "react-router-dom";
import "./Navbar.css";
import {
  isUserLogged,
  logout,
  isCustomer,
  isStoreOwner,
} from "../services/authService";

function Navbar() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const loggedIn = isUserLogged();

  const getNavLinks = () => {
    if (!loggedIn) return [];

    if (isCustomer()) {
      return [
        { name: "المتاجر", path: "/stores" },
        { name: "طلباتي", path: "/orders" },
      ];
    }

    if (isStoreOwner()) {
      return [
        { name: "الرئيسية", path: "/store/dashboard" },
        { name: "الطلبات", path: "/store/orders" },
        { name: "المنتجات", path: "/store/products" },
        { name: "العملاء المتفاعلين", path: "/store/active-clients" },
      ];
    }

    return [];
  };

  const showCart = !loggedIn || isCustomer();
  const navLinks = getNavLinks();

  return (
    <div className="navbar-container" dir="rtl">
      <nav className="nav-bar">

        {/* Logo */}
        <a href="/" className="nav-logo">
          <span className="logo-glam">Glam</span>
          <span className="logo-qena">Qena</span>
          <div className="logo-dot" />
          <span className="logo-ar">قنا</span>
        </a>

        {/* Nav Links (وسط) */}
        <div className="nav-links">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Actions */}
        <div className="nav-actions">

          {/* دخول - غير مسجل فقط، مع إخفاء لو على صفحة لوجن */}
          {!loggedIn && location.pathname !== "/login" && (
            <NavLink to="/login" className="nav-btn-login">
              <LogIn size={18} />
              <span>دخول</span>
            </NavLink>
          )}

          {/* إنشاء حساب - غير مسجل فقط، مع إخفاء لو على صفحة ريجستر */}
          {!loggedIn && location.pathname !== "/register" && (
            <NavLink to="/register" className="nav-btn-signup">
              إنشاء حساب
            </NavLink>
          )}

          {/* السلة - guest و customer فقط */}
          {showCart && (
            <NavLink to="/cart" title="السلة" className="nav-icon">
              <ShoppingCart size={20} />
            </NavLink>
          )}

          {/* البروفايل - مسجلين فقط */}
          {loggedIn && (
            <NavLink to="/profile" title="الملف الشخصي" className="nav-icon">
              <User size={20} />
            </NavLink>
          )}

          {/* لوج أوت - مسجلين فقط */}
          {loggedIn && (
            <button
              className="nav-icon"
              title="تسجيل الخروج"
              onClick={async () => await logout()}
            >
              <LogOut size={20} />
            </button>
          )}

          {/* تبديل المظهر - للكل */}
          <button
            className="mode-toggler"
            title="تبديل المظهر"
            onClick={() => setTheme((p) => (p === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

        </div>
      </nav>
    </div>
  );
}

export default Navbar;
