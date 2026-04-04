import { Moon, Sun, LogIn, PersonStanding}from "lucide-react";
import * as Icons from "lucide-react";
import { useTheme } from "./ThemeProvider";
import {useLocation} from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  console.log("lucide-react icons-> ", Object.keys(Icons));
  const {theme, setTheme}=  useTheme();

  const location = useLocation();
  console.log("location pathname => ", location.pathname);

  return (
    <div className="navbar-container" dir="rtl">
      <nav className="nav-bar">
        <div className="nav-right">
          {location.pathname !== "/login" && <a href="/login"><LogIn></LogIn></a>}
          {location.pathname !== "/profile" && <a href="/profile"><PersonStanding></PersonStanding></a>}
          {location.pathname !== "/" && <a href="/" className="nav-logo">
            Qena <span>Glam</span> <div className="logo-dot"></div>{" "}
            <span>قنا</span>
          </a>}
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