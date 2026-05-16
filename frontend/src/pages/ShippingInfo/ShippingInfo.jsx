import { useState, useEffect } from "react";
import { Banknote, CreditCard, Wallet } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as yup from "yup";
import { responseMessageSetter } from "../../services/authService";
import { checkoutPayment } from "../../services/order";
import "./ShippingInfo.css";

const BASE_URL = "http://127.0.0.1:8080";

const egyptianPhone = /^(010|011|012|015)\d{8}$/;

const shippingSchema = yup.object().shape({
  first_name: yup.string().trim().required("الاسم الأول مطلوب"),

  last_name: yup.string().trim().required("اسم العائلة مطلوب"),

  email: yup
    .string()
    .trim()
    .required("البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صحيح"),

  phone_number: yup
    .string()
    .trim()
    .required("رقم الهاتف مطلوب")
    .matches(egyptianPhone, "رقم مصري غير صحيح (010, 011, 012, 015 + 8 أرقام)"),

  country: yup.string().trim().required("الدولة مطلوبة"),

  city: yup.string().trim().required("المدينة مطلوبة"),

  street: yup.string().trim().required("العنوان مطلوب"),

  building: yup.string().trim(),
  floor: yup.string().trim(),
  apartment: yup.string().trim(),
  notes: yup.string().trim(),
});

const TruckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9b6ff0" strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#e8c40e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const paymentMethods = [
  { id: "cod", icon: <Banknote size={22} />, label: "دفع عند الاستلام" },
  { id: "card", icon: <CreditCard size={22} />, label: "بطاقة ائتمان" },
  { id: "wallet", icon: <Wallet size={22} />, label: "المحفظة" },
];

