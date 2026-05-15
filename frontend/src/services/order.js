import { getAccessToken } from "./authService";
import axios from "axios";

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

export const getOrdersHistory = async (setResponseMessage) => {
    try{
        const accessToken = await getAccessToken(setResponseMessage);

        const res = await axios.get(`${BASE_URL}/history`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          withCredentials: true,
        });
        return res.data;
    }catch(error){
        if(error.response && error.response.data){
            throw error.response.data;
        }
        throw new Error("خطأ فى جلب سجل الطلبات");
    }
}

export const getOrderDetails = async (orderId, setResponseMessage) => {
    try{
        const accessToken = await getAccessToken(setResponseMessage);

        const res = await axios.get(`${BASE_URL}/${orderId}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          withCredentials: true,
        });
        
        return res.data;
    }catch(error){
        throw error.response.data;
    }
}

export const cancelOrder = async (orderId, body, setResponseMessage) => {
    try{
        const accessToken = await getAccessToken(setResponseMessage);
        const response = await axios.patch(`http://localhost:8080/order/${orderId}/cancel`, {
            headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            },
            withCredentials : true,
        }, body);

        return response.data;
    }catch(error){
        throw error.response.data
    }
}