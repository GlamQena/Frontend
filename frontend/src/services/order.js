import { getAccessToken } from "./authService";

const BASE_URL = "http://localhost:8080/order";

export const placeOrder= async(setResponseMessage) => {
    try{
        const accessToken = await getAccessToken(setResponseMessage);
        const res= await fetch(`${BASE_URL}/`, {
            method: "POST",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({}),
            credentials: "include",
        });
        return res;

    }catch(error){
        throw error;
    }
}

export const checkoutPayment = async (orderId, body, setResponseMessage) => {
    try{
        const accessToken = await getAccessToken(setResponseMessage);

        const res= await fetch(`${BASE_URL}/${orderId}/payment`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body,
            credentials: "include",
        });

        return res;
    }catch(error){
        throw error;
    }
}