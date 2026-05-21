import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./OrderDetailsList.css";
import { getUserRole } from "../services/users";
import { getOrderDetails } from "../services/order";
import { api } from "../services/authService";

// ─── Icons ───────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M2 6L5 9L10 3"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14">
    <line
      x1="5"
      y1="5"
      x2="19"
      y2="19"
      stroke="red"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      x1="19"
      y1="5"
      x2="5"
      y2="19"
      stroke="red"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const XWhiteIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14">
    <line
      x1="5"
      y1="5"
      x2="19"
      y2="19"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      x1="19"
      y1="5"
      x2="5"
      y2="19"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const StarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path
      d="M5.1375 11.1187L7.5 9.69375L9.8625 11.1375L9.24375 8.4375L11.325 6.6375L8.5875 6.39375L7.5 3.84375L6.4125 6.375L3.675 6.61875L5.75625 8.4375L5.1375 11.1187ZM2.86875 14.25L4.0875 8.98125L0 5.4375L5.4 4.96875L7.5 0L9.6 4.96875L15 5.4375L10.9125 8.98125L12.1313 14.25L7.5 11.4563L2.86875 14.25Z"
      fill="#A855F7"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path
      d="M6.45 10.95L11.7375 5.6625L10.6875 4.6125L6.45 8.85L4.3125 6.7125L3.2625 7.7625L6.45 10.95ZM7.5 15C6.4625 15 5.4875 14.8031 4.575 14.4094C3.6625 14.0156 2.86875 13.4812 2.19375 12.8062C1.51875 12.1312 0.984375 11.3375 0.590625 10.425C0.196875 9.5125 0 8.5375 0 7.5C0 6.4625 0.196875 5.4875 0.590625 4.575C0.984375 3.6625 1.51875 2.86875 2.19375 2.19375C2.86875 1.51875 3.6625 0.984375 4.575 0.590625C5.4875 0.196875 6.4625 0 7.5 0C8.5375 0 9.5125 0.196875 10.425 0.590625C11.3375 0.984375 12.1312 1.51875 12.8062 2.19375C13.4812 2.86875 14.0156 3.6625 14.4094 4.575C14.8031 5.4875 15 6.4625 15 7.5C15 8.5375 14.8031 9.5125 14.4094 10.425C14.0156 11.3375 13.4812 12.1312 12.8062 12.8062C12.1312 13.4812 11.3375 14.0156 10.425 14.4094C9.5125 14.8031 8.5375 15 7.5 15Z"
      fill="#22C55E"
    />
  </svg>
);

const MoneyIcon = () => (
  <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
    <path
      d="M13 9C12.1667 9 11.4583 8.70833 10.875 8.125C10.2917 7.54167 10 6.83333 10 6C10 5.16667 10.2917 4.45833 10.875 3.875C11.4583 3.29167 12.1667 3 13 3C13.8333 3 14.5417 3.29167 15.125 3.875C15.7083 4.45833 16 5.16667 16 6C16 6.83333 15.7083 7.54167 15.125 8.125C14.5417 8.70833 13.8333 9 13 9ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10H18C18 9.45 18.1958 8.97917 18.5875 8.5875C18.9792 8.19583 19.45 8 20 8V4C19.45 4 18.9792 3.80417 18.5875 3.4125C18.1958 3.02083 18 2.55 18 2H8C8 2.55 7.80417 3.02083 7.4125 3.4125C7.02083 3.80417 6.55 4 6 4V8C6.55 8 7.02083 8.19583 7.4125 8.5875C7.80417 8.97917 8 9.45 8 10ZM19 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16ZM6 10V2V10Z"
      fill="#A855F7"
    />
  </svg>
);

