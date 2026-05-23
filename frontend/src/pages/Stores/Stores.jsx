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

  useEffect(()=>{
    getStoresHandler();
  }, []);

  const getStoresHandler= async ()=>{
    try{
      const res= await getStores();
      const json= await res.json();

      if(!res.ok || !json.success)
        responseMessageSetter(false, json.message || "خطأ فى جلب المتاجر المتاحة", setResponseMessage);

const preparedStores = json.data.map(store => ({
  _id: store._id,
  name: store.store_name || 'متجر بدون اسم',
  products: `${store.total_products || 0} | منتج`,
  img: store.image,
  rating: `${store.total_rates || 0} | تقييم`,
  stars: `${parseFloat(store.average_rating || 0).toFixed(2)} `
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

  const handleCardClick = (storeId) => {
    navigate(`/stores/${storeId}/products`);
  };

  const formattedImage = (imgPath) => {
    if(!imgPath) return "/images/store/eyeshadow.jpg";
    return imgPath.replace(/\\/g, "//").replace("uploads", "http://127.0.0.1:8080");
  }

  const firstFourStores= stores?.slice(0, 4);
  const hiddenStores= stores?.slice(4);
  return (
    <div className="page-container">
      <div className="header-main">
        <h1>جميع المتاجر المتوفرة</h1>
        <p> أكتشف أفضل محلات التجميل في مدينتك </p>
      </div>

      <div className="grid">
        {firstFourStores?.map((store, index) => (
          <div key={index} className="card" onClick={() => handleCardClick(store._id)}>
            <img src={formattedImage(store.img)} alt={store.name} onError={(e) => { e.target.src = "/images/store/eyeshadow.jpg"; }} />
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
            <img src={store.img || "/images/store/eyeshadow.jpg"} alt={store.name} onError={(e) => { e.target.src = "/images/store/eyeshadow.jpg"; }} />
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
          <div className="glamour-quote"> تألق بجمالك الخاص </div>
        </div>
      </div>
    </div>
  );
};

export default Stores;