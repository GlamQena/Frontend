import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// استيراد الصفحات من الفولدرات الخاصة بها
import Home from "./pages/Home/Home";
import About from "./pages/About/AboutUs";
import Contact from "./pages/Contact/ContactUs";
import Products from "./pages/Products/Products";
import Cart from "./pages/Cart/Cart";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./components/ThemeProvider";
import VerificationCheck from "./pages/Verification/Check";

function App() {
  return (
    <ThemeProvider>
      <Navbar></Navbar>
      <BrowserRouter>
        <Routes>
          {/* الصفحات الرئيسية */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />

          {/* صفحات الحساب والدخول */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerificationCheck />} />

          {/* صفحة الداشبورد */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* مسار احتياطي في حال كتابة لينك غلط */}
          <Route path="*" element={<div>Page Not Found 404</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
