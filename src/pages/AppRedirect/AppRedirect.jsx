import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./AppRedirect.css";

const ALLOWED_SCHEME = "glamqena:";

export default function AppRedirect() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("trying"); // trying | fallback | invalid
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

  // Read + validate the deep link supplied by the backend.
  const deepLink = useMemo(() => {
    const raw = searchParams.get("deepLink");
    if (!raw) return null;

    const decoded = decodeURIComponent(raw);

    // Only allow our own custom scheme — prevents open-redirect abuse
    // if someone hand-crafts an email link pointing at another app.
    if (!decoded.toLowerCase().startsWith(ALLOWED_SCHEME)) return null;

    return decoded;
  }, [searchParams]);

  useEffect(() => {
    if (!deepLink) {
      setStatus("invalid");
      return;
    }

    // 1) Try to open the app immediately.
    window.location.href = deepLink;

    // 2) If nothing happened within 2s, offer a manual retry.
    timerRef.current = setTimeout(() => {
      if (!cancelledRef.current) setStatus("fallback");
    }, 2000);

    // 3) If the tab goes hidden / loses focus, the OS switched apps.
    const cancel = () => {
      cancelledRef.current = true;
      clearTimeout(timerRef.current);
    };
    const onVisibility = () => {
      if (document.hidden) cancel();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", cancel);
    window.addEventListener("blur", cancel);

    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", cancel);
      window.removeEventListener("blur", cancel);
    };
  }, [deepLink]);

  const openApp = () => {
    if (!deepLink) return;
    cancelledRef.current = true;
    clearTimeout(timerRef.current);
    window.location.href = deepLink;
  };

  return (
    <div className="app-redirect-page">
      <div className="app-redirect-card">
        <div className="app-redirect-brand">
          <span className="brand-glam">Glam</span>
          <span className="brand-qena">Qena</span>
          <span className="brand-dot" />
        </div>

        {status === "trying" && (
          <>
            <div className="app-redirect-spinner" aria-hidden="true" />
            <h1 className="app-redirect-title">Opening GlamQena…</h1>
            <p className="app-redirect-subtitle">
              Please wait while we open the app.
            </p>
          </>
        )}

        {status === "fallback" && (
          <>
            <div className="app-redirect-icon" aria-hidden="true">
              📱
            </div>
            <h1 className="app-redirect-title">Didn't open?</h1>
            <p className="app-redirect-subtitle">
              Tap the button below to open GlamQena again.
            </p>

            <button
              type="button"
              className="app-redirect-btn app-redirect-btn--primary"
              onClick={openApp}
            >
              Open GlamQena
            </button>
          </>
        )}

        {status === "invalid" && (
          <>
            <div className="app-redirect-icon" aria-hidden="true">
              ⚠️
            </div>
            <h1 className="app-redirect-title">Link unavailable</h1>
            <p className="app-redirect-subtitle">
              This link is invalid or has expired. Please request a new one
              from the app.
            </p>
          </>
        )}
      </div>
    </div>
  );
}