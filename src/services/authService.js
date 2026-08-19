import axios from "axios";
import * as yup from "yup";
import { getCurrentUser } from "./users";
import { getProfile } from "./profileService";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
const BASE_URL = `${API_BASE_URL}/auth`;

// ─────────────────────────────────────────────
// AXIOS INSTANCE
// ─────────────────────────────────────────────
export const api = axios.create({
  baseURL: API_BASE_URL,
});

// ─────────────────────────────────────────────
// INTERCEPTOR (AUTO BEARER TOKEN ATTACH)
// ─────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken(() => {});

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (err) {
      return Promise.reject(err);
    }
  },
  (error) => Promise.reject(error),
);

export const isUserLogged = () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken || refreshToken === "undefined" || refreshToken === "null")
    return false;

  try {
    const user = getCurrentUser();
    if (!user) return false;
    return user && Object.keys(user).length > 0;
  } catch {
    return false;
  }
};

export const getSessionId = () => {
  let sid = localStorage.getItem("session_id");
  if (!sid && !isUserLogged()) {
    sid = crypto.randomUUID();
    localStorage.setItem("session_id", sid);
  }
  return sid;
};

export const getAccessToken = async (setResponseMessage) => {
  try {
    let accessToken = localStorage.getItem("accessToken");
    
    // If no access token, try to refresh
    if (!accessToken || accessToken === "undefined" || accessToken === "null") {
      return await refreshAccessToken(setResponseMessage);
    }

    const decodedAccessToken = JSON.parse(atob(accessToken.split(".")[1]));
    const accessTokenEXP = decodedAccessToken.exp * 1000;

    if (accessTokenEXP < Date.now()) {
      return await refreshAccessToken(setResponseMessage);
    }
    
    return accessToken;
    
  } catch (error) {
    // Only show error if setResponseMessage exists
    if (setResponseMessage) {
      responseMessageSetter(false, "your session ended, please login", setResponseMessage);
    }
    return null;
  }
};

const refreshAccessToken = async (setResponseMessage) => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken || refreshToken === "null" || refreshToken === "undefined") {
      return null;
    }

    // Check if refresh token is expired
    try {
      const decodedRefreshToken = JSON.parse(atob(refreshToken.split(".")[1]));
      const refreshTokenEXP = decodedRefreshToken.exp * 1000;

      if (refreshTokenEXP < Date.now()) {
        await logoutSilently();
        return null;
      }
    } catch (decodeError) {
      return null;
    }

    const response = await fetch(`${BASE_URL}/refresh-token`, {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        "Content-Type": "application/json",
      },
    });
    
    const refreshData = await response.json();
    console.log("refresh token response => ", refreshData);
    
    if (!response.ok) {
      return null;
    }

    localStorage.setItem("user", JSON.stringify(refreshData.user));
    localStorage.setItem("accessToken", refreshData.accessToken);
    return refreshData.accessToken;

  } catch (error) {
    console.error("Refresh error:", error);
    return null;
  }
};

export const sid_AuthHeader = async (setResponseMessage) => {
  const sid = getSessionId();
  let headers = {
    "Content-Type": "application/json",
  };

  let accessToken = await getAccessToken(setResponseMessage);
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  return { sid, headers };
};

const logoutSilently = async () => {
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("session_id");
  } catch (error) {
    console.error("Silent logout error:", error);
  }
};

export function responseMessageSetter(success, message, setResponseMessage) {
  if (setResponseMessage) {
    setResponseMessage({ success, message });

    setTimeout(() => {
      setResponseMessage({ success: false, message: "" });
    }, 6000);
  }
}

export function closeTabHandler() {
  window.removeEventListener("beforeunload", beforeUnloadHandler);
  window.addEventListener("beforeunload", beforeUnloadHandler);
} //doesn't called properly

const beforeUnloadHandler = async () => {
  await logout();
};

export const registerUser = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/register`, data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const login = async (bodyData, activationToken) => {
  try {
    console.log("login fetch entry...");

    const response = await fetch(
      `${BASE_URL}/login${activationToken ? `token=${activationToken}` : ""}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      },
    );

    console.log("login response => ", response);
    return response;
  } catch (error) {
    throw error; //throw instead of just return for the error to be handled with try-catch
  }
};

export const sendOtp = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/password/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return response;
  } catch (error) {
    throw error;
  }
};

export const verifyOtp = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/password/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return response;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return response;
  } catch (error) {
    throw error;
  }
};