const TruckIcon = () => (
  <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
    <path
      d="M5 16C4.16667 16 3.45833 15.7083 2.875 15.125C2.29167 14.5417 2 13.8333 2 13H0V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16V4H19L22 8V13H20C20 13.8333 19.7083 14.5417 19.125 15.125C18.5417 15.7083 17.8333 16 17 16C16.1667 16 15.4583 15.7083 14.875 15.125C14.2917 14.5417 14 13.8333 14 13H8C8 13.8333 7.70833 14.5417 7.125 15.125C6.54167 15.7083 5.83333 16 5 16ZM5 14C5.28333 14 5.52083 13.9042 5.7125 13.7125C5.90417 13.5208 6 13.2833 6 13C6 12.7167 5.90417 12.4792 5.7125 12.2875C5.52083 12.0958 5.28333 12 5 12C4.71667 12 4.47917 12.0958 4.2875 12.2875C4.09583 12.4792 4 12.7167 4 13C4 13.2833 4.09583 13.5208 4.2875 13.7125C4.47917 13.9042 4.71667 14 5 14ZM2 11H2.8C3.08333 10.7 3.40833 10.4583 3.775 10.275C4.14167 10.0917 4.55 10 5 10C5.45 10 5.85833 10.0917 6.225 10.275C6.59167 10.4583 6.91667 10.7 7.2 11H14V2H2V11ZM17 14C17.2833 14 17.5208 13.9042 17.7125 13.7125C17.9042 13.5208 18 13.2833 18 13C18 12.7167 17.9042 12.4792 17.7125 12.2875C17.5208 12.0958 17.2833 12 17 12C16.7167 12 16.4792 12.0958 16.2875 12.2875C16.0958 12.4792 16 12.7167 16 13C16 13.2833 16.0958 13.5208 16.2875 13.7125C16.4792 13.9042 16.7167 14 17 14ZM16 9H20.25L18 6H16V9Z"
      fill="#DDB7FF"
    />
  </svg>
);

const CardIcon = () => (
  <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
    <path
      d="M15 1.5V10.5C15 10.9125 14.8531 11.2656 14.5594 11.5594C14.2656 11.8531 13.9125 12 13.5 12H1.5C1.0875 12 0.734375 11.8531 0.440625 11.5594C0.146875 11.2656 0 10.9125 0 10.5V1.5C0 1.0875 0.146875 0.734375 0.440625 0.440625C0.734375 0.146875 1.0875 0 1.5 0H13.5C13.9125 0 14.2656 0.146875 14.5594 0.440625C14.8531 0.734375 15 1.0875 15 1.5ZM1.5 3H13.5V1.5H1.5V3ZM1.5 6V10.5H13.5V6H1.5ZM1.5 10.5V1.5V10.5Z"
      fill="#CFC2D6"
    />
  </svg>
);

const ArrowIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z"
      fill="#9CA3AF"
    />
  </svg>
);
// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending: { label: "قيد الانتظار", cls: "badge--pending" },
  preparing: { label: "جاري التجهيز", cls: "badge--preparing" },
  ready: { label: "جاهز للتوصيل", cls: "badge--ready" },
  shipping: { label: "قيد التوصيل", cls: "badge--shipping" },
  delivered: { label: "تم التوصيل", cls: "badge--delivered" },
  cancelled: { label: "ملغي", cls: "badge--cancelled" },
};
const PAYMENT_STATUS_MAP = {
  "قيد الانتظار": { label: "مؤجل", cls: "ol-payment ol-payment--pending" },
  "قيد المعالجة": {
    label: "قيد المعالجة",
    cls: "ol-payment ol-payment--processing",
  },
  مكتمل: { label: "مكتمل", cls: "ol-payment ol-payment--completed" },
  فشل: { label: "فشل", cls: "ol-payment ol-payment--failed" },
  مسترجع: { label: "مسترجع", cls: "ol-payment ol-payment--refunded" },
};
const TRACKING_STEPS = [
  { key: "pending", label: "تم استلام الطلب" },
  { key: "preparing", label: "جاري التجهيز" },
  { key: "ready", label: "جاهز للتوصيل" },
  { key: "shipping", label: "خرج للشحن" },
  { key: "delivered", label: "تم التوصيل" },
];

