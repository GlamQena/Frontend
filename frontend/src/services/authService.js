import axios from "axios";
import * as yup from "yup";

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

//yup shared schemas
const passwordField= yup.string().required("كلمة المرور مطلوبة")
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .max(64, "كلمة المرور يجب ألا تتجاوز 64 حرف")
      .matches(/[A-Z]/, "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
      .matches(/[a-z]/, "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل")
      .matches(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")

const emailField= yup.string().email().required("يرجى إدخال الإيميل").max(254, "البريد الإلكتروني يجب ألا يتجاوز 254 حرف");

export {passwordField, emailField};