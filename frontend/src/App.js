import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// استيراد الصفحات من الفولدرات الخاصة بها
import Home from './pages/Home/Home';
import About from './pages/About/AboutUs';
import Contact from './pages/Contact/ContactUs';
import Products from './pages/Products/Products';
import Cart from './pages/Cart/Cart';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Navbar from './components/Navbar';

function App() {
  const [isDark, setIsDark] = useState(true);
  return (
    <>
    <Navbar isDark={isDark} setIsDark={setIsDark}></Navbar>
    <BrowserRouter>
      <Routes>
        {/* الصفحات الرئيسية */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        
        {/* صفحات الحساب والدخول */}
        <Route path="/login" element={<Login isDark={isDark}/>} />
        {/* <Route path="/login/login-client" element={<LoginClient />} />
        <Route path="/login/login-owner" element={<LoginOwner />} /> */}
        <Route path="/register" element={<Register isDark={isDark} />} />
        <Route path="/reset-password" element={<ResetPassword isDark={isDark}/>} />
        
        {/* صفحة الداشبورد */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* مسار احتياطي في حال كتابة لينك غلط */}
        <Route path="*" element={<div>Page Not Found 404</div>} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;