import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { isUserLogged } from "../services/authService";

const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "pink",
  setTheme: () => {},
});

const STORAGE_KEY = "Theme";
const VALID_THEMES = ["pink", "purple", "system"];

// Frontend vocabulary ↔ backend vocabulary.
// Backend enum: "light" | "dark" | "system"
// Frontend/CSS: "pink"  | "purple" | "system"
const TO_BACKEND = { pink: "light", purple: "dark", system: "system" };
const FROM_BACKEND = { light: "pink", dark: "purple", system: "system" };

export const toBackendTheme = (t) => TO_BACKEND[t] || "system";
export const fromBackendTheme = (t) => FROM_BACKEND[t] || "system";

function resolveTheme(preference) {
  if (preference === "pink" || preference === "purple") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "purple"
    : "pink";
}

function readStoredPreference() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return VALID_THEMES.includes(saved) ? saved : "system";
}

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(readStoredPreference);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    resolveTheme(readStoredPreference()),
  );

  // Apply the resolved theme whenever the preference changes.
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Follow OS changes while the user is on "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = mq.matches ? "purple" : "pink";
      setResolvedTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  // ── Sync from the user object when auth state changes ──
  // the login/register handlers already saved `user`
  // to localStorage before dispatching auth-changed.
  useEffect(() => {
    const syncFromUser = () => {
      if (!isUserLogged()) return;

      try {
        const raw = localStorage.getItem("user");
        if (!raw) return;
        const user = JSON.parse(raw);
        const backendTheme = user?.preferences?.theme;   // "light" | "dark" | "system"
        if (!backendTheme) return;

        const local = fromBackendTheme(backendTheme);

        // Precedence:
        //   - If the server has an explicit non-system value, it wins.
        //   - If the server value is "system" (the default), keep the local
        //     value if the guest explicitly set one.
        setThemeState((current) => {
          const currentIsExplicit = current === "pink" || current === "purple";
          const serverIsExplicit = local === "pink" || local === "purple";
          if (serverIsExplicit || !currentIsExplicit) return local;
          return current;
        });
      } catch {
        // corrupt JSON — ignore, keep local
      }
    };

    syncFromUser();
    window.addEventListener("auth-changed", syncFromUser);
    return () => window.removeEventListener("auth-changed", syncFromUser);
  }, []);

  const setTheme = useCallback((next) => {
    if (!VALID_THEMES.includes(next)) {
      console.warn(`[theme] ignoring invalid theme "${next}"`);
      return;
    }
    setThemeState(next);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);