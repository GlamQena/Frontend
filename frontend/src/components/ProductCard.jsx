import React from "react";

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <img
        src={
          product.images?.[0]
            ? `${process.env.REACT_APP_API_URL || "http://localhost:8080"}/${product.images[0]}`
            : "/placeholder.png"
        }
        alt={product.name}
      />

      <h4>{product.name}</h4>
      <p>{product.price} ج.م</p>

      <button>أضف للسلة</button>
    </div>
  );
};

export default ProductCard;
