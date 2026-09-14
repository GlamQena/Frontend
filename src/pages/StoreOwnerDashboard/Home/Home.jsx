import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShoppingBag,
  Package,
  Star,
  TrendingUp,
  AlertTriangle,
  Percent,
  ClipboardList,
  Calendar,
  ChevronDown,
  PackageSearch,
  BarChart3,
  ShoppingCart,
} from "lucide-react";
import { getCurrentUser } from "../../../services/users";
import "./Home.css";
import { getAccessToken } from "../../../services/authService";

function getStoreId() {
  const user = getCurrentUser();
  return user?._id || null;
}

async function getAuthHeaders() {
  const token = await getAccessToken(() => {});
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

const FILTERS = [
  { label: "آخر ٧ أيام", value: "7" },
  { label: "آخر ١٤ يوم", value: "14" },
  { label: "آخر ٣٠ يوم", value: "30" },
];

const ORDER_STATUSES = [
  "قيد الانتظار",
  "جاري التجهيز",
  "جاهز للتوصيل",
  "قيد التوصيل",
  "تم التوصيل",
  "ملغي",
];

const STATUS_STYLE = {
  "قيد الانتظار": "st-wait",
  "جاري التجهيز": "st-prep",
  "جاهز للتوصيل": "st-ready",
  "قيد التوصيل": "st-ready",
  "تم التوصيل": "st-done",
  ملغي: "st-cancel",
};

const EMPTY_CHART = { labels: [], values: [] };

// ── SVG Area Chart ────────────────────────────────────────────────────────────
function AreaChart({ labels, values }) {
  const [tooltip, setTooltip] = useState(null);

  if (!values || values.length < 2) return null;

  const W = 800,
    H = 220,
    PL = 55,
    PR = 20,
    PT = 16,
    PB = 32;
  const iW = W - PL - PR,
    iH = H - PT - PB;
  const max = Math.max(...values) * 1.1 || 1;

  const pts = values.map((v, i) => ({
    x: PL + (i / (values.length - 1)) * iW,
    y: PT + iH - (v / max) * iH,
    v,
    label: labels[i],
  }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${PT + iH} L${pts[0].x},${PT + iH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: PT + iH - t * iH,
    label: `ج${Math.round(max * t)}`,
  }));

  return (
    <div className="svg-chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="svg-chart"
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-main)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary-main)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((t, i) => (
          <line
            key={i}
            x1={PL}
            y1={t.y}
            x2={W - PR}
            y2={t.y}
            stroke="var(--border-subtle)"
            strokeWidth="1"
          />
        ))}
        {yTicks.map((t, i) => (
          <text
            key={i}
            x={PL - 8}
            y={t.y + 4}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize="11"
          >
            {t.label}
          </text>
        ))}
        {pts.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={H - 6}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="11"
          >
            {p.label}
          </text>
        ))}
        <path d={areaPath} fill="url(#areaGrad)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--primary-main)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p, i) => (
          <rect
            key={i}
            x={p.x - iW / values.length / 2}
            y={PT}
            width={iW / values.length}
            height={iH}
            fill="transparent"
            onMouseEnter={() => setTooltip(p)}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
        {tooltip && (
          <circle
            cx={tooltip.x}
            cy={tooltip.y}
            r="6"
            fill="var(--primary-main)"
            stroke="var(--bg-card)"
            strokeWidth="2"
          />
        )}
      </svg>
      {tooltip && (
        <div
          className="svg-tooltip"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
          }}
        >
          <p className="tooltip-day">يوم {tooltip.label}</p>
          <p className="tooltip-value">
            {tooltip.v.toLocaleString("ar-EG")} ج
          </p>
        </div>
      )}
    </div>
  );
}

