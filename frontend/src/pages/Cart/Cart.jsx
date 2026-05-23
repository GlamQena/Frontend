"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";
import { addToCart, getCart, removeFromCart } from "../../services/cart";
import { getSessionId, isUserLogged, responseMessageSetter } from "../../services/authService";
import { addToWishlist, getCurrentUser, isClient, removeFromWishlist } from "../../services/users";
import { placeOrder } from "../../services/order";

const BASE_URL = "http://127.0.0.1:8080";

const initialWishlist = () => {
  if (isUserLogged()){
    const user= getCurrentUser();
    if(!isClient())
      return null;
    return user.wishlist;
  }

  return null;
}

export default function CartPage() {
  const navigate= useNavigate();
  /* ── State ── */
  const [groups, setGroups] = useState([]); //cart products
  const [summary, setSummary] = useState({
    total_price: 0,
    total_items: 0,
    is_cart_empty: true,
  });
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState({success: false, message: ""});

  const [wishlist, setWishlist] = useState(initialWishlist);

  const SHIPPING = (summary.total_items || 0) > 0 ? 50 : 0;
  const total = (summary.total_price || 0) + SHIPPING ;  //- appliedDiscount;

  /* ════ 1. GET CART ════ */
  async function fetchCart() {
    try {
      setLoading(true);
      const res = await getCart(setActionMsg);
      const json = await res.json();
      console.log("getCart response => ", json);

      if(!res.ok)
        return responseMessageSetter(false, json.message || "خطأ فى جلب منتجات الكارت", setActionMsg);

      if (json.data.products) {
        if(json.data.products.length > 0){
          console.log("the products groups => ", json.data.products);
          setGroups(json.data.products);
        }

        setSummary(json.data.summary || {});
        // responseMessageSetter(true, json.message, setActionMsg);
      }

    } catch (err) {
      console.error("fetchCart error:", err);
      responseMessageSetter(false, err.message || "خطأ فى جلب منتجات الكارت" , setActionMsg);

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCart();
  }, []);

  /* ════ 2. ADD TO CART (زيادة كمية أو إضافة من الـ Wishlist) ════ */
  const handleAddToCart = async (product_id) => {
    try{
      const res= await addToCart(product_id, setActionMsg)

      const json = await res.json();
      if (json.success) {
        responseMessageSetter(true, json.message, setActionMsg);
        fetchCart();
      }
      else{
        responseMessageSetter(false, json.message || "خطأ فى إضافة منتج للكارت" , setActionMsg);
      }

    }catch (err) {
      console.error("addToCart error:", err);
      responseMessageSetter(false, err.message || "خطأ فى إضافة منتج للكارت" , setActionMsg);
    } 
  }

  /* ════ 3. REMOVE / DECREASE ════ */
  async function removeItem(productId, storeId, removeAll = false) {
    try {
      const res = await removeFromCart(productId, storeId, removeAll , setActionMsg);
      const json = await res.json();

      if(!res.ok)
        return responseMessageSetter(false, json.message || `${removeAll ? "تم حذف المنتج" : "تم انقاص الكمية"}`, setActionMsg);

      responseMessageSetter(true, json.message || "تم التعديل ✓", setActionMsg);
      fetchCart();
    } catch (err) {
      console.error("removeItem error:", err);
    }
  }

  /* ════ 4. PLACE ORDER ════ */
  async function placeOrderHandler() {
    try {      
      const res = await placeOrder(setActionMsg);
      const json = await res.json();
      if (res.ok) {
        console.log("placeOrder response => ", json);
        responseMessageSetter(true, json.message, setActionMsg);
        setTimeout(()=>{
          navigate("/shipping/info", {state: {orderId: json.order._id, subtotal: summary.total_price, shipping: SHIPPING, total: total}});
        }, 3000);
      } else {
        responseMessageSetter(false, json.message || "حدث خطأ أثناء تأكيد الطلب", setActionMsg);
      }
    } catch (err) {
      console.error("placeOrder error:", err);
    }
  }

    const removeFromWishlistHandler = async (index, prod_id) => {
    try{
      const res= await removeFromWishlist(prod_id, setActionMsg);
      const json= await res.json();

      if(!res.ok)
        return responseMessageSetter(false, json.message || "خطأ فى الإزالة من قائمة الرغبات", setActionMsg);

      const updatedWishlist= json.foundClient.wishlist;

      setWishlist(updatedWishlist);

      localStorage.setItem("user", JSON.stringify(json.foundClient));

      responseMessageSetter(true, json.message || "تمت الإزالة بنجاح", setActionMsg);
    }catch(err){
      console.log(`${err.message || "خطأ فى الإزالة من قائمة الرغبات"}`);
    }
  }

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  if(loading)
    return(
      <p style={{ textAlign: "center", color: "#888", padding: 40 }}>
        جاري تحميل السلة...
      </p>
    );
  
  if(summary.is_cart_empty)
    return (
      <p style={{ textAlign: "center", color: "#888", padding: 40 }}>
        السلة فاضية 🛒
      </p>
    );

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
                    {group.store_name?.[0]} {/*?. is nullable operator to access array elements if its not null for safety */}
                  </div>
                </div>

                {group.products.map((item, index) => (
                  <CartItem
                    key={item.product_id || index}
                    store_id= {group.store_id}
                    item={item}
                    onIncrease={() => handleAddToCart(item.product_id)}
                    onDecrease={() =>
                      removeItem(item.product_id, group.store_id, false)
                    }
                    onRemove={() =>
                      removeItem(item.product_id, group.store_id, true)
                    }
                  />
                ))}
              </div>
            ))}
        </section>
      </div>

     {/* ════ WISHLIST ════ */}
      {(wishlist && wishlist.length !== 0) && <div className="cart-wishlist-section">
        <div className="cart-wishlist-header">
          <h2 className="cart-wishlist-title">قائمة الرغبات</h2>
          <p className="cart-wishlist-subtitle">منتجات تودين شراؤها لاحقاً.</p>
        </div>

         <div className="cart-wishlist-grid">
         {wishlist.slice(0, 4).map((w, index)  => (
            <WishlistCard
              key={`${w.productId}-${index}`}
              item={w}
              // emoji={getEmoji(w.name)}
              onAdd={() => handleAddToCart(String(w.productId))}
              onRemove={() => removeFromWishlistHandler(index, String(w.productId))}
            />
          ))}

          {/*<button className="cart-wishlist-more">
            <div className="cart-wishlist-more-icon">+</div>*/}
            {wishlist.length > 4 && (
            <button className="cart-wishlist-more" onClick={() => navigate("/Wishlist")}>
              <div className="cart-wishlist-more-icon">+</div>
              <span>عرض المزيد</span>
            </button>
                    )}
        </div>
      </div>}
    </div>
  );
}

