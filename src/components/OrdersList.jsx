import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, X } from "lucide-react";
import "./OrdersList.css";
import { getUserRole } from "../services/users";
import { api, isUserLogged } from "../services/authService";

const STATUS_CONFIG = {
  "قيد الانتظار": {
    label: "قيد الانتظار",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    lightBg: "rgba(245, 158, 11, 0.06)",
    cls: "ol-status--pending",
    icon: "⏳",
    aliases: ["قيد الانتظار", "pending"],
  },
  "جاري التجهيز": {
    label: "جاري التجهيز",
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.12)",
    lightBg: "rgba(168, 85, 247, 0.06)",
    cls: "ol-status--preparing",
    icon: "⚙️",
    aliases: ["جاري التجهيز", "preparing"],
  },
  "جاهز للتوصيل": {
    label: "جاهز للتوصيل",
    color: "#e610c6",
    bg: "rgba(230, 16, 198, 0.12)",
    lightBg: "rgba(230, 16, 198, 0.06)",
    cls: "ol-status--ready",
    icon: "📦",
    aliases: ["جاهز للتوصيل", "ready"],
  },
  "قيد التوصيل": {
    label: "قيد التوصيل",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    lightBg: "rgba(59, 130, 246, 0.06)",
    cls: "ol-status--shipping",
    icon: "🚚",
    aliases: ["قيد التوصيل", "shipping"],
  },
  "تم التوصيل": {
    label: "تم التوصيل",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.12)",
    lightBg: "rgba(34, 197, 94, 0.06)",
    cls: "ol-status--delivered",
    icon: "✅",
    aliases: ["تم التوصيل", "delivered"],
  },
  ملغي: {
    label: "ملغي",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    lightBg: "rgba(239, 68, 68, 0.06)",
    cls: "ol-status--cancelled",
    icon: "❌",
    aliases: ["ملغي", "ملغى", "cancelled"],
  },
};

const normalizeStatus = (raw) => {
  if (!raw) return "قيد الانتظار";

  const value = String(raw).trim();

  for (const [key, config] of Object.entries(STATUS_CONFIG)) {
    if (config.aliases.includes(value)) {
      return key;
    }
  }

  // If raw status is already in Arabic and matches a key
  if (STATUS_CONFIG[value]) {
    return value;
  }

  console.log("UNKNOWN STATUS:", raw);
  return "قيد الانتظار";
};

const STORE_STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(
  ([value, config]) => ({
    value,
    label: config.label,
    color: config.color,
  }),
);

