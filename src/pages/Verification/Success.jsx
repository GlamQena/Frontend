import { CheckCircle, Store, User } from "lucide-react";
import "./Success.css";

function Verified({ userRole, isRedirecting }) {
    const getContent = () => {
        if (isRedirecting) {
            return {
                title: "!تم التحقق بنجاح",
                subtitle: "تم تفعيل بريدك الإلكتروني بنجاح",
                description: userRole === "store_owner" 
                    ? "سيتم مراجعة حساب المتجر الخاص بك من قبل الإدارة. سيتم إشعارك عند الموافقة على حسابك خلال 24-48 ساعة."
                    : "يمكنك الآن الدخول والاستمتاع بتجربة التسوق.",
                showCloseMessage: true,
            };
        }

        if (userRole === "store_owner") {
            return {
                title: "!تم التحقق من بريد المتجر",
                subtitle: "تم تفعيل بريدك الإلكتروني بنجاح",
                description: "سيتم مراجعة حساب المتجر الخاص بك من قبل الإدارة. سيتم إشعارك عند الموافقة على حسابك خلال 24-48 ساعة.",
                showCloseMessage: true,
            };
        } else {
            return {
                title: "!تم التحقق بنجاح",
                subtitle: "تم تفعيل بريدك الإلكتروني",
                description: "يمكنك الآن الدخول والاستمتاع بتجربة التسوق.",
                showCloseMessage: true,
            };
        }
    };

    const content = getContent();

    return (
        <div className="verified-container">
            <div className="verified-content">
                <div className="icon-wrapper">
                    <CheckCircle size={48} color="#22C55E" />
                </div>
                
                <h1 className="verified-title">{content.title}</h1>
                
                <p className="verified-subtitle">{content.subtitle}</p>
                
                <div className="verified-description">
                    <p>{content.description}</p>
                </div>
                
                {content.showCloseMessage && (
                    <p className="verified-close-message">
                        يمكنك إغلاق هذه النافذة الآن
                    </p>
                )}
            </div>
        </div>
    );
}

export default Verified;