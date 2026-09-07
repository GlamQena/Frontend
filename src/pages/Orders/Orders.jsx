import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OrdersList from "../../components/OrdersList";
import "./Orders.css";
import "../../components/OrdersList.css";
import { getOrdersHistory } from "../../services/order";
import { responseMessageSetter } from "../../services/authService";
import { Search, X, ArrowUpDown, Filter, CreditCard, Package } from "lucide-react";
import Pagination from "../../components/Pagination";

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "price_high", label: "الأعلى سعراً" },
  { value: "price_low", label: "الأقل سعراً" },
];

// Status color mapping for buttons
const STATUS_COLORS = {
  "قيد الانتظار": { bg: "rgba(245, 158, 11, 0.12)", border: "#f59e0b", text: "#f59e0b" },
  "جاري التجهيز": { bg: "rgba(168, 85, 247, 0.12)", border: "#a855f7", text: "#a855f7" },
  "جاهز للتوصيل": { bg: "rgba(230, 16, 198, 0.12)", border: "#e610c6", text: "#e610c6" },
  "قيد التوصيل": { bg: "rgba(59, 130, 246, 0.12)", border: "#3b82f6", text: "#3b82f6" },
  "تم التوصيل": { bg: "rgba(34, 197, 94, 0.12)", border: "#22c55e", text: "#22c55e" },
  "ملغي": { bg: "rgba(239, 68, 68, 0.12)", border: "#ef4444", text: "#ef4444" },
};

// Payment status color mapping - MATCHES BACKEND MODEL
const PAYMENT_STATUS_COLORS = {
  "قيد الانتظار": { bg: "rgba(245, 158, 11, 0.12)", border: "#f59e0b", text: "#f59e0b" },
  "تم الاسترداد": { bg: "rgba(168, 85, 247, 0.12)", border: "#a855f7", text: "#a855f7" },
  "فشل": { bg: "rgba(239, 68, 68, 0.12)", border: "#ef4444", text: "#ef4444" },
  "مكتمل": { bg: "rgba(34, 197, 94, 0.12)", border: "#22c55e", text: "#22c55e" },
  "قيد المعالجة": { bg: "rgba(59, 130, 246, 0.12)", border: "#3b82f6", text: "#3b82f6" },
};

