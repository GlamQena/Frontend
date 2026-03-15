import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Store, User, ChevronRight } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={`selection-wrapper ${isDark ? 'dark' : 'light'}`}>
      {/* Navbar العلوي الصغير */}
      <nav className="mini-nav">
        <div className="nav-logo">
          Qena <span>Glam</span> <div className="logo-dot"></div> <span>قنا</span>
        </div>
        <div className="nav-left">
           <span className="nav-item">الرئيسية</span>
           <div className="mode-toggle" onClick={() => setIsDark(!isDark)}>
             {isDark ? <Moon size={18} /> : <Sun size={18} />}
           </div>
        </div>
      </nav>

      <div className="selection-content">
        <p className="top-badge">منصة الجمال الأولى في قنا</p>
        <h1 className="main-title">اختر <span>نوع الحساب</span></h1>
        <p className="main-desc">
          انضم إلى مجتمعنا وابدأ رحلة الجمال الخاصة بك، سواء كنت تبحث عن التميز أو تقدمه.
        </p>

        <div className="selection-cards">
          
          {/* كارت عميل */}
          <div className="card client-card" onClick={() => navigate('/login-client')}>
            <div className="card-icon"><User size={32} /></div>
            <h2>عميل</h2>
            <p>تسوق منتجات التجميل من محلاتك المفضلة واحجز مواعيدك بكل سهولة.</p>
            <button className="circle-btn"><ChevronRight size={20} /></button>
          </div>
          {/* كارت صاحب محل */}
          <div className="card owner-card" onClick={() => navigate('/login-owner')}>
            <div className="card-icon"><Store size={32} /></div>
            <h2>صاحب محل</h2>
            <p>أدر أعمالك، اعرض خدماتك، وضاعف وصولك لجمهور أوسع في قنا.</p>
            <button className="circle-btn"><ChevronRight size={20} /></button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;