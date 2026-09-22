import React, { useState, useEffect, useCallback, useRef } from "react";
import "./Home.css";
import { useTheme } from "../../components/ThemeProvider";
import { getSpecialProducts } from "../../services/products.js";
import { buildImgSrc } from "../../services/imageUtils.js";
import { addToCart } from "../../services/cart.js";
import {
  responseMessageSetter,
  isUserLogged,
} from "../../services/authService.js";
import { useNavigate, Link } from "react-router-dom";
import {
  isClient,
  addToWishlist,
  removeFromWishlist,
  getCurrentUser,
} from "../../services/users.js";
import ProductCard from "../../components/ProductCard.jsx";
import FloatingMsg from "../../components/FloatingMsg.jsx";
import SimpleButton from "../../components/SimpleButton.jsx";

function Home() {
  const [activeSection, setActiveSection] = useState("home");
  const { theme } = useTheme();
  const [specialProducts, setSpecialProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [responseMessage, setResponseMessage] = useState({
    success: false,
    message: "",
  });
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [addingToCart, setAddingToCart] = useState(null);

  const navigate = useNavigate();
  const timer = useRef();

  // Helper to check wishlist status
  const isProductInWishlist = useCallback((productId, userWishlist) => {
    if (!userWishlist || !Array.isArray(userWishlist)) return false;
    return userWishlist.some((item) => {
      if (item._id && item._id.toString() === productId.toString()) return true;
      if (item.toString && item.toString() === productId.toString())
        return true;
      if (item.productId && item.productId.toString() === productId.toString())
        return true;
      return false;
    });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const sections = document.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => {
      sections.forEach((section) => observer.unobserve(section));
      clearTimeout(timer);
    };
  }, []);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleShowSpecialProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const response = await getSpecialProducts();

        const loggedUser = getCurrentUser();
        const userWishlist = loggedUser?.wishlist || [];

        const mapProductData = (product, additionalFlags = {}) => ({
          ...product,
          id: product._id,
          storeName:
            product.owner_store_id?.store_name ||
            product.store_name ||
            "متجر تجميل",
          rating: product.average_rating || 0,
          totalRates: product.total_rates || 0,
          stock: product.stock ?? 0,
          volume: product.volume || null,
          images: product.images || [],
          addedToWishlist: isProductInWishlist(product._id, userWishlist),
          ...additionalFlags,
        });

        const recentWithBadge = response.recentProducts.map((p) =>
          mapProductData(p, { isNew: true }),
        );
        const frequentWithBadge = response.frequentlySoldProducts.map((p) =>
          mapProductData(p, { isBestseller: true }),
        );

        const allProducts = [...frequentWithBadge, ...recentWithBadge];
        setSpecialProducts(allProducts);

        const initialIndexes = {};
        allProducts.forEach((_, index) => {
          initialIndexes[index] = 0;
        });
        setCurrentImageIndexes(initialIndexes);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    handleShowSpecialProducts();
  }, [isProductInWishlist]);

  const updateProductWishlistStatus = (productId, status) => {
    setSpecialProducts((prev) =>
      prev.map((p) =>
        p._id === productId || p.id === productId
          ? { ...p, addedToWishlist: status }
          : p,
      ),
    );
  };

  const handleToggleWishlist = async (e, productId) => {
    e.stopPropagation();
    const product = specialProducts.find(
      (p) => p._id === productId || p.id === productId,
    );
    if (!product) return;

    try {
      const apiCall = product.addedToWishlist
        ? removeFromWishlist
        : addToWishlist;
      const res = await apiCall(productId);
      const data = await res.json();

      if (!res.ok) {
        responseMessageSetter(
          false,
          data.message || "حدث خطأ أثناء التحديث",
          setResponseMessage,
        );
        return;
      }

      const user = apiCall == removeFromWishlist ? data.data.user : data.user;
      localStorage.setItem("user", JSON.stringify(user));
      updateProductWishlistStatus(productId, !product.addedToWishlist);
      // responseMessageSetter(true, data.message || "تم تحديث قائمة الرغبات بنجاح", setResponseMessage);
    } catch (err) {
      if (err.code == "AUTH_EXPIRED" || err.message?.includes("session")) {
        responseMessageSetter(
          false,
          err.message || "Your session has expired. Please login again.",
          setResponseMessage,
        );
        timer = setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        console.error("Wishlist toggle error:", err);
        responseMessageSetter(
          false,
          err.message || "حدث خطأ في تحديث قائمة الرغبات",
          setResponseMessage,
        );
      }
    }
  };

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation();
    try {
      if (addingToCart === productId) return;
      setAddingToCart(productId);

      const res = await addToCart(productId);
      const json = await res.json();

      if (!res.ok) {
        console.error("addToCart error:", json.message);
        return responseMessageSetter(
          false,
          json.message || "خطأ فى الإضافة للسلة",
          setResponseMessage,
        );
      }

      // responseMessageSetter(true, json.message || "تمت الإضافة بنجاح ✓", setResponseMessage);
    } catch (err) {
      console.error("addToCart error:", err);
      responseMessageSetter(
        false,
        err.message || "خطأ فى الإضافة للسلة",
        setResponseMessage,
      );
    } finally {
      setAddingToCart(null);
    }
  };

  const displayProducts = () => {
    if (specialProducts.length > 0) {
      return showAllProducts ? specialProducts : specialProducts.slice(0, 4);
    }
    return null;
  };

  const productsToShow = displayProducts();
  const hasSpecialProducts = specialProducts.length > 0;
  const isLoggedIn = isUserLogged();
  const isClientUser = isClient();

  return (
    <div className="page-container">
      {/* ========== Sub Navbar ========== */}
      <div className="sub-navbar-wrapper">
        <nav className="sub-navbar">
          <div className="nav-home-links">
            <a
              href="#home"
              className={activeSection === "home" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("home");
              }}
            >
              الرئيسية
            </a>
            <a
              href="#how-it-works"
              className={activeSection === "how-it-works" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("how-it-works");
              }}
            >
              كيف يعمل
            </a>
            <a
              href="#for-whom"
              className={activeSection === "for-whom" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("for-whom");
              }}
            >
              لمن هذه المنصة
            </a>
            <a
              href="#features"
              className={activeSection === "features" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("features");
              }}
            >
              المميزات
            </a>
            <a
              href="#products"
              className={activeSection === "products" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("products");
              }}
            >
              المنتجات
            </a>
          </div>
          <div className="nav-footer-links">
            <a
              href="#about"
              className={activeSection === "about" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("about");
              }}
            >
              من نحن
            </a>
            <a
              href="#contact"
              className={activeSection === "contact" ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("contact");
              }}
            >
              تواصل معنا
            </a>
          </div>
        </nav>
      </div>

      {responseMessage.message && (
        <FloatingMsg
          success={responseMessage.success}
          message={responseMessage.message}
        />
      )}

      {/* ========== Hero Section ========== */}
      <section id="home" className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span>أول منصة جمال متخصصة في قنا</span>
            <div className="star"></div>
          </div>
          <h1>
            <span className="white">الجمال يبدأ</span>
            <span className="gradient">من هنا</span>
          </h1>
          <p className="hero-desc">
            اكتشفي أرقى منتجات التجميل المختارة بعناية من أفضل المتاجر المحلية
            في قلب صعيد مصر.
          </p>
          <div className="hero-buttons">
            <SimpleButton
              onClick={() => (window.location.href = "/stores")}
              content={"ابدأ التسوق"}
            />
            <button
              className="btn-discover"
              onClick={() => scrollToSection("features")}
            >
              اكتشف المنصة
            </button>
          </div>
          <div className="mhابدأ التسوق">
            <div className="stat-number">24h</div>
            <div className="stat-label">توصيل سريع</div>
          </div>
        </div>
        <div className="hero-images">
          <div className="glow"></div>
          <div className="hero-product-card card-1">
            <div className="product-img-1"></div>
            <div className="product-category">عناية فاخرة</div>
            <div className="product-title">كريم ترطيب عميق</div>
            <div className="product-rating">4.9 ★</div>
          </div>
          <div className="hero-product-card card-2">
            <div className="product-img-2"></div>
            <div className="product-category">مكياج</div>
            <div className="product-title">مجموعة أحمر شفاه</div>
            <div className="product-price">١٢٠ ج.م</div>
          </div>
          <div className="hero-product-card card-3">
            <div className="product-img-3"></div>
            <div className="product-category">زيوت طبيعية</div>
            <div className="product-title">زيت الأركان النقي</div>
            <div className="badge-best">الأكثر مبيعاً</div>
          </div>
          <div className="hero-product-card card-4">
            <div className="product-img-4"></div>
            <div className="product-category">سيروم</div>
            <div className="product-title">سيروم فيتامين C</div>
            <div className="card-4-footer">
              <span className="price-text">٣٥٠ ج.م</span>
              <button className="cart-icon">
                <i className="fas fa-shopping-cart"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== Steps Section ========== */}
      <section id="how-it-works" className="steps-section">
        <div className="steps-container">
          <div className="steps-small-title">خطوات بسيطة</div>
          <h2 className="steps-section-title">
            من الطلب إلى <span className="accent">التسليم</span>
          </h2>
          <p className="steps-section-subtitle">
            أربع خطوات بسيطة تفصلك عن منتجات الجمال التي تحبينها
          </p>

          <div className="steps-timeline">
            <div className="step-item">
              <div className="step-icon-wrapper">
                <div className="step-icon-circle">
                  <i className="fas fa-user-plus"></i>
                </div>
              </div>
              <div className="step-line"></div>
              <div className="step-content">
                <h3 className="step-title">سجل حسابك</h3>
                <p className="step-desc">
                  إنشاء حساب مجاني في ثوانٍ وابدأ التسوق فوراً
                </p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-icon-wrapper">
                <div className="step-icon-circle">
                  <i className="fas fa-shopping-cart"></i>
                </div>
              </div>
              <div className="step-line"></div>
              <div className="step-content">
                <h3 className="step-title">اختر وأضف</h3>
                <p className="step-desc">
                  تصفح المنتجات وأضف ما يناسبك إلى السلة
                </p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-icon-wrapper">
                <div className="step-icon-circle">
                  <i className="fas fa-check-circle"></i>
                </div>
              </div>
              <div className="step-line"></div>
              <div className="step-content">
                <h3 className="step-title">أكد الطلب</h3>
                <p className="step-desc">أدخل عنوانك وأكد طلبك في خطوة واحدة</p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-icon-wrapper">
                <div className="step-icon-circle">
                  <i className="fas fa-truck"></i>
                </div>
              </div>
              <div className="step-line"></div>
              <div className="step-content">
                <h3 className="step-title">استلم على بابك</h3>
                <p className="step-desc">
                  يوصل المندوب طلبك خلال 24 ساعة لبيتك
                </p>
              </div>
            </div>
          </div>

          <SimpleButton
            onClick={() => (window.location.href = "/stores")}
            content={"ابدأ رحلة الجمال الآن"}
          />
        </div>
      </section>

      {/* ========== Delivery Section ========== */}
      <section className="delivery-section">
        <div className="delivery-container">
          <div className="delivery-image">
            <img
              src="/images/main-home/Beauty Products.png"
              onError={(e) => {
                e.target.onError = null;
                e.target.src = "/images/main-home/placeholder_product.png";
              }}
              alt="توصيل سريع"
            />
          </div>
          <div className="delivery-content">
            <h3 className="delivery-title">توصيل سريع لعناية لا تنتظر</h3>
            <p className="delivery-text">
              في قنا، نؤمن أن الجمال لا يجب أن ينتظر. فريقنا يعمل على مدار
              الساعة لضمان وصول مفضلاتك إليك في أسرع وقت وبأفضل حالة.
            </p>
            <div className="delivery-exclusive">EXCLUSIVE COLLECTIONS</div>
          </div>
        </div>
      </section>

      {/* ========== For Whom Section ========== */}
      <section id="for-whom" className="for-whom">
        <div className="section-header">
          <div className="section-badge">لمن هذه المنصة</div>
          <h2>
            <span className="purple">في مكان واحد</span>
            <span className="white">كل ما تحتاجه</span>
          </h2>
          <p>نقدم حلولاً متكاملة لكل من يهتم بالجمال والتجميل</p>
        </div>
        <div className="cards-grid">
          <div className="role-card">
            <div className="icon-wrapper customer-icon">
              <i className="fas fa-user"></i>
            </div>
            <h3>CUSTOMER</h3>
            <div className="role-sub">(عميل)</div>
            <div className="role-desc">
              تسوق منتجات التجميل من أفضل محلات قنا
            </div>
            <div className="features-list customer-feature">
              <div className="feature-item">
                <span>تتبع طلباتك في الوقت الفعلي</span>{" "}
                <i className="fas fa-check"></i>
              </div>
              <div className="feature-item">
                <span>تصفح المحلات والمنتجات</span>{" "}
                <i className="fas fa-check"></i>
              </div>
              <div className="feature-item">
                <span>توصيل سريع لباب البيت</span>{" "}
                <i className="fas fa-check"></i>
              </div>
              <div className="feature-item">
                <span>أضف إلى السلة واطلب بسهولة</span>{" "}
                <i className="fas fa-check"></i>
              </div>
              <div className="feature-item">
                <span>قيّمي المنتجات والمحلات</span>{" "}
                <i className="fas fa-check"></i>
              </div>
            </div>
            <button
              className="btn-customer"
              onClick={() => (window.location.href = "/register?role=client")}
            >
              سجل كعميل
            </button>
          </div>

          <div className="role-card">
            <div className="icon-wrapper store-icon">
              <i className="fas fa-store"></i>
            </div>
            <h3>STORE OWNER</h3>
            <div className="role-sub">(صاحب محل)</div>
            <div className="role-desc">
              اعرض منتجاتك واستفد من قاعدة عملاء أوسع
            </div>
            <div className="features-list store-feature">
              <div className="feature-item">
                <span>أضف منتجاتك بسهولة</span> <i className="fas fa-check"></i>
              </div>
              <div className="feature-item">
                <span>إدارة الطلبات والمخزون</span>{" "}
                <i className="fas fa-check"></i>
              </div>
              <div className="feature-item">
                <span>لوحة تحكم متكاملة</span> <i className="fas fa-check"></i>
              </div>
              <div className="feature-item">
                <span>تقارير المبيعات والأرباح</span>{" "}
                <i className="fas fa-check"></i>
              </div>
              <div className="feature-item">
                <span>طلب سحب الأرباح</span> <i className="fas fa-check"></i>
              </div>
            </div>
            <button
              className="btn-store"
              onClick={() =>
                (window.location.href = "/register?role=store_owner")
              }
            >
              سجل كصاحب محل
            </button>
          </div>
        </div>
      </section>

      {/* ========== Features Section ========== */}
      <section id="features" className="section">
        <h2 className="section-title">
          تجربة تسوق <span className="accent">مميزة</span>
        </h2>
        <p className="section-subtitle">
          نقدم لك كل ما تحتاجينه لجمالك في مكان واحد
        </p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-store"></i>
            </div>
            <h3 className="feature-title">محلات موثوقة</h3>
            <p className="feature-desc">
              نختار أفضل محلات التجميل في قنا لضمان جودة المنتجات وأصالتها.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-truck"></i>
            </div>
            <h3 className="feature-title">توصيل خلال 24 ساعة</h3>
            <p className="feature-desc">
              شبكة توصيل سريعة تغطي جميع أحياء ومناطق قنا.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-lock"></i>
            </div>
            <h3 className="feature-title">دفع أمن ومضمون</h3>
            <p className="feature-desc">
              خيارات دفع متعددة مع حماية كاملة لبياناتك الشخصية.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 className="feature-title">ضمان الجودة</h3>
            <p className="feature-desc">
              منتجات أصلية 100% مع ضمان الاسترجاع خلال 7 أيام.
            </p>
          </div>
        </div>
      </section>

      {/* ========== Products Section ========== */}
      <section id="products" className="products-section">
        <div className="products-container">
          <div className="products-header">
            <h2 className="products-title">
              منتجات <span>مميزة</span>
            </h2>
            <p className="products-description">
              اكتشفي أفضل منتجات التجميل من محلات قنا
            </p>
          </div>

          <div className="products-grid">
            {productsToShow &&
              productsToShow.map((product, index) => {
                const productId = product._id || product.id;
                return (
                  <ProductCard
                    key={productId || index}
                    product={product}
                    isLoggedIn={isLoggedIn}
                    isClientUser={isClientUser}
                    onToggleWishlist={handleToggleWishlist}
                    onAddToCart={handleAddToCart}
                    isAddingToCart={addingToCart === productId}
                  />
                );
              })}
          </div>

          {hasSpecialProducts &&
            !showAllProducts &&
            specialProducts.length > 4 && (
              <div className="view-all-btn">
                <button
                  className="btn-view-all"
                  onClick={() => setShowAllProducts(true)}
                  disabled={isLoadingProducts}
                >
                  {isLoadingProducts ? "جاري التحميل..." : "عرض جميع المنتجات"}
                </button>
              </div>
            )}
        </div>
      </section>

      {/* ========== Footer Section ========== */}
      <div className="footer-section">
        <div className="footer-image">
          <img
            src={
              theme === "purple"
                ? "/images/main-home/footer_berfum_dark.jpg"
                : "/images/main-home/footer_berfum_light.jpg"
            }
            alt="Qena Glam"
          />
          <div className="footer-image-content">
            <span className="city">قنا، جمهورية مصر العربية</span>
            <h3>انضمي إلينا واكتشفي المتاجر المميزة</h3>
            <p>
              تصفحي أفضل المتاجر المتاحة لدينا واستمتعي بتجربة تسوق فريدة ومخصصة
              تلبي كافة احتياجاتك بكل سهولة.
            </p>

            {/* Added Store Navigation Button */}
            <Link to="/stores" className="footer-btn">
              استعرضي المتاجر
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
