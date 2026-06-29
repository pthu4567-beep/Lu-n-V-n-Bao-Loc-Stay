import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Copy, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { showAlert } from '../utils/alert';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();
  const [searchParams] = useSearchParams();
  
  const amount = parseInt(searchParams.get('amount')) || 0;
  const hotelName = searchParams.get('hotel') || 'Homestay';
  const roomName = searchParams.get('room') || 'Phòng Tiêu Chuẩn';

  const [copied, setCopied] = useState('');
  const [discount, setDiscount] = useState('');

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const transferMsg = `THANH TOAN DH ${bookingId}`;
  const qrUrl = `https://img.vietqr.io/image/vcb-10123456789-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferMsg)}&accountName=CHU%20HOMESTAY%20BAO%20LOC%20STAY`;

  const handleFinish = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        await showAlert('Hết phiên đăng nhập', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!', 'warning');
        navigate('/auth');
        return;
      }
      
      // Gọi API báo đã thanh toán lên Backend
      const res = await axios.post(`http://localhost:5000/api/bookings/${bookingId}/notify-paid`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        await showAlert('Thành công', 'Đã gửi yêu cầu xác nhận thanh toán. Đơn hàng sẽ được duyệt trong vòng 15 phút. Vui lòng xem hóa đơn biên nhận.', 'success');
        navigate(`/invoice/${bookingId}`);
      }
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.message || err.response?.data?.error;
      await showAlert('Lỗi thanh toán', backendError ? `Lỗi: ${backendError}` : 'Có lỗi xảy ra khi xác nhận thanh toán, hệ thống sẽ ghi nhận sau.', 'error');
      navigate('/profile');
    }
  };

  return (
    <div className="checkout-page container">
      <div className="checkout-header">
        <h1>Thanh toán đặt phòng</h1>
        <p>Vui lòng hoàn tất thanh toán trong vòng 15 phút</p>
      </div>

      <div className="checkout-layout">
        <div className="checkout-summary">
          <div className="glass-panel summary-box">
            <h2>Tóm tắt đơn hàng</h2>
            
            <div className="summary-details">
              <div className="summary-item">
                <span className="label">Homestay:</span>
                <span className="value">{hotelName}</span>
              </div>
              <div className="summary-item">
                <span className="label">Phòng:</span>
                <span className="value">{roomName}</span>
              </div>
            </div>

            <div className="discount-section">
              <input 
                type="text" 
                placeholder="Nhập mã giảm giá..." 
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
              <button className="btn btn-outline">Áp dụng</button>
            </div>

            <div className="total-section">
              <div className="summary-item">
                <span>Tạm tính</span>
                <span>{amount.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="summary-item">
                <span>Giảm giá</span>
                <span>0 ₫</span>
              </div>
              <div className="summary-item grand-total">
                <span>Tổng thanh toán</span>
                <strong>{amount.toLocaleString('vi-VN')} ₫</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="checkout-payment">
          <div className="qr-box glass-panel">
            <h2>Chuyển khoản VietQR</h2>
            <p className="qr-instruction">Vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới</p>
            
            <div className="qr-image-wrapper">
              <img src={qrUrl} alt="VietQR" style={{ maxWidth: '280px', margin: '0 auto', borderRadius: '12px' }} />
            </div>

            <div className="bank-info">
              <div className="info-row">
                <div className="info-text">
                  <span className="info-label">Ngân hàng</span>
                  <strong>Vietcombank</strong>
                </div>
              </div>
              
              <div className="info-row">
                <div className="info-text">
                  <span className="info-label">Số tài khoản</span>
                  <strong>10123456789</strong>
                </div>
                <button className="copy-btn" onClick={() => handleCopy('10123456789', 'stk')}>
                  {copied === 'stk' ? <CheckCircle size={18} color="var(--status-confirmed)"/> : <Copy size={18} />}
                </button>
              </div>

              <div className="info-row">
                <div className="info-text">
                  <span className="info-label">Số tiền</span>
                  <strong className="amount">{amount.toLocaleString('vi-VN')} ₫</strong>
                </div>
                <button className="copy-btn" onClick={() => handleCopy(amount.toString(), 'amount')}>
                  {copied === 'amount' ? <CheckCircle size={18} color="var(--status-confirmed)"/> : <Copy size={18} />}
                </button>
              </div>

              <div className="info-row">
                <div className="info-text">
                  <span className="info-label">Nội dung chuyển khoản</span>
                  <strong>{transferMsg}</strong>
                </div>
                <button className="copy-btn" onClick={() => handleCopy(transferMsg, 'msg')}>
                  {copied === 'msg' ? <CheckCircle size={18} color="var(--status-confirmed)"/> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary w-full complete-btn" onClick={handleFinish}>
              Tôi đã chuyển khoản
            </button>
            <button className="btn btn-outline w-full" style={{ marginTop: '10px', fontWeight: 600, padding: '12px' }} onClick={() => navigate('/')}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
