import React, { useEffect, useState, useRef } from "react";
import { Search, X, ArrowUpDown, CreditCard, Package } from "lucide-react";
import OrdersList from "../../../components/OrdersList";
import "../../../components/OrdersList.css";
import Pagination from "../../../components/Pagination";
import "../../../components/Pagination.css";
import { api } from "../../../services/authService";
import "./Orders.css";

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "price_high", label: "الأعلى سعراً" },
  { value: "price_low", label: "الأقل سعراً" },
];

const STATUS_COLORS = {
  "قيد الانتظار": { bg: "rgba(245,158,11,0.12)",  border: "#f59e0b", text: "#f59e0b" },
  "جاري التجهيز": { bg: "rgba(168,85,247,0.12)",  border: "#a855f7", text: "#a855f7" },
  "جاهز للتوصيل": { bg: "rgba(230,16,198,0.12)",  border: "#e610c6", text: "#e610c6" },
  "قيد التوصيل":  { bg: "rgba(59,130,246,0.12)",  border: "#3b82f6", text: "#3b82f6" },
  "تم التوصيل":   { bg: "rgba(34,197,94,0.12)",   border: "#22c55e", text: "#22c55e" },
  "ملغي":         { bg: "rgba(239,68,68,0.12)",   border: "#ef4444", text: "#ef4444" },
};

const PAYMENT_STATUS_COLORS = {
  "قيد الانتظار": { bg: "rgba(245,158,11,0.12)",  border: "#f59e0b", text: "#f59e0b" },
  "تم الاسترداد": { bg: "rgba(168,85,247,0.12)",  border: "#a855f7", text: "#a855f7" },
  "فشل":          { bg: "rgba(239,68,68,0.12)",   border: "#ef4444", text: "#ef4444" },
  "مكتمل":        { bg: "rgba(34,197,94,0.12)",   border: "#22c55e", text: "#22c55e" },
  "قيد المعالجة": { bg: "rgba(59,130,246,0.12)",  border: "#3b82f6", text: "#3b82f6" },
};

const ITEMS_PER_PAGE = 5;

