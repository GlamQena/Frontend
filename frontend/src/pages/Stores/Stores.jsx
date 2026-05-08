import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Stores.css';
import { getStores } from '../../services/stores';
import { responseMessageSetter } from '../../services/authService';

const Stores = () => {
  const navigate= useNavigate();
  const [stores, setStores]=  useState(null);
  const [moreVisible, setMoreVisible] = useState(false);
  const [responseMessage, setResponseMessage]= useState({success: false, message: ""});
  // const [isLightMode, setIsLightMode] = useState(false);

  // useEffect(() => {
  //   const savedTheme = localStorage.getItem('qenaGlamTheme');
  //   if (savedTheme === 'light') {
  //     setIsLightMode(true);
  //     document.body.classList.add('light-mode');
  //   }
  // }, []);

  useEffect(()=>{
    getStoresHandler();
  }, []);

  const getStoresHandler= async ()=>{
    try{
      const res= await getStores();
      const json= await res.json();

      if(!res.ok || !json.success)
        responseMessageSetter(false, json.message || "خطأ فى جلب المتاجر المتاحة", setResponseMessage);

      const preparedStores= json.data.map(store => ({
        _id: store._id,
        name: store.store_name,
        products: `${store.total_products} | منتج`,
        img: store.image,
        rating: `${store.total_rates} | تقييم`,
        stars: `${store.average_rating} ★`
      }));

      setStores(preparedStores);
      console.log("stores => ", preparedStores);

      if(json.message)
        responseMessageSetter(true, json.message, setResponseMessage);
    }catch(err){
        responseMessageSetter(false, err.message || "خطأ فى جلب المتاجر المتاحة", setResponseMessage);
    }
  }

  const toggleMoreStores = () => {
    setMoreVisible(!moreVisible);
  };

  // const toggleTheme = () => {
  //   const body = document.body;
  //   if (!isLightMode) {
  //     body.classList.add('light-mode');
  //     setIsLightMode(true);
  //     localStorage.setItem('qenaGlamTheme', 'light');
  //   } else {
  //     body.classList.remove('light-mode');
  //     setIsLightMode(false);
  //     localStorage.setItem('qenaGlamTheme', 'dark');
  //   }
  // };

  // const goToOffers = () => {
  //   alert(" خصم يصل إلى 40%! استمتعي بأجدد العروض على منتجات التجميل في قنا.");
  // };

  // const handleOrdersClick = (e) => {
  //   e.preventDefault();
  //   alert(" طلباتي: يمكنك متابعة طلباتك السابقة وتتبع الشحنات.");

  //   setTimeout(()=>{
  //     navigate("/orders");
  //   }, 3000);
  // };

  const handleCardClick = (storeId) => {
    // alert(` مرحباً بك في متجر ${storeName}\nاكتشفي منتجات العناية والتجميل الأصيلة في قنا.`);
    navigate(`/stores/${storeId}/products`);
  };

  // const stores = [
  //   { name: "ماسة", img: "/images/lipstick.png", rating: "156 | تقييم", stars: "4.7 ★", delivery: "توصيل مرن", products: "198 | منتج" },
  //   { name: "جلوري", img: "/images/serom.png", rating: "210 | تقييم", stars: "4.6 ★", delivery: "توصيل 24 ساعة", products: "+600 | منتج" },
  //   { name: "لمسة", img: "/images/ishadow.png", rating: "85 | تقييم", stars: "4.9 ★", delivery: "شحن مجاني", products: "312 | منتج" },
  //   { name: "نور للتجميل", img: "/images/contoor.png", rating: "120 | تقييم", stars: "4.8 ★", delivery: "توصيل سريع", products: "450 | منتج" }
  // ];

  const firstFourStores= stores?.slice(0, 4);
  const hiddenStores= stores?.slice(4);

  // const hiddenStores = [
  //   { name: "بيوتي لاند", img: "/images/lippalm.jpg", rating: "98 | تقييم", stars: "4.8 ★", delivery: "توصيل مجاني", products: "275 | منتج" },
  //   { name: "إيفل بيوتي", img: "/images/prushes.jpg", rating: "204 | تقييم", stars: "4.7 ★", delivery: "توصيل فائق السرعة", products: "508 | منتج" },
  //   { name: "لافندر", img: "/images/cream.jpg", rating: "134 | تقييم", stars: "4.9 ★", delivery: "هدية مع كل طلب", products: "405 | منتج" },
  //   { name: "روز نت", img: "/images/makup.jpg", rating: "167 | تقييم", stars: "4.8 ★", delivery: "توصيل 24 ساعة", products: "389 | منتج" }
  // ];

  //show only 4 stores initially then with show more show the rest
  return (
    <div className="page-container">
      <div className="nav">
        <div className="center-nav">
          <a href="#" className="active">المتاجر</a>
          <a href="#" onClick={() => {navigate("/orders")}}>طلباتي</a>
        </div>
      </div>

      <div className="header-main">
        <h1>جميع المتاجر المتوفرة</h1>
        <p> أكتشف أفضل محلات التجميل في مدينتك </p>
      </div>

      <div className="grid">
        {firstFourStores?.map((store, index) => (
          <div key={index} className="card" onClick={() => handleCardClick(store._id)}>
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

        {moreVisible && hiddenStores?.map((store, index) => (
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

      {
        hiddenStores?.length > 0 
        &&
        <button className="show-more-btn" onClick={toggleMoreStores}>
          {moreVisible ? 'عرض أقل من المتاجر ⬆' : 'عرض المزيد من المتاجر ⬇'}
        </button>
      }

      <div className="offer-section">
        <div className="offer-img">
          <img src="/images/client-home/Glowgroup.png" alt="عروض التجميل" />
        </div>
        <div className="offer-text">
          <small> عرض الأسبوع </small>
          <h2>خصومات تصل إلى <span>40%</span><br />على جميع متاجر العناية</h2>
          {/* <button onClick={goToOffers}> استكشف العروض </button> */}
          <div className="glamour-quote"> تألق بجمالك الخاص </div>
        </div>
      </div>
    </div>
  );
};

export default Stores;