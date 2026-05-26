import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../components/ThemeProvider";
import { useParams } from "react-router-dom";
import { 
  FaHeart,
  FaRegHeart,
  FaShoppingBag,
  FaStar,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import "./ProductDetails.css";
import "../../components/Navbar"
import { useCart } from "./CartContext";
import { addToWishlist, getCurrentUser, removeFromWishlist } from "../../services/users";
import { isUserLogged, responseMessageSetter } from "../../services/authService";

export default function ProductDetails() {
  const { productId } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const { cart, addToCartHandler } = useCart();
  const [responseMessage, setResponseMessage] = useState({ success: false, message: "" });

  // Helper function to check if product is in wishlist
  const checkWishlistStatus = useCallback((productId, user) => {
    if (!user || !user.wishlist || !Array.isArray(user.wishlist)) return false;
    
    // Handle different possible wishlist structures
    return user.wishlist.some(item => {
      if (typeof item === 'object' && item.productId) {
        return item.productId.toString() === productId.toString();
      }
      if (typeof item === 'object' && item._id) {
        return item._id.toString() === productId.toString();
      }
      if (typeof item === 'string') {
        return item.toString() === productId.toString();
      }
      return false;
    });
  }, []);

  // Fetch product details
  const fetchProductDetails = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8080/products/${productId}`);
      const data = await res.json();
      
      if (data.success) {
        const fetchedProduct = data.data.product;
        console.log("fetched product data=> ", data);
        console.log("fetched product => ", fetchedProduct);

        const user = getCurrentUser();
        const inWishlist = checkWishlistStatus(fetchedProduct._id, user);
        
        setProduct({
          ...fetchedProduct,
          addedToWishlist: inWishlist
        });
        setQuantity(cart[fetchedProduct._id] || 1);
        setReviews(data.data.reviews);
      } else {
        console.log("error fetching product details...", data.message);
        responseMessageSetter(false, data.message || "خطأ فى تحميل تفاصيل المنتج", setResponseMessage);
      }
    } catch (err) {
      console.log("Fetch error:", err);
      responseMessageSetter(false, "خطأ في الاتصال بالخادم", setResponseMessage);
    }
  }, [productId, cart, checkWishlistStatus]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  // Update wishlist status when user data changes (e.g., from other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' && product) {
        const updatedUser = JSON.parse(e.newValue);
        const inWishlist = checkWishlistStatus(product._id, updatedUser);
        setProduct(prev => prev ? { ...prev, addedToWishlist: inWishlist } : prev);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [product, checkWishlistStatus]);

  const addToWishlistHandler = async () => {
    if (!isUserLogged()) {
      responseMessageSetter(false, "يرجى تسجيل الدخول أولاً", setResponseMessage);
      return false;
    }

    setIsWishlistLoading(true);
    try {
      const res = await addToWishlist(productId, setResponseMessage);
      const data = await res.json();

      if (!res.ok) {
        responseMessageSetter(false, data.message || "خطأ فى الإضافة لقائمة الرغبات", setResponseMessage);
        return false;
      }

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Update product state
      setProduct(prev => prev ? { ...prev, addedToWishlist: true } : prev);
      
      responseMessageSetter(true, data.message || "تمت الإضافة إلى قائمة الرغبات بنجاح", setResponseMessage);
      return true;
    } catch (err) {
      console.log(err.message);
      responseMessageSetter(false, "خطأ فى الإضافة لقائمة الرغبات", setResponseMessage);
      return false;
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const removeFromWishlistHandler = async () => {
    if (!isUserLogged()) {
      responseMessageSetter(false, "يرجى تسجيل الدخول أولاً", setResponseMessage);
      return false;
    }

    setIsWishlistLoading(true);
    try {
      const res = await removeFromWishlist(productId, setResponseMessage);
      const data = await res.json();

      if (!res.ok) {
        responseMessageSetter(false, data.message || "خطأ فى الإزالة من قائمة الرغبات", setResponseMessage);
        return false;
      }

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Update product state
      setProduct(prev => prev ? { ...prev, addedToWishlist: false } : prev);
      
      responseMessageSetter(true, data.message || "تمت الإزالة من قائمة الرغبات بنجاح", setResponseMessage);
      return true;
    } catch (err) {
      console.log(err.message);
      responseMessageSetter(false, "خطأ فى الإزالة من قائمة الرغبات", setResponseMessage);
      return false;
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation(); // Prevent any parent event handlers
    
    if (!isUserLogged()) {
      responseMessageSetter(false, "يرجى تسجيل الدخول أولاً لإضافة المنتجات إلى المفضلة", setResponseMessage);
      return;
    }

    if (isWishlistLoading) return; // Prevent double clicks

    if (product.addedToWishlist) {
      await removeFromWishlistHandler();
    } else {
      await addToWishlistHandler();
    }
  };

  const rateStars = (rate) => {
    const stars = [];
    const numericRate = Number(rate) || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= numericRate ? 
          <FaStar key={i} color="#ffd700" /> : 
          <FaStar key={i} color="#e4e5e9" />
      );
    }
    return stars;
  };

  const canAddToCart = () => {
    return product && quantity <= product.stock && product.stock > 0;
  };

  if (!product) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        {!responseMessage.message ? 
          <div className="loading-spinner">Loading...</div> : 
          <p className={`response-message ${responseMessage.success ? "success-message" : "error-message"}`}> 
            {responseMessage.message}
          </p>
        }
      </div>
    );
  }

  const images = product.images?.map((img) => 
    img.replace(/\\/g, "/").replace("uploads", "http://127.0.0.1:8080")
  );
     
  return (
    <div className="page" dir="rtl">
      <div className="details-container">
        <div className="image-box">
          <button
            className="slide-btn left"
            onClick={() =>
              setCurrentImage(
                currentImage === 0
                  ? images.length - 1
                  : currentImage - 1
              )
            }
          >
            <FaChevronLeft />
          </button>

          <img
            src={images[currentImage]}
            alt={product.name}
            className="main-image"
          />

          <button
            className="slide-btn right"
            onClick={() =>
              setCurrentImage(
                currentImage === images.length - 1
                  ? 0
                  : currentImage + 1
              )
            }
          >
            <FaChevronRight />
          </button>

          <div className="thumbs">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${product.name} thumbnail ${index + 1}`}
                className={currentImage === index ? "thumb active" : "thumb"}
                onClick={() => setCurrentImage(index)}
              />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="info">
          <span className="breadcrumb">{product.store_name}</span>
          <h1 className="title ltr">{product.name}</h1>

          <div className="rating">
            <div className="stars">
              {rateStars(Number(product.average_rating))}
            </div>
            <span>{product.average_rating || '0.0'}</span>
            <span className="rtl">{product.total_rates || 0} reviews</span>
          </div>   

          <div className="price">
            <span>{product.price} ج.م</span>
          </div>

          <div className="stock-info">
            <span>المتاح: {product.stock}</span>
            {product.stock < 5 && product.stock > 0 && (
              <span className="low-stock"> لم يتبقى سوى {product.stock}!</span>
            )}
            {product.stock === 0 && (
              <span className="out-of-stock"> غير متوفر</span>
            )}
          </div>

          <div className="desc">
            {product.description || "لا يوجد وصف متاح حالياً"}
          </div>

          <div className="actions">
            <div className="qty">
              <button 
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock || product.stock === 0}
              >
                +
              </button>
              <span>{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
            </div>
            
            <button 
              className="add" 
              onClick={async () => {
                if (canAddToCart()) {
                  await addToCartHandler(productId, Number(quantity), setResponseMessage);
                } else {
                  responseMessageSetter(false, "الكمية المطلوبة غير متوفرة في المخزون", setResponseMessage);
                }
              }}
              disabled={product.stock === 0}
            >
              إضافة للسلة <FaShoppingBag />
            </button>
            
            <button 
              className="fav-btn" 
              onClick={handleToggleWishlist}
              aria-label={product.addedToWishlist ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
              disabled={isWishlistLoading}
            >
              {isWishlistLoading ? (
                <span className="loading-dots">...</span>
              ) : (
                isUserLogged() && product.addedToWishlist ? 
                  <FaHeart color="#ec4899" size={20} /> : 
                  <FaRegHeart size={20} />
              )}
            </button>
          </div>

          <div className="desc">
            <h3>توصيل سريع</h3>
            <span>يصلك خلال 24 ساعة عمل من طلبك</span>
          </div>
        </div>
      </div>
      
      <br />
      <br />
      <div className="break"></div>
      
      {responseMessage.message && (
        <p className={`response-message ${responseMessage.success ? "success-message" : "error-message"}`}>
          {responseMessage.message}
        </p>
      )}

      {product.hasReviewed && reviews && reviews.length > 0 && (
        <div className="reviews">
          <div className="reviews-header">
            <h3>تقييمات العملاء</h3>
            <span className="view-all">عرض الكل</span>
          </div>

          <div className="reviews-grid">
            {reviews.map((review) => {
              const firstNameInitial = review.client_id?.firstName?.[0] || '';
              const lastNameInitial = review.client_id?.lastName?.[0] || '';
              const avatarLetter = firstNameInitial || lastNameInitial || 'ع';
              
              const firstName = review.client_id?.firstName || '';
              const lastName = review.client_id?.lastName || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'عميل';
              
              return (
                <div className="review-card" key={review._id}>
                  <div className="review-top">
                    <div className="user">
                      <div>
                        <div className="avatar">{avatarLetter}</div>
                        <h4>{fullName}</h4>
                        <span>منذ شهر</span>
                      </div>
                      <div className="stars">
                        {rateStars(review.rate)}
                      </div>
                    </div>
                  </div>
                  <p>{review.comment}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}