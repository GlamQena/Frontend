import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineMail,
} from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import {
  Star,
  Search,
  X,
  ArrowUpDown,
  Crown,
  Users,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useTheme } from "../../../components/ThemeProvider";
import { api } from "../../../services/authService";
import Pagination from "../../../components/Pagination";
import "./ActiveClients.css";
import "../../../components/Pagination.css";

const SORT_OPTIONS = [
  { value: "spent_high", label: "الأعلى إنفاقاً" },
  { value: "spent_low",  label: "الأقل إنفاقاً" },
  { value: "orders_high",label: "الأكثر طلبات" },
  { value: "recent",     label: "الأحدث طلباً" },
  { value: "oldest",     label: "الأقدم طلباً" },
];

const FILTER_OPTIONS = [
  { value: "all",      label: "كل العملاء" },
  { value: "vip",      label: "عملاء VIP" },
  { value: "repeat",   label: "عملاء متكررون" },
  { value: "new",      label: "عملاء جدد" },
  { value: "at_risk",  label: "يحتاجون متابعة" },
];

const PAGE_SIZE = 9;

const DAYS_AT_RISK = 30;

/* ─── Helpers ─────────────────────────────────────────── */
const formatCurrency = (n) =>
  `${Number(n || 0).toLocaleString("ar-EG")} ج.م`;

const formatDate = (str) => {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const daysSince = (str) => {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
};

const getInitial = (name) => {
  if (!name) return "؟";
  const trimmed = String(name).trim();
  return trimmed ? trimmed[0] : "؟";
};

// Deterministic hue from a string id (0-360)
const hueFromString = (str) => {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) % 360;
  }
  return h;
};

const normalizePhone = (phone) => {
  if (!phone) return "";
  // strip non-digits; assume Egypt (+20) if not already prefixed
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return `20${digits}`;
};

const isAtRisk = (client) => {
  const days = daysSince(client.lastOrderDate);
  return days !== null && days >= DAYS_AT_RISK && (client.totalOrders || 0) >= 1;
};

const isVip = (client) =>
  client.isVIP === true || (client.totalOrders || 0) > 10;

