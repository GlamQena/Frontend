import { getAccessToken } from "./authService";
import { getCurrentUser } from "./users";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
const BASE_URL = `${API_BASE_URL}/stores`;

// ─────────────────────────────────────────────
// STORE HELPER
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

export const getStores = async () => {
  try {
    const res = await fetch(`${BASE_URL}/`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res;
  } catch (error) {
    throw error;
  }
};

export const getStoreProducts = async (store_id) => {
  try {
    const res = await fetch(`${BASE_URL}/${store_id}/products`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res;
  } catch (error) {
    throw error;
  }
};