function StatusDropdown({ currentKey, orderId, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const current =
    STORE_STATUS_OPTIONS.find((o) => o.value === currentKey) ||
    STORE_STATUS_OPTIONS[0];

  const lockedStatuses = ["قيد التوصيل", "تم التوصيل", "ملغي"];
  const isLocked = lockedStatuses.includes(currentKey);

  async function changeStatus(newStatus) {
    setOpen(false);

    if (newStatus === currentKey) return;

    setUpdating(true);

    try {
      const statusMap = {
        "قيد الانتظار": "قيد الانتظار",
        "جاري التجهيز": "جاري التجهيز",
        "جاهز للتوصيل": "جاهز للتوصيل",
      };

      await api.patch(
        `/order/${orderId}/status`,
        {},
        {
          params: {
            status: statusMap[newStatus] || newStatus,
          },
        },
      );

      onStatusChange?.(orderId, newStatus);
    } catch (err) {
      alert(err.response?.data?.message || "فشل تغيير الحالة");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="sd-wrap" ref={ref}>
      {isLocked ? (
        <div
          className="sd-trigger sd-trigger--locked"
          style={{ borderColor: current.color, color: current.color }}
        >
          <span className="sd-dot" style={{ background: current.color }} />
          {current.label}
        </div>
      ) : (
        <button
          className={`sd-trigger${updating ? " sd-trigger--loading" : ""}`}
          style={{ borderColor: current.color, color: current.color }}
          onClick={() => !updating && setOpen((o) => !o)}
        >
          <span className="sd-dot" style={{ background: current.color }} />
          {updating ? "جاري..." : current.label}
          <svg
            className={`sd-arrow${open ? " sd-arrow--open" : ""}`}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {open && (
        <div className="sd-menu">
          <p className="sd-menu-title">تغيير الحالة</p>
          {STORE_STATUS_OPTIONS.filter(
            (opt) =>
              opt.value !== "قيد التوصيل" &&
              opt.value !== "تم التوصيل" &&
              opt.value !== "ملغي",
          ).map((opt) => (
            <button
              key={opt.value}
              className={`sd-option${opt.value === currentKey ? " sd-option--active" : ""}`}
              onClick={() => changeStatus(opt.value)}
            >
              <span className="sd-dot" style={{ background: opt.color }} />
              <span style={{ color: opt.color }}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const PAYMENT_STATUS_CONFIG = {
  "قيد الانتظار": {
    label: "قيد الانتظار",
    cls: "ol-payment--pending",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.10)",
    icon: "⏳",
  },
  "قيد المعالجة": {
    label: "قيد المعالجة",
    cls: "ol-payment--processing",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.10)",
    icon: "🔄",
  },
  مكتمل: {
    label: "مكتمل",
    cls: "ol-payment--completed",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.10)",
    icon: "✅",
  },
  فشل: {
    label: "فشل",
    cls: "ol-payment--failed",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.10)",
    icon: "❌",
  },
  "تم الاسترداد": {
    label: "تم الاسترداد",
    cls: "ol-payment--refunded",
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.10)",
    icon: "↩️",
  },
};

const normalizePaymentStatus = (payment, orderStatus) => {
  const method = payment?.method;
  const rawStatus = payment?.status;

  if (!rawStatus) return "قيد الانتظار";

  const value = String(rawStatus).trim();

  const directMap = {
    "قيد الانتظار": "قيد الانتظار",
    "تم الاسترداد": "تم الاسترداد",
    فشل: "فشل",
    مكتمل: "مكتمل",
    "قيد المعالجة": "قيد المعالجة",
  };

  // If the status is already one of the backend values, return it as-is
  if (directMap[value]) {
    return value;
  }

  // CASH LOGIC - but keep the same status keys
  if (method === "cash") {
    if (orderStatus === "ملغي") return "تم الاسترداد";
    if (orderStatus === "تم التوصيل") return "مكتمل";
    return "قيد الانتظار";
  }

  // CARD / WALLET - fallback to pending
  return "قيد الانتظار";
};

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return d.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countProducts(order) {
  if (order.products) {
    return order.products.reduce(
      (acc, s) => acc + (s.products?.length || 0),
      0,
    );
  }
  if (order.store_products) {
    return order.store_products.length;
  }
  return 0;
}

export default function OrdersList({
  orders: ordersProp = [],
  hasActiveFilters = false,
  onClearFilters,
  onCancelSuccess,
  onStatusChange,
  headerTitle = "الطلبات",
  loading = true,
}) {
  const navigate = useNavigate();
  const role = getUserRole();
  const storeMode = role === "store_owner";
  const clientMode = role === "client";
  const isAdmin = role === "admin";

  const filtered = ordersProp.filter((o) => o); // Remove null/undefined

  async function cancelOrder(orderId) {
    if (!window.confirm("هل أنتِ متأكدة من إلغاء الطلب؟")) return;
    try {
      await api.patch(`/order/${orderId}/cancel`);
      onCancelSuccess?.(orderId);
    } catch (err) {
      alert(err.response?.data?.message || "فشل إلغاء الطلب");
    }
  }

  async function reorder(order) {
    if (!window.confirm("هل أنتِ متأكدة من إعادة الطلب؟")) return;
    try {
      await api.post(`/order/${order._id}/reorder`);
      navigate("/shipping/info", {
        state: {
          orderId: order._id,
          subtotal: order.subtotal_price,
          shipping: 50,
          total: order.total_price,
        },
      });
    } catch (error) {
      const message = error.response?.data?.message;
      if (error.response?.status === 404 && message) {
        alert(`❌ ${message}`);
      } else {
        alert("فشل إعادة الطلب");
      }
    }
  }

  const formattedImage = (imgPath) => {
    if (!imgPath) return null;
    if (imgPath.includes("uploads")) {
      const apiUrl =
        process.env.REACT_APP_API_URL || "https://glamqena-backend.vercel.app";
      return imgPath.replace(/\\/g, "//").replace("uploads", apiUrl);
    }
    return imgPath;
  };

  if (!isUserLogged()) {
    return (
      <div className="response-message error-message">
        انتهت جلستك، يرجى تسجيل الدخول مرة أخرى
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ol-empty ol-empty--compact">
        <span className="ol-empty-icon">⏳</span>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (!ordersProp || ordersProp.length === 0) {
    const emptyState = hasActiveFilters
      ? {
          icon: "🔍",
          title: "لا توجد نتائج مطابقة",
          message:
            "لم نجد أي طلبات تطابق الفلاتر الحالية. جرّب تعديل البحث أو إعادة ضبط الفلاتر.",
          cta: onClearFilters
            ? {
                label: "مسح الفلاتر",
                icon: <X size={18} />,
                onClick: onClearFilters,
              }
            : null,
        }
      : clientMode
        ? {
            icon: "🛍️",
            title: "لا يوجد طلبات بعد",
            message:
              "لم تقم بأي طلب حتى الآن. ابدأ التسوق واكتشف منتجاتنا",
            cta: {
              label: "تصفح المنتجات",
              icon: <ArrowLeft size={18} />,
              onClick: () => navigate("/stores"),
            },
          }
        : storeMode
          ? {
              icon: "📦",
              title: "لا يوجد طلبات بعد",
              message:
                "ستظهر الطلبات هنا بمجرد أن يبدأ العملاء بالشراء من متجرك. تأكد من أن منتجاتك نشطة ومتاحة للعرض.",
              cta: {
                label: "إدارة المنتجات",
                icon: <ArrowLeft size={18} />,
                onClick: () =>
                  navigate("/dashboard/store_owner/products"),
              },
            }
          : {
              icon: "📭",
              title: "لا يوجد طلبات بعد",
              message: "لا توجد طلبات لعرضها حالياً",
              cta: null,
            };

    return (
      <div className="ol-empty">
        {emptyState.icon && (
          <span className="ol-empty-icon">{emptyState.icon}</span>
        )}
        <h2>{emptyState.title}</h2>
        <p>{emptyState.message}</p>
        {emptyState.cta && (
          <button className="ol-empty-btn" onClick={emptyState.cta.onClick}>
            {emptyState.cta.icon}
            <span>{emptyState.cta.label}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="ol-root" dir="rtl">
      {filtered.length === 0 ? (
        <div className="ol-empty">
          <span className="ol-empty-icon">📭</span>
          <p>لا يوجد طلبات في هذه الفئة</p>
        </div>
      ) : (
        <>
          {(clientMode || storeMode) && (
            <div className="ol-list">
              {filtered.map((order) => {
                const id = order._id || order.order_id;
                const rawStatus = order.status || order.order_status;
                const key = normalizeStatus(rawStatus);
                const cfg = STATUS_CONFIG[key] || STATUS_CONFIG["قيد الانتظار"];
                const isPendingOrPreparing =
                  key === "قيد الانتظار" || key === "جاري التجهيز";
                const isCancelled = key === "ملغي";
                const prodCount = countProducts(order);
                const total = order.total_price || order.store_subtotal || 0;
                const paymentMethod = order.payment?.method;
                const paymentStatusKey = storeMode
                  ? normalizePaymentStatus(
                      {
                        status: order.payment?.status,
                        method: order.payment?.method,
                      },
                      key,
                    )
                  : normalizePaymentStatus(order.payment, key);
                const paymentCfg =
                  PAYMENT_STATUS_CONFIG[paymentStatusKey] ||
                  PAYMENT_STATUS_CONFIG["قيد الانتظار"];

                const canCompletePayment =
                  clientMode &&
                  ["wallet", "card"].includes(paymentMethod) &&
                  ["pending", "processing", "failed"].includes(
                    paymentStatusKey,
                  ) &&
                  !isCancelled;

                const isCompletedPayment =
                  paymentStatusKey === "completed" ||
                  (paymentMethod === "cash" && key === "تم التوصيل");

                return (
                  <div className="ol-card" key={id}>
                    {/* Card Header */}
                    <div className="ol-card-header">
                      <div className="ol-card-header-left">
                        {/* Status Badge */}
                        {storeMode ? (
                          <StatusDropdown
                            currentKey={key}
                            orderId={id}
                            onStatusChange={onStatusChange}
                          />
                        ) : (
                          <span className={`ol-status ${cfg.cls}`}>
                            <span className="ol-dot" />
                            {cfg.label}
                          </span>
                        )}

                        {/* Payment Status */}
                        <span className={`ol-payment-badge ${paymentCfg.cls}`}>
                          <svg
                            className="bedge-svg"
                            width="22"
                            height="16"
                            viewBox="0 0 22 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13 9C12.1667 9 11.4583 8.70833 10.875 8.125C10.2917 7.54167 10 6.83333 10 6C10 5.16667 10.2917 4.45833 10.875 3.875C11.4583 3.29167 12.1667 3 13 3C13.8333 3 14.5417 3.29167 15.125 3.875C15.7083 4.45833 16 5.16667 16 6C16 6.83333 15.7083 7.54167 15.125 8.125C14.5417 8.70833 13.8333 9 13 9ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10H18C18 9.45 18.1958 8.97917 18.5875 8.5875C18.9792 8.19583 19.45 8 20 8V4C19.45 4 18.9792 3.80417 18.5875 3.4125C18.1958 3.02083 18 2.55 18 2H8C8 2.55 7.80417 3.02083 7.4125 3.4125C7.02083 3.80417 6.55 4 6 4V8C6.55 8 7.02083 8.19583 7.4125 8.5875C7.80417 8.97917 8 9.45 8 10ZM19 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16ZM6 10V2V10Z"
                              fill="currentColor"
                            />
                          </svg>
                          {paymentCfg.label}
                        </span>
                      </div>

                      {/* Order Meta */}
                      <div className="ol-order-meta">
                        <span className="ol-order-id">
                          #{storeMode ? "GE" : "GQ"}-
                          {id?.slice(-4).toUpperCase()}
                        </span>
                        <span className="ol-order-date">
                          {formatDate(
                            order.createdAt ||
                              order.order_date ||
                              order.order_created_at,
                          )}
                          {" • "}
                          {formatTime(
                            order.createdAt ||
                              order.order_date ||
                              order.order_created_at,
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="ol-card-body">
                      {/* CLIENT: Show products */}
                      {clientMode && (
                        <div className="ol-items">
                          {order.products
                            ?.flatMap(
                              (store) =>
                                store.products?.map((item) => ({
                                  ...item,
                                  storeName: store.owner_store_id?.store_name,
                                  storeId: store.owner_store_id?._id,
                                })) || [],
                            )
                            .slice(0, 4)
                            .map((item, j) => {
                              const src = formattedImage(
                                item.prod_id?.images?.[0],
                              );
                              const productId = item.prod_id?._id;
                              return (
                                <div
                                  className="ol-item"
                                  key={j}
                                  onClick={() =>
                                    navigate(`/products/${productId}`)
                                  }
                                >
                                  <div className="ol-item-img">
                                    {src ? (
                                      <img
                                        src={src}
                                        alt={item.name}
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                          e.target.parentElement.innerHTML =
                                            "<span class='ol-img-fb'>🧴</span>";
                                        }}
                                      />
                                    ) : (
                                      <span className="ol-img-fb">🧴</span>
                                    )}
                                  </div>
                                  <div className="ol-item-info">
                                    <p className="ol-item-name">{item.name}</p>
                                    <p className="ol-item-store">
                                      من: {item.storeName}
                                    </p>
                                    <p className="ol-item-qty">
                                      الكمية: {item.quantity}
                                    </p>
                                  </div>
                                  <span className="ol-item-price">
                                    {item.price.toLocaleString("ar-EG")} ج.م
                                  </span>
                                </div>
                              );
                            })}
                          {order.products?.flatMap((s) => s.products || [])
                            .length > 4 && (
                            <div className="ol-more-items">
                              +{" "}
                              {order.products.flatMap((s) => s.products || [])
                                .length - 4}{" "}
                              منتجات أخرى
                            </div>
                          )}
                        </div>
                      )}

                      {/* STORE: Customer info */}
                      {storeMode && (
                        <div className="ol-customer">
                          {order.customer?.name?.trim() && (
                            <div className="ol-customer-row">
                              <span className="ol-customer-label">العميل:</span>
                              <span className="ol-customer-val">
                                {order.customer.name}
                              </span>
                            </div>
                          )}
                          {order.customer?.phone?.trim() && (
                            <div className="ol-customer-row">
                              <span className="ol-customer-label">الهاتف:</span>
                              <span className="ol-customer-val ol-mono">
                                {order.customer.phone}
                              </span>
                            </div>
                          )}
                          {order.customer?.address?.trim() && (
                            <div className="ol-customer-row">
                              <span className="ol-customer-label">
                                العنوان:
                              </span>
                              <span className="ol-customer-val">
                                {order.customer.address}
                              </span>
                            </div>
                          )}
                          {order.store_products && (
                            <div className="ol-customer-row">
                              <span className="ol-customer-label">
                                المنتجات:
                              </span>
                              <span className="ol-customer-val">
                                {order.store_products.length} منتج
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="ol-card-footer">
                      <div className="ol-foot-btns">
                        {clientMode && (
                          <>
                            <Link
                              to={`/orders/${id}`}
                              className="ol-btn ol-btn--details"
                            >
                              التفاصيل
                            </Link>

                            {isCancelled && (
                              <button
                                className="ol-btn ol-btn--reorder"
                                onClick={() => reorder(order)}
                              >
                                إعادة طلب
                              </button>
                            )}

                            {canCompletePayment && (
                              <button
                                className="ol-btn ol-btn--reorder"
                                onClick={() => {
                                  navigate("/shipping/info", {
                                    state: {
                                      orderId: order._id,
                                      subtotal: order.subtotal_price,
                                      shipping: 50,
                                      total: order.total_price,
                                    },
                                  });
                                }}
                              >
                                إكمال الدفع
                              </button>
                            )}

                            {isPendingOrPreparing && !isCancelled && (
                              <button
                                className="ol-btn ol-btn--cancel"
                                onClick={() => cancelOrder(id)}
                              >
                                إلغاء الطلب
                              </button>
                            )}
                          </>
                        )}

                        {storeMode && (
                          <Link
                            to={`/dashboard/store_owner/orders/${id}`}
                            className="ol-btn ol-btn--details"
                          >
                            تفاصيل الطلب
                          </Link>
                        )}
                      </div>

                      <div className="ol-total-block">
                        {prodCount > 0 && (
                          <span className="ol-prod-count">
                            {prodCount} منتج
                          </span>
                        )}
                        <div className="ol-total-row">
                          <span className="ol-total-label">الإجمالي</span>
                          <span className="ol-total-val">
                            {total.toLocaleString("ar-EG")} ج.م
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Admin Table View */}
          {isAdmin && (
            <div className="ol-table-wrap">
              <table className="ol-table">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>المتجر</th>
                    <th>عدد المنتجات</th>
                    <th>المبلغ</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                    <th>الدفع</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => {
                    const id = order._id || order.order_id;
                    const rawStatus = order.status || order.order_status;
                    const key = normalizeStatus(rawStatus);
                    const cfg =
                      STATUS_CONFIG[key] || STATUS_CONFIG["قيد الانتظار"];
                    const total =
                      order.total_price || order.store_subtotal || 0;
                    const prodCount = countProducts(order);
                    const paymentStatusKey = normalizePaymentStatus(
                      order.payment,
                      key,
                    );
                    const paymentCfg =
                      PAYMENT_STATUS_CONFIG[paymentStatusKey] ||
                      PAYMENT_STATUS_CONFIG.pending;
                    const paymentMethod = order.payment?.method || "—";
                    const methodLabel =
                      paymentMethod === "cash"
                        ? "نقدي"
                        : paymentMethod === "card"
                          ? "بطاقة"
                          : paymentMethod === "wallet"
                            ? "محفظة"
                            : paymentMethod;

                    return (
                      <tr key={id} className="ol-table-row">
                        <td className="ol-table-id">
                          #GQ-{id?.slice(-4).toUpperCase()}
                        </td>
                        <td>
                          {order.user_id?.firstName
                            ? `${order.user_id.firstName} ${order.user_id.lastName || ""}`.trim()
                            : order.user_id?.username ||
                              order.customer?.name ||
                              "—"}
                        </td>
                        <td>
                          {order.products?.[0]?.owner_store_id?.store_name ||
                            "—"}
                        </td>
                        <td>{prodCount}</td>
                        <td className="ol-table-amount">
                          {total.toLocaleString("ar-EG")} ج
                        </td>
                        <td>
                          {formatDate(
                            order.createdAt || order.order_created_at,
                          )}
                        </td>
                        <td>
                          <span className={`ol-status ${cfg.cls}`}>
                            <span className="ol-dot" />
                            {cfg.label}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`ol-payment-badge ${paymentCfg.cls}`}
                          >
                            {paymentCfg.label}
                          </span>
                          <br />
                          <small
                            style={{
                              fontSize: "10px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {methodLabel}
                          </small>
                        </td>
                        <td>
                          <Link
                            to={`/dashboard/admin/orders/${id}`}
                            className="ol-btn ol-btn--details"
                          >
                            تفاصيل
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
