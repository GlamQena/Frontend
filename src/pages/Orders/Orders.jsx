import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import OrdersList from "../../components/OrdersList";
import "./Orders.css";
import "../../components/OrdersList.css";
import { getOrdersHistory } from "../../services/order";
import { responseMessageSetter } from "../../services/authService";
import { Search, X, ArrowUpDown, CreditCard, Package } from "lucide-react";
import Pagination from "../../components/Pagination";

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "price_high", label: "الأعلى سعراً" },
  { value: "price_low", label: "الأقل سعراً" },
];

const ORDER_STATUS_ORDER = [
  "قيد الانتظار",
  "جاري التجهيز",
  "جاهز للتوصيل",
  "قيد التوصيل",
  "تم التوصيل",
  "ملغي",
];

const PAYMENT_STATUS_ORDER = [
  "قيد الانتظار",
  "قيد المعالجة",
  "مكتمل",
  "فشل",
  "تم الاسترداد",
];

const STATUS_COLORS = {
  "قيد الانتظار": { bg: "rgba(245, 158, 11, 0.12)", border: "#f59e0b", text: "#f59e0b" },
  "جاري التجهيز": { bg: "rgba(168, 85, 247, 0.12)", border: "#a855f7", text: "#a855f7" },
  "جاهز للتوصيل": { bg: "rgba(230, 16, 198, 0.12)", border: "#e610c6", text: "#e610c6" },
  "قيد التوصيل":  { bg: "rgba(59, 130, 246, 0.12)", border: "#3b82f6", text: "#3b82f6" },
  "تم التوصيل":   { bg: "rgba(34, 197, 94, 0.12)",  border: "#22c55e", text: "#22c55e" },
  "ملغي":         { bg: "rgba(239, 68, 68, 0.12)",  border: "#ef4444", text: "#ef4444" },
};

const PAYMENT_STATUS_COLORS = {
  "قيد الانتظار": { bg: "rgba(245, 158, 11, 0.12)", border: "#f59e0b", text: "#f59e0b" },
  "قيد المعالجة": { bg: "rgba(59, 130, 246, 0.12)", border: "#3b82f6", text: "#3b82f6" },
  "مكتمل":        { bg: "rgba(34, 197, 94, 0.12)",  border: "#22c55e", text: "#22c55e" },
  "فشل":          { bg: "rgba(239, 68, 68, 0.12)",  border: "#ef4444", text: "#ef4444" },
  "تم الاسترداد": { bg: "rgba(168, 85, 247, 0.12)", border: "#a855f7", text: "#a855f7" },
};

const FALLBACK_COLOR = {
  bg: "var(--bg-input)",
  border: "var(--border-subtle)",
  text: "var(--text-secondary)",
};

