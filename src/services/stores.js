import { getCurrentUser } from "./users";

const API_BASE_URL =
  process.env.EXPRESS_APP_API_URL || "https://glamqena-backend.vercel.app";
const BASE_URL = `/api/stores`;

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
