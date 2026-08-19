import { useState, useEffect, useCallback } from "react";
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
import { buildImgSrc } from "../../services/imageUtils";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

export default function WishlistPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [wishlist, setWishlist] = useState([]);
    const [actionMsg, setActionMsg] = useState({ success: false, message: "" });
    const [loadingId, setLoadingId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch wishlist from server
    const fetchWishlistFromServer = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const currentUser = getCurrentUser();
            console.log('Current user:', currentUser);
            
            setUser(currentUser);
            
            // Check if user is logged in and is a client
            if (!currentUser || !isClient()) {
                console.log('User is not a client or not logged in');
                setWishlist([]);
                setIsLoading(false);
                return;
            }
            
            console.log('Fetching wishlist from server...');
            const res = await getWishlist(setActionMsg);
            const json = await res.json();
            
            console.log('Wishlist API response:', json);
            
            if (!res.ok) {
                console.error('Failed to fetch wishlist:', json.message);
                setError(json.message || 'Failed to load wishlist');
                
                // Fallback to localStorage
                const userWishlist = currentUser.wishlist || [];
                setWishlist(userWishlist);
                setIsLoading(false);
                return;
            }
            
            let serverWishlist = [];
            
            // Handle different response structures
            if (json.data?.wishlist) {
                serverWishlist = json.data.wishlist;
            } else if (json.wishlist) {
                serverWishlist = json.wishlist;
            } else if (Array.isArray(json)) {
                serverWishlist = json;
            } else {
                serverWishlist = [];
            }
            
            console.log('Wishlist from server:', serverWishlist);
            
            // Update localStorage with fresh data if user object is returned
            if (json.user) {
                localStorage.setItem("user", JSON.stringify(json.user));
                setUser(json.user);
            } else if (json.data?.user) {
                localStorage.setItem("user", JSON.stringify(json.data.user));
                setUser(json.data.user);
            }
            
            // Validate wishlist items
            const validWishlist = serverWishlist.filter(item => 
                item && (item.productId || item.product || item._id)
            );
            
            console.log('Valid wishlist items:', validWishlist);
            setWishlist(validWishlist);
            
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            setError(error.message || 'Failed to load wishlist');
            
            // Fallback to localStorage
            const currentUser = getCurrentUser();
            const userWishlist = currentUser?.wishlist || [];
            setWishlist(userWishlist);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load wishlist on mount
    useEffect(() => {
        fetchWishlistFromServer();
    }, [fetchWishlistFromServer]);

    // WishlistPage.jsx - Updated handleRemove

    const handleRemove = async (prod_id) => {
      try {
          setLoadingId(prod_id);
          setError(null);
          
          console.log('Removing product:', prod_id);
          
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
            
            // If it's a 404, the product might already be removed
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

          console.log('Remove response:', json);

          let updatedWishlist = [];
          let userData = null;
          
          // Check for different response structures
          if (json.data?.user?.wishlist) {
              // Structure: { data: { user: { wishlist: [...] } } }
              updatedWishlist = json.data.user.wishlist;
              userData = json.data.user;
          } else if (json.user?.wishlist) {
              // Structure: { user: { wishlist: [...] } }
              updatedWishlist = json.user.wishlist;
              userData = json.user;
          } else if (json.data?.wishlist) {
              // Structure: { data: { wishlist: [...] } }
              updatedWishlist = json.data.wishlist;
          } else if (json.wishlist) {
              // Structure: { wishlist: [...] }
              updatedWishlist = json.wishlist;
          }
          
          console.log('Updated wishlist:', updatedWishlist);
          
          setWishlist(updatedWishlist);
          
          if (userData) {
              localStorage.setItem("user", JSON.stringify(userData));
              setUser(userData);
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
      } finally {
          setLoadingId(null);
      }
    };

    // Add to cart
    const handleAddToCart = async (prod_id) => {
        try {
            setLoadingId(prod_id);
            setError(null);
            
            const res = await addToCart(prod_id, setActionMsg);
            const json = await res.json();

            if (res.ok && json.success) {
                responseMessageSetter(true, json.message || "تمت الإضافة بنجاح", setActionMsg);
            } else {
                responseMessageSetter(
                    false,
                    json.message || "خطأ فى إضافة منتج للكارت",
                    setActionMsg
                );
            }
        } catch (err) {
            console.error('Add to cart error:', err);
            responseMessageSetter(
                false,
                err.message || "خطأ فى إضافة منتج للكارت",
                setActionMsg
            );
        } finally {
            setLoadingId(null);
        }
    };

    // Retry loading
    const handleRetry = () => {
        fetchWishlistFromServer();
    };

    // Loading state
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

    // Error state
    if (error) {
        return (
            <div className="wl-page" dir="rtl">
                <div className="wl-error">
                    <div className="wl-error-icon">⚠️</div>
                    <p className="wl-error-text">{error}</p>
                    <button className="wl-retry-btn" onClick={handleRetry}>
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user || !isClient()) {
        return (
            <div className="wl-page" dir="rtl">
                <div className="wl-empty">
                    <div className="wl-empty-icon">🔒</div>
                    <p className="wl-empty-text">الرجاء تسجيل الدخول لمشاهدة قائمة الرغبات</p>
                    <button className="wl-shop-btn" onClick={() => navigate("/login")}>
                        تسجيل الدخول
                    </button>
                </div>
            </div>
        );
    }

    // Render
    return (
        <div className="wl-page" dir="rtl">
            {/* Toast message */}
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
                <p className="wl-subtitle">
                    {wishlist.length > 0
                        ? `${wishlist.length} منتج محفوظ`
                        : "قائمتك فاضية"}
                </p>
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
                            key={item.productId || item._id || index}
                            item={item}
                            isLoading={loadingId === String(item.productId || item._id)}
                            onRemove={() => handleRemove(String(item.productId || item._id))}
                            onAddToCart={() => handleAddToCart(String(item.productId || item._id))}
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
    const navigate = useNavigate();
    
    // Make sure item exists
    if (!item) return null;
    
    // Get product ID
    const productId = item.productId || item._id || item.product;
    if (!productId) return null;
    
    // Get image URL
    const imageUrl = item.image ? buildImgSrc(item.image) : null;
    const productName = item.productName || item.name || 'منتج';
    const price = item.price || 0;
    const inStock = item.inStock !== undefined ? item.inStock : true;
    
    return (
        <div 
            className={`wl-card ${isLoading ? "wl-card--loading" : ""}`} 
            onClick={() => navigate(`/products/${productId}`)}
        >
            {/* Remove button */}
            <button
                className="wl-card-heart"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onRemove();
                }}
                disabled={isLoading}
                title="إزالة من قائمة الرغبات"
            >
                ♥
            </button>

            {/* Image */}
            <div className="wl-card-img-wrapper">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={productName}
                        className="wl-card-img"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = document.createElement('div');
                            placeholder.className = 'wl-card-img-placeholder';
                            placeholder.textContent = '🛍️';
                            e.target.parentElement.appendChild(placeholder);
                        }}
                    />
                ) : (
                    <div className="wl-card-img-placeholder">🛍️</div>
                )}
            </div>

            {/* Info */}
            <div className="wl-card-info">
                <p className="wl-card-name">{productName}</p>
                <div className="wl-card-bottom">
                    <p className="wl-card-price">{price} ج</p>
                    <span
                        className={`wl-card-stock ${
                            inStock ? "wl-in-stock" : "wl-out-stock"
                        }`}
                    >
                        {inStock ? "متوفر" : "نفذ"}
                    </span>
                </div>
            </div>

            {/* Add to cart */}
            <button
                className="wl-card-add-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (inStock) onAddToCart();
                }}
                disabled={isLoading || !inStock}
            >
                {isLoading ? "..." : (
                    <>
                        <span>🛒</span> أضف للسلة
                    </>
                )}
            </button>
        </div>
    );
}