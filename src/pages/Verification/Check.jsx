import React, {useState, useEffect, useRef} from 'react';
import {useNavigate} from "react-router-dom";
import './Check.css';
import Verified from './Success';
import { verifyEmail } from '../../services/authService';

const VerificationCheck = () => {
    const navigate = useNavigate();
    const [checkMessage, setCheckMessage] = useState({success: false, message: ""});
    const [isVerified, setIsVerified] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isInvalid, setIsInvalid] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [isFailedResend, setIsFailedResend] = useState(false);
    const [email, setEmail] = useState(null);
    const timerRef = useRef(null);
    const redirectCompleted = useRef(false);

    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get("email");
    const token = urlParams.get("token");
    const role = urlParams.get("role");

    console.log("email-> ", emailParam);
    console.log("token-> ", token);
    console.log("role-> ", role);

    useEffect(() => {
        if (!emailParam || !token) {
            setIsLoading(false);
            setIsInvalid(true);
            return setCheckMessage({success: false, message: "البريد الإلكتروني والرمز مطلوبان"});
        }

        setEmail(emailParam);
        setUserRole(role);
        verifyEmailHandler();

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [emailParam, token, role]);

    const verifyEmailHandler = async () => {
        setIsLoading(true);
        setIsInvalid(false);
        setIsExpired(false);
        setIsAlreadyVerified(false);
        setIsFailedResend(false);
        setCheckMessage({success: false, message: ""});

        try {
            const response = await verifyEmail(emailParam, token);
            const data = await response.json();
            
            if (!response.ok) {
                setIsLoading(false);
                
                const errorMessage = data.message || "";
                const errors = data.errors || {};
                
                if (errorMessage.includes("already verified") || 
                    errors.email?.some(msg => msg.includes("already verified"))) {
                    setIsAlreadyVerified(true);
                } else if (errorMessage.includes("invalid") || 
                          errorMessage.includes("Token does not match email") ||
                          errorMessage.includes("Invalid token")) {
                    setIsInvalid(true);
                } else if (errorMessage.includes("expired") || 
                        errorMessage.includes("Invalid or expired token") ||
                        errorMessage.includes("expired token")) {
                    setIsExpired(true);
                } else {
                    setIsInvalid(true);
                }
                
                return setCheckMessage({success: false, message: errorMessage});
            }

            setCheckMessage({success: true, message: data.message || "تم التحقق من البريد الإلكتروني بنجاح!"});
            setIsVerified(true);
            setUserRole(role);
            setIsLoading(false);

            // Store verification flag in localStorage for the original tab to detect
            localStorage.setItem('emailVerified', 'true');
            localStorage.setItem('verificationTimestamp', Date.now().toString());
            localStorage.setItem('verifiedEmail', emailParam);

            // Also send via BroadcastChannel as backup
            try {
                const channel = new BroadcastChannel('email_verification_channel');
                channel.postMessage({ 
                    type: 'EMAIL_VERIFIED',
                    email: emailParam,
                    timestamp: Date.now()
                });
                setTimeout(() => channel.close(), 1000);
            } catch (channelError) {
                console.error('BroadcastChannel error:', channelError);
            }

            setIsRedirecting(true);
            
            setTimeout(() => {
                try {
                    window.close();
                    
                    // If window.close() doesn't work (some browsers block it),
                    // navigate to a blank page and then close
                    if (!window.closed) {
                        window.location.href = 'about:blank';
                        window.close();
                    }
                } catch (e) {
                    console.log('Cannot close tab, redirecting to login');
                    navigate('/login', { 
                        state: { 
                            message: "تم التحقق من بريدك الإلكتروني بنجاح. يرجى تسجيل الدخول للمتابعة."
                        } 
                    });
                }
            }, 4000);

        } catch (error) {
            setIsLoading(false);
            setIsInvalid(true);
            setCheckMessage({success: false, message: error.message || "حدث خطأ غير متوقع"});
        }
    }

    const resendToken = async () => {
        if (isResending) return;
        
        setIsResending(true);
        setIsFailedResend(false);
        
        try {
            const response = await fetch("http://127.0.0.1:8080/auth/email/send-token", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email: emailParam})
            });
            const data = await response.json();

            if (!response.ok) {
                setIsResending(false);
                setIsFailedResend(true);
                return setCheckMessage({success: false, message: data.message || "فشل إعادة الإرسال"});
            }

            setCheckMessage({success: true, message: data.message || "تم إعادة إرسال رابط التحقق"});
            setIsResending(false);
            
            setTimeout(() => {
                setIsExpired(false);
                setIsInvalid(false);
                verifyEmailHandler();
            }, 2000);

        } catch (error) {
            setIsResending(false);
            setIsFailedResend(true);
            setCheckMessage({success: false, message: error.message || "حدث خطأ أثناء إعادة الإرسال"});
        }
    }

    const handleLoginRedirect = () => {
        // Close the tab and let the user login from the original tab
        try {
            window.close();
            if (!window.closed) {
                window.location.href = 'about:blank';
                window.close();
            }
        } catch (e) {
            navigate('/login');
        }
    };

    useEffect(() => {
        if (checkMessage.message) {
            const msgTimer = setTimeout(() => {
                setCheckMessage({success: false, message: ""});
            }, 5000);
            return () => clearTimeout(msgTimer);
        }
    }, [checkMessage.message]);

    // If verification is successful, show the Verified component
    if (isVerified) {
        return <Verified 
            userRole={userRole} 
            isRedirecting={isRedirecting} 
            isLoginRedirect={true}
        />;
    }

    const getContent = () => {
        if (isLoading) {
            return {
                icon: "hourglass",
                title: "جاري التحقق من بريدك...",
                subtitle: "يرجى الانتظار أثناء التحقق من بريدك الإلكتروني. قد يستغرق ذلك بضع ثوانٍ...",
                showResendButton: false,
                showRetryButton: false,
                showDashboardButton: false,
                showLoginButton: false,
                showActionLinks: false
            };
        } else if (isInvalid) {
            return {
                icon: "error",
                title: "رابط تحقق غير صالح",
                subtitle: "رابط التحقق غير صالح. يرجى التحقق من بريدك الإلكتروني أو إعادة الإرسال للحصول على الرابط الصحيح.",
                showResendButton: true,
                showRetryButton: false,
                showDashboardButton: false,
                showLoginButton: false,
                showActionLinks: false
            };
        } else if (isExpired) {
            return {
                icon: "timer",
                title: "انتهت صلاحية رابط التحقق",
                subtitle: "انتهت صلاحية رابط التحقق. يرجى طلب رابط تحقق جديد.",
                showResendButton: true,
                showRetryButton: false,
                showDashboardButton: false,
                showLoginButton: false,
                showActionLinks: false
            };
        } else if (isAlreadyVerified) {
            return {
                icon: "verified",
                title: "البريد الإلكتروني مفعل بالفعل",
                subtitle: "تم تفعيل بريدك الإلكتروني بالفعل. يمكنك إغلاق هذه النافذة والعودة إلى التطبيق.",
                showResendButton: false,
                showRetryButton: false,
                showDashboardButton: false,
                showLoginButton: true,
                showActionLinks: false
            };
        } else if (isFailedResend) {
            return {
                icon: "error",
                title: "فشل إعادة الإرسال",
                subtitle: "تعذر إرسال رابط التحقق. يرجى التحقق من اتصالك والمحاولة مرة أخرى.",
                showResendButton: true,
                showRetryButton: false,
                showDashboardButton: false,
                showLoginButton: false,
                showActionLinks: false
            };
        } else {
            return {
                icon: "error",
                title: "حدث خطأ",
                subtitle: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
                showResendButton: true,
                showRetryButton: true,
                showDashboardButton: false,
                showLoginButton: false,
                showActionLinks: false
            };
        }
    };

    const content = getContent();

    return (
        <div className="verification-container" dir="rtl">
            <div className="verification-card">
                <div className="verification-icon">
                    <div className={`icon-circle ${isLoading ? 'loading' : ''}`}>
                        {isLoading ? (
                            <div className="spinner"></div>
                        ) : content.icon === "hourglass" ? (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2V6M12 18V22M4 4L8 8M16 16L20 20M4 20L8 16M16 8L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 8C10 8 8 10 8 12C8 14 10 16 12 16C14 16 16 14 16 12C16 10 14 8 12 8Z" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                        ) : content.icon === "error" ? (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        ) : content.icon === "timer" ? (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        ) : content.icon === "verified" ? (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokelinejoin="round"/>
                            </svg>
                        ) : (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        )}
                    </div>
                </div>
                
                <h1 className="verification-title">{content.title}</h1>
                
                <p className="verification-text">{content.subtitle}</p>
                
                {checkMessage.message && (
                    <p className={checkMessage.success ? "success-message" : "error-message"}>
                        {checkMessage.message}
                    </p>
                )}

                {content.showLoginButton && (
                    <button 
                        className="verification-button primary"
                        onClick={handleLoginRedirect}
                    >
                        إغلاق النافذة والعودة للتطبيق
                    </button>
                )}

                {content.showResendButton && (
                    <button 
                        className="verification-button primary"
                        onClick={resendToken}
                        disabled={isResending}
                    >
                        {isResending ? "جاري الإرسال..." : "إعادة إرسال رابط التحقق"}
                    </button>
                )}

                {content.showRetryButton && (
                    <button 
                        className="verification-button secondary"
                        onClick={verifyEmailHandler}
                    >
                        إعادة المحاولة
                    </button>
                )}

                {!content.showResendButton && 
                 !content.showRetryButton && 
                 !content.showDashboardButton && 
                 !content.showLoginButton &&
                 !isLoading && (
                    <>
                        <div className="verification-action">
                            <span className="action-text">لم يتم التوجيه؟</span>
                            <a href="#" className="retry-link" onClick={verifyEmailHandler}>إعادة المحاولة</a>
                        </div>
                        
                        <div className="resend-section">
                            <span className="resend-label">لم يصلك البريد الإلكتروني؟</span>
                            <a href="#" className="resend-link" onClick={resendToken}>إعادة الإرسال</a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerificationCheck;