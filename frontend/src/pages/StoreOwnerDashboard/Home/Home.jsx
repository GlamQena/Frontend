import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {useNavigate} from "react-router-dom";
import {
  Users, ShoppingBag, Package, Star,
  TrendingUp, AlertTriangle, Percent, ClipboardList, Calendar, ChevronDown,
} from "lucide-react";
import {getCurrentUser} from "../../../services/users";
import "./Home.css";
import { getAccessToken } from "../../../services/authService";

const BASE_URL = "http://127.0.0.1:8080";

function getStoreId() {
  const user = getCurrentUser();
  return user._id || null;
}

async function getAuthHeaders() {
  const token = await getAccessToken(() => {});
  console.log("AuthHeaders token => ", token);
  return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}

const LOW_STOCK_THRESHOLD = 5;

const MOCK_STATS = {
  activeClients: 12, currentOrders: 8, totalOrders: 24, totalProducts: 38,
  platformCommission: 15, totalSales: 12450, averageRating: 4.5, lowStockProducts: 3,
};

const MOCK_CHART_DATA = {
  "7":  { labels: ["١٦","١٧","١٨","١٩","٢٠","٢١","٢٢"], values: [200,480,750,1100,1800,2200,1950] },
  "14": { labels: ["١٠","١١","١٢","١٣","١٤","١٥","١٦","١٧","١٨","١٩","٢٠","٢١","٢٢","٢٣"], values: [150,300,500,420,680,900,200,480,750,1100,1800,2200,1950,2400] },
  "30": { labels: ["١","٣","٥","٧","٩","١١","١٣","١٥","١٧","١٩","٢١","٢٣","٢٥","٢٧","٣٠"], values: [100,250,400,350,600,800,750,1000,1200,1100,1500,1800,2000,2200,2500] },
};

const FILTERS = [
  { label: "آخر ٧ أيام", value: "7" },
  { label: "آخر ١٤ يوم", value: "14" },
  { label: "آخر ٣٠ يوم", value: "30" },
];

// ⚠️ mock orders — استبدليها بالـ API لما تجهزي
const MOCK_ORDERS = [
  { _id: "1045", user_name: "سارة أحمد", user_initial: "س", products_count: 2, total_price: 445, status: "قيد الانتظار" },
  { _id: "1044", user_name: "محمد علي",  user_initial: "م", products_count: 1, total_price: 1250, status: "جاري التجهيز" },
  { _id: "1043", user_name: "ليلى محمود", user_initial: "ل", products_count: 4, total_price: 890, status: "قيد التوصيل" },
];

const ORDER_STATUSES = ["قيد الانتظار", "جاري التجهيز", "جاهز للتوصيل", "قيد التوصيل", "تم التوصيل", "ملغي" ];

const STATUS_STYLE = {
  "قيد الانتظار": "st-wait",
  "جاري التجهيز": "st-prep",
  "قيد التوصيل": "st-ready",
  "تم التوصيل":  "st-done",
  "ملغي":        "st-cancel",
};

// ── SVG Area Chart ────────────────────────────────────────────────────────────
function AreaChart({ labels, values }) {
  const [tooltip, setTooltip] = useState(null);
  const W = 800, H = 220, PL = 55, PR = 20, PT = 16, PB = 32;
  const iW = W - PL - PR, iH = H - PT - PB;
  const max = Math.max(...values) * 1.1 || 1;

  const pts = values.map((v, i) => ({
    x: PL + (i / (values.length - 1)) * iW,
    y: PT + iH - (v / max) * iH,
    v, label: labels[i],
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length-1].x},${PT+iH} L${pts[0].x},${PT+iH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: PT + iH - t * iH,
    label: `ج${Math.round(max * t)}`,
  }));

  return (
    <div className="svg-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="svg-chart">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9b6dff" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#9b6dff" stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        {yTicks.map((t, i) => (
          <line key={i} x1={PL} y1={t.y} x2={W-PR} y2={t.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        ))}
        {yTicks.map((t, i) => (
          <text key={i} x={PL-8} y={t.y+4} textAnchor="end" fill="#7a7399" fontSize="11">{t.label}</text>
        ))}
        {pts.map((p, i) => (
          <text key={i} x={p.x} y={H-6} textAnchor="middle" fill="#7a7399" fontSize="11">{p.label}</text>
        ))}
        <path d={areaPath} fill="url(#areaGrad)"/>
        <path d={linePath} fill="none" stroke="#9b6dff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((p, i) => (
          <rect key={i} x={p.x - iW/values.length/2} y={PT} width={iW/values.length} height={iH}
            fill="transparent" onMouseEnter={() => setTooltip(p)} onMouseLeave={() => setTooltip(null)}/>
        ))}
        {tooltip && <circle cx={tooltip.x} cy={tooltip.y} r="6" fill="#9b6dff" stroke="#1a1625" strokeWidth="2"/>}
      </svg>
      {tooltip && (
        <div className="svg-tooltip" style={{ left: `${(tooltip.x/W)*100}%`, top: `${(tooltip.y/H)*100}%` }}>
          <p className="tooltip-day">يوم {tooltip.label}</p>
          <p className="tooltip-value">{tooltip.v.toLocaleString("ar-EG")} ج</p>
        </div>
      )}
    </div>
  );
}

