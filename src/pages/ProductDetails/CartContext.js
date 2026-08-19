import React, { createContext, useContext, useState, useEffect } from "react";
import { getCart, addToCart } from "../../services/cart";
import { responseMessageSetter } from "../../services/authService";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Simple state: { productId: quantity }
  const [cart, setCart] = useState({});

  useEffect(() => {
    const loadCart = async () => {
      try {
        const res = await getCart();
        const resData = await res.json();
        console.log("load cart resData =>", resData);

        if (resData.success || res.ok) {
          const Cart = {};
          resData.data?.products?.forEach(store => {
            store.products.forEach(product => {
              Cart[product.product_id] = product.quantity || 1;
            });
          });
          setCart(Cart);
        }
      } catch (err) {
        console.error("Error fetching cart:", err);
      }
    };
    
    loadCart();
  }, []);

  // Add to cart
  const addToCartHandler = async (productId, quantity = 1, setResMessage) => {
    try {
      const res = await addToCart(productId, setResMessage, quantity);
      const resData = await res.json();

      if (res.ok && resData.success) {
        console.log("Product added to cart... resData =>", resData);

        setCart(prev => ({
          ...prev,
          [productId]: (prev[productId] || 0) + quantity
        }));
        
        if (setResMessage) {
          responseMessageSetter(true, "تم إضافة المنتج للسلة", setResMessage);
        }
      } else if (setResMessage) {
        responseMessageSetter(false, resData.message || "فشل إضافة المنتج للسلة", setResMessage);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      if (setResMessage) {
        responseMessageSetter(false, err.message || "فشل إضافة المنتج للسلة", setResMessage);
      }
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCartHandler }}>
      {children}
    </CartContext.Provider>
  );
};