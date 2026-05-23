import "./Login.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  loginSchema,
  responseMessageSetter,
  login,
  getSessionId
} from "../../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({
    success: false,
    message: "",
  });

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  let id = null, role = null;

  try {
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      role = decodedToken.role;
      id = decodedToken.id;
    }
  } catch (e) {
    console.error("error decoding the activation token", e);
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { usernameOrEmail: "", password: "", activationCode: "", rememberMe: false },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const onSubmit = async (formData) => {
    setIsLoading(true);
    setSubmitMessage({ success: false, message: "" });

    const bodyData = {
      usernameOrEmail: formData.usernameOrEmail,
      password: formData.password,
      rememberMe: formData.rememberMe,
    };

    if (token && id) {
      if (!formData.activationCode) {
        setIsLoading(false);
        return responseMessageSetter(false, "كود التفعيل مطلوب", setSubmitMessage);
      }
      bodyData.activationCode = formData.activationCode;
    }

    const session_id = getSessionId();
    bodyData["session_id"] = session_id;

    try {
      const response = await login(bodyData, token);
      const data = await response.json();

      if (response.ok) {
        const user = data.user;
        localStorage.removeItem("session_id");
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        responseMessageSetter(true, data.message, setSubmitMessage);

        if (token && id) navigate("/reset-password");
        else if (user.role === "store_owner") navigate("/dashboard/store_owner");
        else navigate("/");
      } else {
        responseMessageSetter(false, data.message || "خطأ في تسجيل الدخول", setSubmitMessage);
      }
    } catch (error) {
      responseMessageSetter(false, error.message || "تعذر الاتصال بالخادم", setSubmitMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (validationErrors) => {
    const firstError = Object.values(validationErrors)[0];
    if (firstError?.message) {
      setSubmitMessage({ success: false, message: firstError.message });
    }
  };

  return (
    <div className="container">
      <div className="login-header">
        <h2>مرحباً بك في Glam Qena</h2>
        <p className="hint">سجل دخولك أو أنشئ حساب جديد</p>
      </div>
      <div className="login-card">
        <div className="tabs-container">
          <button className="tab-btn active">تسجيل دخول</button>
          <button className="tab-btn" onClick={() => navigate("/register")}>
            حساب جديد
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="login-form">
          {submitMessage.message && (
            <p className={`submit-message ${submitMessage.success ? "success-message" : "error-message"}`}>
              {submitMessage.message}
            </p>
          )}

          <div className="form-group">
            <label>
              اسم المستخدم أو البريد الإلكتروني <span className="required-star">*</span>
            </label>
            <input
              type="text"
              className={errors.usernameOrEmail?.message ? "error" : ""}
              placeholder="اسم المستخدم أو البريد الإلكتروني"
              {...register("usernameOrEmail")}
            />
            {errors.usernameOrEmail?.message && (
              <p className="field-error">{errors.usernameOrEmail.message}</p>
            )}
          </div>

          <div className="form-group">
            <label>
              كلمة المرور <span className="required-star">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className={errors.password?.message ? "error" : ""}
                placeholder="........"
                {...register("password")}
              />
              <button
                type="button"
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password?.message && (
              <p className="field-error">{errors.password.message}</p>
            )}
          </div>

          {(token && id) && (
            <div className="form-group">
              <label>
                كود التفعيل <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className={errors.activationCode?.message ? "error" : ""}
                placeholder="أدخل الكود المكون من 6 أرقام"
                {...register("activationCode")}
              />
              {errors.activationCode?.message && (
                <p className="field-error">{errors.activationCode.message}</p>
              )}
            </div>
          )}

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" {...register("rememberMe")} />
              تذكرني (لمدة 30 يوماً)
            </label>
            <Link to="/reset-password" className="forgot-password">
              نسيت كلمة المرور؟
            </Link>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="login-loading">
                <span className="spinner-dot"></span>
                <span className="spinner-dot"></span>
                <span className="spinner-dot"></span>
              </span>
            ) : (
              <>تسجيل الدخول ←</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