// ── Status Dropdown ───────────────────────────────────────────────────────────
function StatusDropdown({
  orderId,
  isLastOrder,
  currentStatus,
  onStatusChange,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function changeStatus(status) {
    if (
      !window.confirm(
        "عندما تغير حالة الاوردر لن تستطيع التراجع.. هل انت متأكد من الإجراء",
      )
    )
      return;
    setOpen(false);
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/order/${orderId}/status?status=${status}`, {
        method: "PATCH",
        headers,
      });
      if (res.ok) onStatusChange(orderId, status);
      else console.error("فشل تغيير الحالة");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const currentIndex = ORDER_STATUSES.indexOf(currentStatus);
  const isDisabled = currentIndex > 2;

  return (
    <div className="status-dropdown-wrap" ref={ref}>
      <button
        className={`status-badge ${STATUS_STYLE[currentStatus] || ""} ${loading ? "loading" : ""}`}
        onClick={() => setOpen((o) => !o)}
        disabled={loading || isDisabled}
      >
        <span className="status-dot" />
        {loading ? "جاري..." : currentStatus}
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={`chevron ${open ? "open" : ""}`}
        />
      </button>
      {open && (
        <div className={`status-menu ${isLastOrder ? "open-upward" : ""}`}>
          <p className="status-menu-title">تغيير الحالة</p>
          {ORDER_STATUSES.slice(0, 3).map((s) => {
            const statusIndex = ORDER_STATUSES.indexOf(s);
            const isDisabledStatus = currentIndex > statusIndex;
            return (
              <button
                key={s}
                className={`status-menu-item ${STATUS_STYLE[s]} ${s === currentStatus ? "current" : ""}`}
                onClick={() => changeStatus(s)}
                disabled={isDisabledStatus}
              >
                <span className="status-dot" /> {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Onboarding Empty Block ────────────────────────────────────────────────────
function OnboardingEmptyBlock() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: PackageSearch,
      title: "أضف منتجاتك",
      desc: "ابدأ بإضافة منتجاتك للكتالوج مع الصور والأسعار.",
    },
    {
      icon: ShoppingCart,
      title: "استقبل الطلبات",
      desc: "سيبدأ العملاء بالشراء من متجرك عبر منصة Glam Qena.",
    },
    {
      icon: BarChart3,
      title: "تابع النمو",
      desc: "ستظهر هنا إحصائيات المبيعات وتحليلات الأداء تلقائياً.",
    },
  ];

  return (
    <section className="onboarding-empty">
      <div className="onboarding-hero">
        <span className="onboarding-emoji">✨</span>
        <h2>متجرك جاهز، في انتظار أول طلب!</h2>
        <p>
          بمجرد أن يبدأ العملاء بالشراء من متجرك، ستظهر هنا تحليلات الأداء،
          أحدث الطلبات، وإحصائيات المبيعات بشكل تلقائي.
        </p>
      </div>

      <div className="onboarding-steps">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div className="onboarding-step" key={i}>
              <div className="onboarding-step-icon">
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <div className="onboarding-step-body">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="onboarding-actions">
        <button
          className="onboarding-btn onboarding-btn--primary"
          onClick={() =>
            navigate("/dashboard/store_owner/products")
          }
        >
          <Package size={16} />
          <span>إدارة المنتجات</span>
        </button>
        <button
          className="onboarding-btn onboarding-btn--outline"
          onClick={() => navigate("/dashboard/store_owner/orders")}
        >
          <ShoppingBag size={16} />
          <span>عرض الطلبات</span>
        </button>
      </div>
    </section>
  );
}

// ── Stats Empty (used when stats fetch failed) ────────────────────────────────
function StatsEmpty() {
  return (
    <div className="dashboard-empty dashboard-empty--stats">
      <span className="dashboard-empty-icon">📊</span>
      <h3>لا توجد إحصائيات بعد</h3>
      <p>
        ستظهر إحصائيات متجرك هنا بمجرد أن تبدأ باستقبال الطلبات.
      </p>
    </div>
  );
}

// ── StoreOwnerHome ────────────────────────────────────────────────────────────
export default function StoreOwnerHome() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [activeFilter, setActiveFilter] = useState("7");
  const [orders, setOrders] = useState([]);
  const [chartRaw, setChartRaw] = useState(EMPTY_CHART);
  const [chartLoading, setChartLoading] = useState(false);

  const totalSalesChart = useMemo(
    () =>
      (chartRaw.values || []).reduce((sum, v) => sum + (Number(v) || 0), 0),
    [chartRaw],
  );

  const hasChartData =
    Array.isArray(chartRaw.values) &&
    chartRaw.values.some((v) => Number(v) > 0);
  const hasOrders = orders.length > 0;
  const hasActivity = hasChartData || hasOrders;

  // True when every meaningful stat is 0 (platformCommission is
  // informational and never gates the empty state).
  const statsAreAllZero =
    stats !== null &&
    (stats.activeClients ?? 0) === 0 &&
    (stats.currentOrders ?? 0) === 0 &&
    (stats.totalOrders ?? 0) === 0 &&
    (stats.totalProducts ?? 0) === 0 &&
    (stats.totalSales ?? 0) === 0 &&
    (stats.averageRating ?? 0) === 0 &&
    (stats.lowStockProducts ?? 0) === 0;

  const getChartData = useCallback(async (period) => {
    setChartLoading(true);
    try {
      const headers = await getAuthHeaders();
      const chartRes = await fetch(
        `/stores/me/sales-chart?period=${period}`,
        { headers },
      );

      if (chartRes.ok) {
        const body = await chartRes.json();
        const chartData = body?.chartData;
        if (
          chartData &&
          Array.isArray(chartData.labels) &&
          Array.isArray(chartData.values) &&
          chartData.values.length > 0
        ) {
          setChartRaw(chartData);
        } else {
          setChartRaw(EMPTY_CHART);
        }
      } else {
        setChartRaw(EMPTY_CHART);
      }
    } catch (err) {
      console.error("error fetching chart data =>", err);
      setChartRaw(EMPTY_CHART);
    } finally {
      setChartLoading(false);
    }
  }, []);

  const getStats = useCallback(async () => {
    try {
      const statsRes = await fetch(`/stores/me/statistics`, {
        headers: await getAuthHeaders(),
      });
      const statsResData = await statsRes.json();

      if (statsRes.ok) {
        const analytics = statsResData?.analytics || {};
        const latestOrders = statsResData?.latestOrders || [];

        setStats({
          activeClients: analytics.interactiveClients ?? 0,
          currentOrders: analytics.currentOrders ?? 0,
          totalOrders: analytics.totalOrders ?? 0,
          totalProducts: analytics.totalProducts ?? 0,
          platformCommission:
            analytics.platformCommission != null
              ? Math.round(analytics.platformCommission * 100)
              : null,
          totalSales: analytics.totalSales ?? 0,
          averageRating: analytics.avgRating ?? 0,
          lowStockProducts: analytics.lowStockProducts ?? 0,
        });

        setOrders(
          latestOrders.map((order) => ({
            _id: order._id,
            user_name:
              order.user_id?.firstName && order.user_id?.lastName
                ? `${order.user_id.firstName} ${order.user_id.lastName}`
                : order.user_id?.firstName ||
                  order.user_id?.lastName ||
                  "عميل",
            user_initial: order.user_id?.firstName
              ? order.user_id.firstName[0]
              : "ع",
            products_count:
              order.products?.reduce(
                (sum, storeGroup) =>
                  sum + (storeGroup.products?.length || 0),
                0,
              ) || 0,
            total_price: order.total_price,
            status: order.status,
            createdAt: order.createdAt,
          })),
        );
      } else {
        setStatsError(
          statsResData.message || "خطأ في جلب الإحصائيات",
        );
        setStats(null);
      }
    } catch (err) {
      console.error("error fetching stats =>", err);
      setStatsError("خطأ في جلب الإحصائيات");
      setStats(null);
    }
  }, []);

  const handleFilterChange = useCallback(
    async (period) => {
      setActiveFilter(period);
      await getChartData(period);
    },
    [getChartData],
  );

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setStatsError("");

      const storeId = getStoreId();
      if (!storeId) {
        setLoading(false);
        setStats(null);
        setStatsError("لم يتم العثور على بيانات المتجر");
        return;
      }

      await Promise.all([getChartData(activeFilter), getStats()]);
      setLoading(false);
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStatusChange(orderId, newStatus) {
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, status: newStatus } : o,
      ),
    );
  }

  const cards = stats
    ? [
        {
          label: "العملاء المتفاعلون",
          value: stats.activeClients,
          icon: Users,
          badge: "العملاء الذين قاموا بطلبات",
          badgeType: "info",
          link: "/active_clients",
        },
        {
          label: "الطلبات الحالية",
          value: stats.currentOrders,
          icon: ShoppingBag,
          badge: "بحاجة للمتابعة",
          badgeType: "warning",
          link: "/orders",
        },
        {
          label: "إجمالي الطلبات",
          value: stats.totalOrders,
          icon: ClipboardList,
          badge: "إجمالي كل الطلبات",
          badgeType: "info",
          link: "/orders",
        },
        {
          label: "إجمالي المنتجات",
          value: stats.totalProducts,
          icon: Package,
          badge: "المنتجات المعروضة",
          badgeType: "info",
          link: "/products",
        },
        {
          label: "عمولة المنصة",
          value:
            stats.platformCommission != null
              ? `${stats.platformCommission}%`
              : "—",
          icon: Percent,
          badge: "تُخصم تلقائياً",
          badgeType: "warning",
        },
        {
          label: "إجمالي المبيعات",
          value: `${stats.totalSales.toLocaleString("ar-EG")} ج`,
          icon: TrendingUp,
          badge: "مجموع المبيعات",
          badgeType: "success",
        },
        {
          label: "متوسط التقييمات",
          value: stats.averageRating.toFixed(1),
          icon: Star,
          badge: stats.averageRating >= 4 ? "ممتاز" : "بحاجة لتحسين",
          badgeType:
            stats.averageRating >= 4
              ? "success"
              : stats.averageRating > 0
                ? "warning"
                : "info",
        },
        {
          label: "منتجات منخفضة المخزون",
          value: stats.lowStockProducts,
          icon: AlertTriangle,
          badge:
            stats.lowStockProducts > 0
              ? "يجب إعادة التعبئة"
              : "المخزون جيد",
          badgeType: stats.lowStockProducts > 0 ? "danger" : "success",
          link: "/products",
        },
      ]
    : [];

  const hasStats = stats !== null;

  // ── Three possible top-level views ──
  // 1. Loading → spinner
  // 2. No stats at all (fetch failed) → StatsEmpty only
  // 3. Stats exist, but everything is zero → OnboardingEmptyBlock only
  // 4. Stats exist, some activity → stats grid + chart + orders
  const showOnboardingOnly =
    !loading && hasStats && statsAreAllZero && !hasActivity;

  return (
    <div className="StoreOwnerHome-page" dir="rtl">
      {/* ══ Loading ══ */}
      {loading && (
        <section className="store-stats">
          <div className="stats-loading">
            <div className="stats-spinner" />
            <p>جاري تحميل البيانات...</p>
          </div>
        </section>
      )}

      {/* ══ Stats fetch failed → just show the error empty state ══ */}
      {!loading && !hasStats && (
        <section className="store-stats">
          <StatsEmpty />
          {statsError && (
            <p className="stats-error-text">{statsError}</p>
          )}
        </section>
      )}

      {/* ══ Onboarding only → no stats grid, just the empty block ══ */}
      {showOnboardingOnly && <OnboardingEmptyBlock />}

      {/* ══ Full dashboard → stats grid + chart + orders ══ */}
      {!loading && hasStats && !showOnboardingOnly && (
        <>
          <section className="store-stats">
            <div className="stats-grid">
              {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    className="stat-card"
                    key={i}
                    onClick={() => {
                      if (card.link)
                        navigate(`/dashboard/store_owner${card.link}`);
                    }}
                    style={{ cursor: card.link ? "pointer" : "default" }}
                  >
                    <div className={`stat-badge badge-${card.badgeType}`}>
                      {card.badge}
                    </div>
                    <div className="stat-icon-wrap">
                      <Icon size={22} strokeWidth={1.6} />
                    </div>
                    <div className="stat-value">{card.value}</div>
                    <div className="stat-label">{card.label}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ══ Performance / Chart Section ══ */}
          <section className="performance-section">
            <div className="perf-header">
              <div>
                <h2 className="perf-title">تحليلات الأداء</h2>
                <p className="perf-subtitle">
                  مراقبة نمو متجرك بالوقت الفعلي
                </p>
              </div>
              <div className="perf-filters">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    className={`filter-btn ${activeFilter === f.value ? "active" : ""}`}
                    onClick={() => handleFilterChange(f.value)}
                    disabled={chartLoading}
                  >
                    <Calendar size={14} strokeWidth={1.8} /> {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="chart-card">
              {chartLoading ? (
                <div className="stats-loading">
                  <div className="stats-spinner" />
                  <p>جاري تحميل بيانات المبيعات...</p>
                </div>
              ) : !hasChartData ? (
                <div className="dashboard-empty dashboard-empty--chart">
                  <span className="dashboard-empty-icon">📈</span>
                  <h3>لا توجد بيانات مبيعات</h3>
                  <p>
                    لا توجد مبيعات مسجلة في هذه الفترة. جرّب تغيير
                    الفترة الزمنية.
                  </p>
                </div>
              ) : (
                <>
                  <div className="card-top">
                    <div>
                      <span className="card-label">المبيعات (ج)</span>
                      <span className="card-sublabel">
                        إجمالي عوائد المتجر اليومية
                      </span>
                    </div>
                    <div>
                      <p className="card-total">
                        ج {totalSalesChart.toLocaleString("ar-EG")}
                      </p>
                      <p className="card-growth">إجمالي الفترة المحددة</p>
                    </div>
                  </div>
                  <AreaChart
                    labels={chartRaw.labels}
                    values={chartRaw.values}
                  />
                </>
              )}
            </div>
          </section>

          {/* ══ Latest Orders Section ══ */}
          <section className="orders-section">
            <div className="orders-header">
              <div>
                <h2 className="orders-title">أحدث الطلبات</h2>
                <p className="orders-subtitle">
                  إدارة ومتابعة طلبات عملاء Glam Qena
                </p>
              </div>
              <button
                className="btn-outline"
                onClick={() =>
                  navigate("/dashboard/store_owner/orders")
                }
              >
                عرض الكل
              </button>
            </div>

            <div className="orders-card">
              {orders.length === 0 ? (
                <div className="dashboard-empty dashboard-empty--orders">
                  <span className="dashboard-empty-icon">🛍️</span>
                  <h3>لا توجد طلبات بعد</h3>
                  <p>
                    ستظهر الطلبات هنا بمجرد أن يبدأ العملاء بالشراء من
                    متجرك.
                  </p>
                </div>
              ) : (
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>رقم الطلب</th>
                      <th>العميل</th>
                      <th>المنتجات</th>
                      <th>الإجمالي</th>
                      <th>الحالة</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, idx) => (
                      <tr key={order._id}>
                        <td className="order-date">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString(
                                "ar-EG",
                                {
                                  day: "numeric",
                                  month: "short",
                                },
                              )
                            : "—"}
                        </td>
                        <td className="order-id">
                          #{String(order._id).slice(-6).toUpperCase()}
                        </td>
                        <td>
                          <div className="client-cell">
                            <div className="client-avatar">
                              {order.user_initial}
                            </div>
                            <span>{order.user_name}</span>
                          </div>
                        </td>
                        <td>{order.products_count} منتج</td>
                        <td className="order-price">
                          {order.total_price?.toLocaleString("ar-EG")} ج
                        </td>
                        <td>
                          <StatusDropdown
                            orderId={order._id}
                            isLastOrder={idx === orders.length - 1}
                            currentStatus={order.status}
                            onStatusChange={handleStatusChange}
                          />
                        </td>
                        <td>
                          <button
                            className="btn-details"
                            onClick={() =>
                              navigate(
                                `/dashboard/store_owner/orders/${order._id}`,
                              )
                            }
                          >
                            تفاصيل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}