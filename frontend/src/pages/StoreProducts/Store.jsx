import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Store.css";
import { addToCart } from "../../services/cart";
import { responseMessageSetter } from "../../services/authService";
import { getStoreProducts } from "../../services/stores";

const Store = () => {
  // const location= useLocation();
  const navigate= useNavigate();
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [responseMessage, setResponseMessage] = useState({
    success: false,
    message: "",
  });

  const {storeId} = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getStoreProducts(storeId);

        const json = await res.json();
        console.log("getStoreProducts data => ", json);

        if (!res.ok) 
          responseMessageSetter(false, json.message || "خطأ فى جلب منتجات المتجر", setResponseMessage);

        if (json.success) {
          // الباك إند بيبعت المنتجات جوه json.data
          setStore(json.data.store || null);
          setProducts(json.data.products || []);
        }
      } catch (err) {
        console.error("فشل في الاتصال  بالبيانات:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getProductImage = (imgArray) => {
    // if (!imgArray || imgArray.length === 0) return "https://via.placeholder.com/150";

    const fixedPath = imgArray[0].replace(/\\/g, "/");

    // return `http://127.0.0.1:8080${fixedPath.startsWith('/') ? '' : '/'}${fixedPath}`;
    return fixedPath.replace("uploads", "http://127.0.0.1:8080");
  };

  const handleAddToCart = async (productId) => {
    try {
      const res = await addToCart(productId);

      if (!res.ok)
        return responseMessageSetter(
          false,
          json.message || "خطأ فى الإضافة للكارت",
          setResponseMessage,
        );

      const json = await res.json();
      responseMessageSetter(
        true,
        json.message || "تمت الإضافة بنجاح ✓",
        setResponseMessage,
      );
    } catch (err) {
      console.error("addToCart error:", err);
      responseMessageSetter(
        false,
        err.message || "خطأ فى الإضافة للكارت",
        setResponseMessage,
      );
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "white" }}>
        <h2>جاري تحميل منتجات Qena Glam...</h2>
      </div>
    );

  return (
    <div className={`store-page ${darkMode ? "dark-theme" : "light-theme"}`}>
      <header className="store-header">
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️" : "🌙"}
        </button>
      </header>

      {/* بنر المتجر */}
      <div className="store-banner">
        <div className="banner-overlay">
          <h2>{store?.store_name}</h2>
          <p>
            ⭐ {store?.average_rating} • {store?.total_products} منتج
          </p>
        </div>
      </div>

      {responseMessage.message && (
        <p
          className={
            responseMessage.success
              ? "success-message response-message"
              : "error-message response-message"
          }
        >
          {responseMessage.message}
        </p>
      )}

      {/* فلتر التصنيفات */}
      <div className="category-filter">
        {[
          "الكل",
          "العناية بالبشرة",
          "المكياج",
          "الأدوات",
          "العناية بالجسم",
          "العناية بالشعر",
          "العناية بالرجال",
          "أخرى",
        ].map((cat, i) => (
          <button key={i} className={i === 0 ? "active" : ""}>
            {cat}
          </button>
        ))}
      </div>

      {/* عرض المنتجات */}
      <div className="products-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product._id} className="product-card">
              <div className="image-wrapper">
                <img
                  src={getProductImage(product.images)}
                  alt={product.name}
                  // onError={(e) =>
                  //   (e.target.src = "https://via.placeholder.com/150")
                  // }
                />
                <button className="wishlist-btn">♡</button>
              </div>

              <div className="product-info">
                {/* <span className="brand-tag">براند محلي</span> */}
                <h4>{product.name}</h4>
                <p className="price">{product.price} ج.م</p>
                <button
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(product._id)}
                >
                  أضف للسلة{" "}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-data">
            <p> مفيش منتجات حالياً. اتأكدي إن الـ Server شغال.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Store;
