import { useState, useEffect, useRef } from "react";
import { Banknote, CreditCard, Wallet } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as yup from "yup";
import { responseMessageSetter } from "../../services/authService";
import { checkoutPayment } from "../../services/order";
import EmbeddedPayment from './EmbeddedPayment/EmbeddedPayment';
import "./ShippingInfo.css";

const egyptianPhone = /^(010|011|012|015)\d{8}$/;

// Updated schema - removed building, floor, apartment from validation
const shippingSchema = yup.object().shape({
  first_name: yup.string().trim().required("الاسم الأول مطلوب"),
  last_name: yup.string().trim().required("الاسم الأخير مطلوب"),
  email: yup
    .string()
    .trim()
    .required("البريد الإلكتروني مطلوب")
    .email("صيغة البريد الإلكتروني غير صحيحة"),
  phone_number: yup
    .string()
    .trim()
    .required("رقم الهاتف مطلوب")
    .matches(egyptianPhone, "رقم مصري غير صحيح (010, 011, 012, 015 + 8 أرقام)"),
  country: yup.string().trim().required("الدولة مطلوبة"),
  city: yup.string().trim().required("المدينة مطلوبة"),
  street: yup.string().trim().required("عنوان الشارع مطلوب"),
  notes: yup.string().trim(),
});

const TruckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const ShieldIcon = () => (
  <svg
    width="25"
    height="25"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const paymentMethods = [
  { id: "cash", icon: <Banknote size={22} />, label: "الدفع عند الاستلام" },
  { id: "card", icon: <CreditCard size={22} />, label: "بطاقة ائتمان" },
  { id: "wallet", icon: <Wallet size={22} />, label: "محفظة إلكترونية" },
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
  const timerRef = useRef(null);
  const {
    orderId,
    subtotal = 0,
    shipping = 0,
    discount = 0,
    total = 0,
  } = location.state || {};

  const [activePayment, setActivePayment] = useState("card");
  const [actionMsg, setActionMsg] = useState({ success: false, message: "" });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showEmbeddedPayment, setShowEmbeddedPayment] = useState(false);

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
      notes: "",
    };
  });

  useEffect(() => {
    if (!orderId) {
      responseMessageSetter(
        false,
        "لم يتم إنشاء الطلب بشكل صحيح",
        setActionMsg,
      );
      timerRef.current = setTimeout(() => {
        navigate("/cart");
      }, 6000);
      return () => clearTimeout(timerRef.current);
    }
    window.scrollTo({top: 0 , behavior: "smooth"});
  }, [orderId, navigate]);

  // ✅ Validation function - passed to EmbeddedPayment
  const validateForm = async () => {
    try {
      await shippingSchema.validate(form, { abortEarly: false });
      setErrors({});
      return { isValid: true, errors: null };
    } catch (err) {
      const formErrors = {};
      err.inner.forEach((e) => {
        formErrors[e.path] = e.message;
      });
      setErrors(formErrors);
      // Scroll to first error
      const firstErrorField = document.querySelector('.shipping-form-group .error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return { isValid: false, errors: formErrors };
    }
  };

  // ✅ Get formatted billing data
  const getBillingData = () => ({
    first_name: form.first_name || "ضيف",
    last_name: form.last_name || "مستخدم",
    email: form.email || "guest@example.com",
    phone_number: form.phone_number || "01000000000",
    country: form.country || "مصر",
    city: form.city || "القاهرة",
    street: form.street || "غير محدد",
    building: "1",
    floor: "1",
    apartment: "1",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // ✅ Handle success from EmbeddedPayment
  const handlePaymentSuccess = (response) => {
    console.log('Payment success:', response);
    // The component handles navigation internally
  };

  // ✅ Handle error from EmbeddedPayment
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="shipping-page" dir="rtl">
      {actionMsg.message && (
        <div
          className={
            actionMsg.success
              ? "shipping-success-message"
              : "shipping-error-message"
          }
        >
          {actionMsg.message}
        </div>
      )}

      <div className="shipping-layout">
        <div className="shipping-main-col">
          <div className="shipping-card">
            <div className="shipping-card-title">
              <TruckIcon />
              بيانات الشحن والفواتير
            </div>
            <div className="shipping-form-grid">
              <div className="shipping-form-group">
                <label>
                  الاسم الأول <span className="shipping-required-star">*</span>
                </label>
                <input
                  name="first_name"
                  placeholder="أية"
                  value={form.first_name}
                  onChange={handleChange}
                  className={errors.first_name ? "error" : ""}
                  dir="rtl"
                />
                {errors.first_name && (
                  <span className="shipping-field-error">
                    {errors.first_name}
                  </span>
                )}
              </div>

              <div className="shipping-form-group">
                <label>
                  الاسم الأخير <span className="shipping-required-star">*</span>
                </label>
                <input
                  name="last_name"
                  placeholder="محمد"
                  value={form.last_name}
                  onChange={handleChange}
                  className={errors.last_name ? "error" : ""}
                  dir="rtl"
                />
                {errors.last_name && (
                  <span className="shipping-field-error">
                    {errors.last_name}
                  </span>
                )}
              </div>

              <div className="shipping-form-group">
                <label>
                  البريد الإلكتروني{" "}
                  <span className="shipping-required-star">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className={errors.email ? "error" : ""}
                  dir="ltr"
                />
                {errors.email && (
                  <span className="shipping-field-error">{errors.email}</span>
                )}
              </div>

              <div className="shipping-form-group">
                <label>
                  رقم الهاتف <span className="shipping-required-star">*</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  placeholder="01234567890"
                  value={form.phone_number}
                  onChange={handleChange}
                  className={errors.phone_number ? "error" : ""}
                  dir="ltr"
                />
                {errors.phone_number && (
                  <span className="shipping-field-error">
                    {errors.phone_number}
                  </span>
                )}
              </div>

              <div className="shipping-form-group">
                <label>
                  الدولة <span className="shipping-required-star">*</span>
                </label>
                <input
                  name="country"
                  placeholder="مصر"
                  value={form.country}
                  onChange={handleChange}
                  className={errors.country ? "error" : ""}
                  dir="rtl"
                />
                {errors.country && (
                  <span className="shipping-field-error">{errors.country}</span>
                )}
              </div>

              <div className="shipping-form-group">
                <label>
                  المدينة <span className="shipping-required-star">*</span>
                </label>
                <input
                  name="city"
                  placeholder="قنا"
                  value={form.city}
                  onChange={handleChange}
                  className={errors.city ? "error" : ""}
                  dir="rtl"
                />
                {errors.city && (
                  <span className="shipping-field-error">{errors.city}</span>
                )}
              </div>

              <div className="shipping-form-group shipping-form-group-full">
                <label>
                  عنوان الشارع <span className="shipping-required-star">*</span>
                </label>
                <input
                  name="street"
                  placeholder="شارع الجيش - ميدان المحطة"
                  value={form.street}
                  onChange={handleChange}
                  className={errors.street ? "error" : ""}
                  dir="rtl"
                />
                {errors.street && (
                  <span className="shipping-field-error">{errors.street}</span>
                )}
              </div>

              <div className="shipping-form-group shipping-form-group-full">
                <label>ملاحظات إضافية (اختياري)</label>
                <textarea
                  name="notes"
                  placeholder="أدخل أي تعليمات خاصة للتوصيل هنا..."
                  value={form.notes}
                  onChange={handleChange}
                  className={errors.notes ? "error" : ""}
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          <div className="shipping-card">
            <div className="shipping-card-title">طريقة الدفع</div>
            
            {/* ✅ EmbeddedPayment with validation and billing data */}
            <EmbeddedPayment
              orderId={orderId}
              billingData={getBillingData()}
              totalAmount={total}
              initialMethod="card"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              // ✅ Pass validation function and form data
              validateForm={validateForm}
              formData={form}
              setFormErrors={setErrors}
            />
          </div>
        </div>

        <div className="shipping-summary-card">
          <div className="shipping-summary-title">ملخص الطلب</div>
          <div className="shipping-summary-row">
            <span className="shipping-summary-label">المجموع الفرعي</span>
            <span>{subtotal.toLocaleString()} ج.م</span>
          </div>
          <div className="shipping-summary-row">
            <span className="shipping-summary-label">الشحن</span>
            <span>{shipping} ج.م</span>
          </div>
          <hr className="shipping-divider" />
          <div className="shipping-total-row">
            <span>الإجمالي</span>
            <span>{total.toLocaleString()} ج.م</span>
          </div>
        </div>
      </div>
    </div>
  );
}