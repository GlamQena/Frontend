import { getAccessToken } from "./authService";

const BASE_URL = "http://localhost:8080/users";

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
