import { getCurrentUser } from "./users";
import { apiUrl } from "./apiConfig";

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
    const res = await fetch(apiUrl("/stores/"), {
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
    const res = await fetch(apiUrl(`/stores/${store_id}`), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res;
  } catch (error) {
    throw error;
  }
};