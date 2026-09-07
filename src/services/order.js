import { getAccessToken } from "./authService";

const API_BASE_URL =
  process.env.EXPRESS_APP_API_URL || "https://glamqena-backend.vercel.app";
const BASE_URL = `/api/order`;

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

export const placeOrder = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
    credentials: "include",
  });

  return handleResponse(res);
};

export const checkoutPayment = async (orderId, body) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/${orderId}/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body,
    credentials: "include",
  });

  return handleResponse(res);
};

export const getOrdersHistory = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/history`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    withCredentials: true,
  });

  return handleResponse(res);
};

export const getOrderDetails = async (orderId) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/${orderId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    withCredentials: true,
  });

  return handleResponse(res);
};

export const cancelOrder = async (orderId, body) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(
    `${BASE_URL}/${orderId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      withCredentials: true,
    },
    body,
  );

  return handleResponse(res);
};
