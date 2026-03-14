import React, { useState, useEffect, useRef } from 'react';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('user@example.com');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timeLeft, setTimeLeft] = useState(12);
  const [timerActive, setTimerActive] = useState(false);
  
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

  const sendVerification = () => {
    setStep(2);
    setTimerActive(true);
    setTimeLeft(12);
  };

  const goToPage1 = () => {
    setStep(1);
    setTimerActive(false);
    setCode(['', '', '', '', '', '']);
  };

  const goToPage2 = () => {
    setStep(2);
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    
    if (value && !/^\d+$/.test(value)) return;
    
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

  // إعادة إرسال الرمز
  const resendCode = (e) => {
    e.preventDefault();
    if (timeLeft > 0) {
      alert('الرجاء الانتظار حتى انتهاء الوقت');
      return;
    }
    alert('تم إرسال رمز جديد');
    setTimerActive(true);
    setTimeLeft(12);
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0].focus();
  };

  // التحقق من الرمز
  const verifyCode = () => {
    if (code.some(digit => digit === '')) {
      alert('الرجاء إدخال رمز التحقق كاملاً');
      return;
    }
    alert('✅ تم التحقق بنجاح');
    setStep(3);
  };

  // تغيير كلمة المرور
  const resetPassword = () => {
    if (password.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      alert('كلمتا المرور غير متطابقتين');
      return;
    }
    alert('✅ تم تغيير كلمة المرور بنجاح');
  };

  return (
    <div className="container">
      <div className="header">
        <h1>نسيت كلمة المرور</h1>
        <p>استعادة حسابك بسهولة وأمان</p>
      </div>

      <div className="content">
        {/*  نسيت كلمة المرور */}
        <div className={`step ${step === 1 ? 'active' : ''}`}>
          <p className="step-description">أدخل بريدك الإلكتروني لإرسال رمز التحقق</p>
          
          <div className="input-group">
            <label>البريد الإلكتروني</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
            />
            <div className="email-example">مثال: @example.com</div>
          </div>

          <button className="btn-primary" onClick={sendVerification}>
            إرسال رمز التحقق ←
          </button>

          <div className="links">
            <a href="#">تذكر كلمة المرور؟</a>
            <span className="separator">|</span>
            <a href="#">تسجيل دخول</a>
          </div>
        </div>

        {/*  أدخل رمز التحقق */}
        <div className={`step ${step === 2 ? 'active' : ''}`}>
          <button className="back-btn" onClick={goToPage1}>
            <span>→</span> رجوع
          </button>

          <div className="verification-info">
            <p>تم إرسال رمز التحقق إلى</p>
            <div className="email-highlight">{email}</div>
            <div className="timer">{timeLeft}/12</div>
            <div className="resend">
              <span>لم تستلم الرمز؟</span>
              <a href="#" onClick={resendCode}>إعادة إرسال</a>
            </div>
          </div>

          <div className="input-group">
            <label>أدخل رمز التحقق</label>
            <div className="verification-code">
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

          <button className="btn-primary" onClick={verifyCode}>
            تأكيد كلمة المرور
          </button>
        </div>

        {/*   تعيين كلمة مرور جديدة */}
        <div className={`step ${step === 3 ? 'active' : ''}`}>
          <button className="back-btn" onClick={goToPage2}>
            <span>→</span> رجوع
          </button>

          <p className="step-description">تعيين كلمة مرور جديدة</p>
          <p style={{ color: '#4a5568', marginBottom: '20px' }}>أدخل كلمة المرور الجديدة</p>

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

          <button className="btn-primary" onClick={resetPassword}>
            تأكيد وتغيير كلمة المرور
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
