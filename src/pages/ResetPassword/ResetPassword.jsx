import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ResetPassword.css';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { emailField, resetPasswordSchema, sendOtp, verifyOtp, resetPassword } from "../../services/authService";
import { EyeOff, Eye, KeyRound, ShieldCheck, Lock, ArrowRight } from 'lucide-react';

const ResetPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [timerActive, setTimerActive] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ form: "", success: false, message: "", nextStep: false });
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const validateEmail = async (value) => {
    try {
      await emailField.validate(value);
      setEmailError("");
    } catch (error) {
      setEmailError(error.message);
    }
  };

  const onEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      "newPassword": "",
      "confirmPassword": "",
    },
    resolver: yupResolver(resetPasswordSchema),
    mode: "onChange",
  });

  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const sendVerification = async (e) => {
    e.preventDefault();
    if (!email || emailError) {
      setEmailError(emailError || "البريد الإلكتروني مطلوب");
      return;
    }

    try {
      const response = await sendOtp({ "email": email });
      const data = await response.json();

      if (!response.ok)
        return submitMessageSetter("send-otp", false, data.message);

      goToPage2();
    } catch (error) {
      submitMessageSetter("send-otp", false, error.message);
    }
  };

  function submitMessageSetter(form, success, message, stepNext = false) {
    setSubmitMessage({ form, success, message, stepNext });
  }

  useEffect(() => {
    if (submitMessage.message) {
      const timer = setTimeout(() => {
        setSubmitMessage({ form: submitMessage.form, success: false, message: "" });

        if (submitMessage.form === "reset-password" && submitMessage.success)
          navigate("/login");

        else if (submitMessage.stepNext && step < 3)
          setStep(prevStep => prevStep + 1);

      }, 3500);

      return () => { clearTimeout(timer); };
    }
  }, [submitMessage.message]);

  const goToPage1 = () => {
    setStep(1);
    setTimerActive(false);
    setCode(['', '', '', '', '', '']);
  };

  const goToPage2 = () => {
    setStep(2);
    setTimerActive(true);
    setTimeLeft(600);
  };

  const timerFormatter = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const resendCode = async (e) => {
    e.preventDefault();
    if (timeLeft > 0) {
      return submitMessageSetter("verify-otp", false, 'الرجاء الانتظار حتى انتهاء الوقت');
    }
    
    try {
      const response = await sendOtp({ "email": email });
      const data = await response.json();

      if (!response.ok)
        return submitMessageSetter("verify-otp", false, data.message);
      
      setTimerActive(true);
      setTimeLeft(600);
      setCode(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();

      submitMessageSetter("verify-otp", true, data.message);
    } catch (error) {
      submitMessageSetter("verify-otp", false, error.message);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    if (code.some(digit => digit === '')) {
      return submitMessageSetter("verify-otp", false, 'الرجاء إدخال رمز التحقق كاملاً');
    }

    try {
      const response = await verifyOtp({ "email": email, "otp": code.join("") });
      const data = await response.json();

      if (!response.ok)
        return submitMessageSetter("verify-otp", false, data.message);

      submitMessageSetter("verify-otp", true, data.message, true);
    } catch (error) {
      submitMessageSetter("verify-otp", false, error.message);
    }
  };

  const resetPasswordHandler = async (formData) => {
    const { newPassword, confirmPassword } = formData;

    if (newPassword !== confirmPassword) {
      submitMessageSetter("reset-password", false, 'كلمتا المرور غير متطابقتين', false);
      return;
    }

    try {
      const bodyData= { "email": email, "newPassword": newPassword, "confirmPassword": confirmPassword };
      console.log(`reset password request bodyData: ${bodyData}`);

      const response = await resetPassword(bodyData);
      const data = await response.json();

      if (!response.ok)
        return submitMessageSetter("reset-password", false, data.message);

      submitMessageSetter("reset-password", true, data.message);
    } catch (error) {
      submitMessageSetter("reset-password", false, error.message);
    }
  };

  return (
    <div className="reset-page-wrapper">
      <div className="reset-header">
        {step === 1 && (
          <>
            <div className="reset-avatar-icon">
              <KeyRound size={30} />
            </div>
            <h2>نسيت كلمة المرور</h2>
            <p className="reset-hint">أدخل بريدك الإلكتروني لإرسال رمز التحقق</p>
          </>
        )}

        {step === 2 && (
          <>
            <div className="reset-avatar-icon">
              <ShieldCheck size={30} />
            </div>
            <h2>أدخل رمز التحقق</h2>
            <p className="reset-hint">تم إرسال رمز مكون من 6 أرقام إلى بريدك الإلكتروني</p>
          </>
        )}

        {step === 3 && (
          <>
            <div className="reset-avatar-icon">
              <Lock size={30} />
            </div>
            <h2>تعيين كلمة مرور جديدة</h2>
            <p className="reset-hint">أدخل كلمة المرور الجديدة للدخول إلى حسابك</p>
          </>
        )}
      </div>

      <div className="reset-card">
        {/* Step 1: Send OTP */}
        <form className={`step ${step === 1 ? 'active' : ''}`} onSubmit={sendVerification}>
          {submitMessage.form === "send-otp" && submitMessage.message && (
            <p className={`reset-alert ${submitMessage.success ? "alert-success" : "alert-error"}`}>
              {submitMessage.message}
            </p>
          )}
          
          <div className="reset-field-group">
            <label className="reset-label">البريد الإلكتروني <span className="reset-required">*</span></label>
            <input 
              type="email" 
              value={email}
              onChange={onEmailChange}
              className={`reset-input ${emailError ? "input-error" : ""}`}
              placeholder="example@domain.com"
            />
            {emailError && <span className="reset-field-error">{emailError}</span>}
          </div>

          <button type="submit" className="reset-submit-btn">
            إرسال رمز التحقق ←
          </button>

          <div className="reset-links">
            <span>تذكرت كلمة المرور؟</span>
            <span className="reset-separator">|</span>
            <Link to="/login">تسجيل الدخول</Link>
          </div>
        </form>

        {/* Step 2: Verify OTP */}
        <form className={`step ${step === 2 ? 'active' : ''}`} onSubmit={verifyCode}>
          {submitMessage.form === "verify-otp" && submitMessage.message && (
            <p className={`reset-alert ${submitMessage.success ? "alert-success" : "alert-error"}`}>
              {submitMessage.message}
            </p>
          )}

          <button type="button" className="reset-back-btn" onClick={goToPage1}>
            <ArrowRight size={18} /> رجوع
          </button>

          <div className="verification-info">
            <p>تم إرسال رمز التحقق إلى</p>
            <a href={`mailto:${email}`} className="email-highlight">
              {email}
            </a>
            <div className="timer">{timerFormatter()}</div>
            <div className="resend">
              <span>لم تستلم الرمز؟</span>
              <a href="#" onClick={resendCode}>إعادة إرسال</a>
            </div>
          </div>

          <div className="reset-field-group">
            <div className="verification-code" dir="ltr">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  className="code-input"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="reset-submit-btn">
            تأكيد الرمز ←
          </button>
        </form>

        {/* Step 3: New Password */}
        <form className={`step ${step === 3 ? 'active' : ''}`} onSubmit={handleSubmit(resetPasswordHandler)}>
          {submitMessage.form === "reset-password" && submitMessage.message && (
            <p className={`reset-alert ${submitMessage.success ? "alert-success" : "alert-error"}`}>
              {submitMessage.message}
            </p>
          )}

          <div className="reset-field-group">
            <label className="reset-label">كلمة المرور الجديدة <span className="reset-required">*</span></label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"}
                className={`reset-input ${errors.newPassword?.message ? "input-error" : ""}`}
                placeholder="********"
                {...register("newPassword")}
              />
              <button
                type="button"
                className="reset-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword?.message && <span className="reset-field-error">{errors.newPassword?.message}</span>}
          </div>

          <div className="reset-field-group">
            <label className="reset-label">تأكيد كلمة المرور الجديدة <span className="reset-required">*</span></label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                className={`reset-input ${errors.confirmPassword?.message ? "input-error" : ""}`}
                placeholder="********"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                className="reset-toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword?.message && <span className="reset-field-error">{errors.confirmPassword?.message}</span>}
          </div>

          <button type="submit" className="reset-submit-btn">
            تأكيد وتغيير كلمة المرور ←
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;