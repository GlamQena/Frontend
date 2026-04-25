import { getSessionId } from "./authService";

const BASE_URL = "http://localhost:8080/cart";
const sid = getSessionId();

export const addToCart= async (productId) => {
    try {
        const res  = await fetch(`${BASE_URL}/product`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
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

export const getCart = async() => {
    try {
        const res = await fetch(`${BASE_URL}/?session_id=${sid}`);
        return res;

    } catch (err) {
        throw err;
    }
}