import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { getCart, addToCart } from "../../services/cart";
import { responseMessageSetter } from "../../services/authService";
import { isUserLogged } from "../../services/authService";
import { isClient } from "../../services/users";

const CartContext = createContext({
  cart: {},
  addToCartHandler: async () => {},
  refreshCart: async () => {},
  cartEnabled: false,
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({});
  const [authTick, setAuthTick] = useState(0);

  useEffect(() => {
    const onChange = () => setAuthTick((t) => t + 1);
    window.addEventListener("auth-changed", onChange); //dispatched in login, register and logout
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("auth-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const cartEnabled = useMemo(
    () => !isUserLogged() || isClient(),
    [authTick],
  );

  const loadCart = useCallback( async () => {
    try {
      if(!cartEnabled){
        setCart({});
        return;
      }

      const res = await getCart();
      const resData = await res.json();
      console.log("load cart resData =>", resData);

      if (res.ok && resData.success) {
        const Cart = {};
        resData.data?.products?.forEach(store => {
          store.products?.forEach(product => {
            Cart[product.product_id] = product.quantity || 1;
          });
        });
        setCart(Cart);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  }, [cartEnabled]);
  
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Add to cart
  const addToCartHandler = useCallback( async (productId, quantity = 1, setResMessage) => {
    try {
      if (!cartEnabled) {
        if (setResMessage) {
          responseMessageSetter(
            false,
            "هذا الحساب غير مسموح له بالشراء",
            setResMessage,
          );
        }
        return;
      }

      const res = await addToCart(productId, quantity);
      const resData = await res.json();

      if (res.ok && resData.success) {
        console.log("Product added to cart... resData =>", resData);
        await loadCart();

        // if (setResMessage) {
        //   responseMessageSetter(true, "تم إضافة المنتج للسلة", setResMessage);
        // }
      } else if (setResMessage) {
        responseMessageSetter(false, resData.message || "فشل إضافة المنتج للسلة", setResMessage);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      if (setResMessage) {
        responseMessageSetter(false, err.message || "فشل إضافة المنتج للسلة", setResMessage);
      }
    }
  }, [cartEnabled, loadCart]);

  const refreshCart = loadCart;

  const value = useMemo(
    () => ({ cart, addToCartHandler, refreshCart, cartEnabled }),
    [cart, addToCartHandler, refreshCart, cartEnabled],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};