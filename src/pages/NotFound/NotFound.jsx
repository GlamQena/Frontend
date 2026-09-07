import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, ShoppingBag } from "lucide-react";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        {/* Animated Background Elements */}
        <div className="not-found-bg-circle"></div>
        <div className="not-found-bg-circle-2"></div>
        <div className="not-found-bg-circle-3"></div>
        
        {/* Floating Icons */}
        <div className="not-found-float-icon icon-1">🛍️</div>
        <div className="not-found-float-icon icon-2">💄</div>
        <div className="not-found-float-icon icon-3">✨</div>
        <div className="not-found-float-icon icon-4">🌸</div>

        <div className="not-found-content">
          {/* 404 Number with Gradient */}
          <div className="not-found-number">
            <span className="not-found-digit">4</span>
            <span className="not-found-digit-zero">0</span>
            <span className="not-found-digit">4</span>
          </div>

          {/* Decorative Line */}
          <div className="not-found-divider">
            <span className="not-found-divider-line"></span>
            <span className="not-found-divider-icon">✦</span>
            <span className="not-found-divider-line"></span>
          </div>

          {/* Title & Description */}
          <h1 className="not-found-title">الصفحة غير موجودة</h1>
          <p className="not-found-description">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
            <br />
            قد يكون الرابط غير صحيح أو أن الصفحة قد حُذفت.
          </p>

          {/* Action Buttons */}
          <div className="not-found-actions">
            <button 
              className="not-found-btn primary"
              onClick={() => navigate("/")}
            >
              <Home size={18} />
              <span>الرئيسية</span>
            </button>
            
            <button 
              className="not-found-btn secondary"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} />
              <span>العودة للخلف</span>
            </button>

            <button 
              className="not-found-btn outline"
              onClick={() => navigate("/stores")}
            >
              <ShoppingBag size={18} />
              <span>تصفح المتاجر</span>
            </button>
          </div>

          {/* Help Text */}
          <p className="not-found-help">
            إذا كنت تواجه مشكلة، يمكنك <span className="not-found-help-link" onClick={() => navigate("/contact")}>الاتصال بنا</span> للحصول على المساعدة.
          </p>
        </div>
      </div>
    </div>
  );
}