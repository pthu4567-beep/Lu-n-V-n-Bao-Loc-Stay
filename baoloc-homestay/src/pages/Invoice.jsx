import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, ArrowLeft, CheckCircle2, Home as HomeIcon, MapPin, User, Phone, Mail, Calendar, Clock } from 'lucide-react';
import './Invoice.css';

const Invoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }
      const res = await axios.get(`http://localhost:5000/api/bookings/${id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setInvoice(res.data.invoice);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu hóa đơn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="invoice-loading">Đang tải hóa đơn...</div>;
  if (error) return <div className="invoice-error">{error}</div>;
  if (!invoice) return <div className="invoice-error">Không tìm thấy hóa đơn.</div>;

  return (
    <div className="invoice-page-container">
      <div className="invoice-actions no-print">
        <button className="btn btn-outline" onClick={() => navigate('/')}>
          <HomeIcon size={16} /> Về trang chủ
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/profile')}>
          <ArrowLeft size={16} /> Quay lại Hồ sơ
        </button>
        <button className="btn btn-primary print-btn" onClick={handlePrint}>
          <Printer size={16} /> In hóa đơn
        </button>
      </div>

      <div className="invoice-card">
        <div className="invoice-header">
          <div className="invoice-logo">
            <img src="/logo.png" alt="BaoLoc Stay Logo" className="logo-img" />
          </div>
          <div className="invoice-title">
            <h1>HÓA ĐƠN / BIÊN NHẬN</h1>
            <p>Mã đơn: <strong>#{invoice.booking_id}</strong></p>
            <p>Ngày tạo: {new Date(invoice.created_at).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        <div className="invoice-status">
          <CheckCircle2 size={24} color="#10b981" />
          <span>{invoice.booking_status === 'pending_payment' ? 'Chưa thanh toán' : 'Đã ghi nhận thanh toán/đặt cọc'}</span>
        </div>

        <div className="invoice-body">
          <div className="invoice-row">
            <div className="invoice-section">
              <h3>Thông tin Khách hàng</h3>
              <p><User size={14} /> <strong>{invoice.guest_name}</strong></p>
              <p><Phone size={14} /> {invoice.guest_phone || 'Chưa cập nhật'}</p>
              <p><Mail size={14} /> {invoice.guest_email}</p>
            </div>
            
            <div className="invoice-section">
              <h3>Thông tin Chủ Homestay (Liên hệ)</h3>
              <p><User size={14} /> <strong>{invoice.owner_name}</strong></p>
              <p><Phone size={14} /> {invoice.owner_phone || 'Chưa cập nhật'}</p>
              <p><Mail size={14} /> {invoice.owner_email}</p>
            </div>
          </div>

          <div className="invoice-section mt-4">
            <h3>Chi tiết Lưu trú</h3>
            <div className="stay-details">
              <div className="detail-item">
                <span className="detail-label"><HomeIcon size={14} /> Homestay</span>
                <span className="detail-value"><strong>{invoice.homestay_name}</strong></span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><MapPin size={14} /> Địa chỉ</span>
                <span className="detail-value">{invoice.homestay_address}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><HomeIcon size={14} /> Loại phòng</span>
                <span className="detail-value">
                  {invoice.room_type}
                </span>
              </div>
            </div>
          </div>

          <div className="invoice-row mt-4">
            <div className="invoice-section date-box">
              <h3><Calendar size={16} /> Nhận phòng (Check-in)</h3>
              <p className="date-time">
                {invoice.check_in_datetime ? new Date(invoice.check_in_datetime).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
              </p>
              <p className="time">
                <Clock size={14} /> 
                {(() => {
                  if (!invoice.check_in_datetime || !invoice.created_at) return '14:00';
                  const checkInDate = new Date(invoice.check_in_datetime);
                  const createdDate = new Date(invoice.created_at);
                  // Nếu đặt phòng để nhận ngay trong ngày hôm nay VÀ thời điểm đặt đã qua 14:00
                  if (checkInDate.toDateString() === createdDate.toDateString() && createdDate.getHours() >= 14) {
                    return createdDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  }
                  return '14:00';
                })()}
              </p>
            </div>
            
            <div className="invoice-section date-box">
              <h3><Calendar size={16} /> Trả phòng (Check-out)</h3>
              <p className="date-time">
                {invoice.check_out_datetime ? new Date(invoice.check_out_datetime).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
              </p>
              <p className="time"><Clock size={14} /> 12:00</p>
            </div>
          </div>

          <div className="invoice-summary mt-4">
            <div className="summary-row" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.1rem', color: '#64748b' }}>Tổng giá trị đơn hàng (Tạm tính)</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{invoice.total_amount?.toLocaleString('vi-VN')} ₫</span>
            </div>

            {/* Hiển thị chiết khấu / giảm giá nếu có */}
            {(invoice.discount_percent || invoice.discount_amount) ? (
              <div className="summary-row discount-row" style={{ borderBottom: '1px solid #e2e8f0', color: '#16a34a', paddingBottom: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Chiết khấu / Giảm giá ({invoice.discount_percent ? `${invoice.discount_percent}%` : 'Voucher'})</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>-{invoice.discount_amount ? invoice.discount_amount.toLocaleString('vi-VN') : '0'} ₫</span>
              </div>
            ) : null}
            
            <div className="summary-row deposit-row" style={{ backgroundColor: '#fffbeb', color: '#b45309', padding: '12px', borderRadius: '8px', border: '1px solid #fcd34d', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Số tiền bắt buộc thanh toán cọc ngay</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>{invoice.deposit_amount ? invoice.deposit_amount.toLocaleString('vi-VN') : invoice.total_amount?.toLocaleString('vi-VN')} ₫</span>
            </div>

            <div className="summary-row remaining-row" style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Số tiền mặt cần chuẩn bị khi nhận phòng</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{invoice.remaining_amount ? invoice.remaining_amount.toLocaleString('vi-VN') : '0'} ₫</span>
            </div>
          </div>

        </div>
        
        <div className="invoice-footer">
          <p>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi!</p>
          <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ trực tiếp với chủ Homestay theo số điện thoại trên.</p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
