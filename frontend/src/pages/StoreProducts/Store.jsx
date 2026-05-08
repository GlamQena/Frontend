import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Store.css";
import { addToCart } from "../../services/cart";
import { isUserLogged, responseMessageSetter } from "../../services/authService";
import { getStoreProducts } from "../../services/stores";
import { addToWishlist, removeFromWishlist } from "../../services/users";

const Store = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [responseMessage, setResponseMessage] = useState({
    success: false,
    message: "",
  });

  const { storeId } = useParams();

  const categories = [
    "الكل",
    "العناية بالبشرة",
    "المكياج",
    "الأدوات",
    "العناية بالجسم",
    "العناية بالشعر",
    "العناية بالرجال",
    "أخرى",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getStoreProducts(storeId);
        const json = await res.json();
        console.log("getStoreProducts data => ", json);

        if (!res.ok) {
          responseMessageSetter(false, json.message || "خطأ فى جلب منتجات المتجر", setResponseMessage);
          return;
        }

        if (json.success) {
          setStore(json.data.store || null);
          if (json.data.products) {
            setProducts(json.data.products.map((product) => ({
              ...product,
              addedToWishlist: false
            })));
            setFilteredProducts(json.data.products.map((product) => ({
              ...product,
              addedToWishlist: false
            })));
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

  // Filter products by category
  useEffect(() => {
    if (activeCategory === "الكل") {
      setFilteredProducts(products);
    } else {
      // This is a simple filter - adjust based on your actual category structure
      const filtered = products.filter(product => 
        product.category_id?.name === activeCategory ||
        product.category_name === activeCategory
      );
      setFilteredProducts(filtered);
    }
  }, [activeCategory, products]);

  const getProductImage = (imgArray) => {
    if (!imgArray || imgArray.length === 0) {
      return "https://via.placeholder.com/300?text=No+Image";
    }
    const fixedPath = imgArray[0].replace(/\\/g, "/");
    return fixedPath.replace("uploads", "http://127.0.0.1:8080");
  };

  const addToWishlistHandler = async (index, prod_id) => {
    try {
      const res = await addToWishlist(prod_id, setResponseMessage);
      const data = await res.json();

      if (!res.ok) {
        return responseMessageSetter(false, data.message || "خطأ فى الإضافة لقائمة الرغبات", setResponseMessage);
      }

      localStorage.setItem("user", JSON.stringify(data.updatedClientData));

      setProducts((prev) => {
        const newProducts = [...prev];
        if (newProducts[index]) newProducts[index].addedToWishlist = true;
        return newProducts;
      });

      setFilteredProducts((prev) => {
        const newProducts = [...prev];
        if (newProducts[index]) newProducts[index].addedToWishlist = true;
        return newProducts;
      });

      responseMessageSetter(true, data.message || "تمت الإضافة إلى قائمة الرغبات بنجاح", setResponseMessage);
    } catch (err) {
      console.log(err.message);
      responseMessageSetter(false, "خطأ فى الإضافة لقائمة الرغبات", setResponseMessage);
    }
  };
  
  const removeFromWishlistHandler = async (index, prod_id) => {
    try {
      const res = await removeFromWishlist(prod_id, setResponseMessage);
      const data = await res.json();

      if (!res.ok) {
        return responseMessageSetter(false, data.message || "خطأ فى الإزالة من قائمة الرغبات", setResponseMessage);
      }

      localStorage.setItem("user", JSON.stringify(data.updatedClientData));

      setProducts((prev) => {
        const newProducts = [...prev];
        if (newProducts[index]) newProducts[index].addedToWishlist = false;
        return newProducts;
      });
      setFilteredProducts((prev) => {
        const newProducts = [...prev];
        if (newProducts[index]) newProducts[index].addedToWishlist = false;
        return newProducts;
      });
      responseMessageSetter(true, data.message || "تمت الإزالة من قائمة الرغبات بنجاح", setResponseMessage);
    } catch (err) {
      console.log(err.message);
      responseMessageSetter(false, "خطأ فى الإزالة من قائمة الرغبات", setResponseMessage);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const res = await addToCart(productId, setResponseMessage);
      const json = await res.json();

      if (!res.ok) {
        console.error("addToCart error:", json.message);
        return responseMessageSetter(false, json.message || "خطأ فى الإضافة للكارت", setResponseMessage);
      }

      responseMessageSetter(true, json.message || "تمت الإضافة بنجاح ✓", setResponseMessage);
      
      setTimeout(() => {
        setResponseMessage({ success: false, message: "" });
      }, 3000);
    } catch (err) {
      console.error("addToCart error:", err);
      responseMessageSetter(false, err.message || "خطأ فى الإضافة للكارت", setResponseMessage);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>جاري تحميل منتجات المتجر...</h2>
      </div>
    );
  }

  return (
    <div className="store-page">
      {/* Store Banner */}
      <div className="store-banner">
        <div className="banner-overlay">
          <h2>{store?.store_name || "المتجر"}</h2>
          <p>⭐ {store?.average_rating || 0} • {store?.total_products || 0} منتج</p>
        </div>
      </div>

      {/* Response Message */}
      {responseMessage.message && (
        <div className={`response-message ${responseMessage.success ? "success-message" : "error-message"}`}>
          <span className="message-icon">{responseMessage.success ? "✓" : "✕"}</span>
          <span className="message-text">{responseMessage.message}</span>
          <button className="message-close" onClick={() => setResponseMessage({ success: false, message: "" })}>×</button>
        </div>
      )}

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map((cat) => (
          <button
            key={cat}
            className={activeCategory === cat ? "active" : ""}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product, index) => (
            <div key={product._id} className="product-card" onClick={() => navigate(`/stores/${storeId}/products/${product._id}`)}>
              <div className="image-wrapper">
                <img
                  src={getProductImage(product.images)}
                  alt={product.name}
                  onError={(e) => {
                    if (!e.target.dataset.errorHandled) {
                      e.target.dataset.errorHandled = "true";
                      e.target.src = "https://via.placeholder.com/300?text=Image+Error";
                    }
                  }}
                />
                <button 
                  className="wishlist-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isUserLogged()) {
                      responseMessageSetter(false, "يرجى تسجيل الدخول أولاً", setResponseMessage);
                      return;
                    }
                    product.addedToWishlist 
                      ? removeFromWishlistHandler(index, product._id) 
                      : addToWishlistHandler(index, product._id);
                  }}
                >
                  {!isUserLogged() ? "🩶" : (product.addedToWishlist ? "❤️" : "🤍")}
                </button>
              </div>

              <div className="product-info">
                <h4>{product.name}</h4>
                <p className="price">{product.price.toLocaleString()} ج.م</p>
                <button className="add-to-cart-btn" onClick={(e) => { e.stopPropagation(); handleAddToCart(product._id);}}>
                  🛒 أضف للسلة
                </button>
              </div>
            </div>
          ))
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