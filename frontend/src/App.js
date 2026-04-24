import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Navbar from "./components/Navbar";

// Public pages
import Home          from "./pages/Home/Home";
import About         from "./pages/About/AboutUs";
import Contact       from "./pages/Contact/ContactUs";

// Store & products
import Stores        from "./pages/Stores/Stores";          // client store listing
import StoreProducts from "./pages/StoreProducts/Store";
import ProductDetails from "./pages/ProductDetails/ProductDetails";

// Shopping
import Cart          from "./pages/Cart/Cart";
import Wishlist      from "./pages/Wishlist/Wishlist";
import Orders        from "./pages/Orders/Orders";
import OrderDetails  from "./pages/Orders/OrderDetails";

// Auth
import Login         from "./pages/Login/Login";
import Register      from "./pages/Register/Register";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import VerificationCheck from "./pages/Verification/Check";
import Profile       from "./pages/Profile/Profile";

// Dashboard
import Dashboard     from "./pages/Dashboard/Dashboard";

// 404
import NotFound      from "./pages/NotFound/NotFound";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Navbar />
        <Routes>
          {/* ── Public ── */}
          <Route path="/"        element={<Home />} />
          {/* <Route path="/about"   element={<About />} />
          <Route path="/contact" element={<Contact />} /> */}

          {/* ── Store & Products ── */}
          <Route path="/stores"                  element={<Stores />} />
          <Route path="/stores/:storeId/products"          element={<StoreProducts />} />
          <Route path="/stores/:storeId/products/:productId"      element={<ProductDetails />} />

          {/* ── Shopping ── */}
          <Route path="/cart"          element={<Cart />} />
          {/* <Route path="/wishlist"      element={<Wishlist />} /> */}
          <Route path="/orders"        element={<Orders />} />
          <Route path="/orders/:id"    element={<OrderDetails />} />

          {/* ── Auth ── */}
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email"   element={<VerificationCheck />} />
          <Route path="/profile"        element={<Profile />} />

          {/* ── Dashboard ── */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* ── Fallback ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;