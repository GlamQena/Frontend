import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword = (isDark) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [submitMessage, setSubmitMessage]= useState({form: "", success: false, message: "", nextStep: false});
  const navigate= useNavigate();
  const inputRefs = useRef([]);

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

    try{
      const response= await fetch("http://127.0.0.1:8080/auth/password/send-otp", 
        {method: "POST", headers:{"Content-Type": "application/json"}, 
        body: JSON.stringify({"email": email})});

      const data= await response.json();
      console.log("send-otp data-> ", data);

      if(!response.ok)
        return submitMessageSetter("send-otp", false, data.message);

      goToPage2();

    }catch(error){
        submitMessageSetter("send-otp", false, error.message);
    }
  };

  function submitMessageSetter(form, success, message, stepNext=false){
    setSubmitMessage({form, success, message, stepNext});
  }

  useEffect(()=>{
    if(submitMessage.message){
      const timer= setTimeout(()=>{
        setSubmitMessage({form: submitMessage.form, success: false, message: ""});

        if(submitMessage.form === "reset-password" && submitMessage.success)
          navigate("/login");

        else if(submitMessage.stepNext && step<3)
          setStep(prevStep => prevStep+1);

      }, 4000);

      return ()=>{clearTimeout(timer);} //executed when the component will unmount
    }
  }
  , [submitMessage.message]);

  const goToPage1 = () => {
    setStep(1);
    setTimerActive(false);
    setCode(['', '', '', '', '', '']);
  };

  const goToPage2 = () => {
    setStep(2);
    setTimerActive(true);
    setTimeLeft(60);
  };

  const timerFormatter= ()=> {
    if(timeLeft===60)
      return "01:00"
    else if(timeLeft<10)
      return `00:0${timeLeft}`;
    else
      return `00:${timeLeft}`;
  }

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
      inputRefs.current[index - 1].focus(); //the Backspace affect the previous digit input which in-turn will trigger te onChange event
    }
  };

  // إعادة إرسال الرمز
  const resendCode = async (e) => {
    e.preventDefault();
    if (timeLeft > 0) {
      // alert('الرجاء الانتظار حتى انتهاء الوقت');
      return submitMessageSetter("verify-otp", false, 'الرجاء الانتظار حتى انتهاء الوقت');
    }
    
    try{
      const response= await fetch("http://127.0.0.1:8080/auth/password/send-otp", 
        {method: "POST", headers:{"Content-Type": "application/json"}, 
        body: JSON.stringify({"email": email})});

      const data= await response.json();
      console.log("verify otp data-> ", data);

      if(!response.ok)
        return submitMessageSetter("verify-otp", false, data.message);
      
      // alert('تم إرسال رمز جديد');
      setTimerActive(true);
      setTimeLeft(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0].focus();

      submitMessageSetter("verify-otp", true, data.message); //has a delay
    }catch(error){
        submitMessageSetter("verify-otp", false, error.message);
    }
  };

  // التحقق من الرمز
  const verifyCode = async (e) => {
    e.preventDefault();
    if (code.some(digit => digit === '')) {
      // alert('الرجاء إدخال رمز التحقق كاملاً');
      return submitMessageSetter("verify-otp", false, 'الرجاء إدخال رمز التحقق كاملاً');
    }

    try{
      console.log("entered otp-> ", code.join(""));

      const response= await fetch("http://127.0.0.1:8080/auth/password/verify-otp", 
        {method: "POST", headers:{"Content-Type": "application/json"}, 
        body: JSON.stringify({"email": email, "otp": code.join("")})});

      const data= await response.json();
      console.log("verify otp data-> ", data);

      if(!response.ok)
        return submitMessageSetter("verify-otp", false, data.message);

      submitMessageSetter("verify-otp", true, data.message, true);
    }catch(error){
        submitMessageSetter("verify-otp", false, error.message);
    }
  };

  // تغيير كلمة المرور
  const resetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      alert('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      alert('كلمتا المرور غير متطابقتين');
      return;
    }

    try{
      const response= await fetch("http://127.0.0.1:8080/auth/password/reset", 
        {method: "POST", headers:{"Content-Type": "application/json"}, 
        body: JSON.stringify({"email": email, "newPassword": password, "confirmPassword": confirmPassword})});

      const data= await response.json();
      console.log("reset password data-> ", data);

      if(!response.ok)
        return submitMessageSetter("reset-password", false, data.message);

      submitMessageSetter("reset-password", true, data.message); 
      // alert('✅ تم تغيير كلمة المرور بنجاح');
      
    }catch(error){
        submitMessageSetter("reset-password", false, error.message);
    }
  };

  return (
    <div className={`container ${isDark? "dark-mode" : "light-mode"}`}>
      <div className="header">
        {step === 1 && <React.Fragment>
        <img src="images/forget-password.png"/>
        <h1>نسيت كلمة المرور</h1>
        <p>أدخل بريدك الإلكتروني لإرسال رمز التحقق</p>
        </React.Fragment>}

        {step === 2 && <React.Fragment>
        <img src="images/verify-otp.png"/>
        <h1>أدخل رمز التحقق</h1>
        </React.Fragment>}

        {step === 3 && <React.Fragment>
        <img src="images/reset-password.png"/>
        <h1>تعيين كلمة مرور جديدة</h1>
        <p>أدخل كلمة المرور الجديدة للدخول إلى حسابك</p>
        </React.Fragment>}
      </div>

      <div className="content">
        {/*form 1 */}
        <form className={`step ${step === 1 ? 'active' : ''}`} onSubmit={sendVerification}>
          {submitMessage.form==="send-otp" && <p className={`submit-message ${submitMessage.success? "success" : "fail"}`}>{submitMessage.message}</p>}
          
          <div className="input-group">
            <label>البريد الإلكتروني</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
            />
          </div>

          <button type="submit" className="btn-primary">
            إرسال رمز التحقق ←
          </button>

          <div className="links">
            <p>تذكرت كلمة المرور؟</p>
            <span className="separator">|</span>
            <a href="/login">تسجيل دخول</a>
          </div>
        </form>

        {/*  form 2 */}
        <form className={`step ${step === 2 ? 'active' : ''}`} onSubmit={verifyCode}>
          {submitMessage.form==="verify-otp" && <p className={`submit-message ${submitMessage.success? "success" : "fail"}`}>{submitMessage.message}</p>}

          <button type="button" className="back-btn" onClick={goToPage1}>
            <span>→</span> رجوع
          </button>

          <div className="verification-info">
            <p>تم إرسال رمز التحقق إلى</p>
            <div className="email-highlight">{email}</div>
            <div className="timer">{timerFormatter()}</div>
            <div className="resend">
              <span>لم تستلم الرمز؟</span>
              <a href="#" onClick={resendCode}>إعادة إرسال</a>
            </div>
          </div>

          <div className="input-group">
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

          <button type="submit" className="btn-primary">
            تأكيد الرمز 
          </button>
        </form>

        {/*   form  3 */}
        <form className={`step ${step === 3 ? 'active' : ''}`} onSubmit={resetPassword}>
          {submitMessage.form==="reset-password" && <p className={`submit-message ${submitMessage.success? "success" : "fail"}`}>{submitMessage.message}</p>}

          <button type="button" className="back-btn" onClick={goToPage2}>
            <span>→</span> رجوع
          </button>

          <div className="password-field">
            <label>كلمة المرور الجديدة *</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>

          <div className="password-field">
            <label>تأكيد كلمة المرور الجديدة *</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
            />
          </div>

          <button type="submit" className="btn-primary">
            تأكيد وتغيير كلمة المرور
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;