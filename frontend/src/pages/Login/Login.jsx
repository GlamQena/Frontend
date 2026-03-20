import "./Login.css"
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff , User } from 'lucide-react';
import {useForm} from "react-hook-form";
import * as yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";

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
    "password": yup.string()
      .required("كلمة المرور مطلوبة")
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .max(64, "كلمة المرور يجب ألا تتجاوز 64 حرف")
      .matches(/[A-Z]/, "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
      .matches(/[a-z]/, "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل")
      .matches(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل"),
    "rememberMe": yup.boolean()
  });

  let {register, handleSubmit, formState: { errors}}= useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {usernameOrEmail: "", password: ""},
    mode: "onBlur"
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
        localStorage.setItem("user", JSON.stringify(data.user));
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
      }, 4000);
  }

  return (
    <div class="container">
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
          <div className="input-group">
            <label>اسم المستخدم أو البريد الإلكتروني <span className="required">*</span></label>
            <input 
              type="text" 
              name="usernameOrEmail"
              placeholder="اسم المستخدم أو البريد الإلكتروني"
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
          {submitMessage.message && <p className={`submit-message ${submitMessage.success? "success" : "fail"}`}>{submitMessage.message}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;