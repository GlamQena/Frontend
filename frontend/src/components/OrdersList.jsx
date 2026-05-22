import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./OrdersList.css";
import { getUserRole } from "../services/users";
import { api, isUserLogged } from "../services/authService";
const STATUS_CONFIG = {
  pending: {
    label: "قيد الانتظار",
    color: "#D4AF37",
    cls: "ol-status--pending",
    aliases: ["قيد الانتظار", "pending"],
  },
  preparing: {
    label: "جاري التجهيز",
    color: "#A855F7",
    cls: "ol-status--preparing",
    aliases: ["جاري التجهيز", "preparing"],
  },
  ready: {
    label: "جاهز للتوصيل",
    color: "#e610c6",
    cls: "ol-status--ready",
    aliases: ["جاهز للتوصيل", "ready"],
  },
  shipping: {
    label: "قيد التوصيل",
    color: "#3B82F6",
    cls: "ol-status--shipping",
    aliases: ["قيد التوصيل", "shipping"],
  },
  delivered: {
    label: "تم التوصيل",
    color: "#16a34a",
    cls: "ol-status--delivered",
    aliases: ["تم التوصيل", "delivered"],
  },
  cancelled: {
    label: "ملغى",
    color: "#ef4444",
    cls: "ol-status--cancelled",
    aliases: ["ملغي", "ملغى", "cancelled"],
  },
};
const normalizeStatus = (raw) => {
  if (!raw) return "pending";

  const value = String(raw).trim();

  for (const [key, config] of Object.entries(STATUS_CONFIG)) {
    if (config.aliases.includes(value)) {
      return key;
    }
  }

  console.log("UNKNOWN STATUS:", raw);

  return "pending";
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

  const lockedStatuses = ["shipping", "delivered", "cancelled"];
  const isLocked = lockedStatuses.includes(currentKey);

  async function changeStatus(newStatus) {
    setOpen(false);

    if (newStatus === currentKey) return;

    setUpdating(true);

    try {
      await api.patch(
        `/order/${orderId}/status`,
        {},
        {
          params: {
            status: {
              pending: "قيد الانتظار",
              preparing: "جاري التجهيز",
              ready: "جاهز للتوصيل",
            }[newStatus],
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
              opt.value !== "shipping" &&
              opt.value !== "delivered" &&
              opt.value !== "cancelled",
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

const ALL_FILTERS = [
  { label: "الكل", value: "all" },

  ...Object.entries(STATUS_CONFIG).map(([value, config]) => ({
    label: config.label,
    value,
  })),
];

const PAYMENT_STATUS_CONFIG = {
  pending: {
    label: "مؤجل",
    cls: "ol-payment--pending",
  },

  processing: {
    label: "قيد المعالجة",
    cls: "ol-payment--processing",
  },

  completed: {
    label: "مكتمل",
    cls: "ol-payment--completed",
  },

  failed: {
    label: "فشل",
    cls: "ol-payment--failed",
  },

  refunded: {
    label: "مسترجع",
    cls: "ol-payment--refunded",
  },
};

const normalizePaymentStatus = (payment, orderStatus) => {
  const method = payment?.method;
  const rawStatus = payment?.status;

  const value = String(rawStatus || "").trim();

  // CASH LOGIC
  if (method === "cash") {
    // cancelled after payment
    if (orderStatus === "cancelled" && ["completed", "paid"].includes(value)) {
      return "refunded";
    }

    // delivered cash order = completed
    if (orderStatus === "delivered") {
      return "completed";
    }

    // any other cash order = pending
    return "pending";
  }

  // CARD / WALLET
  switch (value) {
    case "قيد المعالجة":
      return "processing";
    case "مكتمل":
      return "completed";
    case "فشل":
      return "failed";
    case "مسترجع":
      return "refunded";
    case "مؤجل":
    default:
      return "pending";
  }
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
  onCancelSuccess,
  onStatusChange,
  headerTitle = "الطلبات",
  loading = true,
}) {
  const [filter, setFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState(null);

  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const role = getUserRole();

  const storeMode = role === "store_owner";
  const clientMode = role === "client";

  const filtered = ordersProp
    .filter((o) => {
      const statusMatch =
        filter === "all" ||
        normalizeStatus(o.status || o.order_status) === filter;

      const searchValue = search.toLowerCase();

      const searchMatch =
        search === "" ||
        String(o._id || o.order_id || "")
          .toLowerCase()
          .includes(searchValue) ||
        (storeMode && o.customer?.name?.toLowerCase().includes(searchValue)) ||
        (storeMode &&
          o.store_products?.some((item) =>
            item.product_name?.toLowerCase().includes(searchValue),
          )) ||
        (clientMode &&
          o.products?.some((store) =>
            store.products?.some((item) =>
              item.name?.toLowerCase().includes(searchValue),
            ),
          )) ||
        (clientMode &&
          o.products?.some(
            (store) =>
              store.owner_store_id?.store_name
                ?.toLowerCase()
                .includes(searchValue) ||
              store.products?.some((item) =>
                item.name?.toLowerCase().includes(searchValue),
              ),
          ));

      return statusMatch && searchMatch;
    })
    .sort((a, b) => {
      const dateA = new Date(
        a.createdAt || a.order_date || a.order_created_at || 0,
      );
      const dateB = new Date(
        b.createdAt || b.order_date || b.order_created_at || 0,
      );
      return dateB - dateA;
    });

  async function cancelOrder(orderId) {
    if (!window.confirm("هل أنتِ متأكدة من إلغاء الطلب؟")) return;

    setCancellingId(orderId);

    try {
      await api.patch(`/order/${orderId}/cancel`);
      onCancelSuccess?.(orderId);
    } catch (err) {
      alert(err.response?.data?.message || "فشل إلغاء الطلب");
    } finally {
      setCancellingId(null);
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
    return imgPath.replace(/\\/g, "//").replace("uploads", api);
  };

  if (!isUserLogged())
    return (
      <div className="response-message error-message">
        your session ended, please login
      </div>
    );

  if (loading) {
    return (
      <div className="ol-empty">
        <span className="ol-empty-icon">⏳</span>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (!ordersProp.length) {
    return (
      <div className="ol-empty">
        <span className="ol-empty-icon">🛍️</span>
        <p>لا يوجد طلبات</p>
      </div>
    );
  }

  return (
    <div className="ol-root" dir="rtl">
      <div className="Page-Header">
        <h1>{headerTitle}</h1>
        <div className="so-search-wrap">
          <input
            className="so-search"
            type="text"
            placeholder="بحث عن طلب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="ol-filters">
        {ALL_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`ol-filter-btn${filter === f.value ? " ol-filter-btn--active" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="ol-list">
        {filtered.length === 0 ? (
          <div className="ol-empty">
            <span className="ol-empty-icon">📭</span>
            <p>لا يوجد طلبات في هذه الفئة</p>
          </div>
        ) : (
          filtered.map((order) => {
            const id = order._id || order.order_id;
            const rawStatus = order.status || order.order_status;
            const key = normalizeStatus(rawStatus);
            const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.pending;
            const isPendingOrPreparing =
              key === "pending" || key === "preparing";
            const isCancelled = key === "cancelled";
            const prodCount = countProducts(order);
            const total = order.total_price || order.store_subtotal || 0;
            const paymentMethod = order.payment?.method;

            const paymentStatusKey = normalizePaymentStatus(order.payment, key);
            const paymentCfg =
              PAYMENT_STATUS_CONFIG[paymentStatusKey] ||
              PAYMENT_STATUS_CONFIG.pending;

            const canCompletePayment =
              clientMode &&
              ["wallet", "card"].includes(paymentMethod) &&
              ["pending", "processing", "failed"].includes(paymentStatusKey) &&
              !isCancelled;

            return (
              <div className="ol-card" key={id}>
                {/* Card Header */}
                <div className="ol-card-header">
                  {/* Status — store gets dropdown, client gets static badge */}
                  {storeMode ? (
                    <StatusDropdown
                      currentKey={key}
                      orderId={id}
                      onStatusChange={onStatusChange}
                    />
                  ) : (
                    <span className={`ol-status ${cfg.cls}`}>
                      <span className="ol-dot" />
                      {cfg.label || rawStatus}
                    </span>
                  )}
                  <div>
                    {/* PAYMENT STATUS */}
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
                          d="M13 9C12.1667 9 11.4583 8.70833 10.875 8.125C10.2917 7.54167 10 6.83333 10 6C10 5.16667 10.2917 4.45833 10.875 3.875C11.4583 3.29167 12.1667 3 13 3C13.8333 3 14.5417 3.29167 15.125 3.875C15.7083 4.45833 16 5.16667 16 6C16 6.83333 15.7083 7.54167 15.125 8.125C14.5417 8.70833 13.8333 9 13 9ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 
0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10H18C18 9.45 18.1958 8.97917 18.5875 8.5875C18.9792 8.19583 19.45 8 20 8V4C19.45 4 18.9792 3.80417 18.5875 3.4125C18.1958 3.02083 18 2.55 18 2H8C8 2.55 7.80417 3.02083 7.4125 3.4125C7.02083 3.80417 6.55 4 6 4V8C6.55 8 7.02083 8.19583 7.4125 8.5875C7.80417 
8.97917 8 9.45 8 10ZM19 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16ZM6 10V2V10Z"
                          fill="#822a91"
                        />
                      </svg>

                      {paymentCfg.label}
                    </span>
                  </div>

                  <div className="ol-order-meta">
                    <span className="ol-order-id">
                      #{storeMode ? "GE" : "GQ"}-{id?.slice(-4).toUpperCase()}
                    </span>
                    <span className="ol-order-date">
                      {formatDate(
                        order.createdAt ||
                          order.order_date ||
                          order.order_created_at,
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="ol-card-body">
                  {/* CLIENT: products */}
                  {clientMode && (
                    <div className="ol-items">
                      {order.products
                        ?.flatMap(
                          (
                            store, // flatten all stores into one array
                          ) =>
                            store.products?.map((item) => ({
                              ...item,
                              storeName: store.owner_store_id?.store_name,
                            })) || [],
                        )
                        .slice(0, 3) // take only first 3 from ALL stores
                        .map((item, j) => {
                          const src = formattedImage(item.prod_id?.images?.[0]);
                          return (
                            <div className="ol-item" key={j}>
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
                                {item.price} ج.م
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* STORE: customer info */}
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
                          <span className="ol-customer-val ol-mono">
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.5 11.5 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.01l-2.2 2.21z"
                                fill="#A855F7"
                              />
                            </svg>
                            {order.customer.phone}
                          </span>
                        </div>
                      )}
                      {order.customer?.address?.trim() && (
                        <div className="ol-customer-row">
                          <span className="ol-customer-val">
                            <svg
                              width="11"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                                fill="#A855F7"
                              />
                            </svg>
                            {order.customer.address}
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
                        {isCancelled && (
                          <button
                            className="ol-btn ol-btn--reorder"
                            onClick={() => reorder(order)}
                          >
                            إعادة طلب
                          </button>
                        )}

                        <Link
                          to={`/orders/${id}`}
                          className="ol-btn ol-btn--details"
                        >
                          التفاصيل
                        </Link>

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

                        {isPendingOrPreparing && (
                          <button
                            className="ol-btn ol-btn--cancel"
                            onClick={() => cancelOrder(id)}
                            disabled={cancellingId === id}
                          >
                            {cancellingId === id
                              ? "جاري الإلغاء..."
                              : "إلغاء الطلب"}
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
                      <span className="ol-prod-count">{prodCount} منتج</span>
                    )}
                    <div className="ol-total-row">
                      <span className="ol-total-label">إجمالي الطلب</span>
                      <span className="ol-total-val">
                        {total.toLocaleString("ar-EG")} ج.م
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
