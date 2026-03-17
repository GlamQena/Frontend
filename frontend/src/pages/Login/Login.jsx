import "./Login.css"
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff , User } from 'lucide-react';
import { loginUser } from "../../services/authService";
import {useForm} from "react-hook-form";
import * as yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";

// لازم تعرف الـ function الأول قبل ما تعمل لها export
const Login = ({ isDark }) => {
  const navigate = useNavigate();
  
  // const [isDark, setIsDark] = useState(false);

  // const [formData, setFormData] = useState({
  //   identifier: '', // اسم المستخدم أو البريد
  //   password: '',
  //   rememberMe: false
  // });

  // إظهإر او اخفاء الباسورد 
  const [showPassword, setShowPassword] = useState(false);

  const [submitMessage, setSubmitMessage]= useState({success: false, message: ""});
  // const [errors, setErrors]= useState({
  //   identifier: "",
  //   password: "",
  // });

  const loginSchema= yup.object({
    "usernameOrEmail": yup.string()
    .required("username or email is required!")
    .test("usernameOrEmail", "invalid format!", function(value){
      if (value.includes("@")) {
        // Email validation
        const isValid = yup.string().email().isValidSync(value);
        if (!isValid) {
          return this.createError({ 
            message: "Please enter a valid email format" 
          });
        }
        return true;
      } else {
        // Username validation
        if (value.length < 3) {
          return this.createError({ 
            message: "Username must be at least 3 characters long" 
          });
        }
        if (value.length > 64) {
          return this.createError({ 
            message: "Username cannot exceed 64 characters" 
          });
        }
        if (!/^[a-z0-9_]+$/.test(value)) {
          return this.createError({ 
            message: "Username can only contain lowercase letters, digits, and underscores" 
          });
        }
        return true;
      }
    })
    ,
    "password": yup.string()
    .required("password is required!")
    .min(8, "password must be at least 8 characters!")
    .max(64, "password must be at most 64 characters!")
    .matches(/[A-Z]/, "password must has at least one capital character!")
    .matches(/[a-z]/, "password must has at least one small character!")
    .matches(/[0-9]/, "password must has at least one digit!"),
    "rememberMe": yup.boolean()
  });

  let {register, handleSubmit, formState: { errors}}= useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {usernameOrEmail: "", password: ""},
    mode: "onBlur"
  });

  // دالة لتحديث البيانات عند الكتابة
  // const handleChange = (e) => {
  //   const { name, value, type, checked } = e.target;

  //   validate(e);

  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: type === 'checkbox' ? checked : value
  //   }));
  // };

  const onSubmit = async (formData) => {
    // e.preventDefault();

    const bodyData= {usernameOrEmail: formData.usernameOrEmail, password: formData.password};
    console.log("البيانات الجاهزة للإرسال:", bodyData);

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
        localStorage.setItem("user", data.user);
        submitMessageSetter(true, data.message);
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
      }, 7000);
  }

  return (
    <div className={`login-page-wrapper ${isDark ? 'dark-mode' : 'light-mode'}`}>
      <div className="login-card-container">
        <div className="user-icon-header">
          <div className="card-icon"><User size={32} /></div>
          
          <h2>مرحباً بك في Glam Qena</h2>
          <p className="hint">سجل دخولك أو أنشئ حساب عميل جديد</p>
        </div>

        <div className="login-card">
          {/* أزرار التبديل بين دخول وحساب جديد */}
          <div className="tabs-container">
            <button className="tab-btn active">تسجيل دخول</button>
            <button className="tab-btn" onClick={() => navigate('/register')}>حساب جديد</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <div className="input-group">
              <label>اسم المستخدم أو البريد الإلكتروني <span className="required">*</span></label>
              <input 
                type="text" 
                name="usernameOrEmail"
                placeholder="اسم المستخدم أو البريد الإلكتروني"
                // value={formData.usernameOrEmail}
                // onChange={handleChange}
                // required
                {...register("usernameOrEmail")}
              />
              {errors.usernameOrEmail?.message && <p className= "error-message">{errors.usernameOrEmail?.message}</p>}
            </div>

            <div className="input-group">
              <label>كلمة المرور <span className="required">*</span></label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  placeholder="........"
                  // value={formData.password}
                  // onChange={handleChange}
                  // required
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
              {errors.password?.message && <p className= "error-message">{errors.password?.message}</p>}
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  name="rememberMe"
                  // checked={formData.rememberMe}
                  // onChange={handleChange}
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
              تسجيل الدخول &larr;
            </button>
            {submitMessage.message && <p className={`submit-message ${submitMessage.success? "success" : "fail"}`}>{submitMessage.message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;