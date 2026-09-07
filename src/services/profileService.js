import { getAccessToken } from "./authService";

const API_BASE_URL =
  process.env.EXPRESS_APP_API_URL || "https://glamqena-backend.vercel.app";
const BASE_URL = `/profile`;

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

export const getProfile = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  return handleResponse(res);
};

export const changePassword = async (data) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/change-password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    body: data,
  });

  return handleResponse(res);
};

export const editAvatar = async (data) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/avatar`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    body: data,
  });

  return handleResponse(res);
};

export const deleteAvatar = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/avatar`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  return handleResponse(res);
};

export const editStoreLogo = async (data) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/store-logo`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    body: data,
  });

  return handleResponse(res);
};

export const deleteStoreLogo = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/store-logo`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  return handleResponse(res);
};

export const editProfile = async (data) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/edit`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return handleResponse(res);
};

export const deleteProfile = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw createAuthError();
  }

  const res = await fetch(`${BASE_URL}/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  return handleResponse(res);
};
