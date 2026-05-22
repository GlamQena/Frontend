import { api } from './authService';
import { getCurrentUser } from './users';

// ─────────────────────────────────────────────
//   user._id
// ─────────────────────────────────────────────
const getStoreId = () => {
  const user = getCurrentUser();
  if (!user) return null;
  return user._id;  
};

// ─────────────────────────────────────────────
// 1. (GET /stores/:id/products)
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
// 2.(POST /products)
// ─────────────────────────────────────────────
export const addProduct = async (formData) => {
  const response = await api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// ─────────────────────────────────────────────
// 3. (PUT /products/:id)
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
// 5.(GET /categories)
// ─────────────────────────────────────────────
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

// ─────────────────────────────────────────────
// 6.   (GET /products/special) - 
// ─────────────────────────────────────────────
export const getSpecialProducts = async (params = {}) => {
  try {
    const { limit = 4, status = 'تم التوصيل', start_date, end_date } = params;
    
    // بناء query string
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit);
    queryParams.append('status', status);
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    
    // استخدام الـ api instance
    const response = await api.get(`/products/special?${queryParams.toString()}`);
    return response.data;
    
  } catch (error) {
    console.error('Error in getSpecialProducts:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// 7.   (GET /products/:id) -
// ─────────────────────────────────────────────
export const getProductById = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getProductById:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// 8.   (GET /products) 
// ─────────────────────────────────────────────
export const getAllProducts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/products?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────

//    (PATCH /products/:id?activate=true/false)
// ─────────────────────────────────────────────
export const toggleProductStatus = async (id, isActive) => {
  try {
    const response = await api.patch(`/products/${id}/activation?activate=${isActive}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};