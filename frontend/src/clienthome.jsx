import React, { useState, useEffect } from 'react';
import './clienthome.css';

const QenaGlam = () => {
  const [moreVisible, setMoreVisible] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('qenaGlamTheme');
    if (savedTheme === 'light') {
      setIsLightMode(true);
      document.body.classList.add('light-mode');
    }
  }, []);

  const toggleMoreStores = () => {
    setMoreVisible(!moreVisible);
  };

  const toggleTheme = () => {
    const body = document.body;
    if (!isLightMode) {
      body.classList.add('light-mode');
      setIsLightMode(true);
      localStorage.setItem('qenaGlamTheme', 'light');
    } else {
      body.classList.remove('light-mode');
      setIsLightMode(false);
      localStorage.setItem('qenaGlamTheme', 'dark');
    }
  };

  const goToOffers = () => {
    alert(" خصم يصل إلى 40%! استمتعي بأجدد العروض على منتجات التجميل في قنا.");
  };

  const handleOrdersClick = (e) => {
    e.preventDefault();
    alert(" طلباتي: يمكنك متابعة طلباتك السابقة وتتبع الشحنات.");
  };

  const handleCardClick = (storeName) => {
    alert(` مرحباً بك في متجر ${storeName}\nاكتشفي منتجات العناية والتجميل الأصيلة في قنا.`);
  };

  const stores = [
    { name: "ماسة", img: "/images/lipstick.png", rating: "156 | تقييم", stars: "4.7 ★", delivery: "توصيل مرن", products: "198 | منتج" },
    { name: "جلوري", img: "/images/serom.png", rating: "210 | تقييم", stars: "4.6 ★", delivery: "توصيل 24 ساعة", products: "+600 | منتج" },
    { name: "لمسة", img: "/images/ishadow.png", rating: "85 | تقييم", stars: "4.9 ★", delivery: "شحن مجاني", products: "312 | منتج" },
    { name: "نور للتجميل", img: "/images/contoor.png", rating: "120 | تقييم", stars: "4.8 ★", delivery: "توصيل سريع", products: "450 | منتج" }
  ];

  const hiddenStores = [
    { name: "بيوتي لاند", img: "/images/lippalm.jpg", rating: "98 | تقييم", stars: "4.8 ★", delivery: "توصيل مجاني", products: "275 | منتج" },
    { name: "إيفل بيوتي", img: "/images/prushes.jpg", rating: "204 | تقييم", stars: "4.7 ★", delivery: "توصيل فائق السرعة", products: "508 | منتج" },
    { name: "لافندر", img: "/images/cream.jpg", rating: "134 | تقييم", stars: "4.9 ★", delivery: "هدية مع كل طلب", products: "405 | منتج" },
    { name: "روز نت", img: "/images/makup.jpg", rating: "167 | تقييم", stars: "4.8 ★", delivery: "توصيل 24 ساعة", products: "389 | منتج" }
  ];

  return (
    <div className="container">
      <div className="nav">
        <div className="logo">
          <span className="logo-glam">Glam</span>
          <span className="logo-qena">Qena</span>
          <div className="logo-circle"></div>
          <span className="logo-qena-ar">قنا</span>
        </div>

        <div className="center-nav">
          <a href="#" className="active">المتاجر</a>
          <a href="#" onClick={handleOrdersClick}>طلباتي</a>
        </div>

        <div className="left-icons">
          <button className="icon" onClick={toggleTheme}>
            <i className={`fa ${isLightMode ? 'fa-sun' : 'fa-moon'} dark-mode-icon`}></i>
          </button>
          <a href="cart.html" className="icon">
            <i className="fa fa-bag-shopping cart-icon"></i>
            <span className="badge">3</span>
          </a>
          <a href="login.html" className="icon">
            <i className="fa fa-user profile-icon"></i>
          </a>
        </div>
      </div>

      <div className="header-main">
        <h1>جميع المتاجر في قنا</h1>
        <p> أكتشف أفضل محلات التجميل في مدينتك </p>
      </div>

      <div className="grid">
        {stores.map((store, index) => (
          <div key={index} className="card" onClick={() => handleCardClick(store.name)}>
            <img src={store.img} alt={store.name} />
            <div className="card-body">
              <div className="card-title">{store.name}</div>
              <div className="card-row">
                <span>{store.rating}</span>
                <span><i className="fa fa-star"></i> {store.stars}</span>
              </div>
              <div className="card-footer">
                <span>{store.delivery}</span>
                <span>{store.products}</span>
              </div>
            </div>
          </div>
        ))}

        {moreVisible && hiddenStores.map((store, index) => (
          <div key={index} className="card" onClick={() => handleCardClick(store.name)}>
            <img src={store.img} alt={store.name} />
            <div className="card-body">
              <div className="card-title">{store.name}</div>
              <div className="card-row">
                <span>{store.rating}</span>
                <span><i className="fa fa-star"></i> {store.stars}</span>
              </div>
              <div className="card-footer">
                <span>{store.delivery}</span>
                <span>{store.products}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="show-more-btn" onClick={toggleMoreStores}>
        {moreVisible ? 'عرض أقل من المتاجر ⬆' : 'عرض المزيد من المتاجر ⬇'}
      </button>

      <div className="offer-section">
        <div className="offer-img">
          <img src="/images/Glowgroup.png" alt="عروض التجميل" />
        </div>
        <div className="offer-text">
          <small> عرض الأسبوع </small>
          <h2>خصومات تصل إلى <span>40%</span><br />على جميع متاجر العناية</h2>
          <button onClick={goToOffers}> استكشف العروض </button>
          <div className="glamour-quote"> تألق بجمالك الخاص </div>
        </div>
      </div>
    </div>
  );
};

export default QenaGlam;