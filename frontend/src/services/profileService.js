import { getAccessToken } from "./authService";

const BASE_URL = "http://localhost:8080/profile";

export const getProfile= async (setResponseMessage) => {
    try{
        const res= await fetch(`${BASE_URL}/`,{
            method: "GET",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${await getAccessToken(setResponseMessage)}`,
            },
            credentials: "include",
        });

        return res
    }catch(error){
        throw error;
    }
}

export const changePassword= async (data, setResponseMessage) => {
    try{
        const res= await fetch(`${BASE_URL}/change-password`, {
            method: "PATCH",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${await getAccessToken(setResponseMessage)}`
            },
            credentials: "include",
            body: data
        });

        return res
    }catch(error){
        throw error;
    }
}

export const editAvatar= async (data, setResponseMessage) => {
    try{
        const res= await fetch(`${BASE_URL}/avatar`, {
            method: "PATCH",
            headers: { 
                "Authorization": `Bearer ${await getAccessToken(setResponseMessage)}`
            }, //the Content-Type will be by default multipart/form-data due to the file field
            credentials: "include",
            body: data
        });

        return res
    }catch(error){
        throw error;
    }
}

export const editProfile= async (data, setResponseMessage) => {
    try{
        const res= await fetch(`${BASE_URL}/edit`, {
            method: "PUT",
            headers: { 
                "Authorization": `Bearer ${await getAccessToken(setResponseMessage)}`,
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data)
        });

        return res
    }catch(error){
        throw error;
    }
}

export const deleteProfile= async (setResponseMessage) => {
    try{
        const res= await fetch(`${BASE_URL}/delete`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${await getAccessToken(setResponseMessage)}`
            },
            credentials: "include"
        });

        return res
    }catch(error){
        throw error;
    }
}