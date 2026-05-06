import { getAccessToken } from "./authService";

const BASE_URL = "http://localhost:8080/stores";

export const getStores= async() => {
    try{
        const res= await fetch(`${BASE_URL}/`, {
            headers:{
                "Content-Type": "application/json",
            },
        });
        return res;

    }catch(error){
        throw error;
    }
}

export const getStoreProducts= async(store_id) => {
    try{
        const res= await fetch(`${BASE_URL}/${store_id}`, {
            headers:{
                "Content-Type": "application/json",
            },
        });
        return res;

    }catch(error){
        throw error;
    }
}
