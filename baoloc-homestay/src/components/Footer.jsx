import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo">
              <img src="/logo.png" alt="BaoLoc Stay Logo" className="footer-logo-img" />
            </div>
            <p className="company-desc">Hệ thống đặt phòng homestay uy tín hàng đầu tại Bảo Lộc. Mang đến những trải nghiệm lưu trú tuyệt vời nhất.</p>
            <div className="contact-info">
              <p>📍 18 Ngô Tất Tố,Phường 3 Bảo Lộc, Lâm Đồng</p>
              <p>📞 Hotline: 0909 123 456</p>
              <p>✉️ Email: hello@baolocstay.vn</p>
            </div>
          </div>

          <div className="footer-col">
            <h3>Hỗ trợ khách hàng</h3>
            <ul className="footer-links">
              <li><Link to="/help-center">Trung tâm trợ giúp</Link></li>
              <li><Link to="/privacy-policy">Chính sách bảo mật</Link></li>
              <li><Link to="/cancellation-policy">Quy định hủy phòng</Link></li>
              <li><Link to="/payment-guide">Hướng dẫn thanh toán</Link></li>
              <li><Link to="/faq">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Hình thức thanh toán</h3>
            <div className="payment-logos">
              <div className="payment-logo">VietQR</div>
            </div>
            <h3 className="mt-4">Kết nối với chúng tôi</h3>
            <div className="social-links">
              <a href="#" className="social-icon">FB</a>
              <a href="#" className="social-icon">IG</a>
              <a href="#" className="social-icon">TT</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>Copyright &copy; 2026 Website Lưu trú Bảo Lộc. Thiết kế bởi Anh Thư.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
