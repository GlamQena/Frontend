import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  User,
  Store,
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
  Building2,
  MapPinned,
  ArrowLeft,
} from "lucide-react";
import {
  registerUser,
  responseMessageSetter,
  clientSchema,
  storeOwnerSchema,
  getSessionId,
} from "../../services/authService";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const role = queryParams.get("role");
  const [selectedRole, setSelectedRole] = useState(role || "client");
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({
    success: false,
    message: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getCurrentSchema = () => {
    return selectedRole === "client" ? clientSchema : storeOwnerSchema;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm({
    resolver: yupResolver(getCurrentSchema()),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      birthdate: "",
      gender: "female",
      address: {
        city: "",
        district: "",
        street: "",
      },
      store_name: "",
      store_email: "",
      store_phone: "",
      store_address: {
        city: "",
        district: "",
        street: "",
      },
    },
    mode: "onChange",
  });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    responseMessageSetter(false, "", setSubmitMessage);
  };

  const handleGenderSelect = (gender) => {
    setValue("gender", gender, { shouldValidate: true });
  };

  const handleAddressChange = (field, value) => {
    setValue(`address.${field}`, value, { shouldValidate: true });
  };

  const handleStoreAddressChange = (field, value) => {
    setValue(`store_address.${field}`, value, { shouldValidate: true });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValue(name, value, { shouldValidate: true });
  };

  const onSubmit = async (formData) => {
    setLoading(true);
    responseMessageSetter(false, "", setSubmitMessage);

    try {
      const registrationData = {
        role: selectedRole,
        username: formData.username.toLowerCase().trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phoneNumber: formData.phone || undefined,
        birthdate: formData.birthdate || undefined,
        gender: formData.gender || "female",
        address:
          formData.address?.city ||
          formData.address?.district ||
          formData.address?.street
            ? {
                city: formData.address.city || undefined,
                district: formData.address.district || undefined,
                street: formData.address.street || undefined,
              }
            : undefined,
      };

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
      const session_id = getSessionId();
      registrationData["session_id"] = session_id;

      const responseData = await registerUser(registrationData);

      responseMessageSetter(
        true,
        responseData.message || "تم إرسال رابط التفعيل إلى بريدك الإلكتروني",
        setSubmitMessage
      );

      if (responseData.cart_merged) localStorage.removeItem("session_id");

      if (responseData.authData) {
        const authData = responseData.authData;
        localStorage.setItem("user", JSON.stringify(authData.user));
        localStorage.setItem("accessToken", authData.accessToken);
        localStorage.setItem("refreshToken", authData.refreshToken);
      }

    } catch (err) {
      console.error("Registration error:", err);
      responseMessageSetter(
        false,
        err.message || "حدث خطأ أثناء التسجيل",
        setSubmitMessage
      );
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // BroadcastChannel listener for email verification
  useEffect(() => {
    // Check if verification was completed in another tab
    const checkVerificationStatus = () => {
      const verified = localStorage.getItem('emailVerified');
      const timestamp = localStorage.getItem('verificationTimestamp');
      
      if (verified === 'true' && timestamp) {
        const time = parseInt(timestamp);
        // Check if verification happened within the last 10 seconds
        if (Date.now() - time < 10 * 1000) {
          console.log('📧 Email verification detected on Register page!');
          
          // Clear the flags to prevent duplicate messages
          localStorage.removeItem('emailVerified');
          localStorage.removeItem('verificationTimestamp');
          
          responseMessageSetter(
            true,
            "تم التحقق من البريد الإلكتروني بنجاح! يمكنك الآن تسجيل الدخول.",
            setSubmitMessage
          );

          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: "تم التحقق من بريدك الإلكتروني بنجاح. يرجى تسجيل الدخول."
              } 
            });
          }, 3000);
        }
      }
    };

    // Check on mount
    checkVerificationStatus();

    // Listen for storage changes (when verification tab updates localStorage)
    const handleStorageChange = (event) => {
      if (event.key === 'emailVerified' && event.newValue === 'true') {
        console.log('📧 Storage event: email verified!');
        checkVerificationStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for BroadcastChannel messages from verification tab
    const channel = new BroadcastChannel('email_verification_channel');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'EMAIL_VERIFIED') {
        console.log('📧 BroadcastChannel: Email verified in another tab!', event.data);
        
        responseMessageSetter(
          true,
          "تم التحقق من البريد الإلكتروني بنجاح! يمكنك الآن تسجيل الدخول.",
          setSubmitMessage
        );
        
        // Clear localStorage flags if they exist
        localStorage.removeItem('emailVerified');
        localStorage.removeItem('verificationTimestamp');
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: "تم التحقق من بريدك الإلكتروني بنجاح. يرجى تسجيل الدخول."
            } 
          });
        }, 3000);
      }
    };

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      channel.close();
    };
  }, [navigate]); 

  return (
    <div className="register-page-wrapper">
      {/* Header Section */}
      <div className="register-header">
        <div className="register-header-icon">
          {selectedRole === "client" ? (
            <User size={28} />
          ) : (
            <Store size={28} />
          )}
        </div>
        <h1>مرحباً بك في Glam Qena</h1>
        <p>سجل حسابك الجديد لتبدأ رحلتك معنا</p>
      </div>

      {/* Main Registration Form Card */}
      <div className="register-card">
        {/* Role Selection Tabs */}
        <div className="register-role-tabs">
          <button
            className={`register-tab-btn ${
              selectedRole === "client" ? "active" : ""
            }`}
            onClick={() => handleRoleSelect("client")}
            type="button"
          >
            <User size={18} />
            <span>حساب عميل</span>
          </button>
          <button
            className={`register-tab-btn ${
              selectedRole === "store_owner" ? "active" : ""
            }`}
            onClick={() => handleRoleSelect("store_owner")}
            type="button"
          >
            <Store size={18} />
            <span>صاحب محل</span>
          </button>
        </div>

        {submitMessage.message && (
          <div
            className={`register-alert ${
              submitMessage.success ? "alert-success" : "alert-error"
            }`}
          >
            {submitMessage.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="register-form">
          {/* Username Field */}
          <div className="register-field-group">
            <label className="register-label">
              <UserIcon size={18} /> اسم المستخدم{" "}
              <span className="register-required">*</span>
            </label>
            <input
              type="text"
              name="username"
              {...register("username")}
              onChange={handleInputChange}
              placeholder="اسم المستخدم"
              disabled={loading}
              className={`register-input ${
                errors.username ? "input-error" : ""
              }`}
            />
            {errors.username && (
              <span className="register-field-error">
                {errors.username.message}
              </span>
            )}
            <small className="register-field-hint">
              يمكن استخدام الأحرف الإنجليزية الصغيرة والأرقام والشرطة السفلية فقط
            </small>
          </div>

          {/* Contact Row: Email & Phone */}
          <div className="register-form-row">
            <div className="register-field-group half-width">
              <label className="register-label">
                <Mail size={18} /> البريد الإلكتروني{" "}
                <span className="register-required">*</span>
              </label>
              <input
                type="email"
                name="email"
                {...register("email")}
                onChange={handleInputChange}
                placeholder="example@email.com"
                disabled={loading}
                className={`register-input ${
                  errors.email ? "input-error" : ""
                }`}
              />
              {errors.email && (
                <span className="register-field-error">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="register-field-group half-width">
              <label className="register-label">
                <Phone size={18} /> رقم الهاتف
              </label>
              <input
                type="tel"
                name="phone"
                {...register("phone")}
                onChange={handleInputChange}
                placeholder="01XXXXXXXXX"
                disabled={loading}
                className={`register-input ${
                  errors.phone ? "input-error" : ""
                }`}
              />
              {errors.phone && (
                <span className="register-field-error">
                  {errors.phone.message}
                </span>
              )}
            </div>
          </div>

          {/* Birthdate Field */}
          <div className="register-field-group">
            <label className="register-label">
              <Calendar size={18} /> تاريخ الميلاد
            </label>
            <input
              type="date"
              name="birthdate"
              {...register("birthdate")}
              onChange={handleInputChange}
              disabled={loading}
              max={new Date().toISOString().split("T")[0]}
              className="register-input"
            />
          </div>

          {/* Gender Selection */}
          <div className="register-field-group">
            <label className="register-label">
              <VenusAndMars size={18} /> الجنس{" "}
              <span className="register-required">*</span>
            </label>
            <div className="register-gender-selector">
              <button
                type="button"
                className={`register-gender-btn ${
                  getValues("gender") === "female" ? "active" : ""
                }`}
                onClick={() => handleGenderSelect("female")}
              >
                <Venus size={18} />
                <span>أنثى</span>
              </button>
              <button
                type="button"
                className={`register-gender-btn ${
                  getValues("gender") === "male" ? "active" : ""
                }`}
                onClick={() => handleGenderSelect("male")}
              >
                <Mars size={18} />
                <span>ذكر</span>
              </button>
            </div>
            {errors.gender && (
              <span className="register-field-error">
                {errors.gender.message}
              </span>
            )}
          </div>

          {/* Address Divider */}
          <div className="register-section-divider">
            <span>
              <MapPin size={16} /> العنوان (اختياري)
            </span>
          </div>

          <div className="register-form-row">
            <div className="register-field-group half-width">
              <label className="register-label">
                <Building2 size={18} /> المدينة
              </label>
              <input
                type="text"
                name="address.city"
                value={getValues("address.city") || ""}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                placeholder="المدينة"
                disabled={loading}
                className={`register-input ${
                  errors.address?.city ? "input-error" : ""
                }`}
              />
              {errors.address?.city && (
                <span className="register-field-error">
                  {errors.address.city.message}
                </span>
              )}
            </div>

            <div className="register-field-group half-width">
              <label className="register-label">
                <MapPinned size={18} /> المنطقة
              </label>
              <input
                type="text"
                name="address.district"
                value={getValues("address.district") || ""}
                onChange={(e) =>
                  handleAddressChange("district", e.target.value)
                }
                placeholder="المنطقة"
                disabled={loading}
                className={`register-input ${
                  errors.address?.district ? "input-error" : ""
                }`}
              />
              {errors.address?.district && (
                <span className="register-field-error">
                  {errors.address.district.message}
                </span>
              )}
            </div>
          </div>

          <div className="register-field-group">
            <label className="register-label">
              <MapPin size={18} /> الشارع
            </label>
            <input
              type="text"
              name="address.street"
              value={getValues("address.street") || ""}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              placeholder="المدينة، الشارع..."
              disabled={loading}
              className={`register-input ${
                errors.address?.street ? "input-error" : ""
              }`}
            />
            {errors.address?.street && (
              <span className="register-field-error">
                {errors.address.street.message}
              </span>
            )}
          </div>

          {/* Password Row */}
          <div className="register-form-row">
            <div className="register-field-group half-width">
              <label className="register-label">
                <Lock size={18} /> كلمة المرور{" "}
                <span className="register-required">*</span>
              </label>
              <div className="register-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  {...register("password")}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`register-input ${
                    errors.password ? "input-error" : ""
                  }`}
                />
                <button
                  type="button"
                  className="register-toggle-password"
                  onClick={() => togglePasswordVisibility("password")}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="register-field-error">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className="register-field-group half-width">
              <label className="register-label">
                <Lock size={18} /> تأكيد كلمة المرور{" "}
                <span className="register-required">*</span>
              </label>
              <div className="register-password-field">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  {...register("confirmPassword")}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`register-input ${
                    errors.confirmPassword ? "input-error" : ""
                  }`}
                />
                <button
                  type="button"
                  className="register-toggle-password"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="register-field-error">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>
          </div>

          {/* Store Owner Specific Section */}
          {selectedRole === "store_owner" && (
            <>
              <div className="register-section-divider">
                <span>
                  <Store size={16} /> معلومات المحل
                </span>
              </div>

              <div className="register-field-group">
                <label className="register-label">
                  <Store size={18} /> اسم المحل{" "}
                  <span className="register-required">*</span>
                </label>
                <input
                  type="text"
                  name="store_name"
                  {...register("store_name")}
                  onChange={handleInputChange}
                  placeholder="أدخل اسم المحل"
                  disabled={loading}
                  className={`register-input ${
                    errors.store_name ? "input-error" : ""
                  }`}
                />
                {errors.store_name && (
                  <span className="register-field-error">
                    {errors.store_name.message}
                  </span>
                )}
              </div>

              <div className="register-form-row">
                <div className="register-field-group half-width">
                  <label className="register-label">
                    <Mail size={18} /> بريد المحل{" "}
                    <span className="register-required">*</span>
                  </label>
                  <input
                    type="email"
                    name="store_email"
                    {...register("store_email")}
                    onChange={handleInputChange}
                    placeholder="store@example.com"
                    disabled={loading}
                    className={`register-input ${
                      errors.store_email ? "input-error" : ""
                    }`}
                  />
                  {errors.store_email && (
                    <span className="register-field-error">
                      {errors.store_email.message}
                    </span>
                  )}
                </div>

                <div className="register-field-group half-width">
                  <label className="register-label">
                    <Phone size={18} /> هاتف المحل{" "}
                    <span className="register-required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="store_phone"
                    {...register("store_phone")}
                    onChange={handleInputChange}
                    placeholder="01XXXXXXXXX"
                    disabled={loading}
                    className={`register-input ${
                      errors.store_phone ? "input-error" : ""
                    }`}
                  />
                  {errors.store_phone && (
                    <span className="register-field-error">
                      {errors.store_phone.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="register-section-divider">
                <span>
                  <MapPin size={16} /> عنوان المحل{" "}
                  <span className="register-required">*</span>
                </span>
              </div>

              <div className="register-form-row">
                <div className="register-field-group half-width">
                  <label className="register-label">
                    <Building2 size={18} /> المدينة{" "}
                    <span className="register-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="store_address.city"
                    value={getValues("store_address.city") || ""}
                    onChange={(e) =>
                      handleStoreAddressChange("city", e.target.value)
                    }
                    placeholder="مدينة المحل"
                    disabled={loading}
                    className={`register-input ${
                      errors.store_address?.city ? "input-error" : ""
                    }`}
                  />
                  {errors.store_address?.city && (
                    <span className="register-field-error">
                      {errors.store_address.city.message}
                    </span>
                  )}
                </div>

                <div className="register-field-group half-width">
                  <label className="register-label">
                    <MapPinned size={18} /> المنطقة{" "}
                    <span className="register-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="store_address.district"
                    value={getValues("store_address.district") || ""}
                    onChange={(e) =>
                      handleStoreAddressChange("district", e.target.value)
                    }
                    placeholder="منطقة المحل"
                    disabled={loading}
                    className={`register-input ${
                      errors.store_address?.district ? "input-error" : ""
                    }`}
                  />
                  {errors.store_address?.district && (
                    <span className="register-field-error">
                      {errors.store_address.district.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="register-field-group">
                <label className="register-label">
                  <MapPin size={18} /> الشارع{" "}
                  <span className="register-required">*</span>
                </label>
                <input
                  type="text"
                  name="store_address.street"
                  value={getValues("store_address.street") || ""}
                  onChange={(e) =>
                    handleStoreAddressChange("street", e.target.value)
                  }
                  placeholder="شارع المحل"
                  disabled={loading}
                  className={`register-input ${
                    errors.store_address?.street ? "input-error" : ""
                  }`}
                />
                {errors.store_address?.street && (
                  <span className="register-field-error">
                    {errors.store_address.street.message}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="register-submit-btn"
            disabled={loading}
          >
            <span>{loading ? "جاري إنشاء الحساب..." : "إنشاء حساب جديد"}</span>
            <ArrowLeft size={18} />
          </button>

          <p className="register-login-link">
            لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;