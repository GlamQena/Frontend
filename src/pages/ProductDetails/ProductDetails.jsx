import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaHeart,
  FaRegHeart,
  FaShoppingBag,
  FaStar,
  FaChevronLeft,
  FaChevronRight,
  FaLeaf
} from "react-icons/fa";
import "./ProductDetails.css";
import "../../components/Navbar";
import { useCart } from "./CartContext";
import { addToWishlist, getCurrentUser, removeFromWishlist } from "../../services/users";
import { isUserLogged, responseMessageSetter } from "../../services/authService";
import { getProfile } from "../../services/profileService";
import { getProductById } from "../../services/products";
import { buildImgSrc } from "../../services/imageUtils";

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const { cart, addToCartHandler, refreshCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [responseMessage, setResponseMessage] = useState({ success: false, message: "" });
  const BASE_URL = process.env.EXPRESS_APP_API_URL || "https://glamqena-backend.vercel.app";

  const handleAuthError = (error) => {
    if (error.code === "AUTH_EXPIRED" || error.message?.includes("session")) {
      setResponseMessage({ 
        success: false, 
        message: "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى" 
      });
      
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      
      redirectTimeoutRef.current = setTimeout(() => {
        navigate('/login');
      }, 4000);
      
      return true;
    }
    return false;
  };

  const checkWishlistStatus = useCallback((productId, user) => {
    if (!user || !user.wishlist || !Array.isArray(user.wishlist)) return false;
    
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

  const fetchProductDetails = useCallback(async () => {
    try {
      if(isLoading)
        return
      setIsLoading(true);
      
      const data = await getProductById(productId);
      
      if (data.success) {
        const fetchedProduct = data.data.product;
        let user;

        try {
          const response = await getProfile();
          const profileData = await response.json();
    
          if (!response.ok) {
            console.error(`error fetching user profile from server: ${JSON.stringify(profileData)}`);
            user = getCurrentUser();
          } else {
            user = profileData.user;
            localStorage.setItem("user", JSON.stringify(user));
          }
        } 
        catch(e) {
          if(!handleAuthError(e)){
            console.error("error fetching user profile from server: ", JSON.stringify(e));
            user = getCurrentUser();
          }
        }

        const inWishlist = checkWishlistStatus(fetchedProduct._id, user);
        
        setProduct({
          ...fetchedProduct,
          addedToWishlist: inWishlist
        });
        setQuantity(1);
        setReviews(data.data.reviews);
      } else {
        responseMessageSetter(false, data.message || "خطأ فى تحميل تفاصيل المنتج", setResponseMessage);
      }
    } catch (err) {
      console.log("Fetch product details error:", JSON.stringify(err));
      responseMessageSetter(false, err.message || "خطأ في جلب تفاصيل المنتج", setResponseMessage);
    }finally{
      setIsLoading(false);
    }
  }, [productId, checkWishlistStatus]);

  useEffect(() => {
    refreshCart();
    fetchProductDetails();
    window.scrollTo({top: 0, behavior: "smooth"});

    return ()=>{
      if(redirectTimeoutRef.current)
        clearTimeout(redirectTimeoutRef.current);
    }
  }, [fetchProductDetails]);

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
    setIsWishlistLoading(true);
    try {
      const res = await addToWishlist(productId);
      const data = await res.json();

      if (!res.ok) {
        responseMessageSetter(false, data.message || "خطأ فى الإضافة لقائمة الرغبات", setResponseMessage);
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      setProduct(prev => prev ? { ...prev, addedToWishlist: true } : prev);
    } catch (err) {
      if(!handleAuthError(err)){
        console.log(`Error adding product to wishlist: ${JSON.stringify(err)}`);
        responseMessageSetter(false, err.message || "خطأ فى الإضافة لقائمة الرغبات", setResponseMessage);
      }
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const removeFromWishlistHandler = async () => {
    setIsWishlistLoading(true);
    try {
      const res = await removeFromWishlist(productId);
      const data = await res.json();

      if (!res.ok) {
        responseMessageSetter(false, data.message || "خطأ فى الإزالة من قائمة الرغبات", setResponseMessage);
      }

      localStorage.setItem("user", JSON.stringify(data.data.user));
      setProduct(prev => prev ? { ...prev, addedToWishlist: false } : prev);
    } catch (err) {
      if(!handleAuthError(err)){
        console.log("error removing product from wishlist:", JSON.stringify(err));
        responseMessageSetter(false, "خطأ فى الإزالة من قائمة الرغبات", setResponseMessage);
      }
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    
    if (!isUserLogged()) {
      responseMessageSetter(false, "يرجى تسجيل الدخول أولاً لإضافة المنتجات إلى المفضلة", setResponseMessage);
      return;
    }
    
    if (isWishlistLoading) return;

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
          <FaStar key={i} color="var(--gold-main)" /> : 
          <FaStar key={i} color="var(--text-placeholder)" />
      );
    }
    return stars;
  };

  const canAddToCart = () => {
    return product && quantity <= product.stock && product.stock > 0;
  };

  if (!product) {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "var(--text-primary)" }}>
        {!responseMessage.message ? 
          <div className="loading">جاري تحميل البيانات...</div> : 
          <p className={`response-message ${responseMessage.success ? "success-message" : "error-message"}`}> 
            {responseMessage.message}
          </p>
        }
      </div>
    );
  }

  const images = product.images?.map((img) => 
    img.replace(/\\/g, "/").replace("uploads", BASE_URL)
  );

  const formatReviewDate = (dateString) => {
    if (!dateString) return "حديثاً";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
  };

  const shouldShowSkinType = product.skinType && product.skinType !== "عادية";
  const shouldShowIngredients = product.ingredients && product.ingredients.length > 0;
  
  const currentCartQuantity = cart[productId] || 0;
     
  return (
    <div className="page" dir="rtl">
      <div className="details-container">
        <div className="image-box">
          <button
            className="slide-btn prev"
            onClick={() =>
              setCurrentImage(currentImage === 0 ? images.length - 1 : currentImage - 1)
            }
            aria-label="الصورة السابقة"
          >
            <FaChevronRight />
          </button>

          <img
            src={images[currentImage]}
            alt={product.name}
            className="main-image"
          />

          <button
            className="slide-btn next"
            onClick={() =>
              setCurrentImage(currentImage === images.length - 1 ? 0 : currentImage + 1)
            }
            aria-label="الصورة التالية"
          >
            <FaChevronLeft />
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

        {/* Info Section */}
        <div className="info">
          <span className="breadcrumb">
          <span className="breadcrumb-store">
            <span className="breadcrumb-store-name">
              {product.owner_store_id?.store_name || "متجر جلام قنا"}
            </span>
            
            {product.owner_store_id?.logo ? (
              <img 
                src={buildImgSrc(product.owner_store_id?.logo, "store")} 
                alt={product.owner_store_id?.store_name || "متجر جلام قنا"}
                className="breadcrumb-store-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.querySelector('.breadcrumb-store-icon').style.display = 'flex';
                }}
              />
            ) : (
              <span className="breadcrumb-store-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
            )}
          </span>
        </span>
          
          <h1 className="title ltr">
            {product.name} {product.volume ? `- ${product.volume} مل` : ''}
          </h1>

          <div className="rating">
            <div className="stars">
              {rateStars(Number(product.average_rating))}
            </div>
            <span>{product.average_rating || '0.0'}</span>
            <span className="rtl">({product.total_rates || 0} تقييم)</span>
          </div>   

          <div className="price-wrapper">
            <span className="current-price">{product.price} ج.م</span>
          </div>

          <div className="stock-info">
            <span>المتاح بالمخزن: {product.stock} قطعه</span>
            {product.stock < 5 && product.stock > 0 && (
              <span className="low-stock"> متبقي القليل فقط!</span>
            )}
            {product.stock === 0 && (
              <span className="out-of-stock"> غير متوفر حالياً</span>
            )}
          </div>

          {(shouldShowSkinType || shouldShowIngredients) && (
            <div className="details-specs">
              {shouldShowSkinType && (
                <div className="details-spec">
                  <span className="details-spec-label">نوع البشرة المناسب:</span>
                  <strong>{product.skinType}</strong>
                </div>
              )}
              {shouldShowIngredients && (
                <div className="details-spec">
                  <FaLeaf style={{ color: "var(--success-main)", marginLeft: "4px" }} size={14} />
                  <span className="details-spec-label">المكونات:</span>
                  <strong>{product.ingredients.join(', ')}</strong>
                </div>
              )}
            </div>
          )}

          <div className="desc">
            <h3>وصف المنتج</h3>
            <p>{product.description || "لا يوجد وصف متاح لهذا المنتج حالياً."}</p>
          </div>

          {currentCartQuantity > 0 && (
            <div className="cart-status-badge">
              <FaShoppingBag size={14} />
              <span>لديك <strong>{currentCartQuantity}</strong> من هذا المنتج بالفعل في سلة المشتريات.</span>
            </div>
          )}

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
                  <FaHeart color="var(--pink-main)" size={20} /> : 
                  <FaRegHeart size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="break"></div>
      
      {responseMessage.message && (
        <p className={`response-message ${responseMessage.success ? "success-message" : "error-message"}`}>
          {responseMessage.message}
        </p>
      )}

      {reviews && reviews.length > 0 && (
        <div className="reviews">
          <div className="reviews-header">
            <h3>تقييمات العملاء</h3>
            <span className="view-all">عرض الكل</span>
          </div>

          <div className="reviews-grid">
            {reviews.map((review) => {
              const client = review.client_id || {};
              const firstName = client.firstName || '';
              const lastName = client.lastName || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'عميل مميز';
              const avatarLetter = firstName?.[0] ? firstName[0].toUpperCase() : 'ع';
              const avatarUrl = client.avatar || client.image;
              
              return (
                <div className="review-card" key={review._id}>
                  <div className="review-top">
                    <div className="review-user-row">
                      <div className="user-info-group">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={fullName} className="avatar-img" />
                        ) : (
                          <div className="avatar-initial">{avatarLetter}</div>
                        )}
                        <div className="user-details">
                          <h4>{fullName}</h4>
                          <span>{formatReviewDate(review.createdAt)}</span>
                        </div>
                      </div>
                      <div className="stars">
                        {rateStars(review.rate)}
                      </div>
                    </div>
                  </div>
                  <p>{review.comment || "لا يوجد تعليق مع هذا التقييم."}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}