const formattedImage = (image) => {
  if(image)
    return image.replace("uploads", BASE_URL);
  return null;
};

/* ══════════════════════════════════════
   CART ITEM
══════════════════════════════════════ */
function CartItem({ item, store_id, onIncrease, onDecrease, onRemove }) {
  const navigate= useNavigate();
  return (
    <div className="cart-item" onClick={() => navigate(`/products/${item.product_id}`)}>
      <div className="cart-item-image">
        {item.image ? (
          <img
            src={formattedImage(item.image)}
            alt={item.name}
            style={{ width: 70, height: 70, objectFit: "contain" }}
          />
        ) : (
          "🛍️"
        )}
      </div>

      <div className="cart-item-info">
        {/* <p className="cart-item-brand">{item.description || ""}</p> */}
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
        <button className="cart-qty-btn" onClick={(e) => {e.stopPropagation(); onIncrease()}}>
          +
        </button>
        <span className="cart-qty-value">{item.quantity}</span>
        <button className="cart-qty-btn" onClick={(e) => {e.stopPropagation(); onDecrease()}}>
          −
        </button>
      </div>

      <button className="cart-delete-btn" onClick={(e) => {e.stopPropagation(); onRemove()}}>
        🗑️
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   WISHLIST CARD
══════════════════════════════════════ */
function WishlistCard({ item, onAdd, onRemove }) {

  return (
    <div className="cart-wishlist-card">
      <div className="cart-wishlist-image-wrapper">
        <img src={formattedImage(item.image)} className="cart-wishlist-image" alt={item.productName}/>
        <button className="cart-wishlist-heart-btn" onClick={onRemove}>
          ♥
        </button>
      </div>
      <div className="cart-wishlist-info">
        {/* <p className="cart-wishlist-brand">{item.brand}</p> */}
        <p className="cart-wishlist-name">{item.productName}</p>
        <div>
          <p className="cart-wishlist-price">{item.price} ج</p>
          <span className={`cart-wishlist-inStock ${item.inStock ? "in-stock" : "out-of-stock"}`}>{item.inStock ? "متوفر" : "نفذ"}</span>
        </div>
        <button className="cart-wishlist-add-btn" onClick={onAdd}>
          <span>🛒</span> أضف للسلة
        </button>
      </div>
    </div>
  );
}