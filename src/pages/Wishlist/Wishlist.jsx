import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Wishlist.css";
import { addToCart } from "../../services/cart";
import {
  getCurrentUser,
  isClient,
  removeFromWishlist,
  getWishlist,
} from "../../services/users";
import { responseMessageSetter } from "../../services/authService";
import ProductCard from "../../components/ProductCard.jsx";
import Pagination from "../../components/Pagination.jsx";
import FloatingMsg from "../../components/FloatingMsg.jsx";

export default function WishlistPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [actionMsg, setActionMsg] = useState({ success: false, message: "" });
  const [loadingId, setLoadingId] = useState(null); //for single product action (removeFromWishlist, addToCart)
  const [isLoading, setIsLoading] = useState(true); //for the wishist
  const [addingToCartId, setAddingToCartId] = useState(null); //for adding wishlist products to cart

  // Filtering and Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [skinType, setSkinType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleAuthError = (error) => {
    if (error.code === "AUTH_EXPIRED" || error.message?.includes("session")) {
      setActionMsg({
        success: false,
        message: "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى",
      });
      setTimeout(() => {
        navigate("/login");
      }, 4000);
      return true;
    }
    return false;
  };

  // Fetch wishlist from server
  const fetchWishlistFromServer = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentUser = getCurrentUser();

      if (!currentUser || !isClient()) {
        setWishlist([]);
        return;
      }
      setUser(currentUser);
      const res = await getWishlist();
      const json = await res.json();

      if (!res.ok) {
        setActionMsg(json.message || "Failed to load wishlist");
        const userWishlist = currentUser?.wishlist || [];
        setWishlist(userWishlist);
        return;
      }

      let serverWishlist = [];
      if (json.data?.wishlist) {
        serverWishlist = json.data.wishlist;
      } else if (json.wishlist) {
        serverWishlist = json.wishlist;
      } else if (Array.isArray(json)) {
        serverWishlist = json;
      }

      if (json.user) {
        localStorage.setItem("user", JSON.stringify(json.user));
        setUser(json.user);
      } else if (json.data?.user) {
        localStorage.setItem("user", JSON.stringify(json.data.user));
        setUser(json.data.user);
      }

      const validWishlist = serverWishlist.filter(
        (item) => item && (item.productId || item.product || item._id),
      );

      setWishlist(validWishlist);
    } catch (error) {
      if (!handleAuthError(error)) {
        setActionMsg(error.message || "Failed to load wishlist");
        const currentUser = getCurrentUser();
        const userWishlist = currentUser?.wishlist || [];
        setWishlist(userWishlist);
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchWishlistFromServer();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchWishlistFromServer]);

  const handleRemove = async (prod_id) => {
    if (loadingId === prod_id) return; //to prevent simultaneous addingToCart and removeFromWishlist operations
    try {
      setLoadingId(prod_id);
      const res = await removeFromWishlist(prod_id);

      if (!res.ok) {
        let errorMessage = "خطأ فى الإزالة من قائمة الرغبات";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = res.statusText || errorMessage;
        }

        if (res.status === 404) {
          await fetchWishlistFromServer();
          return;
        } //solve the earlier problem resulted from setting the wishlist from the stored user in the localStorage
        return responseMessageSetter(false, errorMessage, setActionMsg);
      }

      let json;
      try {
        json = await res.json();
      } catch (parseError) {
        await fetchWishlistFromServer();
        responseMessageSetter(true, "تمت الإزالة بنجاح", setActionMsg);
        return;
      }

      let updatedWishlist = [];
      let userData = null;

      if (json.data?.wishlist) {
        updatedWishlist = json.data.wishlist;
        if (json.data?.user) userData = json.data?.user;
      } else if (json.data?.user?.wishlist) {
        updatedWishlist = json.data.user.wishlist;
        userData = json.data.user;
      } else if (json.user?.wishlist) {
        updatedWishlist = json.user.wishlist;
        userData = json.user;
      } else if (json.wishlist) {
        updatedWishlist = json.wishlist;
      }

      setWishlist(updatedWishlist);

      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }

      await fetchWishlistFromServer();
    } catch (error) {
      if (!handleAuthError(error)) {
        console.log(
          `error removing the product from the wishlist: ${JSON.stringify(error)}`,
        );
        responseMessageSetter(
          false,
          error.message || "حدث خطأ أثناء الإزالة من قائمة الرغبات",
          setActionMsg,
        );
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleAddToCart = async (prod_id) => {
    try {
      if (loadingId === prod_id) return;
      setLoadingId(prod_id);
      setAddingToCartId(prod_id);

      const res = await addToCart(prod_id);
      const json = await res.json();

      if (res.ok || json.success) {
        // Success action handled
      } else {
        responseMessageSetter(
          false,
          json.message || "خطأ فى إضافة منتج للكارت",
          setActionMsg,
        );
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.log(
          `error adding the product to the cart: ${JSON.stringify(error)}`,
        );
        responseMessageSetter(
          false,
          error.message || "خطأ فى إضافة منتج للكارت",
          setActionMsg,
        );
      }
    } finally {
      setLoadingId(null);
      setAddingToCartId(null);
    }
  };

  const handleRetry = () => {
    fetchWishlistFromServer();
  };

  // Filter & Search Logic (including ingredients & skin type)
  const filteredWishlist = useMemo(() => {
    return wishlist.filter((item) => {
      const prod = item.productId || item;
      const productName = prod?.name || prod?.productName || "";
      const storeName = prod?.store_name || prod?.storeName || "";
      const price = prod?.price || 0;
      const rating = prod?.average_rating || prod?.averageRating || 0;

      // Extract ingredients and skin types safely from various possible data structures
      const ingredients = prod?.ingredients || prod?.components || [];
      const ingredientsString = Array.isArray(ingredients)
        ? ingredients.join(" ")
        : typeof ingredients === "string"
          ? ingredients
          : "";

      const productSkinType =
        prod?.skinType || prod?.skin_type || prod?.suitableFor || "";

      const matchesSearch =
        productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        storeName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesIngredient =
        ingredientQuery === "" ||
        ingredientsString.toLowerCase().includes(ingredientQuery.toLowerCase());

      const matchesSkinType =
        skinType === "" ||
        productSkinType.toLowerCase().trim() === skinType.toLowerCase().trim();

      const matchesPrice = maxPrice === "" || price <= parseFloat(maxPrice);
      const matchesRating = minRating === "" || rating >= parseFloat(minRating);

      return (
        matchesSearch &&
        matchesIngredient &&
        matchesSkinType &&
        matchesPrice &&
        matchesRating
      );
    });
  }, [wishlist, searchQuery, ingredientQuery, skinType, maxPrice, minRating]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredWishlist.length / itemsPerPage);
  const paginatedWishlist = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredWishlist.slice(start, start + itemsPerPage);
  }, [filteredWishlist, currentPage]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, ingredientQuery, skinType, maxPrice, minRating]);

  if (isLoading) {
    return (
      <div className="wl-page" dir="rtl">
        <div className="wl-loading">
          <div className="wl-spinner"></div>
          <p>جاري تحميل قائمة الرغبات...</p>
        </div>
      </div>
    );
  }

  if (actionMsg.success == false && actionMsg.message) {
    return (
      <div className="wl-page" dir="rtl">
        <div className="wl-error">
          <div className="wl-error-icon">⚠️</div>
          <p className="wl-error-text">{actionMsg.message}</p>
          <button className="wl-retry-btn" onClick={handleRetry}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!user || !isClient()) {
    return (
      <div className="wl-page" dir="rtl">
        <div className="wl-empty">
          <div className="wl-empty-icon">🔒</div>
          <p className="wl-empty-text">
            الرجاء تسجيل الدخول لمشاهدة قائمة الرغبات
          </p>
          <button className="wl-shop-btn" onClick={() => navigate("/login")}>
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wl-page" dir="rtl">
      {/* Declarative Heading */}
      <div className="wl-header-text">
        <h1 className="wl-title">
          قائمة الرغبات الخاصة بي <span className="wl-heart">❤</span>
        </h1>
      </div>

      {actionMsg.message && (
        <FloatingMsg success={actionMsg.success} message={actionMsg.message} />
      )}

      {/* Controls Bar: Search, Ingredients, Skin Type & Filters */}
      <div className="wl-controls-bar">
        <div className="wl-search-wrapper">
          <input
            type="text"
            className="wl-search-input"
            placeholder="ابحث باسم المنتج أو اسم المتجر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="wl-filters-group">
          <input
            type="text"
            className="wl-filter-input"
            placeholder="البحث بالمكونات (مثل: فيتامين C)..."
            value={ingredientQuery}
            onChange={(e) => setIngredientQuery(e.target.value)}
          />
          <select
            className="wl-filter-select"
            value={skinType}
            onChange={(e) => setSkinType(e.target.value)}
          >
            <option value="">جميع أنواع البشرة</option>
            <option value="جافة">بشرة جافة</option>
            <option value="دهنية">بشرة دهنية</option>
            <option value="مختلطة">بشرة مختلطة</option>
            <option value="حساسة">بشرة حساسة</option>
            <option value="عادية">بشرة عادية</option>
          </select>
          <input
            type="number"
            className="wl-filter-input"
            placeholder="أقصى سعر"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <select
            className="wl-filter-select"
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

      {filteredWishlist.length === 0 ? (
        <div className="wl-empty">
          <div className="wl-empty-icon">🤍</div>
          <h3 className="wl-empty-title">لا توجد نتائج مطابقة</h3>
          <p className="wl-empty-text">
            {wishlist.length === 0
              ? "قائمتك المفضلة تنتظر إضافاتك. تصفحي تشكيلتنا المميزة وأضيفي ما يعجبكِ."
              : "لم يتم العثور على منتجات تطابق خيارات البحث أو التصفية الحالية."}
          </p>
          {wishlist.length === 0 && (
            <button className="wl-shop-btn" onClick={() => navigate("/")}>
              تصفحي المنتجات الآن
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="wl-grid">
            {paginatedWishlist.map((item, index) => {
              const product = item.productId || item;
              const productId = item._id || product._id;

              return (
                <ProductCard
                  key={productId || index}
                  product={{
                    ...product,
                    addedToWishlist: true,
                  }}
                  isLoggedIn={true}
                  isClientUser={true}
                  onToggleWishlist={(e, productId) => {
                    e.stopPropagation();
                    handleRemove(productId);
                  }}
                  onAddToCart={(e, productId) => {
                    e.stopPropagation();
                    handleAddToCart(productId);
                  }}
                  isAddingToCart={addingToCartId === productId}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
              }}
            ></Pagination>
          )}
        </>
      )}
    </div>
  );
}
