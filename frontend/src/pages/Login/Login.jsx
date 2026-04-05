import "./Login.css"
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import {useForm} from "react-hook-form";
import * as yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";
import {passwordField} from "../../services/authService";

const Login = () => {
  const navigate = useNavigate();

  // إظهإر او اخفاء الباسورد 
  const [showPassword, setShowPassword] = useState(false);

  const [submitMessage, setSubmitMessage]= useState({success: false, message: ""});

  const loginSchema = yup.object({
    "usernameOrEmail": yup.string()
      .required("يرجى إدخال اسم المستخدم أو البريد الإلكتروني")
      .test("usernameOrEmail", "صيغة غير صالحة!", function(value) {
        if (value.includes("@")) {
          // Email validation
          if (value.length > 254)
            return this.createError({ message: "البريد الإلكتروني يجب ألا يتجاوز 254 حرف" });

          const isValid = yup.string().email().isValidSync(value);
          if (!isValid) {
            return this.createError({ 
              message: "يرجى إدخال بريد إلكتروني صالح" 
            });
          }
          return true;
        } else {
          // Username validation
          if (value.length < 3) {
            return this.createError({ 
              message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" 
            });
          }
          if (value.length > 64) {
            return this.createError({ 
              message: "اسم المستخدم لا يمكن أن يتجاوز 64 حرف" 
            });
          }
          if (!/^[a-z0-9_]+$/.test(value)) {
            return this.createError({ 
              message: "اسم المستخدم يمكن أن يحتوي فقط على أحرف صغيرة وأرقام وشرطة سفلية" 
            });
          }
          return true;
        }
      }),
    "password": passwordField,
    "rememberMe": yup.boolean()
  });

  let {register, handleSubmit, formState: { errors}}= useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {usernameOrEmail: "", password: ""},
    mode: "onChange"
  });

  const onSubmit = async (formData) => {
    console.log("form data-> ", formData);

    const bodyData= {usernameOrEmail: formData.usernameOrEmail, password: formData.password};
    console.log("data to be sent-> ", bodyData);

    try{
      const response= await fetch("http://127.0.0.1:8080/auth/login", {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData)
      })
      const data= await response.json();

      if(response.ok){
        console.log(data);
        const user= data.user;
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        submitMessageSetter(true, data.message);

        if(user.role==="client")
          navigate("/")
        else
          navigate("/dashboard");
      }
      else{
        submitMessageSetter(false, data.message);
      }
    }catch(error){
      submitMessageSetter(false, error.message);
    }
  };

  function submitMessageSetter(success, message){
    setSubmitMessage({success, message});
      setTimeout(()=>{
        setSubmitMessage({success: false, message: ""});
      }, 4000);
  }

  return (
    <div className="container">
      <div className="login-header">
        <h2>مرحباً بك في Glam Qena</h2>
        <p className="hint">سجل دخولك أو أنشئ حساب جديد</p>
      </div>
      <div className="login-card">
        {/* أزرار التبديل بين دخول وحساب جديد */}
        <div className="tabs-container">
          <button className="tab-btn active">تسجيل دخول</button>
          <button className="tab-btn" onClick={() => navigate('/register')}>حساب جديد</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {submitMessage.message && <p className={`submit-message ${submitMessage.success? "success-message" : "error-message"}`}>{submitMessage.message}</p>}

          <div className="form-group">
            <label>اسم المستخدم أو البريد الإلكتروني <span className="required-star">*</span></label>
            <input 
              type="text" 
              name="usernameOrEmail"
              className={errors.usernameOrEmail?.message ? "error" : ""}
              placeholder="اسم المستخدم أو البريد الإلكتروني"
              {...register("usernameOrEmail")}
            />
            {errors.usernameOrEmail?.message && <p className= "field-error">{errors.usernameOrEmail?.message}</p>}
          </div>

          <div className="form-group">
            <label>كلمة المرور <span className="required-star">*</span></label>
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
            {errors.password?.message && <p className= "field-error">{errors.password?.message}</p>}
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input 
                type="checkbox" 
                name="rememberMe"
                {...register("rememberMe")}
              />
              تذكرني (لمدة 30 يوماً)
            </label>
            {/* اللينك اللى بيربط ب الريسيت  */}
            <Link to="/reset-password" name="reset-password-link" className="forgot-password">
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