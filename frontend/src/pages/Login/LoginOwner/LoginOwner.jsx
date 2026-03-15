import React, { useState } from 'react';
import './LoginOwner.css'; 
import { User, Sun, Moon, Eye, EyeOff } from 'lucide-react';

const LoginOwner = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // 3. حالة إظهار كلمة المرور
  const [showPassword, setShowPassword] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // دالة التعامل مع التغيير في المدخلات (تحديث الـ State)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // ده مكان ال API
    console.log("بيانات صاحب المحل الجاهزة:", formData);
  };

  return (
    <div className={`login-container ${isDarkMode ? 'dark-mode' : ''}`}>
      
      <button className="theme-toggle-btn" onClick={toggleTheme}>
        {isDarkMode ? <Sun size={24} color="#fbbf24" /> : <Moon size={24} color="#4b5563" />}
      </button>

      <div className="login-card">
        <div className="icon-box">
          <User size={40} />
        </div>
        <h1>مرحباً بصاحب المحل</h1>
        <p>قم بتسجيل الدخول لإدارة متجرك</p>
        
        <form className="login-form" onSubmit={handleSubmit}>
           <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input 
              type="email" 
              name="email"
              placeholder="ادخل البريد" 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>كلمة المرور</label>
            <div className="password-wrapper" style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn">تسجيل الدخول</button>
        </form>
      </div>
    </div>
  );
};

export default LoginOwner;