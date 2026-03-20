import axios from "axios";

const API_URL = "http://localhost:8080/auth";

// register
export const registerUser = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/register`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
