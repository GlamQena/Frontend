// import React, { useState, useEffect } from "react";
import React, { useState, useEffect } from "react";
import { useTheme } from "../../components/ThemeProvider";
import { useParams } from "react-router-dom";
// import { FaSun, FaMoon, FaHeart, FaShoppingBag, FaStar } from "react-icons/fa";
import { 
  FaSun,
  FaMoon,
  FaHeart,
  FaShoppingBag,
  FaStar,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import "./ProductDetails.css";
import "../../components/Navbar"
import { useCart } from "./CartContext";
import { addToWishlist } from "../../services/users";
import { responseMessageSetter } from "../../services/authService";

export default function ProductDetails() {
  const { productId } = useParams();
  const [quantity, setQuantity] = useState(0);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const {cart, addToCartHandler} = useCart();
  const [responseMessage, setResponseMessage] = useState({success: false, message: ""});

  useEffect(() => {
    fetch(`http://localhost:8080/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const product = data.data.product;
          setProduct(product);
          setQuantity(cart[product._id] || 1);
          setReviews(data.reviews);
        } else {
          console.log("error fetching product details or the success property isn't the response data");
        }
      })
      .catch((err) => console.log("Fetch error:", err));
  }, [productId]);

  const addToWishlistHandler = async () => {
    try {
      const res = await addToWishlist(productId, setResponseMessage);
      const data = await res.json();

      if (!res.ok) {
        return responseMessageSetter(false, data.message || "خطأ فى الإضافة لقائمة الرغبات", setResponseMessage);
      }

      localStorage.setItem("user", JSON.stringify(data.updatedClientData));

      responseMessageSetter(true, data.message || "تمت الإضافة إلى قائمة الرغبات بنجاح", setResponseMessage);
    } catch (err) {
      console.log(err.message);
      responseMessageSetter(false, "خطأ فى الإضافة لقائمة الرغبات", setResponseMessage);
    }
  };

  const rateStars = (rate) => {
    const stars= [];

    for(let i=1; i<=5; i++)
      stars.push( i<=rate ? <FaStar key={i} color="#ffd700"/> : <FaStar key={i} color="#e4e5e9"/>);

    return stars;
  }

  const canAddToCart = () => {
    return product && quantity <= product.stock;
  };

  if (!product)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Loading...
      </div>
    );

const images = product.images?.map((img) => img.replace(/\\/g, "/").replace("uploads", "http://127.0.0.1:8080"));     
  return (
    <div className="page" dir="rtl">
      <div className="details-container">
        <div className="image-box">
          <button
            className="slide-btn left"
            onClick={() =>
              setCurrentImage(
                currentImage === 0
                  ? images.length - 1
                  : currentImage - 1
              )
            }
          >
            <FaChevronLeft />
          </button>

          <img
            src={images[currentImage]}
            alt={product.name}
            className="main-image"
          />

          <button
            className="slide-btn right"
            onClick={() =>
              setCurrentImage(
                currentImage === images.length - 1
                  ? 0
                  : currentImage + 1
              )
            }
          >
            <FaChevronRight />
          </button>

          {/* thumbnails */}

          <div className="thumbs">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt=""
                className={
                  currentImage === index
                    ? "thumb active"
                    : "thumb"
                }
                onClick={() => setCurrentImage(index)}
              />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="info">

          <span className="breadcrumb"> {product.store_name}</span>

          <h1 className="title ">{product.name}</h1>

          <div className="rating">
            <div className="stars">
              <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
            </div>
            <span>{product.average_rating}</span>
            <span className="rtl">{product.total_rates} reviews</span>
          </div>   

          <div className="price">
            <span>{product.price} </span>
          </div>

          <div className="stock-info">
            <span>Available Stock: {product.stock}</span>
            {product.stock < 5 && product.stock > 0 && (
              <span className="low-stock"> Only {product.stock} left!</span>
            )}
            {product.stock === 0 && (
              <span className="out-of-stock"> Out of stock</span>
            )}
          </div>

          <div className="desc">
            {product.description || "لا يوجد وصف متاح حالياً"}
          </div>

          <div className="actions">
          <div className="qty">
             <button 
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                +
              </button>
              <span>{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
          </div>
          <button className="add" onClick={
            async ()=> {
              if(canAddToCart())
                await addToCartHandler(productId, Number(quantity), setResponseMessage)
              else
                responseMessageSetter(false, "يجب ان تكون الكمية المراد اضافتها اقل من المحزون");
            }}>
            إضافة للسلة <FaShoppingBag />
          </button>
          <button className="fav" onClick= {addToWishlistHandler}>
              <FaHeart />
            </button>
          </div>

          <div className="desc">
            <h3>توصيل سريع</h3>
            <span>يصلك خلاص 24 ساعة عمل من طلبك</span>
          </div>
        </div>
      </div>
      <br />
      <br />
      <div className="break"></div>
      {/* Reviews */}
      <div className="reviews">

        <div className="reviews-header">
          <h3>تقييمات العملاء</h3>
          <span className="view-all">عرض الكل</span>
        </div>

        {product.hasReviewed && <div className="reviews-grid">
          {reviews?.map((review) => (
            <div className="review-card">
              <div className="review-top">
                <div className="user">
                  <div>
                  <div className="avatar">ن</div>
                    <h4>{(review.client_id.firstName || "") + " " + (review.client_id.lastName || "") }</h4>
                    <span>منذ شهر</span>
                  </div>
                  <div className="stars">
                    {rateStars(review.rate)}
                  </div>
                </div>
              </div>

              <p>
                {review.comment}
              </p>
            </div>
          ))}
        </div>
        }
          {responseMessage.message && <p className= {`response-message ${responseMessage.success ? "success-message" : "error-message"}`}>{responseMessage.message}</p>}
      </div>
    </div>
  );
}