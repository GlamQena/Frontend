import "./Footer.css";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand Section */}
        <div className="footer-brand" id="about">
          <div className="footer-logo">
            <span className="footer-logo-glam">Glam</span>
            <span className="footer-logo-qena">Qena</span>
            <div className="footer-logo-circle"></div>
            <span className="footer-logo-ar">قنا</span>
          </div>
          <p className="footer-desc">
            أول منصة تجميل متخصصة في محافظة قنا. تقدم لك أفضل منتجات التجميل من محلات قنا مع توصيل سريع وآمن.
          </p>
          <div className="footer-social">
            <a href="#" className="social-link" aria-label="Facebook">
              <FaFacebook />
            </a>
            <a href="#" className="social-link" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="#" className="social-link" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="#" className="social-link" aria-label="YouTube">
              <FaYoutube />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-links">
          <h4>روابط سريعة</h4>
          <ul>
            <li><a href="/stores">المتاجر</a></li>
            <li><a href="/about">من نحن</a></li>
            <li><a href="/contact">اتصل بنا</a></li>
            <li><a href="/faq">الأسئلة الشائعة</a></li>
            <li><a href="/privacy">سياسة الخصوصية</a></li>
          </ul>
        </div>

        {/* Contact Section */}
        <div className="footer-contact" id="contact">
          <h4>تواصل معنا</h4>
          <div className="footer-contact-item">
            <FaPhone className="footer-icon" />
            <span>010 1234 5678</span>
          </div>
          <div className="footer-contact-item">
            <FaEnvelope className="footer-icon" />
            <span>info@glamqena.com</span>
          </div>
          <div className="footer-contact-item">
            <FaMapMarkerAlt className="footer-icon" />
            <span>قنا - شارع النيل</span>
          </div>
          <div className="footer-contact-item footer-hours">
            <FaClock className="footer-icon" />
            <span>السبت - الجمعة · 10:30 ص - 10:30 م</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} GlamQena. جميع الحقوق محفوظة</p>
        <div className="footer-bottom-links">
          <a href="/terms">الشروط والأحكام</a>
          <span className="separator">|</span>
          <a href="/privacy">سياسة الخصوصية</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;