const PAYMENT_METHOD_MAP = {
  card: "بطاقة ائتمان",
  cash: "دفع عند الاستلام",
  wallet: "المحفظة",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeStatus(status) {
  const map = {
    "قيد الانتظار": "pending",
    "جاري التجهيز": "preparing",
    "جاهز للتوصيل": "ready",
    "قيد التوصيل": "shipping",
    "تم التوصيل": "delivered",
    ملغي: "cancelled",
  };
  return map[status] || status;
}

function getStepState(stepKey, orderStatus) {
  const ORDER = ["pending", "preparing", "ready", "shipping", "delivered"];
  const currentIdx = ORDER.indexOf(normalizeStatus(orderStatus));
  const stepIdx = ORDER.indexOf(stepKey);
  return stepIdx <= currentIdx ? "done" : "pending";
}

function getCompletedStepsBeforeCancel(order) {
  const ORDER = ["pending", "preparing", "ready", "shipping", "delivered"];
  const idx = ORDER.indexOf(
    normalizeStatus(order.lastStatusBeforeCancel || order.status),
  );
  return idx === -1 ? 0 : idx;
}
function formatDate(dateStr) {
  if (!dateStr) return "-- : --";
  return new Date(dateStr).toLocaleString("ar-EG", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Rating Star ──────────────────────────────────────────────────────────────
const RatingStar = ({ filled, onClick }) => (
  <button className="modal-star-btn" onClick={onClick}>
    <svg
      width="32"
      height="30"
      viewBox="0 0 20 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z"
        fill={filled ? "#E9C349" : "none"}
        stroke={filled ? "#E9C349" : "#C0A8D0"}
        strokeWidth="1"
      />
    </svg>
  </button>
);

function ReviewModal({ product, orderId, storeOwnerId, onClose, onSuccess }) {
  
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!rating) return;

    setLoading(true);
    setError(null);

    try {
      const productId = product?.prod_id?._id || product?.prod_id;

      if (!productId) {
        throw new Error("Product ID missing");
      }

      await api.post(`/order/${orderId}/rating`, {
        productId,
        rate: Number(rating),
        comment: comment?.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.log("400 error response =>", err.response?.data);

      setError(err.response?.data?.message || "فشل إرسال التقييم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>
        <div className="modal-header">
          <svg width="22" height="21" viewBox="0 0 20 19" fill="none">
            <path
              d="M3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z"
              fill="#E9C349"
            />
          </svg>
          <h3 className="modal-title">تقييم المنتج</h3>
        </div>

        <p className="modal-product-name">{product.name}</p>
        <p className="modal-stars-label">كيف تقيمين هذا المنتج؟</p>
        <div className="modal-stars-row" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} onMouseEnter={() => setHovered(n)}>
              <RatingStar
                filled={(hovered || rating) >= n}
                onClick={() => setRating(n)}
              />
            </span>
          ))}
        </div>
        {rating > 0 && (
          <p className="modal-rating-label">
            {["", "سيئ", "مقبول", "جيد", "جيد جداً", "ممتاز"][rating]}
          </p>
        )}
        <p className="modal-comment-label">رأيك الشخصي</p>
        <textarea
          className="modal-comment"
          placeholder="شاركينا تجربتك مع المنتج..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />
        {error && <p className="modal-error">{error}</p>}
        <button
          className="modal-submit"
          onClick={submit}
          disabled={!rating || loading}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l5 5L20 7"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {loading ? "جاري الإرسال..." : "إرسال التقييم"}
        </button>
        <button className="modal-cancel" onClick={onClose}>
          إلغاء
        </button>
      </div>
    </div>
  );
}

function ProductsList({
  order,
  normalizedStatus,
  ratedProducts,
  setReview,
  showReviewBtn,
}) {
  const buildImgSrc = (imgPath) => {
    if (!imgPath) return null;
    return imgPath.replace(/\\/g, "//").replace("uploads", api);
  };
  const totalProducts = order.products.reduce(
    (acc, s) => acc + s.products.length,
    0,
  );

  return (
    <div className="od-products-card">
      <div className="od-products-header">
        <span className="od-products-id">
          المنتجات المشتراة ({totalProducts})
        </span>
      </div>
      <div className="od-products-list">
        {order.products?.flatMap((store) =>
          store.products.map((prod) => {
            const imgSrc = buildImgSrc(prod.prod_id?.images?.[0]);
            const isDelivered = normalizedStatus === "delivered";
            const realProdId =
              prod.prod_id && typeof prod.prod_id === "object"
                ? prod.prod_id._id
                : prod.prod_id;

            if (!realProdId) return null;

            const hasReviewed =
              prod?.hasReviewed === true ||
              ratedProducts.includes(realProdId.toString());

            console.log(
              "REAL PRODUCT ID =>",
              realProdId.toString(),
              "ratedProducts =>",
              ratedProducts,
              "hasReviewed =>",
              hasReviewed,
            );
            return (
              <div key={prod._id} className="od-product-item">
                <div className="od-product-left">
                  <div className="od-product-img">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={prod.name}
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML =
                            "<span class='od-img-placeholder'>🧴</span>";
                        }}
                      />
                    ) : (
                      <div className="od-img-placeholder">🛍️</div>
                    )}
                  </div>
                  <div className="od-product-info">
                    <p className="od-prod-name">{prod.name}</p>
                    <p className="od-prod-store">
                      {store.owner_store_id?.store_name || "—"}
                    </p>
                    <p className="od-prod-qty">الكمية: {prod.quantity}</p>
                  </div>
                </div>
                <div className="od-product-right">
                  <span className="od-prod-price">
                    {prod.subtotal_price} ج.م
                  </span>
                  {isDelivered && (
                    <button
                      className={`od-review-btn ${hasReviewed ? "od-review-btn--done" : ""}`}
                      onClick={() =>
                        !hasReviewed &&
                        setReview({
                          prod,
                          storeOwnerId:
                            store.owner_store_id?._id || store.owner_store_id,
                        })
                      }
                      disabled={hasReviewed}
                    >
                      <StarIcon />
                      {hasReviewed ? "تم التقييم ✓" : "تقييم المنتج"}
                    </button>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

// ─── Client View ──────────────────────────────────────────────────────────────
function ClientOrderView({
  order,
  normalizedStatus,
  isCancelled,
  ratedProducts,
  setReview,
}) {
  const resolvedPaymentStatus = () => {
    const method = order.payment?.method;
    const rawStatus = order.payment?.status;

    if (method === "cash") {
      if (normalizedStatus === "cancelled") return "مسترجع";
      if (normalizedStatus === "delivered") return "مكتمل";
      return "قيد الانتظار";
    }
    return rawStatus;
  };

  const payBadge = PAYMENT_STATUS_MAP[resolvedPaymentStatus()] || {};
  const customerInfo = order.user_id;
  return (
    <div className="od-grid">
      <aside className="od-tracking-card">
        <h2 className="od-section-title">تتبع الطلب</h2>

        <div className="od-steps">
          {TRACKING_STEPS.filter((step) => {
            if (!isCancelled) return true;
            const ORDER = ["pending", "preparing", "shipping", "delivered"];
            return (
              ORDER.indexOf(step.key) <= getCompletedStepsBeforeCancel(order)
            );
          }).map((step, i, arr) => {
            const state = isCancelled
              ? "done"
              : getStepState(step.key, order.status);
            const isLastFiltered = isCancelled && i === arr.length - 1;
            const isLast = !isCancelled && i === TRACKING_STEPS.length - 1;
            const isPend = state === "pending";
            const isDone = state === "done";

            return (
              <div
                key={step.key}
                className={`od-step ${isDone ? "od-step--done" : ""} ${isPend ? "od-step--pending" : ""} ${(isLast && !isCancelled) || isLastFiltered ? "od-step--last" : ""}`}
              >
                <div className="od-step-indicator">
                  <div
                    className={`od-step-circle ${isDone ? "circle--done" : ""} ${isPend ? "circle--pending" : ""}`}
                  >
                    {isDone && <CheckIcon />}
                  </div>
                </div>
                <div className="od-step-text">
                  <span className="od-step-label">{step.label}</span>
                  <span className="od-step-time">
                    {isDone ? formatDate(order.updatedAt) : "-- : --"}
                  </span>
                </div>
              </div>
            );
          })}

          {isCancelled && (
            <div className="od-step od-step--cancelled od-step--last">
              <div
                className="od-step-indicator"
              
              >
                <div className="od-step-circle circle--cancelled">
                  <XWhiteIcon />
                </div>
              </div>
              <div className="od-step-text">
                <span className="od-step-label cancelled-label">ملغي</span>
                <span className="od-step-time cancelled-time">
                  {formatDate(order.cancelledAt || order.updatedAt)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="od-totals">
          <div className="od-total-row">
            <span className="od-total-label">المجموع الفرعي</span>
            <span className="od-total-val">{order.subtotal_price} ج.م</span>
          </div>
          <div className="od-total-row">
            <span className="od-total-label">الشحن</span>
            <span className="od-total-val">{order.delivery_cost} ج.م</span>
          </div>
          <div className="od-total-row od-grand-row">
            <span className="od-grand-label">الإجمالي</span>
            <span className="od-grand-val">{order.total_price} ج.م</span>
          </div>
        </div>
      </aside>
      {/* ── PAYMENT ── */}
      <div className="od-card od-payment-card">
        <div className="od-card-header">
          <MoneyIcon />
          <h2 className="od-section-title">تفاصيل الدفع</h2>
        </div>
        <div className="od-info-list">
          <div className="od-info-row">
            <span className="od-info-label">طريقة الدفع</span>
            <span className="od-info-val od-method-val">
              <CardIcon />
              {PAYMENT_METHOD_MAP[order.payment?.method] ||
                order.payment?.method}
            </span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">حالة الدفع</span>
            <span className={`od-pay-badge ${payBadge.cls || ""}`}>
              {payBadge.label || resolvedPaymentStatus()}
            </span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">تاريخ العملية</span>
            <span className="od-info-val">
              {formatDate(order.payment?.completedAt || order.createdAt)}
            </span>
          </div>
          {order.payment?.paymob_order_id && (
            <div className="od-info-row">
              <span className="od-info-label">رقم العملية</span>
              <span className="od-info-val od-mono">
                {order.payment.paymob_order_id}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── SHIPPING ── */}
      <div className="od-card od-shipping-card">
        <div className="od-card-header">
          <TruckIcon />
          <h2 className="od-section-title">معلومات الشحن</h2>
        </div>
        <div className="od-info-list">
          <div className="od-info-row">
            <span className="od-info-label">الاسم</span>
            <span className="od-info-val">
              {customerInfo?.firstName
                ? `${customerInfo.firstName} ${customerInfo.lastName || ""}`.trim()
                : "—"}
            </span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">الهاتف</span>
            <span className="od-info-val od-mono">
              {customerInfo?.phoneNumber || "—"}
            </span>
          </div>
          <div className="od-info-row od-address-row">
            <span className="od-info-label">العنوان</span>
            <span className="od-info-val od-address-val">
              {customerInfo?.address
                ? `${customerInfo.address.street || ""}، ${customerInfo.address.city || ""}، مصر.`
                : "—"}
            </span>
          </div>
        </div>
      </div>

      <ProductsList
        order={order}
        normalizedStatus={normalizedStatus}
        ratedProducts={ratedProducts}
        setReview={setReview}
        showReviewBtn={true}
      />
    </div>
  );
}

function StoreOrderView({ order, normalizedStatus, isCancelled }) {
  const customer = order.customer || {};
  const products = order.store_products || [];
  const totalProducts = products.length;

  return (
    <div className="od-grid od-grid--store">
      <div className="od-card od-client-info-card">
        <div className="od-card-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
              fill="#A855F7"
            />
          </svg>
          <h2 className="od-section-title">معلومات العميل</h2>
        </div>
        <div className="od-client-name">{customer.name || "—"}</div>
        <div className="od-info-list">
          <div className="od-info-row od-icon-row">
            <span className="od-icon-label">📞</span>
            <span className="od-info-val">{customer.phone || "—"}</span>
          </div>
          <div className="od-info-row od-icon-row">
            <span className="od-icon-label">📍</span>
            {/* ✅ address بييجي string من السيرفر */}
            <span className="od-info-val">{customer.address || "—"}</span>
          </div>
          <div className="od-info-row od-icon-row">
            <span className="od-icon-label">✉️</span>
            <span className="od-info-val">{customer.email || "—"}</span>
          </div>
        </div>
      </div>

      <div className="od-card od-order-info-card">
        <div className="od-card-header">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V7C0 6.45 0.195833 5.97917 0.5875 5.5875C0.979167 5.19583 1.45 5 2 5H7V2C7 1.45 7.19583 0.979167 7.5875 0.5875C7.97917 0.195833 8.45 0 9 0H11C11.55 0 12.0208 0.195833 12.4125 0.5875C12.8042 0.979167 13 1.45 13 2V5H18C18.55 5 19.0208 5.19583 19.4125 5.5875C19.8042 5.97917 20 6.45 20 7V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H2ZM2 18H18V7H13C13 7.55 12.8042 8.02083 12.4125 8.4125C12.0208 8.80417 11.55 9 11 9H9C8.45 9 7.97917 8.80417 7.5875 8.4125C7.19583 8.02083 7 7.55 7 7H2V18ZM4 16H10V15.55C10 15.2667 9.92083 15.0042 9.7625 14.7625C9.60417 14.5208 9.38333 14.3333 9.1 14.2C8.76667 14.05 8.42917 13.9375 8.0875 13.8625C7.74583 13.7875 7.38333 13.75 7 13.75C6.61667 13.75 6.25417 13.7875 5.9125 13.8625C5.57083 13.9375 5.23333 14.05 4.9 14.2C4.61667 14.3333 4.39583 14.5208 4.2375 14.7625C4.07917 15.0042 4 15.2667 4 15.55V16ZM12 14.5H16V13H12V14.5ZM7 13C7.41667 13 7.77083 12.8542 8.0625 12.5625C8.35417 12.2708 8.5 11.9167 8.5 11.5C8.5 11.0833 8.35417 10.7292 8.0625 10.4375C7.77083 10.1458 7.41667 10 7 10C6.58333 10 6.22917 10.1458 5.9375 10.4375C5.64583 10.7292 5.5 11.0833 5.5 11.5C5.5 11.9167 5.64583 12.2708 5.9375 12.5625C6.22917 12.8542 6.58333 13 7 13ZM12 11.5H16V10H12V11.5ZM9 7H11V2H9V7Z"
              fill="#A855F7"
            />
          </svg>

          <h2 className="od-section-title">معلومات الطلب</h2>
        </div>
        <div className="od-info-list">
          <div className="od-info-row">
            <span className="od-info-label">رقم الطلب:</span>
            <span className="od-info-val od-mono">
              #{order.order_id?.slice(-6).toUpperCase()}
            </span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">التاريخ:</span>
            <span className="od-info-val">
              {formatDate(order.order_created_at)}
            </span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">المنتجات:</span>
            <span className="od-info-val">{totalProducts} منتج</span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">الإجمالي:</span>
            <span className="od-info-val od-grand-highlight">
              {order.store_subtotal} ج
            </span>
          </div>
        </div>
      </div>

      <div className="od-products-card">
        <div className="od-products-header">
          <span className="od-products-id">
            المنتجات المشتراة ({totalProducts})
          </span>
        </div>
        <div className="od-products-list">
          {products.map((prod) => {
            const imgSrc = prod.images?.[0]
              ?.replace(/\\/g, "//")
              ?.replace("uploads", "http://127.0.0.1:8080");
            return (
              <div key={prod.product_id} className="od-product-item">
                <div className="od-product-left">
                  <div className="od-product-img">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={prod.product_name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="od-img-placeholder">🛍️</div>
                    )}
                  </div>
                  <div className="od-product-info">
                    <p className="od-prod-name">{prod.product_name}</p>
                    <p className="od-prod-qty">الكمية: {prod.quantity}</p>
                  </div>
                </div>
                <div className="od-product-right">
                  <span className="od-prod-price">{prod.subtotal} ج.م</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
// ─── Main Component ───────────────────────────────────────────────────────────

export default function MyOrderDetails() {
  const navigate = useNavigate();
  const { id: orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [review, setReview] = useState(null);
  const [ratedProducts, setRatedProducts] = useState([]);
  const role = getUserRole();

  const storeMode = role === "store_owner";
  const clientMode = role === "client";

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const resData = await getOrderDetails(orderId, setError);
      setOrder(resData.data);
    } catch (err) {
      setError("تعذّر تحميل تفاصيل الطلب");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="od-loading">
        <div className="od-spinner" />
        <p>جاري تحميل الطلب...</p>
      </div>
    );
  if (error) return <div className="od-error">{error}</div>;
  if (!order) return <div className="od-error">لم يتم العثور على الطلب</div>;

  // ✅ يدعم الاتنين client و store owner
  const rawStatus = order.status || order.order_status;
  const normalizedStatus = normalizeStatus(rawStatus);
  const isCancelled = normalizedStatus === "cancelled";
  const badge = STATUS_MAP[normalizedStatus] || STATUS_MAP["pending"];
  const displayId = order._id || order.order_id;
  const displayDate = order.createdAt || order.order_created_at;

  return (
    <div className="od-root" dir="rtl">
      <div
        className="back-orders"
        onClick={() =>
          navigate(storeMode ? "/dashboard/store_owner/orders" : "/orders")
        }
      >
        <ArrowIcon />
        <span className="text">رجوع للطلبات</span>
      </div>

      <header className="od-header">
        <div className="od-header-info">
          <div className="od-title-row">
            <h1 className="od-order-number">
              رقم الطلب #{displayId?.slice(-6).toUpperCase()}
            </h1>
            <span className={`od-badge ${badge.cls}`}>
              {normalizedStatus === "delivered" && <CheckCircleIcon />}
              {normalizedStatus === "cancelled" && (
                <span className="badge-x">
                  <XIcon />
                </span>
              )}
              {badge.label}
            </span>
          </div>
          <p className="od-date">تاريخ الطلب: {formatDate(displayDate)}</p>
        </div>
        <button className="od-print-btn" onClick={() => window.print()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          تحميل الفاتورة
        </button>
      </header>

      {clientMode && (
        <ClientOrderView
          order={order}
          normalizedStatus={normalizedStatus}
          isCancelled={isCancelled}
          ratedProducts={ratedProducts}
          setReview={setReview}
        />
      )}

      {storeMode && (
        <StoreOrderView
          order={order}
          normalizedStatus={normalizedStatus}
          isCancelled={isCancelled}
        />
      )}

      {review && clientMode && (
        <ReviewModal
          product={review.prod}
          orderId={order._id}
          storeOwnerId={review.storeOwnerId}
          onClose={() => setReview(null)}
          onSuccess={() => {
            const realProdId =
              review.prod?.prod_id && typeof review.prod.prod_id === "object"
                ? review.prod.prod_id._id
                : review.prod?.prod_id;
            if (!realProdId) return;

            setOrder((prev) => ({
              ...prev,
              products: prev.products.map((store) => ({
                ...store,
                products: store.products.map((p) => {
                  const pId = p.prod_id?._id || p.prod_id;
                  return pId?.toString() === realProdId.toString()
                    ? { ...p, hasReviewed: true }
                    : p;
                }),
              })),
            }));

            setReview(null);
          }}
        />
      )}
    </div>
  );
}