// ── Status Dropdown ───────────────────────────────────────────────────────────
function StatusDropdown({ orderId, isLastOrder, currentStatus, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function changeStatus(status) {
    if (!window.confirm("عندما تغير حالة الاوردر لن تستطيع التراجع.. هل انت متأكد من الإجراء")) return;
    setOpen(false);
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${BASE_URL}/order/${orderId}/status?status=${status}`,
        { method: "PATCH", headers }
      );
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
        ref={buttonRef}
        className={`status-badge ${STATUS_STYLE[currentStatus] || ""} ${loading ? "loading" : ""}`}
        onClick={() => setOpen(o => !o)}
        disabled={loading || isDisabled}
      >
        <span className="status-dot"/>
        {loading ? "جاري..." : currentStatus}
        <ChevronDown size={12} strokeWidth={2} className={`chevron ${open ? "open" : ""}`}/>
      </button>
      {open && (
        <div className={`status-menu ${isLastOrder ? 'open-upward' : ''}`}>
          <p className="status-menu-title">تغيير الحالة</p>
          {ORDER_STATUSES.slice(0, 3).map(s => {
            const statusIndex = ORDER_STATUSES.indexOf(s);
            const isDisabledStatus = currentIndex > statusIndex;
            return (
              <button
                key={s}
                className={`status-menu-item ${STATUS_STYLE[s]} ${s === currentStatus ? "current" : ""}`}
                onClick={() => changeStatus(s)}
                disabled={isDisabledStatus}
              >
                <span className="status-dot"/> {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── StoreOwnerHome ─────────────────────────────────────────────────────────────────
export default function StoreOwnerHome() {
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeFilter, setActiveFilter] = useState("7");
  const [orders, setOrders]     = useState(MOCK_ORDERS);
  const [chartRaw, setChartRaw]= useState(MOCK_CHART_DATA[activeFilter]);
  const totalSalesChart = useMemo(() => chartRaw.values.reduce((s, v) => s + v, 0), [chartRaw]);
  const navigate =  useNavigate();
  //useMemo keeps the old value until any of its dependency array variables change

  const getChartData= useCallback(async (period) => {
    try{
      const headers = await getAuthHeaders();
      let chartRes = await fetch(`${BASE_URL}/stores/me/sales-chart?period=${period}`, {headers});
      let chartResData;

      if(chartRes.ok){
        chartResData = await chartRes.json();
        const chartData = chartResData.chartData;
        console.log("chart data => ", chartData);
        setChartRaw(chartData);
      }
      else{
        console.error("error fetching chart data => ", chartResData.message);
      }
    }catch(err){
      console.error("error fetching chart data => ", err);
    }
  }, []);

  const getStats = useCallback( async() => {
    try{
      let statsRes = await fetch(`${BASE_URL}/stores/me/statistics`, { headers: await getAuthHeaders() });
      let statsResData = await statsRes.json();

      if(statsRes.ok){
        const store    = statsResData?.store || {};
        const latestOrders = statsResData?.latestOrders || [];
        const analytics = statsResData?.analytics || {};

        setStats({
          activeClients:      analytics.interactiveClients ?? MOCK_STATS.activeClients,
          currentOrders:      analytics.currentOrders ?? MOCK_STATS.currentOrders,
          totalOrders:        analytics.totalOrders ?? 0,
          totalProducts:      analytics.totalProducts ?? 0,
          platformCommission: Math.round(analytics.platformCommission * 100) || 15,
          totalSales:         analytics.totalSales ?? MOCK_STATS.totalSales,
          averageRating:      analytics.avgRating ?? MOCK_STATS.averageRating,
          lowStockProducts:   analytics.lowStockProducts ?? MOCK_STATS.lowStockProducts,
        });

        if (latestOrders.length > 0) {
          setOrders(latestOrders.map(order => ({
            _id: order._id,
            user_name: order.user_id?.firstName && order.user_id?.lastName 
              ? `${order.user_id.firstName} ${order.user_id.lastName}`
              : order.user_id?.firstName || order.user_id?.lastName || 'عميل',
            user_initial: order.user_id?.firstName ? order.user_id.firstName[0] : 'ع',
            products_count: order.products?.reduce((sum, storeGroup) => 
              sum + (storeGroup.products?.length || 0), 0) || 0,
            total_price: order.total_price,
            status: order.status,
            createdAt: order.createdAt
          })));
        }
      }else{
        console.error("error fetching stats => ", statsResData.message || "error fetching stats");
      }

    }catch(err){
      console.error("error fetching stats => ", err);
    }
  }, []);

  const handleFilterChange = useCallback(async (period) => {
    setActiveFilter(period);
    await getChartData(period);
  }, [getChartData]);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const storeId = getStoreId();
        const headers = await getAuthHeaders();
        if (!storeId) { setStats(MOCK_STATS); return; }

        await getChartData(activeFilter);

        await getStats();

      } catch (err) {
        console.warn("فشل تحميل البيانات:", err);
        setStats(MOCK_STATS);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [getChartData, getStats, activeFilter]);

  function handleStatusChange(orderId, newStatus) {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
  }

  const cards = stats ? [
    { label: "العملاء المتفاعلون",      value: stats.activeClients,                              icon: Users,        badge: "+3 هذا الشهر",       badgeType: "info"    , link: "/active_clients"},
    { label: "الطلبات الحالية",          value: stats.currentOrders,                             icon: ShoppingBag,  badge: "بحاجة للمتابعة",     badgeType: "warning" , link: "/orders"},
    { label: "إجمالي الطلبات",          value: stats.totalOrders,                               icon: ClipboardList, badge: "إجمالي كل الطلبات", badgeType: "info"    , link: "/orders"},
    { label: "إجمالي المنتجات",         value: stats.totalProducts,                             icon: Package,       badge: "+3 هذا الشهر",       badgeType: "info"   , link: "/products" },
    { label: "عمولة المنصة",            value: `${stats.platformCommission}%`,                  icon: Percent,       badge: "تُخصم تلقائياً",     badgeType: "warning" },
    { label: "إجمالي المبيعات",         value: `${stats.totalSales.toLocaleString("ar-EG")} ج`, icon: TrendingUp,    badge: "+8% عن الأمس",       badgeType: "success" },
    { label: "متوسط التقييمات",         value: stats.averageRating.toFixed(1),                  icon: Star,          badge: "ممتاز",               badgeType: "success" },
    { label: "منتجات منخفضة المخزون",   value: stats.lowStockProducts,                          icon: AlertTriangle, badge: "يجب إعادة التعبئة", badgeType: "danger"  , link: "/products"},
  ] : [];

  return (
    <div className="StoreOwnerHome-page" dir="rtl">

      {/* ══ السيكشن الأول: الكروت ══ */}
      <section className="store-stats">
        {loading ? (
          <div className="stats-loading">
            <div className="stats-spinner"/>
            <p>جاري تحميل البيانات...</p>
          </div>
        ) : (
          <div className="stats-grid">
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div className="stat-card" key={i} onClick={() => {if(card.link) navigate(`/dashboard/store_owner${card.link}`)}}>
                  <div className={`stat-badge badge-${card.badgeType}`}>{card.badge}</div>
                  <div className="stat-icon-wrap"><Icon size={22} strokeWidth={1.6}/></div>
                  <div className="stat-value">{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══ السيكشن التاني: تحليلات الأداء ══ */}
      <section className="performance-section">
        <div className="perf-header">
          <div>
            <h2 className="perf-title">تحليلات الأداء</h2>
            <p className="perf-subtitle">مراقبة نمو متجرك بالوقت الفعلي</p>
          </div>
          <div className="perf-filters">
            {FILTERS.map(f => (
              <button key={f.value}
                className={`filter-btn ${activeFilter === f.value ? "active" : ""}`}
                onClick={() => handleFilterChange(f.value)}>
                <Calendar size={14} strokeWidth={1.8}/> {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-card">
          <div className="card-top">
            <div>
              <span className="card-label">المبيعات (ج)</span>
              <span className="card-sublabel">إجمالي عوائد المتجر اليومية</span>
            </div>
            <div>
              <p className="card-total">ج {totalSalesChart.toLocaleString("ar-EG")}</p>
              <p className="card-growth">من +١٢.٤٪ هذا الأسبوع</p>
            </div>
          </div>
          <AreaChart labels={chartRaw.labels} values={chartRaw.values}/>
        </div>
      </section>

      {/* ══ السيكشن التالت: أحدث الطلبات ══ */}
      <section className="orders-section">
        <div className="orders-header">
          <div>
            <h2 className="orders-title">أحدث الطلبات</h2>
            <p className="orders-subtitle">إدارة ومتابعة طلبات عملاء Glam Qena</p>
          </div>
          <button className="btn-outline" onClick={() => navigate("/dashboard/store_owner/orders")}>عرض الكل</button>
        </div>

        <div className="orders-card">
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
              {orders.map(order => (
                <tr key={order._id}>
                  <td className="order-date">{order.createdAt?.split("T")[0]}</td>
                  <td className="order-id">#{order._id}</td>
                  <td>
                    <div className="client-cell">
                      <div className="client-avatar">{order.user_initial}</div>
                      <span>{order.user_name}</span>
                    </div>
                  </td>
                  <td>{order.products_count} منتج</td>
                  <td className="order-price">{order.total_price?.toLocaleString("ar-EG")} ج</td>
                  <td>
                    <StatusDropdown
                      orderId={order._id}
                      isLastOrder={orders.indexOf(order) === orders.length-1}
                      currentStatus={order.status}
                      onStatusChange={handleStatusChange}
                    />
                  </td>
                  <td>
                    <button className="btn-details" onClick={() => navigate(`/orders/${order._id}`)}>تفاصيل</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}