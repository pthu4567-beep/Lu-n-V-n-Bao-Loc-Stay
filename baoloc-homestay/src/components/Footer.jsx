import React from 'react';
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
              <li><a href="#">Trung tâm trợ giúp</a></li>
              <li><a href="#">Chính sách bảo mật</a></li>
              <li><a href="#">Quy định hủy phòng</a></li>
              <li><a href="#">Hướng dẫn thanh toán</a></li>
              <li><a href="#">Câu hỏi thường gặp</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Hình thức thanh toán</h3>
            <div className="payment-logos">
              <div className="payment-logo">VietQR</div>
              <div className="payment-logo">VNPay</div>
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