export const getEmailToken = async (email) => {
  try {
    const res = await fetch(`${BASE_URL}/email/send-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    return res;
  } catch (err) {
    throw err;
  }
};

export const verifyEmail = async (email, token) => {
  try {
    const res = await fetch(`${BASE_URL}/verify/${email}/${token}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return res;
  } catch (err) {
    throw err;
  }
};

export const logout = async () => {
  try {
    const session_id = localStorage.getItem("session_id");

    const response = await fetch(
      `${BASE_URL}/logout${session_id ? `?session_id=${session_id}` : ""}`,
      { method: "DELETE" },
    );

    const logoutData = await response.json();
    if (!response.ok) console.error(logoutData.message);
    console.log(logoutData.message);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("session_id");

    window.location.reload();
  } catch (error) {
    throw error;
  }
};

const passwordField = yup
  .string()
  .required("كلمة المرور مطلوبة")
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .max(64, "كلمة المرور يجب ألا تتجاوز 64 حرف")
  .matches(/[A-Z]/, "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
  .matches(/[a-z]/, "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل")
  .matches(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل");

export const emailField = yup
  .string()
  .email()
  .required("يرجى إدخال الإيميل")
  .max(254, "البريد الإلكتروني يجب ألا يتجاوز 254 حرف");

// Define validation schemas
export const loginSchema = yup.object({
  usernameOrEmail: yup
    .string()
    .required("يرجى إدخال اسم المستخدم أو البريد الإلكتروني")
    .test("usernameOrEmail", "صيغة غير صالحة!", function (value) {
      if (value.includes("@")) {
        // Email validation
        if (value.length > 254)
          return this.createError({
            message: "البريد الإلكتروني يجب ألا يتجاوز 254 حرف",
          });

        const isValid = yup.string().email().isValidSync(value);
        if (!isValid) {
          return this.createError({
            message: "يرجى إدخال بريد إلكتروني صالح",
          });
        }
        return true;
      } else {
        // Username validation
        if (value.length < 3) {
          return this.createError({
            message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
          });
        }
        if (value.length > 64) {
          return this.createError({
            message: "اسم المستخدم لا يمكن أن يتجاوز 64 حرف",
          });
        }
        if (!/^[a-z0-9_]+$/.test(value)) {
          return this.createError({
            message:
              "اسم المستخدم يمكن أن يحتوي فقط على أحرف صغيرة وأرقام وشرطة سفلية",
          });
        }
        return true;
      }
    }),
  password: passwordField,
  activationCode: yup.string().when([], {
    is: () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      return !!token;
    },
    then: (schema) =>
      schema
        .required("activation code is required")
        .min(6, "activation code must be exactly 6 digits")
        .max(6, "activation code must be exactly 6 digits")
        .matches(/^\d+$/, "activation code must contain digits only"),
    otherwise: (schema) => schema.notRequired(),
  }),
  rememberMe: yup.boolean(),
});

export const commonFieldsSchema = {
  username: yup
    .string()
    .required("اسم المستخدم مطلوب")
    .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .max(64, "اسم المستخدم يجب أن يكون أقل من 64 حرف")
    .matches(
      /^[a-z0-9_]+$/,
      "اسم المستخدم يمكن أن يحتوي فقط على أحرف إنجليزية صغيرة وأرقام وشرطة سفلية",
    ),

  email: yup
    .string()
    .required("البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صالح")
    .max(254, "البريد الإلكتروني طويل جداً"),

  password: passwordField, // Assuming this is defined in authService

  confirmPassword: yup
    .string()
    .required("تأكيد كلمة المرور مطلوب")
    .oneOf([yup.ref("password")], "كلمة المرور غير متطابقة"),

  phone: yup
    .string()
    .notRequired()
    .transform((value) => (value?.trim() === "" ? null : value))
    .matches(
      /^01[0125][0-9]{8}$/,
      "رقم الهاتف غير صالح (يجب أن يبدأ بـ 010, 011, 012, 015 ثم 8 أرقام)",
    ),

  gender: yup
    .string()
    .nullable()
    .optional()
    .transform((value) => (!value ? null : value))
    .oneOf(["male", "female"], "الجنس يجب أن يكون ذكر أو أنثى"),

  birthdate: yup.string().nullable().optional(),

  address: yup
    .object({
      city: yup
        .string()
        .max(50, "اسم المدينة يجب أن يكون أقل من 50 حرف")
        .optional(),
      district: yup
        .string()
        .max(50, "اسم المنطقة يجب أن يكون أقل من 50 حرف")
        .optional(),
      street: yup
        .string()
        .max(100, "اسم الشارع يجب أن يكون أقل من 100 حرف")
        .optional(),
    })
    .optional(),
};

export const clientSchema = yup.object(commonFieldsSchema);

export const storeOwnerSchema = yup.object({
  ...commonFieldsSchema,
  store_name: yup
    .string()
    .required("اسم المحل مطلوب")
    .max(100, "اسم المحل يجب أن يكون أقل من 100 حرف"),

  store_email: yup
    .string()
    .required("البريد الإلكتروني للمحل مطلوب")
    .email("البريد الإلكتروني للمحل غير صالح"),

  store_phone: yup
    .string()
    .required("رقم هاتف المحل مطلوب")
    .matches(
      /^01[0125][0-9]{8}$/,
      "رقم هاتف المحل غير صالح (يجب أن يبدأ بـ 010, 011, 012, 015 ثم 8 أرقام)",
    ),

  store_address: yup.object({
    city: yup
      .string()
      .required("مدينة المحل مطلوبة")
      .max(50, "اسم المدينة يجب أن يكون أقل من 50 حرف"),
    district: yup
      .string()
      .required("منطقة المحل مطلوبة")
      .max(50, "اسم المنطقة يجب أن يكون أقل من 50 حرف"),
    street: yup
      .string()
      .required("شارع المحل مطلوب")
      .max(100, "اسم الشارع يجب أن يكون أقل من 100 حرف"),
  }),
});

export const resetPasswordSchema = yup.object({
  newPassword: passwordField,
  confirmPassword: passwordField,
});
