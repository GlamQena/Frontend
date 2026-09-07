import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getStores } from '../../services/stores';
import { buildImgSrc } from '../../services/imageUtils';
import {useTheme} from "../../components/ThemeProvider";
import "./Stores.css";
import Pagination from "../../components/Pagination";

export default function Stores() {
    const navigate = useNavigate();
    const {theme, setTheme} = useTheme();
    const [stores, setStores] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [minRating, setMinRating] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const getStoresHandler = async () => {
      setIsLoading(true);
    
      try {
        const res = await getStores();
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.message || "خطأ فى جلب المتاجر المتاحة");
          return;
        }

        const preparedStores = (json.data || []).map(store => ({
          _id: store._id,
          name: store.store_name,
          logo: store.logo,
          phone: store.store_phone,
          address: store.store_address ? `${store.store_address.city} - ${store.store_address.district}` : "",
          description: store.store_description || "لا يوجد وصف متاح لهذا المتجر حالياً.",
          totalProducts: store.total_products || 0,
          totalOrders: store.total_orders || 0,
          averageRating: store.average_rating || 0,
          totalRates: store.total_rates || 0
        }));

        setStores(preparedStores);
      } catch (err) {
        setError(err.message || "خطأ فى جلب المتاجر المتاحة");
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      getStoresHandler();
      window.scrollTo({top: 0, behavior: "smooth"});
    }, []);

    // Filter & Search Logic
    const filteredStores = useMemo(() => {
        return stores.filter((store) => {
            const storeName = store?.name || "";
            const rating = store?.averageRating || 0;

            const matchesSearch = storeName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRating = minRating === "" || rating >= parseFloat(minRating);

            return matchesSearch && matchesRating;
        });
    }, [stores, searchQuery, minRating]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
    const paginatedStores = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStores.slice(start, start + itemsPerPage);
    }, [filteredStores, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, minRating]);

    if (isLoading) {
        return (
            <div className="stores-page" dir="rtl">
                <div className="stores-loading">
                    <div className="stores-spinner"></div>
                    <p>جاري تحميل المتاجر...</p>
                </div>
            </div>
        );
    }

    if (error && stores.length === 0) {
        return (
            <div className="stores-page" dir="rtl">
                <div className="stores-error">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="stores-page" dir="rtl">
            <div className="stores-header">
                <h1 className="stores-title">المتاجر المتاحة</h1>
                <p className="stores-subtitle">تصفح أفضل المتاجر والشركاء لدينا واكتشف منتجاتهم المميزة</p>
            </div>

            {/* Controls Bar */}
            <div className="stores-controls-bar">
                <div className="stores-search-wrapper">
                    <input
                        type="text"
                        className="stores-search-input"
                        placeholder="ابحث باسم المتجر..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="stores-filters-group">
                    <select
                        className="stores-filter-select"
                        value={minRating}
                        onChange={(e) => setMinRating(e.target.value)}
                    >
                        <option value="">جميع التقييمات</option>
                        <option value="4">4 نجوم فأكثر</option>
                        <option value="3">3 نجوم فأكثر</option>
                        <option value="2">2 نجوم فأكثر</option>
                    </select>
                </div>
            </div>

            {filteredStores.length === 0 ? (
                <div className="stores-empty">
                    <p>لا توجد متاجر مطابقة لخيارات البحث.</p>
                </div>
            ) : (
                <>
                    <div className="stores-grid">
                        {paginatedStores.map((store, index) => {
                            const storeId = store._id;
                            return (
                                <div 
                                    key={storeId || index} 
                                    className="store-card"
                                    onClick={() => navigate(`/stores/${storeId}`)}
                                >
                                    <div className="store-card-header">
                                        <div className="store-avatar">
                                            <img 
                                                src={buildImgSrc(store.logo, "store")} 
                                                alt={store.name} 
                                                onError={(e) => { e.target.src = "/placeholder-store.png"; }}
                                            />
                                        </div>
                                        <div className="store-badge-rating">
                                            <span className="store-stars">★ {store.averageRating?.toFixed(1)}</span>
                                            <span className="store-rates-count">({store.totalRates})</span>
                                        </div>
                                    </div>

                                    <h3 className="store-name">{store.name}</h3>
                                    
                                    {store.address && (
                                        <p className="store-meta-info">📍 {store.address}</p>
                                    )}

                                    <p className="store-description">
                                        {store.description}
                                    </p>

                                    <div className="store-footer-stats">
                                        <div className="stat-item">
                                            <span className="stat-value">{store.totalProducts}</span>
                                            <span className="stat-label">منتج</span>
                                        </div>
                                        <div className="stat-divider"></div>
                                        <div className="stat-item">
                                            <span className="stat-value">{store.totalOrders}</span>
                                            <span className="stat-label">طلب مكتمل</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange= {(page) => {
                        setCurrentPage(page);
                    }}></Pagination>}
                </>
            )}

            {/* Bottom Banner Feature Div with Theme-Optimized Graphics */}
            <div className="stores-bottom-banner">
                <div className="stores-banner-content">
                    <div className="stores-banner-text">
                        <h3>هل تمتلك متجراً خاصاً بك؟</h3>
                        <p>انضم إلى منصتنا اليوم واعرض منتجاتك لآلاف العملاء بسهولة ومان أمان تام.</p>
                        <button 
                            className="stores-banner-btn"
                            onClick={() => navigate("/register?role=store_owner")}
                        >
                            سجل متجرك الآن
                        </button>
                    </div>
                    <div className="stores-banner-image-container">
                        <img 
                            src={theme === "purple" ? "/images/stores/shopping_cart_purple.jpg" : "/images/stores/shopping_cart_pink.jpg"} 
                            alt="متجر جمال قنا" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}