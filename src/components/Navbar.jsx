import { useTheme } from "./ThemeProvider";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import "./Navbar.css";
import { isUserLogged, logout, notifyAuthChange, api } from "../services/authService";
import { getUserRole, isClient, isStoreOwner } from "../services/users";

// React Icons imports
import { 
  FaBars, 
  FaTimes, 
  FaUser, 
  FaShoppingCart, 
  FaHeart,
  FaStore,
  FaList,
  FaHome,
  FaUsers,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
  FaBoxOpen,
  FaChartLine,
} from 'react-icons/fa';
import FloatingMsg from "./FloatingMsg";

function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState("");
  const drawerRef = useRef(null);
  const hamburgerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLoggedIn(isUserLogged());
    setUserRole(getUserRole());
  }, [location]);

  const handleAuthError = (error) => {
    if (error.code === "AUTH_EXPIRED" || error.message?.includes("session")) {
      setError( "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى" );
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Clear any existing redirect timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        navigate("/login");
      }, 4000);

      return true; // Auth error handled
    }
    return false; // Not an auth error
  };

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  const handleToggle = () => {
    const TO_BACKEND = { pink: "light", purple: "dark", system: "system" };
    const next = resolvedTheme === "purple" ? "pink" : "purple";
    setTheme(next);
    if (!isUserLogged()) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      api.patch("/profile/preferences", { theme: TO_BACKEND[next] })
      .catch((err) => {
        if (!handleAuthError(err)) {
        setError("فشل تحديث الثيم المفضل");
        debounceRef.current = setTimeout(() => {
          setError("");
        }, 4000);
      }
      });
    }, 600);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickOnHamburger = hamburgerRef.current && hamburgerRef.current.contains(event.target);
      const isClickInsideDrawer = drawerRef.current && drawerRef.current.contains(event.target);
      
      if (isDrawerOpen && !isClickInsideDrawer && !isClickOnHamburger) {
        closeDrawer();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };

    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    } else {
      document.body.style.overflow = 'unset';
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen, closeDrawer]);

  useEffect(() => {
    closeDrawer();
  }, [location, closeDrawer]);

  const getNavLinks = () => {
    if (!loggedIn) return [];
    if (isClient()) {
      return [
        { name: "المتاجر", path: "/stores", icon: FaStore },
        { name: "طلباتي", path: "/orders", icon: FaList }
      ];
    }
    if (isStoreOwner()) {
      return [
        { name: "الرئيسية", path: "/dashboard/store_owner/", icon: FaHome },
        { name: "الطلبات", path: "/dashboard/store_owner/orders", icon: FaList },
        { name: "المنتجات", path: "/dashboard/store_owner/products", icon: FaBoxOpen },
        { name: "العملاء المتفاعلين", path: "/dashboard/store_owner/active_clients", icon: FaUsers }
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();
  const shouldShowCart = () => isClient() || !loggedIn;
  const shouldShowWishlist = () => loggedIn && isClient();

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
    notifyAuthChange();
    
    closeDrawer();
    navigate("/login");
  };

  // Determine which quick action icon to show for logged in users
  const getQuickActionIcon = () => {
    if (!loggedIn) return null;
    
    if (isClient()) {
      return (
        <NavLink to="/stores" title="المتاجر" className="nav-icon">
          <FaStore className="nav-icon-color" size={20} />
        </NavLink>
      );
    }
    
    if (isStoreOwner()) {
      return (
        <NavLink to="/dashboard/store_owner/" title="لوحة التحكم" className="nav-icon">
          <FaChartLine className="nav-icon-color" size={20} />
        </NavLink>
      );
    }
    
    return null;
  };

  return (
    <>
      <div className="navbar-container" dir="rtl">
        <nav className="nav-bar">
          <button 
            ref={hamburgerRef}
            className="nav-hamburger" 
            onClick={toggleDrawer} 
            aria-label="القائمة"
          >
            <FaBars className="nav-icon-color" size={24} />
          </button>

          <a href={isStoreOwner() ? "/dashboard/store_owner/" : "/"} className="nav-logo">
            <span className="logo-glam">Glam</span>
            <span className="logo-qena">Qena</span>
            <div className="logo-dot" />
            <span className="logo-ar">قنا</span>
          </a>

          <div className="nav-actions">
            {/* Cart - Visible for clients and guests */}
            {shouldShowCart() && (
              <NavLink to="/cart" title="السلة" className="nav-icon">
                <FaShoppingCart className="nav-icon-color" size={20} />
              </NavLink>
            )}

            {/* Wishlist - only for clients */}
            {shouldShowWishlist() && (
              <NavLink to="/wishlist" title="قائمة الرغبات" className="nav-icon">
                <FaHeart className="nav-icon-color" size={20} />
              </NavLink>
            )}

            {/* Quick action icon - stores for clients, dashboard for store owners */}
            {getQuickActionIcon()}
          </div>
        </nav>
      </div>

      {/* Side Drawer */}
      <div 
        className={`drawer-overlay ${isDrawerOpen ? 'active' : ''}`} 
        onClick={closeDrawer}
      />
      <div 
        className={`side-drawer ${isDrawerOpen ? 'open' : ''}`} 
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <a href={isStoreOwner() ? "/dashboard/store_owner/" : "/"} className="drawer-logo" onClick={closeDrawer}>
            <span className="logo-glam">Glam</span>
            <span className="logo-qena">Qena</span>
            <div className="logo-dot" />
          </a>
          <button className="drawer-close" onClick={toggleDrawer}>
            <FaTimes className="nav-icon-color" size={24} />
          </button>
        </div>

        <div className="drawer-divider" />

        <div className="drawer-links">
          {!loggedIn && (
            <>
              <NavLink to="/login" className="drawer-link" onClick={closeDrawer}>
                <FaSignInAlt className="drawer-icon" size={18} />
                <span>تسجيل الدخول</span>
              </NavLink>
              <NavLink to="/register" className="drawer-link" onClick={closeDrawer}>
                <FaUserPlus className="drawer-icon" size={18} />
                <span>إنشاء حساب</span>
              </NavLink>
              <div className="drawer-divider" />
            </>
          )}

          {navLinks.length > 0 && (
            <>
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`}
                    onClick={closeDrawer}
                  >
                    <IconComponent className="drawer-icon" size={18} />
                    <span>{link.name}</span>
                  </NavLink>
                );
              })}
              <div className="drawer-divider" />
            </>
          )}

          {userRole !== "client" && 
            <NavLink to="/stores" className="drawer-link" onClick={closeDrawer}>
              <FaStore className="drawer-icon" size={18} />
              <span>المتاجر</span>
            </NavLink>
          }

          {/* Cart Tab in Drawer */}
          {shouldShowCart() && (
            <NavLink to="/cart" className="drawer-link" onClick={closeDrawer}>
              <FaShoppingCart className="drawer-icon" size={18} />
              <span>السلة</span>
            </NavLink>
          )}

          {shouldShowWishlist() && (
            <NavLink to="/wishlist" className="drawer-link" onClick={closeDrawer}>
              <FaHeart className="drawer-icon" size={18} />
              <span>قائمة الرغبات</span>
            </NavLink>
          )}

          <div className="drawer-divider" />

          {loggedIn && (
            <>
              <NavLink to="/profile" className="drawer-link" onClick={closeDrawer}>
                <FaUser className="drawer-icon" size={18} />
                <span>الملف الشخصي</span>
              </NavLink>
              <button className="drawer-link drawer-logout" onClick={handleLogout}>
                <FaSignOutAlt className="drawer-icon-logout" size={18} />
                <span>تسجيل الخروج</span>
              </button>
            </>
          )}
        </div>

        {/* Drawer Footer with Theme Toggle */}
        <div className="drawer-footer">
          <button
            className="drawer-theme-toggle"
            onClick={handleToggle}
          >
            <span className="theme-half-circle" />
            <span>{resolvedTheme  === "purple" ? "مظهر الوردي/الأبيض" : "مظهر الأسود/الأرجواني"}</span>
          </button>
        </div>
      </div>
      {error && <FloatingMsg success= {false} message= {error}/>}
    </>
  );
}

export default Navbar;