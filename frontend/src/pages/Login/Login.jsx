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

  // إظهإر او اخفاء الباسورد
  const [showPassword, setShowPassword] = useState(false);

  const [submitMessage, setSubmitMessage] = useState({
    success: false,
    message: "",
  });

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  let id= null, role= null;

  try{
    if(token){
      console.log("Token received:", token.substring(0, 50) + "...");
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      role = decodedToken.role;
      id = decodedToken.id;
      console.log("Decoded token successfully:", { role, id });
    }
  }catch(e){
    console.error("error decoding the activation token", e);
  }

  let {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { usernameOrEmail: "", password: "", activationCode:"", rememberMe: false},
    mode: "onChange",
  });

  const onSubmit = async (formData) => {
    console.log("form data-> ", formData);

    const bodyData = {
      usernameOrEmail: formData.usernameOrEmail,
      password: formData.password,
      rememberMe: formData.rememberMe
    };

    if(token && id){
      if(!formData.activationCode)
        return responseMessageSetter(false, "activation code is required", setSubmitMessage);
      bodyData.activationCode = formData.activationCode;
    }

    const session_id= getSessionId();
    bodyData["session_id"] = session_id;
    console.log("data to be sent to login-> ", bodyData);

    try {
      const response = await login(bodyData, token);
      const data = await response.json();

      if (response.ok) {
        console.log(data);
        const user = data.user;
        localStorage.removeItem("session_id");
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        responseMessageSetter(true, data.message, setSubmitMessage);

        if(token && id)
          navigate("/reset-password");
        else if(user.role === "store_owner") navigate("/dashboard/store_owner");
        else navigate("/"); //client usual home
      } else {
        console.log("error logging in");
        responseMessageSetter(false, data.message, setSubmitMessage);
      }
    } catch (error) {
      console.log("error logging in", error);
      responseMessageSetter(false, error.message, setSubmitMessage);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h2>مرحباً بك في Glam Qena</h2>
        <p className="hint">سجل دخولك أو أنشئ حساب جديد</p>
      </div>
      <div className="login-card">
        {/* أزرار التبديل بين دخول وحساب جديد */}
        <div className="tabs-container">
          <button className="tab-btn active">تسجيل دخول</button>
          <button className="tab-btn" onClick={() => navigate("/register")}>
            حساب جديد
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {submitMessage.message && (
            <p
              className={`submit-message ${submitMessage.success ? "success-message" : "error-message"}`}
            >
              {submitMessage.message}
            </p>
          )}

          <div className="form-group">
            <label>
              اسم المستخدم أو البريد الإلكتروني{" "}
              <span className="required-star">*</span>
            </label>
            <input
              type="text"
              name="usernameOrEmail"
              className={errors.usernameOrEmail?.message ? "error" : ""}
              placeholder="اسم المستخدم أو البريد الإلكتروني"
              {...register("usernameOrEmail")}
            />
            {errors.usernameOrEmail?.message && (
              <p className="field-error">{errors.usernameOrEmail?.message}</p>
            )}
          </div>

          <div className="form-group">
            <label>
              كلمة المرور <span className="required-star">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
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
              <p className="field-error">{errors.password?.message}</p>
            )}
          </div>

          {(token && id) &&
          <div className="form-group">
            <label>
             كود التفعيل <span className="required-star">*</span>
            </label>
            <input
              type="text"
              name="activationCode"
              className={errors.activationCode?.message ? "error" : ""}
              placeholder="........"
              {...register("activationCode")}
            />
            {errors.activationCode?.message && (
              <p className="field-error">{errors.activationCode?.message}</p>
            )}
          </div>}

          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="rememberMe"
                {...register("rememberMe")}
                style={{"margin-left": "5px"}}
              />
              تذكرني (لمدة 30 يوماً)
            </label>
            {/* اللينك اللى بيربط ب الريسيت  */}
            <Link
              to="/reset-password"
              name="reset-password-link"
              className="forgot-password"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>

          <button type="submit" className="submit-btn">
            تسجيل الدخول &larr; {/* html character for left arrow icon*/}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
