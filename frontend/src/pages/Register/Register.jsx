import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Store,
  ChevronRight,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Calendar,
  MapPin,
  Venus,
  Mars,
  VenusAndMars,
  Eye,
  EyeOff,
  UserCircle,
  Building2,
  MapPinned,
} from "lucide-react";
import { registerUser } from "../../services/authService";
import "./Register.css";

const Register = ({ isDark }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    // بيانات مشتركة
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    birthdate: "",
    gender: "",

    // العنوان الرئيسي (object)
    address: {
      city: "",
      district: "",
      street: "",
    },

    // بيانات خاصة بصاحب المحل
    store_name: "",
    store_email: "",
    store_phone: "",
    store_address: {
      city: "",
      district: "",
      street: "",
    },
  });

  // التحقق الفوري من الحقول - مطابق لقواعد Zod
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      // case "firstName":
      //   if (!value.trim()) error = "الاسم الأول مطلوب";
      //   else if (value.length > 40)
      //     error = "الاسم الأول يجب أن يكون أقل من 40 حرف";
      //   break;

      // case "lastName":
      //   if (!value.trim()) error = "الاسم الأخير مطلوب";
      //   else if (value.length > 40)
      //     error = "الاسم الأخير يجب أن يكون أقل من 40 حرف";
      //   break;

      case "username":
        if (!value.trim()) error = "اسم المستخدم مطلوب";
        else if (value.length < 3)
          error = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
        else if (value.length > 64)
          error = "اسم المستخدم يجب أن يكون أقل من 64 حرف";
        else if (!/^[a-z0-9_]+$/.test(value))
          error =
            "اسم المستخدم يمكن أن يحتوي فقط على أحرف إنجليزية صغيرة وأرقام وشرطة سفلية";
        break;

      case "email":
        if (!value.trim()) error = "البريد الإلكتروني مطلوب";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          error = "البريد الإلكتروني غير صالح";
        else if (value.length > 254) error = "البريد الإلكتروني طويل جداً";
        break;

      case "password":
        if (!value) error = "كلمة المرور مطلوبة";
        else if (value.length < 8)
          error = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
        else if (value.length > 64)
          error = "كلمة المرور يجب أن تكون أقل من 64 حرف";
        else if (!/[A-Z]/.test(value))
          error = "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل";
        else if (!/[a-z]/.test(value))
          error = "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل";
        else if (!/[0-9]/.test(value))
          error = "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل";
        break;

      case "confirmPassword":
        if (!value) error = "تأكيد كلمة المرور مطلوب";
        else if (value !== formData.password) error = "كلمة المرور غير متطابقة";
        break;

      case "phone":
        if (!value.trim()) error = "رقم الهاتف مطلوب";
        else if (!/^01[0125][0-9]{8}$/.test(value))
          error =
            "رقم الهاتف غير صالح (يجب أن يبدأ بـ 010, 011, 012, 015 ثم 8 أرقام)";
        break;

      case "gender":
        if (value && !["male", "female"].includes(value))
          error = "الجنس يجب أن يكون ذكر أو أنثى";
        break;

      case "store_name":
        if (selectedRole === "store_owner" && !value.trim())
          error = "اسم المحل مطلوب";
        else if (value.length > 100)
          error = "اسم المحل يجب أن يكون أقل من 100 حرف";
        break;

      case "store_email":
        if (selectedRole === "store_owner" && !value.trim())
          error = "البريد الإلكتروني للمحل مطلوب";
        else if (
          selectedRole === "store_owner" &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        )
          error = "البريد الإلكتروني للمحل غير صالح";
        break;

      case "store_phone":
        if (selectedRole === "store_owner" && !value.trim())
          error = "رقم هاتف المحل مطلوب";
        else if (
          selectedRole === "store_owner" &&
          !/^01[0125][0-9]{8}$/.test(value)
        )
          error =
            "رقم هاتف المحل غير صالح (يجب أن يبدأ بـ 010, 011, 012, 015 ثم 8 أرقام)";
        break;

      case "address.city":
        if (value && value.length > 50)
          error = "اسم المدينة يجب أن يكون أقل من 50 حرف";
        break;

      case "address.district":
        if (value && value.length > 50)
          error = "اسم المنطقة يجب أن يكون أقل من 50 حرف";
        break;

      case "address.street":
        if (value && value.length > 100)
          error = "اسم الشارع يجب أن يكون أقل من 100 حرف";
        break;

      case "store_address.city":
        if (selectedRole === "store_owner" && !value.trim())
          error = "مدينة المحل مطلوبة";
        else if (value.length > 50)
          error = "اسم المدينة يجب أن يكون أقل من 50 حرف";
        break;

      case "store_address.district":
        if (selectedRole === "store_owner" && !value.trim())
          error = "منطقة المحل مطلوبة";
        else if (value.length > 50)
          error = "اسم المنطقة يجب أن يكون أقل من 50 حرف";
        break;

      case "store_address.street":
        if (selectedRole === "store_owner" && !value.trim())
          error = "شارع المحل مطلوب";
        else if (value.length > 100)
          error = "اسم الشارع يجب أن يكون أقل من 100 حرف";
        break;

      default:
        break;
    }

    return error;
  };

  // تحديث بيانات الفورم مع التحقق
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));

      const fieldError = validateField(name, value);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: fieldError,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      const fieldError = validateField(name, value);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: fieldError,
      }));
    }

    setError("");
  };

  // معالجة اختيار الجنس
  const handleGenderSelect = (gender) => {
    setFormData((prev) => ({
      ...prev,
      gender: gender,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      gender: "",
    }));
  };

  // معالجة اختيار الدور
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep(2);
    setError("");
    setFieldErrors({});
  };

  // العودة لاختيار الدور
  const handleBack = () => {
    setStep(1);
    setSelectedRole(null);
    setError("");
    setSuccess("");
    setFieldErrors({});
  };

  // التحقق الشامل من النموذج
  const validateForm = () => {
    const errors = {};
    const fieldsToValidate = [
      "firstName",
      "lastName",
      "username",
      "email",
      "password",
      "confirmPassword",
      "phone",
    ];

    if (selectedRole === "store_owner") {
      fieldsToValidate.push("store_name", "store_email", "store_phone");
      fieldsToValidate.push(
        "store_address.city",
        "store_address.district",
        "store_address.street",
      );
    }

    // التحقق من الحقول الاختيارية إذا كان لها قيم
    if (formData.gender) {
      const genderError = validateField("gender", formData.gender);
      if (genderError) errors.gender = genderError;
    }

    if (
      formData.address.city ||
      formData.address.district ||
      formData.address.street
    ) {
      if (formData.address.city) {
        const cityError = validateField("address.city", formData.address.city);
        if (cityError) errors["address.city"] = cityError;
      }
      if (formData.address.district) {
        const districtError = validateField(
          "address.district",
          formData.address.district,
        );
        if (districtError) errors["address.district"] = districtError;
      }
      if (formData.address.street) {
        const streetError = validateField(
          "address.street",
          formData.address.street,
        );
        if (streetError) errors["address.street"] = streetError;
      }
    }

    fieldsToValidate.forEach((field) => {
      let value;
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        value = formData[parent]?.[child] || "";
      } else {
        value = formData[field] || "";
      }

      const error = validateField(field, value);
      if (error) errors[field] = error;
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // تسليم الفورم
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("يرجى تصحيح الأخطاء في النموذج");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // تجهيز البيانات للإرسال - مطابق تماماً للسكيما
      const registrationData = {
        role: selectedRole,
        // firstName: formData.firstName,
        // lastName: formData.lastName,
        username: formData.username.toLowerCase().trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword, // مطلوب للسكيما
        phone: formData.phone || undefined,
        birthdate: formData.birthdate || undefined,
        gender: formData.gender || undefined,
        address:
          formData.address.city ||
          formData.address.district ||
          formData.address.street
            ? {
                city: formData.address.city || undefined,
                district: formData.address.district || undefined,
                street: formData.address.street || undefined,
              }
            : undefined,
      };

      // إضافة البيانات الخاصة بصاحب المحل
      if (selectedRole === "store_owner") {
        registrationData.store_name = formData.store_name;
        registrationData.store_email = formData.store_email
          .toLowerCase()
          .trim();
        registrationData.store_phone = formData.store_phone;
        registrationData.store_address = {
          city: formData.store_address.city,
          district: formData.store_address.district,
          street: formData.store_address.street,
        };
      }

      console.log("Sending data:", registrationData); // للتأكد من البيانات
      const response = await registerUser(registrationData);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSuccess(
        response.message ||
       "تم إرسال رابط التفعيل إلى بريدك الإلكتروني"
      );

      // setTimeout(() => {
      //   navigate("/login");
      // }, 3000);
    } catch (err) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      console.error("Registration error:", err);
      setError(err.message || "حدث خطأ أثناء التسجيل");
    } finally {
      setLoading(false);
    }
  };

  // تبديل إظهار/إخفاء كلمة المرور
  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className={`selection-wrapper ${isDark ? "dark" : "light"}`}>
      <div className="selection-content">
        {step === 1 ? (
          // الخطوة 1: اختيار الدور
          <>
            <div className="top-badge">انضم إلينا</div>
            <h1 className="main-title">
              اختر <span>نوع الحساب</span>
            </h1>
            <p className="main-desc">
              اختر نوع الحساب المناسب لك لتبدأ رحلتك مع Qena Glam
            </p>

            <div className="selection-cards">
              {/* كارت عميل */}
              <div
                className="card client-card"
                onClick={() => handleRoleSelect("client")}
                role="button"
                tabIndex={0}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleRoleSelect("client")
                }
              >
                <div className="card-icon">
                  <User size={32} />
                </div>
                <h2>عميل</h2>
                <p>
                  تسوق منتجات التجميل من محلاتك المفضلة واحجز مواعيدك بكل سهولة.
                </p>
                <button className="circle-btn">
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* كارت صاحب محل */}
              <div
                className="card owner-card"
                onClick={() => handleRoleSelect("store_owner")}
                role="button"
                tabIndex={0}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleRoleSelect("store_owner")
                }
              >
                <div className="card-icon">
                  <Store size={32} />
                </div>
                <h2>صاحب محل</h2>
                <p>أدر أعمالك، اعرض خدماتك، وضاعف وصولك لجمهور أوسع في قنا.</p>
                <button className="circle-btn">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          // الخطوة 2: نموذج التسجيل
          <div className="registration-form-container">
            <button className="back-btn" onClick={handleBack}>
              ← العودة لاختيار الدور
            </button>

            <div className="form-header">
              <div className={`role-indicator ${selectedRole}`}>
                {selectedRole === "client" ? (
                  <>
                    <User size={24} />
                    <span>
                      تسجيل كـ <strong>عميل</strong>
                    </span>
                  </>
                ) : (
                  <>
                    <Store size={24} />
                    <span>
                      تسجيل كـ <strong>صاحب محل</strong>
                    </span>
                  </>
                )}
              </div>
              <h2>أنشئ حسابك الجديد</h2>
            </div>

            {error && <div className="error-message">{error}</div>}

            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit} className="registration-form">
              {/* حقول الاسم */}
              {/* <div className="form-row">
                <div className="form-group half">
                  <label>
                    <UserCircle size={18} /> الاسم الأول{" "}
                    <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="الاسم الأول"
                    required
                    disabled={loading}
                    className={fieldErrors.firstName ? "error" : ""}
                  />
                  {fieldErrors.firstName && (
                    <span className="field-error">{fieldErrors.firstName}</span>
                  )}
                </div>

                <div className="form-group half">
                  <label>
                    <UserCircle size={18} /> الاسم الأخير{" "}
                    <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="الاسم الأخير"
                    required
                    disabled={loading}
                    className={fieldErrors.lastName ? "error" : ""}
                  />
                  {fieldErrors.lastName && (
                    <span className="field-error">{fieldErrors.lastName}</span>
                  )}
                </div>
              </div> */}

              {/* باقي الحقول المشتركة */}
              <div className="form-group">
                <label>
                  <UserIcon size={18} /> اسم المستخدم{" "}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="أدخل اسم المستخدم (أحرف إنجليزية صغيرة)"
                  required
                  disabled={loading}
                  className={fieldErrors.username ? "error" : ""}
                />
                {fieldErrors.username && (
                  <span className="field-error">{fieldErrors.username}</span>
                )}
                <small className="field-hint">
                  يمكن استخدام الأحرف الإنجليزية الصغيرة والأرقام والشرطة
                  السفلية فقط
                </small>
              </div>

              <div className="form-group">
                <label>
                  <Mail size={18} /> البريد الإلكتروني{" "}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@domain.com"
                  required
                  disabled={loading}
                  className={fieldErrors.email ? "error" : ""}
                />
                {fieldErrors.email && (
                  <span className="field-error">{fieldErrors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <Lock size={18} /> كلمة المرور{" "}
                  <span className="required-star">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="٨ أحرف على الأقل"
                    required
                    minLength="8"
                    disabled={loading}
                    className={fieldErrors.password ? "error" : ""}
                  />
                  <button
                    type="button"
                    className="eye-icon"
                    onClick={() => togglePasswordVisibility("password")}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <span className="field-error">{fieldErrors.password}</span>
                )}
                <small className="field-hint">
                  يجب أن تحتوي على حرف كبير وحرف صغير ورقم على الأقل
                </small>
              </div>

              <div className="form-group">
                <label>
                  <Lock size={18} /> تأكيد كلمة المرور{" "}
                  <span className="required-star">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="أعد إدخال كلمة المرور"
                    required
                    disabled={loading}
                    className={fieldErrors.confirmPassword ? "error" : ""}
                  />
                  <button
                    type="button"
                    className="eye-icon"
                    onClick={() => togglePasswordVisibility("confirm")}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <span className="field-error">
                    {fieldErrors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <Phone size={18} /> رقم الهاتف{" "}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="مثال: 01234567890"
                  required
                  disabled={loading}
                  className={fieldErrors.phone ? "error" : ""}
                />
                {fieldErrors.phone && (
                  <span className="field-error">{fieldErrors.phone}</span>
                )}
                <small className="field-hint">
                  رقم مصري صحيح (010, 011, 012, 015 ثم 8 أرقام)
                </small>
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={18} /> تاريخ الميلاد
                </label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  disabled={loading}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* أزرار اختيار الجنس */}
              <div className="form-group">
                <label>
                  <VenusAndMars size={18} /> الجنس
                </label>
                <div className="gender-buttons">
                  <button
                    type="button"
                    className={`gender-btn ${formData.gender === "male" ? "active" : ""}`}
                    onClick={() => handleGenderSelect("male")}
                  >
                    <Mars size={20} />
                    <span>ذكر</span>
                  </button>
                  <button
                    type="button"
                    className={`gender-btn ${formData.gender === "female" ? "active" : ""}`}
                    onClick={() => handleGenderSelect("female")}
                  >
                    <Venus size={20} />
                    <span>أنثى</span>
                  </button>
                </div>
              </div>

              {/* العنوان الرئيسي - اختياري */}
              <div className="form-section-divider">
                <span>
                  <MapPin size={16} /> العنوان (اختياري)
                </span>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>
                    <Building2 size={18} /> المدينة
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    placeholder="المدينة"
                    disabled={loading}
                    className={fieldErrors["address.city"] ? "error" : ""}
                  />
                  {fieldErrors["address.city"] && (
                    <span className="field-error">
                      {fieldErrors["address.city"]}
                    </span>
                  )}
                </div>

                <div className="form-group half">
                  <label>
                    <MapPinned size={18} /> المنطقة
                  </label>
                  <input
                    type="text"
                    name="address.district"
                    value={formData.address.district}
                    onChange={handleInputChange}
                    placeholder="المنطقة"
                    disabled={loading}
                    className={fieldErrors["address.district"] ? "error" : ""}
                  />
                  {fieldErrors["address.district"] && (
                    <span className="field-error">
                      {fieldErrors["address.district"]}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <MapPin size={18} /> الشارع
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  placeholder="الشارع"
                  disabled={loading}
                  className={fieldErrors["address.street"] ? "error" : ""}
                />
                {fieldErrors["address.street"] && (
                  <span className="field-error">
                    {fieldErrors["address.street"]}
                  </span>
                )}
              </div>

              {/* حقول إضافية لصاحب المحل */}
              {selectedRole === "store_owner" && (
                <>
                  <div className="form-section-divider">
                    <span>
                      <Store size={16} /> معلومات المحل
                    </span>
                  </div>

                  <div className="form-group">
                    <label>
                      <Store size={18} /> اسم المحل{" "}
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      name="store_name"
                      value={formData.store_name}
                      onChange={handleInputChange}
                      placeholder="أدخل اسم المحل"
                      required
                      disabled={loading}
                      className={fieldErrors.store_name ? "error" : ""}
                    />
                    {fieldErrors.store_name && (
                      <span className="field-error">
                        {fieldErrors.store_name}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      <Mail size={18} /> البريد الإلكتروني للمحل{" "}
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="email"
                      name="store_email"
                      value={formData.store_email}
                      onChange={handleInputChange}
                      placeholder="store@example.com"
                      required
                      disabled={loading}
                      className={fieldErrors.store_email ? "error" : ""}
                    />
                    {fieldErrors.store_email && (
                      <span className="field-error">
                        {fieldErrors.store_email}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      <Phone size={18} /> هاتف المحل{" "}
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="tel"
                      name="store_phone"
                      value={formData.store_phone}
                      onChange={handleInputChange}
                      placeholder="مثال: 01234567890"
                      required
                      disabled={loading}
                      className={fieldErrors.store_phone ? "error" : ""}
                    />
                    {fieldErrors.store_phone && (
                      <span className="field-error">
                        {fieldErrors.store_phone}
                      </span>
                    )}
                    <small className="field-hint">
                      رقم مصري صحيح (010, 011, 012, 015 ثم 8 أرقام)
                    </small>
                  </div>

                  {/* عنوان المحل - إلزامي */}
                  <div className="form-section-divider">
                    <span>
                      <MapPin size={16} /> عنوان المحل{" "}
                      <span className="required-star">*</span>
                    </span>
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label>
                        <Building2 size={18} /> المدينة{" "}
                        <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        name="store_address.city"
                        value={formData.store_address.city}
                        onChange={handleInputChange}
                        placeholder="مدينة المحل"
                        required
                        disabled={loading}
                        className={
                          fieldErrors["store_address.city"] ? "error" : ""
                        }
                      />
                      {fieldErrors["store_address.city"] && (
                        <span className="field-error">
                          {fieldErrors["store_address.city"]}
                        </span>
                      )}
                    </div>

                    <div className="form-group half">
                      <label>
                        <MapPinned size={18} /> المنطقة{" "}
                        <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        name="store_address.district"
                        value={formData.store_address.district}
                        onChange={handleInputChange}
                        placeholder="منطقة المحل"
                        required
                        disabled={loading}
                        className={
                          fieldErrors["store_address.district"] ? "error" : ""
                        }
                      />
                      {fieldErrors["store_address.district"] && (
                        <span className="field-error">
                          {fieldErrors["store_address.district"]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <MapPin size={18} /> الشارع{" "}
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      name="store_address.street"
                      value={formData.store_address.street}
                      onChange={handleInputChange}
                      placeholder="شارع المحل"
                      required
                      disabled={loading}
                      className={
                        fieldErrors["store_address.street"] ? "error" : ""
                      }
                    />
                    {fieldErrors["store_address.street"] && (
                      <span className="field-error">
                        {fieldErrors["store_address.street"]}
                      </span>
                    )}
                  </div>
                </>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
              </button>

              <p className="login-link">
                لديك حساب بالفعل؟ <a href="/login">تسجيل الدخول</a>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;