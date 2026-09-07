import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./OrderDetailsList.css";
import { getUserRole } from "../services/users";
import { getOrderDetails } from "../services/order";
import { api } from "../services/authService";
import Pagination from "./Pagination";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "قيد الانتظار": {
    label: "قيد الانتظار",
    color: "var(--gold-main)",
    bg: "rgba(212, 175, 55, 0.12)",
    cls: "badge--pending",
    icon: "⏳",
  },
  "جاري التجهيز": {
    label: "جاري التجهيز",
    color: "var(--purple-dark)",
    bg: "rgba(126, 0, 166, 0.12)",
    cls: "badge--preparing",
    icon: "⚙️",
  },
  "جاهز للتوصيل": {
    label: "جاهز للتوصيل",
    color: "#e610c6",
    bg: "rgba(230, 16, 198, 0.12)",
    cls: "badge--ready",
    icon: "📦",
  },
  "قيد التوصيل": {
    label: "قيد التوصيل",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    cls: "badge--shipping",
    icon: "🚚",
  },
  "تم التوصيل": {
    label: "تم التوصيل",
    color: "var(--success-main)",
    bg: "rgba(34, 197, 94, 0.12)",
    cls: "badge--delivered",
    icon: "✅",
  },
  ملغي: {
    label: "ملغي",
    color: "var(--error-main)",
    bg: "rgba(239, 68, 68, 0.12)",
    cls: "badge--cancelled",
    icon: "❌",
  },
};

const PAYMENT_STATUS_CONFIG = {
  pending: {
    label: "مؤجل",
    color: "var(--gold-main)",
    bg: "rgba(212, 175, 55, 0.10)",
    cls: "pay--pending",
  },
  processing: {
    label: "قيد المعالجة",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.10)",
    cls: "pay--processing",
  },
  completed: {
    label: "مكتمل",
    color: "var(--success-main)",
    bg: "rgba(34, 197, 94, 0.10)",
    cls: "pay--done",
  },
  failed: {
    label: "فشل",
    color: "var(--error-main)",
    bg: "rgba(239, 68, 68, 0.10)",
    cls: "pay--fail",
  },
  refunded: {
    label: "مسترجع",
    color: "var(--purple-dark)",
    bg: "rgba(126, 0, 166, 0.10)",
    cls: "pay--refunded",
  },
};

const PAYMENT_METHOD_MAP = {
  card: "بطاقة ائتمان",
  cash: "دفع عند الاستلام",
  wallet: "المحفظة",
};

const ORDER_STEPS = [
  { key: "pending", label: "تم استلام الطلب" },
  { key: "preparing", label: "جاري التجهيز" },
  { key: "ready", label: "جاهز للتوصيل" },
  { key: "shipping", label: "خرج للشحن" },
  { key: "delivered", label: "تم التوصيل" },
];

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

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("ar-EG") + " ج.م";
}

function buildImgSrc(imgPath) {
  if (!imgPath) return null;
  if (typeof imgPath !== "string") return null;
  if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
    return imgPath;
  }
  const baseURL = process.env.EXPRESS_APP_API_URL || "https://glamqena-backend.vercel.app";
  const path = imgPath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `/${path}`;
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M2 7L5 10L12 3"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16">
    <line
      x1="5"
      y1="5"
      x2="19"
      y2="19"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      x1="19"
      y1="5"
      x2="5"
      y2="19"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 19" fill="none">
    <path
      d="M3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z"
      fill="currentColor"
    />
  </svg>
);

