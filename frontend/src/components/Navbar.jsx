import { Moon, Sun, LogIn, LogOut, User, ShoppingCart } from "lucide-react";
import { Moon, Sun, LogIn, LogOut, User, ShoppingCart } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useLocation, NavLink } from "react-router-dom";
import { useLocation, NavLink } from "react-router-dom";
import "./Navbar.css";
import { isUserLogged, logout } from "../services/authService";
import { getUserRole, isClient, isStoreOwner } from "../services/users";

function Navbar() {
  const { theme, setTheme } = useTheme();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const loggedIn = isUserLogged();
  const userRole = getUserRole();

  console.log("is user loggedIn => ", loggedIn);
  console.log("user role => ", userRole);

  // ============= تحديد الـ links حسب الـ role =============
  const getNavLinks = () => {
    if (!loggedIn) return []; 

    // Customer Links
    if (isClient()) {
      return [
        { name: "المتاجر", path: "/stores" },
        { name: "طلباتي", path: "/orders" }
      ];
    }

    // Store Owner Links
    if (isStoreOwner()) {
      return [
        { name: "الرئيسية", path: "/dashboard/store_owner/" },
        { name: "الطلبات", path: "/dashboard/store_owner/orders" },
        { name: "المنتجات", path: "/dashboard/store_owner/products" },
        { name: "العملاء المتفاعلين", path: "/dashboard/store_owner/active_clients" }
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  return (
    <div className="navbar-container" dir="rtl">
      <nav className="nav-bar">

        {/* ===== Logo ===== */}
        <a href="/" className="nav-logo">
          <span className="logo-glam">Glam</span>
          <span className="logo-qena">Qena</span>
          <div className="logo-dot" />
          <span className="logo-ar">قنا</span>
        </a>

        {/* ===== Navigation Links  ===== */}
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

        {/* ===== Actions ===== */}
        <div className="nav-actions">

          {/* زر دخول -   for guest */}
          {!loggedIn && location.pathname !== "/login" && (
            <NavLink to="/login" className="nav-btn-login">
              <LogIn size={18} />
              <span>دخول</span>
            </NavLink>
          )}

          {/* زر إنشاء حساب - for guest */}
          {!loggedIn && location.pathname !== "/register" && (
            <NavLink to="/register" className="nav-btn-signup">
              إنشاء حساب
            </NavLink>
          )}

        
          {(
            <NavLink to="/cart" title="السلة" className="nav-icon">
              <ShoppingCart size={20} />
            </NavLink>
          )}

         
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

          {/* تبديل المظهر  */}
          <button
            className="mode-toggler"
            title="تبديل المظهر"
            onClick={() => setTheme(p => p === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;

