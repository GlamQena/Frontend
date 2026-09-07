import { getAccessToken } from "./authService";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
const BASE_URL = `/users`;

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

// Helper function to create auth errors
const createAuthError = () => {
  const error = new Error("Your session has expired. Please login again.");
  error.code = "AUTH_EXPIRED";
  return error;
};

// Helper function to handle fetch responses
const handleResponse = async (response) => {
  if (response.status === 401) {
    const error = createAuthError();
    // Try to get the response message for additional context
    try {
      const data = await response.json();
      error.message = data.message || error.message;
    } catch (e) {
      // If response doesn't have JSON body, use default message
    }
    throw error;
  }
  return response;
};

export const getWishlist = async () => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/me/wishlist`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  return handleResponse(res);
};

export const addToWishlist = async (prod_id) => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/me/wishlist?productId=${prod_id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  return handleResponse(res);
};

export const removeFromWishlist = async (prod_id) => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/me/wishlist?productId=${prod_id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  return handleResponse(res);
};