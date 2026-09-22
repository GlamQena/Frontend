import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./StoreProducts.css";
import ProductCard from '../../components/ProductCard.jsx';
import { getStoreProducts } from "../../services/products.js";
import { buildImgSrc } from '../../services/imageUtils.js';
import { responseMessageSetter } from "../../services/authService.js";
import { getCurrentUser, isClient, getWishlist, addToWishlist, removeFromWishlist } from "../../services/users.js";
import { addToCart } from "../../services/cart.js";
import Pagination from "../../components/Pagination.jsx";

export default function StoreProducts() {
    const { storeId } = useParams();
    const navigate = useNavigate();
    
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState({success: false, message: ""});
    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [addingToCart, setAddingToCart] = useState(null);

    const currentUser = getCurrentUser();
    const isLoggedIn = !!currentUser;
    const isClientUser = isClient();

    // Search and Advanced Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [ingredientQuery, setIngredientQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [maxPrice, setMaxPrice] = useState("");
    const [minRating, setMinRating] = useState("");
    const [selectedSkinType, setSelectedSkinType] = useState("");
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const hasActiveFilters =
        searchQuery.trim() !== "" ||
        ingredientQuery.trim() !== "" ||
        selectedCategory !== "all" ||
        maxPrice !== "" ||
        minRating !== "" ||
        selectedSkinType !== "";

    const clearAllFilters = () => {
        setSearchQuery("");
        setIngredientQuery("");
        setSelectedCategory("all");
        setMaxPrice("");
        setMinRating("");
        setSelectedSkinType("");
        setCurrentPage(1);
    };

    const fetchStoreDataAndProducts = async () => {
        setIsLoading(true);
        try {
            const productsRes = await getStoreProducts(storeId);

            if (!productsRes.success) {
                responseMessageSetter(false, productsRes.message || "خطأ فى جلب منتجات المتجر", setError);
                return;
            }

            const fetchedProducts = productsRes.data?.products || [];
            setStore(productsRes.data?.store || null);
            setProducts(fetchedProducts);

            const activeCategories = new Map();

            fetchedProducts.forEach(p => {
                if (p.category_id && typeof p.category_id === 'object') {
                    activeCategories[p.category_id._id] = p.category_id;
                }
            });

            let activeCategoriesList = Object.values(activeCategories);
            console.log(`active products categories: ${JSON.stringify(activeCategoriesList)}`);

            setCategories([
                { _id: "all", name: "الكل", icon: "🛍️" },
                ...activeCategoriesList
            ]);

            // Fetch wishlist if client is logged in
            if (isLoggedIn && isClientUser) {
                try {
                    const wishlistRes = await getWishlist();
                    if (wishlistRes.ok) {
                        const wishlistJson = await wishlistRes.json();
                        const ids = new Set((wishlistJson.data.wishlist || []).map(item => item.productId?._id || item.productId || item._id));
                        setWishlistIds(ids);
                    }
                } catch (err) {
                    console.error("Failed to load wishlist", err);
                }
            }
        } catch (err) {
            responseMessageSetter(false, err.message || "خطأ فى جلب بيانات المتجر أو المنتجات", setError);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStoreDataAndProducts();
        window.scrollTo({top: 0, behavior: "smooth"});
    }, [storeId]);

    // Handle Wishlist Toggle (Error only feedback)
    const handleToggleWishlist = async (e, productId) => {
        e.stopPropagation();
        if (!isLoggedIn) {
            navigate("/login");
            return;
        }

        try {
            if (wishlistIds.has(productId)) {
                const res = await removeFromWishlist(productId);
                if (res.ok) {
                    setWishlistIds(prev => {
                        const next = new Set(prev);
                        next.delete(productId);
                        return next;
                    });
                }
            } else {
                const res = await addToWishlist(productId);
                if (res.ok) {
                    setWishlistIds(prev => {
                        const next = new Set(prev);
                        next.add(productId);
                        return next;
                    });
                }
            }
        } catch (err) {
            if (err.code === "AUTH_EXPIRED" || err.message?.includes("session")) {
                responseMessageSetter(false, "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.", setError);
                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            } else {
                console.error("Error updating wishlist", err);
                responseMessageSetter(false, err.message || "فشل تحديث قائمة المفضلة", setError);
            }
        }
    };

    const handleAddToCart = async (e, productId) => {
        e.stopPropagation();
    
        // Prevent multiple simultaneous adds
        if (addingToCart === productId) return;

        // Set loading state for this specific product
        setAddingToCart(productId);

        try {
            const res = await addToCart(productId, 1);
            if (!res.ok) {
                const data = await res.json();
                responseMessageSetter(false, data.message || "فشل إضافة المنتج إلى السلة", setError);
            } 
        } catch (err) {
            console.error("Error adding to cart", err);
            responseMessageSetter(false, "حدث خطأ أثناء الإضافة إلى السلة", setError);
        } finally {
            // Clear loading state
            setAddingToCart(null);
        }
    };

    // Extract unique available skin types from products for dynamic options
    const availableSkinTypes = useMemo(() => {
        const types = new Set();
        products.forEach(p => {
            if (p.skinType) types.add(p.skinType);
        });
        return Array.from(types);
    }, [products]);

    // Filter & Search Logic (including Ingredients & Skin Type)
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const productName = product?.name || "";
            const categoryMatchId = product?.category_id?._id || product?.category_id?.id || product?.category_id || "";
            const price = product?.price || 0;
            const rating = product?.average_rating || 0;
            const skinType = product?.skinType || "";
            
            // Ingredients can be a string or an array of strings
            const ingredients = product?.ingredients || product?.active_ingredients || "";
            let ingredientsMatch = true;
            if (ingredientQuery.trim() !== "") {
                const query = ingredientQuery.toLowerCase();
                if (Array.isArray(ingredients)) {
                    ingredientsMatch = ingredients.some(ing => String(ing).toLowerCase().includes(query));
                } else {
                    ingredientsMatch = String(ingredients).toLowerCase().includes(query);
                }
            }

            const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "all" || String(categoryMatchId) === String(selectedCategory);
            const matchesPrice = maxPrice === "" || price <= parseFloat(maxPrice);
            const matchesRating = minRating === "" || rating >= parseFloat(minRating);
            const matchesSkinType = selectedSkinType === "" || skinType === selectedSkinType;

            return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesSkinType && ingredientsMatch;
        });
    }, [products, searchQuery, ingredientQuery, selectedCategory, maxPrice, minRating, selectedSkinType]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, ingredientQuery, selectedCategory, maxPrice, minRating, selectedSkinType]);

    if (isLoading) {
        return (
            <div className="store-page" dir="rtl">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>جاري تحميل بيانات المتجر والمنتجات...</p>
                </div>
            </div>
        );
    }

    if (error.message && products.length === 0) {
        return (
            <div className="store-page" dir="rtl">
                <div className="no-data"><p>{error.message}</p></div>
            </div>
        );
    }

    return (
        <div className="store-page" dir="rtl">
            <div className="store-top-nav">
                <button onClick={() => navigate("/stores")} className="back-stores-btn">
                    ← العودة إلى جميع المتاجر
                </button>
            </div>

            {/* Comprehensive Store Details Banner Header */}
            <div className="store-banner">
                <div className="banner-overlay">
                    <div className="banner-content-wrapper">
                        <div>
                            <h2>{store?.store_name || "متجر التجميل والعناية"}</h2>
                            <div className="store-header-meta">
                                <div className="store-header-rating">
                                    <span>★ {store?.average_rating ? store.average_rating.toFixed(1) : "0.0"}</span>
                                    <span className="store-header-rates-count">({store?.total_rates || 0} تقييم)</span>
                                </div>
                                <span className="store-header-products-count">{store?.total_products || products.length} منتج متاح</span>
                            </div>
                            <p className="store-header-description">
                                {store?.store_description || "تصفح أفضل منتجاتنا والعروض الحصرية المقدمة خصيصاً لك من هذا المتجر المعتمد."}
                            </p>
                        </div>
                        {store?.logo && (
                            <div className="store-banner-logo">
                                <img src={buildImgSrc(store.logo, "store")} alt={store.store_name} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Filter Pills Bar */}
            <div className="category-filter">
                {categories.map((cat) => (
                    <button
                        key={cat._id}
                        className={selectedCategory === cat._id ? "active" : ""}
                        onClick={() => setSelectedCategory(cat._id)}
                    >
                        <span>{cat.icon}</span> {cat.name}
                    </button>
                ))}
            </div>

            {/* Enhanced Controls Bar (Search + Ingredients + SkinType + Price + Rating) */}
            <div className="store-controls-bar">
                <div className="sp-search-wrapper">
                    <input
                        type="text"
                        className="sp-search-input"
                        placeholder="ابحث باسم المنتج..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="sp-search-wrapper">
                    <input
                        type="text"
                        className="sp-search-input"
                        placeholder="ابحث بالمكونات (مثال: Hyaluronic)..."
                        value={ingredientQuery}
                        onChange={(e) => setIngredientQuery(e.target.value)}
                    />
                </div>
                <div className="sp-filters-group">
                    <select
                        className="sp-filter-select"
                        value={selectedSkinType}
                        onChange={(e) => setSelectedSkinType(e.target.value)}
                    >
                        <option value="">نوع البشرة</option>
                        {availableSkinTypes.map((type, idx) => (
                            <option key={idx} value={type}>{type}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        className="sp-filter-input"
                        placeholder="أقصى سعر"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                    />
                    <select
                        className="sp-filter-select"
                        value={minRating}
                        onChange={(e) => setMinRating(e.target.value)}
                    >
                        <option value="">جميع التقييمات</option>
                        <option value="4">4 نجوم فأكثر</option>
                        <option value="3">3 نجوم فأكثر</option>
                        <option value="2">2 نجوم فأكثر</option>
                    </select>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="sp-clear-filters"
                            onClick={clearAllFilters}
                        >
                            مسح الفلاتر
                        </button>
                    )}
                </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
                <div className="no-data">
                    <p>لا توجد منتجات مطابقة لخيارات البحث أو الفلاتر المحددة.</p>
                </div>
            ) : (
                <>
                    <div className="products-grid">
                        {paginatedProducts.map((product, index) => {
                            const productId = product._id || product.id;
                            const productWithWishlist = {
                                ...product,
                                addedToWishlist: wishlistIds.has(productId)
                            };
                            return (
                                <ProductCard 
                                    key={productId || index}
                                    product={productWithWishlist}
                                    isLoggedIn={isLoggedIn}
                                    isClientUser={isClientUser}
                                    onToggleWishlist={handleToggleWishlist}
                                    onAddToCart={handleAddToCart}
                                    // 👈 Pass the loading state
                                    isAddingToCart={addingToCart === productId}
                                />
                            );
                        })}
                    </div>

                    {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange= {(page) => {
                        setCurrentPage(page);
                    }}></Pagination>}
                </>
            )}

            {error.message && (
                <div className="response-message error-message">
                    <p>{error.message}</p>
                </div>
            )}
        </div>
    );
}