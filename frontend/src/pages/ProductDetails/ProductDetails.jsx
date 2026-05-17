import React, { useState, useEffect } from "react";
import { useTheme } from "../../components/ThemeProvider";
import { useCart } from "./CartContext"; 
import { useParams } from "react-router-dom";
import { 
  FaHeart, 
  FaShoppingBag, 
  FaStar, 
  FaChevronLeft, 
  FaChevronRight,
  FaTruck
} from "react-icons/fa";
import "./ProductDetails.css";

export default function ProductDetails() {
  const { productId } = useParams();
  const { theme } = useTheme(); 
  const { addToCart } = useCart(); 
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8080/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProduct(data.data.product);
        } else {
          setProduct(null);
        }
      })
      .catch((err) => console.log("Fetch error:", err));
  }, [productId]);

  if (!product) {
    return <div className="loading-state">جاري تحميل المنتج...</div>;
  }

  const images = product.images && product.images.length > 0
    ? product.images.map((img) => img.startsWith('http') ? img : `http://localhost:8080/${img}`)
    : product.image
    ? [product.image.startsWith('http') ? product.image : `http://localhost:8080/${product.image}`]
    : ["https://via.placeholder.com/600?text=Qena+Glam"];

  const currentTheme = theme ? theme.toLowerCase() : "dark";

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 5);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          style={{ color: i <= fullStars ? "#facc15" : "#e5e7eb" }} 
        />
      );
    }
    return stars;
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    alert(`تم إضافة ${quantity} من (${product.name}) إلى السلة بنجاح!`); 
  };

  return (
    <div className={`product-page ${currentTheme}`} dir="rtl">
      <div className="product-container">
        
        
        <div className="product-media-section">
          <div className="slider-wrapper">
            {images.length > 1 && (
              <button 
                className="slider-arrow arrow-left" 
                onClick={() => setCurrentImage(currentImage === 0 ? images.length - 1 : currentImage - 1)}
              >
                <FaChevronLeft />
              </button>
            )}

            <img
              src={images[currentImage]}
              alt={product.name}
              className="slider-main-image"
            />

            {images.length > 1 && (
              <button 
                className="slider-arrow arrow-right" 
                onClick={() => setCurrentImage(currentImage === images.length - 1 ? 0 : currentImage + 1)}
              >
                <FaChevronRight />
              </button>
            )}
          </div>

          {images.length > 1 && (
            <div className="thumbnails-grid">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt=""
                  className={`thumb-item ${currentImage === index ? "active" : ""}`}
                  onClick={() => setCurrentImage(index)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="product-info-section">
          <span className="store-tag">{product.store_name}</span>
          <h1 className="product-main-title">{product.name}</h1>

          <div className="product-rating-row">
            <span className="rating-value">{product.average_rating}</span>
            <span className="reviews-count">(1,234 reviews)</span>
          </div>

          <div className="product-price-row">
            <span className="current-price">{product.price} ج.م</span>
          </div>

          <div className="product-description-box">
            {product.description || "لا يوجد وصف متاح حالياً لهذا المنتج."}
          </div>

          <div className="product-specs-grid">
            <div className="spec-card">الماركة: {product.brand || "قنا جلام"}</div>
            <div className="spec-card">النوع: {product.category_id?.name || "—"}</div>
            <div className="spec-card">الحجم: {product.size || "—"}</div>
            <div className="spec-card">اللمسة: {product.finish || "—"}</div>
          </div>

          <div className="product-actions-row">
            <div className="quantity-counter">
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            </div>
            
            {/* 4. ربط الزر بالفانكشن الجديدة لتنفيذ الإضافة */}
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              <FaShoppingBag /> إضافة للسلة 
            </button>

            <button className="wishlist-btn">
              <FaHeart />
            </button>
          </div>

          <div className="fast-shipping-banner">
            <div className="fast-shipping-content">
              <div className="shipping-header">
                <FaTruck className="shipping-truck-icon" />
                <h3>توصيل سريع</h3>
              </div>
              <span>يصلك خلال 24 ساعة عمل من تأكيد الطلب</span>
            </div>
          </div>
        </div>

      </div>

      <hr className="section-divider" />

      {/* قسم التقييمات الديناميكي بناءً على الـ reviews الراجعة من الـ API */}
      <div className="reviews-section">
        <div className="reviews-section-header">
          <h3>تقييمات العملاء</h3>
          <span 
            className="show-all-link" 
            onClick={() => setShowAll(!showAll)} 
            style={{ cursor: "pointer" }}
          >
            {showAll ? "عرض أقل" : "عرض الكل"}
          </span>
        </div>

        <div className="reviews-layout-grid">
          {product.reviews && product.reviews.length > 0 ? (
            (showAll ? product.reviews : product.reviews.slice(0, 3)).map((review, index) => {
              const userName = review.username || review.user_name || review.name || review.user?.name || "عميل مميز";
              const firstLetter = userName.charAt(0);
              
              return (
                <div className="customer-review-card" key={review._id || index}>
                  <div className="review-user-row">
                    <div className="user-avatar-meta">
                      <div className="user-avatar-circle">{firstLetter}</div>
                      <div>
                        <h4>{userName}</h4>
                        <span>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('ar-EG') : "منذ فترة"}</span>
                      </div>
                    </div>
                    <div className="review-stars-gold">
                      {renderStars(review.rating || review.rate)}
                    </div>
                  </div>
                  <p>{review.comment || review.review_text || review.text || "لم يترك العميل تعليقاً نصياً."}</p>
                </div>
              );
            })
          ) : (
            <div className="no-reviews-fallback" style={{ padding: "30px", textAlign: "center", color: "var(--sub-text)", width: "100%" }}>
              <p style={{ fontSize: "15px", fontWeight: "600" }}>لا توجد تقييمات لهذا المنتج حتى الآن.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}