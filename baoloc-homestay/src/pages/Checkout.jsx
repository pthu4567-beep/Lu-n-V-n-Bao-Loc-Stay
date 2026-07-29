import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Copy, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { showAlert } from '../utils/alert';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();
  const [searchParams] = useSearchParams();
  
  const initialAmount = parseInt(searchParams.get('amount')) || 0;
  const initialTotal = parseInt(searchParams.get('total')) || initialAmount;
  const hotelName = searchParams.get('hotel') || 'Homestay';
  const roomName = searchParams.get('room') || 'Phòng Tiêu Chuẩn';

  const [amount, setAmount] = useState(initialAmount);
  const [total, setTotal] = useState(initialTotal);
  const [copied, setCopied] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);

  const [savedVouchers, setSavedVouchers] = useState([]);
  const [showVoucherList, setShowVoucherList] = useState(false);

  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [createdAt, setCreatedAt] = useState(searchParams.get('createdAt') || new Date().toISOString());

  useEffect(() => {
    const fetchBookingStatus = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token || !bookingId) return;
        const res = await axios.get(`http://localhost:5000/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.data) {
          const b = res.data.data;
          if (b.created_at) {
            setCreatedAt(b.created_at);
          }
          if (b.booking_status === 'cancelled') {
            setIsExpired(true);
            setTimeLeft(0);
          }
          if (!initialAmount && b.deposit_amount) setAmount(b.deposit_amount);
          if (!initialTotal && b.total_amount) setTotal(b.total_amount);
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin đơn đặt phòng:', err);
      }
    };
    fetchBookingStatus();
  }, [bookingId, initialAmount, initialTotal]);

  useEffect(() => {
    if (!createdAt || isExpired) return;

    const calculateRemaining = () => {
      const createdDate = new Date(createdAt);
      const now = new Date();
      const elapsedSeconds = Math.floor((now - createdDate) / 1000);
      const remaining = 15 * 60 - elapsedSeconds;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        return 0;
      } else {
        setTimeLeft(remaining);
        return remaining;
      }
    };

    const initialRem = calculateRemaining();
    if (initialRem <= 0) return;

    const timer = setInterval(() => {
      const rem = calculateRemaining();
      if (rem <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt, isExpired]);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const res = await axios.get('http://localhost:5000/api/users/my-promotions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setSavedVouchers(res.data.data.filter(v => !v.is_used && new Date(v.valid_until) >= new Date()));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchVouchers();
  }, []);

  const formatTime = (seconds) => {
    if (seconds === null || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleApplyDiscount = async () => {
    if (isExpired) return showAlert('Lỗi', 'Đơn đặt phòng đã hết thời gian giữ phòng (15 phút)', 'warning');
    if (!discount.trim()) return showAlert('Lỗi', 'Vui lòng nhập mã giảm giá', 'warning');
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/bookings/${bookingId}/apply-promotion`, 
        { discount_code: discount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setDiscountPercent(res.data.discount_percent);
        setDiscountAmount(res.data.discount_amount);
        setAmount(res.data.new_deposit);
        showAlert('Thành công', res.data.message, 'success');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Mã giảm giá không hợp lệ';
      showAlert('Lỗi', msg, 'error');
    }
  };

  const transferMsg = `THANH TOAN DH ${bookingId}`;
  const qrUrl = `https://img.vietqr.io/image/mb-5306082003-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferMsg)}&accountName=PHAM%20NGOC%20ANH%20THU`;

  const handleFinish = async () => {
    if (isExpired) {
      return showAlert('Hết thời gian giữ phòng', 'Đơn đặt phòng đã hết thời gian giữ phòng (15 phút) và phòng đã được mở lại trống cho khách khác. Vui lòng đặt đơn mới!', 'warning');
    }
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
        await showAlert('Thành công', 'Đã gửi yêu cầu xác nhận thanh toán. Đơn hàng sẽ được duyệt tự động. Vui lòng xem hóa đơn biên nhận.', 'success');
        navigate(`/invoice/${bookingId}`);
      }
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.message || err.response?.data?.error;
      await showAlert('Lỗi thanh toán', backendError ? `Lỗi: ${backendError}` : 'Có lỗi xảy ra khi xác nhận thanh toán.', 'error');
      if (backendError && backendError.includes('hết thời gian')) {
        setIsExpired(true);
        setTimeLeft(0);
      }
    }
  };

  return (
    <>
      <Header />
      <div className="checkout-page container">
        <div className="checkout-header">
          <h1>Thanh toán đặt phòng</h1>
          <p>Vui lòng hoàn tất thanh toán trong vòng 15 phút</p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            padding: '8px 24px',
            borderRadius: '50px',
            backgroundColor: isExpired ? '#fee2e2' : '#fef3c7',
            color: isExpired ? '#dc2626' : '#d97706',
            fontWeight: '700',
            fontSize: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: `1px solid ${isExpired ? '#fecaca' : '#fde68a'}`
          }}>
            <span style={{ fontSize: '18px' }}>⏱️</span>
            {isExpired ? (
              <span>Đã hết thời gian thanh toán (00:00) - Phòng đã được mở lại còn trống</span>
            ) : (
              <span>Thời gian giữ phòng còn lại: <strong>{formatTime(timeLeft)}</strong></span>
            )}
          </div>
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

              <div className="discount-section" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Nhập mã giảm giá..." 
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  disabled={isExpired}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-outline" style={{ padding: '0 15px' }} onClick={() => setShowVoucherList(!showVoucherList)} disabled={isExpired}>Ví Voucher</button>
                <button className="btn btn-primary" onClick={handleApplyDiscount} disabled={isExpired}>Áp dụng</button>
              </div>

              {showVoucherList && !isExpired && (
                <div className="voucher-dropdown" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginTop: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#0f172a' }}>Voucher của bạn</h4>
                  {savedVouchers.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Bạn chưa có voucher nào hoặc voucher đã hết hạn/đã sử dụng.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {savedVouchers.map(v => (
                        <div key={v.saved_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '15px' }}>{v.discount_code}</strong> 
                            <span style={{ color: '#ef4444', fontWeight: '600', marginLeft: '5px' }}>- Giảm {v.discount_percent}%</span>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                              {v.hotel_id ? `Dành cho ${v.hotel_name}` : 'Áp dụng Toàn hệ thống'}
                            </div>
                          </div>
                          <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => {
                            setDiscount(v.discount_code);
                            setShowVoucherList(false);
                          }}>Chọn</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="total-section" style={{ marginTop: '20px' }}>
                <div className="summary-item">
                  <span>Tổng tiền phòng</span>
                  <span>{total.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="summary-item" style={{ color: discountAmount > 0 ? '#16a34a' : 'inherit' }}>
                  <span>Giảm giá {discountPercent > 0 ? `(${discountPercent}%)` : ''}</span>
                  <span>{discountAmount > 0 ? '-' : ''}{discountAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="summary-item grand-total">
                  <span>Số tiền cần cọc</span>
                  <strong>{amount.toLocaleString('vi-VN')} ₫</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="checkout-payment">
            <div className="qr-box glass-panel">
              <h2>Chuyển khoản VietQR</h2>
              <p className="qr-instruction">Vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới</p>
              
              {isExpired && (
                <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '12px', textAlign: 'center', marginBottom: '16px', border: '1px solid #fecaca' }}>
                  <strong style={{ display: 'block', fontSize: '15px', marginBottom: '4px' }}>⚠️ Đơn đặt phòng đã hết hạn 15 phút</strong>
                  <span style={{ fontSize: '13px' }}>Phòng hiện đã được mở lại trống và không còn giữ cho đơn này. Vui lòng không thực hiện chuyển khoản và về trang chủ đặt đơn mới!</span>
                </div>
              )}

              <div className="qr-image-wrapper">
                <img src={qrUrl} alt="VietQR" style={{ maxWidth: '280px', margin: '0 auto', borderRadius: '12px', opacity: isExpired ? 0.3 : 1 }} />
              </div>

              <div className="bank-info">
                <div className="info-row">
                  <div className="info-text">
                    <span className="info-label">Ngân hàng</span>
                    <strong>MB Bank (Ngân hàng TMCP Quân Đội)</strong>
                  </div>
                </div>
                
                <div className="info-row">
                  <div className="info-text">
                    <span className="info-label">Số tài khoản</span>
                    <strong>5306082003</strong>
                  </div>
                  <button className="copy-btn" onClick={() => handleCopy('5306082003', 'stk')}>
                    {copied === 'stk' ? <CheckCircle size={18} color="var(--status-confirmed)"/> : <Copy size={18} />}
                  </button>
                </div>

                <div className="info-row">
                  <div className="info-text">
                    <span className="info-label">Chủ tài khoản</span>
                    <strong>PHẠM NGỌC ANH THƯ</strong>
                  </div>
                  <button className="copy-btn" onClick={() => handleCopy('PHAM NGOC ANH THU', 'holder')}>
                    {copied === 'holder' ? <CheckCircle size={18} color="var(--status-confirmed)"/> : <Copy size={18} />}
                  </button>
                </div>

                <div className="info-row">
                  <div className="info-text">
                    <span className="info-label">Số tiền (cố định)</span>
                    <strong className="amount">{amount.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <button className="copy-btn" onClick={() => handleCopy(amount.toString(), 'amount')}>
                    {copied === 'amount' ? <CheckCircle size={18} color="var(--status-confirmed)"/> : <Copy size={18} />}
                  </button>
                </div>

                <div className="info-row">
                  <div className="info-text">
                    <span className="info-label">Nội dung chuyển khoản (cố định)</span>
                    <strong>{transferMsg}</strong>
                  </div>
                  <button className="copy-btn" onClick={() => handleCopy(transferMsg, 'msg')}>
                    {copied === 'msg' ? <CheckCircle size={18} color="var(--status-confirmed)"/> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <button 
                className={`btn ${isExpired ? 'btn-disabled' : 'btn-primary'} w-full complete-btn`} 
                onClick={handleFinish}
                disabled={isExpired}
                style={isExpired ? { backgroundColor: '#94a3b8', cursor: 'not-allowed', border: 'none', color: '#fff', opacity: 0.8 } : {}}
              >
                {isExpired ? 'Đã hết thời gian giữ phòng (15 phút)' : 'Tôi đã chuyển khoản'}
              </button>
              <button className="btn btn-outline w-full" style={{ marginTop: '10px', fontWeight: 600, padding: '12px' }} onClick={() => navigate('/')}>
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Checkout;
