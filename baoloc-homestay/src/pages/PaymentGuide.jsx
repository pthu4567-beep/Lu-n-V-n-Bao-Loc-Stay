import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './StaticPage.css';

const PaymentGuide = () => {
  return (
    <div className="static-page-wrapper">
      <Header />
      <div className="container static-page-content">
        <h1>Hướng dẫn thanh toán</h1>
        <div className="static-glass-panel">
          <h3>Các hình thức thanh toán được chấp nhận</h3>
          <p>Hệ thống BaoLoc Stay hiện đang hỗ trợ hình thức <strong style={{ color: '#0369a1', fontWeight: 'bold' }}>thanh toán qua quét mã VietQR</strong> để mang đến sự thuận tiện cho bạn:</p>
          
          <div style={{ marginTop: '10px' }}>
            <p>Khách hàng có thể mở ứng dụng Mobile Banking của mọi ngân hàng, chọn tính năng quét mã QR và quét trực tiếp mã VietQR hiển thị trên màn hình thanh toán. Giao dịch sẽ được ghi nhận ngay lập tức.</p>
          </div>

          <p style={{ marginTop: '30px', fontStyle: 'italic', color: '#666' }}>Lưu ý: Mọi giao dịch chuyển khoản thủ công cần ghi rõ nội dung chuyển khoản là mã đơn đặt phòng để hệ thống duyệt tự động.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentGuide;
