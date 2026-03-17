import { Moon, Sun, LogIn }from "lucide-react";
import * as Icons from "lucide-react";
import "./Navbar.css";

function Navbar({ isDark, setIsDark }) {
  console.log("lucide-react icons-> ", Object.keys(Icons));
  return (
    //  {/* Navbar العلوي الصغير */}
    <div className={`selection-wrapper ${isDark ? "dark" : "light"}`}>
      <nav className="mini-nav">
        <a href="/login"><span><LogIn></LogIn></span></a>
        <div className="nav-logo">
          Qena <span>Glam</span> <div className="logo-dot"></div>{" "}
          <span>قنا</span>
        </div>
        <div className="nav-left">
          <span className="nav-item">الرئيسية</span>
          <div className="mode-toggle" onClick={() => setIsDark(!isDark)}>
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;