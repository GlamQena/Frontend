import { getAccessToken } from "./authService";

const BASE_URL = "http://localhost:8080/users";

// ─────────────────────────────────────────────
// GET USER FROM LOCAL STORAGE
// ─────────────────────────────────────────────
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("user");
    if (!user || user === "undefined") return null;

    return JSON.parse(user);
  } catch (err) {
    console.log("USER ERROR =>", err);
    return null;
  }
};

export const getUserRole = () => {
  return getCurrentUser()?.role || null;
};

// ─────────────────────────────────────────────
// ROLE CHECKERS
// ─────────────────────────────────────────────
export const isClient = () => getUserRole() === "client";

export const isStoreOwner = () => getUserRole() === "store_owner";

export const isAdmin = () => getUserRole() === "admin";

export const addToWishlist= async(prod_id, setResponseMessage) => {
    try{
        const accessToken = await getAccessToken(setResponseMessage);
        const res= await fetch(`${BASE_URL}/me/wishlist?productId=${prod_id}`, {
            method: "POST",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            credentials: "include",
        });
        return res;

    }catch(error){
        throw error;
    }
}

export const removeFromWishlist= async(prod_id, setResponseMessage) => {
    try{
        const accessToken = await getAccessToken(setResponseMessage);
        const res= await fetch(`${BASE_URL}/me/wishlist?productId=${prod_id}`, {
            method: "Delete",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            credentials: "include",
        });
        return res;

    }catch(error){
        throw error;
    }
}
