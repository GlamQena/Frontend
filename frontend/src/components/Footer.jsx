import "./Footer.css";

function Footer () {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-brand" id="about">
                    <div className="footer-logo">
                        <span className="footer-logo-glam">Glam</span>
                        <span className="footer-logo-qena">Qena</span>
                        <div className="footer-logo-circle"></div>
                        <span className="footer-logo-qena" style={{ fontFamily: "'Tajawal', sans-serif" }}>قنا</span>
                    </div>
                    <div className="footer-qena">قنا</div>
                    <p className="footer-desc">
                        أول منصة تجميل متخصصة في محافظة قنا. تقدم لك أفضل منتجات التجميل من محلات قنا مع توصيل سريع وأمن.
                    </p>
                </div>

                <div className="footer-contact" id="contact">
                    <h4>تواصل معنا</h4>
                    <div className="footer-contact-item">
                        <i className="fas fa-phone"></i>
                        <span>010 1234 5678</span>
                    </div>
                    <div className="footer-contact-item">
                        <i className="fas fa-envelope"></i>
                        <span>info@glamqena.com</span>
                    </div>
                    <div className="footer-contact-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>قنا - شارع النيل</span>
                    </div>
                    <div className="footer-contact-item footer-hours">
                        <i className="fas fa-clock"></i>
                        <span>السبت - الجمعة · 10:30 ص - 10:30 م</span>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>© 2024 Qena Glam. جميع الحقوق محفوظة</p>
            </div>
        </footer>
    )
}

export default Footer;