/* ─── Component ───────────────────────────────────────── */
function StoreOwnerActiveClients() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const errorTimer = useRef(null);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("spent_high");
  const [filterBy, setFilterBy] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  /* ─── Fetch ─────────────────────────────────────────── */
  useEffect(() => {
    const getClients = async () => {
      try {
        const response = await api.get("/stores/me/active-clients");
        setClients(response.data.data || []);
      } catch (error) {
        console.error("active clients error:", error);
        setErrorMessage(
          error?.response?.data?.message ||
            "خطأ في جلب العملاء المتفاعلين",
        );
        if (errorTimer.current) clearTimeout(errorTimer.current);
        errorTimer.current = setTimeout(() => setErrorMessage(""), 5000);
      } finally {
        setLoading(false);
      }
    };

    getClients();
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, []);

  /* ─── Debounce search (350ms) ───────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ─── Reset page on filter/sort change ──────────────── */
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, filterBy]);

  /* ─── Summary stats ─────────────────────────────────── */
  const summary = useMemo(() => {
    const total = clients.length;
    const vipCount = clients.filter(isVip).length;
    const revenue = clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const avg = total > 0 ? revenue / total : 0;
    const atRiskCount = clients.filter(isAtRisk).length;
    return { total, vipCount, revenue, avg, atRiskCount };
  }, [clients]);

  /* ─── Filter + sort ─────────────────────────────────── */
  const processed = useMemo(() => {
    let list = [...clients];

    // Search
    if (debouncedSearch) {
      list = list.filter((c) => {
        const name = String(c.fullName || "").toLowerCase();
        const phone = String(c.phoneNumber || "").toLowerCase();
        const email = String(c.email || "").toLowerCase();
        const city = String(c.location || "").toLowerCase();
        return (
          name.includes(debouncedSearch) ||
          phone.includes(debouncedSearch) ||
          email.includes(debouncedSearch) ||
          city.includes(debouncedSearch)
        );
      });
    }

    // Filter
    if (filterBy !== "all") {
      list = list.filter((c) => {
        switch (filterBy) {
          case "vip":     return isVip(c);
          case "repeat":  return (c.totalOrders || 0) >= 2;
          case "new":     return (c.totalOrders || 0) === 1;
          case "at_risk": return isAtRisk(c);
          default:        return true;
        }
      });
    }

    // Sort
    const sorted = [...list];
    switch (sortBy) {
      case "spent_low":
        sorted.sort((a, b) => (a.totalSpent || 0) - (b.totalSpent || 0));
        break;
      case "orders_high":
        sorted.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
        break;
      case "recent":
        sorted.sort(
          (a, b) =>
            new Date(b.lastOrderDate || 0) - new Date(a.lastOrderDate || 0),
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.lastOrderDate || 0) - new Date(b.lastOrderDate || 0),
        );
        break;
      case "spent_high":
      default:
        sorted.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
        break;
    }

    return sorted;
  }, [clients, debouncedSearch, filterBy, sortBy]);

  /* ─── Pagination ────────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = processed.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const hasActiveFilters =
    searchInput || filterBy !== "all" || sortBy !== "spent_high";

  const clearFilters = () => {
    setSearchInput("");
    setFilterBy("all");
    setSortBy("spent_high");
  };

  /* ─── Contact handlers ──────────────────────────────── */
  const handleCall = (phone) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone) => {
    if (!phone) return;
    const normalized = normalizePhone(phone);
    window.open(`https://wa.me/${normalized}`, "_blank", "noopener");
  };

  const handleEmail = (email) => {
    if (!email) return;
    window.location.href = `mailto:${email}`;
  };

  /* ─── Loading ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="active-container" data-theme={theme}>
        <div className="clients">
          <h1>العملاء المتفاعلون</h1>
          <p>جاري تحميل البيانات...</p>
        </div>
        <div className="clients-skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="client-card-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="active-container" dir="rtl">
      {/* ─── Header ─── */}
      <div className="clients-header">
        <div className="clients-title">
          <h1>العملاء المتفاعلون</h1>
          {clients.length > 0 && 
            <p>العملاء الذين قاموا بطلبات من متجرك</p>}
        </div>
      </div>

      {/* ─── Error ─── */}
      {errorMessage && (
        <div className="response-message error-message">{errorMessage}</div>
      )}

      {/* ─── Summary Stats ─── */}
      {clients.length > 0 && (
        <div className="clients-summary">
          <div className="summary-stat">
            <div className="summary-icon summary-icon--users">
              <Users size={18} />
            </div>
            <div>
              <span className="summary-label">إجمالي العملاء</span>
              <span className="summary-value">{summary.total}</span>
            </div>
          </div>

          <div className="summary-stat">
            <div className="summary-icon summary-icon--vip">
              <Crown size={18} />
            </div>
            <div>
              <span className="summary-label">عملاء VIP</span>
              <span className="summary-value summary-value--gold">
                {summary.vipCount}
              </span>
            </div>
          </div>

          <div className="summary-stat">
            <div className="summary-icon summary-icon--revenue">
              <TrendingUp size={18} />
            </div>
            <div>
              <span className="summary-label">إجمالي المبيعات</span>
              <span className="summary-value">
                {formatCurrency(summary.revenue)}
              </span>
            </div>
          </div>

          <div className="summary-stat">
            <div className="summary-icon summary-icon--avg">
              <Wallet size={18} />
            </div>
            <div>
              <span className="summary-label">متوسط الإنفاق</span>
              <span className="summary-value">
                {formatCurrency(Math.round(summary.avg))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Filter Bar ─── */}
      {clients.length > 0 && (
        <div className="clients-filter-bar">
          <div className="clients-search">
            <Search size={16} className="clients-search-icon" />
            <input
              type="text"
              className="clients-search-input"
              placeholder="ابحث بالاسم، الهاتف، البريد، أو المدينة..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                className="clients-search-clear"
                onClick={() => setSearchInput("")}
                aria-label="مسح البحث"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="clients-filter-group">
            <ArrowUpDown size={16} className="clients-filter-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="ترتيب"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="clients-filter-group">
            <Crown size={16} className="clients-filter-icon" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              aria-label="تصفية"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                  {opt.value === "at_risk" && summary.atRiskCount > 0
                    ? ` (${summary.atRiskCount})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button className="clients-clear-filters" onClick={clearFilters}>
              <X size={14} />
              <span>مسح الفلاتر</span>
            </button>
          )}
        </div>
      )}

      {/* ─── Empty states ─── */}
      {clients.length === 0 ? (
        <div className="clients-empty">
          <div className="clients-empty-icon">
            <Users size={56} strokeWidth={1.4} />
          </div>
          <h2>لا يوجد عملاء بعد</h2>
          <p>
            ستظهر هنا بيانات العملاء بمجرد أن يقوموا بطلبات من متجرك.
          </p>
        </div>
      ) : processed.length === 0 ? (
        <div className="clients-empty clients-empty--search">
          <span className="clients-empty-icon">🔍</span>
          <h2>لا توجد نتائج مطابقة</h2>
          <p>جرّب تعديل الفلاتر أو استخدام كلمات بحث مختلفة.</p>
          <button className="clients-empty-btn" onClick={clearFilters}>
            <X size={16} />
            <span>مسح الفلاتر</span>
          </button>
        </div>
      ) : (
        <>
          {/* ─── Cards Grid ─── */}
          <div className="cards-container">
            {paginated.map((client) => {
              const vip = isVip(client);
              const atRisk = isAtRisk(client);
              const days = daysSince(client.lastOrderDate);
              const initial = getInitial(client.fullName);
              const hue = hueFromString(client._id || client.email);
              const avgOrder =
                client.totalOrders > 0
                  ? Math.round((client.totalSpent || 0) / client.totalOrders)
                  : 0;

              return (
                <div
                  className={`client-card ${atRisk ? "client-card--at-risk" : ""}`}
                  key={client._id || client.email}
                >
                  {/* Top: name + avatar */}
                  <div className="top">
                    <div className="client-name-block">
                      <h2>{client.fullName || "عميل"}</h2>
                      <div className="client-badges">
                        {vip && (
                          <span className="vip-badge">
                            <Star size={12} />
                            <span>عميل VIP</span>
                          </span>
                        )}
                        {atRisk && (
                          <span className="at-risk-badge">
                            يحتاج متابعة
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="avatar"
                      style={{
                        background: `hsl(${hue}, 70%, 88%)`,
                        color: `hsl(${hue}, 65%, 38%)`,
                      }}
                    >
                      {initial}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="info">
                    {client.phoneNumber && (
                      <p className="info-line">
                        <HiOutlinePhone size={14} />
                        <span>{client.phoneNumber}</span>
                      </p>
                    )}
                    {client.email && (
                      <p className="info-line">
                        <HiOutlineMail size={14} />
                        <span>{client.email}</span>
                      </p>
                    )}
                    {client.location && (
                      <p className="info-line info-line--muted">
                        📍 {client.location}
                      </p>
                    )}
                  </div>

                  <hr />

                  {/* Stats */}
                  <div className="stats">
                    <div>
                      <span>إجمالي المشتريات</span>
                      <h3 className="stat-spent">
                        {formatCurrency(client.totalSpent)}
                      </h3>
                    </div>
                    <div>
                      <span>عدد الطلبات</span>
                      <h3>{client.totalOrders}</h3>
                    </div>
                    <div>
                      <span>متوسط الطلب</span>
                      <h3 className="stat-avg">
                        {formatCurrency(avgOrder)}
                      </h3>
                    </div>
                  </div>

                  {/* Date + Actions */}
                  <div className="card-footer">
                    <div className="date">
                      <span>آخر طلب:</span>
                      <span>
                        {formatDate(client.lastOrderDate)}
                        {days !== null && days >= 0 && (
                          <span className="days-ago">
                            {" "}
                            ({days === 0 ? "اليوم" : `منذ ${days} يوم`})
                          </span>
                        )}
                      </span>
                    </div>

                    <div
                      className="contact-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="contact-btn contact-btn--call"
                        onClick={() => handleCall(client.phoneNumber)}
                        disabled={!client.phoneNumber}
                        title="اتصال"
                        aria-label="اتصال"
                      >
                        <HiOutlinePhone size={16} />
                      </button>
                      <button
                        className="contact-btn contact-btn--whatsapp"
                        onClick={() => handleWhatsApp(client.phoneNumber)}
                        disabled={!client.phoneNumber}
                        title="واتساب"
                        aria-label="واتساب"
                      >
                        <FaWhatsapp size={16} />
                      </button>
                      <button
                        className="contact-btn contact-btn--email"
                        onClick={() => handleEmail(client.email)}
                        disabled={!client.email}
                        title="بريد إلكتروني"
                        aria-label="بريد إلكتروني"
                      >
                        <HiOutlineMail size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Results count + Pagination ─── */}
          <div className="clients-results-count">
            عرض {paginated.length} من {processed.length} عميل
          </div>

          {totalPages > 1 && (
            <div className="clients-pagination-wrapper">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StoreOwnerActiveClients;