// Payment status list - MATCHES BACKEND MODEL
const PAYMENT_STATUS_LIST = [
  { value: "قيد الانتظار", label: "قيد الانتظار" },
  { value: "تم الاسترداد", label: "تم الاسترداد" },
  { value: "فشل", label: "فشل" },
  { value: "مكتمل", label: "مكتمل" },
  { value: "قيد المعالجة", label: "قيد المعالجة" },
];

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [responseMessage, setResponseMessage] = useState({ success: false, message: "" });
  const [loading, setLoading] = useState(true);
  
  // Search inputs
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [storeNameSearch, setStoreNameSearch] = useState("");
  const [productNameSearch, setProductNameSearch] = useState("");
  
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Get unique statuses from orders with counts
  const getStatusCounts = () => {
    const counts = {};
    orders.forEach(order => {
      const status = order.status;
      if (status) {
        counts[status] = (counts[status] || 0) + 1;
      }
    });
    return counts;
  };

  // Get unique payment statuses from orders with counts
  const getPaymentStatusCounts = () => {
    const counts = {};
    orders.forEach(order => {
      const paymentStatus = order.payment?.status;
      if (paymentStatus) {
        counts[paymentStatus] = (counts[paymentStatus] || 0) + 1;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();
  const paymentStatusCounts = getPaymentStatusCounts();
  const availableStatuses = Object.keys(statusCounts);
  const availablePaymentStatuses = Object.keys(paymentStatusCounts);

  // Check if any search filter is active
  const hasSearchFilters = orderIdSearch || storeNameSearch || productNameSearch;

  const getFilteredOrders = () => {
    let filtered = [...orders];

    // Order status filter
    if (selectedStatus) {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // Payment status filter - DIRECTLY from order.payment.status
    if (selectedPaymentStatus) {
      filtered = filtered.filter(order => order.payment?.status === selectedPaymentStatus);
    }

    // Search by Order ID
    if (orderIdSearch.trim()) {
      const query = orderIdSearch.trim().toLowerCase();
      filtered = filtered.filter(order => 
        order._id?.toLowerCase().includes(query)
      );
    }

    // Search by Store Name
    if (storeNameSearch.trim()) {
      const query = storeNameSearch.trim().toLowerCase();
      filtered = filtered.filter(order => {
        if (order.products) {
          for (const store of order.products) {
            if (store.owner_store_id?.store_name?.toLowerCase().includes(query)) {
              return true;
            }
          }
        }
        return false;
      });
    }

    // Search by Product Name
    if (productNameSearch.trim()) {
      const query = productNameSearch.trim().toLowerCase();
      filtered = filtered.filter(order => {
        if (order.products) {
          for (const store of order.products) {
            if (store.products) {
              for (const product of store.products) {
                if (product.name?.toLowerCase().includes(query)) {
                  return true;
                }
              }
            }
          }
        }
        return false;
      });
    }

    const sorted = [...filtered];
    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt || b.order_date || 0) - new Date(a.createdAt || a.order_date || 0));
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt || a.order_date || 0) - new Date(b.createdAt || b.order_date || 0));
        break;
      case "price_high":
        sorted.sort((a, b) => {
          // Use Number() and fallback to 0 if undefined/null/NaN
          const priceA = Number(a.total_price) || 0;
          const priceB = Number(b.total_price) || 0;
          return priceB - priceA;
        });
        break;
      case "price_low":
        sorted.sort((a, b) => {
          const priceA = Number(a.total_price) || 0;
          const priceB = Number(b.total_price) || 0;
          return priceA - priceB;
        });
        break;
      default:
        break;
    }

    return sorted;
  };

  const filteredOrders = getFilteredOrders();
  const totalFilteredCount = filteredOrders.length;
  const totalPages = Math.ceil(totalFilteredCount / itemsPerPage);

  const safeCurrentPage = Math.min(currentPage, totalPages || 1);

  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrdersHistory();
      const resData = await res.json();
      console.log("Fetched orders history =>", resData.data);
      setOrders(resData.data || []);
    } catch (err) {
      console.error(err);
      responseMessageSetter(false, err.message || "خطأ في جلب سجل الطلبات", setResponseMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [orderIdSearch, storeNameSearch, productNameSearch, selectedStatus, selectedPaymentStatus, sortBy]);

  const handleStatusChange = (id, status) => {
    setOrders(prev =>
      prev.map(o =>
        o._id === id ? { ...o, status } : o
      )
    );
  };

  // Count orders by status for header stats
  const headerStatusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const totalOrders = orders.length;

  // Clear all filters
  const clearFilters = () => {
    setOrderIdSearch("");
    setStoreNameSearch("");
    setProductNameSearch("");
    setSelectedStatus("");
    setSelectedPaymentStatus("");
    setSortBy("newest");
  };

  const hasActiveFilters = orderIdSearch || storeNameSearch || productNameSearch || 
                          selectedStatus || selectedPaymentStatus || sortBy !== "newest";

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
            {Object.entries(headerStatusCounts).map(([status, count]) => {
              const color = STATUS_COLORS[status]?.text || "var(--text-secondary)";
              return (
                <React.Fragment key={status}>
                  <div className="orders-header-stat-divider"></div>
                  <div className="orders-header-stat">
                    <span className="orders-header-stat-value" style={{ color }}>
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
                  <button className="orders-search-clear" onClick={() => setOrderIdSearch("")}>
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
                  <button className="orders-search-clear" onClick={() => setStoreNameSearch("")}>
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
                  <button className="orders-search-clear" onClick={() => setProductNameSearch("")}>
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
                  {SORT_OPTIONS.map(option => (
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

          {/* Row 2: Order Status Buttons */}
          {availableStatuses.length > 0 && (
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
                {availableStatuses.map(status => {
                  const colors = STATUS_COLORS[status] || { bg: "var(--bg-input)", border: "var(--border-subtle)", text: "var(--text-secondary)" };
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
                          background: isActive ? colors.bg : "var(--bg-input)",
                          color: isActive ? colors.text : "var(--text-secondary)",
                        }}
                      >
                        {statusCounts[status] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Row 3: Payment Status Buttons */}
          {availablePaymentStatuses.length > 0 && (
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
                {availablePaymentStatuses.map(status => {
                  const colors = PAYMENT_STATUS_COLORS[status] || { bg: "var(--bg-input)", border: "var(--border-subtle)", text: "var(--text-secondary)" };
                  const isActive = selectedPaymentStatus === status;
                  return (
                    <button
                      key={status}
                      className={`orders-status-btn ${isActive ? "active" : ""}`}
                      onClick={() => setSelectedPaymentStatus(isActive ? "" : status)}
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
                          background: isActive ? colors.bg : "var(--bg-input)",
                          color: isActive ? colors.text : "var(--text-secondary)",
                        }}
                      >
                        {paymentStatusCounts[status] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <div className="orders-results-count">
            <span>عرض {paginatedOrders.length} من {filteredOrders.length} طلب</span>
          </div>
        )}

        {/* Orders List */}
        <OrdersList
          orders={paginatedOrders}
          onStatusChange={handleStatusChange}
          loading={loading}
          headerTitle=""
          onCancelSuccess={(orderId) => {
            if (orderId) {
              setOrders((prev) =>
                prev.map((o) =>
                  o._id === orderId ? { ...o, status: "ملغي" } : o
                )
              );
            } else {
              fetchOrders();
            }
          }}
        />

        {/* Pagination */}
        {!loading && filteredOrders.length > 0 && totalPages > 1 && (
          <div className="orders-pagination-wrapper">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}