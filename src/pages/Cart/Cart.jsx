import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";
import { addToCart, getCart, removeFromCart } from "../../services/cart";
import { getSessionId, isUserLogged, responseMessageSetter } from "../../services/authService";
import { 
  addToWishlist, 
  getCurrentUser, 
  isClient, 
  removeFromWishlist,
  getWishlist
} from "../../services/users";
import { placeOrder } from "../../services/order";
import { buildImgSrc } from "../../services/imageUtils";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

export default function CartPage() {
  const navigate = useNavigate();
  
  /* ── State ── */
  const [groups, setGroups] = useState([]);
  const [summary, setSummary] = useState({
    total_price: 0,
    total_items: 0,
    is_cart_empty: true,
  });
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState({ success: false, message: "" });
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const SHIPPING = (summary.total_items || 0) > 0 ? 50 : 0;
  const total = (summary.total_price || 0) + SHIPPING;

  /* ════ 1. FETCH WISHLIST FROM SERVER ════ */
  const fetchWishlistFromServer = useCallback(async () => {
    try {
      setWishlistLoading(true);
      
      const currentUser = getCurrentUser();
      
      if (!currentUser || !isClient()) {
        setWishlist([]);
        setWishlistLoading(false);
        return;
      }
      
      // Fetch fresh wishlist from server
      const res = await getWishlist(setActionMsg);
      
      if (!res.ok) {
        console.error('Failed to fetch wishlist');
        // Fallback to localStorage
        const userWishlist = currentUser.wishlist || [];
        setWishlist(userWishlist);
        setWishlistLoading(false);
        return;
      }
      
      const json = await res.json();
      console.log('Wishlist API response:', json);
      
      // Handle different response structures
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
      
      const validWishlist = serverWishlist.filter(item => 
        item && (item.productId || item.product || item._id)
      );
      
      setWishlist(validWishlist);
      
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      const currentUser = getCurrentUser();
      const userWishlist = currentUser?.wishlist || [];
      setWishlist(userWishlist);
    } finally {
      setWishlistLoading(false);
    }
  }, []);

  /* ════ 2. GET CART ════ */
  async function fetchCart() {
    try {
      setLoading(true);
      const res = await getCart(setActionMsg);
      const json = await res.json();
      console.log("getCart response => ", json);

      if (!res.ok) {
        return responseMessageSetter(false, json.message || "خطأ فى جلب منتجات الكارت", setActionMsg);
      }

      if (json.data?.products) {
        if (json.data.products.length > 0) {
          console.log("the products groups => ", json.data.products);
          setGroups(json.data.products);
        }
        setSummary(json.data.summary || {});
      }

    } catch (err) {
      console.error("fetchCart error:", err);
      responseMessageSetter(false, err.message || "خطأ فى جلب منتجات الكارت", setActionMsg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCart();
    fetchWishlistFromServer();
  }, [fetchWishlistFromServer]);

  /* ════ 3. ADD TO CART ════ */
  const handleAddToCart = async (product_id) => {
    try {
      const res = await addToCart(product_id, setActionMsg);
      const json = await res.json();
      
      if (json.success) {
        responseMessageSetter(true, json.message, setActionMsg);
        fetchCart();
      } else {
        responseMessageSetter(false, json.message || "خطأ فى إضافة منتج للكارت", setActionMsg);
      }
    } catch (err) {
      console.error("addToCart error:", err);
      responseMessageSetter(false, err.message || "خطأ فى إضافة منتج للكارت", setActionMsg);
    }
  }

  /* ════ 4. REMOVE / DECREASE ════ */
  async function removeItem(productId, storeId, removeAll = false) {
    try {
      const res = await removeFromCart(productId, storeId, removeAll, setActionMsg);
      const json = await res.json();

      if (!res.ok) {
        return responseMessageSetter(false, json.message || `${removeAll ? "تم حذف المنتج" : "تم انقاص الكمية"}`, setActionMsg);
      }

      responseMessageSetter(true, json.message || "تم التعديل ✓", setActionMsg);
      fetchCart();
    } catch (err) {
      console.error("removeItem error:", err);
    }
  }

  /* ════ 5. PLACE ORDER ════ */
  async function placeOrderHandler() {
    try {
      const res = await placeOrder(setActionMsg);
      const json = await res.json();
      
      if (res.ok) {
        console.log("placeOrder response => ", json);
        responseMessageSetter(true, json.message, setActionMsg);
        setTimeout(() => {
          navigate("/shipping/info", {
            state: {
              orderId: json.order._id,
              subtotal: summary.total_price,
              shipping: SHIPPING,
              total: total
            }
          });
        }, 3000);
      } else {
        responseMessageSetter(false, json.message || "حدث خطأ أثناء تأكيد الطلب", setActionMsg);
      }
    } catch (err) {
      console.error("placeOrder error:", err);
    }
  }

  /* ════ 6. REMOVE FROM WISHLIST ════ */
  const removeFromWishlistHandler = async (prod_id) => {
    try {
      const res = await removeFromWishlist(prod_id, setActionMsg);
      
      if (!res.ok) {
        let errorMessage = "خطأ فى الإزالة من قائمة الرغبات";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorMessage = res.statusText || errorMessage;
        }
        
        if (res.status === 404) {
          await fetchWishlistFromServer();
          responseMessageSetter(true, "تمت الإزالة بنجاح", setActionMsg);
          return;
        }
        
        return responseMessageSetter(false, errorMessage, setActionMsg);
      }

      let json;
      try {
        json = await res.json();
      } catch (parseError) {
        console.error("Failed to parse success response:", parseError);
        await fetchWishlistFromServer();
        responseMessageSetter(true, "تمت الإزالة بنجاح", setActionMsg);
        return;
      }

      console.log('Remove from wishlist response:', json);

      // Handle different response structures
      let updatedWishlist = [];
      let userData = null;
      
      if (json.data?.user?.wishlist) {
        updatedWishlist = json.data.user.wishlist;
        userData = json.data.user;
      } else if (json.user?.wishlist) {
        updatedWishlist = json.user.wishlist;
        userData = json.user;
      } else if (json.data?.wishlist) {
        updatedWishlist = json.data.wishlist;
        userData = json.data.user;
      } else if (json.wishlist) {
        updatedWishlist = json.wishlist;
      }
      
      setWishlist(updatedWishlist);
      
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      }
      
      // Refresh from server to ensure consistency
      await fetchWishlistFromServer();
      
      responseMessageSetter(true, json.message || "تمت الإزالة بنجاح", setActionMsg);
      
    } catch (err) {
      console.error('Remove from wishlist error:', err);
      responseMessageSetter(
        false,
        err.message || "حدث خطأ أثناء الإزالة من قائمة الرغبات",
        setActionMsg
      );
    }
  };

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  if (loading) {
    return (
      <p style={{ textAlign: "center", color: "#888", padding: 40 }}>
        جاري تحميل السلة...
      </p>
    );
  }

  if (summary.is_cart_empty) {
    return (
      <p style={{ textAlign: "center", color: "#888", padding: 40 }}>
        السلة فاضية 🛒
      </p>
    );
  }

  return (
    <div className="cart-page">
      {/* ── Toast Message ── */}
      {actionMsg.message && (
        <div
          className={`response-message ${actionMsg.success ? "success-message" : "error-message"}`}
        >
          {actionMsg.message}
        </div>
      )}

      {/* ── Header ── */}
      <div className="cart-header">
        <div className="cart-header-brand">
          <span className="cart-header-title">سلتي</span>
          <span className="cart-header-icon">🛒</span>
        </div>
        <p className="cart-header-subtitle">
          مراجعة المنتجات المضافة وتعديل الكميات قبل الدفع.
        </p>
      </div>

      {/* ── Main layout ── */}
      <div className="cart-layout">
        {/* ════ LEFT: Order Summary ════ */}
        <aside className="cart-summary-card">
          <h2 className="cart-summary-title">ملخص الطلب</h2>

          <div className="cart-summary-row">
            <span className="cart-summary-label">المجموع الفرعي</span>
            <span className="cart-summary-value">
              {(summary.total_price || 0).toLocaleString("ar-EG")} ج
            </span>
          </div>

          <div className="cart-summary-row">
            <span className="cart-summary-label">الشحن</span>
            <span className="cart-summary-value">{SHIPPING} ج</span>
          </div>

          <hr className="cart-summary-divider" />

          <div className="cart-summary-total-row">
            <span className="cart-summary-total-label">الإجمالي</span>
            <span className="cart-summary-total-value">
              {total.toLocaleString("ar-EG")} ج
            </span>
          </div>

          <button
            className="cart-checkout-btn"
            onClick={() => placeOrderHandler()}
            disabled={summary.is_cart_empty}
            style={{
              opacity: summary.is_cart_empty ? 0.5 : 1,
              cursor: summary.is_cart_empty ? "not-allowed" : "pointer",
            }}
          >
            إتمام الشراء
          </button>
        </aside>

        {/* ════ RIGHT: Cart Items ════ */}
        <section className="cart-items-section">
          {groups.map((group, gi) => (
            <div key={gi} className="cart-seller-group">
              <div className="cart-seller-header">
                <span className="cart-seller-name">{group.store_name}</span>
                <div className="cart-seller-avatar">
                  {group.store_name?.[0]}
                </div>
              </div>

              {group.products.map((item, index) => (
                <CartItem
                  key={item.product_id || index}
                  store_id={group.store_id}
                  item={item}
                  onIncrease={() => handleAddToCart(item.product_id)}
                  onDecrease={() => removeItem(item.product_id, group.store_id, false)}
                  onRemove={() => removeItem(item.product_id, group.store_id, true)}
                />
              ))}
            </div>
          ))}
        </section>
      </div>

      {/* ════ WISHLIST ════ */}
      {wishlist && wishlist.length > 0 && (
        <div className="cart-wishlist-section">
          <div className="cart-wishlist-header">
            <h2 className="cart-wishlist-title">قائمة الرغبات</h2>
            <p className="cart-wishlist-subtitle">منتجات تودين شراؤها لاحقاً.</p>
          </div>

          <div className="cart-wishlist-grid">
            {wishlist.slice(0, 4).map((w, index) => (
              <WishlistCard
                key={`${w.productId || w._id}-${index}`}
                item={w}
                onAdd={() => handleAddToCart(String(w.productId || w._id))}
                onRemove={() => removeFromWishlistHandler(String(w.productId || w._id))}
              />
            ))}

            {wishlist.length > 4 && (
              <button className="cart-wishlist-more" onClick={() => navigate("/Wishlist")}>
                <div className="cart-wishlist-more-icon">+</div>
                <span>عرض المزيد</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   CART ITEM
══════════════════════════════════════ */
function CartItem({ item, store_id, onIncrease, onDecrease, onRemove }) {
  const navigate = useNavigate();
  
  const imageUrl = item.image ? buildImgSrc(item.image) : null;
  
  return (
    <div className="cart-item" onClick={() => navigate(`/products/${item.product_id}`)}>
      <div className="cart-item-image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            style={{ width: 70, height: 70, objectFit: "contain" }}
          />
        ) : (
          "🛍️"
        )}
      </div>

      <div className="cart-item-info">
        <p className="cart-item-name">{item.name}</p>
        <p className="cart-item-price">
          {(item.subtotal || 0).toLocaleString("ar-EG")} ج
        </p>
        {item.stock_warning && (
          <p style={{ color: "#E91E63", fontSize: 11, margin: 0 }}>
            {item.stock_warning}
          </p>
        )}
      </div>

      <div className="cart-qty-control">
        <button className="cart-qty-btn" onClick={(e) => { e.stopPropagation(); onIncrease(); }}>
          +
        </button>
        <span className="cart-qty-value">{item.quantity}</span>
        <button className="cart-qty-btn" onClick={(e) => { e.stopPropagation(); onDecrease(); }}>
          −
        </button>
      </div>

      <button className="cart-delete-btn" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
        🗑️
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   WISHLIST CARD
══════════════════════════════════════ */
function WishlistCard({ item, onAdd, onRemove }) {
  const navigate = useNavigate();
  
  if (!item) return null;
  
  const productId = item.productId || item._id || item.product;
  const imageUrl = item.image ? buildImgSrc(item.image) : null;
  const productName = item.productName || item.name || 'منتج';
  const price = item.price || 0;
  const inStock = item.inStock !== undefined ? item.inStock : true;
  
  return (
    <div 
      className="cart-wishlist-card"
      onClick={() => navigate(`/products/${productId}`)}
    >
      <div className="cart-wishlist-image-wrapper">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            className="cart-wishlist-image" 
            alt={productName}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div style="font-size: 40px; display: flex; align-items: center; justify-content: center; height: 100%;">🛍️</div>';
            }}
          />
        ) : (
          <div style={{ fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            🛍️
          </div>
        )}
        <button 
          className="cart-wishlist-heart-btn" 
          onClick={(e) => { 
            e.stopPropagation(); 
            e.preventDefault(); 
            onRemove(); 
          }}
        >
          ♥
        </button>
      </div>
      <div className="cart-wishlist-info">
        <p className="cart-wishlist-name">{productName}</p>
        <div>
          <p className="cart-wishlist-price">{price} ج</p>
          <span className={`cart-wishlist-inStock ${inStock ? "in-stock" : "out-of-stock"}`}>
            {inStock ? "متوفر" : "نفذ"}
          </span>
        </div>
        <button 
          className="cart-wishlist-add-btn" 
          onClick={(e) => { 
            e.stopPropagation(); 
            e.preventDefault(); 
            if (inStock) onAdd(); 
          }}
          disabled={!inStock}
        >
          <span>🛒</span> أضف للسلة
        </button>
      </div>
    </div>
  );
}