export default function StoreOwnerOrders() {
  const requestIdRef = useRef(0);

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    statusCounts: {},
    paymentStatusCounts: {},
  });
  const [loading, setLoading] = useState(true);

  // Three independent search inputs (matches backend params)
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [productNameSearch, setProductNameSearch] = useState("");

  // Debounced mirrors
  const [debouncedOrderId, setDebouncedOrderId] = useState("");
  const [debouncedClient, setDebouncedClient] = useState("");
  const [debouncedProduct, setDebouncedProduct] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce each search independently
  useEffect(() => {
    const t = setTimeout(() => setDebouncedOrderId(orderIdSearch), 400);
    return () => clearTimeout(t);
  }, [orderIdSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedClient(clientSearch), 400);
    return () => clearTimeout(t);
  }, [clientSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProduct(productNameSearch), 400);
    return () => clearTimeout(t);
  }, [productNameSearch]);

  // Reset to page 1 whenever any filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedOrderId,
    debouncedClient,
    debouncedProduct,
    selectedStatus,
    selectedPaymentStatus,
    sortBy,
  ]);

  const fetchOrders = async () => {
    const myRequestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const params = {
        sortBy,
        status: selectedStatus || undefined,
        paymentStatus: selectedPaymentStatus || undefined,
        orderId: debouncedOrderId || undefined,
        clientSearch: debouncedClient || undefined,
        productName: debouncedProduct || undefined,
      };

      const res = await api.get("/order/store", { params });
      if (myRequestId !== requestIdRef.current) return;

      const data = res.data;
      setOrders(data.orders || []);

      if (data.summary) {
        setSummary({
          totalOrders: data.summary.totalOrders || 0,
          statusCounts: data.summary.statusCounts || {},
          paymentStatusCounts: data.summary.paymentStatusCounts || {},
        });
      } else {
        setSummary({ totalOrders: 0, statusCounts: {}, paymentStatusCounts: {} });
      }
    } catch (err) {
      if (myRequestId !== requestIdRef.current) return;
      console.error("Failed to fetch store orders:", err);
      setOrders([]);
    } finally {
      if (myRequestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortBy,
    selectedStatus,
    selectedPaymentStatus,
    debouncedOrderId,
    debouncedClient,
    debouncedProduct,
  ]);

  // -------------------------------------------------------------
  // Client-side pagination
  // -------------------------------------------------------------
  const totalFilteredCount = orders.length;
  const totalPages = Math.ceil(totalFilteredCount / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);

  const paginatedOrders = orders.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE,
  );

  const handleStatusChange = (id, newStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.order_id === id ? { ...o, order_status: newStatus } : o,
      ),
    );
  };

  const clearFilters = () => {
    setOrderIdSearch("");
    setClientSearch("");
    setProductNameSearch("");
    setSelectedStatus("");
    setSelectedPaymentStatus("");
    setSortBy("newest");
  };

  const hasActiveFilters = Boolean(
    orderIdSearch ||
      clientSearch ||
      productNameSearch ||
      selectedStatus ||
      selectedPaymentStatus ||
      sortBy !== "newest",
  );

  const totalOrders = summary.totalOrders;
  const availableStatuses = Object.keys(summary.statusCounts);
  const availablePaymentStatuses = Object.keys(summary.paymentStatusCounts);

  // ── Empty-state detection ──
  // "truly empty" = no orders exist at all (not just no matches for filters)
  const isTrulyEmpty = !loading && totalOrders === 0;

  return (
    <div className="orders-page">
      <div className="orders-page-container">

        {/* Header — always visible for context */}
        <div className="orders-header">
          <div className="orders-header-left">
            <div className="orders-header-icon">📦</div>
            <div className="orders-header-title-group">
              <h1 className="orders-header-title">الطلبات</h1>
              <p className="orders-header-subtitle">
                تتبع طلبات متجرك وإدارتها من مكان واحد
              </p>
            </div>
          </div>

          {/* Stats badges only when there are actually orders */}
          {!isTrulyEmpty && (
            <div className="orders-header-stats">
              <div className="orders-header-stat">
                <span className="orders-header-stat-value">{totalOrders}</span>
                <span>إجمالي</span>
              </div>
              {Object.entries(summary.statusCounts).map(([status, count]) => {
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
          )}
        </div>

        {/* Filter section — only when there's something to filter */}
        {!isTrulyEmpty && (
          <div className="orders-filter-section">
            {/* Row 1: 3 searches + sort + clear */}
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
                    placeholder="اسم العميل / الهاتف..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                  {clientSearch && (
                    <button
                      className="orders-search-clear"
                      onClick={() => setClientSearch("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <span className="orders-search-label">العميل</span>
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
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    className="orders-clear-filters"
                    onClick={clearFilters}
                  >
                    <X size={14} /> مسح الكل
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: order status buttons with counts */}
            {availableStatuses.length > 0 && (
              <div className="orders-filter-row orders-filter-row--status">
                <div className="orders-filter-row-label">
                  <Package size={16} /> <span>حالة الطلب</span>
                </div>
                <div className="orders-status-buttons">
                  <button
                    className={`orders-status-btn ${!selectedStatus ? "active" : ""}`}
                    onClick={() => setSelectedStatus("")}
                  >
                    الكل
                    <span className="orders-status-count">{totalOrders}</span>
                  </button>
                  {availableStatuses.map((status) => {
                    const colors = STATUS_COLORS[status] || {
                      bg: "var(--bg-input)",
                      border: "var(--border-subtle)",
                      text: "var(--text-secondary)",
                    };
                    const isActive = selectedStatus === status;
                    return (
                      <button
                        key={status}
                        className={`orders-status-btn ${isActive ? "active" : ""}`}
                        onClick={() => setSelectedStatus(isActive ? "" : status)}
                        style={{
                          borderColor: isActive ? colors.border : "transparent",
                          background: isActive ? colors.bg : "transparent",
                          color: isActive ? colors.text : "var(--text-secondary)",
                        }}
                      >
                        {status}
                        <span
                          className="orders-status-count"
                          style={{
                            background: isActive
                              ? colors.bg
                              : "var(--bg-input)",
                            color: isActive
                              ? colors.text
                              : "var(--text-secondary)",
                          }}
                        >
                          {summary.statusCounts[status] || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Row 3: payment status buttons with counts */}
            {availablePaymentStatuses.length > 0 && (
              <div className="orders-filter-row orders-filter-row--payment">
                <div className="orders-filter-row-label">
                  <CreditCard size={16} /> <span>حالة الدفع</span>
                </div>
                <div className="orders-status-buttons">
                  <button
                    className={`orders-status-btn ${!selectedPaymentStatus ? "active" : ""}`}
                    onClick={() => setSelectedPaymentStatus("")}
                  >
                    الكل
                    <span className="orders-status-count">{totalOrders}</span>
                  </button>
                  {availablePaymentStatuses.map((status) => {
                    const colors = PAYMENT_STATUS_COLORS[status] || {
                      bg: "var(--bg-input)",
                      border: "var(--border-subtle)",
                      text: "var(--text-secondary)",
                    };
                    const isActive = selectedPaymentStatus === status;
                    return (
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
                        }}
                      >
                        {status}
                        <span
                          className="orders-status-count"
                          style={{
                            background: isActive
                              ? colors.bg
                              : "var(--bg-input)",
                            color: isActive
                              ? colors.text
                              : "var(--text-secondary)",
                          }}
                        >
                          {summary.paymentStatusCounts[status] || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results count — only when there's something to count */}
        {!loading && !isTrulyEmpty && (
          <div className="orders-results-count">
            <span>
              عرض {paginatedOrders.length} من {totalFilteredCount} طلب
            </span>
          </div>
        )}

        {/* Orders list — handles its own empty states */}
        <OrdersList
          orders={paginatedOrders}
          onStatusChange={handleStatusChange}
          loading={loading}
          headerTitle=""
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        {/* Pagination */}
        {!loading && totalFilteredCount > 0 && totalPages > 1 && (
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