// import React from "react";
// import { BrowserRouter, Route, Routes } from "react-router-dom";
// import Login from "./pages/Login/LoginOwner/LoginOwner";
// import Register from "./pages/Register/Register";
// import ResetPassword from "./pages/ResetPassword/ResetPassword";
// import Home from "./pages/Home/Home";
// import Dashboard from "./pages/Dashboard/Dashboard";
// import Contact from "./pages/Contact/ContactUs";
// import About from "./pages/About/AboutUs";
// import Products from "./pages/Products/Products";
// import Cart from "./pages/Cart/Cart";


// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Home/>}/>
//         <Route path="/login" element={<Login/>}/>
//         <Route path="/register" element={<Register/>}/>
//         <Route path="/products" element={<Products/>}/>
//         <Route path="/contact" element={<Contact/>}/>
//         <Route path="/about" element={<About/>}/>
//         <Route path="/cart" element={<Cart/>}/>
//         <Route path="/dashboard" element={<Dashboard/>}/>
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;




import LoginSelection from './pages/Login/Login'; 
import LoginOwner from './pages/Login/LoginOwner/LoginOwner';
import LoginClient from './pages/Login/LoginClient/LoginClient';
import ResetPassword from './pages/ResetPassword/ResetPassword';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<LoginSelection />} /> 
            <Route path="/login-owner" element={<LoginOwner />} />
            <Route path="/login-client" element={<LoginClient />} />
            <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
    </Router>
  );
}
export default App;