// ─── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ product, orderId, onClose, onSuccess }) {
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
      if (!productId) throw new Error("Product ID missing");
      await api.post(`/order/${orderId}/rating`, {
        productId,
        rate: Number(rating),
        comment: comment?.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "فشل إرسال التقييم");
    } finally {
      setLoading(false);
    }
  };

  const RatingStar = ({ filled, onClick }) => (
    <button className="modal-star-btn" onClick={onClick}>
      <svg width="32" height="30" viewBox="0 0 20 19" fill="none">
        <path
          d="M3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z"
          fill={filled ? "var(--gold-main)" : "none"}
          stroke={filled ? "var(--gold-main)" : "var(--text-muted)"}
          strokeWidth="1.5"
        />
      </svg>
    </button>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>
        <div className="modal-header">
          <StarIcon />
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
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="modal-submit"
            onClick={submit}
            disabled={!rating || loading}
          >
            {loading ? "جاري الإرسال..." : "إرسال التقييم"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Products List with Pagination ──────────────────────────────────────────
function ProductsList({
  order,
  normalizedStatus,
  ratedProducts,
  setReview,
  showReviewBtn = false,
  isAdmin = false,
  isStoreOwner = false,
}) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Get stores based on role
  let allStores = [];
  if (isStoreOwner) {
    allStores = [
      {
        owner_store_id:
          order.owner_store_id ||
          order.store_id ||
          order.store?.owner_store_id ||
          null,
        products: Array.isArray(order.store_products)
          ? order.store_products
          : [],
        store_subtotal: order.store_subtotal || 0,
      },
    ];
  } else {
    allStores = Array.isArray(order.products) ? order.products : [];
  }

  // Flatten all products for pagination
  const allProducts = [];
  allStores.forEach((store) => {
    const storeName =
      store.owner_store_id?.store_name || order.store_name || "—";
    const storeSubtotal = Number(store.store_subtotal) || 0;
    (Array.isArray(store.products) ? store.products : []).forEach((prod) => {
      allProducts.push({
        ...prod,
        storeName,
        storeSubtotal,
        storeId: store.owner_store_id?._id || store.owner_store_id,
      });
    });
  });

  const totalProducts = allProducts.length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = allProducts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Reset pagination when order changes
  useEffect(() => {
    setCurrentPage(1);
  }, [order]);

  const isDelivered = normalizedStatus === "delivered";

  if (totalProducts === 0) {
    return (
      <div className="od-products-card">
        <div className="od-products-header">
          <span className="od-products-id">المنتجات المشتراة (0)</span>
        </div>
        <div className="od-products-empty">لا توجد منتجات</div>
      </div>
    );
  }

  return (
    <div className="od-products-card">
      <div className="od-products-header">
        <span className="od-products-id">
          المنتجات المشتراة ({totalProducts})
        </span>
      </div>

      <div className="od-products-list">
        {paginatedProducts.map((prod, prodIdx) => {
          const productData =
            prod?.prod_id && typeof prod.prod_id === "object"
              ? prod.prod_id
              : null;
          const realProdId =
            productData?._id || prod?.prod_id || prod?.product_id || prod?._id;
          const productName = prod?.name || productData?.name || "—";
          const imgSrc = buildImgSrc(
            productData?.images?.[0] || prod?.images?.[0],
          );
          const quantity = Number(prod?.quantity) || 0;
          const subtotalPrice = Number(
            prod?.subtotal_price ?? prod?.subtotal ?? 0,
          );
          const hasReviewed =
            prod?.hasReviewed === true ||
            ratedProducts.includes(realProdId?.toString());

          return (
            <div
              key={prodIdx}
              className="od-product-item"
              onClick={() => realProdId && navigate(`/products/${realProdId}`)}
              style={{ cursor: realProdId ? "pointer" : "default" }}
            >
              {/* Left Side: Image + Product Name & Store */}
              <div className="od-product-left">
                <div className="od-product-img">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={productName}
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="od-img-placeholder">🛍️</div>
                  )}
                </div>
                <div className="od-product-info">
                  <p className="od-prod-name">{productName}</p>
                  {!isStoreOwner && (
                    <p className="od-prod-store">من: {prod.storeName}</p>
                  )}
                </div>
              </div>

              {/* Right Side: Quantity + Price + Review */}
              <div className="od-product-right">
                {/* Moved Quantity Here */}
                <span className="od-prod-qty">الكمية: {quantity}</span>
                <span className="od-prod-price">
                  {formatCurrency(subtotalPrice)}
                </span>

                {!isAdmin && !isStoreOwner && isDelivered && showReviewBtn && (
                  <button
                    className={`od-review-btn ${hasReviewed ? "od-review-btn--done" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hasReviewed)
                        setReview?.({ prod, storeOwnerId: prod.storeId });
                    }}
                    disabled={hasReviewed}
                  >
                    <StarIcon />
                    {hasReviewed ? "تم التقييم ✓" : "تقييم المنتج"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination for products */}
      {totalPages > 1 && (
        <div className="od-products-pagination">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Store subtotals (only show for client/admin view)
      {!isStoreOwner && allStores.length > 0 && (
        <div className="od-products-subtotals">
          {allStores.map((store, idx) => (
            <div key={idx} className="od-store-subtotal">
              <span>إجمالي {store.owner_store_id?.store_name || order.store_name || "—"}</span>
              <span className="od-grand-highlight">{formatCurrency(store.store_subtotal || 0)}</span>
            </div>
          ))}
        </div>
      )} */}
    </div>
  );
}

// ─── Client Order View ──────────────────────────────────────────────────────
// ─── Client Order View ──────────────────────────────────────────────────────
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
      if (normalizedStatus === "cancelled") return "refunded";
      if (normalizedStatus === "delivered") return "completed";
      return "pending";
    }
    return rawStatus;
  };

  const payBadge =
    PAYMENT_STATUS_CONFIG[resolvedPaymentStatus()] ||
    PAYMENT_STATUS_CONFIG.pending;
  const customerInfo = order.user_id;

  // Get stores for subtotals
  const allStores = Array.isArray(order.products) ? order.products : [];
  const totalOrderPrice = order.total_price || 0;

  return (
    <div className="od-grid">
      {/* Tracking Card */}
      <aside className="od-tracking-card">
        <h2 className="od-section-title">تتبع الطلب</h2>
        <div className="od-steps">
          {ORDER_STEPS.filter((step) => {
            if (!isCancelled) return true;
            const ORDER = [
              "pending",
              "preparing",
              "ready",
              "shipping",
              "delivered",
            ];
            return (
              ORDER.indexOf(step.key) <= getCompletedStepsBeforeCancel(order)
            );
          }).map((step, i, arr) => {
            const state = isCancelled
              ? "done"
              : getStepState(step.key, order.status);
            const isLast = i === arr.length - 1;
            const isDone = state === "done";
            const isPend = state === "pending";

            return (
              <div
                key={step.key}
                className={`od-step ${isDone ? "od-step--done" : ""} ${isPend ? "od-step--pending" : ""} ${isLast ? "od-step--last" : ""}`}
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
              <div className="od-step-indicator">
                <div className="od-step-circle circle--cancelled">
                  <XIcon />
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
        <div className="od-totals">
          <div className="od-total-row">
            <span className="od-total-label">المجموع الفرعي</span>
            <span className="od-total-val">
              {formatCurrency(order.subtotal_price)}
            </span>
          </div>
          <div className="od-total-row">
            <span className="od-total-label">الشحن</span>
            <span className="od-total-val">
              {formatCurrency(order.delivery_cost)}
            </span>
          </div>
          <div className="od-total-row od-grand-row">
            <span className="od-grand-label">الإجمالي</span>
            <span className="od-grand-val">
              {formatCurrency(order.total_price)}
            </span>
          </div>
        </div>
      </aside>

      {/* Payment Card */}
      <div className="od-card od-payment-card">
        <div className="od-card-header">
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <path
              d="M13 9C12.1667 9 11.4583 8.70833 10.875 8.125C10.2917 7.54167 10 6.83333 10 6C10 5.16667 10.2917 4.45833 10.875 3.875C11.4583 3.29167 12.1667 3 13 3C13.8333 3 14.5417 3.29167 15.125 3.875C15.7083 4.45833 16 5.16667 16 6C16 6.83333 15.7083 7.54167 15.125 8.125C14.5417 8.70833 13.8333 9 13 9ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10H18C18 9.45 18.1958 8.97917 18.5875 8.5875C18.9792 8.19583 19.45 8 20 8V4C19.45 4 18.9792 3.80417 18.5875 3.4125C18.1958 3.02083 18 2.55 18 2H8C8 2.55 7.80417 3.02083 7.4125 3.4125C7.02083 3.80417 6.55 4 6 4V8C6.55 8 7.02083 8.19583 7.4125 8.5875C7.80417 8.97917 8 9.45 8 10ZM19 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16ZM6 10V2V10Z"
              fill="var(--primary-main)"
            />
          </svg>
          <h2 className="od-section-title">تفاصيل الدفع</h2>
        </div>
        <div className="od-info-list">
          <div className="od-info-row">
            <span className="od-info-label">طريقة الدفع</span>
            <span className="od-info-val od-method-val">
              {PAYMENT_METHOD_MAP[order.payment?.method] ||
                order.payment?.method}
            </span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">حالة الدفع</span>
            <span className={`od-pay-badge ${payBadge.cls}`}>
              {payBadge.label}
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

      {/* Shipping Card */}
      <div className="od-card od-shipping-card">
        <div className="od-card-header">
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <path
              d="M5 16C4.16667 16 3.45833 15.7083 2.875 15.125C2.29167 14.5417 2 13.8333 2 13H0V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16V4H19L22 8V13H20C20 13.8333 19.7083 14.5417 19.125 15.125C18.5417 15.7083 17.8333 16 17 16C16.1667 16 15.4583 15.7083 14.875 15.125C14.2917 14.5417 14 13.8333 14 13H8C8 13.8333 7.70833 14.5417 7.125 15.125C6.54167 15.7083 5.83333 16 5 16ZM5 14C5.28333 14 5.52083 13.9042 5.7125 13.7125C5.90417 13.5208 6 13.2833 6 13C6 12.7167 5.90417 12.4792 5.7125 12.2875C5.52083 12.0958 5.28333 12 5 12C4.71667 12 4.47917 12.0958 4.2875 12.2875C4.09583 12.4792 4 12.7167 4 13C4 13.2833 4.09583 13.5208 4.2875 13.7125C4.47917 13.9042 4.71667 14 5 14ZM2 11H2.8C3.08333 10.7 3.40833 10.4583 3.775 10.275C4.14167 10.0917 4.55 10 5 10C5.45 10 5.85833 10.0917 6.225 10.275C6.59167 10.4583 6.91667 10.7 7.2 11H14V2H2V11ZM17 14C17.2833 14 17.5208 13.9042 17.7125 13.7125C17.9042 13.5208 18 13.2833 18 13C18 12.7167 17.9042 12.4792 17.7125 12.2875C17.5208 12.0958 17.2833 12 17 12C16.7167 12 16.4792 12.0958 16.2875 12.2875C16.0958 12.4792 16 12.7167 16 13C16 13.2833 16.0958 13.5208 16.2875 13.7125C16.4792 13.9042 16.7167 14 17 14ZM16 9H20.25L18 6H16V9Z"
              fill="var(--primary-main)"
            />
          </svg>
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
                ? `${customerInfo.address.street || ""}، ${customerInfo.address.city || ""}، مصر`
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Products List */}
      <ProductsList
        order={order}
        normalizedStatus={normalizedStatus}
        ratedProducts={ratedProducts}
        setReview={setReview}
        showReviewBtn={true}
      />

      {/* Separate Store Subtotals Section */}
      {allStores.length > 0 && (
        <div className="od-subtotals-section">
          <div className="od-subtotals-header">
            <h3 className="od-subtotals-title">📊 تفاصيل المتاجر</h3>
            <span className="od-subtotals-total">
              الإجمالي الكلي: <strong>{formatCurrency(totalOrderPrice)}</strong>
            </span>
          </div>
          <div className="od-subtotals-list">
            {allStores.map((store, idx) => {
              const storeName = store.owner_store_id?.store_name || "—";
              const storeSubtotal = Number(store.store_subtotal) || 0;
              const productCount = store.products?.length || 0;
              const percentage =
                totalOrderPrice > 0
                  ? ((storeSubtotal / totalOrderPrice) * 100).toFixed(1)
                  : 0;

              return (
                <div key={idx} className="od-subtotal-item">
                  <div className="od-subtotal-item-info">
                    <span className="od-subtotal-item-name">{storeName}</span>
                    <span className="od-subtotal-item-count">
                      {productCount} منتج
                    </span>
                  </div>
                  <div className="od-subtotal-item-value-wrapper">
                    <span className="od-subtotal-item-value">
                      {formatCurrency(storeSubtotal)}
                    </span>
                    <span className="od-subtotal-item-percentage">
                      {percentage}%
                    </span>
                  </div>
                  <div className="od-subtotal-item-bar">
                    <div
                      className="od-subtotal-item-bar-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Store Order View ──────────────────────────────────────────────────────
function StoreOrderView({ order, normalizedStatus, isCancelled }) {
  const customer = order.customer || {};

  return (
    <div className="od-grid od-grid--store">
      <div className="od-card od-client-info-card">
        <div className="od-card-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
              fill="var(--primary-main)"
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
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V7C0 6.45 0.195833 5.97917 0.5875 5.5875C0.979167 5.19583 1.45 5 2 5H7V2C7 1.45 7.19583 0.979167 7.5875 0.5875C7.97917 0.195833 8.45 0 9 0H11C11.55 0 12.0208 0.195833 12.4125 0.5875C12.8042 0.979167 13 1.45 13 2V5H18C18.55 5 19.0208 5.19583 19.4125 5.5875C19.8042 5.97917 20 6.45 20 7V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H2Z"
              fill="var(--primary-main)"
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
            <span className="od-info-val">
              {order.store_products?.length || 0} منتج
            </span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">الإجمالي:</span>
            <span className="od-info-val od-grand-highlight">
              {formatCurrency(order.store_subtotal)}
            </span>
          </div>
        </div>
      </div>

      <ProductsList order={order} isStoreOwner={true} />
    </div>
  );
}

// ─── Admin Order View ──────────────────────────────────────────────────────
function AdminOrderView({ order, normalizedStatus, isCancelled }) {
  const customer = order.user_id || {};

  return (
    <div className="od-grid od-grid--store">
      <div className="od-card od-client-info-card">
        <div className="od-card-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
              fill="var(--primary-main)"
            />
          </svg>
          <h2 className="od-section-title">معلومات العميل</h2>
        </div>
        <div className="od-client-name">
          {customer.firstName
            ? `${customer.firstName} ${customer.lastName || ""}`.trim()
            : customer.username || "—"}
        </div>
        <div className="od-info-list">
          <div className="od-info-row od-icon-row">
            <span className="od-icon-label">📞</span>
            <span className="od-info-val">{customer.phoneNumber || "—"}</span>
          </div>
          <div className="od-info-row od-icon-row">
            <span className="od-icon-label">📍</span>
            <span className="od-info-val">
              {customer.address
                ? `${customer.address.street || ""}، ${customer.address.city || ""}، مصر`
                : "—"}
            </span>
          </div>
          <div className="od-info-row od-icon-row">
            <span className="od-icon-label">✉️</span>
            <span className="od-info-val">{customer.email || "—"}</span>
          </div>
        </div>
      </div>

      <div className="od-card od-order-info-card">
        <div className="od-card-header">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V7C0 6.45 0.195833 5.97917 0.5875 5.5875C0.979167 5.19583 1.45 5 2 5H7V2C7 1.45 7.19583 0.979167 7.5875 0.5875C7.97917 0.195833 8.45 0 9 0H11C11.55 0 12.0208 0.195833 12.4125 0.5875C12.8042 0.979167 13 1.45 13 2V5H18C18.55 5 19.0208 5.19583 19.4125 5.5875C19.8042 5.97917 20 6.45 20 7V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H2Z"
              fill="var(--primary-main)"
            />
          </svg>
          <h2 className="od-section-title">معلومات الطلب</h2>
        </div>
        <div className="od-info-list">
          <div className="od-info-row">
            <span className="od-info-label">رقم الطلب:</span>
            <span className="od-info-val od-mono">
              #{order._id?.slice(-6).toUpperCase()}
            </span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">التاريخ:</span>
            <span className="od-info-val">{formatDate(order.createdAt)}</span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">المنتجات:</span>
            <span className="od-info-val">
              {order.products?.reduce(
                (acc, s) => acc + (s.products?.length || 0),
                0,
              )}{" "}
              منتج
            </span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">الإجمالي:</span>
            <span className="od-info-val od-grand-highlight">
              {formatCurrency(order.total_price)}
            </span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">طريقة الدفع:</span>
            <span className="od-info-val">
              {PAYMENT_METHOD_MAP[order.payment?.method] || "—"}
            </span>
          </div>
          <div className="od-info-row">
            <span className="od-info-label">حالة الدفع:</span>
            <span className="od-info-val">{order.payment?.status || "—"}</span>
          </div>
        </div>
      </div>

      <ProductsList order={order} isAdmin={true} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrderDetailsList() {
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
  const Adminmode = role === "admin";

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await getOrderDetails(orderId);
      const resData = await res.json();
      setOrder(resData.data);
    } catch (err) {
      setError("تعذّر تحميل تفاصيل الطلب");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="od-loading">
        <div className="od-spinner" />
        <p>جاري تحميل الطلب...</p>
      </div>
    );
  }

  if (error) return <div className="od-error">{error}</div>;
  if (!order) return <div className="od-error">لم يتم العثور على الطلب</div>;

  const rawStatus = order.status || order.order_status;
  const normalizedStatus = normalizeStatus(rawStatus);
  const isCancelled = normalizedStatus === "cancelled";
  const statusConfig =
    STATUS_CONFIG[rawStatus] || STATUS_CONFIG["قيد الانتظار"];
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
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z"
            fill="var(--text-secondary)"
          />
        </svg>
        <span className="text">رجوع للطلبات</span>
      </div>

      <header className="od-header">
        <div className="od-header-info">
          <div className="od-title-row">
            <h1 className="od-order-number">
              رقم الطلب #{displayId?.slice(-6).toUpperCase()}
            </h1>
            <span className={`od-badge ${statusConfig.cls}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </div>
          <p className="od-date">تاريخ الطلب: {formatDate(displayDate)}</p>
        </div>
        {(clientMode || storeMode) && (
          <button className="od-print-btn" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 01-2 2h-2M6 14h12v8H6z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            تحميل الفاتورة
          </button>
        )}
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

      {Adminmode && (
        <AdminOrderView
          order={order}
          normalizedStatus={normalizedStatus}
          isCancelled={isCancelled}
        />
      )}

      {review && clientMode && (
        <ReviewModal
          product={review.prod}
          orderId={order._id}
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
