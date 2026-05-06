import React, { useState } from "react";
import { FaSun, FaMoon, FaHeart, FaShoppingBag, FaStar } from "react-icons/fa";
import "./ProductDetails.css";

export default function ProductDetails() {
  const [darkMode, setDarkMode] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const product = {
    name: "Maybelline SuperStay Matte Ink",
    price: 165,
    oldPrice: 210,
    rating: 4.9,
    reviews: "1,234 reviews",
    description:
      "أحمر شفاه سائل بلمسة مطفية نهائية تدوم طويلاً. تركيبته فريدة تمنحك لوناً غنياً وتركيزاً عالياً بمسحة واحدة فقط.",
    // image:
// "https://www.google.com/aclk?sa=L&ai=DChsSEwjmlarexoyUAxWOlYMHHU9wCHoYACICCAEQBxoCZWY&co=1&ase=2&gclid=Cj0KCQjw77bPBhC_ARIsAGAjjV8VzdijRFnWwDpJxTJETQTtShyWlrqJNpdvEcPVStVDAC4JJtTgz2caAiX3EALw_wcB&cid=CAASugHkaNcvGhzpjiRnlK1BhydQGGtIONdED11NGCHajBYBp_jOkn8ryykBvPTWTDPQWb-vh5iNLpFcweYxBDg13NppcCUJJdR5xeTwBEXUslD-qCscOaXnL9fcwbz-bByJQf-L_X0udJ_IF9aQTGqbXOKg0OFizVrJLpdohn92GEXKmd3oykphk2a-jdj1ia3PrD1hQRpbukM8Godd6KIHCjoqcs0fG451l6MHEsDbKqz50uUKctyeFKhne4Q&cce=2&category=acrcp_v1_32&sig=AOD64_2xffeklbGaGohivgmxpQT-YIPI_Q&ctype=5&q=&nis=4&ved=2ahUKEwjp6qbexoyUAxW-0wIHHVpEDBYQ9aACKAB6BAgJECQ&adurl= ",

    brand: "Maybelline NY",
    type: "Liquid",
    finish: "Matte",
    size: "5ml",
  };

  return (
    <div className={`page ${darkMode ? "dark" : ""}`}>

      <button className="mode-btn" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? <FaSun /> : <FaMoon />}
      </button>

      <div className="container">

        <div className="image-box">
          <img src={product.name} alt="" />
        </div>

        <div className="info">

          <span className="breadcrumb">متجر  نور للتجميل</span>

          <h1 className="title ltr">{product.name}</h1>

          <div className="rating">
            <div className="stars">
              <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
            </div>
            <span>{product.rating}</span>
            <span className="ltr">({product.reviews})</span>

          </div>

          <div className="price">
            <span className="new">{product.price} ج</span>
            <span className="old"> {product.oldPrice} ج</span>

          </div>

         
          <div className="details-row">

            <div className="desc">
              {product.description}
            </div>
          </div>

            <div className="specs">
              <div className="spec ltr">الماركة: {product.brand}</div>
              <div className="spec ltr">النوع: {product.type}</div>
              <div className="spec ltr">الحجم: {product.size}</div>
              <div className="spec ltr">اللمسة النهائية: {product.finish}</div>
            </div>

          <div className="actions">

            <div className="qty">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>

            

            <button className="add">
              إضافة للسلة <FaShoppingBag />
            </button>
            <button className="fav">
              <FaHeart />
            </button>

          </div>

        </div>
        
      </div>
      

          

<br className="linereview" />
      {/* Reviews */}
      <div className="reviews">
        <h3>تقييمات العملاء</h3>

        <div className="reviews-grid">
          <div className="card">
            ⭐⭐⭐ المنتج ثابت جدًا وجميل
          </div>
          <div className="card">
            ⭐⭐⭐ جودة ممتازة والتوصيل سريع
          </div>
        </div>
      </div>

    </div>
  );
}