import { useState } from "react";
import { Banknote, CreditCard, Wallet } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "./Shipping_info.css";

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
  const { subtotal = 0, shipping = 0, discount = 0, total = 0 } = location.state || {};

  const [activePayment, setActivePayment] = useState("cod");
  const [focusedField, setFocusedField] = useState(null);

  const [form, setForm] = useState(() => {
    const user = getUserData();
    const fullName = user?.username || "";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    const address = user?.address || {};
    const billing = user?.additionalBillingData || {};
    const street = address.street || billing.street || "";
    const district = address.district || billing.district || "";
    const fullAddress = [street, district].filter(Boolean).join("، ");
    return {
      firstName,
      lastName,
      email: user?.email || "",
      phone: user?.phone || "",
      address: fullAddress,
      city: address.city || billing.city || "",
      zip: address.zip || billing.zip || "",
      notes: "",
    };
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const inputStyle = (name) => ({
    background: focusedField === name ? "#fff" : "#f7f5fe",
    border: focusedField === name ? "1.5px solid #9b6ff0" : "1.5px solid transparent",
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
    boxShadow: focusedField === name ? "0 0 0 3px rgba(155,108,239,0.12)" : "none",
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

  return (
    <div className="page">
      <Link to="/Cart" className="back-link">← رجوع للسلة</Link>
      <div className="layout">
        <div className="main-col">
          <div className="card">
            <div className="card-title">
              <TruckIcon />
              معلومات الشحن والفوتورة
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>الاسم الأول</label>
                <input name="firstName" placeholder="الاسم الاول" value={form.firstName} onChange={handleChange} style={inputStyle("firstName")} {...focusProps("firstName")} />
              </div>
              <div className="form-group">
                <label>اسم العائلة</label>
                <input name="lastName" placeholder="اسم العائلة" value={form.lastName} onChange={handleChange} style={inputStyle("lastName")} {...focusProps("lastName")} />
              </div>
              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input type="email" name="email" placeholder="ahmed@example.com" value={form.email} onChange={handleChange} style={inputStyle("email")} {...focusProps("email")} />
              </div>
              <div className="form-group">
                <label>رقم الهاتف</label>
                <input type="tel" name="phone" placeholder="+20 123 456 7890" value={form.phone} onChange={handleChange} style={inputStyle("phone")} {...focusProps("phone")} />
              </div>
              <div className="form-group full">
                <label>العنوان بالتفصيل</label>
                <input name="address" placeholder="رقم الشارع، المنطقة، المعالم المميزة" value={form.address} onChange={handleChange} style={inputStyle("address")} {...focusProps("address")} />
              </div>
              <div className="form-group">
                <label>المدينة</label>
                <input name="city" placeholder="فنا" value={form.city} onChange={handleChange} style={inputStyle("city")} {...focusProps("city")} />
              </div>
              <div className="form-group">
                <label>الرمز البريدي (اختياري)</label>
                <input name="zip" placeholder="83511" value={form.zip} onChange={handleChange} style={inputStyle("zip")} {...focusProps("zip")} />
              </div>
              <div className="form-group full">
                <label>ملاحظات إضافية (اختياري)</label>
                <textarea name="notes" placeholder="أدخل أي تعليمات خاصة بالتسليم هنا..." value={form.notes} onChange={handleChange} style={textareaStyle("notes")} {...focusProps("notes")} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              طريقة الدفع
            </div>
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
            <span  className="Dis" >الخصم</span>
            <span className="discount-val">{discount} ج</span>
          </div>
          <hr className="divider" />
          <div className="total-row">
            <span>الإجمالي</span>
            <span style={{ color: "#9b6ff0" }}>{total.toLocaleString("ar-EG")} ج</span>
          </div>
          <button className="confirm-btn">
            تأكيد الطلب ←
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