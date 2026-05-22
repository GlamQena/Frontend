"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Whishlist.css";
import { addToCart } from "../../services/cart";
import {
  addToWishlist,
  getCurrentUser,
  isClient,
  removeFromWishlist,
} from "../../services/users";
import { responseMessageSetter } from "../../services/authService";

const BASE_URL = "http://127.0.0.1:8080";

const formattedImage = (image) => {
  if (image) return image.replace("uploads", BASE_URL);
  return null;
};

const initialWishlist = () => {
  const user = getCurrentUser();
  if (!user || !isClient()) return [];
  return user.wishlist || [];
};

export default function WishlistPage() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState(initialWishlist);
  const [actionMsg, setActionMsg] = useState({ success: false, message: "" });
  const [loadingId, setLoadingId] = useState(null);

  /* ════ REMOVE FROM WISHLIST ════ */
  const handleRemove = async (prod_id) => {
    try {
      setLoadingId(prod_id);
      const res = await removeFromWishlist(prod_id, setActionMsg);
      const json = await res.json();

      if (!res.ok)
        return responseMessageSetter(
          false,
          json.message || "خطأ فى الإزالة من قائمة الرغبات",
          setActionMsg
        );

      const updatedWishlist = json.foundClient.wishlist;
      setWishlist(updatedWishlist);
      localStorage.setItem("user", JSON.stringify(json.foundClient));
      responseMessageSetter(true, json.message || "تمت الإزالة بنجاح", setActionMsg);
    } catch (err) {
      responseMessageSetter(
        false,
        err.message || "خطأ فى الإزالة من قائمة الرغبات",
        setActionMsg
      );
    } finally {
      setLoadingId(null);
    }
  };

  /* ════ ADD TO CART ════ */
  const handleAddToCart = async (prod_id) => {
    try {
      setLoadingId(prod_id);
      const res = await addToCart(prod_id, setActionMsg);
      const json = await res.json();

      if (json.success) {
        responseMessageSetter(true, json.message, setActionMsg);
      } else {
        responseMessageSetter(
          false,
          json.message || "خطأ فى إضافة منتج للكارت",
          setActionMsg
        );
      }
    } catch (err) {
      responseMessageSetter(
        false,
        err.message || "خطأ فى إضافة منتج للكارت",
        setActionMsg
      );
    } finally {
      setLoadingId(null);
    }
  };

  /* ════ RENDER ════ */
  return (
    <div className="wl-page" dir="rtl">
      {/* Toast */}
      {actionMsg.message && (
        <div
          className={`response-message ${
            actionMsg.success ? "success-message" : "error-message"
          }`}
        >
          {actionMsg.message}
        </div>
      )}

      {/* Header */}
      <div className="wl-header">
        <button className="wl-back-btn" onClick={() => navigate(-1)}>
          ← رجوع
        </button>
        </div>
        <div className="wl-header-text">
          <h1 className="wl-title">
            قائمة الرغبات <span className="wl-heart">♥</span>
          </h1>
         {/* <p className="wl-subtitle">
            {wishlist.length > 0
              ? `${wishlist.length} منتج محفوظ`
              : "قائمتك فاضية"}
          </p>*/}
        </div>
      

      {/* Empty State */}
      {wishlist.length === 0 ? (
        <div className="wl-empty">
          <div className="wl-empty-icon">🤍</div>
          <p className="wl-empty-text">مفيش منتجات في القائمة دي لسه!</p>
          <button className="wl-shop-btn" onClick={() => navigate("/")}>
            تسوقي دلوقتي
          </button>
        </div>
      ) : (
        /* Grid */
        <div className="wl-grid">
          {wishlist.map((item, index) => (
            <WishlistCard
              key={`${item.productId}-${index}`}
              item={item}
              isLoading={loadingId === String(item.productId)}
              onRemove={() => handleRemove(String(item.productId))}
              onAddToCart={() => handleAddToCart(String(item.productId))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   WISHLIST CARD
══════════════════════════════════════ */
function WishlistCard({ item, isLoading, onRemove, onAddToCart }) {
  return (
    <div className={`wl-card ${isLoading ? "wl-card--loading" : ""}`}>
      {/* Remove button */}
      <button
        className="wl-card-heart"
        onClick={onRemove}
        disabled={isLoading}
        title="إزالة من قائمة الرغبات"
      >
        ♥
      </button>

      {/* Image */}
      <div className="wl-card-img-wrapper">
        {item.image ? (
          <img
            src={formattedImage(item.image)}
            alt={item.productName}
            className="wl-card-img"
          />
        ) : (
          <div className="wl-card-img-placeholder">🛍️</div>
        )}
      </div>

      {/* Info */}
      <div className="wl-card-info">
        <p className="wl-card-name">{item.productName}</p>
        <div className="wl-card-bottom">
          <p className="wl-card-price">{item.price} ج</p>
          <span
            className={`wl-card-stock ${
              item.inStock ? "wl-in-stock" : "wl-out-stock"
            }`}
          >
            {item.inStock ? "متوفر" : "نفذ"}
          </span>
        </div>
      </div>

      {/* Add to cart */}
      <button
        className="wl-card-add-btn"
        onClick={onAddToCart}
        disabled={isLoading || !item.inStock}
      >
        {isLoading ? "..." : <><span>🛒</span> أضف للسلة</>}
      </button>
    </div>
  );
}