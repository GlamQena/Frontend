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
  deleteAvatar,
  editStoreLogo,
  deleteStoreLogo,
  getProfile,
} from "../../services/profileService";

import { useTheme } from "../../components/ThemeProvider";
import ChangePasswordForm from "./ChangePassword";

// Icons
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Venus,
  Mars,
  VenusAndMars,
  Building2,
  MapPinned,
  Store,
  Bell,
  Lock,
  Shield,
  Trash2,
  Edit,
  Save,
  X,
  Camera,
  Image,
} from "lucide-react";
import { getCurrentUser } from "../../services/users";

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Profile = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState(null);
  const [avatarImg, setAvatarImg] = useState(null);
  const [storeLogoImg, setStoreLogoImg] = useState(null);
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
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [isDeletingStoreLogo, setIsDeletingStoreLogo] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const api_url = process.env.EXPRESS_APP_API_URL || "https://glamqena-backend.vercel.app";
  
  const redirectTimeoutRef = useRef(null);
  
  const profileFormRef = useRef(null);

  // Centralized auth error handler
  const handleAuthError = (error) => {
    if (error.code === "AUTH_EXPIRED" || error.message?.includes("session")) {
      setFormMessage({ 
        success: false, 
        message: "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى" 
      });
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Clear any existing redirect timeout
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      
      redirectTimeoutRef.current = setTimeout(() => {
        navigate('/login');
      }, 4000);
      
      return true; // Auth error handled
    }
    return false; // Not an auth error
  };

  // Clean up redirect timeout on unmount
  useEffect(() => {
    window.scrollTo({top: 0, behavior: "smooth"});
    
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

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
            setFormMessage
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
          setFormMessage
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
  
  const handleVerificationSuccess = async () => {
    responseMessageSetter(true, "تم التحقق من البريد الإلكتروني بنجاح!", setFormMessage);
    getUserProfile();
    
    setTimeout(() => {
      window.location.reload();
    }, 4000);
  };

  const getUserProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      const data = await response.json();

      if (!response.ok) {
        responseMessageSetter(false, data.message || "فشل تحميل البيانات", setFormMessage);
        return;
      }

      let user;
      if(data.user && typeof data.user === "object"){
        user = data.user;
      }
      else{
        user = getCurrentUser();
      }
      setProfileForm({ ...user });
      localStorage.setItem("user", JSON.stringify(user));

    } catch (error) {
      if (!handleAuthError(error)) {
        responseMessageSetter(false, error.message || "حدث خطأ فى تحميل البيانات", setFormMessage);
      }
    } finally {
      setLoading(false);
      window.scrollTo({top: 0, behavior: "smooth"});
    }
  };

  useEffect(() => {
    getUserProfile();
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel('email_verification_channel');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'EMAIL_VERIFIED') {
        console.log('📧 Email verified in another tab!');
        handleVerificationSuccess();
      }
    };
    
    const checkLocalStorage = () => {
      const verified = localStorage.getItem('emailVerified');
      const timestamp = localStorage.getItem('verificationTimestamp');
      
      if (verified === 'true' && timestamp) {
        const time = parseInt(timestamp);
        if (Date.now() - time < 5 * 60 * 1000) {
          localStorage.removeItem('emailVerified');
          localStorage.removeItem('verificationTimestamp');
          handleVerificationSuccess();
        }
      }
    };
    
    checkLocalStorage();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkLocalStorage();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      channel.close();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

  const handleVerifyEmail = async () => {
    if (isVerifyingEmail) return;
    
    setIsVerifyingEmail(true);
    try {
      const response = await getEmailToken(profileForm.email);
      const data = await response.json();

      if (!response.ok) {
        return responseMessageSetter(false, data.message || "فشل الحصول على رابط التحقق", setFormMessage);
      }

      responseMessageSetter(true, data.message || "تم إرسال رابط التحقق إلى بريدك الإلكتروني", setFormMessage);
    } catch (error) {
      if (!handleAuthError(error)) {
        responseMessageSetter(false, error.message || "خطأ في الاتصال بالسيرفر", setFormMessage);
      }
    } finally {
      setIsVerifyingEmail(false);
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
        if (name === "storeLogo") {
          setStoreLogoImg(file);
          const previewUrl = URL.createObjectURL(file);
          setProfileForm((prev) => ({ ...prev, storeLogoPreview: previewUrl }));
        } else {
          setAvatarImg(file);
          const previewUrl = URL.createObjectURL(file);
          setProfileForm((prev) => ({ ...prev, imagePreview: previewUrl }));
        }
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

  const handleDeleteAvatar = async () => {
    if (!window.confirm("هل أنت متأكد من حذف الصورة الشخصية؟")) {
      return;
    }

    setIsDeletingAvatar(true);
    try {
      const response = await deleteAvatar();
      const data = await response.json();

      if (response.ok) {
        setProfileForm((prev) => ({
          ...prev,
          avatar: null,
          avatar_hash: null,
          imagePreview: null
        }));
        const updatedUser = { ...profileForm, avatar: null, avatar_hash: null };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setAvatarImg(null);
        responseMessageSetter(true, "تم حذف الصورة الشخصية بنجاح", setFormMessage);
      } else {
        responseMessageSetter(false, data.message || "فشل حذف الصورة الشخصية", setFormMessage);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        responseMessageSetter(false, error.message || "حدث خطأ أثناء حذف الصورة", setFormMessage);
      }
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleDeleteStoreLogo = async () => {
    if (!window.confirm("هل أنت متأكد من حذف شعار المتجر؟")) {
      return;
    }

    setIsDeletingStoreLogo(true);
    try {
      const response = await deleteStoreLogo();
      const data = await response.json();

      if (response.ok) {
        setProfileForm((prev) => ({
          ...prev,
          logo: null,
          logo_hash: null,
          storeLogoPreview: null
        }));
        const updatedUser = { ...profileForm, logo: null, logo_hash: null };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setStoreLogoImg(null);
        responseMessageSetter(true, "تم حذف شعار المتجر بنجاح", setFormMessage);
      } else {
        responseMessageSetter(false, data.message || "فشل حذف شعار المتجر", setFormMessage);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        responseMessageSetter(false, error.message || "حدث خطأ أثناء حذف الشعار", setFormMessage);
      }
    } finally {
      setIsDeletingStoreLogo(false);
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
      if(isSubmitting) return;
      setIsSubmitting(true);

      const reqBody = JSON.stringify({
        email: profileForm.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmPassword,
      });

      const response = await changePassword(reqBody);
      const data = await response.json();
      
      if (!response.ok) {
        responseMessageSetter(false, data.message || "فشل تغيير كلمة المرور", setFormMessage);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      responseMessageSetter(true, "تم تغيير كلمة المرور بنجاح، سيتم تسجيل الخروج...", setFormMessage);
      
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);

      localStorage.clear();
      
      setTimeout(() => {
        window.location.href = "/login";
      }, 4000);
      
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error(`error occured while changing password : ${JSON.stringify(error)}`);
        responseMessageSetter(false, error.message || "حدث خطأ فى تغيير كلمة المرور", setFormMessage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally{
      setIsSubmitting(false);
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    
    if (!editMode) return;

    setFormMessage({ success: false, message: "" });

    // Upload avatar if changed
    if (avatarImg && avatarImg instanceof File) {
      const imageFormData = new FormData();
      imageFormData.append("image", avatarImg);

      try {
        const response = await editAvatar(imageFormData);
        const avatarResData = await response.json();
        
        if (!response.ok) {
          console.log("Avatar upload failed:", avatarResData);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return responseMessageSetter(false, avatarResData.message || "فشل رفع الصورة", setFormMessage);
        }
        
        if (avatarResData.user) {
          localStorage.setItem("user", JSON.stringify(avatarResData.user));
          setProfileForm((prev) => ({ ...prev, avatar: avatarResData.user.avatar }));
        }
      } catch (error) {
        if (handleAuthError(error)) return;
        responseMessageSetter(false, error.message || "حدث خطأ ما فى تعديل صورة الأفاتر", setFormMessage);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (storeLogoImg && storeLogoImg instanceof File) {
      const logoFormData = new FormData();
      logoFormData.append("logo", storeLogoImg);

      try {
        const response = await editStoreLogo(logoFormData);
        const logoResData = await response.json();
        
        if (!response.ok) {
          console.log("Store logo upload failed:", logoResData);
          return responseMessageSetter(false, logoResData.message || "فشل رفع الشعار", setFormMessage);
        }
        
        if (logoResData.user) {
          localStorage.setItem("user", JSON.stringify(logoResData.user));
          setProfileForm((prev) => ({ ...prev, logo: logoResData.user.logo }));
        }
      } catch (error) {
        if (handleAuthError(error)) return;
        responseMessageSetter(false, error.message || "حدث خطأ ما فى تعديل لوجو المتجر", setFormMessage);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    const { imagePreview, storeLogoPreview, ...updateData } = profileForm;

    try {
      const res = await editProfile(updateData);
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setProfileForm(data.user);
        setEditMode(false);
        setAvatarImg(null);
        setStoreLogoImg(null);
        responseMessageSetter(true, "تم تحديث الملف الشخصي بنجاح", setFormMessage);
      } else {
        console.log("edit profile failed:", data);
        responseMessageSetter(false, data.message || "فشل تعديل بيانات البروفايل", setFormMessage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        console.log("edit profile failed:", JSON.stringify(error));
        responseMessageSetter(false, error.message || "خطأ في الاتصال بالسيرفر", setFormMessage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleDeleteProfile = async () => {
    if (window.confirm("هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه")) {
      try {
        const res = await deleteProfile();
        const data = await res.json();

        if (res.ok) {
          // responseMessageSetter(true, data.message || "تم حذف الحساب بنجاح", setFormMessage);
          await logout();
          setTimeout(() => {
            navigate("/");
          }, 3000);
        } else {
          console.log("delete profile failed:", data);
          responseMessageSetter(false, data.message || "فشل حذف الحساب", setFormMessage);
          window.scrollTo({top: 0, behavior: "smooth"});
        }
      } catch (error) {
        if (!handleAuthError(error)) {
          console.log("delete profile failed:", JSON.stringify(error));
          responseMessageSetter(false, error.message || "خطأ في الاتصال بالسيرفر", setFormMessage);
          window.scrollTo({top: 0, behavior: "smooth"});
        }
      }
    }
  };

  const cancelEdit = () => {
    getUserProfile();
    setEditMode(false);
    setAvatarImg(null);
    setStoreLogoImg(null);
    setFormMessage({ success: false, message: "" });
    window.scrollTo({top: 0, behavior: "smooth"});
  };

  const enterEditMode = () => {
    setEditMode(true);
    setShowPasswordForm(false);
    window.scrollTo({top: 0, behavior: "smooth"});
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split('T')[0];
  };

  const getAvatarSrc = () => {
    if (profileForm?.imagePreview) {
      return profileForm.imagePreview;
    }
    if (profileForm?.avatar) {
      if (profileForm.avatar.includes("uploads"))
        return encodeURI(
          profileForm.avatar
            .replace(/\\/g, "//")
            .replace("uploads", api_url)
        );
      else return profileForm.avatar;
    }
    return null;
  };

  const getStoreLogoSrc = () => {
    if (profileForm?.storeLogoPreview) {
      return profileForm.storeLogoPreview;
    }
    if (profileForm?.logo) {
      if(profileForm.logo.includes("uploads"))
        return encodeURI(
          profileForm.logo
            .replace(/\\/g, "//")
            .replace("uploads", api_url)
        );
      else return profileForm.logo;
    }
    return null;
  };

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
                {getAvatarSrc() ? (
                  <img
                    src={getAvatarSrc()}
                    alt="الصورة الشخصية"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <svg 
                    className="profile-avatar-icon"
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="12" r="12" className="avatar-bg-token" />
                    <path 
                      d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" 
                      className="avatar-fg-token"
                    />
                    <path 
                      d="M6 18.5C6 15.4624 8.68629 13 12 13C15.3137 13 18 15.4624 18 18.5" 
                      className="avatar-fg-token"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>

              {editMode && (
                <label className="avatar-upload-label">
                  <Camera size={12} />
                  <span>{getAvatarSrc() ? 'تغيير' : 'إضافة'}</span>
                  <input
                    type="file"
                    name="avatar"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/jpg"
                    className="avatar-input-hidden"
                    onChange={handleChangeInput}
                  />
                </label>
              )}

              {profileForm.avatar && (
                <button 
                  type="button"
                  className="avatar-delete-btn"
                  onClick={handleDeleteAvatar}
                  disabled={isDeletingAvatar}
                  title="حذف الصورة الشخصية"
                >
                  {isDeletingAvatar ? (
                    <span className="spinner-small" />
                  ) : (
                    <CloseIcon />
                  )}
                </button>
              )}
            </div>
            ) : (
              <div className="profile-avatar">
                {getAvatarSrc() ? (
                  <img
                    src={getAvatarSrc()}
                    alt="الصورة الشخصية"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <svg 
                    className="profile-avatar-icon"
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="12" r="12" className="avatar-bg-token" />
                    <path 
                      d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" 
                      className="avatar-fg-token"
                    />
                    <path 
                      d="M6 18.5C6 15.4624 8.68629 13 12 13C15.3137 13 18 15.4624 18 18.5" 
                      className="avatar-fg-token"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
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
                  <button 
                    className="badge-red clickable"
                    onClick={handleVerifyEmail}
                    disabled={isVerifyingEmail || editMode}
                  >
                    {isVerifyingEmail ? (
                      <span className="spinner-small" />
                    ) : (
                      "الإيميل غير مفعل - اضغط للتحقق"
                    )}
                  </button>
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
                      <Venus size={16} /> أنثى
                    </button>
                    <button
                      type="button"
                      className={profileForm.gender === "male" ? "active" : ""}
                      disabled={!editMode}
                      onClick={() => handleSelection("gender", "male")}
                    >
                      <Mars size={16} /> ذكر
                    </button>
                  </div>
                )}

                {((profileForm.address && Object.keys(profileForm.address).length > 0) || editMode) && (
                  <div className="address-fields">
                    <h3 className="address-heading">العنوان</h3>
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
                  
                  {/* Store Logo Section - Enhanced */}
                  <div className="store-logo-section">
                    <div className="store-logo-container">
                      {getStoreLogoSrc() ? (
                        <div className="store-logo-wrapper">
                          <img 
                            src={getStoreLogoSrc()} 
                            alt="شعار المتجر" 
                            className="store-logo-image" 
                          />
                          {editMode && (
                            <button 
                              type="button"
                              className="store-logo-delete-btn"
                              onClick={handleDeleteStoreLogo}
                              disabled={isDeletingStoreLogo}
                              title="حذف شعار المتجر"
                            >
                              {isDeletingStoreLogo ? (
                                <span className="spinner-small" />
                              ) : (
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="store-logo-placeholder">
                          <Image size={32} />
                          <span>شعار المتجر</span>
                        </div>
                      )}
                      
                      {editMode && (
                        <label className="store-logo-upload-label">
                          <Camera size={14} />
                          <span>{getStoreLogoSrc() ? 'تغيير الشعار' : 'إضافة شعار'}</span>
                          <input
                            type="file"
                            name="storeLogo"
                            accept="image/jpeg,image/png,image/webp,image/avif,image/jpg"
                            className="store-logo-input-hidden"
                            onChange={handleChangeInput}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="input-field">
                    <label><Store size={16} /> اسم المتجر</label>
                    <input
                      name="store_name"
                      value={profileForm.store_name || ""}
                      onChange={handleChangeInput}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="input-field">
                    <label><Mail size={16} /> بريد المتجر</label>
                    <input
                      name="store_email"
                      value={profileForm.store_email || ""}
                      onChange={handleChangeInput}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="input-field">
                    <label><Phone size={16} /> رقم هاتف المتجر</label>
                    <input
                      name="store_phone"
                      value={profileForm.store_phone || ""}
                      onChange={handleChangeInput}
                      readOnly={!editMode}
                    />
                  </div>
                  <div className="store_address">
                    <h3 className="address-heading">عنوان المتجر</h3>
                    <div className="address-inputs">
                      <div className="input-field">
                        <label><Building2 size={16} /> المدينة</label>
                        <input
                          name="store_address.city"
                          value={profileForm.store_address?.city || ""}
                          onChange={handleChangeInput}
                          readOnly={!editMode}
                        />
                      </div>
                      <div className="input-field">
                        <label><MapPinned size={16} /> المنطقة</label>
                        <input
                          name="store_address.district"
                          value={profileForm.store_address?.district || ""}
                          onChange={handleChangeInput}
                          readOnly={!editMode}
                        />
                      </div>
                      <div className="input-field">
                        <label><MapPin size={16} /> الشارع</label>
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
                  {showPasswordForm && 
                   <ChangePasswordForm 
                      passwordForm={passwordForm} 
                      setPasswordForm={setPasswordForm}
                      handleChangePassword={handleChangePassword}
                      isSubmitting={isSubmitting}
                    />
                  }
                </>
              ) : (
                <p className="password-disabled-message">
                  الرجاء إنهاء تعديل البيانات أولاً لتغيير كلمة المرور
                </p>
              )}
            </div>

            {/* Action Buttons - Moved to Sidebar */}
            <div className="form-card sidebar-actions">
              <h3>إدارة الحساب</h3>
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
                    <Save size={16} /> حفظ التغييرات
                  </button>
                  <button type="button" className="btn-secondary" onClick={cancelEdit}>
                    <X size={16} /> إلغاء
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn-primary" onClick={enterEditMode}>
                    <Edit size={16} /> تعديل البيانات
                  </button>
                  <button type="button" className="btn-danger" onClick={handleDeleteProfile}>
                    <Trash2 size={16} /> حذف الحساب
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default Profile;