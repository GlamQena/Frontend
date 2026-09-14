import { getAccessToken } from "./authService";
import { apiUrl } from "./apiConfig";

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

  const res = await fetch(apiUrl("/order/"), {
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

  const res = await fetch(apiUrl(`/order/${orderId}/payment`), {
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

export const getOrdersHistory = async (params) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }
  
  const cleaned = Object.fromEntries(
    Object.entries(params || {}).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );

  const queryString = new URLSearchParams(cleaned).toString();
  const res = await fetch(apiUrl(`/order/history?${queryString}`), {
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

  const res = await fetch(apiUrl(`/order/${orderId}`), {
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
    apiUrl(`/order/${orderId}/cancel`),
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
