import { getAccessToken, getSessionId } from "./authService";

const BASE_URL = "http://localhost:8080/cart";

export const addToCart= async (productId, setResponseMessage) => {
    try {
        const sid = getSessionId();
        let accessToken = await getAccessToken(setResponseMessage);
        let headers=  { 
            "Content-Type": "application/json",
        };

        if(accessToken)
            headers["Authorization"] = `Bearer ${accessToken}`;

        const res  = await fetch(`${BASE_URL}/product`, {
        method:  "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
            session_id: sid,
            product_id: String(productId),
            quantity:   1,
        }),
        });
        return res;

    } catch (err) {
        throw err;
    }
}

export const removeFromCart= async (productId, storeId, removeAll, setResponseMessage) => {
    try {
        const sid = getSessionId();
        let accessToken = await getAccessToken(setResponseMessage);

        const res = await fetch(`${BASE_URL}/product/${productId}`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization":`Bearer ${accessToken}`,
            },
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
}

export const getCart = async(setResponseMessage) => {
    try {
        const sid = getSessionId();
        let accessToken = await getAccessToken(setResponseMessage);

        const res = await fetch(`${BASE_URL}/?session_id=${sid}`, {
            headers:{
                "Content-Type": "application/json",
                "Authorization":`Bearer ${accessToken}`,
            },
            credentials: "include",
        });
        return res;

    } catch (err) {
        throw err;
    }
}