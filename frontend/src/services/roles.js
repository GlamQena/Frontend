import axios from "axios";
import { getAccessToken } from "../services/authService";

// ─────────────────────────────────────────────
// AXIOS INSTANCE
// ─────────────────────────────────────────────
const api = axios.create({
  baseURL: "http://localhost:8080",
});

// ─────────────────────────────────────────────
// INTERCEPTOR (AUTO TOKEN ATTACH)
// ─────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken(() => {});

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (err) {
      return Promise.reject(err);
    }
  },
  (error) => Promise.reject(error)
);

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

// ─────────────────────────────────────────────
// ROLE
// ─────────────────────────────────────────────
export const getUserRole = () => {
  return getCurrentUser()?.role || null;
};

// ─────────────────────────────────────────────
// ROLE CHECKERS
// ─────────────────────────────────────────────
export const isClient = () => getUserRole() === "client";

export const isStoreOwner = () => getUserRole() === "store_owner";

export const isAdmin = () => getUserRole() === "admin";

// ─────────────────────────────────────────────
// STORE HELPERS (ONLY FOR STORE OWNER)
// ─────────────────────────────────────────────
export const getStoreInfo = () => {
  const user = getCurrentUser();

  if (user?.role !== "store_owner") return null;

  return {
    storeId: user.store_id,
    storeName: user.store_name,
    storeStatus: user.store_status,
  };
};

export default api;