import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./OrdersList.css";
import { getUserRole } from "../services/users";
import { api, isUserLogged } from "../services/authService";

const BASE_URL = "http://localhost:8080";

const STORE_STATUS_OPTIONS = [
  { value: "pending", label: "قيد الانتظار", color: "#D4AF37" },
  { value: "preparing", label: "قيد التجهيز", color: "#A855F7" },
  { value: "ready", label: "جاهز للتوصيل", color: "#22c55e" },
  { value: "shipping", label: "قيد التوصيل", color: "#3B82F6" },
  { value: "delivered", label: "تم التسليم", color: "#16a34a" },
  { value: "cancelled", label: "ملغي", color: "#ef4444" },
];

function StatusDropdown({ currentKey, orderId, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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
      await axios.patch(
        `${BASE_URL}/order/${orderId}/status`,
        {},
        {
          params: {
            status: {
              pending: "قيد الانتظار",
              preparing: "جاري التجهيز",
              ready: "جاهز للتوصيل",
            }[newStatus],
          },

          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
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
              className={`sd-option${
                opt.value === currentKey ? " sd-option--active" : ""
              }`}
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
const normalizeStatus = (raw) => {
  if (!raw) return "pending";

  const value = String(raw).trim();

  switch (value) {
    case "قيد الانتظار":
      return "pending";

    case "جاري التجهيز":
    case "قيد التجهيز":
      return "preparing";

    case "قيد التوصيل":
      return "shipping";

    case "جاهز للتوصيل":
      return "ready";

    case "تم التوصيل":
    case "تم التسليم":
      return "delivered";

    case "ملغي":
      return "cancelled";

    // english fallback
    case "pending":
    case "preparing":
    case "shipping":
    case "ready":
    case "delivered":
    case "cancelled":
      return value;

    default:
      console.log("UNKNOWN STATUS:", raw);
      return "pending";
  }
};
const STATUS_CONFIG = {
  pending: {
    client: "قيد الانتظار",
    store: "قيد الانتظار",
    cls: "ol-status--pending",
  },
  preparing: {
    client: "قيد التجهيز",
    store: "قيد التجهيز",
    cls: "ol-status--preparing",
  },
  ready: { store: "جاهز للتوصيل", cls: "ol-status--ready" },
  shipping: {
    client: "قيد التوصيل",
    store: "قيد التوصيل",
    cls: "ol-status--shipping",
  },
  delivered: {
    client: "تم التسليم",
    store: "تم التسليم",
    cls: "ol-status--delivered",
  },
  cancelled: { client: "ملغي", store: "ملغي", cls: "ol-status--cancelled" },
};

const CLIENT_FILTERS = [
  { label: "الكل", value: "all" },
  { label: "قيد الانتظار", value: "pending" },
  { label: "قيد التجهيز", value: "preparing" },
  { label: "قيد التوصيل", value: "shipping" },
  { label: "تم التسليم", value: "delivered" },
  { label: "ملغى", value: "cancelled" },
];

const STORE_FILTERS = [
  { label: "الكل", value: "all" },
  { label: "قيد الانتظار", value: "pending" },
  { label: "قيد التجهيز", value: "preparing" },
  { label: "جاهز للتوصيل", value: "ready" },
  { label: "قيد التوصيل", value: "shipping" },
  { label: "تم التسليم", value: "delivered" },
  { label: "ملغى", value: "cancelled" },
];

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
  // CLIENT RESPONSE
  if (order.products) {
    return order.products.reduce(
      (acc, s) => acc + (s.products?.length || 0),
      0,
    );
  }

  // STORE OWNER RESPONSE
  if (order.store_products) {
    return order.store_products.length;
  }

  return 0;
}

export default function OrdersList({
  orders: ordersProp = [],
  onCancelSuccess,
  headerTitle = "الطلبات",
}) {
  const [filter, setFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState(null);
  const [orders, setOrders] = useState(ordersProp);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const role = getUserRole();

  const storeMode = role === "store_owner";
  const clientMode = role === "client";
  
  // Sync if parent passes new orders
  useEffect(() => {
    setOrders(ordersProp);
  }, [ordersProp]);
  const FILTERS = storeMode ? STORE_FILTERS : CLIENT_FILTERS;
const filtered = orders
  .filter((o) => {
    const statusMatch =
      filter === "all" ||
      normalizeStatus(o.status) === filter;
    const searchValue = search.toLowerCase();

    const searchMatch =
      search === "" ||
      String(o._id || "")
        .toLowerCase()
        .includes(searchValue) || //check if order._id includesthe search value which will be by the last _id four digits marked with GE or GQ
      (storeMode &&
        o.customer?.name?.toLowerCase().includes(searchValue)) ||
      (storeMode &&
        o.store_products?.some((item) =>
          item.product_name?.toLowerCase().includes(searchValue),
        )) ||
      (clientMode &&
        o.products?.some((store) =>
          store.products?.some((item) =>
            item.name?.toLowerCase().includes(searchValue),
          ),
        ));

    return statusMatch && searchMatch;
  })

  
  .sort((a, b) => {
    const dateA = new Date(a.createdAt || a.order_date || a.order_created_at || 0);
    const dateB = new Date(b.createdAt || b.order_date || b.order_created_at || 0);
    return dateB - dateA;
  });
  async function cancelOrder(orderId) {
    if (!window.confirm("هل أنتِ متأكدة من إلغاء الطلب؟")) return;
    setCancellingId(orderId);
    try {
      await api.patch(
        `${BASE_URL}/order/${orderId}/cancel`,
        {},
      );
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
    await api.post(
      `${BASE_URL}/order/${order._id}/reorder`,
      {},
    );
    // onCancelSuccess?.(); // ✅ re-fetch orders like cancel does
    navigate("/shipping/info", {state: {orderId: order._id, subtotal: order.subtotal_price, shipping: 50, total: order.total_price}});
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
  if(!imgPath) return null;
  return imgPath.replace(/\\/g, "//").replace("uploads", "http://127.0.0.1:8080");
}

  if(!isUserLogged())
    return (
  <div className="response-message error-message">your session ended, please login</div>
  );

  if (!orders.length) {
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
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`ol-filter-btn${
              filter === f.value ? " ol-filter-btn--active" : ""
            }`}
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
            const isPending = key === "pending" || key === "preparing";
            const isCancelled = key === "cancelled";
            const prodCount = countProducts(order);
            const total = order.total_price || order.store_subtotal || 0;

            return (
              <div className="ol-card" key={id}>
                {/* Card Header */}
                <div className="ol-card-header">
                  {/* Status — store gets dropdown, client gets static badge */}
                  {storeMode ? (
                    <StatusDropdown
                      currentKey={key}
                      orderId={id}
                      onStatusChange={(oid, newStatus) => {
                        setOrders((prev) =>
                          prev.map((o) =>
                            (o._id || o.order_id) === oid
                              ? {
                                  ...o,
                                  status: newStatus,
                                  order_status: newStatus,
                                }
                              : o,
                          ),
                        );
                      }}
                    />
                  ) : (
                    <span className={`ol-status ${cfg.cls}`}>
                      <span className="ol-dot" />
                      {cfg[storeMode ? "store" : "client"] || rawStatus}
                    </span>
                  )}
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
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="ol-card-body">
                  {/* CLIENT: products */}
                  {clientMode && (
                    <div className="ol-items">
                      {order.products?.map((store, i) =>
                        store.products?.slice(0, 3).map((item, j) => {
                          const img = item.prod_id?.images?.[0];
                          const src = formattedImage(img);
                          return (
                            <div className="ol-item" key={`${i}-${j}`}>
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
                                  من: {store.owner_store_id?.store_name}
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
                        }),
                      )}
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
                        {isPending && (
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
                        to={`/dashboard/orders/${id}`}
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
