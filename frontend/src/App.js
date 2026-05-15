import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Public pages
import Home from "./pages/Home/Home";

// Store & products
import Stores from "./pages/Stores/Stores"; // client store listing
import StoreProducts from "./pages/StoreProducts/Store";
import ProductDetails from "./pages/ProductDetails/ProductDetails";

// Shopping
import Cart from "./pages/Cart/Cart";
import ShippingInfo from "./pages/ShippingInfo/ShippingInfo";
import Orders from "./pages/Orders/Orders";
import OrderDetails from "./pages/OrderDetails/OrderDetails";

// Auth
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import VerificationCheck from "./pages/Verification/Check";
import Profile from "./pages/Profile/Profile";

// StoreOwnerDashboard
import OwnerHome from "./pages/StoreOwnerDashboard/OwnerHome/OwnerHome";
import StoreOwnerOrders from "./pages/StoreOwnerDashboard/StoreOwnerOrders/StoreOwnerOrders";

// 404
import NotFound from "./pages/NotFound/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<Home />} />

        {/* ── Store & Products ── */}
        <Route path="/stores" element={<Stores />} />
        <Route path="/stores/:storeId/products" element={<StoreProducts />} />
        <Route
          path="/stores/:storeId/products/:productId"
          element={<ProductDetails />}
        />

        {/* ── Shopping ── */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/shipping/info" element={<ShippingInfo />} />
        {/* <Route path="/wishlist"      element={<Wishlist />} /> */}
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetails />} />

        {/* ── Auth ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerificationCheck />} />
        <Route path="/profile" element={<Profile />} />

        {/* ── StoreOwnerDashboard ── */}
        <Route path="/dashboard/store_owner/" element={<OwnerHome />} />
        <Route
          path="/dashboard/store_owner/orders"
          element={<StoreOwnerOrders />}
        />

        {/* ── Fallback ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