export default function MyOrders() {
  const navigate = useNavigate();
  const requestIdRef = useRef(0);

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    statusCounts: {},
    paymentStatusCounts: {},
  });
  const [responseMessage, setResponseMessage] = useState({
    success: false,
    message: "",
  });
  const [loading, setLoading] = useState(true);

  // Search inputs
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [storeNameSearch, setStoreNameSearch] = useState("");
  const [productNameSearch, setProductNameSearch] = useState("");

  // Debounced mirrors
  const [debouncedOrderId, setDebouncedOrderId] = useState("");
  const [debouncedStoreName, setDebouncedStoreName] = useState("");
  const [debouncedProductName, setDebouncedProductName] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedOrderId(orderIdSearch), 400);
    return () => clearTimeout(t);
  }, [orderIdSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedStoreName(storeNameSearch), 400);
    return () => clearTimeout(t);
  }, [storeNameSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProductName(productNameSearch), 400);
    return () => clearTimeout(t);
  }, [productNameSearch]);

  const fetchOrders = async () => {
    const myRequestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const params = { sortBy };
      if (selectedStatus)          params.status        = selectedStatus;
      if (selectedPaymentStatus)   params.paymentStatus = selectedPaymentStatus;
      if (debouncedOrderId)        params.orderId       = debouncedOrderId;
      if (debouncedStoreName)      params.storeName     = debouncedStoreName;
      if (debouncedProductName)    params.productName   = debouncedProductName;

      const res = await getOrdersHistory(params);

      if (myRequestId !== requestIdRef.current) return;

      // getOrdersHistory returns a raw fetch Response, so parse it.
      const resData = await res.json();

      if (myRequestId !== requestIdRef.current) return;

      if (!res.ok) {
        setOrders([]);
        responseMessageSetter(
          false,
          resData.message || "خطأ في جلب سجل الطلبات",
          setResponseMessage,
        );
        return;
      }

      // Backend returns { success, count, summary, data } — but be
      // defensive against alternative shapes.
      const list = resData.data || resData.orders || [];
      setOrders(Array.isArray(list) ? list : []);

      if (resData.summary) {
        setSummary({
          totalOrders: resData.summary.totalOrders ?? 0,
          statusCounts: resData.summary.statusCounts ?? {},
          paymentStatusCounts: resData.summary.paymentStatusCounts ?? {},
        });
      }
    } catch (err) {
      if (myRequestId !== requestIdRef.current) return;

      console.error(
        "error fetching client orders history: ",
        JSON.stringify(err),
      );
      setOrders([]);

      const msg = String(err?.message || "");
      if (err?.code === "AUTH_EXPIRED" || msg.includes("session")) {
        responseMessageSetter(
          false,
          "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى",
          setResponseMessage,
        );
      } else {
        responseMessageSetter(
          false,
          msg || "خطأ في جلب سجل الطلبات",
          setResponseMessage,
        );
      }
    } finally {
      if (myRequestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [
    sortBy,
    selectedStatus,
    selectedPaymentStatus,
    debouncedOrderId,
    debouncedStoreName,
    debouncedProductName,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedOrderId,
    debouncedStoreName,
    debouncedProductName,
    selectedStatus,
    selectedPaymentStatus,
    sortBy,
  ]);

  const totalFilteredCount = orders.length;
  const totalPages = Math.ceil(totalFilteredCount / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);

  const paginatedOrders = orders.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  const statusCounts = summary.statusCounts;
  const paymentStatusCounts = summary.paymentStatusCounts;
  const totalOrders = summary.totalOrders;

  const handleStatusChange = (id, status) => {
    setOrders((prev) =>
      prev.map((o) => {
        const oid = o._id || o.order_id;
        return oid === id ? { ...o, status } : o;
      }),
    );
  };

  const clearFilters = () => {
    setOrderIdSearch("");
    setStoreNameSearch("");
    setProductNameSearch("");
    setSelectedStatus("");
    setSelectedPaymentStatus("");
    setSortBy("newest");
  };

  const hasActiveFilters =
    orderIdSearch ||
    storeNameSearch ||
    productNameSearch ||
    selectedStatus ||
    selectedPaymentStatus ||
    sortBy !== "newest";

  return (
    <div className="orders-page">
      <div className="orders-page-container">
        {/* Page Header */}
        <div className="orders-header">
          <div className="orders-header-left">
            <div className="orders-header-icon">📦</div>
            <div className="orders-header-title-group">
              <h1 className="orders-header-title">طلباتي</h1>
              <p className="orders-header-subtitle">
                تتبع جميع طلباتك وإدارتها من مكان واحد
              </p>
            </div>
          </div>

          <div className="orders-header-stats">
            <div className="orders-header-stat">
              <span className="orders-header-stat-value">{totalOrders}</span>
              <span>إجمالي</span>
            </div>
            {ORDER_STATUS_ORDER.map((status) => {
              const count = statusCounts[status] ?? 0;
              const color =
                STATUS_COLORS[status]?.text || "var(--text-secondary)";
              return (
                <React.Fragment key={status}>
                  <div className="orders-header-stat-divider" />
                  <div className="orders-header-stat">
                    <span
                      className="orders-header-stat-value"
                      style={{ color }}
                    >
                      {count}
                    </span>
                    <span>{status}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="orders-filter-section">
          {/* Row 1: Search Inputs */}
          <div className="orders-filter-row orders-filter-row--search">
            <div className="orders-search-group">
              <div className="orders-search-wrapper orders-search-wrapper--small">
                <Search size={16} className="orders-search-icon" />
                <input
                  type="text"
                  className="orders-search-input"
                  placeholder="رقم الطلب..."
                  value={orderIdSearch}
                  onChange={(e) => setOrderIdSearch(e.target.value)}
                />
                {orderIdSearch && (
                  <button
                    className="orders-search-clear"
                    onClick={() => setOrderIdSearch("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <span className="orders-search-label">رقم الطلب</span>
            </div>

            <div className="orders-search-group">
              <div className="orders-search-wrapper orders-search-wrapper--small">
                <Search size={16} className="orders-search-icon" />
                <input
                  type="text"
                  className="orders-search-input"
                  placeholder="اسم المتجر..."
                  value={storeNameSearch}
                  onChange={(e) => setStoreNameSearch(e.target.value)}
                />
                {storeNameSearch && (
                  <button
                    className="orders-search-clear"
                    onClick={() => setStoreNameSearch("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <span className="orders-search-label">اسم المتجر</span>
            </div>

            <div className="orders-search-group">
              <div className="orders-search-wrapper orders-search-wrapper--small">
                <Search size={16} className="orders-search-icon" />
                <input
                  type="text"
                  className="orders-search-input"
                  placeholder="اسم المنتج..."
                  value={productNameSearch}
                  onChange={(e) => setProductNameSearch(e.target.value)}
                />
                {productNameSearch && (
                  <button
                    className="orders-search-clear"
                    onClick={() => setProductNameSearch("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <span className="orders-search-label">اسم المنتج</span>
            </div>

            <div className="orders-filters-actions">
              <div className="orders-filter-group">
                <ArrowUpDown size={16} className="orders-filter-icon" />
                <select
                  className="orders-filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button className="orders-clear-filters" onClick={clearFilters}>
                  <X size={14} />
                  مسح الكل
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Order Status Buttons — fixed order */}
          <div className="orders-filter-row orders-filter-row--status">
            <div className="orders-filter-row-label">
              <Package size={16} />
              <span>حالة الطلب</span>
            </div>
            <div className="orders-status-buttons">
              <button
                className={`orders-status-btn ${!selectedStatus ? "active" : ""}`}
                onClick={() => setSelectedStatus("")}
              >
                الكل
                <span className="orders-status-count">{totalOrders}</span>
              </button>
              {ORDER_STATUS_ORDER.map((status) => {
                const colors = STATUS_COLORS[status] || FALLBACK_COLOR;
                const isActive = selectedStatus === status;
                const count = statusCounts[status] ?? 0;
                return count !== 0 && (
                  <button
                    key={status}
                    className={`orders-status-btn ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedStatus(isActive ? "" : status)}
                    style={{
                      borderColor: isActive ? colors.border : "transparent",
                      background: isActive ? colors.bg : "transparent",
                      color: isActive ? colors.text : "var(--text-secondary)",
                      opacity: count === 0 && !isActive ? 0.5 : 1,
                    }}
                  >
                    {status}
                    <span
                      className="orders-status-count"
                      style={{
                        background: isActive ? colors.bg : "var(--bg-input)",
                        color: isActive ? colors.text : "var(--text-secondary)",
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Payment Status Buttons — fixed order */}
          <div className="orders-filter-row orders-filter-row--payment">
            <div className="orders-filter-row-label">
              <CreditCard size={16} />
              <span>حالة الدفع</span>
            </div>
            <div className="orders-status-buttons">
              <button
                className={`orders-status-btn ${!selectedPaymentStatus ? "active" : ""}`}
                onClick={() => setSelectedPaymentStatus("")}
              >
                الكل
                <span className="orders-status-count">{totalOrders}</span>
              </button>
              {PAYMENT_STATUS_ORDER.map((status) => {
                const colors = PAYMENT_STATUS_COLORS[status] || FALLBACK_COLOR;
                const isActive = selectedPaymentStatus === status;
                const count = paymentStatusCounts[status] ?? 0;
                return count !== 0 &&(
                  <button
                    key={status}
                    className={`orders-status-btn ${isActive ? "active" : ""}`}
                    onClick={() =>
                      setSelectedPaymentStatus(isActive ? "" : status)
                    }
                    style={{
                      borderColor: isActive ? colors.border : "transparent",
                      background: isActive ? colors.bg : "transparent",
                      color: isActive ? colors.text : "var(--text-secondary)",
                      opacity: count === 0 && !isActive ? 0.5 : 1,
                    }}
                  >
                    {status}
                    <span
                      className="orders-status-count"
                      style={{
                        background: isActive ? colors.bg : "var(--bg-input)",
                        color: isActive ? colors.text : "var(--text-secondary)",
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div className="orders-results-count">
            <span>
              عرض {paginatedOrders.length} من {orders.length} طلب
            </span>
          </div>
        )}

        {/* Orders List */}
        <OrdersList
          orders={paginatedOrders}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          onStatusChange={handleStatusChange}
          loading={loading}
          headerTitle=""
          onCancelSuccess={(orderId) => {
            if (orderId) {
              setOrders((prev) =>
                prev.map((o) => {
                  const oid = o._id || o.order_id;
                  return oid === orderId ? { ...o, status: "ملغي" } : o;
                }),
              );
            } else {
              fetchOrders();
            }
          }}
        />

        {/* Pagination */}
        {!loading && orders.length > 0 && totalPages > 1 && (
          <div className="orders-pagination-wrapper">
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}