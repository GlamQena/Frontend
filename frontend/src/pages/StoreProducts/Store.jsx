// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import "./Store.css";
// import { addToCart } from "../../services/cart";
// import { isUserLogged, responseMessageSetter } from "../../services/authService";
// import { getStoreProducts } from "../../services/stores";
// import { addToWishlist, removeFromWishlist } from "../../services/users";
// import { buildImgSrc } from "../../services/imageUtils";

// const Store = () => {
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [store, setStore] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [activeCategory, setActiveCategory] = useState("الكل");
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [responseMessage, setResponseMessage] = useState({
//     success: false,
//     message: "",
//   });

//   const { storeId } = useParams();

//   const categories = [
//     "الكل",
//     "العناية بالبشرة",
//     "المكياج",
//     "الأدوات",
//     "العناية بالجسم",
//     "العناية بالشعر",
//     "العناية بالرجال",
//     "أخرى",
//   ];

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await getStoreProducts(storeId);
//         const json = await res.json();
//         console.log("getStoreProducts data => ", json);

//         if (!res.ok) {
//           responseMessageSetter(false, json.message || "خطأ فى جلب منتجات المتجر", setResponseMessage);
//           return;
//         }

//         if (json.success) {
//           setStore(json.data.store || null);
//           if (json.data.products) {
//             setProducts(json.data.products.map((product) => ({
//               ...product,
//               addedToWishlist: false
//             })));
//             setFilteredProducts(json.data.products.map((product) => ({
//               ...product,
//               addedToWishlist: false
//             })));
//           }
//         }
//       } catch (err) {
//         console.error("فشل في الاتصال بالبيانات:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [storeId]);

//   // Filter products by category
//   useEffect(() => {
//     if (activeCategory === "الكل") {
//       setFilteredProducts(products);
//     } else {
//       // This is a simple filter - adjust based on your actual category structure
//       const filtered = products.filter(product => 
//         product.category_id?.name === activeCategory ||
//         product.category_name === activeCategory
//       );
//       setFilteredProducts(filtered);
//     }
//   }, [activeCategory, products]);

//   const getProductImage = (imgArray) => {
//     if (!imgArray || imgArray.length === 0) {
//       return "https://via.placeholder.com/300?text=No+Image";
//     }
//     else{
//       return buildImgSrc(imgArray[0]);
//     }
//   };

//   const addToWishlistHandler = async (index, prod_id) => {
//     try {
//       const res = await addToWishlist(prod_id, setResponseMessage);
//       const data = await res.json();

//       if (!res.ok) {
//         return responseMessageSetter(false, data.message || "خطأ فى الإضافة لقائمة الرغبات", setResponseMessage);
//       }

//       localStorage.setItem("user", JSON.stringify(data.updatedClientData));

//       setProducts((prev) => {
//         const newProducts = [...prev];
//         if (newProducts[index]) newProducts[index].addedToWishlist = true;
//         return newProducts;
//       });

//       setFilteredProducts((prev) => {
//         const newProducts = [...prev];
//         if (newProducts[index]) newProducts[index].addedToWishlist = true;
//         return newProducts;
//       });

//       responseMessageSetter(true, data.message || "تمت الإضافة إلى قائمة الرغبات بنجاح", setResponseMessage);
//     } catch (err) {
//       console.log(err.message);
//       responseMessageSetter(false, "خطأ فى الإضافة لقائمة الرغبات", setResponseMessage);
//     }
//   };
  
//   const removeFromWishlistHandler = async (index, prod_id) => {
//     try {
//       const res = await removeFromWishlist(prod_id, setResponseMessage);
//       const data = await res.json();

//       if (!res.ok) {
//         return responseMessageSetter(false, data.message || "خطأ فى الإزالة من قائمة الرغبات", setResponseMessage);
//       }

//       localStorage.setItem("user", JSON.stringify(data.updatedClientData));

//       setProducts((prev) => {
//         const newProducts = [...prev];
//         if (newProducts[index]) newProducts[index].addedToWishlist = false;
//         return newProducts;
//       });
//       setFilteredProducts((prev) => {
//         const newProducts = [...prev];
//         if (newProducts[index]) newProducts[index].addedToWishlist = false;
//         return newProducts;
//       });
//       responseMessageSetter(true, data.message || "تمت الإزالة من قائمة الرغبات بنجاح", setResponseMessage);
//     } catch (err) {
//       console.log(err.message);
//       responseMessageSetter(false, "خطأ فى الإزالة من قائمة الرغبات", setResponseMessage);
//     }
//   };

//   const handleAddToCart = async (productId) => {
//     try {
//       const res = await addToCart(productId, setResponseMessage);
//       const json = await res.json();

//       if (!res.ok) {
//         console.error("addToCart error:", json.message);
//         return responseMessageSetter(false, json.message || "خطأ فى الإضافة للكارت", setResponseMessage);
//       }

//       responseMessageSetter(true, json.message || "تمت الإضافة بنجاح ✓", setResponseMessage);
      
//       setTimeout(() => {
//         setResponseMessage({ success: false, message: "" });
//       }, 3000);
//     } catch (err) {
//       console.error("addToCart error:", err);
//       responseMessageSetter(false, err.message || "خطأ فى الإضافة للكارت", setResponseMessage);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <h2>جاري تحميل منتجات المتجر...</h2>
//       </div>
//     );
//   }

//   return (
//     <div className="store-page">
//       {/* Store Banner */}
//       <div className="store-banner">
//         <div className="banner-overlay">
//           <h2>{store?.store_name || "المتجر"}</h2>
//           <p>⭐ {store?.average_rating || 0} • {products.length || 0} منتج</p>
//         </div>
//       </div>

//       {/* Response Message */}
//       {responseMessage.message && (
//         <div className={`response-message ${responseMessage.success ? "success-message" : "error-message"}`}>
//           <span className="message-icon">{responseMessage.success ? "✓" : "✕"}</span>
//           <span className="message-text">{responseMessage.message}</span>
//           <button className="message-close" onClick={() => setResponseMessage({ success: false, message: "" })}>×</button>
//         </div>
//       )}

//       {/* Category Filter */}
//       <div className="category-filter">
//         {categories.map((cat) => (
//           <button
//             key={cat}
//             className={activeCategory === cat ? "active" : ""}
//             onClick={() => setActiveCategory(cat)}
//           >
//             {cat}
//           </button>
//         ))}
//       </div>

//       {/* Products Grid */}
//       <div className="products-grid">
//         {filteredProducts.length > 0 ? (
//           filteredProducts.map((product, index) => (
//             <div key={product._id} className="product-card" onClick={() => navigate(`/stores/${storeId}/products/${product._id}`)}>
//               <div className="image-wrapper">
//                 <img
//                   src={getProductImage(product.images)}
//                   alt={product.name}
//                   onError={(e) => {
//                     if (!e.target.dataset.errorHandled) {
//                       e.target.dataset.errorHandled = "true";
//                       e.target.src = "https://via.placeholder.com/300?text=Image+Error";
//                     }
//                   }}
//                 />
//                 <button 
//                   className="wishlist-btn" 
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     if (!isUserLogged()) {
//                       responseMessageSetter(false, "يرجى تسجيل الدخول أولاً", setResponseMessage);
//                       return;
//                     }
//                     product.addedToWishlist 
//                       ? removeFromWishlistHandler(index, product._id) 
//                       : addToWishlistHandler(index, product._id);
//                   }}
//                 >
//                   {!isUserLogged() ? "🩶" : (product.addedToWishlist ? "❤️" : "🤍")}
//                 </button>
//               </div>

//               <div className="product-info">
//                 <h4>{product.name}</h4>
//                 <p className="price">{product.price.toLocaleString()} ج.م</p>
//                 <button className="add-to-cart-btn" onClick={(e) => { e.stopPropagation(); handleAddToCart(product._id);}}>
//                   🛒 أضف للسلة
//                 </button>
//               </div>
//             </div>
//           ))
//         ) : (
//           <div className="no-data">
//             <div className="no-data-icon">🛍️</div>
//             <p>لا توجد منتجات في هذا التصنيف</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Store.css";
import { addToCart } from "../../services/cart";
import { isUserLogged, responseMessageSetter } from "../../services/authService";
import { getStoreProducts } from "../../services/stores";
import { addToWishlist, removeFromWishlist } from "../../services/users";
import { buildImgSrc } from "../../services/imageUtils";

const CATEGORY_ICONS = {
  "الكل": "✨",
  "العناية بالبشرة": "🧴",
  "المكياج": "💄",
  "الأدوات": "🪞",
  "العناية بالجسم": "🫧",
  "العناية بالشعر": "💇",
  "العناية بالرجال": "🧔",
  "أخرى": "🛍️",
};

const Store = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [responseMessage, setResponseMessage] = useState({ success: false, message: "" });

  const { storeId } = useParams();

  const categories = ["الكل", "العناية بالبشرة", "المكياج", "الأدوات", "العناية بالجسم", "العناية بالشعر", "العناية بالرجال", "أخرى"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getStoreProducts(storeId);
        const json = await res.json();
        if (!res.ok) {
          responseMessageSetter(false, json.message || "خطأ فى جلب منتجات المتجر", setResponseMessage);
          return;
        }
        if (json.success) {
          setStore(json.data.store || null);
          if (json.data.products) {
            const prods = json.data.products.map((p) => ({ ...p, addedToWishlist: false }));
            setProducts(prods);
            setFilteredProducts(prods);
          }
        }
      } catch (err) {
        console.error("فشل في الاتصال بالبيانات:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId]);

  useEffect(() => {
    if (activeCategory === "الكل") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p =>
        p.category_id?.name === activeCategory || p.category_name === activeCategory
      ));
    }
  }, [activeCategory, products]);

  const getProductImage = (imgArray) => {
    if (!imgArray || imgArray.length === 0) return null;
    return buildImgSrc(imgArray[0]);
  };

  const getProductBadge = (product) => {
    if (product.badge === 'SALE' || product.isOnSale || product.discount > 0) return { label: 'SALE', cls: 'badge-sale' };
    if (product.badge === 'NEW' || product.isNew) return { label: 'NEW', cls: 'badge-new' };
    if (product.badge === 'BEST SELLER' || product.isBestSeller) return { label: 'BEST SELLER', cls: 'badge-bestseller' };
    return null;
  };

  const handleCardClick = (product) => {
    if (!isUserLogged()) {
      navigate('/login');
      return;
    }
    navigate(`/stores/${storeId}/products/${product._id}`);
  };

  const addToWishlistHandler = async (index, prod_id, e) => {
    e.stopPropagation();
    if (!isUserLogged()) { navigate('/login'); return; }
    try {
      const res = await addToWishlist(prod_id, setResponseMessage);
      const data = await res.json();
      if (!res.ok) return responseMessageSetter(false, data.message || "خطأ فى الإضافة لقائمة الرغبات", setResponseMessage);
      localStorage.setItem("user", JSON.stringify(data.updatedClientData));
      const update = (prev) => { const n = [...prev]; if (n[index]) n[index] = { ...n[index], addedToWishlist: true }; return n; };
      setProducts(update); setFilteredProducts(update);
      responseMessageSetter(true, data.message || "تمت الإضافة إلى قائمة الرغبات", setResponseMessage);
    } catch (err) { responseMessageSetter(false, "خطأ فى الإضافة لقائمة الرغبات", setResponseMessage); }
  };

  const removeFromWishlistHandler = async (index, prod_id, e) => {
    e.stopPropagation();
    if (!isUserLogged()) { navigate('/login'); return; }
    try {
      const res = await removeFromWishlist(prod_id, setResponseMessage);
      const data = await res.json();
      if (!res.ok) return responseMessageSetter(false, data.message || "خطأ فى الإزالة من قائمة الرغبات", setResponseMessage);
      localStorage.setItem("user", JSON.stringify(data.updatedClientData));
      const update = (prev) => { const n = [...prev]; if (n[index]) n[index] = { ...n[index], addedToWishlist: false }; return n; };
      setProducts(update); setFilteredProducts(update);
      responseMessageSetter(true, data.message || "تمت الإزالة من قائمة الرغبات", setResponseMessage);
    } catch (err) { responseMessageSetter(false, "خطأ فى الإزالة من قائمة الرغبات", setResponseMessage); }
  };

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation();
    if (!isUserLogged()) { navigate('/login'); return; }
    try {
      const res = await addToCart(productId, setResponseMessage);
      const json = await res.json();
      if (!res.ok) return responseMessageSetter(false, json.message || "خطأ فى الإضافة للسلة", setResponseMessage);
      responseMessageSetter(true, json.message || "تمت الإضافة بنجاح ✓", setResponseMessage);
    } catch (err) {
      responseMessageSetter(false, err.message || "خطأ فى الإضافة للسلة", setResponseMessage);
    }
  };

  if (loading) {
    return (
      <div className="store-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>جاري تحميل منتجات المتجر...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="store-page">
      {/* ── Store Banner (matches design) ── */}
      <div className="store-banner">
        <div className="banner-left-decor"></div>
        <div className="banner-right-decor"></div>
        <div className="banner-center">
          <div className="banner-tags">
            <span className="banner-tag-secondary">توصيل سريع</span>
            <span className="banner-tag-primary">مكياج وعناية</span>
          </div>
          <h1 className="banner-store-name">{store?.store_name || "المتجر"}</h1>
          <div className="banner-meta">
          <span className="banner-rating">
               ⭐ {store?.average_rating ? Number(store.average_rating).toFixed(2) : "4.90"}
          </span>
            <span className="banner-dot">•</span>
            <span className="banner-count">{products.length || 0} منتج</span>
          </div>
        </div>
      </div>

      {/* ── Response Message ── */}
      {responseMessage.message && (
        <div className={`response-message ${responseMessage.success ? "success-message" : "error-message"}`}>
          <span className="message-icon">{responseMessage.success ? "✓" : "✕"}</span>
          <span className="message-text">{responseMessage.message}</span>
          <button className="message-close" onClick={() => setResponseMessage({ success: false, message: "" })}>×</button>
        </div>
      )}

      {/* ── Category Filter (pill style) ── */}
      <div className="category-filter">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`cat-pill ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            <span className="cat-icon">{CATEGORY_ICONS[cat]}</span>
            {cat}
          </button>
        ))}
      </div>

      {/* ── Products Grid ── */}
      <div className="products-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product, index) => {
            const badge = getProductBadge(product);
            const imgSrc = getProductImage(product.images);
            return (
              <div
                key={product._id}
                className="product-card"
                onClick={() => handleCardClick(product)}
              >
                {/* Badge */}
                {badge && <div className={`prod-badge ${badge.cls}`}>{badge.label}</div>}

                {/* Image area */}
                <div className="image-wrapper">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={product.name}
                      onError={(e) => {
                        if (!e.target.dataset.err) {
                          e.target.dataset.err = "1";
                          e.target.src = "https://via.placeholder.com/300?text=";
                        }
                      }}
                    />
                  ) : (
                    <div className="img-placeholder">🧴</div>
                  )}

                  {/* Wishlist button */}
                  <button
                    className="wishlist-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isUserLogged()) { navigate('/login'); return; }
                      product.addedToWishlist
                        ? removeFromWishlistHandler(index, product._id, e)
                        : addToWishlistHandler(index, product._id, e);
                    }}
                    title={product.addedToWishlist ? "إزالة من المفضلة" : "أضف للمفضلة"}
                  >
                    {product.addedToWishlist ? "❤️" : "🤍"}
                  </button>
                </div>

                {/* Info */}
                <div className="product-info">
                  <h4>{product.name}</h4>
                  {product.brand && <span className="brand-tag">{product.brand}</span>}

                  {/* Price */}
                  {product.original_price && product.original_price > product.price ? (
                    <div className="price-discount">
                      <span className="discounted-price">{product.price.toLocaleString()} ج.م</span>
                      <span className="original-price">{product.original_price.toLocaleString()} ج.م</span>
                    </div>
                  ) : (
<div className="price-row">
  <span className="price">{product.price?.toLocaleString()}</span>
  <span className="price-currency">ج.م</span>
</div>                  )}

                  {/* Add to cart */}
                  <button
                    className="add-to-cart-btn"
                    onClick={(e) => handleAddToCart(e, product._id)}
                  >
                    🛒 أضف للسلة
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-data">
            <div className="no-data-icon">🛍️</div>
            <p>لا توجد منتجات في هذا التصنيف</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Store;


