"use client";
import { useState, useEffect } from "react";
import "./Cart.css";
import { addToCart, getCart } from "../../services/cart";
import { getSessionId, responseMessageSetter } from "../../services/authService";
import { useTheme } from '../../components/ThemeProvider';

const BASE_URL = "http://127.0.0.1:8080";

/* ─── session_id helper ─── */


/* ─── Wishlist static (مفيش endpoint ليها) ─── */
const initialWishlist = [
  { id: 101, brand: "بريستيج", name: "CERAVE Hydrating Cleanser", price: 380 },
  { id: 102, brand: "ماسة", name: "L'OREAL Lash Paradise Mascara", price: 220 },
];

const DISCOUNT_CODE = "GLAM25";
const DISCOUNT_AMOUNT = 25;

const brandEmoji = {
  MAYBELLINE: "💄",
  "THE ORDINARY": "🧴",
  "LA ROCHE-POSAY": "🧴",
  CERAVE: "🧴",
  "L'OREAL": "💄",
};
function getEmoji(str = "") {
  return (
    Object.entries(brandEmoji).find(([k]) =>
      str.toUpperCase().startsWith(k),
    )?.[1] ?? "🛍️"
  );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function CartPage() {
  /* ── State ── */
  const [groups, setGroups] = useState([]); //cart products
  const [summary, setSummary] = useState({
    total_price: 0,
    total_items: 0,
    is_cart_empty: true,
  });
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState({success: false, message: ""});

  // const [promoCode, setPromoCode] = useState("");
  // const [appliedDiscount, setAppliedDiscount] = useState(0);
  // const [promoError, setPromoError] = useState("");

  const [wishlist, setWishlist] = useState(initialWishlist);

  /* checkout modal */
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingData, setBillingData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    city: "",
    street: "",
    apartment: "",
    building: "",
    floor: "",
    country: "EG",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");

  const SHIPPING = (summary.total_items || 0) > 0 ? 50 : 0;
  const total = (summary.total_price || 0) + SHIPPING ;//- appliedDiscount;

  /* ════ 1. GET CART ════ */
  async function fetchCart() {
    try {
      setLoading(true);
      const res = await getCart();
      const json = await res.json();
      if (json.success) {
        setGroups(json.data.products || []);
        setSummary(json.data.summary || {});
        responseMessageSetter(true, json.message, setActionMsg);
      }
      else{
        responseMessageSetter(false, json.message || "خطأ فى جلب منتجات الكارت", setActionMsg);
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
      const res= await addToCart(product_id)

      const json = await res.json();
      if (json.success) {
        responseMessageSetter(true, json.message, setActionMsg);
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
      const sid = getSessionId();
      const res = await fetch(`${BASE_URL}/cart/product/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sid,
          owner_store_id: storeId,
          remove_all: removeAll,
        }),
      });
      const json = await res.json();
      responseMessageSetter(true, json.message || "تم التعديل ✓", setActionMsg);
      fetchCart();
    } catch (err) {
      console.error("removeItem error:", err);
    }
  }

  /* ════ 4. PLACE ORDER ════ */
  async function placeOrder() {
    try {
      setCheckoutLoading(true);
      const res = await fetch(`${BASE_URL}/order/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.order?._id) {
        await checkoutPayment(json.order._id);
      } else {
        responseMessageSetter(true, json.message || "حدث خطأ أثناء تأكيد الطلب", setActionMsg);
        setCheckoutLoading(false);
      }
    } catch (err) {
      console.error("placeOrder error:", err);
      setCheckoutLoading(false);
    }
  }

  /* ════ 5. CHECKOUT PAYMENT ════ */
  async function checkoutPayment(orderId) {
    try {
      /* default values للـ fields الفاضية - مطلوبة من الـ backend */
      const filledBilling = {
        first_name: billingData.first_name || "Guest",
        last_name: billingData.last_name || "User",
        email: billingData.email || "guest@example.com",
        phone_number: billingData.phone_number || "01000000000",
        city: billingData.city || "Cairo",
        street: billingData.street || "N/A",
        apartment: billingData.apartment || "1",
        building: billingData.building || "1",
        floor: billingData.floor || "1",
        country: billingData.country || "EG",
      };

      const res = await fetch(`${BASE_URL}/order/${orderId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billing_data: filledBilling,
          payment_method: paymentMethod,
        }),
      });
      const json = await res.json();

      if (paymentMethod === "wallet" && json.redirect_url) {
        window.location.href = json.redirect_url;
      } else {
        responseMessageSetter(true, json.message || "تم إرسال رابط الدفع على إيميلك ✓", setActionMsg);
        setShowCheckout(false);
        fetchCart();
      }
    } catch (err) {
      console.error("checkoutPayment error:", err);
    } finally {
      setCheckoutLoading(false);
    }
  }

  /* ── Promo ── */
  // function applyPromo() {
  //   if (promoCode.trim().toUpperCase() === DISCOUNT_CODE) {
  //     setAppliedDiscount(DISCOUNT_AMOUNT);
  //     setPromoError("");
  //   } else {
  //     setPromoError("كود الخصم غير صحيح");
  //     setAppliedDiscount(0);
  //   }
  // }

  function removeFromWishlist(id) {
    setWishlist((prev) => prev.filter((w) => w.id !== id));
  }

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div className="cart-page">
      {/* ── Toast Message ── */}
      {actionMsg.message && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#7C3AED",
            color: "white",
            padding: "10px 24px",
            borderRadius: 12,
            zIndex: 9999,
            fontWeight: 600,
            fontSize: 15,
            boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
          }}
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

          {/* {appliedDiscount > 0 && (
            <div className="cart-summary-row">
              <span className="cart-summary-label">الخصم</span>
              <span className="cart-summary-value--discount">
                {appliedDiscount}− ج
              </span>
            </div>
          )} */}

          <hr className="cart-summary-divider" />

          <div className="cart-summary-total-row">
            <span className="cart-summary-total-label">الإجمالي</span>
            <span className="cart-summary-total-value">
              {total.toLocaleString("ar-EG")} ج
            </span>
          </div>

          {/* <p className="cart-promo-label">كود الخصم</p>
          <div className="cart-promo-row">
            <button className="cart-promo-btn" onClick={applyPromo}>
              تطبيق
            </button>
            <input
              className="cart-promo-input"
              placeholder="أدخل الكود هنا"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
          </div>
          {promoError && <p className="cart-promo-error">{promoError}</p>}
          {appliedDiscount > 0 && (
            <p className="cart-promo-success">✓ تم تطبيق الكود بنجاح</p>
          )} */}

          <button
            className="cart-checkout-btn"
            onClick={() => setShowCheckout(true)}
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
          {loading ? (
            <p style={{ textAlign: "center", color: "#888", padding: 40 }}>
              جاري تحميل السلة...
            </p>
          ) : summary.is_cart_empty ? (
            <p style={{ textAlign: "center", color: "#888", padding: 40 }}>
              السلة فاضية 🛒
            </p>
          ) : (
            groups.map((group, gi) => (
              <div key={gi} className="cart-seller-group">
                <div className="cart-seller-header">
                  <span className="cart-seller-name">{group.store_name}</span>
                  <div className="cart-seller-avatar">
                    {group.store_name?.[0]}
                  </div>
                </div>

                {group.products.map((item) => (
                  <CartItem
                    key={item.product_id}
                    item={item}
                    onIncrease={() => addToCart(item.product_id)}
                    onDecrease={() =>
                      removeItem(item.product_id, group.store_id, false)
                    }
                    onRemove={() =>
                      removeItem(item.product_id, group.store_id, true)
                    }
                  />
                ))}
              </div>
            ))
          )}
        </section>
      </div>

      {/* ════ WISHLIST ════ */}
      <div className="cart-wishlist-section">
        <div className="cart-wishlist-header">
          <h2 className="cart-wishlist-title">قائمة الرغبات</h2>
          <p className="cart-wishlist-subtitle">منتجات تودين شراؤها لاحقاً.</p>
        </div>

        <div className="cart-wishlist-grid">
          {wishlist.map((w) => (
            <WishlistCard
              key={w.id}
              item={w}
              emoji={getEmoji(w.name)}
              onAdd={() => handleAddToCart(String(w.id))}
              onRemove={() => removeFromWishlist(w.id)}
            />
          ))}

          <button className="cart-wishlist-more">
            <div className="cart-wishlist-more-icon">+</div>
            <span>عرض المزيد</span>
          </button>
          {/*TODO => go to the whishlist page*/}
        </div>
      </div>

      {/* ════ CHECKOUT MODAL ════ */}
      {showCheckout && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: 32,
              width: "min(500px, 95vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              direction: "rtl",
            }}
          >
            <h2 style={{ marginBottom: 20, fontSize: 20, fontWeight: 700 }}>
              بيانات الشحن والدفع
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {[
                ["first_name", "الاسم الأول"],
                ["last_name", "الاسم الأخير"],
                ["email", "الإيميل"],
                ["phone_number", "رقم الموبايل"],
                ["city", "المدينة"],
                ["street", "الشارع"],
                ["building", "رقم المبنى"],
                ["floor", "الدور"],
                ["apartment", "رقم الشقة"],
                ["country", "الدولة"],
              ].map(([key, label]) => (
                <div
                  key={key}
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <label style={{ fontSize: 12, color: "#888" }}>{label}</label>
                  <input
                    value={billingData[key]}
                    onChange={(e) =>
                      setBillingData((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    style={{
                      border: "1.5px solid #E5E7EB",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 13,
                      outline: "none",
                      textAlign: "right",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* طريقة الدفع */}
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
                طريقة الدفع
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                {["card", "wallet"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 10,
                      cursor: "pointer",
                      border: `2px solid ${paymentMethod === m ? "#7C3AED" : "#E5E7EB"}`,
                      background: paymentMethod === m ? "#F5F0FF" : "white",
                      color: paymentMethod === m ? "#7C3AED" : "#555",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {m === "card" ? "💳 بطاقة" : "📱 محفظة"}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                onClick={placeOrder}
                disabled={checkoutLoading}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  borderRadius: 12,
                  cursor: "pointer",
                  background: "#7C3AED",
                  color: "white",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 15,
                  opacity: checkoutLoading ? 0.7 : 1,
                }}
              >
                {checkoutLoading ? "جاري المعالجة..." : "تأكيد الطلب"}
              </button>
              <button
                onClick={() => setShowCheckout(false)}
                style={{
                  padding: "13px 20px",
                  borderRadius: 12,
                  cursor: "pointer",
                  background: "white",
                  color: "#888",
                  border: "1.5px solid #E5E7EB",
                  fontWeight: 600,
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const formattedImage = (image) => {
  return image.replace("uploads", BASE_URL);
};

/* ══════════════════════════════════════
   CART ITEM
══════════════════════════════════════ */
function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="cart-item">
      <div className="cart-item-image">
        {item.images ? (
          <img
            src={`${() => formattedImage(item.images[0])}`}
            alt={item.name}
            style={{ width: 70, height: 70, objectFit: "contain" }}
          />
        ) : (
          "🛍️"
        )}
      </div>

      <div className="cart-item-info">
        <p className="cart-item-brand">{item.description || ""}</p>
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
        <button className="cart-qty-btn" onClick={onIncrease}>
          +
        </button>
        <span className="cart-qty-value">{item.quantity}</span>
        <button className="cart-qty-btn" onClick={onDecrease}>
          −
        </button>
      </div>

      <button className="cart-delete-btn" onClick={onRemove}>
        🗑️
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   WISHLIST CARD
══════════════════════════════════════ */
function WishlistCard({ item, emoji, onAdd, onRemove }) {
  return (
    <div className="cart-wishlist-card">
      <div className="cart-wishlist-image-wrapper">
        <div className="cart-wishlist-image">{emoji}</div>
        <button className="cart-wishlist-heart-btn" onClick={onRemove}>
          ♥
        </button>
      </div>
      <div className="cart-wishlist-info">
        <p className="cart-wishlist-brand">{item.brand}</p>
        <p className="cart-wishlist-name">{item.name}</p>
        <p className="cart-wishlist-price">{item.price} ج</p>
        <button className="cart-wishlist-add-btn" onClick={onAdd}>
          <span>🛒</span> أضف للسلة
        </button>
      </div>
    </div>
  );
}
