import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Cart.css";
import { addToCart, getCart, removeFromCart } from "../../services/cart";
import {
  isUserLogged,
  responseMessageSetter,
} from "../../services/authService";
import {
  getCurrentUser,
  isClient,
  removeFromWishlist,
  getWishlist,
} from "../../services/users";
import { placeOrder } from "../../services/order";
import { buildImgSrc } from "../../services/imageUtils";
import ProductCard from "../../components/ProductCard";
import {
  ArrowLeft,
  ShoppingBag,
  Store,
  AlertCircle,
  Info,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import FloatingMsg from "../../components/FloatingMsg";

export default function CartPage() {
  const navigate = useNavigate();

  /* ── State ── */
  const [groups, setGroups] = useState([]);
  const [summary, setSummary] = useState({
    total_price: 0,
    total_items: 0,
    total_stores: 0,
    has_stock_issues: false,
    is_cart_empty: true,
    auto_updated: false,
    stock_issues_count: 0,
  });
  const [stockIssues, setStockIssues] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true); // Only for first load
  const [updatingProductId, setUpdatingProductId] = useState(null); // Track specific product being updated
  const [actionMsg, setActionMsg] = useState({ success: false, message: "" });
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const redirectTimeoutRef = useRef();

  const SHIPPING = (summary.total_items || 0) > 0 ? 50 : 0;
  const total = (summary.total_price || 0) + SHIPPING;

  const handleAuthError = (error) => {
    if (error.code === "AUTH_EXPIRED" || error.message?.includes("session")) {
      setActionMsg({
        success: false,
        message: "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }

      redirectTimeoutRef.current = setTimeout(() => {
        navigate("/login");
      }, 4000);

      return true;
    }
    return false;
  };

  const fetchWishlistFromServer = useCallback(async () => {
    try {
      setWishlistLoading(true);
      const currentUser = getCurrentUser();

      if (!currentUser || !isClient()) {
        setWishlist([]);
        return;
      }

      const res = await getWishlist();
      if (!res.ok) {
        setWishlist(currentUser.wishlist || []);
        return;
      }

      const json = await res.json();
      let serverWishlist = [];
      let userData = null;

      if (json.data?.wishlist) {
        serverWishlist = json.data.wishlist;
        userData = json.data.user;
      } else if (json.wishlist) {
        serverWishlist = json.wishlist;
      } else if (json.data?.user?.wishlist) {
        serverWishlist = json.data.user.wishlist;
        userData = json.data.user;
      } else if (json.user?.wishlist) {
        serverWishlist = json.user.wishlist;
        userData = json.user;
      } else if (Array.isArray(json)) {
        serverWishlist = json;
      }

      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      }

      const validWishlist = serverWishlist
        .map((item) => {
          const prod = item.productId || item.product || item;
          return {
            ...prod,
            _id: prod._id || prod.id || item._id,
            addedToWishlist: true,
          };
        })
        .filter((item) => item && item._id);

      setWishlist(validWishlist);
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error(`Error fetching wishlist: ${JSON.stringify(error)}`);
        const currentUser = getCurrentUser();
        if (
          currentUser &&
          currentUser.wishlist &&
          Array.isArray(currentUser.wishlist)
        )
          setWishlist(currentUser?.wishlist || []);
      }
    } finally {
      setWishlistLoading(false);
    }
  }, []);

  async function fetchCart(showLoading) {
    try {
      if (showLoading) setInitialLoading(true);

      const res = await getCart();
      const json = await res.json();

      if (!res.ok) {
        return responseMessageSetter(
          false,
          json.message || "خطأ فى جلب منتجات الكارت",
          setActionMsg,
        );
      }

      if (json.data?.products) {
        if (json.data.products.length > 0) {
          setGroups(json.data.products);
        }
        setSummary(json.data.summary || {});
        if (json.data.stock_issues) {
          setStockIssues(json.data.stock_issues);
        }

        if (json.data.summary?.auto_updated) {
          responseMessageSetter(
            true,
            "تم تحديث بعض الأسعار تلقائياً بناءً على التغييرات الجديدة.",
            setActionMsg,
          );
        }
      }
    } catch (err) {
      console.error("fetchCart error:", err);
      responseMessageSetter(
        false,
        err.message || "خطأ فى جلب منتجات الكارت",
        setActionMsg,
      );
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    fetchCart(true);
    fetchWishlistFromServer();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchWishlistFromServer]);

  useEffect(() => {
    return () => {
      clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  const handleAddToCart = async (product_id) => {
    try {
      if (updatingProductId) return; // Prevent multiple simultaneous updates
      setUpdatingProductId(product_id); // Set loading for this specific product

      const res = await addToCart(product_id);
      const json = await res.json();

      if (json.success) {
        await fetchCart(false);
      } else {
        responseMessageSetter(
          false,
          json.message || "خطأ فى إضافة منتج للكارت",
          setActionMsg,
        );
      }
    } catch (err) {
      console.error("addToCart error:", err);
      responseMessageSetter(
        false,
        err.message || "خطأ فى إضافة منتج للكارت",
        setActionMsg,
      );
    } finally {
      setUpdatingProductId(null); // Clear loading state
    }
  };

  async function removeItem(productId, storeId, removeAll = false) {
    try {
      if (updatingProductId) return;
      setUpdatingProductId(productId);

      const res = await removeFromCart(productId, storeId, removeAll);
      const json = await res.json();

      if (!res.ok) {
        return responseMessageSetter(
          false,
          json.message || "حدث خطأ ما فى تعديل كمية المنتج",
          setActionMsg,
        );
      }

      await fetchCart(false);
    } catch (err) {
      console.error("removeItem error:", err);
    } finally {
      setUpdatingProductId(null);
    }
  }

  async function placeOrderHandler() {
    try {
      if (!isUserLogged()) {
        responseMessageSetter(
          false,
          "يرجى تسجيل الدخول أولا لإكمال الشراء",
          setActionMsg,
        );

        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }

        redirectTimeoutRef.current = setTimeout(() => {
          navigate("/login", { state: { returnTo: "/cart" } });
        }, 2500);

        return;
      }

      const res = await placeOrder();
      const json = await res.json();

      if (res.ok) {
        redirectTimeoutRef.current = setTimeout(() => {
          navigate("/shipping/info", {
            state: {
              orderId: json.order._id,
              subtotal: summary.total_price,
              shipping: SHIPPING,
              total: total,
            },
          });
        }, 500);
      } else {
        responseMessageSetter(
          false,
          json.message || "حدث خطأ أثناء تأكيد الطلب",
          setActionMsg,
        );
      }
    } catch (err) {
      if (!handleAuthError(err)) {
        console.error("placeOrder error:", JSON.stringify(err));
        responseMessageSetter(
          false,
          err.message || "حدث خطأ أثناء تأكيد الطلب",
          setActionMsg,
        );
      }
    }
  }

  const handleToggleWishlist = async (e, prod_id) => {
    e.stopPropagation();
    try {
      if (wishlistLoading) return;
      const res = await removeFromWishlist(prod_id, setActionMsg);
      const data = await res.json();

      if (res.ok) {
        await fetchWishlistFromServer();
      } else {
        responseMessageSetter(
          false,
          data.message || "حدث خطأ أثناء الإزالة من قائمة الرغبات",
          setActionMsg,
        );
      }
    } catch (err) {
      if (!handleAuthError(err)) {
        console.error("remove from Wishlist error:", err);
        responseMessageSetter(
          false,
          err.message || "حدث خطأ أثناء الإزالة من قائمة الرغبات",
          setActionMsg,
        );
      }
    }
  };

  if (initialLoading) {
    return (
      <div className="cart-loading">
        <div className="cart-loading-spinner"></div>
        <p>جاري تحميل السلة...</p>
      </div>
    );
  }

  if (summary.is_cart_empty) {
    return (
      <div className="cart-empty">
        <h2>سلة التسوق فارغة</h2>
        <p>لم تقم بإضافة أي منتجات إلى سلة التسوق بعد</p>
        <button className="cart-empty-btn" onClick={() => navigate("/stores")}>
          <ArrowLeft size={18} />
          <span>تصفح المنتجات</span>
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {actionMsg.message && (
        <FloatingMsg success={actionMsg.success} message={actionMsg.message} />
      )}

      <div className="cart-header">
        <div className="cart-header-content">
          <div className="cart-header-brand">
            <div className="cart-header-icon-wrapper">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h1 className="cart-header-title">سلة التسوق</h1>
              <p className="cart-header-subtitle">
                مراجعة المنتجات من{" "}
                <strong>{summary.total_stores || groups.length}</strong> متاجر
                مختلفة
              </p>
            </div>
          </div>

          <div className="cart-header-stats">
            <div className="cart-header-stat">
              <span className="cart-header-stat-value">
                {summary.total_items || 0}
              </span>
              <span className="cart-header-stat-label">قطعة</span>
            </div>
            <div className="cart-header-stat-divider"></div>
            <div className="cart-header-stat">
              <span className="cart-header-stat-value">
                {(summary.total_price || 0).toLocaleString("ar-EG")}
              </span>
              <span className="cart-header-stat-label">ج.م</span>
            </div>
          </div>
        </div>

        {summary.auto_updated && (
          <div className="cart-header-notice">
            <Info size={16} />
            <span>
              تم تحديث بعض الأسعار تلقائياً بناءً على التغييرات الجديدة
            </span>
          </div>
        )}

        {summary.has_stock_issues && (
          <div className="cart-header-notice warning">
            <AlertCircle size={16} />
            <span>
              يوجد {summary.stock_issues_count} منتج(ات) بها مشاكل في المخزون
            </span>
          </div>
        )}
      </div>

      <div className="cart-layout">
        <aside className="cart-summary-card">
          <h2 className="cart-summary-title">ملخص الطلب</h2>

          {stockIssues.length > 0 && (
            <div className="cart-stock-issues-summary">
              <AlertCircle size={16} />
              <div>
                <strong>مشاكل المخزون:</strong>
                <ul>
                  {stockIssues.slice(0, 3).map((issue, idx) => (
                    <li key={idx}>• {issue.message}</li>
                  ))}
                  {stockIssues.length > 3 && (
                    <li>• +{stockIssues.length - 3} مشاكل أخرى</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <div className="cart-summary-row">
            <span className="cart-summary-label">عدد المتاجر</span>
            <span className="cart-summary-value">
              {summary.total_stores || groups.length}
            </span>
          </div>
          <div className="cart-summary-row">
            <span className="cart-summary-label">إجمالي القطع</span>
            <span className="cart-summary-value">
              {summary.total_items || 0} قطعة
            </span>
          </div>
          <div className="cart-summary-row">
            <span className="cart-summary-label">المجموع الفرعي</span>
            <span className="cart-summary-value">
              {(summary.total_price || 0).toLocaleString("ar-EG")} ج.م
            </span>
          </div>
          <div className="cart-summary-row">
            <span className="cart-summary-label">الشحن</span>
            <span className="cart-summary-value">{SHIPPING} ج.م</span>
          </div>
          <hr className="cart-summary-divider" />
          <div className="cart-summary-total-row">
            <span className="cart-summary-total-label">الإجمالي</span>
            <span className="cart-summary-total-value">
              {total.toLocaleString("ar-EG")} ج.م
            </span>
          </div>

          <button
            className={`cart-checkout-btn ${summary.has_stock_issues ? "disabled" : ""}`}
            onClick={placeOrderHandler}
            disabled={summary.is_cart_empty || summary.has_stock_issues}
          >
            {summary.has_stock_issues
              ? "⚠️ توجد مشاكل في المخزون"
              : "إتمام الشراء"}
          </button>

          {summary.has_stock_issues && (
            <p className="cart-checkout-hint">
              يرجى تعديل الكميات أو إزالة المنتجات غير المتوفرة
            </p>
          )}
        </aside>

        <section className="cart-items-section">
          {groups.map((group, gi) => (
            <div
              key={gi}
              className={`cart-seller-group ${group.has_stock_issues ? "has-issues" : ""}`}
            >
              <div className="cart-seller-header">
                <div className="cart-seller-info">
                  {group.store_logo ? (
                    <img
                      className="cart-seller-avatar"
                      src={buildImgSrc(group.store_logo, "store")}
                      alt={group.store_name}
                    />
                  ) : (
                    <div className="cart-seller-avatar">
                      {group.store_name?.[0]}
                    </div>
                  )}
                  <div className="cart-seller-text-group">
                    <div className="cart-seller-name-wrapper">
                      <span
                        className="cart-seller-name"
                        onClick={() => navigate(`/stores/${group.store_id}`)}
                        role="link"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/stores/${group.store_id}`);
                          }
                        }}
                        title={`زيارة متجر ${group.store_name}`}
                      >
                        {group.store_name}
                        <span className="store-arrow">→</span>
                      </span>
                      {/* Optional: Add verified badge if store is verified */}
                      {/* <span className="cart-seller-verified">✓</span> */}
                    </div>
                    <span className="cart-seller-subtotal">
                      المجموع:{" "}
                      <strong>
                        {(group.store_subtotal || 0).toLocaleString("ar-EG")}{" "}
                        ج.م
                      </strong>
                    </span>
                  </div>
                </div>
                <div className="cart-seller-items-count">
                  {group.has_stock_issues && (
                    <span
                      className="cart-seller-stock-warning"
                      title="يوجد مشاكل في المخزون"
                    >
                      ⚠️
                    </span>
                  )}
                  <span className="count-number">{group.products.length}</span>{" "}
                  منتج
                </div>
              </div>

              {group.products.map((item, index) => (
                <CartItem
                  key={item.product_id || index}
                  store_id={group.store_id}
                  item={item}
                  onIncrease={() => handleAddToCart(item.product_id)}
                  onDecrease={() =>
                    removeItem(item.product_id, group.store_id, false)
                  }
                  onRemove={() =>
                    removeItem(item.product_id, group.store_id, true)
                  }
                  isUpdating={updatingProductId === item.product_id} // Only true for this specific product
                />
              ))}
            </div>
          ))}
        </section>
      </div>

      {wishlist && wishlist.length > 0 && (
        <div className="cart-wishlist-section">
          <div className="cart-wishlist-header">
            <div>
              <h2 className="cart-wishlist-title">✨ قائمة الرغبات</h2>
              <p className="cart-wishlist-subtitle">
                منتجات تودين شراؤها لاحقاً
              </p>
            </div>
            <Link to="/Wishlist" className="cart-wishlist-view-all">
              عرض الكل
              <ArrowLeft size={16} />
            </Link>
          </div>

          <div className="cart-wishlist-grid">
            {wishlist.slice(0, 4).map((product, index) => (
              <ProductCard
                key={`${product._id}-${index}`}
                product={product}
                isLoggedIn={true}
                isClientUser={true}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={(e, id) => {
                  e.stopPropagation();
                  handleAddToCart(id);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CartItem({
  item,
  store_id,
  onIncrease,
  onDecrease,
  onRemove,
  isUpdating,
}) {
  const navigate = useNavigate();
  const imageUrl = item.image ? buildImgSrc(item.image) : null;

  // Determine stock status from backend response
  const isOutOfStock = item.stock_warning === "Out of stock" || item.stock <= 0;
  const isLowStock =
    item.stock_warning && item.stock_warning.includes("Only") && !isOutOfStock;
  const hasPriceChanged = item.price_changed === true;

  return (
    <div
      className={`cart-item ${isOutOfStock ? "out-of-stock" : ""} ${hasPriceChanged ? "price-changed" : ""} ${isUpdating ? "updating" : ""}`}
      onClick={() => navigate(`/products/${item.product_id}`)}
      title="تفاصيل المنتج"
    >
      <div className="cart-item-image-wrapper">
        <div className="cart-item-image">
          {imageUrl ? <img src={imageUrl} alt={item.name} /> : "🛍️"}
        </div>
        {isOutOfStock && (
          <div className="cart-item-stock-badge out-of-stock">غير متوفر</div>
        )}
        {isLowStock && (
          <div className="cart-item-stock-badge low-stock">كمية محدودة</div>
        )}
        {hasPriceChanged && (
          <div className="cart-item-price-badge">تغير السعر</div>
        )}
      </div>

      <div className="cart-item-info">
        <p className="cart-item-name">{item.name}</p>

        <div className="cart-item-price-row">
          <p className="cart-item-price">
            {(item.subtotal || 0).toLocaleString("ar-EG")} ج.م
          </p>
          {hasPriceChanged && (
            <span className="cart-item-price-changed">
              <span className="cart-item-old-price">{item.old_price} ج.م</span>
              <span className="cart-item-price-change">↕ تغير</span>
            </span>
          )}
        </div>

        {item.stock_warning && (
          <p
            className={`cart-item-warning ${isOutOfStock ? "out-of-stock" : isLowStock ? "low-stock" : ""}`}
          >
            {isOutOfStock ? "🚫" : isLowStock ? "⚠️" : "ℹ️"}{" "}
            {item.stock_warning}
          </p>
        )}

        {item.is_available === false && !item.stock_warning && (
          <p className="cart-item-warning out-of-stock">🚫 غير متوفر</p>
        )}
      </div>

      <div className="cart-item-actions" onClick={(e) => e.stopPropagation()}>
        <div className="cart-qty-control">
          <button
            className="cart-qty-btn"
            onClick={onDecrease}
            disabled={isOutOfStock || item.quantity <= 1 || isUpdating}
          >
            <Minus size={14} />
          </button>

          {isUpdating ? (
            <div className="quantity-loading-spinner"></div>
          ) : (
            <span className="cart-qty-value">{item.quantity}</span>
          )}

          <button
            className="cart-qty-btn"
            onClick={onIncrease}
            disabled={isOutOfStock || isUpdating}
          >
            <Plus size={14} />
          </button>
        </div>
        <button
          className="cart-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="حذف المنتج"
          disabled={isUpdating}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}