const getUserData = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, subtotal = 0, shipping = 0, discount = 0, total = 0 } = location.state || {};

  const [activePayment, setActivePayment] = useState("card");
  const [focusedField, setFocusedField] = useState(null);
  const [actionMsg, setActionMsg] = useState({ success: false, message: "" });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState(() => {
    const user = getUserData();
    const address = user?.address || {};
    const billing = user?.additionalBillingData || {};

    return {
      first_name: user?.firstName || "",
      last_name: user?.lastName || "",
      email: user?.email || "",
      phone_number: user?.phone || "",
      country: address.country || billing.country || "مصر",
      city: address.city || billing.city || "",
      street: address.street || billing.street || "",
      building: address.building || billing.building || "",
      floor: address.floor || billing.floor || "",
      apartment: address.apartment || billing.apartment || "",
      notes: "",
    };
  });

  useEffect(() => {
    if (!orderId) {
      responseMessageSetter(false, "the order wasn't placed properly", setActionMsg);
      const timer = setTimeout(() => {
        navigate('/cart');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [orderId]);

  const validate = async () => {
    try {
      await shippingSchema.validate(form, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      const formErrors = {};
      err.inner.forEach((e) => {
        formErrors[e.path] = e.message;
      });
      setErrors(formErrors);
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const inputStyle = (name) => ({
    background: errors[name]
    ? "#fff0f0"
    : focusedField === name
    ? "#fff"
    : "#f7f5fe",
    border:
      errors[name]
        ? "1.5px solid #e74c3c"
        : focusedField === name
        ? "1.5px solid #9b6ff0"
        : "1.5px solid transparent",
    borderRadius: "50px",
    padding: "12px 14px",
    fontSize: "14px",
    color: "#333",
    fontFamily: "inherit",
    outline: "none",
    direction: "rtl",
    textAlign: "right",
    width: "100%",
    boxSizing: "border-box",
    boxShadow:
      errors[name]
        ? "0 0 0 3px rgba(231,76,60,0.12)"
        : focusedField === name
        ? "0 0 0 3px rgba(155,108,239,0.12)"
        : "none",
    transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
  });

  const textareaStyle = (name) => ({
    ...inputStyle(name),
    resize: "vertical",
    minHeight: "90px",
    borderRadius: "16px",
  });

  const focusProps = (name) => ({
    onFocus: () => setFocusedField(name),
    onBlur: () => setFocusedField(null),
  });

  async function checkoutPaymentHandler(e) {
    try {
      e.preventDefault();
      setCheckoutLoading(true);

      const billingData = {
        first_name: form.first_name || "Guest",
        last_name: form.last_name || "User",
        email: form.email || "guest@example.com",
        phone_number: form.phone_number || "01000000000",
        country: form.country || "EG",
        city: form.city || "Cairo",
        street: form.street || "N/A",
        building: form.building || "1",
        floor: form.floor || "1",
        apartment: form.apartment || "1",
      };

      console.log("order id => ", orderId);
      const res = await checkoutPayment(
        orderId, 
        JSON.stringify({
            billing_data: billingData,
            payment_method: activePayment,
        }),
        setActionMsg
      );
      setCheckoutLoading(false);
      const json = await res.json();

      if (
        activePayment === "cash" && res.ok
      ) {
        responseMessageSetter(true, json.message || "تم حفظ بيانات الشحن بنجاح", setActionMsg);
        navigate("/orders");
      } 
      else if(!res.ok){
        responseMessageSetter(
          false,
          json.message ||  "حدث خطأ أثناء تأكيد الدفع",
          setActionMsg,
        );
      }else if((activePayment === "card" || activePayment === "wallet") && res.ok) {
        if(json.redirect_url)
          window.open(json.redirect_url, "_self");
        else{
        //   responseMessageSetter(
        //   true,
        //   json.message || "تم إرسال رابط الدفع إلى بريدك الإلكتروني. يرجى فتح البريد الإلكتروني وإكمال عملية الدفع",
        //   setActionMsg,
        // );
         window.alert("تم إرسال رابط الدفع إلى بريدك الإلكتروني. يرجى فتح البريد الإلكتروني وإكمال عملية الدفع");
        }
      }
    } catch (err) {
      console.error("checkoutPayment error:", err);
    }
  }

  const handleConfirm = async () => {
    const isValid = await validate();
    if (!isValid) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    checkoutPaymentHandler(orderId);
  };

  return (
    <div className="page">
      <Link to="/Cart" className="back-link">← رجوع للسلة</Link>

      {actionMsg.message && (
        <div className={actionMsg.success ? "success-message" : "error-message"}>
          {actionMsg.message}
        </div>
      )}

      <div className="layout">
        <div className="main-col">
          <div className="card">
            <div className="card-title">
              <TruckIcon />
              معلومات الشحن والفاتورة
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>الاسم الأول <span className="required-star">*</span></label>
                <input
                  name="first_name"
                  placeholder="محمد"
                  value={form.first_name}
                  onChange={handleChange}
                  style={inputStyle("first_name")}
                  {...focusProps("first_name")}
                />
                {errors.first_name && (
                  <span className="field-error">{errors.first_name}</span>
                )}
              </div>

              <div className="form-group">
                <label>اسم العائلة</label>
                <input
                  name="last_name"
                  placeholder="احمد"
                  value={form.last_name}
                  onChange={handleChange}
                  style={inputStyle("last_name")}
                  {...focusProps("last_name")}
                />
              </div>

              <div className="form-group">
                <label>البريد الإلكتروني <span className="required-star">*</span></label>
                <input
                  type="email"
                  name="email"
                  placeholder="ahmed@example.com"
                  value={form.email}
                  onChange={handleChange}
                  style={inputStyle("email")}
                  {...focusProps("email")}
                />
                {errors.email && (
                  <span className="field-error">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label>رقم الهاتف <span className="required-star">*</span></label>
                <input
                  type="tel"
                  name="phone_number"
                  placeholder="01234567890"
                  value={form.phone_number}
                  onChange={handleChange}
                  style={inputStyle("phone_number")}
                  {...focusProps("phone_number")}
                />
                {errors.phone_number && (
                  <span className="field-error">{errors.phone_number}</span>
                )}
              </div>

              <div className="form-group">
                <label>الدولة <span className="required-star">*</span></label>
                <input
                  name="country"
                  placeholder="مصر"
                  value={form.country}
                  onChange={handleChange}
                  style={inputStyle("country")}
                  {...focusProps("country")}
                />
                {errors.country && (
                  <span className="field-error">{errors.country}</span>
                )}
              </div>

              <div className="form-group">
                <label>المدينة <span className="required-star">*</span></label>
                <input
                  name="city"
                  placeholder="قنا"
                  value={form.city}
                  onChange={handleChange}
                  style={inputStyle("city")}
                  {...focusProps("city")}
                />
                {errors.city && (
                  <span className="field-error">{errors.city}</span>
                )}
              </div>

              <div className="form-group full">
                <label>العنوان بالتفصيل <span className="required-star">*</span></label>
                <input
                  name="street"
                  placeholder="الشارع"
                  value={form.street}
                  onChange={handleChange}
                  style={inputStyle("street")}
                  {...focusProps("street")}
                />
                {errors.street && (
                  <span className="field-error">{errors.street}</span>
                )}
              </div>

              <div className="form-group">
                <label>المبنى</label>
                <input
                  name="building"
                  placeholder="24"
                  value={form.building}
                  onChange={handleChange}
                  style={inputStyle("building")}
                  {...focusProps("building")}
                />
              </div>

              <div className="form-group">
                <label>الطابق</label>
                <input
                  name="floor"
                  placeholder="2"
                  value={form.floor}
                  onChange={handleChange}
                  style={inputStyle("floor")}
                  {...focusProps("floor")}
                />
              </div>

              <div className="form-group">
                <label>الشقة</label>
                <input
                  name="apartment"
                  placeholder="4"
                  value={form.apartment}
                  onChange={handleChange}
                  style={inputStyle("apartment")}
                  {...focusProps("apartment")}
                />
              </div>

              <div className="form-group full">
                <label>ملاحظات إضافية (اختياري)</label>
                <textarea
                  name="notes"
                  placeholder="أدخل أي تعليمات خاصة بالتسليم هنا..."
                  value={form.notes}
                  onChange={handleChange}
                  style={textareaStyle("notes")}
                  {...focusProps("notes")}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">طريقة الدفع</div>
            <div className="pay-options">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`pay-opt ${activePayment === method.id ? "active" : ""}`}
                  onClick={() => setActivePayment(method.id)}
                >
                  <span className="pay-icon">{method.icon}</span>
                  {method.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-title">ملخص الطلب</div>
          <div className="summary-row">
            <span className="summary-label">المجموع الفرعي</span>
            <span>{subtotal.toLocaleString("ar-EG")} ج</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">الشحن</span>
            <span>{shipping} ج</span>
          </div>
          <div className="summary-row">
            <span className="Dis">الخصم</span>
            <span className="discount-val">{discount} ج</span>
          </div>
          <hr className="divider" />
          <div className="total-row">
            <span>الإجمالي</span>
            <span style={{ color: "#9b6ff0" }}>{total.toLocaleString("ar-EG")} ج</span>
          </div>
          <button
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? "جاري التأكيد..." : "تأكيد الطلب ←"}
          </button>
          <div className="security-note">
            <ShieldIcon />
            جميع معاملاتك مشفرة وآمنة بنسبة 100%. نلتزم بحماية بياناتك الشخصية
          </div>
        </div>
      </div>
    </div>
  );
}