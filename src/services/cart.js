import { getAccessToken, getSessionId, sid_AuthHeader } from "./authService";
import { apiUrl } from "./apiConfig";

export const addToCart = async (productId, quantity = 1) => {
  try {
    const { sid, headers } = await sid_AuthHeader();

    const res = await fetch(apiUrl("/cart/product"), {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({
        session_id: sid,
        product_id: String(productId),
        quantity,
      }),
    });
    return res;
  } catch (err) {
    throw err;
  }
};

export const removeFromCart = async (productId, storeId, removeAll) => {
  try {
    const { sid, headers } = await sid_AuthHeader();

    const res = await fetch(apiUrl(`/cart/product/${productId}`), {
      method: "DELETE",
      headers,
      credentials: "include",
      body: JSON.stringify({
        session_id: sid,
        owner_store_id: storeId,
        remove_all: removeAll,
      }),
    });

    return res;
  } catch (err) {
    throw err;
  }
};

export const getCart = async () => {
  try {
    const { sid, headers } = await sid_AuthHeader();

    const res = await fetch(apiUrl(`/cart/?session_id=${sid}`), {
      headers,
      credentials: "include",
    });
    return res;
  } catch (err) {
    throw err;
  }
};
