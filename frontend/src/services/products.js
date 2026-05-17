import { api } from './authService';
import { getCurrentUser } from './users';

// ─────────────────────────────────────────────
// 
     user._id
// ─────────────────────────────────────────────
const getStoreId = () => {
  const user = getCurrentUser();
  if (!user) return null;
  return user._id;  
};

// ─────────────────────────────────────────────
// 1.    (GET /stores/:id/products)
// ─────────────────────────────────────────────
export const getProducts = async () => {
  const storeId = getStoreId();
  if (!storeId) {
    console.warn('Store ID not found');
    return { data: { products: [] } };
  }
  
  const response = await api.get(`/stores/${storeId}/products`);
  return response.data;
};

// ─────────────────────────────────────────────
// 2.   (POST /products)
// ─────────────────────────────────────────────
export const addProduct = async (formData) => {
  const response = await api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// ─────────────────────────────────────────────
// 3.   (PUT /products/:id)
// ─────────────────────────────────────────────
export const updateProduct = async (id, formData) => {
  const response = await api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// ─────────────────────────────────────────────
// 4.   (DELETE /products/:id)
// ─────────────────────────────────────────────
export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

// ─────────────────────────────────────────────
// 5.   (GET /categories)
// ─────────────────────────────────────────────
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};
