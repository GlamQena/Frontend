import React, { useState, useEffect, useRef } from "react";
import "./Profile.css";
import { useNavigate } from "react-router-dom";
import {
  responseMessageSetter,
  isUserLogged,
  logout,
  getEmailToken,
} from "../../services/authService";
import {
  changePassword,
  deleteProfile,
  editProfile,
  editAvatar,
  getProfile,
} from "../../services/profileService";

import Footer from "../../components/Footer";
import { useTheme } from "../../components/ThemeProvider";
import { getCurrentUser } from "../../services/users";

const Profile = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState(null);
  const [avatarImg, setAvatarImg] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formMessage, setFormMessage] = useState({
    success: false,
    message: "",
  });
  
  const profileFormRef = useRef(null);

  useEffect(() => {
    getUserProfile();
  }, [editMode]);

  // Prevent accidental form submissions globally
  useEffect(() => {
    const handleGlobalSubmit = (e) => {
      if (e.target && e.target.tagName === 'FORM') {
        if (!editMode && e.target.id === 'profile-form') {
          e.preventDefault();
          console.log("Prevented form submission because not in edit mode");
          return false;
        }
      }
    };
    
    document.addEventListener('submit', handleGlobalSubmit, true);
    
    return () => {
      document.removeEventListener('submit', handleGlobalSubmit);
    };
  }, [editMode]);

  const loadUserData = async () => {
    setLoading(true);
    const user = await getCurrentUser();
    if (user && user !== "undefined" && user !== "null" && user !== "") {
      setProfileForm({ ...JSON.parse(user) });
      setLoading(false);
    } else {
      localStorage.removeItem("user");
      await getUserProfile();
    }
  };

  const getUserProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile(setFormMessage);
      const data = await response.json();

      if (!response.ok) {
        responseMessageSetter(false, data.message, setFormMessage);
        setLoading(false);
        return;
      }

      setProfileForm({ ...data.user });
      setLoading(false);
      localStorage.setItem("user", JSON.stringify(data.user));
      setLoading(false);
    } catch (error) {
      responseMessageSetter(false, error.message, setFormMessage);
      setLoading(false);
    }
  };

  const handleChangeInput = (e) => {
    let { name, value, type, checked } = e.target;
    
    if (type === "password") {
      setPasswordForm((prev) => ({ ...prev, [name]: value }));
    } 
    else if (type === "file") {
      const file = e.target.files[0];
      if (file) {
        setAvatarImg(file);
        const previewUrl = URL.createObjectURL(file);
        setProfileForm((prev) => ({ ...prev, imagePreview: previewUrl }));
      }
    } 
    else if (type === "checkbox") {
      let newNotifications = [...(profileForm.notifications || [])];
      if (newNotifications.includes(name)) {
        newNotifications = newNotifications.filter((not) => not !== name);
      } else {
        newNotifications.push(name);
      }
      setProfileForm((prev) => ({
        ...prev,
        notifications: newNotifications,
      }));
    } 
    else if (name.includes("store_address")) {
      const fieldName = name.split(".")[1];
      setProfileForm((prev) => ({
        ...prev,
        store_address: { ...prev.store_address, [fieldName]: value },
      }));
    } 
    else if (name.includes("address")) {
      const fieldName = name.split(".")[1];
      setProfileForm((prev) => ({
        ...prev,
        address: { ...prev.address, [fieldName]: value },
      }));
    } 
    else {
      setProfileForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelection = (field, value) => {
    if (!editMode) return;
    
    if (Array.isArray(profileForm[field])) {
      let newArr = [...profileForm[field]];
      if (newArr.includes(value)) {
        newArr = newArr.filter((val) => val !== value);
      } else {
        newArr.push(value);
      }
      setProfileForm((prev) => ({ ...prev, [field]: newArr }));
    } else {
      setProfileForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      responseMessageSetter(false, "الرجاء إدخال كلمة المرور الحالية", setFormMessage);
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      responseMessageSetter(false, "كلمة المرور الجديدة غير متطابقة", setFormMessage);
      return;
    }
    
    if (passwordForm.newPassword && passwordForm.newPassword.length < 8) {
      responseMessageSetter(false, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل", setFormMessage);
      return;
    }

    try {
      const reqBody = JSON.stringify({
        email: profileForm.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmPassword,
      });

      const response = await changePassword(reqBody, setFormMessage);
      const data = await response.json();
      
      if (!response.ok) {
        return responseMessageSetter(false, data.message, setFormMessage);
      }

      responseMessageSetter(true, "تم تغيير كلمة المرور بنجاح، سيتم تسجيل الخروج...", setFormMessage);
      
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);

      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      
    } catch (e) {
      responseMessageSetter(false, e.message, setFormMessage);
      console.error(e);
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    
    if (!editMode) return;

    if (avatarImg && avatarImg instanceof File) {
      const imageFormData = new FormData();
      imageFormData.append("image", avatarImg);

      try {
        const response = await editAvatar(imageFormData, setFormMessage);
        const avatarResData = await response.json();
        
        if (!response.ok) {
          console.log("Avatar upload failed:", avatarResData);
          return responseMessageSetter(false, avatarResData.message, setFormMessage);
        }
        
        responseMessageSetter(true, "تم تحديث الصورة بنجاح", setFormMessage);
        
        if (avatarResData.user) {
          localStorage.setItem("user", JSON.stringify(avatarResData.user));
          setProfileForm((prev) => ({ ...prev, image: avatarResData.user.image }));
        }
      } catch (error) {
        responseMessageSetter(false, error.message, setFormMessage);
        return;
      }
    }

    const { imagePreview, ...updateData } = profileForm;
    console.log("edit profile updated data to be sent:", updateData);

    try {
      const res = await editProfile(updateData, setFormMessage);
      const data = await res.json();

      if (res.ok) {
        responseMessageSetter(true, data.message || "تم حفظ التعديلات بنجاح", setFormMessage);
        localStorage.setItem("user", JSON.stringify(data.user));
        setProfileForm(data.user);
        setEditMode(false);
        setAvatarImg(null);
      } else {
        console.log("edit profile failed:", data);
        responseMessageSetter(false, data.message || "فشل التعديل", setFormMessage);
      }
    } catch (err) {
      responseMessageSetter(false, err.message || "خطأ في الاتصال بالسيرفر", setFormMessage);
    }
  };

  const handleDeleteProfile = async () => {
    if (window.confirm("هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه")) {
      try {
        const res = await deleteProfile(setFormMessage);
        const data = await res.json();

        if (res.ok) {
          responseMessageSetter(true, data.message, setFormMessage);
          await logout();
          setTimeout(() => {
            navigate("/");
          }, 3000);
        } else {
          responseMessageSetter(false, data.message, setFormMessage);
        }
      } catch (err) {
        responseMessageSetter(false, "خطأ في الاتصال بالسيرفر", setFormMessage);
      }
    }
  };

  const cancelEdit = () => {
    loadUserData();
    setEditMode(false);
    setAvatarImg(null);
    setFormMessage({ success: false, message: "" });
  };

  const enterEditMode = () => {
    setEditMode(true);
    setShowPasswordForm(false);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split('T')[0];
  };

  const getAvatarSrc = () => {
    if (profileForm.imagePreview) {
      return profileForm.imagePreview;
    }
    if (profileForm.image) {
      return encodeURI(
        profileForm.image
          .replace(/\\/g, "//")
          .replace("uploads", "http://127.0.0.1:8080")
      );
    }
    return theme === "light" ? "/images/profile/Avatar Light.png" : "/images/profile/Avatar.png";
  };

  const getEmailVerificationToken = async () => {
    try{
      let res = await getEmailToken(profileForm.email);
      let data = await res.json();

      if(!res.ok){
        return responseMessageSetter(false, data.message || "فشل الحصول على رابط التحقق", setFormMessage);
      }

      responseMessageSetter(true, data.message || "تم إرسال رابط التحقق إلى بريدك الإلكتروني", setFormMessage);
    }catch(err){
      responseMessageSetter(false, err.message || "خطأ في الاتصال بالسيرفر", setFormMessage);
    }
  }

  if (!isUserLogged()) {
    return (
      <div className="profile-page-wrapper" dir="rtl">
        <div className="notAuth-message">
          <p className="error-message">انتهت جلستك، الرجاء تسجيل الدخول مرة أخرى</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-page-wrapper" dir="rtl">
        <div className="loading">جاري تحميل البيانات...</div>
      </div>
    );
  }

  if (!profileForm) {
    return (
      <div className="profile-page-wrapper" dir="rtl">
        <div className="notAuth-message">
          <p className="error-message">
            {formMessage.message || "تعذر تحميل بيانات الملف الشخصي"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="profile-page-wrapper" dir="rtl">
        {/* Header Section */}
        <section className="profile-header-card">
          <div className="user-main-info">
            {editMode ? (
              <div className="avatar-upload-wrapper">
                <div className="profile-avatar">
                  <img src={getAvatarSrc()} alt="Profile" />
                </div>
                <label className="avatar-upload-label">
                  <span>تغيير الصورة</span>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    className="avatar-input-hidden"
                    onChange={handleChangeInput}
                  />
                </label>
              </div>
            ) : (
              <div className="profile-avatar">
                <img src={getAvatarSrc()} alt="Profile" />
              </div>
            )}

            <div className="user-text">
              {(profileForm.firstName || profileForm.lastName) && (
                <h2>
                  {`${profileForm.firstName || ""} ${profileForm.lastName || ""}`.trim()}
                </h2>
              )}
              <div className="status-badges">
                {profileForm.isEmailVerified ? (
                  <span className="badge-green">الإيميل مفعل</span>
                ) : (
                  <button className="badge-red" onClick= {getEmailVerificationToken} disabled={editMode}>الإيميل غير مفعل</button>
                )}
                {profileForm.isPhoneVerified ? (
                  <span className="badge-green">رقم الهاتف مفعل</span>
                ) : (
                  <span className="badge-red">رقم الهاتف غير مفعل</span>
                )}
              </div>
              {profileForm.role === "admin" && (
                <p className="last-seen">آخر تواجد: {profileForm.lastActivity}</p>
              )}
            </div>
          </div>
          
          {profileForm.role === "client" && (
            <div className="quick-stats">
              <div className="stat">
                <span>الطلبات</span>
                <strong>{profileForm.totalOrders || 0}</strong>
              </div>
              <div className="stat">
                <span>إجمالي المشتريات</span>
                <strong>{profileForm.totalSpent || 0} EGP</strong>
              </div>
            </div>
          )}
        </section>

        {formMessage.message && (
          <div className={formMessage.success ? "success-message" : "error-message"}>
            {formMessage.message}
          </div>
        )}

        <div className="profile-content-grid">
          {/* Main Content - Form */}
          <main className="main-form-content">
            <form id="profile-form" onSubmit={handleEditProfile} ref={profileFormRef}>
              <section className="form-card">
                <h3>المعلومات الشخصية</h3>
                <div className="inputs-grid">
                  {((profileForm.firstName && !editMode) || editMode) && (
                    <div className="input-field">
                      <label>الاسم الاول</label>
                      <input
                        name="firstName"
                        value={profileForm.firstName || ""}
                        onChange={handleChangeInput}
                        readOnly={!editMode}
                      />
                    </div>
                  )}

                  {((profileForm.lastName && !editMode) || editMode) && (
                    <div className="input-field">
                      <label>اسم العائلة</label>
                      <input
                        name="lastName"
                        value={profileForm.lastName || ""}
                        onChange={handleChangeInput}
                        readOnly={!editMode}
                      />
                    </div>
                  )}

                  <div className="input-field">
                    <label>اسم المستخدم</label>
                    <input
                      name="username"
                      value={profileForm.username || ""}
                      onChange={handleChangeInput}
                      readOnly={!editMode}
                    />
                  </div>

                  <div className="input-field">
                    <label>البريد الإلكتروني</label>
                    <input
                      name="email"
                      value={profileForm.email || ""}
                      onChange={handleChangeInput}
                      readOnly={!editMode}
                    />
                  </div>

                  {((profileForm.phone && !editMode) || editMode) && (
                    <div className="input-field">
                      <label>رقم الهاتف</label>
                      <input
                        name="phone"
                        value={profileForm.phone || ""}
                        onChange={handleChangeInput}
                        readOnly={!editMode}
                      />
                    </div>
                  )}

                  {((profileForm.birthdate && !editMode) || editMode) && (
                    <div className="input-field">
                      <label>تاريخ الميلاد</label>
                      <input
                        name="birthdate"
                        type="date"
                        value={formatDateForInput(profileForm.birthdate)}
                        onChange={handleChangeInput}
                        readOnly={!editMode}
                      />
                    </div>
                  )}
                </div>

                {((profileForm.gender && !editMode) || editMode) && (
                  <div className="gender-toggle">
                    <p>الجنس</p>
                    <button
                      type="button"
                      className={profileForm.gender === "female" ? "active" : ""}
                      disabled={!editMode}
                      onClick={() => handleSelection("gender", "female")}
                    >
                      أنثى
                    </button>
                    <button
                      type="button"
                      className={profileForm.gender === "male" ? "active" : ""}
                      disabled={!editMode}
                      onClick={() => handleSelection("gender", "male")}
                    >
                      ذكر
                    </button>
                  </div>
                )}

                {((profileForm.address && Object.keys(profileForm.address).length > 0) || editMode) && (
                  <div className="address-fields">
                    <h3>العنوان</h3>
                    <div className="address-inputs">
                      <div className="input-field">
                        <label>المدينة</label>
                        <input
                          name="address.city"
                          value={profileForm.address?.city || ""}
                          onChange={handleChangeInput}
                          readOnly={!editMode}
                        />
                      </div>
                      <div className="input-field">
                        <label>المنطقة</label>
                        <input
                          name="address.district"
                          value={profileForm.address?.district || ""}
                          onChange={handleChangeInput}
                          readOnly={!editMode}
                        />
                      </div>
                      <div className="input-field">
                        <label>الشارع</label>
                        <input
                          name="address.street"
                          value={profileForm.address?.street || ""}
                          onChange={handleChangeInput}
                          readOnly={!editMode}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {profileForm.role === "client" && (
                <section className="form-card skincare-section">
                  <h3>ملف العناية بالبشرة</h3>
                  <div className="skin-types">
                    <p>نوع البشرة</p>
                    {["جافة", "دهنية", "مختلطة", "حساسة", "عادية"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={profileForm.skinType === type ? "chip active" : "chip"}
                        onClick={() => handleSelection("skinType", type)}
                        disabled={!editMode}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="skin-interests">
                    <p>الاهتمامات</p>
                    {["حب الشباب", "تجاعيد", "جفاف", "تصبغات", "هالات سوداء"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleSelection("skinConcerns", item)}
                        className={profileForm.skinConcerns?.includes(item) ? "chip active" : "chip"}
                        disabled={!editMode}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {profileForm.role === "store_owner" && (
                <section className="form-card">
                  <h3>بيانات المتجر</h3>
                  <div className="input-field">
                    <label>اسم المتجر</label>
                    <input
                      name="store_name"
                      value={profileForm.store_name || ""}
                      onChange={handleChangeInput}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="input-field">
                    <label>بريد المتجر</label>
                    <input
                      name="store_email"
                      value={profileForm.store_email || ""}
                      onChange={handleChangeInput}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="input-field">
                    <label>رقم هاتف المتجر</label>
                    <input
                      name="store_phone"
                      value={profileForm.store_phone || ""}
                      onChange={handleChangeInput}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="store_address">
                    <p>عنوان المتجر</p>
                    <div className="address-inputs">
                      <div className="input-field">
                        <label>المدينة</label>
                        <input
                          name="store_address.city"
                          value={profileForm.store_address?.city || ""}
                          onChange={handleChangeInput}
                          readOnly={!editMode}
                        />
                      </div>
                      <div className="input-field">
                        <label>المنطقة</label>
                        <input
                          name="store_address.district"
                          value={profileForm.store_address?.district || ""}
                          onChange={handleChangeInput}
                          readOnly={!editMode}
                        />
                      </div>
                      <div className="input-field">
                        <label>الشارع</label>
                        <input
                          name="store_address.street"
                          value={profileForm.store_address?.street || ""}
                          onChange={handleChangeInput}
                          readOnly={!editMode}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </form>
          </main>

          {/* Sidebar - Outside Form */}
          <aside className="sidebar-form-content">
            <section className="form-card">
              <h3>تفضيلات التنبيهات</h3>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="email"
                  checked={profileForm.notifications?.includes("email") || false}
                  onChange={handleChangeInput}
                  disabled={!editMode}
                />
                <span>البريد الإلكتروني</span>
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="push"
                  checked={profileForm.notifications?.includes("push") || false}
                  onChange={handleChangeInput}
                  disabled={!editMode}
                />
                <span>تنبيهات التطبيق</span>
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="sms"
                  checked={profileForm.notifications?.includes("sms") || false}
                  onChange={handleChangeInput}
                  disabled={!editMode}
                />
                <span>الرسائل النصية SMS</span>
              </label>
            </section>

            {/* Password Section */}
            <div className="form-card password-section">
              <h3>تغيير كلمة المرور</h3>
              {!editMode ? (
                <>
                  <div 
                    className="password-toggle"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                  >
                    <span>انقر لتغيير كلمة المرور</span>
                    <i className={`fas fa-chevron-${showPasswordForm ? 'up' : 'down'}`}></i>
                  </div>
                  {showPasswordForm && (
                    <div className="password-change-form">
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        placeholder="كلمة المرور الحالية"
                        onChange={handleChangeInput}
                      />
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        placeholder="كلمة المرور الجديدة"
                        onChange={handleChangeInput}
                      />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        placeholder="تأكيد كلمة المرور"
                        onChange={handleChangeInput}
                      />
                      <button 
                        type="button" 
                        onClick={handleChangePassword}
                        className="password-submit-btn"
                      >
                        تغيير كلمة المرور
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="password-disabled-message">
                  الرجاء إنهاء تعديل البيانات أولاً لتغيير كلمة المرور
                </p>
              )}
            </div>
          </aside>
        </div>

        {/* Buttons Container - Outside Form */}
        <div className="controllers">
          {editMode ? (
            <>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => {
                  if (profileFormRef.current) {
                    profileFormRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }
                }}
              >
                حفظ التغييرات
              </button>
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                إلغاء
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-primary" onClick={enterEditMode}>
                تعديل البيانات
              </button>
              <button type="button" className="btn-danger" onClick={handleDeleteProfile}>
                حذف الحساب
              </button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Profile;