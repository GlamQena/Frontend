import { getAccessToken, getSessionId, sid_AuthHeader } from "./authService";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
const BASE_URL = `${API_BASE_URL}/cart`;

export const addToCart = async (
  productId,
  setResponseMessage,
  quantity = 1,
) => {
  try {
    const { sid, headers } = await sid_AuthHeader(setResponseMessage);

    const res = await fetch(`${BASE_URL}/product`, {
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

export const removeFromCart = async (
  productId,
  storeId,
  removeAll,
  setResponseMessage,
) => {
  try {
    const { sid, headers } = await sid_AuthHeader(setResponseMessage);

    const res = await fetch(`${BASE_URL}/product/${productId}`, {
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

export const getCart = async (setResponseMessage) => {
  try {
    const { sid, headers } = await sid_AuthHeader(setResponseMessage);

    const res = await fetch(`${BASE_URL}/?session_id=${sid}`, {
      headers,
      credentials: "include",
    });
    return res;
  } catch (err) {
    throw err;
  }
};
