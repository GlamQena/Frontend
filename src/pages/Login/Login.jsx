import "./Login.css";
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Eye, EyeOff, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  loginSchema,
  responseMessageSetter,
  login,
  getSessionId,
  activateAccount,
  resendActivationOTP
} from "../../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const email = params.get("email");
  const role = params.get("role");
  let returnTo = null;

  if(location?.state?.returnTo){
    returnTo = location?.state?.returnTo;
  }
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isActivationFlow, setIsActivationFlow] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({
    success: false,
    message: "",
  });

  useEffect(() => {
    if (token && email) {
      setIsActivationFlow(true);
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        console.log("Activation flow detected:", { email, role, token });
      } catch (e) {
        console.error("Error decoding activation token:", e);
      }
    }
  }, [token, email, role]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { 
      usernameOrEmail: email || "", 
      password: "", 
      activationCode: "",
      newPassword: "",
      confirmPassword: "",
      rememberMe: false 
    },
    mode: "onChange",
  });

  const handleResendActivation = async () => {
    if (isResending) return;
    setIsResending(true);
    
    try {
      const response = await resendActivationOTP({ email, token });
      const data = await response.json();
      
      if (response.ok) {
        responseMessageSetter(true, data.message || "تم إرسال كود التفعيل الجديد إلى بريدك الإلكتروني", setSubmitMessage);
      } else {
        responseMessageSetter(false, data.message || "فشل إرسال كود التفعيل", setSubmitMessage);
      }
    } catch (error) {
      console.error("Resend activation error:", error);
      responseMessageSetter(false, error.message || "حدث خطأ أثناء إرسال كود التفعيل", setSubmitMessage);
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (formData) => {
    if (isActivationFlow && token) {
      try {
        const response = await activateAccount({
          email,
          token,
          activationCode: formData.activationCode,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
          rememberMe: formData.rememberMe
        });

        const data = await response.json();

        if (response.ok) {
          const user = data.user;
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          
          responseMessageSetter(true, data.message || "تم تفعيل الحساب بنجاح", setSubmitMessage);

          setTimeout(() => {
            if (user.role === "store_owner") {
              navigate("/dashboard/store_owner");
            } else if (user.role === "admin") {
              navigate("/dashboard/admin");
            } else {
              navigate("/");
            }
          }, 2000);
        } else {
          responseMessageSetter(false, data.message || "فشل تفعيل الحساب", setSubmitMessage);
        }
      } catch (error) {
        console.error("Activation error:", error);
        responseMessageSetter(false, error.message || "حدث خطأ أثناء التفعيل", setSubmitMessage);
      }
      return;
    }

    const bodyData = {
      usernameOrEmail: formData.usernameOrEmail,
      password: formData.password,
      rememberMe: formData.rememberMe,
      session_id: getSessionId()
    };

    try {
      const response = await login(bodyData, null);
      const data = await response.json();

      if (response.ok) {
        const user = data.user;
        localStorage.removeItem("session_id");
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        setTimeout(() => {
          if(returnTo){
            navigate(returnTo);
            return;
          }
          
          if (user.role === "store_owner") {
            navigate("/dashboard/store_owner");
          } else if (user.role === "admin") {
            navigate("/dashboard/admin");
          } else {
            navigate("/");
          }
        }, 1500);
      } else {
        responseMessageSetter(false, data.message, setSubmitMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
      responseMessageSetter(false, error.message, setSubmitMessage);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-header">
        <div className="login-avatar-icon">
          <User size={30} />
        </div>
        {isActivationFlow ? (
          <>
            <h2>تفعيل حساب جديد</h2>
            <p className="login-hint">أدخل كود التفعيل وكلمة المرور الجديدة لتفعيل حسابك</p>
          </>
        ) : (
          <>
            <h2>مرحباً بك في Glam Qena</h2>
            <p className="login-hint">سجل دخولك أو أنشئ حساب عميل جديد</p>
          </>
        )}
      </div>
      
      <div className="login-card">
        {!isActivationFlow && (
          <div className="login-tabs-container">
            <button className="login-tab-btn active">تسجيل دخول</button>
            <button className="login-tab-btn" onClick={() => navigate("/register")}>
              حساب جديد
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {submitMessage.message && (
            <p className={`login-alert ${submitMessage.success ? "alert-success" : "alert-error"}`}>
              {submitMessage.message}
            </p>
          )}

          {isActivationFlow && (
            <div className="login-activation-info">
              <p>📧 جاري تفعيل الحساب للبريد الإلكتروني:</p>
              <div className="login-email-highlight">{email}</div>
              <p className="login-activation-hint">يرجى إدخال كود التفعيل المرسل إلى بريدك الإلكتروني</p>
            </div>
          )}

          <div className="login-field-group">
            <label className="login-label">
              {isActivationFlow ? "البريد الإلكتروني" : "اسم المستخدم أو البريد الإلكتروني"}
              <span className="login-required">*</span>
            </label>
            <input
              type="text"
              className={`login-input ${errors.usernameOrEmail?.message ? "input-error" : ""}`}
              placeholder={isActivationFlow ? "البريد الإلكتروني" : "اسم المستخدم أو البريد الإلكتروني"}
              {...register("usernameOrEmail")}
              readOnly={isActivationFlow}
            />
            {errors.usernameOrEmail?.message && (
              <p className="login-field-error">{errors.usernameOrEmail?.message}</p>
            )}
          </div>

          {isActivationFlow ? (
            <>
              <div className="login-field-group">
                <label className="login-label">
                  كود التفعيل <span className="login-required">*</span>
                </label>
                <input
                  type="text"
                  className={`login-input ${errors.activationCode?.message ? "input-error" : ""}`}
                  placeholder="أدخل كود التفعيل المكون من 6 أرقام"
                  {...register("activationCode")}
                />
                {errors.activationCode?.message && (
                  <p className="login-field-error">{errors.activationCode?.message}</p>
                )}
              </div>

              <div className="login-field-group">
                <label className="login-label">
                  كلمة المرور الجديدة <span className="login-required">*</span>
                </label>
                <div className="login-password-field">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className={`login-input ${errors.newPassword?.message ? "input-error" : ""}`}
                    placeholder="********"
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword?.message && (
                  <p className="login-field-error">{errors.newPassword?.message}</p>
                )}
              </div>

              <div className="login-field-group">
                <label className="login-label">
                  تأكيد كلمة المرور الجديدة <span className="login-required">*</span>
                </label>
                <div className="login-password-field">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`login-input ${errors.confirmPassword?.message ? "input-error" : ""}`}
                    placeholder="********"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword?.message && (
                  <p className="login-field-error">{errors.confirmPassword?.message}</p>
                )}
              </div>
            </>
          ) : (
            <div className="login-field-group">
              <label className="login-label">
                كلمة المرور <span className="login-required">*</span>
              </label>
              <div className="login-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`login-input ${errors.password?.message ? "input-error" : ""}`}
                  placeholder="........"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password?.message && (
                <p className="login-field-error">{errors.password?.message}</p>
              )}
            </div>
          )}

          <div className="login-form-options">
            <label className="login-remember-me">
              <input
                type="checkbox"
                {...register("rememberMe")}
              />
              تذكرني (لمدة 30 يوماً)
            </label>
            {!isActivationFlow && (
              <Link to="/reset-password" className="login-forgot-password">
                نسيت كلمة المرور؟
              </Link>
            )}
          </div>

          <button type="submit" className="login-submit-btn">
            {isActivationFlow ? "تفعيل الحساب ←" : "تسجيل الدخول ←"}
          </button>

          {isActivationFlow && (
            <div className="login-resend-section">
              <span className="login-resend-text">لم يصلك كود التفعيل؟</span>
              <button 
                type="button" 
                className="login-resend-btn"
                onClick={handleResendActivation}
                disabled={isResending}
              >
                {isResending ? "جاري الإرسال..." : "إعادة إرسال كود التفعيل"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;