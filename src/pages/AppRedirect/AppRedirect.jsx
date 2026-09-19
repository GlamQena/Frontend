import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Smartphone, AlertTriangle, Sparkles } from "lucide-react";
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

    const decoded = raw;

    // Only allow our own custom scheme — prevents open-redirect abuse.
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
    <div className="app-redirect-page" dir="rtl" lang="ar">
      <div className="app-redirect-card">
        <div className="app-redirect-brand">
          <span className="brand-glam">Glam</span>
          <span className="brand-qena">Qena</span>
          <span className="brand-dot" />
        </div>

        {status === "trying" && (
          <>
            <div className="app-redirect-spinner" aria-hidden="true" />
            <h1 className="app-redirect-title">جارٍ فتح تطبيق GlamQena…</h1>
            <p className="app-redirect-subtitle">
              لحظة من فضلك، يتم توجيهك إلى التطبيق.
            </p>
          </>
        )}

        {status === "fallback" && (
          <>
            <div className="app-redirect-icon app-redirect-icon--brand">
              <Smartphone
                size={48}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>
            <h1 className="app-redirect-title">لم يُفتح التطبيق؟</h1>
            <p className="app-redirect-subtitle">
              اضغط على الزر أدناه لإعادة فتح GlamQena.
            </p>

            <button
              type="button"
              className="app-redirect-btn app-redirect-btn--primary"
              onClick={openApp}
            >
              <Sparkles
                size={18}
                strokeWidth={2}
                aria-hidden="true"
                style={{ marginInlineEnd: 8 }}
              />
              افتح GlamQena
            </button>
          </>
        )}

        {status === "invalid" && (
          <>
            <div className="app-redirect-icon app-redirect-icon--error">
              <AlertTriangle
                size={48}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>
            <h1 className="app-redirect-title">الرابط غير صالح</h1>
            <p className="app-redirect-subtitle">
              هذا الرابط غير صالح أو منتهي الصلاحية.
              <br />
              يرجى طلب رابط جديد من التطبيق.
            </p>
          </>
        )}
      </div>
    </div>
  );
}