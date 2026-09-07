import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./Profile.css";

const ChangePasswordForm = ({ 
    passwordForm, 
    setPasswordForm, 
    handleChangePassword,
    isSubmitting 
}) => {
    // State for password visibility
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };

    // Toggle password visibility
    const togglePasswordVisibility = (field) => {
        switch(field) {
            case 'current':
                setShowCurrentPassword(prev => !prev);
                break;
            case 'new':
                setShowNewPassword(prev => !prev);
                break;
            case 'confirm':
                setShowConfirmPassword(prev => !prev);
                break;
            default:
                break;
        }
    };

    return (
        <div className="password-change-form">
            {/* Current Password Field */}
            <div className="password-input-wrapper">
                <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="كلمة المرور الحالية"
                    name="currentPassword"
                    value={passwordForm.currentPassword || ""}
                    onChange={handleInputChange}
                    className="password-input"
                    disabled={isSubmitting}
                />
                <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => togglePasswordVisibility('current')}
                    tabIndex="-1"
                    aria-label={showCurrentPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                    {showCurrentPassword ? (
                        <EyeOff size={20} className="eye-icon" />
                    ) : (
                        <Eye size={20} className="eye-icon" />
                    )}
                </button>
            </div>

            {/* New Password Field */}
            <div className="password-input-wrapper">
                <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="كلمة المرور الجديدة"
                    name="newPassword"
                    value={passwordForm.newPassword || ""}
                    onChange={handleInputChange}
                    className="password-input"
                    disabled={isSubmitting}
                />
                <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => togglePasswordVisibility('new')}
                    tabIndex="-1"
                    aria-label={showNewPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                    {showNewPassword ? (
                        <EyeOff size={20} className="eye-icon" />
                    ) : (
                        <Eye size={20} className="eye-icon" />
                    )}
                </button>
            </div>

            {/* Confirm Password Field */}
            <div className="password-input-wrapper">
                <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="تأكيد كلمة المرور"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword || ""}
                    onChange={handleInputChange}
                    className="password-input"
                    disabled={isSubmitting}
                />
                <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => togglePasswordVisibility('confirm')}
                    tabIndex="-1"
                    aria-label={showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                    {showConfirmPassword ? (
                        <EyeOff size={20} className="eye-icon" />
                    ) : (
                        <Eye size={20} className="eye-icon" />
                    )}
                </button>
            </div>

            <button
                type="button"
                className="password-submit-btn"
                onClick={handleChangePassword}
                disabled={isSubmitting}
            >
                {isSubmitting ? "جاري التغيير..." : "تغيير كلمة المرور"}
            </button>
        </div>
    );
};

export default ChangePasswordForm;