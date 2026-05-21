<<<<<<< Updated upstream
import React from 'react';

const Home = () => {
  return (
    <div>
      <h1>Home Page</h1>
    </div>
  );
};
=======
import React, { useState, useEffect } from 'react';
import './Home.css';
import Footer from "../../components/Footer";
import { useTheme } from '../../components/ThemeProvider';
import { getSpecialProducts } from '../../services/product.js';


import luxuryCreamImg from '../../../public/images/main-home/Luxury Cream.png';
import premiumLipsticksImg from '../../../public/images/main-home/Premium Lipsticks.png';
import skinSerumImg from '../../../public/images/main-home/Skin Serum.png';
import beautyProductsImg from '../../../public/images/main-home/Beauty Products.png';
import overlayShadowDarkImg from '../../../public/images/main-home/Overlay+ShadowDark.png';
import overlayShadowImg from '../../../public/images/main-home/Overlay+Shadow.png';

function Home() {
    const [activeSection, setActiveSection] = useState('home');
    const { theme } = useTheme();
    const [recentProducts, setRecentProducts] = useState([]);
    const [frequentlySoldProducts, setFrequentlySoldProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

   
    useEffect(() => {
        const fetchSpecialProducts = async () => {
            try {
                setLoading(true);
                const response = await getSpecialProducts({ limit: 4 });
                
                if (response.success) {
                    setRecentProducts(response.recentProducts || []);
                    setFrequentlySoldProducts(response.frequentlySoldProducts || []);
                } else {
                    throw new Error(response.message || 'فشل في جلب المنتجات');
                }
                
                setError(null);
            } catch (err) {
                console.error("Error fetching special products:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSpecialProducts();
    }, []);

 
    const displayProducts = [...frequentlySoldProducts, ...recentProducts].slice(0, 4);

  
    useEffect(() => {
        const sections = document.querySelectorAll('section[id]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(section => observer.observe(section));
        return () => sections.forEach(section => observer.unobserve(section));
    }, []);

    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getProductImage = (productId) => {
        return `/api/products/${productId}/image`;
    };

    const getBadgeInfo = (product, index) => {
        const isFrequentlySold = frequentlySoldProducts.some(p => p.product_id === product.product_id);
        
        if (isFrequentlySold && index === 0) {
            return { type: 'bestseller', text: 'الأكثر مبيعاً' };
        } else if (index === 1) {
            return { type: 'discount', text: 'خصم 20%' };
        } else if (index === 2) {
            return { type: 'new', text: 'جديد' };
        }
        return null;
    };

    const formatPrice = (price) => {
        return `${Math.round(price)} ج.م`;
    };

    const formatRating = (rating) => {
        if (!rating || rating === 0) return 'جديد';
        return `${rating.toFixed(1)} ★`;
    };

    if (error) {
        return (
            <div className="page-container">
                <div className="error-message">
                    <p>عذراً، حدث خطأ في تحميل المنتجات: {error}</p>
                    <button onClick={() => window.location.reload()}>إعادة المحاولة</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* ========== Navbar ========== */}
            <nav className="sub-navbar">
                <div className="nav-home-links">
                    <a href="#home" className={activeSection === 'home' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>الرئيسية</a>
                    <a href="#how-it-works" className={activeSection === 'how-it-works' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>كيف يعمل</a>
                    <a href="#for-whom" className={activeSection === 'for-whom' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('for-whom'); }}>لمن هذه المنصة</a>
                    <a href="#features" className={activeSection === 'features' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>المميزات</a>
                    <a href="#products" className={activeSection === 'products' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('products'); }}>المنتجات</a>
                </div>
                <div className="nav-footer-links">
                    <a href="#about" className={activeSection === 'about' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>من نحنا</a>
                    <a href="#contact" className={activeSection === 'contact' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>تواصل معنا</a>
                </div>
            </nav>

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
                        اكتشفي أرقى منتجات التجميل المختارة بعناية من أفضل المتاجر المحلية في قلب صعيد مصر.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn-shop" onClick={() => window.location.href = '/stores'}>ابدأ التسوق</button>
                        <button className="btn-discover" onClick={() => scrollToSection('features')}>اكتشف المنصة</button>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">24h</div>
                        <div className="stat-label">توصيل سريع</div>
                    </div>
                </div>
                <div className="hero-images">
                    <div className="glow"></div>
                    <div className="product-card card-1">
                        <img src={luxuryCreamImg} alt="كريم ترطيب عميق" className="product-img" />
                        <div className="product-category">عناية فاخرة</div>
                        <div className="product-title">كريم ترطيب عميق</div>
                        <div className="product-rating">4.9 ★</div>
                    </div>
                    <div className="product-card card-2">
                        <img src={premiumLipsticksImg} alt="مجموعة أحمر شفاه" className="product-img" />
                        <div className="product-category">مكياج</div>
                        <div className="product-title">مجموعة أحمر شفاه</div>
                        <div className="product-price">١٢٠ ج.م</div>
                    </div>
                    <div className="product-card card-4">
                        <img src={skinSerumImg} alt="سيروم فيتامين C" className="product-img" />
                        <div className="product-category">سيروم</div>
                        <div className="product-title">سيروم فيتامين C</div>
                        <div className="card-4-footer">
                            <span className="price-text">٣٥٠ ج.م</span>
                            <button className="cart-icon"><i className="fas fa-shopping-cart"></i></button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== Steps Section ========== */}
            <section id="how-it-works" className="steps-section">
                <div className="steps-container">
                    <div className="steps-small-title">خطوات بسيطة</div>
                    <h2 className="steps-section-title">من الطلب إلى <span className="accent">التسليم</span></h2>
                    <p className="steps-section-subtitle">أربع خطوات بسيطة تفصلك عن منتجات الجمال التي تحبينها</p>

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
                                <p className="step-desc">إنشاء حساب مجاني في ثوانٍ وابدأ التسوق فوراً</p>
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
                                <p className="step-desc">تصفح المنتجات وأضف ما يناسبك إلى السلة</p>
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
                                <p className="step-desc">يوصل المندوب طلبك خلال 24 ساعة لبيتك</p>
                            </div>
                        </div>
                    </div>

                    <button className="btn-start" onClick={() => window.location.href = '/stores'}>ابدأ رحلة الجمال الآن</button>
                </div>
            </section>

            {/* ========== Delivery Section ========== */}
            <section className="delivery-section">
                <div className="delivery-container">
                    <div className="delivery-image">
                        <img src={beautyProductsImg} alt="توصيل سريع" />
                    </div>
                    <div className="delivery-content">
                        <h3 className="delivery-title">توصيل سريع لعناية لا تنتظر</h3>
                        <p className="delivery-text">
                            في قنا، نؤمن أن الجمال لا يجب أن ينتظر. فريقنا يعمل على مدار الساعة لضمان
                            وصول مفضلاتك إليك في أسرع وقت وبأفضل حالة.
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
                        <div className="role-desc">تسوق منتجات التجميل من أفضل محلات قنا</div>
                        <div className="features-list customer-feature">
                            <div className="feature-item"><span>تتبع طلباتك في الوقت الفعلي</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>تصفح المحلات والمنتجات</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>توصيل سريع لباب البيت</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>أضف إلى السلة واطلب بسهولة</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>قيّمي المنتجات والمحلات</span> <i className="fas fa-check"></i></div>
                        </div>
                        <button className="btn-customer" onClick={() => window.location.href = '/register?role=client'}>سجل كعميل</button>
                    </div>

                    <div className="role-card">
                        <div className="icon-wrapper store-icon">
                            <i className="fas fa-store"></i>
                        </div>
                        <h3>STORE OWNER</h3>
                        <div className="role-sub">(صاحب محل)</div>
                        <div className="role-desc">اعرض منتجاتك واستفد من قاعدة عملاء أوسع</div>
                        <div className="features-list store-feature">
                            <div className="feature-item"><span>أضف منتجاتك بسهولة</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>إدارة الطلبات والمخزون</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>لوحة تحكم متكاملة</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>تقارير المبيعات والأرباح</span> <i className="fas fa-check"></i></div>
                            <div className="feature-item"><span>طلب سحب الأرباح</span> <i className="fas fa-check"></i></div>
                        </div>
                        <button className="btn-store" onClick={() => window.location.href = '/register?role=store_owner'}>سجل كصاحب محل</button>
                    </div>
                </div>
            </section>

            {/* ========== Features Section ========== */}
            <section id="features" className="section">
                <h2 className="section-title">تجربة تسوق <span className="accent">مميزة</span></h2>
                <p className="section-subtitle">نقدم لك كل ما تحتاجينه لجمالك في مكان واحد</p>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"><i className="fas fa-store"></i></div>
                        <h3 className="feature-title">محلات موثوقة</h3>
                        <p className="feature-desc">نختار أفضل محلات التجميل في قنا لضمان جودة المنتجات وأصالتها.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><i className="fas fa-truck"></i></div>
                        <h3 className="feature-title">توصيل خلال 24 ساعة</h3>
                        <p className="feature-desc">شبكة توصيل سريعة تغطي جميع أحياء ومناطق قنا.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><i className="fas fa-lock"></i></div>
                        <h3 className="feature-title">دفع آمن ومضمون</h3>
                        <p className="feature-desc">خيارات دفع متعددة مع حماية كاملة لبياناتك الشخصية.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><i className="fas fa-check-circle"></i></div>
                        <h3 className="feature-title">ضمان الجودة</h3>
                        <p className="feature-desc">منتجات أصلية 100% مع ضمان الاسترجاع خلال 7 أيام.</p>
                    </div>
                </div>
            </section>

            {/* ========== Products Section ========== */}
            <section id="products" className="products-section">
                <div className="products-container">
                    <div className="products-header">
                        <h2 className="products-title">المنتجات <span>المميزة</span></h2>
                        <p className="products-description">اختيارات مدروسة تناسب جميع أنواع البشرة والأذواق</p>
                    </div>

                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>جاري تحميل المنتجات...</p>
                        </div>
                    ) : displayProducts.length > 0 ? (
                        <div className="products-grid">
                            {displayProducts.map((product, index) => {
                                const badgeInfo = getBadgeInfo(product, index);
                                return (
                                    <div className="product-card" key={product.product_id}>
                                        {badgeInfo && (
                                            <div className={`product-badge ${badgeInfo.type}`}>
                                                {badgeInfo.text}
                                            </div>
                                        )}
                                        <div 
                                            className="product-image" 
                                            style={{ 
                                                backgroundImage: `url(${getProductImage(product.product_id)})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        ></div>
                                        <div className="add-btn" onClick={() => {
                                            console.log('Add to cart:', product);
                                        }}>+</div>
                                        <div className="product-content">
                                            <div className="product-store-name">{product.store_name || 'متجر موثوق'}</div>
                                            <h3 className="product-name">{product.name}</h3>
                                            <p className="product-desc">{product.description || 'منتج مميز للعناية بالبشرة'}</p>
                                            <div className="product-footer">
                                                <div>
                                                    <span className="product-price-new">{formatPrice(product.price)}</span>
                                                </div>
                                                <span className="product-rating">{formatRating(product.average_rating)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-products">
                            <p>لا توجد منتجات مميزة حالياً</p>
                        </div>
                    )}

                    <div className="view-all-btn">
                        <button className="btn-view-all" onClick={() => window.location.href = '/products'}>
                            عرض جميع المنتجات
                        </button>
                    </div>
                </div>
            </section>

            {/* ========== Footer Section ========== */}
            <div className="footer-section">
                <div className="footer-image">
                    <img src={theme === "dark" ? overlayShadowDarkImg : overlayShadowImg} alt="Qena Glam" />
                    <div className="footer-image-content">
                        <h2>الجمال يبدأ من <span className="city">قنا</span></h2>
                        <p>اكتشفي أرقى منتجات التجميل المختارة بعناية من أفضل المتاجر<br />المحلية في قلب صعيد مصر.</p>
                    </div>
                </div>
                <Footer />
            </div>
        </div>
    );
}
>>>>>>> Stashed changes

export default Home;