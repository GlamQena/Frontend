import { Moon, Sun, LogIn }from "lucide-react";
import * as Icons from "lucide-react";
import { useTheme } from "./ThemeProvider";
import "./Navbar.css";

function Navbar() {
  console.log("lucide-react icons-> ", Object.keys(Icons));
  const {theme, setTheme}=  useTheme();
  
  return (
    <div className="navbar-container" dir="rtl">
      <nav className="nav-bar">
        <div className="nav-right">
          <a href="/login"><LogIn></LogIn></a>
          <div className="nav-logo">
            Qena <span>Glam</span> <div className="logo-dot"></div>{" "}
            <span>قنا</span>
          </div>
        </div>

        <div className="nav-left">
          <div className="mode-toggler" onClick={() => setTheme(prevTheme => prevTheme==="dark"? "light" : "dark")}>
            {theme==="dark" ? <Sun size={18} /> : <Moon size={18} />}
          </div>
        </div>

      </nav>
    </div>
  );
}

export default Navbar;